from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import google.generativeai as genai
import json
import logging
from dataclasses import dataclass
from typing import List, Dict, Optional
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
from dotenv import load_dotenv

# RDKit for molecular visualization
try:
    from rdkit import Chem
    from rdkit.Chem import Draw, Descriptors, Crippen
    from io import BytesIO
    import base64
    RDKIT_AVAILABLE = True
    print("✓ RDKit loaded successfully")
except ImportError:
    RDKIT_AVAILABLE = False
    print("⚠ RDKit not available. Molecular visualization disabled.")

# PubChem integration
try:
    import pubchempy as pcp
    PUBCHEM_AVAILABLE = True
    print("✓ PubChem loaded successfully")
except Exception as e:
    PUBCHEM_AVAILABLE = False
    print(f"⚠ PubChem not available: {e}")

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# === CONFIGURE GEMINI (FIXED!) ===
load_dotenv()

# Get API key
api_key = os.getenv("GEMINI_API_KEY")  # Use os.getenv() not os.environ.get()
if not api_key:
    raise RuntimeError("GEMINI_API_KEY not found in .env file. Please set it before running.")

# Configure Gemini
genai.configure(api_key=api_key)  # ✅ FIXED: was 'gemini_key'

# Initialize model GLOBALLY
model = genai.GenerativeModel('gemini-1.5-flash')

print("✓ Gemini AI configured successfully")


# === DATA CLASSES ===
@dataclass
class CompoundRecommendation:
    """Structured compound data"""
    name: str
    formula: str
    smiles: str
    properties: Dict[str, str]
    base_compound: str
    modifications: str
    molecular_weight: float = None
    logp: float = None
    structure_image: str = None
    validation_score: float = None
    feasibility_notes: str = None

@dataclass
class ProcessedInput:
    """Structured processed input data"""
    original_input: str
    normalized_input: str
    concepts: Dict
    search_terms: List[str]
    context: str
    confidence_score: float


# === CHEMICAL DATABASE CLASS ===
class ChemicalDatabase:
    """Handle chemical database operations dengan caching dan parallel processing"""
    
    def __init__(self):
        self.search_cache = {}
        self.property_cache = {}
    
    def search_pubchem_parallel(self, queries: List[str], max_results: int = 3) -> List[Dict]:
        """Search PubChem for multiple queries in parallel"""
        if not PUBCHEM_AVAILABLE or not queries:
            return []
        
        results = []
        
        with ThreadPoolExecutor(max_workers=min(len(queries), 5)) as executor:
            future_to_query = {
                executor.submit(self._single_pubchem_search, query, max_results): query 
                for query in queries
            }
            
            for future in as_completed(future_to_query):
                query = future_to_query[future]
                try:
                    query_results = future.result()
                    if query_results:
                        results.extend(query_results)
                        logger.info(f"✅ Found {len(query_results)} results for: {query}")
                except Exception as e:
                    logger.error(f"Search failed for {query}: {e}")
        
        # Remove duplicates based on CID
        seen_cids = set()
        unique_results = []
        for comp in results:
            cid = str(comp.get('cid', ''))
            if cid not in seen_cids:
                seen_cids.add(cid)
                unique_results.append(comp)
        
        return unique_results[:max_results * 2]
    
    def _single_pubchem_search(self, query: str, max_results: int) -> List[Dict]:
        """Single PubChem search operation"""
        try:
            # Check cache first
            cache_key = f"{query}_{max_results}"
            if cache_key in self.search_cache:
                return self.search_cache[cache_key]
            
            compounds = pcp.get_compounds(query, 'name', listkey_count=max_results)
            results = []
            
            for compound in compounds[:max_results]:
                try:
                    result = {
                        'cid': compound.cid,
                        'name': compound.iupac_name or (compound.synonyms[0] if compound.synonyms else "Unknown"),
                        'formula': compound.molecular_formula,
                        'smiles': compound.canonical_smiles,
                        'molecular_weight': compound.molecular_weight,
                        'search_query': query
                    }
                    results.append(result)
                except Exception as e:
                    logger.warning(f"Error processing compound {compound.cid}: {e}")
                    continue
            
            # Cache successful results
            if results:
                self.search_cache[cache_key] = results
            
            return results
            
        except Exception as e:
            logger.error(f"PubChem search error for '{query}': {e}")
            return []
    
    def get_compound_properties(self, smiles: str) -> Dict:
        """Calculate molecular properties using RDKit dengan caching"""
        if not RDKIT_AVAILABLE or not smiles:
            return {}
        
        # Check cache
        if smiles in self.property_cache:
            return self.property_cache[smiles]
        
        try:
            mol = Chem.MolFromSmiles(smiles)
            if mol:
                properties = {
                    'molecular_weight': round(Descriptors.MolWt(mol), 2),
                    'logp': round(Crippen.MolLogP(mol), 2),
                    'h_bond_donors': Descriptors.NumHDonors(mol),
                    'h_bond_acceptors': Descriptors.NumHAcceptors(mol),
                    'tpsa': round(Descriptors.TPSA(mol), 2),
                    'rotatable_bonds': Descriptors.NumRotatableBonds(mol),
                    'heavy_atoms': mol.GetNumHeavyAtoms(),
                    'aromatic': any(mol.GetAromaticAtoms())
                }
                # Cache the results
                self.property_cache[smiles] = properties
                return properties
        except Exception as e:
            logger.error(f"Property calculation error for {smiles}: {e}")
        
        return {}
    
    def generate_molecule_image(self, smiles: str) -> str:
        """Generate base64 encoded molecule image"""
        if not RDKIT_AVAILABLE or not smiles:
            return None
        
        try:
            mol = Chem.MolFromSmiles(smiles)
            if mol:
                img = Draw.MolToImage(mol, size=(300, 300))
                buffered = BytesIO()
                img.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()
                return f"data:image/png;base64,{img_str}"
        except Exception as e:
            logger.error(f"Image generation error for {smiles}: {e}")
        
        return None


# === ENHANCED CHEMICAL DISCOVERY AGENT ===
class EnhancedChemicalDiscoveryAgent:
    def __init__(self):
        self.db = ChemicalDatabase()
        self.max_retries = 3
        self.model = model  # Use global model
        
        # Enhanced agent definitions
        self.agents = {
            "preprocessor": """Kamu adalah preprocessing specialist untuk input kimia. 
Tugasmu menganalisis input user dan mengekstrak konsep kimia utama dan SENYAWA SPESIFIK yang relevan.""",

            "analyzer": """Kamu adalah ahli kimia analitik dengan keahlian:
- Menganalisis kriteria fisikokimia senyawa
- Memahami aplikasi industri petrokimia
- Mengidentifikasi constraints teknis
- Merekomendasikan kelas material yang sesuai""",
            
            "researcher": """Kamu adalah ahli riset kimia yang:
- Mencari senyawa existing yang relevan dari database
- Mengidentifikasi pattern molekul dan QSAR
- Memahami hubungan struktur-aktivitas
- Mengetahui state-of-the-art material""",
            
            "generator": """Kamu adalah ahli sintesis kimia kreatif yang:
- Merancang senyawa baru melalui reformulasi dan modifikasi
- Memodifikasi gugus fungsi strategis untuk target properties
- Mengkombinasikan molekul secara inovatif
- SELALU menghasilkan struktur SMILES yang VALID dan chemically reasonable""",
            
            "validator": """Kamu adalah validator kimia yang mengevaluasi:
- Kelayakan sintesis di laboratorium/industri
- Stabilitas kimia dan termal
- Keamanan handling dan environmental impact
- Novelty dan keunikan struktur
- Cost-effectiveness dan scalability""",
            
            "justifier": """Kamu adalah komunikator ilmiah yang:
- Menjelaskan rekomendasi secara jelas dan terstruktur
- Menyoroti keunggulan kompetitif dan value proposition
- Menghubungkan dengan aplikasi industri nyata
- Memberikan roadmap implementasi praktis"""
        }
        
        # Translation map untuk istilah bahasa Indonesia
        self.translation_map = {
            'indonesia': {
                'polimer': 'polymer', 'surfaktan': 'surfactant',
                'pelarut': 'solvent', 'katalis': 'catalyst',
                'aditif': 'additive', 'plastik': 'plastic',
                'titik_didih': 'boiling_point', 'viskositas': 'viscosity',
                'kelarutan': 'solubility', 'stabilitas_termal': 'thermal_stability'
            }
        }

    def advanced_preprocessing(self, user_input: str) -> ProcessedInput:
        """Enhanced preprocessing dengan LLM-powered concept extraction"""
        
        # Step 1: Normalize input
        normalized_input = self._normalize_input(user_input)
        
        # Step 2: LLM-powered concept extraction
        concepts = self._extract_concepts_with_llm(normalized_input)
        
        # Step 3: Generate search terms
        search_terms = self._generate_search_terms_from_llm(concepts)
        
        # Step 4: Calculate confidence score
        confidence_score = self._calculate_confidence(concepts, len(search_terms))
        
        return ProcessedInput(
            original_input=user_input,
            normalized_input=normalized_input,
            concepts=concepts,
            search_terms=search_terms,
            context=concepts.get('industry_context', ''),
            confidence_score=confidence_score
        )

    def _normalize_input(self, text: str) -> str:
        """Normalize input text"""
        normalized = text.lower().strip()
        normalized = re.sub(r'\s+', ' ', normalized)
        return normalized

    def _extract_concepts_with_llm(self, text: str) -> Dict:
        """Use LLM untuk extract chemical concepts"""
        
        prompt = f"""
ROLE: Anda adalah AI Chemical Specialist yang ahli dalam mengidentifikasi senyawa kimia spesifik dari deskripsi kebutuhan.

TUGAS: Analisis kriteria user dan ekstrak SENYAWA KIMIA SPESIFIK yang relevan.

USER REQUEST: "{text}"

INSTRUKSI KRITIS:
1. Untuk field 'specific_compounds', berikan **HANYA** nama senyawa kimia spesifik yang bisa langsung dicari di database PubChem
2. **JANGAN** masukkan properti, deskripsi, atau konsep abstrak
3. **PRIORITASKAN** senyawa yang umum, terstandarisasi, dan memiliki CAS number
4. **MAXIMUM** 6 senyawa paling relevan
5. Gunakan **nama IUPAC** atau **nama umum yang diterima** di industri

FORMAT OUTPUT (JSON):
{{
    "primary_application": "jelaskan aplikasi utama",
    "target_properties": ["property1", "property2"],
    "material_types": ["material_type1", "material_type2"],
    "constraints": ["constraint1", "constraint2"],
    "industry_context": "jelaskan konteks industri",
    "specific_compounds": ["senyawa_spesifik_1", "senyawa_spesifik_2", "senyawa_spesifik_3"]
}}

Pastikan 'specific_compounds' berisi **nama senyawa kimia yang valid**!
"""
        
        try:
            response = self.model.generate_content(prompt)  # ✅ FIXED: use self.model
            json_str = self._extract_json(response.text)
            concepts = json.loads(json_str)
            
            # Validate compounds
            validated_compounds = self._validate_compounds_list(concepts.get('specific_compounds', []))
            concepts['specific_compounds'] = validated_compounds
            
            concepts['extraction_success'] = True
            logger.info(f"✓ Extracted {len(validated_compounds)} valid compounds")
            return concepts
            
        except Exception as e:
            logger.error(f"LLM concept extraction failed: {e}")
            # Fallback
            return {
                "primary_application": "chemical_application",
                "target_properties": [],
                "material_types": [], 
                "constraints": [],
                "industry_context": "general_chemical_industry",
                "specific_compounds": self._get_fallback_compounds(text),
                "extraction_success": False
            }

    def _validate_compounds_list(self, compounds: List[str]) -> List[str]:
        """Validasi dan bersihkan daftar senyawa dari LLM"""
        valid_compounds = []
        
        for compound in compounds:
            # Hapus deskripsi yang terlalu panjang
            if len(compound) > 50:
                continue
                
            # Hapus yang mengandung kata deskriptif
            descriptive_words = ['tinggi', 'rendah', 'baik', 'untuk', 'dengan', 
                                 'karakteristik', 'properti', 'sifat']
            if any(word in compound.lower() for word in descriptive_words):
                continue
                
            # Normalisasi nama senyawa
            normalized = self._normalize_compound_name(compound)
            if normalized and len(normalized) > 2:
                valid_compounds.append(normalized)
        
        return valid_compounds[:6]  # Maximum 6 compounds
    
    def _normalize_compound_name(self, name: str) -> str:
        """Normalize compound name"""
        normalized = name.strip().lower()
        
        # Translate Indonesian terms
        for indo_term, eng_term in self.translation_map['indonesia'].items():
            if indo_term in normalized:
                normalized = normalized.replace(indo_term, eng_term)
        
        return normalized.title()
    
    def _get_fallback_compounds(self, text: str) -> List[str]:
        """Get fallback compounds using simple keyword matching"""
        fallback_compounds = []
        
        # Simple keyword mapping
        keyword_to_compound = {
            'surfactant': ['sodium dodecyl sulfate', 'tween 80'],
            'solvent': ['ethanol', 'water', 'acetone'],
            'polymer': ['polyethylene', 'polypropylene'],
            'catalyst': ['platinum', 'palladium']
        }
        
        text_lower = text.lower()
        for keyword, compounds in keyword_to_compound.items():
            if keyword in text_lower:
                fallback_compounds.extend(compounds)
        
        if not fallback_compounds:
            fallback_compounds = ['ethanol', 'water', 'acetone']
        
        logger.info(f"🔍 Using fallback compounds: {fallback_compounds}")
        return fallback_compounds[:6]
    
    def _generate_search_terms_from_llm(self, concepts: Dict) -> List[str]:
        """Generate search terms from extracted compounds"""
        specific_compounds = concepts.get('specific_compounds', [])
        
        if specific_compounds:
            logger.info(f"🔍 Using LLM-extracted compounds: {specific_compounds}")
            return specific_compounds
        
        return []
    
    def _calculate_confidence(self, concepts: Dict, num_search_terms: int) -> float:
        """Calculate confidence score"""
        score = 0.0
        
        # Check extraction success
        if concepts.get('extraction_success', False):
            score += 0.5
        
        # Check search terms
        if num_search_terms > 0:
            score += min(0.3, num_search_terms * 0.1)
        
        # Check concept completeness
        if concepts.get('primary_application'):
            score += 0.1
        if concepts.get('target_properties'):
            score += 0.1
        
        return min(1.0, score)
    
    def analyze_criteria(self, processed_input: ProcessedInput) -> str:
        """Analyze criteria using analyzer agent"""
        
        prompt = f"""
{self.agents['analyzer']}

USER CRITERIA: {processed_input.normalized_input}

EXTRACTED CONCEPTS:
- Application: {processed_input.concepts.get('primary_application', 'general')}
- Properties: {', '.join(processed_input.concepts.get('target_properties', []))}
- Materials: {', '.join(processed_input.concepts.get('material_types', []))}
- Constraints: {', '.join(processed_input.concepts.get('constraints', []))}

Provide a clear, structured analysis of what compounds would meet these criteria.
Include specific technical requirements and chemical characteristics needed.

Keep response under 200 words.
"""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            return "Based on the provided criteria, we will identify suitable chemical compounds with the desired properties."
    
    def research_existing_compounds(self, analysis: str, search_terms: List[str]) -> str:
        """Research existing compounds using database"""
        
        if not search_terms:
            return "No specific compounds identified for database search."
        
        # Search PubChem
        research_results = self.db.search_pubchem_parallel(search_terms, max_results=2)
        
        if not research_results:
            return "Database search did not return specific compounds. Proceeding with novel compound generation."
        
        # Format research insights
        insights = "**Database Search Results:**\n\n"
        for i, result in enumerate(research_results[:5], 1):
            insights += f"{i}. **{result['name']}** (CID: {result['cid']})\n"
            insights += f"   - Formula: {result['formula']}\n"
            insights += f"   - MW: {result.get('molecular_weight', 'N/A')} g/mol\n\n"
        
        insights += "These compounds serve as basis for novel molecule design."
        
        return insights
    
    def generate_compounds(self, analysis: str, research: str, processed_input: ProcessedInput) -> List[CompoundRecommendation]:
        """Generate novel compounds"""
        
        prompt = f"""
{self.agents['generator']}

CRITERIA: {processed_input.normalized_input}

ANALYSIS: {analysis}

RESEARCH INSIGHTS: {research}

TASK: Generate EXACTLY 3 novel chemical compounds that meet the criteria.

REQUIREMENTS:
1. Each compound must be chemically valid
2. Provide VALID SMILES notation
3. Base on existing compounds but with strategic modifications
4. Ensure diversity in structures

OUTPUT FORMAT (JSON):
{{
  "compounds": [
    {{
      "name": "Compound Name",
      "formula": "C10H20O2",
      "smiles": "CCCCCCCCCC(=O)O",
      "properties": {{"key": "value"}},
      "base_compound": "Base compound name",
      "modifications": "Describe modifications made"
    }},
    ...
  ]
}}

Generate EXACTLY 3 compounds in valid JSON format.
"""
        
        for attempt in range(self.max_retries):
            try:
                response = self.model.generate_content(prompt)
                json_str = self._extract_json(response.text)
                data = json.loads(json_str)
                
                compounds = []
                for item in data.get('compounds', []):
                    if len(compounds) >= 3:
                        break
                    
                    # Calculate properties
                    calc_props = self.db.get_compound_properties(item.get('smiles', ''))
                    
                    # Generate image
                    structure_image = self.db.generate_molecule_image(item.get('smiles', ''))
                    
                    compound_obj = CompoundRecommendation(
                        name=item.get('name', 'Unknown'),
                        formula=item.get('formula', 'N/A'),
                        smiles=item.get('smiles', ''),
                        properties=item.get('properties', {}),
                        base_compound=item.get('base_compound', ''),
                        modifications=item.get('modifications', ''),
                        molecular_weight=calc_props.get('molecular_weight'),
                        logp=calc_props.get('logp'),
                        structure_image=structure_image
                    )
                    compounds.append(compound_obj)
                
                if len(compounds) >= 3:
                    logger.info(f"✓ Generated {len(compounds)} compounds")
                    return compounds
                
            except Exception as e:
                logger.error(f"Generation attempt {attempt + 1} failed: {e}")
                if attempt == self.max_retries - 1:
                    raise
        
        return []
    
    def validate_compounds(self, compounds: List[CompoundRecommendation]) -> Dict:
        """Validate generated compounds"""
        
        compounds_data = []
        for c in compounds:
            compounds_data.append({
                "name": c.name,
                "formula": c.formula,
                "smiles": c.smiles
            })
        
        prompt = f"""
{self.agents['validator']}

Evaluate these compounds:

{json.dumps(compounds_data, indent=2)}

Provide validation including:
1. SMILES validity score (0-1)
2. Synthesis feasibility (0-1)
3. Safety considerations
4. Overall confidence score (0-1)

OUTPUT FORMAT (JSON):
{{
  "overall_confidence": 0.85,
  "individual_scores": [
    {{"compound": "Name", "validity": 0.9, "feasibility": 0.8, "safety": "notes"}},
    ...
  ],
  "recommendations": "Overall recommendations"
}}
"""
        
        try:
            response = self.model.generate_content(prompt)
            json_str = self._extract_json(response.text)
            validation = json.loads(json_str)
            
            # Update compound validation scores
            for i, score_data in enumerate(validation.get('individual_scores', [])):
                if i < len(compounds):
                    compounds[i].validation_score = score_data.get('validity', 0.5)
                    compounds[i].feasibility_notes = score_data.get('safety', '')
            
            return validation
        except Exception as e:
            logger.error(f"Validation error: {e}")
            return {
                "overall_confidence": 0.5,
                "individual_scores": [],
                "recommendations": "Validation could not be completed."
            }
    
    def create_justification(self, compounds: List[CompoundRecommendation], validation: Dict, processed_input: ProcessedInput) -> str:
        """Create justification for recommendations"""
        
        compounds_summary = []
        for c in compounds:
            compounds_summary.append({
                "name": c.name,
                "formula": c.formula,
                "properties": c.properties,
                "validation_score": c.validation_score
            })
        
        prompt = f"""
{self.agents['justifier']}

ORIGINAL REQUEST: {processed_input.original_input}

RECOMMENDED COMPOUNDS:
{json.dumps(compounds_summary, indent=2)}

VALIDATION RESULTS:
{json.dumps(validation, indent=2)}

Provide a professional justification explaining:
1. Why these compounds were selected
2. How they meet the requirements
3. Competitive advantages
4. Implementation considerations

Keep under 300 words. Be clear and structured.
"""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Justification error: {e}")
            return "The recommended compounds meet the specified requirements based on their molecular properties and known characteristics in literature."
    
    def _extract_json(self, text: str) -> str:
        """Extract JSON dari response LLM"""
        # Try parse directly
        try:
            json.loads(text)
            return text
        except Exception:
            pass

        # Try extract from code fence
        fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.IGNORECASE)
        if fence_match:
            candidate = fence_match.group(1).strip()
            try:
                json.loads(candidate)
                return candidate
            except Exception:
                pass

        # Try find JSON object/array
        strategies = [
            r'\{[\s\S]*?\}',  # JSON object
            r'\[[\s\S]*?\]',  # JSON array
        ]
        for pattern in strategies:
            json_match = re.search(pattern, text)
            if not json_match:
                continue
            candidate = json_match.group(0)
            try:
                json.loads(candidate)
                return candidate
            except Exception:
                continue

        # Fallback: clean code fence
        cleaned = text.strip()
        if cleaned.startswith('```json'):
            cleaned = cleaned[7:]
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]

        return cleaned.strip()


# Initialize agent
enhanced_agent = EnhancedChemicalDiscoveryAgent()


# === FLASK ROUTES ===
@app.route('/')
def home():
    return jsonify({
        'status': 'healthy',
        'service': 'Chemical Discovery ML Service',
        'version': '2.0'
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'rdkit_available': RDKIT_AVAILABLE,
        'pubchem_available': PUBCHEM_AVAILABLE,
        'gemini_configured': True,
        'agent_version': 'enhanced_llm_v2.0'
    })

@app.route('/api/discover', methods=['POST'])
def discover_chemicals():
    """Main endpoint for chemical discovery"""
    try:
        data = request.get_json()
        if not data or 'criteria' not in data:
            return jsonify({
                'error': 'Missing required field: criteria',
                'status': 'failed'
            }), 400

        raw_criteria = data.get('criteria')
        if raw_criteria is None:
            return jsonify({
                'error': 'Criteria cannot be null',
                'status': 'failed'
            }), 400

        user_input = str(raw_criteria).strip()
        if not user_input:
            return jsonify({
                'error': 'Criteria cannot be empty',
                'status': 'failed'
            }), 400
        
        logger.info(f"Processing discovery request: {user_input}")
        
        # Enhanced preprocessing
        processed_input = enhanced_agent.advanced_preprocessing(user_input)
        
        # Agentic Workflow
        analysis = enhanced_agent.analyze_criteria(processed_input)
        research = enhanced_agent.research_existing_compounds(analysis, processed_input.search_terms)
        compounds = enhanced_agent.generate_compounds(analysis, research, processed_input)
        
        if not compounds:
            return jsonify({
                'error': 'Failed to generate compounds. Please try different criteria.',
                'status': 'failed'
            }), 500
        
        validation = enhanced_agent.validate_compounds(compounds)
        justification = enhanced_agent.create_justification(compounds, validation, processed_input)
        
        # Format response
        result = {
            'status': 'success',
            'user_criteria': user_input,
            'preprocessing_analysis': {
                'normalized_input': processed_input.normalized_input,
                'concepts': processed_input.concepts,
                'search_terms_used': processed_input.search_terms,
                'confidence_score': processed_input.confidence_score
            },
            'analysis': analysis,
            'research_insights': research,
            'compounds': [
                {
                    'name': c.name,
                    'formula': c.formula,
                    'smiles': c.smiles,
                    'properties': c.properties,
                    'base_compound': c.base_compound,
                    'modifications': c.modifications,
                    'calculated_properties': {
                        'molecular_weight': c.molecular_weight,
                        'logp': c.logp
                    } if c.molecular_weight else None,
                    'structure_image': c.structure_image,
                    'validation_score': c.validation_score,
                    'feasibility_notes': c.feasibility_notes
                }
                for c in compounds
            ],
            'validation': validation,
            'justification': justification,
            'metadata': {
                'compounds_count': len(compounds),
                'rdkit_used': RDKIT_AVAILABLE,
                'pubchem_used': PUBCHEM_AVAILABLE,
                'preprocessing_confidence': processed_input.confidence_score,
                'overall_confidence': validation.get('overall_confidence', 0.5),
                'agent_version': 'enhanced_llm_v2.0'
            }
        }
        
        logger.info(f"✓ Successfully generated {len(compounds)} compounds")
        return jsonify(result)
        
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return jsonify({
            'error': 'Internal server error. Please try again.',
            'status': 'failed',
            'details': str(e)
        }), 500


# === RUN SERVER ===
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🧪 CHEMICAL DISCOVERY ML SERVICE")
    print("="*60)
    print(f"✓ Flask initialized")
    print(f"✓ RDKit: {'Available' if RDKIT_AVAILABLE else 'Not Available'}")
    print(f"✓ PubChem: {'Available' if PUBCHEM_AVAILABLE else 'Not Available'}")
    print(f"✓ Gemini AI: Configured")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
import os
import json
import logging
import re
import time
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import List, Dict, Optional
from io import BytesIO

from flask import Flask, request, jsonify, render_template, Response, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# === 1. SETUP LIBRARY KIMIA ===
try:
    from rdkit import Chem
    from rdkit.Chem import Draw, Descriptors, Crippen
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

# === 2. KONFIGURASI APP & AI ===
load_dotenv()

app = Flask(__name__)
CORS(app)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    # Fallback warning if env not set (Safety First)
    logger.warning("GEMINI_API_KEY not set in environment variables!")

genai.configure(api_key=api_key)
# Global Model Instance (Speed Optimization)
model = genai.GenerativeModel('gemini-2.5-flash')
print("✓ Gemini AI configured successfully")


# === 3. DATA CLASSES ===
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


# === 4. CHEMICAL DATABASE CLASS (Optimized for Speed) ===
class ChemicalDatabase:
    """Handle chemical database operations dengan caching dan parallel processing"""
    
    def __init__(self):
        self.search_cache = {}
        self.property_cache = {}
    
    def search_pubchem_parallel(self, queries: List[str], max_results: int = 2) -> List[Dict]:
        """Search PubChem for multiple queries in parallel"""
        if not PUBCHEM_AVAILABLE or not queries:
            return []
        
        results = []
        # Parallel execution (Speed Logic from Code B)
        with ThreadPoolExecutor(max_workers=min(len(queries), 5)) as executor:
            future_to_query = {
                executor.submit(self._single_pubchem_search, query, max_results): query 
                for query in queries
            }
            
            for future in as_completed(future_to_query):
                try:
                    query_results = future.result()
                    if query_results:
                        results.extend(query_results)
                except Exception as e:
                    logger.error(f"Search failed: {e}")
        
        # Deduplication
        seen_cids = set()
        unique_results = []
        for comp in results:
            cid = str(comp.get('cid', ''))
            if cid and cid not in seen_cids:
                seen_cids.add(cid)
                unique_results.append(comp)
        
        return unique_results[:4] 
    
    def _single_pubchem_search(self, query: str, max_results: int) -> List[Dict]:
        try:
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
                        'search_query': query # Added from Code A logic
                    }
                    results.append(result)
                except Exception:
                    continue
            
            if results:
                self.search_cache[cache_key] = results
            return results
        except Exception:
            return []
    
    def get_compound_properties(self, smiles: str) -> Dict:
        """Calculate molecular properties using RDKit"""
        if not RDKIT_AVAILABLE or not smiles:
            return {}
        
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
                    'heavy_atoms': mol.GetNumHeavyAtoms(), # Logic from Code A for validation
                    'rotatable_bonds': Descriptors.NumRotatableBonds(mol)
                }
                self.property_cache[smiles] = properties
                return properties
        except Exception as e:
            logger.error(f"Property calc error: {e}")
        return {}
    
    def generate_molecule_image(self, smiles: str) -> str:
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
        except Exception:
            return None


# === 5. ENHANCED AGENT (Hybrid Logic) ===
class EnhancedChemicalDiscoveryAgent:
    def __init__(self):
        self.db = ChemicalDatabase()
        self.model = model
        
        self.agents = {
            "preprocessor": "Kamu adalah preprocessing specialist. Ekstrak konsep kimia dan SENYAWA SPESIFIK (nama Inggris valid).",
            "analyzer": "Kamu ahli kimia analitik. Analisis kriteria fisikokimia, constraint, dan aplikasi industri.",
            "researcher": "Kamu adalah ahli riset kimia. Analisis data database dan identifikasi gap.",
            "generator": "Kamu ahli sintesis kreatif. Buat senyawa baru (valid SMILES) berdasarkan riset.",
            "validator": "Kamu validator kimia. Cek validitas SMILES, kelayakan sintesis, dan keamanan.",
            "justifier": "Kamu komunikator ilmiah. Jelaskan kenapa senyawa ini dipilih."
        }
        
        # --- INTELLIGENCE FROM CODE A (Translation Map) ---
        self.translation_map = {
            'indonesia': {
                'polimer': 'polymer', 'plastik': 'plastic', 'elastomer': 'elastomer',
                'titik_leleh': 'melting_point', 'titik_didih': 'boiling_point',
                'surfaktan': 'surfactant', 'pelarut': 'solvent', 'katalis': 'catalyst',
                'aditif': 'additive', 'polietilen': 'polyethylene', 'nilon': 'nylon'
            }
        }

    def _extract_json(self, text: str) -> str:
        # Robust JSON extraction
        try:
            match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', text)
            if match: return match.group(0)
            return text
        except: return text

    # --- 1. PREPROCESSING (Logic: Code A, Speed: Optimized) ---
    def advanced_preprocessing(self, user_input: str) -> ProcessedInput:
        normalized = user_input.lower().strip()
        # Apply translation map (Code A Logic)
        for indo, eng in self.translation_map['indonesia'].items():
            if indo in normalized:
                normalized = normalized.replace(indo, eng)

        prompt = f"""
        {self.agents['preprocessor']}
        USER INPUT: "{user_input}"
        CONTEXT: "{normalized}"
        
        EXTRACT SPECIFIC CHEMICAL COMPOUNDS (IUPAC/Common Name).
        OUTPUT JSON:
        {{
            "primary_application": "string",
            "target_properties": ["prop1", "prop2"],
            "specific_compounds": ["compound1", "compound2"] (Max 3, English),
            "extraction_success": true
        }}
        """
        try:
            response = self.model.generate_content(prompt)
            json_str = self._extract_json(response.text)
            concepts = json.loads(json_str)
            
            # Logic Code A: Validasi list senyawa
            search_terms = concepts.get('specific_compounds', [])
            if not search_terms:
                search_terms = self._get_fallback_terms_simple(normalized)

            return ProcessedInput(
                original_input=user_input,
                normalized_input=normalized,
                concepts=concepts,
                search_terms=search_terms[:3],
                context=concepts.get('primary_application', ''),
                confidence_score=0.9 if search_terms else 0.5
            )
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            return ProcessedInput(user_input, normalized, {}, [], "", 0.0)

    def _get_fallback_terms_simple(self, text: str) -> List[str]:
        # Fallback sederhana jika LLM gagal (Logic Code A)
        if 'solvent' in text: return ['ethanol', 'acetone']
        if 'surfactant' in text: return ['sodium dodecyl sulfate']
        if 'polymer' in text: return ['polyethylene']
        return []

    # --- 2. ANALYZER (Prompt Code A) ---
    def analyze_criteria(self, processed_input: ProcessedInput) -> str:
        prompt = f"""
        {self.agents['analyzer']}
        USER REQUEST: {processed_input.original_input}
        CONCEPTS: {json.dumps(processed_input.concepts)}
        
        Berikan analisis singkat (Max 100 kata):
        1. Interpretasi Kriteria
        2. Requirements Fisikokimia
        3. Strategi Formulasi
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except: return "Analysis pending."

    # --- 3. RESEARCHER (Logic: Code A Fallback + Parallel DB) ---
    def research_existing_compounds(self, dummy_arg, search_terms: List[str]) -> str:
        if not search_terms: return "No terms."
        
        # Search PubChem (Parallel from Database Class)
        results = self.db.search_pubchem_parallel(search_terms, max_results=1)
        
        # --- INTELLIGENCE FROM CODE A: Enhanced Fallback Data ---
        if not results:
            logger.info("PubChem empty, using ENHANCED FALLBACK DATA (Code A)")
            results = self._get_enhanced_fallback_data(search_terms)
            
        summary = "Existing Compounds:\n"
        for r in results:
            summary += f"- {r['name']} (SMILES: {r['smiles']})\n"
        return summary

    def _get_enhanced_fallback_data(self, search_terms: List[str]) -> List[Dict]:
        """Database darurat dari Code A - Sangat penting untuk reliabilitas"""
        fallback_compounds = {
            'surfactant': [
                {'name': 'Sodium Dodecyl Sulfate', 'smiles': 'CCCCCCCCCCCCOS(=O)(=O)[O-].[Na+]'},
                {'name': 'Tween 80', 'smiles': 'CCCCCCCCCC(=O)OCC(O)CO'} # Simplified
            ],
            'polymer': [
                {'name': 'Polypropylene', 'smiles': 'CC(C)C'},
                {'name': 'Polyethylene', 'smiles': 'C=C'}
            ],
            'solvent': [
                {'name': 'Ethanol', 'smiles': 'CCO'},
                {'name': 'Acetone', 'smiles': 'CC(=O)C'}
            ],
            'biodegradable': [
                {'name': 'Polylactic Acid', 'smiles': 'CC(O)C(=O)O'}
            ]
        }
        results = []
        for term in search_terms:
            for cat, comps in fallback_compounds.items():
                if cat in term.lower():
                    results.extend(comps)
        return results[:3]

    # --- 4. GENERATOR (Speed: Threaded Images, Logic: Fallback Templates) ---
    def generate_compounds(self, analysis: str, research: str, processed_input: ProcessedInput) -> List[CompoundRecommendation]:
        prompt = f"""
        {self.agents['generator']}
        ANALYSIS: {analysis}
        RESEARCH: {research}
        
        TASK: Generate EXACTLY 3 novel/modified compounds.
        CRITICAL: Provide VALID, STANDARD CANONICAL SMILES.
        
        OUTPUT JSON:
        {{
          "compounds": [
            {{
              "name": "Name", "formula": "Formula", "smiles": "Valid SMILES",
              "base_compound": "Base", "modifications": "Mods",
              "properties": {{"key": "val"}}
            }}
          ]
        }}
        """
        try:
            response = self.model.generate_content(prompt)
            json_str = self._extract_json(response.text)
            data = json.loads(json_str)
            raw_compounds = data.get('compounds', [])[:3]
            
            # --- INTELLIGENCE FROM CODE A: Fallback Templates ---
            if not raw_compounds:
                raw_compounds = self._generate_fallback_templates(processed_input)

            compounds = []
            # PARALLEL IMAGE GENERATION (Speed from Code B)
            with ThreadPoolExecutor(max_workers=3) as executor:
                futures = [executor.submit(self._process_single_compound, item) for item in raw_compounds]
                for future in as_completed(futures):
                    res = future.result()
                    if res: compounds.append(res)
            return compounds
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            # Emergency Fallback
            return self._process_fallback_list(self._generate_fallback_templates(processed_input))

    def _generate_fallback_templates(self, processed_input):
        # Data dari _generate_fallback_compounds Code A
        return [
            {
                "name": "Modified Polyethylene Variant",
                "smiles": "C=C",
                "base_compound": "Polyethylene",
                "modifications": "Branching adjustment",
                "properties": {"durability": "High"}
            },
            {
                "name": "Bio-Surfactant Analog",
                "smiles": "CCCCCCCCCCCCCCCOS(=O)(=O)O",
                "base_compound": "LABS",
                "modifications": "Chain elongation",
                "properties": {"biodegradability": "Enhanced"}
            }
        ]

    def _process_single_compound(self, item):
        smiles = item.get('smiles', '')
        calc_props = self.db.get_compound_properties(smiles)
        image = self.db.generate_molecule_image(smiles)
        
        return CompoundRecommendation(
            name=item.get('name', 'Unknown'),
            formula=item.get('formula', ''),
            smiles=smiles,
            properties=item.get('properties', {}),
            base_compound=item.get('base_compound', ''),
            modifications=item.get('modifications', ''),
            molecular_weight=calc_props.get('molecular_weight'),
            logp=calc_props.get('logp'),
            structure_image=image
        )
        
    def _process_fallback_list(self, raw_list):
        # Helper untuk mengubah raw dict ke objek CompoundRecommendation secara manual
        res = []
        for item in raw_list:
            res.append(self._process_single_compound(item))
        return res

    # --- 5. VALIDATOR (Logic: Code A Rule-Based - THE INTELLIGENCE CORE) ---
    def validate_compounds(self, compounds: List[CompoundRecommendation]) -> Dict:
        """Menggunakan Validasi Matematika/Rule-Based dari Code A (Bukan cuma tanya AI)"""
        
        detailed_validations = {}
        scores = []
        
        for i, compound in enumerate(compounds):
            # 1. Syntax Valid? (RDKit check)
            valid_syntax = bool(compound.molecular_weight) # Jika MW ada, berarti RDKit berhasil parse
            
            # 2. Safety (Code A Logic)
            safety_score = 0.7
            if compound.logp and compound.logp > 5: safety_score -= 0.2
            if compound.molecular_weight and compound.molecular_weight > 1000: safety_score += 0.1
            
            # 3. Novelty (Code A Logic)
            novelty_score = min(0.6 + (len(compound.modifications or "") * 0.01), 0.9)
            
            # Aggregate Score
            final_score = (int(valid_syntax) * 0.4) + (safety_score * 0.3) + (novelty_score * 0.3)
            compound.validation_score = round(final_score, 2)
            
            # Feasibility note based on score
            if final_score > 0.8: compound.feasibility_notes = "Highly Feasible & Safe"
            elif final_score > 0.5: compound.feasibility_notes = "Moderate Feasibility"
            else: compound.feasibility_notes = "Requires Optimization"

            scores.append(final_score)
            
            detailed_validations[compound.name] = {
                "validity": valid_syntax,
                "safety_score": round(safety_score, 2),
                "novelty_score": round(novelty_score, 2),
                "overall": round(final_score, 2)
            }
            
        overall_confidence = sum(scores) / len(scores) if scores else 0.5
        
        # Generate Text Summary using AI (Optional enhancement)
        return {
            "overall_confidence": round(overall_confidence, 2),
            "detailed_validations": detailed_validations,
            "validation_text": f"Validated {len(compounds)} compounds. Average confidence: {overall_confidence:.2f}"
        }

    # --- 6. JUSTIFIER (Fix: Error Handling) ---
    def create_justification(self, compounds: List[CompoundRecommendation], validation: Dict, processed_input: ProcessedInput) -> str:
        prompt = f"""
        {self.agents['justifier']}
        REQUEST: {processed_input.original_input}
        COMPOUNDS: {[c.name for c in compounds]}
        VALIDATION: {validation.get('overall_confidence')}
        
        Write a professional justification (max 150 words).
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Justification error: {e}")
            return "Compounds generated based on criteria."


# Initialize
enhanced_agent = EnhancedChemicalDiscoveryAgent()


# === 6. ROUTES (Parallel Execution Flow) ===

@app.route('/api/discover', methods=['POST'])
def discover_chemicals():
    try:
        data = request.get_json()
        user_input = str(data.get('criteria', '')).strip()
        
        if not user_input: return jsonify({'error': 'Criteria required'}), 400
        logger.info(f"🚀 Processing: {user_input}")

        # 1. Preprocessing (Serial)
        processed_input = enhanced_agent.advanced_preprocessing(user_input)

        # 2. Analyze & Research (PARALLEL - Speed Boost)
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_analysis = executor.submit(enhanced_agent.analyze_criteria, processed_input)
            future_research = executor.submit(enhanced_agent.research_existing_compounds, None, processed_input.search_terms)
            
            analysis = future_analysis.result()
            research = future_research.result()

        # 3. Generate (Threaded Image Gen Inside)
        compounds = enhanced_agent.generate_compounds(analysis, research, processed_input)
        
        if not compounds:
            return jsonify({'error': 'Failed to generate compounds'}), 500

        # 4. Validate (Rule-Based Logic Code A)
        validation = enhanced_agent.validate_compounds(compounds)

        # 5. Justify
        justification = enhanced_agent.create_justification(compounds, validation, processed_input)

        # Response
        result = {
            'status': 'success',
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
            'justification': justification
        }
        
        logger.info(f"✅ Done. Generated {len(compounds)} compounds.")
        return jsonify(result)

    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/')
def home():
    return jsonify({'status': 'active', 'mode': 'Hybrid (Parallel + Rule-Based Logic)'})

# DEBUGGING TOOL (From Code A)
if __name__ == "__main__":
    # Test Preprocessing Logic
    print("Testing Preprocessing Logic...")
    test_input = "saya butuh surfaktan untuk sabun"
    res = enhanced_agent.advanced_preprocessing(test_input)
    print(f"Input: {test_input}")
    print(f"Terms: {res.search_terms}")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
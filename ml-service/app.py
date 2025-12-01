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

# RDKit for molecular visualization
try:
    from rdkit import Chem
    from rdkit.Chem import Draw, Descriptors, Crippen
    from io import BytesIO
    import base64
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False
    print("Warning: RDKit not available. Molecular visualization disabled.")

# PubChem integration
try:
    import pubchempy as pcp
    PUBCHEM_AVAILABLE = True
    print("✓ PubChem loaded successfully")
except Exception as e:
    PUBCHEM_AVAILABLE = False
    print(f"✗ PubChem not available: {e}")

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY environment variable not set. "
                       "Please set it before running the app.")

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

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
        successful_searches = []
        
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
                        successful_searches.append(query)
                        logger.info(f"✅ Found {len(query_results)} results for: {query}")
                    else:
                        logger.warning(f"No results for: {query}")
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

class EnhancedChemicalDiscoveryAgent:
    def __init__(self):
        self.db = ChemicalDatabase()
        self.max_retries = 3
        
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
        
        # Hanya translation map untuk istilah bahasa Indonesia ke Inggris
        self.translation_map = {
            'indonesia': {
                # Material types
                'polimer': 'polymer', 'polymers': 'polymer',
                'plastik': 'plastic', 'plastics': 'plastic',
                'elastomer': 'elastomer', 'karet': 'rubber',
                'resin': 'resin', 'rejin': 'resin',
                
                # Properties
                'titik_leleh': 'melting_point', 'titik leleh': 'melting_point',
                'titik_didih': 'boiling_point', 'titik didih': 'boiling_point', 
                'suhu_didih': 'boiling_point', 'suhu didih': 'boiling_point',
                'viskositas': 'viscosity', 'kekentalan': 'viscosity',
                'stabilitas_uv': 'uv_stability', 'stabilitas uv': 'uv_stability',
                'tahan_uv': 'uv_stability', 'tahan uv': 'uv_stability',
                'stabilitas_termal': 'thermal_stability', 'stabilitas termal': 'thermal_stability',
                'stabilitas_panas': 'thermal_stability', 'tahan_panas': 'thermal_stability',
                'kelarutan': 'solubility', 'larut': 'solubility',
                
                # Functional compounds
                'surfaktan': 'surfactant', 'surface_active': 'surfactant',
                'pelarut': 'solvent', 'solven': 'solvent',
                'katalis': 'catalyst', 'katalitik': 'catalyst',
                'aditif': 'additive', 'bahan_tambahan': 'additive',
                'plasticizer': 'plasticizer', 'plastisizer': 'plasticizer',
                
                # Common polymers
                'polietilen': 'polyethylene', 'pe': 'polyethylene',
                'polipropilen': 'polypropylene', 'pp': 'polypropylene',
                'pet': 'PET', 'polyethylene_terephthalate': 'PET',
                'pvc': 'PVC', 'polyvinyl_chloride': 'PVC',
                'nilon': 'nylon', 'polyamide': 'nylon',
                'ps': 'polystyrene', 'polistirena': 'polystyrene'
            }
        }

    def advanced_preprocessing(self, user_input: str) -> ProcessedInput:
        """Enhanced preprocessing dengan LLM-powered concept extraction"""
        
        # Step 1: Normalize input
        normalized_input = self._normalize_input(user_input)
        
        # Step 2: LLM-powered concept extraction dengan specific compounds
        concepts = self._extract_concepts_with_llm(normalized_input)
        
        # Step 3: Generate search terms HANYA dari specific_compounds LLM
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
        """Use LLM untuk extract chemical concepts dengan SPECIFIC compound names"""
        
        prompt = self._create_enhanced_extraction_prompt(text)
        
        try:
            response = model.generate_content(prompt)
            json_str = self._extract_json(response.text)
            concepts = json.loads(json_str)
            
            # VALIDASI: Pastikan specific_compounds berisi senyawa yang valid
            validated_compounds = self._validate_compounds_list(concepts.get('specific_compounds', []))
            concepts['specific_compounds'] = validated_compounds
            
            concepts['extraction_success'] = True
            return concepts
            
        except Exception as e:
            logger.error(f"LLM concept extraction failed: {e}")
            # Fallback dengan compounds yang sudah divalidasi
            return {
                "primary_application": "chemical_application",
                "target_properties": [],
                "material_types": [], 
                "constraints": [],
                "industry_context": "general_chemical_industry",
                "specific_compounds": self._get_fallback_compounds(text),
                "extraction_success": False
            }

    def _create_enhanced_extraction_prompt(self, text: str) -> str:
        """Create enhanced prompt untuk LLM concept extraction"""
        return f"""
        ROLE: Anda adalah AI Chemical Specialist yang ahli dalam mengidentifikasi senyawa kimia spesifik dari deskripsi kebutuhan.

        TUGAS: Analisis kriteria user dan ekstrak SENYAWA KIMIA SPESIFIK yang relevan.

        USER REQUEST: "{text}"

        INSTRUKSI KRITIS:
        1. Untuk field 'specific_compounds', berikan **HANYA** nama senyawa kimia spesifik yang bisa langsung dicari di database PubChem
        2. **JANGAN** masukkan properti, deskripsi, atau konsep abstrak
        3. **PRIORITASKAN** senyawa yang umum, terstandarisasi, dan memiliki CAS number
        4. **MAXIMUM** 6 senyawa paling relevan
        5. Gunakan **nama IUPAC** atau **nama umum yang diterima** di industri

        CONTOH OUTPUT YANG DITERIMA:
        - "ethanol", "polylactic acid", "sodium dodecyl sulfate", "polyethylene"

        CONTOH OUTPUT YANG DITOLAK:
        - "kelarutan tinggi", "biodegradable", "material ramah lingkungan"

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

    def _validate_compounds_list(self, compounds: List[str]) -> List[str]:
        """Validasi dan bersihkan daftar senyawa dari LLM"""
        valid_compounds = []
        
        for compound in compounds:
            # Hapus deskripsi yang terlalu panjang
            if len(compound) > 50:
                continue
                
            # Hapus yang mengandung kata deskriptif
            descriptive_words = ['tinggi', 'rendah', 'baik', 'untuk', 'dengan', 'karakteristik', 'properti', 'sifat']
            if any(word in compound.lower() for word in descriptive_words):
                continue
                
            # Normalisasi nama senyawa
            normalized = self._normalize_compound_name(compound)
            if normalized and len(normalized) > 2:
                valid_compounds.append(normalized)
        
        # Remove duplicates dan return max 8 compounds
        return list(set(valid_compounds))[:8]

    def _normalize_compound_name(self, compound: str) -> str:
        """Normalisasi nama senyawa ke format standar"""
        # Case normalization
        normalized = compound.strip().lower()
        
        # Common normalization rules untuk istilah Indonesia
        normalization_map = {
            'etanol': 'ethanol',
            'asam sitrat': 'citric acid',
            'asam laktat': 'lactic acid', 
            'polilaktat': 'polylactic acid',
            'gliserol': 'glycerol',
            'sukrosa': 'sucrose',
            'selulosa': 'cellulose',
            'pati': 'starch',
            'naoh': 'sodium hydroxide',
            'hcl': 'hydrochloric acid'
        }
        
        return normalization_map.get(normalized, normalized)

    def _get_fallback_compounds(self, text: str) -> List[str]:
        """Fallback compounds berdasarkan analisis teks sederhana"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['pelarut', 'solvent', 'larut']):
            return ['ethanol', 'water', 'acetone', 'methanol']
        elif any(word in text_lower for word in ['surfaktan', 'surfactant']):
            return ['sodium dodecyl sulfate', 'tween 80', 'ctab']
        elif any(word in text_lower for word in ['polimer', 'polymer', 'plastik']):
            return ['polyethylene', 'polypropylene', 'polylactic acid']
        elif any(word in text_lower for word in ['biodegrad', 'ramah lingkungan']):
            return ['polylactic acid', 'polyhydroxybutyrate', 'starch']
        else:
            return ['water', 'ethanol', 'acetone']  # Default compounds

    def _generate_search_terms_from_llm(self, concepts: Dict) -> List[str]:
        """Generate search terms HANYA dari specific_compounds LLM"""
        
        # PRIORITAS 1: Gunakan specific_compounds dari LLM
        llm_compounds = concepts.get('specific_compounds', [])
        
        # Jika LLM memberikan compounds yang valid
        if llm_compounds:
            logger.info(f"🔍 Using LLM-extracted compounds: {llm_compounds}")
            return llm_compounds[:6]  # Max 6 terms untuk efisiensi
        
        # Fallback jika LLM tidak memberikan compounds yang valid
        fallback_terms = self._get_fallback_compounds(concepts.get('primary_application', ''))
        logger.info(f"🔍 Using fallback compounds: {fallback_terms}")
        return fallback_terms[:6]

    def _calculate_confidence(self, concepts: Dict, search_terms_count: int) -> float:
        """Calculate confidence score untuk preprocessing results"""
        score = 0.0
        
        # Extraction success bonus
        if concepts.get('extraction_success', False):
            score += 0.3
        
        # Specific compounds identified
        compounds = concepts.get('specific_compounds', [])
        if len(compounds) >= 3:
            score += 0.4
        elif len(compounds) >= 1:
            score += 0.2
        
        # Properties identified
        properties = concepts.get('target_properties', [])
        if properties:
            score += 0.2
        
        # Search terms quantity
        if search_terms_count >= 3:
            score += 0.1
        
        return min(score, 1.0)

    def analyze_criteria(self, processed_input: ProcessedInput) -> str:
        """Enhanced analysis dengan processed input"""
        prompt = f"""
        {self.agents['analyzer']}
        
        USER REQUEST: {processed_input.original_input}
        
        EXTRACTED CONCEPTS:
        - Primary Application: {processed_input.concepts.get('primary_application', 'N/A')}
        - Target Properties: {', '.join(processed_input.concepts.get('target_properties', []))}
        - Material Types: {', '.join(processed_input.concepts.get('material_types', []))}
        - Constraints: {', '.join(processed_input.concepts.get('constraints', []))}
        - Industry Context: {processed_input.concepts.get('industry_context', 'N/A')}
        - Specific Compounds: {', '.join(processed_input.concepts.get('specific_compounds', []))}
        
        Berikan analisis komprehensif dalam format:
        
        1. **INTERPRETASI KRITERIA**: Ringkasan kebutuhan user
        2. **REQUIREMENTS FISIKOKIMIA**: Properties kunci yang diperlukan
        3. **KELAS MATERIAL YANG RELEVAN**: Rekomendasi tipe material
        4. **PERTIMBANGAN TEKNIS**: Batasan dan constraints penting
        5. **STRATEGI FORMULASI**: Pendekatan untuk memenuhi kebutuhan
        
        Analisis harus spesifik, teknis, dan actionable.
        """
        
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            return "Analisis kriteria tidak dapat diselesaikan. Melanjutkan dengan informasi yang tersedia."

    def research_existing_compounds(self, analysis: str, search_terms: List[str]) -> str:
        """Enhanced research dengan parallel PubChem search"""
        logger.info(f"🔍 Researching with {len(search_terms)} terms: {search_terms}")
        
        # Parallel PubChem search
        pubchem_results = self.db.search_pubchem_parallel(search_terms, max_results=3)
        
        # Get fallback data jika diperlukan
        if not pubchem_results:
            pubchem_results = self._get_enhanced_fallback_data(search_terms)
            logger.info("Using enhanced fallback database")
        
        # Build research context
        context = self._build_research_context(pubchem_results, search_terms)
        
        # LLM-powered research analysis
        research_insights = self._analyze_research_data(analysis, context)
        
        return research_insights

    def _get_enhanced_fallback_data(self, search_terms: List[str]) -> List[Dict]:
        """Enhanced fallback data dengan lebih banyak compounds"""
        fallback_compounds = {
            'surfactant': [
                {'cid': 'fallback_s1', 'name': 'Sodium Dodecyl Sulfate', 'formula': 'C12H25NaO4S', 
                 'smiles': 'CCCCCCCCCCCCOS(=O)(=O)[O-].[Na+]', 'molecular_weight': 288.38},
                {'cid': 'fallback_s2', 'name': 'Cetyltrimethylammonium Bromide', 'formula': 'C19H42BrN',
                 'smiles': 'CCCCCCCCCCCCCCCC[N+](C)(C)C.[Br-]', 'molecular_weight': 364.45}
            ],
            'polymer': [
                {'cid': 'fallback_p1', 'name': 'Polypropylene', 'formula': '(C3H6)n',
                 'smiles': 'CC(C)C', 'molecular_weight': 42.08},
                {'cid': 'fallback_p2', 'name': 'Polyethylene', 'formula': '(C2H4)n',
                 'smiles': 'C=C', 'molecular_weight': 28.05},
                {'cid': 'fallback_p3', 'name': 'Polyethylene Terephthalate', 'formula': '(C10H8O4)n',
                 'smiles': 'C1=CC(=CC=C1C(=O)O)C(=O)O', 'molecular_weight': 192.17}
            ],
            'solvent': [
                {'cid': 'fallback_sol1', 'name': 'Ethanol', 'formula': 'C2H6O',
                 'smiles': 'CCO', 'molecular_weight': 46.07},
                {'cid': 'fallback_sol2', 'name': 'Acetone', 'formula': 'C3H6O',
                 'smiles': 'CC(=O)C', 'molecular_weight': 58.08}
            ],
            'biodegradable': [
                {'cid': 'fallback_b1', 'name': 'Polylactic Acid', 'formula': '(C3H4O2)n',
                 'smiles': 'CC(O)C(=O)O', 'molecular_weight': 90.08},
                {'cid': 'fallback_b2', 'name': 'Polyhydroxybutyrate', 'formula': '(C4H6O2)n',
                 'smiles': 'CC(CC(=O)O)O', 'molecular_weight': 102.09}
            ]
        }
        
        results = []
        for term in search_terms:
            term_lower = term.lower()
            for category, compounds in fallback_compounds.items():
                if category in term_lower:
                    results.extend(compounds)
                    break
        
        return results[:6]

    def _build_research_context(self, pubchem_results: List[Dict], search_terms: List[str]) -> str:
        """Build comprehensive research context"""
        context = "🔍 **HASIL PENELUSURAN DATABASE**\n\n"
        
        if pubchem_results:
            context += "**Senyawa yang Ditemukan:**\n"
            for i, comp in enumerate(pubchem_results[:8], 1):
                source = "Fallback DB" if str(comp.get('cid', '')).startswith('fallback') else "PubChem"
                context += f"{i}. **{comp['name']}**\n"
                context += f"   - Formula: {comp['formula']}\n"
                context += f"   - Berat Molekul: {comp.get('molecular_weight', 'N/A')}\n"
                context += f"   - Sumber: {source}\n"
                if comp.get('search_query'):
                    context += f"   - Term: {comp['search_query']}\n"
                context += "\n"
        else:
            context += "Tidak ditemukan senyawa yang sesuai dalam database.\n"
        
        context += f"\n**Term Pencarian:** {', '.join(search_terms)}"
        
        return context

    def _analyze_research_data(self, analysis: str, research_context: str) -> str:
        """Analyze research data dengan LLM"""
        prompt = f"""
        {self.agents['researcher']}
        
        ANALISIS KRITERIA: {analysis}
        
        DATA RISET: {research_context}
        
        Berikan insight research dalam format:
        
        1. **TREND MATERIAL**: Pattern dan tren yang teridentifikasi
        2. **STRUKTUR-PROPERTY**: Hubungan struktur-property yang relevan
        3. **PELUANG REFORMULASI**: Area untuk improvement dan modifikasi
        4. **BEST PRACTICES**: Pendekatan formulasi yang proven
        
        Fokus pada insight yang actionable untuk generasi senyawa baru.
        """
        
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Research analysis error: {e}")
            return "Analisis riset tidak dapat diselesaikan. Melanjutkan dengan data yang tersedia."

    def generate_compounds(self, analysis: str, research: str, processed_input: ProcessedInput) -> List[CompoundRecommendation]:
        """Enhanced compound generation dengan context yang lebih kaya"""
        prompt = f"""
        {self.agents['generator']}
        
        **KONTEKS USER:**
        - Aplikasi: {processed_input.concepts.get('primary_application', 'N/A')}
        - Properties: {', '.join(processed_input.concepts.get('target_properties', []))}
        - Industri: {processed_input.concepts.get('industry_context', 'N/A')}
        - Senyawa Referensi: {', '.join(processed_input.concepts.get('specific_compounds', []))}
        
        **ANALISIS KRITERIA:** {analysis}
        
        **HASIL RISET:** {research}
        
        Generate TEPAT 3 rekomendasi senyawa kimia BARU yang:
        - Memenuhi kriteria user secara spesifik
        - Berbasis senyawa existing yang proven
        - Memiliki modifikasi strategis untuk improve properties
        - SMILES string yang VALID dan chemically reasonable
        
        CRITICAL: Respond ONLY with valid JSON array:
        [
          {{
            "name": "Nama senyawa yang deskriptif",
            "formula": "Formula molekul akurat",
            "smiles": "SMILES string VALID",
            "properties": {{
              "primary_property": "nilai/deskripsi",
              "secondary_property": "nilai/deskripsi", 
              "stability": "deskripsi stabilitas",
              "processability": "kemudahan proses"
            }},
            "base_compound": "Senyawa basis yang proven",
            "modifications": "Deskripsi modifikasi spesifik",
            "expected_improvement": "Improvement yang diharapkan"
          }}
        ]
        
        Pastikan SMILES valid dan sesuai dengan aplikasi target!
        """
        
        try:
            response = model.generate_content(prompt)
            json_str = self._extract_json(response.text)
            compounds_data = json.loads(json_str)
            
            compounds = []
            for data in compounds_data:
                # Enhanced property calculation
                smiles = data.get('smiles', '')
                calc_props = self.db.get_compound_properties(smiles)
                
                # Enhanced validation scoring
                validation_score = self._calculate_initial_validation_score(data, calc_props)
                
                compound = CompoundRecommendation(
                    name=data.get('name', 'Unknown Compound'),
                    formula=data.get('formula', ''),
                    smiles=smiles,
                    properties=data.get('properties', {}),
                    base_compound=data.get('base_compound', ''),
                    modifications=data.get('modifications', ''),
                    molecular_weight=calc_props.get('molecular_weight'),
                    logp=calc_props.get('logp'),
                    structure_image=self.db.generate_molecule_image(smiles),
                    validation_score=validation_score,
                    feasibility_notes=data.get('expected_improvement', '')
                )
                compounds.append(compound)
            
            return compounds
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"JSON parsing error: {e}")
            logger.error(f"Response: {response.text if 'response' in locals() else 'No response'}")
            return self._generate_fallback_compounds(processed_input)
        except Exception as e:
            logger.error(f"Generation error: {e}")
            return self._generate_fallback_compounds(processed_input)

    def _calculate_initial_validation_score(self, data: Dict, calc_props: Dict) -> float:
        """Calculate initial validation score berdasarkan data dan properties"""
        score = 0.5  # Base score
        
        # SMILES validity bonus
        if calc_props and calc_props.get('heavy_atoms', 0) > 0:
            score += 0.2
        
        # Properties completeness bonus
        if data.get('properties') and len(data['properties']) >= 3:
            score += 0.15
        
        # Modification description bonus
        if data.get('modifications') and len(data['modifications']) > 20:
            score += 0.15
        
        return min(score, 1.0)

    def _generate_fallback_compounds(self, processed_input: ProcessedInput) -> List[CompoundRecommendation]:
        """Generate fallback compounds ketika generation gagal"""
        fallback_templates = [
            {
                "name": "Modified Polyethylene for Enhanced Properties",
                "formula": "(C2H4)n",
                "smiles": "C=C",
                "properties": {
                    "melting_point": "105-115°C",
                    "density": "0.94-0.97 g/cm³", 
                    "tensile_strength": "High",
                    "chemical_resistance": "Excellent"
                },
                "base_compound": "Polyethylene",
                "modifications": "Chain branching control for improved mechanical properties",
                "expected_improvement": "Better processability and strength"
            },
            {
                "name": "Surfactant with Improved Biodegradability",
                "formula": "C16H33O4S", 
                "smiles": "CCCCCCCCCCCCCCCOS(=O)(=O)O",
                "properties": {
                    "HLB": "12-15",
                    "biodegradability": "High",
                    "surface_tension": "Low",
                    "solubility": "Water soluble"
                },
                "base_compound": "Linear alkylbenzene sulfonate",
                "modifications": "Linear alkyl chain for enhanced biodegradability",
                "expected_improvement": "Environmental compatibility"
            }
        ]
        
        compounds = []
        for data in fallback_templates:
            smiles = data.get('smiles', '')
            calc_props = self.db.get_compound_properties(smiles)
            
            compound = CompoundRecommendation(
                name=data.get('name', 'Fallback Compound'),
                formula=data.get('formula', ''),
                smiles=smiles,
                properties=data.get('properties', {}),
                base_compound=data.get('base_compound', ''),
                modifications=data.get('modifications', ''),
                molecular_weight=calc_props.get('molecular_weight'),
                logp=calc_props.get('logp'),
                structure_image=self.db.generate_molecule_image(smiles),
                validation_score=0.6,
                feasibility_notes="Generated as fallback option"
            )
            compounds.append(compound)
        
        return compounds

    def validate_compounds(self, compounds: List[CompoundRecommendation]) -> Dict:
        """Enhanced multi-layer validation"""
        if not compounds:
            return {'validation_text': 'No compounds to validate', 'compounds_validated': 0}
        
        detailed_validations = {}
        
        for i, compound in enumerate(compounds):
            compound_validations = {
                'syntax': self._validate_smiles_syntax(compound.smiles),
                'feasibility': self._validate_synthesis_feasibility(compound),
                'safety': self._validate_safety(compound),
                'novelty': self._validate_novelty(compound),
                'practicality': self._validate_practicality(compound)
            }
            
            # Calculate compound score
            compound_score = self._calculate_validation_score(compound_validations)
            compound_validations['overall_score'] = compound_score
            
            detailed_validations[f"compound_{i+1}"] = compound_validations
        
        # Generate validation summary
        validation_text = self._generate_validation_summary(compounds, detailed_validations)
        
        return {
            'validation_text': validation_text,
            'detailed_validations': detailed_validations,
            'compounds_validated': len(compounds),
            'overall_confidence': self._calculate_overall_confidence(detailed_validations)
        }

    def _validate_smiles_syntax(self, smiles: str) -> Dict:
        """Validate SMILES syntax and basic chemical validity"""
        if not smiles:
            return {'status': 'invalid', 'reason': 'Empty SMILES', 'score': 0.0}
        
        if not RDKIT_AVAILABLE:
            return {'status': 'unknown', 'reason': 'RDKit not available', 'score': 0.5}
        
        try:
            mol = Chem.MolFromSmiles(smiles)
            if mol:
                return {
                    'status': 'valid', 
                    'reason': f'Valid SMILES with {mol.GetNumHeavyAtoms()} heavy atoms',
                    'score': 1.0
                }
            else:
                return {'status': 'invalid', 'reason': 'Cannot parse SMILES', 'score': 0.0}
        except Exception as e:
            return {'status': 'error', 'reason': str(e), 'score': 0.0}

    def _validate_synthesis_feasibility(self, compound: CompoundRecommendation) -> Dict:
        """Validate synthesis feasibility"""
        # Basic feasibility check based on molecular properties
        score = 0.7  # Base assumption of moderate feasibility
        
        if compound.molecular_weight and compound.molecular_weight > 1000:
            score -= 0.2  # Large molecules might be harder to synthesize
        
        if compound.logp and compound.logp > 5:
            score += 0.1  # Moderate lipophilicity can be good
        
        return {
            'status': 'estimated',
            'reason': 'Basic feasibility assessment based on molecular properties',
            'score': max(score, 0.3)
        }

    def _validate_safety(self, compound: CompoundRecommendation) -> Dict:
        """Validate safety aspects"""
        # Basic safety assessment based on molecular properties
        score = 0.7  # Base assumption of moderate safety
        
        if compound.logp and compound.logp > 5:
            score -= 0.2  # High logP might indicate bioaccumulation
        
        if compound.molecular_weight and compound.molecular_weight > 1000:
            score += 0.1  # Large molecules often have better safety profiles
        
        return {
            'status': 'assessed',
            'reason': 'Basic safety assessment based on molecular properties',
            'score': max(score, 0.3)
        }

    def _validate_novelty(self, compound: CompoundRecommendation) -> Dict:
        """Assess novelty of the compound"""
        return {
            'status': 'estimated',
            'reason': 'Novelty assessment based on modifications description',
            'score': min(0.6 + (len(compound.modifications) * 0.01), 0.9)
        }

    def _validate_practicality(self, compound: CompoundRecommendation) -> Dict:
        """Validate practical implementation aspects"""
        practicality_factors = [
            bool(compound.smiles and len(compound.smiles) > 5),
            bool(compound.formula),
            bool(compound.base_compound),
            len(compound.modifications) > 20
        ]
        
        score = sum(practicality_factors) / len(practicality_factors)
        
        return {
            'status': 'assessed',
            'reason': f'Practicality score based on {sum(practicality_factors)}/{len(practicality_factors)} factors',
            'score': score
        }

    def _calculate_validation_score(self, validations: Dict) -> float:
        """Calculate overall validation score from individual validations"""
        scores = [v.get('score', 0.5) for v in validations.values() if isinstance(v, dict) and 'score' in v]
        if not scores:
            return 0.5
        
        return sum(scores) / len(scores)

    def _generate_validation_summary(self, compounds: List[CompoundRecommendation], detailed_validations: Dict) -> str:
        """Generate comprehensive validation summary"""
        prompt = f"""
        {self.agents['validator']}
        
        Buat ringkasan validasi untuk {len(compounds)} senyawa:
        
        {json.dumps(detailed_validations, indent=2)}
        
        Berikan summary yang mencakup:
        1. **OVERALL ASSESSMENT**: Penilaian keseluruhan
        2. **STRENGTHS**: Keunggulan dari senyawa-senyawa ini
        3. **CONCERNS**: Potensi masalah atau risiko
        4. **RECOMMENDATIONS**: Rekomendasi untuk improvement
        
        Gunakan bahasa profesional dan teknis.
        """
        
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Validation summary error: {e}")
            return "Validasi komprehensif tidak dapat diselesaikan."

    def _calculate_overall_confidence(self, detailed_validations: Dict) -> float:
        """Calculate overall confidence score dari semua validasi"""
        scores = []
        for compound_validations in detailed_validations.values():
            if isinstance(compound_validations, dict) and 'overall_score' in compound_validations:
                scores.append(compound_validations['overall_score'])
        
        return sum(scores) / len(scores) if scores else 0.5

    def create_justification(self, compounds: List[CompoundRecommendation], 
                           validation: Dict, processed_input: ProcessedInput) -> str:
        """Enhanced justification dengan context yang lebih kaya"""
        compounds_summary = "\n".join([
            f"{i+1}. **{c.name}** ({c.formula}) - Score: {c.validation_score:.2f}"
            for i, c in enumerate(compounds)
        ])
        
        prompt = f"""
        {self.agents['justifier']}
        
        **KONTEKS USER:**
        - Permintaan: {processed_input.original_input}
        - Aplikasi: {processed_input.concepts.get('primary_application', 'N/A')}
        - Industri: {processed_input.concepts.get('industry_context', 'N/A')}
        - Confidence Preprocessing: {processed_input.confidence_score:.2f}
        
        **SENYAWA YANG DIREKOMENDASIKAN:**
        {compounds_summary}
        
        **HASIL VALIDASI:**
        {validation['validation_text']}
        
        Buat justifikasi komprehensif yang mencakup:
        
        ## **RINGKASAN EKSEKUTIF**
        Overview mengapa rekomendasi ini sesuai untuk kebutuhan user.
        
        ## **ALIGNMENT WITH REQUIREMENTS** 
        Penjelasan spesifik bagaimana setiap senyawa memenuhi kriteria.
        
        ## **INOVASI DAN KEUNGGULAN**
        Nilai tambah dan diferensiasi setiap senyawa.
        
        ## **IMPLEMENTASI PRAKTIS**
        Pertimbangan implementasi di dunia nyata.
        
        ## **RECOMMENDATION PRIORITIZATION**
        Urutan prioritas berdasarkan feasibility dan potential impact.
        
        Gunakan format profesional dengan paragraf jelas dan poin-poin kunci.
        """
        
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Justification error: {e}")
            return "Justifikasi tidak dapat diselesaikan."

    def _extract_json(self, text: str) -> str:
        """Extract JSON dari response LLM dengan parsing yang lebih robust."""
        # 1) Coba parse seluruh text langsung
        try:
            json.loads(text)
            return text
        except Exception:
            pass

        # 2) Coba ambil JSON di dalam code fence ```json ... ```
        fence_match = re.search(
            r"```(?:json)?\s*([\s\S]*?)```",
            text,
            re.IGNORECASE
        )
        if fence_match:
            candidate = fence_match.group(1).strip()
            try:
                json.loads(candidate)
                return candidate
            except Exception:
                pass

        # 3) Coba cari JSON object / array pertama (non-greedy biar nggak kebanyakan)
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

        # 4) Fallback: bersihkan code fence kalau ada
        cleaned = text.strip()
        if cleaned.startswith('```json'):
            cleaned = cleaned[7:]
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]

        return cleaned.strip()

    def test_enhanced_preprocessing(self, criteria: str):
        """Test method untuk debugging enhanced preprocessing"""
        print("=== ENHANCED PREPROCESSING TEST ===")
        print(f"Original criteria: {criteria}")
        
        processed = self.advanced_preprocessing(criteria)
        
        print(f"Normalized: {processed.normalized_input}")
        print(f"Concepts: {json.dumps(processed.concepts, indent=2, ensure_ascii=False)}")
        print(f"Search terms: {processed.search_terms}")
        print(f"Context: {processed.context}")
        print(f"Confidence: {processed.confidence_score:.2f}")
        
        return processed

# Initialize enhanced agent
enhanced_agent = EnhancedChemicalDiscoveryAgent()

# Flask routes tetap sama...
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'rdkit_available': RDKIT_AVAILABLE,
        'pubchem_available': PUBCHEM_AVAILABLE,
        'agent_version': 'enhanced_llm_only_v2.0'
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

        # Pastikan tidak None dan bisa dijadikan string
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
        
        
        logger.info(f"Processing enhanced discovery request: {user_input}")
        
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
                'agent_version': 'enhanced_llm_only_v2.0'
            }
        }
        
        logger.info(f"Successfully generated {len(compounds)} compounds")
        return jsonify(result)
        
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return jsonify({
            'error': 'Internal server error. Please try again.',
            'status': 'failed'
        }), 500

if __name__ == "__main__":
    # Test enhanced preprocessing
    test_cases = [
        "pelarut hijau untuk ekstraksi senyawa alam dengan kelarutan tinggi, toksisitas rendah, dan biodegradable",
        "surfaktan untuk enhanced oil recovery dengan HLB 8-12 dan stabilitas thermal 80°C",
        "polimer biodegradable untuk packaging makanan dengan barrier properties baik"
    ]
    
    for test_criteria in test_cases:
        print(f"\n=== TESTING: {test_criteria} ===")
        processed = enhanced_agent.test_enhanced_preprocessing(test_criteria)
        print("Enhanced preprocessing completed successfully!")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
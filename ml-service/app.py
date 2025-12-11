import os
import re
import time
import json
import logging
import base64
from io import BytesIO
from dataclasses import dataclass
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# === 1. CONFIGURATION & SETUP ===

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask
app = Flask(__name__)
CORS(app)

# RDKit for molecular visualization (Optional)
try:
    from rdkit import Chem
    from rdkit.Chem import Draw, Descriptors, Crippen
    RDKIT_AVAILABLE = True
    logger.info("✓ RDKit loaded successfully")
except ImportError:
    RDKIT_AVAILABLE = False
    logger.warning("⚠ RDKit not available. Visualization disabled.")

# PubChem integration (Optional)
try:
    import pubchempy as pcp
    PUBCHEM_AVAILABLE = True
    logger.info("✓ PubChem loaded successfully")
except ImportError:
    PUBCHEM_AVAILABLE = False
    logger.warning("⚠ PubChem not available. Database search disabled.")

# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("❌ GEMINI_API_KEY not found. Please create .env file!")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')
logger.info("✓ Gemini AI configured")

# === 2. HELPER FUNCTIONS ===

def call_gemini_with_retry(prompt: str, max_retries: int = 3):
    """Call Gemini API with retry logic for stability"""
    for attempt in range(max_retries):
        try:
            # Generate content
            response = model.generate_content(prompt)
            return response
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                wait_time = (attempt + 1) * 5
                logger.warning(f"⏳ Rate limit hit. Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.error(f"Gemini API Error: {e}")
                if attempt == max_retries - 1:
                    raise
    raise Exception("Max retries exceeded for AI call")

# === 3. DATA STRUCTURES ===

@dataclass
class CompoundRecommendation:
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
    original_input: str
    normalized_input: str
    concepts: Dict
    search_terms: List[str]
    context: str
    confidence_score: float

# === 4. DATABASE HANDLER ===

class ChemicalDatabase:
    """Handles interaction with PubChem and RDKit"""
    
    def __init__(self):
        self.search_cache = {}
        self.property_cache = {}
    
    def search_pubchem_parallel(self, queries: List[str], max_results: int = 3) -> List[Dict]:
        """Search PubChem for multiple terms in parallel threads"""
        if not PUBCHEM_AVAILABLE or not queries:
            return []
        
        results = []
        # Gunakan max 5 workers agar tidak memberatkan network
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
        
        # Deduplikasi berdasarkan CID
        seen_cids = set()
        unique_results = []
        for comp in results:
            cid = str(comp.get('cid', ''))
            if cid not in seen_cids:
                seen_cids.add(cid)
                unique_results.append(comp)
        
        return unique_results[:max_results * 2]
    
    def _single_pubchem_search(self, query: str, max_results: int) -> List[Dict]:
        """Helper untuk search satu query"""
        try:
            cache_key = f"{query}_{max_results}"
            if cache_key in self.search_cache:
                return self.search_cache[cache_key]
            
            compounds = pcp.get_compounds(query, 'name', listkey_count=max_results)
            results = []
            for comp in compounds[:max_results]:
                results.append({
                    'cid': comp.cid,
                    'name': comp.iupac_name or (comp.synonyms[0] if comp.synonyms else "Unknown"),
                    'formula': comp.molecular_formula,
                    'smiles': comp.canonical_smiles,
                    'molecular_weight': comp.molecular_weight,
                    'search_query': query
                })
            
            if results:
                self.search_cache[cache_key] = results
            return results
        except Exception:
            return []

    def get_compound_properties(self, smiles: str) -> Dict:
        """Calculate properties using RDKit"""
        if not RDKIT_AVAILABLE or not smiles:
            return {}
        
        if smiles in self.property_cache:
            return self.property_cache[smiles]
        
        try:
            mol = Chem.MolFromSmiles(smiles)
            if mol:
                props = {
                    'molecular_weight': round(Descriptors.MolWt(mol), 2),
                    'logp': round(Crippen.MolLogP(mol), 2),
                    'h_bond_donors': Descriptors.NumHDonors(mol),
                    'h_bond_acceptors': Descriptors.NumHAcceptors(mol),
                    'rotatable_bonds': Descriptors.NumRotatableBonds(mol),
                    'heavy_atoms': mol.GetNumHeavyAtoms()
                }
                self.property_cache[smiles] = props
                return props
        except Exception as e:
            logger.error(f"Prop calc error: {e}")
        return {}

    def generate_molecule_image(self, smiles: str) -> str:
        """Generate base64 PNG image"""
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
            pass
        return None

# === 5. AI AGENT CLASS (PARALLEL READY) ===

class EnhancedChemicalDiscoveryAgent:
    def __init__(self):
        self.db = ChemicalDatabase()
        
        # Define Personas
        self.agents = {
            "preprocessor": "Kamu adalah preprocessing specialist kimia. Ekstrak konsep dan SENYAWA KIMIA SPESIFIK.",
            "analyzer": "Kamu adalah ahli kimia analitik. Analisis kebutuhan fisikokimia dan constraints.",
            "researcher": "Kamu adalah ahli riset kimia. Analisis hasil database dan temukan pola.",
            "generator": "Kamu adalah ahli sintesis kreatif. Rancang senyawa baru dengan SMILES valid.",
            "validator": "Kamu adalah validator kimia. Cek validitas SMILES dan kelayakan sintesis.",
            "justifier": "Kamu adalah komunikator sains. Jelaskan rekomendasi dengan jelas."
        }

    def advanced_preprocessing(self, user_input: str) -> ProcessedInput:
        """Step 1: Extract concepts (Serial)"""
        prompt = f"""
        ROLE: {self.agents['preprocessor']}
        INPUT: "{user_input}"
        TUGAS: Ekstrak konsep dan senyawa spesifik untuk pencarian database.
        
        OUTPUT JSON FORMAT:
        {{
            "primary_application": "string",
            "target_properties": ["prop1", "prop2"],
            "industry_context": "string",
            "specific_compounds": ["compound1", "compound2"] (Max 6, English names)
        }}
        """
        try:
            response = call_gemini_with_retry(prompt)
            concepts = json.loads(self._extract_json(response.text))
            
            # Simple validation of specific compounds
            search_terms = concepts.get('specific_compounds', [])[:6]
            if not search_terms:
                search_terms = self._get_fallback_compounds(user_input)
            
            return ProcessedInput(
                original_input=user_input,
                normalized_input=user_input.lower(),
                concepts=concepts,
                search_terms=search_terms,
                context=concepts.get('industry_context', ''),
                confidence_score=0.8
            )
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            return ProcessedInput(user_input, user_input, {}, ["water", "ethanol"], "", 0.1)

    def analyze_criteria(self, processed_input: ProcessedInput) -> str:
        """Step 2a: Analyze requirements (Parallel Thread 1)"""
        prompt = f"""
        ROLE: {self.agents['analyzer']}
        REQUEST: {processed_input.original_input}
        CONCEPTS: {json.dumps(processed_input.concepts)}
        
        Berikan analisis teknis singkat (max 150 kata) mengenai persyaratan fisikokimia yang dibutuhkan.
        """
        try:
            res = call_gemini_with_retry(prompt)
            return res.text
        except:
            return "Analysis failed."

    def research_existing_compounds(self, user_request: str, search_terms: List[str]) -> str:
        """Step 2b: Database Search & Insight (Parallel Thread 2)"""
        # 1. Search DB (Network I/O)
        pubchem_results = self.db.search_pubchem_parallel(search_terms)
        
        # Build Context string
        db_context = "DATABASE RESULTS:\n"
        if pubchem_results:
            for c in pubchem_results[:5]:
                db_context += f"- {c['name']} (Formula: {c['formula']})\n"
        else:
            db_context += "No specific compounds found in database.\n"

        # 2. Analyze Results with LLM
        prompt = f"""
        ROLE: {self.agents['researcher']}
        USER REQUEST: {user_request}
        {db_context}
        
        Berikan insight riset singkat (max 150 kata) tentang tren material dari data di atas.
        """
        try:
            res = call_gemini_with_retry(prompt)
            return res.text
        except:
            return "Research insights unavailable."

    def generate_compounds(self, analysis: str, research: str, processed_input: ProcessedInput) -> List[CompoundRecommendation]:
        """Step 3: Generate Compounds (Serial - Needs results from 2a & 2b)"""
        prompt = f"""
        ROLE: {self.agents['generator']}
        CRITERIA: {processed_input.original_input}
        ANALYSIS: {analysis}
        RESEARCH: {research}
        
        TUGAS: Generate TEPAT 3 senyawa kimia (bisa baru/modifikasi) yang memenuhi kriteria.
        WAJIB: Sertakan SMILES string yang valid.
        
        OUTPUT JSON ARRAY:
        [
          {{
            "name": "Compound Name",
            "formula": "C2H5OH",
            "smiles": "CCO",
            "properties": {{"prop": "val"}},
            "base_compound": "Base Name",
            "modifications": "Description",
            "expected_improvement": "Reason"
          }}
        ]
        """
        try:
            response = call_gemini_with_retry(prompt)
            data_list = json.loads(self._extract_json(response.text))
            
            results = []
            for data in data_list:
                smiles = data.get('smiles', '')
                calc_props = self.db.get_compound_properties(smiles)
                img = self.db.generate_molecule_image(smiles)
                
                results.append(CompoundRecommendation(
                    name=data.get('name', 'Unknown'),
                    formula=data.get('formula', ''),
                    smiles=smiles,
                    properties=data.get('properties', {}),
                    base_compound=data.get('base_compound', ''),
                    modifications=data.get('modifications', ''),
                    molecular_weight=calc_props.get('molecular_weight'),
                    logp=calc_props.get('logp'),
                    structure_image=img,
                    validation_score=0.8, # Placeholder initial score
                    feasibility_notes=data.get('expected_improvement', '')
                ))
            return results
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            return []

    def validate_compounds(self, compounds: List[CompoundRecommendation]) -> Dict:
        """Step 4: Validate (Serial)"""
        compounds_summary = [{ 'name': c.name, 'smiles': c.smiles } for c in compounds]
        
        prompt = f"""
        ROLE: {self.agents['validator']}
        COMPOUNDS: {json.dumps(compounds_summary)}
        
        Validasi kelayakan sintesis dan keamanan.
        OUTPUT JSON:
        {{
            "overall_confidence": 0.85,
            "validation_text": "Ringkasan validasi...",
            "detailed": {{ "compound_1": {{ "score": 0.9, "status": "valid" }} }}
        }}
        """
        try:
            res = call_gemini_with_retry(prompt)
            return json.loads(self._extract_json(res.text))
        except:
            return {"validation_text": "Validation skipped.", "overall_confidence": 0.5}

    def create_justification(self, compounds: List[CompoundRecommendation], validation: Dict, processed_input: ProcessedInput) -> str:
        """Step 5: Justification (Serial)"""
        names = [c.name for c in compounds]
        prompt = f"""
        ROLE: {self.agents['justifier']}
        REQUEST: {processed_input.original_input}
        RECOMMENDATIONS: {', '.join(names)}
        VALIDATION: {validation.get('validation_text', '')}
        
        Buat penjelasan profesional mengapa senyawa ini dipilih (max 200 kata).
        """
        try:
            res = call_gemini_with_retry(prompt)
            return res.text
        except:
            return "Justification unavailable."

    def _extract_json(self, text: str) -> str:
        """Clean JSON from Markdown"""
        try:
            # Try to find JSON block
            match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
            if match: return match.group(1)
            # Try to find array or object
            match = re.search(r'(\[[\s\S]*\]|\{[\s\S]*\})', text)
            if match: return match.group(1)
            return text
        except:
            return text

    def _get_fallback_compounds(self, text: str) -> List[str]:
        """Simple keyword matching fallback"""
        text = text.lower()
        if "plastic" in text or "polymer" in text: return ["Polyethylene", "Polypropylene"]
        if "drug" in text or "medicine" in text: return ["Aspirin", "Paracetamol"]
        return ["Water", "Ethanol"]

# Initialize Agent
enhanced_agent = EnhancedChemicalDiscoveryAgent()

# === 6. FLASK ROUTES ===

@app.route('/')
def home():
    return jsonify({"status": "Chemical Discovery Service Running", "mode": "Parallel"})

@app.route('/api/discover', methods=['POST'])
def discover_chemicals():
    """PARALLEL Discovery Endpoint"""
    start_time = time.time()
    
    try:
        # Input Validation
        data = request.get_json()
        if not data or 'criteria' not in data:
            return jsonify({'error': 'Missing criteria'}), 400
        
        user_input = data['criteria'].strip()
        logger.info(f"🚀 Processing: {user_input}")
        
        # 1. Preprocessing (Serial)
        processed_input = enhanced_agent.advanced_preprocessing(user_input)
        
        # 2. Analysis & Research (PARALLEL)
        analysis = ""
        research = ""
        
        with ThreadPoolExecutor(max_workers=2) as executor:
            # Launch threads
            future_analysis = executor.submit(
                enhanced_agent.analyze_criteria, 
                processed_input
            )
            future_research = executor.submit(
                enhanced_agent.research_existing_compounds, 
                processed_input.original_input, # Independent input
                processed_input.search_terms
            )
            
            # Gather results
            try:
                analysis = future_analysis.result()
                research = future_research.result()
                logger.info("✅ Parallel steps completed")
            except Exception as e:
                logger.error(f"Parallel error: {e}")
        
        # Fallbacks if parallel failed
        if not analysis: analysis = "Analysis unavailable."
        if not research: research = "Research unavailable."
        
        # 3. Generation (Serial)
        compounds = enhanced_agent.generate_compounds(analysis, research, processed_input)
        
        if not compounds:
            return jsonify({'error': 'Failed to generate compounds'}), 500
        
        # 4. Validation & Justification (Serial)
        validation = enhanced_agent.validate_compounds(compounds)
        justification = enhanced_agent.create_justification(compounds, validation, processed_input)
        
        elapsed = time.time() - start_time
        
        # Response Formatting
        response_data = {
            'status': 'success',
            'user_criteria': user_input,
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
                } for c in compounds
            ],
            'validation': validation,
            'justification': justification,
            'metadata': {
                'execution_time': f"{elapsed:.2f}s",
                'agent_version': 'parallel_v2.0'
            }
        }
        
        return jsonify(response_data)

    except Exception as e:
        logger.exception(f"Server Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🧪 CHEMICAL DISCOVERY SERVICE (PARALLEL MODE)")
    print(f"✓ RDKit: {'Available' if RDKIT_AVAILABLE else 'Disabled'}")
    print(f"✓ PubChem: {'Available' if PUBCHEM_AVAILABLE else 'Disabled'}")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
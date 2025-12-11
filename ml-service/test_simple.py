import os
from dotenv import load_dotenv
import google.generativeai as genai

print("=== SIMPLE TEST ===")

# 1. Load .env
load_dotenv()
print("✓ load_dotenv() executed")

# 2. Get API key
api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key: {api_key[:20] if api_key else 'NONE'}...")

if not api_key:
    print("❌ API Key tidak ditemukan!")
    print("Check file .env:")
    print(f"  - Lokasi: {os.getcwd()}\\.env")
    print(f"  - Exists: {os.path.exists('.env')}")
    exit(1)

# 3. Configure Gemini
try:
    genai.configure(api_key=api_key)
    print("✓ genai.configure() success")
    
    # 4. Test generation
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content("Say hello")
    print(f"✓ Response: {response.text}")
    
    print("\n✅ CONNECTION SUCCESS!")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
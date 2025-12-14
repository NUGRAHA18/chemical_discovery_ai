import os
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable, InternalServerError, InvalidArgument, PermissionDenied
from dotenv import load_dotenv
import time

load_dotenv()
STATE_FILE = "gemini_key_state.txt"

class GeminiManager:
    def __init__(self):
        keys_str = os.getenv("GEMINI_API_KEY", "")
        self.api_keys = [k.strip() for k in keys_str.split(",") if k.strip()]
        
        if not self.api_keys:
            raise ValueError("Tidak ada API Key yang ditemukan di .env!")
            
    
        self.current_key_index = self._load_state()
        self.configure_current_key(sync=False) 

    def _load_state(self):
        try:
            if os.path.exists(STATE_FILE):
                with open(STATE_FILE, "r") as f:
                    idx = int(f.read().strip())
                    if 0 <= idx < len(self.api_keys):
                        return idx
        except Exception:
            pass 
        return 0

    def _save_state(self):
        try:
            with open(STATE_FILE, "w") as f:
                f.write(str(self.current_key_index))
        except Exception as e:
            print(f"⚠️ Gagal menyimpan state key: {e}")

    def configure_current_key(self, sync=True):
        if sync:
            self.current_key_index = self._load_state()

        current_key = self.api_keys[self.current_key_index]
        masked_key = f"{current_key[:4]}...{current_key[-4:]}"
        genai.configure(api_key=current_key)

    def switch_key(self):
        self.current_key_index = self._load_state()
        
        prev_index = self.current_key_index
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        
        print(f"⚠️  Masalah pada Key-{prev_index}. Switching ke API Key index-{self.current_key_index}...")
        
        self._save_state()
        
        self.configure_current_key(sync=False)

    def generate_content_safe(self, model_name, prompt):
        attempts = 0
        max_attempts = len(self.api_keys)

        self.configure_current_key(sync=True)

        while attempts < max_attempts:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                return response.text
            
            except (ResourceExhausted, InvalidArgument, PermissionDenied) as e:
                print(f"❌ Error Key Index {self.current_key_index}: {e}")
                self.switch_key()
                attempts += 1
                time.sleep(1)
            
            except (ServiceUnavailable, InternalServerError):
                print("Server Google sibuk, mencoba ulang...")
                time.sleep(2)
                
            except Exception as e:
                print(f"Error fatal: {e}")
                raise e

        raise Exception("Semua API Key telah dicoba dan gagal!")

gemini_client = GeminiManager()
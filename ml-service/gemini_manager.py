import os
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable, InternalServerError, InvalidArgument, PermissionDenied, Aborted
from dotenv import load_dotenv
import time
import logging
import re
import random

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("GeminiManager")

STATE_FILE = "gemini_key_state.txt"

class GeminiManager:
    def __init__(self):
        # Membaca key dari .env
        keys_str = os.getenv("GEMINI_API_KEYS", "")
        if not keys_str:
            keys_str = os.getenv("GEMINI_API_KEY", "")
            
        self.api_keys = [k.strip() for k in keys_str.split(",") if k.strip()]
        
        if not self.api_keys:
            logger.error("❌ TIDAK ADA API KEY DI .ENV!")
            self.api_keys = ["DUMMY_KEY"]
            
        self.current_key_index = self._load_state()
        self.configure_current_key(sync=False) 

    def _load_state(self):
        try:
            if os.path.exists(STATE_FILE):
                with open(STATE_FILE, "r") as f:
                    content = f.read().strip()
                    if content.isdigit():
                        idx = int(content)
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
            logger.warning(f"⚠️ Gagal menyimpan state key: {e}")

    def configure_current_key(self, sync=True):
        if sync:
            self.current_key_index = self._load_state()

        if self.current_key_index >= len(self.api_keys):
            self.current_key_index = 0

        current_key = self.api_keys[self.current_key_index]
        masked_key = f"{current_key[:5]}...{current_key[-4:]}" if len(current_key) > 10 else "INVALID"
        
        genai.configure(api_key=current_key)
        logger.info(f"🔑 Configured Key Index-{self.current_key_index}: {masked_key}")

    def switch_key(self):
        """Pindah ke key berikutnya"""
        self.current_key_index = self._load_state()
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        self._save_state()
        self.configure_current_key(sync=False)

    def extract_retry_delay(self, error_message):
        """Mencoba membaca angka detik dari pesan error Google"""
        try:
            # Cari pola "retry in 22.7s" atau "retry in 22s"
            match = re.search(r"retry in (\d+(\.\d+)?)s", str(error_message))
            if match:
                return float(match.group(1))
        except:
            pass
        return None

    def generate_content_safe(self, model_name, prompt, request_options=None):
        """
        Fungsi generate yang SABAR MENUNGGU.
        Cocok untuk Gemini 2.5 Flash yang sering menyuruh menunggu 30+ detik.
        """
        if request_options is None:
            request_options = {'timeout': 120} # Timeout panjang (2 menit) agar tidak RTO saat menunggu

        # Jeda awal standar
        time.sleep(0.5) 

        max_global_retries = 10 
        attempt = 0

        while attempt < max_global_retries:
            try:
                self.configure_current_key(sync=True)
                model = genai.GenerativeModel(model_name)
                
                response = model.generate_content(prompt, request_options=request_options)
                return response.text
            
            except (ResourceExhausted, ServiceUnavailable) as e:
                error_msg = str(e)
                logger.warning(f"⚠️ Quota Error pada Key-{self.current_key_index}")
                
                # Cek apakah Google menyuruh menunggu sekian detik
                suggested_wait = self.extract_retry_delay(error_msg)
                
                # STRATEGI TANK:
                # Jika Google bilang "Wait 32s", kita WAJIB tunggu 32s + buffer.
                # Jangan langsung ganti key jika semua key kemungkinan berasal dari pool quota yang sama (atau habis semua).
                
                if suggested_wait:
                    wait_time = suggested_wait + 3 # Tambah buffer 3 detik
                    logger.warning(f"⏳ Google meminta cooling down {suggested_wait}s. Sleeping {wait_time}s...")
                    time.sleep(wait_time)
                    # Setelah bangun, kita switch key untuk keberuntungan
                    self.switch_key()
                else:
                    # Jika tidak ada info detik, pakai Backoff manual agresif
                    self.switch_key()
                    backoff = 10 * (attempt + 1) # 10s, 20s, 30s...
                    logger.warning(f"⏳ Sleeping {backoff}s manually...")
                    time.sleep(backoff)
                
                attempt += 1
            
            except (InternalServerError, Aborted) as e:
                logger.warning(f"⚠️ Server Google Error. Retrying in 5s...")
                time.sleep(5)
                attempt += 1

            except Exception as e:
                logger.error(f"❌ Key Invalid or Fatal Error: {e}")
                self.switch_key()
                attempt += 1

        # Jika sudah mencoba berkali-kali masih gagal
        logger.error("❌ CRITICAL: Gagal setelah multiple retries.")
        raise Exception("Server sedang sibuk tinggi (Rate Limit 2.5 Flash). Mohon tunggu 2-3 menit sebelum mencoba lagi.")

gemini_client = GeminiManager()
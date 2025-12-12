import os
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable, InternalServerError
from dotenv import load_dotenv
import time

load_dotenv()

class GeminiManager:
    def __init__(self):
        # 1. Pastikan nama variablenya SAMA PERSIS dengan di .env (GEMINI_API_KEY)
        keys_str = os.getenv("GEMINI_API_KEY", "")
        
        # 2. Logic ini akan memisahkan text berdasarkan koma
        # Hasilnya jadi list: ['AIzaSyDN...', 'AIzaSyBK...', dst]
        self.api_keys = [k.strip() for k in keys_str.split(",") if k.strip()]
        
        if not self.api_keys:
            raise ValueError("Tidak ada API Key yang ditemukan di .env! Pastikan nama variabelnya GEMINI_API_KEY")
            
        self.current_key_index = 0
        self.configure_current_key()

    def configure_current_key(self):
        """Mengatur konfigurasi genai dengan key yang sedang aktif"""
        current_key = self.api_keys[self.current_key_index]
        genai.configure(api_key=current_key)
        # print(f"[System] Menggunakan API Key index ke-{self.current_key_index}") # Uncomment untuk debug

    def switch_key(self):
        """Pindah ke key berikutnya dalam list"""
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        print(f"⚠️ Quota habis atau Limit tercapai. Switching ke API Key index-{self.current_key_index}...")
        self.configure_current_key()

    def generate_content_safe(self, model_name, prompt):
        """
        Fungsi wrapper untuk generate_content dengan fitur auto-switch key.
        Akan mencoba semua key yang tersedia sebelum menyerah.
        """
        attempts = 0
        max_attempts = len(self.api_keys) # Maksimal percobaan sebanyak jumlah key

        while attempts < max_attempts:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                return response.text
            
            except ResourceExhausted:
                # Error 429: Quota Exceeded / Rate Limit Hit
                self.switch_key()
                attempts += 1
                time.sleep(1) # Beri jeda sedikit saat switch
            
            except (ServiceUnavailable, InternalServerError):
                # Error server Google (500/503), biasanya retry aja berhasil
                print("Server Google sibuk, mencoba ulang...")
                time.sleep(2)
                attempts += 1
                
            except Exception as e:
                # Error lain (misal prompt invalid) jangan di-retry
                print(f"Error fatal: {e}")
                raise e

        raise Exception("Semua API Key telah mencapai batas limit/quota!")

# Buat instance global agar bisa diimport
gemini_client = GeminiManager()
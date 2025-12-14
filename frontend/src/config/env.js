// Helper untuk membaca env variable (Support Vite & Create-React-App)
const getEnvVariable = (key, defaultValue = "") => {
  // 1. Cek Process.env (Standard Create-React-App / Webpack)
  if (typeof process !== "undefined" && process.env) {
    const reactAppKey = `REACT_APP_${key}`;
    if (process.env[reactAppKey]) return process.env[reactAppKey];
    if (process.env[key]) return process.env[key];
  }

  // 2. Cek Import.meta.env (Standard Vite)

  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      const viteKey = `VITE_${key}`;
      if (import.meta.env[viteKey]) return import.meta.env[viteKey];
      if (import.meta.env[key]) return import.meta.env[key];
    }
  } catch (e) {
    // Ignore error in environments that don't support import.meta
  }

  // 3. Cek Window object (Fallback manual injection)
  if (typeof window !== "undefined" && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }

  return defaultValue;
};

// ========================================================
// KONFIGURASI UTAMA
// ========================================================

// Base URL Backend (http://localhost:3010)
// Diambil dari env, kalau gak ada pake 3010
export const BACKEND_URL = getEnvVariable(
  "BACKEND_URL",
  "http://localhost:3010"
);

// API URL (http://localhost:3010/api)
export const API_URL = getEnvVariable("API_URL", "http://localhost:3010/api");

// Socket URL
export const SOCKET_URL = getEnvVariable("SOCKET_URL", "http://localhost:3010");

// ML Service (Opsional)
export const ML_SERVICE_URL = getEnvVariable(
  "ML_SERVICE_URL",
  "http://localhost:5000"
);

export const NODE_ENV = getEnvVariable("NODE_ENV", "development");

// ========================================================
// HELPER FUNCTIONS
// ========================================================

// 1. Construct API Endpoint
export const getApiEndpoint = (path) => {
  const baseUrl = API_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// 2. Construct Image URL (PINTAR & BERSIH)
export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  // A. Jika imagePath sudah URL lengkap (http/https)
  if (imagePath.startsWith("http")) {
    // FIX BUG PORT LAMA:
    // Jika database menyimpan URL dengan port 3000, kita GANTI paksa ke port 3010 (BACKEND_URL)
    if (imagePath.includes("localhost:3000")) {
      const cleanBackend = BACKEND_URL.replace(/\/$/, "");
      return imagePath.replace("http://localhost:3000", cleanBackend);
    }
    return imagePath;
  }

  // B. Jika imagePath adalah path relatif (/images/...) atau nama file
  const cleanBase = BACKEND_URL.replace(/\/$/, "");
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

  return `${cleanBase}${cleanPath}`;
};

export default {
  API_URL,
  BACKEND_URL,
  ML_SERVICE_URL,
  NODE_ENV,
  getApiEndpoint,
  getImageUrl,
};

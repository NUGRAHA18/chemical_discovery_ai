// Helper untuk membaca env variable (Support Vite & Create-React-App)
const getEnvVariable = (key, defaultValue = "") => {
  if (typeof process !== "undefined" && process.env) {
    const reactAppKey = `REACT_APP_${key}`;
    if (process.env[reactAppKey]) return process.env[reactAppKey];
    if (process.env[key]) return process.env[key];
  }

  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      const viteKey = `VITE_${key}`;
      if (import.meta.env[viteKey]) return import.meta.env[viteKey];
      if (import.meta.env[key]) return import.meta.env[key];
    }
  } catch (e) {}

  if (typeof window !== "undefined" && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }

  return defaultValue;
};

// ========================================================
// KONFIGURASI UTAMA
// ========================================================

export const BACKEND_URL = getEnvVariable(
  "REACT_APP_BACKEND_URL",
  "http://localhost:3010",
);

export const API_URL = getEnvVariable("API_URL", "http://localhost:3010/api");

// Socket URL
export const SOCKET_URL = getEnvVariable("SOCKET_URL", "http://localhost:3010");

// ML Service (Opsional)
export const ML_SERVICE_URL = getEnvVariable(
  "ML_SERVICE_URL",
  "http://localhost:5000",
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

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "/assets/placeholder-molecule.png"; // Saran: Berikan default image jika null

  // 1. Bersihkan path dari string "undefined" atau "null" (peninggalan bug lama)
  let cleanPath = imagePath
    .replace(/^undefined\//, "")
    .replace(/^null\//, "")
    .replace("undefined/", "")
    .trim();

  // 2. DETEKSI & GANTI LOCALHOST (PENTING!)
  // Menggunakan Regex untuk menangkap http://localhost:ANGKA_APAPUN
  if (cleanPath.match(/http:\/\/localhost:\d+/)) {
    const cleanBackend = BACKEND_URL.replace(/\/$/, ""); // Hapus slash akhir backend url
    // Ganti localhost:xxxx dengan domain production
    return cleanPath.replace(/http:\/\/localhost:\d+/, cleanBackend);
  }

  // 3. Jika URL sudah HTTPS (Aman, misal dari Google/Cloudinary)
  if (cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  // 4. Jika URL HTTP biasa (Bukan localhost, tapi tidak aman - opsional)
  // Biasanya tetap kita return, atau kita paksa upgrade ke https jika perlu
  if (cleanPath.startsWith("http://")) {
    return cleanPath;
  }

  // 5. Handle Relative Path (misal: "/images/struc.png")
  const cleanBase = BACKEND_URL.replace(/\/$/, "");
  const finalPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;

  return `${cleanBase}${finalPath}`;
};

export const getFavoriteImageUrl = (imagePath) => {
  if (!imagePath) return "";

  let finalUrl = imagePath;

  // 1️⃣ Legacy data: localhost:3000
  if (finalUrl.includes("localhost:3000")) {
    const cleanBackend = BACKEND_URL.replace(/\/$/, "");
    finalUrl = finalUrl.replace("http://localhost:3000", cleanBackend);
  }

  // 2️⃣ Relative path (/images/...)
  if (!finalUrl.startsWith("http") && finalUrl.startsWith("/")) {
    const cleanBackend = BACKEND_URL.replace(/\/$/, "");
    finalUrl = `${cleanBackend}${finalUrl}`;
  }

  return finalUrl;
};
export default {
  API_URL,
  BACKEND_URL,
  ML_SERVICE_URL,
  NODE_ENV,
  getApiEndpoint,
  getImageUrl,
};

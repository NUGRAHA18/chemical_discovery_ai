// src/config/env.js
// Utility untuk handle environment variables dengan aman

const getEnvVariable = (key, defaultValue = "") => {
  try {
    // Try to access Vite env
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return import.meta.env[key] || defaultValue;
    }
  } catch (error) {
    console.warn(`Cannot access import.meta.env.${key}, using default`);
  }

  // Fallback to window (jika ada)
  if (typeof window !== "undefined" && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }

  return defaultValue;
};

// Export config constants
export const API_URL = getEnvVariable("VITE_API_URL", "http://localhost:3000");
export const ML_SERVICE_URL = getEnvVariable(
  "VITE_ML_SERVICE_URL",
  "http://localhost:5000"
);
export const NODE_ENV = getEnvVariable("VITE_NODE_ENV", "development");

// Helper function untuk construct full API endpoint
export const getApiEndpoint = (path) => {
  const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Helper untuk construct image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return getApiEndpoint(imagePath);
};

export default {
  API_URL,
  ML_SERVICE_URL,
  NODE_ENV,
  getApiEndpoint,
  getImageUrl,
};

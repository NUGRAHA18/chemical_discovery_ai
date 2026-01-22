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

export const BACKEND_URL = getEnvVariable(
  "REACT_APP_BACKEND_URL",
  "http://localhost:3010",
);

export const API_URL = getEnvVariable("API_URL", "http://localhost:3010/api");
export const SOCKET_URL = getEnvVariable("SOCKET_URL", "http://localhost:3010");
export const ML_SERVICE_URL = getEnvVariable(
  "ML_SERVICE_URL",
  "http://localhost:5000",
);
export const NODE_ENV = getEnvVariable("NODE_ENV", "development");
export const getApiEndpoint = (path) => {
  const baseUrl = API_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "/assets/placeholder-molecule.png";

  let cleanPath = imagePath
    .replace(/^undefined\//, "")
    .replace(/^null\//, "")
    .replace("undefined/", "")
    .trim();

  if (cleanPath.match(/http:\/\/localhost:\d+/)) {
    const cleanBackend = BACKEND_URL.replace(/\/$/, "");
    return cleanPath.replace(/http:\/\/localhost:\d+/, cleanBackend);
  }
  if (cleanPath.startsWith("https://")) {
    return cleanPath;
  }
  if (cleanPath.startsWith("http://")) {
    return cleanPath;
  }

  const cleanBase = BACKEND_URL.replace(/\/$/, "");
  const finalPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${cleanBase}${finalPath}`;
};

export const getFavoriteImageUrl = (imagePath) => {
  if (!imagePath) return "";
  let finalUrl = imagePath;
  if (finalUrl.includes("localhost:3000")) {
    const cleanBackend = BACKEND_URL.replace(/\/$/, "");
    finalUrl = finalUrl.replace("http://localhost:3000", cleanBackend);
  }
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

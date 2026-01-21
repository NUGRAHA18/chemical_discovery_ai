import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // --- LOGIC PERBAIKAN DI SINI ---

    // Ambil URL request yang menyebabkan error
    const requestUrl = error.config?.url || "";

    // Cek apakah request tersebut mengarah ke endpoint auth (login/register)
    // Sesuaikan string ini dengan endpoint backend kamu, misalnya "/auth/login" atau "/users/login"
    const isAuthRequest =
      requestUrl.includes("/login") ||
      requestUrl.includes("/register") ||
      requestUrl.includes("/auth");

    // JIKA ini adalah request Login/Register, JANGAN lakukan redirect global.
    // Langsung reject promise agar LoginForm bisa menangkap errornya.
    if (isAuthRequest) {
      return Promise.reject(error);
    }

    // --- LOGIC SESSION EXPIRED (Hanya untuk request selain Login) ---
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login?session=expired";
    }

    return Promise.reject(error);
  },
);

export default api;

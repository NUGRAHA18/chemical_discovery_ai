import api from "./api";

export const discoveryService = {
  createDiscovery: async (data) => {
    // TAMBAHKAN CONFIG TIMEOUT DI SINI
    // timeout: 600000 ms = 10 menit (Cukup untuk menunggu Gemini yang sedang limit)
    const response = await api.post("/discover", data, {
      timeout: 600000,
    });
    return response.data;
  },

  getHistory: async (params = {}) => {
    const { page = 1, limit = 10, search = "" } = params;
    const response = await api.get("/history", {
      params: { page, limit, search },
    });
    return response.data;
  },

  getDiscovery: async (id) => {
    const response = await api.get(`/history/${id}`);
    return response.data;
  },

  deleteDiscovery: async (id) => {
    const response = await api.delete(`/history/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/history/stats");
    return response.data;
  },

  exportJSON: async (discoveryId) => {
    const response = await api.post(
      "/export/json",
      { discoveryId },
      {
        responseType: "blob",
      },
    );
    return response.data;
  },

  exportCSV: async (discoveryId) => {
    const response = await api.post(
      "/export/csv",
      { discoveryId },
      {
        responseType: "blob",
      },
    );
    return response.data;
  },
};

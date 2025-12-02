import api from "./api";

export const discoveryService = {
  createDiscovery: async (data) => {
    const response = await api.post("/discover", data);
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
      }
    );
    return response.data;
  },

  exportCSV: async (discoveryId) => {
    const response = await api.post(
      "/export/csv",
      { discoveryId },
      {
        responseType: "blob",
      }
    );
    return response.data;
  },
};

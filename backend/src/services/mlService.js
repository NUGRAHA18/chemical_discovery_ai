const axios = require("axios");

const FLASK_URL = process.env.FLASK_ML_URL || "http://localhost:5000";

const mlService = {
  discover: async (criteria) => {
    try {
      const response = await axios.post(
        `${FLASK_URL}/api/discover`,
        {
          criteria,
        },
        {
          timeout: 180000,
          headers: { "Content-Type": "application/json" },
        }
      );

      return response.data;
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        throw new Error("ML service unavailable");
      }
      if (error.response) {
        throw new Error(error.response.data.error || "ML service error");
      }
      throw error;
    }
  },

  healthCheck: async () => {
    try {
      const response = await axios.get(`${FLASK_URL}/api/health`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      return { status: "unhealthy", error: error.message };
    }
  },
};

module.exports = mlService;

const axios = require("axios");
const { emitProgress, emitLog } = require("../config/socket");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5000";

exports.discover = async (requestData, userId = null) => {
  try {
    console.log("📡 Calling ML service:", ML_SERVICE_URL);

    // Emit initial progress
    if (userId) {
      emitLog(userId, {
        type: "info",
        message: "🔍 ML Service received request",
        agent: "ML Service",
      });
    }

    const response = await axios.post(
      `${ML_SERVICE_URL}/api/discover`,
      requestData,
      {
        timeout: 120000, // 2 minutes
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId || "anonymous", // Pass userId to ML service
        },
      }
    );

    console.log("✅ ML service response received");

    if (userId) {
      emitLog(userId, {
        type: "success",
        message: "✅ ML Service completed processing",
        agent: "ML Service",
      });
    }

    return response.data;
  } catch (error) {
    console.error("❌ ML service error:", error.message);

    if (userId) {
      emitLog(userId, {
        type: "error",
        message: `❌ ML Service error: ${error.message}`,
        agent: "ML Service",
      });
    }

    if (error.response) {
      throw new Error(
        `ML Service error: ${error.response.data?.error || error.message}`
      );
    } else if (error.code === "ECONNREFUSED") {
      throw new Error(
        "ML Service unavailable. Please ensure Python service is running."
      );
    } else if (error.code === "ETIMEDOUT") {
      throw new Error("ML Service timeout. Request took too long.");
    } else {
      throw new Error(`ML Service error: ${error.message}`);
    }
  }
};

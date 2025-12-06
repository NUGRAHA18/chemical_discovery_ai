const express = require("express");
const router = express.Router();
const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5000";

// Calculate properties endpoint
router.post("/calculate-properties", async (req, res) => {
  try {
    const { smiles } = req.body;

    if (!smiles) {
      return res.status(400).json({
        success: false,
        error: "SMILES notation is required",
      });
    }

    console.log("Calculating properties for:", smiles);

    // Call ML service to calculate properties
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/calculate-properties`,
      { smiles },
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    res.json({
      success: true,
      properties: response.data.properties,
    });
  } catch (error) {
    console.error("Property calculation error:", error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error || "Failed to calculate properties",
    });
  }
});

module.exports = router;

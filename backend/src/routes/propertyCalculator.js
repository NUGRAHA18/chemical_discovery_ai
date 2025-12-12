const express = require("express");
const router = express.Router();
const axios = require("axios");
const { getCached, setCache } = require("../config/redis");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5000";

// Calculate properties endpoint with Redis caching
router.post("/calculate-properties", async (req, res) => {
  try {
    const { smiles } = req.body;

    if (!smiles) {
      return res.status(400).json({
        success: false,
        error: "SMILES notation is required",
      });
    }

    // ✅ CHECK CACHE FIRST
    const cacheKey = `properties:${smiles}`;
    const cached = await getCached(cacheKey);

    if (cached) {
      console.log(`✅ Cache HIT: Properties for ${smiles}`);
      return res.json({
        success: true,
        properties: cached,
        fromCache: true, // ✅ Indicator from cache
      });
    }

    console.log(`❌ Cache MISS: Calculating properties for ${smiles}`);

    // ✅ CALL ML SERVICE
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/calculate-properties`,
      { smiles },
      {
        timeout: 30000, // 30 seconds timeout
        headers: { "Content-Type": "application/json" },
      }
    );

    const properties = response.data.properties;

    // ✅ CACHE RESULT (30 days - properties never change for same SMILES)
    await setCache(cacheKey, properties, 86400 * 30);

    res.json({
      success: true,
      properties: properties,
      fromCache: false, // ✅ Fresh calculation
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

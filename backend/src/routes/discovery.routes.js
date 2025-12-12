const express = require("express");
const router = express.Router();
const discoveryController = require("../controllers/discoveryController");
const { protect } = require("../middleware/auth");
const { discoveryValidation } = require("../middleware/validators");
const { deleteCachePattern } = require("../config/redis");

// POST /api/discover - Create new discovery
router.post(
  "/",
  protect,
  discoveryValidation,
  async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to invalidate cache after success
    res.json = async (data) => {
      if (data.success) {
        // ✅ INVALIDATE HISTORY CACHE after new discovery
        console.log("🗑️ Invalidating history cache...");
        await deleteCachePattern("cache:/api/history*");
        console.log("✅ History cache invalidated");
      }
      return originalJson(data);
    };

    next();
  },
  discoveryController.createDiscovery
);

// GET /api/discover/:id - Get single discovery
router.get("/:id", protect, discoveryController.getDiscovery);

// DELETE /api/discover/:id - Delete discovery
router.delete(
  "/:id",
  protect,
  async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to invalidate cache after success
    res.json = async (data) => {
      if (data.success) {
        // ✅ INVALIDATE HISTORY CACHE after deletion
        console.log("🗑️ Invalidating history cache...");
        await deleteCachePattern("cache:/api/history*");
        console.log("✅ History cache invalidated");
      }
      return originalJson(data);
    };

    next();
  },
  discoveryController.deleteDiscovery
);

module.exports = router;

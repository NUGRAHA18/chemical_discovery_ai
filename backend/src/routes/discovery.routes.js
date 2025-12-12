const express = require("express");
const router = express.Router();
const discoveryController = require("../controllers/discoveryController");
const { protect } = require("../middleware/auth");
const { discoveryValidation } = require("../middleware/validators");
const { deleteCachePattern } = require("../config/redis");

router.post(
  "/",
  protect,
  discoveryValidation,
  async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      if (data.success) {
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

router.get("/:id", protect, discoveryController.getDiscovery);

router.delete(
  "/:id",
  protect,
  async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      if (data.success) {
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

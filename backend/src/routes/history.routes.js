const express = require("express");
const router = express.Router();
const historyController = require("../controllers/historyController");
// ✅ FIX: Import discoveryController yang berisi getDiscovery
const discoveryController = require("../controllers/discoveryController");
const { protect } = require("../middleware/auth");
const { cacheMiddleware } = require("../config/redis");

// GET /api/history - with 5 min cache
router.get(
  "/",
  protect,
  cacheMiddleware(300), // 5 minutes cache
  historyController.getHistory
);

// GET /api/history/stats - with 5 min cache
router.get(
  "/stats",
  protect,
  cacheMiddleware(300), // 5 minutes cache
  historyController.getStats
);

// 🚀 FIX KRITIS: Tambahkan route untuk GET /api/history/:id
router.get(
  "/:id",
  protect, // Middleware autentikasi
  discoveryController.getDiscovery
);

module.exports = router;

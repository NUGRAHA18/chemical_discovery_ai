const express = require("express");
const router = express.Router();
const historyController = require("../controllers/historyController");
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

// ✅ NO DELETE ROUTE HERE - delete ada di discovery.routes.js

module.exports = router;

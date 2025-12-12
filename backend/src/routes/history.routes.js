const express = require("express");
const router = express.Router();
const historyController = require("../controllers/historyController");
const discoveryController = require("../controllers/discoveryController");
const { protect } = require("../middleware/auth");
const { cacheMiddleware } = require("../config/redis");

router.get("/", protect, cacheMiddleware(300), historyController.getHistory);

router.get("/stats", protect, cacheMiddleware(300), historyController.getStats);

router.get("/:id", protect, discoveryController.getDiscovery);

module.exports = router;

const express = require("express");
const router = express.Router();
const { emitProgress, emitLog } = require("../config/socket");

// Internal endpoint for ML service to emit progress
router.post("/progress", (req, res) => {
  try {
    const { userId, step, progress, message, agent } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    emitProgress(userId, { step, progress, message, agent });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Internal endpoint for ML service to emit logs
router.post("/log", (req, res) => {
  try {
    const { userId, type, message, agent } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    emitLog(userId, { type, message, agent });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { protect } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

const protectSSE = async (req, res, next) => {
  try {
    let token = req.query.token;

    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace("Bearer ", "");
    }

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id || decoded.userId }; //debug
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

router.post(
  "/send",
  protect,
  [
    body("message")
      .trim()
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ max: 2000 })
      .withMessage("Message too long (max 2000 characters)"),
    body("discoveryId")
      .optional({ nullable: true, checkFalsy: true })
      .isMongoId()
      .withMessage("Invalid discovery ID"),
  ],
  validate,
  chatController.sendMessage
);

router.get("/stream/:sessionId", protectSSE, chatController.streamResponse);

router.get("/history", protect, chatController.getHistory);

router.delete("/history", protect, chatController.clearHistory);

router.delete("/session/:sessionId", protect, chatController.deleteSession);

module.exports = router;

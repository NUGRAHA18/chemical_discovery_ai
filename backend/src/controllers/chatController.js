const ChatMessage = require("../models/ChatMessage");
const Discovery = require("../models/Discovery");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const chatController = {
  sendMessage: async (req, res) => {
    try {
      const { message, discoveryId } = req.body;
      const userId = req.user.id;

      if (!message || message.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "Message is required",
        });
      }

      const sessionId = uuidv4();

      let context = {};
      if (discoveryId) {
        const discovery = await Discovery.findOne({
          _id: discoveryId,
          userId,
        });
        if (discovery) {
          context.discoveryId = discoveryId;
          context.discoveryData = {
            criteria: discovery.criteria,
            compounds: discovery.compounds.map((c) => ({
              name: c.name,
              formula: c.formula,
              properties: c.properties,
            })),
          };
        }
      }

      const userMessage = await ChatMessage.create({
        userId,
        sessionId,
        role: "user",
        message: message.trim(),
        context,
      });

      res.json({
        success: true,
        sessionId,
        messageId: userMessage._id,
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send message",
      });
    }
  },

  streamResponse: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      console.log("Stream requested for Session ID:", sessionId);
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }

      const userMessage = await ChatMessage.findOne({
        sessionId,
        userId,
        role: "user",
      }).populate("context.discoveryId");

      if (!userMessage) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
        });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.flushHeaders();

      const flaskUrl = process.env.ML_SERVICE_URL || "http://localhost:5000";

      try {
        const flaskResponse = await axios.post(
          `${flaskUrl}/api/chat-stream`,
          {
            message: userMessage.message,
            context: userMessage.context,
            userId: userId.toString(),
          },
          {
            responseType: "stream",
            timeout: 60000,
          }
        );

        let fullResponse = "";
        const startTime = Date.now();

        flaskResponse.data.on("data", (chunk) => {
          const text = chunk.toString();
          res.write(text);

          const lines = text.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data !== "[DONE]") {
                fullResponse += data;
              }
            }
          }
        });

        flaskResponse.data.on("end", async () => {
          const responseTime = Date.now() - startTime;

          await ChatMessage.create({
            userId,
            sessionId,
            role: "assistant",
            message: fullResponse,
            metadata: {
              responseTime,
              model: "gemini-2.0-flash-exp",
            },
          });

          res.write(`data: [DONE]\n\n`);
          res.end();
        });

        flaskResponse.data.on("error", (error) => {
          console.error("Flask stream error:", error);
          res.write(`data: [ERROR]\n\n`);
          res.end();
        });
      } catch (flaskError) {
        console.error("Flask connection error:", flaskError);
        res.write(`data: [ERROR] Failed to connect to AI service\n\n`);
        res.end();
      }
    } catch (error) {
      console.error("Stream response error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Failed to stream response",
        });
      }
    }
  },

  getHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 50, page = 1 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const messages = await ChatMessage.find({ userId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .populate("context.discoveryId", "criteria compounds");

      const total = await ChatMessage.countDocuments({ userId });
      const groupedBySession = messages.reduce((acc, msg) => {
        if (!acc[msg.sessionId]) {
          acc[msg.sessionId] = [];
        }
        acc[msg.sessionId].push(msg);
        return acc;
      }, {});

      const sessions = Object.keys(groupedBySession).map((sessionId) => ({
        sessionId,
        messages: groupedBySession[sessionId].sort(
          (a, b) => a.createdAt - b.createdAt
        ),
      }));

      res.json({
        success: true,
        sessions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get history error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get chat history",
      });
    }
  },

  clearHistory: async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await ChatMessage.deleteMany({ userId });

      res.json({
        success: true,
        deletedCount: result.deletedCount,
        message: "Chat history cleared successfully",
      });
    } catch (error) {
      console.error("Clear history error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear chat history",
      });
    }
  },

  deleteSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      const result = await ChatMessage.deleteMany({ sessionId, userId });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
        });
      }

      res.json({
        success: true,
        deletedCount: result.deletedCount,
        message: "Session deleted successfully",
      });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete session",
      });
    }
  },
};

module.exports = chatController;

const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    context: {
      discoveryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Discovery",
      },
      discoveryData: {
        criteria: String,
        compounds: Array,
      },
    },
    metadata: {
      responseTime: Number,
      tokenCount: Number,
      model: String,
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);

const mongoose = require("mongoose");

const batchItemSchema = new mongoose.Schema(
  {
    rowNumber: {
      type: Number,
      required: true,
    },
    criteria: {
      type: String,
      required: true,
    },
    structuredData: {
      type: Object,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    discoveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discovery",
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    processingTime: {
      type: Number, // milliseconds
      default: null,
    },
  },
  { _id: false }
);

const batchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Batch info
    name: {
      type: String,
      default: "Untitled Batch",
    },
    description: {
      type: String,
      default: "",
    },

    // File info
    filename: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["csv", "xlsx", "xls"],
      default: "csv",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
    },
    totalItems: {
      type: Number,
      required: true,
    },
    // ✅ FIX PROGRESS
    progress: {
      completed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      total: { type: Number, required: true, default: 0 }, // ✅ ADD DEFAULT
      percentage: { type: Number, default: 0 },
    },
    fileType: {
      type: String,
      enum: ["csv", "xlsx", "xls"],
      required: true,
    },
    totalItems: {
      type: Number,
      required: true,
    },

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    progress: {
      completed: {
        type: Number,
        default: 0,
      },
      failed: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        required: true,
      },
      percentage: {
        type: Number,
        default: 0,
      },
    },

    // Items
    items: [batchItemSchema],

    // Timing
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
batchSchema.index({ userId: 1, createdAt: -1 });
batchSchema.index({ status: 1, createdAt: -1 });

// Methods
batchSchema.methods.updateProgress = function () {
  const completed = this.items.filter(
    (item) => item.status === "completed"
  ).length;
  const failed = this.items.filter((item) => item.status === "failed").length;
  const total = this.items.length;
  const percentage =
    total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;

  this.progress = {
    completed,
    failed,
    total,
    percentage,
  };

  // Update batch status
  if (completed + failed === total) {
    this.status = failed === total ? "failed" : "completed";
    this.completedAt = new Date();
  } else if (completed + failed > 0) {
    this.status = "processing";
  }

  return this.save();
};

module.exports = mongoose.model("Batch", batchSchema);

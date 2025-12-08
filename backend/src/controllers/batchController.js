const Batch = require("../models/batch");
const Discovery = require("../models/Discovery");
const mlService = require("../services/mlService");
const batchService = require("../services/batchService");

/**
 * Upload and create batch
 * POST /api/batch/upload
 */
exports.uploadBatch = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const { name, description } = req.body;
    const file = req.file;

    // Validate file type
    const fileType = file.originalname.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(fileType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid file type. Only CSV and Excel files are supported.",
      });
    }

    // Parse file
    let rows;
    try {
      if (fileType === "csv") {
        rows = await batchService.parseCSV(file.buffer);
      } else {
        rows = batchService.parseExcel(file.buffer);
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: `Failed to parse file: ${error.message}`,
      });
    }

    // Validate data
    const validation = batchService.validateBatchData(rows);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: "File validation failed",
        details: validation.errors,
      });
    }

    // Process items
    const items = batchService.processBatchItems(rows);

    // Create batch record
    const batch = new Batch({
      userId: req.user._id,
      name: name || `Batch ${new Date().toLocaleDateString()}`,
      description: description || "",
      filename: file.originalname,
      fileType,
      totalItems: items.length,
      progress: {
        completed: 0,
        failed: 0,
        total: items.length,
        percentage: 0,
      },
      items,
      status: "pending",
    });

    await batch.save();

    // Start processing asynchronously (don't await)
    processBatchAsync(batch._id, req.user._id);

    res.json({
      success: true,
      batchId: batch._id,
      totalItems: items.length,
      message: "Batch queued for processing",
    });
  } catch (error) {
    console.error("Upload batch error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Async batch processing (runs in background)
 */
async function processBatchAsync(batchId, userId) {
  try {
    const batch = await Batch.findById(batchId);
    if (!batch) return;

    batch.status = "processing";
    batch.startedAt = new Date();
    await batch.save();

    // Process each item sequentially (to avoid quota issues)
    for (let i = 0; i < batch.items.length; i++) {
      const item = batch.items[i];

      if (batch.status === "cancelled") {
        break; // Stop if batch was cancelled
      }

      const startTime = Date.now();

      try {
        // Update item status to processing
        item.status = "processing";
        await batch.save();

        // Call ML service
        const mlResult = await mlService.discover(item.criteria);

        if (mlResult.status !== "success") {
          throw new Error(mlResult.error || "ML processing failed");
        }

        // Create discovery record
        const discovery = new Discovery({
          userId,
          batchId,
          inputMode: item.structuredData ? "structured" : "ai-prompt",
          structuredData: item.structuredData,
          criteria: item.criteria,
          preprocessingAnalysis: mlResult.preprocessing_analysis || {},
          analysis: mlResult.analysis || "",
          research: mlResult.research || "",
          compounds: mlResult.compounds || [],
          validation: mlResult.validation || {},
          justification: mlResult.justification || "",
          metadata: mlResult.metadata || {},
        });

        await discovery.save();

        // Update item with success
        item.status = "completed";
        item.discoveryId = discovery._id;
        item.processingTime = Date.now() - startTime;
      } catch (error) {
        console.error(`Batch item ${item.rowNumber} failed:`, error);

        // Update item with error
        item.status = "failed";
        item.error = error.message;
        item.processingTime = Date.now() - startTime;
      }

      // Update progress
      await batch.updateProgress();
    }
  } catch (error) {
    console.error("Batch processing error:", error);

    // Mark batch as failed
    const batch = await Batch.findById(batchId);
    if (batch) {
      batch.status = "failed";
      await batch.save();
    }
  }
}

/**
 * Get batch by ID
 * GET /api/batch/:id
 */
exports.getBatch = async (req, res) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate("items.discoveryId", "compounds criteria");

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: "Batch not found",
      });
    }

    res.json({
      success: true,
      batch,
    });
  } catch (error) {
    console.error("Get batch error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get all batches for user
 * GET /api/batch
 */
exports.getBatches = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const batches = await Batch.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-items"); // Exclude items for list view

    const count = await Batch.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      batches,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error("Get batches error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Cancel batch processing
 * POST /api/batch/:id/cancel
 */
exports.cancelBatch = async (req, res) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: "Batch not found",
      });
    }

    if (batch.status === "completed") {
      return res.status(400).json({
        success: false,
        error: "Cannot cancel completed batch",
      });
    }

    batch.status = "cancelled";
    batch.completedAt = new Date();
    await batch.save();

    res.json({
      success: true,
      message: "Batch cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel batch error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Delete batch
 * DELETE /api/batch/:id
 */
exports.deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: "Batch not found",
      });
    }

    // Delete associated discoveries
    await Discovery.deleteMany({ batchId: batch._id });

    // Delete batch
    await batch.deleteOne();

    res.json({
      success: true,
      message: "Batch deleted successfully",
    });
  } catch (error) {
    console.error("Delete batch error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * SSE endpoint for progress tracking
 * GET /api/batch/:id/progress
 */
exports.streamProgress = async (req, res) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: "Batch not found",
      });
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send initial status
    const sendProgress = async () => {
      const currentBatch = await Batch.findById(req.params.id);

      if (currentBatch) {
        const data = {
          status: currentBatch.status,
          progress: currentBatch.progress,
          startedAt: currentBatch.startedAt,
          completedAt: currentBatch.completedAt,
        };

        res.write(`data: ${JSON.stringify(data)}\n\n`);

        // If completed, stop streaming
        if (
          currentBatch.status === "completed" ||
          currentBatch.status === "failed" ||
          currentBatch.status === "cancelled"
        ) {
          res.write("data: [DONE]\n\n");
          res.end();
          return true;
        }
      }

      return false;
    };

    // Send immediately
    const done = await sendProgress();

    if (!done) {
      // Poll every 2 seconds
      const interval = setInterval(async () => {
        const done = await sendProgress();
        if (done) {
          clearInterval(interval);
        }
      }, 2000);

      // Cleanup on client disconnect
      req.on("close", () => {
        clearInterval(interval);
      });
    }
  } catch (error) {
    console.error("Stream progress error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = exports;

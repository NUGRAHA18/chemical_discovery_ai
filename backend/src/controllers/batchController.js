const Batch = require("../models/Batch");
const Discovery = require("../models/Discovery");
const mlService = require("../services/mlService");
const {
  validateCSVData,
  validateExcelData,
  parseStructuredRow,
} = require("../services/batchService");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

/**
 * Save base64 image to file system
 */
async function saveBase64Image(base64String, prefix = "discovery") {
  try {
    if (!base64String || typeof base64String !== "string") {
      return null;
    }

    // Extract base64 data
    const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      console.warn("Invalid base64 image format");
      return null;
    }

    const imageBuffer = Buffer.from(matches[2], "base64");
    const filename = `${prefix}-${uuidv4()}.png`;
    const filepath = path.join(
      __dirname,
      "../../public/images/structures",
      filename
    );

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Process and save image
    await sharp(imageBuffer)
      .resize(300, 300, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png({ quality: 90 })
      .toFile(filepath);

    return `/images/structures/${filename}`;
  } catch (error) {
    console.error("Error saving image:", error);
    return null;
  }
}

/**
 * Upload batch file and create batch record
 */
exports.uploadBatch = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { name, description } = req.body;
    const userId = req.user._id;

    // Validate file
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let items = [];

    if (fileExt === ".csv") {
      items = await validateCSVData(req.file.buffer);
    } else if ([".xlsx", ".xls"].includes(fileExt)) {
      items = await validateExcelData(req.file.buffer);
    } else {
      return res.status(400).json({ error: "Invalid file format" });
    }

    if (items.length === 0) {
      return res.status(400).json({ error: "No valid items found in file" });
    }

    if (items.length > 100) {
      return res.status(400).json({ error: "Maximum 100 items per batch" });
    }

    // Create batch
    const batch = new Batch({
      userId,
      name: name || req.file.originalname,
      description: description || "",
      filename: req.file.originalname,
      totalItems: items.length,
      // ✅ ADD THESE
      fileType: fileExt.replace(".", ""), // csv, xlsx, xls
      progress: {
        completed: 0,
        failed: 0,
        total: items.length, // ✅ SET TOTAL
        percentage: 0,
      },
      items: items.map((item, index) => ({
        rowNumber: index + 1,
        criteria: item.criteria,
        structuredData: item.structuredData || null,
        status: "pending",
      })),
    });

    await batch.save();

    // Start processing asynchronously
    processBatchAsync(batch._id, userId).catch((err) =>
      console.error("Batch processing error:", err)
    );

    res.status(200).json({
      success: true,
      batchId: batch._id,
      totalItems: batch.totalItems,
      message: "Batch uploaded successfully and queued for processing",
    });
  } catch (error) {
    console.error("Upload batch error:", error);
    res.status(500).json({
      error: error.message || "Failed to upload batch",
    });
  }
};

/**
 * Process batch items asynchronously with proper image handling
 */
async function processBatchAsync(batchId, userId) {
  try {
    const batch = await Batch.findById(batchId);
    if (!batch) return;

    batch.status = "processing";
    batch.startedAt = new Date();
    await batch.save();

    // Process each item sequentially
    for (let i = 0; i < batch.items.length; i++) {
      const item = batch.items[i];

      if (batch.status === "cancelled") {
        break;
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

        // ✅ CREATE DISCOVERY WITH EMPTY COMPOUNDS FIRST
        const discovery = new Discovery({
          userId,
          batchId,
          inputMode: item.structuredData ? "structured" : "ai-prompt",
          structuredData: item.structuredData,
          criteria: item.criteria,
          preprocessingAnalysis: {
            extractedConcepts:
              mlResult.preprocessing_analysis?.extracted_concepts || {},
            searchTermsUsed:
              mlResult.preprocessing_analysis?.search_terms_used || [],
            confidenceScore:
              mlResult.preprocessing_analysis?.confidence_score || 0,
          },
          analysis: mlResult.analysis || "Analysis not available",
          research: mlResult.research_insights || "Research not available",
          compounds: [], // Empty for now
          validation: mlResult.validation || {},
          justification:
            mlResult.justification || "Justification not available",
          metadata: mlResult.metadata || {},
        });

        // ✅ SAVE to get _id
        await discovery.save();
        console.log(
          `Discovery saved with ID: ${discovery._id} for batch item ${item.rowNumber}`
        );

        // ✅ PROCESS COMPOUNDS WITH IMAGES
        const processedCompounds = await Promise.all(
          (mlResult.compounds || []).map(async (compound, index) => {
            try {
              // Save structure image if available
              let structureImage = null;
              if (compound.structure_image) {
                structureImage = await saveBase64Image(
                  compound.structure_image,
                  `${discovery._id}-${index}`
                );
                console.log(
                  `Image saved for compound ${index}:`,
                  structureImage
                );
              }

              return {
                name: compound.name || "Unknown Compound",
                formula: compound.formula || "N/A",
                smiles: compound.smiles || "",
                properties: compound.properties || {},
                base_compound: compound.base_compound || "",
                modifications: compound.modifications || "",
                molecular_weight:
                  compound.calculated_properties?.molecular_weight ||
                  compound.molecular_weight ||
                  null,
                logp:
                  compound.calculated_properties?.logp || compound.logp || null,
                structure_image: structureImage,
                validation_score: compound.validation_score || 0.5,
                feasibility_notes: compound.feasibility_notes || "",
              };
            } catch (compoundError) {
              console.error(
                `Error processing compound ${index}:`,
                compoundError
              );
              return {
                name: compound.name || "Unknown Compound",
                formula: compound.formula || "N/A",
                smiles: compound.smiles || "",
                properties: compound.properties || {},
                base_compound: compound.base_compound || "",
                modifications: compound.modifications || "",
                molecular_weight: null,
                logp: null,
                structure_image: null,
                validation_score: 0.5,
                feasibility_notes: "",
              };
            }
          })
        );

        // ✅ UPDATE DISCOVERY WITH PROCESSED COMPOUNDS
        discovery.compounds = processedCompounds;
        await discovery.save();

        console.log(
          `Discovery ${discovery._id} updated with ${processedCompounds.length} compounds`
        );

        // ✅ UPDATE BATCH ITEM WITH SUCCESS
        item.status = "completed";
        item.discoveryId = discovery._id;
        item.processingTime = Date.now() - startTime;
      } catch (error) {
        console.error(`Batch item ${item.rowNumber} failed:`, error);

        item.status = "failed";
        item.error = error.message;
        item.processingTime = Date.now() - startTime;
      }

      // Update progress
      await batch.updateProgress();
    }

    // Mark batch as completed or failed
    const finalBatch = await Batch.findById(batchId);
    if (finalBatch) {
      const allCompleted = finalBatch.items.every(
        (i) => i.status === "completed"
      );
      const anyFailed = finalBatch.items.some((i) => i.status === "failed");

      if (allCompleted) {
        finalBatch.status = "completed";
      } else if (anyFailed && !allCompleted) {
        finalBatch.status = "completed"; // Partial completion
      }

      finalBatch.completedAt = new Date();
      await finalBatch.save();
    }
  } catch (error) {
    console.error("Batch processing error:", error);

    const batch = await Batch.findById(batchId);
    if (batch) {
      batch.status = "failed";
      await batch.save();
    }
  }
}

/**
 * Get all batches for user
 */
exports.getBatches = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const batches = await Batch.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Batch.countDocuments(query);

    res.json({
      success: true,
      batches,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get batches error:", error);
    res.status(500).json({ error: "Failed to fetch batches" });
  }
};

/**
 * Get batch details
 */
exports.getBatchDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const batch = await Batch.findOne({ _id: id, userId }).lean();

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json({
      success: true,
      batch,
    });
  } catch (error) {
    console.error("Get batch details error:", error);
    res.status(500).json({ error: "Failed to fetch batch details" });
  }
};

/**
 * SSE endpoint for real-time batch progress
 */
exports.streamBatchProgress = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ status: "connected" })}\n\n`);

  // Poll batch status
  const interval = setInterval(async () => {
    try {
      const batch = await Batch.findOne({ _id: id, userId }).lean();

      if (!batch) {
        res.write(`data: ${JSON.stringify({ error: "Batch not found" })}\n\n`);
        clearInterval(interval);
        res.end();
        return;
      }

      const update = {
        status: batch.status,
        progress: batch.progress,
        items: batch.items.map((item) => ({
          rowNumber: item.rowNumber,
          status: item.status,
          error: item.error,
          processingTime: item.processingTime,
        })),
      };

      res.write(`data: ${JSON.stringify(update)}\n\n`);

      // Stop if batch completed/failed/cancelled
      if (["completed", "failed", "cancelled"].includes(batch.status)) {
        clearInterval(interval);
        res.end();
      }
    } catch (error) {
      console.error("SSE error:", error);
      res.write(`data: ${JSON.stringify({ error: "Internal error" })}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 2000); // Poll every 2 seconds

  // Cleanup on client disconnect
  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
};

/**
 * Cancel batch processing
 */
exports.cancelBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const batch = await Batch.findOne({ _id: id, userId });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    if (batch.status === "completed") {
      return res.status(400).json({ error: "Cannot cancel completed batch" });
    }

    batch.status = "cancelled";
    await batch.save();

    res.json({
      success: true,
      message: "Batch cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel batch error:", error);
    res.status(500).json({ error: "Failed to cancel batch" });
  }
};

/**
 * Delete batch
 */
exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const batch = await Batch.findOne({ _id: id, userId });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Delete associated discoveries
    await Discovery.deleteMany({ batchId: id });

    // Delete batch
    await Batch.deleteOne({ _id: id });

    res.json({
      success: true,
      message: "Batch and associated discoveries deleted successfully",
    });
  } catch (error) {
    console.error("Delete batch error:", error);
    res.status(500).json({ error: "Failed to delete batch" });
  }
};

/**
 * Download batch results as CSV
 */
exports.exportBatchResults = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const batch = await Batch.findOne({ _id: id, userId }).lean();

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Generate CSV
    const csvRows = [
      [
        "Row",
        "Criteria",
        "Status",
        "Compounds",
        "Processing Time (s)",
        "Error",
      ],
    ];

    batch.items.forEach((item) => {
      csvRows.push([
        item.rowNumber,
        `"${item.criteria.replace(/"/g, '""')}"`,
        item.status,
        item.status === "completed" ? 3 : 0,
        item.processingTime ? (item.processingTime / 1000).toFixed(1) : "",
        item.error ? `"${item.error.replace(/"/g, '""')}"` : "",
      ]);
    });

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="batch-${batch.name}-results.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    console.error("Export batch error:", error);
    res.status(500).json({ error: "Failed to export batch results" });
  }
};

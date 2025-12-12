const Discovery = require("../models/Discovery");
const mlService = require("../services/mlService");
const { saveBase64Image } = require("../utils/imageUtils");
const {
  buildCriteriaFromStructured,
  validateStructuredData,
} = require("../utils/criteriaBuilder");
const { emitProgress, emitLog } = require("../config/socket");

exports.createDiscovery = async (req, res) => {
  try {
    const userId = req.user._id;
    const { criteria, inputMode, structuredData } = req.body;
    let finalCriteria = criteria;
    let processedStructuredData = null;
    let actualInputMode = inputMode || "ai-prompt";

    emitLog(userId, {
      type: "info",
      message: "🚀 Discovery request received",
      agent: "System",
    });

    emitProgress(userId, {
      step: "initializing",
      progress: 0,
      message: "Initializing discovery process...",
      agent: "System",
    });

    if (!inputMode || !["structured", "ai-prompt"].includes(inputMode)) {
      emitLog(userId, {
        type: "error",
        message: "❌ Invalid input mode",
        agent: "System",
      });
      return res.status(400).json({ error: "Invalid input mode" });
    }

    if (actualInputMode === "structured") {
      const validation = validateStructuredData(structuredData);
      if (!validation.valid) {
        return res.status(400).json({
          error: "Invalid structured data",
          details: validation.error,
        });
      }

      finalCriteria = buildCriteriaFromStructured(structuredData);
      processedStructuredData = structuredData;
      console.log("Structured mode - Generated criteria:", finalCriteria);
    } else {
      if (!criteria || criteria.trim().length < 10) {
        return res.status(400).json({
          error: "Criteria must be at least 10 characters",
          inputMode: "ai-prompt",
        });
      }
      finalCriteria = criteria.trim();
      console.log("AI Prompt mode - Direct criteria:", finalCriteria);
    }
    emitLog(userId, {
      type: "info",
      message: "📡 Sending request to ML service...",
      agent: "System",
    });

    emitProgress(userId, {
      step: "preprocessing",
      progress: 5,
      message: "Connecting to ML service...",
      agent: "ML Service",
    });

    console.log("Sending to ML service...");
    const mlResponse = await mlService.discover(
      {
        inputMode,
        structuredData,

        criteria: finalCriteria,
      },
      userId
    );

    emitLog(userId, {
      type: "success",
      message: "✅ ML service completed successfully",
      agent: "System",
    });

    emitProgress(userId, {
      step: "saving",
      progress: 95,
      message: "Saving results to database...",
      agent: "System",
    });

    if (mlResponse.status !== "success") {
      return res.status(500).json({
        error: "ML processing failed",
        details: mlResponse.error,
      });
    }

    console.log(
      `ML service returned ${mlResponse.compounds?.length || 0} compounds`
    );

    const discovery = new Discovery({
      userId: req.user._id,
      inputMode: actualInputMode,
      structuredData: processedStructuredData,
      criteria: finalCriteria,
      preprocessingAnalysis: {
        normalizedInput:
          mlResponse.preprocessing_analysis?.normalized_input || "",
        concepts: mlResponse.preprocessing_analysis?.concepts || {},
        searchTermsUsed:
          mlResponse.preprocessing_analysis?.search_terms_used || [],
        confidenceScore:
          mlResponse.preprocessing_analysis?.confidence_score || 0,
      },
      analysis: mlResponse.analysis || "Analysis not available",
      research: mlResponse.research_insights || "Research not available",
      compounds: [],
      validation: mlResponse.validation || {},
      justification: mlResponse.justification || "Justification not available",
      metadata: mlResponse.metadata || {},
    });

    await discovery.save();
    console.log("Discovery saved with ID:", discovery._id);

    const processedCompounds = await Promise.all(
      (mlResponse.compounds || []).map(async (compound, index) => {
        try {
          let structureImage = null;
          if (compound.structure_image) {
            structureImage = await saveBase64Image(
              compound.structure_image,
              `${discovery._id}-${index}`
            );
            console.log(`Image saved for compound ${index}:`, structureImage);
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
            logp: compound.calculated_properties?.logp || compound.logp || null,
            structure_image: structureImage,
            validation_score: compound.validation_score || 0.5,
            feasibility_notes: compound.feasibility_notes || "",
          };
        } catch (compoundError) {
          console.error(`Error processing compound ${index}:`, compoundError);

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

    discovery.compounds = processedCompounds;
    await discovery.save();

    console.log(
      `Discovery complete with ${processedCompounds.length} compounds`
    );

    emitLog(userId, {
      type: "success",
      message: `✅ Discovery saved! Generated ${processedCompounds.length} compounds`,
      agent: "System",
    });

    emitProgress(userId, {
      step: "complete",
      progress: 100,
      message: "Discovery complete!",
      agent: "System",
      discoveryId: discovery._id,
    });

    const { emitToUser } = require("../config/socket");
    emitToUser(userId, "discovery:complete", {
      discoveryId: discovery._id,
      compounds: processedCompounds.length,
      success: true,
    });

    res.status(201).json({
      success: true,
      discovery: {
        _id: discovery._id,
        userId: discovery.userId,
        inputMode: discovery.inputMode,
        structuredData: discovery.structuredData,
        criteria: discovery.criteria,
        preprocessingAnalysis: discovery.preprocessingAnalysis,
        analysis: discovery.analysis,
        research: discovery.research,
        compounds: discovery.compounds,
        validation: discovery.validation,
        justification: discovery.justification,
        metadata: discovery.metadata,
        createdAt: discovery.createdAt,
        updatedAt: discovery.updatedAt,
      },
    });
  } catch (error) {
    console.error("Discovery error:", error);

    const userId = req.user?._id;
    if (userId) {
      emitLog(userId, {
        type: "error",
        message: `❌ Error: ${error.message}`,
        agent: "System",
      });

      const { emitToUser } = require("../config/socket");
      emitToUser(userId, "discovery:error", {
        error: error.message,
        details: error.stack,
      });
    }

    res.status(500).json({
      error: error.message || "Failed to create discovery",
      details: error.stack,
    });
  }
};

exports.getDiscovery = async (req, res) => {
  try {
    const discovery = await Discovery.findById(req.params.id);

    if (!discovery) {
      return res.status(404).json({ error: "Discovery not found" });
    }

    if (discovery.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      success: true,
      discovery,
    });
  } catch (error) {
    console.error("Get discovery error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDiscovery = async (req, res) => {
  try {
    const discovery = await Discovery.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!discovery) {
      return res.status(404).json({ error: "Discovery not found" });
    }

    const fs = require("fs");
    const path = require("path");

    for (const compound of discovery.compounds) {
      if (compound.structure_image) {
        try {
          const imagePath = path.join(
            __dirname,
            "../../public",
            compound.structure_image
          );
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`Deleted image: ${imagePath}`);
          }
        } catch (deleteError) {
          console.error(`Failed to delete image:`, deleteError);
        }
      }
    }

    await discovery.deleteOne();

    res.json({
      success: true,
      message: "Discovery deleted successfully",
    });
  } catch (error) {
    console.error("Delete discovery error:", error);
    res.status(500).json({ error: error.message });
  }
};

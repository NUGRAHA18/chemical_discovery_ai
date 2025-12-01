const Discovery = require("../models/Discovery");
const mlService = require("../services/mlService");
const imageUtils = require("../utils/imageUtils");

exports.createDiscovery = async (req, res) => {
  try {
    const { criteria, inputMode, structuredData } = req.body;

    let finalCriteria = criteria;
    let processedStructuredData = null;
    let actualInputMode = inputMode || "ai-prompt";

    // HYBRID INPUT HANDLING
    if (actualInputMode === "structured") {
      // Import criteria builder
      const {
        buildCriteriaFromStructured,
        validateStructuredData,
      } = require("../utils/criteriaBuilder");

      // Validate structured data
      const validation = validateStructuredData(structuredData);
      if (!validation.valid) {
        return res.status(400).json({
          error: "Invalid structured data",
          details: validation.error,
        });
      }

      // Convert structured data to criteria string
      finalCriteria = buildCriteriaFromStructured(structuredData);
      processedStructuredData = structuredData;

      console.log("Structured mode - Generated criteria:", finalCriteria);
    } else {
      // AI Prompt mode - use criteria directly
      if (!criteria || criteria.trim().length < 10) {
        return res.status(400).json({
          error: "Criteria must be at least 10 characters",
          inputMode: "ai-prompt",
        });
      }
      finalCriteria = criteria.trim();
      console.log("AI Prompt mode - Direct criteria:", finalCriteria);
    }

    // Send to ML Service
    const mlResult = await mlService.discover(finalCriteria);

    if (mlResult.status !== "success") {
      return res.status(500).json({
        error: "ML processing failed",
        details: mlResult.error,
      });
    }

    // Process images
    const compounds = await Promise.all(
      mlResult.compounds.map(async (compound) => {
        if (compound.structure_image) {
          const savedImagePath = await imageUtils.saveBase64Image(
            compound.structure_image
          );
          return { ...compound, structure_image: savedImagePath };
        }
        return compound;
      })
    );

    // Save to database with hybrid input support
    const discovery = await Discovery.create({
      userId: req.user._id,
      inputMode: actualInputMode,
      structuredData: processedStructuredData, // null if ai-prompt mode
      criteria: finalCriteria, // converted string or direct input
      preprocessingAnalysis: {
        normalizedInput: mlResult.preprocessing_analysis?.normalized_input,
        concepts: mlResult.preprocessing_analysis?.concepts,
        searchTermsUsed: mlResult.preprocessing_analysis?.search_terms_used,
        confidenceScore: mlResult.preprocessing_analysis?.confidence_score,
      },
      analysis: mlResult.analysis,
      research: mlResult.research_insights,
      compounds,
      validation: mlResult.validation,
      justification: mlResult.justification,
      metadata: mlResult.metadata,
    });

    res.status(201).json({
      success: true,
      discovery,
    });
  } catch (error) {
    console.error("Discovery error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getDiscovery = async (req, res) => {
  try {
    const discovery = await Discovery.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!discovery) {
      return res.status(404).json({ error: "Discovery not found" });
    }

    res.json({
      success: true,
      discovery,
    });
  } catch (error) {
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

    for (const compound of discovery.compounds) {
      if (compound.structure_image) {
        await imageUtils.deleteImage(compound.structure_image);
      }
    }

    await discovery.deleteOne();

    res.json({
      success: true,
      message: "Discovery deleted",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

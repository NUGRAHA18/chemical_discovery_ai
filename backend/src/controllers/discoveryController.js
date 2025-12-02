const Discovery = require("../models/Discovery");
const mlService = require("../services/mlService");
const { saveBase64Image } = require("../utils/imageUtils");
const {
  buildCriteriaFromStructured,
  validateStructuredData,
} = require("../utils/criteriaBuilder");

exports.createDiscovery = async (req, res) => {
  try {
    const { criteria, inputMode, structuredData } = req.body;

    let finalCriteria = criteria;
    let processedStructuredData = null;
    let actualInputMode = inputMode || "ai-prompt";

    // === HYBRID INPUT HANDLING ===
    if (actualInputMode === "structured") {
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
      // AI Prompt mode - validate criteria
      if (!criteria || criteria.trim().length < 10) {
        return res.status(400).json({
          error: "Criteria must be at least 10 characters",
          inputMode: "ai-prompt",
        });
      }
      finalCriteria = criteria.trim();
      console.log("AI Prompt mode - Direct criteria:", finalCriteria);
    }

    // === SEND TO ML SERVICE ===
    console.log("Sending to ML service...");
    const mlResult = await mlService.discover(finalCriteria);

    if (mlResult.status !== "success") {
      return res.status(500).json({
        error: "ML processing failed",
        details: mlResult.error,
      });
    }

    console.log(
      `ML service returned ${mlResult.compounds?.length || 0} compounds`
    );

    // === CREATE DISCOVERY FIRST (to get _id) ===
    const discovery = new Discovery({
      userId: req.user._id,
      inputMode: actualInputMode,
      structuredData: processedStructuredData,
      criteria: finalCriteria,
      preprocessingAnalysis: {
        normalizedInput:
          mlResult.preprocessing_analysis?.normalized_input || "",
        concepts: mlResult.preprocessing_analysis?.concepts || {},
        searchTermsUsed:
          mlResult.preprocessing_analysis?.search_terms_used || [],
        confidenceScore: mlResult.preprocessing_analysis?.confidence_score || 0,
      },
      analysis: mlResult.analysis || "Analysis not available",
      research: mlResult.research_insights || "Research not available",
      compounds: [], // Empty for now, will update after processing images
      validation: mlResult.validation || {},
      justification: mlResult.justification || "Justification not available",
      metadata: mlResult.metadata || {},
    });

    // SAVE to get _id
    await discovery.save();
    console.log("Discovery saved with ID:", discovery._id);

    // === PROCESS COMPOUNDS WITH IMAGES ===
    const processedCompounds = await Promise.all(
      (mlResult.compounds || []).map(async (compound, index) => {
        try {
          // Save structure image if available
          let structureImage = null;
          if (compound.structure_image) {
            structureImage = await saveBase64Image(
              compound.structure_image,
              `${discovery._id}-${index}` // NOW _id is defined!
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
          // Return compound without image if processing fails
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

    // === UPDATE DISCOVERY WITH COMPOUNDS ===
    discovery.compounds = processedCompounds;
    await discovery.save();

    console.log(
      `Discovery complete with ${processedCompounds.length} compounds`
    );

    // === RETURN RESPONSE ===
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
    res.status(500).json({
      error: error.message || "Failed to create discovery",
      details: error.stack,
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = { userId: req.user._id };

    // Search in criteria or compound names
    if (search) {
      query.$or = [
        { criteria: { $regex: search, $options: "i" } },
        { "compounds.name": { $regex: search, $options: "i" } },
      ];
    }

    const discoveries = await Discovery.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Discovery.countDocuments(query);

    res.json({
      success: true,
      discoveries,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await Discovery.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalDiscoveries: { $sum: 1 },
          totalCompounds: { $sum: { $size: "$compounds" } },
          avgConfidence: { $avg: "$metadata.overall_confidence" },
        },
      },
    ]);

    if (!stats.length) {
      return res.json({
        success: true,
        totalDiscoveries: 0,
        totalCompounds: 0,
        avgConfidence: 0,
      });
    }

    res.json({
      success: true,
      totalDiscoveries: stats[0].totalDiscoveries,
      totalCompounds: stats[0].totalCompounds,
      avgConfidence: stats[0].avgConfidence || 0,
    });
  } catch (error) {
    console.error("Get stats error:", error);
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

    // Delete associated images
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

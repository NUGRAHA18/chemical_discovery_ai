const Discovery = require("../models/Discovery");

exports.getHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      dateFrom,
      dateTo,
      minMW,
      maxMW,
      minLogP,
      maxLogP,
      minValidation,
      inputMode,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build base query
    const query = { user: req.user.id };

    // 1. TEXT SEARCH - WORD BASED (multiple words)
    if (search) {
      const searchWords = search.trim().split(/\s+/);
      const searchRegex = searchWords.map(
        (word) => new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      );

      // Search in criteria OR compound names
      query.$and = searchRegex.map((regex) => ({
        $or: [{ criteria: regex }, { "compounds.name": regex }],
      }));
    }

    // 2. DATE RANGE
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // 3. INPUT MODE
    if (inputMode && inputMode !== "all") {
      query.inputMode = inputMode;
    }

    // 4. VALIDATION SCORE
    if (minValidation) {
      query["metadata.overall_confidence"] = {
        $gte: parseFloat(minValidation) / 100,
      };
    }

    // 5. MW & LOGP FILTERS (compound level - needs aggregation)
    let useAggregation = false;
    const matchStages = [];

    if (minMW || maxMW || minLogP || maxLogP) {
      useAggregation = true;

      // Add computed fields
      matchStages.push({
        $addFields: {
          avgMW: {
            $avg: {
              $map: {
                input: "$compounds",
                as: "comp",
                in: { $toDouble: "$$comp.molecular_weight" },
              },
            },
          },
          avgLogP: {
            $avg: {
              $map: {
                input: "$compounds",
                as: "comp",
                in: { $toDouble: "$$comp.logp" },
              },
            },
          },
        },
      });

      // MW filter
      if (minMW || maxMW) {
        const mwMatch = {};
        if (minMW) mwMatch.$gte = parseFloat(minMW);
        if (maxMW) mwMatch.$lte = parseFloat(maxMW);
        matchStages.push({ $match: { avgMW: mwMatch } });
      }

      // LogP filter
      if (minLogP || maxLogP) {
        const logpMatch = {};
        if (minLogP) logpMatch.$gte = parseFloat(minLogP);
        if (maxLogP) logpMatch.$lte = parseFloat(maxLogP);
        matchStages.push({ $match: { avgLogP: logpMatch } });
      }
    }

    let discoveries, total;

    if (useAggregation) {
      // Use aggregation pipeline for compound filters
      const pipeline = [
        { $match: query },
        ...matchStages,
        { $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } },
      ];

      // Count total
      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await Discovery.aggregate(countPipeline);
      total = countResult[0]?.total || 0;

      // Get paginated results
      const skip = (parseInt(page) - 1) * parseInt(limit);
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: parseInt(limit) });

      discoveries = await Discovery.aggregate(pipeline);
    } else {
      // Simple query without aggregation
      total = await Discovery.countDocuments(query);

      const skip = (parseInt(page) - 1) * parseInt(limit);
      discoveries = await Discovery.find(query)
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    }

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      discoveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch history",
      details: error.message,
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // ✅ Aggregate with BOTH possible confidence field locations
    const stats = await Discovery.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalDiscoveries: { $sum: 1 },
          totalCompounds: { $sum: { $size: "$compounds" } },
          // Check BOTH locations
          avgConfidenceFromMetadata: {
            $avg: "$metadata.overall_confidence",
          },
          avgConfidenceFromPreprocessing: {
            $avg: "$preprocessingAnalysis.confidenceScore",
          },
        },
      },
    ]);

    // ✅ Handle empty or no data
    if (!stats.length || stats[0].totalDiscoveries === 0) {
      return res.json({
        success: true,
        stats: {
          totalDiscoveries: 0,
          totalCompounds: 0,
          avgConfidence: 0,
        },
      });
    }

    // ✅ Use whichever field has data (fallback)
    const avgConfidence =
      stats[0].avgConfidenceFromMetadata ||
      stats[0].avgConfidenceFromPreprocessing ||
      0;

    res.json({
      success: true,
      stats: {
        totalDiscoveries: stats[0].totalDiscoveries,
        totalCompounds: stats[0].totalCompounds,
        avgConfidence: avgConfidence, // ✅ Always a number
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

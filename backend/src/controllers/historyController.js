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

    console.log("🔍 History Query - User ID:", req.user._id);

    const query = { userId: req.user._id };

    if (search) {
      const searchWords = search.trim().split(/\s+/);
      const searchRegex = searchWords.map(
        (word) => new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      );

      query.$and = searchRegex.map((regex) => ({
        $or: [{ criteria: regex }, { "compounds.name": regex }],
      }));
    }

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

    if (inputMode && inputMode !== "all") {
      query.inputMode = inputMode;
    }

    if (minValidation) {
      query["metadata.overall_confidence"] = {
        $gte: parseFloat(minValidation) / 100,
      };
    }

    let useAggregation = false;
    const matchStages = [];

    if (minMW || maxMW || minLogP || maxLogP) {
      useAggregation = true;

      matchStages.push({
        $addFields: {
          avgMW: {
            $avg: {
              $map: {
                input: "$compounds",
                as: "comp",
                in: {
                  $cond: {
                    if: {
                      $eq: [{ $type: "$$comp.molecular_weight" }, "string"],
                    },
                    then: { $toDouble: "$$comp.molecular_weight" },
                    else: "$$comp.molecular_weight",
                  },
                },
              },
            },
          },
          avgLogP: {
            $avg: {
              $map: {
                input: "$compounds",
                as: "comp",
                in: {
                  $cond: {
                    if: { $eq: [{ $type: "$$comp.logp" }, "string"] },
                    then: { $toDouble: "$$comp.logp" },
                    else: "$$comp.logp",
                  },
                },
              },
            },
          },
        },
      });

      if (minMW || maxMW) {
        const mwMatch = {};
        if (minMW) mwMatch.$gte = parseFloat(minMW);
        if (maxMW) mwMatch.$lte = parseFloat(maxMW);
        matchStages.push({ $match: { avgMW: mwMatch } });
      }

      if (minLogP || maxLogP) {
        const logpMatch = {};
        if (minLogP) logpMatch.$gte = parseFloat(minLogP);
        if (maxLogP) logpMatch.$lte = parseFloat(maxLogP);
        matchStages.push({ $match: { avgLogP: logpMatch } });
      }
    }

    let discoveries, total;

    if (useAggregation) {
      const pipeline = [
        { $match: query },
        ...matchStages,
        { $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 } },
      ];

      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await Discovery.aggregate(countPipeline);
      total = countResult[0]?.total || 0;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: parseInt(limit) });

      discoveries = await Discovery.aggregate(pipeline);
    } else {
      total = await Discovery.countDocuments(query);

      const skip = (parseInt(page) - 1) * parseInt(limit);
      discoveries = await Discovery.find(query)
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    }

    console.log("✅ Found discoveries:", discoveries.length);

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
    console.error("❌ Get history error:", error);
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

    const stats = await Discovery.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalDiscoveries: { $sum: 1 },
          totalCompounds: { $sum: { $size: "$compounds" } },
          avgConfidenceFromMetadata: { $avg: "$metadata.overall_confidence" },
          avgConfidenceFromPreprocessing: {
            $avg: "$preprocessingAnalysis.confidenceScore",
          },
        },
      },
    ]);

    if (!stats.length || stats[0].totalDiscoveries === 0) {
      return res.json({
        success: true,
        totalDiscoveries: 0,
        totalCompounds: 0,
        avgConfidence: 0,
      });
    }

    const avgConfidence =
      stats[0].avgConfidenceFromMetadata ||
      stats[0].avgConfidenceFromPreprocessing ||
      0;

    res.json({
      success: true,
      totalDiscoveries: stats[0].totalDiscoveries,
      totalCompounds: stats[0].totalCompounds,
      avgConfidence: avgConfidence,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
};

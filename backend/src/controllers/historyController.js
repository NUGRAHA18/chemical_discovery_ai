const Discovery = require('../models/Discovery');

exports.getHistory = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;

    const query = { userId: req.user._id };

    if (search) {
      query.$or = [
        { criteria: { $regex: search, $options: 'i' } },
        { 'compounds.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [discoveries, total] = await Promise.all([
      Discovery.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-compounds.structure_image'),
      Discovery.countDocuments(query)
    ]);

    res.json({
      success: true,
      discoveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
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
          totalCompounds: { $sum: { $size: '$compounds' } },
          avgConfidence: { 
            $avg: '$preprocessingAnalysis.confidenceScore' 
          }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalDiscoveries: 0,
        totalCompounds: 0,
        avgConfidence: 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
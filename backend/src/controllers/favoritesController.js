const Favorite = require("../models/Favorite");

exports.addFavorite = async (req, res) => {
  try {
    const { compoundData, tags, notes } = req.body;

    const favorite = await Favorite.create({
      userId: req.user._id,
      compoundData,
      tags: tags || [],
      notes,
    });

    res.status(201).json({
      success: true,
      favorite,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const { tags, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (tags) {
      const tagArray = tags.split(",").map((t) => t.trim());
      query.tags = { $in: tagArray };
    }

    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      Favorite.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Favorite.countDocuments(query),
    ]);

    res.json({
      success: true,
      favorites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!favorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    await favorite.deleteOne();

    res.json({
      success: true,
      message: "Favorite deleted",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFavorite = async (req, res) => {
  try {
    const { tags, notes } = req.body;

    const favorite = await Favorite.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { tags, notes },
      { new: true, runValidators: true }
    );

    if (!favorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.json({
      success: true,
      favorite,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  compoundData: {
    name: String,
    formula: String,
    smiles: String,
    properties: mongoose.Schema.Types.Mixed,
    base_compound: String,
    modifications: String,
    molecular_weight: Number,
    logp: Number,
    structure_image: String
  },
  tags: [String],
  notes: String
}, {
  timestamps: true
});

favoriteSchema.index({ userId: 1, createdAt: -1 });
favoriteSchema.index({ userId: 1, tags: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
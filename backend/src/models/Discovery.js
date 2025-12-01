const mongoose = require("mongoose");

const compoundSchema = new mongoose.Schema(
  {
    name: String,
    formula: String,
    smiles: String,
    properties: mongoose.Schema.Types.Mixed,
    base_compound: String,
    modifications: String,
    molecular_weight: Number,
    logp: Number,
    structure_image: String,
    validation_score: Number,
    feasibility_notes: String,
  },
  { _id: false }
);

const discoverySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    inputMode: {
      type: String,
      enum: ["structured", "ai-prompt"],
      default: "ai-prompt",
    },
    structuredData: {
      category: String,
      boilingPoint: {
        min: Number,
        max: Number,
      },
      viscosity: {
        min: Number,
        max: Number,
      },
      solubility: String,
      thermalStability: {
        min: Number,
      },
      additionalProperties: [String],
      notes: String,
    },
    criteria: {
      type: String,
      required: true,
    },
    preprocessingAnalysis: {
      normalizedInput: String,
      concepts: mongoose.Schema.Types.Mixed,
      searchTermsUsed: [String],
      confidenceScore: Number,
    },
    analysis: String,
    research: String,
    compounds: [compoundSchema],
    validation: mongoose.Schema.Types.Mixed,
    justification: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

discoverySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Discovery", discoverySchema);

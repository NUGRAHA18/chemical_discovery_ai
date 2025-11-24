const Discovery = require('../models/Discovery');
const mlService = require('../services/mlService');
const imageUtils = require('../utils/imageUtils');

exports.createDiscovery = async (req, res) => {
  try {
    const { criteria } = req.body;

    const mlResult = await mlService.discover(criteria);

    if (mlResult.status !== 'success') {
      return res.status(500).json({ 
        error: 'ML processing failed',
        details: mlResult.error 
      });
    }

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

    const discovery = await Discovery.create({
      userId: req.user._id,
      criteria,
      preprocessingAnalysis: {
        normalizedInput: mlResult.preprocessing_analysis?.normalized_input,
        concepts: mlResult.preprocessing_analysis?.concepts,
        searchTermsUsed: mlResult.preprocessing_analysis?.search_terms_used,
        confidenceScore: mlResult.preprocessing_analysis?.confidence_score
      },
      analysis: mlResult.analysis,
      research: mlResult.research_insights,
      compounds,
      validation: mlResult.validation,
      justification: mlResult.justification,
      metadata: mlResult.metadata
    });

    res.status(201).json({
      success: true,
      discovery
    });
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getDiscovery = async (req, res) => {
  try {
    const discovery = await Discovery.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!discovery) {
      return res.status(404).json({ error: 'Discovery not found' });
    }

    res.json({
      success: true,
      discovery
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDiscovery = async (req, res) => {
  try {
    const discovery = await Discovery.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!discovery) {
      return res.status(404).json({ error: 'Discovery not found' });
    }

    for (const compound of discovery.compounds) {
      if (compound.structure_image) {
        await imageUtils.deleteImage(compound.structure_image);
      }
    }

    await discovery.deleteOne();

    res.json({
      success: true,
      message: 'Discovery deleted'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
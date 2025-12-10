const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

/**
 * Save base64 image to disk
 */
const saveBase64Image = async (base64Data, compoundId) => {
  try {
    if (!base64Data) {
      console.log("No base64 data provided");
      return null;
    }

    // Create directory if not exists
    const imageDir = path.join(__dirname, "../../public/images/structures");
    if (!fs.existsSync(imageDir)) {
      console.log("Creating images directory:", imageDir);
      fs.mkdirSync(imageDir, { recursive: true });
    }

    // Generate filename
    const filename = `${compoundId}-${Date.now()}.png`;
    const filePath = path.join(imageDir, filename);

    console.log("Saving image to:", filePath);

    // Remove base64 prefix if exists
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64String, "base64");

    // Save and optimize image
    await sharp(buffer)
      .resize(300, 300)
      .png({ compressionLevel: 9, quality: 80 })
      .toFile(filePath);

    console.log("Image saved successfully:", filename);

    // ✅ FIX: Return FULL URL instead of relative path
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    return `${baseUrl}/images/structures/${filename}`;
  } catch (error) {
    console.error("Save image error:", error);
    return null;
  }
};

/**
 * Generate structure image from SMILES (future use)
 */
const generateStructureImage = async (smiles, compoundId) => {
  try {
    if (!smiles) {
      return null;
    }

    // Create directory if not exists
    const imageDir = path.join(__dirname, "../../public/images/structures");
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    const filename = `${compoundId}-${Date.now()}.png`;
    const filePath = path.join(imageDir, filename);

    // Note: This requires ML service with image generation endpoint
    // For now, return null and rely on base64 from ML service

    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};

module.exports = {
  saveBase64Image,
  generateStructureImage,
};

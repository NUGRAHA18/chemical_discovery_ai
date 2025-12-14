const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const saveBase64Image = async (base64Data, compoundId) => {
  try {
    if (!base64Data) {
      console.log("No base64 data provided");
      return null;
    }

    const imageDir = path.join(__dirname, "../../public/images/structures");
    if (!fs.existsSync(imageDir)) {
      console.log("Creating images directory:", imageDir);
      fs.mkdirSync(imageDir, { recursive: true });
      fs.chmodSync(imageDir, 0o755);
    }

    const filename = `${compoundId}-${Date.now()}.png`;
    const filePath = path.join(imageDir, filename);
    console.log("Saving image to:", filePath);
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64String, "base64");

    await sharp(buffer)
      .resize(300, 300)
      .png({ compressionLevel: 9, quality: 80 })
      .toFile(filePath);

    try {
      fs.chmodSync(filePath, 0o644);
    } catch (permError) {
      console.error(
        "Warning: Failed to set file permissions:",
        permError.message
      );
    }

    console.log("Image saved successfully:", filename);

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return `${baseUrl}/images/structures/${filename}`;
  } catch (error) {
    console.error("Save image error:", error);
    return null;
  }
};

const generateStructureImage = async (smiles, compoundId) => {
  try {
    if (!smiles) {
      return null;
    }

    const imageDir = path.join(__dirname, "../../public/images/structures");
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    const filename = `${compoundId}-${Date.now()}.png`;
    const filePath = path.join(imageDir, filename);

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

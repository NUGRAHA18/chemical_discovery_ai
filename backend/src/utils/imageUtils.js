const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = process.env.UPLOAD_PATH || './public/images/structures';

const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
};

const imageUtils = {
  saveBase64Image: async (base64String) => {
    if (!base64String) return null;

    await ensureUploadDir();

    const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 image format');
    }

    const [, extension, data] = matches;
    const buffer = Buffer.from(data, 'base64');

    const filename = `${uuidv4()}.png`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await sharp(buffer)
      .png({ quality: 90 })
      .resize(300, 300, { fit: 'inside' })
      .toFile(filepath);

    return `/images/structures/${filename}`;
  },

  deleteImage: async (imagePath) => {
    if (!imagePath) return;

    try {
      const filename = path.basename(imagePath);
      const filepath = path.join(UPLOAD_DIR, filename);
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Delete image error:', error.message);
    }
  }
};

module.exports = imageUtils;
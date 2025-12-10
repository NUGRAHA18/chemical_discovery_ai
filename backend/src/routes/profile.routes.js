const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/auth");
const profileController = require("../controllers/profileController");

// Multer config for profile photo upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

// All routes require authentication
router.use(protect);

// @route   GET /api/profile
// @desc    Get current user profile
// @access  Private
router.get("/", profileController.getProfile);

// @route   PUT /api/profile
// @desc    Update user profile (name, company, bio)
// @access  Private
router.put("/", profileController.updateProfile);

// @route   POST /api/profile/photo
// @desc    Upload profile photo
// @access  Private
router.post(
  "/photo",
  upload.single("photo"),
  profileController.uploadProfilePhoto
);

// @route   DELETE /api/profile/photo
// @desc    Delete profile photo
// @access  Private
router.delete("/photo", profileController.deleteProfilePhoto);

// @route   PUT /api/profile/password
// @desc    Change password
// @access  Private
router.put("/password", profileController.changePassword);

module.exports = router;

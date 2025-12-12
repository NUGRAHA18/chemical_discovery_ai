const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/auth");
const profileController = require("../controllers/profileController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

router.use(protect);

router.get("/", profileController.getProfile);

router.put("/", profileController.updateProfile);

router.post(
  "/photo",
  upload.single("photo"),
  profileController.uploadProfilePhoto
);

router.delete("/photo", profileController.deleteProfilePhoto);

router.put("/password", profileController.changePassword);

module.exports = router;

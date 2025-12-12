const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const {
  registerValidation,
  loginValidation,
} = require("../middleware/validators");

// ==========================================
// 1. KONFIGURASI UPLOAD (MULTER)
// ==========================================
const uploadDir = "public/uploads/";

// Pastikan folder ada saat server start
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Naming: user-{id}-{timestamp}.ext
    // Menggunakan req.user.id agar nama file unik per user (jika user sudah login)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload an image."), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB
  fileFilter: fileFilter,
});

// ==========================================
// 2. DEFINISI ROUTES
// ==========================================

router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);

// Update Profile (Text & Photo)
// Menggunakan 'photo' sesuai dengan frontend formData.append('photo', file)
router.put(
  "/profile",
  protect,
  upload.single("photo"),
  authController.updateProfile
);

module.exports = router;

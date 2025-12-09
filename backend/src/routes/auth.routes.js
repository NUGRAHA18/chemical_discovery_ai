const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const {
  registerValidation,
  loginValidation,
} = require("../middleware/validators");

// --- TAMBAHAN UNTUK FITUR PROFILE ---
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User"); // Wajib import Model User untuk edit profile

// --- KONFIGURASI MULTER (UPLOAD IMAGE) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "public/uploads/";
    // Buat folder jika belum ada
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Format nama file: user-TIMESTAMP.ext
    cb(null, "user-" + Date.now() + path.extname(file.originalname));
  },
});

// Filter hanya terima gambar
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload an image."), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit 2MB
  fileFilter: fileFilter,
});

// --- ROUTES STANDAR (YANG SUDAH ADA) ---
router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);

// --- ROUTE BARU: UPDATE PROFILE ---
router.put("/profile", protect, upload.single("avatar"), async (req, res) => {
  try {
    const userId = req.user.id; // Didapat dari middleware protect
    const { username, bio, institution } = req.body;

    // Cari user
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update Text Fields jika dikirim
    if (username) user.username = username;
    if (bio) user.bio = bio;
    if (institution) user.institution = institution;

    // Update Avatar jika ada file baru
    if (req.file) {
      // Simpan path relatif gambar agar bisa diakses frontend
      user.avatar = `/uploads/${req.file.filename}`;
    }

    await user.save();

    // Kembalikan data user terbaru (tanpa password)
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      institution: user.institution,
      role: user.role,
    };

    res.json({ message: "Profile updated successfully", user: userData });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Server error handling profile update" });
  }
});

module.exports = router;

const User = require("../models/User");
const { generateToken } = require("../utils/jwtUtils");
const fs = require("fs");
const path = require("path");

const sanitizeUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  company: user.company || "",
  bio: user.bio || "",
  profilePhoto: user.profilePhoto || null,
  role: user.role,
});

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = await User.create({ email, password, name });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    // req.user didapat dari middleware protect
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { name, bio, company } = req.body;

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (company) user.company = company;

    if (req.file) {
      if (user.profilePhoto) {
        const oldPhotoPath = path.join(
          __dirname,
          "../../public",
          user.profilePhoto
        );
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      user.profilePhoto = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

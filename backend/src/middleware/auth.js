const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // 1. Cek Token di Header (Prioritas Utama)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // 2. Jika tidak ada di Header, cek di Query (Opsional/Fallback)
  else if (req.query.token) {
    token = req.query.token;
  }

  // 3. Validasi Keberadaan Token
  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token provided" });
  }

  // 4. Verifikasi Token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ambil data user
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ error: "User not found with this token" });
    }

    next(); // Lanjut ke controller berikutnya
  } catch (error) {
    console.error("Auth Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Session expired, please login again" });
    }

    return res.status(401).json({ error: "Not authorized, token failed" });
  }
};

module.exports = { protect };

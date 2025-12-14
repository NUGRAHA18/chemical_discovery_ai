require("dotenv").config();
const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const fs = require("fs"); // Tambahkan fs untuk cek folder

// Configs
const connectDB = require("./config/database");
const { getCacheStats } = require("./config/redis");
const { initializeSocket } = require("./config/socket");

// Initialize App
const app = express();
const server = http.createServer(app);

// Database Connection
connectDB();

// ==========================================
// 1. MIDDLEWARES
// ==========================================

// Security & Compression
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(morgan("dev"));

// CORS Configuration (DYNAMIC & CLEAN) 🚀
// Kita ambil dari env. Jika ada koma, kita split jadi array.
const rawOrigins = process.env.CORS_ORIGIN || process.env.CLIENT_URL || "*";
const allowedOrigins =
  rawOrigins === "*"
    ? "*"
    : rawOrigins.split(",").map((origin) => origin.trim());

console.log("🌐 Allowed CORS Origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins === "*") return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`Blocked CORS request from: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Body Parsers (Combined & Limited)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ==========================================
// 2. STATIC FILES & IMAGES (DYNAMIC) 🚀
// ==========================================

// Tentukan lokasi folder public secara dinamis
// Jika server.js ada di root, path.join(__dirname, 'public') sudah benar.
const PUBLIC_DIR = path.join(__dirname, "public");
const IMAGES_DIR = path.join(PUBLIC_DIR, "images");

// Pastikan folder ada (Optional safety check)
if (!fs.existsSync(IMAGES_DIR)) {
  console.warn(`⚠️ Warning: Image directory not found at ${IMAGES_DIR}`);
  // fs.mkdirSync(IMAGES_DIR, { recursive: true }); // Uncomment jika ingin auto-create
}

// Custom Headers for Images
app.use(
  "/images",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Izinkan gambar diakses siapapun
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  // Serve static files
  express.static(IMAGES_DIR)
);

// Serve uploads if separate (sesuaikan jika path profiles beda)
app.use("/uploads", express.static(path.join(IMAGES_DIR, "profiles")));

// ==========================================
// 3. API ROUTES
// ==========================================

// Cache Stats Endpoint
app.get("/api/cache/stats", async (req, res) => {
  try {
    const stats = await getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting cache stats:", error);
    res.status(500).json({ error: "Failed to get cache stats" });
  }
});

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// Feature Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/profile", require("./routes/profile.routes"));
app.use("/api/discover", require("./routes/discovery.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/history", require("./routes/history.routes"));
app.use("/api/favorites", require("./routes/favorites.routes"));
app.use("/api/export", require("./routes/export.routes"));
app.use("/api/internal", require("./routes/internal.routes"));
app.use("/api", require("./routes/propertyCalculator"));

// ==========================================
// 4. ERROR HANDLING
// ==========================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ==========================================
// 5. SERVER START
// ==========================================

initializeSocket(server);

// Default ke 3010 sesuai .env kamu
const PORT = process.env.PORT || 3010;

server.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✅ Static Path: ${IMAGES_DIR}`);
  console.log(`=================================`);
});

// Timeout 10 menit (untuk AI processing yang lama)
server.setTimeout(600000);

module.exports = app;

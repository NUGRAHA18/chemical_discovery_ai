require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const connectDB = require("./config/database");
const path = require("path");
const chatRoutes = require("./routes/chat.routes");

// 1. IMPORT FUNGSI REDIS CACHE
const { getCacheStats } = require("./config/redis");

const app = express();
const imageFolderPath = path.join(__dirname, "public/images");

connectDB();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://your-frontend-domain.com"]
    : ["http://localhost:3001", "http://localhost:3000"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  "/images",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "../public/images"))
);

// 2. DEFINISI ENDPOINT UNTUK CACHE STATS
app.get("/api/cache/stats", async (req, res) => {
  try {
    const stats = await getCacheStats();
    res.json(stats);
  } catch (error) {
    // Menampilkan error di console untuk debugging
    console.error("Error getting cache stats:", error);
    res.status(500).json({ error: "Failed to get cache stats" });
  }
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/discover", require("./routes/discovery.routes"));
app.use("/api/history", require("./routes/history.routes"));
app.use("/api/favorites", require("./routes/favorites.routes"));
app.use("/api/export", require("./routes/export.routes"));
app.use("/api/chat", chatRoutes);
app.use("/api", require("./routes/propertyCalculator"));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/api/profile", require("./routes/profile.routes"));
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

const folderGambar = path.join(__dirname, "../public/images");
console.log("Server melayani gambar dari folder:", folderGambar);
app.use(
  "/api/images",
  express.static(folderGambar, {
    setHeaders: function (res, path, stat) {
      // Header ini wajib agar Frontend (Port 5173) tidak diblokir browser
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      res.set("Access-Control-Allow-Origin", "*");
    },
  })
);

module.exports = app;

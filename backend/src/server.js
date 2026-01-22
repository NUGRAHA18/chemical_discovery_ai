require("dotenv").config();
const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

// Configs
const connectDB = require("./config/database");
const { getCacheStats } = require("./config/redis");
const { initializeSocket } = require("./config/socket");

// Initialize App
const app = express();
const server = http.createServer(app);

// Database Connection
connectDB();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression());
app.use(morgan("dev"));

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://chemical.rbwtech.io"]
    : ["http://localhost:3001", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

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
  express.static(path.join(__dirname, "../public/images")),
);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "public/images/profiles")),
);

app.get("/api/cache/stats", async (req, res) => {
  try {
    const stats = await getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting cache stats:", error);
    res.status(500).json({ error: "Failed to get cache stats" });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/profile", require("./routes/profile.routes"));
app.use("/api/discover", require("./routes/discovery.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/history", require("./routes/history.routes"));
app.use("/api/favorites", require("./routes/favorites.routes"));
app.use("/api/export", require("./routes/export.routes"));
app.use("/api/internal", require("./routes/internal.routes"));
app.use("/api", require("./routes/propertyCalculator"));

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

initializeSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Socket.io ready`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
});

server.setTimeout(600000);

module.exports = app;

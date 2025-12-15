const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3001",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;

      console.log(
        `✅ Socket authenticated: ${socket.userEmail} (${socket.id})`
      );
      next();
    } catch (error) {
      console.error("❌ Socket auth error:", error.message);
      next(new Error("Authentication error"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log(
      `🔌 Client connected: ${socket.id} (User: ${socket.userEmail})`
    );

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} - ${reason}`);
    });

    // Ping/Pong for connection health
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  console.log("✅ Socket.io initialized");
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

// Emit to specific user
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Progress event helper
const emitProgress = (userId, progressData) => {
  emitToUser(userId, "discovery:progress", {
    timestamp: new Date().toISOString(),
    ...progressData,
  });
};

// Log event helper
const emitLog = (userId, logData) => {
  emitToUser(userId, "discovery:log", {
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleTimeString("id-ID", { hour12: false }),
    ...logData,
  });
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitProgress,
  emitLog,
};

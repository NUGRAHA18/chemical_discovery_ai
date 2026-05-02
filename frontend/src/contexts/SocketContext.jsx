import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../config/env";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState(null);
  const [discoveryLogs, setDiscoveryLogs] = useState([]);
  const isMounted = useRef(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = () => setToken(localStorage.getItem("token"));

    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(handleStorageChange, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      console.log("ℹ️ Socket: Menunggu token...");
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const serverUrl =
      process.env.NODE_ENV === "production"
        ? "/"
        : BACKEND_URL || "http://localhost:3010";

    console.log("🔌 Initializing Socket to:", serverUrl);

    const newSocket = io(serverUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: false,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket Connected ID:", newSocket.id);
      if (isMounted.current) setConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Socket Disconnected:", reason);
      if (isMounted.current) setConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket Connection Error:", err.message);
      if (isMounted.current) setConnected(false);
    });

    newSocket.on("discovery:progress", (data) => {
      if (isMounted.current) setDiscoveryProgress(data);
    });

    newSocket.on("discovery:log", (data) => {
      if (isMounted.current) {
        setDiscoveryLogs((prev) => [...prev, data]);
      }
    });

    newSocket.on("discovery:complete", (data) => {
      if (isMounted.current) {
        setDiscoveryProgress({
          step: "complete",
          progress: 100,
          message: "Discovery Complete!",
          ...data,
        });
      }
    });

    newSocket.on("discovery:error", (data) => {
      console.error("❌ Discovery Error Event:", data);
      if (isMounted.current) {
        setDiscoveryProgress({
          step: "error",
          progress: 0,
          message: data.error || "Terjadi kesalahan",
          error: true,
        });
      }
    });

    newSocket.connect();
    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up socket...");

      newSocket.off();
      newSocket.disconnect();
    };
  }, [token]);

  const clearProgress = () => {
    setDiscoveryProgress(null);
    setDiscoveryLogs([]);
  };

  const value = {
    socket,
    connected,
    discoveryProgress,
    discoveryLogs,
    clearProgress,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

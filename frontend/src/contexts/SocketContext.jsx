import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

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
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("❌ No token found, skipping socket connection");
      return;
    }

    // Initialize socket
    const newSocket = io(
      process.env.REACT_APP_BACKEND_URL || "http://localhost:3000",
      {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      }
    );

    socketRef.current = newSocket;

    // Connection events
    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setConnected(false);
    });

    // Discovery events
    newSocket.on("discovery:progress", (data) => {
      console.log("📊 Progress:", data);
      setDiscoveryProgress(data);
    });

    newSocket.on("discovery:log", (data) => {
      console.log("📝 Log:", data);
      setDiscoveryLogs((prev) => [...prev, data]);
    });

    newSocket.on("discovery:complete", (data) => {
      console.log("✅ Discovery complete:", data);
      setDiscoveryProgress({
        step: "complete",
        progress: 100,
        message: "Complete!",
        ...data,
      });
    });

    newSocket.on("discovery:error", (data) => {
      console.error("❌ Discovery error:", data);
      setDiscoveryProgress({
        step: "error",
        progress: 0,
        message: data.error,
        error: true,
      });
    });

    setSocket(newSocket);

    return () => {
      console.log("🔌 Cleaning up socket connection");
      newSocket.close();
    };
  }, []);

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

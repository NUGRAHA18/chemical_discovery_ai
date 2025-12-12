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
  const isComponentMounted = useRef(false);
  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("❌ No token found, skipping socket connection");
      return;
    }

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

    newSocket.on("connect", () => {
      if (isComponentMounted.current) {
        setConnected(true);
      }
    });

    newSocket.on("disconnect", (reason) => {
      if (isComponentMounted.current) {
        console.log("🔌 Socket disconnected:", reason);
        setConnected(false);
      }
    });

    newSocket.on("connect_error", (error) => {
      if (isComponentMounted.current) {
        console.error("❌ Socket connection error:", error.message);
        setConnected(false);
      }
    });

    newSocket.on("discovery:progress", (data) => {
      if (isComponentMounted.current) {
        setDiscoveryProgress(data);
      }
    });

    newSocket.on("discovery:log", (data) => {
      if (isComponentMounted.current) {
        setDiscoveryLogs((prev) => [...prev, data]);
      }
    });

    newSocket.on("discovery:complete", (data) => {
      if (isComponentMounted.current) {
        setDiscoveryProgress({
          step: "complete",
          progress: 100,
          message: "Complete!",
          ...data,
        });
      }
    });

    newSocket.on("discovery:error", (data) => {
      if (isComponentMounted.current) {
        console.error("❌ Discovery error:", data);
        setDiscoveryProgress({
          step: "error",
          progress: 0,
          message: data.error,
          error: true,
        });
      }
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
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

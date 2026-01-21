import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
// Import sesuai permintaan Anda
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

  // Ref untuk mengecek apakah komponen masih ter-mount (Mencegah memory leak)
  const isMounted = useRef(true);

  // State token agar socket me-refresh diri saat login/logout
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Effect untuk memantau lifecycle component
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Effect untuk memantau perubahan token (Login/Logout)
  useEffect(() => {
    const handleStorageChange = () => setToken(localStorage.getItem("token"));

    // Listen event storage (jika login dari tab lain)
    window.addEventListener("storage", handleStorageChange);

    // Cek manual (poling sederhana) jaga-jaga jika event listener tidak trigger
    const interval = setInterval(handleStorageChange, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Effect Utama Socket.io
  useEffect(() => {
    // 1. Jika tidak ada token, reset state dan jangan connect
    if (!token) {
      console.log("ℹ️ Socket: Menunggu token...");
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // 2. Setup Socket
    const serverUrl = BACKEND_URL || "http://localhost:3010"; // Fallback aman
    console.log("🔌 Initializing Socket to:", serverUrl);

    const newSocket = io(serverUrl, {
      auth: { token }, // Kirim token untuk handshake
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: false, // Connect manual setelah listener siap
    });

    // 3. Setup Event Listeners
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

    // --- Events Spesifik Discovery ---
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

    // 4. Lakukan Koneksi
    newSocket.connect();
    setSocket(newSocket);

    // 5. Cleanup Function (Dijalankan saat unmount atau token berubah)
    return () => {
      console.log("🧹 Cleaning up socket...");

      // FIX BUG: Gunakan .off() bukan .offAll()
      newSocket.off(); // Menghapus semua event listener
      newSocket.disconnect(); // Putus koneksi
    };
  }, [token]); // Re-run effect jika token berubah

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

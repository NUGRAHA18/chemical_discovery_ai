import api from "./api";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3000/api";

export const chatService = {
  sendMessage: async (message, discoveryId = null) => {
    const response = await api.post("/chat/send", {
      message,
      discoveryId,
    });
    return response.data;
  },

  getHistory: async (page = 1, limit = 50) => {
    const response = await api.get("/chat/history", {
      params: { page, limit },
    });
    return response.data;
  },

  clearHistory: async () => {
    const response = await api.delete("/chat/history");
    return response.data;
  },

  deleteSession: async (sessionId) => {
    const response = await api.delete(`/chat/session/${sessionId}`);
    return response.data;
  },

  streamResponse: (sessionId, onMessage, onComplete, onError) => {
    const token = localStorage.getItem("token");

    if (!token) {
      if (onError) onError("No authentication token found");
      return null;
    }

    const eventSource = new EventSource(
      `${API_BASE_URL}/chat/stream/${sessionId}?token=${encodeURIComponent(
        token
      )}`
    );

    eventSource.onmessage = (event) => {
      const data = event.data;

      if (data === "[DONE]") {
        eventSource.close();
        if (onComplete) onComplete();
      } else if (data.startsWith("[ERROR]")) {
        eventSource.close();
        if (onError) onError(data.replace("[ERROR]", "").trim());
      } else {
        if (onMessage) onMessage(data);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      eventSource.close();
      if (onError) onError("Connection error. Please try again.");
    };

    return eventSource;
  },
};

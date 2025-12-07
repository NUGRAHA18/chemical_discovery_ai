import { useState, useEffect, useRef } from "react";
import { chatService } from "../services/chat";
import { discoveryService } from "../services/discovery";
import { showError, showSuccess } from "../utils/toast";
import ChatMessage from "../components/chat/ChatMessage";
import ChatInput from "../components/chat/ChatInput";
import Loading from "../components/common/Loading";

const ChatAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [discoveries, setDiscoveries] = useState([]);
  const [selectedDiscovery, setSelectedDiscovery] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    loadDiscoveries();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    try {
      const data = await chatService.getHistory();

      if (data.sessions && data.sessions.length > 0) {
        const allMessages = data.sessions.flatMap((session) =>
          session.messages.map((msg) => ({
            ...msg,
            sessionId: session.sessionId,
          }))
        );
        setMessages(allMessages);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadDiscoveries = async () => {
    try {
      const data = await discoveryService.getHistory({ limit: 10 });
      setDiscoveries(data.discoveries || []);
    } catch (error) {
      console.error("Failed to load discoveries:", error);
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim() || isLoading || isStreaming) return;

    const userMessage = {
      role: "user",
      message: message.trim(),
      createdAt: new Date().toISOString(),
      _id: Date.now().toString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { sessionId } = await chatService.sendMessage(
        message.trim(),
        selectedDiscovery
      );

      const assistantMessage = {
        role: "assistant",
        message: "",
        createdAt: new Date().toISOString(),
        _id: (Date.now() + 1).toString(),
        sessionId,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
      setIsStreaming(true);

      eventSourceRef.current = chatService.streamResponse(
        sessionId,
        (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role === "assistant") {
              lastMsg.message += chunk;
            }
            return updated;
          });
        },
        () => {
          setIsStreaming(false);
          eventSourceRef.current = null;
        },
        (error) => {
          setIsStreaming(false);
          showError(error || "Failed to get response");
          eventSourceRef.current = null;
        }
      );
    } catch (error) {
      setIsLoading(false);
      setIsStreaming(false);
      showError("Failed to send message");
      console.error("Send message error:", error);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all chat history?")) {
      return;
    }

    try {
      await chatService.clearHistory();
      setMessages([]);
      showSuccess("Chat history cleared");
    } catch (error) {
      showError("Failed to clear history");
    }
  };

  if (loadingHistory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              AI Chat Assistant
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ask questions about chemicals, compounds, and your discoveries
            </p>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              Clear History
            </button>
          )}
        </div>

        {discoveries.length > 0 && (
          <div className="card mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reference a Discovery (Optional):
            </label>
            <select
              value={selectedDiscovery || ""}
              onChange={(e) => setSelectedDiscovery(e.target.value || null)}
              className="input-field"
            >
              <option value="">No discovery selected</option>
              {discoveries.map((discovery) => (
                <option key={discovery._id} value={discovery._id}>
                  {discovery.criteria.substring(0, 60)}...
                  {" - "}
                  {new Date(discovery.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          className="card mb-6"
          style={{
            minHeight: "500px",
            maxHeight: "600px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            className="flex-1 overflow-y-auto mb-4 space-y-4"
            style={{ minHeight: 0 }}
          >
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Start a Conversation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Ask me anything about chemistry, compounds, or your
                  discoveries
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message._id} message={message} />
              ))
            )}

            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <Loading size="sm" />
                <span className="text-sm">Sending...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading || isStreaming}
            isStreaming={isStreaming}
          />
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Example Questions:
          </h3>
          <div className="grid md:grid-cols-2 gap-2">
            {[
              "Explain the properties of benzene",
              "What makes a good surfactant?",
              "How can I improve my last discovery?",
              "What's the difference between LogP and molecular weight?",
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(example)}
                disabled={isLoading || isStreaming}
                className="text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;

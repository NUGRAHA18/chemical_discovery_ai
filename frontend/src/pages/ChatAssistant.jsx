import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { chatService } from "../services/chat";
import { discoveryService } from "../services/discovery";
import {
  showError,
  showSuccess,
  showLoading,
  dismissToast,
} from "../utils/toast";
import ChatMessage from "../components/chat/ChatMessage";
import ChatInput from "../components/chat/ChatInput";
import Loading from "../components/common/Loading";
import {
  exportChatToPDF,
  exportChatToTXT,
  exportChatToJSON,
} from "../utils/chatExport";

import {
  Bot,
  Trash2,
  FlaskConical,
  MessageSquare,
  Sparkles,
  Download,
  FileText,
  FileJson,
  ChevronDown,
} from "lucide-react";

const ChatAssistant = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [discoveries, setDiscoveries] = useState([]);
  const [selectedDiscovery, setSelectedDiscovery] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // ✅ FIX 1: Ref khusus untuk scrolling (best practice)
  const messagesEndRef = useRef(null);

  const chatContainerRef = useRef(null);
  const eventSourceRef = useRef(null);
  // const shouldAutoScrollRef = useRef(false); // Tidak diperlukan lagi

  useEffect(() => {
    loadChatHistory();
    loadDiscoveries();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // ✅ FIX 2: Logic Auto-Scroll Sederhana & Handal
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      // Scroll container chat ke posisi paling bawah
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth", // Tetap smooth
      });
    }
  };

  // Scroll setiap kali pesan bertambah (termasuk streaming)
  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Hapus useEffect scroll manual yang lama agar tidak konflik
  // ...

  const loadChatHistory = async () => {
    try {
      const data = await chatService.getHistory();
      if (data.sessions && data.sessions.length > 0) {
        const allMessages = data.sessions
          .flatMap((session) =>
            session.messages.map((msg) => ({
              ...msg,
              sessionId: session.sessionId,
            }))
          )
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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
      const data = await discoveryService.getHistory({ limit: 20 });
      setDiscoveries(data.discoveries || []);
    } catch (error) {
      console.error("Failed to load discoveries:", error);
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim() || isLoading || isStreaming) return;

    // shouldAutoScrollRef.current = true; // Tidak perlu

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
        selectedDiscovery || null
      );

      setIsLoading(false);
      setIsStreaming(true);

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      eventSourceRef.current = chatService.streamResponse(
        sessionId,
        (chunk) => {
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, message: lastMessage.message + chunk },
              ];
            } else {
              return [
                ...prev,
                {
                  role: "assistant",
                  message: chunk,
                  sessionId,
                  createdAt: new Date().toISOString(),
                  _id: Date.now().toString() + "-ai",
                },
              ];
            }
          });
        },
        () => {
          setIsStreaming(false);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        },
        (error) => {
          setIsStreaming(false);
          showError(error);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        }
      );
    } catch (error) {
      setIsLoading(false);
      setIsStreaming(false);
      showError(error.response?.data?.error || "Failed to send message");
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Clear all chat history? This cannot be undone."))
      return;

    try {
      await chatService.clearHistory();
      setMessages([]);
      showSuccess("Chat history cleared");
    } catch (error) {
      showError("Failed to clear history");
    }
  };

  const handleExport = async (format) => {
    if (messages.length === 0) {
      showError("No messages to export");
      return;
    }

    const loadingToast = showLoading(`Exporting to ${format.toUpperCase()}...`);

    try {
      let result;
      const selectedDiscoveryData = discoveries.find(
        (d) => d._id === selectedDiscovery
      );

      if (format === "pdf") {
        result = await exportChatToPDF(messages, selectedDiscoveryData);
      } else if (format === "txt") {
        result = exportChatToTXT(messages, selectedDiscoveryData);
      } else if (format === "json") {
        result = exportChatToJSON(messages, selectedDiscoveryData);
      }

      dismissToast(loadingToast);

      if (result.success) {
        showSuccess(`Chat exported to ${format.toUpperCase()}!`);
      } else {
        showError("Failed to export chat");
      }
    } catch (error) {
      dismissToast(loadingToast);
      showError("Export failed");
      console.error(error);
    }

    setShowExportMenu(false);
  };

  const handleSuggestedQuestion = (question) => {
    handleSendMessage(question);
  };

  const handleViewDiscovery = (discoveryId) => {
    navigate(`/history`); // Or navigate to specific discovery detail page
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  AI Chat Assistant
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Get insights about chemistry and your discoveries
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Dropdown */}
            {messages.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showExportMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                    <button
                      onClick={() => handleExport("pdf")}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export as PDF
                    </button>
                    <button
                      onClick={() => handleExport("txt")}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Export as TXT
                    </button>
                    <button
                      onClick={() => handleExport("json")}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FileJson className="w-4 h-4" />
                      Export as JSON
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Clear History */}
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Discovery Context Selector */}
        {discoveries.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <FlaskConical className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Reference Discovery (Optional)
              </label>
            </div>
            <select
              value={selectedDiscovery || ""}
              onChange={(e) => setSelectedDiscovery(e.target.value || null)}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            >
              <option value="" className="dark:bg-gray-900 dark:text-gray-300">
                None (General Questions)
              </option>
              {discoveries.map((disc) => (
                <option
                  key={disc._id}
                  value={disc._id}
                  className="dark:bg-gray-900 dark:text-gray-300"
                >
                  {disc.criteria?.substring(0, 50) || "Discovery"} (
                  {disc.compounds?.length || 0} compounds)
                </option>
              ))}
            </select>
            {selectedDiscovery && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                💡 AI responses will reference this discovery's compounds and
                properties
              </p>
            )}
          </div>
        )}

        {/* Chat Container */}
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden flex flex-col"
          style={{ height: "600px" }}
        >
          {/* Messages */}
          <div
            ref={chatContainerRef} // Ref lama untuk container
            className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Start a Conversation
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  Ask about chemical properties, analyze your discoveries, or
                  get guidance on synthesis pathways.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <ChatMessage key={idx} message={msg} />
                ))}
                {/* ✅ FIX 3: Dummy div untuk target auto-scroll */}
                <div ref={messagesEndRef} />
              </>
            )}

            {isLoading && (
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 pl-2">
                <div className="relative">
                  <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                  </span>
                </div>
                <span className="text-sm font-medium animate-pulse">
                  Thinking...
                </span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <ChatInput
              onSend={handleSendMessage}
              disabled={isLoading || isStreaming}
              isStreaming={isStreaming}
            />
          </div>
        </div>

        {/* Suggested Questions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Suggested Questions
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              "Explain the properties of benzene",
              "What makes a good surfactant?",
              "How can I improve my last discovery?",
              "What's the difference between LogP and molecular weight?",
              "Suggest modifications for better water solubility",
              "Analyze the thermal stability of my compounds",
            ].map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isLoading || isStreaming}
                className="text-left px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💡 {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;

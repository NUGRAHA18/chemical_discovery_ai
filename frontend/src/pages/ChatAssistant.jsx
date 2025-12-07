import { useState, useEffect, useRef } from "react";
import { chatService } from "../services/chat";
import { discoveryService } from "../services/discovery";
import { showError, showSuccess } from "../utils/toast";
import ChatMessage from "../components/chat/ChatMessage";
import ChatInput from "../components/chat/ChatInput";
import Loading from "../components/common/Loading";

// Import Icons
import {
  Bot,
  Trash2,
  FlaskConical,
  MessageSquare,
  Sparkles,
  HelpCircle,
  ArrowRight,
  History,
} from "lucide-react";

const ChatAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [discoveries, setDiscoveries] = useState([]);
  const [selectedDiscovery, setSelectedDiscovery] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);
  const chatContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true); // Track if should auto-scroll
  const userScrolledRef = useRef(false);

  useEffect(() => {
    loadChatHistory();
    loadDiscoveries();

    // Cleanup saat component unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if ((isLoading || isStreaming) && !userScrolledRef.current) {
      scrollToBottom();
    } else if (shouldAutoScrollRef.current && !userScrolledRef.current) {
      scrollToBottom();
    }
  }, [messages, isLoading, isStreaming]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 50;

    shouldAutoScrollRef.current = isAtBottom;

    // If user is NOT at bottom, they manually scrolled
    if (!isAtBottom) {
      userScrolledRef.current = true;
    } else {
      userScrolledRef.current = false;
    }
  };

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
      const data = await discoveryService.getHistory({ limit: 10 });
      setDiscoveries(data.discoveries || []);
    } catch (error) {
      console.error("Failed to load discoveries:", error);
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim() || isLoading || isStreaming) return;

    // Close existing EventSource (defensive programming)
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch (e) {
        console.warn("Failed to close EventSource:", e);
      }
      eventSourceRef.current = null;
    }

    // Reset scroll flags when sending new message
    userScrolledRef.current = false;
    shouldAutoScrollRef.current = true;

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

      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage = {
        role: "assistant",
        message: "",
        createdAt: new Date().toISOString(),
        _id: assistantMessageId,
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
            const lastIndex = updated.length - 1;

            if (lastIndex >= 0 && updated[lastIndex]?.role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                message: updated[lastIndex].message + chunk,
              };
              return updated;
            }
            return prev;
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
          showError(error || "Failed to get response");
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
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
    if (!window.confirm("Are you sure you want to clear all chat history?"))
      return;

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER SECTION */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                AI Research Assistant
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 ml-1">
              Your intelligent partner for chemical analysis and discovery
              insights.
            </p>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
          )}
        </div>

        {/* CONTEXT SELECTOR */}
        {discoveries.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <FlaskConical className="w-4 h-4 text-primary-500" />
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Reference Context (Optional)
              </label>
            </div>
            <div className="relative">
              <select
                value={selectedDiscovery || ""}
                onChange={(e) => setSelectedDiscovery(e.target.value || null)}
                className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white transition-all"
              >
                <option value="">No specific discovery context</option>
                {discoveries.map((discovery) => (
                  <option key={discovery._id} value={discovery._id}>
                    {discovery.criteria.substring(0, 50)}... (
                    {new Date(discovery.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* MAIN CHAT WINDOW */}
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden flex flex-col"
          style={{ height: "600px" }}
        >
          {/* Chat Messages Area - ADD onScroll handler */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50 scroll-smooth"
            style={{ minHeight: 0 }}
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-80">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Start a Conversation
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Ask me about chemical properties, analyze your discovery
                  results, or get guidance on synthesis pathways.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message._id} message={message} />
              ))
            )}

            {isLoading && (
              <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400 pl-2">
                <div className="relative">
                  <Bot className="w-6 h-6 text-primary-500" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
                  </span>
                </div>
                <span className="text-sm font-medium animate-pulse">
                  Thinking...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <ChatInput
              onSend={handleSendMessage}
              disabled={isLoading || isStreaming}
              isStreaming={isStreaming}
            />
          </div>
        </div>

        {/* EXAMPLE QUESTIONS */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
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
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(example)}
                disabled={isLoading || isStreaming}
                className="group flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800/50 rounded-xl text-left text-sm text-gray-700 dark:text-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  {example}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;

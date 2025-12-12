import { User, Bot, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

const ChatMessage = ({ message, onViewDiscovery }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMessageWithLinks = (text) => {
    const compoundPattern =
      /(compound \d+|[A-Z][a-z]*(?:-\d+-[a-z]+)?(?:\s+[A-Z][a-z]*)*|C\d+H\d+(?:O\d+)?(?:N\d+)?)/gi;

    const parts = text.split(compoundPattern);
    const matches = text.match(compoundPattern) || [];

    let result = [];
    let matchIndex = 0;

    parts.forEach((part, index) => {
      if (part) {
        result.push(<span key={`text-${index}`}>{part}</span>);
      }

      if (matchIndex < matches.length) {
        const match = matches[matchIndex];
        result.push(
          <span
            key={`match-${matchIndex}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded font-medium cursor-help border border-indigo-200 dark:border-indigo-800"
            title="Referenced compound"
          >
            {match}
          </span>
        );
        matchIndex++;
      }
    });

    return result;
  };

  return (
    <div
      className={`flex gap-4 ${
        isUser ? "flex-row-reverse" : "flex-row"
      } animate-fadeIn`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-primary-500 to-cyan-600"
            : "bg-gradient-to-br from-indigo-500 to-purple-600"
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`flex-1 max-w-3xl ${
          isUser ? "items-end" : "items-start"
        } flex flex-col`}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-2 mb-2 ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {isUser ? "You" : "AI Assistant"}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>

        {/* Content */}
        <div
          className={`relative group rounded-2xl px-5 py-4 shadow-sm ${
            isUser
              ? "bg-gradient-to-br from-primary-600 to-cyan-600 text-white"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
          }`}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {isUser ? (
              <p className="text-white whitespace-pre-wrap">
                {message.message}
              </p>
            ) : (
              <div className="text-gray-800 dark:text-gray-200">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-3 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-3 space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm">{children}</li>
                    ),
                    code: ({ inline, children }) =>
                      inline ? (
                        <code className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-mono">
                          {children}
                        </code>
                      ) : (
                        <code className="block p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs font-mono overflow-x-auto">
                          {children}
                        </code>
                      ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-gray-900 dark:text-white">
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {message.message}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
              isUser
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
            }`}
            title="Copy message"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Discovery Context Badge */}
        {message.context && message.context.discoveryId && (
          <button
            onClick={() =>
              onViewDiscovery && onViewDiscovery(message.context.discoveryId)
            }
            className="flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs text-indigo-700 dark:text-indigo-300 font-medium transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Referenced Discovery
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;

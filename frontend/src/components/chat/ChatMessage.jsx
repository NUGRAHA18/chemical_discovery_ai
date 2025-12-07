import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ChatMessage = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm ${
          isUser
            ? "bg-primary-600 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
        }`}
      >
        {/* Header: Role & Timestamp */}
        <div className="flex items-center space-x-2 mb-2 opacity-75 border-b border-white/20 pb-1">
          <span className="text-xs font-bold uppercase tracking-wide">
            {isUser ? "You" : "AI Assistant"}
          </span>
          <span className="text-[10px]">
            {message.createdAt
              ? new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>
        </div>

        {/* Content Body */}
        <div
          className={`text-sm leading-relaxed overflow-hidden ${
            isUser ? "text-white" : ""
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]} // Plugin Wajib untuk Tabel
            components={{
              // Styling khusus untuk Tabel
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-3 rounded-md border border-gray-300 dark:border-gray-600">
                  <table
                    className="min-w-full divide-y divide-gray-300 dark:divide-gray-600 bg-white dark:bg-gray-900"
                    {...props}
                  />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead className="bg-gray-100 dark:bg-gray-800" {...props} />
              ),
              th: ({ node, ...props }) => (
                <th
                  className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                  {...props}
                />
              ),
              td: ({ node, ...props }) => (
                <td
                  className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700"
                  {...props}
                />
              ),
              // Styling untuk List (Bullet Points)
              ul: ({ node, ...props }) => (
                <ul className="list-disc pl-5 my-2 space-y-1" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />
              ),
              // Styling untuk Code Block
              code: ({ node, inline, className, children, ...props }) => {
                return inline ? (
                  <code
                    className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-xs"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-md my-2 overflow-x-auto text-xs font-mono">
                    <code {...props}>{children}</code>
                  </div>
                );
              },
              // Styling Paragraph agar tidak terlalu rapat
              p: ({ node, ...props }) => (
                <p className="mb-2 last:mb-0" {...props} />
              ),
              // Styling Link
              a: ({ node, ...props }) => (
                <a
                  className="text-blue-500 underline hover:text-blue-400"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
            }}
          >
            {message.message}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

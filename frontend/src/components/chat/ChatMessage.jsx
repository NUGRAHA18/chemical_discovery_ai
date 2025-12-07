import { useMemo } from "react";

const ChatMessage = ({ message }) => {
  const isUser = message.role === "user";

  const formattedMessage = useMemo(() => {
    let text = message.message;

    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
    text = text.replace(
      /`(.*?)`/g,
      '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">$1</code>'
    );

    text = text.replace(/\n/g, "<br/>");

    return text;
  }, [message.message]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-primary-600 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
        }`}
      >
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-xs font-medium opacity-75">
            {isUser ? "You" : "AI Assistant"}
          </span>
          <span className="text-xs opacity-50">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedMessage }}
        />
      </div>
    </div>
  );
};

export default ChatMessage;

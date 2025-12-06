const TemplateCard = ({ template, onSelect }) => {
  const colorClasses = {
    blue: "border-blue-200 hover:border-blue-400 bg-blue-50 dark:bg-blue-900/20",
    green:
      "border-green-200 hover:border-green-400 bg-green-50 dark:bg-green-900/20",
    purple:
      "border-purple-200 hover:border-purple-400 bg-purple-50 dark:bg-purple-900/20",
    emerald:
      "border-emerald-200 hover:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
    amber:
      "border-amber-200 hover:border-amber-400 bg-amber-50 dark:bg-amber-900/20",
    red: "border-red-200 hover:border-red-400 bg-red-50 dark:bg-red-900/20",
    orange:
      "border-orange-200 hover:border-orange-400 bg-orange-50 dark:bg-orange-900/20",
    indigo:
      "border-indigo-200 hover:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20",
  };

  const badgeClasses = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200",
    green: "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200",
    purple:
      "bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200",
    red: "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200",
    orange:
      "bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200",
    indigo:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200",
  };

  return (
    <div
      onClick={() => onSelect(template)}
      className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${
        colorClasses[template.color] || colorClasses.blue
      }`}
    >
      {/* Icon & Category */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-4xl">{template.icon}</span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            badgeClasses[template.color] || badgeClasses.blue
          }`}
        >
          {template.category}
        </span>
      </div>

      {/* Name */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {template.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {template.description}
      </p>

      {/* Input Mode */}
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
        <span className="mr-2">
          {template.inputMode === "structured" ? "📋" : "💬"}
        </span>
        <span>
          {template.inputMode === "structured"
            ? "Structured Form"
            : "AI Prompt"}
        </span>
      </div>
    </div>
  );
};

export default TemplateCard;

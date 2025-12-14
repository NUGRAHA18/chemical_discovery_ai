import { Trash2, ClipboardList, Sparkles } from "lucide-react";

const TemplateCard = ({ template, onSelect, onDelete }) => {
  const colorClasses = {
    blue: "border-blue-300 hover:border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 hover:shadow-blue-200 dark:hover:shadow-blue-900/50",
    green:
      "border-green-300 hover:border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 hover:shadow-green-200 dark:hover:shadow-green-900/50",
    purple:
      "border-purple-300 hover:border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 hover:shadow-purple-200 dark:hover:shadow-purple-900/50",
    emerald:
      "border-emerald-300 hover:border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 hover:shadow-emerald-200 dark:hover:shadow-emerald-900/50",
    amber:
      "border-amber-300 hover:border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 hover:shadow-amber-200 dark:hover:shadow-amber-900/50",
    red: "border-red-300 hover:border-red-500 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 hover:shadow-red-200 dark:hover:shadow-red-900/50",
    orange:
      "border-orange-300 hover:border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 hover:shadow-orange-200 dark:hover:shadow-orange-900/50",
    indigo:
      "border-indigo-300 hover:border-indigo-500 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 hover:shadow-indigo-200 dark:hover:shadow-indigo-900/50",
  };

  const badgeClasses = {
    blue: "bg-blue-600 text-white",
    green: "bg-green-600 text-white",
    purple: "bg-purple-600 text-white",
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-600 text-white",
    red: "bg-red-600 text-white",
    orange: "bg-orange-600 text-white",
    indigo: "bg-indigo-600 text-white",
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div
      onClick={() => onSelect(template)}
      className={`border-2 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 relative group ${
        colorClasses[template.color] || colorClasses.blue
      }`}
    >
      {/* Delete Button (for custom templates) */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          title="Delete custom template"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Custom Badge */}
      {template.custom && (
        <div className="absolute top-3 left-3 px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
          CUSTOM
        </div>
      )}

      {/* Icon & Category */}
      <div className="flex items-center justify-between mb-4 mt-2">
        <span className="text-5xl drop-shadow-lg">{template.icon}</span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
            badgeClasses[template.color] || badgeClasses.blue
          }`}
        >
          {template.category}
        </span>
      </div>

      {/* Name */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {template.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
        {template.description}
      </p>

      {/* Input Mode Badge */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-300 dark:border-gray-600">
        <div className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
          {template.inputMode === "structured" ? (
            <>
              <ClipboardList className="w-4 h-4 mr-1.5" />
              Structured Form
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1.5" />
              AI Prompt
            </>
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Click to use →
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;

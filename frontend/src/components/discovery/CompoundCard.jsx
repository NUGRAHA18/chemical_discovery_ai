import { useState } from "react";
import { Star, Eye, Beaker, GitCompare } from "lucide-react";
import ReactMarkdown from "react-markdown";

const CompoundCard = ({
  compound,
  onAddToFavorites,
  onViewDetails,
  onAddToCompare,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);

  const getValidationColor = (score) => {
    if (score >= 0.8)
      return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
    if (score >= 0.6)
      return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
    return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
  };

  const handleAddToFavorites = async () => {
    setIsAddingToFavorites(true);
    try {
      await onAddToFavorites(compound);
    } finally {
      setIsAddingToFavorites(false);
    }
  };

  // ✅ SIMPLIFIED: Just use the URL directly from backend
  const imageUrl = compound.structure_image;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {compound.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            {compound.formula}
          </p>
        </div>

        {/* Validation Score Badge */}
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${getValidationColor(
            compound.validation_score || 0.5
          )}`}
        >
          Score: {((compound.validation_score || 0.5) * 100).toFixed(0)}%
        </div>
      </div>

      {/* ✅ SIMPLIFIED: Structure Image - just use URL directly */}
      <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex justify-center items-center min-h-[200px]">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={compound.name}
            className="max-w-full max-h-[200px] object-contain"
            onLoad={() => console.log("✅ Image loaded:", imageUrl)}
            onError={(e) => {
              console.error("❌ Image load failed:", imageUrl);
              console.error("Error event:", e);
              setImageError(true);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
            <Beaker className="w-16 h-16 mb-2" />
            <p className="text-sm">Structure image unavailable</p>
            {process.env.NODE_ENV === "development" && imageUrl && (
              <p className="text-xs mt-1 text-red-500">Path: {imageUrl}</p>
            )}
          </div>
        )}
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Molecular Weight
          </p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
            {compound.molecular_weight
              ? `${compound.molecular_weight.toFixed(2)} g/mol`
              : "N/A"}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
            LogP
          </p>
          <p className="text-lg font-bold text-purple-900 dark:text-purple-300">
            {compound.logp !== null && compound.logp !== undefined
              ? compound.logp.toFixed(2)
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Feasibility Notes with Markdown */}
      {compound.feasibility_notes && (
        <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
            Feasibility Notes
          </p>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => (
                  <p
                    className="text-sm text-gray-700 dark:text-gray-300 mb-1"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li
                    className="text-sm text-gray-700 dark:text-gray-300"
                    {...props}
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong
                    className="font-semibold text-gray-900 dark:text-white"
                    {...props}
                  />
                ),
              }}
            >
              {compound.feasibility_notes}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* ✅ FIX 2: Action Buttons - 3 buttons with Compare */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {/* Favorite Button */}
        <button
          onClick={handleAddToFavorites}
          disabled={isAddingToFavorites}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors disabled:opacity-50"
        >
          <Star className="w-4 h-4" />
          <span className="text-sm font-medium">Favorite</span>
        </button>

        {/* Compare Button */}
        <button
          onClick={() => onAddToCompare && onAddToCompare(compound)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <GitCompare className="w-4 h-4" />
          <span className="text-sm font-medium">Compare</span>
        </button>

        {/* Details Button */}
        <button
          onClick={() => onViewDetails(compound)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">Details</span>
        </button>
      </div>
    </div>
  );
};

export default CompoundCard;

import { useState } from "react";
import { Star, Eye, Beaker, GitCompare } from "lucide-react";
import { API_BASE_URL } from "../../utils/constants";
import ReactMarkdown from "react-markdown"; // ✅ FIX 3

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

  // ✅ FIX 1: Better image path handling
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If already base64, return as is
    if (imagePath.startsWith("data:image")) {
      return imagePath;
    }

    // If path starts with /, use API_BASE_URL
    if (imagePath.startsWith("/")) {
      return `${API_BASE_URL}${imagePath}`;
    }

    // Otherwise assume it's a relative path
    return `${API_BASE_URL}/${imagePath}`;
  };

  const imageUrl = getImageUrl(compound.structure_image);

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

      {/* ✅ FIX 1: Structure Image with better error handling */}
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
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs mt-1 text-red-500">
                Path: {compound.structure_image}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Molecular Weight */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
            Molecular Weight
          </p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
            {compound.molecular_weight ||
            compound.calculated_properties?.molecular_weight
              ? `${(
                  compound.molecular_weight ||
                  compound.calculated_properties?.molecular_weight
                ).toFixed(2)} g/mol`
              : "N/A"}
          </p>
        </div>

        {/* LogP */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
            LogP (Lipophilicity)
          </p>
          <p className="text-lg font-bold text-purple-900 dark:text-purple-300">
            {(compound.logp !== null && compound.logp !== undefined) ||
            compound.calculated_properties?.logp !== undefined
              ? (compound.logp || compound.calculated_properties?.logp).toFixed(
                  2
                )
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Base Compound */}
      {compound.base_compound && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
            Base Compound
          </p>
          <p className="text-sm text-gray-900 dark:text-white">
            {compound.base_compound}
          </p>
        </div>
      )}

      {/* Modifications */}
      {compound.modifications && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
            Modifications
          </p>
          <p className="text-sm text-indigo-900 dark:text-indigo-300">
            {compound.modifications}
          </p>
        </div>
      )}

      {/* SMILES */}
      {compound.smiles && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
            SMILES
          </p>
          <p className="text-xs text-gray-900 dark:text-white font-mono break-all">
            {compound.smiles}
          </p>
        </div>
      )}

      {/* ✅ FIX 3: Feasibility Notes with Markdown */}
      {compound.feasibility_notes && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
            Feasibility
          </p>
          <div className="text-sm text-green-900 dark:text-green-300 prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{compound.feasibility_notes}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* ✅ FIX 2: Action Buttons (3 buttons now!) */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {/* Add to Favorites */}
        <button
          onClick={handleAddToFavorites}
          disabled={isAddingToFavorites}
          className="flex items-center justify-center gap-1 px-3 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Add to Favorites"
        >
          <Star className="w-4 h-4" />
          <span className="hidden sm:inline">Favorite</span>
        </button>

        {/* ✅ FIX 2: Add to Compare Button */}
        <button
          onClick={() => onAddToCompare && onAddToCompare(compound)}
          className="flex items-center justify-center gap-1 px-3 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors text-sm"
          title="Add to Compare"
        >
          <GitCompare className="w-4 h-4" />
          <span className="hidden sm:inline">Compare</span>
        </button>

        {/* View Details */}
        <button
          onClick={() => onViewDetails(compound)}
          className="flex items-center justify-center gap-1 px-3 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Details</span>
        </button>
      </div>
    </div>
  );
};

export default CompoundCard;

import { useState } from "react";
import { Star, Eye, Beaker, Atom } from "lucide-react";
import { API_BASE_URL } from "../../utils/constants";

const CompoundCard = ({ compound, onAddToFavorites, onViewDetails }) => {
  const [imageError, setImageError] = useState(false);
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);
  // In CompoundCard.jsx, add console.log
  console.log("Image path:", compound.structure_image);
  console.log("Full URL:", `${API_BASE_URL}${compound.structure_image}`);
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

      {/* ✅ FIX 1: Structure Image with proper path and fallback */}
      <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex justify-center items-center min-h-[200px]">
        {compound.structure_image && !imageError ? (
          <img
            src={`${API_BASE_URL}${compound.structure_image}`}
            alt={compound.name}
            className="max-w-full max-h-[200px] object-contain"
            onError={() => {
              console.error("Image load failed:", compound.structure_image);
              setImageError(true);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
            <Beaker className="w-16 h-16 mb-2" />
            <p className="text-sm">Structure image unavailable</p>
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
            {compound.molecular_weight
              ? `${compound.molecular_weight.toFixed(2)} g/mol`
              : "N/A"}
          </p>
        </div>

        {/* LogP */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
            LogP (Lipophilicity)
          </p>
          <p className="text-lg font-bold text-purple-900 dark:text-purple-300">
            {compound.logp !== null && compound.logp !== undefined
              ? compound.logp.toFixed(2)
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

      {/* Feasibility Notes */}
      {compound.feasibility_notes && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
            Feasibility
          </p>
          <p className="text-sm text-green-900 dark:text-green-300">
            {compound.feasibility_notes}
          </p>
        </div>
      )}

      {/* ✅ FIX 2: Action Buttons - Add to Favorites & View Details */}
      <div className="flex gap-2 mt-4">
        {/* Add to Favorites Button */}
        <button
          onClick={handleAddToFavorites}
          disabled={isAddingToFavorites}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Star className="w-4 h-4" />
          {isAddingToFavorites ? "Adding..." : "Add to Favorites"}
        </button>

        {/* View Details Button */}
        <button
          onClick={() => onViewDetails(compound)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          <Eye className="w-4 h-4" />
          Details
        </button>
      </div>
    </div>
  );
};

export default CompoundCard;

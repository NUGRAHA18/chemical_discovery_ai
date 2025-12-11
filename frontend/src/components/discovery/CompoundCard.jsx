import { useState } from "react";
import { Star, Eye, Beaker, GitCompare } from "lucide-react";
import { favoritesService } from "../../services/favorites";
import { showError, showSuccess } from "../../utils/toast";
import ReactMarkdown from "react-markdown";
import { getImageUrl } from "../../config/env";

const CompoundCard = ({
  compound,
  onAddToFavorites,
  onViewDetails,
  onAddToCompare,
}) => {
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = getImageUrl(compound.structure_image);

  const handleAddToFavorites = async () => {
    if (isAddingToFavorites) return;
    setIsAddingToFavorites(true);
    try {
      await favoritesService.addFavorite({
        compoundData: compound,
        tags: ["discovery"],
        notes: "Added from discovery",
      });
      showSuccess("Added to favorites!");
      if (onAddToFavorites) onAddToFavorites(compound);
    } catch (error) {
      if (error.response?.status === 400) {
        showError("Compound already in favorites");
      } else {
        showError("Failed to add to favorites");
      }
    } finally {
      setIsAddingToFavorites(false);
    }
  };

  const getValidationColor = (score) => {
    if (score >= 0.8)
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
    if (score >= 0.6)
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
    return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all p-5 flex flex-col h-full min-h-[500px]">
      {/* Header */}
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white pr-2 line-clamp-2">
            {compound.name}
          </h3>
          {compound.validation_score !== undefined && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${getValidationColor(
                compound.validation_score
              )}`}
            >
              {(compound.validation_score * 100).toFixed(0)}%
            </span>
          )}
        </div>
        <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
          {compound.formula}
        </p>
      </div>

      {/* Structure Image */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 flex items-center justify-center min-h-[200px]">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={compound.name}
            className="max-w-full max-h-[200px] object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
            <Beaker className="w-16 h-16 mb-2" />
            <p className="text-sm">Structure unavailable</p>
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

      {/* Feasibility Notes */}
      {compound.feasibility_notes && (
        <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 flex-grow">
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

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 mt-auto">
        <button
          onClick={handleAddToFavorites}
          disabled={isAddingToFavorites}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors disabled:opacity-50"
        >
          <Star className="w-4 h-4" />
          <span className="text-sm font-medium">Favorite</span>
        </button>

        <button
          onClick={() => onAddToCompare && onAddToCompare(compound)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <GitCompare className="w-4 h-4" />
          <span className="text-sm font-medium">Compare</span>
        </button>

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

import { useState, useEffect, useCallback } from "react";
import { favoritesService } from "../services/favorites";
import FavoriteCard from "../components/favorites/FavoriteCard";
import Loading from "../components/common/Loading";
import { showError, showSuccess } from "../utils/toast";

// Import Icons
import { Star, Tag, Filter, X, FlaskConical, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await favoritesService.getFavorites();
      const favs = data.favorites || [];
      setFavorites(favs);

      const tags = new Set();
      favs.forEach((fav) => {
        fav.tags?.forEach((tag) => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));
    } catch (error) {
      console.error("Failed to load favorites:", error);
      showError("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleUpdate = useCallback(
    async (id, updates) => {
      try {
        await favoritesService.updateFavorite(id, updates);
        showSuccess("Favorite updated successfully!");
        loadFavorites();
      } catch (error) {
        showError("Failed to update favorite");
      }
    },
    [loadFavorites]
  );

  const handleDelete = useCallback(
    async (id) => {
      if (
        !window.confirm("Are you sure you want to remove this from favorites?")
      )
        return;
      try {
        await favoritesService.deleteFavorite(id);
        showSuccess("Favorite deleted successfully!");
        loadFavorites();
      } catch (error) {
        showError("Failed to delete favorite");
      }
    },
    [loadFavorites]
  );

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredFavorites =
    selectedTags.length > 0
      ? favorites.filter((fav) =>
          fav.tags?.some((tag) => selectedTags.includes(tag))
        )
      : favorites;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400 fill-current" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Favorite Compounds
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-1">
            Manage your curated collection of promising chemical candidates.
          </p>
        </div>

        {/* TAG FILTERS */}
        {availableTags.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Filter by Tags
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                    selectedTags.includes(tag)
                      ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700 shadow-sm"
                      : "bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Tag
                    className={`w-3 h-3 mr-1.5 ${
                      selectedTags.includes(tag) ? "fill-current" : ""
                    }`}
                  />
                  {tag}
                </button>
              ))}

              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="ml-2 inline-flex items-center text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 transition-colors"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <Loading size="lg" />
            <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
              Loading your collection...
            </p>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              {selectedTags.length > 0 ? (
                <Filter className="h-8 w-8 text-gray-400" />
              ) : (
                <Heart className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {selectedTags.length > 0
                ? "No matches found"
                : "No favorites yet"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
              {selectedTags.length > 0
                ? "Try selecting different tags or clear the filter."
                : "Star compounds from your discovery results or history to see them here."}
            </p>
            {selectedTags.length === 0 && (
              <Link
                to="/discover"
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm transition-colors font-medium text-sm"
              >
                <FlaskConical className="w-4 h-4 mr-2" />
                Start Discovering
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredFavorites.map((favorite) => (
              <FavoriteCard
                key={favorite._id}
                favorite={favorite}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;

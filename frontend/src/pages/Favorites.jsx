import { useState, useEffect, useCallback } from "react";
import { favoritesService } from "../services/favorites";
import FavoriteCard from "../components/favorites/FavoriteCard";
import Loading from "../components/common/Loading";
import { showError } from "../utils/toast";

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    loadFavorites();
  }, [selectedTags]);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await favoritesService.getFavorites();
      setFavorites(data.favorites || []);
    } catch (error) {
      console.error("Failed to load favorites:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Favorite Compounds
          </h1>
          <p className="text-gray-600">Manage your saved compounds</p>
        </div>

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Filter by Tags:
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Favorites Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="card text-center">
            <p className="text-gray-500 mb-4">
              {selectedTags.length > 0
                ? "No favorites with selected tags"
                : "No favorites yet"}
            </p>
            <a href="/discover" className="btn-primary inline-block">
              Start Discovering
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
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

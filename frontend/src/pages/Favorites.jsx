import { useState, useEffect } from "react";
import { favoritesService } from "../services/favorites";
import { showError, showSuccess } from "../utils/toast";
import Loading from "../components/common/Loading";
import FavoriteCard from "../components/favorites/FavoriteCard";
import {
  Star,
  Search,
  Filter,
  X,
  Tag,
  ChevronDown,
  ArrowUpDown,
  Plus,
} from "lucide-react";

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [filters, setFilters] = useState({
    search: "",
    selectedTags: [],
    minMW: "",
    maxMW: "",
    minLogP: "",
    maxLogP: "",
    sortBy: "date", // date, name, mw, validation
    sortOrder: "desc", // asc, desc
  });

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.selectedTags.length +
    (filters.minMW ? 1 : 0) +
    (filters.maxMW ? 1 : 0) +
    (filters.minLogP ? 1 : 0) +
    (filters.maxLogP ? 1 : 0);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await favoritesService.getFavorites();
      setFavorites(data.favorites || []);

      // Extract unique tags
      const tags = new Set();
      data.favorites?.forEach((fav) => {
        fav.tags?.forEach((tag) => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
    } catch (error) {
      showError("Failed to load favorites");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove from favorites?")) return;

    try {
      await favoritesService.deleteFavorite(id);
      showSuccess("Removed from favorites");
      loadFavorites();
    } catch (error) {
      showError("Failed to remove favorite");
    }
  };

  const handleUpdateTags = async (id, newTags) => {
    try {
      await favoritesService.updateFavorite(id, { tags: newTags });
      showSuccess("Tags updated");
      loadFavorites();
    } catch (error) {
      showError("Failed to update tags");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tag) => {
    setFilters((prev) => {
      const newTags = prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag];
      return { ...prev, selectedTags: newTags };
    });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      selectedTags: [],
      minMW: "",
      maxMW: "",
      minLogP: "",
      maxLogP: "",
      sortBy: "date",
      sortOrder: "desc",
    });
  };

  // Apply filters and sorting
  const filteredFavorites = favorites
    .filter((fav) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = fav.compoundData.name
          ?.toLowerCase()
          .includes(searchLower);
        const matchesFormula = fav.compoundData.formula
          ?.toLowerCase()
          .includes(searchLower);
        const matchesNotes = fav.notes?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesFormula && !matchesNotes) return false;
      }

      // Tag filter
      if (filters.selectedTags.length > 0) {
        const hasTag = filters.selectedTags.some((tag) =>
          fav.tags?.includes(tag)
        );
        if (!hasTag) return false;
      }

      // MW filter
      const mw = fav.compoundData.molecular_weight;
      if (filters.minMW && mw < parseFloat(filters.minMW)) return false;
      if (filters.maxMW && mw > parseFloat(filters.maxMW)) return false;

      // LogP filter
      const logp = fav.compoundData.logp;
      if (filters.minLogP && logp < parseFloat(filters.minLogP)) return false;
      if (filters.maxLogP && logp > parseFloat(filters.maxLogP)) return false;

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "name":
          comparison = (a.compoundData.name || "").localeCompare(
            b.compoundData.name || ""
          );
          break;
        case "mw":
          comparison =
            (a.compoundData.molecular_weight || 0) -
            (b.compoundData.molecular_weight || 0);
          break;
        case "validation":
          comparison =
            (a.compoundData.validation_score || 0) -
            (b.compoundData.validation_score || 0);
          break;
        case "date":
        default:
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
      }

      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
              <Star className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Favorites
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Your saved compounds collection
              </p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search favorites..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showFilters || activeFilterCount > 0
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 bg-yellow-500 text-white rounded-full text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-medium transition-all"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}

            {/* Sort */}
            <div className="flex items-center gap-2">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500"
              >
                <option value="date">Date Added</option>
                <option value="name">Name</option>
                <option value="mw">Molecular Weight</option>
                <option value="validation">Validation Score</option>
              </select>

              <button
                onClick={() =>
                  handleFilterChange(
                    "sortOrder",
                    filters.sortOrder === "asc" ? "desc" : "asc"
                  )
                }
                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title={filters.sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Tag className="w-3 h-3 inline mr-1" />
                    Filter by Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          filters.selectedTags.includes(tag)
                            ? "bg-yellow-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Property Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Molecular Weight */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Min MW (g/mol)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={filters.minMW}
                    onChange={(e) =>
                      handleFilterChange("minMW", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Max MW (g/mol)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={filters.maxMW}
                    onChange={(e) =>
                      handleFilterChange("maxMW", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>

                {/* LogP */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Min LogP
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. -2"
                    value={filters.minLogP}
                    onChange={(e) =>
                      handleFilterChange("minLogP", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Max LogP
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 5"
                    value={filters.maxLogP}
                    onChange={(e) =>
                      handleFilterChange("maxLogP", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {filteredFavorites.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Star className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {activeFilterCount > 0
                ? "No matching favorites"
                : "No favorites yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {activeFilterCount > 0
                ? "Try adjusting your filters"
                : "Save compounds from your discoveries to see them here"}
            </p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing{" "}
                <span className="font-semibold">
                  {filteredFavorites.length}
                </span>{" "}
                of <span className="font-semibold">{favorites.length}</span>{" "}
                favorites
              </div>

              {allTags.length === 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  💡 Tip: Add tags to organize your favorites
                </div>
              )}
            </div>

            {/* Favorites Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map((favorite) => (
                <FavoriteCard
                  key={favorite._id}
                  favorite={favorite}
                  onDelete={handleDelete}
                  onUpdateTags={handleUpdateTags}
                  allTags={allTags}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Favorites;

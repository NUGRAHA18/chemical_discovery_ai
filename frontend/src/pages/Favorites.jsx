import { useState, useEffect, useCallback } from "react";
import { favoritesService } from "../services/favorites";
import { showError, showSuccess } from "../utils/toast";
import Loading from "../components/common/Loading";
import MolecularViewer3D from "../components/discovery/MoleculeViewer3D";
import PropertyCalculatorEnhanced from "../components/discovery/PropertyCalculatorEnhanced";
import {
  Star,
  Search,
  Filter,
  X,
  Trash2,
  Heart,
  Edit3,
  Tag,
  Maximize2,
  ChevronDown,
} from "lucide-react";

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCompound, setSelectedCompound] = useState(null);
  const [editingFavorite, setEditingFavorite] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    selectedTags: [],
    minMW: "",
    maxMW: "",
    minLogP: "",
    maxLogP: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  const activeFilterCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v && v !== "date" && v !== "desc";
  }).length;

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await favoritesService.getFavorites();
      setFavorites(data.favorites || []);
    } catch (error) {
      showError("Failed to load favorites");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove from favorites?")) return;

    try {
      await favoritesService.removeFavorite(id);
      showSuccess("Removed from favorites");
      loadFavorites();
    } catch (error) {
      showError("Failed to remove");
    }
  };

  const handleStartEdit = (favorite) => {
    setEditingFavorite(favorite._id);
    setEditNotes(favorite.notes || "");
    setEditTags(favorite.tags?.join(", ") || "");
  };

  const handleSaveEdit = async (id) => {
    try {
      const tagsArray = editTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      await favoritesService.updateFavorite(id, {
        notes: editNotes,
        tags: tagsArray,
      });

      showSuccess("Updated!");
      setEditingFavorite(null);
      loadFavorites();
    } catch (error) {
      showError("Failed to update");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleTagFilter = (tag) => {
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

  // Get all unique tags
  const allTags = [...new Set(favorites.flatMap((f) => f.tags || []))];

  // Apply filters
  const filteredFavorites = favorites
    .filter((fav) => {
      // Search filter - WORD BASED
      if (filters.search) {
        const searchWords = filters.search.toLowerCase().trim().split(/\s+/);
        const searchableText = [
          fav.compoundData.name || "",
          fav.compoundData.formula || "",
          fav.notes || "",
        ]
          .join(" ")
          .toLowerCase();

        if (!searchWords.every((word) => searchableText.includes(word))) {
          return false;
        }
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
          <div className="flex items-center gap-3">
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

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Filter by Tags:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagFilter(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filters.selectedTags.includes(tag)
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search - WORD BASED */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by words (e.g. benzene alcohol)..."
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
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-yellow-500 text-white rounded-full text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-yellow-600 hover:text-yellow-700 text-sm font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* MW Range */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Molecular Weight
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minMW}
                      onChange={(e) =>
                        handleFilterChange("minMW", e.target.value)
                      }
                      className="w-1/2 px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxMW}
                      onChange={(e) =>
                        handleFilterChange("maxMW", e.target.value)
                      }
                      className="w-1/2 px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* LogP Range */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    LogP
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      step="0.1"
                      value={filters.minLogP}
                      onChange={(e) =>
                        handleFilterChange("minLogP", e.target.value)
                      }
                      className="w-1/2 px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      step="0.1"
                      value={filters.maxLogP}
                      onChange={(e) =>
                        handleFilterChange("maxLogP", e.target.value)
                      }
                      className="w-1/2 px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  >
                    <option value="date">Date Added</option>
                    <option value="name">Name</option>
                    <option value="mw">Molecular Weight</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Order
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) =>
                      handleFilterChange("sortOrder", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
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
                : "Save compounds from discoveries to see them here"}
            </p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold">{filteredFavorites.length}</span>{" "}
              of <span className="font-semibold">{favorites.length}</span>{" "}
              favorites
            </div>

            {/* Favorites Grid - CLICKABLE CARDS */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map((favorite) => (
                <div
                  key={favorite._id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-yellow-300 dark:hover:border-yellow-700 transition-all cursor-pointer group"
                  onClick={() => setSelectedCompound(favorite.compoundData)}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                        {favorite.compoundData.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {favorite.compoundData.formula}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCompound(favorite.compoundData);
                      }}
                      className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="View Details"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Structure Image */}
                  <div className="mb-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 h-40 flex items-center justify-center">
                    {favorite.compoundData.structure_image ? (
                      <img
                        src={favorite.compoundData.structure_image}
                        alt={favorite.compoundData.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextElementSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="flex-col items-center justify-center text-gray-400"
                      style={{
                        display: favorite.compoundData.structure_image
                          ? "none"
                          : "flex",
                      }}
                    >
                      <div className="text-4xl mb-2">⚗️</div>
                      <p className="text-xs">Structure unavailable</p>
                    </div>
                  </div>

                  {/* Properties */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        MW
                      </p>
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-300">
                        {favorite.compoundData.molecular_weight
                          ? `${favorite.compoundData.molecular_weight.toFixed(
                              1
                            )} g/mol`
                          : "N/A"}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        LogP
                      </p>
                      <p className="text-sm font-bold text-purple-900 dark:text-purple-300">
                        {favorite.compoundData.logp !== null &&
                        favorite.compoundData.logp !== undefined
                          ? favorite.compoundData.logp.toFixed(2)
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  {favorite.tags && favorite.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {favorite.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes Preview */}
                  {favorite.notes && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-2 mb-3">
                      {favorite.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(favorite);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(favorite._id);
                      }}
                      className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Date */}
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Added{" "}
                    {new Date(favorite.createdAt).toLocaleDateString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* DETAIL MODAL - 3D + PROPERTIES */}
      {selectedCompound && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCompound(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedCompound.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
                  {selectedCompound.formula}
                </p>
              </div>
              <button
                onClick={() => setSelectedCompound(null)}
                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* 2D Structure Image */}
              {selectedCompound.structure_image && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    2D Structure
                  </h3>
                  <div className="flex justify-center">
                    <img
                      src={selectedCompound.structure_image}
                      alt={selectedCompound.name}
                      className="max-w-md max-h-64 object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                    <div
                      className="flex-col items-center text-gray-400"
                      style={{ display: "none" }}
                    >
                      <div className="text-5xl mb-2">⚗️</div>
                      <p className="text-sm">Image unavailable</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3D Viewer */}
              <MolecularViewer3D
                smiles={selectedCompound.smiles || selectedCompound.formula}
                compoundName={selectedCompound.name}
              />

              {/* Basic Info */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Basic Information
                </h3>
                <dl className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">SMILES</dt>
                    <dd className="font-mono font-semibold text-gray-900 dark:text-white break-all">
                      {selectedCompound.smiles || "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">
                      Molecular Weight
                    </dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">
                      {selectedCompound.molecular_weight?.toFixed(2) || "N/A"}{" "}
                      g/mol
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">LogP</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">
                      {selectedCompound.logp !== null &&
                      selectedCompound.logp !== undefined
                        ? selectedCompound.logp.toFixed(2)
                        : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">
                      Base Compound
                    </dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">
                      {selectedCompound.base_compound || "N/A"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Property Calculator Enhanced */}
              <PropertyCalculatorEnhanced compound={selectedCompound} />
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingFavorite && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditingFavorite(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Edit Favorite
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="e.g. aromatic, drug-like, high-mw"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this compound..."
                  rows="4"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleSaveEdit(editingFavorite)}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingFavorite(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;

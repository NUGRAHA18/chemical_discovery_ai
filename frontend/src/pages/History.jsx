import { useState, useEffect, useCallback } from "react";
import { discoveryService } from "../services/discovery";
import { favoritesService } from "../services/favorites";
import { showError, showSuccess } from "../utils/toast";
import Loading from "../components/common/Loading";
import MolecularViewer3D from "../components/discovery/MoleculeViewer3D";
import PropertyCalculatorEnhanced from "../components/discovery/PropertyCalculatorEnhanced";
import AdvancedSearch from "../components/discovery/AdvancedSearch";
import AdvancedFilters from "../components/discovery/AdvancedFilters";
import {
  History as HistoryIcon,
  Search,
  SlidersHorizontal,
  X,
  Trash2,
  Download,
  Heart,
  Sparkles,
  Maximize2,
} from "lucide-react";
import { exportDiscoveryToPDF } from "../utils/pdfExport";

const History = () => {
  const [discoveries, setDiscoveries] = useState([]);
  const [allCompounds, setAllCompounds] = useState([]); // For advanced search
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCompound, setSelectedCompound] = useState(null); // For detail modal
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
    minMW: "",
    maxMW: "",
    minLogP: "",
    maxLogP: "",
    minValidation: "",
    inputMode: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== "all" && v !== "date" && v !== "desc"
  ).length;

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: 12,
      };

      if (filters.search) params.search = filters.search;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.minMW) params.minMW = filters.minMW;
      if (filters.maxMW) params.maxMW = filters.maxMW;
      if (filters.minLogP) params.minLogP = filters.minLogP;
      if (filters.maxLogP) params.maxLogP = filters.maxLogP;
      if (filters.minValidation) params.minValidation = filters.minValidation;
      if (filters.inputMode !== "all") params.inputMode = filters.inputMode;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;

      const data = await discoveryService.getHistory(params);
      setDiscoveries(data.discoveries || []);
      setTotalPages(data.pagination?.totalPages || 1);

      // Extract all compounds for advanced search
      const compounds = (data.discoveries || []).flatMap(
        (d) => d.compounds || []
      );
      setAllCompounds(compounds);
    } catch (error) {
      showError("Failed to load history");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // WORD-BASED SEARCH (not character-based)
  const filterDiscoveriesByWords = (discoveries) => {
    if (!filters.search.trim()) return discoveries;

    const searchWords = filters.search.toLowerCase().trim().split(/\s+/);

    return discoveries.filter((discovery) => {
      const searchableText = [
        discovery.criteria || "",
        ...(discovery.compounds || []).map(
          (c) => `${c.name} ${c.formula} ${c.smiles || ""}`
        ),
      ]
        .join(" ")
        .toLowerCase();

      // Check if ALL search words exist in text
      return searchWords.every((word) => searchableText.includes(word));
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this discovery?")) return;

    try {
      await discoveryService.deleteDiscovery(id);
      showSuccess("Discovery deleted");
      loadHistory();
    } catch (error) {
      showError("Failed to delete discovery");
    }
  };

  const handleExportPDF = async (discovery) => {
    try {
      const result = await exportDiscoveryToPDF(discovery);
      if (result.success) {
        showSuccess("PDF exported!");
      }
    } catch (error) {
      showError("Export failed");
    }
  };

  const handleAddToFavorites = async (compound) => {
    try {
      await favoritesService.addFavorite({
        compoundData: compound,
        tags: ["from-history"],
        notes: "Added from history",
      });
      showSuccess("Added to favorites!");
    } catch (error) {
      showError("Failed to add (might exist)");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      dateFrom: "",
      dateTo: "",
      minMW: "",
      maxMW: "",
      minLogP: "",
      maxLogP: "",
      minValidation: "",
      inputMode: "all",
      sortBy: "date",
      sortOrder: "desc",
    });
    setPage(1);
  };

  // Apply word-based filtering
  const displayedDiscoveries = filterDiscoveriesByWords(discoveries);

  if (loading && page === 1) {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                <HistoryIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Discovery History
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Browse and analyze your past discoveries
                </p>
              </div>
            </div>

            {/* Advanced Search Toggle */}
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showAdvancedSearch
                  ? "bg-purple-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {showAdvancedSearch ? "Hide" : "Show"} Advanced Search
            </button>
          </div>
        </div>

        {/* Advanced Search Panel */}
        {showAdvancedSearch && (
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <AdvancedSearch
              compounds={allCompounds}
              onResultsFound={(results) => {
                // Filter discoveries that contain these compounds
                const compoundIds = results.map((r) => r._id);
                const filtered = discoveries.filter((d) =>
                  d.compounds.some((c) => compoundIds.includes(c._id))
                );
                setDiscoveries(filtered);
              }}
            />
            <AdvancedFilters
              compounds={allCompounds}
              onFilterChange={(filtered) => {
                const compoundIds = filtered.map((r) => r._id);
                const filteredDiscoveries = discoveries.filter((d) =>
                  d.compounds.some((c) => compoundIds.includes(c._id))
                );
                setDiscoveries(filteredDiscoveries);
              }}
            />
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
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              {filters.search && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-10">
                  Searching for:{" "}
                  {filters.search.split(/\s+/).map((word, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded mr-1"
                    >
                      {word}
                    </span>
                  ))}
                </p>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showFilters || activeFilterCount > 0
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-orange-500 text-white rounded-full text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
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
                {/* Date From */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>

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

                {/* Input Mode */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Input Mode
                  </label>
                  <select
                    value={filters.inputMode}
                    onChange={(e) =>
                      handleFilterChange("inputMode", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  >
                    <option value="all">All</option>
                    <option value="structured">Structured</option>
                    <option value="ai-prompt">AI Prompt</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {displayedDiscoveries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <HistoryIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {filters.search || activeFilterCount > 0
                ? "No results found"
                : "No discoveries yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filters.search || activeFilterCount > 0
                ? "Try different search terms or adjust filters"
                : "Start discovering compounds to see them here"}
            </p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold">
                {displayedDiscoveries.length}
              </span>{" "}
              {displayedDiscoveries.length === 1 ? "discovery" : "discoveries"}
              {filters.search && ` matching "${filters.search}"`}
            </div>

            {/* Discovery Grid - CLICKABLE CARDS */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {displayedDiscoveries.map((discovery) => (
                <div
                  key={discovery._id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all cursor-pointer group"
                  onClick={() => setSelectedCompound(discovery.compounds[0])} // Click to view first compound
                >
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        discovery.inputMode === "structured"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      }`}
                    >
                      {discovery.inputMode === "structured"
                        ? "📋 Structured"
                        : "💬 AI Prompt"}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompound(discovery.compounds[0]);
                        }}
                        className="p-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded hover:bg-orange-200 dark:hover:bg-orange-900/50"
                        title="View Details"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {discovery.criteria.substring(0, 60)}...
                  </h3>

                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span>🧪 {discovery.compounds?.length || 0} compounds</span>
                    {discovery.metadata?.overall_confidence && (
                      <span>
                        ✓{" "}
                        {(discovery.metadata.overall_confidence * 100).toFixed(
                          0
                        )}
                        %
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(discovery.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>

                  {/* Compounds Preview */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex -space-x-2">
                      {discovery.compounds.slice(0, 3).map((compound, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCompound(compound);
                          }}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white dark:border-gray-800 hover:scale-110 transition-transform"
                          title={compound.name}
                        >
                          {compound.name.charAt(0)}
                        </button>
                      ))}
                      {discovery.compounds.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold flex items-center justify-center border-2 border-white dark:border-gray-800">
                          +{discovery.compounds.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPDF(discovery);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(discovery._id);
                      }}
                      className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddToFavorites(selectedCompound)}
                  className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  title="Add to Favorites"
                >
                  <Heart className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedCompound(null)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* 2D Structure Image */}
              {selectedCompound.structure_image && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    2D Structure
                  </h3>
                  <img
                    src={selectedCompound.structure_image}
                    alt={selectedCompound.name}
                    className="w-full max-w-md mx-auto rounded-lg"
                  />
                </div>
              )}

              {/* 3D Viewer */}
              <MolecularViewer3D
                smiles={selectedCompound.smiles || selectedCompound.formula}
                compoundName={selectedCompound.name}
              />

              {/* Basic Info */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Basic Information
                </h3>
                <dl className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">SMILES</dt>
                    <dd className="font-mono font-semibold text-gray-900 dark:text-white">
                      {selectedCompound.smiles || "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">
                      Molecular Weight
                    </dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">
                      {selectedCompound.molecular_weight} g/mol
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">LogP</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">
                      {selectedCompound.logp}
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
    </div>
  );
};

export default History;

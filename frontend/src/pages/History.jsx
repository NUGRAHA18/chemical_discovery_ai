import { useState, useEffect } from "react";
import { discoveryService } from "../services/discovery";
import { showError, showSuccess } from "../utils/toast";
import Loading from "../components/common/Loading";
import {
  History as HistoryIcon,
  Calendar,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ArrowUpDown,
  Filter,
  Trash2,
  Download,
  Eye,
} from "lucide-react";
import { exportDiscoveryToPDF } from "../utils/pdfExport";

const History = () => {
  const [discoveries, setDiscoveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    loadHistory();
  }, [page, filters]);

  const loadHistory = async () => {
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
    } catch (error) {
      showError("Failed to load history");
      console.error(error);
    } finally {
      setLoading(false);
    }
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
        showSuccess("PDF exported successfully!");
      } else {
        showError("Failed to export PDF");
      }
    } catch (error) {
      showError("Export failed");
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
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
              <HistoryIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Discovery History
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Browse and manage your past discoveries
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
                  placeholder="Search discoveries..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showFilters || activeFilterCount > 0
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 bg-orange-500 text-white rounded-full text-xs font-bold">
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
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              >
                <option value="date">Date</option>
                <option value="validation">Validation Score</option>
                <option value="mw">Molecular Weight</option>
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
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Date From
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

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Date To
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

                {/* Validation Score */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Min Validation (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 70"
                    value={filters.minValidation}
                    onChange={(e) =>
                      handleFilterChange("minValidation", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
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
        {discoveries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <HistoryIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {activeFilterCount > 0
                ? "No results found"
                : "No discoveries yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {activeFilterCount > 0
                ? "Try adjusting your filters"
                : "Start discovering compounds to see them here"}
            </p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold">{discoveries.length}</span>{" "}
              {discoveries.length === 1 ? "discovery" : "discoveries"}
              {activeFilterCount > 0 && " (filtered)"}
            </div>

            {/* Discovery Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {discoveries.map((discovery) => (
                <div
                  key={discovery._id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                      {discovery.inputMode === "structured"
                        ? "Structured"
                        : "AI Prompt"}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(discovery.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {discovery.criteria}
                  </p>

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {discovery.compounds?.length || 0} compounds
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportPDF(discovery)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      onClick={() => handleDelete(discovery._id)}
                      className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>

                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default History;

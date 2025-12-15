import { useState, useEffect, useCallback, useRef } from "react";
import { discoveryService } from "../services/discovery";
import { favoritesService } from "../services/favorites";
import { showError, showSuccess, showLoading } from "../utils/toast";
import Loading from "../components/common/Loading";
import MolecularViewer3D from "../components/discovery/MoleculeViewer3D";
import PropertyCalculatorEnhanced from "../components/discovery/PropertyCalculatorEnhanced";
import AdvancedSearch from "../components/discovery/AdvancedSearch";
import AdvancedFilters from "../components/discovery/AdvancedFilters";
import RangeSlider from "../components/filters/RangeSlider";
import FilterPresets from "../components/filters/FilterPresets";
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
  CheckCircle,
  FlaskConical,
  Calendar,
  ArrowRight,
  Beaker,
  FileText,
} from "lucide-react";
import { exportDiscoveryToPDF } from "../utils/pdfExport";
import { getImageUrl } from "../config/env";

const History = () => {
  const [discoveries, setDiscoveries] = useState([]);
  const [allCompounds, setAllCompounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCompound, setSelectedCompound] = useState(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filteredDiscoveries, setFilteredDiscoveries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

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
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [localFilters, setLocalFilters] = useState(filters);
  const [mwRange, setMwRange] = useState([0, 1000]);
  const [logpRange, setLogpRange] = useState([-5, 10]);

  useEffect(() => {
    setSearchTerm(filters.search);
  }, [filters.search]);

  useEffect(() => {
    setLocalFilters(filters);
    setMwRange([filters.minMW || 0, filters.maxMW || 1000]);
    setLogpRange([filters.minLogP || -5, filters.maxLogP || 10]);
  }, [filters]);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== "all" && v !== "date" && v !== "desc"
  ).length;

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 12 };
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params[key] = filters[key];
      });

      const data = await discoveryService.getHistory(params);
      setDiscoveries(data.discoveries || []);
      setTotalPages(data.pagination?.totalPages || 1);

      const compounds = (data.discoveries || []).flatMap(
        (d) => d.compounds || []
      );
      setAllCompounds(compounds);
    } catch (error) {
      showError("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleLocalFilterChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setFilters(localFilters);
    setPage(1);
    setFilteredDiscoveries([]);
    showSuccess("Filters applied");
  };

  const executeSearch = (term) => {
    setFilters((prev) => ({ ...prev, search: term }));
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
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setPage(1);
    setFilteredDiscoveries([]);
  };

  const handlePresetApply = (presetFilters) => {
    setLocalFilters(presetFilters);
    setFilters(presetFilters);
    setPage(1);
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
      showLoading("Generating PDF...");
      await exportDiscoveryToPDF(discovery);
      showSuccess(`PDF exported`);
    } catch (error) {
      showError("Export failed");
    }
  };

  const handleExportAllFiltered = async () => {
    if (discoveries.length === 0) return;
    try {
      showLoading("Exporting...");
      const dataStr = JSON.stringify(discoveries, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `filtered-discoveries-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showSuccess("Exported successfully");
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
      showError("Failed to add");
    }
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  const displayedDiscoveries =
    filteredDiscoveries.length > 0 ? filteredDiscoveries : discoveries;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
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

            <div className="flex gap-2">
              {discoveries.length > 0 && (
                <button
                  onClick={handleExportAllFiltered}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Filtered ({discoveries.length})
                </button>
              )}
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
        </div>

        {/* Advanced Search Panel */}
        {showAdvancedSearch && (
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <AdvancedSearch
              compounds={allCompounds}
              onResultsFound={(results) => {
                const compoundIds = results.map((c) => c._id || c.id || c.name);
                const filtered = discoveries.filter((d) =>
                  d.compounds?.some(
                    (c) =>
                      compoundIds.includes(c._id) ||
                      compoundIds.includes(c.id) ||
                      compoundIds.includes(c.name)
                  )
                );
                setFilteredDiscoveries(filtered);
              }}
            />
            <AdvancedFilters
              compounds={allCompounds}
              onFilterChange={(results) => {
                const compoundIds = results.map((c) => c._id || c.id || c.name);
                const filtered = discoveries.filter((d) =>
                  d.compounds?.some(
                    (c) =>
                      compoundIds.includes(c._id) ||
                      compoundIds.includes(c.id) ||
                      compoundIds.includes(c.name)
                  )
                );
                setFilteredDiscoveries(filtered);
              }}
            />
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by words (e.g. benzene alcohol)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") executeSearch(searchTerm);
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <button
                  onClick={() => executeSearch(searchTerm)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 font-medium whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
              {filters.search && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-10">
                  Active search: <b>{filters.search}</b>
                </p>
              )}
            </div>

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
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
              <div className="mb-4">
                <FilterPresets
                  currentFilters={localFilters}
                  onApplyPreset={handlePresetApply}
                />
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Date From */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={localFilters.dateFrom}
                    onChange={(e) =>
                      handleLocalFilterChange("dateFrom", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={localFilters.dateTo}
                    onChange={(e) =>
                      handleLocalFilterChange("dateTo", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                {/* Sliders */}
                <div>
                  <RangeSlider
                    label="Molecular Weight (g/mol)"
                    min={0}
                    max={1000}
                    step={10}
                    value={mwRange}
                    onChange={(range) => {
                      setMwRange(range);
                      handleLocalFilterChange("minMW", range[0]);
                      handleLocalFilterChange("maxMW", range[1]);
                    }}
                    unit=" g/mol"
                  />
                </div>
                <div>
                  <RangeSlider
                    label="LogP (Lipophilicity)"
                    min={-5}
                    max={10}
                    step={0.1}
                    value={logpRange}
                    onChange={(range) => {
                      setLogpRange(range);
                      handleLocalFilterChange("minLogP", range[0].toFixed(1));
                      handleLocalFilterChange("maxLogP", range[1].toFixed(1));
                    }}
                  />
                </div>

                {/* Input Mode */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Input Mode
                  </label>
                  <select
                    value={localFilters.inputMode}
                    onChange={(e) =>
                      handleLocalFilterChange("inputMode", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                  >
                    <option value="all">All</option>
                    <option value="structured">Structured</option>
                    <option value="ai-prompt">AI Prompt</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={applyFilters}
                  className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg shadow-sm transition-all transform active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between">
          <div>
            Showing{" "}
            <span className="font-semibold">{displayedDiscoveries.length}</span>{" "}
            discovery results
            {filteredDiscoveries.length > 0 && (
              <span className="text-purple-600 dark:text-purple-400 ml-2">
                (filtered from {discoveries.length} total)
              </span>
            )}
          </div>
          {filteredDiscoveries.length > 0 && (
            <button
              onClick={() => {
                setFilteredDiscoveries([]);
                setShowAdvancedSearch(false);
              }}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 font-medium"
            >
              <X className="w-4 h-4" /> Clear Advanced Filters
            </button>
          )}
        </div>

        {displayedDiscoveries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <HistoryIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No results found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your filters or start a new discovery.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {displayedDiscoveries.map((discovery) => (
              <div
                key={discovery._id}
                className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 flex flex-col h-full overflow-hidden"
                onClick={() => setSelectedCompound(discovery.compounds[0])}
              >
                {/* Header (Date & Type) */}
                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(discovery.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full border ${
                      discovery.inputMode === "structured"
                        ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                        : "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
                    }`}
                  >
                    {discovery.inputMode === "structured"
                      ? "Structured"
                      : "AI Prompt"}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Criteria Title */}
                  <h3 className="text-gray-900 dark:text-white font-bold text-lg leading-snug mb-4 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {discovery.criteria}
                  </h3>

                  {/* Top Compounds List (Replacing circles with readable list) */}
                  <div className="space-y-3 mb-4 flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Top Candidates
                    </p>

                    {discovery.compounds.slice(0, 3).map((compound, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompound(compound);
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-700 cursor-pointer group/item"
                      >
                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded text-indigo-600 dark:text-indigo-400 group-hover/item:bg-white dark:group-hover/item:bg-gray-800 transition-colors">
                          {compound.structure_image ? (
                            <img
                              src={getImageUrl(compound.structure_image)}
                              alt=""
                              className="w-4 h-4 object-cover"
                            />
                          ) : (
                            <Beaker className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">
                            {compound.name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono truncate">
                            {compound.formula}
                          </p>
                        </div>
                        {compound.molecular_weight && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded font-mono">
                            {Math.round(compound.molecular_weight)}
                          </span>
                        )}
                      </div>
                    ))}

                    {discovery.compounds.length > 3 && (
                      <p className="text-xs text-center text-gray-400 mt-2 italic">
                        + {discovery.compounds.length - 3} more compounds...
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                  {/* Confidence */}
                  <div
                    className="flex items-center gap-1.5"
                    title="AI Confidence"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {discovery.metadata?.overall_confidence
                        ? `${(
                            discovery.metadata.overall_confidence * 100
                          ).toFixed(0)}% Score`
                        : "N/A"}
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPDF(discovery);
                      }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                      title="Download PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(discovery._id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors group-hover:translate-x-1 duration-200">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors text-gray-700 dark:text-gray-200"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors text-gray-700 dark:text-gray-200"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedCompound && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCompound(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
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
                  className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedCompound(null)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {selectedCompound.structure_image && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    2D Structure
                  </h3>
                  <img
                    src={getImageUrl(selectedCompound.structure_image)}
                    alt={selectedCompound.name}
                    className="w-full max-w-md mx-auto rounded-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="w-full h-[420px] min-h-[420px]">
                <MolecularViewer3D
                  smiles={selectedCompound.smiles || selectedCompound.formula}
                  compoundName={selectedCompound.name}
                />
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
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
              <PropertyCalculatorEnhanced compound={selectedCompound} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;

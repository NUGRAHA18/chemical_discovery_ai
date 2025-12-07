import { useState, useEffect, useCallback } from "react";
import { discoveryService } from "../services/discovery";
import { favoritesService } from "../services/favorites";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "../utils/toast";
import HistoryList from "../components/history/HistoryList";
import DetailModal from "../components/history/DetailModal";
import Loading from "../components/common/Loading";
import { exportDiscoveryToPDF } from "../utils/pdfExport";
import useDebounce from "../utils/useDebounce";

// Import Icons
import {
  FlaskConical,
  Atom,
  Activity,
  Search,
  History as HistoryIcon,
  Filter,
} from "lucide-react";

const History = () => {
  const [discoveries, setDiscoveries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDiscovery, setSelectedDiscovery] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [historyData, statsData] = await Promise.all([
        discoveryService.getHistory({ search: debouncedSearch }),
        discoveryService.getStats(),
      ]);
      setDiscoveries(historyData.discoveries || []);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load history:", error);
      showError("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id) => {
    // Tambahkan konfirmasi agar lebih aman
    if (
      !window.confirm(
        "Are you sure you want to delete this discovery? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await discoveryService.deleteDiscovery(id);
      setDiscoveries((prev) => prev.filter((d) => d._id !== id));

      // Update stats real-time
      const statsData = await discoveryService.getStats();
      setStats(statsData);

      showSuccess("Discovery deleted successfully");
    } catch (error) {
      showError("Failed to delete discovery");
    }
  };

  const handleAddToFavorites = async (compound) => {
    try {
      await favoritesService.addFavorite({
        compoundData: {
          name: compound.name,
          formula: compound.formula,
          smiles: compound.smiles,
          properties: compound.properties,
          base_compound: compound.base_compound,
          modifications: compound.modifications,
          molecular_weight: compound.molecular_weight,
          logp: compound.logp,
          structure_image: compound.structure_image,
        },
        tags: ["from-history"],
        notes: "Added from history",
      });
      showSuccess("Added to favorites!");
    } catch (error) {
      showError("Failed to add to favorites (might already exist)");
    }
  };

  const handleExportPDF = async (discovery) => {
    const loadingToast = showLoading("Generating PDF...");
    const result = await exportDiscoveryToPDF(discovery);
    dismissToast(loadingToast);

    if (result.success) {
      showSuccess(`PDF exported: ${result.filename}`);
    } else {
      showError("Failed to generate PDF");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER SECTION */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <HistoryIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Discovery History
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-1">
            Archive of your generated chemical compounds and research data.
          </p>
        </div>

        {/* STATS GRID */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Stat 1: Total Discoveries */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:border-blue-200 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Discoveries
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalDiscoveries}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <FlaskConical className="w-6 h-6" />
              </div>
            </div>

            {/* Stat 2: Total Compounds */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:border-purple-200 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Compounds
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalCompounds}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <Atom className="w-6 h-6" />
              </div>
            </div>

            {/* Stat 3: Avg Confidence */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:border-emerald-200 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Avg Confidence
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {(stats.avgConfidence * 100).toFixed(0)}%
                </p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search discoveries by criteria, compound name, or formula..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <span className="text-xs font-semibold">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* MAIN CONTENT LIST */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <Loading size="lg" />
            <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
              Loading history data...
            </p>
          </div>
        ) : (
          <div className="min-h-[400px]">
            {discoveries.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  No discoveries found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {search
                    ? `No results found for "${search}". Try adjusting your search keywords.`
                    : "You haven't generated any compounds yet. Start a new discovery to see results here."}
                </p>
              </div>
            ) : (
              <HistoryList
                discoveries={discoveries}
                onViewDetail={setSelectedDiscovery}
                onDelete={handleDelete}
                loading={false}
              />
            )}
          </div>
        )}

        {/* MODAL */}
        {selectedDiscovery && (
          <DetailModal
            discovery={selectedDiscovery}
            onClose={() => setSelectedDiscovery(null)}
            onAddToFavorites={handleAddToFavorites}
            onExportPDF={handleExportPDF}
          />
        )}
      </div>
    </div>
  );
};

export default History;

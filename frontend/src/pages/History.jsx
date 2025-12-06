import { useState, useEffect, useCallback } from "react";
import { discoveryService } from "../services/discovery";
import { favoritesService } from "../services/favorites";
import { showSuccess, showError } from "../utils/toast";
import HistoryList from "../components/history/HistoryList";
import DetailModal from "../components/history/DetailModal";
import Loading from "../components/common/Loading";
import { exportDiscoveryToPDF } from "../utils/pdfExport";
import { showLoading, dismissToast } from "../utils/toast";
import useDebounce from "../utils/useDebounce";

const History = () => {
  const [discoveries, setDiscoveries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDiscovery, setSelectedDiscovery] = useState(null);

  // ✅ ADD DEBOUNCE
  const debouncedSearch = useDebounce(search, 500); // 500ms delay

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [historyData, statsData] = await Promise.all([
        discoveryService.getHistory({ search: debouncedSearch }), // ✅ Use debounced value
        discoveryService.getStats(),
      ]);
      setDiscoveries(historyData.discoveries || []);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]); // ✅ Depend on debouncedSearch

  useEffect(() => {
    loadData();
  }, [loadData]);
  const handleDelete = async (id) => {
    try {
      await discoveryService.deleteDiscovery(id);
      setDiscoveries(discoveries.filter((d) => d._id !== id));
      loadData(); // Reload stats
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
      showError("Failed to add to favorites");
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
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
            Discovery History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your past discoveries
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2 dark:text-gray-400">
                Total Discoveries
              </h3>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {stats.totalDiscoveries}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2 dark:text-gray-400">
                Total Compounds
              </h3>
              <p className="text-3xl font-bold text-secondary-600 dark:text-gray-400">
                {stats.totalCompounds}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Avg Confidence
              </h3>
              <p className="text-3xl font-bold text-accent-600">
                {(stats.avgConfidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="card mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discoveries by criteria or compound name..."
            className="input-field"
          />
        </div>

        {/* History List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : (
          <HistoryList
            discoveries={discoveries}
            onViewDetail={setSelectedDiscovery}
            onDelete={handleDelete}
            loading={false}
          />
        )}

        {/* Detail Modal */}
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

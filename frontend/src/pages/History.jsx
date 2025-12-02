import { useState, useEffect } from "react";
import { discoveryService } from "../services/discovery";
import { favoritesService } from "../services/favorites";
import HistoryList from "../components/history/HistoryList";
import DetailModal from "../components/history/DetailModal";
import Loading from "../components/common/Loading";
import { useDebounce } from "../utils/hooks";

const History = () => {
  const [discoveries, setDiscoveries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDiscovery, setSelectedDiscovery] = useState(null);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    loadData();
  }, [debouncedSearch]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyData, statsData] = await Promise.all([
        discoveryService.getHistory({ search }),
        discoveryService.getStats(),
      ]);
      setDiscoveries(historyData.discoveries || []);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await discoveryService.deleteDiscovery(id);
      setDiscoveries(discoveries.filter((d) => d._id !== id));
      loadData(); // Reload stats
    } catch (error) {
      alert("Failed to delete discovery");
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
      alert("Added to favorites!");
    } catch (error) {
      alert("Failed to add to favorites");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discovery History
          </h1>
          <p className="text-gray-600">View and manage your past discoveries</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Total Discoveries
              </h3>
              <p className="text-3xl font-bold text-primary-600">
                {stats.totalDiscoveries}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Total Compounds
              </h3>
              <p className="text-3xl font-bold text-secondary-600">
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
          />
        )}
      </div>
    </div>
  );
};

export default History;

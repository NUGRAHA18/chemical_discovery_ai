import { useState } from "react";
import { discoveryService } from "../services/discovery";
import { favoritesService } from "../services/favorites";
import StructuredForm from "../components/discovery/StructuredForm";
import AIPromptForm from "../components/discovery/AIPromptForm";
import CompoundCard from "../components/discovery/CompoundCard";
import Loading from "../components/common/Loading";
import { showSuccess, showError } from "../utils/toast";
import { useComparison } from "../contexts/ComparisonContext";
import ComparisonModal from "../components/discovery/ComparisonModal";

const Discovery = () => {
  const [inputMode, setInputMode] = useState("structured"); // 'structured' or 'ai-prompt'
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [discovery, setDiscovery] = useState(null);
  const [error, setError] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const { comparisonList } = useComparison();

  const handleStructuredSubmit = async (structuredData) => {
    setLoading(true);
    setProgress(10);
    setError("");
    setDiscovery(null);

    try {
      setProgress(30);
      const response = await discoveryService.createDiscovery({
        inputMode: "structured",
        structuredData,
      });

      setProgress(90);
      setDiscovery(response.discovery);
      setProgress(100);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to generate compounds. Please try again."
      );
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleAIPromptSubmit = async (criteria) => {
    setLoading(true);
    setProgress(10);
    setError("");
    setDiscovery(null);

    try {
      setProgress(30);
      const response = await discoveryService.createDiscovery({
        inputMode: "ai-prompt",
        criteria,
      });

      setProgress(90);
      setDiscovery(response.discovery);
      setProgress(100);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to generate compounds. Please try again."
      );
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleAddToFavorites = async (compound) => {
    try {
      const existing = await favoritesService.getFavorites();
      const isDuplicate = existing.favorites?.some(
        (fav) => fav.compoundData.smiles === compound.smiles
      );

      if (isDuplicate) {
        showError("This compound is already in your favorites!");
        return;
      }

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
        tags: ["from-discovery"],
        notes: "Added from discovery",
      });
      showSuccess("Added to favorites successfully!");
    } catch (err) {
      showError("Failed to add to favorites: " + err.response?.data?.error);
    }
  };

  const handleExport = async (format) => {
    if (!discovery || !discovery._id) {
      showError("No discovery to export");
      return;
    }

    try {
      const blob =
        format === "json"
          ? await discoveryService.exportJSON(discovery._id)
          : await discoveryService.exportCSV(discovery._id);

      if (!blob || blob.size === 0) {
        throw new Error("Export data is empty");
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `discovery-${discovery._id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      showError("Export failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chemical Discovery
          </h1>
          <p className="text-gray-600">
            Generate novel chemical compounds using AI
          </p>
        </div>

        {/* Input Mode Toggle */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Input Mode</h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setInputMode("structured")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  inputMode === "structured"
                    ? "bg-white text-primary-600 shadow-sm font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📋 Structured Form
              </button>
              <button
                onClick={() => setInputMode("ai-prompt")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  inputMode === "ai-prompt"
                    ? "bg-white text-primary-600 shadow-sm font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                💬 AI Prompt
              </button>
            </div>
          </div>

          {/* Form Display */}
          {inputMode === "structured" ? (
            <StructuredForm
              onSubmit={handleStructuredSubmit}
              loading={loading}
            />
          ) : (
            <AIPromptForm onSubmit={handleAIPromptSubmit} loading={loading} />
          )}
        </div>

        {/* Loading Progress */}
        {loading && (
          <div className="card mb-8">
            <div className="text-center">
              <Loading size="lg" />
              <p className="text-gray-600 mt-4">Generating compounds...</p>
              <p className="text-sm text-gray-500 mt-2">
                This may take 10-30 seconds
              </p>
              {progress > 0 && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Results */}
        {discovery && (
          <div>
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Generated Compounds ({discovery.compounds?.length || 0})
              </h2>
              <div className="flex space-x-2">
                {comparisonList.length > 0 && (
                  <button
                    onClick={() => setShowComparison(true)}
                    className="btn-secondary text-sm"
                  >
                    ⚖️ Compare ({comparisonList.length})
                  </button>
                )}
                <button
                  onClick={() => handleExport("json")}
                  className="btn-outline text-sm"
                >
                  📥 Export JSON
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="btn-outline text-sm"
                >
                  📥 Export CSV
                </button>
              </div>
            </div>

            {/* Comparison Modal */}
            <ComparisonModal
              isOpen={showComparison}
              onClose={() => setShowComparison(false)}
            />

            {/* Compounds Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {discovery.compounds?.map((compound, idx) => (
                <CompoundCard
                  key={idx}
                  compound={compound}
                  onAddToFavorites={handleAddToFavorites}
                />
              ))}
            </div>

            {/* Analysis & Justification */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Analysis
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {discovery.analysis}
                </p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Justification
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {discovery.justification}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discovery;

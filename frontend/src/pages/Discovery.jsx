import { useState } from "react";
import { discoveryService } from "../services/discovery";
import { favoritesService } from "../services/favorites";
import StructuredForm from "../components/discovery/StructuredForm";
import AIPromptForm from "../components/discovery/AIPromptForm";
import CompoundCard from "../components/discovery/CompoundCard";
import Loading from "../components/common/Loading";
import { showSuccess, showError, showLoading } from "../utils/toast";
import { useComparison } from "../contexts/ComparisonContext";
import ComparisonModal from "../components/discovery/ComparisonModal";
import { exportDiscoveryToPDF } from "../utils/pdfExport";
import { dismissToast } from "../utils/toast";
import TemplatesModal from "../components/discovery/TemplatesModal";

const Discovery = () => {
  const [inputMode, setInputMode] = useState("structured"); // 'structured' or 'ai-prompt'
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [discovery, setDiscovery] = useState(null);
  const [error, setError] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const { comparisonList } = useComparison();
  const [showTemplates, setShowTemplates] = useState(false);

  const [criteria, setCriteria] = useState("");
  const [structuredData, setStructuredData] = useState({
    category: "",
    boilingPointMin: "",
    boilingPointMax: "",
    viscosityMin: "",
    viscosityMax: "",
    solubility: "",
    thermalStabilityMin: "",
    additionalProperties: [],
    notes: "",
  });

  const handleStructuredSubmit = async (structuredData) => {
    setLoading(true);
    setProgress(10);
    setError("");
    setDiscovery(null);

    // ✅ ADD TIMEOUT
    const timeout = setTimeout(() => {
      setLoading(false);
      setProgress(0);
      setError("Request timeout. ML service might be down. Please try again.");
    }, 180000); // 3 minutes

    try {
      setProgress(30);
      const response = await discoveryService.createDiscovery({
        inputMode: "structured",
        structuredData,
      });

      clearTimeout(timeout); // ✅ Clear timeout if success
      setProgress(90);
      setDiscovery(response.discovery);
      setProgress(100);
    } catch (err) {
      clearTimeout(timeout); // ✅ Clear timeout if error
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

    // ✅ ADD TIMEOUT
    const timeout = setTimeout(() => {
      setLoading(false);
      setProgress(0);
      setError("Request timeout. ML service might be down. Please try again.");
    }, 180000); // 3 minutes

    try {
      setProgress(30);
      const response = await discoveryService.createDiscovery({
        inputMode: "ai-prompt",
        criteria,
      });

      clearTimeout(timeout);
      setProgress(90);
      setDiscovery(response.discovery);
      setProgress(100);
    } catch (err) {
      clearTimeout(timeout);
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
    if (!discovery?._id) {
      showError("No discovery to export");
      return;
    }

    try {
      if (format === "pdf") {
        // PDF Export
        const loadingToast = showLoading("Generating PDF...");
        const result = await exportDiscoveryToPDF(discovery);
        dismissToast(loadingToast);

        if (result.success) {
          showSuccess(`PDF exported: ${result.filename}`);
        } else {
          showError("Failed to generate PDF");
        }
      } else if (format === "json") {
        // JSON Export - Direct implementation
        const dataStr = JSON.stringify(discovery, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `discovery-${discovery._id}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showSuccess("Discovery exported as JSON");
      } else if (format === "csv") {
        // CSV Export - Direct implementation
        let csvContent = "Name,Formula,SMILES,MW,LogP,Validation Score\n";

        discovery.compounds?.forEach((compound) => {
          csvContent += `"${compound.name}","${compound.formula}","${compound.smiles}",`;
          csvContent += `${compound.molecular_weight || "N/A"},`;
          csvContent += `${
            compound.logp !== null && compound.logp !== undefined
              ? compound.logp
              : "N/A"
          },`;
          csvContent += `${((compound.validation_score || 0) * 100).toFixed(
            0
          )}%\n`;
        });

        const csvBlob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(csvBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `discovery-${discovery._id}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showSuccess("Discovery exported as CSV");
      }
    } catch (err) {
      console.error("Export error:", err);
      showError(`Export failed: ${err.message}`);
    }
  };

  const handleSelectTemplate = (template) => {
    const defaultStructuredData = {
      category: "",
      boilingPointMin: "",
      boilingPointMax: "",
      viscosityMin: "",
      viscosityMax: "",
      solubility: "",
      thermalStabilityMin: "",
      additionalProperties: [],
      notes: "",
    };

    if (template.inputMode === "structured") {
      setInputMode("structured");
      // Merge template data with defaults to ensure all fields exist
      setStructuredData({
        ...defaultStructuredData,
        ...template.structuredData,
      });
      setCriteria("");
    } else {
      setInputMode("ai-prompt");
      setCriteria(template.aiPrompt || "");
      setStructuredData(defaultStructuredData);
    }
    showSuccess(`Template loaded: ${template.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8"></div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Discover New Compounds
            </h1>
            <p className="text-gray-600 mt-2 dark:text-gray-400">
              Generate novel chemical compounds using AI
            </p>
          </div>
          <button
            onClick={() => setShowTemplates(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <span>📑</span>
            <span>Use Template</span>
          </button>
        </div>

        {/* Templates Modal */}
        <TemplatesModal
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={handleSelectTemplate}
        />

        {/* Input Mode Toggle */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Input Mode</h2>
            <div className="flex bg-gray-100 rounded-lg p-1 dark:bg-gray-800">
              <button
                onClick={() => setInputMode("structured")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  inputMode === "structured"
                    ? "bg-white text-primary-600 shadow-sm font-medium"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                📋 Structured Form
              </button>
              <button
                onClick={() => setInputMode("ai-prompt")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  inputMode === "ai-prompt"
                    ? "bg-white text-primary-600 shadow-sm font-medium"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
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
              initialData={structuredData}
              //onChange={setStructuredData}
            />
          ) : (
            <AIPromptForm
              onSubmit={handleAIPromptSubmit}
              loading={loading}
              initialValue={criteria}
              onChange={setCriteria}
            />
          )}
        </div>

        {/* Loading Progress */}
        {loading && (
          <div className="card mb-8">
            <div className="text-center">
              <Loading size="lg" />
              <p className="text-gray-600 mt-4 dark:text-gray-400">
                Generating compounds...
              </p>
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
                  onClick={() => handleExport("pdf")}
                  className="btn-primary text-sm"
                >
                  📄 Export PDF
                </button>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3 dark:text-white">
                  Analysis
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap dark:text-gray-300">
                  {discovery.analysis}
                </p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 dark:text-white">
                  Justification
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap dark:text-gray-300">
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

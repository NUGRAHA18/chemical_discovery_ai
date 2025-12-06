import { useState, useEffect, useRef } from "react";
import { discoveryService } from "../services/discovery";
import { favoritesService } from "../services/favorites";
import StructuredForm from "../components/discovery/StructuredForm";
import AIPromptForm from "../components/discovery/AIPromptForm";
import CompoundCard from "../components/discovery/CompoundCard";
import Loading from "../components/common/Loading";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "../utils/toast";
import { useComparison } from "../contexts/ComparisonContext";
import ComparisonModal from "../components/discovery/ComparisonModal";
import { exportDiscoveryToPDF } from "../utils/pdfExport";
import TemplatesModal from "../components/discovery/TemplatesModal";

const Discovery = () => {
  const [inputMode, setInputMode] = useState("structured");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [discovery, setDiscovery] = useState(null);
  const [error, setError] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const { comparisonList } = useComparison();
  const [showTemplates, setShowTemplates] = useState(false);

  const timeoutRef = useRef(null);

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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleStructuredSubmit = async (structuredData) => {
    setLoading(true);
    setProgress(10);
    setError("");
    setDiscovery(null);

    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setProgress(0);
      setError("Request timeout. ML service might be down. Please try again.");
    }, 180000);

    try {
      setProgress(30);
      const response = await discoveryService.createDiscovery({
        inputMode: "structured",
        structuredData,
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setProgress(90);
      setDiscovery(response.discovery);
      setProgress(100);
      showSuccess("Compounds generated successfully!");
    } catch (err) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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

    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setProgress(0);
      setError("Request timeout. ML service might be down. Please try again.");
    }, 180000);

    try {
      setProgress(30);
      const response = await discoveryService.createDiscovery({
        inputMode: "ai-prompt",
        criteria,
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setProgress(90);
      setDiscovery(response.discovery);
      setProgress(100);
      showSuccess("Compounds generated successfully!");
    } catch (err) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
        const loadingToast = showLoading("Generating PDF...");
        const result = await exportDiscoveryToPDF(discovery);
        dismissToast(loadingToast);

        if (result.success) {
          showSuccess(`PDF exported: ${result.filename}`);
        } else {
          showError("Failed to generate PDF");
        }
      } else if (format === "json") {
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
        let csvContent = "Name,Formula,SMILES,MW,LogP,Validation Score\n";

        discovery.compounds?.forEach((compound) => {
          csvContent += `"${compound.name}","${compound.formula}","${compound.smiles}",`;
          csvContent += `${compound.molecular_weight || "N/A"},`;
          csvContent += `${
            compound.logp !== null && compound.logp !== undefined
              ? compound.logp.toFixed(2)
              : "N/A"
          },`;
          csvContent += `${compound.validation_score || "N/A"}\n`;
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
      showError("Export failed: " + err.message);
    }
  };

  const handleSelectTemplate = (template) => {
    if (template.inputMode === "structured") {
      setInputMode("structured");
      setStructuredData(template.formData);
    } else {
      setInputMode("ai-prompt");
      setCriteria(template.prompt);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Chemical Discovery
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Generate novel chemical compounds using AI
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowTemplates(true)}
              className="btn-secondary"
            >
              📋 Templates
            </button>
            {comparisonList.length > 0 && (
              <button
                onClick={() => setShowComparison(true)}
                className="btn-primary relative"
              >
                ⚖️ Compare ({comparisonList.length})
              </button>
            )}
          </div>
        </div>

        <div className="card mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Input Mode:
            </label>
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <button
                onClick={() => setInputMode("structured")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  inputMode === "structured"
                    ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                📋 Structured Form
              </button>
              <button
                onClick={() => setInputMode("ai-prompt")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  inputMode === "ai-prompt"
                    ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                💬 AI Prompt
              </button>
            </div>
          </div>

          {inputMode === "structured" ? (
            <StructuredForm
              onSubmit={handleStructuredSubmit}
              loading={loading}
              initialData={structuredData}
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

        {loading && (
          <div className="card mb-8">
            <div className="text-center">
              <Loading size="lg" />
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                Generating compounds...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                This may take 10-30 seconds
              </p>
              {progress > 0 && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {discovery && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Generated Compounds
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport("json")}
                  className="btn-outline text-sm"
                >
                  📄 JSON
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="btn-outline text-sm"
                >
                  📊 CSV
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="btn-outline text-sm"
                >
                  📑 PDF
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {discovery.compounds?.map((compound, idx) => (
                <CompoundCard
                  key={idx}
                  compound={compound}
                  onAddToFavorites={handleAddToFavorites}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ComparisonModal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
      />

      <TemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
};

export default Discovery;

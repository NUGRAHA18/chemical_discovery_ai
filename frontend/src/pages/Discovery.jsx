import { useState, useEffect, useRef } from "react";
import { discoveryService } from "../services/discovery";
import { favoritesService } from "../services/favorites";
import StructuredForm from "../components/discovery/StructuredForm";
import AIPromptForm from "../components/discovery/AIPromptForm";
import CompoundCard from "../components/discovery/CompoundCard";
import CompoundDetailModal from "../components/discovery/CompoundDetailModal"; // ✅ NEW
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

// Import Icons
import {
  FlaskConical,
  Sparkles,
  ClipboardList,
  Scale,
  FileJson,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  LayoutTemplate,
  TestTube,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const Discovery = () => {
  const [inputMode, setInputMode] = useState("structured");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [discovery, setDiscovery] = useState(null);
  const [error, setError] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const { comparisonList } = useComparison();
  const [showTemplates, setShowTemplates] = useState(false);

  // ✅ NEW - Detail Modal States
  const [selectedCompound, setSelectedCompound] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
      showSuccess(`${compound.name} added to favorites!`);
    } catch (err) {
      showError("Failed to add to favorites: " + err.response?.data?.error);
    }
  };

  // ✅ NEW - View Details Handler
  const handleViewDetails = (compound) => {
    setSelectedCompound(compound);
    setShowDetailModal(true);
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
      setStructuredData(template.structuredData);
    } else {
      setInputMode("ai-prompt");
      setCriteria(template.aiPrompt || template.description);
    }
    setShowTemplates(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER SECTION */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <FlaskConical className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                Chemical Discovery
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 ml-1">
              Generate novel chemical compounds using advanced AI models.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowTemplates(true)}
              className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm font-medium text-sm"
            >
              <LayoutTemplate className="w-4 h-4 mr-2 text-gray-500" />
              Templates
            </button>
            {comparisonList.length > 0 && (
              <button
                onClick={() => setShowComparison(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm transition-colors font-medium text-sm relative"
              >
                <Scale className="w-4 h-4 mr-2" />
                Compare
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white dark:border-gray-900">
                  {comparisonList.length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* INPUT CARD */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Select Input Method
            </label>
            <div className="flex space-x-2 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg w-fit">
              <button
                onClick={() => setInputMode("structured")}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  inputMode === "structured"
                    ? "bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Structured Form
              </button>
              <button
                onClick={() => setInputMode("ai-prompt")}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  inputMode === "ai-prompt"
                    ? "bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Prompt
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
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
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 mb-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <Loading size="lg" />
                <TestTube className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary-600 dark:text-primary-400 opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
                Synthesizing Compounds...
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-md mx-auto">
                Our AI is analyzing molecular structures and optimizing
                properties based on your criteria. This typically takes 10-30
                seconds.
              </p>

              {/* Progress Bar */}
              {progress > 0 && (
                <div className="w-full max-w-md mt-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Processing</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Generation Failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ✅ RESULTS SECTION - COMPLETELY UPDATED */}
        {discovery && (
          <div className="space-y-6 animate-fade-in">
            {/* ✅ ANALYSIS SECTION - NEW */}
            {discovery.analysis && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Analysis
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{discovery.analysis}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* ✅ JUSTIFICATION SECTION - NEW */}
            {discovery.justification && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Justification
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{discovery.justification}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* ✅ COMPOUNDS SECTION - UPDATED */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FlaskConical className="w-6 h-6 text-green-600 dark:text-green-400" />
                    Generated Compounds
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Found {discovery.compounds?.length || 0} candidates matching
                    your criteria
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 uppercase">
                    Export
                  </span>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                  <button
                    onClick={() => handleExport("json")}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
                    title="Export JSON"
                  >
                    <FileJson className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExport("csv")}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
                    title="Export CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
                    title="Export PDF"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {discovery.compounds && discovery.compounds.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {discovery.compounds.map((compound, idx) => (
                    <CompoundCard
                      key={idx}
                      compound={compound}
                      onAddToFavorites={handleAddToFavorites}
                      onViewDetails={handleViewDetails} // ✅ ADDED
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No compounds generated</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ComparisonModal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
      />

      <TemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* ✅ COMPOUND DETAIL MODAL - NEW */}
      {showDetailModal && selectedCompound && (
        <CompoundDetailModal
          compound={selectedCompound}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCompound(null);
          }}
        />
      )}
    </div>
  );
};

export default Discovery;

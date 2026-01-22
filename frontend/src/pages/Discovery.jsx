import { useState, useEffect } from "react";
import { favoritesService } from "../services/favorites";
import StructuredForm from "../components/discovery/StructuredForm";
import AIPromptForm from "../components/discovery/AIPromptForm";
import CompoundCard from "../components/discovery/CompoundCard";
import CompoundDetailModal from "../components/discovery/CompoundDetailModal";
import { discoveryService } from "../services/discovery";
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
import { useSocket } from "../contexts/SocketContext";
import ProgressTracker from "../components/discovery/ProgressTracker";

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
  Lightbulb,
  BookOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const DISCOVERY_STATE_KEY = "discovery_in_progress";

const Discovery = () => {
  const [inputMode, setInputMode] = useState("structured");
  const [loading, setLoading] = useState(false);
  const [discovery, setDiscovery] = useState(null);
  const [error, setError] = useState("");
  const [showComparison, setShowComparison] = useState(false);

  // --- SOCKET CONTEXT ---
  const { discoveryProgress, discoveryLogs, clearProgress } = useSocket();

  const { comparisonList, addToComparison } = useComparison();
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCompound, setSelectedCompound] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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

  // --- RESTORE STATE LOGIC ---
  useEffect(() => {
    const savedState = sessionStorage.getItem(DISCOVERY_STATE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.discovery) {
          setDiscovery(parsed.discovery);
        }
      } catch (e) {
        console.error("Failed to restore state:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (discovery) {
      sessionStorage.setItem(
        DISCOVERY_STATE_KEY,
        JSON.stringify({
          discovery,
          timestamp: Date.now(),
        }),
      );
    } else if (!loading && !discovery) {
      sessionStorage.removeItem(DISCOVERY_STATE_KEY);
    }
  }, [loading, discovery]);

  // --- CORE SUBMIT LOGIC (Hybrid HTTP + WebSocket) ---
  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError("");
      setDiscovery(null);
      clearProgress();

      // 1. Kirim Request HTTP
      const response = await discoveryService.createDiscovery(formData);

      if (response && response.success && response.discovery) {
        setDiscovery(response.discovery);
        setLoading(false);
        showSuccess("Discovery completed successfully!");
      }

      if (response && response.compounds) {
        setDiscovery(response);
        setLoading(false);
        showSuccess("Discovery completed successfully!");
      }
    } catch (error) {
      const isTimeout =
        error.message?.includes("504") ||
        error.message?.includes("timeout") ||
        error.response?.status === 504 ||
        error.code === "ECONNABORTED";

      const isSocketActive =
        discoveryProgress && discoveryProgress.step !== "error";

      if (isTimeout && isSocketActive) {
        console.warn(
          "⚠️ HTTP Timeout detected, but WebSocket is active. Switching to socket-only mode.",
        );
        return;
      }

      setLoading(false);
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to create discovery",
      );
      showError(error.message || "Failed to create discovery");
    }
  };

  // --- SOCKET COMPLETION HANDLER ---
  const handleProgressComplete = async (data) => {
    try {
      if (data.discoveryId) {
        const response = await discoveryService.getDiscovery(data.discoveryId);

        // PERBAIKAN DI SINI: Ambil response.discovery
        if (response && response.discovery) {
          setDiscovery(response.discovery);
        } else {
          // Fallback jika struktur berbeda (misal backend berubah)
          setDiscovery(response);
        }

        setLoading(false);
        clearProgress();
        dismissToast();
      } else {
        throw new Error("Missing Discovery ID");
      }
    } catch (fetchError) {
      console.error(fetchError);
      setLoading(false);
      showError("Discovery complete, but failed to fetch final result.");
      setError("Failed to fetch final discovery result.");
    }
  };

  const handleStructuredSubmit = async (structuredData) => {
    await handleSubmit({
      inputMode: "structured",
      structuredData,
    });
  };

  const handleAIPromptSubmit = async (criteria) => {
    await handleSubmit({
      inputMode: "ai-prompt",
      criteria,
    });
  };

  // --- ACTION HANDLERS ---
  const handleAddToFavorites = async (compound) => {
    try {
      const existing = await favoritesService.getFavorites();
      const isDuplicate = existing.favorites?.some(
        (fav) => fav.compoundData.smiles === compound.smiles,
      );

      if (isDuplicate) {
        showError("This compound is already in your favorites!");
        return;
      }

      await favoritesService.addFavorite({
        compoundData: { ...compound },
        tags: ["from-discovery"],
        notes: "Added from discovery",
      });
      showSuccess(`${compound.name} added to favorites!`);
    } catch (err) {
      showError(
        "Failed to add to favorites: " +
          (err.response?.data?.error || err.message),
      );
    }
  };

  const handleAddToCompare = (compound) => {
    if (comparisonList.length >= 3) {
      showError("You can only compare up to 3 compounds at once.");
      return;
    }
    const alreadyAdded = comparisonList.some(
      (c) => c.smiles === compound.smiles,
    );
    if (alreadyAdded) {
      showError("This compound is already in comparison!");
      return;
    }
    addToComparison(compound);
    showSuccess(`${compound.name} added to comparison!`);
  };

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
      const categoryMap = {
        Surfactant: "surfactant",
        Polymer: "polymer",
        Catalyst: "catalyst",
        Solvent: "solvent",
        Additive: "additive",
        Coating: "coating",
        Lubricant: "lubricant",
        Resin: "resin",
        Other: "other",
      };
      const templateCategory =
        categoryMap[template.category] || template.category.toLowerCase();

      setStructuredData({
        ...template.structuredData,
        category: templateCategory,
      });
    } else {
      setInputMode("ai-prompt");
      setCriteria(template.aiPrompt || template.description);
    }
    setShowTemplates(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- HEADER SECTION --- */}
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
              className="inline-flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm font-medium text-sm"
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

        {/* --- INPUT CARD (STYLED) --- */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-cyan-900/30 overflow-hidden mb-8 transition-all duration-300 dark:shadow-[0_0_20px_rgba(8,145,178,0.1)]">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-900/50 px-6 py-4 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="block text-xs font-bold text-slate-500 dark:text-cyan-400 uppercase tracking-widest">
                Configuration Engine
              </label>

              {/* Styled Toggle Switch */}
              <div className="flex space-x-1 bg-gray-200/50 dark:bg-slate-950/50 p-1 rounded-lg border border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => setInputMode("structured")}
                  className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    inputMode === "structured"
                      ? "bg-white dark:bg-slate-800 text-primary-600 dark:text-cyan-400 shadow-sm ring-1 ring-black/5 dark:ring-cyan-500/30"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Structured
                </button>
                <button
                  onClick={() => setInputMode("ai-prompt")}
                  className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    inputMode === "ai-prompt"
                      ? "bg-white dark:bg-slate-800 text-primary-600 dark:text-cyan-400 shadow-sm ring-1 ring-black/5 dark:ring-cyan-500/30"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Prompt
                </button>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 bg-white dark:bg-slate-800 relative">
            {/* Background Noise Decoration (Optional for Sci-fi feel) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light"></div>

            <div className="relative z-10">
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
        </div>

        {/* --- ERROR STATE --- */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8 flex items-start animate-fade-in">
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

        {/* --- RESULTS SECTION --- */}
        {discovery && (
          <div className="space-y-6 animate-fade-in pb-12">
            {/* ANALYSIS CARD */}
            {discovery.analysis && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Analysis
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => (
                        <p
                          className="text-gray-800 dark:text-gray-200 mb-2"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li
                          className="text-gray-800 dark:text-gray-200"
                          {...props}
                        />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="font-bold text-gray-900 dark:text-white"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {discovery.analysis}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* JUSTIFICATION CARD */}
            {discovery.justification && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Justification
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => (
                        <p
                          className="text-gray-800 dark:text-gray-200 mb-2"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li
                          className="text-gray-800 dark:text-gray-200"
                          {...props}
                        />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="font-bold text-gray-900 dark:text-white"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {discovery.justification}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* COMPOUNDS GRID */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
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

                {/* Export Buttons */}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 p-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 uppercase">
                    Export
                  </span>
                  <div className="h-4 w-px bg-gray-300 dark:bg-slate-600 mx-1"></div>
                  <button
                    onClick={() => handleExport("json")}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
                    title="Export JSON"
                  >
                    <FileJson className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExport("csv")}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
                    title="Export CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
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
                      onViewDetails={handleViewDetails}
                      onAddToCompare={handleAddToCompare}
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

      {/* --- MODALS --- */}
      <ComparisonModal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
      />

      <TemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {showDetailModal && selectedCompound && (
        <CompoundDetailModal
          compound={selectedCompound}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCompound(null);
          }}
          onAddToFavorites={handleAddToFavorites}
          onAddToCompare={handleAddToCompare}
        />
      )}

      {/* --- PROGRESS TRACKER OVERLAY --- */}
      {(loading ||
        (discoveryProgress && discoveryProgress.step !== "error")) && (
        <ProgressTracker
          progress={discoveryProgress}
          logs={discoveryLogs}
          onComplete={handleProgressComplete}
        />
      )}
    </div>
  );
};

export default Discovery;

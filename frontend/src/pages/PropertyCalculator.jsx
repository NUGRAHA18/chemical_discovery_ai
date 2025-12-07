import { useState } from "react";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "../utils/toast";
import Loading from "../components/common/Loading";

// Import Icons
import {
  Calculator,
  FlaskConical,
  History,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Beaker,
  Info,
  RotateCcw,
  Eraser,
} from "lucide-react";

const PropertyCalculator = () => {
  const [smiles, setSmiles] = useState("");
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState(null);
  const [history, setHistory] = useState([]);

  const exampleCompounds = [
    { name: "Ethanol", smiles: "CCO" },
    { name: "Aspirin", smiles: "CC(=O)Oc1ccccc1C(=O)O" },
    { name: "Caffeine", smiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C" },
    { name: "Benzene", smiles: "c1ccccc1" },
    { name: "Glucose", smiles: "C(C1C(C(C(C(O1)O)O)O)O)O" },
  ];

  const calculateProperties = async () => {
    if (!smiles.trim()) {
      showError("Please enter a SMILES notation");
      return;
    }

    setLoading(true);
    const loadingToast = showLoading("Calculating properties...");

    // ✅ ADD TIMEOUT
    const timeout = setTimeout(() => {
      setLoading(false);
      dismissToast(loadingToast);
      showError(
        "Request timeout. Please check if backend and ML service are running."
      );
    }, 30000); // 30 seconds for property calculation

    try {
      const response = await fetch(
        "http://localhost:3000/api/calculate-properties",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ smiles }),
        }
      );

      const data = await response.json();
      clearTimeout(timeout); // ✅ Clear timeout
      dismissToast(loadingToast);

      if (data.success) {
        setProperties(data.properties);
        setHistory((prev) =>
          [
            {
              smiles,
              properties: data.properties,
              timestamp: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 10)
        );
        showSuccess("Properties calculated successfully!");
      } else {
        showError(data.error || "Failed to calculate properties");
      }
    } catch (error) {
      clearTimeout(timeout); // ✅ Clear timeout
      dismissToast(loadingToast);
      showError("Invalid SMILES or calculation error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (example) => {
    setSmiles(example.smiles);
    showSuccess(`Loaded: ${example.name}`);
  };

  const clearHistory = () => {
    setHistory([]);
    showSuccess("History cleared");
  };

  const getPropertyColor = (property, value) => {
    // Color coding based on property ranges
    if (property === "molecular_weight") {
      if (value < 200) return "text-green-600 dark:text-green-400";
      if (value < 500) return "text-blue-600 dark:text-blue-400";
      return "text-orange-600 dark:text-orange-400";
    }
    if (property === "logp") {
      if (value < 0) return "text-blue-600 dark:text-blue-400";
      if (value < 5) return "text-green-600 dark:text-green-400";
      return "text-red-600 dark:text-red-400";
    }
    if (property === "tpsa") {
      if (value < 60) return "text-green-600 dark:text-green-400";
      if (value < 140) return "text-blue-600 dark:text-blue-400";
      return "text-orange-600 dark:text-orange-400";
    }
    return "text-gray-900 dark:text-white";
  };

  const getPropertyInfo = (property) => {
    const info = {
      molecular_weight: {
        label: "Molecular Weight",
        unit: "g/mol",
        description: "Sum of atomic weights in the molecule",
      },
      logp: {
        label: "LogP",
        unit: "",
        description: "Octanol-water partition coefficient (lipophilicity)",
      },
      h_bond_donors: {
        label: "H-Bond Donors",
        unit: "",
        description: "Number of hydrogen bond donors",
      },
      h_bond_acceptors: {
        label: "H-Bond Acceptors",
        unit: "",
        description: "Number of hydrogen bond acceptors",
      },
      tpsa: {
        label: "TPSA",
        unit: "Å²",
        description: "Topological Polar Surface Area",
      },
      rotatable_bonds: {
        label: "Rotatable Bonds",
        unit: "",
        description: "Number of rotatable bonds (flexibility)",
      },
      heavy_atoms: {
        label: "Heavy Atoms",
        unit: "",
        description: "Number of non-hydrogen atoms",
      },
      aromatic: {
        label: "Aromatic",
        unit: "",
        description: "Contains aromatic rings",
      },
    };
    return info[property] || { label: property, unit: "", description: "" };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Professional Look */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Calculator className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Property Calculator
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-1">
            Calculate physicochemical properties and drug-likeness from
            molecular structures (SMILES).
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Input & Examples */}
          <div className="lg:col-span-1 space-y-6">
            {/* Input Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-gray-400" />
                Input Molecule
              </h2>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  SMILES String
                </label>
                <textarea
                  value={smiles}
                  onChange={(e) => setSmiles(e.target.value)}
                  placeholder="e.g. CCO"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-900/50 dark:text-white resize-none font-mono text-sm transition-all"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={calculateProperties}
                  disabled={loading || !smiles.trim()}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg shadow-sm font-medium transition-all"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculate
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSmiles("")}
                  disabled={loading}
                  className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-all"
                  title="Clear Input"
                >
                  <Eraser className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Examples Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
                Examples
              </h3>
              <div className="space-y-2">
                {exampleCompounds.map((example) => (
                  <button
                    key={example.smiles}
                    onClick={() => loadExample(example)}
                    disabled={loading}
                    className="w-full text-left px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-transparent hover:border-primary-200 dark:hover:border-primary-800 rounded-lg transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-200 text-sm group-hover:text-primary-700 dark:group-hover:text-primary-400">
                        {example.name}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate mt-0.5">
                      {example.smiles}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loading State - Centered and Styled */}
            {loading && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center h-full flex flex-col justify-center items-center">
                <Loading size="lg" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6">
                  Analyzing Structure...
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  Calculating physicochemical properties and descriptors.
                </p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !properties && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center h-full flex flex-col justify-center items-center border-dashed">
                <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-full mb-4">
                  <Beaker className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ready to Calculate
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-2">
                  Enter a SMILES notation on the left or select an example to
                  see detailed molecular properties.
                </p>
              </div>
            )}

            {/* Results Display */}
            {!loading && properties && (
              <div className="animate-fade-in space-y-6">
                {/* Main Results Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary-500" />
                      Analysis Results
                    </h2>
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded font-mono max-w-[150px] truncate">
                      {smiles}
                    </span>
                  </div>

                  <div className="p-6">
                    {/* Properties Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                      {Object.entries(properties).map(([key, value]) => {
                        const info = getPropertyInfo(key);
                        return (
                          <div
                            key={key}
                            className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                  {info.label}
                                </h3>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                  {info.description}
                                </p>
                              </div>
                              <span
                                className={`text-xl font-bold font-mono ${getPropertyColor(
                                  key,
                                  value
                                )}`}
                              >
                                {typeof value === "boolean"
                                  ? value
                                    ? "Yes"
                                    : "No"
                                  : typeof value === "number"
                                  ? value.toFixed(2)
                                  : value}
                                {info.unit && (
                                  <span className="text-xs text-gray-400 ml-1 font-sans font-normal">
                                    {info.unit}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Drug-likeness Assessment (Lipinski) */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800 p-5">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Lipinski's Rule of Five Assessment
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Rule 1: MW */}
                        <div className="flex items-center space-x-3 bg-white/60 dark:bg-black/20 p-2 rounded-lg">
                          {properties.molecular_weight <= 500 ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div className="text-sm">
                            <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                              MW ≤ 500
                            </span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">
                              {properties.molecular_weight?.toFixed(0)}
                            </span>
                          </div>
                        </div>

                        {/* Rule 2: LogP */}
                        <div className="flex items-center space-x-3 bg-white/60 dark:bg-black/20 p-2 rounded-lg">
                          {properties.logp <= 5 ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div className="text-sm">
                            <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                              LogP ≤ 5
                            </span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">
                              {properties.logp?.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Rule 3: Donors */}
                        <div className="flex items-center space-x-3 bg-white/60 dark:bg-black/20 p-2 rounded-lg">
                          {properties.h_bond_donors <= 5 ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div className="text-sm">
                            <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                              H-Donors ≤ 5
                            </span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">
                              {properties.h_bond_donors}
                            </span>
                          </div>
                        </div>

                        {/* Rule 4: Acceptors */}
                        <div className="flex items-center space-x-3 bg-white/60 dark:bg-black/20 p-2 rounded-lg">
                          {properties.h_bond_acceptors <= 10 ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div className="text-sm">
                            <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                              H-Acceptors ≤ 10
                            </span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">
                              {properties.h_bond_acceptors}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculation History */}
                {history.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-400" />
                        Recent Calculations
                      </h3>
                      <button
                        onClick={clearHistory}
                        className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear
                      </button>
                    </div>
                    <div className="space-y-2">
                      {history.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setSmiles(item.smiles);
                            setProperties(item.properties);
                          }}
                          className="group p-3 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.smiles}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                <span>
                                  MW:{" "}
                                  {item.properties.molecular_weight?.toFixed(0)}
                                </span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span>
                                  LogP: {item.properties.logp?.toFixed(2)}
                                </span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span>
                                  {new Date(
                                    item.timestamp
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                            <div className="p-1 text-gray-300 group-hover:text-primary-500 transition-colors">
                              <RotateCcw className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCalculator;

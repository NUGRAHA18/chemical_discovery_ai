import { useState } from "react";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "../utils/toast";
import Loading from "../components/common/Loading";

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

    try {
      // Call backend to calculate properties
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
      dismissToast(loadingToast);

      if (data.success) {
        setProperties(data.properties);
        // Add to history
        setHistory((prev) =>
          [
            {
              smiles,
              properties: data.properties,
              timestamp: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 10)
        ); // Keep last 10
        showSuccess("Properties calculated successfully!");
      } else {
        showError(data.error || "Failed to calculate properties");
      }
    } catch (error) {
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
      if (value < 200) return "text-green-600";
      if (value < 500) return "text-blue-600";
      return "text-orange-600";
    }
    if (property === "logp") {
      if (value < 0) return "text-blue-600";
      if (value < 5) return "text-green-600";
      return "text-red-600";
    }
    if (property === "tpsa") {
      if (value < 60) return "text-green-600";
      if (value < 140) return "text-blue-600";
      return "text-orange-600";
    }
    return "text-gray-900";
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
        unit: "Ų",
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Property Calculator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Calculate molecular properties from SMILES notation
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Input & Examples */}
          <div className="lg:col-span-1 space-y-6">
            {/* Input Card */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Input SMILES
              </h2>

              <div className="mb-4">
                <textarea
                  value={smiles}
                  onChange={(e) => setSmiles(e.target.value)}
                  placeholder="Enter SMILES notation (e.g., CCO for ethanol)"
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none font-mono text-sm"
                  disabled={loading}
                />
              </div>

              <button
                onClick={calculateProperties}
                disabled={loading || !smiles.trim()}
                className="btn-primary w-full mb-3"
              >
                {loading ? "Calculating..." : "🧮 Calculate Properties"}
              </button>

              <button
                onClick={() => setSmiles("")}
                disabled={loading}
                className="btn-outline w-full text-sm"
              >
                Clear
              </button>
            </div>

            {/* Examples */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Example Compounds
              </h3>
              <div className="space-y-2">
                {exampleCompounds.map((example) => (
                  <button
                    key={example.smiles}
                    onClick={() => loadExample(example)}
                    disabled={loading}
                    className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {example.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {example.smiles}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loading State */}
            {loading && (
              <div className="card text-center py-12">
                <Loading size="lg" />
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                  Calculating molecular properties...
                </p>
              </div>
            )}

            {/* Results */}
            {!loading && properties && (
              <div className="card">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Calculated Properties
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {smiles}
                  </span>
                </div>

                {/* Properties Grid */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {Object.entries(properties).map(([key, value]) => {
                    const info = getPropertyInfo(key);
                    return (
                      <div
                        key={key}
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                              {info.label}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {info.description}
                            </p>
                          </div>
                          <span
                            className={`text-2xl font-bold ${getPropertyColor(
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
                              <span className="text-sm ml-1">{info.unit}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Drug-likeness Assessment */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    💊 Lipinski's Rule of Five Assessment
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={
                          properties.molecular_weight <= 500
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {properties.molecular_weight <= 500 ? "✓" : "✗"}
                      </span>
                      <span className="text-sm dark:text-gray-300">
                        MW ≤ 500:{" "}
                        <strong>
                          {properties.molecular_weight?.toFixed(0)}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={
                          properties.logp <= 5
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {properties.logp <= 5 ? "✓" : "✗"}
                      </span>
                      <span className="text-sm dark:text-gray-300">
                        LogP ≤ 5: <strong>{properties.logp?.toFixed(2)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={
                          properties.h_bond_donors <= 5
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {properties.h_bond_donors <= 5 ? "✓" : "✗"}
                      </span>
                      <span className="text-sm dark:text-gray-300">
                        H-Donors ≤ 5:{" "}
                        <strong>{properties.h_bond_donors}</strong>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={
                          properties.h_bond_acceptors <= 10
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {properties.h_bond_acceptors <= 10 ? "✓" : "✗"}
                      </span>
                      <span className="text-sm dark:text-gray-300">
                        H-Acceptors ≤ 10:{" "}
                        <strong>{properties.h_bond_acceptors}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder */}
            {!loading && !properties && (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">🧪</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to Calculate
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter a SMILES notation or select an example to get started
                </p>
              </div>
            )}

            {/* Calculation History */}
            {history.length > 0 && (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Calculation History
                  </h3>
                  <button
                    onClick={clearHistory}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear History
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
                      className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-mono text-sm text-gray-900 dark:text-white">
                            {item.smiles}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            MW: {item.properties.molecular_weight?.toFixed(0)} •
                            LogP: {item.properties.logp?.toFixed(2)} •
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCalculator;

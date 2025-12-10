import { useState } from "react";
import { useComparison } from "../../contexts/ComparisonContext";
import { X, Trash2, Download, BarChart3, Table2 } from "lucide-react";
import { exportComparisonToPDF } from "../../utils/comparisonPdfExport";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "../../utils/toast";

const ComparisonModal = ({ isOpen, onClose }) => {
  const { comparisonList, removeFromComparison, clearComparison } =
    useComparison();
  const [viewMode, setViewMode] = useState("table"); // "table" or "charts"

  if (!isOpen) return null;

  const handleExportPDF = async () => {
    if (comparisonList.length === 0) {
      showError("No compounds to export");
      return;
    }

    const loadingToast = showLoading("Generating comparison PDF...");

    try {
      await exportComparisonToPDF(comparisonList);
      dismissToast(loadingToast);
      showSuccess("Comparison exported to PDF!");
    } catch (error) {
      dismissToast(loadingToast);
      showError("Failed to export PDF");
      console.error(error);
    }
  };

  // Extract all unique properties for table headers
  const getAllProperties = () => {
    const props = new Set([
      "molecular_weight",
      "logp",
      "h_bond_donors",
      "h_bond_acceptors",
      "tpsa",
    ]);
    comparisonList.forEach((compound) => {
      if (compound.properties) {
        Object.keys(compound.properties).forEach((key) => props.add(key));
      }
    });
    return Array.from(props);
  };

  // Property labels
  const propertyLabels = {
    molecular_weight: "MW (g/mol)",
    logp: "LogP",
    h_bond_donors: "H-Donors",
    h_bond_acceptors: "H-Acceptors",
    tpsa: "TPSA (Ų)",
    boiling_point: "BP (°C)",
    melting_point: "MP (°C)",
  };

  const getPropertyValue = (compound, property) => {
    // Direct properties
    if (compound[property] !== undefined && compound[property] !== null) {
      return typeof compound[property] === "number"
        ? compound[property].toFixed(2)
        : compound[property];
    }
    // Nested in properties object
    if (compound.properties && compound.properties[property] !== undefined) {
      const val = compound.properties[property];
      return typeof val === "number" ? val.toFixed(2) : val;
    }
    return "N/A";
  };

  // Get max value for chart scaling
  const getMaxValue = (property) => {
    const values = comparisonList
      .map((c) => parseFloat(getPropertyValue(c, property)))
      .filter((v) => !isNaN(v));
    return values.length > 0 ? Math.max(...values) : 1;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-cyan-600 dark:from-primary-700 dark:to-cyan-700 px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Compound Comparison ({comparisonList.length}/5)
            </h2>
            <p className="text-sm text-white/80 mt-1">
              Side-by-side analysis of molecular properties
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                  viewMode === "table"
                    ? "bg-white text-primary-600 shadow"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <Table2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("charts")}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                  viewMode === "charts"
                    ? "bg-white text-primary-600 shadow"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>

            {/* Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={comparisonList.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-all"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>

            {/* Clear All */}
            <button
              onClick={clearComparison}
              disabled={comparisonList.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {comparisonList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <BarChart3 className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-lg font-medium">No compounds to compare</p>
              <p className="text-sm mt-2">
                Add up to 5 compounds from discovery results
              </p>
            </div>
          ) : viewMode === "table" ? (
            <TableView
              compounds={comparisonList}
              properties={getAllProperties()}
              propertyLabels={propertyLabels}
              getPropertyValue={getPropertyValue}
              removeCompound={removeFromComparison}
            />
          ) : (
            <ChartsView
              compounds={comparisonList}
              properties={getAllProperties()}
              propertyLabels={propertyLabels}
              getPropertyValue={getPropertyValue}
              getMaxValue={getMaxValue}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// TABLE VIEW COMPONENT
const TableView = ({
  compounds,
  properties,
  propertyLabels,
  getPropertyValue,
  removeCompound,
}) => {
  return (
    <div className="space-y-6">
      {/* Compound Cards Row */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${compounds.length}, minmax(200px, 1fr))`,
        }}
      >
        {compounds.map((compound, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 relative"
          >
            {/* Remove Button */}
            <button
              onClick={() => removeCompound(compound.smiles)}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Structure Image */}
            {compound.structure_image && (
              <div className="mb-3 bg-white dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
                <img
                  src={compound.structure_image}
                  alt={compound.name}
                  className="w-full h-32 object-contain"
                />
              </div>
            )}

            {/* Name */}
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1 pr-8">
              {compound.name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {compound.formula}
            </p>

            {/* Validation Score */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    compound.validation_score >= 0.8
                      ? "bg-green-500"
                      : compound.validation_score >= 0.6
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${(compound.validation_score || 0) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {((compound.validation_score || 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Properties Comparison Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 sticky left-0 bg-gray-50 dark:bg-gray-900 z-10">
                  Property
                </th>
                {compounds.map((compound, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                  >
                    Compound {idx + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {properties.map((property, propIdx) => (
                <tr
                  key={property}
                  className={
                    propIdx % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-900/50"
                  }
                >
                  <td
                    className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 sticky left-0 z-10"
                    style={{
                      backgroundColor:
                        propIdx % 2 === 0 ? undefined : "inherit",
                    }}
                  >
                    {propertyLabels[property] || property.replace(/_/g, " ")}
                  </td>
                  {compounds.map((compound, idx) => {
                    const value = getPropertyValue(compound, property);
                    const isNA = value === "N/A";

                    return (
                      <td
                        key={idx}
                        className={`px-4 py-3 text-sm text-center border-b border-gray-100 dark:border-gray-700 ${
                          isNA
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-gray-900 dark:text-white font-semibold"
                        }`}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SMILES Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          SMILES Notation
        </h3>
        <div className="space-y-2">
          {compounds.map((compound, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1 w-20 flex-shrink-0">
                Compound {idx + 1}:
              </span>
              <code className="flex-1 text-xs bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 font-mono text-gray-900 dark:text-gray-300 break-all">
                {compound.smiles}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// CHARTS VIEW COMPONENT
const ChartsView = ({
  compounds,
  properties,
  propertyLabels,
  getPropertyValue,
  getMaxValue,
}) => {
  // Filter properties that have numeric values
  const numericProperties = properties.filter((prop) => {
    return compounds.some((c) => {
      const val = getPropertyValue(c, prop);
      return val !== "N/A" && !isNaN(parseFloat(val));
    });
  });

  return (
    <div className="space-y-6">
      {numericProperties.map((property) => {
        const maxValue = getMaxValue(property);

        return (
          <div
            key={property}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {propertyLabels[property] || property.replace(/_/g, " ")}
            </h3>

            <div className="space-y-3">
              {compounds.map((compound, idx) => {
                const value = parseFloat(getPropertyValue(compound, property));
                const isValid = !isNaN(value);
                const percentage = isValid ? (value / maxValue) * 100 : 0;

                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-32 flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                        {compound.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {compound.formula}
                      </p>
                    </div>

                    <div className="flex-1 relative">
                      <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        {isValid && (
                          <div
                            className={`h-full transition-all duration-500 rounded-lg ${
                              idx === 0
                                ? "bg-gradient-to-r from-blue-400 to-blue-600"
                                : idx === 1
                                ? "bg-gradient-to-r from-green-400 to-green-600"
                                : idx === 2
                                ? "bg-gradient-to-r from-purple-400 to-purple-600"
                                : idx === 3
                                ? "bg-gradient-to-r from-orange-400 to-orange-600"
                                : "bg-gradient-to-r from-pink-400 to-pink-600"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        )}
                      </div>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-900 dark:text-white">
                        {isValid ? value.toFixed(2) : "N/A"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ComparisonModal;

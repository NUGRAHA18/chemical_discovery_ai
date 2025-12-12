import { useState } from "react";
import { SlidersHorizontal, X, Filter } from "lucide-react";

const AdvancedFilters = ({ compounds, onFilterChange }) => {
  const [filters, setFilters] = useState({
    hasValidation: null, // null = all, true = only with validation, false = without
    hasProperties: null,
    isAromatic: null,
    minHBondDonors: "",
    maxHBondDonors: "",
    minHBondAcceptors: "",
    maxHBondAcceptors: "",
    minTPSA: "",
    maxTPSA: "",
  });

  const [results, setResults] = useState([]);

  const applyFilters = () => {
    let filtered = compounds;

    // 1. Has Validation Score
    if (filters.hasValidation !== null) {
      filtered = filtered.filter((compound) => {
        const hasScore =
          compound.validation_score !== null &&
          compound.validation_score !== undefined;
        return filters.hasValidation ? hasScore : !hasScore;
      });
    }

    // 2. Has Properties
    if (filters.hasProperties !== null) {
      filtered = filtered.filter((compound) => {
        const hasProps =
          compound.properties && Object.keys(compound.properties).length > 0;
        return filters.hasProperties ? hasProps : !hasProps;
      });
    }

    // 3. Aromatic
    if (filters.isAromatic !== null) {
      filtered = filtered.filter((compound) => {
        const aromatic =
          compound.properties?.aromatic === true ||
          compound.properties?.aromatic === "true";
        return filters.isAromatic ? aromatic : !aromatic;
      });
    }

    // 4. H-Bond Donors
    if (filters.minHBondDonors) {
      filtered = filtered.filter((compound) => {
        const donors = compound.properties?.h_bond_donors || 0;
        return donors >= parseInt(filters.minHBondDonors);
      });
    }
    if (filters.maxHBondDonors) {
      filtered = filtered.filter((compound) => {
        const donors = compound.properties?.h_bond_donors || 0;
        return donors <= parseInt(filters.maxHBondDonors);
      });
    }

    // 5. H-Bond Acceptors
    if (filters.minHBondAcceptors) {
      filtered = filtered.filter((compound) => {
        const acceptors = compound.properties?.h_bond_acceptors || 0;
        return acceptors >= parseInt(filters.minHBondAcceptors);
      });
    }
    if (filters.maxHBondAcceptors) {
      filtered = filtered.filter((compound) => {
        const acceptors = compound.properties?.h_bond_acceptors || 0;
        return acceptors <= parseInt(filters.maxHBondAcceptors);
      });
    }

    // 6. TPSA (Topological Polar Surface Area)
    if (filters.minTPSA) {
      filtered = filtered.filter((compound) => {
        const tpsa = compound.properties?.tpsa || 0;
        return tpsa >= parseFloat(filters.minTPSA);
      });
    }
    if (filters.maxTPSA) {
      filtered = filtered.filter((compound) => {
        const tpsa = compound.properties?.tpsa || 0;
        return tpsa <= parseFloat(filters.maxTPSA);
      });
    }

    setResults(filtered);
    onFilterChange(filtered);
  };

  const handleClear = () => {
    setFilters({
      hasValidation: null,
      hasProperties: null,
      isAromatic: null,
      minHBondDonors: "",
      maxHBondDonors: "",
      minHBondAcceptors: "",
      maxHBondAcceptors: "",
      minTPSA: "",
      maxTPSA: "",
    });
    setResults([]);
    onFilterChange(compounds); // Reset to all
  };

  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (typeof value === "boolean") return true; // Boolean filters always count if set
    return value !== null && value !== "";
  }).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Property Filters
          </h3>
        </div>
        {activeFiltersCount > 0 && (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
            {activeFiltersCount} active
          </span>
        )}
      </div>

      {/* Filter Fields */}
      <div className="space-y-4 mb-4">
        {/* Boolean Filters */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Data Availability
          </label>
          <div className="flex gap-2">
            <button
              onClick={() =>
                handleChange(
                  "hasValidation",
                  filters.hasValidation === true ? null : true
                )
              }
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.hasValidation === true
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Has Validation
            </button>
            <button
              onClick={() =>
                handleChange(
                  "hasProperties",
                  filters.hasProperties === true ? null : true
                )
              }
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.hasProperties === true
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Has Properties
            </button>
          </div>
        </div>

        {/* Aromatic Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Aromaticity
          </label>
          <div className="flex gap-2">
            <button
              onClick={() =>
                handleChange(
                  "isAromatic",
                  filters.isAromatic === true ? null : true
                )
              }
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.isAromatic === true
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Aromatic
            </button>
            <button
              onClick={() =>
                handleChange(
                  "isAromatic",
                  filters.isAromatic === false ? null : false
                )
              }
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.isAromatic === false
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Non-Aromatic
            </button>
          </div>
        </div>

        {/* H-Bond Donors Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min H-Donors
            </label>
            <input
              type="number"
              placeholder="0"
              min="0"
              value={filters.minHBondDonors}
              onChange={(e) => handleChange("minHBondDonors", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max H-Donors
            </label>
            <input
              type="number"
              placeholder="10"
              min="0"
              value={filters.maxHBondDonors}
              onChange={(e) => handleChange("maxHBondDonors", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* H-Bond Acceptors Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min H-Acceptors
            </label>
            <input
              type="number"
              placeholder="0"
              min="0"
              value={filters.minHBondAcceptors}
              onChange={(e) =>
                handleChange("minHBondAcceptors", e.target.value)
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max H-Acceptors
            </label>
            <input
              type="number"
              placeholder="10"
              min="0"
              value={filters.maxHBondAcceptors}
              onChange={(e) =>
                handleChange("maxHBondAcceptors", e.target.value)
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* TPSA Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min TPSA (Ų)
            </label>
            <input
              type="number"
              placeholder="0"
              step="0.1"
              value={filters.minTPSA}
              onChange={(e) => handleChange("minTPSA", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max TPSA (Ų)
            </label>
            <input
              type="number"
              placeholder="200"
              step="0.1"
              value={filters.maxTPSA}
              onChange={(e) => handleChange("maxTPSA", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={applyFilters}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Apply Filters
        </button>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Results Count */}
      {results.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Filtered to <span className="font-bold">{results.length}</span>{" "}
            compound{results.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;

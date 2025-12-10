import { useState } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";

const AdvancedFilters = ({ compounds = [], onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    // Molecular Weight
    mwMin: "",
    mwMax: "",
    // LogP
    logPMin: "",
    logPMax: "",
    // TPSA
    tpsaMin: "",
    tpsaMax: "",
    // H-Bond Donors
    hbdMin: "",
    hbdMax: "",
    // H-Bond Acceptors
    hbaMin: "",
    hbaMax: "",
    // Element filters
    containsElements: [],
    excludesElements: [],
    // Ring count
    ringCountMin: "",
    ringCountMax: "",
    // Complexity
    complexityLevel: "any", // any, low, medium, high
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const elementOptions = ["C", "H", "O", "N", "S", "P", "F", "Cl", "Br", "I"];

  const applyFilters = () => {
    let filtered = [...compounds];

    // Molecular Weight filter
    if (filters.mwMin) {
      filtered = filtered.filter(
        (c) => parseFloat(c.molecular_weight || 0) >= parseFloat(filters.mwMin)
      );
    }
    if (filters.mwMax) {
      filtered = filtered.filter(
        (c) => parseFloat(c.molecular_weight || 0) <= parseFloat(filters.mwMax)
      );
    }

    // LogP filter
    if (filters.logPMin) {
      filtered = filtered.filter(
        (c) => parseFloat(c.logp || 0) >= parseFloat(filters.logPMin)
      );
    }
    if (filters.logPMax) {
      filtered = filtered.filter(
        (c) => parseFloat(c.logp || 0) <= parseFloat(filters.logPMax)
      );
    }

    // TPSA filter
    if (filters.tpsaMin) {
      filtered = filtered.filter(
        (c) =>
          parseFloat(c.properties?.tpsa || 0) >= parseFloat(filters.tpsaMin)
      );
    }
    if (filters.tpsaMax) {
      filtered = filtered.filter(
        (c) =>
          parseFloat(c.properties?.tpsa || 0) <= parseFloat(filters.tpsaMax)
      );
    }

    // H-Bond Donors filter
    if (filters.hbdMin) {
      filtered = filtered.filter(
        (c) =>
          parseInt(c.properties?.h_bond_donors || 0) >= parseInt(filters.hbdMin)
      );
    }
    if (filters.hbdMax) {
      filtered = filtered.filter(
        (c) =>
          parseInt(c.properties?.h_bond_donors || 0) <= parseInt(filters.hbdMax)
      );
    }

    // H-Bond Acceptors filter
    if (filters.hbaMin) {
      filtered = filtered.filter(
        (c) =>
          parseInt(c.properties?.h_bond_acceptors || 0) >=
          parseInt(filters.hbaMin)
      );
    }
    if (filters.hbaMax) {
      filtered = filtered.filter(
        (c) =>
          parseInt(c.properties?.h_bond_acceptors || 0) <=
          parseInt(filters.hbaMax)
      );
    }

    // Contains elements filter
    if (filters.containsElements.length > 0) {
      filtered = filtered.filter((c) => {
        const formula = c.formula || "";
        return filters.containsElements.every((el) => formula.includes(el));
      });
    }

    // Excludes elements filter
    if (filters.excludesElements.length > 0) {
      filtered = filtered.filter((c) => {
        const formula = c.formula || "";
        return !filters.excludesElements.some((el) => formula.includes(el));
      });
    }

    // Complexity level filter
    if (filters.complexityLevel !== "any") {
      filtered = filtered.filter((c) => {
        const mw = parseFloat(c.molecular_weight || 0);
        if (filters.complexityLevel === "low") return mw < 150;
        if (filters.complexityLevel === "medium") return mw >= 150 && mw < 300;
        if (filters.complexityLevel === "high") return mw >= 300;
        return true;
      });
    }

    // Count active filters
    const count = Object.values(filters).filter(
      (v) =>
        (Array.isArray(v) && v.length > 0) ||
        (typeof v === "string" && v !== "" && v !== "any")
    ).length;
    setActiveFiltersCount(count);

    if (onFilterChange) {
      onFilterChange(filtered, count);
    }
  };

  const clearFilters = () => {
    const resetFilters = {
      mwMin: "",
      mwMax: "",
      logPMin: "",
      logPMax: "",
      tpsaMin: "",
      tpsaMax: "",
      hbdMin: "",
      hbdMax: "",
      hbaMin: "",
      hbaMax: "",
      containsElements: [],
      excludesElements: [],
      ringCountMin: "",
      ringCountMax: "",
      complexityLevel: "any",
    };
    setFilters(resetFilters);
    setActiveFiltersCount(0);
    if (onFilterChange) {
      onFilterChange(compounds, 0);
    }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleElement = (element, type) => {
    setFilters((prev) => {
      const list = [...prev[type]];
      const index = list.indexOf(element);
      if (index > -1) {
        list.splice(index, 1);
      } else {
        list.push(element);
      }
      return { ...prev, [type]: list };
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="text-left">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Advanced Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-bold">
                  {activeFiltersCount} active
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Filter by properties, elements, and complexity
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Molecular Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Molecular Weight (g/mol)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.mwMin}
                  onChange={(e) => updateFilter("mwMin", e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.mwMax}
                  onChange={(e) => updateFilter("mwMax", e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* LogP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                LogP (Lipophilicity)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Min"
                  value={filters.logPMin}
                  onChange={(e) => updateFilter("logPMin", e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Max"
                  value={filters.logPMax}
                  onChange={(e) => updateFilter("logPMax", e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* TPSA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                TPSA (Ų)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.tpsaMin}
                  onChange={(e) => updateFilter("tpsaMin", e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.tpsaMax}
                  onChange={(e) => updateFilter("tpsaMax", e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* H-Bond Donors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                H-Bond Donors
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.hbdMin}
                  onChange={(e) => updateFilter("hbdMin", e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.hbdMax}
                  onChange={(e) => updateFilter("hbdMax", e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* H-Bond Acceptors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                H-Bond Acceptors
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.hbaMin}
                  onChange={(e) => updateFilter("hbaMin", e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.hbaMax}
                  onChange={(e) => updateFilter("hbaMax", e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* Complexity Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Complexity Level
              </label>
              <select
                value={filters.complexityLevel}
                onChange={(e) =>
                  updateFilter("complexityLevel", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="any">Any</option>
                <option value="low">Low (MW &lt; 150)</option>
                <option value="medium">Medium (150-300)</option>
                <option value="high">High (MW &gt; 300)</option>
              </select>
            </div>
          </div>

          {/* Element Filters */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contains Elements
            </label>
            <div className="flex flex-wrap gap-2">
              {elementOptions.map((element) => (
                <button
                  key={element}
                  onClick={() => toggleElement(element, "containsElements")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filters.containsElements.includes(element)
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {element}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Excludes Elements
            </label>
            <div className="flex flex-wrap gap-2">
              {elementOptions.map((element) => (
                <button
                  key={element}
                  onClick={() => toggleElement(element, "excludesElements")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filters.excludesElements.includes(element)
                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {element}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Apply Filters
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;

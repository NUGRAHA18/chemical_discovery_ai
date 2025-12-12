import { useState } from "react";
import { Search, X, Sparkles } from "lucide-react";

const AdvancedSearch = ({ compounds, onResultsFound }) => {
  const [searchCriteria, setSearchCriteria] = useState({
    name: "",
    formula: "",
    smiles: "",
    minMW: "",
    maxMW: "",
    minLogP: "",
    maxLogP: "",
  });

  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);

    let filtered = compounds;

    // 1. Name search (word-based)
    if (searchCriteria.name.trim()) {
      const nameWords = searchCriteria.name.toLowerCase().trim().split(/\s+/);
      filtered = filtered.filter((compound) => {
        const compoundName = (compound.name || "").toLowerCase();
        return nameWords.every((word) => compoundName.includes(word));
      });
    }

    // 2. Formula search (exact or contains)
    if (searchCriteria.formula.trim()) {
      const formulaSearch = searchCriteria.formula.toLowerCase();
      filtered = filtered.filter((compound) =>
        (compound.formula || "").toLowerCase().includes(formulaSearch)
      );
    }

    // 3. SMILES search (contains)
    if (searchCriteria.smiles.trim()) {
      const smilesSearch = searchCriteria.smiles.toLowerCase();
      filtered = filtered.filter((compound) =>
        (compound.smiles || "").toLowerCase().includes(smilesSearch)
      );
    }

    // 4. Molecular Weight range
    if (searchCriteria.minMW) {
      filtered = filtered.filter(
        (compound) =>
          parseFloat(compound.molecular_weight) >=
          parseFloat(searchCriteria.minMW)
      );
    }
    if (searchCriteria.maxMW) {
      filtered = filtered.filter(
        (compound) =>
          parseFloat(compound.molecular_weight) <=
          parseFloat(searchCriteria.maxMW)
      );
    }

    // 5. LogP range
    if (searchCriteria.minLogP) {
      filtered = filtered.filter(
        (compound) =>
          parseFloat(compound.logp) >= parseFloat(searchCriteria.minLogP)
      );
    }
    if (searchCriteria.maxLogP) {
      filtered = filtered.filter(
        (compound) =>
          parseFloat(compound.logp) <= parseFloat(searchCriteria.maxLogP)
      );
    }

    setResults(filtered);
    onResultsFound(filtered);
    setIsSearching(false);
  };

  const handleClear = () => {
    setSearchCriteria({
      name: "",
      formula: "",
      smiles: "",
      minMW: "",
      maxMW: "",
      minLogP: "",
      maxLogP: "",
    });
    setResults([]);
    onResultsFound(compounds); // Reset to all compounds
  };

  const handleChange = (field, value) => {
    setSearchCriteria((prev) => ({ ...prev, [field]: value }));
  };

  const activeFiltersCount = Object.values(searchCriteria).filter(
    (v) => v
  ).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Advanced Compound Search
          </h3>
        </div>
        {activeFiltersCount > 0 && (
          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
            {activeFiltersCount} active
          </span>
        )}
      </div>

      {/* Search Fields */}
      <div className="space-y-3 mb-4">
        {/* Name Search */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Compound Name
          </label>
          <input
            type="text"
            placeholder="e.g., benzene, ethanol"
            value={searchCriteria.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {/* Formula Search */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Chemical Formula
          </label>
          <input
            type="text"
            placeholder="e.g., C6H6, CH3OH"
            value={searchCriteria.formula}
            onChange={(e) => handleChange("formula", e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {/* SMILES Search */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            SMILES Pattern
          </label>
          <input
            type="text"
            placeholder="e.g., c1ccccc1 (benzene ring)"
            value={searchCriteria.smiles}
            onChange={(e) => handleChange("smiles", e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 font-mono"
          />
        </div>

        {/* MW Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min MW (g/mol)
            </label>
            <input
              type="number"
              placeholder="0"
              value={searchCriteria.minMW}
              onChange={(e) => handleChange("minMW", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max MW (g/mol)
            </label>
            <input
              type="number"
              placeholder="1000"
              value={searchCriteria.maxMW}
              onChange={(e) => handleChange("maxMW", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* LogP Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min LogP
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="-5"
              value={searchCriteria.minLogP}
              onChange={(e) => handleChange("minLogP", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max LogP
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="10"
              value={searchCriteria.maxLogP}
              onChange={(e) => handleChange("maxLogP", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Search className="w-4 h-4" />
          Search Compounds
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
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Found <span className="font-bold">{results.length}</span> compound
            {results.length !== 1 ? "s" : ""} matching your criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;

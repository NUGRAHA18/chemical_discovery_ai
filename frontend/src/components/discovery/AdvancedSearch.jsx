import { useState } from "react";
import { Search, Sliders, Sparkles, Target, Loader, X } from "lucide-react";
import { calculateTanimotoSimilarity } from "../../utils/CompoundSimilarityCalculator";

const AdvancedSearch = ({ compounds = [], onResultsFound }) => {
  const [searchMode, setSearchMode] = useState("similarity"); // similarity, substructure, smart
  const [searchQuery, setSearchQuery] = useState("");
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedReference, setSelectedReference] = useState(null);

  // Similarity Search - Find similar compounds using Tanimoto coefficient
  const handleSimilaritySearch = async () => {
    setSearching(true);

    // Get reference compound
    const reference = selectedReference || compounds[0];
    if (!reference) {
      setSearching(false);
      return;
    }

    // Calculate similarity for all compounds
    const scored = compounds
      .filter((c) => c._id !== reference._id)
      .map((compound) => {
        const similarity = calculateTanimotoSimilarity(
          reference.smiles || reference.formula,
          compound.smiles || compound.formula
        );
        return { ...compound, similarity };
      })
      .filter((c) => c.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20); // Top 20

    setResults(scored);
    if (onResultsFound) onResultsFound(scored);

    setTimeout(() => setSearching(false), 500);
  };

  // Substructure Search - Find compounds containing specific substructure
  const handleSubstructureSearch = async () => {
    setSearching(true);

    const query = searchQuery.toUpperCase();
    const matched = compounds
      .filter((compound) => {
        const formula = (compound.formula || "").toUpperCase();
        const smiles = (compound.smiles || "").toUpperCase();
        const name = (compound.name || "").toUpperCase();

        // Check if query is in formula, SMILES, or name
        return (
          formula.includes(query) ||
          smiles.includes(query) ||
          name.includes(query)
        );
      })
      .slice(0, 50);

    setResults(matched);
    if (onResultsFound) onResultsFound(matched);

    setTimeout(() => setSearching(false), 500);
  };

  // Smart Search - Combines multiple search strategies
  const handleSmartSearch = async () => {
    setSearching(true);

    const query = searchQuery.toLowerCase();
    const scored = compounds
      .map((compound) => {
        let score = 0;

        // Name matching (highest weight)
        if (compound.name?.toLowerCase().includes(query)) score += 10;

        // Formula matching
        if (compound.formula?.toLowerCase().includes(query)) score += 8;

        // SMILES matching
        if (compound.smiles?.toLowerCase().includes(query)) score += 6;

        // Property matching
        if (
          query.includes("high") &&
          parseFloat(compound.molecular_weight || 0) > 200
        )
          score += 3;
        if (
          query.includes("low") &&
          parseFloat(compound.molecular_weight || 0) < 100
        )
          score += 3;
        if (query.includes("polar") && parseFloat(compound.logp || 0) < 0)
          score += 3;
        if (query.includes("lipophilic") && parseFloat(compound.logp || 0) > 3)
          score += 3;

        // Base compound matching
        if (compound.base_compound?.toLowerCase().includes(query)) score += 5;

        return { ...compound, searchScore: score };
      })
      .filter((c) => c.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore)
      .slice(0, 30);

    setResults(scored);
    if (onResultsFound) onResultsFound(scored);

    setTimeout(() => setSearching(false), 500);
  };

  const handleSearch = () => {
    if (searchMode === "similarity") {
      handleSimilaritySearch();
    } else if (searchMode === "substructure") {
      handleSubstructureSearch();
    } else {
      handleSmartSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setResults([]);
    setSelectedReference(null);
    if (onResultsFound) onResultsFound([]);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Advanced Search
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Find compounds using similarity or substructure matching
          </p>
        </div>
      </div>

      {/* Search Mode Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Search Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setSearchMode("similarity")}
            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
              searchMode === "similarity"
                ? "bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            <Target className="w-5 h-5 mx-auto mb-1" />
            Similarity
          </button>

          <button
            onClick={() => setSearchMode("substructure")}
            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
              searchMode === "substructure"
                ? "bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            <Sliders className="w-5 h-5 mx-auto mb-1" />
            Substructure
          </button>

          <button
            onClick={() => setSearchMode("smart")}
            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
              searchMode === "smart"
                ? "bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            <Sparkles className="w-5 h-5 mx-auto mb-1" />
            Smart
          </button>
        </div>
      </div>

      {/* Search Input */}
      {searchMode === "similarity" ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reference Compound
          </label>
          <select
            value={selectedReference?._id || ""}
            onChange={(e) => {
              const selected = compounds.find((c) => c._id === e.target.value);
              setSelectedReference(selected);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select a reference compound...</option>
            {compounds.slice(0, 50).map((compound) => (
              <option key={compound._id} value={compound._id}>
                {compound.name} ({compound.formula})
              </option>
            ))}
          </select>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Similarity Threshold: {(similarityThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={similarityThreshold}
              onChange={(e) =>
                setSimilarityThreshold(parseFloat(e.target.value))
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {searchMode === "substructure"
              ? "Substructure Query"
              : "Smart Query"}
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder={
                searchMode === "substructure"
                  ? "Enter formula, SMILES, or name..."
                  : 'Try "benzene", "high molecular weight", "polar"...'
              }
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {searchMode === "smart" && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              💡 Smart search understands: compound names, formulas, properties
              (high/low MW, polar/lipophilic)
            </p>
          )}
        </div>
      )}

      {/* Search Button */}
      <div className="flex gap-2">
        <button
          onClick={handleSearch}
          disabled={
            searching ||
            (searchMode === "similarity" && !selectedReference) ||
            (searchMode !== "similarity" && !searchQuery)
          }
          className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {searching ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Search
            </>
          )}
        </button>

        {results.length > 0 && (
          <button
            onClick={clearSearch}
            className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                {results.length} compounds found
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                {searchMode === "similarity" &&
                  `Similarity threshold: ${(similarityThreshold * 100).toFixed(
                    0
                  )}%`}
                {searchMode === "substructure" && `Matching: ${searchQuery}`}
                {searchMode === "smart" && `Smart search: ${searchQuery}`}
              </p>
            </div>

            {searchMode === "similarity" && results.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Best match
                </p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {(results[0].similarity * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {/* Top matches preview */}
          {results.slice(0, 3).map((compound, idx) => (
            <div
              key={compound._id}
              className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-purple-100 dark:border-purple-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    #{idx + 1}: {compound.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {compound.formula}
                  </p>
                </div>
                {searchMode === "similarity" && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-bold">
                    {(compound.similarity * 100).toFixed(1)}%
                  </span>
                )}
                {searchMode === "smart" && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-bold">
                    Score: {compound.searchScore}
                  </span>
                )}
              </div>
            </div>
          ))}

          {results.length > 3 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              + {results.length - 3} more results
            </p>
          )}
        </div>
      )}

      {/* No Results */}
      {!searching &&
        results.length === 0 &&
        (searchQuery || selectedReference) && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No compounds found matching your criteria
            </p>
          </div>
        )}
    </div>
  );
};

export default AdvancedSearch;

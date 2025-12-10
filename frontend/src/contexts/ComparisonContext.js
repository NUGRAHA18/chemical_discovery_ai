import { createContext, useContext, useState } from "react";

const ComparisonContext = createContext();

export const ComparisonProvider = ({ children }) => {
  const [comparisonList, setComparisonList] = useState([]);

  const addToComparison = (compound) => {
    // ✅ NEW: Limit to 5 compounds
    if (comparisonList.length >= 5) {
      return { success: false, message: "Maximum 5 compounds for comparison" };
    }

    // Check duplicate by SMILES
    if (comparisonList.find((c) => c.smiles === compound.smiles)) {
      return { success: false, message: "Compound already in comparison" };
    }

    setComparisonList([...comparisonList, compound]);
    return { success: true, message: "Added to comparison" };
  };

  const removeFromComparison = (smiles) => {
    setComparisonList(comparisonList.filter((c) => c.smiles !== smiles));
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  // ✅ NEW: Check if compound is in comparison
  const isInComparison = (smiles) => {
    return comparisonList.some((c) => c.smiles === smiles);
  };

  return (
    <ComparisonContext.Provider
      value={{
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => useContext(ComparisonContext);

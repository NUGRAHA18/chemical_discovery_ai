import { createContext, useContext, useState } from "react";

const ComparisonContext = createContext();

export const ComparisonProvider = ({ children }) => {
  const [comparisonList, setComparisonList] = useState([]);

  const addToComparison = (compound) => {
    if (comparisonList.length >= 3) {
      return { success: false, message: "Maximum 3 compounds for comparison" };
    }
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

  return (
    <ComparisonContext.Provider
      value={{
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => useContext(ComparisonContext);

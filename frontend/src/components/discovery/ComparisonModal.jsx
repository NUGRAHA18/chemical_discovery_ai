import { useComparison } from "../../contexts/ComparisonContext";

const ComparisonModal = ({ isOpen, onClose }) => {
  const { comparisonList, removeFromComparison, clearComparison } =
    useComparison();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Compound Comparison ({comparisonList.length})
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Compare up to 3 compounds side-by-side
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={clearComparison}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {comparisonList.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No compounds selected for comparison. Add compounds from discovery
              results.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {comparisonList.map((compound, idx) => (
                <div
                  key={idx}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 relative"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromComparison(compound.smiles)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    ×
                  </button>

                  {/* Name */}
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 pr-8">
                    {compound.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {compound.formula}
                  </p>

                  {/* Image */}
                  {compound.structure_image && (
                    <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                      <img
                        src={`http://localhost:3000${compound.structure_image}`}
                        alt={compound.name}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Properties Comparison Table */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        MW
                      </span>
                      <span className="font-semibold dark:text-white">
                        {compound.molecular_weight
                          ? `${compound.molecular_weight} g/mol`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        LogP
                      </span>
                      <span className="font-semibold dark:text-white">
                        {compound.logp !== null
                          ? compound.logp.toFixed(2)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Validation
                      </span>
                      <span
                        className={`font-semibold ${
                          compound.validation_score >= 0.8
                            ? "text-green-600"
                            : compound.validation_score >= 0.6
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {(compound.validation_score * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* Properties */}
                    {compound.properties &&
                      Object.keys(compound.properties).length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Additional Properties:
                          </p>
                          <div className="space-y-1">
                            {Object.entries(compound.properties)
                              .slice(0, 3)
                              .map(([key, value]) => (
                                <div
                                  key={key}
                                  className="flex justify-between text-xs"
                                >
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {key}:
                                  </span>
                                  <span className="dark:text-gray-300">
                                    {value}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* SMILES */}
                    <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs break-all text-gray-600 dark:text-gray-400">
                      {compound.smiles}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;

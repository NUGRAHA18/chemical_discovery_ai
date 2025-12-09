import { X, Beaker, Atom, FlaskConical } from "lucide-react";
import { API_BASE_URL } from "../../utils/constants";
import { useState } from "react";

const CompoundDetailModal = ({ compound, onClose }) => {
  const [imageError, setImageError] = useState(false);

  if (!compound) return null;

  const getValidationColor = (score) => {
    if (score >= 0.8)
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (score >= 0.6)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {compound.name}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-mono">
              {compound.formula}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Validation Score */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${getValidationColor(
              compound.validation_score || 0.5
            )}`}
          >
            <FlaskConical className="w-5 h-5" />
            Validation Score:{" "}
            {((compound.validation_score || 0.5) * 100).toFixed(0)}%
          </div>

          {/* Structure Image */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Beaker className="w-5 h-5" />
              Molecular Structure
            </h3>
            <div className="flex justify-center items-center min-h-[300px] bg-white dark:bg-gray-800 rounded-lg">
              {compound.structure_image && !imageError ? (
                <img
                  src={`${API_BASE_URL}${compound.structure_image}`}
                  alt={compound.name}
                  className="max-w-full max-h-[300px] object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Beaker className="w-20 h-20 mb-3" />
                  <p className="text-sm">Structure image unavailable</p>
                </div>
              )}
            </div>
          </div>

          {/* Properties Grid */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Atom className="w-5 h-5" />
              Molecular Properties
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Molecular Weight */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                  Molecular Weight
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                  {compound.molecular_weight
                    ? `${compound.molecular_weight.toFixed(2)} g/mol`
                    : "N/A"}
                </p>
              </div>

              {/* LogP */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">
                  LogP (Lipophilicity)
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                  {compound.logp !== null && compound.logp !== undefined
                    ? compound.logp.toFixed(2)
                    : "N/A"}
                </p>
              </div>

              {/* Additional Properties */}
              {compound.properties &&
                Object.keys(compound.properties).length > 0 && (
                  <>
                    {Object.entries(compound.properties).map(([key, value]) => (
                      <div
                        key={key}
                        className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
                      >
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 capitalize">
                          {key.replace(/_/g, " ")}
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {typeof value === "number" ? value.toFixed(2) : value}
                        </p>
                      </div>
                    ))}
                  </>
                )}
            </div>
          </div>

          {/* SMILES */}
          {compound.smiles && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                SMILES Notation
              </p>
              <p className="text-sm text-gray-900 dark:text-white font-mono break-all bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                {compound.smiles}
              </p>
            </div>
          )}

          {/* Base Compound */}
          {compound.base_compound && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-2">
                Base Compound Reference
              </p>
              <p className="text-base text-indigo-900 dark:text-indigo-300">
                {compound.base_compound}
              </p>
            </div>
          )}

          {/* Modifications */}
          {compound.modifications && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">
                Structural Modifications
              </p>
              <p className="text-base text-green-900 dark:text-green-300">
                {compound.modifications}
              </p>
            </div>
          )}

          {/* Feasibility Notes */}
          {compound.feasibility_notes && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-2">
                Feasibility Assessment
              </p>
              <p className="text-base text-yellow-900 dark:text-yellow-300">
                {compound.feasibility_notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompoundDetailModal;

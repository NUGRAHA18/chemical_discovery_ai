import { API_BASE_URL } from "../../utils/constants";
import { useComparison } from "../../contexts/ComparisonContext";
import { showSuccess, showError } from "../../utils/toast";
import { useState } from "react";
import MoleculeViewer3DModal from "./MoleculeViewer3DModal";

const CompoundCard = ({ compound, onAddToFavorites }) => {
  const { addToComparison } = useComparison();
  const [show3D, setShow3D] = useState(false);

  const handleAddToComparison = () => {
    const result = addToComparison(compound);
    if (result.success) {
      showSuccess(result.message);
    } else {
      showError(result.message);
    }
  };

  const {
    name,
    formula,
    smiles,
    properties,
    base_compound,
    modifications,
    molecular_weight,
    logp,
    structure_image,
    validation_score,
    feasibility_notes,
  } = compound;

  return (
    <>
      <div className="card hover:shadow-xl transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formula}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                validation_score >= 0.8
                  ? "bg-green-100 text-green-700"
                  : validation_score >= 0.6
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              Score: {(validation_score * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Structure Image */}
        {structure_image && (
          <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex justify-center">
            <img
              src={`${API_BASE_URL}${structure_image}`}
              alt={`Structure of ${name}`}
              className="max-w-full h-auto"
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>
        )}

        {/* Properties Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3">
            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
              Molecular Weight
            </p>
            <p className="text-lg font-bold text-primary-900 dark:text-primary-300">
              {molecular_weight ? `${molecular_weight} g/mol` : "N/A"}
            </p>
          </div>
          <div className="bg-secondary-50 dark:bg-secondary-900/20 rounded-lg p-3">
            <p className="text-xs text-secondary-600 dark:text-secondary-400 font-medium">
              LogP
            </p>
            <p className="text-lg font-bold text-secondary-900 dark:text-secondary-300">
              {logp !== null && logp !== undefined ? logp.toFixed(2) : "N/A"}
            </p>
          </div>
        </div>

        {/* Properties List */}
        {properties && Object.keys(properties).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Properties:
            </h4>
            <div className="space-y-1">
              {Object.entries(properties).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace(/_/g, " ")}:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Base Compound */}
        {base_compound && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Base Compound:
            </p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {base_compound}
            </p>
          </div>
        )}

        {/* Modifications */}
        {modifications && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Modifications:
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {modifications}
            </p>
          </div>
        )}

        {/* Feasibility Notes */}
        {feasibility_notes && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
              Feasibility:
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-300">
              {feasibility_notes}
            </p>
          </div>
        )}

        {/* SMILES */}
        <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs break-all text-gray-600 dark:text-gray-400">
          {smiles}
        </div>

        {/* Action Buttons */}
        <button
          onClick={() => setShow3D(true)}
          className="btn-secondary w-full mb-2"
        >
          🧬 View in 3D
        </button>

        <button
          onClick={handleAddToComparison}
          className="btn-outline w-full mb-2"
        >
          ⚖️ Add to Compare
        </button>

        <button
          onClick={() => onAddToFavorites(compound)}
          className="btn-outline w-full"
        >
          ⭐ Add to Favorites
        </button>
      </div>

      {/* Modal OUTSIDE card - Critical! */}
      <MoleculeViewer3DModal
        isOpen={show3D}
        onClose={() => setShow3D(false)}
        compound={compound}
      />
    </>
  );
};

export default CompoundCard;

import { useState } from "react";
import { Atom, Beaker, Eye } from "lucide-react";
import { API_BASE_URL } from "../../utils/constants";
import MoleculeViewer3D from "./MoleculeViewer3D"; // ✅ ADD THIS

const CompoundDetailModal = ({ compound, onClose }) => {
  const [imageError, setImageError] = useState(false);
  const [showImage, setShowImage] = useState(true); // ✅ NEW - Toggle between 2D and 3D

  if (!compound) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full my-8 shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center flex-shrink-0 z-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {compound.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">
              {compound.formula}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* ✅ TOGGLE BUTTONS */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setShowImage(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showImage
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <Beaker className="w-4 h-4 inline mr-2" />
                2D Structure
              </button>
              <button
                onClick={() => setShowImage(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !showImage
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <Atom className="w-4 h-4 inline mr-2" />
                3D Viewer
              </button>
            </div>

            {/* ✅ STRUCTURE DISPLAY */}
            <div
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
              style={{ minHeight: "400px" }}
            >
              {showImage ? (
                /* 2D Image */
                <div className="flex justify-center items-center h-full">
                  {compound.structure_image && !imageError ? (
                    <img
                      src={compound.structure_image}
                      alt={compound.name}
                      className="max-w-full max-h-[400px] object-contain"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Beaker className="w-20 h-20 mb-3" />
                      <p className="text-sm">2D structure unavailable</p>
                    </div>
                  )}
                </div>
              ) : (
                /* ✅ 3D Viewer */
                <div style={{ height: "400px" }}>
                  {compound.smiles ? (
                    <MoleculeViewer3D
                      smiles={compound.smiles}
                      name={compound.name}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Atom className="w-20 h-20 mb-3" />
                      <p className="text-sm">SMILES notation not available</p>
                      <p className="text-xs mt-2">
                        Cannot generate 3D structure
                      </p>
                    </div>
                  )}
                </div>
              )}
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
                      {Object.entries(compound.properties).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
                          >
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 capitalize">
                              {key.replace(/_/g, " ")}
                            </p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {typeof value === "number"
                                ? value.toFixed(2)
                                : value}
                            </p>
                          </div>
                        )
                      )}
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
                <p className="text-base text-yellow-900 dark:text-yellow-300 whitespace-pre-wrap">
                  {compound.feasibility_notes}
                </p>
              </div>
            )}

            {/* ✅ 3D Controls Info (only show when 3D viewer active) */}
            {!showImage && compound.smiles && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  🎮 3D Viewer Controls
                </h3>
                <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                  <li>
                    • <strong>Left Click + Drag:</strong> Rotate
                  </li>
                  <li>
                    • <strong>Right Click + Drag:</strong> Zoom
                  </li>
                  <li>
                    • <strong>Middle Click + Drag:</strong> Pan
                  </li>
                  <li>
                    • <strong>Scroll:</strong> Zoom in/out
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
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

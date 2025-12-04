import MoleculeViewer3D from "./MoleculeViewer3D";
import { useEffect } from "react";

const MoleculeViewer3DModal = ({ isOpen, onClose, compound }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !compound) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full my-8 shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              3D Molecular Structure
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {compound.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* 3D Viewer */}
          <div className="mb-6" style={{ height: "450px" }}>
            <MoleculeViewer3D smiles={compound.smiles} name={compound.name} />
          </div>

          {/* Compound Info */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Basic Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Formula:
                    </span>
                    <span className="font-medium dark:text-white">
                      {compound.formula}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      MW:
                    </span>
                    <span className="font-medium dark:text-white">
                      {compound.molecular_weight
                        ? `${compound.molecular_weight} g/mol`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      LogP:
                    </span>
                    <span className="font-medium dark:text-white">
                      {compound.logp !== null && compound.logp !== undefined
                        ? compound.logp.toFixed(2)
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SMILES */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  SMILES Notation
                </h3>
                <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs break-all font-mono text-gray-700 dark:text-gray-300">
                  {compound.smiles}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Properties */}
              {compound.properties &&
                Object.keys(compound.properties).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Properties
                    </h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(compound.properties).map(
                        ([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <span className="font-medium dark:text-white">
                              {value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Validation */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Validation
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        compound.validation_score >= 0.8
                          ? "bg-green-500"
                          : compound.validation_score >= 0.6
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${(compound.validation_score || 0) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold dark:text-white">
                    {((compound.validation_score || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Controls Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  🎮 Controls
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
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoleculeViewer3DModal;

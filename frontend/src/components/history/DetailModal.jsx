import CompoundCard from "../discovery/CompoundCard";
import { useState } from "react";
import MoleculeViewer3DModal from "../discovery/MoleculeViewer3DModal";

const DetailModal = ({ discovery, onClose, onAddToFavorites, onExportPDF }) => {
  const [selected3DCompound, setSelected3DCompound] = useState(null);
  if (!discovery) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Discovery Details
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {new Date(discovery.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {onExportPDF && (
              <button
                onClick={() => onExportPDF(discovery)}
                className="btn-primary text-sm"
              >
                📄 Export PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Criteria */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Criteria
            </h3>
            <p className="text-gray-700">{discovery.criteria}</p>
          </div>

          {/* Compounds */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Generated Compounds ({discovery.compounds?.length || 0})
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discovery.compounds?.map((compound, idx) => (
                <div key={idx} className="relative">
                  <CompoundCard
                    compound={compound}
                    onAddToFavorites={onAddToFavorites}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 3D Viewer Modal */}
          <MoleculeViewer3DModal
            isOpen={!!selected3DCompound}
            onClose={() => setSelected3DCompound(null)}
            compound={selected3DCompound}
          />

          {/* Analysis */}
          {discovery.analysis && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analysis
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {discovery.analysis}
              </p>
            </div>
          )}

          {/* Justification */}
          {discovery.justification && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Justification
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {discovery.justification}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;

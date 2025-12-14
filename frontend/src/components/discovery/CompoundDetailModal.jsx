import { useState } from "react";
import { Atom, Beaker, Download, X } from "lucide-react";
import MoleculeViewer3D from "./MoleculeViewer3D";
import { getImageUrl } from "../../config/env";

const CompoundDetailModal = ({ compound, onClose }) => {
  const [imageError, setImageError] = useState(false);
  const [showImage, setShowImage] = useState(true);

  const handleDownload2D = async () => {
    if (!compound.structure_image) return;
    const fixedUrl = getImageUrl(compound.structure_image);

    try {
      // Fetch ke URL yang benar (3010 / production)
      const response = await fetch(fixedUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      link.download = `${compound.name.replace(/\s+/g, "-")}-2D.png`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);

      const link = document.createElement("a");
      link.href = fixedUrl;
      link.download = `${compound.name}-2D.png`;
      link.click();
    }
  };
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
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Toggle Buttons */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImage(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                    showImage
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Beaker className="w-4 h-4 mr-2" />
                  2D Structure
                </button>
                <button
                  onClick={() => setShowImage(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                    !showImage
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Atom className="w-4 h-4 mr-2" />
                  3D Viewer
                </button>
              </div>

              {/* ✅ Tombol Download Khusus untuk Mode 2D */}
              {showImage && compound.structure_image && !imageError && (
                <button
                  onClick={handleDownload2D}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center text-sm font-medium"
                  title="Download 2D Image"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG
                </button>
              )}
            </div>

            {/* Structure Display */}
            <div
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 relative"
              style={{ minHeight: "400px" }}
            >
              {showImage ? (
                <div className="flex justify-center items-center h-full">
                  {compound.structure_image && !imageError ? (
                    <img
                      src={getImageUrl(compound.structure_image)}
                      alt={compound.name}
                      className="max-w-full max-h-[400px] object-contain"
                      onError={() => setImageError(true)}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Beaker className="w-20 h-20 mb-3" />
                      <p className="text-sm">2D structure unavailable</p>
                    </div>
                  )}
                </div>
              ) : (
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

                {/* Additional Properties Logic */}
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

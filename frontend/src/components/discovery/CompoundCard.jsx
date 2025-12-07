import React from "react";
import {
  Star,
  CheckCircle,
  AlertTriangle,
  Info,
  Activity,
  Droplet,
} from "lucide-react";

const CompoundCard = ({ compound, onAddToFavorites }) => {
  // Fungsi untuk menentukan warna badge skor validasi
  const getScoreColor = (score) => {
    if (score >= 0.8) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 0.5) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  // Fungsi untuk menentukan ikon skor validasi
  const getScoreIcon = (score) => {
    if (score >= 0.8) return <CheckCircle className="w-3 h-3 mr-1" />;
    return <AlertTriangle className="w-3 h-3 mr-1" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden">
      {/* Header dengan Gambar Struktur */}
      <div className="relative h-48 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 p-4 flex items-center justify-center">
        {compound.structure_image ? (
          <img
            src={compound.structure_image}
            alt={`Structure of ${compound.name}`}
            className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-screen"
          />
        ) : (
          <div className="text-gray-400 text-sm flex flex-col items-center">
            <Activity className="w-8 h-8 mb-2 opacity-50" />
            <span>No Structure Preview</span>
          </div>
        )}

        {/* Badge Skor Validasi */}
        <div
          className={`absolute top-3 right-3 flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(
            compound.validation_score
          )}`}
        >
          {getScoreIcon(compound.validation_score)}
          {Math.round((compound.validation_score || 0) * 100)}% Match
        </div>
      </div>

      {/* Konten Utama */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Judul & Formula */}
        <div className="mb-4">
          <h3
            className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2"
            title={compound.name}
          >
            {compound.name}
          </h3>
          <code className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded font-mono">
            {compound.formula}
          </code>
        </div>

        {/* Properti Utama (Grid 2 Kolom) */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
              <Activity className="w-3 h-3 mr-1" /> Mol. Weight
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {compound.molecular_weight
                ? `${compound.molecular_weight} g/mol`
                : "N/A"}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
              <Droplet className="w-3 h-3 mr-1" /> LogP
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {compound.logp !== undefined ? compound.logp : "N/A"}
            </p>
          </div>
        </div>

        {/* Deskripsi Singkat / Justification */}
        {compound.justification && (
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 flex-1">
            <p>{compound.justification}</p>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button
            onClick={() => onAddToFavorites(compound)}
            className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4" />
            Save
          </button>

          <button className="flex-1 btn-outline text-sm py-2 flex items-center justify-center gap-2">
            <Info className="w-4 h-4" />
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompoundCard;

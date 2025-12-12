import { useState, useEffect } from "react";
import { Bookmark, Plus, Trash2, Check, Save, X, Tag } from "lucide-react";
import { showError, showSuccess } from "../../utils/toast";

const FilterPresets = ({ currentFilters, onApplyPreset }) => {
  const [presets, setPresets] = useState([]);
  const [activePresetId, setActivePresetId] = useState(null);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  // Load presets
  useEffect(() => {
    const saved = localStorage.getItem("discovery_filter_presets");
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse presets", e);
      }
    }
  }, []);

  // Cek apakah filters berubah manual (jika ya, hilangkan status active)
  // Optional: Fitur ini agar label "Active" hilang jika user menggeser slider setelah apply preset
  useEffect(() => {
    // Logic sederhana: jika ada preset aktif, kita asumsikan user masih memakainya
    // sampai mereka memilih preset lain atau menyimpannya.
  }, [currentFilters]);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      showError("Please enter a preset name");
      return;
    }

    const newPreset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      filters: { ...currentFilters },
      createdAt: new Date().toISOString(),
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem(
      "discovery_filter_presets",
      JSON.stringify(updatedPresets)
    );

    setNewPresetName("");
    setShowSaveInput(false);
    setActivePresetId(newPreset.id); // Otomatis set aktif setelah save
    showSuccess("Filter saved!");
  };

  const handleDeletePreset = (e, id) => {
    e.stopPropagation(); // Mencegah trigger apply saat delete
    if (!window.confirm("Delete this preset?")) return;

    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    localStorage.setItem("discovery_filter_presets", JSON.stringify(updated));

    if (activePresetId === id) setActivePresetId(null);
    showSuccess("Preset deleted");
  };

  const handleApply = (preset) => {
    onApplyPreset(preset.filters);
    setActivePresetId(preset.id);
    showSuccess(`Applied: ${preset.name}`);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-purple-100 dark:border-gray-700 mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
        {/* Header Title & Active Status */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
            <Bookmark className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
            Saved Filters
          </span>

          {/* Active Badge */}
          {activePresetId && (
            <span className="ml-2 flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full animate-fade-in">
              <Check className="w-3 h-3" />
              Active: {presets.find((p) => p.id === activePresetId)?.name}
            </span>
          )}
        </div>

        {/* Action: Save Current */}
        {!showSaveInput ? (
          <button
            onClick={() => setShowSaveInput(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Save current settings
          </button>
        ) : (
          /* Inline Save Form */
          <div className="flex items-center gap-2 animate-in slide-in-from-right-2 fade-in">
            <input
              type="text"
              placeholder="Preset Name..."
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="px-2 py-1 text-xs border border-purple-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 w-40"
              autoFocus
            />
            <button
              onClick={handleSavePreset}
              className="p-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              title="Save"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowSaveInput(false)}
              className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Preset List (Chips) */}
      {presets.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No saved filters yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleApply(preset)}
                className={`
                  group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all
                  ${
                    isActive
                      ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                      : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-gray-600"
                  }
                `}
              >
                <Tag
                  className={`w-3 h-3 ${
                    isActive ? "text-white" : "text-gray-400"
                  }`}
                />
                <span>{preset.name}</span>

                {/* Delete Button (visible on hover or active) */}
                <button
                  onClick={(e) => handleDeletePreset(e, preset.id)}
                  className={`
                    p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                    ${
                      isActive
                        ? "hover:bg-purple-500 text-purple-100"
                        : "hover:bg-red-100 text-gray-400 hover:text-red-500"
                    }
                  `}
                  title="Delete preset"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterPresets;

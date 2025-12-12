import { useState, useEffect } from "react";
import { Bookmark, Plus, Trash2, Check } from "lucide-react";

const FilterPresets = ({ currentFilters, onApplyPreset }) => {
  const [presets, setPresets] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("filterPresets");
    if (saved) {
      setPresets(JSON.parse(saved));
    }
  }, []);

  // Save preset
  const handleSave = () => {
    if (!presetName.trim()) return;

    const newPreset = {
      id: Date.now(),
      name: presetName,
      filters: { ...currentFilters },
      createdAt: new Date().toISOString(),
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem("filterPresets", JSON.stringify(updated));

    setPresetName("");
    setShowSaveDialog(false);
  };

  // Delete preset
  const handleDelete = (id) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    localStorage.setItem("filterPresets", JSON.stringify(updated));
  };

  // Apply preset
  const handleApply = (preset) => {
    onApplyPreset(preset.filters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-primary-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            Filter Presets
          </h3>
        </div>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Save Current
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Preset name (e.g., Quick Research)"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-1.5 bg-primary-500 text-white rounded text-xs hover:bg-primary-600"
            >
              <Check className="w-3 h-3 inline mr-1" />
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="flex-1 px-3 py-1.5 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preset List */}
      {presets.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No saved presets yet
        </p>
      ) : (
        <div className="space-y-2">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors group"
            >
              <button
                onClick={() => handleApply(preset)}
                className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              >
                {preset.name}
              </button>
              <button
                onClick={() => handleDelete(preset.id)}
                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterPresets;

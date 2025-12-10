import { useState } from "react";
import { X, Save, ClipboardList, Sparkles } from "lucide-react";

const AddTemplateModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    emoji: "🧪",
    category: "",
    name: "",
    description: "",
    inputMode: "structured",
    color: "blue",
  });

  const [structuredData, setStructuredData] = useState({
    category: "",
    boilingPointMin: "",
    boilingPointMax: "",
    viscosityMin: "",
    viscosityMax: "",
    solubility: "",
    thermalStabilityMin: "",
    additionalProperties: [],
    notes: "",
  });

  const [aiPrompt, setAiPrompt] = useState("");

  const emojis = [
    "🧪",
    "⚗️",
    "🔬",
    "💊",
    "🧬",
    "🌊",
    "🔥",
    "🛡️",
    "🏗️",
    "📦",
    "🛢️",
    "🌿",
  ];
  const categories = [
    "Surfactant",
    "Polymer",
    "Catalyst",
    "Solvent",
    "Additive",
    "Coating",
    "Lubricant",
    "Resin",
    "Other",
  ];
  const colors = [
    "blue",
    "green",
    "purple",
    "emerald",
    "amber",
    "red",
    "orange",
    "indigo",
  ];

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStructuredChange = (e) => {
    const { name, value } = e.target;
    setStructuredData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category) {
      alert("Please fill in template name and category");
      return;
    }

    const template = {
      id: `custom-${Date.now()}`,
      icon: formData.emoji,
      name: formData.name,
      category: formData.category,
      description: formData.description,
      color: formData.color,
      inputMode: formData.inputMode,
      custom: true,
    };

    if (formData.inputMode === "structured") {
      template.structuredData = structuredData;
    } else {
      template.aiPrompt = aiPrompt;
    }

    onSave(template);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      emoji: "🧪",
      category: "",
      name: "",
      description: "",
      inputMode: "structured",
      color: "blue",
    });
    setStructuredData({
      category: "",
      boilingPointMin: "",
      boilingPointMax: "",
      viscosityMin: "",
      viscosityMax: "",
      solubility: "",
      thermalStabilityMin: "",
      additionalProperties: [],
      notes: "",
    });
    setAiPrompt("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Add Custom Template
            </h2>
            <p className="text-purple-100 text-sm mt-1">
              Create your own discovery template
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="space-y-5">
            {/* Emoji Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Template Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, emoji }))}
                    className={`text-3xl p-2 rounded-lg border-2 transition-all ${
                      formData.emoji === emoji
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 scale-110"
                        : "border-gray-300 dark:border-gray-600 hover:border-purple-300 hover:scale-105"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Chemical Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Custom Surfactant"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of this template..."
                rows="2"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Card Color
              </label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const colorMap = {
                    blue: "bg-blue-500",
                    green: "bg-green-500",
                    purple: "bg-purple-500",
                    emerald: "bg-emerald-500",
                    amber: "bg-amber-500",
                    red: "bg-red-500",
                    orange: "bg-orange-500",
                    indigo: "bg-indigo-500",
                  };
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, color }))
                      }
                      className={`w-10 h-10 rounded-lg ${
                        colorMap[color]
                      } border-2 transition-all ${
                        formData.color === color
                          ? "border-gray-900 dark:border-white scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      title={color}
                    />
                  );
                })}
              </div>
            </div>

            {/* Input Mode Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Input Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      inputMode: "structured",
                    }))
                  }
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.inputMode === "structured"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                      : "border-gray-300 dark:border-gray-600 hover:border-purple-300"
                  }`}
                >
                  <ClipboardList className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Structured Form
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Form with specific fields
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, inputMode: "ai-prompt" }))
                  }
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.inputMode === "ai-prompt"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                      : "border-gray-300 dark:border-gray-600 hover:border-purple-300"
                  }`}
                >
                  <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    AI Prompt
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Natural language prompt
                  </p>
                </button>
              </div>
            </div>

            {/* Conditional Fields */}
            {formData.inputMode === "structured" ? (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Structured Form Default Values (Optional)
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      name="boilingPointMin"
                      value={structuredData.boilingPointMin}
                      onChange={handleStructuredChange}
                      placeholder="Min BP (°C)"
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      name="boilingPointMax"
                      value={structuredData.boilingPointMax}
                      onChange={handleStructuredChange}
                      placeholder="Max BP (°C)"
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    name="notes"
                    value={structuredData.notes}
                    onChange={handleStructuredChange}
                    placeholder="Additional notes..."
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  AI Prompt Template
                </h4>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the type of compound you want to discover..."
                  rows="4"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none"
                />
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTemplateModal;

import { useState, useEffect } from "react";
import {
  ClipboardList,
  Thermometer,
  Droplets,
  FlaskConical,
  Plus,
  X,
} from "lucide-react";

const DEFAULT_STATE = {
  category: "",
  boilingPointMin: "",
  boilingPointMax: "",
  viscosityMin: "",
  viscosityMax: "",
  solubility: "",
  thermalStabilityMin: "",
  additionalProperties: [],
  notes: "",
};

const StructuredForm = ({ onSubmit, loading, initialData }) => {
  const [formData, setFormData] = useState(initialData || DEFAULT_STATE);
  const [newProperty, setNewProperty] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...DEFAULT_STATE,
        ...initialData,
        category: initialData.category || "",
      });
    }
  }, [initialData]);

  useEffect(() => {}, [formData.category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProperty = () => {
    if (newProperty.trim()) {
      setFormData((prev) => ({
        ...prev,
        additionalProperties: [
          ...prev.additionalProperties,
          newProperty.trim(),
        ],
      }));
      setNewProperty("");
    }
  };

  const handleRemoveProperty = (index) => {
    setFormData((prev) => ({
      ...prev,
      additionalProperties: prev.additionalProperties.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parseNum = (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : parseFloat(val);

    const payload = {
      category: formData.category,
      boilingPoint:
        formData.boilingPointMin || formData.boilingPointMax
          ? {
              min: parseNum(formData.boilingPointMin),
              max: parseNum(formData.boilingPointMax),
            }
          : undefined,
      viscosity:
        formData.viscosityMin || formData.viscosityMax
          ? {
              min: parseNum(formData.viscosityMin),
              max: parseNum(formData.viscosityMax),
            }
          : undefined,
      solubility: formData.solubility || undefined,
      thermalStability: formData.thermalStabilityMin
        ? {
            min: parseNum(formData.thermalStabilityMin),
          }
        : undefined,
      additionalProperties:
        formData.additionalProperties.length > 0
          ? formData.additionalProperties
          : undefined,
      notes: formData.notes ? formData.notes.trim() : undefined,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Chemical Category <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FlaskConical className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          </div>

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input-field pl-10 w-full transition-all"
            required
          >
            <option value="">Select a category</option>
            <option value="surfactant">Surfactant</option>
            <option value="polymer">Polymer</option>
            <option value="catalyst">Catalyst</option>
            <option value="solvent">Solvent</option>
            <option value="additive">Additive</option>
            <option value="coating">Coating</option>
            <option value="lubricant">Lubricant</option>
            <option value="resin">Resin</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Boiling Point */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Boiling Point Range (°C)
          </label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 group">
              <Thermometer className="absolute top-2.5 left-3 h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="number"
                name="boilingPointMin"
                value={formData.boilingPointMin}
                onChange={handleChange}
                placeholder="Min"
                className="input-field pl-9 w-full"
              />
            </div>
            <span className="text-gray-400 font-medium">-</span>
            <div className="relative flex-1">
              <input
                type="number"
                name="boilingPointMax"
                value={formData.boilingPointMax}
                onChange={handleChange}
                placeholder="Max"
                className="input-field w-full"
              />
            </div>
          </div>
        </div>

        {/* Viscosity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Viscosity Range (cP)
          </label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 group">
              <Droplets className="absolute top-2.5 left-3 h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="number"
                name="viscosityMin"
                value={formData.viscosityMin}
                onChange={handleChange}
                placeholder="Min"
                className="input-field pl-9 w-full"
              />
            </div>
            <span className="text-gray-400 font-medium">-</span>
            <div className="relative flex-1">
              <input
                type="number"
                name="viscosityMax"
                value={formData.viscosityMax}
                onChange={handleChange}
                placeholder="Max"
                className="input-field w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Solubility & Thermal Stability */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Solubility Preference
          </label>
          <select
            name="solubility"
            value={formData.solubility}
            onChange={handleChange}
            className="input-field w-full"
          >
            <option value="">Any</option>
            <option value="water-soluble">Water Soluble</option>
            <option value="oil-soluble">Oil Soluble</option>
            <option value="alcohol-soluble">Alcohol Soluble</option>
            <option value="insoluble">Insoluble</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Min Thermal Stability (°C)
          </label>
          <input
            type="number"
            name="thermalStabilityMin"
            value={formData.thermalStabilityMin}
            onChange={handleChange}
            placeholder="e.g. 150"
            className="input-field w-full"
          />
        </div>
      </div>

      {/* Additional Properties */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary-500" />
          Additional Criteria
        </label>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newProperty}
            onChange={(e) => setNewProperty(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAddProperty())
            }
            placeholder="e.g. Biodegradable, Non-toxic"
            className="input-field flex-1"
          />
          <button
            type="button"
            onClick={handleAddProperty}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-200 transition-colors flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {formData.additionalProperties.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {formData.additionalProperties.map((prop, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                {prop}
                <button
                  type="button"
                  onClick={() => handleRemoveProperty(idx)}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">
            No additional criteria added yet.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex justify-center items-center py-3.5 text-base font-bold tracking-wide shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Synthesizing...</span>
          </div>
        ) : (
          <>
            <FlaskConical className="w-5 h-5 mr-2" />
            Start Discovery
          </>
        )}
      </button>
    </form>
  );
};

export default StructuredForm;

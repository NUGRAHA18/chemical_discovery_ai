import { useState } from 'react';
import Input from '../common/Input';

const StructuredForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    category: '',
    boilingPointMin: '',
    boilingPointMax: '',
    viscosityMin: '',
    viscosityMax: '',
    solubility: '',
    thermalStabilityMin: '',
    additionalProperties: [],
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const categories = [
    { value: '', label: 'Select category...' },
    { value: 'surfactant', label: 'Surfactant' },
    { value: 'polymer', label: 'Polymer' },
    { value: 'solvent', label: 'Solvent' },
    { value: 'catalyst', label: 'Catalyst' },
    { value: 'additive', label: 'Additive' },
    { value: 'other', label: 'Other' }
  ];

  const solubilityOptions = [
    { value: '', label: 'Select solubility...' },
    { value: 'water-soluble', label: 'Water Soluble' },
    { value: 'oil-soluble', label: 'Oil Soluble' },
    { value: 'alcohol-soluble', label: 'Alcohol Soluble' },
    { value: 'insoluble', label: 'Insoluble' },
    { value: 'any', label: 'Any' }
  ];

  const propertyOptions = [
    { value: 'biodegradable', label: 'Biodegradable' },
    { value: 'non-toxic', label: 'Non-toxic' },
    { value: 'UV-stable', label: 'UV Stable' },
    { value: 'corrosion-resistant', label: 'Corrosion Resistant' },
    { value: 'flame-retardant', label: 'Flame Retardant' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (value) => {
    setFormData(prev => ({
      ...prev,
      additionalProperties: prev.additionalProperties.includes(value)
        ? prev.additionalProperties.filter(p => p !== value)
        : [...prev.additionalProperties, value]
    }));
  };

  const validate = () => {
    const newErrors = {};

    // Check at least one field filled
    const hasCategory = formData.category && formData.category !== 'other';
    const hasBoilingPoint = formData.boilingPointMin || formData.boilingPointMax;
    const hasViscosity = formData.viscosityMin || formData.viscosityMax;
    const hasThermalStability = formData.thermalStabilityMin;
    const hasSolubility = formData.solubility && formData.solubility !== 'any';
    const hasProperties = formData.additionalProperties.length > 0;
    const hasNotes = formData.notes.trim();

    if (!hasCategory && !hasBoilingPoint && !hasViscosity && !hasThermalStability && 
        !hasSolubility && !hasProperties && !hasNotes) {
      newErrors.general = 'Please fill at least one field';
      return newErrors;
    }

    // Validate ranges
    if (formData.boilingPointMin && formData.boilingPointMax) {
      if (parseFloat(formData.boilingPointMin) >= parseFloat(formData.boilingPointMax)) {
        newErrors.boilingPointMax = 'Max must be greater than min';
      }
    }

    if (formData.viscosityMin && formData.viscosityMax) {
      if (parseFloat(formData.viscosityMin) >= parseFloat(formData.viscosityMax)) {
        newErrors.viscosityMax = 'Max must be greater than min';
      }
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Convert to backend format
    const structuredData = {
      category: formData.category || undefined,
      boilingPoint: (formData.boilingPointMin || formData.boilingPointMax) ? {
        min: formData.boilingPointMin ? parseFloat(formData.boilingPointMin) : undefined,
        max: formData.boilingPointMax ? parseFloat(formData.boilingPointMax) : undefined
      } : undefined,
      viscosity: (formData.viscosityMin || formData.viscosityMax) ? {
        min: formData.viscosityMin ? parseFloat(formData.viscosityMin) : undefined,
        max: formData.viscosityMax ? parseFloat(formData.viscosityMax) : undefined
      } : undefined,
      solubility: formData.solubility || undefined,
      thermalStability: formData.thermalStabilityMin ? {
        min: parseFloat(formData.thermalStabilityMin)
      } : undefined,
      additionalProperties: formData.additionalProperties.length > 0 ? formData.additionalProperties : undefined,
      notes: formData.notes.trim() || undefined
    };

    onSubmit(structuredData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errors.general}
        </div>
      )}

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="input-field"
          disabled={loading}
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Boiling Point Range */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Boiling Point Min (°C)"
          type="number"
          name="boilingPointMin"
          value={formData.boilingPointMin}
          onChange={handleChange}
          placeholder="e.g., 80"
          disabled={loading}
        />
        <Input
          label="Boiling Point Max (°C)"
          type="number"
          name="boilingPointMax"
          value={formData.boilingPointMax}
          onChange={handleChange}
          placeholder="e.g., 120"
          error={errors.boilingPointMax}
          disabled={loading}
        />
      </div>

      {/* Viscosity Range */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Viscosity Min (cP)"
          type="number"
          name="viscosityMin"
          value={formData.viscosityMin}
          onChange={handleChange}
          placeholder="e.g., 10"
          disabled={loading}
        />
        <Input
          label="Viscosity Max (cP)"
          type="number"
          name="viscosityMax"
          value={formData.viscosityMax}
          onChange={handleChange}
          placeholder="e.g., 50"
          error={errors.viscosityMax}
          disabled={loading}
        />
      </div>

      {/* Solubility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Solubility
        </label>
        <select
          name="solubility"
          value={formData.solubility}
          onChange={handleChange}
          className="input-field"
          disabled={loading}
        >
          {solubilityOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Thermal Stability */}
      <Input
        label="Thermal Stability Min (°C)"
        type="number"
        name="thermalStabilityMin"
        value={formData.thermalStabilityMin}
        onChange={handleChange}
        placeholder="e.g., 70"
        disabled={loading}
      />

      {/* Additional Properties */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Properties
        </label>
        <div className="space-y-2">
          {propertyOptions.map(prop => (
            <label key={prop.value} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.additionalProperties.includes(prop.value)}
                onChange={() => handleCheckboxChange(prop.value)}
                disabled={loading}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{prop.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional requirements or notes..."
          rows="3"
          disabled={loading}
          className="input-field resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Compounds'}
      </button>
    </form>
  );
};

export default StructuredForm;
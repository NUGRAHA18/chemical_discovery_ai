const buildCriteriaFromStructured = (structuredData) => {
  const parts = [];

  if (structuredData.category && structuredData.category !== "other") {
    const categoryMap = {
      surfactant: "surfactant compound",
      polymer: "polymer material",
      solvent: "solvent",
      catalyst: "catalyst",
      additive: "additive compound",
    };
    parts.push(categoryMap[structuredData.category] || structuredData.category);
  }

  if (structuredData.boilingPoint) {
    const { min, max } = structuredData.boilingPoint;
    if (min && max) {
      parts.push(`with boiling point between ${min}°C and ${max}°C`);
    } else if (min) {
      parts.push(`with boiling point above ${min}°C`);
    } else if (max) {
      parts.push(`with boiling point below ${max}°C`);
    }
  }

  if (structuredData.viscosity) {
    const { min, max } = structuredData.viscosity;
    if (min && max) {
      parts.push(`viscosity between ${min} and ${max} cP`);
    } else if (min) {
      parts.push(`viscosity above ${min} cP`);
    } else if (max) {
      parts.push(`viscosity below ${max} cP`);
    }
  }

  if (structuredData.solubility && structuredData.solubility !== "any") {
    const solubilityMap = {
      "water-soluble": "water-soluble",
      "oil-soluble": "oil-soluble",
      "alcohol-soluble": "alcohol-soluble",
      insoluble: "insoluble in water",
    };
    parts.push(
      solubilityMap[structuredData.solubility] || structuredData.solubility
    );
  }

  if (structuredData.thermalStability?.min) {
    parts.push(
      `thermal stability above ${structuredData.thermalStability.min}°C`
    );
  }

  if (structuredData.additionalProperties?.length > 0) {
    const propsMap = {
      biodegradable: "biodegradable",
      "non-toxic": "non-toxic",
      "UV-stable": "UV-resistant",
      "corrosion-resistant": "corrosion-resistant",
      "flame-retardant": "flame-retardant",
    };

    const mappedProps = structuredData.additionalProperties
      .map((prop) => propsMap[prop] || prop)
      .join(", ");

    parts.push(mappedProps);
  }

  if (structuredData.notes?.trim()) {
    parts.push(structuredData.notes.trim());
  }

  if (parts.length === 0) {
    return "chemical compound with general properties";
  }

  const criteria = parts.join(", ");

  return criteria.charAt(0).toUpperCase() + criteria.slice(1);
};

const validateStructuredData = (structuredData) => {
  if (!structuredData || typeof structuredData !== "object") {
    return { valid: false, error: "Structured data must be an object" };
  }

  const hasBoilingPoint =
    structuredData.boilingPoint?.min || structuredData.boilingPoint?.max;
  const hasViscosity =
    structuredData.viscosity?.min || structuredData.viscosity?.max;
  const hasThermalStability = structuredData.thermalStability?.min;
  const hasCategory =
    structuredData.category && structuredData.category !== "other";
  const hasSolubility =
    structuredData.solubility && structuredData.solubility !== "any";
  const hasAdditionalProps = structuredData.additionalProperties?.length > 0;
  const hasNotes = structuredData.notes?.trim();

  if (
    !hasBoilingPoint &&
    !hasViscosity &&
    !hasThermalStability &&
    !hasCategory &&
    !hasSolubility &&
    !hasAdditionalProps &&
    !hasNotes
  ) {
    return {
      valid: false,
      error: "At least one field must be specified in structured form",
    };
  }

  if (hasBoilingPoint) {
    const { min, max } = structuredData.boilingPoint;
    if (min && max && min >= max) {
      return { valid: false, error: "Boiling point min must be less than max" };
    }
    if (min && (min < -273 || min > 1000)) {
      return {
        valid: false,
        error: "Boiling point min out of range (-273 to 1000°C)",
      };
    }
    if (max && (max < -273 || max > 1000)) {
      return {
        valid: false,
        error: "Boiling point max out of range (-273 to 1000°C)",
      };
    }
  }

  if (hasViscosity) {
    const { min, max } = structuredData.viscosity;
    if (min && max && min >= max) {
      return { valid: false, error: "Viscosity min must be less than max" };
    }
    if (min && min < 0) {
      return { valid: false, error: "Viscosity cannot be negative" };
    }
    if (max && max < 0) {
      return { valid: false, error: "Viscosity cannot be negative" };
    }
  }

  if (hasThermalStability) {
    const min = structuredData.thermalStability.min;
    if (min < -273 || min > 1000) {
      return {
        valid: false,
        error: "Thermal stability out of range (-273 to 1000°C)",
      };
    }
  }

  return { valid: true };
};

module.exports = {
  buildCriteriaFromStructured,
  validateStructuredData,
};

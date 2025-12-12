export const discoveryTemplates = [
  {
    id: "surfactant-eor",
    name: "Surfactant for Enhanced Oil Recovery",
    category: "Surfactant",
    description:
      "Surfactant optimized for oil recovery applications with specific HLB range and thermal stability",
    icon: "🛢️",
    color: "blue",
    inputMode: "structured",
    structuredData: {
      category: "Surfactant",
      boilingPointMin: 80,
      boilingPointMax: 150,
      viscosityMin: 10,
      viscosityMax: 50,
      solubility: "Water Soluble",
      thermalStabilityMin: 70,
      additionalProperties: ["Biodegradable", "Non-toxic"],
      notes:
        "For enhanced oil recovery with low environmental impact and high thermal stability",
    },
    aiPrompt:
      "Surfactant for enhanced oil recovery with HLB 8-12, thermal stability above 80°C, biodegradable, and non-toxic for environmental compliance",
  },
  {
    id: "polymer-packaging",
    name: "Biodegradable Polymer for Food Packaging",
    category: "Polymer",
    description:
      "Environmentally friendly polymer with excellent barrier properties for food packaging",
    icon: "📦",
    color: "green",
    inputMode: "structured",
    structuredData: {
      category: "Polymer",
      boilingPointMin: "",
      boilingPointMax: "",
      viscosityMin: "",
      viscosityMax: "",
      solubility: "",
      thermalStabilityMin: 100,
      additionalProperties: ["Biodegradable", "Food-safe"],
      notes:
        "Biodegradable polymer for food packaging with good barrier properties and thermal stability",
    },
    aiPrompt:
      "Biodegradable polymer for food packaging with excellent barrier properties, thermal stability above 100°C, food-safe, and environmentally friendly",
  },
  {
    id: "catalyst-hydrogenation",
    name: "Catalyst for Hydrogenation Reactions",
    category: "Catalyst",
    description:
      "High-performance catalyst for selective hydrogenation with excellent stability",
    icon: "⚗️",
    color: "purple",
    inputMode: "ai-prompt",
    aiPrompt:
      "High-performance catalyst for hydrogenation reactions with excellent selectivity, thermal stability above 200°C, resistance to sulfur poisoning, and long operational lifetime",
  },
  {
    id: "solvent-green",
    name: "Green Solvent for Extraction",
    category: "Solvent",
    description:
      "Environmentally friendly solvent for natural compound extraction",
    icon: "🌿",
    color: "emerald",
    inputMode: "ai-prompt",
    aiPrompt:
      "Green solvent for extracting natural compounds from plants with high solubility for organic compounds, low toxicity, biodegradable, renewable-based, and thermal stability above 60°C",
  },
  {
    id: "additive-plasticizer",
    name: "Non-toxic Plasticizer",
    category: "Additive",
    description: "Safe plasticizer alternative for flexible PVC applications",
    icon: "🧴",
    color: "amber",
    inputMode: "structured",
    structuredData: {
      category: "Additive",
      boilingPointMin: 150,
      boilingPointMax: 300,
      viscosityMin: 20,
      viscosityMax: 100,
      additionalProperties: ["Non-toxic", "Low volatility"],
      notes:
        "Non-toxic plasticizer for flexible PVC with low migration and high compatibility",
    },
    aiPrompt:
      "Non-toxic plasticizer for flexible PVC applications with low volatility, minimal migration, excellent compatibility, and regulatory compliance for consumer products",
  },
  {
    id: "coating-anticorrosion",
    name: "Anti-Corrosion Coating",
    category: "Coating",
    description: "Protective coating for metal surfaces in harsh environments",
    icon: "🛡️",
    color: "red",
    inputMode: "ai-prompt",
    aiPrompt:
      "Anti-corrosion coating for metal surfaces with excellent adhesion, chemical resistance, UV stability, thermal stability up to 150°C, and long-term durability in marine environments",
  },
  {
    id: "lubricant-high-temp",
    name: "High-Temperature Lubricant",
    category: "Lubricant",
    description: "Synthetic lubricant for extreme temperature applications",
    icon: "🔥",
    color: "orange",
    inputMode: "structured",
    structuredData: {
      category: "Lubricant",
      boilingPointMin: 200,
      viscosityMin: 30,
      viscosityMax: 150,
      thermalStabilityMin: 200,
      additionalProperties: ["Low volatility", "Oxidation resistant"],
      notes:
        "High-temperature synthetic lubricant with excellent thermal and oxidation stability",
    },
    aiPrompt:
      "Synthetic lubricant for high-temperature applications above 200°C with low volatility, excellent oxidation resistance, thermal stability, and long service life",
  },
  {
    id: "resin-composite",
    name: "Epoxy Resin for Composites",
    category: "Resin",
    description: "High-strength epoxy resin for advanced composite materials",
    icon: "🏗️",
    color: "indigo",
    inputMode: "ai-prompt",
    aiPrompt:
      "Epoxy resin for advanced composites with high tensile strength, excellent adhesion to carbon fiber, low shrinkage, thermal stability above 150°C, and good chemical resistance",
  },
];

export const getTemplatesByCategory = (category) => {
  if (!category) return discoveryTemplates;
  return discoveryTemplates.filter((t) => t.category === category);
};

export const getTemplateById = (id) => {
  return discoveryTemplates.find((t) => t.id === id);
};

export const getCategories = () => {
  return [...new Set(discoveryTemplates.map((t) => t.category))];
};

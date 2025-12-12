import { useState } from "react";
import { Calculator, Loader, CheckCircle, XCircle, Info } from "lucide-react";

const PropertyCalculatorEnhanced = ({ compound }) => {
  const [calculating, setCalculating] = useState(false);
  const [properties, setProperties] = useState(null);

  const calculateProperties = async () => {
    setCalculating(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const enhanced = {
      molecularWeight:
        compound.molecular_weight || calculateMW(compound.formula),
      logP: compound.logp || calculateLogP(compound.smiles),
      hBondDonors: compound.properties?.h_bond_donors || 0,
      hBondAcceptors: compound.properties?.h_bond_acceptors || 0,
      tpsa: compound.properties?.tpsa || 0,

      boilingPoint: estimateBoilingPoint(compound),
      meltingPoint: estimateMeltingPoint(compound),
      solubility: estimateSolubility(compound),
      density: estimateDensity(compound),

      lipinskiRuleOfFive: checkLipinskiRule(compound),
      bioavailability: estimateBioavailability(compound),

      toxicityScore: estimateToxicity(compound),
      mutagenicRisk: assessMutagenicRisk(compound),

      thermalStability: estimateThermalStability(compound),
      shelfLife: estimateShelfLife(compound),

      polarSurfaceArea: calculatePSA(compound),
      rotableBonds: countRotatableBonds(compound),
      aromaticRings: countAromaticRings(compound),

      complexity: calculateComplexity(compound),
      flexibility: calculateFlexibility(compound),
    };

    setProperties(enhanced);
    setCalculating(false);
  };

  const calculateMW = (formula) => {
    if (!formula) return 0;
    const atomicWeights = {
      C: 12.011,
      H: 1.008,
      O: 15.999,
      N: 14.007,
      S: 32.06,
    };
    let mw = 0;
    const regex = /([A-Z][a-z]?)(\d*)/g;
    let match;
    while ((match = regex.exec(formula)) !== null) {
      const element = match[1];
      const count = parseInt(match[2] || 1);
      mw += (atomicWeights[element] || 0) * count;
    }
    return mw.toFixed(2);
  };

  const calculateLogP = (smiles) => {
    if (!smiles) return 0;
    const carbons = (smiles.match(/C/g) || []).length;
    const oxygens = (smiles.match(/O/g) || []).length;
    const nitrogens = (smiles.match(/N/g) || []).length;
    return (carbons * 0.5 - oxygens * 1.0 - nitrogens * 0.8).toFixed(2);
  };

  const estimateBoilingPoint = (compound) => {
    const mw = parseFloat(compound.molecular_weight || 0);
    const logP = parseFloat(compound.logp || 0);

    const bp = 100 + mw * 0.5 + logP * 10;
    return {
      value: bp.toFixed(1),
      unit: "°C",
      confidence: "Medium",
    };
  };

  const estimateMeltingPoint = (compound) => {
    const mw = parseFloat(compound.molecular_weight || 0);
    const symmetry = estimateSymmetry(compound);
    const mp = 50 + mw * 0.3 + symmetry * 20;
    return {
      value: mp.toFixed(1),
      unit: "°C",
      confidence: "Low",
    };
  };

  const estimateSolubility = (compound) => {
    const logP = parseFloat(compound.logp || 0);
    const tpsa = parseFloat(compound.properties?.tpsa || 50);

    const logS = -logP + tpsa / 100;

    let category;
    if (logS > -1) category = "Highly soluble";
    else if (logS > -3) category = "Moderately soluble";
    else if (logS > -5) category = "Poorly soluble";
    else category = "Practically insoluble";

    return {
      logS: logS.toFixed(2),
      category,
      unit: "mol/L",
    };
  };

  const estimateDensity = (compound) => {
    const mw = parseFloat(compound.molecular_weight || 0);

    const density = 0.9 + mw / 1000;
    return {
      value: density.toFixed(3),
      unit: "g/cm³",
    };
  };

  const checkLipinskiRule = (compound) => {
    const mw = parseFloat(compound.molecular_weight || 0);
    const logP = parseFloat(compound.logp || 0);
    const hbd = parseInt(compound.properties?.h_bond_donors || 0);
    const hba = parseInt(compound.properties?.h_bond_acceptors || 0);

    const violations = [];
    if (mw > 500) violations.push("MW > 500");
    if (logP > 5) violations.push("LogP > 5");
    if (hbd > 5) violations.push("H-donors > 5");
    if (hba > 10) violations.push("H-acceptors > 10");

    return {
      passed: violations.length === 0,
      violations,
      drugLike: violations.length <= 1,
    };
  };

  const estimateBioavailability = (compound) => {
    const lipinski = checkLipinskiRule(compound);
    const tpsa = parseFloat(compound.properties?.tpsa || 0);

    let score = 0.5;
    if (lipinski.passed) score += 0.3;
    if (tpsa < 140) score += 0.2;

    return {
      score: (score * 100).toFixed(0),
      category: score > 0.7 ? "Good" : score > 0.4 ? "Moderate" : "Poor",
    };
  };

  const estimateToxicity = (compound) => {
    const logP = parseFloat(compound.logp || 0);
    const mw = parseFloat(compound.molecular_weight || 0);

    let risk = 0;
    if (logP > 5) risk += 30;
    if (mw > 600) risk += 20;
    if (mw < 100) risk += 10;

    risk = Math.min(risk, 100);

    return {
      score: risk,
      level: risk < 30 ? "Low" : risk < 60 ? "Moderate" : "High",
      warning: risk > 60 ? "Requires experimental validation" : null,
    };
  };

  const assessMutagenicRisk = (compound) => {
    const smiles = compound.smiles || "";
    const alerts = [];

    if (smiles.includes("N=N")) alerts.push("Azo group");
    if (smiles.includes("N(=O)=O")) alerts.push("Nitro group");
    if (smiles.includes("C(=O)Cl")) alerts.push("Acyl chloride");

    return {
      risk: alerts.length > 0 ? "Potential concern" : "Low risk",
      alerts,
    };
  };

  const estimateThermalStability = (compound) => {
    const mw = parseFloat(compound.molecular_weight || 0);
    const aromaticity = countAromaticRings(compound);

    const stability = 50 + mw / 10 + aromaticity.count * 15;

    return {
      score: Math.min(stability, 100).toFixed(0),
      category: stability > 75 ? "Excellent" : stability > 50 ? "Good" : "Fair",
      decompositionTemp: (200 + stability).toFixed(0) + "°C (estimated)",
    };
  };

  const estimateShelfLife = (compound) => {
    const stability = estimateThermalStability(compound);
    const months = Math.floor(stability.score / 5);

    return {
      estimated: `${months} months`,
      conditions: "Room temperature, dark, dry",
      notes: "Requires experimental validation",
    };
  };

  const calculatePSA = (compound) => {
    return compound.properties?.tpsa || 0;
  };

  const countRotatableBonds = (compound) => {
    const smiles = compound.smiles || "";

    const count = (smiles.match(/-/g) || []).length;
    return {
      count,
      flexibility: count > 10 ? "High" : count > 5 ? "Medium" : "Low",
    };
  };

  const countAromaticRings = (compound) => {
    const smiles = compound.smiles || "";
    const count = (smiles.match(/c/g) || []).length / 6;
    return { count: Math.floor(count), note: "Benzene-like rings" };
  };

  const calculateComplexity = (compound) => {
    const mw = parseFloat(compound.molecular_weight || 0);
    const atoms = compound.formula?.replace(/[^A-Z]/g, "").length || 0;
    const complexity = mw / 10 + atoms * 5;
    return {
      score: Math.min(complexity, 100).toFixed(0),
      level: complexity > 70 ? "High" : complexity > 40 ? "Medium" : "Low",
    };
  };

  const calculateFlexibility = (compound) => {
    const rotatable = countRotatableBonds(compound);
    return rotatable.flexibility;
  };

  const estimateSymmetry = (compound) => {
    const formula = compound.formula || "";

    const uniqueElements = new Set(formula.match(/[A-Z][a-z]?/g) || []);
    return uniqueElements.size < 3 ? 1 : 0;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Enhanced Property Calculator
          </h3>
        </div>

        <button
          onClick={calculateProperties}
          disabled={calculating}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {calculating ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4" />
              Calculate All
            </>
          )}
        </button>
      </div>

      {properties && (
        <div className="space-y-6">
          {/* Basic Properties */}
          <Section title="Basic Properties" icon="🧪">
            <PropertyRow
              label="Molecular Weight"
              value={properties.molecularWeight}
              unit="g/mol"
            />
            <PropertyRow label="LogP (Lipophilicity)" value={properties.logP} />
            <PropertyRow label="H-Bond Donors" value={properties.hBondDonors} />
            <PropertyRow
              label="H-Bond Acceptors"
              value={properties.hBondAcceptors}
            />
            <PropertyRow label="TPSA" value={properties.tpsa} unit="Ų" />
          </Section>

          {/* Physical Properties */}
          <Section title="Physical Properties" icon="🌡️">
            <PropertyRow
              label="Boiling Point"
              value={properties.boilingPoint.value}
              unit={properties.boilingPoint.unit}
              badge={properties.boilingPoint.confidence}
            />
            <PropertyRow
              label="Melting Point"
              value={properties.meltingPoint.value}
              unit={properties.meltingPoint.unit}
              badge={properties.meltingPoint.confidence}
            />
            <PropertyRow
              label="Density"
              value={properties.density.value}
              unit={properties.density.unit}
            />
            <PropertyRow
              label="Water Solubility"
              value={properties.solubility.logS}
              badge={properties.solubility.category}
            />
          </Section>

          {/* Drug-likeness */}
          <Section title="Drug-Likeness" icon="💊">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Lipinski's Rule of Five
              </span>
              <div className="flex items-center gap-2">
                {properties.lipinskiRuleOfFive.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-semibold">
                  {properties.lipinskiRuleOfFive.violations.length} violations
                </span>
              </div>
            </div>
            {properties.lipinskiRuleOfFive.violations.length > 0 && (
              <div className="text-xs text-red-600 dark:text-red-400 ml-3">
                • {properties.lipinskiRuleOfFive.violations.join(", ")}
              </div>
            )}
            <PropertyRow
              label="Oral Bioavailability"
              value={properties.bioavailability.score}
              unit="%"
              badge={properties.bioavailability.category}
            />
          </Section>

          {/* Safety & Toxicity */}
          <Section title="Safety & Toxicity" icon="⚠️">
            <PropertyRow
              label="Toxicity Risk"
              value={properties.toxicityScore.score}
              badge={properties.toxicityScore.level}
              warning={properties.toxicityScore.warning}
            />
            <PropertyRow
              label="Mutagenic Risk"
              value={properties.mutagenicRisk.risk}
              badge={
                properties.mutagenicRisk.alerts.length > 0
                  ? "Review needed"
                  : "Clear"
              }
            />
            {properties.mutagenicRisk.alerts.length > 0 && (
              <div className="text-xs text-orange-600 dark:text-orange-400 ml-3">
                Structural alerts: {properties.mutagenicRisk.alerts.join(", ")}
              </div>
            )}
          </Section>

          {/* Stability */}
          <Section title="Stability" icon="🛡️">
            <PropertyRow
              label="Thermal Stability"
              value={properties.thermalStability.score}
              unit="/100"
              badge={properties.thermalStability.category}
            />
            <PropertyRow
              label="Estimated Shelf Life"
              value={properties.shelfLife.estimated}
              badge="Estimated"
            />
          </Section>

          {/* Molecular Descriptors */}
          <Section title="Molecular Descriptors" icon="🔬">
            <PropertyRow
              label="Polar Surface Area"
              value={properties.polarSurfaceArea}
              unit="Ų"
            />
            <PropertyRow
              label="Rotatable Bonds"
              value={properties.rotableBonds.count}
              badge={properties.rotableBonds.flexibility}
            />
            <PropertyRow
              label="Aromatic Rings"
              value={properties.aromaticRings.count}
            />
            <PropertyRow
              label="Molecular Complexity"
              value={properties.complexity.score}
              badge={properties.complexity.level}
            />
          </Section>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> These are computational estimates.
              Experimental validation is required for accurate values. Toxicity
              and safety predictions are preliminary screening tools only.
            </p>
          </div>
        </div>
      )}

      {!properties && !calculating && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Click "Calculate All" to compute enhanced properties</p>
        </div>
      )}
    </div>
  );
};

// Helper Components
const Section = ({ title, icon, children }) => (
  <div>
    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
      <span>{icon}</span>
      {title}
    </h4>
    <div className="space-y-2">{children}</div>
  </div>
);

const PropertyRow = ({ label, value, unit, badge, warning }) => (
  <div>
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <span className="font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-900 dark:text-white">
          {value}{" "}
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </span>
        {badge && (
          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
            {badge}
          </span>
        )}
      </div>
    </div>
    {warning && (
      <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 ml-3">
        ⚠️ {warning}
      </div>
    )}
  </div>
);

export default PropertyCalculatorEnhanced;

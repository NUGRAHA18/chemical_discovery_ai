export const parseFingerprint = (smiles) => {
  if (!smiles) return new Set();

  const fingerprint = new Set();

  // Extract atom types
  const atoms = smiles.match(/[A-Z][a-z]?/g) || [];
  atoms.forEach((atom) => fingerprint.add(`atom_${atom}`));

  // Count bonds (simplified)
  const singleBonds = (smiles.match(/-/g) || []).length;
  const doubleBonds = (smiles.match(/=/g) || []).length;
  const tripleBonds = (smiles.match(/#/g) || []).length;

  fingerprint.add(`single_bonds_${Math.floor(singleBonds / 2)}`);
  fingerprint.add(`double_bonds_${Math.floor(doubleBonds / 2)}`);
  fingerprint.add(`triple_bonds_${tripleBonds}`);

  // Aromatic rings (simplified)
  const aromaticAtoms = (smiles.match(/[a-z]/g) || []).length;
  if (aromaticAtoms > 0) {
    fingerprint.add(`aromatic_rings_${Math.floor(aromaticAtoms / 6)}`);
  }

  // Functional groups (basic detection)
  if (smiles.includes("OH") || smiles.includes("O"))
    fingerprint.add("hydroxyl");
  if (smiles.includes("C(=O)") || smiles.includes("O="))
    fingerprint.add("carbonyl");
  if (smiles.includes("N")) fingerprint.add("amine");
  if (smiles.includes("S")) fingerprint.add("sulfur");
  if (smiles.includes("Cl")) fingerprint.add("chlorine");
  if (smiles.includes("F")) fingerprint.add("fluorine");
  if (smiles.includes("Br")) fingerprint.add("bromine");

  return fingerprint;
};

export const calculateTanimotoSimilarity = (smiles1, smiles2) => {
  if (!smiles1 || !smiles2) return 0;

  const fp1 = parseFingerprint(smiles1);
  const fp2 = parseFingerprint(smiles2);

  // Calculate intersection (common features)
  const intersection = new Set([...fp1].filter((x) => fp2.has(x)));

  // Calculate union (all unique features)
  const union = new Set([...fp1, ...fp2]);

  // Tanimoto coefficient
  if (union.size === 0) return 0;
  return intersection.size / union.size;
};

export const calculateDiceSimilarity = (smiles1, smiles2) => {
  if (!smiles1 || !smiles2) return 0;

  const fp1 = parseFingerprint(smiles1);
  const fp2 = parseFingerprint(smiles2);

  const intersection = new Set([...fp1].filter((x) => fp2.has(x)));

  if (fp1.size + fp2.size === 0) return 0;
  return (2 * intersection.size) / (fp1.size + fp2.size);
};

export const calculateCosineSimilarity = (smiles1, smiles2) => {
  if (!smiles1 || !smiles2) return 0;

  const fp1 = parseFingerprint(smiles1);
  const fp2 = parseFingerprint(smiles2);

  const intersection = new Set([...fp1].filter((x) => fp2.has(x)));

  const magnitude1 = Math.sqrt(fp1.size);
  const magnitude2 = Math.sqrt(fp2.size);

  if (magnitude1 * magnitude2 === 0) return 0;
  return intersection.size / (magnitude1 * magnitude2);
};

export const findSimilarCompounds = (reference, compounds, options = {}) => {
  const { method = "tanimoto", threshold = 0.5, limit = 10 } = options;

  const calculateSimilarity =
    {
      tanimoto: calculateTanimotoSimilarity,
      dice: calculateDiceSimilarity,
      cosine: calculateCosineSimilarity,
    }[method] || calculateTanimotoSimilarity;

  return compounds
    .filter((c) => c._id !== reference._id)
    .map((compound) => ({
      ...compound,
      similarity: calculateSimilarity(
        reference.smiles || reference.formula,
        compound.smiles || compound.formula
      ),
    }))
    .filter((c) => c.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
};

export const calculateDiversity = (compounds) => {
  if (compounds.length < 2) return 0;

  let totalDissimilarity = 0;
  let count = 0;

  for (let i = 0; i < compounds.length; i++) {
    for (let j = i + 1; j < compounds.length; j++) {
      const similarity = calculateTanimotoSimilarity(
        compounds[i].smiles || compounds[i].formula,
        compounds[j].smiles || compounds[j].formula
      );
      totalDissimilarity += 1 - similarity;
      count++;
    }
  }

  return count > 0 ? totalDissimilarity / count : 0;
};

export const clusterBySimilarity = (compounds, threshold = 0.7) => {
  const clusters = [];
  const assigned = new Set();

  compounds.forEach((compound) => {
    if (assigned.has(compound._id)) return;

    const cluster = [compound];
    assigned.add(compound._id);

    compounds.forEach((other) => {
      if (assigned.has(other._id)) return;

      const similarity = calculateTanimotoSimilarity(
        compound.smiles || compound.formula,
        other.smiles || other.formula
      );

      if (similarity >= threshold) {
        cluster.push(other);
        assigned.add(other._id);
      }
    });

    clusters.push(cluster);
  });

  return clusters.sort((a, b) => b.length - a.length);
};

export const calculateScaffoldSimilarity = (smiles1, smiles2) => {
  if (!smiles1 || !smiles2) return 0;

  // Extract atom types only (ignore bonds and charges)
  const scaffold1 = (smiles1.match(/[A-Z][a-z]?/g) || []).sort().join("");
  const scaffold2 = (smiles2.match(/[A-Z][a-z]?/g) || []).sort().join("");

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(scaffold1, scaffold2);
  const maxLength = Math.max(scaffold1.length, scaffold2.length);

  if (maxLength === 0) return 0;
  return 1 - distance / maxLength;
};

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export const calculatePropertySimilarity = (compound1, compound2) => {
  const properties = [
    { key: "molecular_weight", weight: 0.3, normalize: (val) => val / 500 },
    { key: "logp", weight: 0.3, normalize: (val) => (val + 5) / 10 },
    { key: "tpsa", weight: 0.2, normalize: (val) => val / 200 },
    { key: "h_bond_donors", weight: 0.1, normalize: (val) => val / 10 },
    { key: "h_bond_acceptors", weight: 0.1, normalize: (val) => val / 20 },
  ];

  let totalSimilarity = 0;
  let totalWeight = 0;

  properties.forEach(({ key, weight, normalize }) => {
    const val1 = parseFloat(compound1[key] || compound1.properties?.[key] || 0);
    const val2 = parseFloat(compound2[key] || compound2.properties?.[key] || 0);

    const norm1 = Math.min(1, Math.max(0, normalize(val1)));
    const norm2 = Math.min(1, Math.max(0, normalize(val2)));

    const diff = Math.abs(norm1 - norm2);
    const similarity = 1 - diff;

    totalSimilarity += similarity * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? totalSimilarity / totalWeight : 0;
};

export const calculateCombinedSimilarity = (
  compound1,
  compound2,
  weights = {}
) => {
  const { structureWeight = 0.7, propertyWeight = 0.3 } = weights;

  const structureSim = calculateTanimotoSimilarity(
    compound1.smiles || compound1.formula,
    compound2.smiles || compound2.formula
  );

  const propertySim = calculatePropertySimilarity(compound1, compound2);

  return structureSim * structureWeight + propertySim * propertyWeight;
};

// Export all functions
export default {
  parseFingerprint,
  calculateTanimotoSimilarity,
  calculateDiceSimilarity,
  calculateCosineSimilarity,
  findSimilarCompounds,
  calculateDiversity,
  clusterBySimilarity,
  calculateScaffoldSimilarity,
  calculatePropertySimilarity,
  calculateCombinedSimilarity,
};

// backend/src/services/batchService.js
const XLSX = require("xlsx");

/**
 * Validate and parse CSV data - Support both structured and AI prompt templates
 */
async function validateCSVData(buffer) {
  try {
    let csvString = buffer.toString("utf-8").replace(/^\uFEFF/, "");
    const lines = csvString.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error("CSV file is empty or has no data rows");
    }

    const headerLine = lines[0].replace(/['"]/g, "");
    const headers = headerLine
      .toLowerCase()
      .split(",")
      .map((h) => h.trim());

    console.log("CSV Headers:", headers);

    // ✅ CHECK TEMPLATE TYPE
    const hasStructured = headers.includes("category");
    const hasCriteria = headers.includes("criteria");

    if (!hasStructured && !hasCriteria) {
      throw new Error(
        'CSV must have either "criteria" column (AI template) or "category" column (structured template)'
      );
    }

    const items = [];

    // ✅ PARSE STRUCTURED TEMPLATE
    if (hasStructured) {
      const indices = {
        category: headers.indexOf("category"),
        boiling_point_min: headers.indexOf("boiling_point_min"),
        boiling_point_max: headers.indexOf("boiling_point_max"),
        viscosity_min: headers.indexOf("viscosity_min"),
        viscosity_max: headers.indexOf("viscosity_max"),
        solubility: headers.indexOf("solubility"),
        thermal_stability_min: headers.indexOf("thermal_stability_min"),
        additional_properties: headers.indexOf("additional_properties"),
        notes: headers.indexOf("notes"),
      };

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line
          .split(",")
          .map((v) => v.trim().replace(/^["']|["']$/g, ""));

        const category = values[indices.category];
        if (!category) continue;

        // Build structured data
        const structuredData = {
          category,
          boiling_point_min:
            parseFloat(values[indices.boiling_point_min]) || null,
          boiling_point_max:
            parseFloat(values[indices.boiling_point_max]) || null,
          viscosity_min: parseFloat(values[indices.viscosity_min]) || null,
          viscosity_max: parseFloat(values[indices.viscosity_max]) || null,
          solubility: values[indices.solubility] || null,
          thermal_stability_min:
            parseFloat(values[indices.thermal_stability_min]) || null,
          additional_properties: values[indices.additional_properties] || null,
        };

        // Generate criteria from structured data
        const criteria = generateCriteriaFromStructured(structuredData);

        items.push({
          criteria,
          structuredData,
        });
      }
    }
    // ✅ PARSE AI PROMPT TEMPLATE
    else if (hasCriteria) {
      const criteriaIndex = headers.indexOf("criteria");

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line
          .split(",")
          .map((v) => v.trim().replace(/^["']|["']$/g, ""));
        const criteria = values[criteriaIndex];

        if (criteria && criteria.length > 0) {
          items.push({
            criteria: criteria.trim(),
            structuredData: null,
          });
        }
      }
    }

    console.log(`Parsed ${items.length} items from CSV`);

    if (items.length === 0) {
      throw new Error("No valid data rows found in CSV file");
    }

    return items;
  } catch (error) {
    console.error("CSV parsing error:", error);
    throw error;
  }
}

/**
 * Validate and parse Excel data - Support both templates
 */
async function validateExcelData(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log("Excel rows:", data.length);

    if (data.length === 0) {
      throw new Error("Excel file is empty");
    }

    const items = [];
    const firstRow = data[0];
    const hasStructured = "category" in firstRow || "Category" in firstRow;
    const hasCriteria = "criteria" in firstRow || "Criteria" in firstRow;

    if (!hasStructured && !hasCriteria) {
      throw new Error('Excel must have either "criteria" or "category" column');
    }

    for (const row of data) {
      // ✅ STRUCTURED TEMPLATE
      if (hasStructured) {
        const category = row.category || row.Category;
        if (!category) continue;

        const structuredData = {
          category: String(category),
          boiling_point_min: parseFloat(row.boiling_point_min) || null,
          boiling_point_max: parseFloat(row.boiling_point_max) || null,
          viscosity_min: parseFloat(row.viscosity_min) || null,
          viscosity_max: parseFloat(row.viscosity_max) || null,
          solubility: row.solubility || null,
          thermal_stability_min: parseFloat(row.thermal_stability_min) || null,
          additional_properties: row.additional_properties || null,
        };

        const criteria = generateCriteriaFromStructured(structuredData);

        items.push({
          criteria,
          structuredData,
        });
      }
      // ✅ AI PROMPT TEMPLATE
      else if (hasCriteria) {
        const criteria = row.criteria || row.Criteria;
        if (criteria) {
          items.push({
            criteria: String(criteria).trim(),
            structuredData: null,
          });
        }
      }
    }

    if (items.length === 0) {
      throw new Error("No valid data found in Excel file");
    }

    console.log(`Parsed ${items.length} items from Excel`);

    return items;
  } catch (error) {
    console.error("Excel parsing error:", error);
    throw error;
  }
}

/**
 * Generate criteria text from structured data
 */
function generateCriteriaFromStructured(data) {
  const parts = [];

  parts.push(`${data.category} compound`);

  if (data.boiling_point_min && data.boiling_point_max) {
    parts.push(
      `boiling point ${data.boiling_point_min}-${data.boiling_point_max}°C`
    );
  }

  if (data.viscosity_min && data.viscosity_max) {
    parts.push(`viscosity ${data.viscosity_min}-${data.viscosity_max} cP`);
  }

  if (data.solubility) {
    parts.push(`${data.solubility}-soluble`);
  }

  if (data.thermal_stability_min) {
    parts.push(`thermal stability above ${data.thermal_stability_min}°C`);
  }

  if (data.additional_properties) {
    parts.push(data.additional_properties);
  }

  return parts.join(", ");
}

/**
 * Parse structured row
 */
function parseStructuredRow(row) {
  return {
    criteria: row.criteria,
    structuredData: null,
  };
}

module.exports = {
  validateCSVData,
  validateExcelData,
  parseStructuredRow,
  generateCriteriaFromStructured,
};

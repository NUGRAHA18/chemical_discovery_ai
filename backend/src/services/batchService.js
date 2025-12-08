const csv = require("csv-parser");
const XLSX = require("xlsx");
const fs = require("fs");
const { Readable } = require("stream");

/**
 * Parse CSV file buffer to array of objects
 */
async function parseCSV(fileBuffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(fileBuffer.toString());

    stream
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

/**
 * Parse Excel file buffer to array of objects
 */
function parseExcel(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0]; // First sheet
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  return data;
}

/**
 * Build criteria string from structured row data
 */
function buildCriteriaFromRow(row) {
  const parts = [];

  // Category
  if (row.category) {
    parts.push(`${row.category} compound`);
  }

  // Boiling point
  if (row.boiling_point_min || row.boiling_point_max) {
    if (row.boiling_point_min && row.boiling_point_max) {
      parts.push(
        `boiling point between ${row.boiling_point_min}°C and ${row.boiling_point_max}°C`
      );
    } else if (row.boiling_point_min) {
      parts.push(`boiling point above ${row.boiling_point_min}°C`);
    } else {
      parts.push(`boiling point below ${row.boiling_point_max}°C`);
    }
  }

  // Viscosity
  if (row.viscosity_min || row.viscosity_max) {
    if (row.viscosity_min && row.viscosity_max) {
      parts.push(
        `viscosity between ${row.viscosity_min} and ${row.viscosity_max} cP`
      );
    } else if (row.viscosity_min) {
      parts.push(`viscosity above ${row.viscosity_min} cP`);
    } else {
      parts.push(`viscosity below ${row.viscosity_max} cP`);
    }
  }

  // Solubility
  if (row.solubility) {
    parts.push(row.solubility);
  }

  // Thermal stability
  if (row.thermal_stability_min) {
    parts.push(`thermal stability above ${row.thermal_stability_min}°C`);
  }

  // Additional properties
  if (row.additional_properties) {
    const props = row.additional_properties.split("|").map((p) => p.trim());
    parts.push(...props);
  }

  // Notes
  if (row.notes) {
    parts.push(row.notes);
  }

  return parts.join(", ");
}

/**
 * Extract structured data from row
 */
function extractStructuredData(row) {
  // Check if this is AI prompt mode (only has 'criteria' column)
  if (row.criteria && Object.keys(row).length === 1) {
    return null; // AI prompt mode, no structured data
  }

  // Structured mode
  return {
    category: row.category || "",
    boilingPointMin: row.boiling_point_min || "",
    boilingPointMax: row.boiling_point_max || "",
    viscosityMin: row.viscosity_min || "",
    viscosityMax: row.viscosity_max || "",
    solubility: row.solubility || "",
    thermalStabilityMin: row.thermal_stability_min || "",
    additionalProperties: row.additional_properties
      ? row.additional_properties.split("|").map((p) => p.trim())
      : [],
    notes: row.notes || "",
  };
}

/**
 * Validate batch file data
 */
function validateBatchData(rows) {
  const errors = [];

  if (rows.length === 0) {
    errors.push("File is empty");
    return { valid: false, errors };
  }

  if (rows.length > 100) {
    errors.push("Maximum 100 rows allowed");
    return { valid: false, errors };
  }

  // Check if all rows have criteria (either direct or buildable)
  rows.forEach((row, index) => {
    const hasCriteria = row.criteria;
    const hasStructuredFields =
      row.category || row.boiling_point_min || row.notes;

    if (!hasCriteria && !hasStructuredFields) {
      errors.push(`Row ${index + 1}: No criteria or structured fields found`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Process batch items into standardized format
 */
function processBatchItems(rows) {
  return rows.map((row, index) => {
    let criteria;
    let structuredData;

    // Check if AI prompt mode (has 'criteria' column)
    if (row.criteria && !row.category) {
      criteria = row.criteria.trim();
      structuredData = null;
    } else {
      // Structured mode - build criteria from columns
      criteria = buildCriteriaFromRow(row);
      structuredData = extractStructuredData(row);
    }

    return {
      rowNumber: index + 1,
      criteria,
      structuredData,
      status: "pending",
    };
  });
}

module.exports = {
  parseCSV,
  parseExcel,
  buildCriteriaFromRow,
  extractStructuredData,
  validateBatchData,
  processBatchItems,
};

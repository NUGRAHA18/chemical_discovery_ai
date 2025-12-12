import jsPDF from "jspdf";

export const exportDiscoveryToPDF = async (discovery) => {
  try {
    const doc = new jsPDF();
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPos = 20;

    // Helper function for adding text with wrapping
    const addText = (
      text,
      x,
      y,
      maxWidth,
      fontSize = 10,
      color = [0, 0, 0]
    ) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + lines.length * fontSize * 0.5 + 2;
    };

    // Helper function for drawing table
    const drawTable = (headers, rows, startY) => {
      const colWidth = contentWidth / headers.length;
      let y = startY;

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, y, contentWidth, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      headers.forEach((header, i) => {
        doc.text(header, margin + i * colWidth + 2, y + 5);
      });
      y += 8;

      // Rows
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      rows.forEach((row, rowIndex) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, y, contentWidth, 7, "F");
        }

        row.forEach((cell, i) => {
          const text = String(cell);
          const lines = doc.splitTextToSize(text, colWidth - 4);
          doc.text(lines[0], margin + i * colWidth + 2, y + 5);
        });
        y += 7;
      });

      return y + 5;
    };

    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235);
    doc.text("Chemical Discovery Report", pageWidth / 2, yPos, {
      align: "center",
    });

    yPos += 15;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated: ${new Date(discovery.createdAt).toLocaleDateString()}`,
      pageWidth / 2,
      yPos,
      { align: "center" }
    );

    yPos += 10;
    doc.setFontSize(10);
    doc.text(`ID: ${discovery._id}`, pageWidth / 2, yPos, { align: "center" });

    yPos += 20;
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // Criteria
    yPos += 15;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Search Criteria", margin, yPos);
    yPos += 10;
    yPos = addText(
      discovery.criteria,
      margin,
      yPos,
      contentWidth,
      10,
      [60, 60, 60]
    );

    // Input Mode Badge
    yPos += 5;
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(margin, yPos, 35, 7, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(
      discovery.inputMode === "structured" ? "Structured" : "AI Prompt",
      margin + 2,
      yPos + 5
    );
    yPos += 15;

    doc.addPage();
    yPos = 20;

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Analysis", margin, yPos);
    yPos += 10;
    yPos = addText(
      discovery.analysis || "No analysis available",
      margin,
      yPos,
      contentWidth,
      10,
      [60, 60, 60]
    );
    yPos += 10;

    // Justification
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Justification", margin, yPos);
    yPos += 10;
    yPos = addText(
      discovery.justification || "No justification available",
      margin,
      yPos,
      contentWidth,
      10,
      [60, 60, 60]
    );

    doc.addPage();
    yPos = 20;

    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text(
      `Generated Compounds (${discovery.compounds?.length || 0})`,
      margin,
      yPos
    );
    yPos += 15;

    for (let i = 0; i < discovery.compounds?.length; i++) {
      const compound = discovery.compounds[i];

      // Check page space
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      // Compound header
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPos - 5, contentWidth, 10, "F");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`${i + 1}. ${compound.name}`, margin + 2, yPos + 2);
      yPos += 12;

      // Basic info table
      const basicHeaders = ["Property", "Value"];
      const basicRows = [
        ["Formula", compound.formula],
        [
          "Molecular Weight",
          compound.molecular_weight
            ? `${compound.molecular_weight} g/mol`
            : "N/A",
        ],
        [
          "LogP",
          compound.logp !== null && compound.logp !== undefined
            ? compound.logp.toFixed(2)
            : "N/A",
        ],
        [
          "Validation Score",
          `${((compound.validation_score || 0) * 100).toFixed(0)}%`,
        ],
      ];
      yPos = drawTable(basicHeaders, basicRows, yPos);

      yPos += 3;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("SMILES:", margin, yPos);
      yPos += 5;
      doc.setFontSize(8);
      doc.setFont(undefined, "italic");
      yPos = addText(
        compound.smiles,
        margin,
        yPos,
        contentWidth,
        8,
        [60, 60, 60]
      );
      doc.setFont(undefined, "normal");
      yPos += 5;

      // Properties
      if (compound.properties && Object.keys(compound.properties).length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("Properties:", margin, yPos);
        yPos += 5;

        const propsHeaders = ["Property", "Value"];
        const propsRows = Object.entries(compound.properties).map(
          ([key, value]) => [
            key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            String(value),
          ]
        );
        yPos = drawTable(propsHeaders, propsRows, yPos);
      }

      if (compound.base_compound) {
        yPos += 3;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(`Base: ${compound.base_compound}`, margin, yPos);
        yPos += 5;
      }

      if (compound.modifications) {
        yPos = addText(
          `Modifications: ${compound.modifications}`,
          margin,
          yPos,
          contentWidth,
          8,
          [100, 100, 100]
        );
        yPos += 5;
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
    }

    doc.addPage();
    yPos = 20;

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Discovery Metadata", margin, yPos);
    yPos += 15;

    const metaRows = [
      ["Total Compounds", String(discovery.compounds?.length || 0)],
      [
        "Overall Confidence",
        `${((discovery.metadata?.overall_confidence || 0) * 100).toFixed(0)}%`,
      ],
      [
        "Preprocessing Confidence",
        `${((discovery.metadata?.preprocessing_confidence || 0) * 100).toFixed(
          0
        )}%`,
      ],
      ["RDKit Used", discovery.metadata?.rdkit_used ? "Yes" : "No"],
      ["PubChem Used", discovery.metadata?.pubchem_used ? "Yes" : "No"],
      ["Agent Version", discovery.metadata?.agent_version || "N/A"],
    ];

    doc.setFontSize(10);
    metaRows.forEach(([key, value]) => {
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(key + ":", margin, yPos);
      doc.setFont(undefined, "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(String(value), margin + 80, yPos);
      yPos += 7;
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `ChemDiscovery AI - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        290,
        { align: "center" }
      );
    }

    const filename = `discovery-${discovery._id}-${Date.now()}.pdf`;
    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error("PDF generation error:", error);
    return { success: false, error: error.message };
  }
};

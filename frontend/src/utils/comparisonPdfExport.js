import jsPDF from "jspdf";
import "jspdf-autotable";

export const exportComparisonToPDF = async (compounds) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    // Title
    doc.setFontSize(24);
    doc.setTextColor(41, 128, 185);
    doc.text("Compound Comparison Report", pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 10;
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );

    currentY += 5;
    doc.text(
      `${compounds.length} compounds compared`,
      pageWidth / 2,
      currentY,
      {
        align: "center",
      }
    );

    currentY += 15;

    // Properties comparison table
    const properties = [
      { key: "name", label: "Name" },
      { key: "formula", label: "Formula" },
      { key: "molecular_weight", label: "MW (g/mol)" },
      { key: "logp", label: "LogP" },
      { key: "h_bond_donors", label: "H-Donors" },
      { key: "h_bond_acceptors", label: "H-Acceptors" },
      { key: "tpsa", label: "TPSA (Ų)" },
      { key: "validation_score", label: "Validation" },
    ];

    const tableData = properties.map((prop) => {
      const row = [prop.label];
      compounds.forEach((compound) => {
        let value;

        if (compound[prop.key] !== undefined && compound[prop.key] !== null) {
          value = compound[prop.key];
        } else if (
          compound.properties &&
          compound.properties[prop.key] !== undefined
        ) {
          value = compound.properties[prop.key];
        } else {
          value = "N/A";
        }

        if (typeof value === "number") {
          value =
            prop.key === "validation_score"
              ? `${(value * 100).toFixed(0)}%`
              : value.toFixed(2);
        }

        row.push(value);
      });
      return row;
    });

    const tableHeaders = [
      ["Property", ...compounds.map((c, i) => `Compound ${i + 1}`)],
    ];

    doc.autoTable({
      startY: currentY,
      head: tableHeaders,
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        fontSize: 10,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [236, 240, 241], halign: "left" },
        ...Object.fromEntries(
          compounds.map((_, i) => [i + 1, { halign: "center" }])
        ),
      },
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // SMILES section
    if (currentY + 40 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("SMILES Notation", 20, currentY);
    currentY += 10;

    compounds.forEach((compound, idx) => {
      if (currentY + 15 > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(`Compound ${idx + 1}: ${compound.name}`, 20, currentY);
      currentY += 6;

      doc.setFont(undefined, "normal");
      doc.setFontSize(8);
      const smiles = compound.smiles || "N/A";
      const splitSmiles = doc.splitTextToSize(smiles, pageWidth - 40);
      doc.text(splitSmiles, 25, currentY);
      currentY += splitSmiles.length * 4 + 5;
    });

    // Base compounds section
    currentY += 10;
    if (currentY + 40 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Base Compound References", 20, currentY);
    currentY += 10;

    compounds.forEach((compound, idx) => {
      if (currentY + 10 > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(`Compound ${idx + 1}:`, 20, currentY);

      doc.setFont(undefined, "normal");
      const baseCompound = compound.base_compound || "No reference";
      doc.text(baseCompound, 50, currentY);
      currentY += 7;
    });

    // Footer on last page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(127, 140, 141);
      doc.text(
        `ChemDiscovery AI - Comparison Report`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, {
        align: "right",
      });
    }

    // Save PDF
    const filename = `comparison-${Date.now()}.pdf`;
    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error("PDF Export Error:", error);
    return { success: false, error: error.message };
  }
};

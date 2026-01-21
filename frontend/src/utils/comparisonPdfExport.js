import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // <--- PERUBAHAN 1: Import sebagai variable

export const exportComparisonToPDF = async (compounds) => {
  try {
    const doc = new jsPDF({ orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    // --- HEADER SECTION ---
    doc.setFontSize(24);
    doc.setTextColor(41, 128, 185);
    doc.text("Compound Comparison Report", pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 10;
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);

    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    doc.text(`Generated on ${dateStr}`, pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 5;
    doc.text(
      `${compounds.length} compounds compared`,
      pageWidth / 2,
      currentY,
      { align: "center" },
    );

    currentY += 15;

    // --- TABLE SECTION ---
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
        let rawValue =
          compound[prop.key] ?? compound.properties?.[prop.key] ?? "N/A";
        let displayValue = rawValue;

        if (typeof rawValue === "number") {
          displayValue =
            prop.key === "validation_score"
              ? `${(rawValue * 100).toFixed(0)}%`
              : rawValue.toFixed(2);
        }
        row.push(displayValue);
      });
      return row;
    });

    const tableHeaders = [
      ["Property", ...compounds.map((c, i) => `Compound ${i + 1}`)],
    ];

    // <--- PERUBAHAN 2: Panggil autoTable sebagai fungsi, masukkan 'doc' sebagai parameter pertama
    autoTable(doc, {
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
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          fillColor: [236, 240, 241],
          halign: "left",
          cellWidth: 35,
        },
        ...Object.fromEntries(
          compounds.map((_, i) => [i + 1, { halign: "center" }]),
        ),
      },
      margin: { left: 15, right: 15 },
    });

    // Update posisi Y setelah tabel selesai (ambil dari properti lastAutoTable milik doc)
    currentY = doc.lastAutoTable.finalY + 15;

    // --- SMILES SECTION ---
    const checkPageBreak = (neededHeight) => {
      if (currentY + neededHeight > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
        return true;
      }
      return false;
    };

    checkPageBreak(40);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("SMILES Notation", 15, currentY);
    currentY += 10;

    compounds.forEach((compound, idx) => {
      checkPageBreak(25);

      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(`Compound ${idx + 1}: ${compound.name}`, 15, currentY);
      currentY += 6;

      doc.setFont(undefined, "normal");
      doc.setFontSize(8);
      const smiles = compound.smiles || "N/A";
      const splitSmiles = doc.splitTextToSize(smiles, pageWidth - 30);
      doc.text(splitSmiles, 20, currentY);
      currentY += splitSmiles.length * 4 + 5;
    });

    // --- BASE REFERENCE SECTION ---
    currentY += 10;
    checkPageBreak(40);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Base Compound References", 15, currentY);
    currentY += 10;

    compounds.forEach((compound, idx) => {
      checkPageBreak(15);

      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(`Compound ${idx + 1}:`, 15, currentY);

      doc.setFont(undefined, "normal");
      const baseCompound = compound.base_compound || "No reference";
      doc.text(baseCompound, 45, currentY);
      currentY += 7;
    });

    // --- FOOTER SECTION ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(127, 140, 141);
      doc.text(
        `ChemDiscovery AI - Comparison Report`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" },
      );
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 10, {
        align: "right",
      });
    }

    const filename = `comparison_report_${Date.now()}.pdf`;
    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error("PDF Export Error:", error);
    return { success: false, error: error.message };
  }
};

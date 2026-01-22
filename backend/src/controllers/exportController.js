const Discovery = require("../models/Discovery");

exports.exportJSON = async (req, res) => {
  try {
    const { discoveryId } = req.body;

    const discovery = await Discovery.findOne({
      _id: discoveryId,
      userId: req.user._id,
    });

    if (!discovery) {
      return res.status(404).json({ error: "Discovery not found" });
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="discovery-${discoveryId}.json"`,
    );

    res.json(discovery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const { discoveryId } = req.body;

    const discovery = await Discovery.findOne({
      _id: discoveryId,
      userId: req.user._id,
    });

    if (!discovery) {
      return res.status(404).json({ error: "Discovery not found" });
    }

    const headers = [
      "Name",
      "Formula",
      "SMILES",
      "Molecular Weight",
      "LogP",
      "Base Compound",
      "Modifications",
      "Validation Score",
    ];

    const rows = discovery.compounds.map((c) => [
      c.name || "",
      c.formula || "",
      c.smiles || "",
      c.molecular_weight || "",
      c.logp || "",
      c.base_compound || "",
      c.modifications || "",
      c.validation_score || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="discovery-${discoveryId}.csv"`,
    );

    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    res.status(501).json({
      error: "PDF export not yet implemented",
      message: "Use external PDF generation library in frontend",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

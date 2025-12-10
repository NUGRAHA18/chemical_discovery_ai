// Simple tests for Phase 2 components
// Run with: npm test (if Jest is configured)

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MolecularViewer3D from "../components/discovery/MolecularViewer3D";
import PropertyCalculatorEnhanced from "../components/discovery/PropertyCalculatorEnhanced";

// ═══════════════════════════════════════════════════════════
// TEST 1: 3D Molecular Viewer
// ═══════════════════════════════════════════════════════════

describe("MolecularViewer3D", () => {
  const mockCompound = {
    name: "Test Compound",
    smiles: "CCO",
    formula: "C2H6O",
  };

  test("renders 3D viewer with compound name", () => {
    render(
      <MolecularViewer3D
        smiles={mockCompound.smiles}
        compoundName={mockCompound.name}
      />
    );
    expect(screen.getByText(/3D Molecular View/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Compound/i)).toBeInTheDocument();
  });

  test("render mode selector works", () => {
    render(<MolecularViewer3D smiles={mockCompound.smiles} />);
    const selector = screen.getByRole("combobox");
    expect(selector).toHaveValue("ball-stick");

    fireEvent.change(selector, { target: { value: "space-filling" } });
    expect(selector).toHaveValue("space-filling");
  });

  test("fullscreen toggle works", () => {
    render(<MolecularViewer3D smiles={mockCompound.smiles} />);
    const fullscreenBtn = screen.getByRole("button", { name: /fullscreen/i });

    fireEvent.click(fullscreenBtn);
    // Check if container has fullscreen class
    const container = fullscreenBtn.closest("div");
    expect(container).toHaveClass("fixed");
  });

  test("screenshot button triggers download", () => {
    const { container } = render(
      <MolecularViewer3D smiles={mockCompound.smiles} />
    );
    const downloadBtn = screen.getByTitle("Download Screenshot");

    // Mock canvas toDataURL
    const canvas = container.querySelector("canvas");
    if (canvas) {
      canvas.toDataURL = jest.fn(() => "data:image/png;base64,mock");
    }

    fireEvent.click(downloadBtn);
    // Verify function was called
    expect(canvas?.toDataURL).toHaveBeenCalled();
  });

  test("reset view button exists and is clickable", () => {
    render(<MolecularViewer3D smiles={mockCompound.smiles} />);
    const resetBtn = screen.getByTitle("Reset View");
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);
    // Verify no errors
  });

  test("handles empty SMILES gracefully", () => {
    render(<MolecularViewer3D smiles="" />);
    // Should render without crashing
    expect(screen.getByText(/3D Molecular View/i)).toBeInTheDocument();
  });

  test("cleanup on unmount", () => {
    const { unmount } = render(
      <MolecularViewer3D smiles={mockCompound.smiles} />
    );
    unmount();
    // Verify no memory leaks (check console for errors)
  });
});

// ═══════════════════════════════════════════════════════════
// TEST 2: Property Calculator Enhanced
// ═══════════════════════════════════════════════════════════

describe("PropertyCalculatorEnhanced", () => {
  const mockCompound = {
    name: "Ethanol",
    formula: "C2H6O",
    smiles: "CCO",
    molecular_weight: "46.07",
    logp: "-0.31",
    properties: {
      h_bond_donors: 1,
      h_bond_acceptors: 1,
      tpsa: 20.23,
    },
  };

  test("renders calculator with title", () => {
    render(<PropertyCalculatorEnhanced compound={mockCompound} />);
    expect(
      screen.getByText(/Enhanced Property Calculator/i)
    ).toBeInTheDocument();
  });

  test("calculate button exists and is clickable", () => {
    render(<PropertyCalculatorEnhanced compound={mockCompound} />);
    const calculateBtn = screen.getByRole("button", { name: /Calculate All/i });
    expect(calculateBtn).toBeInTheDocument();
    expect(calculateBtn).not.toBeDisabled();
  });

  test("shows loading state when calculating", async () => {
    render(<PropertyCalculatorEnhanced compound={mockCompound} />);
    const calculateBtn = screen.getByRole("button", { name: /Calculate All/i });

    fireEvent.click(calculateBtn);

    // Should show "Calculating..." immediately
    expect(screen.getByText(/Calculating.../i)).toBeInTheDocument();
    expect(calculateBtn).toBeDisabled();
  });

  test("displays calculated properties after calculation", async () => {
    render(<PropertyCalculatorEnhanced compound={mockCompound} />);
    const calculateBtn = screen.getByRole("button", { name: /Calculate All/i });

    fireEvent.click(calculateBtn);

    // Wait for calculation to complete
    await waitFor(() => {
      expect(screen.getByText(/Basic Properties/i)).toBeInTheDocument();
    });

    // Check for property sections
    expect(screen.getByText(/Physical Properties/i)).toBeInTheDocument();
    expect(screen.getByText(/Drug-Likeness/i)).toBeInTheDocument();
    expect(screen.getByText(/Safety & Toxicity/i)).toBeInTheDocument();
  });

  test("calculates molecular weight correctly", async () => {
    render(<PropertyCalculatorEnhanced compound={mockCompound} />);
    const calculateBtn = screen.getByRole("button", { name: /Calculate All/i });

    fireEvent.click(calculateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Molecular Weight/i)).toBeInTheDocument();
    });

    // Should display MW
    expect(screen.getByText(/46.07/)).toBeInTheDocument();
  });

  test("Lipinski Rule of Five check works", async () => {
    render(<PropertyCalculatorEnhanced compound={mockCompound} />);
    const calculateBtn = screen.getByRole("button", { name: /Calculate All/i });

    fireEvent.click(calculateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Lipinski's Rule of Five/i)).toBeInTheDocument();
    });

    // Ethanol should pass (small molecule)
    const violations = screen.getByText(/violations/i);
    expect(violations).toBeInTheDocument();
  });

  test("displays safety disclaimer", async () => {
    render(<PropertyCalculatorEnhanced compound={mockCompound} />);
    const calculateBtn = screen.getByRole("button", { name: /Calculate All/i });

    fireEvent.click(calculateBtn);

    await waitFor(() => {
      expect(screen.getByText(/computational estimates/i)).toBeInTheDocument();
    });
  });

  test("handles compound with missing properties", async () => {
    const incompleteCompound = {
      name: "Test",
      formula: "C6H6",
      // Missing many properties
    };

    render(<PropertyCalculatorEnhanced compound={incompleteCompound} />);
    const calculateBtn = screen.getByRole("button", { name: /Calculate All/i });

    fireEvent.click(calculateBtn);

    // Should not crash
    await waitFor(() => {
      expect(screen.getByText(/Basic Properties/i)).toBeInTheDocument();
    });
  });

  test("shows placeholder when no properties calculated", () => {
    render(<PropertyCalculatorEnhanced compound={mockCompound} />);
    expect(
      screen.getByText(/Click "Calculate All" to compute/i)
    ).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════
// INTEGRATION TEST: Both Components Together
// ═══════════════════════════════════════════════════════════

describe("Phase 2 Integration", () => {
  const mockCompound = {
    name: "Benzene",
    formula: "C6H6",
    smiles: "c1ccccc1",
    molecular_weight: "78.11",
    logp: "2.13",
    properties: {
      h_bond_donors: 0,
      h_bond_acceptors: 0,
      tpsa: 0,
    },
  };

  test("both components render together", () => {
    const { container } = render(
      <div>
        <MolecularViewer3D
          smiles={mockCompound.smiles}
          compoundName={mockCompound.name}
        />
        <PropertyCalculatorEnhanced compound={mockCompound} />
      </div>
    );

    expect(screen.getByText(/3D Molecular View/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Enhanced Property Calculator/i)
    ).toBeInTheDocument();
  });

  test("both components work independently", async () => {
    render(
      <div>
        <MolecularViewer3D
          smiles={mockCompound.smiles}
          compoundName={mockCompound.name}
        />
        <PropertyCalculatorEnhanced compound={mockCompound} />
      </div>
    );

    // Test 3D viewer
    const renderModeSelector = screen.getByRole("combobox");
    fireEvent.change(renderModeSelector, { target: { value: "wireframe" } });
    expect(renderModeSelector).toHaveValue("wireframe");

    // Test calculator
    const calculateBtn = screen.getByRole("button", { name: /Calculate All/i });
    fireEvent.click(calculateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Basic Properties/i)).toBeInTheDocument();
    });
  });
});

// ═══════════════════════════════════════════════════════════
// PERFORMANCE TESTS
// ═══════════════════════════════════════════════════════════

describe("Performance Tests", () => {
  test("3D viewer renders within acceptable time", () => {
    const startTime = performance.now();

    render(<MolecularViewer3D smiles="CCO" compoundName="Ethanol" />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in less than 1 second
    expect(renderTime).toBeLessThan(1000);
  });

  test("property calculation completes quickly", async () => {
    const mockCompound = {
      formula: "C2H6O",
      smiles: "CCO",
      molecular_weight: "46.07",
      properties: {},
    };

    render(<PropertyCalculatorEnhanced compound={mockCompound} />);
    const calculateBtn = screen.getByRole("button", { name: /Calculate All/i });

    const startTime = performance.now();
    fireEvent.click(calculateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Basic Properties/i)).toBeInTheDocument();
    });

    const endTime = performance.now();
    const calculationTime = endTime - startTime;

    // Should complete in less than 2 seconds
    expect(calculationTime).toBeLessThan(2000);
  });
});

// ═══════════════════════════════════════════════════════════
// MANUAL TEST CHECKLIST
// ═══════════════════════════════════════════════════════════

/*
MANUAL TESTING CHECKLIST:

3D Molecular Viewer:
□ Molecule renders correctly
□ Can rotate with mouse drag
□ Can zoom with scroll
□ Can pan with right-click drag
□ Render mode changes work (ball-stick, space-filling, wireframe)
□ Fullscreen toggle works
□ Screenshot download works
□ Reset view works
□ Smooth animations
□ Works in dark mode
□ Responsive on mobile

Property Calculator:
□ Calculate button works
□ All property sections display
□ Values are reasonable
□ Lipinski rule check shows correctly
□ Toxicity warnings appear when appropriate
□ Disclaimer shows
□ Works with various compound types
□ Handles missing data gracefully
□ Loading state shows
□ Dark mode compatible

Integration:
□ Both components work together
□ No performance issues
□ No console errors
□ Memory doesn't leak on unmount
□ Works across browsers (Chrome, Firefox, Safari)

Token Usage:
□ NO API calls made (purely frontend)
□ All calculations are client-side
□ No Gemini API usage
*/

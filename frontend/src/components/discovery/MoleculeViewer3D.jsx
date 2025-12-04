import { useEffect, useRef, useCallback } from "react";

const MoleculeViewer3D = ({ smiles, name }) => {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  const initViewer = useCallback(() => {
    if (viewerRef.current) {
      viewerRef.current = null;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    try {
      if (!window.$3Dmol) return;

      const viewer = window.$3Dmol.createViewer(containerRef.current, {
        backgroundColor: "white",
      });

      const canvasElement = containerRef.current.querySelector("canvas");
      if (canvasElement) {
        canvasElement.style.position = "relative";
        canvasElement.style.top = "";
        canvasElement.style.left = "";
        canvasElement.style.zIndex = "";
      }

      window.$3Dmol.get(
        "https://cactus.nci.nih.gov/chemical/structure/" +
          encodeURIComponent(smiles) +
          "/sdf",
        function (data) {
          viewer.addModel(data, "sdf");
          viewer.setStyle(
            {},
            { stick: { radius: 0.15 }, sphere: { scale: 0.3 } }
          );
          viewer.zoomTo();
          viewer.render();
          viewer.rotate(45, { x: 1, y: 1, z: 0 });
        },
        function (error) {
          console.error("Failed to load structure:", error);
          viewer.addModel("SMILES: " + smiles, "smiles");
          viewer.setStyle({}, { stick: {}, sphere: { scale: 0.3 } });
          viewer.zoomTo();
          viewer.render();
        }
      );

      viewerRef.current = viewer;
    } catch (error) {
      console.error("3D Viewer initialization error:", error);
    }
  }, [smiles]);

  useEffect(() => {
    if (!smiles || !containerRef.current) return;

    if (window.$3Dmol) {
      initViewer();
      return;
    }

    if (scriptLoadedRef.current) return;

    const script = document.createElement("script");
    script.src = "https://3Dmol.csb.pitt.edu/build/3Dmol-min.js";
    script.async = true;

    script.onload = () => {
      scriptLoadedRef.current = true;
      if (window.$3Dmol && containerRef.current) {
        initViewer();
      }
    };

    document.body.appendChild(script);

    return () => {
      if (viewerRef.current) {
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
        viewerRef.current = null;
      }
    };
  }, [smiles, initViewer]);

  return (
    <div className="w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ minHeight: "400px" }}
      />
    </div>
  );
};

export default MoleculeViewer3D;

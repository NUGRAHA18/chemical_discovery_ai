import { useEffect, useRef, useCallback } from "react";

const MoleculeViewer3D = ({ smiles, name }) => {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  // Fungsi inisialisasi viewer
  const initViewer = useCallback(() => {
    // 1. Bersihkan viewer lama jika ada
    if (viewerRef.current) {
      // 3Dmol tidak memiliki method destroy explicit yang sempurna,
      // tapi kita bisa clear reference-nya
      viewerRef.current = null;
    }

    // 2. Bersihkan kontainer DOM
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    try {
      if (!window.$3Dmol) return;

      // 3. Buat Instance Viewer Baru
      const viewer = window.$3Dmol.createViewer(containerRef.current, {
        backgroundColor: "white", // Bisa diganti 'transparent' jika mau
      });

      // 4. CSS Hack untuk memastikan Canvas tidak berantakan (Absolute positioning issue)
      const canvasElement = containerRef.current.querySelector("canvas");
      if (canvasElement) {
        canvasElement.style.position = "relative";
        canvasElement.style.top = "0";
        canvasElement.style.left = "0";
        canvasElement.style.zIndex = "1";
        canvasElement.style.width = "100%";
        canvasElement.style.height = "100%";
      }

      // 5. Fetch Data Struktur dari SMILES (via NIH Cactus Service)
      // Alternatif: viewer.addModel(smiles, "smi") untuk render langsung string SMILES (lebih cepat tapi 2D-ish conversion)
      window.$3Dmol.get(
        "https://cactus.nci.nih.gov/chemical/structure/" +
          encodeURIComponent(smiles) +
          "/sdf",
        function (data) {
          // Callback Sukses
          if (!viewer) return; // Guard clause jika viewer sudah dimatikan

          viewer.addModel(data, "sdf");
          viewer.setStyle(
            {},
            { stick: { radius: 0.15 }, sphere: { scale: 0.3 } }
          );
          viewer.zoomTo();
          viewer.render();
          viewer.rotate(45, { x: 1, y: 1, z: 0 }); // Rotasi awal sedikit biar estetik
        },
        function (error) {
          // Callback Error (Fallback render string SMILES langsung)
          console.error(
            "Failed to load structure from API, falling back to SMILES string:",
            error
          );
          if (!viewer) return;

          viewer.addModel(smiles, "smi"); // "smi" parser built-in 3Dmol
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
    // MENANGKAP REF KE VARIABLE LOKAL (Solusi ESLint Warning)
    const currentContainer = containerRef.current;

    if (!currentContainer || !smiles) return;

    // Helper untuk load script
    const loadScript = () => {
      // Cek apakah script sudah ada di document head/body
      if (
        document.querySelector(
          'script[src="https://3Dmol.csb.pitt.edu/build/3Dmol-min.js"]'
        )
      ) {
        if (window.$3Dmol) {
          initViewer();
        } else {
          // Script tag ada tapi window.$3Dmol belum ready, tunggu sebentar
          setTimeout(initViewer, 500);
        }
        return;
      }

      const script = document.createElement("script");
      script.src = "https://3Dmol.csb.pitt.edu/build/3Dmol-min.js";
      script.async = true;

      script.onload = () => {
        scriptLoadedRef.current = true;
        if (window.$3Dmol) {
          initViewer();
        }
      };

      document.body.appendChild(script);
    };

    if (window.$3Dmol) {
      initViewer();
    } else {
      loadScript();
    }

    // CLEANUP FUNCTION
    return () => {
      // Gunakan variable lokal 'currentContainer' di sini, BUKAN containerRef.current
      if (currentContainer) {
        currentContainer.innerHTML = "";
      }
      if (viewerRef.current) {
        viewerRef.current = null;
      }
    };
  }, [smiles, initViewer]); // Dependencies sudah benar

  return (
    <div className="w-full h-full relative">
      <div
        ref={containerRef}
        className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white overflow-hidden relative"
        style={{ minHeight: "400px" }}
      />
      {/* Overlay nama senyawa (Optional) */}
      {name && (
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none z-10">
          {name}
        </div>
      )}
    </div>
  );
};

export default MoleculeViewer3D;

import { useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  RefreshCcw,
  Loader2,
  Tag,
  MousePointer2,
  Move,
  Hand,
  AlertCircle,
  BrainCircuit,
} from "lucide-react";

const MolecularViewer3D = ({ smiles, compoundName = "Molecule" }) => {
  const viewerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLibLoaded, setIsLibLoaded] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isComputed, setIsComputed] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  const glViewerRef = useRef(null);

  // 1. Load Library
  useEffect(() => {
    if (window.$3Dmol) {
      setIsLibLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.0.4/3Dmol-min.js";
    script.async = true;
    script.onload = () => setIsLibLoaded(true);
    document.body.appendChild(script);
  }, []);

  // 2. Fetch & Render Data
  useEffect(() => {
    if (!isLibLoaded || !viewerRef.current || !smiles) return;

    const element = viewerRef.current;
    const config = { backgroundColor: isFullscreen ? "#ffffff" : "#f9fafb" };

    // @ts-ignore
    // Inisialisasi Viewer
    let viewer = null;
    try {
      viewer = window.$3Dmol.createViewer(element, config);
      glViewerRef.current = viewer;
    } catch (e) {
      return; // Cegah crash jika inisialisasi gagal
    }

    // --- 🛠️ FIX: RESIZE OBSERVER YANG LEBIH PINTAR ---
    // Observer ini tugasnya: "Tunggu sampai kotak punya ukuran, baru gambar ulang"
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Hanya resize & render jika ukurannya VALID (bukan 0)
        if (width > 0 && height > 0 && viewer) {
          viewer.resize();
          viewer.render(); // Render ulang saat ukuran berubah (animasi modal selesai)
        }
      }
    });

    resizeObserver.observe(element);

    const fetchAndRender = async () => {
      setIsLoadingData(true);
      setHasError(false);
      setIsComputed(false);
      viewer.clear();

      try {
        // ============================================================
        // 1️⃣ TAHAP UTAMA: PUBCHEM
        // ============================================================
        const cidUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(
          smiles
        )}/cids/TXT`;
        const cidRes = await fetch(cidUrl);

        if (cidRes.ok) {
          let cid = (await cidRes.text()).trim();
          cid = cid.split(/\s+/)[0];

          if (cid && cid !== "0" && !isNaN(parseInt(cid))) {
            const sdfUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`;
            const sdfRes = await fetch(sdfUrl);

            if (sdfRes.ok) {
              const sdfData = await sdfRes.text();
              viewer.addModel(sdfData, "sdf");
              finishRender();
              return;
            }
          }
        }

        throw new Error("PubChem unavailable");
      } catch (pubchemError) {
        // ============================================================
        // 2️⃣ TAHAP FALLBACK: NCI CACTUS
        // ============================================================
        try {
          const nciUrl = `https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(
            smiles
          )}/file?format=sdf&get3d=true`;

          const nciRes = await fetch(nciUrl);
          if (!nciRes.ok) throw new Error("NCI Resolver failed");

          const sdfData = await nciRes.text();
          if (sdfData.includes("<!DOCTYPE") || sdfData.length < 50) {
            throw new Error("Invalid SDF");
          }

          viewer.clear();
          viewer.addModel(sdfData, "sdf");
          setIsComputed(true);
          finishRender();
        } catch (nciError) {
          console.error("❌ 3D Generation Failed:", nciError);
          setHasError(true);
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    // --- 🛠️ FIX: SAFE RENDER FUNCTION ---
    const finishRender = () => {
      if (!viewer) return;

      viewer.setStyle({}, { stick: { radius: 0.2 }, sphere: { scale: 0.3 } });
      viewer.zoomTo();

      // KUNCI PERBAIKAN:
      // Jangan pernah panggil .render() jika ukuran elemen masih 0!
      // Biarkan ResizeObserver yang melakukan render nanti saat modal sudah terbuka.
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        viewer.render();
      }

      setShowLabels(false);
    };

    fetchAndRender();

    const handleResize = () => {
      if (viewer) viewer.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [isLibLoaded, smiles, isFullscreen]);

  // Efek Toggle Label
  useEffect(() => {
    if (!glViewerRef.current || isLoadingData) return;
    const viewer = glViewerRef.current;

    // Safety check render label
    const element = viewerRef.current;
    if (!element || element.clientWidth === 0) return;

    viewer.removeAllLabels();

    if (showLabels) {
      const atoms = viewer.getModel().selectedAtoms({});
      atoms.forEach((atom) => {
        viewer.addLabel(atom.elem, {
          position: { x: atom.x, y: atom.y, z: atom.z },
          backgroundColor: "black",
          backgroundOpacity: 0.7,
          fontColor: "white",
          fontSize: 14,
          showBackground: true,
          alignment: "center",
          borderThickness: 0,
          inFront: true,
        });
      });
    }
    viewer.render();
  }, [showLabels, isLoadingData]);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return (
    <div
      className={`relative bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isFullscreen
          ? "fixed top-0 bottom-0 left-0 right-0 z-[9999] h-screen w-full"
          : "w-full h-96"
      }`}
    >
      <div
        ref={viewerRef}
        className="w-full h-full cursor-move relative z-0"
        style={{ outline: "none" }}
      />

      {/* Loading Overlay */}
      {(!isLibLoaded || isLoadingData) && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-gray-600 dark:text-gray-300">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary-600" />
          <p className="text-sm font-medium">Generating 3D Structure...</p>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && !isLoadingData && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm p-6 text-center">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-full shadow-sm mb-4">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            3D Model Unavailable
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md leading-relaxed">
            We apologize, but we couldn't retrieve the precise 3D structure data
            for this specific compound.
          </p>
          <div className="mt-6 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-lg border border-blue-100 dark:border-blue-800">
            Please refer to the 2D Structure image.
          </div>
        </div>
      )}

      {/* Controls UI */}
      <div className="absolute top-3 right-3 flex gap-2">
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`p-2 backdrop-blur border rounded-lg shadow-sm transition-all ${
            showLabels
              ? "bg-primary-600 border-primary-600 text-white"
              : "bg-white/90 dark:bg-gray-800/90 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
          }`}
          title="Toggle Atom Labels"
        >
          <Tag className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (glViewerRef.current) {
              glViewerRef.current.zoomTo({ duration: 500 });
              glViewerRef.current.render();
            }
          }}
          className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 shadow-sm transition-all"
          title="Reset Camera"
        >
          <RefreshCcw className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 shadow-sm transition-all"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          ) : (
            <Maximize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Info Panel (Bottom Left) */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-2 pointer-events-none">
        <div className="bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 backdrop-blur-sm pointer-events-auto">
          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 font-bold max-w-[200px] truncate">
            {compoundName}
          </p>
        </div>

        {/* AI Computed Badge */}
        {isComputed && !hasError && (
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 backdrop-blur-sm w-fit animate-fade-in pointer-events-auto">
            <BrainCircuit className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
              AI Generated Structure
            </span>
          </div>
        )}
      </div>

      {/* Interaction Guide (Bottom Right) */}
      <div className="absolute bottom-3 right-3 hidden sm:block pointer-events-none">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">
            Interaction Guide
          </h4>
          <div className="flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 font-medium">
                <Move className="w-3.5 h-3.5 text-blue-500" /> Rotate
              </span>
              <span className="font-mono text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                Left Click + Drag
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 font-medium">
                <MousePointer2 className="w-3.5 h-3.5 text-purple-500" /> Zoom
              </span>
              <span className="font-mono text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                Scroll / Pinch
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 font-medium">
                <Hand className="w-3.5 h-3.5 text-orange-500" /> Pan
              </span>
              <span className="font-mono text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                Right Click + Drag
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MolecularViewer3D;

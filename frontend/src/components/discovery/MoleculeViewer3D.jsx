import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Maximize2, Minimize2, RotateCw, Download } from "lucide-react";

const MolecularViewer3D = ({ smiles, compoundName = "Molecule" }) => {
  const mountRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderMode, setRenderMode] = useState("ball-stick");
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animationIdRef = useRef(null);

  // Simple hash function
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  // Seeded random generator
  const seededRandom = (seed) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // ✅ FIX 1: Body Scroll Lock (Mencegah scroll bar ganda saat fullscreen)
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!mountRef.current || !smiles) return;

    const atoms = parseSmilesToAtoms(smiles);

    // Clear previous scene
    if (sceneRef.current) {
      sceneRef.current.children.forEach((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      sceneRef.current.clear();
    }

    // Initialize Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 15;
    cameraRef.current = camera;

    // Renderer
    let renderer = rendererRef.current;
    if (!renderer) {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true, // Penting untuk screenshot
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      rendererRef.current = renderer;
    }

    // Append renderer
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Controls
    let controls = controlsRef.current;
    if (!controls || controls.object !== camera) {
      if (controls) controls.dispose();
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.0;
      controlsRef.current = controls;
    }

    // Create molecule
    createMolecule(scene, atoms, renderMode);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Logic (ResizeObserver)
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current)
        return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(mountRef.current);
    handleResize();

    return () => {
      resizeObserver.disconnect();
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [smiles, renderMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);

  const createMolecule = (scene, atoms, mode) => {
    scene.children = scene.children.filter(
      (child) => !(child instanceof THREE.Mesh && child.userData.isMolecule)
    );

    atoms.forEach((atom) => {
      let geometry, material;

      if (mode === "ball-stick") {
        geometry = new THREE.SphereGeometry(atom.radius * 0.3, 32, 32);
        material = new THREE.MeshPhongMaterial({
          color: atom.color,
          shininess: 80,
        });
      } else if (mode === "space-filling") {
        geometry = new THREE.SphereGeometry(atom.radius, 32, 32);
        material = new THREE.MeshPhongMaterial({
          color: atom.color,
          shininess: 100,
        });
      } else {
        geometry = new THREE.SphereGeometry(atom.radius * 0.3, 16, 16);
        material = new THREE.MeshBasicMaterial({
          color: atom.color,
          wireframe: true,
        });
      }

      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(atom.x, atom.y, atom.z);
      sphere.userData.isMolecule = true;
      scene.add(sphere);

      atom.bonds?.forEach((bondTo) => {
        if (bondTo >= atoms.length) return;
        const target = atoms[bondTo];
        const bondGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1);
        const bondMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const bond = new THREE.Mesh(bondGeometry, bondMaterial);

        const direction = new THREE.Vector3().subVectors(
          new THREE.Vector3(target.x, target.y, target.z),
          new THREE.Vector3(atom.x, atom.y, atom.z)
        );
        const distance = direction.length();
        bond.scale.y = distance;
        bond.position.set(
          (atom.x + target.x) / 2,
          (atom.y + target.y) / 2,
          (atom.z + target.z) / 2
        );
        bond.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction.clone().normalize()
        );
        bond.userData.isMolecule = true;
        scene.add(bond);
      });
    });
  };

  const parseSmilesToAtoms = (smiles) => {
    // (Logika parsing SMILES sama seperti sebelumnya - disingkat agar fokus pada layout)
    const atoms = [];
    const elementColors = {
      C: 0x909090,
      H: 0xffffff,
      O: 0xff0d0d,
      N: 0x3050f8,
      S: 0xffff30,
      P: 0xff8000,
      F: 0x90e050,
      Cl: 0x1ff01f,
    };
    const seed = hashCode(smiles);
    const numAtoms = Math.min(Math.max(smiles.length, 8), 25);
    const hasOxygen = smiles.includes("O");
    const hasNitrogen = smiles.includes("N");
    const hasSulfur = smiles.includes("S");
    const hasRing = smiles.includes("1") || smiles.includes("c");

    for (let i = 0; i < numAtoms; i++) {
      let element = "C";
      let color = elementColors.C;
      if (hasOxygen && i % 4 === 0) {
        element = "O";
        color = elementColors.O;
      } else if (hasNitrogen && i % 5 === 0) {
        element = "N";
        color = elementColors.N;
      } else if (hasSulfur && i % 6 === 0) {
        element = "S";
        color = elementColors.S;
      }

      let x, y, z;
      if (hasRing) {
        const angle = (i / numAtoms) * Math.PI * 2;
        const radius = 5 + seededRandom(seed + i) * 2;
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
        z = seededRandom(seed + i * 100) * 3 - 1.5;
      } else {
        x = (i - numAtoms / 2) * 2 + seededRandom(seed + i) * 2;
        y = seededRandom(seed + i * 10) * 4 - 2;
        z = seededRandom(seed + i * 20) * 4 - 2;
      }
      atoms.push({
        element,
        x,
        y,
        z,
        radius: element === "O" ? 1.52 : element === "N" ? 1.55 : 1.7,
        color,
        bonds: i < numAtoms - 1 ? [i + 1] : hasRing ? [0] : [],
      });
    }
    return atoms;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetView = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 15);
      cameraRef.current.lookAt(0, 0, 0);
    }
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const captureScreenshot = () => {
    if (!rendererRef.current) return;
    const dataURL = rendererRef.current.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${compoundName.replace(/\s+/g, "-")}-3D.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${
        isFullscreen
          ? // ✅ FIX 2: CSS "Cinema Mode"
            // fixed: Keluar dari layout normal
            // h-screen: Tinggi penuh layar
            // w-full max-w-5xl: Lebar tetap mengikuti modal (tidak melebar ke samping)
            // left-0 right-0 mx-auto: Posisi di tengah horizontal
            // z-[9999]: Di atas elemen lain
            "fixed top-0 bottom-0 left-0 right-0 z-[9999] h-screen w-full max-w-5xl mx-auto shadow-2xl"
          : "w-full h-full"
      }`}
    >
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <select
          value={renderMode}
          onChange={(e) => setRenderMode(e.target.value)}
          className="px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
        >
          <option value="ball-stick">Ball & Stick</option>
          <option value="space-filling">Space Filling</option>
          <option value="wireframe">Wireframe</option>
        </select>

        <button
          onClick={resetView}
          className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Reset View"
        >
          <RotateCw className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>

        <button
          onClick={captureScreenshot}
          className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Download Screenshot"
        >
          <Download className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          ) : (
            <Maximize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Title */}
      <div className="absolute top-3 left-3 z-10">
        <div className="px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {compoundName}
          </p>
        </div>
      </div>

      {/* ✅ FIX 3: Canvas Container Sizing */}
      {/* block ensures it fills the flex/fixed parent properly without strange gaps */}
      <div
        ref={mountRef}
        className="w-full h-full block"
        style={{ minHeight: isFullscreen ? "100vh" : "400px" }}
      />

      {/* Instructions */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Drag: Rotate • Right-click: Zoom • Scroll: Zoom
          </p>
        </div>
      </div>
    </div>
  );
};

export default MolecularViewer3D;

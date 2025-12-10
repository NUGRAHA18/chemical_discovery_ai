import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Maximize2, Minimize2, RotateCw, Download } from "lucide-react";

const MolecularViewer3D = ({ smiles, compoundName = "Molecule" }) => {
  const mountRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderMode, setRenderMode] = useState("ball-stick"); // ball-stick, space-filling, wireframe
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current || !smiles) return;

    // Parse SMILES to 3D coordinates (simplified - real implementation needs RDKit)
    const atoms = parseSmilesToAtoms(smiles);

    // Initialize Three.js Scene
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
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    // Create molecule visualization
    createMolecule(scene, atoms, renderMode);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      controls.dispose();
    };
  }, [smiles, renderMode]);

  const createMolecule = (scene, atoms, mode) => {
    // Clear existing molecule
    scene.children = scene.children.filter(
      (child) => !(child instanceof THREE.Mesh && child.userData.isMolecule)
    );

    atoms.forEach((atom) => {
      let geometry, material;

      if (mode === "ball-stick") {
        // Ball-and-stick model
        geometry = new THREE.SphereGeometry(atom.radius * 0.3, 32, 32);
        material = new THREE.MeshPhongMaterial({
          color: atom.color,
          shininess: 80,
        });
      } else if (mode === "space-filling") {
        // Space-filling model (CPK)
        geometry = new THREE.SphereGeometry(atom.radius, 32, 32);
        material = new THREE.MeshPhongMaterial({
          color: atom.color,
          shininess: 100,
        });
      } else {
        // Wireframe
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

      // Add bonds (simplified)
      atom.bonds?.forEach((bondTo) => {
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
    // Simplified parser - real implementation needs RDKit/RDKitJS
    // This creates a simple molecular structure for demo
    const atoms = [];
    const elementColors = {
      C: 0x909090, // Carbon - gray
      H: 0xffffff, // Hydrogen - white
      O: 0xff0d0d, // Oxygen - red
      N: 0x3050f8, // Nitrogen - blue
      S: 0xffff30, // Sulfur - yellow
      P: 0xff8000, // Phosphorus - orange
      F: 0x90e050, // Fluorine - green
      Cl: 0x1ff01f, // Chlorine - green
    };

    // Simple carbon chain for demo (replace with real SMILES parser)
    const numAtoms = Math.min(smiles.length, 20);
    for (let i = 0; i < numAtoms; i++) {
      const angle = (i / numAtoms) * Math.PI * 2;
      const radius = 5;
      atoms.push({
        element: i % 3 === 0 ? "O" : "C",
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: (Math.random() - 0.5) * 2,
        radius: i % 3 === 0 ? 1.52 : 1.7, // Van der Waals radius
        color: i % 3 === 0 ? elementColors.O : elementColors.C,
        bonds: i < numAtoms - 1 ? [i + 1] : [],
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
        isFullscreen ? "fixed inset-4 z-50" : ""
      }`}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg drop-shadow-lg">
            3D Molecular View: {compoundName}
          </h3>
          <div className="flex items-center gap-2">
            {/* Render Mode */}
            <select
              value={renderMode}
              onChange={(e) => setRenderMode(e.target.value)}
              className="px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg text-sm border border-gray-300 dark:border-gray-600"
            >
              <option value="ball-stick">Ball & Stick</option>
              <option value="space-filling">Space Filling</option>
              <option value="wireframe">Wireframe</option>
            </select>

            {/* Reset View */}
            <button
              onClick={resetView}
              className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Reset View"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Screenshot */}
            <button
              onClick={captureScreenshot}
              className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Download Screenshot"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div
        ref={mountRef}
        className={`${isFullscreen ? "h-full" : "h-96"}`}
        style={{ minHeight: isFullscreen ? "100%" : "24rem" }}
      />

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <p className="text-white text-xs drop-shadow-lg">
          🖱️ Drag to rotate • Scroll to zoom • Right-click to pan
        </p>
      </div>
    </div>
  );
};

export default MolecularViewer3D;

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  HologramModel,
  HologramRenderConfig,
  HologramComponent,
  HologramHotspot,
} from "../types";
import {
  RotateCw,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  Camera,
  Compass,
  Info,
  Activity,
} from "lucide-react";
import { jarvisSound } from "../services/soundEffects";

interface HologramViewportProps {
  model: HologramModel | null;
  onUpdateConfig?: (newConfig: Partial<HologramRenderConfig>) => void;
  onSelectComponent?: (comp: HologramComponent | null) => void;
  selectedComponentId?: string | null;
  onOpenARMode?: () => void;
  className?: string;
}

const COLOR_PALETTES = {
  cyan: {
    primary: 0x06b6d4,
    secondary: 0x38bdf8,
    accent: 0x22d3ee,
    emissive: 0x0891b2,
    wireframe: 0x67e8f9,
    ambient: 0x0e7490,
    hexPrimary: "#06b6d4",
  },
  gold_crimson: {
    primary: 0xdc2626,
    secondary: 0xf59e0b,
    accent: 0xfbbf24,
    emissive: 0xb91c1c,
    wireframe: 0xfde047,
    ambient: 0x7f1d1d,
    hexPrimary: "#f59e0b",
  },
  matrix_emerald: {
    primary: 0x10b981,
    secondary: 0x34d399,
    accent: 0x6ee7b7,
    emissive: 0x059669,
    wireframe: 0xa7f3d0,
    ambient: 0x064e3b,
    hexPrimary: "#10b981",
  },
  amethyst: {
    primary: 0xa855f7,
    secondary: 0xc084fc,
    accent: 0xe879f9,
    emissive: 0x9333ea,
    wireframe: 0xf0abfc,
    ambient: 0x581c87,
    hexPrimary: "#c084fc",
  },
  white_wire: {
    primary: 0xe2e8f0,
    secondary: 0x94a3b8,
    accent: 0xf8fafc,
    emissive: 0x64748b,
    wireframe: 0xffffff,
    ambient: 0x334155,
    hexPrimary: "#e2e8f0",
  },
};

export const HologramViewport: React.FC<HologramViewportProps> = ({
  model,
  onUpdateConfig,
  onSelectComponent,
  selectedComponentId,
  onOpenARMode,
  className = "",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const floorGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const scanPlaneRef = useRef<THREE.Mesh | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Viewport states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<HologramHotspot | null>(null);
  const [explodedVal, setExplodedVal] = useState<number>(model?.renderConfig?.explodedFactor ?? 0);

  useEffect(() => {
    setExplodedVal(model?.renderConfig?.explodedFactor ?? 0);
  }, [model?.id, model?.renderConfig?.explodedFactor]);

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraDistanceRef = useRef(7.5);
  const cameraRotationRef = useRef({ x: 0.35, y: 0.5 });

  // Current config values
  const currentScheme = model?.renderConfig.colorScheme || "cyan";
  const palette = COLOR_PALETTES[currentScheme] || COLOR_PALETTES.cyan;
  const isWireframeOnly = model?.renderConfig.wireframe || false;
  const isPointCloud = model?.renderConfig.pointCloud || false;
  const rotationSpeed = model?.renderConfig.rotationSpeed ?? 0.015;

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x020617, 0.035);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Clear previous canvas
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // Hologram Lighting
    const ambientLight = new THREE.AmbientLight(palette.ambient, 1.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(palette.primary, 2.5);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(palette.secondary, 1.8);
    dirLight2.position.set(-5, -4, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(palette.accent, 2.0, 15);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Hologram Floor Grid & Projection Rings
    const floorGroup = new THREE.Group();
    floorGroupRef.current = floorGroup;
    floorGroup.position.y = -2.8;

    // Outer Projection Ring
    const outerRingGeo = new THREE.RingGeometry(3.6, 3.65, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: palette.primary,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, ringMat);
    outerRing.rotation.x = Math.PI / 2;
    floorGroup.add(outerRing);

    // Inner Dashed Ring
    const innerRingGeo = new THREE.RingGeometry(2.4, 2.44, 48);
    const innerRing = new THREE.Mesh(innerRingGeo, ringMat);
    innerRing.rotation.x = Math.PI / 2;
    floorGroup.add(innerRing);

    // Hologram Grid Floor
    const gridHelper = new THREE.GridHelper(8, 16, palette.primary, 0x1e293b);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.25;
    floorGroup.add(gridHelper);

    scene.add(floorGroup);

    // Hologram Scan Plane Laser
    const scanGeo = new THREE.PlaneGeometry(8, 8);
    const scanMat = new THREE.MeshBasicMaterial({
      color: palette.accent,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const scanPlane = new THREE.Mesh(scanGeo, scanMat);
    scanPlane.rotation.x = Math.PI / 2;
    scanPlaneRef.current = scanPlane;
    scene.add(scanPlane);

    // Ambient Quantum Particle Field
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 10;
      particlePositions[i + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i + 2] = (Math.random() - 0.5) * 10;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: palette.accent,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    particlesRef.current = particles;
    scene.add(particles);

    // Main Model Group
    const modelGroup = new THREE.Group();
    modelGroupRef.current = modelGroup;
    scene.add(modelGroup);

    // Resize Observer
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(mountRef.current);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Auto-rotation of model
      if (modelGroupRef.current) {
        if (isAutoRotating) {
          modelGroupRef.current.rotation.y += rotationSpeed;
        }

        // Animate sub-components
        modelGroupRef.current.children.forEach((child: any) => {
          if (child.userData?.animation) {
            const anim = child.userData.animation;
            if (anim.type === "rotate") {
              const speed = anim.speed || 0.02;
              if (anim.axis) {
                child.rotation.x += anim.axis[0] * speed;
                child.rotation.y += anim.axis[1] * speed;
                child.rotation.z += anim.axis[2] * speed;
              } else {
                child.rotation.y += speed;
              }
            } else if (anim.type === "pulse") {
              const pulse = Math.sin(elapsedTime * 4) * 0.08 + 1;
              child.scale.set(pulse, pulse, pulse);
            } else if (anim.type === "bob") {
              child.position.y = (child.userData.initialY || 0) + Math.sin(elapsedTime * 2) * 0.15;
            }
          }
        });
      }

      // Rotating Floor Compass
      if (floorGroupRef.current) {
        floorGroupRef.current.rotation.y -= 0.003;
      }

      // Scanning Beam Sweep
      if (scanPlaneRef.current) {
        scanPlaneRef.current.position.y = Math.sin(elapsedTime * 1.5) * 2.2;
      }

      // Ambient Quantum Particle Drift
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.001;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [currentScheme]);

  // Update Camera Position Helper
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const distance = cameraDistanceRef.current;
    const rotX = cameraRotationRef.current.x;
    const rotY = cameraRotationRef.current.y;

    const x = distance * Math.sin(rotY) * Math.cos(rotX);
    const y = distance * Math.sin(rotX);
    const z = distance * Math.cos(rotY) * Math.cos(rotX);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  };

  // Build / Reconstruct 3D Model Geometry inside scene
  useEffect(() => {
    if (!sceneRef.current || !modelGroupRef.current || !model) return;

    const group = modelGroupRef.current;
    // Clear previous children
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
      if ((obj as any).material) {
        if (Array.isArray((obj as any).material)) {
          (obj as any).material.forEach((m: any) => m.dispose());
        } else {
          (obj as any).material.dispose();
        }
      }
    }

    const { geometryData } = model;

    // 1. Component Mesh List Mode
    if (geometryData.type === "components" && geometryData.components) {
      geometryData.components.forEach((comp) => {
        let geo: THREE.BufferGeometry;
        const dims = comp.dimensions || [1, 1, 1];

        switch (comp.shape) {
          case "box":
            geo = new THREE.BoxGeometry(dims[0] || 1, dims[1] || 1, dims[2] || 1);
            break;
          case "sphere":
            geo = new THREE.SphereGeometry(dims[0] || 1, dims[1] || 24, dims[2] || 24);
            break;
          case "cylinder":
            geo = new THREE.CylinderGeometry(
              dims[0] || 1,
              dims[1] || 1,
              dims[2] || 2,
              dims[3] || 24
            );
            break;
          case "cone":
            geo = new THREE.ConeGeometry(dims[0] || 1, dims[1] || 2, dims[2] || 24);
            break;
          case "torus":
            geo = new THREE.TorusGeometry(
              dims[0] || 1.5,
              dims[1] || 0.2,
              dims[2] || 16,
              dims[3] || 48
            );
            break;
          case "ring":
            geo = new THREE.RingGeometry(dims[0] || 1, dims[1] || 1.5, dims[2] || 32);
            break;
          case "icosahedron":
            geo = new THREE.IcosahedronGeometry(dims[0] || 1, dims[1] || 0);
            break;
          case "tetrahedron":
            geo = new THREE.TetrahedronGeometry(dims[0] || 1, dims[1] || 0);
            break;
          case "dodecahedron":
            geo = new THREE.DodecahedronGeometry(dims[0] || 1, dims[1] || 0);
            break;
          case "tube":
            geo = new THREE.CylinderGeometry(dims[0] || 0.2, dims[0] || 0.2, dims[1] || 3, 16);
            break;
          default:
            geo = new THREE.BoxGeometry(1, 1, 1);
        }

        // Color & Material resolution
        const compColor = comp.color
          ? new THREE.Color(comp.color)
          : new THREE.Color(palette.primary);
        const emissiveColor = comp.emissive
          ? new THREE.Color(comp.emissive)
          : new THREE.Color(palette.emissive);

        const isSelected = selectedComponentId === comp.id;

        const mat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xffffff : compColor,
          emissive: isSelected ? 0x22d3ee : emissiveColor,
          emissiveIntensity: isSelected ? 2.5 : model.renderConfig.glowIntensity || 1.4,
          transparent: true,
          opacity: isWireframeOnly ? 0.35 : comp.opacity || 0.85,
          wireframe: isWireframeOnly || comp.wireframe || false,
          roughness: 0.2,
          metalness: 0.8,
        });

        const mesh = new THREE.Mesh(geo, mat);

        // Apply Position with Exploded Offset Calculation
        const [px, py, pz] = comp.position || [0, 0, 0];
        const explodeFactor = explodedVal || model.renderConfig.explodedFactor || 0;
        mesh.position.set(
          px * (1 + explodeFactor * 1.5),
          py * (1 + explodeFactor * 1.5),
          pz * (1 + explodeFactor * 1.5)
        );

        const [rx, ry, rz] = comp.rotation || [0, 0, 0];
        mesh.rotation.set(rx, ry, rz);

        const [sx, sy, sz] = comp.scale || [1, 1, 1];
        mesh.scale.set(sx, sy, sz);

        mesh.userData = {
          id: comp.id,
          name: comp.name,
          animation: comp.animation,
          initialY: py,
          technicalNotes: comp.technicalNotes,
        };

        // If not wireframe only, also add a subtle wireframe outline edge
        if (!isWireframeOnly && !comp.wireframe) {
          const wireMat = new THREE.MeshBasicMaterial({
            color: palette.wireframe,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
          });
          const wireMesh = new THREE.Mesh(geo, wireMat);
          mesh.add(wireMesh);
        }

        group.add(mesh);
      });
    }

    // 2. Volumetric Depth Point Cloud Mode (from image conversion)
    else if (
      geometryData.type === "heightmap_pointcloud" &&
      geometryData.heightmapData?.depthPoints
    ) {
      const points = geometryData.heightmapData.depthPoints;
      const count = points.length;

      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      points.forEach(([x, y, z, hexColor], i) => {
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const c = new THREE.Color(hexColor || palette.hexPrimary);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      });

      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const pMat = new THREE.PointsMaterial({
        size: 0.06,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });

      const pointCloudMesh = new THREE.Points(pGeo, pMat);
      group.add(pointCloudMesh);
    }
  }, [model, selectedComponentId, explodedVal, isWireframeOnly, palette]);

  // Handle Mouse & Touch Interaction (Orbit / Pan / Zoom)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    cameraRotationRef.current.y -= deltaX * 0.008;
    cameraRotationRef.current.x = Math.max(
      -Math.PI / 2.2,
      Math.min(Math.PI / 2.2, cameraRotationRef.current.x + deltaY * 0.008)
    );

    updateCameraPosition();
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraDistanceRef.current = Math.max(
      2.5,
      Math.min(18, cameraDistanceRef.current + e.deltaY * 0.005)
    );
    updateCameraPosition();
  };

  // Touch handlers for mobile / tablet gestures
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;

      cameraRotationRef.current.y -= deltaX * 0.008;
      cameraRotationRef.current.x = Math.max(
        -Math.PI / 2.2,
        Math.min(Math.PI / 2.2, cameraRotationRef.current.x + deltaY * 0.008)
      );

      updateCameraPosition();
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const deltaDist = currentDist - touchStartRef.current.dist;
      cameraDistanceRef.current = Math.max(
        2.5,
        Math.min(18, cameraDistanceRef.current - deltaDist * 0.02)
      );
      updateCameraPosition();
      touchStartRef.current.dist = currentDist;
    }
  };

  // Reset Camera View
  const handleResetCamera = () => {
    jarvisSound.playBlip();
    cameraDistanceRef.current = 7.5;
    cameraRotationRef.current = { x: 0.35, y: 0.5 };
    updateCameraPosition();
    if (modelGroupRef.current) {
      modelGroupRef.current.rotation.set(0, 0, 0);
    }
  };

  // Capture Snapshot from Three.js Viewport
  const handleCaptureSnapshot = () => {
    if (!rendererRef.current) return;
    jarvisSound.playSuccess();
    const dataUrl = rendererRef.current.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${model?.name.toLowerCase().replace(/\s+/g, "_") || "hologram"}_render.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div
      className={`relative w-full h-full min-h-[420px] rounded-2xl bg-slate-950/90 border border-cyan-500/30 overflow-hidden shadow-2xl backdrop-blur-xl select-none ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none min-h-screen" : ""
      } ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Futuristic Hologram HUD Overlays & Framing */}
      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
        {/* Top HUD Bar */}
        <div className="flex items-start justify-between">
          {/* Top Left: Model Telemetry Label */}
          <div className="bg-slate-950/80 border border-cyan-500/40 rounded-xl p-3 backdrop-blur-md shadow-lg pointer-events-auto max-w-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] font-mono tracking-widest text-cyan-300 uppercase font-bold">
                HOLOGRAPHIC MATRIX 3D
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800 font-mono">
                {model?.category.toUpperCase() || "PROTOTYPE"}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-1 leading-tight line-clamp-1">
              {model?.name || "Holographic Projection"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
              {model?.description || "Spatial geometry compiled and loaded into buffer."}
            </p>
          </div>

          {/* Top Right: Quick Viewport Action Controls */}
          <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/80 border border-slate-800/80 rounded-xl p-1.5 backdrop-blur-md">
            {onOpenARMode && (
              <button
                id="viewport-open-ar-btn"
                onClick={() => {
                  jarvisSound.playActivationChime();
                  onOpenARMode();
                }}
                title="Project Hologram on Me (AR Face Cam)"
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 hover:opacity-90 transition-all shadow-md shadow-amber-500/20 cursor-pointer animate-pulse"
              >
                <Camera className="w-3.5 h-3.5" /> Project on Me
              </button>
            )}

            <button
              id="hologram-toggle-autorotate-btn"
              onClick={() => {
                jarvisSound.playBlip();
                setIsAutoRotating(!isAutoRotating);
              }}
              title="Toggle Auto-Rotation"
              className={`p-2 rounded-lg text-xs transition-all cursor-pointer ${
                isAutoRotating
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <RotateCw className={`w-4 h-4 ${isAutoRotating ? "animate-spin" : ""}`} />
            </button>

            <button
              id="hologram-reset-camera-btn"
              onClick={handleResetCamera}
              title="Reset Camera View"
              className="p-2 rounded-lg text-xs text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              id="hologram-snapshot-btn"
              onClick={handleCaptureSnapshot}
              title="Download High-Res Snapshot"
              className="p-2 rounded-lg text-xs text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button
              id="hologram-toggle-settings-btn"
              onClick={() => {
                jarvisSound.playBlip();
                setShowControls(!showControls);
              }}
              title="Hologram Render Settings"
              className={`p-2 rounded-lg text-xs transition-all cursor-pointer ${
                showControls
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              id="hologram-fullscreen-btn"
              onClick={() => {
                jarvisSound.playBlip();
                setIsFullscreen(!isFullscreen);
              }}
              title="Toggle Fullscreen"
              className="p-2 rounded-lg text-xs text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Floating Settings Panel (Collapsible) */}
        {showControls && (
          <div className="absolute top-20 right-4 w-72 bg-slate-950/95 border border-cyan-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-xl pointer-events-auto flex flex-col gap-3.5 z-20 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> RENDER PROTOCOLS
              </span>
              <button
                onClick={() => setShowControls(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Color Scheme Picker */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase mb-1.5 block">
                Hologram Spectrum
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: "cyan", name: "Arc Cyan", color: "#06b6d4" },
                  { id: "gold_crimson", name: "Stark Gold", color: "#f59e0b" },
                  { id: "matrix_emerald", name: "Emerald", color: "#10b981" },
                  { id: "amethyst", name: "Quantum", color: "#c084fc" },
                  { id: "white_wire", name: "Blueprint", color: "#f8fafc" },
                ].map((paletteOption) => (
                  <button
                    key={paletteOption.id}
                    onClick={() => {
                      jarvisSound.playBlip();
                      onUpdateConfig?.({ colorScheme: paletteOption.id as any });
                    }}
                    title={paletteOption.name}
                    className={`h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      currentScheme === paletteOption.id
                        ? "border-cyan-300 scale-105 ring-2 ring-cyan-500/50"
                        : "border-slate-800 hover:border-slate-600"
                    }`}
                    style={{ backgroundColor: paletteOption.color + "33" }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: paletteOption.color }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Exploded Disassembly Slider */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase mb-1">
                <span>Exploded View</span>
                <span className="text-cyan-300 font-bold">{Math.round(explodedVal * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={explodedVal ?? 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setExplodedVal(val);
                  onUpdateConfig?.({ explodedFactor: val });
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Wireframe vs Solid Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">Wireframe Only</span>
              <button
                onClick={() => {
                  jarvisSound.playBlip();
                  onUpdateConfig?.({ wireframe: !isWireframeOnly });
                }}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  isWireframeOnly ? "bg-cyan-500" : "bg-slate-800"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                    isWireframeOnly ? "translate-x-5.5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Bottom HUD Bar (Hotspots & Diagnostics) */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-2 pointer-events-auto">
          {/* Active Hotspots Pills */}
          {model?.geometryData.hotspots && model.geometryData.hotspots.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-w-lg bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 backdrop-blur-md">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1 self-center mr-1">
                <Activity className="w-3 h-3 text-cyan-400" /> HOTSPOTS:
              </span>
              {model.geometryData.hotspots.map((hs) => (
                <button
                  key={hs.id}
                  onClick={() => {
                    jarvisSound.playBlip();
                    setActiveHotspot(activeHotspot?.id === hs.id ? null : hs);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeHotspot?.id === hs.id
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/40"
                      : "bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400"
                  }`}
                >
                  <span>{hs.title}</span>
                  {hs.stat && (
                    <span className="text-[10px] opacity-80 border-l border-cyan-400/40 pl-1.5">
                      {hs.stat}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Gesture Instruction */}
          <div className="text-[10px] font-mono text-slate-500 bg-slate-950/70 border border-slate-900 rounded-lg px-2.5 py-1 backdrop-blur-sm hidden sm:block">
            DRAG TO ROTATE • SCROLL TO ZOOM • PINCH ON TOUCH
          </div>
        </div>

        {/* Hotspot Detail Card Modal (if selected) */}
        {activeHotspot && (
          <div className="absolute bottom-16 left-4 max-w-sm bg-slate-950/95 border border-cyan-400 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl pointer-events-auto animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" /> {activeHotspot.title}
              </span>
              <button
                onClick={() => setActiveHotspot(null)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{activeHotspot.description}</p>
            {activeHotspot.stat && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">TELEMETRY:</span>
                <span className="text-cyan-400 font-bold">{activeHotspot.stat}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hologram Reticle Corner Brackets */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500/60 pointer-events-none" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-500/60 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-500/60 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500/60 pointer-events-none" />
    </div>
  );
};

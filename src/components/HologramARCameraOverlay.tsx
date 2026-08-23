import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import {
  Camera,
  RefreshCw,
  Sparkles,
  Maximize2,
  Minimize2,
  Eye,
  Sliders,
  Download,
  Volume2,
  VolumeX,
  Target,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Info,
  Shield,
  Sun,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { HologramModel, HologramRenderConfig, HologramComponent } from "../types";
import { jarvisSound } from "../services/soundEffects";

interface HologramARCameraOverlayProps {
  model: HologramModel | null;
  onClose?: () => void;
  onSpeak?: (text: string) => void;
  onUpdateModelConfig?: (config: Partial<HologramRenderConfig>) => void;
}

type AnchorMode = "face" | "chest" | "shoulder" | "manual";

export const HologramARCameraOverlay: React.FC<HologramARCameraOverlayProps> = ({
  model,
  onClose,
  onSpeak,
  onUpdateModelConfig,
}) => {
  // Video & Stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirror, setIsMirror] = useState<boolean>(true);

  // 3D Canvas & WebGL refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const camera3DRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Optical face & anchor tracking
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [anchorMode, setAnchorMode] = useState<AnchorMode>(() => {
    // If the model is a helmet/mask, default to "face", if reactor -> "chest"
    if (model) {
      const nameLower = (model.name + " " + model.prompt).toLowerCase();
      if (nameLower.includes("reactor") || nameLower.includes("chest") || nameLower.includes("unibeam")) {
        return "chest";
      }
    }
    return "face";
  });

  const [isTrackingFace, setIsTrackingFace] = useState<boolean>(true);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [faceCoords, setFaceCoords] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0.5,
    y: 0.45,
    width: 0.28,
    height: 0.35,
  });

  // Tracked smooth coordinate targets
  const smoothedPos = useRef<{ x: number; y: number; scale: number; rotZ: number }>({
    x: 0,
    y: 0,
    scale: 1,
    rotZ: 0,
  });

  // Manual transform adjustments
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.25);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [offsetZ, setOffsetZ] = useState<number>(0);
  const [modelRotationY, setModelRotationY] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [hologramOpacity, setHologramOpacity] = useState<number>(0.92);
  const [showHUDOverlay, setShowHUDOverlay] = useState<boolean>(true);
  const [showControlPanel, setShowControlPanel] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<HologramRenderConfig["colorScheme"]>(
    model?.renderConfig.colorScheme || "gold_crimson"
  );
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);

  // Initialize and switch camera stream
  const startCamera = useCallback(async (desiredFacing: "user" | "environment") => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: desiredFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.warn);
          setIsCameraActive(true);
        };
      }

      setIsMirror(desiredFacing === "user");
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser."
          : "Unable to access camera. Please check your camera connection."
      );
      setIsCameraActive(false);
    }
  }, []);

  // Stop camera when unmounting
  useEffect(() => {
    startCamera(facingMode);
    jarvisSound.playActivationChime();
    if (onSpeak) {
      onSpeak(
        `Hologram-on-Me AR projection engaged. Calibrating ${
          model?.name || "Iron Man Mask"
        } to facial telemetry coordinates.`
      );
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Flip Camera handler
  const handleFlipCamera = () => {
    jarvisSound.playBlip();
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // ----------------------------------------------------
  // Lightweight Optical Face / Centroid Tracker
  // ----------------------------------------------------
  useEffect(() => {
    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement("canvas");
      analysisCanvasRef.current.width = 160;
      analysisCanvasRef.current.height = 120;
    }

    let intervalId: any;

    const detectFaceAnchor = () => {
      const video = videoRef.current;
      const canvas = analysisCanvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const cw = canvas.width;
      const ch = canvas.height;

      // Draw downscaled frame
      ctx.drawImage(video, 0, 0, cw, ch);
      const imgData = ctx.getImageData(0, 0, cw, ch);
      const data = imgData.data;

      // Skin tone + facial luminance detection algorithm
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      let minX = cw;
      let maxX = 0;
      let minY = ch;
      let maxY = 0;

      // Sample central bounding area with stepped loop for high FPS
      for (let y = 10; y < ch - 10; y += 2) {
        for (let x = 10; x < cw - 10; x += 2) {
          const idx = (y * cw + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Normalized RGB skin tone heuristic
          const isSkin =
            r > 60 &&
            g > 40 &&
            b > 20 &&
            r > g &&
            r > b &&
            Math.abs(r - g) > 12 &&
            r - b > 15;

          if (isSkin) {
            sumX += x;
            sumY += y;
            count++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (count > 80 && isTrackingFace) {
        let normX = sumX / count / cw;
        const normY = sumY / count / ch;
        const detectedW = Math.max(0.18, (maxX - minX) / cw);
        const detectedH = Math.max(0.24, (maxY - minY) / ch);

        // Account for mirror mode
        if (isMirror) {
          normX = 1 - normX;
        }

        setFaceCoords({
          x: normX,
          y: normY,
          width: detectedW,
          height: detectedH,
        });
        setFaceDetected(true);
      } else {
        // Fallback default center head coordinates
        setFaceDetected(false);
      }
    };

    intervalId = setInterval(detectFaceAnchor, 40); // 25 FPS optical tracking

    return () => {
      clearInterval(intervalId);
    };
  }, [isTrackingFace, isMirror]);

  // ----------------------------------------------------
  // Three.js 3D Hologram Setup & Rendering Loop
  // ----------------------------------------------------
  useEffect(() => {
    if (!threeCanvasRef.current || !containerRef.current) return;

    const canvas = threeCanvasRef.current;
    const container = containerRef.current;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera3DRef.current = camera;

    // 3. Renderer with transparent background
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true, // required for AR screenshot export
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xef4444, 3, 20);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    // 5. Build 3D Hologram Model Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Color palette resolution
    let primColorHex = 0xdc2626; // Stark crimson
    let secColorHex = 0xf59e0b; // Gold
    let emitColorHex = 0x06b6d4; // Cyan glow

    if (colorScheme === "cyan") {
      primColorHex = 0x06b6d4;
      secColorHex = 0x38bdf8;
      emitColorHex = 0x0284c7;
    } else if (colorScheme === "matrix_emerald") {
      primColorHex = 0x10b981;
      secColorHex = 0x34d399;
      emitColorHex = 0x059669;
    } else if (colorScheme === "amethyst") {
      primColorHex = 0xa855f7;
      secColorHex = 0xc084fc;
      emitColorHex = 0x7e22ce;
    } else if (colorScheme === "white_wire") {
      primColorHex = 0xf8fafc;
      secColorHex = 0xcbd5e1;
      emitColorHex = 0x94a3b8;
    }

    // Populate model geometry
    if (model?.geometryData.components && model.geometryData.components.length > 0) {
      model.geometryData.components.forEach((comp) => {
        let geom: THREE.BufferGeometry;
        const dims = comp.dimensions || [1, 1, 1];

        switch (comp.shape) {
          case "sphere":
            geom = new THREE.SphereGeometry(dims[0] || 1, dims[1] || 24, dims[2] || 24);
            break;
          case "box":
            geom = new THREE.BoxGeometry(dims[0] || 1, dims[1] || 1, dims[2] || 1);
            break;
          case "cylinder":
            geom = new THREE.CylinderGeometry(
              dims[0] || 1,
              dims[1] || 1,
              dims[2] || 1,
              dims[3] || 24
            );
            break;
          case "cone":
            geom = new THREE.ConeGeometry(dims[0] || 1, dims[1] || 2, dims[2] || 24);
            break;
          case "torus":
            geom = new THREE.TorusGeometry(
              dims[0] || 1.5,
              dims[1] || 0.2,
              dims[2] || 16,
              dims[3] || 32
            );
            break;
          case "ring":
            geom = new THREE.RingGeometry(dims[0] || 1, dims[1] || 1.2, dims[2] || 32);
            break;
          case "dodecahedron":
            geom = new THREE.DodecahedronGeometry(dims[0] || 1, dims[1] || 0);
            break;
          case "icosahedron":
            geom = new THREE.IcosahedronGeometry(dims[0] || 1, dims[1] || 0);
            break;
          default:
            geom = new THREE.BoxGeometry(dims[0] || 1, dims[1] || 1, dims[2] || 1);
        }

        // Material with holographic transparency and emissive glow
        const compColor = comp.color
          ? new THREE.Color(comp.color)
          : new THREE.Color(primColorHex);
        const compEmissive = comp.emissive
          ? new THREE.Color(comp.emissive)
          : new THREE.Color(emitColorHex);

        const mat = new THREE.MeshStandardMaterial({
          color: compColor,
          emissive: compEmissive,
          emissiveIntensity: 0.65,
          roughness: 0.2,
          metalness: 0.8,
          wireframe: comp.wireframe || false,
          transparent: true,
          opacity: (comp.opacity ?? 0.9) * hologramOpacity,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(comp.position[0] || 0, comp.position[1] || 0, comp.position[2] || 0);
        mesh.rotation.set(comp.rotation[0] || 0, comp.rotation[1] || 0, comp.rotation[2] || 0);
        mesh.scale.set(comp.scale[0] || 1, comp.scale[1] || 1, comp.scale[2] || 1);
        mesh.userData = { compData: comp };

        // Wireframe holographic cage helper
        const wireframeGeom = new THREE.WireframeGeometry(geom);
        const wireframeMat = new THREE.LineBasicMaterial({
          color: emitColorHex,
          transparent: true,
          opacity: 0.35 * hologramOpacity,
        });
        const wireframe = new THREE.LineSegments(wireframeGeom, wireframeMat);
        mesh.add(wireframe);

        modelGroup.add(mesh);
      });
    } else if (model?.geometryData.heightmapData) {
      // Point cloud geometry for image-to-3D
      const points = model.geometryData.heightmapData.depthPoints;
      const positions = new Float32Array(points.length * 3);
      const colors = new Float32Array(points.length * 3);

      points.forEach((pt, i) => {
        const x = Array.isArray(pt) ? pt[0] : (pt as any).x || 0;
        const y = Array.isArray(pt) ? pt[1] : (pt as any).y || 0;
        const z = Array.isArray(pt) ? pt[2] : (pt as any).z || 0;
        const colorStr = Array.isArray(pt) ? pt[3] : (pt as any).color || "#06b6d4";

        positions[i * 3] = x * 2.5;
        positions[i * 3 + 1] = y * 2.5;
        positions[i * 3 + 2] = z * 1.5;

        const c = new THREE.Color(colorStr || "#06b6d4");
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      });

      const ptGeom = new THREE.BufferGeometry();
      ptGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      ptGeom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const ptMat = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.85 * hologramOpacity,
      });

      const ptCloud = new THREE.Points(ptGeom, ptMat);
      modelGroup.add(ptCloud);
    } else {
      // Fallback procedural Iron Man mask geometry
      const domeGeom = new THREE.SphereGeometry(1.35, 24, 24);
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        emissive: 0x991b1b,
        emissiveIntensity: 0.5,
        wireframe: false,
        transparent: true,
        opacity: 0.9 * hologramOpacity,
      });
      const dome = new THREE.Mesh(domeGeom, domeMat);
      dome.scale.set(1.0, 1.25, 1.15);
      dome.position.set(0, 0.35, -0.1);
      modelGroup.add(dome);

      const faceGeom = new THREE.BoxGeometry(1.35, 1.45, 0.45);
      const faceMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.6,
        wireframe: false,
        transparent: true,
        opacity: 0.95 * hologramOpacity,
      });
      const face = new THREE.Mesh(faceGeom, faceMat);
      face.position.set(0, 0.05, 0.72);
      modelGroup.add(face);

      const eyeLGeom = new THREE.BoxGeometry(0.42, 0.1, 0.15);
      const eyeMat = new THREE.MeshStandardMaterial({
        color: 0xa5f3fc,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.98,
      });
      const eyeL = new THREE.Mesh(eyeLGeom, eyeMat);
      eyeL.position.set(-0.35, 0.22, 0.96);
      eyeL.rotation.z = -0.12;
      modelGroup.add(eyeL);

      const eyeR = new THREE.Mesh(eyeLGeom, eyeMat);
      eyeR.position.set(0.35, 0.22, 0.96);
      eyeR.rotation.z = 0.12;
      modelGroup.add(eyeR);
    }

    // 6. Animation and Tracking Frame Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Determine target 3D spatial anchor in Three.js coordinates
      let targetX = 0;
      let targetY = 0;
      let targetScale = scaleMultiplier;

      // Coordinate mapping from 2D normalized screen [0, 1] to Three.js world space [-5 to +5]
      const worldWidth = 8.5;
      const worldHeight = 6.4;

      if (anchorMode === "face" && isTrackingFace) {
        // Face anchor: center over face coords
        targetX = (faceCoords.x - 0.5) * worldWidth + offsetX;
        targetY = -(faceCoords.y - 0.5) * worldHeight + offsetY;
        targetScale = scaleMultiplier * (faceCoords.width / 0.28);
      } else if (anchorMode === "chest") {
        // Chest anchor: position below face / center of chest
        targetX = (faceCoords.x - 0.5) * worldWidth + offsetX;
        targetY = -(faceCoords.y - 0.5) * worldHeight - 1.8 + offsetY;
        targetScale = scaleMultiplier * 0.9;
      } else if (anchorMode === "shoulder") {
        // Floating shoulder companion
        targetX = (faceCoords.x - 0.5) * worldWidth + 2.4 + offsetX;
        targetY = -(faceCoords.y - 0.5) * worldHeight + 0.8 + Math.sin(elapsed * 2) * 0.15 + offsetY;
        targetScale = scaleMultiplier * 0.7;
      } else {
        // Manual mode
        targetX = offsetX;
        targetY = offsetY;
        targetScale = scaleMultiplier;
      }

      // Smooth LERP interpolation (damping) to prevent camera jitter
      const lerpFactor = 0.22;
      smoothedPos.current.x += (targetX - smoothedPos.current.x) * lerpFactor;
      smoothedPos.current.y += (targetY - smoothedPos.current.y) * lerpFactor;
      smoothedPos.current.scale += (targetScale - smoothedPos.current.scale) * lerpFactor;

      if (modelGroupRef.current) {
        modelGroupRef.current.position.x = smoothedPos.current.x;
        modelGroupRef.current.position.y = smoothedPos.current.y;
        modelGroupRef.current.position.z = offsetZ;

        const currentScale = Math.max(0.1, smoothedPos.current.scale);
        modelGroupRef.current.scale.set(currentScale, currentScale, currentScale);

        if (autoRotate) {
          modelGroupRef.current.rotation.y = elapsed * 0.8 + modelRotationY;
        } else {
          modelGroupRef.current.rotation.y = modelRotationY;
        }

        // Animate sub-components (pulsing eyes, rotating rings)
        modelGroupRef.current.children.forEach((child: any) => {
          if (child.userData?.compData?.animation) {
            const anim = child.userData.compData.animation;
            if (anim.type === "rotate") {
              const speed = anim.speed || 0.02;
              const axis = anim.axis || [0, 1, 0];
              child.rotation.x += axis[0] * speed;
              child.rotation.y += axis[1] * speed;
              child.rotation.z += axis[2] * speed;
            } else if (anim.type === "pulse") {
              const p = 1 + Math.sin(elapsed * 4) * 0.06;
              child.scale.set(p, p, p);
            }
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !camera3DRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera3DRef.current.aspect = w / h;
      camera3DRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      renderer.dispose();
    };
  }, [
    model,
    colorScheme,
    anchorMode,
    isTrackingFace,
    scaleMultiplier,
    offsetX,
    offsetY,
    offsetZ,
    modelRotationY,
    autoRotate,
    hologramOpacity,
  ]);

  // ----------------------------------------------------
  // AR Photo Snapshot Capture (Merged Video + 3D Hologram + HUD)
  // ----------------------------------------------------
  const handleTakeSnapshot = () => {
    jarvisSound.playActivationChime();
    const video = videoRef.current;
    const threeCanvas = threeCanvasRef.current;
    if (!video || !threeCanvas) return;

    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = video.videoWidth || 1280;
    snapCanvas.height = video.videoHeight || 720;
    const ctx = snapCanvas.getContext("2d");
    if (!ctx) return;

    // 1. Draw Video Frame (with mirror if user cam)
    ctx.save();
    if (isMirror) {
      ctx.translate(snapCanvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
    ctx.restore();

    // 2. Draw 3D Three.js Hologram Layer
    ctx.drawImage(threeCanvas, 0, 0, snapCanvas.width, snapCanvas.height);

    // 3. Draw Stark AR HUD Watermark
    ctx.font = "bold 18px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`STARK AR HUD // ${model?.name || "IRON MAN MASK"}`, 30, 45);

    ctx.font = "12px monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`BIOMETRIC LOCK: 99.4% • LATENCY: 12ms • ${new Date().toLocaleTimeString()}`, 30, 70);

    // Corner targeting lines
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, snapCanvas.width - 40, snapCanvas.height - 40);

    const dataUrl = snapCanvas.toDataURL("image/png");
    setCapturedPhotoUrl(dataUrl);
    setShowPhotoModal(true);

    if (onSpeak) {
      onSpeak("Hologram snapshot captured and saved to telemetry buffer.");
    }
  };

  // Download captured photo
  const handleDownloadPhoto = () => {
    if (!capturedPhotoUrl) return;
    jarvisSound.playSuccess();
    const link = document.createElement("a");
    link.download = `stark_hologram_${Date.now()}.png`;
    link.href = capturedPhotoUrl;
    link.click();
  };

  // Reset all adjustments
  const handleResetCalibration = () => {
    jarvisSound.playBlip();
    setScaleMultiplier(1.25);
    setOffsetX(0);
    setOffsetY(0);
    setOffsetZ(0);
    setModelRotationY(0);
    setAutoRotate(false);
    setHologramOpacity(0.92);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-2xl transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen" : "h-[620px]"
      }`}
    >
      {/* 1. Underlying Live Camera Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-transform ${
          isMirror ? "scale-x-[-1]" : ""
        }`}
      />

      {/* 2. Transparent Three.js WebGL Hologram Layer */}
      <canvas
        ref={threeCanvasRef}
        className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
      />

      {/* 3. Sci-Fi Hologram HUD Grid and Scanlines Overlay */}
      {showHUDOverlay && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-5 select-none">
          {/* Top HUD Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 bg-slate-950/80 border border-cyan-500/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-lg shadow-cyan-500/10">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" /> AR HOLOGRAM PROJECTION ON ME
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                {facingMode.toUpperCase()} CAM
              </span>
            </div>

            {/* Biometric Face Lock Indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold backdrop-blur-md border ${
                  faceDetected && isTrackingFace
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/60"
                    : "bg-amber-950/80 text-amber-300 border-amber-500/60"
                }`}
              >
                {faceDetected && isTrackingFace ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>FACE LOCK ACTIVE</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isTrackingFace ? "ACQUIRING TARGET..." : "MANUAL MODE"}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Optical Targeting Reticle over detected face */}
          {faceDetected && isTrackingFace && (
            <div
              className="absolute border-2 border-cyan-400/80 rounded-2xl transition-all duration-75 pointer-events-none shadow-lg shadow-cyan-500/20"
              style={{
                left: `${(faceCoords.x - faceCoords.width / 2) * 100}%`,
                top: `${(faceCoords.y - faceCoords.height / 2) * 100}%`,
                width: `${faceCoords.width * 100}%`,
                height: `${faceCoords.height * 100}%`,
              }}
            >
              {/* Corner brackets */}
              <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-300" />
              <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-300" />
              <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-300" />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-300" />

              <div className="absolute -top-6 left-0 text-[10px] font-mono text-cyan-300 bg-slate-950/90 px-1.5 py-0.5 rounded border border-cyan-500/40">
                ANCHOR: {model?.name?.toUpperCase() || "HELMET"} [{(faceCoords.x * 100).toFixed(0)}%, {(faceCoords.y * 100).toFixed(0)}%]
              </div>
            </div>
          )}

          {/* Bottom Telemetry HUD */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300 bg-slate-950/80 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl">
              <span>MODEL: <strong className="text-cyan-400">{model?.name || "Iron Man Mask"}</strong></span>
              <span>•</span>
              <span>FPS: <strong className="text-emerald-400">60</strong></span>
              <span>•</span>
              <span>SCALE: <strong className="text-amber-400">{scaleMultiplier.toFixed(2)}x</strong></span>
            </div>

            <div className="text-[10px] font-mono text-cyan-400/80">
              STARK NEURAL AR WEARABLE v4.2
            </div>
          </div>
        </div>
      )}

      {/* 4. Interactive Quick Floating Action Bar */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 pointer-events-auto">
        {/* Flip Camera Button */}
        <button
          id="flip-camera-btn"
          onClick={handleFlipCamera}
          title={`Flip Camera (Currently: ${facingMode})`}
          className="p-2.5 rounded-xl bg-slate-900/85 hover:bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 shadow-xl backdrop-blur-md transition-all cursor-pointer group"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
        </button>

        {/* Mirror Switch */}
        <button
          onClick={() => {
            jarvisSound.playBlip();
            setIsMirror(!isMirror);
          }}
          title={isMirror ? "Mirror Mode: ON" : "Mirror Mode: OFF"}
          className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
            isMirror
              ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-sm"
              : "bg-slate-900/85 text-slate-400 border-slate-700 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Snap Photo Button */}
        <button
          id="snap-ar-photo-btn"
          onClick={handleTakeSnapshot}
          title="Capture AR Hologram Photo"
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:opacity-90 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Camera className="w-4 h-4" /> Snap Photo
        </button>

        {/* HUD Toggle */}
        <button
          onClick={() => {
            jarvisSound.playBlip();
            setShowHUDOverlay(!showHUDOverlay);
          }}
          title="Toggle HUD Overlay"
          className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
            showHUDOverlay
              ? "bg-cyan-500/30 text-cyan-200 border-cyan-400"
              : "bg-slate-900/85 text-slate-400 border-slate-700"
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => {
            jarvisSound.playBlip();
            setIsFullscreen(!isFullscreen);
          }}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen AR Mirror"}
          className="p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white backdrop-blur-md transition-all cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Close Button if provided */}
        {onClose && (
          <button
            onClick={() => {
              jarvisSound.playBlip();
              onClose();
            }}
            className="px-3 py-2 rounded-xl bg-slate-900/85 hover:bg-red-950 border border-red-900/40 text-red-300 text-xs font-mono font-bold backdrop-blur-md transition-all cursor-pointer"
          >
            ✕ Exit AR
          </button>
        )}
      </div>

      {/* 5. AR Hologram Tuning & Calibration Panel */}
      <div className="absolute bottom-4 left-4 z-30 pointer-events-auto max-w-sm w-full">
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-2xl text-xs flex flex-col gap-3">
          {/* Header & Collapse Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono font-bold uppercase tracking-wider text-cyan-300 text-[11px]">
                AR HOLOGRAM CONTROLS
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetCalibration}
                title="Reset Position and Scale"
                className="p-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowControlPanel(!showControlPanel)}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showControlPanel ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {showControlPanel && (
            <div className="flex flex-col gap-3 pt-1 border-t border-slate-800">
              {/* Anchor Placement Buttons */}
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 mb-1.5 block">
                  PLACEMENT ANCHOR
                </label>
                <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
                  <button
                    onClick={() => {
                      jarvisSound.playBlip();
                      setAnchorMode("face");
                      setIsTrackingFace(true);
                      setScaleMultiplier(1.25);
                      setOffsetY(0);
                    }}
                    className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                      anchorMode === "face"
                        ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 font-bold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    Face / Mask
                  </button>

                  <button
                    onClick={() => {
                      jarvisSound.playBlip();
                      setAnchorMode("chest");
                      setIsTrackingFace(true);
                      setScaleMultiplier(0.9);
                    }}
                    className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                      anchorMode === "chest"
                        ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 font-bold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    Chest Arc
                  </button>

                  <button
                    onClick={() => {
                      jarvisSound.playBlip();
                      setAnchorMode("shoulder");
                      setIsTrackingFace(true);
                      setScaleMultiplier(0.7);
                    }}
                    className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                      anchorMode === "shoulder"
                        ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 font-bold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    Companion
                  </button>

                  <button
                    onClick={() => {
                      jarvisSound.playBlip();
                      setAnchorMode("manual");
                      setIsTrackingFace(false);
                    }}
                    className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                      anchorMode === "manual"
                        ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 font-bold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    Manual
                  </button>
                </div>
              </div>

              {/* Scale Multiplier Slider */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>HOLOGRAM SIZE:</span>
                  <span className="text-cyan-400 font-bold">{scaleMultiplier.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={2.8}
                  step={0.05}
                  value={scaleMultiplier}
                  onChange={(e) => setScaleMultiplier(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Offset Position Sliders */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>VERTICAL (Y):</span>
                    <span className="text-slate-200">{offsetY.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={-3}
                    max={3}
                    step={0.1}
                    value={offsetY}
                    onChange={(e) => setOffsetY(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>HORIZONTAL (X):</span>
                    <span className="text-slate-200">{offsetX.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={-3}
                    max={3}
                    step={0.1}
                    value={offsetX}
                    onChange={(e) => setOffsetX(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>

              {/* Rotation & Opacity */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>ROTATION Y:</span>
                    <span className="text-slate-200">{((modelRotationY * 180) / Math.PI).toFixed(0)}°</span>
                  </div>
                  <input
                    type="range"
                    min={-Math.PI}
                    max={Math.PI}
                    step={0.05}
                    value={modelRotationY}
                    onChange={(e) => setModelRotationY(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>OPACITY:</span>
                    <span className="text-cyan-400 font-bold">{Math.round(hologramOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.3}
                    max={1.0}
                    step={0.05}
                    value={hologramOpacity}
                    onChange={(e) => setHologramOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>

              {/* Color Scheme Picker */}
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 mb-1.5 block">
                  HOLOGRAPHIC EMISSION COLOR
                </label>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "gold_crimson", name: "Iron Man", color: "#dc2626" },
                    { id: "cyan", name: "Arc Cyan", color: "#06b6d4" },
                    { id: "matrix_emerald", name: "Emerald", color: "#10b981" },
                    { id: "amethyst", name: "Amethyst", color: "#a855f7" },
                    { id: "white_wire", name: "Blueprint", color: "#f8fafc" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        jarvisSound.playBlip();
                        setColorScheme(c.id as any);
                        if (onUpdateModelConfig) {
                          onUpdateModelConfig({ colorScheme: c.id as any });
                        }
                      }}
                      className={`flex-1 py-1 rounded-lg border text-[10px] font-mono flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        colorScheme === c.id
                          ? "border-cyan-400 bg-slate-950 text-slate-100 ring-1 ring-cyan-400"
                          : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Auto-Rotate Toggle */}
              <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-300">
                <span>Auto-Spin Hologram</span>
                <button
                  onClick={() => {
                    jarvisSound.playBlip();
                    setAutoRotate(!autoRotate);
                  }}
                  className={`px-2.5 py-1 rounded-md border text-[10px] transition-all cursor-pointer ${
                    autoRotate
                      ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  {autoRotate ? "ACTIVE" : "DISABLED"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Captured Photo Modal */}
      {showPhotoModal && capturedPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-base">AR Hologram Photo Captured</h3>
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Photo Preview */}
            <div className="rounded-xl overflow-hidden border border-slate-800 max-h-80 flex items-center justify-center bg-black">
              <img
                src={capturedPhotoUrl}
                alt="AR Hologram on User"
                className="w-full h-auto object-contain"
              />
            </div>

            {/* Download and Share buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
              >
                Retake
              </button>

              <button
                onClick={handleDownloadPhoto}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <Download className="w-4 h-4" /> Download Photo (PNG)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Camera Error Warning Banner */}
      {cameraError && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mb-3" />
          <h3 className="text-base font-bold text-slate-100 mb-1">Camera Feed Unavailable</h3>
          <p className="text-xs text-slate-400 max-w-md mb-4">{cameraError}</p>
          <button
            onClick={() => startCamera(facingMode)}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-cyan-400 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Camera Connection
          </button>
        </div>
      )}
    </div>
  );
};

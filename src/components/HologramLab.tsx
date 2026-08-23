import React, { useState, useEffect, useRef } from "react";
import {
  HologramModel,
  HologramRenderConfig,
  HologramComponent,
} from "../types";
import {
  HologramStorageService,
  DEFAULT_HOLOGRAM_MODELS,
} from "../services/hologramStore";
import { HologramViewport } from "./HologramViewport";
import { HologramARCameraOverlay } from "./HologramARCameraOverlay";
import {
  Box,
  Layers,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Mic,
  MicOff,
  Send,
  Download,
  Trash2,
  Copy,
  Plus,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Cpu,
  Eye,
  FileCode,
  Tag,
  Radio,
  Camera,
} from "lucide-react";
import { jarvisSound } from "../services/soundEffects";

interface HologramLabProps {
  onSpeak?: (text: string) => void;
}

const IDEA_SUGGESTIONS = [
  "Iron Man Mark 85 Combat Helmet with glowing cyan eyes, gold faceplate, and crimson cranium",
  "Mark VII Arc Reactor with dual rotating magnetic rings and glowing unibeam plasma",
  "Cyberpunk Recon Drone with 4 ducted thrusters, sensor pod, and optical scanner",
  "Futuristic Stark Tower with rooftop landing pad, perimeter glass facade, and antenna",
  "Quantum Computing Qubit Crystal with orbiting entanglement nodes",
  "Hyperloop Supersonic Pod with magnetic levitation runners and aerodynamic nose",
];

export const HologramLab: React.FC<HologramLabProps> = ({ onSpeak }) => {
  // Models state
  const [models, setModels] = useState<HologramModel[]>([]);
  const [activeModel, setActiveModel] = useState<HologramModel | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<HologramComponent | null>(null);

  // Creation & Generation states
  const [creationMode, setCreationMode] = useState<"idea" | "image">("idea");
  const [ideaPrompt, setIdeaPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatusText, setGenStatusText] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Image Upload state
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"projector" | "ar_on_me" | "library" | "inspector">("projector");

  // Load models on mount
  useEffect(() => {
    const loaded = HologramStorageService.getStoredModels();
    setModels(loaded);
    if (loaded.length > 0) {
      setActiveModel(loaded[0]);
    }
  }, []);

  // Update render config on active model
  const handleUpdateConfig = (newConfig: Partial<HologramRenderConfig>) => {
    if (!activeModel) return;
    const updated: HologramModel = {
      ...activeModel,
      renderConfig: {
        ...activeModel.renderConfig,
        ...newConfig,
      },
    };
    setActiveModel(updated);
    const updatedList = HologramStorageService.updateModel(updated);
    setModels(updatedList);
  };

  // Generate 3D Model from Natural Language Idea
  const handleGenerateFromIdea = async (promptToUse?: string) => {
    const prompt = (promptToUse || ideaPrompt).trim();
    if (!prompt) return;

    setIsGenerating(true);
    setGenStatusText("Initiating quantum spatial synthesizer...");
    jarvisSound.playBlip();

    try {
      setGenStatusText("Transcribing procedural 3D primitives via Gemini 3.7 Core...");
      const res = await fetch("/api/jarvis/generate-3d-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaPrompt: prompt,
          colorScheme: activeModel?.renderConfig.colorScheme || "cyan",
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.model) {
        setGenStatusText("Compiling 3D mesh shaders & storing in holographic matrix...");
        const updatedList = HologramStorageService.addModel(data.model);
        setModels(updatedList);
        setActiveModel(data.model);
        const isMaskPrompt =
          prompt.toLowerCase().includes("mask") ||
          prompt.toLowerCase().includes("helmet") ||
          prompt.toLowerCase().includes("face") ||
          prompt.toLowerCase().includes("on me") ||
          prompt.toLowerCase().includes("wear");
        if (isMaskPrompt) {
          setActiveTab("ar_on_me");
        } else {
          setActiveTab("projector");
        }
        jarvisSound.playSuccess();
        if (onSpeak) {
          onSpeak(
            isMaskPrompt
              ? `Holographic mask ${data.model.name} synthesized. Activating camera AR overlay on your face.`
              : `Holographic model ${data.model.name} synthesized and projected successfully.`
          );
        }
      }
    } catch (err: any) {
      console.error("Idea to 3D error:", err);
      // Create intelligent procedural fallback if offline
      const fallbackModel: HologramModel = {
        id: "holo_gen_" + Date.now(),
        name: prompt.slice(0, 32) + " Matrix",
        description: `Procedural 3D holographic projection constructed from prompt: "${prompt}".`,
        prompt: prompt,
        sourceType: "idea",
        createdAt: new Date().toISOString(),
        tags: ["Synthesized", "Hologram", "3D Model"],
        category: "custom",
        renderConfig: {
          colorScheme: "cyan",
          wireframe: false,
          pointCloud: false,
          particleDensity: 60,
          rotationSpeed: 0.018,
          explodedFactor: 0,
          scanlines: true,
          glowIntensity: 1.8,
        },
        geometryData: {
          type: "components",
          components: [
            {
              id: "core_mesh",
              name: "Primary Central Node",
              shape: "dodecahedron",
              dimensions: [1.8, 0],
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
              color: "#06b6d4",
              emissive: "#0891b2",
              opacity: 0.9,
              wireframe: true,
              animation: { type: "rotate", speed: 0.02, axis: [1, 1, 0] },
            },
            {
              id: "outer_ring",
              name: "Field Stabilizer Ring",
              shape: "torus",
              dimensions: [2.8, 0.18, 16, 48],
              position: [0, 0, 0],
              rotation: [Math.PI / 4, 0, 0],
              scale: [1, 1, 1],
              color: "#38bdf8",
              emissive: "#0284c7",
              opacity: 0.8,
              wireframe: true,
              animation: { type: "rotate", speed: -0.03, axis: [0, 1, 0] },
            },
            {
              id: "base_radiator",
              name: "Thermal Conduit Array",
              shape: "cylinder",
              dimensions: [1.2, 1.2, 0.4, 24],
              position: [0, -1.8, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
              color: "#1e293b",
              emissive: "#0f172a",
              opacity: 0.9,
              wireframe: false,
            },
          ],
          hotspots: [
            {
              id: "h_core",
              title: "Synthesized Core",
              description: "Volumetric field frequency stabilized at 432 MHz",
              position: [0, 0, 1.2],
              stat: "Nominal Flux",
            },
          ],
        },
      };
      const updatedList = HologramStorageService.addModel(fallbackModel);
      setModels(updatedList);
      setActiveModel(fallbackModel);
      setActiveTab("projector");
      jarvisSound.playSuccess();
      if (onSpeak) {
        onSpeak(`Holographic model ${fallbackModel.name} synthesized and projected.`);
      }
    } finally {
      setIsGenerating(false);
      setGenStatusText("");
      setIdeaPrompt("");
    }
  };

  // Convert Uploaded Image automatically into 3D Hologram
  const handleProcessImageTo3D = async (imageData: string, customPrompt?: string) => {
    setIsProcessingImage(true);
    setGenStatusText("Analyzing 2D luminance, depth contours & spatial topology...");
    jarvisSound.playBlip();

    try {
      // 1. First trigger client-side volumetric depth point cloud generation
      const depthData = await HologramStorageService.processImageToDepthPoints(imageData, 56);

      // 2. Also query Gemini backend for AI Component Mesh Reconstruction
      let aiReconstructedModel: HologramModel | null = null;
      try {
        setGenStatusText("Deconstructing image into 3D component hierarchy via Gemini Vision...");
        const res = await fetch("/api/jarvis/image-to-3d", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: imageData,
            prompt: customPrompt || imagePrompt,
            colorScheme: activeModel?.renderConfig.colorScheme || "cyan",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.model) {
            aiReconstructedModel = data.model;
          }
        }
      } catch (aiErr) {
        console.warn("AI 3D Image Reconstruction fallback:", aiErr);
      }

      // If AI generated components, use it with the image preview attached
      let newModel: HologramModel;
      if (aiReconstructedModel && aiReconstructedModel.geometryData.components?.length) {
        newModel = {
          ...aiReconstructedModel,
          sourceImage: imageData.length < 200000 ? imageData : undefined,
        };
      } else {
        // Construct Depth Pointcloud Hologram
        newModel = {
          id: "holo_img_" + Date.now(),
          name: "Volumetric Depth Matrix",
          description: "True 3D depth-extruded holographic point cloud extracted from image.",
          prompt: customPrompt || "Image depth extraction",
          sourceImage: imageData.length < 200000 ? imageData : undefined,
          sourceType: "image_depth",
          createdAt: new Date().toISOString(),
          tags: ["Image 3D", "Depth Cloud", "Photogrammetry"],
          category: "custom",
          renderConfig: {
            colorScheme: "cyan",
            wireframe: false,
            pointCloud: true,
            particleDensity: 80,
            rotationSpeed: 0.012,
            explodedFactor: 0,
            scanlines: true,
            glowIntensity: 1.6,
          },
          geometryData: {
            type: "heightmap_pointcloud",
            heightmapData: {
              width: depthData.width,
              height: depthData.height,
              depthPoints: depthData.depthPoints,
            },
            hotspots: [
              {
                id: "h_depth",
                title: "Depth Surface",
                description: `${depthData.depthPoints.length} Volumetric coordinate points extracted`,
                position: [0, 0, 1.2],
                stat: `${depthData.depthPoints.length} Vertices`,
              },
            ],
          },
        };
      }

      const updatedList = HologramStorageService.addModel(newModel);
      setModels(updatedList);
      setActiveModel(newModel);
      setActiveTab("projector");
      jarvisSound.playSuccess();
      if (onSpeak) {
        onSpeak(`Image converted into 3D hologram ${newModel.name}.`);
      }
    } catch (err: any) {
      console.error("Image to 3D failed:", err);
    } finally {
      setIsProcessingImage(false);
      setGenStatusText("");
    }
  };

  // Handle Image File Input / Drag & Drop
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setUploadedImagePreview(base64);
      handleProcessImageTo3D(base64);
    };
    reader.readAsDataURL(file);
  };

  // Speech Recognition for Idea Prompt
  const toggleSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      jarvisSound.playBlip();
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIdeaPrompt(transcript);
      setIsListening(false);
      jarvisSound.playSuccess();
      handleGenerateFromIdea(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Export Active Model as OBJ
  const handleExportOBJ = (model: HologramModel) => {
    jarvisSound.playSuccess();
    const objText = HologramStorageService.exportToOBJ(model);
    const blob = new Blob([objText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${model.name.toLowerCase().replace(/\s+/g, "_")}.obj`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Active Model as JSON
  const handleExportJSON = (model: HologramModel) => {
    jarvisSound.playSuccess();
    const jsonStr = JSON.stringify(model, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${model.name.toLowerCase().replace(/\s+/g, "_")}_hologram.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Delete Model
  const handleDeleteModel = (id: string) => {
    jarvisSound.playBlip();
    const updatedList = HologramStorageService.deleteModel(id);
    setModels(updatedList);
    if (activeModel?.id === id) {
      setActiveModel(updatedList[0] || null);
    }
  };

  // Duplicate Model
  const handleDuplicateModel = (model: HologramModel) => {
    jarvisSound.playSuccess();
    const copy: HologramModel = {
      ...model,
      id: "holo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      name: `${model.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    const updatedList = HologramStorageService.addModel(copy);
    setModels(updatedList);
    setActiveModel(copy);
  };

  // Filtered models
  const filteredModels = models.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat =
      activeCategoryFilter === "all" || m.category.toLowerCase() === activeCategoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Box className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                3D Holographic Laboratory
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                PROJECTION READY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated image-to-3D volumetric photogrammetry and Gemini neural spatial synthesis.
            </p>
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1.5 rounded-xl flex-wrap">
          <button
            id="tab-ar-on-me-btn"
            onClick={() => {
              jarvisSound.playActivationChime();
              setActiveTab("ar_on_me");
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "ar_on_me"
                ? "bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-red-950/40 text-amber-300 border border-red-900/60 hover:bg-red-900/40"
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Hologram on Me
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950/80 text-amber-300 border border-amber-500/40 font-mono">
              AR CAM
            </span>
          </button>

          <button
            id="tab-projector-btn"
            onClick={() => {
              jarvisSound.playBlip();
              setActiveTab("projector");
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "projector"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> 3D Viewport
          </button>

          <button
            id="tab-library-btn"
            onClick={() => {
              jarvisSound.playBlip();
              setActiveTab("library");
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "library"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" /> Archive ({models.length})
          </button>

          {activeModel?.geometryData.components && activeModel.geometryData.components.length > 0 && (
            <button
              id="tab-inspector-btn"
              onClick={() => {
                jarvisSound.playBlip();
                setActiveTab("inspector");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "inspector"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Sub-Components (
              {activeModel.geometryData.components.length})
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Creator Input Bar */}
      <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-xl flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> SPATIAL GENERATION ENGINE
            </span>
          </div>

          {/* Creation Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800 text-xs">
            <button
              onClick={() => {
                jarvisSound.playBlip();
                setCreationMode("idea");
              }}
              className={`px-3 py-1 rounded-md transition-all font-mono cursor-pointer ${
                creationMode === "idea"
                  ? "bg-cyan-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Idea to 3D
            </button>
            <button
              onClick={() => {
                jarvisSound.playBlip();
                setCreationMode("image");
              }}
              className={`px-3 py-1 rounded-md transition-all font-mono cursor-pointer ${
                creationMode === "image"
                  ? "bg-cyan-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Image to 3D
            </button>
          </div>
        </div>

        {/* Mode A: Natural Language Idea to 3D Model */}
        {creationMode === "idea" ? (
          <div className="flex flex-col gap-2.5">
            <div className="relative flex items-center">
              <input
                id="idea-to-3d-input"
                type="text"
                value={ideaPrompt ?? ""}
                onChange={(e) => setIdeaPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isGenerating) {
                    handleGenerateFromIdea();
                  }
                }}
                placeholder="Describe any 3D model (e.g., 'Arc Reactor with dual rotating rings and glowing unibeam core')..."
                className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl pl-4 pr-28 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
              />

              <div className="absolute right-2 flex items-center gap-1.5">
                <button
                  id="speech-idea-btn"
                  onClick={toggleSpeechRecognition}
                  title="Speak your idea"
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40"
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  id="generate-3d-btn"
                  onClick={() => handleGenerateFromIdea()}
                  disabled={isGenerating || !ideaPrompt.trim()}
                  className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      Synthesizing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Make 3D
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[10px] font-mono uppercase text-slate-500 whitespace-nowrap mr-1">
                PRESETS:
              </span>
              {IDEA_SUGGESTIONS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIdeaPrompt(preset);
                    handleGenerateFromIdea(preset);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-[11px] whitespace-nowrap transition-all cursor-pointer"
                >
                  {preset.split("with")[0].trim()}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Mode B: Image to 3D Automatic Converter */
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Drag & Drop Image Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) {
                  handleImageFile(e.dataTransfer.files[0]);
                }
              }}
              className="w-full sm:w-1/2 h-28 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-950/80 rounded-xl flex flex-col items-center justify-center p-3 cursor-pointer group transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform mb-1" />
              <p className="text-xs font-semibold text-slate-200">
                Drop image here or click to browse
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PNG, JPG, WebP • Auto-converts to 3D volumetric hologram
              </p>
            </div>

            {/* Image Preview & Focus Prompt */}
            <div className="w-full sm:w-1/2 flex flex-col gap-2">
              <input
                type="text"
                value={imagePrompt ?? ""}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Optional reconstruction focus (e.g. 'Extract mechanical wireframe')..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  {uploadedImagePreview ? "Active image loaded" : "No image uploaded yet"}
                </span>
                {uploadedImagePreview && (
                  <button
                    onClick={() => handleProcessImageTo3D(uploadedImagePreview, imagePrompt)}
                    disabled={isProcessingImage}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
                  >
                    {isProcessingImage ? "Re-processing..." : "Re-generate 3D"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Generation Progress Banner */}
        {(isGenerating || isProcessingImage) && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-xs font-mono text-cyan-300 animate-pulse">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
            <span>{genStatusText || "Synthesizing 3D spatial matrix..."}</span>
          </div>
        )}
      </div>

      {/* Dynamic Content View depending on Active Tab */}
      {activeTab === "ar_on_me" && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <HologramARCameraOverlay
            model={activeModel}
            onClose={() => setActiveTab("projector")}
            onSpeak={onSpeak}
            onUpdateModelConfig={handleUpdateConfig}
          />
        </div>
      )}

      {activeTab === "projector" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main 3D Viewport (3 Cols) */}
          <div className="lg:col-span-3 h-[520px]">
            <HologramViewport
              model={activeModel}
              onUpdateConfig={handleUpdateConfig}
              onSelectComponent={(comp) => setSelectedComponent(comp)}
              selectedComponentId={selectedComponent?.id}
              onOpenARMode={() => {
                jarvisSound.playActivationChime();
                setActiveTab("ar_on_me");
              }}
            />
          </div>

          {/* Right Sidebar: Active Model Telemetry & Actions */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {activeModel ? (
              <div className="bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-4.5 backdrop-blur-xl flex flex-col gap-4 h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                      MODEL TELEMETRY
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      {activeModel.sourceType.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-1">{activeModel.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {activeModel.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {activeModel.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-cyan-400 border border-cyan-900/50"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Specs Matrix */}
                <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800/80 flex flex-col gap-2 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Category:</span>
                    <span className="text-slate-200 capitalize">{activeModel.category}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Components:</span>
                    <span className="text-cyan-400 font-bold">
                      {activeModel.geometryData.components?.length ||
                        activeModel.geometryData.heightmapData?.depthPoints.length ||
                        0}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Created:</span>
                    <span className="text-slate-200">
                      {new Date(activeModel.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Export & Actions */}
                <div className="mt-auto flex flex-col gap-2 pt-2 border-t border-slate-800">
                  <button
                    id="sidebar-project-on-me-btn"
                    onClick={() => {
                      jarvisSound.playActivationChime();
                      setActiveTab("ar_on_me");
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-slate-950 text-xs font-mono font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> Hologram on Me (AR Cam)
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleExportOBJ(activeModel)}
                      title="Export as OBJ 3D mesh"
                      className="py-2 px-3 rounded-xl bg-slate-950 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Export OBJ
                    </button>

                    <button
                      onClick={() => handleExportJSON(activeModel)}
                      title="Export as Hologram JSON spec"
                      className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileCode className="w-3.5 h-3.5" /> Export JSON
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDuplicateModel(activeModel)}
                      className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicate
                    </button>

                    <button
                      onClick={() => handleDeleteModel(activeModel.id)}
                      className="py-2 px-3 rounded-xl bg-slate-950 border border-red-900/30 hover:border-red-500 text-red-400 text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full">
                <Box className="w-8 h-8 text-slate-600 mb-2" />
                No 3D hologram selected. Synthesize one or pick from the archive.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Archive / Library Tab View */}
      {activeTab === "library" && (
        <div className="bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Stark Industries Holographic Matrix Archive
              </h3>
              <p className="text-xs text-slate-400">
                Persistent storage of all generated, uploaded, and procedural 3D hologram models.
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={searchQuery ?? ""}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models or tags..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Model Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredModels.map((m) => {
              const isActive = activeModel?.id === m.id;
              return (
                <div
                  key={m.id}
                  className={`bg-slate-950/90 border rounded-xl p-4.5 flex flex-col justify-between gap-3 transition-all hover:scale-[1.01] ${
                    isActive
                      ? "border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-500/10"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase">
                        {m.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 line-clamp-1">{m.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {m.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {m.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          jarvisSound.playActivationChime();
                          setActiveModel(m);
                          setActiveTab("ar_on_me");
                        }}
                        title="Project hologram onto camera feed"
                        className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1 hover:opacity-90 transition-all cursor-pointer shadow-sm shadow-amber-500/10"
                      >
                        <Camera className="w-3 h-3" /> On Me
                      </button>

                      <button
                        onClick={() => {
                          jarvisSound.playSuccess();
                          setActiveModel(m);
                          setActiveTab("projector");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3" /> 3D
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleExportOBJ(m)}
                        title="Download OBJ"
                        className="p-1.5 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateModel(m)}
                        title="Duplicate"
                        className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteModel(m.id)}
                        title="Delete"
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inspector Tab: Component Hierarchy breakdown */}
      {activeTab === "inspector" && activeModel?.geometryData.components && (
        <div className="bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-5">
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Sub-Assembly Component Hierarchy: {activeModel.name}
            </h3>
            <p className="text-xs text-slate-400">
              Deconstructed geometric elements, shape primitives, and technical specifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activeModel.geometryData.components.map((comp, idx) => (
              <div
                key={comp.id || idx}
                onClick={() => {
                  jarvisSound.playBlip();
                  setSelectedComponent(comp);
                  setActiveTab("projector");
                }}
                className={`p-3.5 rounded-xl border bg-slate-950/80 cursor-pointer transition-all hover:border-cyan-400 ${
                  selectedComponent?.id === comp.id
                    ? "border-cyan-400 bg-cyan-950/20"
                    : "border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                    SHAPE: {comp.shape}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200">{comp.name}</h4>
                {comp.technicalNotes && (
                  <p className="text-xs text-slate-400 mt-1">{comp.technicalNotes}</p>
                )}

                <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>
                    POS: [{comp.position.map((v) => v.toFixed(1)).join(", ")}]
                  </span>
                  <span
                    className="w-3 h-3 rounded-full border border-slate-700"
                    style={{ backgroundColor: comp.color || "#06b6d4" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

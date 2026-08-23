import React, { useState, useRef } from "react";
import {
  X,
  Palette,
  Sliders,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
  Radio,
  Home,
  Activity,
  BarChart3,
  Brain,
  Layers,
  Box,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Grid,
  Link,
  Wand2,
  Trash2,
} from "lucide-react";
import { AppSettings, BackgroundThemeId, FeatureFlags } from "../types";
import { jarvisSound } from "../services/soundEffects";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetDefaults: () => void;
}

const PRESET_BACKGROUNDS: Array<{
  id: BackgroundThemeId;
  name: string;
  desc: string;
  gradient: string;
  accentColor: string;
}> = [
  {
    id: "stark_mark85_armor",
    name: "Mark 85 Titanium Chassis",
    desc: "Armored side pillars, circuit traces & dual concentric reactors (UI Design 3)",
    gradient: "from-slate-900 via-amber-950/40 to-slate-950 border-amber-500/50",
    accentColor: "#f59e0b",
  },
  {
    id: "orbital_telemetry_hud",
    name: "Orbital Planetary Telemetry",
    desc: "Orange star core, 3D orbits, radar calipers & hex telemetry (UI Design 2)",
    gradient: "from-orange-950/80 via-slate-950 to-cyan-950/80 border-orange-500/50",
    accentColor: "#fb923c",
  },
  {
    id: "iris_singularity_core",
    name: "Iris Core Singularity",
    desc: "Mechanical shutter rings, laser ticks & intense cyan flare (UI Design 1)",
    gradient: "from-cyan-950 via-slate-950 to-black border-cyan-400/50",
    accentColor: "#22d3ee",
  },
  {
    id: "cyan_grid",
    name: "Stark Cyan Grid",
    desc: "Holographic blueprint grid matrix",
    gradient: "from-cyan-950/80 to-slate-950 border-cyan-500/40",
    accentColor: "#06b6d4",
  },
  {
    id: "matrix_rain",
    name: "Cyber Matrix",
    desc: "Emerald stream & tactical telemetry",
    gradient: "from-emerald-950/80 to-slate-950 border-emerald-500/40",
    accentColor: "#22c55e",
  },
  {
    id: "deep_space",
    name: "Cosmic Nebula",
    desc: "Deep interstellar violet nebula",
    gradient: "from-purple-950/80 to-slate-950 border-purple-500/40",
    accentColor: "#a855f7",
  },
  {
    id: "arc_amber",
    name: "Arc Core Gold",
    desc: "Warm industrial energy spectrum",
    gradient: "from-amber-950/80 to-slate-950 border-amber-500/40",
    accentColor: "#f59e0b",
  },
  {
    id: "crimson_mark7",
    name: "Crimson Mark VII",
    desc: "Stark armour alloy red atmosphere",
    gradient: "from-rose-950/80 to-slate-950 border-rose-500/40",
    accentColor: "#f43f5e",
  },
  {
    id: "stealth_carbon",
    name: "Stealth Carbon",
    desc: "Matte tactical carbon fiber mesh",
    gradient: "from-zinc-900 to-black border-zinc-700/60",
    accentColor: "#94a3b8",
  },
  {
    id: "tactical_slate",
    name: "Tactical Slate",
    desc: "Minimalist aerospace steel slate",
    gradient: "from-slate-900 to-slate-950 border-slate-700/60",
    accentColor: "#64748b",
  },
];

const SAMPLE_WALLPAPERS = [
  {
    label: "Stark Workshop Lab",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80",
  },
  {
    label: "Cyberpunk Metropolis",
    url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80",
  },
  {
    label: "Quantum Server Grid",
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80",
  },
  {
    label: "Cosmic Deep Space",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80",
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<"background" | "features" | "audio">("background");
  const [customUrlInput, setCustomUrlInput] = useState<string>(settings.background.customUrl || "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleUpdateBackground = (partial: Partial<AppSettings["background"]>) => {
    onUpdateSettings({
      ...settings,
      background: {
        ...settings.background,
        ...partial,
      },
    });
  };

  const handleUpdateFeature = (key: keyof FeatureFlags, value: boolean) => {
    // Ensure at least one primary navigation module remains enabled
    const willHaveEnabledPrimary =
      key.startsWith("enable") &&
      ["enableGeminiLive", "enableHolograms", "enableSmartHome", "enableDiagnostics", "enableAnalytics", "enableMemory", "enableWorkflows"].includes(key)
        ? Object.entries({ ...settings.features, [key]: value })
            .filter(([k]) => ["enableGeminiLive", "enableHolograms", "enableSmartHome", "enableDiagnostics", "enableAnalytics", "enableMemory", "enableWorkflows"].includes(k))
            .some(([, v]) => v)
        : true;

    if (!willHaveEnabledPrimary && !value) {
      alert("At least one primary workspace module must remain active.");
      return;
    }

    onUpdateSettings({
      ...settings,
      features: {
        ...settings.features,
        [key]: value,
      },
    });
    jarvisSound.playBlip();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleUpdateBackground({
        themeId: "custom_upload",
        customUploadData: base64,
      });
      jarvisSound.playComplete();
    };
    reader.readAsDataURL(file);
  };

  const applyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    handleUpdateBackground({
      themeId: "custom_url",
      customUrl: customUrlInput.trim(),
    });
    jarvisSound.playComplete();
  };

  // Quick Preset Configurations for Features
  const applyFeaturePreset = (preset: "all" | "minimal" | "voice" | "iot") => {
    jarvisSound.playBeep();
    if (preset === "all") {
      onUpdateSettings({
        ...settings,
        features: {
          enableGeminiLive: true,
          enableHolograms: true,
          enableSmartHome: true,
          enableDiagnostics: true,
          enableAnalytics: true,
          enableMemory: true,
          enableWorkflows: true,
          enableOscilloscope: true,
          enableArcReactor: true,
          enableVisionTools: true,
          enableSoundFX: true,
        },
      });
    } else if (preset === "minimal") {
      onUpdateSettings({
        ...settings,
        features: {
          enableGeminiLive: true,
          enableHolograms: true,
          enableSmartHome: false,
          enableDiagnostics: true,
          enableAnalytics: false,
          enableMemory: false,
          enableWorkflows: false,
          enableOscilloscope: false,
          enableArcReactor: true,
          enableVisionTools: false,
          enableSoundFX: true,
        },
      });
    } else if (preset === "voice") {
      onUpdateSettings({
        ...settings,
        features: {
          enableGeminiLive: true,
          enableHolograms: false,
          enableSmartHome: false,
          enableDiagnostics: false,
          enableAnalytics: false,
          enableMemory: true,
          enableWorkflows: false,
          enableOscilloscope: true,
          enableArcReactor: true,
          enableVisionTools: true,
          enableSoundFX: true,
        },
      });
    } else if (preset === "iot") {
      onUpdateSettings({
        ...settings,
        features: {
          enableGeminiLive: false,
          enableHolograms: true,
          enableSmartHome: true,
          enableDiagnostics: true,
          enableAnalytics: false,
          enableMemory: false,
          enableWorkflows: true,
          enableOscilloscope: false,
          enableArcReactor: true,
          enableVisionTools: false,
          enableSoundFX: true,
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh] overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-wider text-slate-100 uppercase flex items-center gap-2">
                <span>STARK OS CONFIGURATION MATRIX</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  SYSTEM
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Customize atmospheric canvas & manage active workspace modules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm("Reset all settings, background and active features to factory defaults?")) {
                  onResetDefaults();
                  jarvisSound.playComplete();
                }
              }}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset all settings to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">RESET</span>
            </button>
            <button
              onClick={() => {
                jarvisSound.playBlip();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            onClick={() => {
              jarvisSound.playBlip();
              setActiveTab("background");
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "background"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>BACKGROUND & VISUALS</span>
          </button>
          <button
            onClick={() => {
              jarvisSound.playBlip();
              setActiveTab("features");
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "features"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>FEATURE MANAGER</span>
          </button>
          <button
            onClick={() => {
              jarvisSound.playBlip();
              setActiveTab("audio");
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "audio"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>AUDIO & HARDWARE</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BACKGROUND & VISUALS */}
          {activeTab === "background" && (
            <div className="space-y-6">
              {/* Presets Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    PRESET HOLOGRAPHIC THEMES
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ACTIVE: {settings.background.themeId.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {PRESET_BACKGROUNDS.map((p) => {
                    const isSelected = settings.background.themeId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          handleUpdateBackground({ themeId: p.id });
                          jarvisSound.playBlip();
                        }}
                        className={`p-3 rounded-xl border bg-gradient-to-br text-left transition-all relative overflow-hidden cursor-pointer ${
                          p.gradient
                        } ${
                          isSelected
                            ? "ring-2 ring-cyan-400 border-cyan-300 shadow-md shadow-cyan-950/80"
                            : "hover:border-slate-600 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: p.accentColor }}
                            />
                            {p.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image / Wallpaper Section */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  CUSTOM WALLPAPER OR IMAGE
                </span>

                {/* Local Upload */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 px-4 py-2.5 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-colors ${
                      settings.background.themeId === "custom_upload" && settings.background.customUploadData
                        ? "border-cyan-400 bg-cyan-950/40 text-cyan-300"
                        : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-cyan-500/60 hover:text-white"
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {settings.background.customUploadData
                        ? "Change Uploaded Image"
                        : "Upload Local Image (PNG, JPG, WebP)"}
                    </span>
                  </button>

                  {settings.background.customUploadData && (
                    <button
                      onClick={() => {
                        handleUpdateBackground({
                          customUploadData: undefined,
                          themeId: "cyan_grid",
                        });
                        jarvisSound.playBlip();
                      }}
                      className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/60 text-rose-300 hover:bg-rose-900/50 transition-colors"
                      title="Remove uploaded image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Custom URL Input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Link className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="url"
                        placeholder="https://example.com/wallpaper.jpg"
                        value={customUrlInput ?? ""}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyCustomUrl()}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                      />
                    </div>
                    <button
                      onClick={applyCustomUrl}
                      className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>APPLY</span>
                    </button>
                  </div>

                  {/* Sample Wallpaper Quick Picks */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500">Quick Wallpapers:</span>
                    {SAMPLE_WALLPAPERS.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCustomUrlInput(s.url);
                          handleUpdateBackground({
                            themeId: "custom_url",
                            customUrl: s.url,
                          });
                          jarvisSound.playBlip();
                        }}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Adjusters: Opacity, Blur, Dark Overlay */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  OPTICAL CANVAS CONTROLS
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Opacity */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Opacity:</span>
                      <span className="text-cyan-300 font-bold font-mono">
                        {(settings.background.opacity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={settings.background.opacity ?? 0.85}
                      onChange={(e) =>
                        handleUpdateBackground({ opacity: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Blur */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Atmospheric Blur:</span>
                      <span className="text-cyan-300 font-bold font-mono">
                        {settings.background.blur ?? 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={settings.background.blur ?? 0}
                      onChange={(e) =>
                        handleUpdateBackground({ blur: parseInt(e.target.value) })
                      }
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Dark Tint Overlay */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Dark Tint Overlay:</span>
                      <span className="text-cyan-300 font-bold font-mono">
                        {((settings.background.darkOverlay ?? 0.65) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.9"
                      step="0.05"
                      value={settings.background.darkOverlay ?? 0.65}
                      onChange={(e) =>
                        handleUpdateBackground({ darkOverlay: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>

                {/* Toggles for Grid & Particles */}
                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800/80">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!settings.background.showGridOverlay}
                      onChange={(e) =>
                        handleUpdateBackground({ showGridOverlay: e.target.checked })
                      }
                      className="rounded accent-cyan-400 cursor-pointer"
                    />
                    <Grid className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sci-Fi Cyber Grid Overlay</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!settings.background.showParticles}
                      onChange={(e) =>
                        handleUpdateBackground({ showParticles: e.target.checked })
                      }
                      className="rounded accent-cyan-400 cursor-pointer"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Floating Quantum Ambient Particles</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FEATURE MANAGER (REMOVE / ENABLE FEATURES) */}
          {activeTab === "features" && (
            <div className="space-y-6">
              {/* Quick Presets */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>QUICK WORKSPACE PROFILES</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Switch between full tactical suite and lightweight developer modes
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => applyFeaturePreset("all")}
                    className="px-2.5 py-1 rounded text-xs bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 transition-colors cursor-pointer"
                  >
                    Full Suite (All)
                  </button>
                  <button
                    onClick={() => applyFeaturePreset("minimal")}
                    className="px-2.5 py-1 rounded text-xs bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    Dev Minimal
                  </button>
                  <button
                    onClick={() => applyFeaturePreset("voice")}
                    className="px-2.5 py-1 rounded text-xs bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    Voice Agent
                  </button>
                  <button
                    onClick={() => applyFeaturePreset("iot")}
                    className="px-2.5 py-1 rounded text-xs bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    IoT Smart Home
                  </button>
                </div>
              </div>

              {/* Primary Navigation Modules */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  PRIMARY WORKSPACE HUBS (NAVIGATION TABS)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Gemini Live HUD */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      settings.features.enableGeminiLive
                        ? "bg-slate-950/80 border-cyan-500/40"
                        : "bg-slate-950/30 border-slate-800/80 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100">
                            GEMINI LIVE VOICE HUD
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Real-time duplex voice streaming, transcription & sound
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleUpdateFeature(
                            "enableGeminiLive",
                            !settings.features.enableGeminiLive
                          )
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                          settings.features.enableGeminiLive
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}
                      >
                        {settings.features.enableGeminiLive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{settings.features.enableGeminiLive ? "ACTIVE" : "HIDDEN"}</span>
                      </button>
                    </div>
                  </div>

                  {/* 3D Hologram Laboratory */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      settings.features.enableHolograms
                        ? "bg-slate-950/80 border-cyan-500/40"
                        : "bg-slate-950/30 border-slate-800/80 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                          <Box className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100">
                            3D HOLOGRAM LAB
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Image-to-3D photogrammetry, Idea-to-3D synthesis & Three.js matrix
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleUpdateFeature(
                            "enableHolograms",
                            !settings.features.enableHolograms
                          )
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                          settings.features.enableHolograms
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}
                      >
                        {settings.features.enableHolograms ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{settings.features.enableHolograms ? "ACTIVE" : "HIDDEN"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Smart Home IoT Deck */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      settings.features.enableSmartHome
                        ? "bg-slate-950/80 border-cyan-500/40"
                        : "bg-slate-950/30 border-slate-800/80 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                          <Home className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100">
                            SMART HOME & IOT DECK
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Device grid, lighting arrays, thermostat & security presets
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleUpdateFeature(
                            "enableSmartHome",
                            !settings.features.enableSmartHome
                          )
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                          settings.features.enableSmartHome
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}
                      >
                        {settings.features.enableSmartHome ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{settings.features.enableSmartHome ? "ACTIVE" : "HIDDEN"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Diagnostics Terminal */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      settings.features.enableDiagnostics
                        ? "bg-slate-950/80 border-cyan-500/40"
                        : "bg-slate-950/30 border-slate-800/80 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100">
                            DIAGNOSTICS & SYSTEM LOGS
                          </div>
                          <div className="text-[10px] text-slate-400">
                            CPU/GPU telemetry, neural latency & subsystem vitals
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleUpdateFeature(
                            "enableDiagnostics",
                            !settings.features.enableDiagnostics
                          )
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                          settings.features.enableDiagnostics
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}
                      >
                        {settings.features.enableDiagnostics ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{settings.features.enableDiagnostics ? "ACTIVE" : "HIDDEN"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Analytics Workbench */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      settings.features.enableAnalytics
                        ? "bg-slate-950/80 border-cyan-500/40"
                        : "bg-slate-950/30 border-slate-800/80 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100">
                            ANALYTICS DATA BENCH
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Interactive Recharts graphs & automated anomaly detection
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleUpdateFeature(
                            "enableAnalytics",
                            !settings.features.enableAnalytics
                          )
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                          settings.features.enableAnalytics
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}
                      >
                        {settings.features.enableAnalytics ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{settings.features.enableAnalytics ? "ACTIVE" : "HIDDEN"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Memory Matrix */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      settings.features.enableMemory
                        ? "bg-slate-950/80 border-cyan-500/40"
                        : "bg-slate-950/30 border-slate-800/80 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                          <Brain className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100">
                            MEMORY MATRIX
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Persistent contextual facts, creator recognition & notes
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleUpdateFeature(
                            "enableMemory",
                            !settings.features.enableMemory
                          )
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                          settings.features.enableMemory
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}
                      >
                        {settings.features.enableMemory ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{settings.features.enableMemory ? "ACTIVE" : "HIDDEN"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Workflows Automation */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      settings.features.enableWorkflows
                        ? "bg-slate-950/80 border-cyan-500/40"
                        : "bg-slate-950/30 border-slate-800/80 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100">
                            AUTONOMOUS WORKFLOWS
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Multi-step automation generator & pipeline runner
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleUpdateFeature(
                            "enableWorkflows",
                            !settings.features.enableWorkflows
                          )
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                          settings.features.enableWorkflows
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}
                      >
                        {settings.features.enableWorkflows ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{settings.features.enableWorkflows ? "ACTIVE" : "HIDDEN"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Components & Tactical Tools */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  SUB-COMPONENTS & INTEGRATED INSTRUMENTS
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Oscilloscope Visualizer
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Real-time CRT waveform & FFT spectrum in Live Deck
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!settings.features.enableOscilloscope}
                      onChange={(e) =>
                        handleUpdateFeature("enableOscilloscope", e.target.checked)
                      }
                      className="rounded accent-cyan-400 cursor-pointer w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Arc Reactor Centerpiece
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Glowing rotational holographic core graphic
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!settings.features.enableArcReactor}
                      onChange={(e) =>
                        handleUpdateFeature("enableArcReactor", e.target.checked)
                      }
                      className="rounded accent-cyan-400 cursor-pointer w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Optical Vision & Screen Buffer
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Camera snapshot & screen capture tools
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!settings.features.enableVisionTools}
                      onChange={(e) =>
                        handleUpdateFeature("enableVisionTools", e.target.checked)
                      }
                      className="rounded accent-cyan-400 cursor-pointer w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Tactical Sound Synthesis FX
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Web Audio sound synthesis feedback clicks & blips
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!settings.features.enableSoundFX}
                      onChange={(e) =>
                        handleUpdateFeature("enableSoundFX", e.target.checked)
                      }
                      className="rounded accent-cyan-400 cursor-pointer w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIO & HARDWARE */}
          {activeTab === "audio" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-4">
                <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  AUDIO ENGINE & VOICE TELEMETRY
                </span>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Synthesizer Sound Effects
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Oscillator sound FX for button clicks, locks and activations
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleUpdateFeature("enableSoundFX", !settings.features.enableSoundFX);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border ${
                        settings.features.enableSoundFX
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                          : "bg-slate-900 text-slate-500 border-slate-800"
                      }`}
                    >
                      {settings.features.enableSoundFX ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      <span>{settings.features.enableSoundFX ? "ENABLED" : "MUTED"}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs">
                    <div className="text-slate-300 font-semibold">Web Audio Synthesizer Status</div>
                    <div className="text-[11px] text-slate-400">
                      Sample Rate: <span className="text-cyan-300">48.0 kHz Standard / 24.0 kHz Live</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Acoustic Echo Cancellation (AEC): <span className="text-emerald-400">ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identity and System Info */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  SYSTEM INTEGRITY & AUTHORSHIP
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  JARVIS Tactical HUD & Neural Workspace Core v4.2 PRO. Built with custom Web Audio,
                  Gemini Flash & Live API, and real-time biometric telemetry.
                </p>
                <div className="pt-1 text-[11px] text-slate-400">
                  Created and authored by <span className="text-cyan-400 font-semibold">RK Phranav</span>.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preferences auto-saved to local memory storage</span>
          </div>

          <button
            onClick={() => {
              jarvisSound.playComplete();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold tracking-wider uppercase shadow-md shadow-cyan-900/40 cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>DONE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

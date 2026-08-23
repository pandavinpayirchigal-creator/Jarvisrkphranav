import React from "react";
import {
  Radio,
  Mic,
  MicOff,
  Home,
  Activity,
  BarChart3,
  Brain,
  Layers,
  Box,
  Volume2,
  VolumeX,
  Shield,
  Zap,
  Battery,
  BatteryCharging,
  Moon,
  Sun,
  Sliders,
  Settings,
  Hand,
} from "lucide-react";
import { FeatureFlags } from "../types";
import { jarvisSound } from "../services/soundEffects";
import { useGeminiLive } from "../context/GeminiLiveContext";

export type NavTab =
  | "live"
  | "hologram"
  | "smarthome"
  | "diagnostics"
  | "analytics"
  | "memory"
  | "workflows";

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  arcStatus?: string;
  arcReactorEfficiency?: number;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  features?: FeatureFlags;
  onOpenSettings?: () => void;
  currentTheme?: string;
  onSelectTheme?: (themeId: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isSoundEnabled,
  onToggleSound,
  arcStatus = "ONLINE • OPTIMAL",
  arcReactorEfficiency = 99.4,
  isDarkMode = true,
  onToggleDarkMode,
  features,
  onOpenSettings,
  currentTheme,
  onSelectTheme,
}) => {
  const {
    streamStatus,
    toggleLiveStreaming,
    isGestureControlActive,
    setIsGestureControlActive,
    isPausedByGesture,
    resumeVoiceViaGesture,
  } = useGeminiLive();
  const isListening = streamStatus === "listening";
  const isSpeaking = streamStatus === "speaking";
  const isLiveActive = isListening || isSpeaking;

  // Normalized efficiency clamped to 0-100
  const efficiency = Math.max(0, Math.min(100, Number(arcReactorEfficiency) || 99.4));
  const isOptimalPower = efficiency >= 90;
  const isNominalPower = efficiency >= 70 && efficiency < 90;

  const allTabs = [
    {
      id: "live" as NavTab,
      label: "GEMINI LIVE HUD",
      icon: Radio,
      isEnabled: features ? features.enableGeminiLive : true,
    },
    {
      id: "hologram" as NavTab,
      label: "3D HOLOGRAM LAB",
      icon: Box,
      isEnabled: features ? features.enableHolograms : true,
    },
    {
      id: "smarthome" as NavTab,
      label: "SMART HOME",
      icon: Home,
      isEnabled: features ? features.enableSmartHome : true,
    },
    {
      id: "diagnostics" as NavTab,
      label: "DIAGNOSTICS",
      icon: Activity,
      isEnabled: features ? features.enableDiagnostics : true,
    },
    {
      id: "analytics" as NavTab,
      label: "DATA BENCH",
      icon: BarChart3,
      isEnabled: features ? features.enableAnalytics : true,
    },
    {
      id: "memory" as NavTab,
      label: "MEMORY MATRIX",
      icon: Brain,
      isEnabled: features ? features.enableMemory : true,
    },
    {
      id: "workflows" as NavTab,
      label: "WORKFLOWS",
      icon: Layers,
      isEnabled: features ? features.enableWorkflows : true,
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.isEnabled);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 dark:bg-slate-950/90 border-b border-cyan-500/20 backdrop-blur-xl font-mono select-none">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            {/* Holographic Glowing Icon */}
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-slate-900 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-widest text-slate-100 uppercase">
                  JARVIS
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  v4.2 PRO
                </span>
              </div>
              <div className="text-[10px] text-slate-400 tracking-wide">
                Created by <span className="text-cyan-400 font-semibold">RK Phranav</span>
              </div>
            </div>
          </div>

          {/* Quick Controls on Mobile */}
          <div className="md:hidden flex items-center gap-1.5">
            {/* Mobile System Power Battery Widget */}
            <div
              id="header-mobile-system-power-widget"
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 border ${
                isOptimalPower
                  ? "bg-slate-900 border-emerald-500/40 text-emerald-300"
                  : isNominalPower
                  ? "bg-slate-900 border-amber-500/40 text-amber-300"
                  : "bg-slate-900 border-rose-500/50 text-rose-300"
              }`}
              title={`System Power (Arc Reactor): ${efficiency.toFixed(1)}%`}
            >
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold">{efficiency.toFixed(0)}%</span>
            </div>

            <button
              id="header-mobile-live-mic-btn"
              onClick={toggleLiveStreaming}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 border transition-all ${
                isListening
                  ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300 animate-pulse"
                  : isSpeaking
                  ? "bg-cyan-950/80 border-cyan-500/60 text-cyan-300"
                  : "bg-slate-900 border-slate-800 text-slate-400"
              }`}
              title="Persistent Voice Connection"
            >
              {isListening ? (
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <MicOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="text-[11px]">{isListening ? "LIVE" : isSpeaking ? "TALKING" : "MIC"}</span>
            </button>

            {onOpenSettings && (
              <button
                id="open-settings-mobile-btn"
                onClick={() => {
                  jarvisSound.playBlip();
                  onOpenSettings();
                }}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40"
                title="System Settings & Module Manager"
              >
                <Sliders className="w-4 h-4 text-cyan-400" />
              </button>
            )}
            {onToggleDarkMode && (
              <button
                id="toggle-dark-mode-mobile-btn"
                onClick={() => {
                  jarvisSound.playBlip();
                  onToggleDarkMode();
                }}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300"
                title={isDarkMode ? "Switch to Light Spectrum" : "Switch to Dark Spectrum"}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
              </button>
            )}
            <button
              onClick={onToggleSound}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300"
              title={isSoundEnabled ? "Mute JARVIS Synth FX" : "Enable Sound FX"}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Filtered by active features) */}
        <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto py-1 px-1 bg-slate-900/80 rounded-xl border border-slate-800/80">
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                id={`nav-tab-${t.id}`}
                onClick={() => {
                  jarvisSound.playBlip();
                  onSelectTab(t.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-900/40 border border-cyan-400/60"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.id === "live" && isLiveActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status Indicator, Theme Toggle, Settings & Sound Toggle */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Global Persistent Live Audio Widget */}
          <button
            id="header-live-session-toggle-btn"
            onClick={toggleLiveStreaming}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
              isListening
                ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse"
                : isSpeaking
                ? "bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                : "bg-slate-900 border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-slate-200"
            }`}
            title="Click to toggle hands-free live voice conversation across all tabs"
          >
            {isListening ? (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-emerald-400">VOICE ACTIVE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </>
            ) : isSpeaking ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                <span className="font-semibold text-cyan-300">JARVIS SPEAKING</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">VOICE LINK IDLE</span>
              </>
            )}
          </button>

          {/* Optical Hand Gesture Status Widget */}
          <button
            id="header-gesture-control-btn"
            onClick={() => {
              jarvisSound.playBlip();
              if (isPausedByGesture) {
                resumeVoiceViaGesture("fist");
              } else {
                setIsGestureControlActive((prev) => !prev);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
              isPausedByGesture
                ? "bg-rose-950/80 border-rose-500/70 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse"
                : isGestureControlActive
                ? "bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                : "bg-slate-900 border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-slate-200"
            }`}
            title={
              isPausedByGesture
                ? "✋ Voice paused by hand gesture! Click to resume or show fist/wave."
                : isGestureControlActive
                ? "Optical Hand Gesture tracking ACTIVE (Open Palm = Pause, Fist = Resume). Click to disable."
                : "Enable Optical Hand Gesture Detection for Voice Control"
            }
          >
            <Hand className={`w-3.5 h-3.5 ${isGestureControlActive ? "animate-pulse" : ""}`} />
            <span className="font-semibold hidden lg:inline">
              {isPausedByGesture
                ? "GESTURE: PAUSED"
                : isGestureControlActive
                ? "GESTURES ON"
                : "GESTURES"}
            </span>
          </button>

          {/* Visual System Power Battery Widget */}
          <div
            id="header-system-power-widget"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all select-none ${
              isOptimalPower
                ? "bg-slate-900/90 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                : isNominalPower
                ? "bg-slate-900/90 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                : "bg-slate-900/90 border-rose-500/50 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)] animate-pulse"
            }`}
            title={`System Power • Arc Reactor Efficiency: ${efficiency.toFixed(1)}%`}
          >
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center">
                <Battery
                  className={`w-4 h-4 ${
                    isOptimalPower
                      ? "text-emerald-400"
                      : isNominalPower
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                />
                <Zap className="w-2.5 h-2.5 text-cyan-300 absolute left-0.5 top-0.5 animate-pulse" />
              </div>

              {/* Segmented Power Gauge Fill */}
              <div className="hidden lg:flex items-center w-12 h-2 rounded bg-slate-950 border border-slate-800 p-0.5 overflow-hidden">
                <div
                  className={`h-full rounded-sm transition-all duration-500 ${
                    isOptimalPower
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_6px_#10b981]"
                      : isNominalPower
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                      : "bg-gradient-to-r from-rose-600 to-red-500"
                  }`}
                  style={{ width: `${efficiency}%` }}
                />
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider hidden xl:inline">
                  POWER
                </span>
                <span className="font-bold font-mono tracking-tight text-slate-100">
                  {efficiency.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Stark UI Archetype Switcher */}
          {onSelectTheme && (
            <div className="hidden 2xl:flex items-center gap-1 p-0.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-[10px]">
              <button
                onClick={() => {
                  jarvisSound.playBlip();
                  onSelectTheme("stark_mark85_armor");
                }}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  currentTheme === "stark_mark85_armor"
                    ? "bg-amber-500/30 text-amber-300 border border-amber-400/60 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Stark Mark 85 Titanium Chassis (Image 3 UI)"
              >
                MARK 85
              </button>
              <button
                onClick={() => {
                  jarvisSound.playBlip();
                  onSelectTheme("orbital_telemetry_hud");
                }}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  currentTheme === "orbital_telemetry_hud"
                    ? "bg-orange-500/30 text-orange-300 border border-orange-400/60 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Orbital Planetary Telemetry HUD (Image 2 UI)"
              >
                ORBITAL HUD
              </button>
              <button
                onClick={() => {
                  jarvisSound.playBlip();
                  onSelectTheme("iris_singularity_core");
                }}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  currentTheme === "iris_singularity_core"
                    ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400/60 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Iris Core Singularity (Image 1 UI)"
              >
                IRIS CORE
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/30 text-[11px] text-cyan-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>ARC CORE: {arcStatus}</span>
          </div>

          {/* Settings & Feature Manager Button */}
          {onOpenSettings && (
            <button
              id="open-settings-btn"
              onClick={() => {
                jarvisSound.playBlip();
                onOpenSettings();
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Open System Settings & Background Customizer"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>SETTINGS</span>
            </button>
          )}

          {/* Dark / Light Spectrum Toggle */}
          {onToggleDarkMode && (
            <button
              id="toggle-dark-mode-btn"
              onClick={() => {
                jarvisSound.playBlip();
                onToggleDarkMode();
              }}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
              title={isDarkMode ? "Activate High-Illumination Mode (Light Mode)" : "Activate Stealth Tactical HUD (Dark Mode)"}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] hidden xl:inline text-slate-300">LIGHT</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px] hidden xl:inline text-slate-300">DARK</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => {
              jarvisSound.playBlip();
              onToggleSound();
            }}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isSoundEnabled
                ? "bg-slate-900 border-cyan-500/40 text-cyan-400"
                : "bg-slate-900 border-slate-800 text-slate-500"
            }`}
            title={isSoundEnabled ? "Disable Synth Sound FX" : "Enable Synth Sound FX"}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};


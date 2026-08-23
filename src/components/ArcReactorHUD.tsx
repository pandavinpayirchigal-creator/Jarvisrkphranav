import React, { useState } from "react";
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, Eye, Compass, Shield } from "lucide-react";
import { jarvisSound } from "../services/soundEffects";

export type ArcReactorStyle = "iris_core" | "orbital_hud" | "mark85_armor";

interface ArcReactorHUDProps {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  onToggleListen?: () => void;
  onClickCenter?: () => void;
  onInterrupt?: () => void;
  systemStatus?: "optimal" | "warning" | "diagnostic";
}

export const ArcReactorHUD: React.FC<ArcReactorHUDProps> = ({
  isListening,
  isSpeaking,
  isThinking,
  onToggleListen,
  onClickCenter,
  onInterrupt,
  systemStatus = "optimal",
}) => {
  const [styleMode, setStyleMode] = useState<ArcReactorStyle>("iris_core");

  const handleCenterAction = () => {
    if (onClickCenter) {
      onClickCenter();
    } else if (onToggleListen) {
      onToggleListen();
    }
  };

  const getStatusColor = () => {
    if (isListening) return "cyan";
    if (isSpeaking) return "sky";
    if (isThinking) return "amber";
    if (systemStatus === "warning") return "rose";
    return "cyan";
  };

  const color = getStatusColor();

  return (
    <div className="relative flex flex-col items-center justify-center p-4 select-none">
      {/* UI Style Archetype Switcher */}
      <div className="mb-4 flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl backdrop-blur-md z-20">
        <button
          onClick={() => {
            jarvisSound.playBlip();
            setStyleMode("iris_core");
          }}
          title="UI Design 1: Iris Core Singularity"
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
            styleMode === "iris_core"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Eye className="w-3 h-3" /> Iris Singularity
        </button>

        <button
          onClick={() => {
            jarvisSound.playBlip();
            setStyleMode("orbital_hud");
          }}
          title="UI Design 2: Orbital Planetary Telemetry"
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
            styleMode === "orbital_hud"
              ? "bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-sm shadow-amber-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Compass className="w-3 h-3" /> Orbital Telemetry
        </button>

        <button
          onClick={() => {
            jarvisSound.playBlip();
            setStyleMode("mark85_armor");
          }}
          title="UI Design 3: Mark 85 Armor Reactor"
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
            styleMode === "mark85_armor"
              ? "bg-gradient-to-r from-cyan-950 to-amber-950 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shield className="w-3 h-3" /> Mark 85 Core
        </button>
      </div>

      {/* Main Reactor Body Visualizer */}
      <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64">
        {/* Ambient Glow */}
        <div
          className={`absolute inset-0 rounded-full blur-2xl opacity-25 transition-all duration-700 ${
            styleMode === "orbital_hud"
              ? "bg-orange-500"
              : color === "cyan"
              ? "bg-cyan-500"
              : color === "amber"
              ? "bg-amber-500"
              : color === "sky"
              ? "bg-sky-400"
              : "bg-rose-500"
          } ${isListening || isSpeaking || isThinking ? "scale-125 opacity-45" : "scale-100"}`}
        />

        {/* ---------------------------------------------------- */}
        {/* STYLE 1: IRIS CORE SINGULARITY (Image 7 Style)       */}
        {/* ---------------------------------------------------- */}
        {styleMode === "iris_core" && (
          <>
            {/* Outer Dark Titanium Shutter Ring */}
            <div className="absolute inset-0 rounded-full border-[10px] border-slate-900 shadow-[inset_0_0_15px_rgba(0,0,0,0.9)]" />

            {/* Shutter Segments (Top & Bottom Arcs) */}
            <div className="absolute inset-1 rounded-full border border-cyan-500/30 flex items-center justify-center animate-[spin_60s_linear_infinite]">
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <div
                  key={deg}
                  className="absolute w-3 h-1.5 bg-slate-800 border border-cyan-400/40 top-1 left-1/2 -translate-x-1/2 rounded-xs"
                  style={{ transform: `rotate(${deg}deg) translateY(-118px)` }}
                />
              ))}
            </div>

            {/* Dense Concentric Laser Radial Optical Ticks */}
            <div className="absolute inset-4 rounded-full border border-cyan-500/30">
              {Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-0.5 bg-cyan-400/40 top-1/2 left-0 -translate-y-1/2 origin-[116px_center]"
                  style={{
                    transform: `rotate(${i * 7.5}deg)`,
                    opacity: i % 4 === 0 ? 0.9 : 0.4,
                  }}
                />
              ))}
            </div>

            {/* Inner Counter-Rotating Ring */}
            <div
              className={`absolute inset-8 rounded-full border border-dashed border-cyan-400/50 ${
                isListening ? "animate-[spin_6s_linear_infinite]" : "animate-[spin_25s_linear_infinite_reverse]"
              }`}
            />

            {/* Optical Horizontal Blue Flare Beam */}
            <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-70 shadow-[0_0_8px_#22d3ee] pointer-events-none" />
          </>
        )}

        {/* ---------------------------------------------------- */}
        {/* STYLE 2: ORBITAL PLANETARY TELEMETRY (Image 6 Style)  */}
        {/* ---------------------------------------------------- */}
        {styleMode === "orbital_hud" && (
          <>
            {/* 3D Angled Orbital Trajectory Ellipses */}
            <div className="absolute inset-[-14px] rounded-full border border-cyan-400/40 rotate-[-25deg] scale-y-[0.45] animate-[spin_16s_linear_infinite]">
              {/* Satellite Node on Orbit */}
              <div className="absolute -top-1 left-1/2 w-2.5 h-2.5 bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24]" />
            </div>

            <div className="absolute inset-[-6px] rounded-full border border-dashed border-orange-400/50 rotate-[35deg] scale-y-[0.55] animate-[spin_22s_linear_infinite_reverse]">
              <div className="absolute -bottom-1 left-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
            </div>

            {/* Compass Degree Calipers */}
            <div className="absolute inset-2 rounded-full border border-orange-500/40">
              {[0, 90, 180, 270].map((deg, idx) => {
                const labels = ["N", "E", "S", "W"];
                return (
                  <div
                    key={deg}
                    className="absolute text-[8px] font-mono font-bold text-amber-400"
                    style={{
                      top: idx === 0 ? "4px" : idx === 2 ? "auto" : "50%",
                      bottom: idx === 2 ? "4px" : "auto",
                      left: idx === 3 ? "6px" : idx === 1 ? "auto" : "50%",
                      right: idx === 1 ? "6px" : "auto",
                      transform: idx === 0 || idx === 2 ? "translateX(-50%)" : "translateY(-50%)",
                    }}
                  >
                    {labels[idx]}
                  </div>
                );
              })}
            </div>

            {/* Radar Sweep Reticle */}
            <div className="absolute inset-5 rounded-full border border-cyan-400/30 animate-[spin_8s_linear_infinite]" />
          </>
        )}

        {/* ---------------------------------------------------- */}
        {/* STYLE 3: MARK 85 TITANIUM ARMOR (Image 5 Style)       */}
        {/* ---------------------------------------------------- */}
        {styleMode === "mark85_armor" && (
          <>
            {/* Segmented Armor Caliper Arcs */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/40 animate-[spin_30s_linear_infinite]" />
            <div className="absolute inset-3 rounded-full border-2 border-amber-500/40 animate-[spin_20s_linear_infinite_reverse]" />

            {/* 4 Titanium Reticle Crosshair Guides */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-400/30 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-400/30 pointer-events-none" />

            {/* Concentric Dual Color Rings */}
            <div className="absolute inset-6 rounded-full border border-cyan-300/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]" />
            <div className="absolute inset-9 rounded-full border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]" />
          </>
        )}

        {/* Dynamic Voice Pulse Waves when active */}
        {(isListening || isSpeaking) && (
          <div className="absolute inset-10 rounded-full border-2 border-cyan-400/70 animate-ping opacity-40" />
        )}

        {/* Center Reactor Core Button */}
        <button
          id="arc-reactor-core-btn"
          onClick={() => {
            if (isSpeaking && onInterrupt) {
              onInterrupt();
            } else {
              handleCenterAction();
            }
          }}
          className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
            styleMode === "orbital_hud"
              ? "bg-gradient-to-br from-slate-950 via-orange-950/80 to-slate-950 border-2 border-orange-400 shadow-orange-500/40"
              : isListening
              ? "bg-gradient-to-br from-cyan-950/90 via-slate-900 to-cyan-900 border-2 border-cyan-400 shadow-cyan-500/50 scale-105"
              : isSpeaking
              ? "bg-gradient-to-br from-sky-950/90 via-slate-900 to-sky-900 border-2 border-sky-400 shadow-sky-500/50 scale-105"
              : isThinking
              ? "bg-gradient-to-br from-amber-950/90 via-slate-900 to-amber-900 border-2 border-amber-400 shadow-amber-500/50 animate-pulse"
              : "bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/60 border border-cyan-500/40 hover:border-cyan-400 hover:scale-105 shadow-cyan-500/20"
          }`}
          title={
            isSpeaking
              ? "Click to interrupt voice output"
              : isListening
              ? "Click to stop listening"
              : "Click to engage voice control"
          }
        >
          {/* Inner Arc Core Geometry */}
          <div className="absolute inset-2 rounded-full border border-cyan-400/30 flex items-center justify-center">
            {/* Core Triangular/Circular Arc Segments */}
            <div
              className={`w-16 h-16 rounded-full border flex items-center justify-center ${
                styleMode === "orbital_hud"
                  ? "border-orange-400/50 bg-orange-950/40"
                  : "border-cyan-300/40 bg-cyan-950/40"
              }`}
            >
              {isListening ? (
                <div className="flex flex-col items-center">
                  <Mic className="w-7 h-7 text-cyan-300 animate-bounce" />
                  <span className="text-[10px] font-mono tracking-widest text-cyan-300 uppercase mt-0.5">
                    REC
                  </span>
                </div>
              ) : isSpeaking ? (
                <div className="flex flex-col items-center">
                  <Volume2 className="w-7 h-7 text-sky-300 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-widest text-sky-300 uppercase mt-0.5">
                    TRANSMIT
                  </span>
                </div>
              ) : isThinking ? (
                <div className="flex flex-col items-center">
                  <Sparkles className="w-7 h-7 text-amber-300 animate-spin" />
                  <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase mt-0.5">
                    REASON
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3.5 h-3.5 rounded-full animate-pulse ${
                      styleMode === "orbital_hud"
                        ? "bg-amber-400 shadow-[0_0_14px_#fbbf24]"
                        : "bg-cyan-400 shadow-[0_0_14px_#22d3ee]"
                    }`}
                  />
                  <span
                    className={`text-[9px] font-mono tracking-wider uppercase mt-1 ${
                      styleMode === "orbital_hud" ? "text-amber-300/90" : "text-cyan-400/90"
                    }`}
                  >
                    JARVIS
                  </span>
                </div>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Status Readout Banner */}
      <div className="mt-3 flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 text-xs font-mono backdrop-blur-md">
        <span
          className={`w-2 h-2 rounded-full ${
            isListening
              ? "bg-cyan-400 animate-ping"
              : isSpeaking
              ? "bg-sky-400 animate-pulse"
              : isThinking
              ? "bg-amber-400 animate-bounce"
              : "bg-emerald-400 shadow-[0_0_8px_#34d399]"
          }`}
        />
        <span className="text-slate-300">
          {isListening
            ? "VOICE CHANNEL OPEN • LISTENING"
            : isSpeaking
            ? "TRANSMITTING SYNTHESIZED SPEECH"
            : isThinking
            ? "NEURAL REASONING MATRIX ACTIVE"
            : `STARK CORE ONLINE • ${
                styleMode === "iris_core"
                  ? "IRIS SINGULARITY"
                  : styleMode === "orbital_hud"
                  ? "ORBITAL TELEMETRY"
                  : "MARK 85 CHASSIS"
              }`}
        </span>
      </div>
    </div>
  );
};


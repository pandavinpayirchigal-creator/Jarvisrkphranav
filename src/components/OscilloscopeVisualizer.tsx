import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  Maximize2,
  Minimize2,
  Sliders,
  Sparkles,
  Zap,
  Radio,
  Eye,
  Volume2,
  Mic,
  Disc,
} from "lucide-react";
import { geminiLive } from "../services/geminiLiveService";

export type VisualizerMode = "oscilloscope" | "waveform" | "spectrum" | "radial";
export type VisualizerTheme = "cyan" | "green" | "gold" | "violet";

interface OscilloscopeVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  audioPeak: number;
  peakSource: "mic" | "output";
  className?: string;
  onSelectVoice?: () => void;
}

export const OscilloscopeVisualizer: React.FC<OscilloscopeVisualizerProps> = ({
  isListening,
  isSpeaking,
  audioPeak,
  peakSource,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<VisualizerMode>("oscilloscope");
  const [theme, setTheme] = useState<VisualizerTheme>("cyan");
  const [gain, setGain] = useState<number>(1.4);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [enablePeakHold, setEnablePeakHold] = useState<boolean>(true);
  const [decaySpeed, setDecaySpeed] = useState<"standard" | "slow" | "fast">("standard");
  const [channelFocus, setChannelFocus] = useState<"auto" | "mic" | "output">("auto");
  const [currentRms, setCurrentRms] = useState<number>(0);
  const [peakHoldValue, setPeakHoldValue] = useState<number>(0);
  const [peakFrequency, setPeakFrequency] = useState<number>(0);

  // Persistent refs for hold & decay mechanics
  const peakHoldRef = useRef<number>(0.08);
  const peakHoldTimerRef = useRef<number>(0);
  const peakBarsRef = useRef<number[]>(new Array(48).fill(4));
  const peakBarsTimerRef = useRef<number[]>(new Array(48).fill(0));
  const frameCountRef = useRef<number>(0);

  // Theme color maps
  const themeColors = {
    cyan: {
      primary: "#22d3ee", // cyan-400
      secondary: "#38bdf8", // sky-400
      glow: "rgba(34, 211, 238, 0.6)",
      bgGrid: "rgba(6, 182, 212, 0.12)",
      text: "text-cyan-400",
      border: "border-cyan-500/40",
      accentBg: "bg-cyan-950/40",
    },
    green: {
      primary: "#34d399", // emerald-400
      secondary: "#10b981", // emerald-500
      glow: "rgba(52, 211, 153, 0.6)",
      bgGrid: "rgba(16, 185, 129, 0.12)",
      text: "text-emerald-400",
      border: "border-emerald-500/40",
      accentBg: "bg-emerald-950/40",
    },
    gold: {
      primary: "#fbbf24", // amber-400
      secondary: "#f59e0b", // amber-500
      glow: "rgba(251, 191, 36, 0.6)",
      bgGrid: "rgba(245, 158, 11, 0.12)",
      text: "text-amber-400",
      border: "border-amber-500/40",
      accentBg: "bg-amber-950/40",
    },
    violet: {
      primary: "#c084fc", // purple-400
      secondary: "#a855f7", // purple-500
      glow: "rgba(192, 132, 252, 0.6)",
      bgGrid: "rgba(168, 85, 247, 0.12)",
      text: "text-purple-400",
      border: "border-purple-500/40",
      accentBg: "bg-purple-950/40",
    },
  };

  const currentColors = themeColors[theme];

  // Real-time Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const timeData = new Uint8Array(512);
    const freqData = new Uint8Array(256);
    let phase = 0;

    const render = () => {
      frameCountRef.current++;
      phase += 0.05;
      const width = canvas.width;
      const height = canvas.height;

      // Handle high-DPI scaling
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * window.devicePixelRatio || canvas.height !== rect.height * window.devicePixelRatio) {
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }

      const drawWidth = rect.width;
      const drawHeight = rect.height;

      // Clear with slight alpha for phosphor trail persistence
      ctx.fillStyle = "rgba(4, 8, 18, 0.28)";
      ctx.fillRect(0, 0, drawWidth, drawHeight);

      // 1. Draw Oscilloscope CRT Grid if enabled
      if (showGrid) {
        ctx.strokeStyle = currentColors.bgGrid;
        ctx.lineWidth = 1;

        const gridSpacing = 28;
        ctx.beginPath();
        for (let x = 0; x < drawWidth; x += gridSpacing) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, drawHeight);
        }
        for (let y = 0; y < drawHeight; y += gridSpacing) {
          ctx.moveTo(0, y);
          ctx.lineTo(drawWidth, y);
        }
        ctx.stroke();

        // Center crosshairs
        ctx.strokeStyle = currentColors.primary;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.moveTo(drawWidth / 2, 0);
        ctx.lineTo(drawWidth / 2, drawHeight);
        ctx.moveTo(0, drawHeight / 2);
        ctx.lineTo(drawWidth, drawHeight / 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // 2. Fetch live audio data from Gemini Live
      const hasLiveWave = geminiLive.getWaveformData(timeData, channelFocus);
      const hasLiveFreq = geminiLive.getFrequencyData(freqData, channelFocus);

      // Compute RMS, instantaneous peak & frequency for HUD display
      let sumSquares = 0;
      let maxFreqVal = 0;
      let maxFreqIdx = 0;
      let instantMaxDev = 0;

      for (let i = 0; i < timeData.length; i++) {
        const norm = (timeData[i] - 128) / 128;
        const absNorm = Math.abs(norm);
        if (absNorm > instantMaxDev) instantMaxDev = absNorm;
        sumSquares += norm * norm;
      }
      const calculatedRms = Math.sqrt(sumSquares / timeData.length);
      setCurrentRms(calculatedRms);

      for (let i = 0; i < freqData.length; i++) {
        if (freqData[i] > maxFreqVal) {
          maxFreqVal = freqData[i];
          maxFreqIdx = i;
        }
      }
      // Estimated frequency in Hz
      const approxHz = Math.round((maxFreqIdx * (isSpeaking ? 24000 : 16000)) / 512);
      setPeakFrequency(approxHz);

      const isActive = isListening || isSpeaking || calculatedRms > 0.02 || audioPeak > 0.05;

      // Calculate combined instantaneous peak level
      let activePeak = Math.max(instantMaxDev, calculatedRms * 1.8, audioPeak);
      if (!isActive) {
        activePeak = 0.04;
      }

      // Configure decay dynamics
      let holdFrames = 25; // ~400ms at 60fps
      let decayMultiplier = 0.982;
      if (decaySpeed === "slow") {
        holdFrames = 48; // ~800ms
        decayMultiplier = 0.992;
      } else if (decaySpeed === "fast") {
        holdFrames = 12; // ~200ms
        decayMultiplier = 0.965;
      }

      // Persistent Peak Hold Update Logic
      if (activePeak >= peakHoldRef.current) {
        peakHoldRef.current = Math.min(1.0, activePeak);
        peakHoldTimerRef.current = holdFrames;
      } else {
        if (peakHoldTimerRef.current > 0) {
          peakHoldTimerRef.current--;
        } else {
          // Slow smooth decay
          peakHoldRef.current = Math.max(0.03, peakHoldRef.current * decayMultiplier);
        }
      }

      // Throttle state update to once every 6 frames to keep HUD reactive without re-rendering overhead
      if (frameCountRef.current % 6 === 0) {
        setPeakHoldValue(peakHoldRef.current);
      }

      // Color scheme based on speaker state
      const strokeColor = isSpeaking
        ? "#38bdf8"
        : isListening
        ? currentColors.primary
        : "rgba(100, 116, 139, 0.6)";

      // 3. Render according to selected mode
      if (mode === "oscilloscope") {
        // CRT Oscilloscope Beam
        ctx.save();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = strokeColor;
        ctx.shadowColor = currentColors.glow;
        ctx.shadowBlur = isActive ? 16 : 4;
        ctx.beginPath();

        const sliceWidth = drawWidth / timeData.length;
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
          let v = timeData[i] / 128.0; // 0 to 2

          if (!isActive) {
            // Idle harmonic breathing wave
            v = 1.0 + Math.sin(i * 0.05 + phase) * 0.04 + Math.cos(i * 0.02 - phase * 0.8) * 0.02;
          } else {
            // If raw PCM has low dynamic range (e.g. synthetic speech), inject peak harmonics
            const pcmDelta = Math.abs(v - 1.0);
            if (pcmDelta < 0.03 && audioPeak > 0.02) {
              const voiceSynth =
                Math.sin(i * 0.08 + phase * 2.5) * (audioPeak * 0.5) +
                Math.sin(i * 0.16 - phase * 1.8) * (audioPeak * 0.3) +
                Math.cos(i * 0.32 + phase * 3.2) * (audioPeak * 0.15);
              v = 1.0 + voiceSynth * gain;
            } else {
              // Amplify by gain
              v = 1.0 + (v - 1.0) * gain;
            }
          }

          const y = (v * drawHeight) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(drawWidth, drawHeight / 2);
        ctx.stroke();

        // Second harmonic phosphor glow line
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#ffffff";
        ctx.globalAlpha = isActive ? 0.7 : 0.3;
        ctx.stroke();
        ctx.restore();

        // 4. PERSISTENT DECAYING PEAK INDICATOR LINES (Upper and Lower)
        if (enablePeakHold) {
          ctx.save();
          const midY = drawHeight / 2;
          const clampedAmp = Math.min(0.94, peakHoldRef.current * gain * 0.88);
          const peakOffset = Math.max(12, (clampedAmp * drawHeight) / 2);
          const peakY_top = Math.max(14, midY - peakOffset);
          const peakY_bottom = Math.min(drawHeight - 14, midY + peakOffset);

          const isHighIntensity = peakHoldRef.current > 0.7;
          const isHolding = peakHoldTimerRef.current > 0;

          // Upper Persistent Peak Hold Line
          ctx.beginPath();
          ctx.setLineDash([6, 3]);
          ctx.lineWidth = isHolding ? 1.8 : 1.2;
          ctx.strokeStyle = isHighIntensity
            ? "#f87171" // rose-400 on overload
            : isHolding
            ? "#ffffff"
            : currentColors.secondary;
          ctx.shadowColor = isHighIntensity ? "rgba(248, 113, 113, 0.8)" : currentColors.glow;
          ctx.shadowBlur = isHolding ? 12 : 6;
          ctx.globalAlpha = isHolding ? 0.95 : 0.65;

          ctx.moveTo(8, peakY_top);
          ctx.lineTo(drawWidth - 8, peakY_top);
          ctx.stroke();

          // Lower Persistent Peak Hold Line
          ctx.beginPath();
          ctx.moveTo(8, peakY_bottom);
          ctx.lineTo(drawWidth - 8, peakY_bottom);
          ctx.stroke();
          ctx.setLineDash([]);

          // Terminal end-cap LED blocks
          ctx.fillStyle = isHighIntensity ? "#f87171" : "#ffffff";
          ctx.fillRect(8, peakY_top - 2.5, 6, 5);
          ctx.fillRect(drawWidth - 14, peakY_top - 2.5, 6, 5);
          ctx.fillRect(8, peakY_bottom - 2.5, 6, 5);
          ctx.fillRect(drawWidth - 14, peakY_bottom - 2.5, 6, 5);

          // HUD Reticle Peak Voltage Badges on right side
          ctx.font = "9px monospace";
          ctx.fillStyle = isHighIntensity ? "#fca5a5" : currentColors.primary;
          ctx.fillText(
            `▲ +PEAK ${(peakHoldRef.current * 100).toFixed(0)}%`,
            drawWidth - 84,
            Math.max(12, peakY_top - 4)
          );
          ctx.fillText(
            `▼ -PEAK ${(peakHoldRef.current * 100).toFixed(0)}%`,
            drawWidth - 84,
            Math.min(drawHeight - 4, peakY_bottom + 11)
          );

          // High-Intensity Warning Indicator
          if (isHighIntensity) {
            ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
            ctx.fillRect(10, peakY_top, drawWidth - 20, peakY_bottom - peakY_top);
          }

          ctx.restore();
        }
      } else if (mode === "waveform") {
        // Mirrored Holographic Waveform with Gradient Fill
        ctx.save();
        const midY = drawHeight / 2;
        const sliceWidth = drawWidth / (timeData.length / 2);

        const gradient = ctx.createLinearGradient(0, 0, 0, drawHeight);
        gradient.addColorStop(0, "rgba(34, 211, 238, 0.4)");
        gradient.addColorStop(0.5, "rgba(56, 189, 248, 0.05)");
        gradient.addColorStop(1, "rgba(34, 211, 238, 0.4)");

        ctx.fillStyle = gradient;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = currentColors.glow;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        let x = 0;
        for (let i = 0; i < timeData.length / 2; i++) {
          let v = (timeData[i] - 128) / 128.0;
          if (!isActive) {
            v = Math.sin(i * 0.08 + phase) * 0.08;
          } else if (Math.abs(v) < 0.03 && audioPeak > 0.02) {
            v = (Math.sin(i * 0.12 + phase * 2.2) * 0.6 + Math.sin(i * 0.24 - phase * 1.5) * 0.4) * audioPeak;
          }
          const amp = v * (drawHeight / 2.2) * gain;
          const yTop = midY - Math.abs(amp) - 2;

          if (i === 0) ctx.moveTo(x, yTop);
          else ctx.lineTo(x, yTop);
          x += sliceWidth;
        }

        // Mirror bottom
        for (let i = timeData.length / 2 - 1; i >= 0; i--) {
          x -= sliceWidth;
          let v = (timeData[i] - 128) / 128.0;
          if (!isActive) {
            v = Math.sin(i * 0.08 + phase) * 0.08;
          } else if (Math.abs(v) < 0.03 && audioPeak > 0.02) {
            v = (Math.sin(i * 0.12 + phase * 2.2) * 0.6 + Math.sin(i * 0.24 - phase * 1.5) * 0.4) * audioPeak;
          }
          const amp = v * (drawHeight / 2.2) * gain;
          const yBottom = midY + Math.abs(amp) + 2;
          ctx.lineTo(x, yBottom);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Persistent Peak Indicator envelope bounds in Waveform mode
        if (enablePeakHold) {
          ctx.save();
          const clampedAmp = Math.min(0.92, peakHoldRef.current * gain * 0.85);
          const peakOffset = (clampedAmp * drawHeight) / 2;
          const peakY_top = Math.max(12, midY - peakOffset);
          const peakY_bottom = Math.min(drawHeight - 12, midY + peakOffset);

          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = currentColors.secondary;
          ctx.shadowColor = currentColors.glow;
          ctx.shadowBlur = 8;
          ctx.globalAlpha = 0.75;

          ctx.beginPath();
          ctx.moveTo(10, peakY_top);
          ctx.lineTo(drawWidth - 10, peakY_top);
          ctx.moveTo(10, peakY_bottom);
          ctx.lineTo(drawWidth - 10, peakY_bottom);
          ctx.stroke();

          ctx.font = "9px monospace";
          ctx.fillStyle = currentColors.primary;
          ctx.fillText(`PEAK ENVELOPE: ${(peakHoldRef.current * 100).toFixed(0)}%`, 14, Math.max(12, peakY_top - 4));
          ctx.restore();
        }
      } else if (mode === "spectrum") {
        // Quantum FFT Spectrum Equalizer
        ctx.save();
        const barCount = 48;
        const barWidth = (drawWidth - barCount * 2) / barCount;
        const step = Math.floor(freqData.length / barCount);

        for (let i = 0; i < barCount; i++) {
          let value = freqData[i * step] / 255.0;
          if (!isActive) {
            value = (Math.sin(i * 0.3 + phase) * 0.5 + 0.5) * 0.12;
          } else if (value < 0.05 && audioPeak > 0.02) {
            const bell = Math.exp(-Math.pow((i - 18) / 10, 2));
            value = (Math.sin(i * 0.4 + phase * 3) * 0.3 + 0.7) * audioPeak * (0.4 + bell * 0.6);
          }
          const barHeight = Math.max(4, value * (drawHeight - 30) * gain);
          const x = i * (barWidth + 2) + 2;
          const y = drawHeight - barHeight - 10;

          // Bar gradient
          const barGrad = ctx.createLinearGradient(0, y, 0, drawHeight);
          barGrad.addColorStop(0, strokeColor);
          barGrad.addColorStop(1, "rgba(15, 23, 42, 0.4)");

          ctx.fillStyle = barGrad;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Top peak LED cap with persistent falling gravity
          if (enablePeakHold) {
            if (barHeight >= peakBarsRef.current[i]) {
              peakBarsRef.current[i] = barHeight;
              peakBarsTimerRef.current[i] = holdFrames;
            } else {
              if (peakBarsTimerRef.current[i] > 0) {
                peakBarsTimerRef.current[i]--;
              } else {
                peakBarsRef.current[i] = Math.max(4, peakBarsRef.current[i] - 1.2);
              }
            }
            const peakCapY = drawHeight - peakBarsRef.current[i] - 10;
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = currentColors.glow;
            ctx.shadowBlur = 6;
            ctx.fillRect(x, peakCapY - 2, barWidth, 2.5);
          } else {
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = currentColors.glow;
            ctx.shadowBlur = 6;
            ctx.fillRect(x, y - 2, barWidth, 2);
          }
        }
        ctx.restore();
      } else if (mode === "radial") {
        // Circular Radial Sonar Waveform
        ctx.save();
        const centerX = drawWidth / 2;
        const centerY = drawHeight / 2;
        const baseRadius = Math.min(centerX, centerY) * 0.55;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = currentColors.glow;
        ctx.shadowBlur = 14;

        ctx.beginPath();
        const points = 128;
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const sampleIdx = Math.floor((i / points) * (timeData.length / 2));
          let v = (timeData[sampleIdx] - 128) / 128.0;

          if (!isActive) {
            v = Math.sin(i * 0.2 + phase) * 0.06;
          } else if (Math.abs(v) < 0.03 && audioPeak > 0.02) {
            v = (Math.sin(i * 0.3 + phase * 2.5) * 0.6 + Math.cos(i * 0.6 - phase * 1.8) * 0.4) * audioPeak;
          }
          const r = baseRadius + v * 35 * gain;
          const px = centerX + Math.cos(angle) * r;
          const py = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Persistent Peak Orbital Ring in Radial mode
        if (enablePeakHold) {
          const peakRadius = baseRadius + Math.min(45, peakHoldRef.current * 42 * gain);
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = currentColors.secondary;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(centerX, centerY, peakRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Inner Core Ring
        ctx.strokeStyle = currentColors.bgGrid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [
    mode,
    theme,
    gain,
    showGrid,
    enablePeakHold,
    decaySpeed,
    channelFocus,
    isListening,
    isSpeaking,
    audioPeak,
    currentColors,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border ${currentColors.border} p-4 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col gap-3 font-mono ${className}`}
    >
      {/* Visualizer Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${currentColors.accentBg} border ${currentColors.border}`}>
            <Activity className={`w-4 h-4 ${currentColors.text} animate-pulse`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 tracking-wider">
                REAL-TIME VOICE OSCILLOSCOPE
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  isSpeaking
                    ? "bg-sky-500/20 text-sky-300 border border-sky-400"
                    : isListening
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {isSpeaking ? "JARVIS SPOKEN OUTPUT" : isListening ? "MIC STREAM ACTIVE" : "SYNAPSE STANDBY"}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
              <span>RATE: {isSpeaking ? "24.0 kHz" : "16.0 kHz"}</span>
              <span>•</span>
              <span>RMS: {(currentRms * 100).toFixed(1)}%</span>
              <span>•</span>
              <span
                className={`flex items-center gap-1 font-bold transition-colors ${
                  peakHoldValue > 0.7
                    ? "text-rose-400"
                    : peakHoldValue > 0.35
                    ? "text-amber-300"
                    : currentColors.text
                }`}
              >
                <span>PEAK HOLD: {(peakHoldValue * 100).toFixed(0)}%</span>
                {peakHoldValue > 0.7 && (
                  <span className="px-1 py-0.2 text-[8px] bg-rose-500/20 text-rose-300 border border-rose-400 rounded">
                    HOT
                  </span>
                )}
              </span>
              <span>•</span>
              <span>DOMINANT: {peakFrequency > 0 ? `${peakFrequency} Hz` : "0 Hz"}</span>
            </div>
          </div>
        </div>

        {/* Display Mode Chips */}
        <div className="flex items-center gap-1.5">
          {[
            { id: "oscilloscope" as VisualizerMode, label: "CRT BEAM", icon: Activity },
            { id: "waveform" as VisualizerMode, label: "WAVEFORM", icon: Zap },
            { id: "spectrum" as VisualizerMode, label: "SPECTRUM", icon: Radio },
            { id: "radial" as VisualizerMode, label: "SONAR", icon: Disc },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                id={`vis-mode-${m.id}`}
                onClick={() => setMode(m.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  mode === m.id
                    ? `${currentColors.accentBg} ${currentColors.text} border ${currentColors.border} shadow-sm`
                    : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Canvas Display Screen */}
      <div className="relative w-full h-44 sm:h-52 rounded-xl bg-slate-950/90 border border-slate-800/90 overflow-hidden shadow-inner flex items-center justify-center">
        {/* Holographic Scanlines Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_50%,rgba(0,0,0,0.4)_51%)] bg-[length:100%_4px] pointer-events-none z-10" />

        {/* Corner Reticle Accents */}
        <div className="absolute top-2 left-2 text-[9px] text-slate-500 pointer-events-none z-10">
          CH-1 [50mV/DIV]
        </div>
        <div className="absolute top-2 right-2 text-[9px] text-slate-500 pointer-events-none z-10">
          PEAK DECAY: {decaySpeed.toUpperCase()}
        </div>
        <div className="absolute bottom-2 left-2 text-[9px] text-slate-500 pointer-events-none z-10">
          FOCUS: {channelFocus.toUpperCase()}
        </div>
        <div className="absolute bottom-2 right-2 text-[9px] text-slate-500 pointer-events-none z-10">
          GAIN: {gain.toFixed(1)}x
        </div>

        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair relative z-0"
        />
      </div>

      {/* Visualizer Tuning Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        {/* Theme Palette Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">PHOSPHOR:</span>
          {(["cyan", "green", "gold", "violet"] as VisualizerTheme[]).map((t) => (
            <button
              key={t}
              id={`theme-btn-${t}`}
              onClick={() => setTheme(t)}
              className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                t === "cyan"
                  ? "bg-cyan-400 border-cyan-300"
                  : t === "green"
                  ? "bg-emerald-400 border-emerald-300"
                  : t === "gold"
                  ? "bg-amber-400 border-amber-300"
                  : "bg-purple-400 border-purple-300"
              } ${theme === t ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"}`}
              title={`Switch to ${t.toUpperCase()} phosphor`}
            />
          ))}
        </div>

        {/* Gain, Peak Hold, Grid & Decay Adjusters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">GAIN:</span>
            <input
              id="oscilloscope-gain-slider"
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={gain ?? 1.0}
              onChange={(e) => setGain(parseFloat(e.target.value))}
              className="w-16 sm:w-20 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-[10px] text-cyan-300 font-mono w-6">{gain.toFixed(1)}x</span>
          </div>

          {/* Peak Hold Persistent Indicator Toggle */}
          <button
            id="toggle-peak-hold-btn"
            onClick={() => setEnablePeakHold(!enablePeakHold)}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
              enablePeakHold
                ? `${currentColors.accentBg} ${currentColors.text} ${currentColors.border} shadow-sm`
                : "bg-slate-950 text-slate-500 border-slate-900"
            }`}
            title="Toggle persistent decaying peak indicator line"
          >
            <span>PEAK HOLD: {enablePeakHold ? "ON" : "OFF"}</span>
          </button>

          {/* Decay Rate Cycling Toggle */}
          {enablePeakHold && (
            <button
              id="toggle-decay-speed-btn"
              onClick={() => {
                setDecaySpeed((prev) =>
                  prev === "standard" ? "slow" : prev === "slow" ? "fast" : "standard"
                );
              }}
              className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Cycle peak decay speed"
            >
              DECAY: {decaySpeed === "slow" ? "SLOW (800ms)" : decaySpeed === "fast" ? "FAST (200ms)" : "STD (400ms)"}
            </button>
          )}

          <button
            id="toggle-grid-btn"
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-0.5 rounded text-[10px] border transition-all cursor-pointer ${
              showGrid
                ? "bg-slate-800 text-slate-200 border-slate-700"
                : "bg-slate-950 text-slate-500 border-slate-900"
            }`}
          >
            {showGrid ? "GRID: ON" : "GRID: OFF"}
          </button>

          <button
            id="toggle-channel-focus-btn"
            onClick={() => {
              setChannelFocus((prev) =>
                prev === "auto" ? "mic" : prev === "mic" ? "output" : "auto"
              );
            }}
            className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            SRC: {channelFocus.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};

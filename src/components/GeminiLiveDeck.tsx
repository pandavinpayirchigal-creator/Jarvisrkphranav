import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  Monitor,
  Sparkles,
  Radio,
  Zap,
  Activity,
  Shield,
  Layers,
  Cpu,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Flame,
  Globe,
  Sliders,
  Play,
  Square,
  Eye,
  EyeOff,
  Heart,
  UserCheck,
  MessageSquare,
  Wand2,
  Hand,
} from "lucide-react";
import {
  LiveVoicePersona,
  MessageAttachment,
  SystemTelemetry,
  SmartDevice,
} from "../types";
import { geminiLive } from "../services/geminiLiveService";
import { jarvisSound } from "../services/soundEffects";
import { OscilloscopeVisualizer } from "./OscilloscopeVisualizer";
import { ArcReactorHUD } from "./ArcReactorHUD";
import { CameraGestureController } from "./CameraGestureController";
import { useGeminiLive, SpokenTranscriptEntry } from "../context/GeminiLiveContext";

export type JarvisCompanionMode = "friend" | "professional" | "tactical";

interface GeminiLiveDeckProps {
  telemetry: SystemTelemetry;
  devices: SmartDevice[];
  onTriggerCamera: () => void;
  onTriggerScreen: () => void;
  attachedVision?: MessageAttachment | null;
  onClearVision?: () => void;
  onExecuteVoiceCommand?: (command: string) => void;
  onAddLog?: (level: "INFO" | "WARN" | "ERROR" | "DIAGNOSTIC", module: string, message: string) => void;
  enableOscilloscope?: boolean;
  enableArcReactor?: boolean;
  enableVisionTools?: boolean;
}

export const GeminiLiveDeck: React.FC<GeminiLiveDeckProps> = ({
  telemetry,
  devices,
  onTriggerCamera,
  onTriggerScreen,
  attachedVision,
  onClearVision,
  onExecuteVoiceCommand,
  onAddLog,
  enableOscilloscope = true,
  enableArcReactor = true,
  enableVisionTools = true,
}) => {
  const {
    streamStatus,
    selectedPersona,
    setSelectedPersona,
    companionMode,
    setCompanionMode,
    autoDialogue,
    setAutoDialogue,
    audioPeak,
    peakSource,
    transcripts,
    currentDraft,
    isProcessingTurn,
    toggleLiveStreaming,
    executeVoiceTurn,
    clearTranscripts,
    isGestureControlActive,
    setIsGestureControlActive,
    isPausedByGesture,
    lastGesture,
    resumeVoiceViaGesture,
  } = useGeminiLive();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customVoiceInput, setCustomVoiceInput] = useState<string>("");
  const [visualizerView, setVisualizerView] = useState<"oscilloscope" | "reactor">("oscilloscope");
  const [showGestureHUD, setShowGestureHUD] = useState<boolean>(false);

  const transcriptsContainerRef = useRef<HTMLDivElement>(null);
  const [autoScrollTranscripts, setAutoScrollTranscripts] = useState<boolean>(true);

  // Auto-scroll ONLY inside the inner transcript container, NEVER scrolling the main window
  useEffect(() => {
    if (autoScrollTranscripts && transcriptsContainerRef.current) {
      const container = transcriptsContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [transcripts, currentDraft, autoScrollTranscripts]);

  // Update Persona in Live service
  const handleSelectPersona = (persona: LiveVoicePersona) => {
    setSelectedPersona(persona);
  };

  // Toggle Live Streaming Microphone with optional attached vision frame
  const handleToggleStreaming = async () => {
    await toggleLiveStreaming();
    if (attachedVision && attachedVision.data) {
      geminiLive.sendVisionFrame(attachedVision.data, attachedVision.mimeType);
      onAddLog?.("INFO", "VISION_FEED", "Transmitted active visual frame to Gemini Live.");
    }
  };

  // Trigger Instant Spoken Command (Peak Turn with zero latency & companion personalization)
  const handleExecuteQuickCommand = async (commandText: string) => {
    if (!commandText.trim()) return;
    await executeVoiceTurn(commandText, devices, telemetry, attachedVision?.data, onAddLog);
  };

  // Copy Transcript Text
  const handleCopyTranscript = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    jarvisSound.playBlip();
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear Transcripts
  const handleClearTranscripts = () => {
    clearTranscripts();
  };

  const isLiveActive = streamStatus === "listening" || streamStatus === "speaking";

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 font-mono select-none">
      {/* Top Telemetry & Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center gap-3 backdrop-blur-md">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Stream State</div>
            <div className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
              {streamStatus === "listening"
                ? "🎙️ LIVE • LISTENING"
                : streamStatus === "speaking"
                ? "🔊 TRANSMITTING"
                : streamStatus === "connecting"
                ? "⏳ CONNECTING..."
                : streamStatus === "error"
                ? "⚠️ FALLBACK READY"
                : "READY • STANDBY"}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 backdrop-blur-md">
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-700 text-sky-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Oscilloscope</div>
            <div className="text-xs font-bold text-slate-200">
              512-Bin Time & FFT Sync
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 backdrop-blur-md">
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-700 text-emerald-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Fast Reply Engine</div>
            <div className="text-xs font-bold text-emerald-400">
              ~90ms Zero-Lag Audio
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 backdrop-blur-md">
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-700 text-amber-400">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Companion Mode</div>
            <div className="text-xs font-bold text-amber-300 capitalize">{companionMode} AI</div>
          </div>
        </div>
      </div>

      {/* Main Holographic Voice & Oscilloscope Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Real-Time Oscilloscope & Arc Reactor Deck */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Real-time Oscilloscope & Waveform Visualizer Display */}
          {enableOscilloscope && (
            <OscilloscopeVisualizer
              isListening={streamStatus === "listening"}
              isSpeaking={streamStatus === "speaking"}
              audioPeak={audioPeak}
              peakSource={peakSource}
            />
          )}

          {/* Central Interactive Voice Control & Reactor Hub */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-900/90 border border-cyan-500/30 shadow-2xl relative overflow-hidden backdrop-blur-xl flex flex-col items-center">
            {/* Gesture-Paused Warning Alert Banner */}
            {isPausedByGesture && (
              <div className="w-full mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-between gap-3 text-xs shadow-lg shadow-rose-950/40 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-sm">
                    ✋
                  </div>
                  <div>
                    <div className="font-bold text-rose-200 uppercase tracking-wide">
                      VOICE CONVERSATION PAUSED BY HAND GESTURE
                    </div>
                    <div className="text-[10px] text-rose-300">
                      Show closed fist ✊ or wave 👋 to camera to resume, or tap resume below.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => resumeVoiceViaGesture("fist")}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow"
                >
                  Resume Voice
                </button>
              </div>
            )}

            {/* Persona & Companion Mode Selector */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-4 mb-3 border-b border-slate-800/80 text-xs">
              {/* Persona selection */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  VOICE:
                </span>
                {(["Fenrir", "Zephyr", "Puck", "Kore", "Charon"] as LiveVoicePersona[]).map(
                  (persona) => (
                    <button
                      key={persona}
                      id={`persona-btn-${persona}`}
                      onClick={() => handleSelectPersona(persona)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                        selectedPersona === persona
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {persona}
                    </button>
                  )
                )}
              </div>

              {/* Companion attitude mode */}
              <div className="flex items-center gap-1">
                {[
                  { id: "friend" as JarvisCompanionMode, label: "FRIEND & ALLY", icon: Heart },
                  { id: "professional" as JarvisCompanionMode, label: "PRO SPEED", icon: Zap },
                  { id: "tactical" as JarvisCompanionMode, label: "TACTICAL", icon: Shield },
                ].map((modeItem) => {
                  const Icon = modeItem.icon;
                  return (
                    <button
                      key={modeItem.id}
                      id={`companion-mode-${modeItem.id}`}
                      onClick={() => {
                        setCompanionMode(modeItem.id);
                        jarvisSound.playBlip();
                        onAddLog?.(
                          "INFO",
                          "AI_MODE",
                          `JARVIS Companion Mode set to [${modeItem.label}].`
                        );
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        companionMode === modeItem.id
                          ? "bg-amber-500/20 text-amber-300 border border-amber-400 shadow-sm"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{modeItem.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Central Live Arc Reactor Core (Switchable UI Archetypes) */}
            {enableArcReactor ? (
              <div className="relative flex flex-col items-center justify-center my-2 py-1 w-full">
                <ArcReactorHUD
                  isListening={streamStatus === "listening"}
                  isSpeaking={streamStatus === "speaking"}
                  isThinking={isProcessingTurn}
                  onClickCenter={() => {
                    if (streamStatus === "speaking") {
                      geminiLive.interruptPlayback();
                    } else {
                      handleToggleStreaming();
                    }
                  }}
                  onInterrupt={() => geminiLive.interruptPlayback()}
                  systemStatus="optimal"
                />
              </div>
            ) : (
              /* Minimal Voice Control Mode when Reactor is hidden */
              <div className="flex items-center justify-center my-4 py-4">
                <button
                  id="live-reactor-minimal-btn"
                  onClick={() => {
                    if (streamStatus === "speaking") {
                      geminiLive.interruptPlayback();
                    } else {
                      handleToggleStreaming();
                    }
                  }}
                  className={`px-6 py-3.5 rounded-2xl flex items-center gap-3 border font-semibold text-sm transition-all cursor-pointer ${
                    streamStatus === "listening"
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-950/80 animate-pulse"
                      : streamStatus === "speaking"
                      ? "bg-sky-500/20 border-sky-400 text-sky-200 shadow-lg shadow-sky-950/80"
                      : "bg-slate-900 border-cyan-500/40 text-slate-200 hover:border-cyan-400"
                  }`}
                >
                  {streamStatus === "listening" ? (
                    <>
                      <Mic className="w-5 h-5 text-cyan-300 animate-bounce" />
                      <span>STREAMING AUDIO ACTIVE • TAP TO MUTE</span>
                    </>
                  ) : streamStatus === "speaking" ? (
                    <>
                      <Volume2 className="w-5 h-5 text-sky-300 animate-pulse" />
                      <span>JARVIS SPEAKING • TAP TO INTERRUPT</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-5 h-5 text-cyan-400" />
                      <span>START DUPLEX VOICE STREAM</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Live Action Controls (Mic, Auto-Dialogue, Gestures, Vision) */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 pt-3 border-t border-slate-800/80">
              <button
                id="toggle-live-mic-btn"
                onClick={handleToggleStreaming}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                  streamStatus === "listening"
                    ? "bg-rose-950/60 border-rose-500 text-rose-300 shadow-md shadow-rose-950/50"
                    : "bg-slate-900 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40"
                }`}
              >
                {streamStatus === "listening" ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span className="text-[9px]">MUTE MIC</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span className="text-[9px]">LIVE MIC</span>
                  </>
                )}
              </button>

              <button
                id="toggle-auto-dialogue-btn"
                onClick={() => {
                  setAutoDialogue(!autoDialogue);
                  jarvisSound.playBlip();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                  autoDialogue
                    ? "bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-md"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Zap className="w-4 h-4" />
                <span className="text-[9px]">
                  {autoDialogue ? "HANDS-FREE ON" : "PUSH TO TALK"}
                </span>
              </button>

              <button
                id="toggle-gesture-hud-btn"
                onClick={() => {
                  jarvisSound.playBlip();
                  setShowGestureHUD((prev) => !prev);
                  if (!showGestureHUD && !isGestureControlActive) {
                    setIsGestureControlActive(true);
                  }
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                  isGestureControlActive || showGestureHUD
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/50"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300"
                }`}
              >
                <Hand className={`w-4 h-4 ${isGestureControlActive ? "animate-pulse" : ""}`} />
                <span className="text-[9px]">
                  {isGestureControlActive ? "GESTURES ON" : "GESTURE HUD"}
                </span>
              </button>

              {enableVisionTools && (
                <>
                  <button
                    id="camera-vision-stream-btn"
                    onClick={() => {
                      jarvisSound.playBlip();
                      onTriggerCamera();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                      attachedVision?.type === "image"
                        ? "bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-md"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-[9px]">
                      {attachedVision?.type === "image" ? "CAM ACTIVE" : "ADD CAM"}
                    </span>
                  </button>

                  <button
                    id="screen-vision-stream-btn"
                    onClick={() => {
                      jarvisSound.playBlip();
                      onTriggerScreen();
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                      attachedVision?.type === "screen"
                        ? "bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-md"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span className="text-[9px]">
                      {attachedVision?.type === "screen" ? "SCREEN ON" : "SHARE SCREEN"}
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Active Vision Frame Thumbnail Preview */}
            {attachedVision && (
              <div className="w-full mt-3 p-3 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={attachedVision.data}
                    alt="Vision Stream Frame"
                    className="w-10 h-10 object-cover rounded-lg border border-cyan-400/50 shadow-md"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Live Vision Feed Attached
                    </div>
                    <div className="text-[10px] text-cyan-400">
                      Multimodal Optical Sync • Live Analysis Ready
                    </div>
                  </div>
                </div>

                <button
                  id="clear-vision-feed-btn"
                  onClick={() => {
                    jarvisSound.playBlip();
                    onClearVision?.();
                  }}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-950/50 text-xs"
                  title="Detach Vision Frame"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Optical Gesture Controller Section */}
          {(showGestureHUD || isGestureControlActive) && (
            <div className="w-full">
              <CameraGestureController
                onAddLog={onAddLog}
                onSnapshot={(b64) => {
                  if (b64) {
                    geminiLive.sendVisionFrame(b64, "image/jpeg");
                    onAddLog?.("INFO", "OPTICAL_SENSOR", "Dispatched camera frame to multimodal voice model.");
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Right Side: Live Spoken Transcripts & Tactical Triggers */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Spoken Dialogue Transcript Box */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-xl backdrop-blur-xl flex flex-col h-[400px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>LIVE SPOKEN CONVERSATION</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="toggle-transcript-autoscroll-btn"
                  onClick={() => {
                    setAutoScrollTranscripts(!autoScrollTranscripts);
                    jarvisSound.playBlip();
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                    autoScrollTranscripts
                      ? "bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                  title={autoScrollTranscripts ? "Auto-scroll enabled (click to lock position)" : "Auto-scroll locked (click to enable)"}
                >
                  {autoScrollTranscripts ? "SCROLL: ON" : "SCROLL: LOCKED"}
                </button>
                <button
                  id="clear-transcript-history-btn"
                  onClick={handleClearTranscripts}
                  className="p-1 text-slate-400 hover:text-rose-300 transition-colors"
                  title="Clear Transcripts"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Transcript Scroll Area */}
            <div
              ref={transcriptsContainerRef}
              className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs overscroll-contain"
            >
              {transcripts.map((entry) => {
                const isUser = entry.speaker === "user";
                return (
                  <div
                    key={entry.id}
                    className={`flex flex-col gap-1 p-3 rounded-xl border transition-all ${
                      isUser
                        ? "bg-slate-950/80 border-slate-800 ml-6 text-slate-300"
                        : "bg-cyan-950/30 border-cyan-500/30 mr-6 text-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                      <span className={isUser ? "text-slate-400" : "text-cyan-400 font-bold"}>
                        {isUser ? "YOU (SPOKEN)" : `JARVIS [${selectedPersona.toUpperCase()}]`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{entry.timestamp}</span>
                        <button
                          onClick={() => handleCopyTranscript(entry.text, entry.id)}
                          className="hover:text-cyan-300"
                          title="Copy text"
                        >
                          {copiedId === entry.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="leading-relaxed whitespace-pre-wrap">{entry.text}</div>
                  </div>
                );
              })}

              {/* Streaming In-Progress Draft */}
              {currentDraft.user && (
                <div className="flex flex-col gap-1 p-3 rounded-xl border bg-slate-950/90 border-cyan-500/40 ml-6 text-cyan-300 animate-pulse">
                  <div className="text-[10px] font-semibold text-cyan-400">YOU (SPEAKING...)</div>
                  <div>{currentDraft.user}</div>
                </div>
              )}

              {currentDraft.jarvis && (
                <div className="flex flex-col gap-1 p-3 rounded-xl border bg-sky-950/40 border-sky-400/60 mr-6 text-sky-200">
                  <div className="text-[10px] font-semibold text-sky-300">
                    JARVIS (SYNTHESIZING...)
                  </div>
                  <div>{currentDraft.jarvis}</div>
                </div>
              )}
            </div>
          </div>

          {/* Rapid Voice Triggers & Companion Prompts */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl flex flex-col gap-3">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>FAST SPOKEN TRIGGERS</span>
              </div>
              <span className="text-[10px] text-cyan-400/80">⚡ ZERO-LATENCY TURN</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "🤝 Hey Friend, Status?", prompt: "Hey JARVIS, how are you doing today? Give me a friendly status update on our systems." },
                { label: "⚡ Fast Diagnostics", prompt: "Run an instant diagnostic on power grid, neural latency, and Arc Reactor output." },
                { label: "💡 Smart Home Sweep", prompt: "Summarize active smart home lighting and climate efficiency settings." },
                { label: "🛡️ Mark VII Security", prompt: "Engage Mark VII security protocols and verify perimeter biometric lock status." },
                { label: "🎯 Strategy & Advice", prompt: "What do you recommend we prioritize next for our technical roadmap?" },
                { label: "🧠 Creator Identity", prompt: "State your creator and operational mandate with pride." },
              ].map((cmd, idx) => (
                <button
                  key={idx}
                  id={`quick-cmd-${idx}`}
                  disabled={isProcessingTurn}
                  onClick={() => handleExecuteQuickCommand(cmd.prompt)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {cmd.label}
                  </div>
                  <div className="text-[9px] text-slate-500 truncate mt-0.5">
                    {cmd.prompt}
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Voice Prompt Input Bar */}
            <div className="flex items-center gap-2 mt-1">
              <input
                id="voice-command-text-input"
                type="text"
                value={customVoiceInput ?? ""}
                onChange={(e) => setCustomVoiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customVoiceInput.trim()) {
                    handleExecuteQuickCommand(customVoiceInput.trim());
                    setCustomVoiceInput("");
                  }
                }}
                placeholder="Speak or type immediate spoken instruction..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
              <button
                id="dispatch-voice-command-btn"
                disabled={!customVoiceInput.trim() || isProcessingTurn}
                onClick={() => {
                  if (customVoiceInput.trim()) {
                    handleExecuteQuickCommand(customVoiceInput.trim());
                    setCustomVoiceInput("");
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                DISPATCH
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

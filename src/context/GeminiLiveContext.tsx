import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { geminiLive, LiveStreamingCallbacks } from "../services/geminiLiveService";
import { jarvisSound } from "../services/soundEffects";
import { LiveVoicePersona, JarvisCompanionMode, SmartDevice, SystemTelemetry } from "../types";

export interface SpokenTranscriptEntry {
  id: string;
  speaker: "user" | "jarvis";
  text: string;
  timestamp: string;
}

interface GeminiLiveContextType {
  streamStatus: "disconnected" | "connecting" | "connected" | "speaking" | "listening" | "error";
  selectedPersona: LiveVoicePersona;
  setSelectedPersona: (persona: LiveVoicePersona) => void;
  companionMode: JarvisCompanionMode;
  setCompanionMode: (mode: JarvisCompanionMode) => void;
  autoDialogue: boolean;
  setAutoDialogue: React.Dispatch<React.SetStateAction<boolean>>;
  audioPeak: number;
  peakSource: "mic" | "output";
  transcripts: SpokenTranscriptEntry[];
  setTranscripts: React.Dispatch<React.SetStateAction<SpokenTranscriptEntry[]>>;
  currentDraft: { user: string; jarvis: string };
  isProcessingTurn: boolean;
  toggleLiveStreaming: () => Promise<void>;
  disconnectLive: () => void;
  executeVoiceTurn: (
    commandText: string,
    devices?: SmartDevice[],
    telemetry?: SystemTelemetry,
    imageData?: string,
    onAddLog?: (level: "INFO" | "WARN" | "ERROR" | "DIAGNOSTIC", module: string, message: string) => void
  ) => Promise<void>;
  clearTranscripts: () => void;
  sendTextMessage: (text: string) => void;
}

const GeminiLiveContext = createContext<GeminiLiveContextType | null>(null);

export const useGeminiLive = () => {
  const context = useContext(GeminiLiveContext);
  if (!context) {
    throw new Error("useGeminiLive must be used within a GeminiLiveProvider");
  }
  return context;
};

const generateUniqueId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const GeminiLiveProvider: React.FC<{ children: ReactNode; onAddLog?: (level: "INFO" | "WARN" | "ERROR" | "DIAGNOSTIC", module: string, message: string) => void }> = ({
  children,
  onAddLog,
}) => {
  const [streamStatus, setStreamStatus] = useState<
    "disconnected" | "connecting" | "connected" | "speaking" | "listening" | "error"
  >(() => geminiLive.getStatus());
  const [selectedPersona, setSelectedPersona] = useState<LiveVoicePersona>("Fenrir");
  const [companionMode, setCompanionMode] = useState<JarvisCompanionMode>("friend");
  const [autoDialogue, setAutoDialogue] = useState<boolean>(true);
  const [audioPeak, setAudioPeak] = useState<number>(0);
  const [peakSource, setPeakSource] = useState<"mic" | "output">("mic");
  const [transcripts, setTranscripts] = useState<SpokenTranscriptEntry[]>([
    {
      id: "init-1",
      speaker: "jarvis",
      text: "Greetings. JARVIS neural voice link is active. I am at your service as your companion, friend, and operational assistant across all tabs. Speak freely or click the mic button anytime.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [currentDraft, setCurrentDraft] = useState<{ user: string; jarvis: string }>({
    user: "",
    jarvis: "",
  });
  const [isProcessingTurn, setIsProcessingTurn] = useState<boolean>(false);

  const jarvisDraftRef = useRef<string>("");
  const userDraftRef = useRef<string>("");

  useEffect(() => {
    const unsubscribe = geminiLive.subscribe({
      onStatusChange: (status) => {
        setStreamStatus(status);
        if (status === "speaking") {
          setPeakSource("output");
        } else if (status === "listening") {
          setPeakSource("mic");
        }
      },
      onTranscriptUpdate: (speaker, text, isFinal) => {
        if (speaker === "user") {
          if (text) {
            userDraftRef.current = text;
            setCurrentDraft((prev) => ({ ...prev, user: text }));
          }
          if (isFinal) {
            const textToCommit = (userDraftRef.current || text).trim();
            userDraftRef.current = "";
            setCurrentDraft((prev) => ({ ...prev, user: "" }));

            if (textToCommit) {
              const entryId = generateUniqueId("usr");
              setTranscripts((prev) => {
                if (prev.some((e) => e.id === entryId)) return prev;
                return [
                  ...prev,
                  {
                    id: entryId,
                    speaker: "user",
                    text: textToCommit,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ];
              });
            }
          }
        } else if (speaker === "jarvis") {
          if (text) {
            jarvisDraftRef.current = jarvisDraftRef.current ? `${jarvisDraftRef.current} ${text}` : text;
            setCurrentDraft((prev) => ({
              ...prev,
              jarvis: jarvisDraftRef.current,
            }));
          }
          if (isFinal) {
            const textToCommit = jarvisDraftRef.current.trim();
            jarvisDraftRef.current = "";
            setCurrentDraft((prev) => ({ ...prev, jarvis: "" }));

            if (textToCommit) {
              const entryId = generateUniqueId("jrv");
              setTranscripts((old) => {
                if (old.some((e) => e.id === entryId)) return old;
                return [
                  ...old,
                  {
                    id: entryId,
                    speaker: "jarvis",
                    text: textToCommit,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  },
                ];
              });
            }
          }
        }
      },
      onAudioPeak: (peak, source) => {
        setAudioPeak(peak);
        setPeakSource(source);
      },
      onError: (err) => {
        onAddLog?.("WARN", "LIVE_STREAM", `Live audio stream notice: ${err}`);
      },
      onInterrupted: () => {
        jarvisSound.playBlip();
        onAddLog?.("INFO", "LIVE_STREAM", "Voice output interrupted by user speech.");
      },
    });

    return () => {
      unsubscribe();
    };
  }, [onAddLog]);

  const handleSelectPersona = (persona: LiveVoicePersona) => {
    setSelectedPersona(persona);
    geminiLive.setPersona(persona);
    jarvisSound.playBlip();
    onAddLog?.("INFO", "VOICE_SYNTH", `Voice Persona updated to [${persona.toUpperCase()}].`);
  };

  const toggleLiveStreaming = async () => {
    jarvisSound.playBlip();

    if (streamStatus === "listening") {
      geminiLive.stopMicrophone();
      setStreamStatus("connected");
      onAddLog?.("INFO", "LIVE_STREAM", "Microphone stream paused.");
    } else {
      const success = await geminiLive.startMicrophone();
      if (success) {
        onAddLog?.("INFO", "LIVE_STREAM", "Gemini Live microphone streaming engaged across all views.");
      }
    }
  };

  const disconnectLive = () => {
    geminiLive.disconnect();
    setStreamStatus("disconnected");
    onAddLog?.("INFO", "LIVE_STREAM", "Live audio stream session disconnected.");
  };

  const clearTranscripts = () => {
    jarvisSound.playBlip();
    setTranscripts([]);
  };

  const sendTextMessage = (text: string) => {
    geminiLive.sendTextMessage(text);
  };

  const executeVoiceTurn = async (
    commandText: string,
    devices?: SmartDevice[],
    telemetry?: SystemTelemetry,
    imageData?: string,
    logger?: (level: "INFO" | "WARN" | "ERROR" | "DIAGNOSTIC", module: string, message: string) => void
  ) => {
    if (!commandText.trim() || isProcessingTurn) return;

    setIsProcessingTurn(true);
    jarvisSound.playBeep();

    const userEntry: SpokenTranscriptEntry = {
      id: generateUniqueId("usr"),
      speaker: "user",
      text: commandText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setTranscripts((prev) => [...prev, userEntry]);
    (logger || onAddLog)?.("INFO", "VOICE_COMMAND", `Voice trigger dispatched: "${commandText}"`);

    try {
      const companionPromptModifier =
        companionMode === "friend"
          ? "Personality Mode: Best Friend & Loyal Companion (Warm, supportive, witty, polite, conversational, encouraging)."
          : companionMode === "professional"
          ? "Personality Mode: Apex Professional AI (Ultra-fast, razor-sharp, analytical, highly articulate, direct)."
          : "Personality Mode: Tactical Commander (Concise, high-efficiency, status-driven, mission-ready).";

      const devicesSummary = devices
        ? devices.filter((d) => d.status).map((d) => `${d.name} (${d.value ?? "Active"})`).join(", ")
        : "Standard Arrays Active";

      const arcEff = telemetry?.arcReactorEfficiency ?? 100;
      const cpuLoad = telemetry?.cpuUsage ?? 24;

      const contextSummary = `Smart Devices: ${devicesSummary}. Arc Reactor: ${arcEff}%. CPU Load: ${cpuLoad}%. ${companionPromptModifier}`;

      const response = await fetch("/api/jarvis/voice-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: commandText,
          voiceName: selectedPersona,
          contextExtra: contextSummary,
          image: imageData || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.text || "I am always here with you across all systems. How may I assist next?";

      setTranscripts((prev) => [
        ...prev,
        {
          id: generateUniqueId("jrv"),
          speaker: "jarvis",
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      if (data.audio) {
        await geminiLive.playRawPCM(data.audio);
      }

      // If Auto Dialogue is active, resume microphone
      if (autoDialogue && streamStatus !== "listening") {
        setTimeout(() => {
          geminiLive.startMicrophone().catch(() => {});
        }, 500);
      }
    } catch (err: any) {
      console.error("Fast voice turn error:", err);
      (logger || onAddLog)?.("ERROR", "VOICE_TURN", `Voice response error: ${err.message}`);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  return (
    <GeminiLiveContext.Provider
      value={{
        streamStatus,
        selectedPersona,
        setSelectedPersona: handleSelectPersona,
        companionMode,
        setCompanionMode,
        autoDialogue,
        setAutoDialogue,
        audioPeak,
        peakSource,
        transcripts,
        setTranscripts,
        currentDraft,
        isProcessingTurn,
        toggleLiveStreaming,
        disconnectLive,
        executeVoiceTurn,
        clearTranscripts,
        sendTextMessage,
      }}
    >
      {children}
    </GeminiLiveContext.Provider>
  );
};

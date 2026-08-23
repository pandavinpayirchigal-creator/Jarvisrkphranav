import React, { useState, useEffect, useCallback } from "react";
import {
  ChatMessage,
  MessageAttachment,
  SmartDevice,
  SystemTelemetry,
  SystemLog,
  MemoryItem,
  WorkflowStep,
  NeuralPowerMode,
  MessageReaction,
  AppSettings,
  BackgroundSettings,
  FeatureFlags,
} from "./types";
import { Header, NavTab } from "./components/Header";
import { GeminiLiveDeck } from "./components/GeminiLiveDeck";
import { SmartHomeDeck } from "./components/SmartHomeDeck";
import { DiagnosticsTerminal } from "./components/DiagnosticsTerminal";
import { AnalyticsWorkbench } from "./components/AnalyticsWorkbench";
import { MemoryMatrix } from "./components/MemoryMatrix";
import { WorkflowAutomation } from "./components/WorkflowAutomation";
import { HologramLab } from "./components/HologramLab";
import { CameraCaptureModal } from "./components/CameraCaptureModal";
import { ScreenCaptureModal } from "./components/ScreenCaptureModal";
import { SettingsModal } from "./components/SettingsModal";
import { BackgroundCanvas } from "./components/BackgroundCanvas";
import { StarkHUDChassisWings } from "./components/StarkHUDChassisWings";
import { jarvisSound } from "./services/soundEffects";
import { speechService } from "./services/speechService";
import { GeminiLiveProvider } from "./context/GeminiLiveContext";

const INITIAL_DEVICES: SmartDevice[] = [
  {
    id: "dev-light-living",
    name: "Living Room Main Array",
    category: "lighting",
    status: true,
    value: 80,
    unit: "%",
    room: "Living Quarters",
    iconName: "light",
    lastUpdated: "Just now",
    details: "Ambient warm spectrum (3200K)",
  },
  {
    id: "dev-light-lab",
    name: "Engineering Lab Illumination",
    category: "lighting",
    status: true,
    value: 100,
    unit: "%",
    room: "Lab Sub-Level",
    iconName: "light",
    lastUpdated: "Just now",
    details: "Daylight optimal (5500K)",
  },
  {
    id: "dev-climate-main",
    name: "Stark Climate Control (HVAC)",
    category: "climate",
    status: true,
    value: 70,
    unit: "°F",
    room: "Penthouse Suite",
    iconName: "thermostat",
    lastUpdated: "Just now",
    details: "Auto eco-cycle active",
  },
  {
    id: "dev-lock-front",
    name: "Main Perimeter Security Gate",
    category: "security",
    status: true,
    room: "Perimeter Entrance",
    iconName: "lock",
    lastUpdated: "Just now",
    details: "Biometric lock engaged",
  },
  {
    id: "dev-lock-vault",
    name: "Mark VII Tech Vault Lock",
    category: "security",
    status: true,
    room: "Secure Armory",
    iconName: "lock",
    lastUpdated: "Just now",
    details: "Dual-key encryption",
  },
  {
    id: "dev-power-solar",
    name: "Arc Reactor & Solar Grid",
    category: "power",
    status: true,
    value: 98,
    unit: "kW",
    room: "Power Core",
    iconName: "power",
    lastUpdated: "Just now",
    details: "Zero grid dependency",
  },
  {
    id: "dev-media-sound",
    name: "Acoustic Spatial Sound System",
    category: "media",
    status: false,
    value: "Standby",
    room: "Studio",
    iconName: "media",
    lastUpdated: "Just now",
    details: "High-fidelity spatial audio",
  },
];

const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: "mem-1",
    category: "preference",
    title: "Master Creator Recognition",
    content: "JARVIS was created by RK Phranav. Maintain high respect, calm confidence, and concise operational sharpness.",
    createdAt: "2026-08-21",
    updatedAt: "2026-08-21 12:00",
    tags: ["creator", "identity", "rk_phranav"],
  },
  {
    id: "mem-2",
    category: "project",
    title: "Project Mark VII Suit Diagnostics",
    content: "Continuous telemetry on repulsor flux, composite alloy thermal integrity, and neural response synchronization.",
    createdAt: "2026-08-20",
    updatedAt: "2026-08-21 10:15",
    tags: ["engineering", "hardware", "aerospace"],
  },
  {
    id: "mem-3",
    category: "preference",
    title: "Default Climate & Atmosphere",
    content: "Maintain workshop and penthouse ambient temperature at 70°F with 45% relative humidity.",
    createdAt: "2026-08-19",
    updatedAt: "2026-08-21 09:30",
    tags: ["iot", "climate", "comfort"],
  },
  {
    id: "mem-4",
    category: "decision",
    title: "Server Security Architecture",
    content: "Enforce zero-trust token handshakes on all internal API calls with automatic anomaly quarantine.",
    createdAt: "2026-08-18",
    updatedAt: "2026-08-21 08:00",
    tags: ["security", "cloud", "zero-trust"],
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  background: {
    themeId: "stark_mark85_armor",
    opacity: 0.85,
    blur: 0,
    darkOverlay: 0.15,
    showGridOverlay: true,
    showParticles: true,
  },
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
};

const SETTINGS_STORAGE_KEY = "jarvis_system_settings_v1";

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          background: { ...DEFAULT_SETTINGS.background, ...(parsed.background || {}) },
          features: { ...DEFAULT_SETTINGS.features, ...(parsed.features || {}) },
        };
      }
    } catch (e) {
      console.warn("Failed to read settings from storage:", e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>("live");
  const [isSoundEnabled, setIsSoundEnabled] = useState(
    settings.features.enableSoundFX ?? true
  );
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Auto-switch away from disabled tab
  useEffect(() => {
    const tabFeatureMap: Record<NavTab, keyof FeatureFlags> = {
      live: "enableGeminiLive",
      hologram: "enableHolograms",
      smarthome: "enableSmartHome",
      diagnostics: "enableDiagnostics",
      analytics: "enableAnalytics",
      memory: "enableMemory",
      workflows: "enableWorkflows",
    };

    if (!settings.features[tabFeatureMap[activeTab]]) {
      const tabOrder: NavTab[] = ["live", "hologram", "smarthome", "diagnostics", "analytics", "memory", "workflows"];
      const fallback = tabOrder.find((t) => settings.features[tabFeatureMap[t]]);
      if (fallback) {
        setActiveTab(fallback);
      }
    }
  }, [settings.features, activeTab]);

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.warn("Failed to persist settings:", e);
    }
    setIsSoundEnabled(newSettings.features.enableSoundFX);
    jarvisSound.setEnabled(newSettings.features.enableSoundFX);
    addLog("INFO", "SETTINGS", "JARVIS workspace parameters & background canvas updated.");
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {
      console.warn("Failed to persist settings:", e);
    }
    setIsSoundEnabled(DEFAULT_SETTINGS.features.enableSoundFX);
    jarvisSound.setEnabled(DEFAULT_SETTINGS.features.enableSoundFX);
    addLog("INFO", "SETTINGS", "Reset all workspace appearance & features to defaults.");
  };

  // Voice and HUD states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Modals
  const [isCamOpen, setIsCamOpen] = useState(false);
  const [isScreenOpen, setIsScreenOpen] = useState(false);

  // Attached Vision Frame for Gemini Live
  const [attachedVision, setAttachedVision] = useState<MessageAttachment | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      role: "model",
      text: `Good day. I’m **JARVIS**, an advanced personal AI assistant created by **RK Phranav**.

I am fully initialized with natural voice recognition, multimodal vision diagnostics, real-time smart device automation, data analysis, and autonomous workflow pipelines. 

How may I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [enableSearch, setEnableSearch] = useState(false);
  const [powerMode, setPowerMode] = useState<NeuralPowerMode>("turbo");

  // Smart devices state
  const [devices, setDevices] = useState<SmartDevice[]>(INITIAL_DEVICES);

  // Memories state
  const [memories, setMemories] = useState<MemoryItem[]>(INITIAL_MEMORIES);

  // Telemetry state
  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    cpuUsage: 28,
    memoryUsage: 42,
    neuralLatency: 18,
    powerDrawKw: 3.4,
    arcReactorEfficiency: 99.8,
    thermalStatus: "optimal",
    subsystems: [
      { name: "JARVIS Core Engine", status: "online", uptime: "99.99%", healthScore: 100 },
      { name: "Multimodal Vision Matrix", status: "online", uptime: "99.95%", healthScore: 98 },
      { name: "Acoustic Speech Synthesizer", status: "online", uptime: "99.98%", healthScore: 99 },
      { name: "IoT Device Bridge", status: "online", uptime: "99.90%", healthScore: 97 },
      { name: "Long-term Memory Store", status: "online", uptime: "100.0%", healthScore: 100 },
      { name: "Autonomous Task Runner", status: "online", uptime: "99.92%", healthScore: 99 },
    ],
  });

  // System logs
  const [logs, setLogs] = useState<SystemLog[]>([
    {
      id: "log-1",
      timestamp: new Date().toLocaleTimeString(),
      level: "INFO",
      module: "BOOT",
      message: "JARVIS Core operational. Creator profile: RK Phranav loaded.",
    },
    {
      id: "log-2",
      timestamp: new Date().toLocaleTimeString(),
      level: "INFO",
      module: "AUDIO",
      message: "Acoustic synthesizer initialized with low-latency Web Audio API.",
    },
    {
      id: "log-3",
      timestamp: new Date().toLocaleTimeString(),
      level: "INFO",
      module: "SECURITY",
      message: "Perimeter locks verified. Quantum key exchange nominal.",
    },
  ]);

  const addLog = useCallback(
    (level: SystemLog["level"], module: string, message: string) => {
      const newLog: SystemLog = {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        module,
        message,
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 100)]);
    },
    []
  );

  // Continuous subtle telemetry fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        cpuUsage: Math.max(12, Math.min(85, prev.cpuUsage + Math.floor(Math.random() * 7 - 3))),
        neuralLatency: Math.max(10, Math.min(45, prev.neuralLatency + Math.floor(Math.random() * 5 - 2))),
        powerDrawKw: Number((3.2 + Math.random() * 0.5).toFixed(1)),
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    jarvisSound.setEnabled(next);
  };

  const handleInterruptVoice = () => {
    speechService.stopSpeaking();
    setIsSpeaking(false);
    jarvisSound.playBlip();
  };

  // Inspect user message for automated smart-home intent
  const checkAndExecuteSmartHomeIntent = (text: string): { toolName: string; action: string; resultSummary: string } | null => {
    const lower = text.toLowerCase();

    if (lower.includes("turn on") && (lower.includes("light") || lower.includes("lights"))) {
      setDevices((prev) =>
        prev.map((d) => (d.category === "lighting" ? { ...d, status: true, value: 100 } : d))
      );
      addLog("INFO", "SMARTHOME", "Voice override: All illumination arrays set to 100% active.");
      return {
        toolName: "SmartHome.Lighting",
        action: "enableLighting",
        resultSummary: "Engaged all room lighting fixtures to 100% brightness.",
      };
    }

    if (lower.includes("turn off") && (lower.includes("light") || lower.includes("lights"))) {
      setDevices((prev) =>
        prev.map((d) => (d.category === "lighting" ? { ...d, status: false, value: 0 } : d))
      );
      addLog("INFO", "SMARTHOME", "Voice override: All lighting arrays switched OFF.");
      return {
        toolName: "SmartHome.Lighting",
        action: "disableLighting",
        resultSummary: "Deactivated all room illumination arrays.",
      };
    }

    if (lower.includes("dim") && (lower.includes("light") || lower.includes("lights"))) {
      setDevices((prev) =>
        prev.map((d) => (d.category === "lighting" ? { ...d, status: true, value: 30 } : d))
      );
      addLog("INFO", "SMARTHOME", "Voice override: Lighting dimmed to 30%.");
      return {
        toolName: "SmartHome.Lighting",
        action: "dimLighting",
        resultSummary: "Dimmed room lights to 30% ambient level.",
      };
    }

    if (lower.includes("lock") && (lower.includes("door") || lower.includes("doors") || lower.includes("gate") || lower.includes("vault"))) {
      setDevices((prev) =>
        prev.map((d) => (d.category === "security" ? { ...d, status: true } : d))
      );
      addLog("INFO", "SECURITY", "Voice override: All perimeter locks secured.");
      return {
        toolName: "SmartHome.Security",
        action: "lockPerimeter",
        resultSummary: "Engaged biometric deadbolts on all perimeter doors and vaults.",
      };
    }

    if (lower.includes("unlock") && (lower.includes("door") || lower.includes("gate"))) {
      setDevices((prev) =>
        prev.map((d) => (d.id === "dev-lock-front" ? { ...d, status: false } : d))
      );
      addLog("WARN", "SECURITY", "Voice override: Front perimeter gate unlocked.");
      return {
        toolName: "SmartHome.Security",
        action: "unlockFrontGate",
        resultSummary: "Disengaged front perimeter gate lock for authorized entry.",
      };
    }

    return null;
  };

  // Handle reaction on individual chat messages
  const handleReactMessage = (messageId: string, reaction: MessageReaction) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const currentReactions = msg.reactions || {};
        const isCurrentlyActive = !!currentReactions[reaction];
        const newReactions = {
          ...currentReactions,
          [reaction]: !isCurrentlyActive,
        };
        let primaryReaction: MessageReaction | undefined = undefined;
        if (newReactions.heart) primaryReaction = "heart";
        else if (newReactions.like) primaryReaction = "like";
        else if (newReactions.dislike) primaryReaction = "dislike";

        return {
          ...msg,
          reaction: primaryReaction,
          reactions: newReactions,
        };
      })
    );
    addLog("INFO", "USER_FEEDBACK", `User reaction [${reaction.toUpperCase()}] updated for transmission.`);
  };

  // Main message sending handler (Accelerated with SSE Streaming)
  const handleSendMessage = async (text: string, attachments: MessageAttachment[] = []) => {
    if (!text && attachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setPendingAttachments([]);
    setIsThinking(true);
    addLog("INFO", "NEURAL_CORE", `Processing prompt in [${powerMode.toUpperCase()}] mode: "${text.slice(0, 40)}..."`);

    // Check for smart home command execution
    const executedTool = checkAndExecuteSmartHomeIntent(text);

    // Initial placeholder model response message for streaming tokens
    const botMsgId = `msg-${Date.now() + 1}-${Math.random().toString(36).slice(2, 9)}`;
    let botText = "";
    let botGrounding: any[] = [];

    try {
      // Prepare memory context
      const memoryContext = memories
        .map((m) => `[Memory #${m.category}]: ${m.title} - ${m.content}`)
        .join("\n");

      // Prepare payload for backend
      const payloadMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        text: m.text,
        images: m.attachments
          ?.filter((a) => a.type === "image" || a.type === "screen")
          .map((a) => ({ data: a.data, mimeType: a.mimeType })),
      }));

      // Initiate ultra-fast streaming connection
      const res = await fetch("/api/jarvis/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          systemPromptExtra: `Current Memory Matrix Context:\n${memoryContext}\n\nCurrent Connected Smart Devices:\n${JSON.stringify(
            devices.map((d) => ({ name: d.name, status: d.status, value: d.value }))
          )}`,
          enableSearch,
          mode: powerMode,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No readable stream received from JARVIS core.");
      }

      // Add streaming message to UI immediately
      const streamingBotMessage: ChatMessage = {
        id: botMsgId,
        role: "model",
        text: "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toolExecuted: executedTool || undefined,
        isStreaming: true,
      };
      setMessages((prev) => [...prev, streamingBotMessage]);
      setIsThinking(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              botText += parsed.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, text: botText, isStreaming: true } : m
                )
              );
            }
            if (parsed.groundingChunks && Array.isArray(parsed.groundingChunks)) {
              botGrounding = [...botGrounding, ...parsed.groundingChunks];
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, groundingChunks: botGrounding } : m
                )
              );
            }
          } catch (e: any) {
            // Non-fatal parse warning during chunk boundary
          }
        }
      }

      // Finalize the message state
      const finalCleanText = botText.trim() || "Operational protocols engaged. How may I assist you?";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                text: finalCleanText,
                isStreaming: false,
              }
            : m
        )
      );

      addLog("INFO", "JARVIS_CORE", `Response completed (${finalCleanText.length} chars) via ${powerMode.toUpperCase()} stream.`);
      jarvisSound.playSuccess();

      // Optional voice synthesis
      if (isSoundEnabled) {
        setIsSpeaking(true);
        speechService.speak(finalCleanText, {
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
    } catch (err: any) {
      setIsThinking(false);
      console.error("Chat Error:", err);
      jarvisSound.playAlert();
      addLog("ERROR", "JARVIS_CORE", `Execution error: ${err.message}`);

      // If streaming message was created, update it, otherwise create error message
      setMessages((prev) => {
        const existing = prev.find((m) => m.id === botMsgId);
        if (existing) {
          return prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: `An anomaly occurred in the neural streaming pipeline: ${err.message}. Switching to backup core protocols.`,
                  isStreaming: false,
                }
              : m
          );
        } else {
          const errorMessage: ChatMessage = {
            id: `msg-${Date.now() + 1}-${Math.random().toString(36).slice(2, 9)}`,
            role: "model",
            text: `My apologies. An anomaly occurred in the neural inference pipeline: ${err.message}. Please verify the connection or try again.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          return [...prev, errorMessage];
        }
      });
    }
  };

  // Voice STT Toggle
  const handleToggleListen = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      jarvisSound.playBlip();
    } else {
      jarvisSound.playActivationChime();
      speechService.startListening({
        onStart: () => {
          setIsListening(true);
          addLog("INFO", "VOICE_RECOGNITION", "Microphone listening stream active.");
        },
        onResult: (transcript, isFinal) => {
          if (isFinal) {
            setIsListening(false);
            handleSendMessage(transcript, pendingAttachments);
          }
        },
        onError: (err) => {
          setIsListening(false);
          addLog("WARN", "VOICE_RECOGNITION", `Microphone error: ${err}`);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    }
  };

  // Diagnostic API handler
  const handleTriggerDiagnostic = async (customIssue?: string): Promise<string> => {
    addLog("DIAGNOSTIC", "ROOT_CAUSE", `Initiating diagnostic suite: ${customIssue || "General health"}`);
    const res = await fetch("/api/jarvis/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        errorDescription: customIssue,
        telemetryData: telemetry,
        systemLogs: logs.map((l) => `[${l.timestamp}] [${l.level}] [${l.module}] ${l.message}`).join("\n"),
      }),
    });
    const data = await res.json();
    if (data.status === "success") {
      addLog("INFO", "ROOT_CAUSE", "Root cause diagnostic completed.");
      return data.analysis;
    }
    throw new Error(data.error || "Diagnostic failed");
  };

  // Analytics API handler
  const handleRunDataAnalysis = async (
    datasetSummary: string,
    query: string,
    datasetName: string
  ): Promise<string> => {
    addLog("INFO", "ANALYTICS", `Executing statistical model on '${datasetName}'`);
    const res = await fetch("/api/jarvis/analyze-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataSummary: datasetSummary, userQuery: query, datasetName }),
    });
    const data = await res.json();
    if (data.status === "success") {
      addLog("INFO", "ANALYTICS", "Data analysis completed.");
      return data.analysis;
    }
    throw new Error(data.error || "Analysis failed");
  };

  // Workflow API handlers
  const handleGenerateWorkflow = async (objective: string) => {
    addLog("INFO", "WORKFLOW", `Deconstructing goal: "${objective}"`);
    const res = await fetch("/api/jarvis/generate-workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objective }),
    });
    const data = await res.json();
    if (data.status === "success") {
      addLog("INFO", "WORKFLOW", "Structured workflow pipeline compiled.");
      return data.workflow;
    }
    throw new Error(data.error || "Workflow failed");
  };

  const handleExecuteWorkflowStep = async (step: WorkflowStep): Promise<boolean> => {
    addLog("INFO", "WORKFLOW_EXEC", `Executing step ${step.stepNumber}: ${step.title} via [${step.module}]`);

    // Perform real state actions if applicable
    if (step.module.toLowerCase().includes("smart") || step.module.toLowerCase().includes("home")) {
      setDevices((prev) =>
        prev.map((d) => (d.category === "security" ? { ...d, status: true } : d))
      );
    }
    return true;
  };

  // Smart home presets
  const handleApplyPreset = (presetName: string) => {
    addLog("INFO", "SMARTHOME", `Applying automation preset: ${presetName}`);
    if (presetName === "Cinema Mode") {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.category === "lighting") return { ...d, status: true, value: 15 };
          if (d.category === "media") return { ...d, status: true, value: "Cinema Surround" };
          return d;
        })
      );
    } else if (presetName === "Night Protocol") {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.category === "lighting") return { ...d, status: false, value: 0 };
          if (d.category === "security") return { ...d, status: true };
          if (d.category === "climate") return { ...d, value: 68 };
          return d;
        })
      );
    } else if (presetName === "Daylight Optimal") {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.category === "lighting") return { ...d, status: true, value: 90 };
          if (d.category === "climate") return { ...d, value: 72 };
          return d;
        })
      );
    }
  };

  return (
    <GeminiLiveProvider onAddLog={addLog}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">
        {/* Dynamic Customizable Background Canvas & Particles */}
        <BackgroundCanvas settings={settings.background} isDarkMode={isDarkMode} />

        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isSoundEnabled={isSoundEnabled}
          onToggleSound={handleToggleSound}
          arcStatus={telemetry.thermalStatus.toUpperCase()}
          arcReactorEfficiency={telemetry.arcReactorEfficiency}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          features={settings.features}
          currentTheme={settings.background.themeId}
          onSelectTheme={(themeId) =>
            handleUpdateSettings({
              ...settings,
              background: { ...settings.background, themeId },
            })
          }
        />

        {/* Tactical Stark HUD Chassis Wings (Telemetry & Orbital array) */}
        <StarkHUDChassisWings
          telemetry={telemetry}
          logs={logs}
          devices={devices}
          isSoundEnabled={isSoundEnabled}
          onTriggerAction={(action) => {
            if (action === "lockdown") {
              setDevices((prev) =>
                prev.map((d) => (d.category === "security" ? { ...d, status: true } : d))
              );
              addLog("WARN", "SECURITY", "Stark Perimeter lockdown protocol ENGAGED.");
            } else if (action === "maxpower") {
              setTelemetry((prev) => ({
                ...prev,
                arcReactorEfficiency: 99.9,
                cpuUsage: 94,
                powerDrawKw: 5.2,
              }));
              addLog("INFO", "POWER", "Arc Reactor routed to maximum flux output.");
            } else if (action === "cinema") {
              handleApplyPreset("Cinema Mode");
            } else if (action === "daylight") {
              handleApplyPreset("Daylight Optimal");
            }
          }}
        />

        {/* Main Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 relative z-10">
          {activeTab === "live" && settings.features.enableGeminiLive && (
            <GeminiLiveDeck
              telemetry={telemetry}
              devices={devices}
              onTriggerCamera={() => setIsCamOpen(true)}
              onTriggerScreen={() => setIsScreenOpen(true)}
              attachedVision={attachedVision}
              onClearVision={() => setAttachedVision(null)}
              onAddLog={addLog}
              onExecuteVoiceCommand={(cmd) => {
                addLog("INFO", "VOICE_COMMAND", `Spoken instruction received: "${cmd}"`);
              }}
              enableOscilloscope={settings.features.enableOscilloscope}
              enableArcReactor={settings.features.enableArcReactor}
              enableVisionTools={settings.features.enableVisionTools}
            />
          )}

          {activeTab === "hologram" && settings.features.enableHolograms && (
            <div className="overflow-y-auto pr-1 h-full max-w-7xl mx-auto">
              <HologramLab onSpeak={(t) => speechService.speak(t)} />
            </div>
          )}

          {activeTab === "smarthome" && settings.features.enableSmartHome && (
            <div className="overflow-y-auto pr-1 h-full max-w-5xl mx-auto">
              <SmartHomeDeck
                devices={devices}
                onUpdateDevice={(updated) => {
                  setDevices((prev) =>
                    prev.map((d) => (d.id === updated.id ? updated : d))
                  );
                  addLog(
                    "INFO",
                    "SMARTHOME",
                    `Manual update: ${updated.name} -> Status: ${updated.status ? "ON" : "OFF"}`
                  );
                }}
                onApplyPreset={handleApplyPreset}
              />
            </div>
          )}

          {activeTab === "diagnostics" && settings.features.enableDiagnostics && (
            <div className="overflow-y-auto pr-1 h-full max-w-5xl mx-auto">
              <DiagnosticsTerminal
                telemetry={telemetry}
                logs={logs}
                onTriggerDiagnostic={handleTriggerDiagnostic}
                onClearLogs={() => setLogs([])}
              />
            </div>
          )}

          {activeTab === "analytics" && settings.features.enableAnalytics && (
            <div className="overflow-y-auto pr-1 h-full max-w-5xl mx-auto">
              <AnalyticsWorkbench onRunAnalysis={handleRunDataAnalysis} />
            </div>
          )}

          {activeTab === "memory" && settings.features.enableMemory && (
            <div className="overflow-y-auto pr-1 h-full max-w-5xl mx-auto">
              <MemoryMatrix
                memories={memories}
                onAddMemory={(newMem) => {
                  const created: MemoryItem = {
                    ...newMem,
                    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                    createdAt: new Date().toISOString().split("T")[0],
                    updatedAt: new Date().toLocaleTimeString(),
                  };
                  setMemories((prev) => [created, ...prev]);
                  addLog("INFO", "MEMORY", `Stored new record: "${created.title}"`);
                }}
                onDeleteMemory={(id) => {
                  setMemories((prev) => prev.filter((m) => m.id !== id));
                  addLog("WARN", "MEMORY", `Purged record ID: ${id}`);
                }}
                onUpdateMemory={(updated) => {
                  setMemories((prev) =>
                    prev.map((m) => (m.id === updated.id ? updated : m))
                  );
                }}
              />
            </div>
          )}

          {activeTab === "workflows" && settings.features.enableWorkflows && (
            <div className="overflow-y-auto pr-1 h-full max-w-5xl mx-auto">
              <WorkflowAutomation
                onGenerateWorkflow={handleGenerateWorkflow}
                onExecuteWorkflowStep={handleExecuteWorkflowStep}
              />
            </div>
          )}
        </main>

        {/* Optical Camera Modal */}
        <CameraCaptureModal
          isOpen={isCamOpen}
          onClose={() => setIsCamOpen(false)}
          onCapture={(base64Img) => {
            const visionItem: MessageAttachment = {
              id: `cam-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              name: `Camera-Frame-${new Date().toLocaleTimeString()}.jpg`,
              type: "image",
              mimeType: "image/jpeg",
              data: base64Img,
            };
            setAttachedVision(visionItem);
            addLog("INFO", "OPTICAL_VISION", "Camera snapshot attached to Gemini Live feed.");
          }}
        />

        {/* Screen Buffer Capture Modal */}
        <ScreenCaptureModal
          isOpen={isScreenOpen}
          onClose={() => setIsScreenOpen(false)}
          onCapture={(base64Img) => {
            const visionItem: MessageAttachment = {
              id: `screen-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              name: `Screen-Buffer-${new Date().toLocaleTimeString()}.jpg`,
              type: "screen",
              mimeType: "image/jpeg",
              data: base64Img,
            };
            setAttachedVision(visionItem);
            addLog("INFO", "SCREEN_BUFFER", "Screen buffer attached to Gemini Live feed.");
          }}
        />

        {/* Workspace Customization & Feature Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetDefaults={handleResetDefaults}
        />
      </div>
    </GeminiLiveProvider>
  );
}

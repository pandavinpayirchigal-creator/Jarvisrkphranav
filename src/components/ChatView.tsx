import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, MessageAttachment, NeuralPowerMode, MessageReaction } from "../types";
import {
  Send,
  Mic,
  MicOff,
  Paperclip,
  Camera,
  Monitor,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink,
  Bot,
  User,
  Wrench,
  CheckCircle,
  Copy,
  Check,
  Search,
  Download,
  FileText,
  FileCode,
  ChevronDown,
  Zap,
  Brain,
  Gauge,
  ThumbsUp,
  ThumbsDown,
  Heart,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { jarvisSound } from "../services/soundEffects";
import { speechService } from "../services/speechService";

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, attachments?: MessageAttachment[]) => void;
  isListening: boolean;
  onToggleListen: () => void;
  onOpenCam: () => void;
  onOpenScreen: () => void;
  isSpeaking: boolean;
  onInterrupt: () => void;
  isLoading: boolean;
  enableSearch: boolean;
  onToggleSearch: () => void;
  pendingAttachments: MessageAttachment[];
  onRemoveAttachment: (id: string) => void;
  onAddAttachment: (att: MessageAttachment) => void;
  powerMode: NeuralPowerMode;
  onSelectPowerMode: (mode: NeuralPowerMode) => void;
  onReactMessage?: (messageId: string, reaction: MessageReaction) => void;
}

const QUICK_PROMPTS = [
  "Who are you and what are your capabilities?",
  "Check what's wrong with this system and run diagnostics.",
  "Turn on the lights and lock the front door.",
  "Organize tomorrow's meeting with agenda and participants.",
  "Analyze these sales numbers and find any anomalies.",
  "Search for the latest breakthroughs in fusion and quantum computing.",
];

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isListening,
  onToggleListen,
  onOpenCam,
  onOpenScreen,
  isSpeaking,
  onInterrupt,
  isLoading,
  enableSearch,
  onToggleSearch,
  pendingAttachments,
  onRemoveAttachment,
  onAddAttachment,
  powerMode,
  onSelectPowerMode,
  onReactMessage,
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && pendingAttachments.length === 0) return;

    jarvisSound.playBlip();
    onSendMessage(inputText.trim(), pendingAttachments);
    setInputText("");
  };

  const handleReact = (msgId: string, rx: MessageReaction) => {
    jarvisSound.playBlip();
    if (onReactMessage) {
      onReactMessage(msgId, rx);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    jarvisSound.playBlip();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakMessage = (msg: ChatMessage) => {
    if (speakingMsgId === msg.id && isSpeaking) {
      speechService.stopSpeaking();
      onInterrupt();
      setSpeakingMsgId(null);
      return;
    }

    setSpeakingMsgId(msg.id);
    jarvisSound.playActivationChime();
    speechService.speak(msg.text, {
      onEnd: () => setSpeakingMsgId(null),
      onError: () => setSpeakingMsgId(null),
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onAddAttachment({
          id: `att-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type.startsWith("image/") ? "image" : "document",
          mimeType: file.type || "application/octet-stream",
          data: result,
          size: file.size,
        });
        jarvisSound.playSuccess();
      };
      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportChat = (format: "markdown" | "json") => {
    jarvisSound.playBlip();
    setShowExportMenu(false);

    const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");

    if (format === "json") {
      const exportData = {
        title: "JARVIS Neural Conversation History",
        creator: "RK Phranav",
        exportedAt: new Date().toISOString(),
        totalMessages: messages.length,
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          author: m.role === "user" ? "Operator" : "JARVIS Core",
          timestamp: m.timestamp,
          text: m.text,
          reactions: m.reactions,
          reaction: m.reaction,
          attachments: m.attachments?.map((a) => ({
            name: a.name,
            type: a.type,
            mimeType: a.mimeType,
          })),
          toolExecuted: m.toolExecuted,
          groundingChunks: m.groundingChunks,
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `JARVIS-Chat-Export-${timestampStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      jarvisSound.playSuccess();
    } else {
      // Formatted Markdown Export
      let md = `# JARVIS Neural Conversation History\n`;
      md += `**Assistant**: JARVIS AI (Created by RK Phranav)\n`;
      md += `**Exported At**: ${new Date().toLocaleString()}\n`;
      md += `**Total Messages**: ${messages.length}\n\n`;
      md += `---\n\n`;

      messages.forEach((m, idx) => {
        const sender = m.role === "user" ? "👤 **OPERATOR**" : "🤖 **JARVIS CORE**";
        md += `### ${idx + 1}. ${sender} _(${m.timestamp})_\n\n`;
        
        if (m.attachments && m.attachments.length > 0) {
          md += `*Attached Files:*\n`;
          m.attachments.forEach((a) => {
            md += `- 📎 \`${a.name}\` (${a.type})\n`;
          });
          md += `\n`;
        }

        if (m.toolExecuted) {
          md += `> ⚡ **Tool Invoked**: \`${m.toolExecuted.toolName}\` — ${m.toolExecuted.resultSummary}\n\n`;
        }

        md += `${m.text}\n\n`;

        // Export reactions
        const rxList: string[] = [];
        if (m.reactions?.like || m.reaction === "like") rxList.push("👍 Liked");
        if (m.reactions?.heart || m.reaction === "heart") rxList.push("❤️ Loved");
        if (m.reactions?.dislike || m.reaction === "dislike") rxList.push("👎 Disliked");
        if (rxList.length > 0) {
          md += `*User Feedback:* ${rxList.join(", ")}\n\n`;
        }

        if (m.groundingChunks && m.groundingChunks.length > 0) {
          md += `*Grounded References:*\n`;
          m.groundingChunks.forEach((c) => {
            if (c.web?.uri) {
              md += `- [${c.web.title || "Web Link"}](${c.web.uri})\n`;
            }
          });
          md += `\n`;
        }

        md += `---\n\n`;
      });

      const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `JARVIS-Chat-Export-${timestampStr}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      jarvisSound.playSuccess();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/70 border border-cyan-500/20 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Top Header Bar with Channel Info, Power Mode Selector, and Download Chat */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-xs z-20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
            COMM PROTOCOL // ACTIVE STREAM
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            ({messages.length} transmission{messages.length === 1 ? "" : "s"})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Neural Power / Velocity Mode Dropdown */}
          <div className="relative">
            <button
              id="neural-power-mode-btn"
              onClick={() => {
                jarvisSound.playBlip();
                setShowPowerMenu(!showPowerMenu);
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                powerMode === "turbo"
                  ? "bg-amber-950/40 border-amber-500/50 text-amber-300 hover:border-amber-400"
                  : powerMode === "deep"
                  ? "bg-purple-950/40 border-purple-500/50 text-purple-300 hover:border-purple-400"
                  : "bg-cyan-950/40 border-cyan-500/50 text-cyan-300 hover:border-cyan-400"
              }`}
              title="Select Neural Engine Velocity & Power Mode"
            >
              {powerMode === "turbo" ? (
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              ) : powerMode === "deep" ? (
                <Brain className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="uppercase font-bold">
                {powerMode === "turbo"
                  ? "⚡ TURBO (HYPER-SPEED)"
                  : powerMode === "deep"
                  ? "🧠 DEEP QUANTUM"
                  : "⚖️ BALANCED"}
              </span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {showPowerMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowPowerMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-slate-900 border border-cyan-500/40 shadow-2xl shadow-slate-950/90 p-1.5 z-40 text-xs space-y-1 backdrop-blur-lg">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Select Neural Velocity & Power
                  </div>
                  
                  {/* Turbo Mode */}
                  <button
                    id="set-turbo-mode-btn"
                    onClick={() => {
                      jarvisSound.playBlip();
                      onSelectPowerMode("turbo");
                      setShowPowerMenu(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-lg flex items-start gap-2 transition-colors text-left cursor-pointer ${
                      powerMode === "turbo"
                        ? "bg-amber-950/70 text-amber-200 border border-amber-500/40"
                        : "hover:bg-slate-800 text-slate-200 hover:text-amber-300"
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>Turbo Hyper-Speed</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                          FASTEST
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Zero-latency instant streaming, immediate response execution.
                      </div>
                    </div>
                  </button>

                  {/* Balanced Mode */}
                  <button
                    id="set-balanced-mode-btn"
                    onClick={() => {
                      jarvisSound.playBlip();
                      onSelectPowerMode("balanced");
                      setShowPowerMenu(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-lg flex items-start gap-2 transition-colors text-left cursor-pointer ${
                      powerMode === "balanced"
                        ? "bg-cyan-950/70 text-cyan-200 border border-cyan-500/40"
                        : "hover:bg-slate-800 text-slate-200 hover:text-cyan-300"
                    }`}
                  >
                    <Gauge className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Balanced Tactical</div>
                      <div className="text-[10px] text-slate-400">
                        Adaptive reasoning with high-throughput generation.
                      </div>
                    </div>
                  </button>

                  {/* Deep Quantum Mode */}
                  <button
                    id="set-deep-mode-btn"
                    onClick={() => {
                      jarvisSound.playBlip();
                      onSelectPowerMode("deep");
                      setShowPowerMenu(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-lg flex items-start gap-2 transition-colors text-left cursor-pointer ${
                      powerMode === "deep"
                        ? "bg-purple-950/70 text-purple-200 border border-purple-500/40"
                        : "hover:bg-slate-800 text-slate-200 hover:text-purple-300"
                    }`}
                  >
                    <Brain className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>Deep Quantum Mark-VII</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                          HIGH POWER
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Maximized thinking capacity for intricate engineering, deep diagnostics, & math.
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Download Chat Menu */}
          <div className="relative">
            <button
              id="download-chat-btn"
              onClick={() => {
                jarvisSound.playBlip();
                setShowExportMenu(!showExportMenu);
              }}
              disabled={messages.length === 0}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-cyan-200 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Download conversation history"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download Chat</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* Export Format Dropdown Menu */}
            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-slate-900 border border-cyan-500/40 shadow-xl shadow-slate-950/80 p-1.5 z-40 text-xs space-y-1 backdrop-blur-lg">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Select Export Format
                  </div>
                  <button
                    id="export-markdown-btn"
                    onClick={() => handleExportChat("markdown")}
                    className="w-full px-2.5 py-2 rounded-lg hover:bg-cyan-950/60 text-slate-200 hover:text-cyan-300 flex items-center gap-2 transition-colors text-left cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-semibold">Markdown (.md)</div>
                      <div className="text-[10px] text-slate-400">Clean formatted document</div>
                    </div>
                  </button>
                  <button
                    id="export-json-btn"
                    onClick={() => handleExportChat("json")}
                    className="w-full px-2.5 py-2 rounded-lg hover:bg-cyan-950/60 text-slate-200 hover:text-cyan-300 flex items-center gap-2 transition-colors text-left cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-semibold">JSON (.json)</div>
                      <div className="text-[10px] text-slate-400">Structured data & telemetry</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Chat Messages Feed */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs overscroll-contain"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                JARVIS NEURAL LINK ESTABLISHED
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Multimodal personal assistant created by RK Phranav. Ready to understand voice, vision, diagnostics, workflow automation, and data operations.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full pt-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    jarvisSound.playBlip();
                    onSendMessage(prompt);
                  }}
                  className="p-2.5 text-left rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all text-xs flex items-center gap-2 group cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 opacity-70 group-hover:opacity-100" />
                  <span className="line-clamp-2">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            id={`msg-${msg.id}`}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            } space-y-1.5`}
          >
            {/* Sender Label & Timestamp */}
            <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500">
              {msg.role === "user" ? (
                <>
                  <span>OPERATOR</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </>
              ) : (
                <>
                  <span className="text-cyan-400 font-semibold">JARVIS CORE</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </>
              )}
            </div>

            {/* Message Bubble Container */}
            <div
              className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 transition-all ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-cyan-950/80 to-slate-900 border border-cyan-500/30 text-slate-100 shadow-md"
                  : "bg-slate-900/90 border border-slate-800 text-slate-200 shadow-xl"
              }`}
            >
              {/* Attachments (if any) */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {msg.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950 max-w-xs"
                    >
                      {att.type === "image" || att.type === "screen" ? (
                        <img
                          src={att.data}
                          alt={att.name}
                          className="max-h-48 object-cover w-full"
                        />
                      ) : (
                        <div className="p-2 text-[11px] text-slate-300 font-mono flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{att.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tool Execution Badge (if executed) */}
              {msg.toolExecuted && (
                <div className="mb-3 p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-300 flex items-start gap-2">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold uppercase tracking-wider">
                      [{msg.toolExecuted.toolName}]:{" "}
                    </span>
                    <span>{msg.toolExecuted.resultSummary}</span>
                  </div>
                </div>
              )}

              {/* Message Markdown Text */}
              <div className="prose prose-invert prose-xs max-w-none leading-relaxed text-slate-200">
                <ReactMarkdown>{msg.text || (msg.isStreaming ? "..." : "")}</ReactMarkdown>
                {msg.isStreaming && (
                  <span className="inline-block w-2 h-3.5 ml-1 bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee] rounded-sm align-middle" />
                )}
              </div>

              {/* Search Grounding Sources */}
              {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <Search className="w-3 h-3 text-cyan-400" /> Grounded Sources:
                  </span>
                  {msg.groundingChunks.map((chunk, cIdx) => (
                    <a
                      key={cIdx}
                      href={chunk.web?.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 hover:bg-slate-700 border border-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <span className="truncate max-w-[150px]">
                        {chunk.web?.title || "Web Reference"}
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  ))}
                </div>
              )}

              {/* Message Bubble Actions (Reactions & Utilities) */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-800/60 text-slate-400 text-[11px]">
                {/* Feedback Reactions Cluster */}
                <div className="flex items-center gap-1">
                  {/* Like Button */}
                  <button
                    id={`reaction-like-${msg.id}`}
                    onClick={() => handleReact(msg.id, "like")}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
                      msg.reactions?.like || msg.reaction === "like"
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-950"
                        : "hover:bg-slate-800 text-slate-400 hover:text-emerald-300 border border-transparent"
                    }`}
                    title="Helpful / accurate response"
                  >
                    <ThumbsUp
                      className={`w-3.5 h-3.5 ${
                        msg.reactions?.like || msg.reaction === "like"
                          ? "fill-emerald-400 text-emerald-400"
                          : ""
                      }`}
                    />
                    <span className="hidden sm:inline">Like</span>
                  </button>

                  {/* Dislike Button */}
                  <button
                    id={`reaction-dislike-${msg.id}`}
                    onClick={() => handleReact(msg.id, "dislike")}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
                      msg.reactions?.dislike || msg.reaction === "dislike"
                        ? "bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-950"
                        : "hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-transparent"
                    }`}
                    title="Needs improvement / inaccurate"
                  >
                    <ThumbsDown
                      className={`w-3.5 h-3.5 ${
                        msg.reactions?.dislike || msg.reaction === "dislike"
                          ? "fill-amber-400 text-amber-400"
                          : ""
                      }`}
                    />
                    <span className="hidden sm:inline">Dislike</span>
                  </button>

                  {/* Heart Button */}
                  <button
                    id={`reaction-heart-${msg.id}`}
                    onClick={() => handleReact(msg.id, "heart")}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
                      msg.reactions?.heart || msg.reaction === "heart"
                        ? "bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-950"
                        : "hover:bg-slate-800 text-slate-400 hover:text-rose-300 border border-transparent"
                    }`}
                    title="Love this response"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        msg.reactions?.heart || msg.reaction === "heart"
                          ? "fill-rose-400 text-rose-400"
                          : ""
                      }`}
                    />
                    <span className="hidden sm:inline">Heart</span>
                  </button>
                </div>

                {/* Right Utility Actions */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {msg.role === "model" && (
                    <button
                      id={`speak-msg-${msg.id}`}
                      onClick={() => handleSpeakMessage(msg)}
                      className="p-1 px-1.5 rounded hover:bg-slate-800 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer text-slate-400"
                      title={
                        speakingMsgId === msg.id ? "Interrupt Voice" : "Vocalize with JARVIS Voice"
                      }
                    >
                      {speakingMsgId === msg.id ? (
                        <VolumeX className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[10px] hidden sm:inline">
                        {speakingMsgId === msg.id ? "Speaking..." : "Read"}
                      </span>
                    </button>
                  )}

                  <button
                    id={`copy-msg-${msg.id}`}
                    onClick={() => handleCopy(msg.text, msg.id)}
                    className="p-1 px-1.5 rounded hover:bg-slate-800 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer text-slate-400"
                    title="Copy message content"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[10px] hidden sm:inline">
                      {copiedId === msg.id ? "Copied" : "Copy"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2 text-xs font-mono text-cyan-400 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1" />
            <span>JARVIS CORE REASONING & COMPILING PROTOCOLS...</span>
          </div>
        )}
      </div>

      {/* Pending Attachments Strip */}
      {pendingAttachments.length > 0 && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex flex-wrap gap-2">
          {pendingAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-cyan-500/40 text-xs font-mono text-slate-200"
            >
              {att.type === "image" || att.type === "screen" ? (
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="truncate max-w-[140px]">{att.name}</span>
              <button
                onClick={() => onRemoveAttachment(att.id)}
                className="text-slate-500 hover:text-rose-400 ml-1 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Control Bar */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 font-mono">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {/* Action Modality Buttons */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-slate-400">
              {/* File Upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,.txt,.csv,.json,.js,.ts,.py"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-cyan-300 transition-colors flex items-center gap-1"
                title="Attach Document or Image"
              >
                <Paperclip className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Upload</span>
              </button>

              {/* Optical Camera */}
              <button
                type="button"
                onClick={onOpenCam}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-cyan-300 transition-colors flex items-center gap-1"
                title="Capture Camera Frame"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Camera</span>
              </button>

              {/* Screen Grab */}
              <button
                type="button"
                onClick={onOpenScreen}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-cyan-300 transition-colors flex items-center gap-1"
                title="Capture Screen Buffer"
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Screen</span>
              </button>

              {/* Web Search Grounding Toggle */}
              <button
                type="button"
                onClick={onToggleSearch}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  enableSearch
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                    : "hover:bg-slate-800 hover:text-slate-200"
                }`}
                title="Enable Google Search Grounding"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">
                  Web Search {enableSearch ? "ON" : "OFF"}
                </span>
              </button>
            </div>

            <div className="text-[10px] text-slate-500 hidden md:block">
              {isListening ? "Microphone active..." : "Press Mic or Type"}
            </div>
          </div>

          {/* Text Input Row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="voice-mic-btn"
              onClick={onToggleListen}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? "bg-cyan-500 border-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/50 animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-400"
              }`}
              title={isListening ? "Stop Voice Input" : "Start Voice Input"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              id="jarvis-chat-input"
              value={inputText ?? ""}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? "Listening to your voice command..."
                  : "Instruct JARVIS (e.g. 'Check system health', 'Dim lights', 'Analyze data')..."
              }
              className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />

            <button
              type="submit"
              id="jarvis-send-btn"
              disabled={!inputText.trim() && pendingAttachments.length === 0}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">TRANSMIT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

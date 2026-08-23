import React, { useState } from "react";
import { SystemTelemetry, SystemLog } from "../types";
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Play,
  FileText,
  ShieldCheck,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { jarvisSound } from "../services/soundEffects";

interface DiagnosticsTerminalProps {
  telemetry: SystemTelemetry;
  logs: SystemLog[];
  onTriggerDiagnostic: (customIssue?: string) => Promise<string>;
  onClearLogs: () => void;
}

export const DiagnosticsTerminal: React.FC<DiagnosticsTerminalProps> = ({
  telemetry,
  logs,
  onTriggerDiagnostic,
  onClearLogs,
}) => {
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [diagResult, setDiagResult] = useState<string | null>(null);
  const [customIssue, setCustomIssue] = useState("");
  const [logFilter, setLogFilter] = useState<string>("ALL");

  const handleRunDiagnostic = async () => {
    jarvisSound.playActivationChime();
    setIsRunningDiag(true);
    try {
      const result = await onTriggerDiagnostic(customIssue);
      setDiagResult(result);
      jarvisSound.playSuccess();
    } catch (e) {
      jarvisSound.playAlert();
    } finally {
      setIsRunningDiag(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (logFilter === "ALL") return true;
    return l.level === logFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Telemetry Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-cyan-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-mono">CPU COMPUTE LOAD</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {telemetry.cpuUsage}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${telemetry.cpuUsage}%` }}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-cyan-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-mono">QUANTUM MEMORY</span>
            <HardDrive className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-300">
            {telemetry.memoryUsage}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${telemetry.memoryUsage}%` }}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-cyan-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-mono">NEURAL LATENCY</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {telemetry.neuralLatency}ms
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full"
              style={{ width: `${Math.min(100, (telemetry.neuralLatency / 100) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-cyan-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-mono">ARC CORE FLUX</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {telemetry.arcReactorEfficiency}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full"
              style={{ width: `${telemetry.arcReactorEfficiency}%` }}
            />
          </div>
        </div>
      </div>

      {/* Subsystem Health Grid */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Core Subsystem Matrix Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {telemetry.subsystems.map((sub, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200">{sub.name}</div>
                <div className="text-[10px] font-mono text-slate-500">Uptime: {sub.uptime}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">{sub.healthScore}%</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    sub.status === "online"
                      ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                      : sub.status === "warning"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-slate-600"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostic Investigation Trigger */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/30 border border-cyan-500/30 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">
                JARVIS ROOT CAUSE DIAGNOSTICS SUITE
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Executes the full analytical protocol: Problem → Evidence → Possible Causes → Tests → Root Cause → Solution → Verification.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Optional: Specific symptom or error query..."
              value={customIssue ?? ""}
              onChange={(e) => setCustomIssue(e.target.value)}
              className="flex-1 md:w-64 px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              id="execute-root-cause-btn"
              onClick={handleRunDiagnostic}
              disabled={isRunningDiag}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-mono font-semibold flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer shrink-0"
            >
              {isRunningDiag ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ANALYZING...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  RUN DIAGNOSTIC
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diagnostic Output Report */}
        {diagResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-cyan-500/40 font-mono text-xs text-slate-200">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-cyan-400">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                SYSTEM DIAGNOSTIC FINDINGS & REMEDIATION REPORT
              </span>
              <span className="text-[10px] text-slate-500">
                TIMESTAMP: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed overflow-x-auto">
              <ReactMarkdown>{diagResult}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* System Logs Stream */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>REAL-TIME SYSTEM LOG STREAM</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              {["ALL", "INFO", "WARN", "ERROR", "DIAGNOSTIC"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    jarvisSound.playBlip();
                    setLogFilter(lvl);
                  }}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    logFilter === lvl
                      ? "bg-cyan-900/60 text-cyan-300 font-bold"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <button
              onClick={onClearLogs}
              className="text-[10px] text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded hover:bg-slate-900"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto font-mono text-[11px] pr-1">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 py-1 px-2 rounded hover:bg-slate-900/60 transition-colors"
            >
              <span className="text-slate-600 select-none shrink-0">{log.timestamp}</span>
              <span
                className={`font-bold px-1 rounded text-[9px] select-none shrink-0 ${
                  log.level === "ERROR"
                    ? "bg-rose-950 text-rose-300 border border-rose-800"
                    : log.level === "WARN"
                    ? "bg-amber-950 text-amber-300 border border-amber-800"
                    : log.level === "DIAGNOSTIC"
                    ? "bg-purple-950 text-purple-300 border border-purple-800"
                    : "bg-cyan-950 text-cyan-300 border border-cyan-800"
                }`}
              >
                {log.level}
              </span>
              <span className="text-slate-400 font-semibold shrink-0">[{log.module}]</span>
              <span className="text-slate-300 flex-1 break-all">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

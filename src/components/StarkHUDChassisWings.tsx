import React, { useState, useEffect } from "react";
import {
  Activity,
  Cpu,
  Shield,
  Zap,
  Radio,
  Lock,
  Flame,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wifi,
  Compass,
} from "lucide-react";
import { SystemTelemetry, SystemLog, SmartDevice } from "../types";
import { jarvisSound } from "../services/soundEffects";

interface StarkHUDChassisWingsProps {
  telemetry: SystemTelemetry;
  logs: SystemLog[];
  devices: SmartDevice[];
  onTriggerAction?: (action: string) => void;
  isSoundEnabled?: boolean;
}

export const StarkHUDChassisWings: React.FC<StarkHUDChassisWingsProps> = ({
  telemetry,
  logs,
  devices,
  onTriggerAction,
  isSoundEnabled = true,
}) => {
  const [isLeftExpanded, setIsLeftExpanded] = useState<boolean>(true);
  const [isRightExpanded, setIsRightExpanded] = useState<boolean>(true);
  const [orbitalAngle, setOrbitalAngle] = useState<number>(0);

  // Rotate orbital beacons
  useEffect(() => {
    const timer = setInterval(() => {
      setOrbitalAngle((prev) => (prev + 2) % 360);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const activeLightsCount = devices.filter((d) => d.category === "lighting" && d.status).length;
  const totalLightsCount = devices.filter((d) => d.category === "lighting").length;
  const securityEngaged = devices.some((d) => d.category === "security" && d.status);

  return (
    <>
      {/* LEFT CHASSIS WING (Hardware & System Diagnostics) */}
      <aside
        id="stark-hud-left-wing"
        className={`hidden 2xl:flex flex-col fixed left-2 top-20 bottom-4 z-30 transition-all duration-300 font-mono select-none ${
          isLeftExpanded ? "w-64" : "w-10"
        }`}
      >
        <div className="relative w-full h-full bg-slate-950/90 border-r-2 border-y border-l border-cyan-500/30 rounded-r-2xl backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col justify-between">
          {/* Top Carbon Fiber Header */}
          <div className="p-3 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-cyan-500/30 flex items-center justify-between">
            {isLeftExpanded ? (
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                <span className="text-[11px] font-bold text-cyan-300 tracking-wider">
                  SYS TELEMETRY
                </span>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
            )}

            <button
              onClick={() => {
                jarvisSound.playBlip();
                setIsLeftExpanded(!isLeftExpanded);
              }}
              className="p-1 rounded bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:text-white cursor-pointer"
              title={isLeftExpanded ? "Collapse Wing" : "Expand Wing"}
            >
              {isLeftExpanded ? (
                <ChevronLeft className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {isLeftExpanded ? (
            <div className="flex-1 p-3 overflow-y-auto space-y-4 text-xs">
              {/* CPU & Neural Load Gauges */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-cyan-400" /> CPU CORE FLUX
                  </span>
                  <span className="font-bold text-cyan-300">{telemetry.cpuUsage}%</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-300"
                    style={{ width: `${telemetry.cpuUsage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-3 mb-1.5 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-amber-400" /> NEURAL LATENCY
                  </span>
                  <span className="font-bold text-amber-300">{telemetry.neuralLatency} ms</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (telemetry.neuralLatency / 60) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Thermal Status & Power Draw */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-400">POWER DRAW</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">
                    {telemetry.powerDrawKw} kW
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-400">THERMAL</div>
                  <div className="text-xs font-bold text-cyan-300 uppercase mt-0.5">
                    {telemetry.thermalStatus}
                  </div>
                </div>
              </div>

              {/* Hardware Subsystem Health Check */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-300 mb-2 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" /> SUBSYSTEM ARRAY
                </div>
                <div className="space-y-1.5">
                  {telemetry.subsystems.slice(0, 4).map((sub, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 truncate max-w-[120px]">{sub.name}</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {sub.uptime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Event Ticker */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>TERMINAL LOGS</span>
                  <span className="text-[9px] text-cyan-400 animate-pulse">STREAM</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto text-[9px] text-slate-400">
                  {logs.slice(0, 4).map((log) => (
                    <div key={log.id} className="truncate">
                      <span className="text-cyan-500 font-mono">[{log.module}]</span> {log.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 py-4 flex flex-col items-center justify-around text-slate-500">
              <span className="text-[9px] -rotate-90 whitespace-nowrap font-bold tracking-widest text-cyan-400/80">
                HARDWARE
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[9px] -rotate-90 whitespace-nowrap text-slate-400">
                {telemetry.cpuUsage}% LOAD
              </span>
            </div>
          )}

          {/* Bottom Titanium Chamfer */}
          <div className="p-2 bg-slate-900 border-t border-slate-800 text-[9px] text-center text-slate-500">
            {isLeftExpanded ? "STARK TELEMETRY BUS" : "STARK"}
          </div>
        </div>
      </aside>

      {/* RIGHT CHASSIS WING (Orbital Satellites & Quick Overrides) */}
      <aside
        id="stark-hud-right-wing"
        className={`hidden 2xl:flex flex-col fixed right-2 top-20 bottom-4 z-30 transition-all duration-300 font-mono select-none ${
          isRightExpanded ? "w-64" : "w-10"
        }`}
      >
        <div className="relative w-full h-full bg-slate-950/90 border-l-2 border-y border-r border-amber-500/30 rounded-l-2xl backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col justify-between">
          {/* Top Header */}
          <div className="p-3 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-amber-500/30 flex items-center justify-between">
            <button
              onClick={() => {
                jarvisSound.playBlip();
                setIsRightExpanded(!isRightExpanded);
              }}
              className="p-1 rounded bg-slate-900 border border-amber-500/40 text-amber-300 hover:text-white cursor-pointer"
              title={isRightExpanded ? "Collapse Wing" : "Expand Wing"}
            >
              {isRightExpanded ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>

            {isRightExpanded ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-300 tracking-wider">
                  ORBITAL ARRAY
                </span>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" />
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <Compass className="w-4 h-4 text-amber-400" />
              </div>
            )}
          </div>

          {isRightExpanded ? (
            <div className="flex-1 p-3 overflow-y-auto space-y-4 text-xs">
              {/* Mini 3D Orbital Radar Indicator */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-24 h-24 rounded-full border border-dashed border-amber-400/40 relative flex items-center justify-center">
                  {/* Central Star */}
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 shadow-[0_0_12px_#f97316] animate-pulse" />

                  {/* Rotating Orbital Satellite Node */}
                  <div
                    className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"
                    style={{
                      transform: `rotate(${orbitalAngle}deg) translate(36px) rotate(-${orbitalAngle}deg)`,
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"
                    style={{
                      transform: `rotate(${orbitalAngle * 1.5 + 90}deg) translate(46px) rotate(-${
                        orbitalAngle * 1.5 + 90
                      }deg)`,
                    }}
                  />
                </div>
                <div className="text-[9px] text-amber-300/80 font-bold uppercase mt-2">
                  STARK SAT-LINK 07 • LOCKED
                </div>
              </div>

              {/* Smart Environment Summary */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span>IOT AUTOMATION</span>
                  <span className="text-emerald-400 font-bold">{activeLightsCount}/{totalLightsCount} ON</span>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Perimeter Gate</span>
                    <span className={securityEngaged ? "text-emerald-400 font-bold" : "text-amber-400"}>
                      {securityEngaged ? "LOCKED" : "UNLOCKED"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Power Grid</span>
                    <span className="text-cyan-400 font-bold">ARC / SOLAR 98kW</span>
                  </div>
                </div>
              </div>

              {/* Fast Tactical HUD Action Chips */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-300 mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> TACTICAL OVERRIDES
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      jarvisSound.playBlip();
                      onTriggerAction?.("lockdown");
                    }}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/60 hover:text-rose-300 text-[10px] font-bold text-left transition-all cursor-pointer"
                  >
                    🔒 LOCKDOWN
                  </button>
                  <button
                    onClick={() => {
                      jarvisSound.playBlip();
                      onTriggerAction?.("maxpower");
                    }}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/60 hover:text-cyan-300 text-[10px] font-bold text-left transition-all cursor-pointer"
                  >
                    ⚡ MAX FLUX
                  </button>
                  <button
                    onClick={() => {
                      jarvisSound.playBlip();
                      onTriggerAction?.("cinema");
                    }}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/60 hover:text-amber-300 text-[10px] font-bold text-left transition-all cursor-pointer"
                  >
                    🎬 CINEMA
                  </button>
                  <button
                    onClick={() => {
                      jarvisSound.playBlip();
                      onTriggerAction?.("daylight");
                    }}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/60 hover:text-emerald-300 text-[10px] font-bold text-left transition-all cursor-pointer"
                  >
                    ☀️ OPTIMAL
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 py-4 flex flex-col items-center justify-around text-slate-500">
              <span className="text-[9px] 90 whitespace-nowrap font-bold tracking-widest text-amber-400/80">
                ORBITAL
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[9px] 90 whitespace-nowrap text-slate-400">
                SAT-7 OK
              </span>
            </div>
          )}

          {/* Bottom Chamfer */}
          <div className="p-2 bg-slate-900 border-t border-slate-800 text-[9px] text-center text-slate-500">
            {isRightExpanded ? "MARK 85 ARMORY LINK" : "ARMORY"}
          </div>
        </div>
      </aside>
    </>
  );
};

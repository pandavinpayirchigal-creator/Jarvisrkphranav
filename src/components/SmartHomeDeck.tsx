import React from "react";
import { SmartDevice } from "../types";
import {
  Lightbulb,
  Thermometer,
  Shield,
  ShieldAlert,
  Zap,
  Music,
  Lock,
  Unlock,
  Power,
  Sliders,
  CheckCircle2,
  Tv,
  Sun,
  Moon,
} from "lucide-react";
import { jarvisSound } from "../services/soundEffects";

interface SmartHomeDeckProps {
  devices: SmartDevice[];
  onUpdateDevice: (updated: SmartDevice) => void;
  onApplyPreset: (presetName: string) => void;
}

export const SmartHomeDeck: React.FC<SmartHomeDeckProps> = ({
  devices,
  onUpdateDevice,
  onApplyPreset,
}) => {
  const getIcon = (iconName: string, active: boolean) => {
    const cls = `w-5 h-5 ${active ? "text-cyan-400" : "text-slate-500"}`;
    switch (iconName) {
      case "light":
        return <Lightbulb className={cls} />;
      case "thermostat":
        return <Thermometer className={cls} />;
      case "security":
        return active ? <Shield className={cls} /> : <ShieldAlert className={cls} />;
      case "lock":
        return active ? <Lock className={cls} /> : <Unlock className="w-5 h-5 text-amber-400" />;
      case "power":
        return <Zap className={cls} />;
      case "media":
        return <Music className={cls} />;
      case "tv":
        return <Tv className={cls} />;
      default:
        return <Power className={cls} />;
    }
  };

  const handleToggle = (device: SmartDevice) => {
    jarvisSound.playBlip();
    onUpdateDevice({
      ...device,
      status: !device.status,
      lastUpdated: new Date().toLocaleTimeString(),
    });
  };

  const handleValueChange = (device: SmartDevice, newVal: number | string) => {
    onUpdateDevice({
      ...device,
      value: newVal,
      lastUpdated: new Date().toLocaleTimeString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider font-mono">
              STARK AUTOMATION & ENVIRONMENT MATRIX
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time biometric, security, climate, and IoT device orchestration. Controlled via voice or manual override.
          </p>
        </div>

        {/* Preset Mode Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="preset-cinema-mode"
            onClick={() => {
              jarvisSound.playExecute();
              onApplyPreset("Cinema Mode");
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-cyan-300 hover:border-cyan-500/50 transition-all flex items-center gap-1.5"
          >
            <Moon className="w-3.5 h-3.5" />
            Cinema Mode
          </button>
          <button
            id="preset-night-protocol"
            onClick={() => {
              jarvisSound.playExecute();
              onApplyPreset("Night Protocol");
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-amber-300 hover:border-amber-500/50 transition-all flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            Night Protocol
          </button>
          <button
            id="preset-daylight-opt"
            onClick={() => {
              jarvisSound.playExecute();
              onApplyPreset("Daylight Optimal");
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-emerald-300 hover:border-emerald-500/50 transition-all flex items-center gap-1.5"
          >
            <Sun className="w-3.5 h-3.5" />
            Daylight Optimal
          </button>
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <div
            key={device.id}
            id={`device-card-${device.id}`}
            className={`p-4 rounded-xl border transition-all duration-300 ${
              device.status
                ? "bg-slate-900/80 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.08)]"
                : "bg-slate-950/60 border-slate-800/80 opacity-75"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-lg border ${
                    device.status
                      ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-400"
                      : "bg-slate-900 border-slate-800 text-slate-500"
                  }`}
                >
                  {getIcon(device.iconName, device.status)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{device.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono text-slate-400">{device.room}</span>
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {device.category.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                id={`toggle-btn-${device.id}`}
                onClick={() => handleToggle(device)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  device.status ? "bg-cyan-500" : "bg-slate-700"
                }`}
                aria-label={`Toggle ${device.name}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    device.status ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Device Slider / Control Options */}
            {device.value !== undefined && (
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="flex justify-between items-center text-xs font-mono mb-2">
                  <span className="text-slate-400">Parameter Value</span>
                  <span className="text-cyan-300 font-semibold">
                    {device.value} {device.unit || ""}
                  </span>
                </div>

                {typeof device.value === "number" ? (
                  <input
                    type="range"
                    min={device.category === "climate" ? 60 : 0}
                    max={device.category === "climate" ? 85 : 100}
                    value={device.value ?? 0}
                    disabled={!device.status}
                    onChange={(e) => handleValueChange(device, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
                  />
                ) : (
                  <div className="text-xs text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 font-mono">
                    Mode: {device.value}
                  </div>
                )}
              </div>
            )}

            {/* Details / Footer */}
            {device.details && (
              <p className="text-[11px] text-slate-500 mt-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500/70" />
                {device.details}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

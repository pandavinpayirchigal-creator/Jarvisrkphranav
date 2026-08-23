import React, { useEffect, useRef } from "react";
import { BackgroundSettings } from "../types";

interface BackgroundCanvasProps {
  settings: BackgroundSettings;
  isDarkMode?: boolean;
}

export const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({
  settings,
  isDarkMode = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Floating ambient particles for sci-fi atmosphere
  useEffect(() => {
    if (!settings.showParticles) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      pulse: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Seed 40 particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.8,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4 - 0.1,
        opacity: Math.random() * 0.5 + 0.2,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const getParticleColor = () => {
      switch (settings.themeId) {
        case "matrix_rain":
          return "34, 197, 94"; // green
        case "arc_amber":
          return "245, 158, 11"; // amber
        case "crimson_mark7":
          return "239, 68, 68"; // red
        case "deep_space":
          return "168, 85, 247"; // purple
        case "stealth_carbon":
        case "tactical_slate":
          return "148, 163, 184"; // slate
        case "orbital_telemetry_hud":
          return "251, 146, 60"; // orange
        default:
          return "6, 182, 212"; // cyan
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rgb = getParticleColor();

      for (let p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.02;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const currentOpacity = p.opacity * (0.6 + Math.sin(p.pulse) * 0.4);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${currentOpacity * settings.opacity})`;
        ctx.shadowColor = `rgba(${rgb}, 0.8)`;
        ctx.shadowBlur = p.size * 3;
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [settings.showParticles, settings.themeId, settings.opacity]);

  // Advanced HUD Vector Canvas for the 3 Authentic Stark UI Themes
  useEffect(() => {
    const isSpecialTheme = [
      "stark_mark85_armor",
      "orbital_telemetry_hud",
      "iris_singularity_core",
    ].includes(settings.themeId);

    if (!isSpecialTheme) return;

    const canvas = hudCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const renderHUD = () => {
      time += 0.015;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // ==========================================
      // THEME 1: IRIS SINGULARITY CORE (Image 7)
      // ==========================================
      if (settings.themeId === "iris_singularity_core") {
        // Deep obsidian backdrop
        const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(w, h) * 0.6);
        grad.addColorStop(0, "rgba(6, 182, 212, 0.08)");
        grad.addColorStop(0.5, "rgba(2, 6, 23, 0.8)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0.98)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        const rCore = Math.min(w, h) * 0.22;

        // Outer Dark Mechanical Iris Shutter Ring
        ctx.save();
        ctx.translate(cx, cy);

        // Heavy dark metallic bezel
        ctx.beginPath();
        ctx.arc(0, 0, rCore * 1.35, 0, Math.PI * 2);
        ctx.lineWidth = 14;
        ctx.strokeStyle = "rgba(30, 41, 59, 0.9)";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, rCore * 1.35, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
        ctx.stroke();

        // Mechanical Iris Shutter Segments (Top & Bottom Arcs)
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 + time * 0.05;
          ctx.beginPath();
          ctx.arc(0, 0, rCore * 1.25, angle, angle + Math.PI / 4.5);
          ctx.lineWidth = 8;
          ctx.strokeStyle = "rgba(15, 23, 42, 0.95)";
          ctx.stroke();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
          ctx.stroke();
        }

        // Concentric Optical Ticks & Calipers
        for (let ring = 1; ring <= 4; ring++) {
          const r = rCore * (0.4 + ring * 0.2);
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.15 + ring * 0.08})`;
          ctx.stroke();

          // Radial laser ticks
          const tickCount = ring * 24;
          const rotOffset = ring % 2 === 0 ? time * 0.2 : -time * 0.15;
          for (let t = 0; t < tickCount; t++) {
            const rad = (t * Math.PI * 2) / tickCount + rotOffset;
            const len = t % 4 === 0 ? 6 : 3;
            ctx.beginPath();
            ctx.moveTo(Math.cos(rad) * (r - len), Math.sin(rad) * (r - len));
            ctx.lineTo(Math.cos(rad) * r, Math.sin(rad) * r);
            ctx.lineWidth = t % 4 === 0 ? 1.5 : 0.8;
            ctx.strokeStyle = "rgba(34, 211, 238, 0.7)";
            ctx.stroke();
          }
        }

        // Center High-Intensity Singularity Core
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rCore * 0.45);
        coreGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
        coreGrad.addColorStop(0.2, "rgba(103, 232, 249, 0.9)");
        coreGrad.addColorStop(0.6, "rgba(6, 182, 212, 0.5)");
        coreGrad.addColorStop(1, "rgba(6, 182, 212, 0)");
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, rCore * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Horizontal Optical Blue Flare Beam
        const beamLen = w * 0.4;
        const beamGrad = ctx.createLinearGradient(-beamLen, 0, beamLen, 0);
        beamGrad.addColorStop(0, "rgba(6, 182, 212, 0)");
        beamGrad.addColorStop(0.5, "rgba(224, 242, 254, 0.85)");
        beamGrad.addColorStop(1, "rgba(6, 182, 212, 0)");
        ctx.fillStyle = beamGrad;
        ctx.fillRect(-beamLen, -1.5, beamLen * 2, 3);

        ctx.restore();
      }

      // ==========================================
      // THEME 2: ORBITAL TELEMETRY HUD (Image 6)
      // ==========================================
      else if (settings.themeId === "orbital_telemetry_hud") {
        ctx.fillStyle = "rgba(2, 6, 23, 0.95)";
        ctx.fillRect(0, 0, w, h);

        const rOrbital = Math.min(w, h) * 0.18;
        const oCx = cx;
        const oCy = cy * 1.05;

        ctx.save();
        ctx.translate(oCx, oCy);

        // 3D Angled Orbital Trajectory Ellipses (Inclined at ~ -25 deg)
        ctx.rotate(-0.4);

        // Multi-tier Elliptical Orbits
        for (let orb = 1; orb <= 3; orb++) {
          const a = rOrbital * (1.8 + orb * 0.7);
          const b = rOrbital * (0.6 + orb * 0.25);
          ctx.beginPath();
          ctx.ellipse(0, 0, a, b, 0, 0, Math.PI * 2);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = `rgba(34, 211, 238, ${0.35 - orb * 0.08})`;
          ctx.stroke();

          // Orbiting Satellite Tracer Nodes
          const orbSpeed = time * (0.8 / orb);
          const satX = Math.cos(orbSpeed) * a;
          const satY = Math.sin(orbSpeed) * b;

          ctx.beginPath();
          ctx.arc(satX, satY, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = orb === 1 ? "#fbbf24" : "#22d3ee";
          ctx.shadowColor = orb === 1 ? "#fbbf24" : "#22d3ee";
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.rotate(0.4); // un-rotate for circular compass reticle

        // Glowing Sun / Planetary Core (Orange fiery sphere)
        const sunGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rOrbital * 0.85);
        sunGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        sunGrad.addColorStop(0.3, "rgba(251, 146, 60, 0.9)");
        sunGrad.addColorStop(0.7, "rgba(234, 88, 12, 0.6)");
        sunGrad.addColorStop(1, "rgba(194, 65, 12, 0)");
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(0, 0, rOrbital * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Concentric Circular Radar Compass & Calipers
        ctx.beginPath();
        ctx.arc(0, 0, rOrbital * 1.15, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
        ctx.stroke();

        // Radar Caliper ticks and Cardinal directions
        const compassTicks = 48;
        for (let i = 0; i < compassTicks; i++) {
          const ang = (i * Math.PI * 2) / compassTicks + time * 0.1;
          const len = i % 12 === 0 ? 10 : i % 4 === 0 ? 6 : 3;
          const r = rOrbital * 1.15;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * (r - len), Math.sin(ang) * (r - len));
          ctx.lineTo(Math.cos(ang) * (r + len), Math.sin(ang) * (r + len));
          ctx.lineWidth = i % 12 === 0 ? 2 : 1;
          ctx.strokeStyle = i % 12 === 0 ? "rgba(251, 146, 60, 0.9)" : "rgba(34, 211, 238, 0.6)";
          ctx.stroke();
        }

        ctx.restore();

        // Hexagonal Telemetry Panel & Warning Indicators (Top Right)
        const hexX = Math.min(w - 180, w * 0.78);
        const hexY = Math.max(80, h * 0.18);
        ctx.save();
        ctx.translate(hexX, hexY);

        ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
        ctx.lineWidth = 1;
        // Hex grid icon
        const drawHex = (hx: number, hy: number, size: number) => {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const px = hx + size * Math.cos(a);
            const py = hy + size * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        };

        drawHex(0, 0, 18);
        drawHex(26, -15, 14);
        drawHex(26, 15, 14);
        drawHex(52, 0, 18);

        // Warning Telemetry Box with Yellow Triangle
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
        ctx.strokeRect(-120, -35, 100, 45);
        ctx.fillRect(-120, -35, 100, 45);

        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 9px monospace";
        ctx.fillText("▲ ORBIT TELEMETRY", -114, -20);
        ctx.fillStyle = "#38bdf8";
        ctx.fillText("STARK_NET // LIVE", -114, -6);

        ctx.restore();

        // Audio Frequency Resonance Waveform Curve (Bottom Right)
        const waveX = Math.min(w - 220, w * 0.72);
        const waveY = Math.max(h - 100, h * 0.82);
        ctx.save();
        ctx.translate(waveX, waveY);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let px = 0; px <= 160; px += 4) {
          const amp = Math.sin(px * 0.08 + time * 3) * Math.cos(px * 0.03) * 16;
          ctx.lineTo(px, amp);
        }
        ctx.strokeStyle = "rgba(34, 211, 238, 0.8)";
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Waveform bounding box
        ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-10, -25, 180, 50);

        ctx.fillStyle = "rgba(34, 211, 238, 0.7)";
        ctx.font = "8px monospace";
        ctx.fillText("ACOUSTIC FREQ SPECTRUM", -5, -30);

        ctx.restore();
      }

      // ==========================================
      // THEME 3: STARK MARK 85 TITANIUM ARMOR (Image 5)
      // ==========================================
      else if (settings.themeId === "stark_mark85_armor") {
        ctx.fillStyle = "rgba(3, 7, 18, 0.96)";
        ctx.fillRect(0, 0, w, h);

        const pillarWidth = Math.max(50, Math.min(w * 0.12, 100));

        // 1. Left Armored Chassis Pillar
        const leftGrad = ctx.createLinearGradient(0, 0, pillarWidth, 0);
        leftGrad.addColorStop(0, "rgba(30, 41, 59, 0.95)");
        leftGrad.addColorStop(0.7, "rgba(15, 23, 42, 0.9)");
        leftGrad.addColorStop(1, "rgba(15, 23, 42, 0.2)");
        ctx.fillStyle = leftGrad;
        ctx.fillRect(0, 0, pillarWidth, h);

        // Left Chamfered Bevel & Screws
        ctx.strokeStyle = "rgba(100, 116, 139, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pillarWidth, 0);
        ctx.lineTo(pillarWidth, h * 0.25);
        ctx.lineTo(pillarWidth - 15, h * 0.3);
        ctx.lineTo(pillarWidth - 15, h * 0.7);
        ctx.lineTo(pillarWidth, h * 0.75);
        ctx.lineTo(pillarWidth, h);
        ctx.stroke();

        // Left Amber LED Status Strips
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = "#f59e0b";
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 6;
          ctx.fillRect(16, 40 + i * 14, 8, 3);
          ctx.shadowBlur = 0;
        }

        // 2. Right Armored Chassis Pillar
        const rightGrad = ctx.createLinearGradient(w, 0, w - pillarWidth, 0);
        rightGrad.addColorStop(0, "rgba(30, 41, 59, 0.95)");
        rightGrad.addColorStop(0.7, "rgba(15, 23, 42, 0.9)");
        rightGrad.addColorStop(1, "rgba(15, 23, 42, 0.2)");
        ctx.fillStyle = rightGrad;
        ctx.fillRect(w - pillarWidth, 0, pillarWidth, h);

        // Right Chamfered Bevel
        ctx.strokeStyle = "rgba(100, 116, 139, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w - pillarWidth, 0);
        ctx.lineTo(w - pillarWidth, h * 0.25);
        ctx.lineTo(w - pillarWidth + 15, h * 0.3);
        ctx.lineTo(w - pillarWidth + 15, h * 0.7);
        ctx.lineTo(w - pillarWidth, h * 0.75);
        ctx.lineTo(w - pillarWidth, h);
        ctx.stroke();

        // Right Amber LED Status Strips
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = "#f59e0b";
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 6;
          ctx.fillRect(w - 24, 40 + i * 14, 8, 3);
          ctx.shadowBlur = 0;
        }

        // 3. Motherboard Circuit Traces Running Across Chassis
        ctx.strokeStyle = "rgba(6, 182, 212, 0.28)";
        ctx.lineWidth = 1.2;
        const drawCircuit = (sx: number, sy: number, points: [number, number][]) => {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          points.forEach(([px, py]) => ctx.lineTo(px, py));
          ctx.stroke();
          const last = points[points.length - 1] || [sx, sy];
          ctx.beginPath();
          ctx.arc(last[0], last[1], 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "#22d3ee";
          ctx.fill();
        };

        drawCircuit(pillarWidth, h * 0.2, [
          [pillarWidth + 40, h * 0.2],
          [pillarWidth + 70, h * 0.25],
          [pillarWidth + 120, h * 0.25],
        ]);

        drawCircuit(w - pillarWidth, h * 0.35, [
          [w - pillarWidth - 50, h * 0.35],
          [w - pillarWidth - 90, h * 0.4],
          [w - pillarWidth - 140, h * 0.4],
        ]);

        // 4. Upper Right Glowing Amber Concentric Node (Image 5 upper node)
        const nodeX = Math.min(w - 180, w * 0.65);
        const nodeY = Math.max(120, h * 0.28);
        const nodeR = 36;

        ctx.save();
        ctx.translate(nodeX, nodeY);
        // Amber rings
        ctx.beginPath();
        ctx.arc(0, 0, nodeR, 0, Math.PI * 2);
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, nodeR * 0.65, 0, Math.PI * 2);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "rgba(251, 191, 36, 0.85)";
        ctx.stroke();

        // Inner glowing orange core
        const ambCore = ctx.createRadialGradient(0, 0, 0, 0, 0, nodeR * 0.45);
        ambCore.addColorStop(0, "rgba(254, 240, 138, 0.95)");
        ambCore.addColorStop(0.5, "rgba(245, 158, 11, 0.7)");
        ambCore.addColorStop(1, "rgba(217, 119, 6, 0)");
        ctx.fillStyle = ambCore;
        ctx.beginPath();
        ctx.arc(0, 0, nodeR * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 5. Lower Center Multi-Layer Dual Cyan & Amber Concentric Reactor (Image 5 primary core)
        const coreX = cx;
        const coreY = cy * 1.15;
        const mainR = Math.min(w, h) * 0.22;

        ctx.save();
        ctx.translate(coreX, coreY);

        // Segmented Caliper Arcs
        for (let i = 0; i < 4; i++) {
          const start = (i * Math.PI) / 2 + time * 0.15;
          ctx.beginPath();
          ctx.arc(0, 0, mainR * 1.25, start, start + Math.PI / 3);
          ctx.lineWidth = 4;
          ctx.strokeStyle = "rgba(6, 182, 212, 0.7)";
          ctx.stroke();
        }

        // Inner Cyan Rings
        ctx.beginPath();
        ctx.arc(0, 0, mainR, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(34, 211, 238, 0.8)";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, mainR * 0.75, 0, Math.PI * 2);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
        ctx.stroke();

        // Center Amber Flame Singularity
        const flameGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, mainR * 0.42);
        flameGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
        flameGrad.addColorStop(0.3, "rgba(251, 191, 36, 0.95)");
        flameGrad.addColorStop(0.7, "rgba(234, 88, 12, 0.6)");
        flameGrad.addColorStop(1, "rgba(180, 83, 9, 0)");
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.arc(0, 0, mainR * 0.42, 0, Math.PI * 2);
        ctx.fill();

        // Crosshairs targeting reticle
        ctx.strokeStyle = "rgba(34, 211, 238, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-mainR * 1.1, 0);
        ctx.lineTo(-mainR * 0.5, 0);
        ctx.moveTo(mainR * 0.5, 0);
        ctx.lineTo(mainR * 1.1, 0);
        ctx.moveTo(0, -mainR * 1.1);
        ctx.lineTo(0, -mainR * 0.5);
        ctx.moveTo(0, mainR * 0.5);
        ctx.lineTo(0, mainR * 1.1);
        ctx.stroke();

        ctx.restore();
      }

      animId = requestAnimationFrame(renderHUD);
    };

    renderHUD();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [settings.themeId]);

  // Determine custom image source if selected
  const activeImageSrc =
    settings.themeId === "custom_upload"
      ? settings.customUploadData
      : settings.themeId === "custom_url"
      ? settings.customUrl
      : null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Base Canvas / Gradient Theme */}
      {settings.themeId === "cyan_grid" && (
        <div className="absolute inset-0 bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(2,6,23,1))]" />
      )}

      {settings.themeId === "matrix_rain" && (
        <div className="absolute inset-0 bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.14),rgba(2,6,23,1))]" />
      )}

      {settings.themeId === "deep_space" && (
        <div className="absolute inset-0 bg-slate-950 bg-[radial-gradient(ellipse_90%_90%_at_50%_-10%,rgba(168,85,247,0.16),rgba(15,23,42,1))]" />
      )}

      {settings.themeId === "arc_amber" && (
        <div className="absolute inset-0 bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(2,6,23,1))]" />
      )}

      {settings.themeId === "crimson_mark7" && (
        <div className="absolute inset-0 bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.15),rgba(2,6,23,1))]" />
      )}

      {settings.themeId === "stealth_carbon" && (
        <div className="absolute inset-0 bg-zinc-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(39,39,42,0.6),rgba(9,9,11,1))]" />
      )}

      {settings.themeId === "tactical_slate" && (
        <div className="absolute inset-0 bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,rgba(51,65,85,0.4),rgba(15,23,42,1))]" />
      )}

      {/* Custom Image Layer if active */}
      {activeImageSrc && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-300"
          style={{
            backgroundImage: `url(${activeImageSrc})`,
            opacity: settings.opacity,
            filter: `blur(${settings.blur}px)`,
          }}
        />
      )}

      {/* Dark tint overlay filter */}
      {activeImageSrc && (
        <div
          className="absolute inset-0 bg-slate-950 transition-opacity"
          style={{ opacity: settings.darkOverlay }}
        />
      )}

      {/* Sci-Fi HUD Cyber Grid Overlay */}
      {settings.showGridOverlay && (
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(6, 182, 212, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.12) 1px, transparent 1px)`,
            backgroundSize: "3.5rem 3.5rem",
          }}
        />
      )}

      {/* Ambient Vector HUD Canvas for Special Themes (Iris Singularity, Orbital Telemetry, Mark 85 Chassis) */}
      {[
        "stark_mark85_armor",
        "orbital_telemetry_hud",
        "iris_singularity_core",
      ].includes(settings.themeId) && (
        <canvas
          ref={hudCanvasRef}
          className="absolute inset-0 w-full h-full opacity-90 transition-opacity duration-700"
        />
      )}

      {/* Ambient Canvas Particles */}
      {settings.showParticles && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      )}

      {/* Top subtle vignette */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-950/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/90 to-transparent" />
    </div>
  );
};


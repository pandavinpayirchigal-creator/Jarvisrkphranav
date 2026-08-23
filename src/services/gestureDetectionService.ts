/**
 * JARVIS Optical Hand-Gesture Detection & Recognition Engine
 * Real-time client-side Computer Vision using Canvas pixel segmentation,
 * morphological contour heuristics, and Stark Industries HUD telemetry.
 */

import { HandGestureType, HandGestureDetectionResult } from "../types";

export interface GestureDetectorOptions {
  sensitivity?: "high" | "medium" | "low";
  cooldownMs?: number;
  minConfidence?: number;
  onGestureDetected?: (result: HandGestureDetectionResult) => void;
  onGestureAction?: (action: "pause" | "resume", result: HandGestureDetectionResult) => void;
}

export class GestureDetectionService {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private processCanvas: HTMLCanvasElement | null = null;
  private processCtx: CanvasRenderingContext2D | null = null;

  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  private options: Required<GestureDetectorOptions> = {
    sensitivity: "medium",
    cooldownMs: 1200,
    minConfidence: 0.65,
    onGestureDetected: () => {},
    onGestureAction: () => {},
  };

  private lastActionTimestamp: number = 0;
  private lastCentroid: { x: number; y: number } | null = null;
  private smoothedBox: { x: number; y: number; width: number; height: number } | null = null;
  private gestureHistory: HandGestureType[] = [];
  private triggerCooldownRatio: number = 0; // 0 to 1 (1 = ready, <1 = cooling down)

  constructor() {
    if (typeof document !== "undefined") {
      this.processCanvas = document.createElement("canvas");
      this.processCanvas.width = 160;
      this.processCanvas.height = 120;
      this.processCtx = this.processCanvas.getContext("2d", { willReadFrequently: true });
    }
  }

  public setOptions(options: Partial<GestureDetectorOptions>) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  public getCooldownRatio(): number {
    return this.triggerCooldownRatio;
  }

  public start(
    video: HTMLVideoElement,
    renderCanvas: HTMLCanvasElement,
    options?: GestureDetectorOptions
  ) {
    if (options) {
      this.setOptions(options);
    }

    this.videoElement = video;
    this.canvasElement = renderCanvas;
    this.ctx = renderCanvas.getContext("2d");
    this.isRunning = true;
    this.lastActionTimestamp = 0;
    this.gestureHistory = [];

    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.videoElement = null;
    this.canvasElement = null;
    this.ctx = null;
    this.smoothedBox = null;
    this.lastCentroid = null;
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  private loop = () => {
    if (!this.isRunning) return;

    this.processCurrentFrame();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Process single frame from video and render HUD overlay
   */
  public processCurrentFrame(): HandGestureDetectionResult | null {
    if (!this.videoElement || !this.processCanvas || !this.processCtx) {
      return null;
    }

    const video = this.videoElement;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const pW = this.processCanvas.width;
    const pH = this.processCanvas.height;

    // Draw downscaled frame for sub-millisecond CV processing
    this.processCtx.drawImage(video, 0, 0, pW, pH);
    const imageData = this.processCtx.getImageData(0, 0, pW, pH);
    const pixels = imageData.data;

    // Skin color segmentation in RGB / YCbCr color space
    let skinPixelCount = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = pW;
    let maxX = 0;
    let minY = pH;
    let maxY = 0;

    // 2D skin mask for contour & peak analysis
    const skinMask = new Uint8Array(pW * pH);

    // Sensitivity threshold multipliers
    const sensFactor =
      this.options.sensitivity === "high"
        ? 0.8
        : this.options.sensitivity === "low"
        ? 1.2
        : 1.0;

    const minAreaRequired = (pW * pH * 0.015) / sensFactor;

    for (let y = 0; y < pH; y++) {
      for (let x = 0; x < pW; x++) {
        const idx = (y * pW + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        // Fast YCbCr conversion
        // Y = 0.299R + 0.587G + 0.114B
        // Cb = 128 - 0.168736R - 0.331264G + 0.5B
        // Cr = 128 + 0.5R - 0.418688G - 0.081312B
        const yVal = 0.299 * r + 0.587 * g + 0.114 * b;
        const cb = 128 - 0.1687 * r - 0.3313 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.4187 * g - 0.0813 * b;

        // Skin chromaticity boundary rules
        const isSkin =
          r > 45 &&
          g > 30 &&
          b > 20 &&
          r > g &&
          r > b &&
          Math.abs(r - g) > 12 &&
          cb >= 75 &&
          cb <= 130 &&
          cr >= 130 &&
          cr <= 178 &&
          yVal > 40;

        if (isSkin) {
          skinMask[y * pW + x] = 1;
          skinPixelCount++;
          sumX += x;
          sumY += y;

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const now = Date.now();
    const elapsedSinceLastAction = now - this.lastActionTimestamp;
    this.triggerCooldownRatio = Math.min(1, elapsedSinceLastAction / this.options.cooldownMs);

    let result: HandGestureDetectionResult = {
      gesture: "none",
      label: "NO HAND DETECTED",
      confidence: 0,
      action: "none",
      actionDescription: "Optical sensor scanning for hand gestures...",
      timestamp: now,
    };

    if (skinPixelCount >= minAreaRequired && maxX > minX && maxY > minY) {
      const centroidX = sumX / skinPixelCount;
      const centroidY = sumY / skinPixelCount;

      const rawBoxWidth = maxX - minX;
      const rawBoxHeight = maxY - minY;
      const boxArea = rawBoxWidth * rawBoxHeight;
      const solidity = skinPixelCount / (boxArea || 1); // Compactness (0 to 1)
      const aspectRatio = rawBoxHeight / (rawBoxWidth || 1); // Height-to-Width ratio

      // Multi-finger peak detection across upper half
      let fingerPeaks = 0;
      const testRow = Math.floor(minY + rawBoxHeight * 0.3);
      if (testRow >= 0 && testRow < pH) {
        let inFinger = false;
        let consecutiveCount = 0;
        for (let x = minX; x <= maxX; x++) {
          if (skinMask[testRow * pW + x] === 1) {
            consecutiveCount++;
            if (!inFinger && consecutiveCount >= 2) {
              fingerPeaks++;
              inFinger = true;
            }
          } else {
            consecutiveCount = 0;
            inFinger = false;
          }
        }
      }

      // Motion speed calculation (centroid delta)
      let motionLevel = 0;
      if (this.lastCentroid) {
        const dx = (centroidX - this.lastCentroid.x) / pW;
        const dy = (centroidY - this.lastCentroid.y) / pH;
        motionLevel = Math.sqrt(dx * dx + dy * dy) * 100;
      }
      this.lastCentroid = { x: centroidX, y: centroidY };

      // Normalization for rendering (scale 0-1)
      const normBox = {
        x: minX / pW,
        y: minY / pH,
        width: rawBoxWidth / pW,
        height: rawBoxHeight / pH,
      };

      // Temporal smoothing of bounding box
      if (!this.smoothedBox) {
        this.smoothedBox = { ...normBox };
      } else {
        this.smoothedBox = {
          x: this.smoothedBox.x * 0.7 + normBox.x * 0.3,
          y: this.smoothedBox.y * 0.7 + normBox.y * 0.3,
          width: this.smoothedBox.width * 0.7 + normBox.width * 0.3,
          height: this.smoothedBox.height * 0.7 + normBox.height * 0.3,
        };
      }

      // Gesture Classification Logic
      let detectedGesture: HandGestureType = "open_palm";
      let confidence = 0.5;

      // 1. OPEN PALM (Stop / Halt / Pause Voice)
      // Open hand has extended fingers, spread shape (solidity 0.30 - 0.65), upright aspect ratio >= 1.0, multiple peaks
      if (solidity >= 0.28 && solidity <= 0.68 && aspectRatio >= 0.95 && fingerPeaks >= 2) {
        detectedGesture = "open_palm";
        confidence = Math.min(0.98, 0.7 + (fingerPeaks >= 3 ? 0.18 : 0.08) + (aspectRatio >= 1.1 ? 0.1 : 0));
      }
      // 2. CLOSED FIST (Resume / Unmute / Start Voice)
      // Fist is solid, compact, round/square aspect ratio, low peak count
      else if (solidity > 0.68 && aspectRatio >= 0.75 && aspectRatio <= 1.35 && fingerPeaks <= 1) {
        detectedGesture = "fist";
        confidence = Math.min(0.96, 0.72 + (solidity > 0.75 ? 0.15 : 0.08));
      }
      // 3. THUMBS UP / VICTORY (Resume / Toggle Voice)
      else if (aspectRatio >= 1.25 && fingerPeaks >= 1 && solidity >= 0.45 && solidity <= 0.75) {
        detectedGesture = fingerPeaks >= 2 ? "victory" : "thumbs_up";
        confidence = 0.85;
      }
      // 4. WAVE MOTION (Resume / Trigger Voice)
      else if (motionLevel > 6.5 && rawBoxWidth > pW * 0.15) {
        detectedGesture = "wave";
        confidence = Math.min(0.92, 0.65 + motionLevel * 0.03);
      } else {
        detectedGesture = "open_palm";
        confidence = 0.62;
      }

      // Stability buffer (3 frame agreement)
      this.gestureHistory.push(detectedGesture);
      if (this.gestureHistory.length > 4) {
        this.gestureHistory.shift();
      }

      // Determine majority gesture in recent history
      const counts: Record<string, number> = {};
      for (const g of this.gestureHistory) {
        counts[g] = (counts[g] || 0) + 1;
      }
      let stableGesture: HandGestureType = detectedGesture;
      for (const [g, count] of Object.entries(counts)) {
        if (count >= 2) {
          stableGesture = g as HandGestureType;
        }
      }

      // Determine Action
      let action: "pause" | "resume" | "none" = "none";
      let label = "GESTURE TRACKED";
      let actionDesc = "";

      if (stableGesture === "open_palm") {
        action = "pause";
        label = "OPEN PALM [STOP]";
        actionDesc = "✋ Open Hand detected &rarr; Pause / Mute voice conversation";
      } else if (stableGesture === "fist") {
        action = "resume";
        label = "CLOSED FIST [ENGAGE]";
        actionDesc = "✊ Closed Fist detected &rarr; Resume / Unmute voice conversation";
      } else if (stableGesture === "thumbs_up") {
        action = "resume";
        label = "THUMBS UP [CONFIRM]";
        actionDesc = "👍 Thumbs Up detected &rarr; Resume voice conversation";
      } else if (stableGesture === "victory") {
        action = "resume";
        label = "VICTORY SIGN [ACTIVE]";
        actionDesc = "✌️ Peace / Victory sign &rarr; Resume voice conversation";
      } else if (stableGesture === "wave") {
        action = "resume";
        label = "HAND WAVE [INTERACT]";
        actionDesc = "👋 Hand Wave motion &rarr; Resume voice conversation";
      }

      result = {
        gesture: stableGesture,
        label,
        confidence,
        action,
        actionDescription: actionDesc,
        box: this.smoothedBox,
        centroid: { x: centroidX / pW, y: centroidY / pH },
        motionLevel,
        timestamp: now,
      };

      // Fire detection callback
      this.options.onGestureDetected(result);

      // Trigger Action if above confidence and cooldown elapsed
      if (
        action !== "none" &&
        confidence >= this.options.minConfidence &&
        elapsedSinceLastAction >= this.options.cooldownMs
      ) {
        this.lastActionTimestamp = now;
        this.triggerCooldownRatio = 0;
        this.options.onGestureAction(action, result);
      }
    } else {
      this.lastCentroid = null;
      this.smoothedBox = null;
      this.gestureHistory = [];
    }

    // Render Stark Industries Holographic HUD on render canvas
    this.renderStarkHUD(result);

    return result;
  }

  /**
   * Render High-Tech Futuristic Iron-Man / Stark HUD Reticle on Canvas
   */
  private renderStarkHUD(result: HandGestureDetectionResult) {
    if (!this.canvasElement || !this.ctx || !this.videoElement) return;

    const ctx = this.ctx;
    const canvas = this.canvasElement;
    const width = canvas.width;
    const height = canvas.height;

    // Clear overlay
    ctx.clearRect(0, 0, width, height);

    // Subtle Sci-Fi Corner Brackets on Screen
    ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
    ctx.lineWidth = 1.5;
    const cornerSize = 16;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(8, 8 + cornerSize);
    ctx.lineTo(8, 8);
    ctx.lineTo(8 + cornerSize, 8);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - 8 - cornerSize, 8);
    ctx.lineTo(width - 8, 8);
    ctx.lineTo(width - 8, 8 + cornerSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(8, height - 8 - cornerSize);
    ctx.lineTo(8, height - 8);
    ctx.lineTo(8 + cornerSize, height - 8);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - 8 - cornerSize, height - 8);
    ctx.lineTo(width - 8, height - 8);
    ctx.lineTo(width - 8, height - 8 - cornerSize);
    ctx.stroke();

    // Draw Stark HUD Header
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(34, 211, 238, 0.85)";
    ctx.fillText("STARK OPTICAL GESTURE SENSOR v4.2", 14, 20);

    const isCoolingDown = this.triggerCooldownRatio < 1;
    ctx.fillStyle = isCoolingDown ? "rgba(245, 158, 11, 0.9)" : "rgba(16, 185, 129, 0.9)";
    ctx.fillText(
      isCoolingDown
        ? `COOLDOWN [${Math.round(this.triggerCooldownRatio * 100)}%]`
        : "STATUS: READY",
      width - 120,
      20
    );

    // If a hand is tracked
    if (result.box && result.gesture !== "none") {
      const bx = result.box.x * width;
      const by = result.box.y * height;
      const bw = result.box.width * width;
      const bh = result.box.height * height;

      const isPause = result.action === "pause";
      const primaryColor = isPause ? "#f43f5e" : "#06b6d4"; // Rose for Pause, Cyan for Resume
      const glowColor = isPause ? "rgba(244, 63, 94, 0.4)" : "rgba(6, 182, 212, 0.4)";

      // Bounding Box Glow Reticle
      ctx.save();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;

      // Draw futuristic 4-corner brackets around hand
      const bracketLen = Math.min(bw, bh) * 0.25;

      // TL
      ctx.beginPath();
      ctx.moveTo(bx, by + bracketLen);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + bracketLen, by);
      ctx.stroke();

      // TR
      ctx.beginPath();
      ctx.moveTo(bx + bw - bracketLen, by);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx + bw, by + bracketLen);
      ctx.stroke();

      // BL
      ctx.beginPath();
      ctx.moveTo(bx, by + bh - bracketLen);
      ctx.lineTo(bx, by + bh);
      ctx.lineTo(bx + bracketLen, by + bh);
      ctx.stroke();

      // BR
      ctx.beginPath();
      ctx.moveTo(bx + bw - bracketLen, by + bh);
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx + bw, by + bh - bracketLen);
      ctx.stroke();

      // Center crosshair / Arc reticle
      if (result.centroid) {
        const cx = result.centroid.x * width;
        const cy = result.centroid.y * height;

        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5;

        // Circular arc reticle
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = primaryColor;
        ctx.fill();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy);
        ctx.lineTo(cx - 14, cy);
        ctx.moveTo(cx + 14, cy);
        ctx.lineTo(cx + 20, cy);
        ctx.moveTo(cx, cy - 20);
        ctx.lineTo(cx, cy - 14);
        ctx.moveTo(cx, cy + 14);
        ctx.lineTo(cx, cy + 20);
        ctx.stroke();
      }

      // Gesture Action Badge Banner
      const badgeY = Math.max(28, by - 12);
      ctx.fillStyle = isPause ? "rgba(159, 18, 57, 0.9)" : "rgba(12, 74, 110, 0.9)";
      ctx.fillRect(bx, badgeY - 14, Math.max(140, bw), 18);
      ctx.strokeStyle = primaryColor;
      ctx.strokeRect(bx, badgeY - 14, Math.max(140, bw), 18);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.fillText(
        `${result.label} • ${Math.round(result.confidence * 100)}%`,
        bx + 6,
        badgeY - 1
      );

      ctx.restore();
    } else {
      // Idle Scanning reticle in center
      const cx = width / 2;
      const cy = height / 2;
      ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 36, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
      ctx.textAlign = "center";
      ctx.fillText("POSITION HAND IN SENSOR FIELD", cx, cy + 54);
      ctx.textAlign = "left";
    }
  }
}

export const gestureDetector = new GestureDetectionService();

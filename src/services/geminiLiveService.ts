/**
 * JARVIS Gemini Live Streaming Audio Service
 * Connects to Gemini 3.1 Flash Live API over WebSocket with bidirectional 16kHz input & 24kHz gapless output
 */

import { LiveVoicePersona } from "../types";

export interface LiveStreamingCallbacks {
  onStatusChange?: (status: "disconnected" | "connecting" | "connected" | "speaking" | "listening" | "error") => void;
  onTranscriptUpdate?: (speaker: "user" | "jarvis", text: string, isFinal?: boolean) => void;
  onAudioPeak?: (peak: number, source: "mic" | "output") => void;
  onError?: (err: string) => void;
  onInterrupted?: () => void;
}

class GeminiLiveService {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private activeSources: AudioBufferSourceNode[] = [];
  private nextStartTime: number = 0;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private currentStatus: "disconnected" | "connecting" | "connected" | "speaking" | "listening" | "error" = "disconnected";
  private callbacks: LiveStreamingCallbacks = {};
  private listeners: Set<LiveStreamingCallbacks> = new Set();
  private currentPersona: LiveVoicePersona = "Fenrir";
  private animationFrameId: number | null = null;

  public setCallbacks(callbacks: LiveStreamingCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Subscribe a listener for persistent live updates across tab navigation
   */
  public subscribe(listener: LiveStreamingCallbacks): () => void {
    this.listeners.add(listener);
    // Emit immediate current state
    listener.onStatusChange?.(this.currentStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyStatus(status: "disconnected" | "connecting" | "connected" | "speaking" | "listening" | "error") {
    this.currentStatus = status;
    this.callbacks.onStatusChange?.(status);
    for (const listener of this.listeners) {
      try {
        listener.onStatusChange?.(status);
      } catch (e) {}
    }
  }

  private notifyTranscript(speaker: "user" | "jarvis", text: string, isFinal?: boolean) {
    this.callbacks.onTranscriptUpdate?.(speaker, text, isFinal);
    for (const listener of this.listeners) {
      try {
        listener.onTranscriptUpdate?.(speaker, text, isFinal);
      } catch (e) {}
    }
  }

  private notifyAudioPeak(peak: number, source: "mic" | "output") {
    this.callbacks.onAudioPeak?.(peak, source);
    for (const listener of this.listeners) {
      try {
        listener.onAudioPeak?.(peak, source);
      } catch (e) {}
    }
  }

  private notifyInterrupted() {
    this.callbacks.onInterrupted?.();
    for (const listener of this.listeners) {
      try {
        listener.onInterrupted?.();
      } catch (e) {}
    }
  }

  private notifyError(err: string) {
    this.callbacks.onError?.(err);
    for (const listener of this.listeners) {
      try {
        listener.onError?.(err);
      } catch (e) {}
    }
  }

  public getStatus(): "disconnected" | "connecting" | "connected" | "speaking" | "listening" | "error" {
    return this.currentStatus;
  }

  public setPersona(persona: LiveVoicePersona) {
    this.currentPersona = persona;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getInputAnalyser(): AnalyserNode | null {
    return this.inputAnalyser;
  }

  public getOutputAnalyser(): AnalyserNode | null {
    return this.outputAnalyser;
  }

  /**
   * Copy real-time byte time-domain or frequency data from input or output
   */
  public getWaveformData(targetArray: Uint8Array, source: "mic" | "output" | "auto" = "auto"): boolean {
    let analyserToUse: AnalyserNode | null = null;

    if (source === "auto") {
      if (this.isSpeaking && this.outputAnalyser) {
        analyserToUse = this.outputAnalyser;
      } else if (this.isListening && this.inputAnalyser) {
        analyserToUse = this.inputAnalyser;
      } else {
        analyserToUse = this.outputAnalyser || this.inputAnalyser;
      }
    } else if (source === "mic") {
      analyserToUse = this.inputAnalyser;
    } else {
      analyserToUse = this.outputAnalyser;
    }

    if (analyserToUse) {
      try {
        analyserToUse.getByteTimeDomainData(targetArray);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  public getFrequencyData(targetArray: Uint8Array, source: "mic" | "output" | "auto" = "auto"): boolean {
    let analyserToUse: AnalyserNode | null = null;

    if (source === "auto") {
      if (this.isSpeaking && this.outputAnalyser) {
        analyserToUse = this.outputAnalyser;
      } else if (this.isListening && this.inputAnalyser) {
        analyserToUse = this.inputAnalyser;
      } else {
        analyserToUse = this.outputAnalyser || this.inputAnalyser;
      }
    } else if (source === "mic") {
      analyserToUse = this.inputAnalyser;
    } else {
      analyserToUse = this.outputAnalyser;
    }

    if (analyserToUse) {
      try {
        analyserToUse.getByteFrequencyData(targetArray);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  /**
   * Initialize and connect to the WebSocket Live Stream
   */
  public async connect(): Promise<boolean> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return true;
    }

    this.callbacks.onStatusChange?.("connecting");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/live`;

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.notifyStatus("connected");
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "audio" && data.audio) {
              this.handleIncomingAudio(data.audio);
            } else if (data.type === "outputTranscription" && data.text) {
              this.notifyTranscript("jarvis", data.text, false);
            } else if (data.type === "inputTranscription" && data.text) {
              this.notifyTranscript("user", data.text, false);
            } else if (data.type === "interrupted") {
              this.interruptPlayback();
              this.notifyInterrupted();
            } else if (data.type === "turnComplete") {
              this.notifyTranscript("jarvis", "", true);
            } else if (data.type === "error") {
              console.warn("Live server error notice:", data.error);
            }
          } catch (err) {
            console.error("Error parsing live WS payload:", err);
          }
        };

        this.ws.onerror = (err) => {
          console.warn("Live WebSocket connection error:", err);
          this.notifyStatus("error");
          resolve(false);
        };

        this.ws.onclose = () => {
          this.notifyStatus("disconnected");
          this.interruptPlayback();
        };
      } catch (err: any) {
        console.error("Failed to construct Live WebSocket:", err);
        this.notifyStatus("error");
        resolve(false);
      }
    });
  }

  private getOrCreateOutputAudioContext(): AudioContext {
    if (!this.outputAudioCtx || this.outputAudioCtx.state === "closed") {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      try {
        this.outputAudioCtx = new AudioCtxClass({ sampleRate: 24000 });
      } catch (e) {
        this.outputAudioCtx = new AudioCtxClass();
      }
    }
    return this.outputAudioCtx;
  }

  private getOrCreateInputAudioContext(): AudioContext {
    if (!this.inputAudioCtx || this.inputAudioCtx.state === "closed") {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      try {
        this.inputAudioCtx = new AudioCtxClass({ sampleRate: 16000 });
      } catch (e) {
        // Fallback for environments where custom sampleRate is not supported
        this.inputAudioCtx = new AudioCtxClass();
      }
    }
    return this.inputAudioCtx;
  }

  /**
   * Resample Float32 audio to 16kHz for Gemini Live if native sample rate differs
   */
  private downsampleTo16k(buffer: Float32Array, inputSampleRate: number): Float32Array {
    if (inputSampleRate === 16000 || !inputSampleRate) {
      return buffer;
    }
    const sampleRateRatio = inputSampleRate / 16000;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  /**
   * Start microphone capture and streaming
   */
  public async startMicrophone(): Promise<boolean> {
    try {
      // Connect WS first if not already connected
      await this.connect();

      // Ensure Output AudioContext is running
      const outCtx = this.getOrCreateOutputAudioContext();
      if (outCtx && outCtx.state === "suspended") {
        await outCtx.resume().catch(() => {});
      }

      if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone API (navigator.mediaDevices.getUserMedia) not supported in this browser.");
      }

      // Stop any existing tracks before acquiring new stream
      if (this.mediaStream) {
        try {
          this.mediaStream.getTracks().forEach((track) => track.stop());
        } catch (e) {}
        this.mediaStream = null;
      }

      // Request media stream with fallback
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err) {
        // Fallback with generic audio constraints
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      this.mediaStream = stream;

      // Ensure Input AudioContext is active and ready
      const inputCtx = this.getOrCreateInputAudioContext();
      if (inputCtx.state === "suspended") {
        await inputCtx.resume().catch(() => {});
      }

      if (!inputCtx || typeof inputCtx.createMediaStreamSource !== "function") {
        throw new Error("Web Audio API createMediaStreamSource is unavailable.");
      }

      const sourceNode = inputCtx.createMediaStreamSource(this.mediaStream);
      
      // Input Analyser for UI Peak detection and Oscilloscope Waveforms
      this.inputAnalyser = inputCtx.createAnalyser();
      this.inputAnalyser.fftSize = 512;
      this.inputAnalyser.smoothingTimeConstant = 0.65;
      sourceNode.connect(this.inputAnalyser);

      // Clean old script processor if any
      if (this.scriptProcessor) {
        try {
          this.scriptProcessor.disconnect();
        } catch (e) {}
        this.scriptProcessor = null;
      }

      // ScriptProcessor for PCM audio capture
      this.scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isListening) return;

        const inputBuffer = e.inputBuffer.getChannelData(0);

        // Calculate Mic Peak for UI HUD
        let sum = 0;
        for (let i = 0; i < inputBuffer.length; i++) {
          sum += inputBuffer[i] * inputBuffer[i];
        }
        const rms = Math.sqrt(sum / inputBuffer.length);
        const peak = Math.min(1, rms * 4);
        this.notifyAudioPeak(peak, "mic");

        // Convert to 16-bit PCM (with resampling if browser context isn't 16kHz)
        const currentRate = inputCtx.sampleRate || 16000;
        const resampled = this.downsampleTo16k(inputBuffer, currentRate);
        const pcmBase64 = this.floatTo16BitPCMBase64(resampled);

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: "audio",
              audio: pcmBase64,
            })
          );
        }
      };

      sourceNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(inputCtx.destination);

      this.isListening = true;
      this.notifyStatus("listening");
      return true;
    } catch (err: any) {
      console.error("Failed to start Live microphone:", err);
      this.stopMicrophone();
      this.notifyError(err.message || "Microphone access denied");
      return false;
    }
  }

  /**
   * Stop microphone capture
   */
  public stopMicrophone() {
    this.isListening = false;
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      this.mediaStream = null;
    }
    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch (e) {}
      this.scriptProcessor = null;
    }
    if (this.inputAnalyser) {
      try {
        this.inputAnalyser.disconnect();
      } catch (e) {}
      this.inputAnalyser = null;
    }
    if (this.inputAudioCtx && this.inputAudioCtx.state !== "closed") {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }
    this.notifyStatus(this.isSpeaking ? "speaking" : "connected");
  }

  /**
   * Stream a visual frame (Camera or Screen Capture) to Gemini Live
   */
  public sendVisionFrame(base64Image: string, mimeType: string = "image/jpeg") {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "video",
          image: base64Image,
          mimeType,
        })
      );
    }
  }

  /**
   * Send a text command into the Live Stream
   */
  public sendTextMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "text",
          text,
        })
      );
    }
  }

  /**
   * Convert Float32Array to 16-bit PCM little-endian Base64
   */
  private floatTo16BitPCMBase64(float32: Float32Array): string {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Handle incoming raw 24kHz PCM audio chunk from Gemini Live
   */
  private handleIncomingAudio(base64Audio: string) {
    try {
      if (!this.outputAudioCtx || this.outputAudioCtx.state === "closed") {
        this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      if (this.outputAudioCtx.state === "suspended") {
        this.outputAudioCtx.resume();
      }

      // Convert Base64 to ArrayBuffer (16-bit PCM at 24000Hz)
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      // Create Audio Source Node
      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;

      // Create Analyser for Model Voice oscilloscope and peak visualization
      if (!this.outputAnalyser) {
        this.outputAnalyser = this.outputAudioCtx.createAnalyser();
        this.outputAnalyser.fftSize = 512;
        this.outputAnalyser.smoothingTimeConstant = 0.7;
        this.outputAnalyser.connect(this.outputAudioCtx.destination);
        this.startVoicePeakLoop();
      }
      source.connect(this.outputAnalyser);

      // Precise consecutive scheduling to eliminate overlap/jitter
      const currentTime = this.outputAudioCtx.currentTime;
      const startTime = Math.max(currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      this.activeSources.push(source);
      this.isSpeaking = true;
      this.notifyStatus("speaking");

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0) {
          this.isSpeaking = false;
          this.notifyStatus(this.isListening ? "listening" : "connected");
        }
      };
    } catch (err) {
      console.error("Error decoding model audio chunk:", err);
    }
  }

  /**
   * Monitor output voice audio peaks for real-time visualizer
   */
  private startVoicePeakLoop() {
    if (this.animationFrameId !== null) return;

    const dataArray = new Uint8Array(128);
    const loop = () => {
      if (this.outputAnalyser && this.isSpeaking) {
        this.outputAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        this.notifyAudioPeak(avg, "output");
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Immediately cancel any active or scheduled audio playback
   */
  public interruptPlayback() {
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {}
    }
    this.activeSources = [];
    this.nextStartTime = 0;
    this.isSpeaking = false;
    this.notifyStatus(this.isListening ? "listening" : "connected");
  }

  /**
   * Play full PCM Audio data (from fast voice-turn endpoint)
   */
  public async playRawPCM(base64Audio: string): Promise<void> {
    this.handleIncomingAudio(base64Audio);
  }

  /**
   * Clean up all resources
   */
  public disconnect() {
    this.stopMicrophone();
    this.interruptPlayback();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.outputAudioCtx && this.outputAudioCtx.state !== "closed") {
      this.outputAudioCtx.close().catch(() => {});
      this.outputAudioCtx = null;
    }
  }
}

export const geminiLive = new GeminiLiveService();

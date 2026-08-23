/**
 * JARVIS Speech Recognition and Voice Synthesis Service
 * Supports Direct Dictation and Custom Wake-Word Triggering
 */

export interface SpeechRecognitionHandlers {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
}

export interface WakeWordHandlers {
  onWakeWordDetected: (detectedPhrase: string, remainingTranscript?: string) => void;
  onStatusChange?: (status: "idle" | "listening" | "detected" | "error") => void;
  onError?: (error: string) => void;
}

class SpeechService {
  private recognition: any = null;
  private wakeWordRecognition: any = null;
  private isListening: boolean = false;
  private isWakeWordActive: boolean = false;
  private currentWakeWord: string = "Jarvis";
  private wakeWordHandlers: WakeWordHandlers | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private wakeWordRestartTimeout: any = null;

  constructor() {
    this.initRecognizers();
  }

  private initRecognizers() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        // Direct interaction recognizer
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";

        // Dedicated continuous Wake-Word recognizer
        this.wakeWordRecognition = new SpeechRecognition();
        this.wakeWordRecognition.continuous = true;
        this.wakeWordRecognition.interimResults = true;
        this.wakeWordRecognition.lang = "en-US";
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public setWakeWord(word: string) {
    if (word && word.trim()) {
      this.currentWakeWord = word.trim();
    }
  }

  public getWakeWord(): string {
    return this.currentWakeWord;
  }

  public isWakeWordRunning(): boolean {
    return this.isWakeWordActive;
  }

  public isUserListening(): boolean {
    return this.isListening;
  }

  /**
   * Start listening specifically for the custom wake-word
   */
  public startWakeWordDetection(handlers: WakeWordHandlers, wakeWord?: string) {
    if (wakeWord) {
      this.setWakeWord(wakeWord);
    }
    this.wakeWordHandlers = handlers;

    if (!this.wakeWordRecognition) {
      handlers.onError?.("Speech recognition not supported in this browser.");
      return;
    }

    // Do not start wake-word if user is actively dictating
    if (this.isListening) {
      return;
    }

    try {
      this.isWakeWordActive = true;
      this.wakeWordHandlers?.onStatusChange?.("listening");

      this.wakeWordRecognition.onresult = (event: any) => {
        if (!this.isWakeWordActive || this.isListening) return;

        let fullTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript.toLowerCase() + " ";
        }

        const targetWord = this.currentWakeWord.toLowerCase().trim();
        // Check for wake-word match or variations (e.g. "hey " + wake-word or direct match)
        const regex = new RegExp(`\\b(hey\\s+|ok\\s+|okay\\s+|hi\\s+|hello\\s+)?${this.escapeRegExp(targetWord)}\\b`, "i");
        
        if (regex.test(fullTranscript) || fullTranscript.includes(targetWord)) {
          this.wakeWordHandlers?.onStatusChange?.("detected");
          
          // Extract remaining spoken words after the wake word if any
          let remaining = "";
          const match = fullTranscript.match(regex);
          if (match && match.index !== undefined) {
            remaining = fullTranscript.slice(match.index + match[0].length).trim();
          }

          // Temporarily pause wake-word listener to allow mic speech recognition
          this.pauseWakeWordListener();
          this.wakeWordHandlers?.onWakeWordDetected(this.currentWakeWord, remaining);
        }
      };

      this.wakeWordRecognition.onerror = (event: any) => {
        if (event.error === "no-speech" || event.error === "aborted") {
          // Normal background idle behavior; auto-restart if still enabled
          this.scheduleWakeWordRestart();
          return;
        }
        this.wakeWordHandlers?.onError?.(event.error || "Wake-word recognition error");
      };

      this.wakeWordRecognition.onend = () => {
        if (this.isWakeWordActive && !this.isListening) {
          this.scheduleWakeWordRestart();
        } else {
          this.wakeWordHandlers?.onStatusChange?.("idle");
        }
      };

      this.wakeWordRecognition.start();
    } catch (err: any) {
      // If already started or browser state locked, schedule restart safely
      this.scheduleWakeWordRestart();
    }
  }

  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private scheduleWakeWordRestart() {
    if (!this.isWakeWordActive || this.isListening) return;
    if (this.wakeWordRestartTimeout) clearTimeout(this.wakeWordRestartTimeout);

    this.wakeWordRestartTimeout = setTimeout(() => {
      if (this.isWakeWordActive && !this.isListening && this.wakeWordRecognition) {
        try {
          this.wakeWordRecognition.start();
          this.wakeWordHandlers?.onStatusChange?.("listening");
        } catch (e) {
          // Already active or starting
        }
      }
    }, 500);
  }

  private pauseWakeWordListener() {
    if (this.wakeWordRestartTimeout) clearTimeout(this.wakeWordRestartTimeout);
    if (this.wakeWordRecognition) {
      try {
        this.wakeWordRecognition.stop();
      } catch (e) {}
    }
  }

  public stopWakeWordDetection() {
    this.isWakeWordActive = false;
    if (this.wakeWordRestartTimeout) clearTimeout(this.wakeWordRestartTimeout);
    if (this.wakeWordRecognition) {
      try {
        this.wakeWordRecognition.stop();
      } catch (e) {}
    }
    this.wakeWordHandlers?.onStatusChange?.("idle");
  }

  /**
   * Start microphone listening for user voice commands / dictation
   */
  public startListening(handlers: SpeechRecognitionHandlers) {
    if (!this.recognition) {
      handlers.onError("Speech recognition not supported in this browser.");
      return;
    }

    // Pause wake-word while active speech recognition runs
    this.pauseWakeWordListener();

    try {
      this.stopSpeaking();
      this.recognition.onstart = () => {
        this.isListening = true;
        handlers.onStart();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          handlers.onResult(finalTranscript, true);
        } else if (interimTranscript) {
          handlers.onResult(interimTranscript, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        handlers.onError(event.error || "Speech recognition error");
        this.resumeWakeWordIfConfigured();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        handlers.onEnd();
        this.resumeWakeWordIfConfigured();
      };

      this.recognition.start();
    } catch (err: any) {
      this.isListening = false;
      handlers.onError(err.message || "Failed to start microphone");
      this.resumeWakeWordIfConfigured();
    }
  }

  private resumeWakeWordIfConfigured() {
    if (this.isWakeWordActive && this.wakeWordHandlers) {
      this.scheduleWakeWordRestart();
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
    this.resumeWakeWordIfConfigured();
  }

  public speak(
    text: string,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
      rate?: number;
      pitch?: number;
    }
  ) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      options?.onEnd?.();
      return;
    }

    this.stopSpeaking();

    // Clean markdown and symbols
    const cleanText = text
      .replace(/[*_#`~[\]]/g, "")
      .replace(/\(https?:\/\/[^\)]+\)/g, "")
      .replace(/```[\s\S]*?```/g, "Code block omitted from voice output.")
      .trim();

    if (!cleanText) {
      options?.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    utterance.rate = options?.rate ?? 1.05;
    utterance.pitch = options?.pitch ?? 0.95;

    // Pick best British or sophisticated English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("UK") || v.name.includes("British") || v.name.includes("Daniel") || v.name.includes("Arthur") || v.name.includes("Google UK English Male"))) ||
      voices.find((v) => v.lang.startsWith("en-US") && (v.name.includes("Natural") || v.name.includes("Guy") || v.name.includes("David"))) ||
      voices.find((v) => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      options?.onError?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
  }

  public isSpeaking(): boolean {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      return window.speechSynthesis.speaking;
    }
    return false;
  }
}

export const speechService = new SpeechService();

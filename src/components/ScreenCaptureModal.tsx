import React, { useState, useRef, useEffect } from "react";
import { Monitor, X, Check, RefreshCw, AlertCircle, Upload, Image as ImageIcon, Clipboard } from "lucide-react";
import { jarvisSound } from "../services/soundEffects";

interface ScreenCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export const ScreenCaptureModal: React.FC<ScreenCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasGetDisplayMedia =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === "function";

  // Handle clipboard paste (Cmd+V / Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setCapturedImage(event.target.result as string);
                setError(null);
                jarvisSound.playBlip();
              }
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedImage(event.target.result as string);
        setError(null);
        jarvisSound.playBlip();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          setError(null);
          jarvisSound.playBlip();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startScreenGrab = async () => {
    setError(null);
    setIsCapturing(true);
    jarvisSound.playBlip();

    if (!hasGetDisplayMedia) {
      setError(
        "Screen capture API is restricted in iframe/mobile browsers. Please upload a screenshot or paste from clipboard (Ctrl+V)."
      );
      setIsCapturing(false);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" } as any,
        audio: false,
      });

      const video = document.createElement("video");
      video.srcObject = mediaStream;
      await video.play();

      // Wait a moment for stream to settle
      await new Promise((r) => setTimeout(r, 400));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(dataUrl);
      }

      mediaStream.getTracks().forEach((track) => track.stop());
    } catch (err: any) {
      console.warn("Screen capture warning:", err);
      if (err?.name === "NotAllowedError" || err?.message?.includes("denied")) {
        setError("Screen capture permission was cancelled or denied.");
      } else {
        setError("Direct screen capture unavailable in this window. Use Upload or Clipboard Paste (Ctrl+V) below.");
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const confirmAttachment = () => {
    if (capturedImage) {
      jarvisSound.playSuccess();
      onCapture(capturedImage);
      onClose();
      setCapturedImage(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl shadow-cyan-950/50 flex flex-col gap-4 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Monitor className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              SCREEN BUFFER TELEMETRY CAPTURE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport & Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group"
        >
          {capturedImage ? (
            <img src={capturedImage} alt="Screen Grab" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center p-6 flex flex-col items-center gap-2 text-slate-400 text-xs">
              <Monitor className="w-10 h-10 text-cyan-500/40 mb-1" />
              <span>Share screen window, drop screenshot image, or press <strong>Ctrl+V</strong> to paste.</span>
              {error && (
                <div className="p-2 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-[11px] mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden File Input for fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          {capturedImage ? (
            <>
              <button
                onClick={() => setCapturedImage(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake
              </button>
              <button
                onClick={confirmAttachment}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/30 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Attach Screen to JARVIS
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  Upload Screenshot
                </button>
              </div>

              {hasGetDisplayMedia ? (
                <button
                  onClick={startScreenGrab}
                  disabled={isCapturing}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/30 cursor-pointer"
                >
                  <Monitor className="w-4 h-4" />
                  {isCapturing ? "Awaiting Screen Selection..." : "Grab Active Screen"}
                </button>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/30 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  Select Screen File
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

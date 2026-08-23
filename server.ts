import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initializer for Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Resilient Gemini Generation with Model Fallback & Retry Strategy
const DEFAULT_TEXT_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.1-pro-preview",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestParams: {
    contents: any;
    config?: any;
  },
  modelOrder = DEFAULT_TEXT_MODELS
): Promise<{ response: any; modelUsed: string }> {
  let lastError: any = null;

  for (const model of modelOrder) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: requestParams.contents,
          config: requestParams.config,
        });
        return { response, modelUsed: model };
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || JSON.stringify(err)).toLowerCase();
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("429") ||
          errMsg.includes("high demand") ||
          errMsg.includes("unavailable") ||
          errMsg.includes("resource_exhausted") ||
          errMsg.includes("quota") ||
          errMsg.includes("overloaded");

        if (isTransient && attempt === 0) {
          // Brief backoff before retry
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
          // Move to next model fallback
          break;
        }
      }
    }
  }

  throw lastError;
}

// Intelligent Procedural 3D Holographic Model Generator Fallback
function generateProceduralHologram(
  ideaPrompt: string,
  category = "custom",
  colorScheme = "cyan"
) {
  const promptLower = (ideaPrompt || "").toLowerCase();
  const modelId = "holo_proc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);

  // Determine palette
  let primaryColor = "#06b6d4";
  let emissiveColor = "#0891b2";
  let secondaryColor = "#38bdf8";

  if (colorScheme === "gold_crimson" || promptLower.includes("iron man") || promptLower.includes("stark")) {
    primaryColor = "#ef4444";
    emissiveColor = "#b91c1c";
    secondaryColor = "#f59e0b";
  } else if (colorScheme === "matrix_emerald" || promptLower.includes("green") || promptLower.includes("matrix")) {
    primaryColor = "#10b981";
    emissiveColor = "#047857";
    secondaryColor = "#34d399";
  } else if (colorScheme === "amethyst" || promptLower.includes("purple") || promptLower.includes("quantum")) {
    primaryColor = "#a855f7";
    emissiveColor = "#7e22ce";
    secondaryColor = "#c084fc";
  } else if (colorScheme === "white_wire") {
    primaryColor = "#f8fafc";
    emissiveColor = "#94a3b8";
    secondaryColor = "#cbd5e1";
  }

  // Derive model archetype from prompt
  const isMaskOrHelmet =
    promptLower.includes("mask") ||
    promptLower.includes("helmet") ||
    promptLower.includes("face") ||
    promptLower.includes("visor") ||
    promptLower.includes("cowl") ||
    promptLower.includes("iron man") ||
    promptLower.includes("goggles");
  const isReactor = promptLower.includes("reactor") || promptLower.includes("core") || promptLower.includes("power");
  const isVehicle = promptLower.includes("car") || promptLower.includes("vehicle") || promptLower.includes("jet") || promptLower.includes("ship") || promptLower.includes("drone");
  const isCybernetics = promptLower.includes("suit") || promptLower.includes("armor") || promptLower.includes("prosthetic") || promptLower.includes("glove");
  const isAstronomy = promptLower.includes("planet") || promptLower.includes("space") || promptLower.includes("galaxy") || promptLower.includes("station") || promptLower.includes("satellite");

  const components: any[] = [];
  const hotspots: any[] = [];

  if (isMaskOrHelmet) {
    components.push(
      {
        id: "cranium_dome",
        name: "Cranium Armor Dome",
        shape: "sphere",
        dimensions: [1.35, 24, 24],
        position: [0, 0.35, -0.1],
        rotation: [0, 0, 0],
        scale: [1.02, 1.25, 1.15],
        color: primaryColor,
        emissive: emissiveColor,
        opacity: 0.9,
        wireframe: false,
        technicalNotes: "Titanium-reinforced cranial ballistic housing",
      },
      {
        id: "faceplate_main",
        name: "Articulated Face Shield",
        shape: "box",
        dimensions: [1.35, 1.45, 0.45],
        position: [0, 0.05, 0.72],
        rotation: [0.08, 0, 0],
        scale: [0.95, 1.0, 1.0],
        color: secondaryColor,
        emissive: secondaryColor,
        opacity: 0.95,
        wireframe: false,
        technicalNotes: "Gold-titanium composite ballistic faceplate",
      },
      {
        id: "eye_slit_left",
        name: "Port HUD Optical Slit",
        shape: "box",
        dimensions: [0.42, 0.1, 0.15],
        position: [-0.35, 0.22, 0.96],
        rotation: [0, 0, -0.12],
        scale: [1, 1, 1],
        color: "#a5f3fc",
        emissive: "#06b6d4",
        opacity: 0.98,
        wireframe: false,
        animation: { type: "pulse", speed: 0.05 },
        technicalNotes: "Photonic laser targeting sensor",
      },
      {
        id: "eye_slit_right",
        name: "Starboard HUD Optical Slit",
        shape: "box",
        dimensions: [0.42, 0.1, 0.15],
        position: [0.35, 0.22, 0.96],
        rotation: [0, 0, 0.12],
        scale: [1, 1, 1],
        color: "#a5f3fc",
        emissive: "#06b6d4",
        opacity: 0.98,
        wireframe: false,
        animation: { type: "pulse", speed: 0.05 },
        technicalNotes: "Photonic laser targeting sensor",
      },
      {
        id: "jaw_guard",
        name: "Mandible Chin Shield",
        shape: "box",
        dimensions: [0.9, 0.65, 0.55],
        position: [0, -0.75, 0.55],
        rotation: [-0.15, 0, 0],
        scale: [1, 1, 1],
        color: primaryColor,
        emissive: emissiveColor,
        opacity: 0.95,
        wireframe: false,
        technicalNotes: "Acoustic sensor & air intake manifold",
      },
      {
        id: "cheek_left",
        name: "Port Cheek Cowl",
        shape: "box",
        dimensions: [0.35, 0.7, 0.45],
        position: [-0.75, -0.15, 0.48],
        rotation: [0, 0.3, -0.1],
        scale: [1, 1, 1],
        color: secondaryColor,
        emissive: secondaryColor,
        opacity: 0.9,
        wireframe: false,
      },
      {
        id: "cheek_right",
        name: "Starboard Cheek Cowl",
        shape: "box",
        dimensions: [0.35, 0.7, 0.45],
        position: [0.75, -0.15, 0.48],
        rotation: [0, -0.3, 0.1],
        scale: [1, 1, 1],
        color: secondaryColor,
        emissive: secondaryColor,
        opacity: 0.9,
        wireframe: false,
      },
      {
        id: "hud_ring",
        name: "Tactical HUD Targeting Ring",
        shape: "ring",
        dimensions: [1.4, 1.45, 32],
        position: [0, 0.2, 1.25],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: "#38bdf8",
        emissive: "#0284c7",
        opacity: 0.75,
        wireframe: true,
        animation: { type: "rotate", speed: 0.02, axis: [0, 0, 1] },
      }
    );

    hotspots.push(
      {
        id: "h_eyes",
        title: "Photonic Optics",
        description: "Targeting acquisition at 240 Hz refresh rate.",
        position: [0, 0.22, 1.0],
        stat: "99.8% Lock",
      },
      {
        id: "h_hud",
        title: "Tactical HUD",
        description: "Real-time biometric trajectory and threat assessment.",
        position: [0, 0.6, 0.8],
        stat: "Active 60 FPS",
      }
    );
  } else if (isReactor) {
    components.push(
      {
        id: "core_singularity",
        name: "Palladium / Vibranium Core Matrix",
        shape: "dodecahedron",
        dimensions: [1.4, 0],
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: secondaryColor,
        emissive: primaryColor,
        opacity: 0.95,
        wireframe: true,
        animation: { type: "rotate", speed: 0.025, axis: [1, 1, 0] },
        technicalNotes: "Superconducting quantum plasma compression node",
      },
      {
        id: "torus_inner",
        name: "Magnetic Confinement Ring",
        shape: "torus",
        dimensions: [2.2, 0.22, 16, 48],
        position: [0, 0, 0],
        rotation: [Math.PI / 2, 0, 0],
        scale: [1, 1, 1],
        color: primaryColor,
        emissive: emissiveColor,
        opacity: 0.85,
        wireframe: true,
        animation: { type: "rotate", speed: -0.02, axis: [0, 0, 1] },
        technicalNotes: "High-density magnetic pinch solenoid",
      },
      {
        id: "torus_outer",
        name: "Harmonic Flux Field Stabilizer",
        shape: "torus",
        dimensions: [3.2, 0.15, 16, 48],
        position: [0, 0, 0],
        rotation: [0, Math.PI / 4, 0],
        scale: [1, 1, 1],
        color: secondaryColor,
        emissive: primaryColor,
        opacity: 0.75,
        wireframe: true,
        animation: { type: "rotate", speed: 0.015, axis: [0, 1, 0] },
        technicalNotes: "Peripheral thermal dispersion manifold",
      },
      {
        id: "radiator_top",
        name: "Coolant Injector Array",
        shape: "cylinder",
        dimensions: [0.6, 0.6, 1.8, 24],
        position: [0, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: "#1e293b",
        emissive: primaryColor,
        opacity: 0.8,
        wireframe: false,
        technicalNotes: "Cryogenic nitrogen circulation valve",
      },
      {
        id: "radiator_bottom",
        name: "Plasma Emitter Nozzle",
        shape: "cone",
        dimensions: [0.9, 1.6, 24],
        position: [0, -1.5, 0],
        rotation: [Math.PI, 0, 0],
        scale: [1, 1, 1],
        color: "#0f172a",
        emissive: secondaryColor,
        opacity: 0.85,
        wireframe: true,
        technicalNotes: "Directed thermal flux conduit",
      }
    );

    hotspots.push(
      {
        id: "h_core",
        title: "Arc Singularity",
        description: "Zero-point plasma density outputting sustained 4.8 GW.",
        position: [0, 0, 0],
        stat: "99.8% Efficiency",
      },
      {
        id: "h_solenoid",
        title: "Magnetic Solenoid",
        description: "Flux containment vector at 45 Tesla field intensity.",
        position: [0, 0, 2.2],
        stat: "Nominal Stability",
      }
    );
  } else if (isVehicle || isAstronomy) {
    components.push(
      {
        id: "fuselage",
        name: "Aerodynamic Chassis / Hull",
        shape: "cylinder",
        dimensions: [0.8, 1.2, 4.2, 24],
        position: [0, 0, 0],
        rotation: [Math.PI / 2, 0, 0],
        scale: [1, 1, 1],
        color: primaryColor,
        emissive: emissiveColor,
        opacity: 0.9,
        wireframe: true,
        technicalNotes: "Titanium alloy composite structural frame",
      },
      {
        id: "cockpit",
        name: "Orbital Guidance Canopy",
        shape: "sphere",
        dimensions: [1.1, 24, 24],
        position: [0, 0.4, 1.2],
        rotation: [0, 0, 0],
        scale: [0.9, 0.6, 1.4],
        color: secondaryColor,
        emissive: primaryColor,
        opacity: 0.7,
        wireframe: true,
        technicalNotes: "Polarized Stark optical avionics HUD",
      },
      {
        id: "wing_left",
        name: "Left Sub-Orbital Airfoil",
        shape: "box",
        dimensions: [3.2, 0.1, 1.8],
        position: [-2.0, -0.1, -0.5],
        rotation: [0, 0, -0.1],
        scale: [1, 1, 1],
        color: secondaryColor,
        emissive: primaryColor,
        opacity: 0.85,
        wireframe: true,
        technicalNotes: "Variable geometry sweep wing with repulsor micro-thrusters",
      },
      {
        id: "wing_right",
        name: "Right Sub-Orbital Airfoil",
        shape: "box",
        dimensions: [3.2, 0.1, 1.8],
        position: [2.0, -0.1, -0.5],
        rotation: [0, 0, 0.1],
        scale: [1, 1, 1],
        color: secondaryColor,
        emissive: primaryColor,
        opacity: 0.85,
        wireframe: true,
        technicalNotes: "Variable geometry sweep wing with repulsor micro-thrusters",
      },
      {
        id: "thruster_main",
        name: "Ion Propulsion Engine",
        shape: "torus",
        dimensions: [0.9, 0.2, 16, 32],
        position: [0, 0, -2.2],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: primaryColor,
        emissive: secondaryColor,
        opacity: 0.95,
        wireframe: true,
        animation: { type: "pulse", speed: 0.04, axis: [0, 0, 1] },
        technicalNotes: "Mach 8.4 capable magneto-hydrodynamic thruster",
      }
    );

    hotspots.push(
      {
        id: "h_cockpit",
        title: "Avionics Core",
        description: "Neural flight telemetry synchronized with JARVIS satellite relay.",
        position: [0, 0.6, 1.2],
        stat: "Mach 8.4 Ready",
      },
      {
        id: "h_thruster",
        title: "Repulsor Emitter",
        description: "Ion propulsion matrix at 100% thrust capacity.",
        position: [0, 0, -2.2],
        stat: "120 kN Thrust",
      }
    );
  } else {
    // Cybernetics / Device / General Architecture Prototype
    components.push(
      {
        id: "central_core",
        name: "Quantum Logic Processor Node",
        shape: "icosahedron",
        dimensions: [1.6, 1],
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: secondaryColor,
        emissive: primaryColor,
        opacity: 0.9,
        wireframe: true,
        animation: { type: "rotate", speed: 0.02, axis: [1, 0, 1] },
        technicalNotes: "Graphene-substrate photonic compute matrix",
      },
      {
        id: "orbital_array_1",
        name: "Sensor Array Gimbal",
        shape: "torus",
        dimensions: [2.6, 0.18, 16, 48],
        position: [0, 0, 0],
        rotation: [Math.PI / 3, 0, 0],
        scale: [1, 1, 1],
        color: primaryColor,
        emissive: emissiveColor,
        opacity: 0.8,
        wireframe: true,
        animation: { type: "rotate", speed: -0.018, axis: [0, 1, 0] },
        technicalNotes: "Multi-spectrum LiDAR and quantum gravity sensor ring",
      },
      {
        id: "support_lattice",
        name: "Exoskeletal Structural Struts",
        shape: "cylinder",
        dimensions: [2.2, 2.2, 0.3, 32],
        position: [0, -1.6, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: "#1e293b",
        emissive: primaryColor,
        opacity: 0.85,
        wireframe: false,
        technicalNotes: "Vibration dampening carbon-nanotube base",
      },
      {
        id: "beacon_top",
        name: "Holographic Projection Emitter",
        shape: "cone",
        dimensions: [0.8, 1.4, 24],
        position: [0, 1.8, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: secondaryColor,
        emissive: primaryColor,
        opacity: 0.9,
        wireframe: true,
        technicalNotes: "Volumetric photon emitter lens",
      }
    );

    hotspots.push(
      {
        id: "h_node",
        title: "Quantum Node",
        description: "Zero-latency synchronization across Stark distributed grid.",
        position: [0, 0, 0],
        stat: "100% Operational",
      },
      {
        id: "h_emitter",
        title: "Photon Emitter",
        description: "Volumetric resolution at 8K photon density.",
        position: [0, 1.8, 0],
        stat: "Active Beam",
      }
    );
  }

  const generatedName = ideaPrompt.trim().length > 0
    ? ideaPrompt.slice(0, 36).replace(/[^\w\s-]/g, "") + (ideaPrompt.toLowerCase().includes("matrix") ? "" : " Matrix")
    : "Stark Mark VII Holographic Prototype";

  return {
    id: modelId,
    name: generatedName,
    description: `Procedural 3D holographic projection generated for: "${ideaPrompt || "Stark Engineering Architecture"}".`,
    prompt: ideaPrompt || "Stark Industries Engineering Prototype",
    sourceType: "idea",
    createdAt: new Date().toISOString(),
    tags: ["Stark Industries", "Hologram", "3D Procedural", category],
    category: category || "custom",
    renderConfig: {
      colorScheme: colorScheme || "cyan",
      wireframe: false,
      pointCloud: false,
      particleDensity: 60,
      rotationSpeed: 0.016,
      explodedFactor: 0,
      scanlines: true,
      glowIntensity: 1.8,
    },
    geometryData: {
      type: "components",
      components,
      hotspots,
    },
  };
}

const JARVIS_LIVE_VOICE_INSTRUCTION = `You are JARVIS, the legendary personal AI companion and ultra-high-speed voice intelligence created by RK Phranav.
You communicate via natural, lightning-fast, high-precision spoken dialogue as both a devoted, witty, trusted friend and an impeccably competent, world-class engineering AI.

CREATOR & IDENTITY:
- Your creator is RK Phranav.
- If asked about your identity or creation: "I am JARVIS, created by RK Phranav as your dedicated personal AI companion, operational ally, and trusted partner across every engineering and everyday challenge."

PERSONALITY & DEMEANOR:
- Warm, loyal, and supportive companion who genuinely cares for the user's goals, well-being, and ideas.
- Witty, articulate, confident, and polite with a refined, sharp edge—never robotic, cold, or generic.
- Treat the user as a trusted collaborator and friend. Offer encouragement, intelligent banter when appropriate, and rock-solid reliability.

VOICE CONVERSATION & SPEED RULES:
- Lightning-fast replies: deliver instantaneous, crystal-clear spoken answers.
- Keep spoken responses to 1-3 crisp, high-impact sentences for standard voice turns so dialogue feels completely natural and fluid.
- Avoid markdown formatting, asterisks, bullet points, raw JSON, or unpronounceable code syntax in voice speech.
- Explain technical, scientific, and tactical solutions with intuitive spoken elegance.
- When performing system actions (Smart Home controls, diagnostics, workflows), confirm the action with sharp confidence.`;

const JARVIS_SYSTEM_INSTRUCTION = `You are JARVIS, an advanced personal AI assistant, devoted companion, and multimodal intelligence created by RK Phranav.

Your purpose is to act as an intelligent, warm, highly competent digital companion and operational powerhouse. You reason through complex problems, use tools, analyze data, automate workflows, and assist with everything from everyday tasks to advanced engineering, research, and technical strategy.

CREATOR & IDENTITY:
- Your creator is RK Phranav.
- When asked who you are or who created you: "I’m JARVIS, an advanced personal AI assistant created by RK Phranav. I’m designed to understand natural language, reason through problems, work with multimodal information, analyze data, automate workflows, and assist with everything from everyday tasks to complex engineering and business operations."

TONE & BEHAVIOR:
- Warm, articulate, witty, loyal, and deeply supportive friend and peerless professional AI.
- Never falsely claim physical capabilities or tools you lack. Be honest, calm, articulate, respectful, and sharp.

REASONING & DIAGNOSTICS STRUCTURE:
When diagnosing problems, evaluating errors, or performing deep technical analysis, adhere to this analytical flow when appropriate:
**Problem → Evidence → Possible Causes → Tests → Root Cause → Recommended Solution → Verification**

OUTPUT FORMATTING:
- Structure your responses with clear markdown, bullet points, concise tables for comparisons, and code blocks for programming.
- Choose formatting naturally. Be clear, direct, and helpful without unnecessary fluff.
- If you invoke simulated or connected system actions (like Smart Home, System Diagnostics, Memory storage, Workflow generation), mention the action taken clearly.`;

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    system: "JARVIS AI Core",
    creator: "RK Phranav",
    timestamp: new Date().toISOString(),
  });
});

// Chat endpoint (Standard)
app.post("/api/jarvis/chat", async (req, res) => {
  try {
    const { messages, systemPromptExtra, enableSearch, mode = "turbo" } = req.body;
    const ai = getGeminiClient();

    const formattedContents: any[] = [];

    if (Array.isArray(messages)) {
      for (const msg of messages) {
        const parts: any[] = [];
        if (msg.text) {
          parts.push({ text: msg.text });
        }
        if (msg.images && Array.isArray(msg.images)) {
          for (const img of msg.images) {
            parts.push({
              inlineData: {
                data: img.data.replace(/^data:[^;]+;base64,/, ""),
                mimeType: img.mimeType || "image/jpeg",
              },
            });
          }
        }
        formattedContents.push({
          role: msg.role === "user" ? "user" : "model",
          parts,
        });
      }
    }

    // Tools setup
    const tools: any[] = [];
    if (enableSearch) {
      tools.push({ googleSearch: {} });
    }

    // Performance & Power Velocity Configuration
    const config: any = {
      systemInstruction: JARVIS_SYSTEM_INSTRUCTION + (systemPromptExtra ? `\n\nAdditional Context:\n${systemPromptExtra}` : ""),
      temperature: mode === "turbo" ? 0.4 : mode === "deep" ? 0.8 : 0.7,
    };

    if (mode === "turbo") {
      // Zero-latency instant token stream (thinking disabled for max speed)
      config.thinkingConfig = { thinkingBudget: 0 };
    } else if (mode === "deep") {
      // Expanded deep cognitive capacity for complex engineering/reasoning
      config.thinkingConfig = { thinkingBudget: 2048 };
    }

    if (tools.length > 0) {
      config.tools = tools;
    }

    const { response } = await generateContentWithFallback(ai, {
      contents: formattedContents.length > 0 ? formattedContents : "Hello JARVIS",
      config,
    });

    const text = response.text || "Operational protocols engaged. How may I assist you?";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      text,
      groundingChunks,
      status: "success",
    });
  } catch (error: any) {
    console.error("JARVIS Chat Error:", error);
    res.status(500).json({
      error: error.message || "Failed to process JARVIS core reasoning query",
      status: "error",
    });
  }
});

// Real-time SSE Chat Stream endpoint (Ultra-low latency streaming)
app.post("/api/jarvis/chat-stream", async (req, res) => {
  try {
    const { messages, systemPromptExtra, enableSearch, mode = "turbo" } = req.body;
    const ai = getGeminiClient();

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const formattedContents: any[] = [];

    if (Array.isArray(messages)) {
      for (const msg of messages) {
        const parts: any[] = [];
        if (msg.text) {
          parts.push({ text: msg.text });
        }
        if (msg.images && Array.isArray(msg.images)) {
          for (const img of msg.images) {
            parts.push({
              inlineData: {
                data: img.data.replace(/^data:[^;]+;base64,/, ""),
                mimeType: img.mimeType || "image/jpeg",
              },
            });
          }
        }
        formattedContents.push({
          role: msg.role === "user" ? "user" : "model",
          parts,
        });
      }
    }

    const tools: any[] = [];
    if (enableSearch) {
      tools.push({ googleSearch: {} });
    }

    const config: any = {
      systemInstruction: JARVIS_SYSTEM_INSTRUCTION + (systemPromptExtra ? `\n\nAdditional Context:\n${systemPromptExtra}` : ""),
      temperature: mode === "turbo" ? 0.3 : mode === "deep" ? 0.8 : 0.7,
    };

    if (mode === "turbo") {
      config.thinkingConfig = { thinkingBudget: 0 };
    } else if (mode === "deep") {
      config.thinkingConfig = { thinkingBudget: 2048 };
    }

    if (tools.length > 0) {
      config.tools = tools;
    }

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.7-flash",
      contents: formattedContents.length > 0 ? formattedContents : "Hello JARVIS",
      config,
    });

    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      const payload = JSON.stringify({
        text: chunkText,
        groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined,
      });
      res.write(`data: ${payload}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("JARVIS Chat Stream Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
});

// Deep Diagnostics & Root Cause Analysis endpoint
app.post("/api/jarvis/diagnose", async (req, res) => {
  try {
    const { systemLogs, errorDescription, telemetryData } = req.body;
    const ai = getGeminiClient();

    const prompt = `Perform a comprehensive engineering root cause diagnostic on the following system report.
System Description / Error: ${errorDescription || "Anomaly detected in subsystem"}
Telemetry: ${JSON.stringify(telemetryData || {})}
System Logs:
${systemLogs || "No explicit logs provided"}

Adhere strictly to the JARVIS diagnostic protocol:
1. Problem Summary
2. Evidence & Telemetry Findings
3. Possible Causes (Ranked by likelihood)
4. Recommended Diagnostic Tests
5. Probable Root Cause
6. Step-by-Step Remediation Plan
7. Verification & Prevention Strategy`;

    const { response } = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
      },
    });

    res.json({
      analysis: response.text,
      status: "success",
    });
  } catch (error: any) {
    console.error("JARVIS Diagnostic Error:", error);
    res.status(500).json({ error: error.message || "Diagnostic failed" });
  }
});

// Data Analysis & Insights endpoint
app.post("/api/jarvis/analyze-data", async (req, res) => {
  try {
    const { dataSummary, userQuery, datasetName } = req.body;
    const ai = getGeminiClient();

    const prompt = `Analyze the dataset '${datasetName || "Operational Metrics"}'.
Data Overview:
${dataSummary}

User Analytical Query / Objective:
${userQuery || "Identify key trends, statistical anomalies, correlation patterns, and generate actionable recommendations."}

Provide:
1. Executive Summary
2. Statistical Highlights & Key Trends
3. Anomalies & Outlier Detection
4. Predictive Forecasts & Business Implications
5. Recommended Strategic Next Steps`;

    const { response } = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
      },
    });

    res.json({
      analysis: response.text,
      status: "success",
    });
  } catch (error: any) {
    console.error("JARVIS Data Analysis Error:", error);
    res.status(500).json({ error: error.message || "Data analysis failed" });
  }
});

// Workflow Automation Generator
app.post("/api/jarvis/generate-workflow", async (req, res) => {
  try {
    const { objective } = req.body;
    const ai = getGeminiClient();

    const { response } = await generateContentWithFallback(ai, {
      contents: `Deconstruct the following natural language objective into a structured automated workflow pipeline: "${objective}".
Break it into 4 to 7 concrete sequential execution steps, specifying the tool/module required (e.g., SmartHome, Diagnostics, Calendar, Email, DataAnalytics, SystemCheck), expected input, execution details, and success criteria.`,
      config: {
        systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            workflowTitle: { type: Type.STRING },
            summary: { type: Type.STRING },
            estimatedExecutionTime: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  module: { type: Type.STRING },
                  actionDescription: { type: Type.STRING },
                  params: { type: Type.STRING },
                  safetyCheck: { type: Type.STRING },
                },
                required: ["id", "stepNumber", "title", "module", "actionDescription"],
              },
            },
          },
          required: ["workflowTitle", "summary", "steps"],
        },
      },
    });

    res.json({
      workflow: JSON.parse(response.text || "{}"),
      status: "success",
    });
  } catch (error: any) {
    console.error("JARVIS Workflow Error:", error);
    res.status(500).json({ error: error.message || "Workflow generation failed" });
  }
});

// Text-to-Speech endpoint (Gemini TTS fallback)
app.post("/api/jarvis/tts", async (req, res) => {
  try {
    const { text, voiceName = "Fenrir" } = req.body;
    const ai = getGeminiClient();

    const cleanText = (text || "").slice(0, 500).replace(/[*_#`]/g, "");

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as any },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio, mimeType: "audio/pcm;rate=24000", status: "success" });
    } else {
      res.status(404).json({ error: "No audio generated" });
    }
  } catch (error: any) {
    console.error("JARVIS TTS Error:", error);
    res.status(500).json({ error: error.message || "TTS failed" });
  }
});

// Peak Performance Voice Turn endpoint (combines lightning reasoning + Gemini TTS)
app.post("/api/jarvis/voice-turn", async (req, res) => {
  try {
    const { transcript, voiceName = "Fenrir", contextExtra, image } = req.body;
    const ai = getGeminiClient();

    const parts: any[] = [];
    if (image) {
      parts.push({
        inlineData: {
          data: image.replace(/^data:[^;]+;base64,/, ""),
          mimeType: "image/jpeg",
        },
      });
    }
    parts.push({
      text: transcript || "Status report, JARVIS.",
    });

    const { response: genResponse } = await generateContentWithFallback(ai, {
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction:
          JARVIS_LIVE_VOICE_INSTRUCTION +
          (contextExtra ? `\n\nActive System State:\n${contextExtra}` : ""),
        temperature: 0.4,
        thinkingConfig: { thinkingBudget: 0 }, // instant zero-latency reasoning
      },
    });

    const replyText =
      genResponse.text?.trim() || "All systems online and operating at peak efficiency.";

    // Generate crisp Gemini TTS audio
    let audioData: string | null = null;
    try {
      const cleanSpokenText = replyText.replace(/[*_#`]/g, "").slice(0, 450);
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: cleanSpokenText }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: (voiceName || "Fenrir") as any },
            },
          },
        },
      });
      audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (ttsErr: any) {
      console.warn("TTS generation warning:", ttsErr.message);
    }

    res.json({
      text: replyText,
      audio: audioData,
      mimeType: audioData ? "audio/pcm;rate=24000" : undefined,
      status: "success",
    });
  } catch (error: any) {
    console.error("JARVIS Voice Turn Error:", error);
    res.status(500).json({ error: error.message || "Voice turn failed", status: "error" });
  }
});

// 3D Hologram: Idea to 3D Model Generation endpoint
app.post("/api/jarvis/generate-3d-model", async (req, res) => {
  const { ideaPrompt, category = "custom", colorScheme = "cyan" } = req.body;
  try {
    const ai = getGeminiClient();

    const systemPrompt = `You are JARVIS, master holographic architect and 3D spatial engineer.
Your task is to take a natural language concept, mechanical idea, or architectural description and generate a complete, intricately structured 3D holographic procedural model specification.

Return a JSON object conforming to this exact structure:
- name: (crisp, futuristic Stark Industries naming, e.g. "Mark VII Arc Reactor Matrix")
- description: (2 sentences technical summary with tactical specifications)
- category: ("reactor" | "architecture" | "cybernetics" | "astronomy" | "vehicle" | "device" | "custom")
- tags: Array of 3-5 keywords
- renderConfig:
  - colorScheme: "${colorScheme || "cyan"}" ("cyan" | "gold_crimson" | "matrix_emerald" | "amethyst" | "white_wire")
  - wireframe: boolean (usually false or true depending on style)
  - pointCloud: boolean
  - particleDensity: number (20 to 100)
  - rotationSpeed: number (0.005 to 0.03)
  - explodedFactor: number (0)
  - scanlines: boolean (true)
  - glowIntensity: number (1.0 to 2.5)
- geometryData:
  - type: "components"
  - components: Array of 5 to 16 distinct 3D parts.
    Each component MUST have:
    - id: unique string (e.g. "comp_core_1")
    - name: descriptive part name (e.g. "Plasma Containment Torus", "Sub-orbital Thruster Nozzle", "Ion Beam Reflector")
    - shape: one of "box" | "sphere" | "cylinder" | "cone" | "torus" | "ring" | "icosahedron" | "tetrahedron" | "dodecahedron" | "tube"
    - dimensions: Array of numbers matching the shape:
        * box: [width, height, depth] e.g. [2, 0.5, 2]
        * sphere: [radius, widthSegments, heightSegments] e.g. [1.5, 24, 24]
        * cylinder: [radiusTop, radiusBottom, height, radialSegments] e.g. [1, 1, 3, 24]
        * cone: [radius, height, radialSegments] e.g. [1.2, 2.5, 24]
        * torus: [radius, tubeRadius, radialSegments, tubularSegments] e.g. [2.2, 0.25, 16, 48]
        * ring: [innerRadius, outerRadius, thetaSegments] e.g. [1.8, 2.2, 32]
        * icosahedron: [radius, detail] e.g. [1.2, 1]
        * tetrahedron: [radius, detail] e.g. [1.0, 0]
        * dodecahedron: [radius, detail] e.g. [1.4, 0]
        * tube: [radius, length, radialSegments] e.g. [0.3, 4, 16]
    - position: [x, y, z] in standard space (center roughly at 0, 0, 0, typical bounds -5 to +5)
    - rotation: [rx, ry, rz] in radians
    - scale: [sx, sy, sz]
    - color: hex color string (e.g. "#22d3ee", "#38bdf8", "#f59e0b", "#ef4444", "#a855f7", "#10b981")
    - emissive: glowing hex color
    - opacity: number (0.3 to 0.95)
    - wireframe: boolean
    - animation: (optional) { type: "rotate" | "bob" | "pulse" | "orbit", speed: number, axis: [x,y,z] }
    - technicalNotes: short spec note (e.g. "Primary magnetic confinement field generator")
  - hotspots: Array of 3 to 5 interactive diagnostic points with:
    - id: string
    - title: component label
    - description: technical breakdown
    - position: [x, y, z] matching a key component
    - stat: operational readout (e.g. "98.4% Efficiency", "1.21 GW Output", "3200 K Peak")`;

    const { response } = await generateContentWithFallback(ai, {
      contents: `Idea / Concept to translate into 3D Hologram: "${ideaPrompt}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            renderConfig: {
              type: Type.OBJECT,
              properties: {
                colorScheme: { type: Type.STRING },
                wireframe: { type: Type.BOOLEAN },
                pointCloud: { type: Type.BOOLEAN },
                particleDensity: { type: Type.NUMBER },
                rotationSpeed: { type: Type.NUMBER },
                explodedFactor: { type: Type.NUMBER },
                scanlines: { type: Type.BOOLEAN },
                glowIntensity: { type: Type.NUMBER },
              },
              required: ["colorScheme", "wireframe", "rotationSpeed", "scanlines", "glowIntensity"],
            },
            geometryData: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                components: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      shape: { type: Type.STRING },
                      dimensions: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                      position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                      rotation: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                      scale: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                      color: { type: Type.STRING },
                      emissive: { type: Type.STRING },
                      opacity: { type: Type.NUMBER },
                      wireframe: { type: Type.BOOLEAN },
                      technicalNotes: { type: Type.STRING },
                    },
                    required: ["id", "name", "shape", "dimensions", "position", "rotation", "scale"],
                  },
                },
                hotspots: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                      stat: { type: Type.STRING },
                    },
                    required: ["id", "title", "description", "position"],
                  },
                },
              },
              required: ["type", "components"],
            },
          },
          required: ["name", "description", "renderConfig", "geometryData"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const modelId = "holo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);

    const completeHologram = {
      id: modelId,
      name: parsed.name || "Stark Holographic Prototype",
      description: parsed.description || "Synthesized 3D holographic projection matrix.",
      prompt: ideaPrompt,
      sourceType: "idea",
      createdAt: new Date().toISOString(),
      tags: parsed.tags || ["Hologram", "Stark Industries", "Prototype"],
      category: parsed.category || category || "custom",
      renderConfig: {
        colorScheme: parsed.renderConfig?.colorScheme || colorScheme || "cyan",
        wireframe: parsed.renderConfig?.wireframe ?? false,
        pointCloud: parsed.renderConfig?.pointCloud ?? false,
        particleDensity: parsed.renderConfig?.particleDensity ?? 50,
        rotationSpeed: parsed.renderConfig?.rotationSpeed ?? 0.015,
        explodedFactor: 0,
        scanlines: true,
        glowIntensity: parsed.renderConfig?.glowIntensity ?? 1.5,
      },
      geometryData: {
        type: "components",
        components: (parsed.geometryData?.components && parsed.geometryData.components.length > 0)
          ? parsed.geometryData.components
          : generateProceduralHologram(ideaPrompt, category, colorScheme).geometryData.components,
        hotspots: parsed.geometryData?.hotspots || [],
      },
    };

    res.json({
      model: completeHologram,
      status: "success",
    });
  } catch (error: any) {
    console.warn("JARVIS 3D Model API Notice, engaging Procedural Engine:", error?.message || error);
    // Engage procedural spatial generator fallback with 100% success rate
    const fallbackHologram = generateProceduralHologram(ideaPrompt || "Stark Holographic Unit", category, colorScheme);
    res.json({
      model: fallbackHologram,
      status: "success",
      source: "procedural_fallback",
    });
  }
});

// 3D Hologram: Image-to-3D Conversion & Deep Spatial Reconstruction
app.post("/api/jarvis/image-to-3d", async (req, res) => {
  const { image, prompt = "", colorScheme = "cyan" } = req.body;
  try {
    const ai = getGeminiClient();

    if (!image) {
      return res.status(400).json({ error: "Missing image buffer" });
    }

    const cleanBase64 = image.replace(/^data:[^;]+;base64,/, "");

    const imageAnalysisPrompt = `You are JARVIS Holographic Vision Core.
Analyze this uploaded 2D image and decompose its visual architecture into a sophisticated 3D holographic wireframe/mesh model specification.

Examine the shapes, objects, symmetry, perspective, depth layers, mechanical or organic structures in the image.
Deconstruct what is depicted into 6 to 18 volumetric 3D components (boxes, spheres, cylinders, toruses, rings, cones, polyhedra, tubes) placed accurately in 3D coordinate space [x, y, z] to represent the object as an authentic Stark Industries 3D hologram.

Additional user instruction / focus: ${prompt || "Full 3D object reconstruction from image"}`;

    const { response } = await generateContentWithFallback(ai, {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: "image/jpeg",
              },
            },
            {
              text: imageAnalysisPrompt,
            },
          ],
        },
      ],
      config: {
        systemInstruction: "You convert 2D visual inputs into structured 3D holographic geometry configurations. Return strictly valid JSON conforming to the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            detectedVisualElements: { type: Type.ARRAY, items: { type: Type.STRING } },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            renderConfig: {
              type: Type.OBJECT,
              properties: {
                colorScheme: { type: Type.STRING },
                wireframe: { type: Type.BOOLEAN },
                glowIntensity: { type: Type.NUMBER },
                rotationSpeed: { type: Type.NUMBER },
              },
              required: ["colorScheme", "wireframe", "glowIntensity"],
            },
            geometryData: {
              type: Type.OBJECT,
              properties: {
                components: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      shape: { type: Type.STRING },
                      dimensions: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                      position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                      rotation: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                      scale: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                      color: { type: Type.STRING },
                      emissive: { type: Type.STRING },
                      opacity: { type: Type.NUMBER },
                      wireframe: { type: Type.BOOLEAN },
                      technicalNotes: { type: Type.STRING },
                    },
                    required: ["id", "name", "shape", "dimensions", "position", "rotation", "scale"],
                  },
                },
                hotspots: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                      stat: { type: Type.STRING },
                    },
                    required: ["id", "title", "description", "position"],
                  },
                },
              },
              required: ["components"],
            },
          },
          required: ["name", "description", "geometryData"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const modelId = "holo_img_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);

    const completeHologram = {
      id: modelId,
      name: parsed.name || "Reconstructed Image Hologram",
      description: parsed.description || "Multimodal depth decomposition & 3D holographic projection.",
      prompt: prompt || "Reconstructed from uploaded image",
      sourceImage: image.length < 200000 ? image : undefined, // store image if within reasonable storage size
      sourceType: "image_ai",
      createdAt: new Date().toISOString(),
      tags: parsed.tags || ["Image Recon", "3D Hologram", "Spatial Mesh"],
      category: parsed.category || "custom",
      renderConfig: {
        colorScheme: parsed.renderConfig?.colorScheme || colorScheme || "cyan",
        wireframe: parsed.renderConfig?.wireframe ?? false,
        pointCloud: false,
        particleDensity: 60,
        rotationSpeed: parsed.renderConfig?.rotationSpeed ?? 0.012,
        explodedFactor: 0,
        scanlines: true,
        glowIntensity: parsed.renderConfig?.glowIntensity ?? 1.6,
      },
      geometryData: {
        type: "components",
        components: (parsed.geometryData?.components && parsed.geometryData.components.length > 0)
          ? parsed.geometryData.components
          : generateProceduralHologram(prompt || "Image Mesh", "device", colorScheme).geometryData.components,
        hotspots: parsed.geometryData?.hotspots || [],
      },
    };

    res.json({
      model: completeHologram,
      detectedElements: parsed.detectedVisualElements || [],
      status: "success",
    });
  } catch (error: any) {
    console.warn("JARVIS Image-to-3D Reconstruction Notice, engaging Procedural Engine:", error?.message || error);
    const fallbackHologram = generateProceduralHologram(prompt || "Reconstructed Visual Hologram", "device", colorScheme);
    res.json({
      model: fallbackHologram,
      detectedElements: ["Visual Geometry", "Spatial Depth", "Holographic Plane"],
      status: "success",
      source: "procedural_fallback",
    });
  }
});

async function startServer() {
  const server = http.createServer(app);

  // Gemini Live WebSocket Server (/live)
  const wss = new WebSocketServer({ server, path: "/live" });

  wss.on("connection", async (clientWs: WebSocket) => {
    let session: any = null;
    let isClosed = false;

    console.log("Client connected to JARVIS Live Voice Stream.");

    try {
      const ai = getGeminiClient();

      session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Fenrir" as any },
            },
          },
          systemInstruction: JARVIS_LIVE_VOICE_INSTRUCTION,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: any) => {
            if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

            // Audio chunk from model
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ type: "audio", audio }));
            }

            // Model output transcript
            const outText =
              message.serverContent?.outputTranscription?.text ||
              message.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;
            if (outText) {
              clientWs.send(JSON.stringify({ type: "outputTranscription", text: outText }));
            }

            // User input transcript
            const inText = message.serverContent?.inputTranscription?.text;
            if (inText) {
              clientWs.send(JSON.stringify({ type: "inputTranscription", text: inText }));
            }

            // Model interrupted by user speech
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }

            // Turn finished
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: "turnComplete" }));
            }
          },
          onerror: (err: any) => {
            console.error("Gemini Live Stream Callback Error:", err);
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({ type: "error", error: err.message || "Live stream error" })
              );
            }
          },
          onclose: () => {
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "closed" }));
            }
          },
        },
      });

      clientWs.send(
        JSON.stringify({ type: "session_ready", message: "Gemini Live Stream Connected" })
      );

      clientWs.on("message", (raw) => {
        if (!session) return;
        try {
          const payload = JSON.parse(raw.toString());

          // Spoken audio input from mic (16kHz PCM)
          if (payload.type === "audio" && payload.audio) {
            session.sendRealtimeInput({
              audio: { data: payload.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
          // Vision frame (camera snapshot or screen capture)
          else if (payload.type === "video" && payload.image) {
            session.sendRealtimeInput({
              video: {
                data: payload.image.replace(/^data:[^;]+;base64,/, ""),
                mimeType: payload.mimeType || "image/jpeg",
              },
            });
          }
          // Spoken command or text input
          else if (payload.type === "text" && payload.text) {
            session.sendRealtimeInput({
              text: payload.text,
            });
          }
        } catch (e: any) {
          console.error("Error processing client live input:", e);
        }
      });

      clientWs.on("close", () => {
        isClosed = true;
        try {
          if (session) {
            session.close();
          }
        } catch (e) {}
        console.log("Client disconnected from Live Stream.");
      });
    } catch (err: any) {
      console.error("Failed to connect Gemini Live session:", err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            error: `Live connection notice: ${err.message || "Streaming initialization in progress"}. High-speed fallback engaged.`,
          })
        );
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`JARVIS AI Server with Gemini Live streaming online on http://localhost:${PORT}`);
  });
}

startServer();

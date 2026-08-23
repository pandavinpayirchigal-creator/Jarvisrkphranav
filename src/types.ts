export interface MessageAttachment {
  id: string;
  name: string;
  type: "image" | "document" | "code" | "screen" | "audio";
  mimeType: string;
  data: string; // base64 or text preview
  size?: number;
}

export type MessageReaction = "like" | "dislike" | "heart";

export type LiveVoicePersona = "Fenrir" | "Zephyr" | "Puck" | "Kore" | "Charon";

export type JarvisCompanionMode = "friend" | "professional" | "tactical";

export type LiveStreamMode = "live_ws" | "fast_turn";

export type HandGestureType = "none" | "open_palm" | "fist" | "thumbs_up" | "victory" | "wave";

export interface HandGestureDetectionResult {
  gesture: HandGestureType;
  label: string;
  confidence: number; // 0 to 1
  action: "pause" | "resume" | "none";
  actionDescription: string;
  box?: { x: number; y: number; width: number; height: number };
  centroid?: { x: number; y: number };
  motionLevel?: number;
  timestamp: number;
}

export interface GestureControlState {
  isEnabled: boolean;
  isCameraActive: boolean;
  sensitivity: "high" | "medium" | "low";
  lastGesture: HandGestureType;
  lastAction: "pause" | "resume" | "none";
  lastActionTime: number;
  confidence: number;
  isPausedByGesture: boolean;
}

export interface SpokenTranscriptEntry {
  id: string;
  speaker: "user" | "jarvis";
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  audioPeak?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  text: string;
  timestamp: string;
  attachments?: MessageAttachment[];
  groundingChunks?: Array<{
    web?: {
      uri: string;
      title: string;
    };
  }>;
  reasoningSteps?: string[];
  toolExecuted?: {
    toolName: string;
    action: string;
    resultSummary: string;
  };
  audioUrl?: string;
  isStreaming?: boolean;
  reaction?: MessageReaction;
  reactions?: {
    like?: boolean;
    dislike?: boolean;
    heart?: boolean;
  };
}

export interface SmartDevice {
  id: string;
  name: string;
  category: "lighting" | "climate" | "security" | "power" | "media" | "sensors";
  status: boolean;
  value?: number | string;
  unit?: string;
  room: string;
  iconName: string;
  lastUpdated: string;
  details?: string;
}

export interface SystemTelemetry {
  cpuUsage: number;
  memoryUsage: number;
  neuralLatency: number;
  powerDrawKw: number;
  arcReactorEfficiency: number;
  thermalStatus: "optimal" | "nominal" | "elevated" | "critical";
  subsystems: {
    name: string;
    status: "online" | "standby" | "warning" | "offline";
    uptime: string;
    healthScore: number;
  }[];
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DIAGNOSTIC";
  module: string;
  message: string;
}

export interface MemoryItem {
  id: string;
  category: "preference" | "project" | "decision" | "fact" | "note";
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  title: string;
  module: string;
  actionDescription: string;
  params?: string;
  safetyCheck?: string;
  status?: "pending" | "running" | "completed" | "failed";
}

export interface WorkflowPipeline {
  id: string;
  workflowTitle: string;
  summary: string;
  estimatedExecutionTime: string;
  status: "idle" | "in_progress" | "completed" | "paused";
  steps: WorkflowStep[];
  createdAt: string;
}

export interface DataPoint {
  [key: string]: any;
}

export interface DataSetSample {
  id: string;
  name: string;
  description: string;
  data: DataPoint[];
  xAxisKey: string;
  metrics: { key: string; name: string; color: string }[];
}

export type NeuralPowerMode = "turbo" | "balanced" | "deep";

export type BackgroundThemeId =
  | "stark_mark85_armor"
  | "orbital_telemetry_hud"
  | "iris_singularity_core"
  | "cyan_grid"
  | "matrix_rain"
  | "deep_space"
  | "arc_amber"
  | "crimson_mark7"
  | "stealth_carbon"
  | "tactical_slate"
  | "custom_url"
  | "custom_upload";

export interface BackgroundSettings {
  themeId: BackgroundThemeId;
  customUrl?: string;
  customUploadData?: string;
  opacity: number; // 0.1 to 1.0
  blur: number; // 0 to 20px
  darkOverlay: number; // 0 to 0.9
  showGridOverlay: boolean;
  showParticles: boolean;
}

export interface HologramComponent {
  id: string;
  name: string;
  shape:
    | "box"
    | "sphere"
    | "cylinder"
    | "cone"
    | "torus"
    | "ring"
    | "icosahedron"
    | "tetrahedron"
    | "dodecahedron"
    | "particles"
    | "tube";
  dimensions: number[]; // e.g. [w, h, d] or [radius, height, radialSegments]
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color?: string;
  emissive?: string;
  opacity?: number;
  wireframe?: boolean;
  animation?: {
    type: "rotate" | "bob" | "pulse" | "orbit";
    speed: number;
    axis?: [number, number, number];
  };
  technicalNotes?: string;
}

export interface HologramHotspot {
  id: string;
  title: string;
  description: string;
  position: [number, number, number];
  stat?: string;
}

export interface HologramRenderConfig {
  colorScheme: "cyan" | "gold_crimson" | "matrix_emerald" | "amethyst" | "white_wire";
  wireframe: boolean;
  pointCloud: boolean;
  particleDensity: number;
  rotationSpeed: number;
  explodedFactor: number;
  scanlines: boolean;
  glowIntensity: number;
}

export interface HologramModel {
  id: string;
  name: string;
  description: string;
  prompt?: string;
  sourceImage?: string;
  sourceType: "idea" | "image_depth" | "image_ai" | "procedural";
  createdAt: string;
  tags: string[];
  category: "reactor" | "architecture" | "cybernetics" | "astronomy" | "satellite" | "vehicle" | "device" | "custom";
  renderConfig: HologramRenderConfig;
  geometryData: {
    type: "components" | "heightmap_pointcloud" | "mesh_buffer";
    components?: HologramComponent[];
    heightmapData?: {
      width: number;
      height: number;
      depthPoints: Array<[number, number, number, string]>; // [x, y, z, colorHex]
      triangles?: number[];
    };
    meshBuffer?: {
      vertices: number[];
      indices?: number[];
      normals?: number[];
      colors?: number[];
    };
    hotspots?: HologramHotspot[];
  };
}

export interface FeatureFlags {
  enableGeminiLive: boolean;
  enableSmartHome: boolean;
  enableDiagnostics: boolean;
  enableAnalytics: boolean;
  enableMemory: boolean;
  enableWorkflows: boolean;
  enableHolograms: boolean;
  enableOscilloscope: boolean;
  enableArcReactor: boolean;
  enableVisionTools: boolean;
  enableSoundFX: boolean;
}

export interface AppSettings {
  background: BackgroundSettings;
  features: FeatureFlags;
}

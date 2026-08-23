import { HologramModel, HologramRenderConfig } from "../types";

const HOLOGRAM_STORAGE_KEY = "jarvis_hologram_models_v1";

// Pre-seeded Stark Industries Holographic Archive
export const DEFAULT_HOLOGRAM_MODELS: HologramModel[] = [
  {
    id: "holo_iron_man_helmet_mk85",
    name: "Iron Man Mark 85 Nanotech Helmet",
    description:
      "Full holographic Stark combat helmet featuring articulated gold-titanium faceplate, glowing unibeam photon eye slits, crimson cranium dome, and tactical HUD targeting reticle.",
    category: "cybernetics",
    prompt: "Iron Man Mark 85 nanotech helmet with glowing cyan eyes, gold faceplate, and crimson titanium cranium",
    sourceType: "procedural",
    createdAt: "2026-08-22T08:00:00.000Z",
    tags: ["Iron Man", "Mark 85", "Helmet", "Face Mask", "Stark Tech", "AR Wearable"],
    renderConfig: {
      colorScheme: "gold_crimson",
      wireframe: false,
      pointCloud: false,
      particleDensity: 80,
      rotationSpeed: 0.012,
      explodedFactor: 0,
      scanlines: true,
      glowIntensity: 2.2,
    },
    geometryData: {
      type: "components",
      components: [
        {
          id: "cranium_dome",
          name: "Crimson Cranium Dome",
          shape: "sphere",
          dimensions: [1.35, 24, 24],
          position: [0, 0.35, -0.1],
          rotation: [0, 0, 0],
          scale: [1.02, 1.25, 1.15],
          color: "#dc2626",
          emissive: "#991b1b",
          opacity: 0.9,
          wireframe: false,
          technicalNotes: "Grade 5 titanium-vibranium reinforced cranium shell",
        },
        {
          id: "faceplate_gold",
          name: "Gold-Titanium Face Shield",
          shape: "box",
          dimensions: [1.35, 1.45, 0.45],
          position: [0, 0.05, 0.72],
          rotation: [0.08, 0, 0],
          scale: [0.95, 1.0, 1.0],
          color: "#f59e0b",
          emissive: "#d97706",
          opacity: 0.95,
          wireframe: false,
          technicalNotes: "Electrophoretic gold alloy ballistic visor",
        },
        {
          id: "forehead_crest",
          name: "Mark 85 Forehead Crest",
          shape: "cone",
          dimensions: [0.9, 0.5, 3],
          position: [0, 0.95, 0.65],
          rotation: [0.35, 0, 0],
          scale: [1.1, 1.0, 0.6],
          color: "#dc2626",
          emissive: "#b91c1c",
          opacity: 0.95,
          wireframe: false,
        },
        {
          id: "eye_slit_left",
          name: "Port Photonic Eye Slit",
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
          technicalNotes: "High-frequency tactical LiDAR optical transceiver",
        },
        {
          id: "eye_slit_right",
          name: "Starboard Photonic Eye Slit",
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
          technicalNotes: "High-frequency tactical LiDAR optical transceiver",
        },
        {
          id: "jaw_guard",
          name: "Articulated Jaw & Chin Guard",
          shape: "box",
          dimensions: [0.9, 0.65, 0.55],
          position: [0, -0.75, 0.55],
          rotation: [-0.15, 0, 0],
          scale: [1, 1, 1],
          color: "#b91c1c",
          emissive: "#7f1d1d",
          opacity: 0.95,
          wireframe: false,
          technicalNotes: "Atmospheric filtration and acoustic intake grill",
        },
        {
          id: "cheek_plate_left",
          name: "Port Cheek Armor",
          shape: "box",
          dimensions: [0.35, 0.7, 0.45],
          position: [-0.75, -0.15, 0.48],
          rotation: [0, 0.3, -0.1],
          scale: [1, 1, 1],
          color: "#f59e0b",
          emissive: "#b45309",
          opacity: 0.9,
          wireframe: false,
        },
        {
          id: "cheek_plate_right",
          name: "Starboard Cheek Armor",
          shape: "box",
          dimensions: [0.35, 0.7, 0.45],
          position: [0.75, -0.15, 0.48],
          rotation: [0, -0.3, 0.1],
          scale: [1, 1, 1],
          color: "#f59e0b",
          emissive: "#b45309",
          opacity: 0.9,
          wireframe: false,
        },
        {
          id: "ear_pod_left",
          name: "Port Comms & Sensor Pod",
          shape: "cylinder",
          dimensions: [0.3, 0.3, 0.35, 24],
          position: [-1.2, 0.1, 0.0],
          rotation: [0, 0, Math.PI / 2],
          scale: [1, 1, 1],
          color: "#78716c",
          emissive: "#dc2626",
          opacity: 0.9,
          wireframe: true,
        },
        {
          id: "ear_pod_right",
          name: "Starboard Comms & Sensor Pod",
          shape: "cylinder",
          dimensions: [0.3, 0.3, 0.35, 24],
          position: [1.2, 0.1, 0.0],
          rotation: [0, 0, Math.PI / 2],
          scale: [1, 1, 1],
          color: "#78716c",
          emissive: "#dc2626",
          opacity: 0.9,
          wireframe: true,
        },
        {
          id: "hud_reticle",
          name: "Orbital Tactical HUD Reticle",
          shape: "ring",
          dimensions: [1.4, 1.45, 32],
          position: [0, 0.2, 1.25],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#38bdf8",
          emissive: "#0284c7",
          opacity: 0.8,
          wireframe: true,
          animation: { type: "rotate", speed: 0.02, axis: [0, 0, 1] },
        },
      ],
      hotspots: [
        {
          id: "h_eyes",
          title: "Photonic Optics",
          description: "Multi-spectrum targeting array with 240 fps night vision",
          position: [0, 0.22, 1.0],
          stat: "99.8% Clarity",
        },
        {
          id: "h_hud",
          title: "Stark Tactical HUD",
          description: "Real-time threat assessment and biometric tracking matrix",
          position: [0, 0.6, 0.8],
          stat: "Active 60 FPS",
        },
        {
          id: "h_seal",
          title: "Nanotech Seal",
          description: "Hermetic seal rated for orbital vacuum and deep sea dive",
          position: [0, -0.75, 0.6],
          stat: "100% Pressurized",
        },
      ],
    },
  },
  {
    id: "holo_arc_reactor_prime",
    name: "Mark L Arc Reactor Core",
    description:
      "Palladium-free unibeam core featuring dual counter-rotating magnetic containment rings, micro-thruster conduits, and tri-phase quantum confinement.",
    category: "reactor",
    prompt: "Iron Man Arc Reactor with counter-rotating magnetic rings and glowing plasma unibeam core",
    sourceType: "procedural",
    createdAt: "2026-08-20T10:00:00.000Z",
    tags: ["Arc Reactor", "Mark 50", "Stark Tech", "Clean Energy"],
    renderConfig: {
      colorScheme: "cyan",
      wireframe: false,
      pointCloud: false,
      particleDensity: 70,
      rotationSpeed: 0.015,
      explodedFactor: 0,
      scanlines: true,
      glowIntensity: 1.8,
    },
    geometryData: {
      type: "components",
      components: [
        {
          id: "core_housing",
          name: "Titanium Chassis Ring",
          shape: "torus",
          dimensions: [2.5, 0.25, 16, 64],
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#06b6d4",
          emissive: "#0891b2",
          opacity: 0.85,
          wireframe: true,
          technicalNotes: "Grade 5 titanium reinforced perimeter",
        },
        {
          id: "inner_ring",
          name: "Magnetic Confinement Ring",
          shape: "torus",
          dimensions: [1.6, 0.15, 16, 48],
          position: [0, 0, 0.1],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#38bdf8",
          emissive: "#0284c7",
          opacity: 0.9,
          wireframe: false,
          animation: { type: "rotate", speed: 0.03, axis: [0, 0, 1] },
          technicalNotes: "Superconducting coil stabilizer",
        },
        {
          id: "plasma_core",
          name: "Unibeam Plasma Emitter",
          shape: "cylinder",
          dimensions: [0.8, 0.8, 0.6, 32],
          position: [0, 0, 0],
          rotation: [Math.PI / 2, 0, 0],
          scale: [1, 1, 1],
          color: "#a5f3fc",
          emissive: "#22d3ee",
          opacity: 0.95,
          wireframe: false,
          animation: { type: "pulse", speed: 0.05 },
          technicalNotes: "Deuterium-tritium high-flux focal lens",
        },
        {
          id: "flux_coils_1",
          name: "Phase Accelerator Ring",
          shape: "torus",
          dimensions: [1.1, 0.08, 12, 32],
          position: [0, 0, -0.2],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#06b6d4",
          emissive: "#00f0ff",
          opacity: 0.75,
          wireframe: true,
          animation: { type: "rotate", speed: -0.04, axis: [0, 0, 1] },
        },
        {
          id: "backplate",
          name: "Thermal Dissipation Radiator",
          shape: "cylinder",
          dimensions: [2.6, 2.6, 0.15, 32],
          position: [0, 0, -0.35],
          rotation: [Math.PI / 2, 0, 0],
          scale: [1, 1, 1],
          color: "#1e293b",
          emissive: "#0f172a",
          opacity: 0.6,
          wireframe: true,
        },
        {
          id: "energy_spokes",
          name: "Hexagonal Emitter Array",
          shape: "ring",
          dimensions: [0.9, 1.4, 6],
          position: [0, 0, 0.25],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#67e8f9",
          emissive: "#22d3ee",
          opacity: 0.9,
          wireframe: true,
          animation: { type: "rotate", speed: 0.02, axis: [0, 0, 1] },
        },
      ],
      hotspots: [
        {
          id: "h_plasma",
          title: "Plasma Node",
          description: "Sustained fusion vortex at 1.42 x 10^7 K",
          position: [0, 0, 0.3],
          stat: "12.4 GW Output",
        },
        {
          id: "h_ring",
          title: "Mag-Containment",
          description: "32-Tesla superconducting toroid field",
          position: [1.6, 0, 0.1],
          stat: "99.8% Stability",
        },
        {
          id: "h_cooling",
          title: "Cryo-Jacket",
          description: "Sub-zero liquid nitrogen thermal buffer",
          position: [-2.2, 0, -0.3],
          stat: "310 K Operating",
        },
      ],
    },
  },
  {
    id: "holo_orbital_satellite",
    name: "Verónica Orbital Relay Matrix",
    description:
      "Low-Earth orbit defense transceiver equipped with phased-array LiDAR sensors, deployable photovoltaic sails, and quantum mesh uplink.",
    category: "satellite",
    prompt: "Stark Orbital Defense Satellite with solar arrays, central scanner array, and ion propulsion nozzle",
    sourceType: "procedural",
    createdAt: "2026-08-21T14:30:00.000Z",
    tags: ["Satellite", "Orbital", "Defense", "Communications"],
    renderConfig: {
      colorScheme: "gold_crimson",
      wireframe: false,
      pointCloud: false,
      particleDensity: 60,
      rotationSpeed: 0.01,
      explodedFactor: 0,
      scanlines: true,
      glowIntensity: 1.6,
    },
    geometryData: {
      type: "components",
      components: [
        {
          id: "sat_body",
          name: "Avionics Core Module",
          shape: "box",
          dimensions: [1.6, 2.4, 1.6],
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#dc2626",
          emissive: "#b91c1c",
          opacity: 0.85,
          wireframe: false,
        },
        {
          id: "solar_wing_left",
          name: "Port Photovoltaic Array",
          shape: "box",
          dimensions: [3.2, 0.08, 1.4],
          position: [-2.6, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#f59e0b",
          emissive: "#d97706",
          opacity: 0.8,
          wireframe: true,
        },
        {
          id: "solar_wing_right",
          name: "Starboard Photovoltaic Array",
          shape: "box",
          dimensions: [3.2, 0.08, 1.4],
          position: [2.6, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#f59e0b",
          emissive: "#d97706",
          opacity: 0.8,
          wireframe: true,
        },
        {
          id: "sat_dish",
          name: "High-Gain Parabolic Dish",
          shape: "cone",
          dimensions: [1.2, 0.8, 24],
          position: [0, 1.7, 0],
          rotation: [Math.PI, 0, 0],
          scale: [1, 1, 1],
          color: "#fbbf24",
          emissive: "#f59e0b",
          opacity: 0.9,
          wireframe: true,
        },
        {
          id: "thruster",
          name: "Ion Propulsion Thruster",
          shape: "cylinder",
          dimensions: [0.6, 0.8, 1.0, 24],
          position: [0, -1.6, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#38bdf8",
          emissive: "#0284c7",
          opacity: 0.9,
          wireframe: false,
        },
      ],
      hotspots: [
        {
          id: "h_dish",
          title: "Quantum Transceiver",
          description: "Gigabit multi-band laser comm link",
          position: [0, 2.1, 0],
          stat: "100 Gbps Link",
        },
        {
          id: "h_ion",
          title: "Xenon Ion Engine",
          description: "High specific impulse orbital stationkeeping",
          position: [0, -2.1, 0],
          stat: "4200s Isp",
        },
      ],
    },
  },
  {
    id: "holo_quantum_tesseract",
    name: "Quantum Hypercube (Tesseract)",
    description:
      "Four-dimensional geometric projection in 3D Euclidean space. Visualizes nested hyper-spatial coordinate vertices and rotating quantum probability matrices.",
    category: "cybernetics",
    prompt: "4D Quantum Tesseract Hypercube with nested rotating inner cube and energy grid nodes",
    sourceType: "procedural",
    createdAt: "2026-08-21T18:00:00.000Z",
    tags: ["Quantum", "4D Tesseract", "Hypercube", "Theoretical Physics"],
    renderConfig: {
      colorScheme: "amethyst",
      wireframe: true,
      pointCloud: false,
      particleDensity: 80,
      rotationSpeed: 0.02,
      explodedFactor: 0,
      scanlines: true,
      glowIntensity: 2.0,
    },
    geometryData: {
      type: "components",
      components: [
        {
          id: "outer_cube",
          name: "Outer 4D Boundary Cell",
          shape: "box",
          dimensions: [3.2, 3.2, 3.2],
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#c084fc",
          emissive: "#9333ea",
          opacity: 0.7,
          wireframe: true,
        },
        {
          id: "inner_cube",
          name: "Inner Singular Hyper-Cell",
          shape: "box",
          dimensions: [1.6, 1.6, 1.6],
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#e879f9",
          emissive: "#c026d3",
          opacity: 0.85,
          wireframe: true,
          animation: { type: "rotate", speed: -0.04, axis: [1, 1, 0] },
        },
        {
          id: "core_singularity",
          name: "Zero-Point Singularity",
          shape: "icosahedron",
          dimensions: [0.7, 1],
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#f472b6",
          emissive: "#db2777",
          opacity: 0.95,
          wireframe: false,
          animation: { type: "pulse", speed: 0.08 },
        },
        {
          id: "orbital_torus",
          name: "Time-Dilation Ring",
          shape: "torus",
          dimensions: [2.4, 0.08, 16, 48],
          position: [0, 0, 0],
          rotation: [Math.PI / 4, 0, 0],
          scale: [1, 1, 1],
          color: "#818cf8",
          emissive: "#4f46e5",
          opacity: 0.7,
          wireframe: true,
          animation: { type: "rotate", speed: 0.03, axis: [0, 1, 0] },
        },
      ],
      hotspots: [
        {
          id: "h_singularity",
          title: "Zero-Point Flux",
          description: "Dimensional bridge at Planck length density",
          position: [0, 0, 0.8],
          stat: "1.0 Planck Unit",
        },
        {
          id: "h_vertices",
          title: "16-Cell Vertex Mesh",
          description: "Continuous isometric hyper-rotation",
          position: [1.6, 1.6, 1.6],
          stat: "4D Symmetry",
        },
      ],
    },
  },
];

export class HologramStorageService {
  public static getStoredModels(): HologramModel[] {
    try {
      const raw = localStorage.getItem(HOLOGRAM_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load holograms from storage:", e);
    }
    // Seed default models
    this.saveModels(DEFAULT_HOLOGRAM_MODELS);
    return DEFAULT_HOLOGRAM_MODELS;
  }

  public static saveModels(models: HologramModel[]): void {
    try {
      localStorage.setItem(HOLOGRAM_STORAGE_KEY, JSON.stringify(models));
    } catch (e) {
      console.error("Failed to save holograms:", e);
    }
  }

  public static addModel(model: HologramModel): HologramModel[] {
    const list = this.getStoredModels();
    const updated = [model, ...list.filter((m) => m.id !== model.id)];
    this.saveModels(updated);
    return updated;
  }

  public static updateModel(model: HologramModel): HologramModel[] {
    const list = this.getStoredModels();
    const index = list.findIndex((m) => m.id === model.id);
    let updated: HologramModel[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = model;
    } else {
      updated = [model, ...list];
    }
    this.saveModels(updated);
    return updated;
  }

  public static deleteModel(id: string): HologramModel[] {
    const list = this.getStoredModels();
    const updated = list.filter((m) => m.id !== id);
    this.saveModels(updated);
    return updated;
  }

  /**
   * Fast client-side image-to-pointcloud & heightmap converter
   * Reads pixel luminance and rgb values to construct a real volumetric 3D hologram matrix
   */
  public static async processImageToDepthPoints(
    imageSrc: string,
    density: number = 64
  ): Promise<{
    depthPoints: Array<[number, number, number, string]>;
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return reject(new Error("Canvas context unavailable"));
          }

          // Sample down to manageable matrix (e.g. 64x64 or 48x48)
          const targetW = density;
          const targetH = Math.round((img.height / img.width) * density);
          canvas.width = targetW;
          canvas.height = targetH;

          ctx.drawImage(img, 0, 0, targetW, targetH);
          const imgData = ctx.getImageData(0, 0, targetW, targetH);
          const data = imgData.data;

          const depthPoints: Array<[number, number, number, string]> = [];
          const scaleX = 4 / targetW;
          const scaleY = (4 * (targetH / targetW)) / targetH;

          for (let y = 0; y < targetH; y++) {
            for (let x = 0; x < targetW; x++) {
              const idx = (y * targetW + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const a = data[idx + 3];

              if (a < 30) continue; // skip transparent pixels

              // Calculate luminance for Z depth heightmap
              const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              const posX = (x - targetW / 2) * scaleX;
              const posY = -(y - targetH / 2) * scaleY;
              const posZ = (lum - 0.5) * 1.6; // depth amplitude

              // Hex color
              const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
              depthPoints.push([posX, posY, posZ, hex]);
            }
          }

          resolve({ depthPoints, width: targetW, height: targetH });
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (e) => reject(new Error("Failed to load image for 3D depth analysis"));
      img.src = imageSrc;
    });
  }

  /**
   * Export Hologram as standard OBJ format string for 3D printing & CAD
   */
  public static exportToOBJ(model: HologramModel): string {
    let obj = `# JARVIS Holographic Archive Export\n`;
    obj += `# Model: ${model.name}\n`;
    obj += `# Created: ${model.createdAt}\n\n`;

    let vertexOffset = 1;

    if (model.geometryData.components) {
      model.geometryData.components.forEach((comp, idx) => {
        obj += `o ${comp.name.replace(/\s+/g, "_")}_${idx}\n`;
        const [px, py, pz] = comp.position;
        const [w, h, d] = comp.dimensions;

        // Simple bounding box representation vertices
        const hw = (w || 1) / 2;
        const hh = (h || 1) / 2;
        const hd = (d || 1) / 2;

        const verts = [
          [px - hw, py - hh, pz - hd],
          [px + hw, py - hh, pz - hd],
          [px + hw, py + hh, pz - hd],
          [px - hw, py + hh, pz - hd],
          [px - hw, py - hh, pz + hd],
          [px + hw, py - hh, pz + hd],
          [px + hw, py + hh, pz + hd],
          [px - hw, py + hh, pz + hd],
        ];

        verts.forEach(([x, y, z]) => {
          obj += `v ${x.toFixed(4)} ${y.toFixed(4)} ${z.toFixed(4)}\n`;
        });

        const faces = [
          [1, 2, 3, 4],
          [5, 8, 7, 6],
          [1, 5, 6, 2],
          [2, 6, 7, 3],
          [3, 7, 8, 4],
          [5, 1, 4, 8],
        ];

        faces.forEach(([f1, f2, f3, f4]) => {
          obj += `f ${f1 + vertexOffset - 1} ${f2 + vertexOffset - 1} ${f3 + vertexOffset - 1} ${f4 + vertexOffset - 1}\n`;
        });

        vertexOffset += 8;
        obj += `\n`;
      });
    }

    return obj;
  }
}

import React, { useState } from "react";
import { WorkflowPipeline, WorkflowStep } from "../types";
import {
  GitCommit,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { jarvisSound } from "../services/soundEffects";

interface WorkflowAutomationProps {
  onGenerateWorkflow: (objective: string) => Promise<any>;
  onExecuteWorkflowStep: (step: WorkflowStep) => Promise<boolean>;
}

const PRESET_WORKFLOW_TEMPLATES = [
  "Organize tomorrow's executive product review meeting with agenda and participants.",
  "Run security audit on all smart doors and dim exterior lighting to 30%.",
  "Extract sales anomalies from database and compile diagnostic report.",
  "Prepare morning briefing including system diagnostics, calendar, and email priority.",
];

export const WorkflowAutomation: React.FC<WorkflowAutomationProps> = ({
  onGenerateWorkflow,
  onExecuteWorkflowStep,
}) => {
  const [objectiveInput, setObjectiveInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipeline, setPipeline] = useState<WorkflowPipeline | null>({
    id: "wf-sample-1",
    workflowTitle: "Autonomous Executive Briefing & Security Handshake",
    summary:
      "Inspects peripheral security devices, queries server telemetry, compiles priority meeting agendas, and establishes operational readiness.",
    estimatedExecutionTime: "12 seconds",
    status: "idle",
    createdAt: new Date().toLocaleTimeString(),
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Perimeter Security & Smart Lock Verification",
        module: "SmartHome",
        actionDescription: "Query status of front lock, lab vault lock, and exterior illumination array.",
        status: "completed",
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Core Telemetry & Thermal Equilibrium Diagnostic",
        module: "Diagnostics",
        actionDescription: "Measure Arc Reactor flux output, neural latency, and CPU quantum load.",
        status: "completed",
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "Meeting Schedule & Priority Participant Sync",
        module: "Calendar",
        actionDescription: "Check calendar for conflicts, compile briefing notes for RK Phranav.",
        status: "pending",
      },
      {
        id: "step-4",
        stepNumber: 4,
        title: "Audio Dispatch & Operational Green Signal",
        module: "AudioSynth",
        actionDescription: "Synthesize vocal confirmation of readiness and present active dashboard.",
        status: "pending",
      },
    ],
  });

  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  const handleGenerate = async (queryText?: string) => {
    const prompt = queryText || objectiveInput;
    if (!prompt.trim()) return;

    jarvisSound.playActivationChime();
    setIsGenerating(true);
    try {
      const generated = await onGenerateWorkflow(prompt);
      if (generated && generated.steps) {
        setPipeline({
          id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          workflowTitle: generated.workflowTitle || "Autonomous Workflow Pipeline",
          summary: generated.summary || prompt,
          estimatedExecutionTime: generated.estimatedExecutionTime || "15 seconds",
          status: "idle",
          createdAt: new Date().toLocaleTimeString(),
          steps: generated.steps.map((s: any) => ({
            ...s,
            status: "pending",
          })),
        });
        jarvisSound.playSuccess();
      }
    } catch (e) {
      jarvisSound.playAlert();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunAll = async () => {
    if (!pipeline) return;
    jarvisSound.playExecute();
    setPipeline((prev) => (prev ? { ...prev, status: "in_progress" } : null));

    const updatedSteps = [...pipeline.steps];

    for (let i = 0; i < updatedSteps.length; i++) {
      setActiveStepIndex(i);
      updatedSteps[i].status = "running";
      setPipeline((prev) => (prev ? { ...prev, steps: [...updatedSteps] } : null));

      // Simulate or execute step
      await new Promise((r) => setTimeout(r, 1400));
      jarvisSound.playBlip();

      try {
        await onExecuteWorkflowStep(updatedSteps[i]);
        updatedSteps[i].status = "completed";
      } catch (e) {
        updatedSteps[i].status = "failed";
      }

      setPipeline((prev) => (prev ? { ...prev, steps: [...updatedSteps] } : null));
    }

    setActiveStepIndex(null);
    setPipeline((prev) => (prev ? { ...prev, status: "completed" } : null));
    jarvisSound.playSuccess();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/70 border border-cyan-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider font-mono">
              AUTONOMOUS WORKFLOW & TASK EXECUTION ENGINE
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Converts high-level natural language instructions into sequenced, tool-integrated autonomous pipelines.
          </p>
        </div>

        {pipeline && (
          <button
            id="run-all-workflow-btn"
            onClick={handleRunAll}
            disabled={pipeline.status === "in_progress"}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-mono font-semibold flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer self-start md:self-auto"
          >
            {pipeline.status === "in_progress" ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                PIPELINE EXECUTING...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                EXECUTE ENTIRE PIPELINE
              </>
            )}
          </button>
        )}
      </div>

      {/* Goal Input & Template Presets */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs">
        <label className="block text-slate-300 font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          DECOMPOSE NEW OPERATIONAL GOAL INTO PIPELINE
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Check system health, audit smart locks, and email briefing to team..."
            value={objectiveInput ?? ""}
            onChange={(e) => setObjectiveInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGenerate();
            }}
          />
          <button
            id="generate-pipeline-btn"
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 font-semibold flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            DECONSTRUCT
          </button>
        </div>

        {/* Preset prompts */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-500">Quick Templates:</span>
          {PRESET_WORKFLOW_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              onClick={() => {
                setObjectiveInput(tmpl);
                handleGenerate(tmpl);
              }}
              className="text-[11px] px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {tmpl.slice(0, 42)}...
            </button>
          ))}
        </div>
      </div>

      {/* Active Pipeline Card */}
      {pipeline && (
        <div className="p-5 rounded-xl bg-slate-900/60 border border-cyan-500/30 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-cyan-400" />
                {pipeline.workflowTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{pipeline.summary}</p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">EST: {pipeline.estimatedExecutionTime}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  pipeline.status === "completed"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : pipeline.status === "in_progress"
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {pipeline.status}
              </span>
            </div>
          </div>

          {/* Sequential Step Timeline */}
          <div className="space-y-3">
            {pipeline.steps.map((step, idx) => (
              <div
                key={step.id || idx}
                className={`p-3.5 rounded-lg border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  step.status === "completed"
                    ? "bg-slate-950/90 border-emerald-500/30"
                    : step.status === "running"
                    ? "bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "bg-slate-950/50 border-slate-800/80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      step.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : step.status === "running"
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400 animate-spin"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      step.stepNumber
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">{step.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {step.module}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{step.actionDescription}</p>
                    {step.safetyCheck && (
                      <div className="text-[10px] text-amber-400/80 flex items-center gap-1 mt-1">
                        <ShieldAlert className="w-3 h-3" />
                        Safety: {step.safetyCheck}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                      step.status === "completed"
                        ? "text-emerald-400 bg-emerald-950/80 border border-emerald-800"
                        : step.status === "running"
                        ? "text-cyan-400 bg-cyan-950/80 border border-cyan-800 animate-pulse"
                        : "text-slate-500 bg-slate-900 border border-slate-800"
                    }`}
                  >
                    {step.status || "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

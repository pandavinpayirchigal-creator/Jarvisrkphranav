import React, { useState } from "react";
import { DataSetSample } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Download,
  Filter,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { jarvisSound } from "../services/soundEffects";

const SAMPLE_DATASETS: DataSetSample[] = [
  {
    id: "sales-performance",
    name: "Enterprise Sales & Conversion Metrics",
    description: "Monthly revenue, conversion rates, customer churn, and marketing spend.",
    xAxisKey: "month",
    metrics: [
      { key: "revenue", name: "Revenue ($k)", color: "#22d3ee" },
      { key: "target", name: "Target ($k)", color: "#94a3b8" },
      { key: "burn", name: "Marketing Spend ($k)", color: "#f43f5e" },
    ],
    data: [
      { month: "Jan", revenue: 140, target: 120, burn: 45, conversion: 3.2 },
      { month: "Feb", revenue: 165, target: 130, burn: 50, conversion: 3.5 },
      { month: "Mar", revenue: 190, target: 150, burn: 62, conversion: 3.9 },
      { month: "Apr", revenue: 155, target: 160, burn: 70, conversion: 2.8 },
      { month: "May", revenue: 210, target: 175, burn: 65, conversion: 4.1 },
      { month: "Jun", revenue: 245, target: 190, burn: 75, conversion: 4.5 },
      { month: "Jul", revenue: 230, target: 200, burn: 80, conversion: 4.2 },
      { month: "Aug", revenue: 280, target: 215, burn: 85, conversion: 4.8 },
    ],
  },
  {
    id: "server-telemetry",
    name: "Distributed Server Cluster Load & Latency",
    description: "QPS load, 99th percentile latency (ms), and compute utilization.",
    xAxisKey: "time",
    metrics: [
      { key: "qps", name: "Requests/sec (k)", color: "#38bdf8" },
      { key: "latency", name: "P99 Latency (ms)", color: "#f59e0b" },
      { key: "cpu", name: "CPU Load (%)", color: "#10b981" },
    ],
    data: [
      { time: "00:00", qps: 12, latency: 45, cpu: 32 },
      { time: "04:00", qps: 8, latency: 42, cpu: 25 },
      { time: "08:00", qps: 28, latency: 68, cpu: 65 },
      { time: "12:00", qps: 45, latency: 120, cpu: 88 },
      { time: "16:00", qps: 52, latency: 145, cpu: 92 },
      { time: "20:00", qps: 38, latency: 75, cpu: 70 },
      { time: "23:59", qps: 22, latency: 50, cpu: 48 },
    ],
  },
  {
    id: "iot-sensors",
    name: "Perimeter IoT Environmental & Flux Array",
    description: "Ambient temperature, pressure differential, and electromagnetic flux levels.",
    xAxisKey: "zone",
    metrics: [
      { key: "temp", name: "Temperature (°C)", color: "#f97316" },
      { key: "flux", name: "EM Flux Index", color: "#a855f7" },
      { key: "humidity", name: "Humidity (%)", color: "#06b6d4" },
    ],
    data: [
      { zone: "Sector A", temp: 22.4, flux: 14, humidity: 48 },
      { zone: "Sector B", temp: 24.1, flux: 18, humidity: 52 },
      { zone: "Core Lab", temp: 19.5, flux: 45, humidity: 35 },
      { zone: "Server Vault", temp: 18.0, flux: 60, humidity: 30 },
      { zone: "Perimeter N", temp: 26.5, flux: 12, humidity: 55 },
      { zone: "Sub-level 4", temp: 21.0, flux: 28, humidity: 42 },
    ],
  },
];

interface AnalyticsWorkbenchProps {
  onRunAnalysis: (
    datasetSummary: string,
    query: string,
    datasetName: string
  ) => Promise<string>;
}

export const AnalyticsWorkbench: React.FC<AnalyticsWorkbenchProps> = ({
  onRunAnalysis,
}) => {
  const [selectedDataset, setSelectedDataset] = useState<DataSetSample>(SAMPLE_DATASETS[0]);
  const [chartType, setChartType] = useState<"area" | "bar" | "line">("area");
  const [customQuestion, setCustomQuestion] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    jarvisSound.playActivationChime();
    setIsAnalyzing(true);
    try {
      const summary = JSON.stringify(selectedDataset.data, null, 2);
      const query =
        customQuestion ||
        "Perform full descriptive statistics, identify anomalies/outliers, calculate growth trajectories, and recommend strategic next steps.";
      const res = await onRunAnalysis(summary, query, selectedDataset.name);
      setAnalysisResult(res);
      jarvisSound.playSuccess();
    } catch (err) {
      jarvisSound.playAlert();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderChart = () => {
    const data = selectedDataset.data;
    const xKey = selectedDataset.xAxisKey;

    switch (chartType) {
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#06b6d4",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {selectedDataset.metrics.map((m) => (
              <Bar key={m.key} dataKey={m.key} name={m.name} fill={m.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );

      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#06b6d4",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {selectedDataset.metrics.map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.name}
                stroke={m.color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: m.color }}
              />
            ))}
          </LineChart>
        );

      case "area":
      default:
        return (
          <AreaChart data={data}>
            <defs>
              {selectedDataset.metrics.map((m) => (
                <linearGradient key={`grad-${m.key}`} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={m.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={m.color} stopOpacity={0.0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#06b6d4",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {selectedDataset.metrics.map((m) => (
              <Area
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.name}
                stroke={m.color}
                fillOpacity={1}
                fill={`url(#grad-${m.key})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Dataset Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/70 border border-cyan-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider font-mono">
              QUANTITATIVE DATA & ANOMALY WORKBENCH
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{selectedDataset.description}</p>
        </div>

        {/* Dataset selector chips */}
        <div className="flex flex-wrap gap-2">
          {SAMPLE_DATASETS.map((ds) => (
            <button
              key={ds.id}
              onClick={() => {
                jarvisSound.playBlip();
                setSelectedDataset(ds);
                setAnalysisResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedDataset.id === ds.id
                  ? "bg-cyan-600 text-white border border-cyan-400 shadow-md shadow-cyan-900/30"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
              }`}
            >
              {ds.name.split(" ")[0]} Dataset
            </button>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <TrendingUp className="w-4 h-4" />
            <span>{selectedDataset.name} (LIVE TELEMETRY STREAM)</span>
          </div>

          {/* Chart Type Switches */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
            {(["area", "bar", "line"] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  jarvisSound.playBlip();
                  setChartType(type);
                }}
                className={`px-2.5 py-1 rounded capitalize cursor-pointer ${
                  chartType === type
                    ? "bg-cyan-900/80 text-cyan-200 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {type} Chart
              </button>
            ))}
          </div>
        </div>

        {/* Graph Display Area */}
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Reasoning Analysis Prompt Bar */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/30 border border-cyan-500/30 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-xs font-mono text-slate-300 font-semibold uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              JARVIS STATISTICAL INFERENCE & FORECASTING ENGINE
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ask JARVIS to extract correlations, forecast future trajectories, find outliers, or calculate risk factors.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="e.g. Find why revenue dipped in April and predict Q4..."
              value={customQuestion ?? ""}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="flex-1 md:w-80 px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              id="analyze-dataset-btn"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-mono font-semibold flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  COMPUTING...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  ANALYZE
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Analysis Output */}
        {analysisResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-cyan-500/40 font-mono text-xs text-slate-200">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-cyan-400">
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                EXECUTIVE ANALYTICAL DOSSIER
              </span>
              <span className="text-[10px] text-slate-500">
                PROCESSED BY JARVIS CORE
              </span>
            </div>
            <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed overflow-x-auto">
              <ReactMarkdown>{analysisResult}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

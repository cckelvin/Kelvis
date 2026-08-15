import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table as TableIcon, Download, Sparkles } from "lucide-react";

export interface ChartDataConfig {
  type?: "bar" | "line" | "area" | "pie" | "donut" | "radar";
  title?: string;
  description?: string;
  data: any[];
  keys?: string[]; // data keys to plot (e.g. ["Revenue", "Profit"])
  xKey?: string; // category axis key (default "name" or first string key)
  colors?: string[];
  unit?: string;
}

const DEFAULT_COLORS = [
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple
  "#f43f5e", // Rose
  "#3b82f6", // Blue
];

export const ChartRenderer: React.FC<{ config: ChartDataConfig | string }> = ({ config }) => {
  const [activeTab, setActiveTab] = useState<"chart" | "table">("chart");
  const [chartTypeOverride, setChartTypeOverride] = useState<string | null>(null);

  // Parse config if passed as JSON string
  const parsedConfig: ChartDataConfig | null = React.useMemo(() => {
    if (typeof config === "object" && config !== null) {
      return config;
    }
    if (typeof config === "string") {
      try {
        // Strip markdown code fences if present
        const cleaned = config.replace(/^```(?:json|chart)?/i, "").replace(/```$/i, "").trim();
        return JSON.parse(cleaned);
      } catch (e) {
        console.warn("Failed to parse chart JSON:", e);
        return null;
      }
    }
    return null;
  }, [config]);

  if (!parsedConfig || !Array.isArray(parsedConfig.data) || parsedConfig.data.length === 0) {
    return (
      <div className="p-3 my-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-700 dark:text-rose-300">
        ⚠️ Unable to render chart: Invalid chart data structure.
      </div>
    );
  }

  const { title, description, data, unit } = parsedConfig;
  const effectiveType = chartTypeOverride || parsedConfig.type || "bar";
  const colors = parsedConfig.colors && parsedConfig.colors.length > 0 ? parsedConfig.colors : DEFAULT_COLORS;

  // Determine xKey (category axis)
  const firstItem = data[0] || {};
  const xKey = parsedConfig.xKey || Object.keys(firstItem).find((k) => typeof firstItem[k] === "string") || "name" || Object.keys(firstItem)[0];

  // Determine numeric series keys
  const seriesKeys = parsedConfig.keys || Object.keys(firstItem).filter((k) => k !== xKey && typeof firstItem[k] === "number");

  const fallbackKeys = seriesKeys.length > 0 ? seriesKeys : ["value"];

  return (
    <div className="my-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm overflow-hidden text-slate-800 dark:text-zinc-100">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            {effectiveType === "pie" || effectiveType === "donut" ? (
              <PieChartIcon className="w-3.5 h-3.5" />
            ) : effectiveType === "line" ? (
              <LineChartIcon className="w-3.5 h-3.5" />
            ) : (
              <BarChart3 className="w-3.5 h-3.5" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-xs text-slate-900 dark:text-zinc-100">
              {title || "Interactive Data Visualization"}
            </h4>
            {description && (
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">{description}</p>
            )}
          </div>
        </div>

        {/* Chart View Switcher & Actions */}
        <div className="flex items-center space-x-1">
          {/* Chart Type Overrides */}
          <div className="flex items-center bg-slate-200/70 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-300 dark:border-zinc-700 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setChartTypeOverride("bar");
                setActiveTab("chart");
              }}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                effectiveType === "bar" && activeTab === "chart"
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
              }`}
              title="Bar Chart"
            >
              Bar
            </button>
            <button
              type="button"
              onClick={() => {
                setChartTypeOverride("line");
                setActiveTab("chart");
              }}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                effectiveType === "line" && activeTab === "chart"
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
              }`}
              title="Line Chart"
            >
              Line
            </button>
            <button
              type="button"
              onClick={() => {
                setChartTypeOverride("area");
                setActiveTab("chart");
              }}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                effectiveType === "area" && activeTab === "chart"
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
              }`}
              title="Area Chart"
            >
              Area
            </button>
            <button
              type="button"
              onClick={() => {
                setChartTypeOverride("pie");
                setActiveTab("chart");
              }}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                (effectiveType === "pie" || effectiveType === "donut") && activeTab === "chart"
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
              }`}
              title="Pie Chart"
            >
              Pie
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "chart" ? "table" : "chart")}
            className={`p-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 transition-colors cursor-pointer ${
              activeTab === "table"
                ? "bg-emerald-500 text-white"
                : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100"
            }`}
            title="Toggle Raw Table Data"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Chart Body */}
      <div className="p-4">
        {activeTab === "table" ? (
          /* Table View */
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-950/40">
                  <th className="py-2 px-3 font-semibold">{xKey}</th>
                  {fallbackKeys.map((k) => (
                    <th key={k} className="py-2 px-3 font-semibold text-right">
                      {k} {unit ? `(${unit})` : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40">
                    <td className="py-1.5 px-3 font-medium text-slate-800 dark:text-zinc-200">
                      {String(row[xKey] || `Item ${i + 1}`)}
                    </td>
                    {fallbackKeys.map((k) => (
                      <td key={k} className="py-1.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                        {typeof row[k] === "number" ? row[k].toLocaleString() : String(row[k] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Recharts Interactive Visualizer */
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              {effectiveType === "pie" || effectiveType === "donut" ? (
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [
                      `${Number(value).toLocaleString()}${unit ? ` ${unit}` : ""}`,
                      "",
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Pie
                    data={data}
                    dataKey={fallbackKeys[0] || "value"}
                    nameKey={xKey}
                    cx="50%"
                    cy="50%"
                    innerRadius={effectiveType === "donut" ? 50 : 0}
                    outerRadius={80}
                    paddingAngle={3}
                    label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              ) : effectiveType === "line" ? (
                <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey={xKey} stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [
                      `${Number(val).toLocaleString()}${unit ? ` ${unit}` : ""}`,
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  {fallbackKeys.map((k, idx) => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stroke={colors[idx % colors.length]}
                      strokeWidth={2.5}
                      dot={{ r: 4, strokeWidth: 1.5 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              ) : effectiveType === "area" ? (
                <AreaChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey={xKey} stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [
                      `${Number(val).toLocaleString()}${unit ? ` ${unit}` : ""}`,
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  {fallbackKeys.map((k, idx) => (
                    <Area
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stroke={colors[idx % colors.length]}
                      fill={colors[idx % colors.length]}
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  ))}
                </AreaChart>
              ) : (
                <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey={xKey} stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [
                      `${Number(val).toLocaleString()}${unit ? ` ${unit}` : ""}`,
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  {fallbackKeys.map((k, idx) => (
                    <Bar
                      key={k}
                      dataKey={k}
                      fill={colors[idx % colors.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Footer data summary info */}
      <div className="px-4 py-2 bg-slate-50/50 dark:bg-zinc-800/40 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
        <span className="flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          <span>{data.length} Data points analyzed</span>
        </span>
        <span className="font-mono">{fallbackKeys.join(", ")}</span>
      </div>
    </div>
  );
};

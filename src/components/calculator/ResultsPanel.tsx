"use client";

import {
  Shield, HardDrive, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, FileDown, Server, Wifi
} from "lucide-react";
import { useMemo, useState } from "react";
import type { SystemResult, CameraConfig } from "@/lib/engine";
import { calculateConfidence } from "@/lib/engine/confidence";
import { formatMbps, formatTB, formatPercent, cn } from "@/lib/utils";

interface ResultsPanelProps {
  result:    SystemResult;
  configs?:  CameraConfig[];
  onExport?: () => void;
}

export function ResultsPanel({ result, configs, onExport }: ResultsPanelProps) {
  const { hdd: storage, nvr, bandwidth, cameras } = result;
  const [driveTab, setDriveTab] = useState<"budget"|"mainstream"|"enterprise">("mainstream");
  const [showSummary, setShowSummary] = useState(true);

  const confidence = useMemo(() => {
    if (!configs?.length) return null;
    try { return calculateConfidence(result, configs); }
    catch { return null; }
  }, [result, configs]);

  const confPalette = {
    excellent: { bar: "bg-emerald-500", score: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-700/40", label: "Excellent"     },
    good:      { bar: "bg-cyan-500",    score: "text-cyan-400",    badge: "bg-cyan-500/15 text-cyan-400 border-cyan-700/40",         label: "Good"          },
    moderate:  { bar: "bg-amber-500",   score: "text-amber-400",   badge: "bg-amber-500/15 text-amber-400 border-amber-700/40",      label: "Moderate Risk" },
    high:      { bar: "bg-red-500",     score: "text-red-400",     badge: "bg-red-500/15 text-red-400 border-red-700/40",            label: "High Risk"     },
  } as const;

  const cp = confidence ? (confPalette[confidence.riskLevel] ?? confPalette.good) : null;

  const dailyGB = cameras.reduce((s, c) => s + c.storagePerCameraPerDayGB * c.quantity, 0);
  const monthlyTB = dailyGB * 30 / 1000;
  const maxRetention = configs?.length ? Math.max(...configs.map(c => c.retentionDays)) : (cameras[0] ? 30 : 30);

  const DRIVE_EXAMPLES = {
    budget:      { name: "WD Purple",       sub: `${storage.driveCapacityTB} TB 5400 RPM`, type: "SATA", cache: "64MB Cache",  note: "Good for light workloads"                },
    mainstream:  { name: "Seagate SkyHawk", sub: `${storage.driveCapacityTB} TB 7200 RPM`, type: "SATA", cache: "256MB Cache", note: "Designed for 24/7 surveillance workloads" },
    enterprise:  { name: "WD Purple Pro",   sub: `${storage.driveCapacityTB} TB 7200 RPM`, type: "SATA", cache: "512MB Cache", note: "AI analytics & high-load deployments"     },
  };
  const driveEx = DRIVE_EXAMPLES[driveTab];

  return (
    <div className="space-y-3">

      {/* ── Engineering Confidence ── */}
      {confidence && cp && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", cp.badge.split(' ')[0])}>
                <Shield className="h-4 w-4" style={{ color: cp.score.replace('text-','').replace('-400','') }} />
              </div>
              <span className="text-sm font-semibold text-zinc-200">Engineering Confidence</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-baseline gap-0.5">
                <span className={cn("font-mono text-3xl font-bold", cp.score)}>{confidence.score}</span>
                <span className="text-sm text-zinc-600">/100</span>
              </div>
              <span className={cn("rounded-md border px-2 py-0.5 text-xs font-semibold", cp.badge)}>{cp.label}</span>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div className={cn("h-full rounded-full transition-all duration-700", cp.bar)} style={{ width: `${confidence.score}%` }} />
          </div>
          {confidence.deductions.length === 0 ? (
            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              No engineering issues detected
            </div>
          ) : (
            <div className="mt-2.5 space-y-1">
              {confidence.deductions.slice(0,2).map((d,i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-amber-400/80">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span style={{direction:"ltr",unicodeBidi:"embed"}}>{d}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Storage Requirement ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <HardDrive className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Storage Requirement</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StorageCard label="Raw Storage"     value={formatTB(result.rawStorageTB)}       sub="Sum of all camera groups"    accent />
          <StorageCard label="With Overhead"   value={formatTB(result.rawStorageTB * 1.20)} sub="20% filesystem + safety" />
          <StorageCard label="Usable Capacity" value={formatTB(storage.usableCapacityTB)}   sub={`After ${storage.raidProfile}`} />
          <StorageCard label="Surplus Capacity"
            value={formatTB(Math.max(0, storage.usableCapacityTB - result.rawStorageTB * 1.20))}
            sub="Headroom above requirement" />
        </div>

        {/* HDD Utilization */}
        {confidence && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-500">HDD Utilization</span>
              <div className="flex items-center gap-2">
                <span className={cn("font-mono text-xs font-bold",
                  confidence.hddUtilization.level === "healthy" ? "text-emerald-400" :
                  confidence.hddUtilization.level === "warning" ? "text-amber-400" : "text-red-400"
                )}>{confidence.hddUtilization.usedPct.toFixed(0)}%</span>
                <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                  confidence.hddUtilization.level === "healthy" ? "border-emerald-700/40 bg-emerald-950/20 text-emerald-400" :
                  confidence.hddUtilization.level === "warning" ? "border-amber-700/40 bg-amber-950/20 text-amber-400" :
                  "border-red-700/40 bg-red-950/20 text-red-400"
                )}>{confidence.hddUtilization.level.charAt(0).toUpperCase() + confidence.hddUtilization.level.slice(1)}</span>
              </div>
            </div>
            <div className="relative h-2.5 rounded-full bg-zinc-800">
              <div className={cn("h-full rounded-full transition-all",
                confidence.hddUtilization.level === "healthy" ? "bg-emerald-500" :
                confidence.hddUtilization.level === "warning" ? "bg-amber-500" : "bg-red-500"
              )} style={{ width: `${Math.min(100, confidence.hddUtilization.usedPct)}%` }} />
              {[25,50,75].map(v => (
                <div key={v} className="absolute top-0 bottom-0 w-px bg-zinc-700" style={{ left: `${v}%` }} />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-zinc-700 mt-0.5 font-mono">
              {['0%','25%','50%','75%','100%'].map(v => <span key={v}>{v}</span>)}
            </div>
          </div>
        )}
      </div>

      {/* ── Drive Recommendation ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Server className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Drive Recommendation</span>
        </div>

        {/* Drive count */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-baseline gap-2" style={{direction:"ltr",unicodeBidi:"embed"}}>
            <span className="font-mono text-4xl font-bold text-zinc-100">{storage.driveCount}</span>
            <span className="text-zinc-500 text-lg">×</span>
            <span className="font-mono text-4xl font-bold text-cyan-300">{storage.driveCapacityTB} TB</span>
          </div>
          <span className="rounded-lg border border-cyan-700/40 bg-cyan-950/20 px-2.5 py-1 text-xs font-bold text-cyan-400">
            {storage.raidProfile}
          </span>
        </div>

        {storage.surveillanceGradeRequired && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-700/30 bg-amber-950/15 px-3 py-2">
            <span className="text-amber-400 text-sm">🔶</span>
            <span className="text-xs font-semibold text-amber-400">Surveillance Grade Required</span>
          </div>
        )}

        {/* Drive tabs */}
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-800/60 p-0.5 mb-3">
          {(["budget","mainstream","enterprise"] as const).map(tab => (
            <button key={tab} onClick={() => setDriveTab(tab)}
              className={cn(
                "flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-colors",
                driveTab === tab ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              )}>{tab}</button>
          ))}
        </div>

        {/* Drive card */}
        <div className="flex items-center gap-3 rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-2xl">
            💾
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-zinc-100">{driveEx.name}</div>
            <div className="text-xs text-zinc-400 mt-0.5">{driveEx.sub}</div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">{driveEx.type}</span>
              <span className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">{driveEx.cache}</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">{driveEx.note}</div>
          </div>
        </div>

        <button className="mt-3 w-full rounded-lg border border-cyan-800/40 bg-cyan-950/20 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-950/40 transition-colors">
          View All Compatible Drives →
        </button>
      </div>

      {/* ── Summary ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <button
          onClick={() => setShowSummary(v => !v)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Summary</span>
          </div>
          {showSummary ? <ChevronUp className="h-4 w-4 text-zinc-600" /> : <ChevronDown className="h-4 w-4 text-zinc-600" />}
        </button>

        {showSummary && (
          <div className="border-t border-zinc-800 px-4 pb-4">
            <table className="w-full text-xs mt-3" style={{direction:"ltr"}}>
              <tbody className="divide-y divide-zinc-800">
                {[
                  ["Total Cameras",  String(result.totalCameraCount)],
                  ["Total Bitrate",  formatMbps(result.totalEffectiveMbps)],
                  ["Daily Data",     `${dailyGB.toFixed(1)} GB`],
                  ["Monthly Data",   `${monthlyTB.toFixed(2)} TB`],
                  ["Retention",      `${maxRetention} Days`],
                  ["RAID Level",     storage.raidProfile],
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td className="py-2 text-zinc-500">{label}</td>
                    <td className="py-2 text-right font-mono font-semibold text-zinc-200">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={onExport}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 py-3 text-xs font-semibold text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors">
              <FileDown className="h-3.5 w-3.5" />
              Export Full Report (PDF)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StorageCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border p-3",
      accent ? "border-cyan-800/40 bg-cyan-950/20" : "border-zinc-800 bg-zinc-900/40"
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        <div className={cn("h-2 w-2 rounded-full", accent ? "bg-cyan-500" : "bg-zinc-600")} />
        <span className="text-[11px] text-zinc-500">{label}</span>
      </div>
      <div className={cn("font-mono text-xl font-bold leading-none", accent ? "text-cyan-300" : "text-zinc-100")}
        style={{direction:"ltr",unicodeBidi:"embed"}}>
        {value}
      </div>
      <div className="text-[10px] text-zinc-600 mt-1 leading-tight">{sub}</div>
    </div>
  );
}

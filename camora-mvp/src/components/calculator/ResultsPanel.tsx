"use client";

import {
  AlertTriangle, HardDrive, Network, Database, Wifi,
  Shield, Server, ChevronDown, ChevronUp, CheckCircle2,
  AlertCircle, Info,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { SystemResult, CameraConfig } from "@/lib/engine";
import { calculateConfidence } from "@/lib/engine/confidence";
import type { ConfidenceResult, RAIDAdvisory, NVRSaturationAdvisory } from "@/lib/engine/confidence";
import { useLocale } from "@/i18n/LocaleContext";
import { StatCard }  from "@/components/ui/StatCard";
import { Badge }     from "@/components/ui/Badge";
import { formatMbps, formatTB, formatMBps, formatPercent, cn } from "@/lib/utils";

interface ResultsPanelProps {
  result:   SystemResult;
  configs?: CameraConfig[];
}

export function ResultsPanel({ result, configs }: ResultsPanelProps) {
  const { dict, dir } = useLocale();
  const t = dict.results;
  const { nvr, hdd: storage, bandwidth, cameras } = result;

  const confidence = useMemo(() => {
    if (!configs || configs.length === 0) return null;
    try { return calculateConfidence(result, configs); }
    catch { return null; }
  }, [result, configs]);

  const allWarnings = [
    ...nvr.warnings,
    ...storage.warnings,
    ...bandwidth.warnings,
    ...cameras.flatMap(c => c.warnings),
  ];

  const nvrUtilHigh = nvr.portUtilisationRatio > 0.70;
  const storageHuge = storage.usableCapacityTB > 100;
  const thAlign     = dir === "rtl" ? "text-right" : "text-left";

  return (
    <div className="space-y-5">

      {/* ── Confidence panel — top position, highest hierarchy ── */}
      {confidence && <ConfidencePanel confidence={confidence} />}

      {/* ── Engineering warnings ── */}
      {allWarnings.length > 0 && (
        <CollapsibleWarnings warnings={allWarnings} label={t.engineWarnings} />
      )}

      {/* ── Storage ── */}
      <section>
        <SectionHeader icon={<Database className="h-3.5 w-3.5" />} title={t.storageSection} />
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatCard label={t.rawStorage}     value={formatTB(result.rawStorageTB)}        sub={t.rawStorageSub}   accent />
          <StatCard label={t.withOverhead}   value={formatTB(result.rawStorageTB * 1.20)} sub={t.withOverheadSub} />
          <StatCard label={t.usableCapacity} value={formatTB(storage.usableCapacityTB)}   sub={`${storage.raidProfile} + FS`} warning={storageHuge} />
          <StatCard label={t.surplus}
            value={formatTB(Math.max(0, storage.usableCapacityTB - result.rawStorageTB * 1.20))}
            sub={t.surplusSub} />
        </div>

        {confidence && (
          <HDDUtilizationMeter
            usedPct={confidence.hddUtilization.usedPct}
            level={confidence.hddUtilization.level}
          />
        )}
      </section>

      {/* ── Drive recommendation ── */}
      <section>
        <SectionHeader icon={<HardDrive className="h-3.5 w-3.5" />} title={t.driveSection} />
        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-baseline gap-1.5" style={{ direction: "ltr", unicodeBidi: "embed" }}>
              <span className="font-mono text-3xl font-bold text-zinc-100">{storage.driveCount}</span>
              <span className="text-zinc-500">×</span>
              <span className="font-mono text-3xl font-bold text-cyan-300">{storage.driveCapacityTB} TB</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{storage.raidProfile}</Badge>
              <Badge variant={storage.surveillanceGradeRequired ? "warning" : "default"}>
                {storage.surveillanceGradeRequired ? t.surveillanceRequired : t.standardGrade}
              </Badge>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <DriveExample tier={t.budget}     model={storage.driveExamples.budget}     />
            <DriveExample tier={t.mainstream} model={storage.driveExamples.mainstream} highlight />
            <DriveExample tier={t.enterprise} model={storage.driveExamples.enterprise} />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-zinc-500">
            <div>
              {t.gross}:{" "}
              <span className="font-mono text-zinc-300" style={{ direction: "ltr", unicodeBidi: "embed" }}>
                {formatTB(storage.driveCount * storage.driveCapacityTB)}
              </span>
            </div>
            <div>
              {t.overheadRatio}:{" "}
              <span className="font-mono text-zinc-300" style={{ direction: "ltr", unicodeBidi: "embed" }}>
                {formatPercent(storage.overheadRatio)}
              </span>
            </div>
            <div>{t.formFactor}: <span className="text-zinc-300">3.5&quot;</span></div>
          </div>
        </div>

        {confidence && <RAIDAdvisorPanel advisory={confidence.raidAdvisory} />}
        {confidence && <HDDClassPanel hddClass={confidence.hddClass} label={confidence.hddClassLabel} reason={confidence.hddClassReason} />}
      </section>

      {/* ── NVR throughput ── */}
      <section>
        <SectionHeader icon={<Network className="h-3.5 w-3.5" />} title={t.nvrSection} />
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatCard label={t.avgIngress}     value={formatMbps(nvr.totalIngressMbps)}             sub={t.avgIngressSub}  accent />
          <StatCard label={t.recommendedNvr} value={formatMbps(nvr.recommendedNVRThroughputMbps)} sub={t.recommendedNvrSub} />
          <StatCard label={t.peakBurst}      value={formatMbps(nvr.peakBurstMbps)}                sub={t.peakBurstSub}   warning={nvr.peakBurstMbps > 900} />
          <StatCard label={t.minHddWrite}    value={formatMBps(nvr.minHDDWriteSpeedMBps)}         sub={t.minHddWriteSub} warning={nvr.minHDDWriteSpeedMBps > 150} />
        </div>

        {/* Port utilisation bar */}
        <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <span className="shrink-0 text-xs text-zinc-500">{t.portUtilisation}</span>
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={cn("h-full rounded-full transition-all duration-500",
                nvrUtilHigh ? "bg-amber-500" : "bg-cyan-500"
              )}
              style={{ width: `${Math.min(100, nvr.portUtilisationRatio * 100).toFixed(1)}%` }}
            />
          </div>
          <span
            className={cn("shrink-0 font-mono text-xs tabular-nums", nvrUtilHigh ? "text-amber-400" : "text-cyan-400")}
            style={{ direction: "ltr", unicodeBidi: "embed" }}
          >
            {formatPercent(nvr.portUtilisationRatio)} {t.portUtilisationOf}
          </span>
        </div>

        {confidence && confidence.nvrSaturation.level !== "ok" && (
          <NVRSaturationPanel saturation={confidence.nvrSaturation} />
        )}
      </section>

      {/* ── Bandwidth ── */}
      <section>
        <SectionHeader icon={<Wifi className="h-3.5 w-3.5" />} title={t.bandwidthSection} />
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatCard label={t.lanIngress}    value={formatMbps(bandwidth.lanIngressMbps)}        sub={t.lanIngressSub}   accent />
          <StatCard label={t.remoteViewing} value={formatMbps(bandwidth.remoteViewingMbps)}     sub={t.remoteViewingSub} />
          <StatCard label={t.cloudRelay}    value={formatMbps(bandwidth.cloudRelayMbps)}         sub={t.cloudRelaySub}   warning={bandwidth.cloudRelayMbps > 50} />
          <StatCard label={t.wanUplink}     value={formatMbps(bandwidth.recommendedUplinkMbps)} sub={t.wanUplinkSub}    warning={bandwidth.recommendedUplinkMbps > 100} />
        </div>
      </section>

      {/* ── Per-group breakdown ── */}
      <section>
        <SectionHeader icon={<Network className="h-3.5 w-3.5" />} title={t.breakdownSection} />
        <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-xs" style={{ direction: "ltr" }}>
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                {[t.tableHash, t.tableQty, t.tableEffective, t.tablePeak, t.tableDaily, t.tableDuty, t.tableTotal].map(h => (
                  <th key={h} className={cn("px-3 py-2.5 font-medium text-zinc-500", thAlign)}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cameras.map((cam, i) => (
                <tr key={cam.cameraId}
                  className={cn("border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/20",
                    i % 2 !== 0 ? "bg-zinc-900/20" : ""
                  )}>
                  <td className="px-3 py-2.5 font-mono text-zinc-600">{i + 1}</td>
                  <td className="px-3 py-2.5 font-mono text-zinc-300">{cam.quantity}</td>
                  <td className="px-3 py-2.5 font-mono text-cyan-400">{formatMbps(cam.effectiveBitrateMbps)}</td>
                  <td className="px-3 py-2.5 font-mono text-zinc-400">{formatMbps(cam.peakBitrateMbps)}</td>
                  <td className="px-3 py-2.5 font-mono text-zinc-400">{cam.storagePerCameraPerDayGB.toFixed(2)} GB</td>
                  <td className="px-3 py-2.5 font-mono text-zinc-400">{formatPercent(cam.dutyCycleRatio)}</td>
                  <td className="px-3 py-2.5 font-mono text-cyan-300">{formatTB(cam.groupStorageRetentionTB)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confidence Panel
// ─────────────────────────────────────────────────────────────────────────────

function ConfidencePanel({ confidence }: { confidence: ConfidenceResult }) {
  const [open, setOpen] = useState(false);
  const { score, riskLevel, deductions } = confidence;

  const palette = {
    excellent: { bar: "bg-emerald-500", score: "text-emerald-400", badge: "border-emerald-700/50 bg-emerald-950/30 text-emerald-400", border: "border-emerald-800/40", bg: "bg-emerald-950/10", label: "Excellent" },
    good:      { bar: "bg-cyan-500",    score: "text-cyan-400",    badge: "border-cyan-700/50 bg-cyan-950/30 text-cyan-400",         border: "border-cyan-800/40",    bg: "bg-cyan-950/10",    label: "Good"      },
    moderate:  { bar: "bg-amber-500",   score: "text-amber-400",   badge: "border-amber-700/50 bg-amber-950/30 text-amber-400",      border: "border-amber-800/40",   bg: "bg-amber-950/10",   label: "Moderate Risk" },
    high:      { bar: "bg-red-500",     score: "text-red-400",     badge: "border-red-700/50 bg-red-950/30 text-red-400",            border: "border-red-800/40",     bg: "bg-red-950/10",     label: "High Risk" },
  } as const;
  const p = palette[riskLevel as keyof typeof palette] ?? palette.good;

  return (
    <div className={cn("rounded-xl border p-4", p.border, p.bg)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Shield className="h-4 w-4 shrink-0 text-zinc-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Engineering Confidence
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Numeric score */}
          <div className="flex items-baseline gap-0.5" style={{ direction: "ltr", unicodeBidi: "embed" }}>
            <span className={cn("font-mono text-2xl font-bold tabular-nums leading-none", p.score)}>
              {score}
            </span>
            <span className="font-mono text-sm text-zinc-600">/100</span>
          </div>
          {/* Risk badge */}
          <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-semibold", p.badge)}>
            {p.label}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", p.bar)}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Deductions — collapsed by default when score is good */}
      {deductions.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-[11px] text-zinc-500">
              {deductions.length} factor{deductions.length !== 1 ? "s" : ""} affecting score
            </span>
            {open
              ? <ChevronUp className="h-3.5 w-3.5 text-zinc-600" />
              : <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />
            }
          </button>

          {open && (
            <ul className="mt-2.5 space-y-1.5">
              {deductions.map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
                  <span className="text-[11px] leading-relaxed text-zinc-400"
                    style={{ direction: "ltr", unicodeBidi: "embed" }}>
                    {d}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {deductions.length === 0 && (
        <div className="mt-2.5 flex items-center gap-2 text-[11px] text-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5" />
          No engineering issues detected
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HDD Utilization Meter
// ─────────────────────────────────────────────────────────────────────────────

function HDDUtilizationMeter({ usedPct, level }: { usedPct: number; level: string }) {
  const palette = {
    healthy:  { bar: "bg-emerald-500", text: "text-emerald-400", label: "Healthy",  badge: "border-emerald-700/40 bg-emerald-950/20" },
    warning:  { bar: "bg-amber-500",   text: "text-amber-400",   label: "Warning",  badge: "border-amber-700/40 bg-amber-950/20"   },
    critical: { bar: "bg-red-500",     text: "text-red-400",     label: "Critical", badge: "border-red-700/40 bg-red-950/20"       },
  } as const;
  const p = palette[level as keyof typeof palette] ?? palette.healthy;

  return (
    <div className="mt-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-500">HDD Utilization</span>
        <div className="flex items-center gap-2">
          <span
            className={cn("font-mono text-xs font-bold tabular-nums", p.text)}
            style={{ direction: "ltr", unicodeBidi: "embed" }}
          >
            {usedPct.toFixed(0)}%
          </span>
          <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", p.text, p.badge)}>
            {p.label}
          </span>
        </div>
      </div>

      {/* Bar with threshold ticks */}
      <div className="relative h-3 overflow-visible">
        {/* Track */}
        <div className="absolute inset-y-[4px] left-0 right-0 rounded-full bg-zinc-800" />
        {/* Fill */}
        <div
          className={cn("absolute inset-y-[4px] left-0 rounded-full transition-all duration-500", p.bar)}
          style={{ width: `${Math.min(100, usedPct).toFixed(1)}%` }}
        />
        {/* Threshold markers */}
        {[75, 90].map(v => (
          <div
            key={v}
            className="absolute inset-y-0 w-px bg-zinc-700"
            style={{ left: `${v}%` }}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="relative mt-1 flex text-[9px] font-mono text-zinc-700">
        <span>0%</span>
        <span className="absolute" style={{ left: "75%" }}>75%</span>
        <span className="absolute" style={{ left: "90%" }}>90%</span>
        <span className="ms-auto">100%</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RAID Advisor Panel
// ─────────────────────────────────────────────────────────────────────────────

function RAIDAdvisorPanel({ advisory }: { advisory: RAIDAdvisory }) {
  const palette = {
    info:     { Icon: Info,          border: "border-zinc-700/50",   bg: "bg-zinc-900/60",   title: "text-zinc-400",  body: "text-zinc-500"  },
    warning:  { Icon: AlertTriangle, border: "border-amber-700/40",  bg: "bg-amber-950/15",  title: "text-amber-400", body: "text-amber-300/70" },
    critical: { Icon: AlertCircle,   border: "border-red-700/40",    bg: "bg-red-950/15",    title: "text-red-400",   body: "text-red-300/70"  },
  } as const;
  const p = palette[advisory.level as keyof typeof palette] ?? palette.info;
  const { Icon } = p;

  return (
    <div className={cn("mt-2.5 flex items-start gap-3 rounded-xl border px-3.5 py-3", p.border, p.bg)}>
      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", p.title)} />
      <div className="min-w-0">
        <div className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", p.title)}>RAID Advisor</div>
        <p className={cn("text-xs leading-relaxed", p.body)} style={{ direction: "ltr", unicodeBidi: "embed" }}>
          {advisory.message}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NVR Saturation Panel
// ─────────────────────────────────────────────────────────────────────────────

function NVRSaturationPanel({ saturation }: { saturation: NVRSaturationAdvisory }) {
  const isCritical = saturation.level === "critical";
  return (
    <div className={cn(
      "mt-2.5 flex items-start gap-3 rounded-xl border px-3.5 py-3",
      isCritical ? "border-red-700/40 bg-red-950/15" : "border-amber-700/40 bg-amber-950/15"
    )}>
      <Server className={cn("h-4 w-4 shrink-0 mt-0.5", isCritical ? "text-red-400" : "text-amber-400")} />
      <div className="min-w-0">
        <div className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", isCritical ? "text-red-400" : "text-amber-400")}>
          NVR Port Saturation
        </div>
        <p className={cn("text-xs leading-relaxed", isCritical ? "text-red-300/70" : "text-amber-300/70")}
          style={{ direction: "ltr", unicodeBidi: "embed" }}>
          {saturation.message}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HDD Class Panel
// ─────────────────────────────────────────────────────────────────────────────

function HDDClassPanel({ hddClass, label, reason }: { hddClass: string; label: string; reason: string }) {
  const palette: Record<string, { border: string; bg: string; title: string; body: string }> = {
    "surveillance": { border: "border-cyan-800/40",   bg: "bg-cyan-950/15",   title: "text-cyan-400",   body: "text-cyan-300/60"   },
    "enterprise":   { border: "border-blue-800/40",   bg: "bg-blue-950/15",   title: "text-blue-400",   body: "text-blue-300/60"   },
    "ai-workload":  { border: "border-violet-800/40", bg: "bg-violet-950/15", title: "text-violet-400", body: "text-violet-300/60" },
  };
  const p = palette[hddClass] ?? palette["surveillance"]!;

  return (
    <div className={cn("mt-2.5 flex items-start gap-3 rounded-xl border px-3.5 py-3", p.border, p.bg)}>
      <HardDrive className={cn("h-4 w-4 shrink-0 mt-0.5", p.title)} />
      <div className="min-w-0">
        <div className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", p.title)}>{label}</div>
        <p className={cn("text-xs leading-relaxed", p.body)} style={{ direction: "ltr", unicodeBidi: "embed" }}>
          {reason}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible warnings (replaces always-open list)
// ─────────────────────────────────────────────────────────────────────────────

function CollapsibleWarnings({ warnings, label }: { warnings: string[]; label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-amber-800/40 bg-amber-950/10">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="text-sm font-semibold text-amber-300">
            {label} ({warnings.length})
          </span>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-amber-600" />
          : <ChevronDown className="h-4 w-4 text-amber-600" />
        }
      </button>

      {open && (
        <ul className="border-t border-amber-800/30 px-4 pb-3 pt-2.5 space-y-2">
          {warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60" />
              <span className="text-xs leading-relaxed text-amber-400/80"
                style={{ direction: "ltr", unicodeBidi: "embed" }}>
                {w}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared layout primitives (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-zinc-500">{icon}</span>
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">{title}</h3>
      <div className="flex-1 border-t border-zinc-800/80" />
    </div>
  );
}

function DriveExample({ tier, model, highlight }: { tier: string; model: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "rounded-lg border p-3 transition-colors",
      highlight ? "border-cyan-700/40 bg-cyan-950/20" : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
    )}>
      <div className={cn("mb-1.5 text-[10px] font-bold uppercase tracking-widest",
        highlight ? "text-cyan-500" : "text-zinc-600")}>
        {tier}
      </div>
      <div className="text-xs text-zinc-300 leading-snug" style={{ direction: "ltr", unicodeBidi: "embed" }}>
        {model}
      </div>
    </div>
  );
}

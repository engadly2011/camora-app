"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RAIDSelector
//
// Visual RAID type picker with engineering specs for each profile.
// Shows: usable capacity ratio, fault tolerance, min drives, use case.
// ─────────────────────────────────────────────────────────────────────────────

import { Shield, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RAIDProfile } from "@/lib/engine";

type RAIDOption = RAIDProfile | "auto";

interface RAIDConfig {
  label:        string;
  drives:       string;
  usable:       string;
  faultTolerance: string;
  speed:        "fast" | "medium" | "slow";
  risk:         "low" | "medium" | "high" | "critical";
  useCase:      string;
  warning?:     string;
  recommended?: boolean;
}

const RAID_CONFIGS: Record<string, RAIDConfig> = {
  auto: {
    label:          "Auto",
    drives:         "Engine selects",
    usable:         "Automatic",
    faultTolerance: "Automatic",
    speed:          "medium",
    risk:           "low",
    useCase:        "Engine chooses based on camera count & retention",
  },
  JBOD: {
    label:          "JBOD",
    drives:         "1+ drives",
    usable:         "100% (no redundancy)",
    faultTolerance: "None — 1 drive failure = data loss",
    speed:          "fast",
    risk:           "critical",
    useCase:        "Temporary storage only — NOT recommended for surveillance",
    warning:        "Zero fault tolerance. Any drive failure = total data loss.",
  },
  RAID1: {
    label:          "RAID 1",
    drives:         "2 drives",
    usable:         "50% (mirror)",
    faultTolerance: "1 drive failure",
    speed:          "medium",
    risk:           "low",
    useCase:        "Small deployments, 1–4 cameras, single NVR",
  },
  RAID5: {
    label:          "RAID 5",
    drives:         "3+ drives",
    usable:         "~67–92%",
    faultTolerance: "1 drive failure",
    speed:          "medium",
    risk:           "medium",
    useCase:        "SMB deployments, 4–16 cameras",
    recommended:    true,
  },
  RAID6: {
    label:          "RAID 6",
    drives:         "4+ drives",
    usable:         "~50–87%",
    faultTolerance: "2 simultaneous failures",
    speed:          "slow",
    risk:           "low",
    useCase:        "Enterprise, 16+ cameras, long retention",
    recommended:    true,
  },
  RAID10: {
    label:          "RAID 10",
    drives:         "4+ drives (even)",
    usable:         "50% (stripe + mirror)",
    faultTolerance: "1 drive per mirror pair",
    speed:          "fast",
    risk:           "low",
    useCase:        "High-performance, 32+ cameras, high FPS",
  },
};

const RISK_COLORS = {
  low:      { dot: "bg-emerald-500", text: "text-emerald-400" },
  medium:   { dot: "bg-amber-500",   text: "text-amber-400"   },
  high:     { dot: "bg-orange-500",  text: "text-orange-400"  },
  critical: { dot: "bg-red-500",     text: "text-red-400"     },
};

interface RAIDSelectorProps {
  value:    RAIDOption;
  onChange: (v: RAIDOption) => void;
}

export function RAIDSelector({ value, onChange }: RAIDSelectorProps) {
  const options: RAIDOption[] = ["auto", "JBOD", "RAID1", "RAID5", "RAID6", "RAID10"];
  const selected = RAID_CONFIGS[value];

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <Shield className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          RAID Configuration
        </span>
      </div>

      {/* Pill selector */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {options.map((opt) => {
          const cfg     = RAID_CONFIGS[opt]!;
          const isActive = value === opt;
          const isCritical = cfg.risk === "critical";

          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2.5 transition-all duration-150",
                "text-center",
                isActive
                  ? isCritical
                    ? "border-red-600/60 bg-red-950/40 text-red-300"
                    : "border-cyan-600/60 bg-cyan-950/40 text-cyan-300 shadow-[0_0_0_1px_rgba(8,145,178,0.2)]"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              )}
            >
              <span className="text-xs font-bold leading-none">{cfg.label}</span>
              {cfg.recommended && (
                <span className="text-[9px] text-cyan-500 leading-none">★ rec</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Detail card for selected RAID */}
      {selected && (
        <div className={cn(
          "rounded-xl border p-3.5 space-y-2.5 transition-all duration-200",
          selected.risk === "critical"
            ? "border-red-800/40 bg-red-950/10"
            : selected.risk === "medium"
            ? "border-amber-800/30 bg-amber-950/10"
            : "border-zinc-800 bg-zinc-900/40"
        )}>
          {/* Warning banner */}
          {selected.warning && (
            <div className="flex items-start gap-2 rounded-lg border border-red-700/40 bg-red-950/20 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400 mt-0.5" />
              <p className="text-[11px] text-red-400">{selected.warning}</p>
            </div>
          )}

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
            <SpecItem label="Min Drives"   value={selected.drives} />
            <SpecItem label="Usable Space" value={selected.usable} />
            <SpecItem label="Fault Tolerance" value={selected.faultTolerance} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Risk Level
              </span>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  RISK_COLORS[selected.risk].dot
                )} />
                <span className={cn(
                  "text-xs font-medium capitalize",
                  RISK_COLORS[selected.risk].text
                )}>
                  {selected.risk}
                </span>
              </div>
            </div>
          </div>

          {/* Use case */}
          <div className="flex items-start gap-2 pt-1 border-t border-zinc-800/60">
            <Info className="h-3.5 w-3.5 shrink-0 text-zinc-600 mt-0.5" />
            <p className="text-[11px] text-zinc-500">{selected.useCase}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">{label}</span>
      <span className="text-xs text-zinc-300 leading-snug">{value}</span>
    </div>
  );
}

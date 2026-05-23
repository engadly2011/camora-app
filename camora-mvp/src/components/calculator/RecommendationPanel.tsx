"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RecommendationPanel
//
// Renders the full InfrastructureRecommendation output as a structured
// engineering advisory panel. Tabs separate the BOM from subsystem detail.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  Server, HardDrive, Network, Zap, Box,
  Wifi, ChevronDown, ChevronUp, AlertTriangle,
  AlertCircle, Info, CheckCircle2, Shield,
} from "lucide-react";
import type { InfrastructureRecommendation, BOMItem, EngineeringAdvisory, Confidence } from '@/lib/engine';
import { cn } from "@/lib/utils";

interface RecommendationPanelProps {
  rec: InfrastructureRecommendation;
}

// ── Tab definition ─────────────────────────────────────────────────────────

type TabId = "overview" | "bom" | "advisories";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview",   label: "Overview"  },
  { id: "bom",        label: "BOM"       },
  { id: "advisories", label: "Advisories"},
];

// ─────────────────────────────────────────────────────────────────────────────

export function RecommendationPanel({ rec }: RecommendationPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const criticalCount = rec.advisories.filter((a) => a.level === "critical").length;
  const warningCount  = rec.advisories.filter((a) => a.level === "warning").length;

  return (
    <div className="flex flex-col gap-0 rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">

      {/* ── Panel header ── */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            rec.overallConfidence === "recommended" ? "bg-emerald-500/15" :
            rec.overallConfidence === "acceptable"  ? "bg-amber-500/15"   : "bg-red-500/15"
          )}>
            <Shield className={cn(
              "h-3.5 w-3.5",
              rec.overallConfidence === "recommended" ? "text-emerald-400" :
              rec.overallConfidence === "acceptable"  ? "text-amber-400"   : "text-red-400"
            )} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-200">
                Infrastructure Recommendations
              </span>
              <TierBadge tier={rec.tier} />
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-500">
              <ConfidenceDot confidence={rec.overallConfidence} />
              <span className="capitalize">{rec.overallConfidence}</span>
              {criticalCount > 0 && (
                <span className="text-red-400">· {criticalCount} critical</span>
              )}
              {warningCount > 0 && (
                <span className="text-amber-400">· {warningCount} warnings</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex-1 px-3 py-2.5 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab.label}
            {tab.id === "advisories" && rec.advisories.length > 0 && (
              <span className={cn(
                "ms-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                criticalCount > 0
                  ? "bg-red-500/20 text-red-400"
                  : "bg-amber-500/20 text-amber-400"
              )}>
                {rec.advisories.length}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-500" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="p-4">
        {activeTab === "overview" && <OverviewTab rec={rec} />}
        {activeTab === "bom"      && <BOMTab bom={rec.bom} />}
        {activeTab === "advisories" && <AdvisoriesTab advisories={rec.advisories} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview tab — subsystem cards
// ─────────────────────────────────────────────────────────────────────────────

function OverviewTab({ rec }: { rec: InfrastructureRecommendation }) {
  return (
    <div className="space-y-2.5">
      <SubsystemCard
        icon={<Server className="h-3.5 w-3.5" />}
        title="NVR"
        confidence={rec.nvr.confidence}
        primary={`${rec.nvr.unitCount}× ${rec.nvr.channelCount}-ch NVR`}
        secondary={rec.nvr.redundancy ? "N+1 standby recommended" : "Single unit"}
        detail={rec.nvr.rationale}
        chips={[
          `${rec.nvr.throughputMbps.toFixed(0)} Mbps ingress`,
          rec.nvr.redundancy ? "Redundant" : "",
          rec.nvr.raidWritePenalty ? "RAID5 write penalty" : "",
        ].filter(Boolean)}
        examples={rec.nvr.exampleProducts.slice(0, 2)}
      />

      <SubsystemCard
        icon={<HardDrive className="h-3.5 w-3.5" />}
        title="Storage"
        confidence={rec.storage.confidence}
        primary={`${rec.storage.driveCount}× ${rec.storage.driveCapacityTB} TB`}
        secondary={`${rec.storage.raidProfile} · ${rec.storage.usableCapacityTB.toFixed(1)} TB usable`}
        detail={rec.storage.rationale}
        chips={[
          `Rebuild: ~${rec.storage.rebuildRiskHours.toFixed(0)}h`,
          rec.storage.surveillanceGrade ? "Surveillance grade" : "Standard grade",
          { recommended: "Safe rebuild window", acceptable: "Monitor rebuild", risky: "Rebuild risk: HIGH" }[rec.storage.rebuildRisk],
        ]}
        warning={rec.storage.rebuildRisk === "risky"
          ? `RAID5 rebuild window ${rec.storage.rebuildRiskHours.toFixed(0)}h is critical — upgrade to RAID6`
          : undefined}
      />

      <SubsystemCard
        icon={<Network className="h-3.5 w-3.5" />}
        title="PoE Switching"
        confidence={rec.poeSwitch.confidence}
        primary={`${rec.poeSwitch.switchCount}× 24-port ${rec.poeSwitch.poeStandard}`}
        secondary={`${rec.poeSwitch.totalPoEBudgetW} W total budget · ${rec.poeSwitch.uplinkSpeedGbps} GbE uplink`}
        detail={rec.poeSwitch.rationale}
        chips={[
          `${rec.poeSwitch.portCount} ports`,
          `${rec.poeSwitch.uplinkCount} uplinks`,
          rec.poeSwitch.poeStandard,
        ]}
        examples={rec.poeSwitch.exampleProducts.slice(0, 2)}
      />

      <SubsystemCard
        icon={<Wifi className="h-3.5 w-3.5" />}
        title="Network"
        confidence={rec.network.confidence}
        primary={`${rec.network.recommendedUplinkGbps} GbE uplink`}
        secondary={`${rec.network.lanBandwidthMbps.toFixed(0)} Mbps LAN traffic`}
        detail={rec.network.rationale}
        chips={[
          rec.network.vlanSegmentation ? "VLAN required" : "Flat network OK",
          { recommended: "Low utilisation", acceptable: "Monitor utilisation", risky: "Near saturation" }[rec.network.uplinkSaturationRisk],
        ]}
        warning={rec.network.vlanSegmentation
          ? "Camera VLAN isolation is required — ONVIF multicast will overwhelm a flat network"
          : undefined}
      />

      <SubsystemCard
        icon={<Zap className="h-3.5 w-3.5" />}
        title="UPS"
        confidence={rec.ups.confidence}
        primary={`${rec.ups.capacityKVA} kVA UPS`}
        secondary={`${rec.ups.topology.replace(/-/g, " ")} · ${rec.ups.runtimeMinutes} min runtime`}
        detail={rec.ups.rationale}
        chips={[
          `${rec.ups.loadEstimateW} W load`,
          rec.ups.topology === "online-double-conversion" ? "Online double-conversion" :
          rec.ups.topology === "line-interactive" ? "Line-interactive" : "Offline",
        ]}
      />

      <SubsystemCard
        icon={<Box className="h-3.5 w-3.5" />}
        title="Rack / Physical"
        confidence={rec.rack.confidence}
        primary={`${rec.rack.rackCount}× 42U rack`}
        secondary={`${rec.rack.rackUnitsRequired}U required`}
        detail={rec.rack.coolingNote}
        chips={[
          `${rec.rack.rackUnitsRequired}U total`,
          rec.rack.coolingWarning ? "⚠ Cooling required" : "Passive cooling OK",
        ]}
        warning={rec.rack.coolingWarning ? rec.rack.coolingNote : undefined}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOM tab
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  nvr:        "NVR & Recording",
  storage:    "Storage",
  networking: "Networking",
  power:      "Power",
  physical:   "Physical Infrastructure",
};

function BOMTab({ bom }: { bom: BOMItem[] }) {
  const byCategory = bom.reduce<Record<string, BOMItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const categoryOrder = ["nvr", "storage", "networking", "power", "physical"];

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-zinc-500">
        Indicative bill of materials. Quantities and specifications based on calculated results.
        All product examples are vendor-neutral references.
      </p>

      {categoryOrder.map((cat) => {
        const items = byCategory[cat];
        if (!items?.length) return null;

        return (
          <div key={cat}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
              <div className="flex-1 border-t border-zinc-800" />
            </div>
            <div className="space-y-1.5">
              {items.map((item) => <BOMRow key={item.id} item={item} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BOMRow({ item }: { item: BOMItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      "rounded-xl border transition-colors",
      item.confidence === "risky"       ? "border-red-800/50 bg-red-950/10"   :
      item.confidence === "acceptable"  ? "border-amber-800/40 bg-amber-950/10" :
      "border-zinc-800 bg-zinc-900/40"
    )}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <ConfidenceDot confidence={item.confidence} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-200 truncate">{item.label}</span>
            <span className={cn(
              "shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px]",
              "text-zinc-400"
            )}>
              ×{item.quantity} {item.unit}
            </span>
          </div>
          <div className="mt-0.5 truncate text-[11px] text-zinc-500">{item.description}</div>
        </div>

        {expanded
          ? <ChevronUp   className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
          : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
        }
      </button>

      {expanded && (
        <div className="border-t border-zinc-800/60 px-3 pb-3 pt-2.5 space-y-2.5">
          <p className="text-xs leading-relaxed text-zinc-400">{item.rationale}</p>

          {item.note && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-700/30 bg-amber-950/20 px-2.5 py-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <p className="text-[11px] text-amber-300/80">{item.note}</p>
            </div>
          )}

          {item.examples.length > 0 && (
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Product examples
              </div>
              <ul className="space-y-1">
                {item.examples.map((ex, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Advisories tab
// ─────────────────────────────────────────────────────────────────────────────

function AdvisoriesTab({ advisories }: { advisories: EngineeringAdvisory[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (advisories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
        <p className="text-sm text-zinc-500">No engineering advisories for this configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {advisories.map((adv) => {
        const isOpen = expanded === adv.id;
        return (
          <div
            key={adv.id}
            className={cn(
              "rounded-xl border overflow-hidden transition-colors",
              adv.level === "critical" ? "border-red-700/50 bg-red-950/15"   :
              adv.level === "warning"  ? "border-amber-700/40 bg-amber-950/10" :
              "border-zinc-700/40 bg-zinc-900/40"
            )}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : adv.id)}
              className="flex w-full items-start gap-3 px-3 py-3 text-left"
            >
              <AdvisoryIcon level={adv.level} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-xs font-medium leading-snug",
                  adv.level === "critical" ? "text-red-300"   :
                  adv.level === "warning"  ? "text-amber-300" : "text-zinc-300"
                )}>
                  {adv.headline}
                </p>
              </div>
              {isOpen
                ? <ChevronUp   className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                : <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
              }
            </button>

            {isOpen && (
              <div className="border-t border-zinc-800/50 px-3 pb-3 pt-2.5 space-y-3">
                <p className="text-xs leading-relaxed text-zinc-400">{adv.detail}</p>
                <div className={cn(
                  "rounded-lg border px-3 py-2.5",
                  adv.level === "critical" ? "border-red-700/40 bg-red-950/20"     :
                  adv.level === "warning"  ? "border-amber-700/30 bg-amber-950/15" :
                  "border-zinc-700/30 bg-zinc-900/40"
                )}>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Recommended action
                  </div>
                  <p className="text-xs text-zinc-300">{adv.action}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubsystemCard — collapsible card for each infrastructure domain
// ─────────────────────────────────────────────────────────────────────────────

interface SubsystemCardProps {
  icon:       React.ReactNode;
  title:      string;
  confidence: Confidence;
  primary:    string;
  secondary:  string;
  detail:     string;
  chips:      (string | undefined)[];
  warning?:   string;
  examples?:  string[];
}

function SubsystemCard({
  icon, title, confidence, primary, secondary, detail, chips, warning, examples,
}: SubsystemCardProps) {
  const [expanded, setExpanded] = useState(false);

  const borderCls =
    confidence === "risky"      ? "border-red-800/50"   :
    confidence === "acceptable" ? "border-amber-800/40" :
    "border-zinc-800";

  const bgCls =
    confidence === "risky"      ? "bg-red-950/10"     :
    confidence === "acceptable" ? "bg-amber-950/10"   :
    "bg-zinc-900/30";

  return (
    <div className={cn("rounded-xl border overflow-hidden", borderCls, bgCls)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className="shrink-0 text-zinc-500">{icon}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {title}
            </span>
            <ConfidencePill confidence={confidence} />
          </div>
          <div className="mt-0.5 text-xs font-medium text-zinc-200">{primary}</div>
          <div className="text-[11px] text-zinc-500">{secondary}</div>
        </div>

        {expanded
          ? <ChevronUp   className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
          : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
        }
      </button>

      {expanded && (
        <div className="border-t border-zinc-800/50 px-3 pb-3 pt-2.5 space-y-2.5">
          {/* Chips */}
          <div className="flex flex-wrap gap-1.5">
            {chips.filter(Boolean).map((chip, i) => (
              <span
                key={i}
                className="rounded-md border border-zinc-700/60 bg-zinc-800/60 px-2 py-0.5 text-[10px] text-zinc-400"
              >
                {chip}
              </span>
            ))}
          </div>

          {/* Rationale */}
          <p className="text-xs leading-relaxed text-zinc-400">{detail}</p>

          {/* Warning */}
          {warning && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-700/30 bg-amber-950/20 px-2.5 py-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <p className="text-[11px] text-amber-300/80">{warning}</p>
            </div>
          )}

          {/* Examples */}
          {examples && examples.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Reference products
              </div>
              <ul className="space-y-0.5">
                {examples.map((ex, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-700" />
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Micro-components
// ─────────────────────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: InfrastructureRecommendation["tier"] }) {
  const map = {
    smb:        { label: "SMB",      cls: "bg-zinc-800 text-zinc-400"        },
    enterprise: { label: "Enterprise", cls: "bg-blue-950/60 text-blue-400"   },
    critical:   { label: "Critical", cls: "bg-red-950/60 text-red-400"       },
  };
  const { label, cls } = map[tier];
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", cls)}>
      {label}
    </span>
  );
}

function ConfidencePill({ confidence }: { confidence: Confidence }) {
  const map = {
    recommended: "bg-emerald-500/15 text-emerald-400",
    acceptable:  "bg-amber-500/15  text-amber-400",
    risky:       "bg-red-500/15    text-red-400",
  };
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium capitalize", map[confidence])}>
      {confidence}
    </span>
  );
}

function ConfidenceDot({ confidence }: { confidence: Confidence }) {
  return (
    <span className={cn(
      "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
      confidence === "recommended" ? "bg-emerald-400" :
      confidence === "acceptable"  ? "bg-amber-400"   : "bg-red-400"
    )} />
  );
}

function AdvisoryIcon({ level }: { level: EngineeringAdvisory["level"] }) {
  if (level === "critical") return <AlertCircle   className="mt-0.5 h-4 w-4 shrink-0 text-red-400"    />;
  if (level === "warning")  return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"  />;
  return                           <Info          className="mt-0.5 h-4 w-4 shrink-0 text-blue-400"  />;
}

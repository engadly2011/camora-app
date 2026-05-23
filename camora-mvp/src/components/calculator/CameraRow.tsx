"use client";

import { Trash2, Copy, ChevronDown, ChevronUp, Zap, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn }              from "@/lib/utils";
import { useLocale }       from "@/i18n/LocaleContext";
import { Select }          from "@/components/ui/Select";
import { Slider }          from "@/components/ui/Slider";
import { Toggle }          from "@/components/ui/Toggle";
import { NumberInput }     from "@/components/ui/NumberInput";
import {
  RESOLUTION_OPTIONS, CODEC_OPTIONS, ENCODING_MODE_OPTIONS,
  AUDIO_CODEC_OPTIONS, AI_ANALYTICS_OPTIONS, VENDOR_OPTIONS, VENDOR_MODELS,
} from "@/lib/constants";
import type { CameraRow as CameraRowType } from "@/types/calculator";
import type { CameraConfig, SceneComplexity, RecordingMode } from "@/lib/engine";
import { SCENARIO_PRESETS } from "@/lib/presets";

interface CameraRowProps {
  row:         CameraRowType;
  index:       number;
  totalRows:   number;
  onUpdate:    (patch: Partial<CameraConfig>) => void;
  onRemove:    () => void;
  onDuplicate: () => void;
}

export function CameraRow({ row, index, totalRows, onUpdate, onRemove, onDuplicate }: CameraRowProps) {
  const [expanded, setExpanded]         = useState(true);
  const [manualBitrate, setManualBitrate] = useState(false);
  const [manualMbps, setManualMbps]     = useState<number>(row.targetBitrateMbps ?? 4);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const { dict, dir } = useLocale();
  const t      = dict.cameraRow;
  const tScene = dict.sceneOptions;
  const tMode  = dict.recordingMode;

  const modelOptions        = VENDOR_MODELS[row.vendorId] ?? [];
  const showScheduledHours  = row.recordingMode === "scheduled";
  const showCBRTarget       = !manualBitrate && (row.encodingMode === "CBR" || row.encodingMode === "CVBR");
  const showAudioCodec      = row.audioEnabled;
  const showAIMode          = row.aiAnalyticsEnabled;

  // Warn thresholds for manual bitrate
  const bitrateWarnHigh = manualMbps > 20;
  const bitrateWarnLow  = manualMbps < 0.2;
  const bitrateOk       = !bitrateWarnHigh && !bitrateWarnLow;

  const sceneOptions: { value: SceneComplexity; label: string; description: string }[] = [
    { value: "minimal", label: tScene.minimal, description: tScene.minimalDesc },
    { value: "low",     label: tScene.low,     description: tScene.lowDesc     },
    { value: "medium",  label: tScene.medium,  description: tScene.mediumDesc  },
    { value: "high",    label: tScene.high,    description: tScene.highDesc    },
    { value: "extreme", label: tScene.extreme, description: tScene.extremeDesc },
  ];

  const recordingModeOptions: { value: RecordingMode; label: string; description: string }[] = [
    { value: "continuous",      label: tMode.continuous,      description: tMode.continuousDesc      },
    { value: "scheduled",       label: tMode.scheduled,       description: tMode.scheduledDesc       },
    { value: "motion_only",     label: tMode.motionOnly,      description: tMode.motionOnlyDesc      },
    { value: "alarm_triggered", label: tMode.alarmTriggered,  description: tMode.alarmTriggeredDesc  },
    { value: "motion_adaptive", label: tMode.motionAdaptive,  description: tMode.motionAdaptiveDesc  },
  ];

  const vendorLabel = VENDOR_OPTIONS.find((v) => v.value === row.vendorId)?.label ?? row.vendorId;
  const modelLabel  = modelOptions.find((m) => m.value === row.modelId)?.label;

  function applyPreset(presetId: string) {
    const preset = SCENARIO_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const patch: Partial<CameraConfig> = {};
    if (preset.motionPercent       !== undefined) patch.motionPercent       = preset.motionPercent;
    if (preset.sceneComplexity     !== undefined) patch.sceneComplexity     = preset.sceneComplexity;
    if (preset.recordingMode       !== undefined) patch.recordingMode       = preset.recordingMode;
    if (preset.recordingHoursPerDay !== undefined) patch.recordingHoursPerDay = preset.recordingHoursPerDay;
    if (preset.codec               !== undefined) patch.codec               = preset.codec;
    if (preset.fps                 !== undefined) patch.fps                 = preset.fps;
    if (preset.aiAnalyticsEnabled  !== undefined) patch.aiAnalyticsEnabled  = preset.aiAnalyticsEnabled;
    if (preset.aiAnalyticsMode     !== undefined) patch.aiAnalyticsMode     = preset.aiAnalyticsMode;
    if (preset.audioEnabled        !== undefined) patch.audioEnabled        = preset.audioEnabled;
    onUpdate(patch);
    setActivePreset(presetId);
  }

  return (
    <div className={cn(
      "rounded-2xl border bg-zinc-900/50 backdrop-blur-sm transition-all duration-200",
      manualBitrate ? "border-amber-700/30" : "border-zinc-800 hover:border-zinc-700"
    )}>
      {/* ── Row header ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/10 font-mono text-xs font-bold text-cyan-400">
          {index + 1}
        </span>

        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <span className="truncate text-sm font-medium text-zinc-200">
            {row.quantity}× {vendorLabel}{modelLabel ? ` — ${modelLabel}` : ""}
          </span>
          <span
            className="shrink-0 rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-400"
            style={{ direction: "ltr", unicodeBidi: "embed" }}
          >
            {row.resolution} · {row.codec} · {row.fps} FPS
          </span>
          {manualBitrate && (
            <span className="shrink-0 rounded border border-amber-700/40 bg-amber-950/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-400">
              {manualMbps} Mbps MANUAL
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={onDuplicate} title={t.duplicate}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300">
            <Copy className="h-3.5 w-3.5" />
          </button>
          {totalRows > 1 && (
            <button onClick={onRemove} title={t.remove}
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-950 hover:text-red-400">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => setExpanded(v => !v)}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="border-t border-zinc-800 px-4 pb-4 pt-4 space-y-4">

          {/* ── Scenario Presets ── */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Scenario preset
              </span>
              {activePreset && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                  <CheckCircle2 className="h-3 w-3" />
                  applied
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {SCENARIO_PRESETS.map(preset => {
                const isActive = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    title={preset.description}
                    onClick={() => applyPreset(preset.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left transition-all duration-150",
                      "text-[11px] font-medium leading-none",
                      isActive
                        ? "border-cyan-600/60 bg-cyan-950/40 text-cyan-300 shadow-[0_0_0_1px_rgba(8,145,178,0.2)]"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-200"
                    )}
                  >
                    <span className="text-sm leading-none">{preset.icon}</span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Bitrate Mode ── */}
          <div className={cn(
            "rounded-xl border p-3.5 transition-all duration-200",
            manualBitrate
              ? "border-amber-700/40 bg-amber-950/10"
              : "border-zinc-800 bg-zinc-900/30"
          )}>
            {/* Header row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Zap className={cn("h-3.5 w-3.5 shrink-0", manualBitrate ? "text-amber-400" : "text-zinc-500")} />
                <div className="min-w-0">
                  <div className={cn("text-xs font-semibold", manualBitrate ? "text-amber-300" : "text-zinc-300")}>
                    {manualBitrate ? "Manual Bitrate Override" : "Bitrate: Auto (engine-calculated)"}
                  </div>
                  {!manualBitrate && (
                    <div className="text-[10px] text-zinc-600 mt-0.5">
                      Based on resolution, codec, scene complexity, motion %
                    </div>
                  )}
                </div>
              </div>

              {/* Mode toggle — pill switch */}
              <div className="flex shrink-0 items-center rounded-lg border border-zinc-700 bg-zinc-900 p-0.5">
                <button
                  onClick={() => {
                    setManualBitrate(false);
                    onUpdate({ encodingMode: "VBR", targetBitrateMbps: null });
                  }}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                    !manualBitrate
                      ? "bg-zinc-700 text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Auto
                </button>
                <button
                  onClick={() => {
                    setManualBitrate(true);
                    onUpdate({ encodingMode: "CBR", targetBitrateMbps: manualMbps });
                  }}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                    manualBitrate
                      ? "bg-amber-600 text-zinc-950 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Manual
                </button>
              </div>
            </div>

            {/* Manual input — only when active */}
            {manualBitrate && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      value={manualMbps}
                      min={0.1}
                      max={200}
                      step={0.1}
                      onChange={e => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v) && v > 0) {
                          setManualMbps(v);
                          onUpdate({ targetBitrateMbps: v });
                        }
                      }}
                      className={cn(
                        "h-9 w-32 rounded-lg border pr-12 pl-3 font-mono text-sm",
                        "bg-zinc-900 focus:outline-none focus:ring-1 transition-colors",
                        bitrateWarnHigh || bitrateWarnLow
                          ? "border-amber-500/60 text-amber-300 focus:ring-amber-500/30"
                          : "border-emerald-600/50 text-emerald-300 focus:ring-emerald-500/30"
                      )}
                    />
                    <span className="absolute right-3 text-[11px] text-zinc-500 pointer-events-none">Mbps</span>
                  </div>

                  {bitrateOk && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-500">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Valid range
                    </div>
                  )}
                </div>

                {/* Validation messages */}
                {bitrateWarnHigh && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-700/30 bg-amber-950/20 px-3 py-2">
                    <span className="text-amber-400 shrink-0 mt-0.5 text-xs">⚠</span>
                    <p className="text-[11px] text-amber-400/90">
                      <strong>{manualMbps} Mbps</strong> is unusually high for surveillance.
                      Typical range for {row.resolution}: 1–12 Mbps with H.265+.
                    </p>
                  </div>
                )}
                {bitrateWarnLow && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-700/30 bg-amber-950/20 px-3 py-2">
                    <span className="text-amber-400 shrink-0 mt-0.5 text-xs">⚠</span>
                    <p className="text-[11px] text-amber-400/90">
                      <strong>{manualMbps} Mbps</strong> may be too low for {row.resolution} at {row.fps} FPS.
                      Expect visible compression artifacts.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Main config grid ── */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            <NumberInput label={t.quantity} value={row.quantity}
              onChange={v => onUpdate({ quantity: Math.max(1, Math.floor(v)) })}
              min={1} max={10000} />

            <Select label={t.vendor} value={row.vendorId}
              onChange={v => onUpdate({ vendorId: v, modelId: null })}
              options={VENDOR_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />

            <Select label={t.model} value={row.modelId ?? ""}
              onChange={v => onUpdate({ modelId: v || null })}
              options={[{ value: "", label: dict.cameraRow.genericFormula }, ...modelOptions]}
              disabled={modelOptions.length === 0} />

            <Select label={t.resolution} value={row.resolution}
              onChange={v => onUpdate({ resolution: v })}
              options={RESOLUTION_OPTIONS} />

            <Select label={t.codec} value={row.codec}
              onChange={v => onUpdate({ codec: v })}
              options={CODEC_OPTIONS} />

            <NumberInput label={t.fps} value={row.fps}
              onChange={v => onUpdate({ fps: Math.min(60, Math.max(1, Math.floor(v))) })}
              min={1} max={60} suffix="fps" />

            <Select label={t.sceneComplexity} value={row.sceneComplexity}
              onChange={v => onUpdate({ sceneComplexity: v })}
              options={sceneOptions} />

            <Select label={t.encodingMode} value={row.encodingMode}
              onChange={v => onUpdate({ encodingMode: v })}
              options={ENCODING_MODE_OPTIONS} />

            {showCBRTarget && (
              <NumberInput label={t.bitrateCeiling} value={row.targetBitrateMbps ?? 4}
                onChange={v => onUpdate({ targetBitrateMbps: v })}
                min={0.1} max={100} step={0.1} suffix="Mbps" />
            )}

            <Select label={t.recordingMode} value={row.recordingMode}
              onChange={v => onUpdate({ recordingMode: v })}
              options={recordingModeOptions} />

            {showScheduledHours && (
              <NumberInput label={t.recordingHours} value={row.recordingHoursPerDay}
                onChange={v => onUpdate({ recordingHoursPerDay: Math.min(24, Math.max(0.5, v)) })}
                min={0.5} max={24} step={0.5} suffix="h" />
            )}

            <NumberInput label={t.retention} value={row.retentionDays}
              onChange={v => onUpdate({ retentionDays: Math.max(1, Math.floor(v)) })}
              min={1} max={3650} suffix={dir === "rtl" ? "يوم" : "days"} />
          </div>

          {/* ── Motion slider ── */}
          <div>
            <Slider
              label={t.motionPercent}
              value={row.motionPercent}
              onChange={v => onUpdate({ motionPercent: v })}
              min={0} max={100} step={5}
              format={v => `${v}%`}
            />
          </div>

          {/* ── Feature toggles ── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
              <Toggle label={t.audio} description={t.audioDesc}
                checked={row.audioEnabled}
                onChange={v => onUpdate({ audioEnabled: v })} />
              {showAudioCodec && (
                <Select label={t.audioCodec} value={row.audioCodec ?? "G.711"}
                  onChange={v => onUpdate({ audioCodec: v })}
                  options={AUDIO_CODEC_OPTIONS} />
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
              <Toggle label={t.aiAnalytics} description={t.aiAnalyticsDesc}
                checked={row.aiAnalyticsEnabled}
                onChange={v => onUpdate({ aiAnalyticsEnabled: v, aiAnalyticsMode: v ? "edge_metadata" : null })} />
              {showAIMode && (
                <Select label={t.aiMode} value={row.aiAnalyticsMode ?? "edge_metadata"}
                  onChange={v => onUpdate({ aiAnalyticsMode: v })}
                  options={AI_ANALYTICS_OPTIONS} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  FileDown, Languages, Plus, Trash2,
  ChevronDown, ChevronUp, Settings2, Link, Check,
} from "lucide-react";
import type { CameraConfig } from "@/lib/engine";
import { useCalculator }    from "@/hooks/useCalculator";
import { useLocale }        from "@/i18n/LocaleContext";
import { usePdfExport }     from "@/lib/pdf/export";
import { ExportModal }      from "./ExportModal";
import { ResultsPanel }     from "./ResultsPanel";
import { cn }               from "@/lib/utils";
import { SCENARIO_PRESETS }   from "@/lib/presets";
import { planRealisticStorage, selectRealisticRAID, evaluateManualStorage } from "@/lib/engine/storagePlanner";
import { buildShareUrl }    from "@/lib/shareUrl";
import { analytics }        from "@/lib/analytics";
import { RESOLUTION_OPTIONS, CODEC_OPTIONS, VENDOR_OPTIONS } from "@/lib/constants";
import type { CalculatorFormState, ManualStorageConfig } from "@/types/calculator";

// ── Data ──────────────────────────────────────────────────────────────────────

const RAID_OPTIONS = [
  { value: "auto",   label: "Auto (Recommended)", note: "Engine selects for you",       usable: "—"    },
  { value: "RAID5",  label: "RAID 5",             note: "Best balance · 1 drive fault", usable: "~80%" },
  { value: "RAID6",  label: "RAID 6",             note: "Enterprise · 2 drive faults",  usable: "~67%" },
  { value: "RAID10", label: "RAID 10",            note: "High performance · fast",       usable: "50%"  },
  { value: "RAID1",  label: "RAID 1",             note: "Simple mirror · 2 drives",      usable: "50%"  },
  { value: "JBOD",   label: "JBOD (No RAID)",     note: "⚠ No redundancy",              usable: "100%" },
] as const;

const RADIO_OPTIONS = [
  { value: "wired", label: "🔌 Wired (PoE)", overhead: "+0%"  },
  { value: "wifi",  label: "📶 Wi-Fi",       overhead: "+15%" },
  { value: "4g5g",  label: "📡 4G / 5G",    overhead: "+25%" },
  { value: "mesh",  label: "🔗 Mesh / P2P",  overhead: "+20%" },
] as const;

const SCENE_OPTIONS = [
  { value: "minimal", label: "Minimal — Server room, ATM"    },
  { value: "low",     label: "Low — Empty corridor"           },
  { value: "medium",  label: "Medium — Typical office"        },
  { value: "high",    label: "High — Busy street"             },
  { value: "extreme", label: "Extreme — Night IR / crowds"    },
] as const;

const RECORDING_OPTIONS = [
  { value: "continuous",      label: "Continuous 24/7"   },
  { value: "scheduled",       label: "Scheduled hours"   },
  { value: "motion_only",     label: "Motion only"       },
  { value: "motion_adaptive", label: "Motion adaptive"   },
] as const;

const FPS_OPTIONS = [5, 10, 15, 20, 25, 30];

// ─────────────────────────────────────────────────────────────────────────────

export function CalculatorShell() {
  const {
    state, result, error,
    addRow, removeRow, updateRow,
    setOverheadMultiplier, setRaidOverride, setStorageMode, setManualStorage,
  } = useCalculator();

  const { dict, toggleLocale } = useLocale();

  const configs: CameraConfig[] = useMemo(
    () => state.rows.map(({ _rowId: _, ...cfg }) => cfg),
    [state.rows]
  );

  const { exportState, exportError, exportPdf, reset } = usePdfExport({ result, configs });
  const [exportOpen,   setExportOpen]   = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [mobileTab,    setMobileTab]    = useState<'config' | 'results'>('config');

  function handleExport() { if (!result) return; reset(); analytics.pdfExportStarted(); setExportOpen(true); }

  const [copied, setCopied] = useState(false);
  function handleCopyLink() {
    const url = buildShareUrl(state);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      analytics.shareLinkCopied();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function applyPreset(presetId: string) {
    const preset = SCENARIO_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    analytics.presetSelected(presetId);
    const patch: Partial<CameraConfig> = {};
    if (preset.motionPercent       !== undefined) patch.motionPercent       = preset.motionPercent;
    if (preset.sceneComplexity     !== undefined) patch.sceneComplexity     = preset.sceneComplexity;
    if (preset.codec               !== undefined) patch.codec               = preset.codec;
    if (preset.fps                 !== undefined) patch.fps                 = preset.fps;
    if (preset.recordingMode       !== undefined) patch.recordingMode       = preset.recordingMode;
    if (preset.aiAnalyticsEnabled  !== undefined) patch.aiAnalyticsEnabled  = preset.aiAnalyticsEnabled;
    if (preset.aiAnalyticsMode     !== undefined) patch.aiAnalyticsMode     = preset.aiAnalyticsMode;
    state.rows.forEach(row => updateRow(row._rowId, patch));
  }

  const firstRow = state.rows[0];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-zinc-100">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-20 border-b border-zinc-800/60 bg-[#0a0f1a]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/30">
              <span className="font-mono text-sm font-bold text-cyan-400">C</span>
            </div>
            <div className="leading-none">
              <div className="text-sm font-bold text-zinc-100">Camora</div>
              <div className="text-[10px] text-zinc-500">Storage Calculator</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggleLocale}
              className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
              {dict.header.langToggle}
            </button>
            <button onClick={handleCopyLink}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 hover:border-cyan-700/60 hover:text-cyan-400 transition-colors">
              {copied
                ? <><Check className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                : <><Link className="h-3.5 w-3.5" />Share Link</>
              }
            </button>
            <button onClick={handleExport} disabled={!result}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                result
                  ? "bg-cyan-600 text-zinc-950 hover:bg-cyan-500"
                  : "cursor-not-allowed bg-zinc-800 text-zinc-600"
              )}>
              <FileDown className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile tab bar — only on screens < lg ── */}
      <div className="sticky top-14 z-10 border-b border-zinc-800 bg-[#0a0f1a] lg:hidden">
        <div className="flex">
          {(['config', 'results'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={cn(
                "flex-1 py-3 text-sm font-semibold capitalize transition-colors",
                mobileTab === tab
                  ? "border-b-2 border-cyan-500 text-cyan-400"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tab === 'config' ? '⚙ Configure' : '📊 Results'}
              {tab === 'results' && result && (
                <span className="ml-1.5 font-mono text-xs text-zinc-500">
                  {result.rawStorageTB.toFixed(1)} TB
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:flex lg:gap-6">

        {/* ── LEFT: Config — hidden on mobile when results tab active ── */}
        <div className={cn("flex-1 space-y-4 lg:max-w-[640px]", mobileTab === 'results' ? "hidden lg:block" : "block")}>

          {/* ── STEP 1: Scenario ── */}
          <StepCard step={1} title="Select Scenario">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SCENARIO_PRESETS.slice(0, 7).map(preset => (
                <button key={preset.id} onClick={() => applyPreset(preset.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                    activePreset === preset.id
                      ? "border-cyan-600/60 bg-cyan-950/30 text-cyan-300"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  )}>
                  <span className="text-xl leading-none">{preset.icon}</span>
                  <span className="text-[11px] font-medium leading-tight">{preset.label}</span>
                </button>
              ))}
            </div>
          </StepCard>

          {/* ── STEP 2: Cameras ── */}
          <StepCard step={2} title="Camera Groups">
            {/* Column headers — desktop only */}
            <div className="mb-2 hidden grid-cols-[1.5fr_1fr_70px_70px_36px] gap-2 px-1 sm:grid">
              {["Brand / Model", "Resolution", "FPS", "Qty", ""].map(h => (
                <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{h}</span>
              ))}
            </div>

            <div className="space-y-2">
              {state.rows.map((row, idx) => {
                const cam = result?.cameras[idx];
                return (
                  <CameraGroupRow
                    key={row._rowId}
                    row={row}
                    totalRows={state.rows.length}
                    estimatedMbps={cam?.effectiveBitrateMbps ?? null}
                    onUpdate={patch => updateRow(row._rowId, patch)}
                    onRemove={() => removeRow(row._rowId)}
                  />
                );
              })}
            </div>

            <button onClick={addRow}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 py-2.5 text-sm text-zinc-600 hover:border-cyan-700/50 hover:bg-cyan-950/10 hover:text-cyan-400 transition-all">
              <Plus className="h-4 w-4" />
              Add Camera Group
            </button>
          </StepCard>

          {/* ── STEP 3: Recording ── */}
          <StepCard step={3} title="Recording Settings">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

              {/* Retention */}
              <FieldGroup label="Retention">
                <div className="flex items-center gap-2">
                  <input type="number" value={firstRow?.retentionDays ?? 30} min={1} max={365}
                    onChange={e => state.rows.forEach(r =>
                      updateRow(r._rowId, { retentionDays: Math.max(1, parseInt(e.target.value) || 30) })
                    )}
                    className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 font-mono text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none" />
                  <span className="shrink-0 text-xs text-zinc-500">days</span>
                </div>
              </FieldGroup>

              {/* Codec */}
              <FieldGroup label="Codec">
                <Sel value={firstRow?.codec ?? "H.265+"}
                  onChange={v => state.rows.forEach(r => updateRow(r._rowId, { codec: v as CameraConfig["codec"] }))}
                  options={CODEC_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />
              </FieldGroup>

              {/* Scene */}
              <FieldGroup label="Scene Complexity">
                <Sel value={firstRow?.sceneComplexity ?? "medium"}
                  onChange={v => state.rows.forEach(r => updateRow(r._rowId, { sceneComplexity: v as CameraConfig["sceneComplexity"] }))}
                  options={SCENE_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />
              </FieldGroup>
            </div>

            {/* Motion slider */}
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="field-label">Motion %</span>
                <span className="font-mono text-sm font-bold text-cyan-400">
                  {firstRow?.motionPercent ?? 30}%
                </span>
              </div>
              <div className="relative h-5 flex items-center">
                <div className="absolute inset-x-0 h-2 rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-cyan-500 transition-all"
                    style={{ width: `${firstRow?.motionPercent ?? 30}%` }} />
                </div>
                <input type="range" min={0} max={100} step={5}
                  value={firstRow?.motionPercent ?? 30}
                  onChange={e => state.rows.forEach(r =>
                    updateRow(r._rowId, { motionPercent: parseInt(e.target.value) })
                  )}
                  className="relative w-full cursor-pointer opacity-0 h-5" />
              </div>
              <div className="mt-0.5 flex justify-between text-[10px] text-zinc-700">
                {["0%", "25%", "50%", "75%", "100%"].map(v => <span key={v}>{v}</span>)}
              </div>
            </div>

            {/* ── Advanced Options ── */}
            <AdvancedSection label="Advanced Options">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Recording Mode">
                  <Sel value={firstRow?.recordingMode ?? "continuous"}
                    onChange={v => state.rows.forEach(r => updateRow(r._rowId, { recordingMode: v as CameraConfig["recordingMode"] }))}
                    options={RECORDING_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />
                </FieldGroup>

                <FieldGroup label="Encoding Mode">
                  <Sel value={firstRow?.encodingMode ?? "VBR"}
                    onChange={v => state.rows.forEach(r => updateRow(r._rowId, { encodingMode: v as CameraConfig["encodingMode"] }))}
                    options={[
                      { value: "VBR",  label: "VBR — Variable" },
                      { value: "CBR",  label: "CBR — Constant" },
                      { value: "CVBR", label: "CVBR — Capped"  },
                    ]} />
                </FieldGroup>

                {/* Manual bitrate override */}
                {(firstRow?.encodingMode === "CBR" || firstRow?.encodingMode === "CVBR") && (
                  <FieldGroup label="Bitrate Ceiling">
                    <div className="flex items-center gap-2">
                      <input type="number" value={firstRow?.targetBitrateMbps ?? 4} min={0.1} max={100} step={0.1}
                        onChange={e => state.rows.forEach(r =>
                          updateRow(r._rowId, { targetBitrateMbps: parseFloat(e.target.value) || 4 })
                        )}
                        className="h-9 w-full rounded-lg border border-amber-700/40 bg-zinc-800 px-3 font-mono text-sm text-amber-300 focus:border-amber-500 focus:outline-none" />
                      <span className="shrink-0 text-xs text-zinc-500">Mbps</span>
                    </div>
                  </FieldGroup>
                )}

                <FieldGroup label="Radio Type">
                  <Sel value={firstRow?.radioType ?? "wired"}
                    onChange={v => state.rows.forEach(r => updateRow(r._rowId, { radioType: v as CameraConfig["radioType"] }))}
                    options={RADIO_OPTIONS.map(o => ({ value: o.value, label: `${o.label} (${o.overhead})` }))} />
                </FieldGroup>

                <FieldGroup label="Recording Hours/day">
                  <div className="flex items-center gap-2">
                    <input type="number" value={firstRow?.recordingHoursPerDay ?? 24} min={1} max={24}
                      disabled={firstRow?.recordingMode !== "scheduled"}
                      onChange={e => state.rows.forEach(r =>
                        updateRow(r._rowId, { recordingHoursPerDay: Math.min(24, Math.max(1, parseInt(e.target.value) || 24)) })
                      )}
                      className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 font-mono text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none disabled:opacity-40" />
                    <span className="shrink-0 text-xs text-zinc-500">h</span>
                  </div>
                </FieldGroup>
              </div>
            </AdvancedSection>
          </StepCard>

          {/* ── STEP 4: Storage ── */}
          <StepCard step={4} title="Storage System">
            <StoragePlannerSection
              state={state}
              result={result}
              setStorageMode={setStorageMode}
              setManualStorage={setManualStorage}
              setOverheadMultiplier={setOverheadMultiplier}
            />
          </StepCard>

        </div>

        {/* ── RIGHT: Results — hidden on mobile when config tab active ── */}
        <div className={cn("mt-4 lg:mt-0 lg:w-[460px] lg:shrink-0", mobileTab === 'config' ? "hidden lg:block" : "block")}>
          <div className="sticky top-20">
            {error ? (
              <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-4 text-sm text-red-400">{error}</div>
            ) : result ? (
              <ResultsPanel result={result} configs={configs} onExport={handleExport} />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-800 text-sm text-zinc-600">
                Add cameras to see results
              </div>
            )}
          </div>
        </div>
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        exportState={exportState}
        exportError={exportError}
        onExport={meta => exportPdf(meta)}
      />
    </div>
  );
}

// ─── Camera Group Row ─────────────────────────────────────────────────────────

function CameraGroupRow({ row, totalRows, estimatedMbps, onUpdate, onRemove }: {
  row:           import("@/types/calculator").CameraRow;
  totalRows:     number;
  estimatedMbps: number | null;
  onUpdate:      (p: Partial<CameraConfig>) => void;
  onRemove:      () => void;
}) {
  const isManual = row.encodingMode === "CBR" && row.targetBitrateMbps !== null;
  const manualVal = row.targetBitrateMbps ?? 4;

  // Validation for manual bitrate
  const isTooHigh = isManual && manualVal > 50;
  const isTooLow  = isManual && manualVal <= 0;
  const isValid   = isManual && !isTooHigh && !isTooLow;

  function enableManual() {
    const seed = estimatedMbps ? parseFloat(estimatedMbps.toFixed(2)) : 4;
    onUpdate({ encodingMode: "CBR", targetBitrateMbps: seed });
  }

  function disableManual() {
    onUpdate({ encodingMode: "VBR", targetBitrateMbps: null });
  }

  return (
    <div className={cn(
      "rounded-xl border bg-zinc-900/50 overflow-hidden transition-colors",
      isManual ? "border-amber-700/30" : "border-zinc-800"
    )}>
      {/* Main row */}
      <div className="grid grid-cols-[1.5fr_1fr_70px_70px_36px] gap-2 items-center p-3">
        <Sel value={row.vendorId}
          onChange={v => onUpdate({ vendorId: v, modelId: null })}
          options={VENDOR_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />

        <Sel value={row.resolution}
          onChange={v => onUpdate({ resolution: v as CameraConfig["resolution"] })}
          options={RESOLUTION_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />

        <Sel value={String(row.fps)}
          onChange={v => onUpdate({ fps: parseInt(v) })}
          options={FPS_OPTIONS.map(f => ({ value: String(f), label: `${f} fps` }))} />

        <input type="number" value={row.quantity} min={1} max={1000}
          onChange={e => onUpdate({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
          className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 text-center font-mono text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none" />

        {totalRows > 1 ? (
          <button onClick={onRemove}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-red-950/50 hover:text-red-400 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        ) : <div className="w-9" />}
      </div>

      {/* Bitrate row */}
      <div className="flex items-center gap-3 border-t border-zinc-800/60 bg-zinc-900/30 px-3 py-2">
        {/* Mode toggle */}
        <div className="flex rounded-md border border-zinc-700 bg-zinc-900 p-0.5 text-[11px] font-medium shrink-0">
          <button
            onClick={disableManual}
            className={cn(
              "rounded px-2.5 py-1 transition-colors",
              !isManual ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Auto
          </button>
          <button
            onClick={enableManual}
            className={cn(
              "rounded px-2.5 py-1 transition-colors",
              isManual ? "bg-amber-600 text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Manual
          </button>
        </div>

        {/* Estimated bitrate (always shown) */}
        {estimatedMbps !== null && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span>Calculated:</span>
            <span className={cn("font-mono font-semibold", isManual ? "text-zinc-500" : "text-cyan-400")}>
              {estimatedMbps.toFixed(2)} Mbps
            </span>
          </div>
        )}

        {/* Manual input */}
        {isManual && (
          <>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400 shrink-0">
              <span className="font-medium">Override:</span>
              <div className="relative">
                <input
                  type="number"
                  value={manualVal}
                  min={0.01}
                  max={500}
                  step={0.1}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) onUpdate({ targetBitrateMbps: v });
                  }}
                  className={cn(
                    "h-7 w-20 rounded border pl-2 pr-8 font-mono text-xs focus:outline-none",
                    isTooHigh || isTooLow
                      ? "border-red-600/60 bg-red-950/20 text-red-300"
                      : "border-amber-700/50 bg-amber-950/20 text-amber-300 focus:border-amber-500"
                  )}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 pointer-events-none">
                  Mbps
                </span>
              </div>
            </div>

            {/* Validation message */}
            {isTooHigh && (
              <span className="text-[10px] text-red-400 shrink-0">⚠ Max 50 Mbps for surveillance</span>
            )}
            {isTooLow && (
              <span className="text-[10px] text-red-400 shrink-0">⚠ Must be greater than 0</span>
            )}
            {isValid && estimatedMbps !== null && (
              <span className="text-[10px] text-amber-500 shrink-0">
                {manualVal > estimatedMbps
                  ? `+${((manualVal / estimatedMbps - 1) * 100).toFixed(0)}% vs calculated`
                  : `-${((1 - manualVal / estimatedMbps) * 100).toFixed(0)}% vs calculated`
                }
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Storage Planner Section ─────────────────────────────────────────────────

const DRIVE_SIZES_TB = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20] as const;
const RAID_PROFILES  = ['RAID1', 'RAID5', 'RAID6', 'RAID10', 'JBOD'] as const;

function StoragePlannerSection({ state, result, setStorageMode, setManualStorage, setOverheadMultiplier }: {
  state:                CalculatorFormState;
  result:               import("@/lib/engine").SystemResult | null;
  setStorageMode:       (v: CalculatorFormState['storageMode']) => void;
  setManualStorage:     (v: Partial<ManualStorageConfig>) => void;
  setOverheadMultiplier: (v: number) => void;
}) {
  const isManual  = state.storageMode === 'manual';
  const rawTB     = result?.rawStorageTB ?? 0;
  const configs   = result ? undefined : undefined; // result already has hdd

  // Auto recommendation via realistic planner
  const autoRAID = result
    ? selectRealisticRAID(
        result.totalCameraCount,
        Math.max(...state.rows.map(r => r.retentionDays).concat([30])),
        rawTB,
        state.conservativeMode,
      )
    : 'RAID5' as const;

  const autoPlan = rawTB > 0
    ? planRealisticStorage(rawTB * state.storageOverheadMultiplier, autoRAID)
    : null;

  // Manual evaluation
  const manualEval = rawTB > 0 && isManual
    ? evaluateManualStorage({
        driveCount:      state.manualStorage.driveCount,
        driveCapacityTB: state.manualStorage.driveCapacityTB,
        raidProfile:     state.manualStorage.raidProfile,
        requiredRawTB:   rawTB * state.storageOverheadMultiplier,
      })
    : null;

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <span className="field-label">Storage Configuration</span>
        <div className="flex rounded-md border border-zinc-700 bg-zinc-900 p-0.5 text-[11px] font-medium">
          <button
            onClick={() => setStorageMode('auto')}
            className={cn(
              "rounded px-3 py-1.5 transition-colors",
              !isManual ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Auto
          </button>
          <button
            onClick={() => setStorageMode('manual')}
            className={cn(
              "rounded px-3 py-1.5 transition-colors",
              isManual ? "bg-amber-600 text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Manual
          </button>
        </div>
      </div>

      {/* Storage Overhead buttons — always visible */}
      <FieldGroup label="Storage Overhead">
        <div className="flex gap-1">
          {[10, 15, 20, 25, 30].map(v => (
            <button key={v} onClick={() => setOverheadMultiplier(1 + v / 100)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-mono font-medium transition-colors",
                Math.round((state.storageOverheadMultiplier - 1) * 100) === v
                  ? "bg-cyan-600 text-zinc-950 font-bold"
                  : "border border-zinc-700 bg-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              )}>
              {v}%
            </button>
          ))}
        </div>
        <div className="mt-1 text-[11px] text-zinc-600">Filesystem + safety margin</div>
      </FieldGroup>

      {/* ── AUTO: show recommendation ── */}
      {!isManual && autoPlan && (
        <div className="rounded-xl border border-cyan-800/30 bg-cyan-950/15 p-4 space-y-3">
          {/* Primary recommendation */}
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1.5" style={{direction:"ltr",unicodeBidi:"embed"}}>
              <span className="font-mono text-3xl font-bold text-zinc-100">{autoPlan.driveCount}</span>
              <span className="text-zinc-500">×</span>
              <span className="font-mono text-3xl font-bold text-cyan-300">{autoPlan.driveCapacityTB} TB</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="rounded-md border border-cyan-700/40 bg-cyan-950/30 px-2 py-0.5 text-xs font-bold text-cyan-400">
                {autoPlan.raidProfile}
              </span>
              {autoPlan.isPreferredBay && (
                <span className="text-[10px] text-zinc-500">{autoPlan.bayCount}-bay chassis</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-2">
              <div className="text-[10px] text-zinc-600 mb-0.5">Usable</div>
              <div className="font-mono text-sm font-bold text-zinc-200"
                style={{direction:"ltr",unicodeBidi:"embed"}}>
                {autoPlan.usableCapacityTB} TB
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-2">
              <div className="text-[10px] text-zinc-600 mb-0.5">Utilization</div>
              <div className={cn(
                "font-mono text-sm font-bold",
                autoPlan.utilizationPct > 85 ? "text-amber-400" : "text-emerald-400"
              )} style={{direction:"ltr",unicodeBidi:"embed"}}>
                {autoPlan.utilizationPct}%
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-2">
              <div className="text-[10px] text-zinc-600 mb-0.5">Surplus</div>
              <div className="font-mono text-sm font-bold text-zinc-400"
                style={{direction:"ltr",unicodeBidi:"embed"}}>
                +{autoPlan.surplusTB} TB
              </div>
            </div>
          </div>

          {/* Rationale */}
          <div className="flex items-start gap-2 text-[11px] text-zinc-500">
            <span className="shrink-0 text-cyan-600 mt-0.5">ℹ</span>
            <span>{autoPlan.rationale}</span>
          </div>
        </div>
      )}

      {!isManual && !autoPlan && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center text-sm text-zinc-600">
          Add cameras to see storage recommendation
        </div>
      )}

      {/* ── MANUAL: editable inputs + validation ── */}
      {isManual && (
        <div className={cn(
          "rounded-xl border p-4 space-y-4",
          manualEval && !manualEval.isValid
            ? "border-red-800/40 bg-red-950/10"
            : "border-amber-700/30 bg-amber-950/10"
        )}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FieldGroup label="RAID Level">
              <Sel
                value={state.manualStorage.raidProfile}
                onChange={v => setManualStorage({ raidProfile: v as import("@/lib/engine").RAIDProfile })}
                options={RAID_PROFILES.map(r => ({
                  value: r,
                  label: r === 'JBOD' ? 'JBOD (No RAID)' : r,
                }))}
              />
            </FieldGroup>

            <FieldGroup label="Drive Count">
              <input
                type="number"
                value={state.manualStorage.driveCount}
                min={1} max={24}
                onChange={e => setManualStorage({ driveCount: Math.min(24, Math.max(1, parseInt(e.target.value) || 1)) })}
                className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-center font-mono text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
              />
            </FieldGroup>

            <FieldGroup label="Drive Size">
              <Sel
                value={String(state.manualStorage.driveCapacityTB)}
                onChange={v => setManualStorage({ driveCapacityTB: parseInt(v) })}
                options={DRIVE_SIZES_TB.map(s => ({ value: String(s), label: `${s} TB` }))}
              />
            </FieldGroup>
          </div>

          {/* Manual evaluation results */}
          {manualEval && (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-2">
                  <div className="text-[10px] text-zinc-600 mb-0.5">Usable</div>
                  <div className="font-mono text-sm font-bold text-zinc-200"
                    style={{direction:"ltr",unicodeBidi:"embed"}}>
                    {manualEval.usableCapacityTB} TB
                  </div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-2">
                  <div className="text-[10px] text-zinc-600 mb-0.5">Utilization</div>
                  <div className={cn(
                    "font-mono text-sm font-bold",
                    manualEval.utilizationPct > 90 ? "text-red-400" :
                    manualEval.utilizationPct > 75 ? "text-amber-400" : "text-emerald-400"
                  )} style={{direction:"ltr",unicodeBidi:"embed"}}>
                    {manualEval.utilizationPct}%
                  </div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-2">
                  <div className="text-[10px] text-zinc-600 mb-0.5">Surplus</div>
                  <div className={cn(
                    "font-mono text-sm font-bold",
                    manualEval.surplusTB < 0 ? "text-red-400" : "text-zinc-400"
                  )} style={{direction:"ltr",unicodeBidi:"embed"}}>
                    {manualEval.surplusTB >= 0 ? '+' : ''}{manualEval.surplusTB} TB
                  </div>
                </div>
              </div>

              {/* Validation warnings */}
              {manualEval.warnings.length > 0 && (
                <div className="space-y-1.5">
                  {manualEval.warnings.map((w, i) => (
                    <div key={i} className={cn(
                      "flex items-start gap-2 rounded-lg px-3 py-2 text-[11px]",
                      manualEval.isValid
                        ? "border border-amber-700/30 bg-amber-950/20 text-amber-400"
                        : "border border-red-700/30 bg-red-950/20 text-red-400"
                    )}>
                      <span className="shrink-0">{manualEval.isValid ? "⚠" : "⛔"}</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Advanced Section accordion ───────────────────────────────────────────────

function AdvancedSection({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 rounded-xl border border-zinc-800 overflow-hidden">
      <button onClick={() => { if (!open) analytics.advancedOptionsOpened(); setOpen(v => !v); }}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors">
        <div className="flex items-center gap-2">
          <Settings2 className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400">{label}</span>
          {!open && (
            <span className="text-[10px] text-zinc-600">
              Encoding · Radio type · Manual bitrate · Recording hours
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-zinc-600" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-zinc-600" />
        }
      </button>
      {open && (
        <div className="border-t border-zinc-800 px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function StepCard({ step, title, children }: {
  step: number; title: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-zinc-800/60 px-4 py-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/10 ring-1 ring-cyan-500/30 font-mono text-xs font-bold text-cyan-400">
          {step}
        </div>
        <span className="text-sm font-semibold text-zinc-100">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Sel({ value, onChange, options }: {
  value:    string;
  onChange: (v: string) => void;
  options:  { value: string; label: string }[];
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-9 w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-colors cursor-pointer">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

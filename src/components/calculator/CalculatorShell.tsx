"use client";

import { useState, useMemo } from "react";
import { FileDown, Languages, Plus, Trash2, ChevronDown, ChevronUp, Info, Wifi, Radio, Cpu } from "lucide-react";
import { calculate, generateRecommendation } from "@/lib/engine";
import type { CameraConfig, RAIDProfile } from "@/lib/engine";
import { useCalculator } from "@/hooks/useCalculator";
import { useLocale }     from "@/i18n/LocaleContext";
import { usePdfExport }  from "@/lib/pdf/export";
import { ExportModal }   from "./ExportModal";
import { ResultsPanel }  from "./ResultsPanel";
import { cn }            from "@/lib/utils";
import { SCENARIO_PRESETS } from "@/lib/presets";
import { RESOLUTION_OPTIONS, CODEC_OPTIONS, VENDOR_OPTIONS } from "@/lib/constants";
import type { CalculatorFormState } from "@/types/calculator";

// ── RAID options with engineering specs ───────────────────────────────────────
const RAID_OPTIONS: { value: RAIDProfile | "auto"; label: string; usable: string; overhead: string; note: string }[] = [
  { value: "auto",   label: "Auto (Recommended)", usable: "—",    overhead: "—",   note: "Engine selects based on camera count" },
  { value: "RAID5",  label: "RAID 5",             usable: "80%",  overhead: "20%", note: "Best balance — 1 disk fault tolerance" },
  { value: "RAID6",  label: "RAID 6",             usable: "67%",  overhead: "33%", note: "Enterprise — 2 disk fault tolerance" },
  { value: "RAID10", label: "RAID 10",            usable: "50%",  overhead: "50%", note: "High performance — stripe + mirror" },
  { value: "RAID1",  label: "RAID 1",             usable: "50%",  overhead: "50%", note: "Simple mirror — 2 drives only" },
  { value: "JBOD",   label: "JBOD (No RAID)",     usable: "100%", overhead: "0%",  note: "⚠ No redundancy — not recommended" },
];

// ── Radio type options ────────────────────────────────────────────────────────
const RADIO_OPTIONS = [
  { value: "wired",  label: "Wired",   icon: "🔌", overhead: "+0%",  desc: "802.3af/at PoE" },
  { value: "wifi",   label: "Wi-Fi",   icon: "📶", overhead: "+15%", desc: "Higher retry rate" },
  { value: "4g5g",   label: "4G / 5G", icon: "📡", overhead: "+25%", desc: "Variable latency" },
  { value: "mesh",   label: "Mesh",    icon: "🔗", overhead: "+20%", desc: "Multi-hop overhead" },
] as const;

// ── Scene options ─────────────────────────────────────────────────────────────
const SCENE_OPTIONS = [
  { value: "minimal", label: "Minimal",  desc: "Server room, ATM" },
  { value: "low",     label: "Low",      desc: "Empty corridor" },
  { value: "medium",  label: "Medium",   desc: "Typical office" },
  { value: "high",    label: "High",     desc: "Busy street" },
  { value: "extreme", label: "Extreme",  desc: "IR night, crowds" },
] as const;

const RECORDING_OPTIONS = [
  { value: "continuous",      label: "Continuous 24/7", desc: "No schedule" },
  { value: "scheduled",       label: "Scheduled",       desc: "Set hours" },
  { value: "motion_only",     label: "Motion Only",     desc: "Events only" },
  { value: "motion_adaptive", label: "Motion Adaptive", desc: "Smart bitrate" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

export function CalculatorShell() {
  const {
    state, result, error,
    addRow, removeRow, updateRow, duplicateRow,
    setConservativeMode, setOverheadMultiplier, setRaidOverride,
  } = useCalculator();

  const { dict, toggleLocale } = useLocale();
  const configs: CameraConfig[] = useMemo(
    () => state.rows.map(({ _rowId: _, ...cfg }) => cfg),
    [state.rows]
  );
  const recommendation = useMemo(() => {
    if (!result) return null;
    try { return generateRecommendation({ result, configs }); }
    catch { return null; }
  }, [result, configs]);

  const { exportState, exportError, exportPdf, reset } = usePdfExport({ result, configs });
  const [exportOpen, setExportOpen] = useState(false);

  function handleExport() { if (!result) return; reset(); setExportOpen(true); }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-zinc-100 font-sans">

      {/* ── Top nav ── */}
      <nav className="sticky top-0 z-20 border-b border-zinc-800/60 bg-[#0a0f1a]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-500/30">
              <span className="font-mono text-sm font-bold text-cyan-400">C</span>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-100 leading-none">Camora</div>
              <div className="text-[10px] text-zinc-500 leading-none mt-0.5">Storage Calculator</div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-sm">
            {["Calculator","Recommendations","Resources","About"].map((item, i) => (
              <button key={item} className={cn(
                "px-4 py-1.5 rounded-md text-sm transition-colors",
                i === 0 ? "text-cyan-400 border-b-2 border-cyan-400 rounded-none" : "text-zinc-500 hover:text-zinc-300"
              )}>{item}</button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleLocale} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
              <Languages className="h-3.5 w-3.5" />
              {dict.header.langToggle}
            </button>
            <button onClick={handleExport} disabled={!result}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                result ? "bg-cyan-600 text-zinc-950 hover:bg-cyan-500" : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              )}>
              <FileDown className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main layout ── */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:flex lg:gap-6">

        {/* ── LEFT: Steps ── */}
        <div className="flex-1 space-y-4 lg:max-w-[640px]">

          {/* STEP 1: Scenario */}
          <StepCard step={1} title="Select Scenario" desc="Choose a scenario or create a custom configuration">
            {/* Preset dropdown */}
            <div className="mb-3">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-3.5 py-2.5 cursor-pointer">
                <span className="text-base">🛍</span>
                <span className="flex-1 text-sm font-medium text-zinc-200">Select scenario...</span>
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </div>
            </div>
            {/* Quick preset cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SCENARIO_PRESETS.slice(0, 4).map(preset => (
                <button key={preset.id}
                  onClick={() => {
                    const patch: Partial<CameraConfig> = {};
                    if (preset.motionPercent !== undefined) patch.motionPercent = preset.motionPercent;
                    if (preset.sceneComplexity !== undefined) patch.sceneComplexity = preset.sceneComplexity;
                    if (preset.codec !== undefined) patch.codec = preset.codec;
                    if (preset.fps !== undefined) patch.fps = preset.fps;
                    if (preset.recordingMode !== undefined) patch.recordingMode = preset.recordingMode;
                    state.rows.forEach(row => updateRow(row._rowId, patch));
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 hover:border-cyan-700/50 hover:bg-cyan-950/20 transition-all">
                  <span className="text-xl">{preset.icon}</span>
                  <span className="text-[11px] font-semibold text-zinc-300 text-center leading-tight">{preset.label}</span>
                  <span className="text-[9px] text-zinc-600 text-center">{preset.description.slice(0, 25)}...</span>
                </button>
              ))}
              <button className="flex flex-col items-center justify-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 hover:border-zinc-600 transition-colors text-zinc-500 hover:text-zinc-300">
                <span className="text-lg">···</span>
                <span className="text-[10px]">More</span>
              </button>
            </div>
          </StepCard>

          {/* STEP 2: Camera Configuration */}
          <StepCard step={2} title="Camera Configuration" desc="Add your cameras and select radio type (affects required storage)">
            {/* Camera table header */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_80px_70px_120px_40px] gap-3 mb-2 px-1">
              {["Camera Type","Resolution","FPS","Qty","Radio Type",""].map(h => (
                <div key={h} className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{h}</div>
              ))}
            </div>

            {/* Camera rows */}
            <div className="space-y-2">
              {state.rows.map((row, idx) => (
                <div key={row._rowId} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_80px_70px_120px_40px] gap-2 sm:gap-3 items-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                  {/* Camera type / vendor */}
                  <NativeSelect value={row.vendorId}
                    onChange={v => updateRow(row._rowId, { vendorId: v, modelId: null })}
                    options={VENDOR_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />

                  {/* Resolution */}
                  <NativeSelect value={row.resolution}
                    onChange={v => updateRow(row._rowId, { resolution: v as CameraConfig['resolution'] })}
                    options={RESOLUTION_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />

                  {/* FPS */}
                  <NativeSelect value={String(row.fps)}
                    onChange={v => updateRow(row._rowId, { fps: parseInt(v) })}
                    options={[5,10,15,20,25,30].map(f => ({ value: String(f), label: String(f) }))} />

                  {/* Quantity */}
                  <input type="number" value={row.quantity} min={1} max={500}
                    onChange={e => updateRow(row._rowId, { quantity: Math.max(1, parseInt(e.target.value)||1) })}
                    className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 font-mono text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none text-center" />

                  {/* Radio type */}
                  <NativeSelect value={row.radioType ?? 'wired'}
                    onChange={v => updateRow(row._rowId, { radioType: v as CameraConfig['radioType'] })}
                    options={RADIO_OPTIONS.map(o => ({ value: o.value, label: `${o.icon} ${o.label} (${o.overhead})` }))} />

                  {/* Delete */}
                  {state.rows.length > 1 ? (
                    <button onClick={() => removeRow(row._rowId)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-red-950 hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : <div />}
                </div>
              ))}
            </div>

            <button onClick={addRow}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2.5 text-sm text-zinc-500 hover:border-cyan-600/50 hover:text-cyan-400 transition-colors">
              <Plus className="h-4 w-4" /> Add Another Camera
            </button>

            {/* Radio type info banner */}
            {state.rows.some(r => (r.radioType ?? 'wired') !== 'wired') && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-cyan-800/30 bg-cyan-950/20 px-4 py-3">
                <Info className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                <p className="text-xs text-cyan-300/80">
                  Radio Type Impact: {RADIO_OPTIONS.filter(r => r.value !== 'wired').map(r => `${r.label} cameras require ${r.overhead} more storage`).join('; ')} due to higher retry rates and network overhead.
                </p>
              </div>
            )}
          </StepCard>

          {/* STEP 3: Recording & Compression */}
          <StepCard step={3} title="Recording & Compression" desc="Configure how and how long you want to record">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Codec */}
              <div>
                <label className="field-label">Codec</label>
                <NativeSelect value={state.rows[0]?.codec ?? 'H.265+'}
                  onChange={v => state.rows.forEach(r => updateRow(r._rowId, { codec: v as CameraConfig['codec'] }))}
                  options={CODEC_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                  note={CODEC_OPTIONS.find(c => c.value === (state.rows[0]?.codec ?? 'H.265+'))?.description} />
              </div>

              {/* Scene complexity */}
              <div>
                <label className="field-label">Scene Complexity <Info className="inline h-3 w-3 text-zinc-600" /></label>
                <NativeSelect value={state.rows[0]?.sceneComplexity ?? 'medium'}
                  onChange={v => state.rows.forEach(r => updateRow(r._rowId, { sceneComplexity: v as CameraConfig['sceneComplexity'] }))}
                  options={SCENE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                  note={SCENE_OPTIONS.find(s => s.value === (state.rows[0]?.sceneComplexity ?? 'medium'))?.desc} />
              </div>

              {/* Encoding mode */}
              <div>
                <label className="field-label">Encoding Mode</label>
                <NativeSelect value={state.rows[0]?.encodingMode ?? 'VBR'}
                  onChange={v => state.rows.forEach(r => updateRow(r._rowId, { encodingMode: v as CameraConfig['encodingMode'] }))}
                  options={[
                    { value: "VBR",  label: "VBR" },
                    { value: "CBR",  label: "CBR" },
                    { value: "CVBR", label: "CVBR" },
                  ]}
                  note={state.rows[0]?.encodingMode === 'VBR' ? 'Variable Bitrate' : state.rows[0]?.encodingMode === 'CBR' ? 'Constant Bitrate' : 'Capped VBR'} />
              </div>

              {/* Recording mode */}
              <div>
                <label className="field-label">Recording Mode</label>
                <NativeSelect value={state.rows[0]?.recordingMode ?? 'continuous'}
                  onChange={v => state.rows.forEach(r => updateRow(r._rowId, { recordingMode: v as CameraConfig['recordingMode'] }))}
                  options={RECORDING_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                  note={RECORDING_OPTIONS.find(r => r.value === (state.rows[0]?.recordingMode ?? 'continuous'))?.desc} />
              </div>

              {/* Retention */}
              <div>
                <label className="field-label">Retention Period</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={state.rows[0]?.retentionDays ?? 30} min={1} max={365}
                    onChange={e => state.rows.forEach(r => updateRow(r._rowId, { retentionDays: Math.max(1, parseInt(e.target.value)||30) }))}
                    className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 font-mono text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none" />
                  <span className="text-xs text-zinc-500 shrink-0">Days</span>
                </div>
              </div>

              {/* Motion % */}
              <div className="col-span-2 sm:col-span-3">
                <label className="field-label">Motion Percentage</label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="relative flex-1 h-2 bg-zinc-800 rounded-full">
                    <div
                      className="absolute left-0 top-0 h-full bg-cyan-500 rounded-full"
                      style={{ width: `${state.rows[0]?.motionPercent ?? 30}%` }} />
                    <input type="range" min={0} max={100} step={5}
                      value={state.rows[0]?.motionPercent ?? 30}
                      onChange={e => state.rows.forEach(r => updateRow(r._rowId, { motionPercent: parseInt(e.target.value) }))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-2" />
                  </div>
                  <span className="font-mono text-sm font-bold text-cyan-400 w-10 text-right">
                    {state.rows[0]?.motionPercent ?? 30}%
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                  {['0%','25%','50%','75%','100%'].map(v => <span key={v}>{v}</span>)}
                </div>
              </div>
            </div>
          </StepCard>

          {/* STEP 4: Storage System */}
          <StepCard step={4} title="Storage System" desc="Select your RAID type and storage preferences">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* RAID Level */}
              <div>
                <label className="field-label">RAID Level <Info className="inline h-3 w-3 text-zinc-600" /></label>
                <NativeSelect
                  value={state.raidOverride ?? 'auto'}
                  onChange={v => setRaidOverride(v as CalculatorFormState['raidOverride'])}
                  options={RAID_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                  note={RAID_OPTIONS.find(r => r.value === (state.raidOverride ?? 'auto'))?.note} />
              </div>

              {/* Usable capacity % */}
              <div>
                <label className="field-label">Usable Capacity <Info className="inline h-3 w-3 text-zinc-600" /></label>
                <div className="flex h-9 items-center rounded-lg border border-zinc-700 bg-zinc-800 px-3 gap-2">
                  <span className="font-mono text-sm text-cyan-300 font-bold">
                    {RAID_OPTIONS.find(r => r.value === (state.raidOverride ?? 'auto'))?.usable ?? '—'}
                  </span>
                  <span className="text-xs text-zinc-500">After RAID &amp; file system</span>
                </div>
              </div>

              {/* Overhead */}
              <div>
                <label className="field-label">Overhead <Info className="inline h-3 w-3 text-zinc-600" /></label>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 flex-1 items-center rounded-lg border border-zinc-700 bg-zinc-800 px-3">
                    <span className="font-mono text-sm text-zinc-300">
                      {(state.storageOverheadMultiplier - 1) * 100}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 shrink-0">%</span>
                </div>
                <div className="mt-2 flex gap-1">
                  {[10,15,20,25,30].map(v => (
                    <button key={v} onClick={() => setOverheadMultiplier(1 + v/100)}
                      className={cn(
                        "flex-1 rounded-md py-1 text-[10px] font-mono transition-colors",
                        Math.round((state.storageOverheadMultiplier - 1) * 100) === v
                          ? "bg-cyan-600 text-zinc-950 font-bold"
                          : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                      )}>{v}%</button>
                  ))}
                </div>
              </div>
            </div>
          </StepCard>

          {/* STEP 5: Drive Preferences */}
          <StepCard step={5} title="Drive Preferences" desc="Choose drive type to get exact recommendations" optional>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="field-label">Drive Type</label>
                <NativeSelect value="surveillance"
                  onChange={() => {}}
                  options={[
                    { value: "surveillance", label: "Surveillance (24/7)" },
                    { value: "enterprise",   label: "Enterprise NAS" },
                    { value: "desktop",      label: "Desktop (Not Recommended)" },
                  ]}
                  note="Designed for continuous recording" />
              </div>
              <div>
                <label className="field-label">Drive Capacity</label>
                <NativeSelect value="auto"
                  onChange={() => {}}
                  options={["auto","2","4","6","8","10","12","16","20"].map(v => ({
                    value: v, label: v === "auto" ? "Auto" : `${v} TB`
                  }))}
                  note="Per hard drive" />
              </div>
              <div>
                <label className="field-label">Brand Preference</label>
                <NativeSelect value="any"
                  onChange={() => {}}
                  options={[
                    { value: "any",     label: "Any" },
                    { value: "seagate", label: "Seagate" },
                    { value: "wd",      label: "Western Digital" },
                  ]}
                  note="We'll recommend best options" />
              </div>
            </div>
          </StepCard>

          {/* Calculate button */}
          <div className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 p-px">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 py-4 text-sm font-bold text-zinc-950 hover:opacity-90 transition-opacity">
              <Cpu className="h-4 w-4" />
              Calculate Storage
            </button>
          </div>

          {/* About Radio Type */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-cyan-500" />
              <span className="text-sm font-semibold text-zinc-300">About Radio Type</span>
            </div>
            <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
              Radio type affects storage because wireless cameras (Wi-Fi, Mesh, 4G/5G) have higher packet loss and retransmission rates, which increases the required bitrate and storage.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {RADIO_OPTIONS.map(r => (
                <div key={r.value} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 text-center">
                  <div className="text-lg mb-1">{r.icon}</div>
                  <div className="text-xs font-semibold text-zinc-300">{r.label}</div>
                  <div className="text-xs text-cyan-400 font-mono mt-0.5">{r.overhead} storage</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="mt-6 lg:mt-0 lg:w-[460px] lg:shrink-0">
          <div className="sticky top-20">
            {error ? (
              <div className="rounded-xl border border-red-800/50 bg-red-950/20 p-4 text-sm text-red-400">{error}</div>
            ) : result ? (
              <ResultsPanel result={result} configs={configs} onExport={handleExport} />
            ) : (
              <div className="flex h-60 items-center justify-center rounded-xl border border-zinc-800 text-sm text-zinc-600">
                Configure cameras to see results
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export modal */}
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        exportState={exportState}
        exportError={exportError}
        onExport={(meta) => exportPdf(meta)}
      />
    </div>
  );
}

// ─── Reusable atoms ───────────────────────────────────────────────────────────

function StepCard({ step, title, desc, children, optional }: {
  step: number; title: string; desc: string; children: React.ReactNode; optional?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-zinc-800/60 px-4 py-3.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-500/30 font-mono text-xs font-bold text-cyan-400">
          {step}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">{title}</span>
            {optional && (
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 border border-zinc-700">Optional</span>
            )}
          </div>
          <div className="text-[11px] text-zinc-500 truncate">{desc}</div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function NativeSelect({ value, onChange, options, note }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  note?: string;
}) {
  return (
    <div>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 h-9 w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 pr-8 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzcxNzE3YSIgZD0iTTcgMTBsNSA1IDUtNXoiLz48L3N2Zz4=')] bg-no-repeat bg-[right_8px_center] cursor-pointer">
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {note && <div className="mt-1 text-[11px] text-zinc-600 truncate">{note}</div>}
    </div>
  );
}

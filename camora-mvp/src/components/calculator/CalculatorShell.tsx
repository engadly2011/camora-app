"use client";

import { useState, useMemo } from "react";
import { Plus, Settings2, Languages, FileDown } from "lucide-react";
import { generateRecommendation }  from "@/lib/engine";
import type { CameraConfig }       from "@/lib/engine";
import { useCalculator }           from "@/hooks/useCalculator";
import { useLocale }               from "@/i18n/LocaleContext";
import { usePdfExport }            from "@/lib/pdf/export";
import { CameraRow }               from "./CameraRow";
import { ResultsPanel }            from "./ResultsPanel";
import { ExportModal }             from "./ExportModal";
import { RecommendationPanel }     from "./RecommendationPanel";
import { Toggle }                  from "@/components/ui/Toggle";
import { cn }                      from "@/lib/utils";

type RightPane = "results" | "recommendations";

export function CalculatorShell() {
  const { state, result, error, addRow, removeRow, updateRow, duplicateRow, setConservativeMode, setOverheadMultiplier } = useCalculator();
  const { dict, dir, toggleLocale } = useLocale();
  const t = dict;

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
  const [rightPane,  setRightPane]  = useState<RightPane>("results");

  const criticalCount = recommendation?.advisories.filter((a) => a.level === "critical").length ?? 0;

  function handleOpenExport() { if (!result) return; reset(); setExportOpen(true); }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100 overflow-hidden" dir={dir}>

      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-800/80 bg-zinc-950/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10 ring-1 ring-cyan-500/30">
            <span className="text-[11px] font-bold text-cyan-400">C</span>
          </div>
          <span className="text-sm font-semibold text-zinc-100">Camora</span>
          <span className="text-zinc-700">/</span>
          <span className="text-xs text-zinc-500">{t.shared.tagline}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {result && (
            <span className="hidden font-mono text-xs text-zinc-500 sm:block">
              {result.totalCameraCount} {t.shared.cameras}
            </span>
          )}
          <button
            onClick={handleOpenExport}
            disabled={!result}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
              result ? "border-zinc-700 text-zinc-300 hover:border-cyan-600/60 hover:text-cyan-300"
                     : "border-zinc-800 text-zinc-700 cursor-not-allowed"
            )}
          >
            <FileDown className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
          <button
            onClick={toggleLocale}
            className="rounded-lg border border-zinc-800 px-2 py-1.5 text-xs text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
          >
            {t.header.langToggle}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: config */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl space-y-4 px-4 py-5 sm:px-6">

            {/* Engine options */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                  {t.engineOptions.title}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Toggle
                  label={t.engineOptions.conservativeMode}
                  description={t.engineOptions.conservativeModeDesc}
                  checked={state.conservativeMode}
                  onChange={setConservativeMode}
                />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                    {t.engineOptions.storageOverhead}
                  </span>
                  <div className="flex gap-1.5">
                    {[1.10, 1.15, 1.20, 1.25, 1.30].map((v) => (
                      <button
                        key={v}
                        onClick={() => setOverheadMultiplier(v)}
                        className={cn(
                          "flex-1 rounded-lg border py-1.5 font-mono text-xs transition-colors",
                          state.storageOverheadMultiplier === v
                            ? "border-cyan-600 bg-cyan-950/60 text-cyan-300"
                            : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700"
                        )}
                      >
                        {((v - 1) * 100).toFixed(0)}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Camera rows */}
            <div className="space-y-3">
              {state.rows.map((row, idx) => (
                <CameraRow
                  key={row._rowId}
                  row={row}
                  index={idx}
                  totalRows={state.rows.length}
                  onUpdate={(patch) => updateRow(row._rowId, patch)}
                  onRemove={() => removeRow(row._rowId)}
                  onDuplicate={() => duplicateRow(row._rowId)}
                />
              ))}
            </div>

            <button
              onClick={addRow}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 py-3 text-sm text-zinc-600 hover:border-cyan-700/50 hover:bg-cyan-950/10 hover:text-cyan-400 transition-all"
            >
              <Plus className="h-4 w-4 shrink-0" />
              {t.cameraRow.addGroup}
            </button>
          </div>
        </div>

        {/* Right: results + recommendations */}
        <div className="hidden w-[480px] shrink-0 overflow-hidden border-l border-zinc-800/60 lg:flex lg:flex-col">
          {/* Pane tabs */}
          <div className="flex shrink-0 border-b border-zinc-800">
            {(["results", "recommendations"] as RightPane[]).map((pane) => (
              <button
                key={pane}
                onClick={() => setRightPane(pane)}
                disabled={pane === "recommendations" && !recommendation}
                className={cn(
                  "relative flex-1 py-2.5 text-xs font-medium capitalize transition-colors",
                  rightPane === pane ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300",
                  pane === "recommendations" && !recommendation && "opacity-40 cursor-not-allowed"
                )}
              >
                {pane}
                {pane === "recommendations" && criticalCount > 0 && (
                  <span className="ms-1.5 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                    {criticalCount}
                  </span>
                )}
                {rightPane === pane && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-500" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {error ? (
              <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : !result ? (
              <div className="flex h-40 items-center justify-center rounded-xl border border-zinc-800 text-sm text-zinc-600">
                {t.results.configurePrompt}
              </div>
            ) : rightPane === "results" ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">Results</span>
                  <button onClick={handleOpenExport} className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-500 hover:text-cyan-400 transition-colors">
                    <FileDown className="h-3 w-3" /> Export PDF
                  </button>
                </div>
                <ResultsPanel result={result} configs={configs} />
              </>
            ) : recommendation ? (
              <RecommendationPanel rec={recommendation} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile bottom pane */}
      <div className="lg:hidden border-t border-zinc-800 max-h-[45vh] overflow-y-auto px-4 py-4">
        {result && rightPane === "results" && <ResultsPanel result={result} configs={configs} />}
        {recommendation && rightPane === "recommendations" && <RecommendationPanel rec={recommendation} />}
      </div>

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

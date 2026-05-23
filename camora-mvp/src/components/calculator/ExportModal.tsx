"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ExportModal — collects report metadata before triggering PDF generation.
// Now pre-fills from the project's saved exportMeta (eliminating re-entry).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { X, FileDown, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExportState } from '@/lib/pdf/export';
import type { ReportMeta }  from '@/lib/pdf/schema';

export interface ExportMetaInit {
  projectName: string;
  preparedBy:  string;
  clientName:  string;
  reference:   string;
}

interface ExportModalProps {
  open:         boolean;
  onClose:      () => void;
  exportState:  ExportState;
  exportError:  string | null;
  onExport:     (meta: Partial<ReportMeta>) => void;
  initialMeta?: ExportMetaInit;
}

export function ExportModal({
  open, onClose, exportState, exportError, onExport, initialMeta,
}: ExportModalProps) {
  const firstInput = useRef<HTMLInputElement>(null);

  const [projectName, setProjectName] = useState(initialMeta?.projectName ?? "CCTV System Design");
  const [preparedBy,  setPreparedBy]  = useState(initialMeta?.preparedBy  ?? "");
  const [clientName,  setClientName]  = useState(initialMeta?.clientName  ?? "");
  const [reference,   setReference]   = useState(initialMeta?.reference   ?? "");

  // Sync from initialMeta whenever the modal opens (project may have changed)
  useEffect(() => {
    if (open && initialMeta) {
      setProjectName(initialMeta.projectName);
      setPreparedBy(initialMeta.preparedBy);
      setClientName(initialMeta.clientName);
      setReference(initialMeta.reference);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) setTimeout(() => firstInput.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const busy = exportState === "generating";
  const done = exportState === "done";
  const err  = exportState === "error";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    onExport({ projectName, preparedBy, clientName, reference });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      aria-modal="true"
      role="dialog"
      aria-label="Export PDF report"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className={cn(
        "relative z-10 w-full max-w-md rounded-2xl border border-zinc-700",
        "bg-zinc-900 shadow-2xl shadow-black/60",
        "mx-4 mb-4 sm:mb-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <FileDown className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-zinc-100">Export Engineering Report</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <Field label="Project name" required>
            <input
              ref={firstInput}
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="CCTV System Design"
              disabled={busy}
              className={inputCls}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prepared by">
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="Company / Engineer"
                disabled={busy}
                className={inputCls}
              />
            </Field>
            <Field label="Client / Customer">
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="End client name"
                disabled={busy}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Reference number">
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. CAM-2025-001"
              disabled={busy}
              className={inputCls}
            />
          </Field>

          <p className="text-[11px] leading-relaxed text-zinc-500">
            Generates a PDF on your device. No data is sent to any server.
            Report includes cover page, camera groups, storage, NVR throughput,
            bandwidth and engineering warnings.
          </p>

          {err && exportError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-700/40 bg-red-950/30 px-3 py-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-xs text-red-400">{exportError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-700 bg-transparent py-2.5 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                done
                  ? "border border-emerald-600 bg-emerald-950/50 text-emerald-400"
                  : err
                  ? "border border-red-700 bg-red-950/40 text-red-400 hover:bg-red-950"
                  : "border border-cyan-600 bg-cyan-600 text-zinc-950 hover:bg-cyan-500",
                busy && "cursor-not-allowed opacity-70"
              )}
            >
              {busy ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating PDF…</>
              ) : done ? (
                <><CheckCircle2 className="h-4 w-4" /> Downloaded!</>
              ) : err ? (
                <>Retry export</>
              ) : (
                <><FileDown className="h-4 w-4" /> Download PDF</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = cn(
  "h-9 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3",
  "text-sm text-zinc-100 placeholder:text-zinc-600",
  "focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "transition-colors duration-150"
);

function Field({ label, children, required }: {
  label:    string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
        {label}{required && <span className="ml-0.5 text-cyan-500">*</span>}
      </label>
      {children}
    </div>
  );
}

"use client";

// ─────────────────────────────────────────────────────────────────────────────
// usePdfExport hook
//
// Owns the export lifecycle:
//   idle → generating → done/error
// Handles filename generation, modal prompt for meta fields,
// and the browser download trigger.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import type { SystemResult, CameraConfig } from '@/lib/engine';
import { buildReportDocument, type ReportMeta } from './schema';

export type ExportState = "idle" | "generating" | "done" | "error";

export interface UsePdfExportReturn {
  exportState:  ExportState;
  exportError:  string | null;
  exportPdf:    (meta?: Partial<ReportMeta>) => Promise<void>;
  reset:        () => void;
}

function generateFilename(meta: Pick<ReportMeta, "projectName" | "reportDate">): string {
  const slug = meta.projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const date = new Date().toISOString().slice(0, 10);
  return `camora-report-${slug}-${date}.pdf`;
}

interface UsePdfExportOptions {
  result:  SystemResult | null;
  configs: CameraConfig[];
}

export function usePdfExport({ result, configs }: UsePdfExportOptions): UsePdfExportReturn {
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [exportError, setExportError] = useState<string | null>(null);

  const exportPdf = useCallback(async (meta: Partial<ReportMeta> = {}) => {
    if (!result) {
      setExportError("No calculation result available. Configure at least one camera group.");
      setExportState("error");
      return;
    }

    setExportState("generating");
    setExportError(null);

    try {
      // Dynamic import — prevents jsPDF from being included in the initial bundle
      const { renderReportToPDF } = await import("./renderer");

      const reportDoc = buildReportDocument({ result, configs, meta });
      const blob = await renderReportToPDF(reportDoc);

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = generateFilename(reportDoc.meta);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportState("done");

      // Auto-reset after 3 s so the button returns to idle
      setTimeout(() => setExportState("idle"), 3_000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PDF generation failed.";
      setExportError(msg);
      setExportState("error");
    }
  }, [result, configs]);

  const reset = useCallback(() => {
    setExportState("idle");
    setExportError(null);
  }, []);

  return { exportState, exportError, exportPdf, reset };
}

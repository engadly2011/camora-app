// ─────────────────────────────────────────────────────────────────────────────
// PDF Renderer  ·  jsPDF v4 + jspdf-autotable v5
//
// Pure rendering function — no React, no calc-engine imports.
// Receives a ReportDocument (locale-agnostic intermediate representation)
// and returns a PDF Blob ready for browser download.
//
// Design language: enterprise surveillance engineering document
//   A4 portrait  ·  strict typographic grid  ·  monochromatic + cyan accent
//   Dark cover page  ·  light content pages  ·  page numbers on every page
// ─────────────────────────────────────────────────────────────────────────────

import type { ReportDocument, ReportCameraRow } from './schema';

// jsPDF + autotable are loaded dynamically (client-only, deferred bundle)
// Type-only imports at module level are fine.
type JsPDFInstance  = InstanceType<typeof import("jspdf").jsPDF>;
type AutoTableOpts  = import("jspdf-autotable").UserOptions;

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  // Page geometry  (mm)
  pageW:  210,
  pageH:  297,
  ml:     18,   // left margin
  mr:     18,   // right margin
  mt:     22,   // top margin (content pages)
  mb:     18,   // bottom margin
  get contentW() { return this.pageW - this.ml - this.mr; },  // 174 mm
  get contentR() { return this.pageW - this.mr; },             // 192 mm

  // Palette  (RGB triples)
  ink:      [15, 15, 20]    as RGB,   // near-black  — body text
  muted:    [105, 105, 115] as RGB,   // mid-grey    — labels, footers
  rule:     [210, 210, 215] as RGB,   // light rule
  accent:   [0, 172, 193]   as RGB,   // cyan        — accent bar, values
  warn:     [217, 119, 6]   as RGB,   // amber       — warning bullets
  rowAlt:   [247, 248, 250] as RGB,   // table alt row
  rowHead:  [28, 28, 35]    as RGB,   // table header bg
  coverBg:  [14, 14, 20]    as RGB,   // cover background

  // Typography sizes (pt)
  fontBody:  10,
  fontSmall:  8,
  fontLabel:  7.5,
  fontH2:    13,
} as const;

type RGB = [number, number, number];

// ── Renderer state ────────────────────────────────────────────────────────────

type AutoTableFn = (doc: unknown, opts: unknown) => void;

interface State {
  doc:     JsPDFInstance;
  y:       number;   // cursor Y (mm from top)
  pageNum: number;
}

// ── Low-level helpers ─────────────────────────────────────────────────────────

function newPage(s: State): void {
  s.doc.addPage();
  s.pageNum++;
  s.y = C.mt;
}

/** Inserts a page break if fewer than `needed` mm remain on this page. */
function ensureSpace(s: State, needed: number): void {
  if (s.y + needed > C.pageH - C.mb) newPage(s);
}

function hRule(s: State, y?: number, color: RGB = C.rule): void {
  const yy = y ?? s.y;
  s.doc.setDrawColor(...color);
  s.doc.setLineWidth(0.25);
  s.doc.line(C.ml, yy, C.contentR, yy);
}

/** Renders a section header: left cyan bar + uppercased title + hairline rule. */
function sectionHeader(s: State, title: string): void {
  ensureSpace(s, 18);
  s.y += 4;
  // Accent bar
  s.doc.setFillColor(...C.accent);
  s.doc.rect(C.ml, s.y, 2.5, 7, "F");
  // Title
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(C.fontH2);
  s.doc.setTextColor(...C.ink);
  s.doc.text(title.toUpperCase(), C.ml + 5, s.y + 5.5);
  s.y += 11;
  hRule(s);
  s.y += 4;
}

/** Footer printed on every content page. */
function pageFooter(s: State, meta: ReportDocument["meta"]): void {
  const footY = C.pageH - 10;
  hRule(s, footY - 2);
  s.doc.setFont("helvetica", "normal");
  s.doc.setFontSize(C.fontLabel);
  s.doc.setTextColor(...C.muted);
  s.doc.text(
    `${meta.projectName}  ·  Camora Engineering Report  ·  ${meta.reportDate}`,
    C.ml, footY,
  );
  s.doc.text(`Page ${s.pageNum}`, C.contentR, footY, { align: "right" });
}

/** Key-value row: muted label left, value right. */
function kv(s: State, label: string, value: string, bold = false): void {
  ensureSpace(s, 7);
  s.doc.setFont("helvetica", "normal");
  s.doc.setFontSize(C.fontSmall);
  s.doc.setTextColor(...C.muted);
  s.doc.text(label, C.ml, s.y);
  s.doc.setFont("helvetica", bold ? "bold" : "normal");
  s.doc.setFontSize(C.fontBody);
  s.doc.setTextColor(...C.ink);
  s.doc.text(value, C.contentR, s.y, { align: "right" });
  s.y += 5.5;
}

/** Amber warning bullet + wrapped text. */
function warnLine(s: State, text: string): void {
  ensureSpace(s, 9);
  s.doc.setFillColor(...C.warn);
  s.doc.circle(C.ml + 1.5, s.y - 1.5, 1, "F");
  s.doc.setFont("helvetica", "normal");
  s.doc.setFontSize(C.fontSmall);
  s.doc.setTextColor(...C.warn);
  const lines = s.doc.splitTextToSize(text, C.contentW - 6);
  s.doc.text(lines, C.ml + 5, s.y);
  s.y += (lines as string[]).length * 4.2 + 1.5;
}

/** Shared autoTable call wrapper — correct jspdf-autotable v5 API. */
function drawTable(
  s: State,
  autoTable: (doc: JsPDFInstance, opts: AutoTableOpts) => void,
  opts: AutoTableOpts,
  meta: ReportDocument["meta"],
): void {
  autoTable(s.doc, {
    ...opts,
    startY:  s.y,
    margin:  { left: C.ml, right: C.mr },
    theme:   "plain",
    styles: {
      fontSize:    7.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      textColor:   C.ink,
      lineColor:   C.rule,
      lineWidth:   0.2,
      ...(opts.styles as object ?? {}),
    },
    headStyles: {
      fillColor:  C.rowHead,
      textColor:  [255, 255, 255] as RGB,
      fontStyle:  "bold",
      fontSize:   7,
      ...(opts.headStyles as object ?? {}),
    },
    alternateRowStyles: { fillColor: C.rowAlt },
    // Page footer is re-drawn by autotable's page hook
    didDrawPage: () => {
      pageFooter(s, meta);
    },
  });

  // Advance cursor past the table
  type DocWithLastTable = JsPDFInstance & { lastAutoTable?: { finalY: number } };
  const finalY = (s.doc as DocWithLastTable).lastAutoTable?.finalY;
  s.y = (finalY ?? s.y) + 5;
}

// ── Cover page ────────────────────────────────────────────────────────────────

function renderCover(s: State, doc: ReportDocument): void {
  // Dark background fills the full page
  s.doc.setFillColor(...C.coverBg);
  s.doc.rect(0, 0, C.pageW, C.pageH, "F");

  // Cyan accent stripe at foot
  s.doc.setFillColor(...C.accent);
  s.doc.rect(0, C.pageH - 18, C.pageW, 18, "F");

  // Wordmark / logo
  if (doc.meta.logoDataUrl) {
    try {
      s.doc.addImage(doc.meta.logoDataUrl, "PNG", C.ml, 24, 40, 14);
    } catch {
      renderWordmark(s);
    }
  } else {
    renderWordmark(s);
  }

  // Thin separator below wordmark
  s.doc.setDrawColor(...C.accent);
  s.doc.setLineWidth(0.4);
  s.doc.line(C.ml, 48, C.contentR, 48);

  // Report title — two-line treatment
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(26);
  s.doc.setTextColor(255, 255, 255);
  s.doc.text("CCTV SYSTEM", C.ml, 98);
  s.doc.setFont("helvetica", "normal");
  s.doc.text("ENGINEERING REPORT", C.ml, 112);

  // Project name (accent colour)
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(13);
  s.doc.setTextColor(...C.accent);
  const pNameLines = s.doc.splitTextToSize(doc.meta.projectName, C.contentW) as string[];
  s.doc.text(pNameLines, C.ml, 130);

  // Project meta block — right-aligned, bottom third of page
  const metaRows: [string, string][] = [
    ["CLIENT",       doc.meta.clientName  || "—"],
    ["PREPARED BY",  doc.meta.preparedBy],
    ["DATE",         doc.meta.reportDate],
    ["REFERENCE",    doc.meta.reference],
  ];
  let my = 198;
  for (const [label, value] of metaRows) {
    s.doc.setFont("helvetica", "normal");
    s.doc.setFontSize(7);
    s.doc.setTextColor(...C.muted);
    s.doc.text(label, C.contentR, my, { align: "right" });
    my += 4;
    s.doc.setFont("helvetica", "bold");
    s.doc.setFontSize(9.5);
    s.doc.setTextColor(228, 228, 235);
    s.doc.text(value, C.contentR, my, { align: "right" });
    my += 8;
  }

  // Summary badge strip
  const badges: [string, string][] = [
    ["CAMERAS",   String(doc.summary.totalCameras)],
    ["EFFECTIVE", doc.summary.totalEffectiveMbps],
    ["STORAGE",   doc.summary.rawStorageTB],
    ["RAID",      doc.storage.raidProfile],
  ];
  const badgeW = (C.contentW - (badges.length - 1) * 4) / badges.length;
  let bx = C.ml;
  for (const [label, value] of badges) {
    s.doc.setFillColor(28, 28, 38);
    s.doc.roundedRect(bx, 252, badgeW, 16, 2, 2, "F");
    s.doc.setFont("helvetica", "normal");
    s.doc.setFontSize(6.5);
    s.doc.setTextColor(...C.muted);
    s.doc.text(label, bx + badgeW / 2, 258, { align: "center" });
    s.doc.setFont("helvetica", "bold");
    s.doc.setFontSize(10);
    s.doc.setTextColor(...C.accent);
    s.doc.text(value, bx + badgeW / 2, 265, { align: "center" });
    bx += badgeW + 4;
  }

  // Footer stripe text
  s.doc.setFont("helvetica", "normal");
  s.doc.setFontSize(7);
  s.doc.setTextColor(C.coverBg[0], C.coverBg[1], C.coverBg[2]);
  s.doc.text(
    "CONFIDENTIAL  ·  ENGINEERING DOCUMENT  ·  NOT FOR PUBLIC DISTRIBUTION",
    C.pageW / 2, C.pageH - 7, { align: "center" },
  );

  // Advance to page 2
  s.doc.addPage();
  s.pageNum++;
  s.y = C.mt;
}

function renderWordmark(s: State): void {
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(12);
  s.doc.setTextColor(255, 255, 255);
  s.doc.text("CAMORA", C.ml, 34);
  s.doc.setFont("helvetica", "normal");
  s.doc.setFontSize(7);
  s.doc.setTextColor(...C.accent);
  s.doc.text("SURVEILLANCE ENGINEERING PLATFORM", C.ml, 40);
}

// ── 01 — Project summary ──────────────────────────────────────────────────────

function renderSummary(s: State, doc: ReportDocument): void {
  sectionHeader(s, "01 — Project Summary");

  kv(s, "Project name",              doc.meta.projectName, true);
  kv(s, "Client",                    doc.meta.clientName || "—");
  kv(s, "Prepared by",               doc.meta.preparedBy);
  kv(s, "Report date",               doc.meta.reportDate);
  kv(s, "Reference",                 doc.meta.reference);

  s.y += 3;
  hRule(s);
  s.y += 4;

  kv(s, "Total cameras",             String(doc.summary.totalCameras), true);
  kv(s, "Camera groups",             String(doc.summary.totalGroups));
  kv(s, "Combined effective bitrate", doc.summary.totalEffectiveMbps, true);
  kv(s, "Combined peak bitrate",     doc.summary.totalPeakMbps);
  kv(s, "Raw storage requirement",   doc.summary.rawStorageTB, true);
  kv(s, "RAID profile",              doc.storage.raidProfile);
  kv(s, "Drive specification",
    `${doc.storage.driveCount} × ${doc.storage.driveCapacityTB} TB`);

  // Confidence score (if available)
  if (doc.confidence) {
    s.y += 3;
    hRule(s);
    s.y += 4;

    const conf = doc.confidence;
    const riskColors: Record<string, RGB> = {
      excellent: [34, 197, 94],
      good:      [0, 172, 193],
      moderate:  [217, 119, 6],
      high:      [185, 28, 28],
    };
    const riskLabels: Record<string, string> = {
      excellent: "Excellent",
      good:      "Good",
      moderate:  "Moderate Risk",
      high:      "High Risk",
    };

    // Score bar background
    const barX  = C.ml;
    const barY  = s.y;
    const barH  = 5;
    const barW  = C.contentW;
    const fillW = (conf.score / 100) * barW;
    s.doc.setFillColor(40, 40, 50);
    s.doc.roundedRect(barX, barY, barW, barH, 1, 1, "F");
    const barColor = riskColors[conf.riskLevel] ?? riskColors["good"]!;
    s.doc.setFillColor(...barColor);
    if (fillW > 0) s.doc.roundedRect(barX, barY, fillW, barH, 1, 1, "F");
    s.y += barH + 3;

    // Score label
    s.doc.setFont("helvetica", "bold");
    s.doc.setFontSize(C.fontSmall);
    s.doc.setTextColor(...(riskColors[conf.riskLevel] ?? riskColors["good"]!));
    s.doc.text(
      `Engineering Confidence: ${conf.score}/100 — ${riskLabels[conf.riskLevel] ?? ""}`,
      C.ml, s.y,
    );
    s.y += 4;

    // HDD class
    s.doc.setFont("helvetica", "normal");
    s.doc.setFontSize(C.fontSmall);
    s.doc.setTextColor(...C.muted);
    s.doc.text(`HDD Recommendation: ${conf.hddClassLabel}`, C.ml, s.y);
    s.y += 5;

    // Deductions (if any)
    if (conf.deductions.length > 0) {
      s.doc.setFont("helvetica", "italic");
      s.doc.setFontSize(C.fontSmall - 0.5);
      s.doc.setTextColor(...C.warn);
      for (const d of conf.deductions.slice(0, 4)) {
        ensureSpace(s, 6);
        s.doc.text(`• ${d}`, C.ml + 2, s.y, { maxWidth: C.contentW - 4 });
        s.y += 4.5;
      }
    }
    s.y += 2;
  }

  // Scope note
  s.y += 5;
  s.doc.setFont("helvetica", "italic");
  s.doc.setFontSize(C.fontSmall);
  s.doc.setTextColor(...C.muted);
  s.doc.text(
    "This document contains engineering estimates. Final specifications should be verified " +
    "against site survey, vendor data sheets, and local regulatory requirements.",
    C.ml, s.y,
    { maxWidth: C.contentW }
  );
  s.y += 10;

  pageFooter(s, doc.meta);
}

// ── 02 — Camera groups ────────────────────────────────────────────────────────

function renderCameraGroups(
  s: State,
  doc: ReportDocument,
  autoTable: (d: JsPDFInstance, o: AutoTableOpts) => void,
): void {
  newPage(s);
  sectionHeader(s, "02 — Camera Groups");

  // Configuration table
  drawTable(s, autoTable, {
    head: [["#", "Qty", "Vendor / Model", "Res.", "Codec", "FPS", "Scene", "Mode", "Ret."]],
    body: doc.cameras.map((cam: ReportCameraRow) => [
      String(cam.index),
      String(cam.quantity),
      `${cam.vendor}\n${cam.model}`,
      cam.resolution,
      cam.codec,
      String(cam.fps),
      cam.sceneComplexity,
      cam.recordingMode,
      `${cam.retentionDays}d`,
    ]),
    columnStyles: {
      0: { cellWidth: 8  },
      1: { cellWidth: 10 },
      2: { cellWidth: 38 },
      3: { cellWidth: 15 },
      4: { cellWidth: 18 },
      5: { cellWidth: 10 },
      6: { cellWidth: 18 },
      7: { cellWidth: 22 },
      8: { cellWidth: 15 },
    },
  }, doc.meta);

  // Bitrate & storage summary table
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(C.fontLabel);
  s.doc.setTextColor(...C.muted);
  s.doc.text("BITRATE & STORAGE SUMMARY", C.ml, s.y);
  s.y += 4;

  drawTable(s, autoTable, {
    head: [["#", "Effective Mbps", "Peak Mbps", "Daily / camera", "Duty cycle", "Group total", "Audio", "AI"]],
    body: doc.cameras.map((cam: ReportCameraRow) => [
      String(cam.index),
      cam.effectiveMbps,
      cam.peakMbps,
      cam.dailyStorageGB,
      cam.dutyCycle,
      cam.groupTotalTB,
      cam.audioEnabled ? "Yes" : "No",
      cam.aiEnabled    ? "Yes" : "No",
    ]),
  }, doc.meta);

  pageFooter(s, doc.meta);
}

// ── 03 — Storage calculations ─────────────────────────────────────────────────

function renderStorage(
  s: State,
  doc: ReportDocument,
  autoTable: (d: JsPDFInstance, o: AutoTableOpts) => void,
): void {
  newPage(s);
  sectionHeader(s, "03 — Storage Calculations");

  // Two-column layout: capacity breakdown (left) | drive spec (right)
  const colW  = (C.contentW - 8) / 2;
  const col2x = C.ml + colW + 8;
  const colStartY = s.y;

  // ── Left column ──
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(C.fontLabel);
  s.doc.setTextColor(...C.muted);
  s.doc.text("CAPACITY BREAKDOWN", C.ml, s.y);
  s.y += 5;

  kv(s, "Raw storage (sum of groups)",   doc.storage.rawStorageTB, true);
  kv(s, "With 20% filesystem overhead",  doc.storage.withOverheadTB, true);
  kv(s, "Gross RAID capacity",           doc.storage.grossCapacityTB);
  kv(s, "Usable (after RAID + FS)",      doc.storage.usableCapacityTB, true);
  kv(s, "RAID overhead ratio",           doc.storage.overheadRatio);

  const leftBottomY = s.y;

  // ── Right column ──
  s.y = colStartY;
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(C.fontLabel);
  s.doc.setTextColor(...C.muted);
  s.doc.text("DRIVE SPECIFICATION", col2x, s.y);
  s.y += 5;

  // Large drive count display
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(16);
  s.doc.setTextColor(...C.ink);
  s.doc.text(`${doc.storage.driveCount} × ${doc.storage.driveCapacityTB} TB`, col2x, s.y);
  s.doc.setFont("helvetica", "normal");
  s.doc.setFontSize(8);
  s.doc.setTextColor(...C.accent);
  s.doc.text(doc.storage.raidProfile, col2x + 60, s.y);
  s.y += 7;

  const colSpecRows: [string, string][] = [
    ["Drive grade",   doc.storage.surveillanceGrade ? "Surveillance grade required" : "Standard grade"],
    ["Gross total",   doc.storage.grossCapacityTB],
    ["Usable total",  doc.storage.usableCapacityTB],
    ["Overhead ratio", doc.storage.overheadRatio],
  ];
  for (const [lbl, val] of colSpecRows) {
    s.doc.setFont("helvetica", "normal");
    s.doc.setFontSize(C.fontSmall);
    s.doc.setTextColor(...C.muted);
    s.doc.text(lbl, col2x, s.y);
    s.doc.setTextColor(...C.ink);
    // right-align within right column
    s.doc.text(val, col2x + colW, s.y, { align: "right" });
    s.y += 4.5;
  }

  // Advance past the taller column
  s.y = Math.max(leftBottomY, s.y) + 4;
  hRule(s);
  s.y += 5;

  // HDD examples table
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(C.fontLabel);
  s.doc.setTextColor(...C.muted);
  s.doc.text("HDD PRODUCT EXAMPLES", C.ml, s.y);
  s.y += 4;

  drawTable(s, autoTable, {
    head: [["Tier", "Recommended model"]],
    body: [
      ["Budget",     doc.storage.driveExampleBudget],
      ["Mainstream", doc.storage.driveExampleMain],
      ["Enterprise", doc.storage.driveExampleEnterprise],
    ],
    columnStyles: {
      0: { cellWidth: 30, fontStyle: "bold" as const },
    },
  }, doc.meta);

  // Storage warnings
  if (doc.storage.storageWarnings.length > 0) {
    s.doc.setFont("helvetica", "bold");
    s.doc.setFontSize(C.fontLabel);
    s.doc.setTextColor(...C.warn);
    s.doc.text("STORAGE WARNINGS", C.ml, s.y);
    s.y += 4;
    for (const w of doc.storage.storageWarnings) warnLine(s, w);
  }

  pageFooter(s, doc.meta);
}

// ── 04 — NVR throughput ───────────────────────────────────────────────────────

function renderNVR(s: State, doc: ReportDocument): void {
  newPage(s);
  sectionHeader(s, "04 — NVR Throughput Analysis");

  kv(s, "Average ingress (all cameras streaming)",    doc.nvr.totalIngressMbps, true);
  kv(s, "Recommended NVR throughput (+25% headroom)", doc.nvr.recommendedNVRThroughputMbps, true);
  kv(s, "Peak burst (worst-case I-frame storm)",      doc.nvr.peakBurstMbps);
  kv(s, "Minimum HDD write speed required",           doc.nvr.minHDDWriteSpeedMBps);
  s.y += 4;

  // Port utilisation progress bar
  const riskColors: Record<string, RGB> = {
    low:    [34, 197, 94],
    medium: [217, 119, 6],
    high:   [185, 28, 28],
  };
  const riskLabels: Record<string, string> = {
    low:    "Low — within safe operating range",
    medium: "Medium — monitor under peak load",
    high:   "High — risk of frame loss at peak",
  };
  const risk    = doc.nvr.portUtilisationRisk;
  const pctVal  = parseFloat(doc.nvr.portUtilisationPercent);
  const barW    = C.contentW;
  const fillW   = Math.min(barW, (pctVal / 100) * barW);

  s.doc.setFillColor(...C.rule);
  s.doc.roundedRect(C.ml, s.y, barW, 5, 1, 1, "F");
  s.doc.setFillColor(...(riskColors[risk] ?? riskColors["low"]));
  if (fillW > 0) s.doc.roundedRect(C.ml, s.y, fillW, 5, 1, 1, "F");
  s.y += 8;
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(C.fontSmall);
  s.doc.setTextColor(...C.ink);
  s.doc.text(
    `Port utilisation: ${doc.nvr.portUtilisationPercent} of 1 GbE — ${riskLabels[risk] ?? ""}`,
    C.ml, s.y,
  );
  s.y += 8;

  // NVR warnings
  if (doc.nvr.warnings.length > 0) {
    s.doc.setFont("helvetica", "bold");
    s.doc.setFontSize(C.fontLabel);
    s.doc.setTextColor(...C.warn);
    s.doc.text("NVR WARNINGS", C.ml, s.y);
    s.y += 4;
    for (const w of doc.nvr.warnings) warnLine(s, w);
  }

  pageFooter(s, doc.meta);
}

// ── 05 — Network bandwidth ────────────────────────────────────────────────────

function renderBandwidth(s: State, doc: ReportDocument): void {
  ensureSpace(s, 60);
  s.y += 6;
  sectionHeader(s, "05 — Network Bandwidth");

  kv(s, "LAN ingress (camera → NVR)",          doc.bandwidth.lanIngressMbps, true);
  kv(s, "Remote viewing (sub-stream live view)", doc.bandwidth.remoteViewingMbps);
  kv(s, "Cloud AI relay",                        doc.bandwidth.cloudRelayMbps);
  kv(s, "Recommended WAN uplink minimum",        doc.bandwidth.recommendedUplinkMbps, true);

  s.y += 4;
  // Bandwidth note
  s.doc.setFont("helvetica", "italic");
  s.doc.setFontSize(C.fontSmall);
  s.doc.setTextColor(...C.muted);
  s.doc.text(
    "Remote viewing bitrate assumes sub-stream at 15% of main stream average. " +
    "Cloud relay applies only when AI cloud_relay mode is active.",
    C.ml, s.y, { maxWidth: C.contentW },
  );
  s.y += 10;

  if (doc.bandwidth.warnings.length > 0) {
    s.doc.setFont("helvetica", "bold");
    s.doc.setFontSize(C.fontLabel);
    s.doc.setTextColor(...C.warn);
    s.doc.text("BANDWIDTH WARNINGS", C.ml, s.y);
    s.y += 4;
    for (const w of doc.bandwidth.warnings) warnLine(s, w);
  }

  pageFooter(s, doc.meta);
}

// ── 06 — Engineering warnings ─────────────────────────────────────────────────

function renderWarnings(s: State, doc: ReportDocument): void {
  if (doc.allWarnings.length === 0) return;

  ensureSpace(s, 50);
  s.y += 6;
  sectionHeader(s, "06 — Engineering Warnings");

  s.doc.setFont("helvetica", "normal");
  s.doc.setFontSize(C.fontSmall);
  s.doc.setTextColor(...C.muted);
  s.doc.text(
    `${doc.allWarnings.length} engineering condition${doc.allWarnings.length !== 1 ? "s" : ""} identified below. ` +
    "Review all items before final procurement.",
    C.ml, s.y, { maxWidth: C.contentW },
  );
  s.y += 8;

  for (const w of doc.allWarnings) warnLine(s, w);

  pageFooter(s, doc.meta);
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Renders a ReportDocument to a PDF Blob.
 * Must be called in a browser context (uses dynamic import of jsPDF).
 */
export async function renderReportToPDF(reportDoc: ReportDocument): Promise<Blob> {
  // Dynamic import — jsPDF and autotable are excluded from the SSR/initial bundle.
  const [{ jsPDF }, { autoTable, applyPlugin }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  // Register autotable plugin on the jsPDF constructor (v5 API)
  applyPlugin(jsPDF);

  const pdfDoc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const state: State = { doc: pdfDoc, y: C.mt, pageNum: 1 };

  renderCover(state, reportDoc);
  renderSummary(state, reportDoc);
  renderCameraGroups(state, reportDoc, autoTable);
  renderStorage(state, reportDoc, autoTable);
  renderNVR(state, reportDoc);
  renderBandwidth(state, reportDoc);
  renderWarnings(state, reportDoc);

  return pdfDoc.output("blob");
}

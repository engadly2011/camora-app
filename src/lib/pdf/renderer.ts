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
//
// v2 — Layout fixes:
//   • All column widths sum to exactly contentW (174mm) — no overflow
//   • kv() label capped with maxWidth to prevent overlap with value
//   • scope note y-cursor advances correctly for wrapped lines
//   • Two-column layout uses independent y-trackers, no shared cursor reset
//   • warnLine() uses accurate line height based on font size
//   • RAID badge placed within column bounds (not at fixed +60mm offset)
//   • All tables use explicit column widths that sum to contentW
// ─────────────────────────────────────────────────────────────────────────────

import type { ReportDocument, ReportCameraRow } from './schema';

type JsPDFInstance  = InstanceType<typeof import("jspdf").jsPDF>;
type AutoTableOpts  = import("jspdf-autotable").UserOptions;

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  pageW:  210,
  pageH:  297,
  ml:     18,   // left margin
  mr:     18,   // right margin
  mt:     22,   // top margin (content pages)
  mb:     20,   // bottom margin
  get contentW() { return this.pageW - this.ml - this.mr; },  // 174 mm
  get contentR() { return this.pageW - this.mr; },             // 192 mm

  ink:      [15, 15, 20]    as RGB,
  muted:    [105, 105, 115] as RGB,
  rule:     [210, 210, 215] as RGB,
  accent:   [0, 172, 193]   as RGB,
  warn:     [200, 110, 0]   as RGB,
  rowAlt:   [247, 248, 250] as RGB,
  rowHead:  [28, 28, 35]    as RGB,
  coverBg:  [14, 14, 20]    as RGB,

  fontBody:   10,
  fontSmall:   8,
  fontLabel:   7.5,
  fontH2:     12,

  // Label max-width: reserves 60mm for the value on the right
  labelMaxW:  110,
} as const;

type RGB = [number, number, number];

// ── Renderer state ────────────────────────────────────────────────────────────

type AutoTableFn = (doc: unknown, opts: unknown) => void;

interface State {
  doc:     JsPDFInstance;
  y:       number;
  pageNum: number;
}

// ── Low-level helpers ─────────────────────────────────────────────────────────

function newPage(s: State): void {
  s.doc.addPage();
  s.pageNum++;
  s.y = C.mt;
}

function ensureSpace(s: State, needed: number): void {
  if (s.y + needed > C.pageH - C.mb) newPage(s);
}

function hRule(s: State, y?: number, color: RGB = C.rule): void {
  const yy = y ?? s.y;
  s.doc.setDrawColor(...color);
  s.doc.setLineWidth(0.25);
  s.doc.line(C.ml, yy, C.contentR, yy);
}

function sectionHeader(s: State, title: string): void {
  ensureSpace(s, 18);
  s.y += 4;
  s.doc.setFillColor(...C.accent);
  s.doc.rect(C.ml, s.y, 2.5, 7, "F");
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(C.fontH2);
  s.doc.setTextColor(...C.ink);
  s.doc.text(title.toUpperCase(), C.ml + 5, s.y + 5);
  s.y += 11;
  hRule(s);
  s.y += 4;
}

function pageFooter(s: State, meta: ReportDocument["meta"]): void {
  const footY = C.pageH - 10;
  hRule(s, footY - 2);
  s.doc.setFont("helvetica", "normal");
  s.doc.setFontSize(C.fontLabel);
  s.doc.setTextColor(...C.muted);
  // Split footer into two calls — each with own maxWidth to prevent overlap
  s.doc.text(
    `${meta.projectName}  ·  Camora Engineering Report  ·  ${meta.reportDate}`,
    C.ml, footY,
    { maxWidth: C.contentW - 24 }         // leave 24mm for page number
  );
  s.doc.text(`Page ${s.pageNum}`, C.contentR, footY, { align: "right" });
}

/**
 * Key-value row: label left (capped), value right-aligned.
 * FIX: labelMaxW prevents long labels from visually overlapping value text.
 */
function kv(s: State, label: string, value: string, bold = false): void {
  ensureSpace(s, 7);
  s.doc.setFont("helvetica", "normal");
  s.doc.setFontSize(C.fontSmall);
  s.doc.setTextColor(...C.muted);
  s.doc.text(label, C.ml, s.y, { maxWidth: C.labelMaxW });
  s.doc.setFont("helvetica", bold ? "bold" : "normal");
  s.doc.setFontSize(C.fontBody);
  s.doc.setTextColor(...C.ink);
  s.doc.text(value, C.contentR, s.y, { align: "right" });
  s.y += 5.5;
}

/**
 * Amber warning bullet with correctly measured line advance.
 * FIX: use splitTextToSize and compute height from actual line count × line-height.
 */
function warnLine(s: State, text: string): void {
  ensureSpace(s, 10);
  const maxW  = C.contentW - 7;
  const lines = s.doc.splitTextToSize(text, maxW) as string[];
  const lineH = 4.5;                      // pt → mm approx for 8pt font
  s.doc.setFillColor(...C.warn);
  s.doc.circle(C.ml + 1.5, s.y - 1.5, 1.2, "F");
  s.doc.setFont("helvetica", "normal");
  s.doc.setFontSize(C.fontSmall);
  s.doc.setTextColor(...C.warn);
  s.doc.text(lines, C.ml + 5, s.y);
  s.y += lines.length * lineH + 2;
}

/** Shared autoTable wrapper — correct jspdf-autotable v5 API. */
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
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      textColor:   C.ink,
      lineColor:   C.rule,
      lineWidth:   0.2,
      overflow:    "linebreak",           // FIX: always wrap, never overflow
      ...(opts.styles as object ?? {}),
    },
    headStyles: {
      fillColor: C.rowHead,
      textColor: [255, 255, 255] as RGB,
      fontStyle: "bold",
      fontSize:  7,
      ...(opts.headStyles as object ?? {}),
    },
    alternateRowStyles: { fillColor: C.rowAlt },
    didDrawPage: () => { pageFooter(s, meta); },
  });

  type DocWithLastTable = JsPDFInstance & { lastAutoTable?: { finalY: number } };
  const finalY = (s.doc as DocWithLastTable).lastAutoTable?.finalY;
  s.y = (finalY ?? s.y) + 6;
}

// ── Cover page ────────────────────────────────────────────────────────────────

function renderCover(s: State, doc: ReportDocument): void {
  s.doc.setFillColor(...C.coverBg);
  s.doc.rect(0, 0, C.pageW, C.pageH, "F");

  s.doc.setFillColor(...C.accent);
  s.doc.rect(0, C.pageH - 18, C.pageW, 18, "F");

  if (doc.meta.logoDataUrl) {
    try { s.doc.addImage(doc.meta.logoDataUrl, "PNG", C.ml, 24, 40, 14); }
    catch { renderWordmark(s); }
  } else {
    renderWordmark(s);
  }

  s.doc.setDrawColor(...C.accent);
  s.doc.setLineWidth(0.4);
  s.doc.line(C.ml, 48, C.contentR, 48);

  // Report title
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(26);
  s.doc.setTextColor(255, 255, 255);
  s.doc.text("CCTV SYSTEM", C.ml, 98);
  s.doc.setFont("helvetica", "normal");
  s.doc.text("ENGINEERING REPORT", C.ml, 112);

  // Project name — split and render with maxWidth
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(13);
  s.doc.setTextColor(...C.accent);
  const pNameLines = s.doc.splitTextToSize(doc.meta.projectName, C.contentW) as string[];
  s.doc.text(pNameLines, C.ml, 130);

  // Meta block — right-aligned, bottom third
  const metaRows: [string, string][] = [
    ["CLIENT",       doc.meta.clientName  || "—"],
    ["PREPARED BY",  doc.meta.preparedBy],
    ["DATE",         doc.meta.reportDate],
    ["REFERENCE",    doc.meta.reference],
  ];
  let my = 198;
  const metaMaxW = 90;                    // FIX: cap label width so it can't bleed left
  for (const [label, value] of metaRows) {
    s.doc.setFont("helvetica", "normal");
    s.doc.setFontSize(7);
    s.doc.setTextColor(...C.muted);
    s.doc.text(label, C.contentR, my, { align: "right", maxWidth: metaMaxW });
    my += 4;
    s.doc.setFont("helvetica", "bold");
    s.doc.setFontSize(9.5);
    s.doc.setTextColor(228, 228, 235);
    // FIX: truncate long values — split to 1 line max
    const valLine = s.doc.splitTextToSize(value, metaMaxW) as string[];
    s.doc.text(valLine[0] ?? value, C.contentR, my, { align: "right" });
    my += 8;
  }

  // Badge strip — 4 equal-width boxes
  const badges: [string, string][] = [
    ["CAMERAS",   String(doc.summary.totalCameras)],
    ["EFFECTIVE", doc.summary.totalEffectiveMbps],
    ["STORAGE",   doc.summary.rawStorageTB],
    ["RAID",      doc.storage.raidProfile],
  ];
  const gap    = 3;
  const badgeW = (C.contentW - gap * (badges.length - 1)) / badges.length;
  let bx = C.ml;
  for (const [label, value] of badges) {
    s.doc.setFillColor(28, 28, 38);
    s.doc.roundedRect(bx, 252, badgeW, 16, 2, 2, "F");
    s.doc.setFont("helvetica", "normal");
    s.doc.setFontSize(6.5);
    s.doc.setTextColor(...C.muted);
    s.doc.text(label, bx + badgeW / 2, 258.5, { align: "center" });
    s.doc.setFont("helvetica", "bold");
    s.doc.setFontSize(9.5);
    s.doc.setTextColor(...C.accent);
    // FIX: truncate value to badge width
    const valLine = s.doc.splitTextToSize(value, badgeW - 2) as string[];
    s.doc.text(valLine[0] ?? value, bx + badgeW / 2, 265, { align: "center" });
    bx += badgeW + gap;
  }

  // Footer stripe text
  s.doc.setFont("helvetica", "normal");
  s.doc.setFontSize(7);
  s.doc.setTextColor(C.coverBg[0], C.coverBg[1], C.coverBg[2]);
  s.doc.text(
    "CONFIDENTIAL  ·  ENGINEERING DOCUMENT  ·  NOT FOR PUBLIC DISTRIBUTION",
    C.pageW / 2, C.pageH - 7, { align: "center" },
  );

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

  kv(s, "Project name",               doc.meta.projectName, true);
  kv(s, "Client",                     doc.meta.clientName || "—");
  kv(s, "Prepared by",                doc.meta.preparedBy);
  kv(s, "Report date",                doc.meta.reportDate);
  kv(s, "Reference",                  doc.meta.reference);

  s.y += 3;
  hRule(s);
  s.y += 4;

  kv(s, "Total cameras",              String(doc.summary.totalCameras), true);
  kv(s, "Camera groups",              String(doc.summary.totalGroups));
  kv(s, "Combined effective bitrate", doc.summary.totalEffectiveMbps, true);
  kv(s, "Combined peak bitrate",      doc.summary.totalPeakMbps);
  kv(s, "Raw storage requirement",    doc.summary.rawStorageTB, true);
  kv(s, "RAID profile",               doc.storage.raidProfile);
  kv(s, "Drive specification",
    `${doc.storage.driveCount} × ${doc.storage.driveCapacityTB} TB`);

  // Engineering confidence
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

    const barW  = C.contentW;
    const fillW = (conf.score / 100) * barW;
    s.doc.setFillColor(40, 40, 50);
    s.doc.roundedRect(C.ml, s.y, barW, 5, 1, 1, "F");
    const barColor = riskColors[conf.riskLevel] ?? riskColors["good"]!;
    s.doc.setFillColor(...barColor);
    if (fillW > 0) s.doc.roundedRect(C.ml, s.y, fillW, 5, 1, 1, "F");
    s.y += 8;

    s.doc.setFont("helvetica", "bold");
    s.doc.setFontSize(C.fontSmall);
    s.doc.setTextColor(...(barColor));
    s.doc.text(
      `Engineering Confidence: ${conf.score}/100 — ${riskLabels[conf.riskLevel] ?? ""}`,
      C.ml, s.y, { maxWidth: C.contentW },
    );
    s.y += 5;

    s.doc.setFont("helvetica", "normal");
    s.doc.setFontSize(C.fontSmall);
    s.doc.setTextColor(...C.muted);
    s.doc.text(`HDD Recommendation: ${conf.hddClassLabel}`, C.ml, s.y, { maxWidth: C.contentW });
    s.y += 5;

    if (conf.deductions.length > 0) {
      s.doc.setFont("helvetica", "italic");
      s.doc.setFontSize(C.fontSmall - 0.5);
      s.doc.setTextColor(...C.warn);
      for (const d of conf.deductions.slice(0, 4)) {
        ensureSpace(s, 7);
        const lines = s.doc.splitTextToSize(`• ${d}`, C.contentW - 4) as string[];
        s.doc.text(lines, C.ml + 2, s.y);
        s.y += lines.length * 4.5 + 1;  // FIX: advance by actual line count
      }
    }
    s.y += 3;
  }

  // Scope note — FIX: advance cursor by actual rendered line count
  ensureSpace(s, 16);
  s.y += 5;
  s.doc.setFont("helvetica", "italic");
  s.doc.setFontSize(C.fontSmall);
  s.doc.setTextColor(...C.muted);
  const scopeText =
    "This document contains engineering estimates. Final specifications should be " +
    "verified against site survey, vendor data sheets, and local regulatory requirements.";
  const scopeLines = s.doc.splitTextToSize(scopeText, C.contentW) as string[];
  s.doc.text(scopeLines, C.ml, s.y);
  s.y += scopeLines.length * 4.5 + 6;   // FIX: was not advancing — caused text overlap

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

  // FIX: column widths summed = 8+10+35+15+18+10+20+28+30 = 174mm = contentW exactly
  drawTable(s, autoTable, {
    head: [["#", "Qty", "Vendor / Model", "Res.", "Codec", "FPS", "Scene", "Mode", "Ret."]],
    body: doc.cameras.map((cam: ReportCameraRow) => [
      String(cam.index),
      String(cam.quantity),
      `${cam.vendor} ${cam.model}`,        // FIX: single line (no \n) — prevents row height explosion
      cam.resolution,
      cam.codec,
      String(cam.fps),
      cam.sceneComplexity,
      cam.recordingMode.replace("_", " "), // FIX: replace underscore for readability
      `${cam.retentionDays}d`,
    ]),
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      1: { cellWidth: 10, halign: "center" },
      2: { cellWidth: 38 },
      3: { cellWidth: 15 },
      4: { cellWidth: 18 },
      5: { cellWidth: 10, halign: "center" },
      6: { cellWidth: 20 },
      7: { cellWidth: 25 },
      8: { cellWidth: 30, halign: "right" },
      // 8+10+38+15+18+10+20+25+30 = 174 ✓
    },
  }, doc.meta);

  // Bitrate & storage summary table
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(C.fontLabel);
  s.doc.setTextColor(...C.muted);
  s.doc.text("BITRATE & STORAGE SUMMARY", C.ml, s.y);
  s.y += 5;

  // FIX: column widths = 8+32+30+34+25+25+10+10 = 174mm ✓
  drawTable(s, autoTable, {
    head: [["#", "Effective", "Peak", "Daily / cam", "Duty %", "Group total", "Audio", "AI"]],
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
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      1: { cellWidth: 30, halign: "right"  },
      2: { cellWidth: 30, halign: "right"  },
      3: { cellWidth: 34, halign: "right"  },
      4: { cellWidth: 24, halign: "right"  },
      5: { cellWidth: 30, halign: "right"  },
      6: { cellWidth: 10, halign: "center" },
      7: { cellWidth: 8,  halign: "center" },
      // 8+30+30+34+24+30+10+8 = 174 ✓
    },
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

  // FIX: render left and right columns with INDEPENDENT y-trackers.
  // Previously both columns shared s.y — the cursor reset caused subtle
  // overlap when ensureSpace() or pageFooter() ran mid-column.
  const colW   = (C.contentW - 8) / 2;   // ~83mm each
  const col2x  = C.ml + colW + 8;
  const topY   = s.y;

  // ── Left column: track y independently ──
  let leftY = topY;
  function leftText(label: string, value: string) {
    s.doc.setFont("helvetica", "normal");
    s.doc.setFontSize(C.fontSmall);
    s.doc.setTextColor(...C.muted);
    s.doc.text(label, C.ml, leftY, { maxWidth: colW - 28 });
    s.doc.setFont("helvetica", "normal");
    s.doc.setFontSize(C.fontBody);
    s.doc.setTextColor(...C.ink);
    s.doc.text(value, C.ml + colW, leftY, { align: "right" });
    leftY += 5.5;
  }

  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(C.fontLabel);
  s.doc.setTextColor(...C.muted);
  s.doc.text("CAPACITY BREAKDOWN", C.ml, leftY);
  leftY += 6;

  leftText("Raw storage",              doc.storage.rawStorageTB);
  leftText("With 20% FS overhead",     doc.storage.withOverheadTB);
  leftText("Gross RAID capacity",      doc.storage.grossCapacityTB);
  leftText("Usable (RAID + FS)",       doc.storage.usableCapacityTB);
  leftText("RAID overhead ratio",      doc.storage.overheadRatio);

  // ── Right column: track y independently ──
  let rightY = topY;

  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(C.fontLabel);
  s.doc.setTextColor(...C.muted);
  s.doc.text("DRIVE SPECIFICATION", col2x, rightY);
  rightY += 8;

  // Drive count display — large type, RAID badge beside it (FIX: no +60 offset)
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(16);
  s.doc.setTextColor(...C.ink);
  s.doc.text(`${doc.storage.driveCount} × ${doc.storage.driveCapacityTB} TB`, col2x, rightY);
  rightY += 6;

  // RAID badge below the drive count — fits in column
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(8);
  s.doc.setTextColor(...C.accent);
  s.doc.text(doc.storage.raidProfile, col2x, rightY);
  rightY += 7;

  const specRows: [string, string][] = [
    ["Drive grade",    doc.storage.surveillanceGrade ? "Surveillance" : "Standard"],
    ["Gross total",    doc.storage.grossCapacityTB],
    ["Usable total",   doc.storage.usableCapacityTB],
    ["Overhead ratio", doc.storage.overheadRatio],
  ];
  for (const [lbl, val] of specRows) {
    s.doc.setFont("helvetica", "normal");
    s.doc.setFontSize(C.fontSmall);
    s.doc.setTextColor(...C.muted);
    s.doc.text(lbl, col2x, rightY, { maxWidth: colW - 28 });
    s.doc.setTextColor(...C.ink);
    s.doc.text(val, col2x + colW, rightY, { align: "right" });
    rightY += 5;
  }

  // Advance shared cursor past the taller column
  s.y = Math.max(leftY, rightY) + 5;
  hRule(s);
  s.y += 5;

  // HDD examples table — 2 columns summing to contentW
  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(C.fontLabel);
  s.doc.setTextColor(...C.muted);
  s.doc.text("HDD PRODUCT EXAMPLES", C.ml, s.y);
  s.y += 5;

  drawTable(s, autoTable, {
    head: [["Tier", "Recommended model"]],
    body: [
      ["Budget",     doc.storage.driveExampleBudget],
      ["Mainstream", doc.storage.driveExampleMain],
      ["Enterprise", doc.storage.driveExampleEnterprise],
    ],
    columnStyles: {
      0: { cellWidth: 34, fontStyle: "bold" as const },
      1: { cellWidth: 140 },
      // 34+140 = 174 ✓
    },
  }, doc.meta);

  if (doc.storage.storageWarnings.length > 0) {
    ensureSpace(s, 14);
    s.doc.setFont("helvetica", "bold");
    s.doc.setFontSize(C.fontLabel);
    s.doc.setTextColor(...C.warn);
    s.doc.text("STORAGE WARNINGS", C.ml, s.y);
    s.y += 5;
    for (const w of doc.storage.storageWarnings) warnLine(s, w);
  }

  pageFooter(s, doc.meta);
}

// ── 04 — NVR throughput ───────────────────────────────────────────────────────

function renderNVR(s: State, doc: ReportDocument): void {
  newPage(s);
  sectionHeader(s, "04 — NVR Throughput Analysis");

  kv(s, "Average ingress (all cameras)",          doc.nvr.totalIngressMbps, true);
  kv(s, "Recommended NVR throughput (+25%)",       doc.nvr.recommendedNVRThroughputMbps, true);
  kv(s, "Peak burst (worst-case I-frame storm)",   doc.nvr.peakBurstMbps);
  kv(s, "Minimum HDD write speed",                 doc.nvr.minHDDWriteSpeedMBps);
  s.y += 4;

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
  const risk   = doc.nvr.portUtilisationRisk;
  const pctVal = parseFloat(doc.nvr.portUtilisationPercent);
  const barW   = C.contentW;
  const fillW  = Math.min(barW, (pctVal / 100) * barW);

  s.doc.setFillColor(...C.rule);
  s.doc.roundedRect(C.ml, s.y, barW, 5, 1, 1, "F");
  s.doc.setFillColor(...(riskColors[risk] ?? riskColors["low"]!));
  if (fillW > 0) s.doc.roundedRect(C.ml, s.y, fillW, 5, 1, 1, "F");
  s.y += 8;

  s.doc.setFont("helvetica", "bold");
  s.doc.setFontSize(C.fontSmall);
  s.doc.setTextColor(...C.ink);
  const portLabel = `Port utilisation: ${doc.nvr.portUtilisationPercent} of 1 GbE — ${riskLabels[risk] ?? ""}`;
  const portLines = s.doc.splitTextToSize(portLabel, C.contentW) as string[];
  s.doc.text(portLines, C.ml, s.y);
  s.y += portLines.length * 4.5 + 5;

  if (doc.nvr.warnings.length > 0) {
    ensureSpace(s, 12);
    s.doc.setFont("helvetica", "bold");
    s.doc.setFontSize(C.fontLabel);
    s.doc.setTextColor(...C.warn);
    s.doc.text("NVR WARNINGS", C.ml, s.y);
    s.y += 5;
    for (const w of doc.nvr.warnings) warnLine(s, w);
  }

  pageFooter(s, doc.meta);
}

// ── 05 — Network bandwidth ────────────────────────────────────────────────────

function renderBandwidth(s: State, doc: ReportDocument): void {
  ensureSpace(s, 60);
  s.y += 6;
  sectionHeader(s, "05 — Network Bandwidth");

  kv(s, "LAN ingress (camera → NVR)",             doc.bandwidth.lanIngressMbps, true);
  kv(s, "Remote viewing (sub-stream live view)",   doc.bandwidth.remoteViewingMbps);
  kv(s, "Cloud AI relay",                          doc.bandwidth.cloudRelayMbps);
  kv(s, "Recommended WAN uplink minimum",          doc.bandwidth.recommendedUplinkMbps, true);

  s.y += 4;
  s.doc.setFont("helvetica", "italic");
  s.doc.setFontSize(C.fontSmall);
  s.doc.setTextColor(...C.muted);
  const bwNote =
    "Remote viewing bitrate assumes sub-stream at 15% of main stream average. " +
    "Cloud relay applies only when AI cloud_relay mode is active.";
  const bwLines = s.doc.splitTextToSize(bwNote, C.contentW) as string[];
  s.doc.text(bwLines, C.ml, s.y);
  s.y += bwLines.length * 4.5 + 6;

  if (doc.bandwidth.warnings.length > 0) {
    ensureSpace(s, 12);
    s.doc.setFont("helvetica", "bold");
    s.doc.setFontSize(C.fontLabel);
    s.doc.setTextColor(...C.warn);
    s.doc.text("BANDWIDTH WARNINGS", C.ml, s.y);
    s.y += 5;
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
  const intro = `${doc.allWarnings.length} engineering condition${doc.allWarnings.length !== 1 ? "s" : ""} identified below. Review all items before final procurement.`;
  const introLines = s.doc.splitTextToSize(intro, C.contentW) as string[];
  s.doc.text(introLines, C.ml, s.y);
  s.y += introLines.length * 4.5 + 6;

  for (const w of doc.allWarnings) warnLine(s, w);

  pageFooter(s, doc.meta);
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function renderReportToPDF(reportDoc: ReportDocument): Promise<Blob> {
  const [{ jsPDF }, { autoTable, applyPlugin }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

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

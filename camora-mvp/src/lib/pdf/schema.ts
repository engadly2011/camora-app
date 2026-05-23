// ─────────────────────────────────────────────────────────────────────────────
// Report Schema
//
// A locale-agnostic, renderer-agnostic intermediate representation of the
// CCTV planning report. It is derived from SystemResult + CameraRow[] and
// contains everything the PDF renderer needs — no calc-engine imports required
// inside the renderer itself.
//
// This layer decouples:
//   - Data source    (calc-engine SystemResult)
//   - Presentation   (PDF layout / future HTML template)
//   - Localisation   (string labels injected here, not in renderer)
// ─────────────────────────────────────────────────────────────────────────────

import type { SystemResult, CameraConfig } from '@/lib/engine';
import { calculateConfidence } from '@/lib/engine/confidence';

// ── Metadata ──────────────────────────────────────────────────────────────────

export interface ReportMeta {
  /** Project / site name — user-supplied or default. */
  projectName:    string;
  /** Prepared by (integrator / consultant name). */
  preparedBy:     string;
  /** Client or end-customer name. */
  clientName:     string;
  /** ISO date string — defaults to now. */
  reportDate:     string;
  /** Report reference / revision number. */
  reference:      string;
  /** Locale for label strings in the report. Future: "ar" for RTL PDF. */
  locale:         "en" | "ar";
  /** Optional logo image as a base64 data URL. */
  logoDataUrl?:   string;
}

// ── Camera group row (flattened for the PDF table) ────────────────────────────

export interface ReportCameraRow {
  index:              number;   // 1-based
  quantity:           number;
  vendor:             string;
  model:              string;
  resolution:         string;
  codec:              string;
  fps:                number;
  sceneComplexity:    string;
  recordingMode:      string;
  retentionDays:      number;
  effectiveMbps:      string;   // formatted "X.XX Mbps"
  peakMbps:           string;
  dailyStorageGB:     string;   // formatted "X.XX GB"
  dutyCycle:          string;   // formatted "XX.X%"
  groupTotalTB:       string;   // formatted "X.XX TB"
  audioEnabled:       boolean;
  aiEnabled:          boolean;
  warnings:           string[];
}

// ── Storage section ───────────────────────────────────────────────────────────

export interface ReportStorage {
  rawStorageTB:         string;
  withOverheadTB:       string;
  overheadPercent:      string;
  raidProfile:          string;
  driveCount:           number;
  driveCapacityTB:      number;
  grossCapacityTB:      string;
  usableCapacityTB:     string;
  overheadRatio:        string;  // "XX.X%"
  surveillanceGrade:    boolean;
  driveExampleBudget:   string;
  driveExampleMain:     string;
  driveExampleEnterprise: string;
  storageWarnings:      string[];
}

// ── NVR throughput section ────────────────────────────────────────────────────

export interface ReportNVR {
  totalIngressMbps:             string;
  peakBurstMbps:                string;
  recommendedNVRThroughputMbps: string;
  minHDDWriteSpeedMBps:         string;
  portUtilisationPercent:       string;
  portUtilisationRisk:          "low" | "medium" | "high";
  warnings:                     string[];
}

// ── Bandwidth section ─────────────────────────────────────────────────────────

export interface ReportBandwidth {
  lanIngressMbps:       string;
  remoteViewingMbps:    string;
  cloudRelayMbps:       string;
  recommendedUplinkMbps: string;
  warnings:             string[];
}

// ── Top-level report document ─────────────────────────────────────────────────

export interface ReportDocument {
  meta:              ReportMeta;
  summary: {
    totalCameras:      number;
    totalGroups:       number;
    totalEffectiveMbps: string;
    totalPeakMbps:     string;
    rawStorageTB:      string;
    generatedAt:       string;
  };
  cameras:           ReportCameraRow[];
  storage:           ReportStorage;
  nvr:               ReportNVR;
  bandwidth:         ReportBandwidth;
  allWarnings:       string[];
  /** Confidence score — present when configs were provided to the builder */
  confidence?: {
    score:       number;
    riskLevel:   string;
    deductions:  string[];
    hddClass:    string;
    hddClassLabel: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder — converts calc-engine output into ReportDocument
// Pure function, no side effects.
// ─────────────────────────────────────────────────────────────────────────────

function fmtMbps(v: number): string {
  if (v < 1)    return `${(v * 1000).toFixed(0)} kbps`;
  if (v >= 1000) return `${(v / 1000).toFixed(2)} Gbps`;
  return `${v.toFixed(2)} Mbps`;
}

function fmtTB(v: number): string {
  if (v < 0.001) return `${(v * 1_000_000).toFixed(1)} MB`;
  if (v < 1)     return `${(v * 1000).toFixed(1)} GB`;
  return `${v.toFixed(2)} TB`;
}

function fmtPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

function vendorLabel(vendorId: string): string {
  const map: Record<string, string> = {
    hikvision: "Hikvision", dahua: "Dahua",
    axis: "Axis", hanwha: "Hanwha Vision", generic: "Generic",
  };
  return map[vendorId] ?? vendorId;
}

function sceneLabel(s: string): string {
  const map: Record<string, string> = {
    minimal: "Minimal", low: "Low", medium: "Medium",
    high: "High", extreme: "Extreme",
  };
  return map[s] ?? s;
}

function recordingLabel(mode: string): string {
  const map: Record<string, string> = {
    continuous:      "Continuous",
    scheduled:       "Scheduled",
    motion_only:     "Motion only",
    alarm_triggered: "Alarm triggered",
    motion_adaptive: "Motion adaptive",
  };
  return map[mode] ?? mode;
}

export interface BuildReportOptions {
  result:    SystemResult;
  configs:   CameraConfig[];
  meta?:     Partial<ReportMeta>;
}

export function buildReportDocument({
  result, configs, meta = {},
}: BuildReportOptions): ReportDocument {
  const now = new Date();

  const resolvedMeta: ReportMeta = {
    projectName: meta.projectName ?? "CCTV System Design",
    preparedBy:  meta.preparedBy  ?? "Camora Platform",
    clientName:  meta.clientName  ?? "—",
    reportDate:  meta.reportDate  ?? now.toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    }),
    reference:   meta.reference   ?? `CAM-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    locale:      meta.locale      ?? "en",
    logoDataUrl: meta.logoDataUrl,
  };

  // Camera rows
  const cameras: ReportCameraRow[] = result.cameras.map((cam, i) => {
    const cfg = configs[i];
    return {
      index:           i + 1,
      quantity:        cam.quantity,
      vendor:          cfg ? vendorLabel(cfg.vendorId) : "—",
      model:           cfg?.modelId ?? "Generic / Formula",
      resolution:      cfg?.resolution ?? "—",
      codec:           cfg?.codec ?? "—",
      fps:             cfg?.fps ?? 0,
      sceneComplexity: cfg ? sceneLabel(cfg.sceneComplexity) : "—",
      recordingMode:   cfg ? recordingLabel(cfg.recordingMode) : "—",
      retentionDays:   cfg?.retentionDays ?? 0,
      effectiveMbps:   fmtMbps(cam.effectiveBitrateMbps),
      peakMbps:        fmtMbps(cam.peakBitrateMbps),
      dailyStorageGB:  `${cam.storagePerCameraPerDayGB.toFixed(2)} GB`,
      dutyCycle:       fmtPercent(cam.dutyCycleRatio),
      groupTotalTB:    fmtTB(cam.groupStorageRetentionTB),
      audioEnabled:    cfg?.audioEnabled ?? false,
      aiEnabled:       cfg?.aiAnalyticsEnabled ?? false,
      warnings:        cam.warnings,
    };
  });

  // Storage
  const { hdd } = result;
  const storage: ReportStorage = {
    rawStorageTB:          fmtTB(result.rawStorageTB),
    withOverheadTB:        fmtTB(result.rawStorageTB * 1.20),
    overheadPercent:       "20%",
    raidProfile:           hdd.raidProfile,
    driveCount:            hdd.driveCount,
    driveCapacityTB:       hdd.driveCapacityTB,
    grossCapacityTB:       fmtTB(hdd.grossCapacityTB),
    usableCapacityTB:      fmtTB(hdd.usableCapacityTB),
    overheadRatio:         fmtPercent(hdd.overheadRatio),
    surveillanceGrade:     hdd.surveillanceGradeRequired,
    driveExampleBudget:    hdd.driveExamples.budget,
    driveExampleMain:      hdd.driveExamples.mainstream,
    driveExampleEnterprise: hdd.driveExamples.enterprise,
    storageWarnings:       hdd.warnings,
  };

  // NVR
  const { nvr } = result;
  const utilRatio = nvr.portUtilisationRatio;
  const storage2: ReportNVR = {
    totalIngressMbps:             fmtMbps(nvr.totalIngressMbps),
    peakBurstMbps:                fmtMbps(nvr.peakBurstMbps),
    recommendedNVRThroughputMbps: fmtMbps(nvr.recommendedNVRThroughputMbps),
    minHDDWriteSpeedMBps:         `${nvr.minHDDWriteSpeedMBps.toFixed(1)} MB/s`,
    portUtilisationPercent:       fmtPercent(utilRatio),
    portUtilisationRisk:          utilRatio > 0.80 ? "high" : utilRatio > 0.60 ? "medium" : "low",
    warnings:                     nvr.warnings,
  };

  // Bandwidth
  const { bandwidth } = result;
  const bw: ReportBandwidth = {
    lanIngressMbps:        fmtMbps(bandwidth.lanIngressMbps),
    remoteViewingMbps:     fmtMbps(bandwidth.remoteViewingMbps),
    cloudRelayMbps:        fmtMbps(bandwidth.cloudRelayMbps),
    recommendedUplinkMbps: fmtMbps(bandwidth.recommendedUplinkMbps),
    warnings:              bandwidth.warnings,
  };

  const allWarnings = [
    ...result.nvr.warnings,
    ...result.hdd.warnings,
    ...result.bandwidth.warnings,
    ...result.cameras.flatMap((c) => c.warnings),
  ];

  // Confidence score (best-effort — never blocks report generation)
  let confidence: ReportDocument['confidence'];
  try {
    const conf = calculateConfidence(result, configs);
    confidence = {
      score:         conf.score,
      riskLevel:     conf.riskLevel,
      deductions:    conf.deductions,
      hddClass:      conf.hddClass,
      hddClassLabel: conf.hddClassLabel,
    };
  } catch { /* skip if confidence calculation fails */ }

  return {
    meta: resolvedMeta,
    summary: {
      totalCameras:       result.totalCameraCount,
      totalGroups:        result.cameras.length,
      totalEffectiveMbps: fmtMbps(result.totalEffectiveMbps),
      totalPeakMbps:      fmtMbps(result.totalPeakMbps),
      rawStorageTB:       fmtTB(result.rawStorageTB),
      generatedAt:        now.toISOString(),
    },
    cameras,
    storage,
    nvr: storage2,
    bandwidth: bw,
    allWarnings,
    confidence,
  };
}

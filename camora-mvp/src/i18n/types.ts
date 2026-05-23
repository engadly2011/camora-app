// ─────────────────────────────────────────────────────────────────────────────
// i18n type system
//
// Design principles:
//   - Typed dictionaries: every key is known at compile time; missing
//     translations fail tsc, not at runtime.
//   - Technical CCTV terms (Bitrate, FPS, Codec, RAID, NVR, PoE, ONVIF,
//     AI metadata) are never translated — they appear verbatim in both locales.
//   - Arabic labels wrap English technical terms when needed, e.g.:
//     "دقة الفيديو" for the section header, but "4MP / H.265" stays as-is.
//   - Locale dictionaries are plain objects — no async loading, no external
//     libs. The bundle is small and locales ship with the app.
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = "en" | "ar";

export type Dir = "ltr" | "rtl";

// ── Namespace: shared ─────────────────────────────────────────────────────────

export interface SharedNS {
  appName: string;
  tagline: string;
  cameras: string;
  groups: string;
  group: string;
}

// ── Namespace: header ─────────────────────────────────────────────────────────

export interface HeaderNS {
  langToggle: string;       // "العربية" when in EN, "English" when in AR
}

// ── Namespace: engine options ─────────────────────────────────────────────────

export interface EngineOptionsNS {
  title: string;
  conservativeMode: string;
  conservativeModeDesc: string;
  storageOverhead: string;
}

// ── Namespace: camera row ─────────────────────────────────────────────────────

export interface CameraRowNS {
  addGroup: string;
  duplicate: string;
  remove: string;
  genericFormula: string;

  // Field labels — technical terms stay in English; only the UI wrapper is translated
  quantity: string;
  vendor: string;
  model: string;
  resolution: string;       // دقة الفيديو  (but "4MP" stays)
  codec: string;            // Codec (unchanged in both)
  fps: string;              // FPS (unchanged in both)
  sceneComplexity: string;
  encodingMode: string;
  bitrateCeiling: string;   // Bitrate ceiling
  recordingMode: string;
  recordingHours: string;
  retention: string;
  motionPercent: string;
  audio: string;
  audioDesc: string;
  audioCodec: string;       // Audio Codec (unchanged)
  aiAnalytics: string;      // AI Analytics (unchanged)
  aiAnalyticsDesc: string;
  aiMode: string;           // AI Mode (unchanged)
}

// ── Namespace: scene options ──────────────────────────────────────────────────

export interface SceneOptionsNS {
  minimal: string;
  minimalDesc: string;
  low: string;
  lowDesc: string;
  medium: string;
  mediumDesc: string;
  high: string;
  highDesc: string;
  extreme: string;
  extremeDesc: string;
}

// ── Namespace: recording mode options ─────────────────────────────────────────

export interface RecordingModeNS {
  continuous: string;
  continuousDesc: string;
  scheduled: string;
  scheduledDesc: string;
  motionOnly: string;
  motionOnlyDesc: string;
  alarmTriggered: string;
  alarmTriggeredDesc: string;
  motionAdaptive: string;
  motionAdaptiveDesc: string;
}

// ── Namespace: results panel ──────────────────────────────────────────────────

export interface ResultsNS {
  engineWarnings: string;
  storageSection: string;
  rawStorage: string;
  rawStorageSub: string;
  withOverhead: string;
  withOverheadSub: string;
  usableCapacity: string;
  surplus: string;
  surplusSub: string;
  driveSection: string;        // Drive recommendation
  surveillanceRequired: string;
  standardGrade: string;
  budget: string;
  mainstream: string;
  enterprise: string;
  gross: string;
  overheadRatio: string;
  formFactor: string;
  nvrSection: string;          // NVR Throughput
  avgIngress: string;
  avgIngressSub: string;
  recommendedNvr: string;
  recommendedNvrSub: string;
  peakBurst: string;
  peakBurstSub: string;
  minHddWrite: string;         // Min HDD Write (unchanged)
  minHddWriteSub: string;
  portUtilisation: string;
  portUtilisationOf: string;
  bandwidthSection: string;
  lanIngress: string;
  lanIngressSub: string;
  remoteViewing: string;
  remoteViewingSub: string;
  cloudRelay: string;          // Cloud Relay (unchanged)
  cloudRelaySub: string;
  wanUplink: string;           // WAN Uplink (unchanged)
  wanUplinkSub: string;
  breakdownSection: string;
  tableHash: string;
  tableQty: string;
  tableEffective: string;      // Effective Mbps (unchanged)
  tablePeak: string;           // Peak Mbps (unchanged)
  tableDaily: string;
  tableDuty: string;
  tableTotal: string;
  configurePrompt: string;
}

// ── Root dictionary ───────────────────────────────────────────────────────────

export interface Dictionary {
  shared:        SharedNS;
  header:        HeaderNS;
  engineOptions: EngineOptionsNS;
  cameraRow:     CameraRowNS;
  sceneOptions:  SceneOptionsNS;
  recordingMode: RecordingModeNS;
  results:       ResultsNS;
}

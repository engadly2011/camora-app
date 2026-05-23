// ─────────────────────────────────────────────────────────────────────────────
// Camera types — single source of truth for the entire calc-engine package.
// ─────────────────────────────────────────────────────────────────────────────

// ── Enumerations ──────────────────────────────────────────────────────────────

export type Resolution =
  | 'CIF'    // 352×288    — 0.10 MP  (legacy analog)
  | 'D1'     // 720×480    — 0.35 MP  (legacy analog)
  | '720p'   // 1280×720   — 0.92 MP
  | '1080p'  // 1920×1080  — 2.07 MP
  | '2MP'    // 1920×1080  — alias
  | '3MP'    // 2048×1536  — 3.15 MP
  | '4MP'    // 2560×1440  — 3.69 MP
  | '5MP'    // 2560×1920  — 4.92 MP
  | '6MP'    // 3072×2048  — 6.29 MP
  | '8MP'    // 3840×2160  — 8.29 MP
  | '4K'     // 3840×2160  — alias for 8MP
  | '12MP'   // 4000×3000  — 12.00 MP
  | '20MP';  // 5120×3840  — 19.66 MP

export type Codec =
  | 'MJPEG'
  | 'H.264'
  | 'H.264+'
  | 'H.265'
  | 'H.265+'
  | 'H.265AI'
  | 'AV1';

export type AudioCodec =
  | 'G.711'
  | 'G.726'
  | 'G.722'
  | 'AAC'
  | 'MP3';

/**
 * Recording schedule that drives duty-cycle calculation.
 * alarm_triggered = like motion_only but sourced from external alarm input.
 */
export type RecordingMode =
  | 'continuous'
  | 'scheduled'
  | 'motion_only'
  | 'alarm_triggered'
  | 'motion_adaptive';

export type EncodingMode = 'CBR' | 'VBR' | 'CVBR';

/**
 * Scene complexity classification.
 * minimal — completely static scene (e.g. ATM interior, locked server room)
 * low     — mostly static, occasional people
 * medium  — typical office / retail (calibration baseline ×1.0)
 * high    — outdoor foliage, busy street
 * extreme — IR night noise, heavy rain, dense crowds
 */
export type SceneComplexity = 'minimal' | 'low' | 'medium' | 'high' | 'extreme';

/**
 * AI analytics processing location.
 * edge_metadata  — on-camera inference, only bbox/label metadata stream added
 * edge_full      — on-camera inference with enriched metadata
 * cloud_relay    — full frames relayed to cloud for inference
 * hybrid         — edge pre-filter + selective cloud relay
 */
export type AIAnalyticsMode =
  | 'edge_metadata'
  | 'edge_full'
  | 'cloud_relay'
  | 'hybrid';

export type StreamType = 'main' | 'sub';

export type RAIDProfile = 'JBOD' | 'RAID1' | 'RAID5' | 'RAID6' | 'RAID10';

// ── Camera configuration ──────────────────────────────────────────────────────

export interface CameraConfig {
  readonly id: string;
  quantity: number;

  // Identity
  vendorId: string;
  modelId: string | null;

  // Stream
  resolution: Resolution;
  fps: number;
  codec: Codec;
  streamType: StreamType;
  encodingMode: EncodingMode;

  /**
   * For CBR/CVBR: the hard bitrate ceiling set on the encoder (Mbps).
   * null = use calculated value.
   */
  targetBitrateMbps: number | null;

  // Scene
  sceneComplexity: SceneComplexity;

  /**
   * Percentage of recording time that contains detectable motion (0–100).
   * Drives VBR interpolation and motion-only duty-cycle calculation.
   */
  motionPercent: number;

  // Recording schedule
  recordingMode: RecordingMode;

  /**
   * Hours per day the camera records.
   * Required for 'scheduled'; used as a sanity-check clamp elsewhere.
   * Defaults to 24 when absent.
   */
  recordingHoursPerDay: number;

  retentionDays: number;

  // Audio
  audioEnabled: boolean;
  audioCodec: AudioCodec | null;

  // AI analytics
  aiAnalyticsEnabled: boolean;
  aiAnalyticsMode: AIAnalyticsMode | null;
}

// ── Engine options ────────────────────────────────────────────────────────────

export interface EngineOptions {
  /**
   * Multiplier applied to raw storage to account for filesystem overhead
   * and safety margin. Default: 1.20 (20%).
   */
  storageOverheadMultiplier?: number;

  /**
   * Peak-to-average bitrate ratio used when no codec-specific VBR profile
   * is available. Default: 1.50.
   */
  peakToAverageRatio?: number;

  /**
   * When true: applies a 10% conservative uplift to all bitrate figures
   * and forces RAID6 as the minimum RAID profile.
   */
  conservativeMode?: boolean;
}

// ── Per-camera result ─────────────────────────────────────────────────────────

export interface CameraResult {
  readonly cameraId: string;
  readonly quantity: number;

  // Bitrate pipeline trace
  readonly baseBitrateMbps: number;
  readonly complexityMultiplier: number;
  readonly motionAdjustedBitrateMbps: number;
  readonly audioBitrateMbps: number;
  readonly aiOverheadMbps: number;
  readonly effectiveBitrateMbps: number;
  readonly peakBitrateMbps: number;

  // Recording schedule
  readonly dutyCycleRatio: number;
  readonly activeHoursPerDay: number;

  // Storage — per single camera
  readonly storagePerCameraPerDayGB: number;
  readonly storagePerCameraRetentionGB: number;
  readonly storagePerCameraRetentionTB: number;

  // Storage — entire camera group (quantity × single)
  readonly groupStoragePerDayGB: number;
  readonly groupStorageRetentionTB: number;

  // Bitrate — entire camera group
  readonly groupEffectiveMbps: number;
  readonly groupPeakMbps: number;

  // Engineering warnings specific to this camera group
  readonly warnings: string[];
}

// ── NVR throughput ────────────────────────────────────────────────────────────

export interface NVRThroughputResult {
  readonly totalIngressMbps: number;
  readonly peakBurstMbps: number;
  readonly recommendedNVRThroughputMbps: number;
  readonly minHDDWriteSpeedMBps: number;
  readonly portUtilisationRatio: number;
  readonly warnings: string[];
}

// ── Bandwidth ─────────────────────────────────────────────────────────────────

export interface BandwidthResult {
  readonly lanIngressMbps: number;
  readonly remoteViewingMbps: number;
  readonly cloudRelayMbps: number;
  readonly recommendedUplinkMbps: number;
  readonly warnings: string[];
}

// ── HDD recommendation ────────────────────────────────────────────────────────

export interface DriveExamples {
  readonly budget: string;
  readonly mainstream: string;
  readonly enterprise: string;
}

export interface HDDRecommendation {
  readonly driveCapacityTB: number;
  readonly driveCount: number;
  readonly raidProfile: RAIDProfile;
  readonly surveillanceGradeRequired: boolean;
  readonly grossCapacityTB: number;
  readonly usableCapacityTB: number;
  /** usableCapacityTB / grossCapacityTB — e.g. 0.60 for RAID5 with 3 drives */
  readonly overheadRatio: number;
  readonly driveExamples: DriveExamples;
  readonly warnings: string[];
}

// ── System result ─────────────────────────────────────────────────────────────

export interface SystemResult {
  readonly cameras: CameraResult[];
  readonly totalCameraCount: number;
  readonly totalEffectiveMbps: number;
  readonly totalPeakMbps: number;
  readonly rawStorageTB: number;
  readonly hdd: HDDRecommendation;
  readonly nvr: NVRThroughputResult;
  readonly bandwidth: BandwidthResult;
  readonly computedAt: string;
}

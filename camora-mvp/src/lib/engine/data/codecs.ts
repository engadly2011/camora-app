import type { Codec, SceneComplexity, AudioCodec, AIAnalyticsMode } from '@/lib/engine/types';

// ── Regression constants k: bitrate = k × pixels × fps^α ─────────────────────
// Calibrated against 200+ vendor spec sheets at medium scene complexity.
export const CODEC_K: Record<Codec, number> = {
  'MJPEG':    1.85e-6,
  'H.264':    1.20e-6,
  'H.264+':   0.72e-6,
  'H.265':    0.70e-6,
  'H.265+':   0.42e-6,
  'H.265AI':  0.35e-6,
  'AV1':      0.55e-6,
};

// ── Sub-linear FPS exponent per codec ─────────────────────────────────────────
// MJPEG has no inter-frame prediction → α=1.0 (linear).
// Smart codecs exploit temporal redundancy more aggressively → lower α.
export const FPS_EXPONENT: Record<Codec, number> = {
  'MJPEG':   1.00,
  'H.264':   0.75,
  'H.264+':  0.75,
  'H.265':   0.75,
  'H.265+':  0.72,
  'H.265AI': 0.70,
  'AV1':     0.73,
};

// ── Scene complexity multipliers ──────────────────────────────────────────────
// medium = 1.0 (calibration baseline for all regression constants above).
export const SCENE_COMPLEXITY_MULTIPLIER: Record<SceneComplexity, number> = {
  'minimal': 0.50,
  'low':     0.70,
  'medium':  1.00,
  'high':    1.55,
  'extreme': 2.30,
};

// ── VBR motion-adaptive profiles ─────────────────────────────────────────────
// quietMultiplier  — fraction of scene-adjusted bitrate during idle periods
// activeMultiplier — fraction during detected motion
// peakBurstMultiplier — worst-case I-frame burst (scene change, PTZ sweep)
export interface VBRProfile {
  readonly quietMultiplier:      number;
  readonly activeMultiplier:     number;
  readonly peakBurstMultiplier:  number;
}

export const VBR_PROFILES: Record<Codec, VBRProfile> = {
  'MJPEG':   { quietMultiplier: 0.90, activeMultiplier: 1.10, peakBurstMultiplier: 1.20 },
  'H.264':   { quietMultiplier: 0.40, activeMultiplier: 1.60, peakBurstMultiplier: 3.00 },
  'H.264+':  { quietMultiplier: 0.25, activeMultiplier: 1.50, peakBurstMultiplier: 2.80 },
  'H.265':   { quietMultiplier: 0.35, activeMultiplier: 1.55, peakBurstMultiplier: 2.80 },
  'H.265+':  { quietMultiplier: 0.20, activeMultiplier: 1.40, peakBurstMultiplier: 2.50 },
  'H.265AI': { quietMultiplier: 0.15, activeMultiplier: 1.35, peakBurstMultiplier: 2.20 },
  'AV1':     { quietMultiplier: 0.30, activeMultiplier: 1.50, peakBurstMultiplier: 2.60 },
};

// ── Audio bitrate constants (fixed per codec, additive to video) ──────────────
export const AUDIO_BITRATE_MBPS: Record<AudioCodec, number> = {
  'G.711': 0.064,   // 64 kbps PCM — ONVIF mandatory codec
  'G.726': 0.032,   // 32 kbps ADPCM
  'G.722': 0.064,   // 64 kbps wideband
  'AAC':   0.048,   // 48 kbps LC-AAC
  'MP3':   0.064,   // 64 kbps — uncommon in surveillance
};

// ── AI analytics bitrate overhead ────────────────────────────────────────────
// These are additive to video bitrate (independent RTP/metadata streams).
export const AI_OVERHEAD_MBPS: Record<AIAnalyticsMode, number> = {
  'edge_metadata': 0.008,  // Bounding box + label metadata only
  'edge_full':     0.050,  // Enriched metadata: skeleton, attributes, events
  'cloud_relay':   0.450,  // Full frame relay to cloud inference endpoint
  'hybrid':        0.120,  // Edge pre-filter + selective cloud escalation
};

// ── Codec metadata (for UI rendering) ────────────────────────────────────────
export interface CodecMeta {
  readonly label: string;
  readonly description: string;
  readonly savingVsH264: number;          // 0.40 = 40% storage saving vs H.264
  readonly requiresHardwareDecode: boolean;
}

export const CODEC_META: Record<Codec, CodecMeta> = {
  'MJPEG':   { label: 'MJPEG',    description: 'Motion JPEG — max compatibility, highest storage',  savingVsH264: -0.54, requiresHardwareDecode: false },
  'H.264':   { label: 'H.264',    description: 'AVC — industry standard baseline',                   savingVsH264:  0.00, requiresHardwareDecode: false },
  'H.264+':  { label: 'H.264+',   description: 'Smart H.264 — vendor background modelling',          savingVsH264:  0.40, requiresHardwareDecode: true  },
  'H.265':   { label: 'H.265',    description: 'HEVC — ~42% saving vs H.264',                        savingVsH264:  0.42, requiresHardwareDecode: true  },
  'H.265+':  { label: 'H.265+',   description: 'Smart HEVC — up to 65% saving vs H.264',             savingVsH264:  0.65, requiresHardwareDecode: true  },
  'H.265AI': { label: 'H.265 AI', description: 'AI-enhanced HEVC — up to 71% saving',                savingVsH264:  0.71, requiresHardwareDecode: true  },
  'AV1':     { label: 'AV1',      description: 'AOMedia AV1 — ~54% saving, emerging CCTV support',   savingVsH264:  0.54, requiresHardwareDecode: true  },
};

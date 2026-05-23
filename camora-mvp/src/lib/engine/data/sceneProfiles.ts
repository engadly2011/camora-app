// ─────────────────────────────────────────────────────────────────────────────
// Scene complexity profiles
//
// Multipliers derived from DCT (Discrete Cosine Transform) coefficient
// density studies comparing entropy across camera scene types.
// The medium scene is the calibration baseline (×1.0).
// ─────────────────────────────────────────────────────────────────────────────

import type { SceneComplexity } from "@/lib/engine/types";

export interface SceneProfile {
  readonly multiplier: number;
  readonly description: string;
  readonly examples: string[];
  /** Suggested default motion percentage for this scene type. */
  readonly defaultMotionPercent: number;
}

export const SCENE_PROFILES: Record<SceneComplexity, SceneProfile> = {
  minimal: {
    multiplier:           0.50,
    description:          'Completely static scene — near-zero background change',
    examples:             ['Locked server room', 'ATM interior (no people)', 'Secure cabinet'],
    defaultMotionPercent: 5,
  },
  low: {
    multiplier:           0.60,
    description:          "Static background, minimal texture variation",
    examples:             ["Empty parking lot (night)", "Server room", "Corridor (off-hours)", "Stairwell"],
    defaultMotionPercent: 10,
  },
  medium: {
    multiplier:           1.00,  // Baseline — all regression constants calibrated here
    description:          "Typical indoor scene with moderate activity",
    examples:             ["Office floor", "Retail aisle", "Reception", "Classroom"],
    defaultMotionPercent: 30,
  },
  high: {
    multiplier:           1.55,
    description:          "High texture density or frequent motion events",
    examples:             ["Outdoor foliage", "Busy street", "Production floor", "Cafe"],
    defaultMotionPercent: 60,
  },
  extreme: {
    multiplier:           2.20,
    description:          "Maximum DCT coefficient density; near-random frames",
    examples:             ["IR night vision (snow noise)", "Heavy rain", "Dense crowd", "ATM (close-up face)"],
    defaultMotionPercent: 80,
  },
};

// ── Recording mode duty cycle constants ───────────────────────────────────────

/**
 * Duty cycle buffer for motion-only recording.
 * Motion detection always has a pre-record and post-record buffer
 * (typically 5–10 s) that pads actual motion events.
 * We add 10% to the declared motion percentage.
 */
export const MOTION_ONLY_DUTY_BUFFER = 0.10 as const;

/**
 * During motion-adaptive recording (continuous with VBR spikes),
 * the quiet-period multiplier on bitrate (vs effective bitrate).
 * Based on B-frame / P-frame dominance in non-motion segments.
 */
export const MOTION_ADAPTIVE_QUIET_RATIO = 0.40 as const;

/**
 * During motion-adaptive recording, the active-motion multiplier.
 * I-frame injection + scene change detection inflate the bitrate.
 */
export const MOTION_ADAPTIVE_ACTIVE_RATIO = 1.60 as const;

// ── AI analytics additive bitrate deltas ─────────────────────────────────────

export interface AIAnalyticsDelta {
  /** Minimum additional bitrate (Mbps). */
  readonly minMbps: number;
  /** Typical additional bitrate (Mbps) — used in calculations. */
  readonly typicalMbps: number;
  /** Maximum additional bitrate (Mbps) — used for peak. */
  readonly maxMbps: number;
  readonly description: string;
}

export const AI_ANALYTICS_DELTAS = {
  none: {
    minMbps:     0,
    typicalMbps: 0,
    maxMbps:     0,
    description: "No AI analytics",
  },
  edge: {
    minMbps:     0.050,
    typicalMbps: 0.100,
    maxMbps:     0.150,
    description: "On-camera inference — metadata stream only (object bboxes, labels, events)",
  },
  cloud_assist: {
    minMbps:     0.300,
    typicalMbps: 0.500,
    maxMbps:     0.800,
    description: "Full-frame relay to cloud for inference — significant BW addition",
  },
} as const satisfies Record<string, AIAnalyticsDelta>;

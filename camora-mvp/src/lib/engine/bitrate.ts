// ─────────────────────────────────────────────────────────────────────────────
// Bitrate Engine
//
// Five-stage deterministic pipeline:
//   1. Base bitrate  — vendor preset OR regression formula with bounds clamping
//   2. FPS scaling   — sub-linear (codec-specific exponent)
//   3. Scene multiplier — DCT-density-derived complexity factor
//   4. Encoding mode — VBR motion-adaptive interpolation / CBR ceiling
//   5. Additive deltas — audio RTP stream + AI analytics metadata stream
//
// All functions are pure. No I/O. No side effects.
// ─────────────────────────────────────────────────────────────────────────────

import type { CameraConfig, CameraResult, EngineOptions } from '@/lib/engine/types';
import {
  CODEC_K, FPS_EXPONENT, SCENE_COMPLEXITY_MULTIPLIER,
  VBR_PROFILES, AUDIO_BITRATE_MBPS, AI_OVERHEAD_MBPS,
} from '@/lib/engine/data/codecs';
import { RESOLUTION_PIXELS, REFERENCE_BITRATES_H264 } from '@/lib/engine/data/resolutions';
import { getModelPresetFull } from '@/lib/engine/data/vendors';
import { mbpsToGB, gbToTB, SECONDS_PER_HOUR } from '@/lib/engine/units';

// ─────────────────────────────────────────────────────────────────────────────
// Engine defaults
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_OPTIONS: Required<EngineOptions> = {
  storageOverheadMultiplier: 1.20,
  peakToAverageRatio:        1.50,
  conservativeMode:          false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Stage 1 — Base bitrate resolution
// ─────────────────────────────────────────────────────────────────────────────

function scalePresetToFps(
  presetBitrateMbps: number,
  referenceFps: number,
  targetFps: number,
  codec: CameraConfig['codec'],
): number {
  if (referenceFps === targetFps) return presetBitrateMbps;
  const alpha = FPS_EXPONENT[codec];
  return presetBitrateMbps * Math.pow(targetFps / referenceFps, alpha);
}

function resolveBaseBitrate(
  config: CameraConfig,
  conservativeMode: boolean,
): { bitrateMbps: number; source: 'preset' | 'regression' | 'fallback' } {
  // Priority 1: vendor/model/resolution/codec preset
  if (config.modelId !== null) {
    const preset = getModelPresetFull(config.vendorId, config.modelId, config.resolution, config.codec);
    if (preset !== undefined) {
      const scaled = scalePresetToFps(preset.specSheetBitrateMbps, preset.referenceFps, config.fps, config.codec);
      return { bitrateMbps: scaled, source: 'preset' };
    }
  }

  // Priority 2: regression formula
  const pixels = RESOLUTION_PIXELS[config.resolution];
  const k = CODEC_K[config.codec];
  const alpha = FPS_EXPONENT[config.codec];
  const regressed = k * pixels * Math.pow(config.fps, alpha);

  // Sanity-clamp to H.264 reference bounds scaled by codec ratio
  const bounds   = REFERENCE_BITRATES_H264[config.resolution];
  const codecRatio = CODEC_K[config.codec] / CODEC_K['H.264'];
  const lowerBound = bounds.minMbps * codecRatio;
  const upperBound = bounds.maxMbps * codecRatio * (conservativeMode ? 1.10 : 1.00);

  if (regressed >= lowerBound && regressed <= upperBound) {
    return { bitrateMbps: regressed, source: 'regression' };
  }

  return {
    bitrateMbps: Math.max(lowerBound, Math.min(upperBound, regressed)),
    source: 'fallback',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 3 — Scene complexity
// ─────────────────────────────────────────────────────────────────────────────

function applySceneComplexity(
  baseBitrateMbps: number,
  config: CameraConfig,
): { adjustedBitrateMbps: number; multiplier: number } {
  const multiplier = SCENE_COMPLEXITY_MULTIPLIER[config.sceneComplexity];
  return { adjustedBitrateMbps: baseBitrateMbps * multiplier, multiplier };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 4 — Encoding mode
// ─────────────────────────────────────────────────────────────────────────────

function applyEncodingMode(
  complexityAdjustedMbps: number,
  config: CameraConfig,
): { effectiveMbps: number; peakMbps: number } {
  const vbrProfile     = VBR_PROFILES[config.codec];
  const motionFraction = Math.min(1, Math.max(0, config.motionPercent / 100));

  if (config.encodingMode === 'CBR') {
    const cbr = config.targetBitrateMbps ?? complexityAdjustedMbps;
    return { effectiveMbps: cbr, peakMbps: cbr };
  }

  // VBR or CVBR — interpolate between quiet and active-motion bitrates
  const weightedMultiplier =
    (1 - motionFraction) * vbrProfile.quietMultiplier +
     motionFraction      * vbrProfile.activeMultiplier;
  let effectiveMbps = complexityAdjustedMbps * weightedMultiplier;

  // CVBR: enforce the target ceiling
  if (config.encodingMode === 'CVBR' && config.targetBitrateMbps !== null) {
    effectiveMbps = Math.min(effectiveMbps, config.targetBitrateMbps);
  }

  const peakMbps = complexityAdjustedMbps * vbrProfile.peakBurstMultiplier;
  return { effectiveMbps, peakMbps };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 5 — Additive feature deltas
// ─────────────────────────────────────────────────────────────────────────────

function resolveAudioBitrate(config: CameraConfig): number {
  if (!config.audioEnabled || config.audioCodec === null) return 0;
  return AUDIO_BITRATE_MBPS[config.audioCodec];
}

function resolveAIOverhead(config: CameraConfig): number {
  if (!config.aiAnalyticsEnabled || config.aiAnalyticsMode === null) return 0;
  return AI_OVERHEAD_MBPS[config.aiAnalyticsMode];
}

// ─────────────────────────────────────────────────────────────────────────────
// Recording duty cycle
// ─────────────────────────────────────────────────────────────────────────────

const MOTION_DUTY_CYCLE_BUFFER = 0.10 as const;

function resolveRecordingDutyCycle(config: CameraConfig): {
  dutyCycleRatio: number;
  activeHoursPerDay: number;
} {
  let dutyCycleRatio: number;

  switch (config.recordingMode) {
    case 'continuous':
      dutyCycleRatio = 1.0;
      break;

    case 'scheduled': {
      const h = config.recordingHoursPerDay;
      dutyCycleRatio = Math.min(1.0, Math.max(0, h) / 24);
      break;
    }

    case 'motion_only':
    case 'alarm_triggered': {
      const base = config.motionPercent / 100;
      dutyCycleRatio = Math.min(1.0, base + MOTION_DUTY_CYCLE_BUFFER);
      break;
    }

    case 'motion_adaptive':
      // Continuous recording; bitrate already reflects motion interpolation
      dutyCycleRatio = 1.0;
      break;
  }

  return { dutyCycleRatio, activeHoursPerDay: dutyCycleRatio * 24 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Engineering warnings
// ─────────────────────────────────────────────────────────────────────────────

function validateConfig(config: CameraConfig): string[] {
  const warnings: string[] = [];

  if (config.fps < 1 || config.fps > 60)
    warnings.push(`FPS ${config.fps} is outside the valid range [1–60].`);
  if (config.motionPercent < 0 || config.motionPercent > 100)
    warnings.push(`motionPercent ${config.motionPercent} is outside [0–100].`);
  if (config.recordingHoursPerDay < 0 || config.recordingHoursPerDay > 24)
    warnings.push(`recordingHoursPerDay ${config.recordingHoursPerDay} is outside [0–24].`);
  if (config.retentionDays < 1 || config.retentionDays > 3650)
    warnings.push(`retentionDays ${config.retentionDays} is outside [1–3650].`);
  if (config.quantity < 1)
    warnings.push(`quantity must be >= 1, got ${config.quantity}.`);
  if (config.audioEnabled && config.audioCodec === null)
    warnings.push('audioEnabled is true but audioCodec is null — no audio overhead applied.');
  if (config.aiAnalyticsEnabled && config.aiAnalyticsMode === null)
    warnings.push('aiAnalyticsEnabled is true but aiAnalyticsMode is null — no AI overhead applied.');
  if (config.encodingMode === 'CBR' && config.targetBitrateMbps === null)
    warnings.push('CBR mode selected but targetBitrateMbps is null — using calculated value instead.');
  if (config.codec === 'MJPEG' && ['8MP', '4K', '12MP', '20MP'].includes(config.resolution))
    warnings.push(`MJPEG at ${config.resolution} produces extremely high bitrates — consider H.264 or H.265.`);
  if (config.fps > 30)
    warnings.push(`High FPS (${config.fps}) increases storage significantly. Confirm NVR supports this rate at ${config.resolution}.`);
  if (config.retentionDays > 90)
    warnings.push(`Extended retention (${config.retentionDays} days) — consider tiered/cold storage architecture.`);

  return warnings;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry points
// ─────────────────────────────────────────────────────────────────────────────

export function calculateCamera(config: CameraConfig, options: EngineOptions = {}): CameraResult {
  const opts     = { ...DEFAULT_OPTIONS, ...options };
  const warnings = validateConfig(config);

  // Stage 1: base bitrate
  const { bitrateMbps: baseBitrateMbps, source } = resolveBaseBitrate(config, opts.conservativeMode);
  if (source === 'fallback')
    warnings.push(`Base bitrate was clamped to spec-sheet reference bounds for ${config.resolution}@${config.fps}fps.`);

  // Stage 3: scene complexity
  const { adjustedBitrateMbps: complexityAdjustedMbps, multiplier: complexityMultiplier } =
    applySceneComplexity(baseBitrateMbps, config);

  // Stage 4: encoding mode
  let { effectiveMbps: motionAdjustedBitrateMbps, peakMbps } =
    applyEncodingMode(complexityAdjustedMbps, config);

  if (opts.conservativeMode) {
    motionAdjustedBitrateMbps *= 1.10;
    peakMbps                  *= 1.10;
  }

  // Stage 5: additive deltas
  const audioBitrateMbps = resolveAudioBitrate(config);
  const aiOverheadMbps   = resolveAIOverhead(config);
  const effectiveBitrateMbps = motionAdjustedBitrateMbps + audioBitrateMbps + aiOverheadMbps;
  const peakBitrateMbps      = peakMbps                  + audioBitrateMbps + aiOverheadMbps;

  // Duty cycle and storage
  const { dutyCycleRatio, activeHoursPerDay } = resolveRecordingDutyCycle(config);
  const activeSecondsPerDay = activeHoursPerDay * SECONDS_PER_HOUR;
  const storagePerCameraPerDayGB       = mbpsToGB(effectiveBitrateMbps, activeSecondsPerDay);
  const storagePerCameraRetentionGB    = storagePerCameraPerDayGB    * config.retentionDays;
  const storagePerCameraRetentionTB    = gbToTB(storagePerCameraRetentionGB);

  return {
    cameraId:                    config.id,
    quantity:                    config.quantity,
    baseBitrateMbps,
    complexityMultiplier,
    motionAdjustedBitrateMbps,
    audioBitrateMbps,
    aiOverheadMbps,
    effectiveBitrateMbps,
    peakBitrateMbps,
    dutyCycleRatio,
    activeHoursPerDay,
    storagePerCameraPerDayGB,
    storagePerCameraRetentionGB,
    storagePerCameraRetentionTB,
    groupStoragePerDayGB:        storagePerCameraPerDayGB     * config.quantity,
    groupStorageRetentionTB:     storagePerCameraRetentionTB  * config.quantity,
    groupEffectiveMbps:          effectiveBitrateMbps          * config.quantity,
    groupPeakMbps:               peakBitrateMbps               * config.quantity,
    warnings,
  };
}

export function calculateCameras(
  configs: readonly CameraConfig[],
  options: EngineOptions = {},
): CameraResult[] {
  return configs.map((config) => calculateCamera(config, options));
}

// Expose internals for testing without polluting the public API surface
export const _internal = {
  resolveBaseBitrate,
  scalePresetToFps,
  applySceneComplexity,
  applyEncodingMode,
  resolveAudioBitrate,
  resolveAIOverhead,
  resolveRecordingDutyCycle,
  validateConfig,
} as const;

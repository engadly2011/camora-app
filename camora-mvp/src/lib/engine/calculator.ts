// ─────────────────────────────────────────────────────────────────────────────
// Top-level orchestrator — public entry point for all calculation consumers.
// ─────────────────────────────────────────────────────────────────────────────

import type { CameraConfig, SystemResult, EngineOptions } from './types';
import { calculateCameras, DEFAULT_OPTIONS } from '@/lib/engine/bitrate';
import { recommendHDD } from '@/lib/engine/storage';
import { calculateNVRThroughput, calculateBandwidth } from '@/lib/engine/nvr';

/**
 * Runs a complete CCTV storage and infrastructure calculation.
 *
 * @param configs  - One entry per camera group; quantity field scales the group.
 * @param options  - Optional engine tuning (overhead, conservative mode, etc.)
 * @throws {Error} when configs is empty or contains invalid values.
 */
export function calculate(
  configs: readonly CameraConfig[],
  options: EngineOptions = {},
): SystemResult {
  if (configs.length === 0) {
    throw new Error('At least one camera configuration is required.');
  }

  const opts            = { ...DEFAULT_OPTIONS, ...options };
  const cameraResults   = calculateCameras(configs, opts);
  const totalCameraCount = configs.reduce((sum, c) => sum + c.quantity, 0);
  const totalEffectiveMbps = cameraResults.reduce((sum, r) => sum + r.groupEffectiveMbps, 0);
  const totalPeakMbps      = cameraResults.reduce((sum, r) => sum + r.groupPeakMbps, 0);
  const rawStorageTB       = cameraResults.reduce((sum, r) => sum + r.groupStorageRetentionTB, 0);
  const maxRetentionDays   = Math.max(...configs.map((c) => c.retentionDays));

  const hdd = recommendHDD({
    cameraResults,
    totalCameras:             totalCameraCount,
    maxRetentionDays,
    conservativeMode:         opts.conservativeMode,
    storageOverheadMultiplier: opts.storageOverheadMultiplier,
  });

  const nvr       = calculateNVRThroughput(cameraResults);
  const bandwidth = calculateBandwidth(configs, cameraResults);

  return {
    cameras:          cameraResults,
    totalCameraCount,
    totalEffectiveMbps,
    totalPeakMbps,
    rawStorageTB,
    hdd,
    nvr,
    bandwidth,
    computedAt:       new Date().toISOString(),
  };
}

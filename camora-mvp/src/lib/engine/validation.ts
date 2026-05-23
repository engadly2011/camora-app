// ─────────────────────────────────────────────────────────────────────────────
// Input validation utilities — aligned to the canonical CameraConfig type.
// ─────────────────────────────────────────────────────────────────────────────

import type { CameraConfig } from '@/lib/engine/types';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  cameraId?: string;
  field?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

const MIN_FPS              = 1;
const MAX_FPS              = 60;
const MIN_RETENTION_DAYS   = 1;
const MAX_RETENTION_DAYS   = 3650;
const MIN_QUANTITY         = 1;
const MAX_QUANTITY         = 10_000;

export function validateCameraConfig(config: CameraConfig): ValidationResult {
  const issues: ValidationIssue[] = [];
  const id = config.id;

  if (!Number.isInteger(config.quantity) || config.quantity < MIN_QUANTITY || config.quantity > MAX_QUANTITY) {
    issues.push({ severity: 'error', cameraId: id, field: 'quantity',
      message: `Quantity must be an integer between ${MIN_QUANTITY} and ${MAX_QUANTITY}.` });
  }

  if (!Number.isFinite(config.fps) || config.fps < MIN_FPS || config.fps > MAX_FPS) {
    issues.push({ severity: 'error', cameraId: id, field: 'fps',
      message: `FPS must be between ${MIN_FPS} and ${MAX_FPS}.` });
  }

  if (!Number.isFinite(config.motionPercent) || config.motionPercent < 0 || config.motionPercent > 100) {
    issues.push({ severity: 'error', cameraId: id, field: 'motionPercent',
      message: 'Motion percentage must be between 0 and 100.' });
  }

  if (!Number.isInteger(config.retentionDays) || config.retentionDays < MIN_RETENTION_DAYS || config.retentionDays > MAX_RETENTION_DAYS) {
    issues.push({ severity: 'error', cameraId: id, field: 'retentionDays',
      message: `Retention must be an integer between ${MIN_RETENTION_DAYS} and ${MAX_RETENTION_DAYS} days.` });
  }

  if (config.recordingMode === 'scheduled') {
    const h = config.recordingHoursPerDay;
    if (!Number.isFinite(h) || h < 0.5 || h > 24) {
      issues.push({ severity: 'error', cameraId: id, field: 'recordingHoursPerDay',
        message: 'Scheduled recording hours must be between 0.5 and 24.' });
    }
  }

  if (config.encodingMode === 'CBR' && config.targetBitrateMbps !== null) {
    const t = config.targetBitrateMbps;
    if (t <= 0 || t > 200) {
      issues.push({ severity: 'error', cameraId: id, field: 'targetBitrateMbps',
        message: 'CBR target bitrate must be between 0.1 and 200 Mbps.' });
    }
  }

  if (config.audioEnabled && config.audioCodec === null) {
    issues.push({ severity: 'warning', cameraId: id, field: 'audioCodec',
      message: 'Audio is enabled but no codec specified. G.711 overhead will not be applied.' });
  }

  if (config.aiAnalyticsEnabled && config.aiAnalyticsMode === null) {
    issues.push({ severity: 'warning', cameraId: id, field: 'aiAnalyticsMode',
      message: 'AI analytics enabled but mode not specified. No overhead will be applied.' });
  }

  // Engineering advisories
  if (config.fps > 30) {
    issues.push({ severity: 'warning', cameraId: id, field: 'fps',
      message: `High FPS (${config.fps}) significantly increases storage. Verify NVR support.` });
  }

  if (config.retentionDays > 90) {
    issues.push({ severity: 'info', cameraId: id, field: 'retentionDays',
      message: `Extended retention (${config.retentionDays} days). Consider tiered storage.` });
  }

  if (config.aiAnalyticsEnabled && config.aiAnalyticsMode === 'cloud_relay' && config.quantity > 50) {
    issues.push({ severity: 'warning', cameraId: id, field: 'aiAnalyticsMode',
      message: `Cloud relay AI on ${config.quantity} cameras will require substantial WAN uplink.` });
  }

  return {
    valid:  issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

export function validateCameraConfigs(configs: CameraConfig[]): ValidationResult {
  if (configs.length === 0) {
    return { valid: false, issues: [{ severity: 'error', message: 'At least one camera configuration is required.' }] };
  }
  const allIssues: ValidationIssue[] = [];
  for (const config of configs) {
    allIssues.push(...validateCameraConfig(config).issues);
  }
  return { valid: allIssues.filter((i) => i.severity === 'error').length === 0, issues: allIssues };
}

// ─────────────────────────────────────────────────────────────────────────────
// Confidence & Risk Engine
//
// Pure function. No side effects. No React dependencies.
// Consumes SystemResult + CameraConfig[] and outputs a ConfidenceResult.
//
// Score is 0–100 (higher = better). Deductions are additive and capped at 0.
// ─────────────────────────────────────────────────────────────────────────────

import type { SystemResult, CameraConfig } from './types';

// ── Output types ──────────────────────────────────────────────────────────────

export type RiskLevel = 'excellent' | 'good' | 'moderate' | 'high';

export type HDDClass = 'surveillance' | 'enterprise' | 'ai-workload';

export interface RAIDAdvisory {
  level:   'info' | 'warning' | 'critical';
  message: string;
}

export interface NVRSaturationAdvisory {
  level:   'ok' | 'warning' | 'critical';
  message: string;
  utilisationPct: number;
}

export interface HDDUtilization {
  usedPct:   number;   // percentage of usable capacity used by raw requirement
  level:     'healthy' | 'warning' | 'critical';
}

export interface ConfidenceResult {
  score:         number;          // 0–100
  riskLevel:     RiskLevel;
  deductions:    string[];        // human-readable reasons for each deduction
  raidAdvisory:  RAIDAdvisory;
  nvrSaturation: NVRSaturationAdvisory;
  hddUtilization: HDDUtilization;
  hddClass:      HDDClass;
  hddClassLabel: string;
  hddClassReason: string;
}

// ── Risk level from score ─────────────────────────────────────────────────────

function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 85) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 40) return 'moderate';
  return 'high';
}

// ── RAID advisory ─────────────────────────────────────────────────────────────

function buildRAIDAdvisory(result: SystemResult): RAIDAdvisory {
  const { raidProfile, driveCount, driveCapacityTB } = result.hdd;

  if (raidProfile === 'JBOD' && driveCount > 1) {
    return { level: 'critical', message: 'JBOD provides zero fault tolerance. Any single drive failure causes total data loss. Use RAID5 minimum for surveillance.' };
  }
  if (raidProfile === 'RAID5' && driveCount > 12) {
    return { level: 'critical', message: `RAID5 with ${driveCount} drives: rebuild window exceeds 24h. URE during rebuild causes total array loss. Upgrade to RAID6.` };
  }
  if (raidProfile === 'RAID5' && driveCapacityTB >= 16) {
    return { level: 'critical', message: `${driveCapacityTB}TB drives in RAID5 produce rebuild windows >20h. RAID6 is required at this capacity.` };
  }
  if (raidProfile === 'RAID5' && driveCount > 8) {
    return { level: 'warning', message: `${driveCount}-drive RAID5 is approaching safe size limits. Consider upgrading to RAID6 for dual-drive fault tolerance.` };
  }
  if (raidProfile === 'RAID6') {
    return { level: 'info', message: 'RAID6 provides excellent protection — survives two simultaneous drive failures. Good choice for this deployment size.' };
  }
  if (raidProfile === 'RAID10') {
    return { level: 'info', message: 'RAID10 provides best IOPS and fast rebuild times. Ideal for high-camera-count enterprise deployments.' };
  }
  return { level: 'info', message: `${raidProfile} is appropriate for this deployment size.` };
}

// ── NVR saturation ────────────────────────────────────────────────────────────

function buildNVRSaturation(result: SystemResult): NVRSaturationAdvisory {
  const pct = result.nvr.portUtilisationRatio * 100;

  if (pct > 85) {
    return { level: 'critical', utilisationPct: pct, message: `NVR port at ${pct.toFixed(0)}% — frame drops will occur during simultaneous motion events. Split load across two NVRs or upgrade to 10 GbE.` };
  }
  if (pct > 70) {
    return { level: 'warning', utilisationPct: pct, message: `NVR port at ${pct.toFixed(0)}% — within limits but headroom is tight. Avoid adding cameras without upgrading the NVR.` };
  }
  return { level: 'ok', utilisationPct: pct, message: `NVR port at ${pct.toFixed(0)}% — healthy operating range with adequate headroom.` };
}

// ── HDD utilization ───────────────────────────────────────────────────────────

function buildHDDUtilization(result: SystemResult): HDDUtilization {
  const rawNeeded = result.rawStorageTB * 1.20; // with overhead
  const usable    = result.hdd.usableCapacityTB;
  const usedPct   = usable > 0 ? Math.min(100, (rawNeeded / usable) * 100) : 100;

  const level: HDDUtilization['level'] =
    usedPct >= 90 ? 'critical' :
    usedPct >= 75 ? 'warning'  :
    'healthy';

  return { usedPct, level };
}

// ── HDD class recommendation ──────────────────────────────────────────────────

function buildHDDClass(result: SystemResult, configs: CameraConfig[]): {
  hddClass: HDDClass; hddClassLabel: string; hddClassReason: string;
} {
  const hasAI     = configs.some(c => c.aiAnalyticsEnabled);
  const totalCams = result.totalCameraCount;
  const maxRetention = configs.length > 0 ? Math.max(...configs.map(c => c.retentionDays)) : 30;

  if (hasAI && totalCams >= 32) {
    return {
      hddClass:       'ai-workload',
      hddClassLabel:  'AI Workload Grade',
      hddClassReason: 'AI analytics with 32+ cameras requires drives rated for sustained random write workloads. Seagate SkyHawk AI or WD Purple Pro recommended.',
    };
  }
  if (totalCams >= 16 || maxRetention >= 60) {
    return {
      hddClass:       'enterprise',
      hddClassLabel:  'Enterprise Surveillance Grade',
      hddClassReason: 'Large deployment or extended retention requires drives with 360 TB/year workload rating. Seagate SkyHawk 10+ TB or WD Purple Pro.',
    };
  }
  return {
    hddClass:       'surveillance',
    hddClassLabel:  'Surveillance Grade',
    hddClassReason: 'Standard surveillance drives (WD Purple / Seagate SkyHawk) are appropriate. 180 TB/year workload rating, vibration compensation.',
  };
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function calculateConfidence(
  result:  SystemResult,
  configs: CameraConfig[],
): ConfidenceResult {
  let score = 100;
  const deductions: string[] = [];

  const maxRetention = configs.length > 0 ? Math.max(...configs.map(c => c.retentionDays)) : 30;
  const hddUtil  = buildHDDUtilization(result);
  const nvrSat   = buildNVRSaturation(result);
  const raid     = buildRAIDAdvisory(result);

  // ── Score deductions ────────────────────────────────────────────────────────

  // HDD utilization
  if (hddUtil.usedPct >= 90) {
    score -= 20;
    deductions.push(`Storage utilization critical (${hddUtil.usedPct.toFixed(0)}%) — less than 10% headroom remaining`);
  } else if (hddUtil.usedPct >= 75) {
    score -= 10;
    deductions.push(`Storage utilization high (${hddUtil.usedPct.toFixed(0)}%) — limited expansion headroom`);
  }

  // RAID risk
  if (result.hdd.raidProfile === 'JBOD' && result.hdd.driveCount > 1) {
    score -= 25;
    deductions.push('JBOD: zero fault tolerance — not suitable for surveillance retention');
  } else if (result.hdd.raidProfile === 'RAID5' && result.hdd.driveCount > 12) {
    score -= 20;
    deductions.push(`RAID5 with ${result.hdd.driveCount} drives: critical rebuild risk`);
  } else if (result.hdd.raidProfile === 'RAID5' && result.hdd.driveCount > 8) {
    score -= 8;
    deductions.push(`RAID5 with ${result.hdd.driveCount} drives: approaching safe limits`);
  }

  // Large drives in RAID5
  if (result.hdd.driveCapacityTB >= 16 && result.hdd.raidProfile === 'RAID5') {
    score -= 15;
    deductions.push(`${result.hdd.driveCapacityTB}TB drives in RAID5: rebuild time >20h, RAID6 required`);
  }

  // NVR saturation
  if (nvrSat.utilisationPct > 85) {
    score -= 20;
    deductions.push(`NVR port at ${nvrSat.utilisationPct.toFixed(0)}%: frame loss risk under peak load`);
  } else if (nvrSat.utilisationPct > 70) {
    score -= 8;
    deductions.push(`NVR port at ${nvrSat.utilisationPct.toFixed(0)}%: limited headroom for motion spikes`);
  }

  // Manual bitrate extremes — detect via CBR with suspiciously high/low values
  for (const cfg of configs) {
    if (cfg.encodingMode === 'CBR' && cfg.targetBitrateMbps !== null) {
      const isHighFpsH264 = cfg.fps > 30 && cfg.codec === 'H.264';
      if (isHighFpsH264) {
        score -= 5;
        deductions.push(`Camera ${cfg.id}: H.264 at ${cfg.fps}fps significantly increases storage — consider H.265`);
      }
      if (cfg.targetBitrateMbps > 20) {
        score -= 5;
        deductions.push(`Camera ${cfg.id}: CBR ceiling ${cfg.targetBitrateMbps}Mbps is unusually high for surveillance`);
      }
    }
  }

  // Insufficient storage headroom
  const surplusTB = result.hdd.usableCapacityTB - result.rawStorageTB * 1.20;
  if (surplusTB < 0) {
    score -= 15;
    deductions.push(`Storage deficit: ${Math.abs(surplusTB).toFixed(1)}TB shortfall — increase drive count`);
  } else if (surplusTB < result.rawStorageTB * 0.10) {
    score -= 5;
    deductions.push('Less than 10% storage surplus — no room for retention extension');
  }

  // Long retention with no RAID redundancy
  if (maxRetention > 90 && result.hdd.raidProfile === 'JBOD') {
    score -= 10;
    deductions.push(`${maxRetention}-day retention with JBOD: extended retention demands fault tolerance`);
  }

  score = Math.max(0, score);

  const { hddClass, hddClassLabel, hddClassReason } = buildHDDClass(result, configs);

  return {
    score,
    riskLevel:     scoreToRiskLevel(score),
    deductions,
    raidAdvisory:  raid,
    nvrSaturation: nvrSat,
    hddUtilization: hddUtil,
    hddClass,
    hddClassLabel,
    hddClassReason,
  };
}

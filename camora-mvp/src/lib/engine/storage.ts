// ─────────────────────────────────────────────────────────────────────────────
// Storage Engine
// ─────────────────────────────────────────────────────────────────────────────

import type { CameraResult, HDDRecommendation, RAIDProfile } from '@/lib/engine/types';
import {
  nextStandardHDDSizeTB, driveCountForRAID,
  raidUsableCapacityTB, STANDARD_HDD_SIZES_TB,
} from '@/lib/engine/units';
import {
  FILESYSTEM_OVERHEAD_FRACTION,
  SURVEILLANCE_GRADE_MIN_CAMERAS,
  SURVEILLANCE_GRADE_MIN_DAYS,
  RAID5_SAFE_MAX_DRIVES,
  RAID5_WARN_MIN_DRIVES,
} from '@/lib/engine/constants';

// ── RAID profile selection ────────────────────────────────────────────────────

export function selectRAIDProfile(
  totalCameras:    number,
  retentionDays:   number,
  conservativeMode: boolean,
): RAIDProfile {
  if (conservativeMode) return 'RAID6';
  if (totalCameras <= 2 && retentionDays <= 30) return 'JBOD';
  if (totalCameras <= 8)  return 'RAID5';
  if (totalCameras <= 16) return 'RAID6';
  return 'RAID10';
}

// ── Drive sizing ──────────────────────────────────────────────────────────────

function sizeDrives(
  requiredRawTB: number,
  raidProfile:   RAIDProfile,
): { driveCapacityTB: number; driveCount: number } {
  const requiredUsableTB = requiredRawTB / (1 - FILESYSTEM_OVERHEAD_FRACTION);

  for (const tier of STANDARD_HDD_SIZES_TB) {
    const count  = driveCountForRAID(requiredUsableTB, tier, raidProfile);
    const usable = raidUsableCapacityTB(count, tier, raidProfile) * (1 - FILESYSTEM_OVERHEAD_FRACTION);
    if (usable >= requiredRawTB && count <= 24) {
      return { driveCapacityTB: tier, driveCount: count };
    }
  }

  const maxTier = STANDARD_HDD_SIZES_TB[STANDARD_HDD_SIZES_TB.length - 1] ?? 20;
  const count   = driveCountForRAID(requiredUsableTB, maxTier, raidProfile);
  return { driveCapacityTB: maxTier, driveCount: count };
}

// ── Drive examples ────────────────────────────────────────────────────────────

function getDriveExamples(capacityTB: number): HDDRecommendation['driveExamples'] {
  const cap = STANDARD_HDD_SIZES_TB.includes(capacityTB)
    ? capacityTB : nextStandardHDDSizeTB(capacityTB);

  const map: Partial<Record<number, HDDRecommendation['driveExamples']>> = {
    1:  { budget: 'WD Purple 1TB (WD10PURZ)',   mainstream: 'Seagate SkyHawk 1TB (ST1000VX013)',   enterprise: 'WD Purple Pro 1TB'                      },
    2:  { budget: 'WD Purple 2TB (WD23PURZ)',   mainstream: 'Seagate SkyHawk 2TB (ST2000VX017)',   enterprise: 'Seagate SkyHawk AI 2TB'                 },
    3:  { budget: 'WD Purple 3TB (WD30PURZ)',   mainstream: 'Seagate SkyHawk 3TB (ST3000VX015)',   enterprise: 'Seagate SkyHawk AI 3TB'                 },
    4:  { budget: 'WD Purple 4TB (WD43PURZ)',   mainstream: 'Seagate SkyHawk 4TB (ST4000VX016)',   enterprise: 'Seagate SkyHawk AI 4TB (ST4000VE001)'   },
    6:  { budget: 'WD Purple 6TB (WD64PURZ)',   mainstream: 'Seagate SkyHawk 6TB (ST6000VX009)',   enterprise: 'Seagate SkyHawk AI 6TB'                 },
    8:  { budget: 'WD Purple 8TB (WD84PURZ)',   mainstream: 'Seagate SkyHawk 8TB (ST8000VX010)',   enterprise: 'Seagate SkyHawk AI 8TB (ST8000VE001)'   },
    10: { budget: 'WD Purple 10TB (WD101PURZ)', mainstream: 'Seagate SkyHawk 10TB (ST10000VX0004)',enterprise: 'Seagate SkyHawk AI 10TB (ST10000VE001)' },
    12: { budget: 'WD Purple 12TB (WD121PURZ)', mainstream: 'Seagate SkyHawk 12TB (ST12000VX0008)',enterprise: 'Seagate SkyHawk AI 12TB (ST12000VE001)' },
    14: { budget: 'WD Purple 14TB (WD140PURZ)', mainstream: 'Seagate SkyHawk 14TB (ST14000VX0008)',enterprise: 'Seagate SkyHawk AI 14TB'                },
    16: { budget: 'WD Purple 16TB (WD161PURZ)', mainstream: 'Seagate SkyHawk 16TB (ST16000VX001)', enterprise: 'Seagate SkyHawk AI 16TB (ST16000VE002)' },
    18: { budget: 'WD Purple 18TB (WD181PURZ)', mainstream: 'Seagate SkyHawk 18TB (ST18000VX006)', enterprise: 'Seagate SkyHawk AI 18TB'                },
    20: { budget: 'WD Purple 20TB (WD201PURZ)', mainstream: 'Seagate SkyHawk 20TB (ST20000VX001)', enterprise: 'Seagate SkyHawk AI 20TB (ST20000VE002)' },
  };
  return map[cap] ?? { budget: `WD Purple ${cap}TB`, mainstream: `Seagate SkyHawk ${cap}TB`, enterprise: `Seagate SkyHawk AI ${cap}TB` };
}

// ── Warnings ──────────────────────────────────────────────────────────────────

function generateStorageWarnings(
  driveCount:        number,
  driveCapacityTB:   number,
  raidProfile:       RAIDProfile,
  rawTotalTB:        number,
  surveillanceGrade: boolean,
): string[] {
  const warnings: string[] = [];

  if (raidProfile === 'RAID5' && driveCount > RAID5_SAFE_MAX_DRIVES) {
    warnings.push(
      `RAID5 array has ${driveCount} drives — URE rebuild risk is critical. ` +
      `Rebuild windows on ${driveCapacityTB}TB drives exceed 20h. Recommend RAID6 for arrays >${RAID5_SAFE_MAX_DRIVES} drives.`,
    );
  }

  if (raidProfile === 'RAID5' && driveCount >= RAID5_WARN_MIN_DRIVES) {
    warnings.push(
      `${driveCount}-drive RAID5 array is approaching the safe size limit. ` +
      `Consider upgrading to RAID6 for dual-drive fault tolerance.`,
    );
  }

  if (driveCapacityTB > 16 && raidProfile === 'RAID5') {
    warnings.push(
      `${driveCapacityTB}TB drives in RAID5 have rebuild times >20h — ` +
      `high probability of URE during rebuild. Upgrade to RAID6.`,
    );
  }

  if (rawTotalTB > 100) {
    warnings.push(
      `Total storage exceeds 100TB — consider a tiered architecture: ` +
      `NVR local RAID for hot footage + NAS/cloud for archival retention.`,
    );
  }

  if (!surveillanceGrade) {
    warnings.push(
      `System is below the surveillance-grade threshold, but surveillance HDDs ` +
      `(WD Purple / Seagate SkyHawk) are still recommended for any 24/7 recording deployment.`,
    );
  }

  return warnings;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface HDDRecommendationInput {
  readonly cameraResults:            readonly CameraResult[];
  readonly totalCameras:             number;
  readonly maxRetentionDays:         number;
  readonly conservativeMode:         boolean;
  readonly storageOverheadMultiplier: number;
}

export function recommendHDD(input: HDDRecommendationInput): HDDRecommendation {
  const { cameraResults, totalCameras, maxRetentionDays, conservativeMode, storageOverheadMultiplier } = input;

  const rawTotalTB             = cameraResults.reduce((sum, r) => sum + r.groupStorageRetentionTB, 0);
  const requiredWithOverheadTB = rawTotalTB * storageOverheadMultiplier;
  const warnings: string[]     = [];

  const raidProfile                    = selectRAIDProfile(totalCameras, maxRetentionDays, conservativeMode);
  const { driveCapacityTB, driveCount } = sizeDrives(requiredWithOverheadTB, raidProfile);

  const grossCapacityTB  = driveCount * driveCapacityTB;
  const rawUsableTB      = raidUsableCapacityTB(driveCount, driveCapacityTB, raidProfile);
  const usableCapacityTB = rawUsableTB * (1 - FILESYSTEM_OVERHEAD_FRACTION);
  const overheadRatio    = usableCapacityTB / grossCapacityTB;

  const surveillanceGradeRequired =
    totalCameras >= SURVEILLANCE_GRADE_MIN_CAMERAS ||
    maxRetentionDays >= SURVEILLANCE_GRADE_MIN_DAYS;

  warnings.push(
    ...generateStorageWarnings(driveCount, driveCapacityTB, raidProfile, rawTotalTB, surveillanceGradeRequired),
  );

  return {
    driveCapacityTB,
    driveCount,
    raidProfile,
    surveillanceGradeRequired,
    grossCapacityTB,
    usableCapacityTB,
    overheadRatio,
    driveExamples: getDriveExamples(driveCapacityTB),
    warnings,
  };
}

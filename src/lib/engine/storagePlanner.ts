// ─────────────────────────────────────────────────────────────────────────────
// Storage Planner — Realistic Recommendation Layer
//
// Sits on TOP of the math engine (storage.ts / units.ts).
// Does NOT change any calculation logic.
// Thinks like a CCTV integrator, not a mathematical optimizer.
//
// Core philosophy:
//   1. Prefer fewer drives with higher capacity over more drives with lower capacity
//   2. Target common NVR bay counts: 4, 6, 8, 12, 16
//   3. Prefer 8TB, 10TB, 12TB drives — market sweet spot
//   4. Avoid weird configurations (20×3TB, 14×2TB, etc.)
//   5. Pick the simplest config that meets the requirement with headroom
// ─────────────────────────────────────────────────────────────────────────────

import type { RAIDProfile } from './types';
import { raidUsableCapacityTB } from './units';
import { FILESYSTEM_OVERHEAD_FRACTION } from './constants';

// ── NVR bay targets — ordered by preference ───────────────────────────────────
// These are the common chassis sizes available in the CCTV market:
// 4-bay (desktop NVR), 6-bay (mid NVR), 8-bay (prosumer/SMB),
// 12-bay (enterprise NVR), 16-bay (rack NVR), 24-bay (storage server)
export const PREFERRED_BAY_COUNTS = [4, 6, 8, 12, 16, 24] as const;

// Minimum drives required per RAID profile
const RAID_MIN_DRIVES: Record<RAIDProfile, number> = {
  JBOD:   1,
  RAID1:  2,
  RAID5:  3,
  RAID6:  4,
  RAID10: 4,
};

// ── Drive size preference order ───────────────────────────────────────────────
// Ordered by preference: market-sweet-spot first, then up, then down
// Installers default to 8TB or 10TB — it's the most cost-effective per TB
// for surveillance-grade drives (SkyHawk, WD Purple).
const PREFERRED_DRIVE_SIZES_TB = [8, 10, 12, 16, 6, 20, 4, 18, 14, 2, 1, 3] as const;

// ── Realistic RAID selection ──────────────────────────────────────────────────

export function selectRealisticRAID(
  totalCameras:   number,
  retentionDays:  number,
  requiredTB:     number,
  conservativeMode: boolean,
): RAIDProfile {
  if (conservativeMode)                               return 'RAID6';
  if (totalCameras <= 2 && retentionDays <= 14)       return 'JBOD';
  if (totalCameras <= 4 && requiredTB < 8)            return 'RAID1'; // 2-drive mirror is fine
  if (requiredTB >= 80  || retentionDays >= 90)       return 'RAID6'; // large systems → RAID6
  if (totalCameras >= 32)                             return 'RAID6'; // many cameras → RAID6
  return 'RAID5';                                                       // default for most systems
}

// ── Core: find the most realistic configuration ───────────────────────────────

export interface RealisticStoragePlan {
  driveCount:      number;
  driveCapacityTB: number;
  raidProfile:     RAIDProfile;
  usableCapacityTB: number;
  grossCapacityTB: number;
  utilizationPct:  number;
  surplusTB:       number;
  bayCount:        number;        // which standard bay count this fits
  isPreferredBay:  boolean;       // fits a common chassis exactly
  rationale:       string;        // "Why this configuration?"
}

/**
 * Find the most realistic drive configuration for a given storage requirement.
 * Returns the first candidate that:
 *   1. Fits within a preferred bay count
 *   2. Uses a preferred drive size (8TB, 10TB, 12TB first)
 *   3. Has utilization between 50–90% (not wasteful, not overfull)
 *   4. Respects RAID minimum drive counts
 */
export function planRealisticStorage(
  requiredRawTB:  number,
  raidProfile:    RAIDProfile,
): RealisticStoragePlan {
  const requiredWithOverhead = requiredRawTB / (1 - FILESYSTEM_OVERHEAD_FRACTION);
  const minDrives = RAID_MIN_DRIVES[raidProfile];

  // Generate all candidate configurations and score them
  const candidates: Array<RealisticStoragePlan & { score: number }> = [];

  for (const driveTB of PREFERRED_DRIVE_SIZES_TB) {
    for (const bayCount of PREFERRED_BAY_COUNTS) {
      const count = bayCount;
      if (count < minDrives) continue;

      // Ensure RAID10 has even drive count
      if (raidProfile === 'RAID10' && count % 2 !== 0) continue;

      const rawUsable = raidUsableCapacityTB(count, driveTB, raidProfile);
      const usable    = rawUsable * (1 - FILESYSTEM_OVERHEAD_FRACTION);
      const gross     = count * driveTB;

      if (usable < requiredWithOverhead) continue; // doesn't meet requirement

      const utilizationPct = (requiredRawTB / usable) * 100;
      if (utilizationPct > 92) continue;           // too full — no headroom

      const surplus = usable - requiredRawTB;

      // ── Scoring: lower is better ──────────────────────────────────────────
      // We want: small bay count, preferred drive size, good utilization
      const drivePreferenceIdx = PREFERRED_DRIVE_SIZES_TB.indexOf(driveTB as typeof PREFERRED_DRIVE_SIZES_TB[number]);
      const bayPreferenceIdx   = PREFERRED_BAY_COUNTS.indexOf(bayCount as typeof PREFERRED_BAY_COUNTS[number]);

      // Ideal utilization is 65–85%
      const utilPenalty = Math.abs(utilizationPct - 75);

      const score =
        bayPreferenceIdx * 100 +          // prefer smaller bay counts
        drivePreferenceIdx * 20 +         // prefer market-sweet-spot sizes
        utilPenalty * 0.5;                // prefer utilization near 75%

      const isPreferredBay = PREFERRED_BAY_COUNTS.includes(bayCount as typeof PREFERRED_BAY_COUNTS[number]);

      candidates.push({
        driveCount:      count,
        driveCapacityTB: driveTB,
        raidProfile,
        usableCapacityTB: parseFloat(usable.toFixed(2)),
        grossCapacityTB:  gross,
        utilizationPct:  parseFloat(utilizationPct.toFixed(1)),
        surplusTB:       parseFloat(surplus.toFixed(2)),
        bayCount,
        isPreferredBay,
        rationale:       buildRationale(count, driveTB, raidProfile, bayCount, utilizationPct),
        score,
      });
    }
  }

  // Sort by score and take the best
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.score - b.score);
    const best = candidates[0]!;
    return best;
  }

  // Fallback: if no preferred configuration works (very large storage),
  // use the mathematical approach: prefer large drives, many bays
  return fallbackPlan(requiredRawTB, raidProfile, minDrives);
}

function fallbackPlan(
  requiredRawTB: number,
  raidProfile:   RAIDProfile,
  minDrives:     number,
): RealisticStoragePlan {
  // Use 20TB drives (largest available) and compute minimum drive count
  const driveTB   = 20;
  const overhead  = requiredRawTB / (1 - FILESYSTEM_OVERHEAD_FRACTION);

  let count: number;
  switch (raidProfile) {
    case 'JBOD':   count = Math.ceil(overhead / driveTB); break;
    case 'RAID1':  count = Math.max(2, Math.ceil(overhead / driveTB) * 2); break;
    case 'RAID5':  count = Math.max(3, Math.ceil(overhead / driveTB) + 1); break;
    case 'RAID6':  count = Math.max(4, Math.ceil(overhead / driveTB) + 2); break;
    case 'RAID10': count = Math.max(4, Math.ceil(overhead / driveTB) * 2); break;
    default:       count = minDrives;
  }
  if (raidProfile === 'RAID10' && count % 2 !== 0) count++;

  const rawUsable = raidUsableCapacityTB(count, driveTB, raidProfile);
  const usable    = rawUsable * (1 - FILESYSTEM_OVERHEAD_FRACTION);
  const utilPct   = (requiredRawTB / usable) * 100;

  return {
    driveCount:       count,
    driveCapacityTB:  driveTB,
    raidProfile,
    usableCapacityTB: parseFloat(usable.toFixed(2)),
    grossCapacityTB:  count * driveTB,
    utilizationPct:   parseFloat(utilPct.toFixed(1)),
    surplusTB:        parseFloat((usable - requiredRawTB).toFixed(2)),
    bayCount:         count,
    isPreferredBay:   false,
    rationale:        `Large deployment requiring ${count}× ${driveTB}TB drives in ${raidProfile}. Consider a dedicated storage server.`,
  };
}

function buildRationale(
  count:       number,
  driveTB:     number,
  raid:        RAIDProfile,
  bayCount:    number,
  utilPct:     number,
): string {
  const bayLabel =
    bayCount === 4  ? "4-bay desktop NVR" :
    bayCount === 6  ? "6-bay mid-range NVR" :
    bayCount === 8  ? "8-bay prosumer NVR" :
    bayCount === 12 ? "12-bay rack NVR" :
    bayCount === 16 ? "16-bay rack server" :
    `${bayCount}-bay storage server`;

  const utilComment =
    utilPct < 60 ? "with generous expansion room" :
    utilPct < 80 ? "at optimal utilization" :
    "with tight but adequate headroom";

  const raidComment =
    raid === 'RAID5'  ? "RAID5 provides 1-drive fault tolerance" :
    raid === 'RAID6'  ? "RAID6 survives 2 simultaneous drive failures" :
    raid === 'RAID10' ? "RAID10 for maximum performance" :
    raid === 'RAID1'  ? "RAID1 mirror for simple redundancy" :
    "JBOD — no redundancy";

  return `Fits a standard ${bayLabel} ${utilComment}. ${raidComment}.`;
}

// ── Manual storage validation ─────────────────────────────────────────────────

export interface ManualStorageInput {
  driveCount:      number;
  driveCapacityTB: number;
  raidProfile:     RAIDProfile;
  requiredRawTB:   number;
}

export interface ManualStorageResult {
  usableCapacityTB: number;
  grossCapacityTB:  number;
  utilizationPct:   number;
  surplusTB:        number;
  isValid:          boolean;
  warnings:         string[];
}

export function evaluateManualStorage(input: ManualStorageInput): ManualStorageResult {
  const { driveCount, driveCapacityTB, raidProfile, requiredRawTB } = input;
  const warnings: string[] = [];
  let isValid = true;

  // Minimum drive count validation
  const minDrives = RAID_MIN_DRIVES[raidProfile];
  if (driveCount < minDrives) {
    warnings.push(`${raidProfile} requires at least ${minDrives} drives. You have ${driveCount}.`);
    isValid = false;
  }

  // RAID10 must be even
  if (raidProfile === 'RAID10' && driveCount % 2 !== 0) {
    warnings.push(`RAID10 requires an even number of drives. Add 1 more drive.`);
    isValid = false;
  }

  const rawUsable = raidUsableCapacityTB(driveCount, driveCapacityTB, raidProfile);
  const usable    = rawUsable * (1 - FILESYSTEM_OVERHEAD_FRACTION);
  const gross     = driveCount * driveCapacityTB;
  const utilPct   = usable > 0 ? (requiredRawTB / usable) * 100 : 0;
  const surplus   = usable - requiredRawTB;

  // Insufficient capacity
  if (surplus < 0) {
    warnings.push(`Insufficient capacity: ${Math.abs(surplus).toFixed(1)}TB short. Add more drives or increase drive size.`);
    isValid = false;
  } else if (utilPct > 90) {
    warnings.push(`Storage utilization at ${utilPct.toFixed(0)}% — less than 10% headroom. Consider adding one more drive.`);
  }

  // RAID5 size warnings
  if (raidProfile === 'RAID5' && driveCount > 8) {
    warnings.push(`RAID5 with ${driveCount} drives has high rebuild risk. Consider RAID6.`);
  }

  return {
    usableCapacityTB: parseFloat(usable.toFixed(2)),
    grossCapacityTB:  gross,
    utilizationPct:   parseFloat(utilPct.toFixed(1)),
    surplusTB:        parseFloat(surplus.toFixed(2)),
    isValid,
    warnings,
  };
}

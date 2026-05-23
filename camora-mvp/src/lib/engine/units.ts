/**
 * Unit conversion utilities for CCTV storage calculations.
 * All functions are pure — no side effects, no external state.
 */

// ─── Bitrate ↔ data volume ────────────────────────────────────────────────────

export function mbpsToGB(bitrateMbps: number, seconds: number): number {
  if (bitrateMbps < 0) throw new RangeError(`bitrateMbps must be >= 0, got ${bitrateMbps}`);
  if (seconds < 0) throw new RangeError(`seconds must be >= 0, got ${seconds}`);
  return (bitrateMbps * seconds) / 8 / 1000;
}

export function mbpsHoursToGB(bitrateMbps: number, hours: number): number {
  return mbpsToGB(bitrateMbps, hours * 3600);
}

export function gbToTB(gb: number): number {
  if (gb < 0) throw new RangeError(`gb must be >= 0, got ${gb}`);
  return gb / 1000;
}

export function tbToGB(tb: number): number {
  if (tb < 0) throw new RangeError(`tb must be >= 0, got ${tb}`);
  return tb * 1000;
}

export function mbpsToMBps(mbps: number): number {
  if (mbps < 0) throw new RangeError(`mbps must be >= 0, got ${mbps}`);
  return mbps / 8;
}

export function MBpsToMbps(MBps: number): number {
  if (MBps < 0) throw new RangeError(`MBps must be >= 0, got ${MBps}`);
  return MBps * 8;
}

export function kbpsToMbps(kbps: number): number {
  if (kbps < 0) throw new RangeError(`kbps must be >= 0, got ${kbps}`);
  return kbps / 1000;
}

// ─── Storage sizing helpers ───────────────────────────────────────────────────

export const STANDARD_HDD_SIZES_TB: readonly number[] = [
  1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20,
];

export function nextStandardHDDSizeTB(requiredTB: number): number {
  if (requiredTB <= 0) throw new RangeError(`requiredTB must be > 0, got ${requiredTB}`);
  for (const size of STANDARD_HDD_SIZES_TB) {
    if (size >= requiredTB) return size;
  }
  return Math.ceil(requiredTB / 2) * 2;
}

export function driveCountForRAID(
  requiredUsableTB: number,
  driveCapacityTB: number,
  raidProfile: 'JBOD' | 'RAID1' | 'RAID5' | 'RAID6' | 'RAID10',
): number {
  if (requiredUsableTB <= 0) throw new RangeError('requiredUsableTB must be > 0');
  if (driveCapacityTB <= 0) throw new RangeError('driveCapacityTB must be > 0');

  switch (raidProfile) {
    case 'JBOD': {
      return Math.ceil(requiredUsableTB / driveCapacityTB);
    }
    case 'RAID1': {
      const drives = Math.max(2, Math.ceil(requiredUsableTB / driveCapacityTB) * 2);
      return drives % 2 === 0 ? drives : drives + 1;
    }
    case 'RAID5': {
      const n = Math.ceil(requiredUsableTB / driveCapacityTB) + 1;
      return Math.max(3, n);
    }
    case 'RAID6': {
      const n = Math.ceil(requiredUsableTB / driveCapacityTB) + 2;
      return Math.max(4, n);
    }
    case 'RAID10': {
      const n = Math.max(4, Math.ceil(requiredUsableTB / driveCapacityTB) * 2);
      return n % 2 === 0 ? n : n + 1;
    }
  }
}

export function raidUsableCapacityTB(
  driveCount: number,
  driveCapacityTB: number,
  raidProfile: 'JBOD' | 'RAID1' | 'RAID5' | 'RAID6' | 'RAID10',
): number {
  const gross = driveCount * driveCapacityTB;
  switch (raidProfile) {
    case 'JBOD':   return gross;
    case 'RAID1':  return gross / 2;
    case 'RAID5':  return (driveCount - 1) * driveCapacityTB;
    case 'RAID6':  return (driveCount - 2) * driveCapacityTB;
    case 'RAID10': return gross / 2;
  }
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR   = 3_600;
export const SECONDS_PER_DAY    = 86_400;

export function hoursToDutyCycle(hoursPerDay: number): number {
  const clamped = Math.max(0, Math.min(24, hoursPerDay));
  return clamped / 24;
}

// ─── Rounding helpers ─────────────────────────────────────────────────────────

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  const shifted = value * factor;
  const floor = Math.floor(shifted);
  const diff = shifted - floor;
  if (diff === 0.5) {
    return (floor % 2 === 0 ? floor : floor + 1) / factor;
  }
  return Math.round(shifted) / factor;
}

export function formatStorage(tb: number): string {
  if (tb < 0.001) return `${roundTo(tb * 1_000_000, 1)} MB`;
  if (tb < 1)     return `${roundTo(tb * 1000, 1)} GB`;
  if (tb < 1000)  return `${roundTo(tb, 2)} TB`;
  return `${roundTo(tb / 1000, 2)} PB`;
}

export function formatBitrate(mbps: number): string {
  if (mbps < 1) return `${roundTo(mbps * 1000, 0)} kbps`;
  return `${roundTo(mbps, 2)} Mbps`;
}

// ─── Gbps conversions ─────────────────────────────────────────────────────────

/** Megabits per second → Gigabits per second */
export function mbpsToGbps(mbps: number): number {
  if (mbps < 0) throw new RangeError(`mbps must be >= 0, got ${mbps}`);
  return mbps / 1_000;
}

/** Gigabits per second → Megabits per second */
export function gbpsToMbps(gbps: number): number {
  if (gbps < 0) throw new RangeError(`gbps must be >= 0, got ${gbps}`);
  return gbps * 1_000;
}

// ─── SI ↔ Binary storage conversions ─────────────────────────────────────────

/**
 * Convert SI terabytes (TB, 10^12 bytes) to tebibytes (TiB, 2^40 bytes).
 * This is the gap between HDD label capacity and OS-reported free space.
 * A 1 TB drive shows as ~0.909 TiB in Windows/Linux.
 */
export function tbSiToTib(tb: number): number {
  if (tb < 0) throw new RangeError(`tb must be >= 0, got ${tb}`);
  return (tb * 1e12) / (1024 ** 4);
}

/** Convert TiB (binary) to TB (SI). */
export function tibToTbSi(tib: number): number {
  if (tib < 0) throw new RangeError(`tib must be >= 0, got ${tib}`);
  return (tib * 1024 ** 4) / 1e12;
}

/** Convert gibibytes (GiB) to SI gigabytes (GB). */
export function gibToGbSi(gib: number): number {
  if (gib < 0) throw new RangeError(`gib must be >= 0, got ${gib}`);
  return (gib * 1024 ** 3) / 1e9;
}

// ─── PoE class mapping ────────────────────────────────────────────────────────

/**
 * IEEE 802.3 PoE class definitions.
 * Returns the PSE (switch port) sourcing power in watts for each class.
 *
 * Class 0–3 = 802.3af (PoE)
 * Class 4    = 802.3at (PoE+)
 * Class 5–8  = 802.3bt (PoE++) Type 3/4
 */
export type PoEClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type PoEStandard = '802.3af' | '802.3at' | '802.3bt-T3' | '802.3bt-T4';

export interface PoEClassSpec {
  readonly classs:        PoEClass;
  readonly standard:      PoEStandard;
  readonly maxSourcedW:   number;  // PSE side (switch port budget)
  readonly maxDeliveredW: number;  // PD side (camera receives)
  readonly label:         string;
}

export const POE_CLASS_SPECS: Record<PoEClass, PoEClassSpec> = {
  0: { classs: 0, standard: '802.3af',    maxSourcedW: 15.4, maxDeliveredW: 12.95, label: 'PoE Class 0 (default)'  },
  1: { classs: 1, standard: '802.3af',    maxSourcedW: 4.0,  maxDeliveredW: 3.84,  label: 'PoE Class 1 (low)'      },
  2: { classs: 2, standard: '802.3af',    maxSourcedW: 7.0,  maxDeliveredW: 6.49,  label: 'PoE Class 2 (medium)'   },
  3: { classs: 3, standard: '802.3af',    maxSourcedW: 15.4, maxDeliveredW: 12.95, label: 'PoE Class 3 (high)'     },
  4: { classs: 4, standard: '802.3at',    maxSourcedW: 30.0, maxDeliveredW: 25.50, label: 'PoE+ Class 4'           },
  5: { classs: 5, standard: '802.3bt-T3', maxSourcedW: 45.0, maxDeliveredW: 40.0,  label: 'PoE++ Class 5 (T3)'    },
  6: { classs: 6, standard: '802.3bt-T3', maxSourcedW: 60.0, maxDeliveredW: 51.0,  label: 'PoE++ Class 6 (T3)'    },
  7: { classs: 7, standard: '802.3bt-T4', maxSourcedW: 75.0, maxDeliveredW: 62.0,  label: 'PoE++ Class 7 (T4)'    },
  8: { classs: 8, standard: '802.3bt-T4', maxSourcedW: 90.0, maxDeliveredW: 71.3,  label: 'PoE++ Class 8 (T4)'    },
};

/**
 * Returns the recommended PoE class for a given required wattage.
 * Selects the lowest class that satisfies the requirement at the PD (camera) side.
 */
export function poEClassForWatts(requiredW: number): PoEClassSpec {
  const classes: PoEClass[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (const cls of classes) {
    const spec = POE_CLASS_SPECS[cls];
    if (spec.maxDeliveredW >= requiredW) return spec;
  }
  // Beyond Class 8 (71.3 W delivered) — return class 8 with caveat
  return POE_CLASS_SPECS[8];
}

/**
 * Normalises a bitrate to a human-readable string with appropriate unit.
 * Uses Gbps for ≥1000 Mbps, kbps for <1 Mbps.
 */
export function formatBitrateNorm(mbps: number): string {
  if (mbps >= 1_000) return `${roundTo(mbpsToGbps(mbps), 2)} Gbps`;
  if (mbps < 1)      return `${roundTo(mbps * 1_000, 0)} kbps`;
  return `${roundTo(mbps, 2)} Mbps`;
}

/**
 * Normalises a storage value to a human-readable string with appropriate unit.
 * Always uses SI units (TB, GB) to match HDD label capacity.
 */
export function formatStorageNorm(tb: number): string {
  if (tb >= 1_000)  return `${roundTo(tb / 1_000, 2)} PB`;
  if (tb >= 1)      return `${roundTo(tb, 2)} TB`;
  if (tb >= 0.001)  return `${roundTo(tb * 1_000, 1)} GB`;
  return `${roundTo(tb * 1_000_000, 1)} MB`;
}

/**
 * Returns the SI TB capacity that a drive labelled `tb` TB will provide
 * after NTFS/ext4 formatting and MBR/GPT overhead (~1%).
 */
export function driveFormattedCapacityTB(nominalTB: number): number {
  return nominalTB * 0.990; // ~1% formatting overhead
}

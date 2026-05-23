// ─────────────────────────────────────────────────────────────────────────────
// Vendor model preset database
// Bitrate values sourced from official spec sheets.
// All presets measured at medium scene complexity.
// ─────────────────────────────────────────────────────────────────────────────

import type { Codec, Resolution } from '@/lib/engine/types';

export interface ModelPreset {
  readonly vendorId:            string;
  readonly modelId:             string;
  readonly specSheetBitrateMbps: number;  // typical bitrate from spec sheet
  readonly maxBitrateMbps:      number;   // hardware ceiling
  readonly resolution:          Resolution;
  readonly codec:               Codec;
  readonly referenceFps:        number;
  readonly notes?:              string;
}

// Flat lookup table keyed by "vendorId:modelId:resolution:codec"
const PRESET_INDEX: Record<string, ModelPreset> = {};

function registerPreset(p: ModelPreset): void {
  const key = `${p.vendorId}:${p.modelId}:${p.resolution}:${p.codec}`;
  PRESET_INDEX[key] = p;
}

// ── Hikvision ────────────────────────────────────────────────────────────────

(function registerHikvision() {
  const v = 'hikvision';

  // DS-2CD2143G2-I  4MP AcuSense Fixed Dome
  const m1 = 'ds-2cd2143g2-i';
  registerPreset({ vendorId: v, modelId: m1, resolution: '4MP',   codec: 'H.264',  referenceFps: 20, specSheetBitrateMbps: 3.2, maxBitrateMbps: 8.0  });
  registerPreset({ vendorId: v, modelId: m1, resolution: '4MP',   codec: 'H.265',  referenceFps: 20, specSheetBitrateMbps: 1.6, maxBitrateMbps: 4.0  });
  registerPreset({ vendorId: v, modelId: m1, resolution: '4MP',   codec: 'H.265+', referenceFps: 20, specSheetBitrateMbps: 0.5, maxBitrateMbps: 4.0  });
  registerPreset({ vendorId: v, modelId: m1, resolution: '1080p', codec: 'H.264',  referenceFps: 20, specSheetBitrateMbps: 2.0, maxBitrateMbps: 6.0  });
  registerPreset({ vendorId: v, modelId: m1, resolution: '1080p', codec: 'H.265',  referenceFps: 20, specSheetBitrateMbps: 1.0, maxBitrateMbps: 3.0  });

  // DS-2CD2347G2-LU  4MP ColorVu
  const m2 = 'ds-2cd2347g2-lu';
  registerPreset({ vendorId: v, modelId: m2, resolution: '4MP', codec: 'H.264',  referenceFps: 30, specSheetBitrateMbps: 4.0, maxBitrateMbps: 10.0 });
  registerPreset({ vendorId: v, modelId: m2, resolution: '4MP', codec: 'H.265',  referenceFps: 30, specSheetBitrateMbps: 2.0, maxBitrateMbps: 5.0  });
  registerPreset({ vendorId: v, modelId: m2, resolution: '4MP', codec: 'H.265+', referenceFps: 30, specSheetBitrateMbps: 0.7, maxBitrateMbps: 5.0  });

  // DS-2CD2T87G2-L  8MP ColorVu Bullet
  const m3 = 'ds-2cd2t87g2-l';
  registerPreset({ vendorId: v, modelId: m3, resolution: '8MP', codec: 'H.264',  referenceFps: 20, specSheetBitrateMbps: 8.0, maxBitrateMbps: 16.0 });
  registerPreset({ vendorId: v, modelId: m3, resolution: '8MP', codec: 'H.265',  referenceFps: 20, specSheetBitrateMbps: 4.0, maxBitrateMbps: 8.0  });
  registerPreset({ vendorId: v, modelId: m3, resolution: '8MP', codec: 'H.265+', referenceFps: 20, specSheetBitrateMbps: 1.2, maxBitrateMbps: 8.0  });

  // DS-2DE4A425IWG-E  4MP PTZ AcuSense
  const m4 = 'ds-2de4425iwg-e';
  registerPreset({ vendorId: v, modelId: m4, resolution: '4MP', codec: 'H.264',  referenceFps: 25, specSheetBitrateMbps: 4.0, maxBitrateMbps: 10.0 });
  registerPreset({ vendorId: v, modelId: m4, resolution: '4MP', codec: 'H.265',  referenceFps: 25, specSheetBitrateMbps: 2.0, maxBitrateMbps: 5.0  });
  registerPreset({ vendorId: v, modelId: m4, resolution: '4MP', codec: 'H.265+', referenceFps: 25, specSheetBitrateMbps: 1.5, maxBitrateMbps: 5.0  });

  // DS-2CD6984G0-IHSY  12MP Fisheye
  const m5 = 'ds-2cd6984g0-ihsy';
  registerPreset({ vendorId: v, modelId: m5, resolution: '12MP', codec: 'H.264',  referenceFps: 20, specSheetBitrateMbps: 16.0, maxBitrateMbps: 32.0 });
  registerPreset({ vendorId: v, modelId: m5, resolution: '12MP', codec: 'H.265',  referenceFps: 20, specSheetBitrateMbps: 8.0,  maxBitrateMbps: 16.0 });
  registerPreset({ vendorId: v, modelId: m5, resolution: '12MP', codec: 'H.265+', referenceFps: 20, specSheetBitrateMbps: 2.5,  maxBitrateMbps: 16.0 });

  // DS-2CD2083G2-I  8MP WDR (for enterprise scenario)
  const m6 = 'ds-2cd2083g2-i';
  registerPreset({ vendorId: v, modelId: m6, resolution: '8MP', codec: 'H.264',  referenceFps: 20, specSheetBitrateMbps: 7.5, maxBitrateMbps: 16.0 });
  registerPreset({ vendorId: v, modelId: m6, resolution: '8MP', codec: 'H.265',  referenceFps: 20, specSheetBitrateMbps: 3.8, maxBitrateMbps: 8.0  });
  registerPreset({ vendorId: v, modelId: m6, resolution: '8MP', codec: 'H.265+', referenceFps: 20, specSheetBitrateMbps: 1.1, maxBitrateMbps: 8.0  });
})();

// ── Dahua ────────────────────────────────────────────────────────────────────

(function registerDahua() {
  const v = 'dahua';

  const m1 = 'ipc-hfw2849s-s-il';
  registerPreset({ vendorId: v, modelId: m1, resolution: '8MP', codec: 'H.264',  referenceFps: 15, specSheetBitrateMbps: 6.0, maxBitrateMbps: 12.0 });
  registerPreset({ vendorId: v, modelId: m1, resolution: '8MP', codec: 'H.265',  referenceFps: 15, specSheetBitrateMbps: 3.0, maxBitrateMbps: 6.0  });
  registerPreset({ vendorId: v, modelId: m1, resolution: '8MP', codec: 'H.265+', referenceFps: 15, specSheetBitrateMbps: 1.0, maxBitrateMbps: 6.0  });

  const m2 = 'ipc-hdw3849h-as-pv';
  registerPreset({ vendorId: v, modelId: m2, resolution: '8MP', codec: 'H.264',  referenceFps: 15, specSheetBitrateMbps: 7.0, maxBitrateMbps: 14.0 });
  registerPreset({ vendorId: v, modelId: m2, resolution: '8MP', codec: 'H.265',  referenceFps: 15, specSheetBitrateMbps: 3.5, maxBitrateMbps: 7.0  });
  registerPreset({ vendorId: v, modelId: m2, resolution: '8MP', codec: 'H.265+', referenceFps: 15, specSheetBitrateMbps: 1.1, maxBitrateMbps: 7.0  });
  registerPreset({ vendorId: v, modelId: m2, resolution: '4MP', codec: 'H.265',  referenceFps: 15, specSheetBitrateMbps: 2.0, maxBitrateMbps: 4.0  });
})();

// ── Axis ─────────────────────────────────────────────────────────────────────

(function registerAxis() {
  const v = 'axis';

  const m1 = 'p3245-v';
  registerPreset({ vendorId: v, modelId: m1, resolution: '1080p', codec: 'H.264', referenceFps: 25, specSheetBitrateMbps: 1.5, maxBitrateMbps: 5.0 });
  registerPreset({ vendorId: v, modelId: m1, resolution: '1080p', codec: 'H.265', referenceFps: 25, specSheetBitrateMbps: 0.9, maxBitrateMbps: 3.0 });

  const m2 = 'q6135-le';
  registerPreset({ vendorId: v, modelId: m2, resolution: '1080p', codec: 'H.264', referenceFps: 30, specSheetBitrateMbps: 2.0, maxBitrateMbps: 6.0 });
  registerPreset({ vendorId: v, modelId: m2, resolution: '1080p', codec: 'H.265', referenceFps: 30, specSheetBitrateMbps: 1.1, maxBitrateMbps: 3.5 });
})();

// ── Hanwha ───────────────────────────────────────────────────────────────────

(function registerHanwha() {
  const v = 'hanwha';

  const m1 = 'qnv-8080r';
  registerPreset({ vendorId: v, modelId: m1, resolution: '5MP',   codec: 'H.264', referenceFps: 30, specSheetBitrateMbps: 3.5, maxBitrateMbps: 8.0 });
  registerPreset({ vendorId: v, modelId: m1, resolution: '5MP',   codec: 'H.265', referenceFps: 30, specSheetBitrateMbps: 2.0, maxBitrateMbps: 4.5 });
  registerPreset({ vendorId: v, modelId: m1, resolution: '1080p', codec: 'H.264', referenceFps: 30, specSheetBitrateMbps: 2.0, maxBitrateMbps: 5.0 });
})();

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Look up a vendor-published bitrate preset for a specific model+resolution+codec.
 * Returns undefined when no preset exists — callers must fall back to regression.
 */
export function getModelPreset(
  vendorId: string,
  modelId: string,
): ModelPreset | undefined {
  // Return the first preset for this vendor+model (caller uses the codec from config)
  // Full lookup uses the composite key with resolution and codec from the caller
  const prefix = `${vendorId}:${modelId}:`;
  const key = Object.keys(PRESET_INDEX).find((k) => k.startsWith(prefix));
  return key !== undefined ? PRESET_INDEX[key] : undefined;
}

/**
 * Full composite lookup: vendorId + modelId + resolution + codec.
 */
export function getModelPresetFull(
  vendorId: string,
  modelId: string,
  resolution: string,
  codec: string,
): ModelPreset | undefined {
  return PRESET_INDEX[`${vendorId}:${modelId}:${resolution}:${codec}`];
}

export { PRESET_INDEX };

import type { Resolution } from '@/lib/engine/types';

// ── Pixel counts ──────────────────────────────────────────────────────────────
// Used in regression formula: bitrate = k × pixels × fps^α
export const RESOLUTION_PIXELS: Record<Resolution, number> = {
  'CIF':   352  * 288,
  'D1':    720  * 480,
  '720p':  1280 * 720,
  '1080p': 1920 * 1080,
  '2MP':   1920 * 1080,
  '3MP':   2048 * 1536,
  '4MP':   2560 * 1440,
  '5MP':   2560 * 1920,
  '6MP':   3072 * 2048,
  '8MP':   3840 * 2160,
  '4K':    3840 * 2160,
  '12MP':  4000 * 3000,
  '20MP':  5120 * 3840,
};

// ── H.264 reference bitrate bounds per resolution ────────────────────────────
// Derived from 200+ spec sheets at 25/30 fps, medium scene complexity.
// Used to sanity-clamp the regression formula output.
export interface BitrateBounds {
  readonly minMbps:     number;
  readonly maxMbps:     number;
  readonly typicalMbps: number;
}

export const REFERENCE_BITRATES_H264: Record<Resolution, BitrateBounds> = {
  'CIF':   { minMbps: 0.128, maxMbps: 0.512,  typicalMbps: 0.256 },
  'D1':    { minMbps: 0.256, maxMbps: 1.0,    typicalMbps: 0.512 },
  '720p':  { minMbps: 0.512, maxMbps: 2.0,    typicalMbps: 1.0   },
  '1080p': { minMbps: 1.0,   maxMbps: 6.0,    typicalMbps: 2.0   },
  '2MP':   { minMbps: 1.0,   maxMbps: 6.0,    typicalMbps: 2.0   },
  '3MP':   { minMbps: 1.5,   maxMbps: 8.0,    typicalMbps: 3.0   },
  '4MP':   { minMbps: 2.0,   maxMbps: 10.0,   typicalMbps: 4.0   },
  '5MP':   { minMbps: 2.5,   maxMbps: 12.0,   typicalMbps: 5.0   },
  '6MP':   { minMbps: 3.0,   maxMbps: 14.0,   typicalMbps: 6.0   },
  '8MP':   { minMbps: 4.0,   maxMbps: 16.0,   typicalMbps: 8.0   },
  '4K':    { minMbps: 4.0,   maxMbps: 16.0,   typicalMbps: 8.0   },
  '12MP':  { minMbps: 6.0,   maxMbps: 24.0,   typicalMbps: 12.0  },
  '20MP':  { minMbps: 10.0,  maxMbps: 40.0,   typicalMbps: 20.0  },
};

// ── Resolution metadata (for UI) ──────────────────────────────────────────────
export interface ResolutionMeta {
  readonly label:       string;
  readonly width:       number;
  readonly height:      number;
  readonly megapixels:  number;
  readonly category:    'legacy' | 'standard' | 'high' | 'ultra';
}

export const RESOLUTION_META: Record<Resolution, ResolutionMeta> = {
  'CIF':   { label: 'CIF (352×288)',     width: 352,  height: 288,  megapixels: 0.10,  category: 'legacy'   },
  'D1':    { label: 'D1 (720×480)',      width: 720,  height: 480,  megapixels: 0.35,  category: 'legacy'   },
  '720p':  { label: '720p HD',           width: 1280, height: 720,  megapixels: 0.92,  category: 'standard' },
  '1080p': { label: '1080p Full HD',     width: 1920, height: 1080, megapixels: 2.07,  category: 'standard' },
  '2MP':   { label: '2 MP (1080p)',      width: 1920, height: 1080, megapixels: 2.07,  category: 'standard' },
  '3MP':   { label: '3 MP',             width: 2048, height: 1536, megapixels: 3.15,  category: 'high'     },
  '4MP':   { label: '4 MP',             width: 2560, height: 1440, megapixels: 3.69,  category: 'high'     },
  '5MP':   { label: '5 MP',             width: 2560, height: 1920, megapixels: 4.92,  category: 'high'     },
  '6MP':   { label: '6 MP',             width: 3072, height: 2048, megapixels: 6.29,  category: 'high'     },
  '8MP':   { label: '8 MP / 4K UHD',    width: 3840, height: 2160, megapixels: 8.29,  category: 'ultra'    },
  '4K':    { label: '4K UHD (8 MP)',     width: 3840, height: 2160, megapixels: 8.29,  category: 'ultra'    },
  '12MP':  { label: '12 MP',            width: 4000, height: 3000, megapixels: 12.00, category: 'ultra'    },
  '20MP':  { label: '20 MP (5K)',        width: 5120, height: 3840, megapixels: 19.66, category: 'ultra'    },
};

export const RESOLUTION_DISPLAY_ORDER: Resolution[] = [
  '720p', '1080p', '3MP', '4MP', '5MP', '6MP', '8MP', '12MP', '20MP',
];

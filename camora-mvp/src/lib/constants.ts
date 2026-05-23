// ─────────────────────────────────────────────────────────────────────────────
// UI-layer constants
//
// Static option arrays (vendor, resolution, codec, encoding, audio) stay here
// because their labels are technical strings that do not change across locales.
// Scene complexity and recording mode options are built dynamically from the
// dictionary in the components that render them, so they aren't here.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Resolution, Codec, AudioCodec,
  EncodingMode, AIAnalyticsMode,
} from '@/lib/engine';

// ── Resolution ────────────────────────────────────────────────────────────────
// Labels are pure technical identifiers — locale-invariant.

export const RESOLUTION_OPTIONS: { value: Resolution; label: string }[] = [
  { value: "CIF",   label: "CIF — 0.1 MP (Legacy)" },
  { value: "D1",    label: "D1 — 0.35 MP (Legacy)" },
  { value: "720p",  label: "720p — 0.9 MP" },
  { value: "1080p", label: "1080p — 2 MP" },
  { value: "3MP",   label: "3 MP" },
  { value: "4MP",   label: "4 MP (2.5K)" },
  { value: "5MP",   label: "5 MP" },
  { value: "6MP",   label: "6 MP (3K)" },
  { value: "8MP",   label: "8 MP (4K UHD)" },
  { value: "12MP",  label: "12 MP" },
  { value: "20MP",  label: "20 MP (5K)" },
];

// ── Codec ─────────────────────────────────────────────────────────────────────
// Codec names are universal engineering terms — locale-invariant.
// Descriptions are short technical notes; not translated to avoid ambiguity.

export const CODEC_OPTIONS: { value: Codec; label: string; description: string }[] = [
  { value: "MJPEG",   label: "MJPEG",    description: "Max compatibility, highest storage" },
  { value: "H.264",   label: "H.264",    description: "Industry standard baseline" },
  { value: "H.264+",  label: "H.264+",   description: "Smart H.264, ~40% saving" },
  { value: "H.265",   label: "H.265",    description: "HEVC, ~42% saving vs H.264" },
  { value: "H.265+",  label: "H.265+",   description: "Smart HEVC, up to 65% saving" },
  { value: "H.265AI", label: "H.265 AI", description: "AI-enhanced, up to 71% saving" },
  { value: "AV1",     label: "AV1",      description: "Emerging standard, ~54% saving" },
];

// ── Encoding mode ─────────────────────────────────────────────────────────────
// CBR / VBR / CVBR are universal acronyms.

export const ENCODING_MODE_OPTIONS: { value: EncodingMode; label: string }[] = [
  { value: "VBR",  label: "VBR — Variable Bitrate" },
  { value: "CBR",  label: "CBR — Constant Bitrate" },
  { value: "CVBR", label: "CVBR — Capped VBR" },
];

// ── Audio codec ───────────────────────────────────────────────────────────────

export const AUDIO_CODEC_OPTIONS: { value: AudioCodec; label: string; kbps: number }[] = [
  { value: "G.711", label: "G.711 — 64 kbps PCM",       kbps: 64 },
  { value: "G.726", label: "G.726 — 32 kbps ADPCM",     kbps: 32 },
  { value: "G.722", label: "G.722 — 64 kbps Wideband",  kbps: 64 },
  { value: "AAC",   label: "AAC-LC — 48 kbps",          kbps: 48 },
  { value: "MP3",   label: "MP3 — 64 kbps",             kbps: 64 },
];

// ── AI analytics ──────────────────────────────────────────────────────────────
// Mode names stay in English; overhead is a technical unit (kbps).

export const AI_ANALYTICS_OPTIONS: { value: AIAnalyticsMode; label: string; overhead: string }[] = [
  { value: "edge_metadata", label: "Edge — Metadata",          overhead: "+8 kbps"   },
  { value: "edge_full",     label: "Edge — Full",               overhead: "+50 kbps"  },
  { value: "cloud_relay",   label: "Cloud Relay",               overhead: "+450 kbps" },
  { value: "hybrid",        label: "Hybrid (Edge + Cloud)",     overhead: "+120 kbps" },
];

// ── Vendor ────────────────────────────────────────────────────────────────────

export const VENDOR_OPTIONS = [
  { value: "hikvision", label: "Hikvision" },
  { value: "dahua",     label: "Dahua" },
  { value: "axis",      label: "Axis Communications" },
  { value: "hanwha",    label: "Hanwha Vision" },
  { value: "generic",   label: "Generic / Custom" },
] as const;

// ── Vendor model catalog ──────────────────────────────────────────────────────
// Model part numbers are locale-invariant.

export const VENDOR_MODELS: Record<string, { value: string; label: string }[]> = {
  hikvision: [
    { value: "ds-2cd2143g2-i",    label: "DS-2CD2143G2-I (4MP AcuSense)" },
    { value: "ds-2cd2347g2-lu",   label: "DS-2CD2347G2-LU (4MP ColorVu)" },
    { value: "ds-2cd2t87g2-l",    label: "DS-2CD2T87G2-L (8MP ColorVu Bullet)" },
    { value: "ds-2de4425iwg-e",   label: "DS-2DE4A425IWG-E (4MP PTZ)" },
    { value: "ds-2cd6984g0-ihsy", label: "DS-2CD6984G0-IHSY (12MP Fisheye)" },
    { value: "ds-2cd2083g2-i",    label: "DS-2CD2083G2-I (8MP WDR)" },
  ],
  dahua: [
    { value: "ipc-hfw2849s-s-il",  label: "IPC-HFW2849S-S-IL (8MP Smart Dual Light)" },
    { value: "ipc-hdw3849h-as-pv", label: "IPC-HDW3849H-AS-PV (8MP ColorVu)" },
  ],
  axis: [
    { value: "p3245-v",  label: "P3245-V (2MP Fixed Dome)" },
    { value: "q6135-le", label: "Q6135-LE (2MP PTZ)" },
  ],
  hanwha: [
    { value: "qnv-8080r", label: "QNV-8080R (5MP IR Dome)" },
  ],
  generic: [],
};

// ── Default camera configuration ──────────────────────────────────────────────

export const DEFAULT_CAMERA_CONFIG = {
  quantity:             4,
  vendorId:             "hikvision",
  modelId:              "ds-2cd2143g2-i",
  resolution:           "4MP"        as Resolution,
  fps:                  20,
  codec:                "H.265+"     as Codec,
  streamType:           "main"       as const,
  encodingMode:         "VBR"        as EncodingMode,
  targetBitrateMbps:    null,
  sceneComplexity:      "medium"     as const,
  motionPercent:        30,
  recordingMode:        "continuous" as const,
  recordingHoursPerDay: 24,
  retentionDays:        30,
  audioEnabled:         false,
  audioCodec:           null,
  aiAnalyticsEnabled:   false,
  aiAnalyticsMode:      null,
} as const;

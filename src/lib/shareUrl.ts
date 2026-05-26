// ─────────────────────────────────────────────────────────────────────────────
// Share URL — encode/decode calculator state to/from URL query params
//
// Design rules:
//   - Short param names (saves URL chars)
//   - Only the fields a user actually sets — no internal IDs
//   - Graceful degradation: invalid params → ignored, defaults used
//   - No base64, no JSON.stringify — plain readable params
// ─────────────────────────────────────────────────────────────────────────────

import type { CameraConfig, RAIDProfile } from '@/lib/engine';
import type { CalculatorFormState, CameraRow } from '@/types/calculator';

// Param key map — short keys for clean URLs
const K = {
  // Per-camera group: prefixed with index g0_, g1_, etc.
  qty:       'qty',
  vendor:    'v',
  res:       'res',
  fps:       'fps',
  codec:     'codec',
  scene:     'sc',
  motion:    'mo',
  retention: 'ret',
  recording: 'rec',
  hours:     'h',
  encoding:  'enc',
  bitrate:   'br',
  radio:     'radio',
  // Global
  raid:      'raid',
  overhead:  'ovh',
  groups:    'n',     // number of groups
} as const;

function prefix(i: number, k: string) { return `g${i}_${k}`; }

// ── Encode ────────────────────────────────────────────────────────────────────

export function encodeStateToParams(state: CalculatorFormState): URLSearchParams {
  const p = new URLSearchParams();

  p.set(K.groups, String(state.rows.length));
  p.set(K.raid,   state.raidOverride);
  p.set(K.overhead, String(Math.round((state.storageOverheadMultiplier - 1) * 100)));

  state.rows.forEach((row, i) => {
    p.set(prefix(i, K.qty),       String(row.quantity));
    p.set(prefix(i, K.vendor),    row.vendorId);
    p.set(prefix(i, K.res),       row.resolution);
    p.set(prefix(i, K.fps),       String(row.fps));
    p.set(prefix(i, K.codec),     row.codec);
    p.set(prefix(i, K.scene),     row.sceneComplexity);
    p.set(prefix(i, K.motion),    String(row.motionPercent));
    p.set(prefix(i, K.retention), String(row.retentionDays));
    p.set(prefix(i, K.recording), row.recordingMode);
    p.set(prefix(i, K.radio),     row.radioType ?? 'wired');
    if (row.recordingMode === 'scheduled') {
      p.set(prefix(i, K.hours), String(row.recordingHoursPerDay));
    }
    if (row.encodingMode !== 'VBR') {
      p.set(prefix(i, K.encoding), row.encodingMode);
      if (row.targetBitrateMbps !== null) {
        p.set(prefix(i, K.bitrate), String(row.targetBitrateMbps));
      }
    }
  });

  return p;
}

// ── Decode ────────────────────────────────────────────────────────────────────

import { DEFAULT_CAMERA_CONFIG } from '@/lib/constants';

function generateRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const VALID_RESOLUTIONS = ['720p','1080p','3MP','4MP','5MP','6MP','8MP','12MP','20MP'] as const;
const VALID_CODECS      = ['H.264','H.265','H.265+','H.265AI','H.264+'] as const;
const VALID_SCENES      = ['minimal','low','medium','high','extreme'] as const;
const VALID_RECORDING   = ['continuous','scheduled','motion_only','alarm_triggered','motion_adaptive'] as const;
const VALID_ENCODING    = ['VBR','CBR','CVBR'] as const;
const VALID_RADIO       = ['wired','wifi','4g5g','mesh'] as const;
const VALID_RAID        = ['auto','JBOD','RAID1','RAID5','RAID6','RAID10'] as const;

function safeInt(v: string | null, def: number, min: number, max: number): number {
  if (v === null) return def;
  const n = parseInt(v, 10);
  return isNaN(n) ? def : Math.min(max, Math.max(min, n));
}

function safeFloat(v: string | null, def: number): number {
  if (v === null) return def;
  const n = parseFloat(v);
  return isNaN(n) ? def : n;
}

function safeEnum<T extends string>(v: string | null, valid: readonly T[], def: T): T {
  if (v === null) return def;
  return (valid as readonly string[]).includes(v) ? v as T : def;
}

export function decodeParamsToState(
  params: URLSearchParams,
  makeDefaultRow: () => CameraRow,
): CalculatorFormState | null {
  const n = safeInt(params.get(K.groups), 0, 1, 20);
  if (n === 0) return null; // no share params present

  const raidRaw = params.get(K.raid);
  const raidOverride = safeEnum(raidRaw, VALID_RAID, 'auto');
  const overheadPct  = safeInt(params.get(K.overhead), 20, 0, 50);

  const rows: CameraRow[] = [];

  for (let i = 0; i < n; i++) {
    const g = (k: string) => params.get(prefix(i, k));

    const encodingMode = safeEnum(g(K.encoding), VALID_ENCODING, 'VBR');
    const recordingMode = safeEnum(g(K.recording), VALID_RECORDING, 'continuous');

    const row: CameraRow = {
      ...DEFAULT_CAMERA_CONFIG,
      id:     generateRowId(),
      _rowId: generateRowId(),

      quantity:    safeInt(g(K.qty), 4, 1, 10000),
      vendorId:    g(K.vendor) ?? DEFAULT_CAMERA_CONFIG.vendorId,
      modelId:     null,
      resolution:  safeEnum(g(K.res),   VALID_RESOLUTIONS, DEFAULT_CAMERA_CONFIG.resolution),
      fps:         safeInt(g(K.fps), DEFAULT_CAMERA_CONFIG.fps, 1, 60),
      codec:       safeEnum(g(K.codec), VALID_CODECS, DEFAULT_CAMERA_CONFIG.codec),
      sceneComplexity: safeEnum(g(K.scene), VALID_SCENES, DEFAULT_CAMERA_CONFIG.sceneComplexity),
      motionPercent:   safeInt(g(K.motion),    30, 0, 100),
      retentionDays:   safeInt(g(K.retention), 30, 1, 3650),
      recordingMode,
      recordingHoursPerDay: recordingMode === 'scheduled'
        ? safeInt(g(K.hours), 12, 1, 24)
        : DEFAULT_CAMERA_CONFIG.recordingHoursPerDay,
      encodingMode,
      targetBitrateMbps: encodingMode !== 'VBR'
        ? safeFloat(g(K.bitrate), null as unknown as number) || null
        : null,
      radioType: safeEnum(g(K.radio), VALID_RADIO, 'wired'),
    };

    rows.push(row);
  }

  return {
    rows,
    conservativeMode:          false,
    storageOverheadMultiplier: 1 + overheadPct / 100,
    raidOverride:              raidOverride as RAIDProfile | 'auto',
  };
}

// ── Build share URL ────────────────────────────────────────────────────────────

export function buildShareUrl(state: CalculatorFormState): string {
  if (typeof window === 'undefined') return '';
  const params  = encodeStateToParams(state);
  const base    = `${window.location.origin}${window.location.pathname}`;
  return `${base}?${params.toString()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario Presets
//
// Presets populate sensible engineering defaults when selected.
// They NEVER overwrite values after the user edits them — apply once only.
// Pure data: no engine imports, no React.
// ─────────────────────────────────────────────────────────────────────────────

import type { SceneComplexity, RecordingMode, AIAnalyticsMode, Codec } from './engine/types';

export interface ScenarioPreset {
  id:           string;
  label:        string;
  labelAr:      string;
  icon:         string;
  description:  string;

  // Fields to apply — all optional; only defined fields are written
  motionPercent?:      number;
  sceneComplexity?:    SceneComplexity;
  recordingMode?:      RecordingMode;
  recordingHoursPerDay?: number;
  codec?:              Codec;
  fps?:                number;
  aiAnalyticsEnabled?: boolean;
  aiAnalyticsMode?:    AIAnalyticsMode | null;
  audioEnabled?:       boolean;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id:          'indoor-office',
    label:       'Indoor Office',
    labelAr:     'مكتب داخلي',
    icon:        '🏢',
    description: 'Low motion, static background, business hours only',
    motionPercent:       15,
    sceneComplexity:     'low',
    recordingMode:       'scheduled',
    recordingHoursPerDay: 12,
    codec:               'H.265+',
    fps:                 15,
    aiAnalyticsEnabled:  false,
    aiAnalyticsMode:     null,
  },
  {
    id:          'retail-store',
    label:       'Retail Store',
    labelAr:     'متجر تجزئة',
    icon:        '🛍',
    description: 'High motion during open hours, scheduled recording',
    motionPercent:       65,
    sceneComplexity:     'high',
    recordingMode:       'scheduled',
    recordingHoursPerDay: 14,
    codec:               'H.265',
    fps:                 20,
    aiAnalyticsEnabled:  false,
    aiAnalyticsMode:     null,
  },
  {
    id:          'warehouse',
    label:       'Warehouse',
    labelAr:     'مستودع',
    icon:        '🏭',
    description: 'Low motion aisles, motion-adaptive, wide FOV',
    motionPercent:       20,
    sceneComplexity:     'low',
    recordingMode:       'motion_adaptive',
    codec:               'H.265+',
    fps:                 15,
    aiAnalyticsEnabled:  false,
    aiAnalyticsMode:     null,
  },
  {
    id:          'outdoor-perimeter',
    label:       'Outdoor Perimeter',
    labelAr:     'محيط خارجي',
    icon:        '🌿',
    description: 'Foliage, wind, variable light — high DCT complexity',
    motionPercent:       45,
    sceneComplexity:     'high',
    recordingMode:       'continuous',
    codec:               'H.265',
    fps:                 20,
    aiAnalyticsEnabled:  false,
    aiAnalyticsMode:     null,
  },
  {
    id:          'lpr',
    label:       'LPR / ANPR',
    labelAr:     'قراءة لوحات',
    icon:        '🚗',
    description: 'High FPS for plate capture, bright IR scene',
    motionPercent:       70,
    sceneComplexity:     'extreme',
    recordingMode:       'motion_only',
    codec:               'H.264',
    fps:                 30,
    aiAnalyticsEnabled:  true,
    aiAnalyticsMode:     'edge_metadata',
  },
  {
    id:          'ptz-tracking',
    label:       'PTZ Tracking',
    labelAr:     'تتبع PTZ',
    icon:        '🔭',
    description: 'Continuous pan/tilt — extreme motion, always active',
    motionPercent:       85,
    sceneComplexity:     'extreme',
    recordingMode:       'continuous',
    codec:               'H.265',
    fps:                 25,
    aiAnalyticsEnabled:  false,
    aiAnalyticsMode:     null,
  },
  {
    id:          'ai-analytics',
    label:       'AI Analytics Heavy',
    labelAr:     'تحليلات AI مكثفة',
    icon:        '🤖',
    description: 'Full AI pipeline — edge + cloud relay, high retention',
    motionPercent:       50,
    sceneComplexity:     'high',
    recordingMode:       'continuous',
    codec:               'H.265',
    fps:                 25,
    aiAnalyticsEnabled:  true,
    aiAnalyticsMode:     'cloud_relay',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Camora Engine — public entry point
// All calculation logic is pure TypeScript with no framework dependencies.
// ─────────────────────────────────────────────────────────────────────────────

export { calculate }             from './calculator';
export { generateRecommendation } from './recommendation';

export type {
  // Config inputs
  CameraConfig, EngineOptions, Resolution, Codec, AudioCodec,
  RecordingMode, EncodingMode, SceneComplexity, AIAnalyticsMode,
  StreamType, RAIDProfile,
  // Results
  SystemResult, CameraResult, NVRThroughputResult, BandwidthResult,
  HDDRecommendation, DriveExamples,
} from './types';

export type {
  InfrastructureRecommendation, InfrastructureTier, Confidence,
  NVRRecommendation, StorageRecommendation, PoESwitchRecommendation,
  UPSRecommendation, RackRecommendation, NetworkRecommendation,
  BOMItem, BOMCategory, EngineeringAdvisory, WarningLevel,
} from './recommendationTypes';

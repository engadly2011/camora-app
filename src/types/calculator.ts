import type { CameraConfig, RAIDProfile } from "@/lib/engine";

export type CameraRow = CameraConfig & { readonly _rowId: string };

export type StorageMode = 'auto' | 'manual';

export interface ManualStorageConfig {
  raidProfile:     RAIDProfile;
  driveCount:      number;
  driveCapacityTB: number;
}

export interface CalculatorFormState {
  rows:                     CameraRow[];
  conservativeMode:          boolean;
  storageOverheadMultiplier: number;
  raidOverride:              RAIDProfile | 'auto';
  storageMode:               StorageMode;
  manualStorage:             ManualStorageConfig;
}

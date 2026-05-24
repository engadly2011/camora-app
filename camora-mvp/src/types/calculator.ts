import type { CameraConfig, RAIDProfile } from "@/lib/engine";

export type CameraRow = CameraConfig & { readonly _rowId: string };

export interface CalculatorFormState {
  rows:                     CameraRow[];
  conservativeMode:          boolean;
  storageOverheadMultiplier: number;
  raidOverride:              RAIDProfile | 'auto';
}

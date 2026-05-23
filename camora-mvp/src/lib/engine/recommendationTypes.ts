// ─────────────────────────────────────────────────────────────────────────────
// Recommendation Engine Types
//
// These types define the structured output of the infrastructure recommendation
// engine. They are renderer-agnostic: the same schema drives the UI panel,
// the PDF appendix, and future API responses.
//
// Design principles:
//   - Every recommendation carries a confidence level and a rationale string.
//   - The BOM schema is structured for future pricing/distributor integration.
//   - Infrastructure tiers are additive: SMB ⊆ Enterprise ⊆ Critical.
//   - No strings are hardcoded in the engine; all user-facing text lives here
//     so a future i18n pass only needs to touch this file.
// ─────────────────────────────────────────────────────────────────────────────

// ── Confidence levels ─────────────────────────────────────────────────────────

/**
 * Engineering confidence in a specific choice.
 *
 * recommended  — This is the correct choice for the deployment parameters.
 *                A senior engineer would spec this without hesitation.
 * acceptable   — Within acceptable engineering tolerances. May require
 *                closer monitoring or has a non-optimal characteristic.
 * risky        — Technically feasible but carries meaningful risk of
 *                performance degradation, rebuild failure, or data loss.
 *                Should be escalated before procurement.
 */
export type Confidence = 'recommended' | 'acceptable' | 'risky';

// ── Infrastructure deployment tier ────────────────────────────────────────────

/**
 * smb              — ≤16 cameras, ≤30 days retention, single site
 * enterprise       — 17–128 cameras, multi-zone, tiered storage acceptable
 * critical         — >128 cameras, financial/government/critical infra,
 *                    maximum redundancy, no single points of failure
 */
export type InfrastructureTier = 'smb' | 'enterprise' | 'critical';

// ── BOM item ──────────────────────────────────────────────────────────────────

export type BOMCategory =
  | 'nvr'
  | 'storage'
  | 'networking'
  | 'power'
  | 'physical';

/**
 * A single line item in the Bill of Materials.
 *
 * Future fields (not yet populated, kept for schema stability):
 *   unitPriceUSD?:  number
 *   distributorSKU?: string
 *   leadTimeDays?:  number
 *   alternates?:    BOMItem[]
 */
export interface BOMItem {
  readonly id:          string;           // stable slug, e.g. "nvr-primary"
  readonly category:    BOMCategory;
  readonly label:       string;           // e.g. "Primary NVR"
  readonly description: string;           // e.g. "64-channel, 2× GbE, H.265 hardware decode"
  readonly quantity:    number;
  readonly unit:        string;           // e.g. "unit", "drive", "port", "kVA"

  /** Example product lines — not prescriptive, vendor-neutral where possible */
  readonly examples:    string[];

  readonly confidence:  Confidence;
  readonly rationale:   string;           // engineering justification in plain English

  /** Engineering note shown as a tooltip / expandable in the UI */
  readonly note?:       string;

  /** Future: will hold pricing once integrated */
  readonly pricing?:    null;

  /** Sub-items (e.g. per-NVR storage expansion trays) */
  readonly children?:   BOMItem[];
}

// ── Warning / advisory ────────────────────────────────────────────────────────

export type WarningLevel = 'info' | 'warning' | 'critical';

export interface EngineeringAdvisory {
  readonly id:        string;
  readonly level:     WarningLevel;
  readonly category:  BOMCategory | 'general';
  readonly headline:  string;     // ≤80 chars — shown in the warning banner
  readonly detail:    string;     // full explanation, may be multi-sentence
  readonly action:    string;     // concrete remediation step
}

// ── Per-subsystem recommendations ─────────────────────────────────────────────

export interface NVRRecommendation {
  readonly tier:             InfrastructureTier;
  readonly channelCount:     number;      // recommended licensed channel count
  readonly unitCount:        number;      // number of NVR units
  readonly throughputMbps:   number;      // required sustained throughput per unit
  readonly redundancy:       boolean;     // recommends N+1 hot standby
  readonly raidWritePenalty: boolean;     // RAID5 write penalty warning applies
  readonly confidence:       Confidence;
  readonly rationale:        string;
  readonly exampleProducts:  string[];
}

export interface StorageRecommendation {
  readonly driveCount:       number;
  readonly driveCapacityTB:  number;
  readonly raidProfile:      string;
  readonly rawCapacityTB:    number;
  readonly usableCapacityTB: number;
  readonly rebuildRiskHours: number;      // estimated rebuild time in hours (worst case)
  readonly rebuildRisk:      Confidence;
  readonly surveillanceGrade: boolean;
  readonly confidence:       Confidence;
  readonly rationale:        string;
}

export interface PoESwitchRecommendation {
  readonly portCount:        number;      // total PoE ports required
  readonly poeStandard:      'PoE' | 'PoE+' | 'PoE++' | 'ePoE';
  readonly totalPoEBudgetW:  number;      // minimum PoE power budget in watts
  readonly uplinkCount:      number;      // recommended uplink ports per switch
  readonly uplinkSpeedGbps:  number;      // 1 | 2.5 | 5 | 10
  readonly switchCount:      number;      // number of access switches
  readonly confidence:       Confidence;
  readonly rationale:        string;
  readonly exampleProducts:  string[];
}

export interface UPSRecommendation {
  readonly loadEstimateW:    number;      // estimated load in watts
  readonly capacityKVA:      number;      // recommended UPS capacity
  readonly runtimeMinutes:   number;      // target runtime at full load
  readonly topology:         'offline' | 'line-interactive' | 'online-double-conversion';
  readonly confidence:       Confidence;
  readonly rationale:        string;
}

export interface RackRecommendation {
  readonly rackUnitsRequired: number;    // total rack units (U) required
  readonly rackCount:         number;
  readonly coolingWarning:    boolean;   // true when thermal density exceeds ~1 kW/U
  readonly coolingNote:       string;
  readonly confidence:        Confidence;
}

export interface NetworkRecommendation {
  readonly lanBandwidthMbps:     number;
  readonly recommendedUplinkGbps: number;
  readonly vlanSegmentation:     boolean;  // recommended when cameras >16
  readonly uplinkSaturationRisk: Confidence;
  readonly confidence:           Confidence;
  readonly rationale:            string;
}

// ── Top-level recommendation document ────────────────────────────────────────

export interface InfrastructureRecommendation {
  /** Deployment tier classification */
  readonly tier:            InfrastructureTier;

  /** Per-subsystem recommendations */
  readonly nvr:             NVRRecommendation;
  readonly storage:         StorageRecommendation;
  readonly poeSwitch:       PoESwitchRecommendation;
  readonly ups:             UPSRecommendation;
  readonly rack:            RackRecommendation;
  readonly network:         NetworkRecommendation;

  /** Flat BOM ordered by category priority */
  readonly bom:             BOMItem[];

  /** Engineering advisories, sorted by level (critical → info) */
  readonly advisories:      EngineeringAdvisory[];

  /** Overall system confidence — worst of all subsystem confidences */
  readonly overallConfidence: Confidence;

  /** ISO timestamp */
  readonly generatedAt:     string;
}

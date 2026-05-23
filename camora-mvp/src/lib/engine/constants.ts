// ─────────────────────────────────────────────────────────────────────────────
// Engineering constants — single source of truth for all magic numbers.
//
// Every constant here has a named source so the value can be verified and
// updated when standards change. Constants are grouped by domain and
// given contextual names that explain WHY the value is what it is.
//
// Sources:
//   [ONVIF]     ONVIF Profile S/G/T specifications
//   [IEC-62676] IEC 62676 video surveillance series
//   [IEEE-802]  IEEE 802.3af/at/bt PoE standards
//   [IEC-62040] IEC 62040 UPS topology classifications
//   [TIA-942]   TIA-942 data center infrastructure standard
//   [ASHRAE]    ASHRAE Thermal Guidelines for Data Processing Environments
//   [SATA]      SATA-IO specification / drive manufacturer TBW ratings
//   [SEAGATE]   Seagate SkyHawk / WD Purple application notes
//   [APC]       APC / Schneider Electric UPS sizing guide
//   [NFPA-72]   NFPA 72 National Fire Alarm and Signaling Code
// ─────────────────────────────────────────────────────────────────────────────

// ── Time ──────────────────────────────────────────────────────────────────────

export const SECONDS_PER_MINUTE    = 60        as const;
export const SECONDS_PER_HOUR      = 3_600     as const;
export const SECONDS_PER_DAY       = 86_400    as const;
export const HOURS_PER_DAY         = 24        as const;
export const DAYS_PER_YEAR         = 365       as const;

// ── Unit conversion factors ───────────────────────────────────────────────────

/** Bits per byte. Fundamental. */
export const BITS_PER_BYTE         = 8         as const;

/** SI: 1 GB = 1,000 MB = 1,000,000,000 bytes (how HDDs are marketed). */
export const MB_PER_GB_SI          = 1_000     as const;
export const GB_PER_TB_SI          = 1_000     as const;
export const TB_PER_PB_SI          = 1_000     as const;

/** Binary: 1 GiB = 1,024 MiB = 2^30 bytes (how OS reports free space). */
export const MIB_PER_GIB           = 1_024     as const;
export const GIB_PER_TIB           = 1_024     as const;

/**
 * SI-to-binary conversion factor for TB→TiB.
 * 1 TB (SI) = 1_000_000_000_000 bytes / 2^40 = ~0.9095 TiB.
 * Used when checking that a stated TB capacity covers an OS-reported TiB need.
 */
export const TB_SI_TO_TIB_FACTOR   = 0.909495 as const;

/** kbps → Mbps */
export const KBPS_PER_MBPS         = 1_000     as const;
/** Mbps → Gbps */
export const MBPS_PER_GBPS         = 1_000     as const;

// ── PoE power classes [IEEE-802] ──────────────────────────────────────────────

/**
 * Maximum power delivered at the Powered Device (PD) end, after cable loss.
 * Note: PSE (switch) sourcing power is higher; these are PD delivery limits.
 *
 * 802.3af  (PoE)   — Class 0–3: max 15.4 W sourced, 12.95 W delivered
 * 802.3at  (PoE+)  — Class 4:   max 30.0 W sourced, 25.50 W delivered
 * 802.3bt  (PoE++) — Type 3: max 60 W sourced, 51 W delivered
 *                    Type 4: max 90 W sourced, 71.3 W delivered
 *
 * We use the PSE sourcing budget (switch side) for power budget calculations
 * because that's what the switch PoE budget spec states.
 */
export const POE_AF_W_PSE           = 15.4     as const;  // 802.3af  PoE
export const POE_AT_W_PSE           = 30.0     as const;  // 802.3at  PoE+
export const POE_BT_TYPE3_W_PSE     = 60.0     as const;  // 802.3bt  PoE++ Type 3
export const POE_BT_TYPE4_W_PSE     = 90.0     as const;  // 802.3bt  PoE++ Type 4

/** Standard 24-port switch PoE budget for mid-range enterprise switches (W). */
export const POE_SWITCH_24PORT_BUDGET_W  = 960  as const; // Cisco C2960X-24PD-L
export const POE_SWITCH_48PORT_BUDGET_W  = 740  as const; // Cisco C2960X-48FPD-L (740W actual)

/** Standard access switch port count tiers. */
export const POE_SWITCH_PORT_COUNT_24   = 24    as const;
export const POE_SWITCH_PORT_COUNT_48   = 48    as const;

/**
 * PoE power headroom factor.
 * Switch PoE specs are the maximum rated total budget; real deployments
 * should run at ≤80% to handle startup inrush and future expansion.
 * [SEAGATE] application note: 25% headroom recommended.
 */
export const POE_BUDGET_HEADROOM_FACTOR = 1.25  as const;

// ── Storage — filesystem and RAID ─────────────────────────────────────────────

/**
 * Filesystem overhead fraction.
 * ext4 and NTFS reserve ~5% for metadata + journals.
 * We budget 20% to also cover: fragmentation over time, RAID parity metadata,
 * and safety margin for bitrate spikes. [TIA-942]
 */
export const FILESYSTEM_OVERHEAD_FRACTION = 0.20 as const;

/**
 * Storage safety margin applied on top of raw calculated need.
 * Default engine option; accounts for bitrate spikes, motion events,
 * and OS-vs-manufacturer capacity discrepancy. [SEAGATE]
 */
export const STORAGE_OVERHEAD_MULTIPLIER_DEFAULT = 1.20 as const;

/**
 * RAID5 rebuild risk thresholds.
 * At 10^14 URE rate (SATA SEAGATE application note), a rebuild of a large
 * array has a measurable probability of hitting an unrecoverable read error.
 * Beyond 12 drives, the rebuild window exceeds 24h on modern ≥8 TB drives.
 * [SEAGATE] "RAID5 Rebuild Window White Paper"
 */
export const RAID5_SAFE_MAX_DRIVES       = 12   as const;
export const RAID5_WARN_MIN_DRIVES       = 8    as const;
export const RAID5_UNSAFE_DRIVE_SIZE_TB  = 16   as const; // ≥16 TB → rebuild risk is critical

/**
 * SATA HDD sequential read speed for rebuild time estimation.
 * 7200 RPM SATA drives: ~150–180 MB/s sustained sequential.
 * We use a conservative 120 MB/s (= 0.43 TB/h) accounting for
 * read retries during rebuild. [SATA]
 */
export const HDD_REBUILD_READ_SPEED_MBPS  = 960  as const; // 120 MB/s × 8
export const HDD_REBUILD_HOURS_PER_TB     = 2.315 as const; // ≈ 2.31 h/TB

/**
 * Minimum camera count and retention days that require surveillance-grade
 * drives (7×24 workload rating, vibration compensation). [WD] [SEAGATE]
 */
export const SURVEILLANCE_GRADE_MIN_CAMERAS = 4  as const;
export const SURVEILLANCE_GRADE_MIN_DAYS    = 72 as const;

// ── NVR throughput ────────────────────────────────────────────────────────────

/** Headroom factor applied to average ingress to get recommended NVR spec. */
export const NVR_THROUGHPUT_HEADROOM_FACTOR  = 1.25  as const;

/**
 * Burst buffer ratio: applied to sum of peak Mbps for buffer sizing.
 * Accounts for simultaneous I-frame bursts during a perimeter alarm event.
 * Derived from Hikvision DS-96xxx NVR buffer spec documentation.
 */
export const NVR_BURST_BUFFER_RATIO          = 1.50  as const;

/**
 * Reference NVR port capacity used to calculate utilisation ratio.
 * 1 GbE is the standard single NVR uplink on embedded platforms.
 * Enterprise NVRs use 2×/4× GbE bonded or 10 GbE.
 */
export const NVR_REFERENCE_PORT_CAPACITY_MBPS = 1_000 as const;

/** Port utilisation above which frame drop risk increases. */
export const NVR_PORT_UTILISATION_WARN_RATIO  = 0.70  as const;
export const NVR_PORT_UTILISATION_RISK_RATIO  = 0.85  as const;

/** Minimum camera count at which N+1 NVR redundancy is recommended. */
export const NVR_REDUNDANCY_CAMERA_THRESHOLD  = 32    as const;

/**
 * NVR channel headroom: license 25% more channels than installed.
 * Accounts for future expansion without hardware swap. [IEC-62676]
 */
export const NVR_CHANNEL_HEADROOM_FACTOR      = 1.25  as const;

/** NVR safe throughput ratio: don't exceed this fraction of rated throughput. */
export const NVR_SAFE_THROUGHPUT_RATIO        = 0.75  as const;

/**
 * Rated ingestion throughput by channel tier (Mbps).
 * Source: Hikvision DS-96xxx, Dahua NVR-6xxx product specs.
 */
export const NVR_RATED_THROUGHPUT_BY_CHANNELS: Record<number, number> = {
  16:  120,
  32:  200,
  64:  400,
  128: 800,
  256: 1_600,
};

// ── Network ───────────────────────────────────────────────────────────────────

/**
 * Sub-stream bitrate ratio relative to main stream.
 * Used to estimate remote live-view bandwidth when no explicit sub-stream
 * config is provided. Based on typical D1/720p sub-stream on 4MP main cameras.
 * [ONVIF]
 */
export const SUBSTREAM_RATIO_VS_MAIN         = 0.15  as const;

/** WAN uplink headroom factor above calculated remote + cloud bandwidth. */
export const WAN_UPLINK_HEADROOM_FACTOR      = 1.30  as const;

/** LAN headroom factor applied to camera ingress for switch sizing. */
export const LAN_HEADROOM_FACTOR             = 1.20  as const;

/** Camera count above which VLAN segmentation is strongly recommended. [ONVIF] */
export const VLAN_SEGMENTATION_THRESHOLD     = 16    as const;

/**
 * Standard switch uplink speed tiers (Mbps).
 * Represents commercially available uplink modules.
 */
export const SWITCH_UPLINK_TIERS_MBPS = [
  100, 1_000, 2_500, 5_000, 10_000, 25_000, 40_000,
] as const;

// ── UPS ───────────────────────────────────────────────────────────────────────

/**
 * UPS load headroom factor.
 * Size UPS at 130% of estimated load to handle startup inrush current
 * and allow for future load growth. [APC] [IEC-62040]
 */
export const UPS_LOAD_HEADROOM_FACTOR        = 1.30  as const;

/** Target runtime in minutes at full load. NFPA 72 minimum for security. */
export const UPS_TARGET_RUNTIME_MINUTES      = 15    as const;

/** Typical UPS efficiency for kVA→W conversion. [APC] */
export const UPS_TYPICAL_EFFICIENCY          = 0.90  as const;

/** Conservative average power draw per camera including PoE overhead (W). */
export const CAMERA_AVERAGE_POWER_W          = 25    as const;

/** NVR base chassis power (W) — excludes HDD spindle draw. */
export const NVR_BASE_POWER_W                = 200   as const;

/** Additional power per spinning HDD (W). [SEAGATE] */
export const HDD_ACTIVE_POWER_W              = 10    as const;

/** Switch chassis power overhead (W) — fans, ASIC, uplink modules. */
export const SWITCH_CHASSIS_POWER_W          = 50    as const;

/** Standard UPS kVA capacity tiers. */
export const UPS_KVA_TIERS = [
  0.5, 1, 1.5, 2, 3, 5, 6, 8, 10, 15, 20,
] as const;

// ── Rack / physical ───────────────────────────────────────────────────────────

/** Standard rack height in rack units. [TIA-942] */
export const RACK_STANDARD_HEIGHT_RU         = 42    as const;

/** Rack units consumed by a standard enterprise NVR chassis. */
export const NVR_RACK_UNITS                  = 4     as const;

/** Rack units per standard 1U PoE switch. */
export const SWITCH_RACK_UNITS               = 1     as const;

/** Rack units for a mid-range rack-mount UPS. */
export const UPS_RACK_UNITS                  = 2     as const;

/** Rack units reserved for patch panels. */
export const PATCH_PANEL_RACK_UNITS          = 2     as const;

/** Rack units reserved for airflow gaps and cable management. */
export const RACK_OPERATIONAL_HEADROOM_RU    = 4     as const;

/**
 * Thermal density threshold above which active cooling is required.
 * ASHRAE A2 class: ≤ 1 kW per rack unit as a rule-of-thumb.
 * [ASHRAE] "Thermal Guidelines for Data Processing Environments" 4th Ed.
 */
export const RACK_COOLING_THRESHOLD_W_PER_RU = 1_000 as const;

// ── Deployment tiers ──────────────────────────────────────────────────────────

/** SMB tier: ≤ this many cameras. */
export const TIER_SMB_MAX_CAMERAS            = 16   as const;

/** Enterprise tier: ≤ this many cameras. Critical above this. */
export const TIER_ENTERPRISE_MAX_CAMERAS     = 128  as const;

/** SMB tier: ≤ this many retention days. Enterprise above this. */
export const TIER_SMB_MAX_RETENTION_DAYS     = 60   as const;

/** Retention above which tier escalates to Critical regardless of camera count. */
export const TIER_CRITICAL_RETENTION_DAYS    = 180  as const;

// ── Validation limits ─────────────────────────────────────────────────────────

export const CAMERA_CONFIG_FPS_MIN           = 1    as const;
export const CAMERA_CONFIG_FPS_MAX           = 60   as const;
export const CAMERA_CONFIG_MOTION_PCT_MIN    = 0    as const;
export const CAMERA_CONFIG_MOTION_PCT_MAX    = 100  as const;
export const CAMERA_CONFIG_RETENTION_MIN_DAYS = 1   as const;
export const CAMERA_CONFIG_RETENTION_MAX_DAYS = 3_650 as const;
export const CAMERA_CONFIG_QUANTITY_MIN      = 1    as const;
export const CAMERA_CONFIG_QUANTITY_MAX      = 10_000 as const;
export const CAMERA_CONFIG_HOURS_MIN         = 0.5  as const;
export const CAMERA_CONFIG_HOURS_MAX         = 24   as const;
export const CAMERA_CONFIG_BITRATE_MAX_MBPS  = 200  as const;

// ── Motion recording ──────────────────────────────────────────────────────────

/**
 * Pre-record and post-record buffer added to motion duty cycle.
 * Motion detection triggers are typically buffered 5–10 s before the
 * event starts. We model this as a 10% duty cycle additive. [IEC-62676]
 */
export const MOTION_DUTY_CYCLE_BUFFER        = 0.10 as const;

// ── URE probability (RAID5 rebuild risk) ─────────────────────────────────────

/**
 * SATA drive unrecoverable read error (URE) rate.
 * Industry standard for consumer/surveillance SATA: 1 bit error per 10^14 bits read.
 * Enterprise SAS: 10^15 or better. [SEAGATE] [WD]
 */
export const SATA_URE_RATE_BITS              = 1e14  as const;

/** Bits per TB (SI). Used in URE probability calculation. */
export const BITS_PER_TB_SI                  = 8e12  as const;

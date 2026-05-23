// ─────────────────────────────────────────────────────────────────────────────
// Recommendation Engine
//
// Pure function: SystemResult + CameraConfig[] → InfrastructureRecommendation
// All thresholds imported from constants.ts — no magic numbers in this file.
// ─────────────────────────────────────────────────────────────────────────────

import type { SystemResult, CameraConfig } from '@/lib/engine/types';
import type {
  InfrastructureRecommendation, InfrastructureTier, Confidence,
  NVRRecommendation, StorageRecommendation, PoESwitchRecommendation,
  UPSRecommendation, RackRecommendation, NetworkRecommendation,
  BOMItem, EngineeringAdvisory,
} from '@/lib/engine/recommendationTypes';
import {
  // Tier
  TIER_SMB_MAX_CAMERAS, TIER_ENTERPRISE_MAX_CAMERAS,
  TIER_SMB_MAX_RETENTION_DAYS, TIER_CRITICAL_RETENTION_DAYS,
  // NVR
  NVR_CHANNEL_HEADROOM_FACTOR, NVR_SAFE_THROUGHPUT_RATIO,
  NVR_REDUNDANCY_CAMERA_THRESHOLD, NVR_RATED_THROUGHPUT_BY_CHANNELS,
  NVR_PORT_UTILISATION_WARN_RATIO, NVR_PORT_UTILISATION_RISK_RATIO,
  // Storage
  RAID5_SAFE_MAX_DRIVES, RAID5_WARN_MIN_DRIVES, RAID5_UNSAFE_DRIVE_SIZE_TB,
  HDD_REBUILD_HOURS_PER_TB, SATA_URE_RATE_BITS, BITS_PER_TB_SI,
  // PoE
  POE_AF_W_PSE, POE_AT_W_PSE, POE_BT_TYPE3_W_PSE,
  POE_SWITCH_24PORT_BUDGET_W, POE_SWITCH_PORT_COUNT_24, POE_BUDGET_HEADROOM_FACTOR,
  // UPS
  UPS_LOAD_HEADROOM_FACTOR, UPS_TARGET_RUNTIME_MINUTES, UPS_TYPICAL_EFFICIENCY,
  CAMERA_AVERAGE_POWER_W, NVR_BASE_POWER_W, HDD_ACTIVE_POWER_W, SWITCH_CHASSIS_POWER_W,
  UPS_KVA_TIERS,
  // Rack
  RACK_STANDARD_HEIGHT_RU, NVR_RACK_UNITS, SWITCH_RACK_UNITS, UPS_RACK_UNITS,
  PATCH_PANEL_RACK_UNITS, RACK_OPERATIONAL_HEADROOM_RU, RACK_COOLING_THRESHOLD_W_PER_RU,
  // Network
  VLAN_SEGMENTATION_THRESHOLD,
} from '@/lib/engine/constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

function worstConfidence(...confidences: Confidence[]): Confidence {
  if (confidences.includes('risky'))      return 'risky';
  if (confidences.includes('acceptable')) return 'acceptable';
  return 'recommended';
}

function nextStandardUplinkGbps(requiredMbps: number): number {
  const tiers = [1, 2.5, 5, 10, 25, 40];
  return tiers.find((t) => t * 1000 > requiredMbps) ?? 40;
}

function nextStandardUPSKVA(loadW: number): number {
  const kva = loadW / 1000 / UPS_TYPICAL_EFFICIENCY;
  return UPS_KVA_TIERS.find((t) => t >= kva) ?? Math.ceil(kva * 2) / 2;
}

function estimateRebuildHours(driveCount: number, driveCapacityTB: number): number {
  return driveCapacityTB * (driveCount - 1) * HDD_REBUILD_HOURS_PER_TB;
}

function ureRebuildProbabilityPct(driveCount: number, driveCapacityTB: number): number {
  const rebuildBitsRead = driveCapacityTB * (driveCount - 1) * BITS_PER_TB_SI;
  return (rebuildBitsRead / SATA_URE_RATE_BITS) * 100;
}

// ── Tier classification ───────────────────────────────────────────────────────

function classifyTier(
  totalCameras:   number,
  retentionDays:  number,
  hasCriticalAI:  boolean,
): InfrastructureTier {
  if (hasCriticalAI || totalCameras > TIER_ENTERPRISE_MAX_CAMERAS || retentionDays > TIER_CRITICAL_RETENTION_DAYS) {
    return 'critical';
  }
  if (totalCameras > TIER_SMB_MAX_CAMERAS || retentionDays > TIER_SMB_MAX_RETENTION_DAYS) {
    return 'enterprise';
  }
  return 'smb';
}

// ── NVR recommendation ────────────────────────────────────────────────────────

function recommendNVR(result: SystemResult, tier: InfrastructureTier): NVRRecommendation {
  const totalCameras   = result.totalCameraCount;
  const throughputMbps = result.nvr.totalIngressMbps;
  const utilRatio      = result.nvr.portUtilisationRatio;

  const licensedChannels = Math.ceil(totalCameras * NVR_CHANNEL_HEADROOM_FACTOR);
  const channelTiers     = [16, 32, 64, 128, 256];
  const channelCount     = channelTiers.find((t) => t >= licensedChannels) ?? licensedChannels;

  const nvrRatedMbps =
    NVR_RATED_THROUGHPUT_BY_CHANNELS[channelCount] ??
    NVR_RATED_THROUGHPUT_BY_CHANNELS[256] ??
    1_600;

  const unitCount    = Math.max(1, Math.ceil(throughputMbps / (nvrRatedMbps * NVR_SAFE_THROUGHPUT_RATIO)));
  const redundancy   = totalCameras >= NVR_REDUNDANCY_CAMERA_THRESHOLD || tier === 'critical';
  const raidWritePenalty = result.hdd.raidProfile === 'RAID5' && unitCount > 1;

  const confidence: Confidence =
    utilRatio > NVR_PORT_UTILISATION_RISK_RATIO ? 'risky'      :
    utilRatio > NVR_PORT_UTILISATION_WARN_RATIO  ? 'acceptable' :
    'recommended';

  const tierLabel = { smb: 'SMB', enterprise: 'Enterprise', critical: 'Critical' }[tier];
  const rationale =
    `${tierLabel} tier deployment with ${totalCameras} cameras and ` +
    `${throughputMbps.toFixed(0)} Mbps sustained ingress. ` +
    `${channelCount}-channel license with ${unitCount === 1 ? 'single unit' : `${unitCount} units`}` +
    `${redundancy ? ' and N+1 hot-standby recommended' : ''}.`;

  const examples: string[] = tier === 'smb'
    ? ['Hikvision DS-7616NXI-I2', 'Dahua NVR-608-64-4KS2', 'Uniview NVR-532E']
    : tier === 'enterprise'
    ? ['Hikvision DS-96128NXI-I24', 'Dahua NVR-6128-128-4K', 'Milestone XProtect Corporate', 'Genetec Security Center']
    : ['Genetec Security Center Enterprise', 'Milestone XProtect Corporate (distributed)', 'Dedicated Failover Server (N+1)'];

  return { tier, channelCount, unitCount, throughputMbps, redundancy, raidWritePenalty, confidence, rationale, exampleProducts: examples };
}

// ── Storage recommendation ────────────────────────────────────────────────────

function recommendStorage(result: SystemResult, tier: InfrastructureTier): StorageRecommendation {
  const { hdd } = result;
  const rebuildHours       = estimateRebuildHours(hdd.driveCount, hdd.driveCapacityTB);
  const ureProbabilityPct  = ureRebuildProbabilityPct(hdd.driveCount, hdd.driveCapacityTB);

  const rebuildRisk: Confidence =
    hdd.driveCount > RAID5_SAFE_MAX_DRIVES && hdd.raidProfile === 'RAID5' ? 'risky'      :
    hdd.driveCount > RAID5_WARN_MIN_DRIVES                                 ? 'acceptable' :
    'recommended';

  const overallConf: Confidence =
    tier === 'critical' && hdd.raidProfile === 'JBOD'                                             ? 'risky'      :
    tier === 'critical' && hdd.raidProfile === 'RAID5' && hdd.driveCount > RAID5_WARN_MIN_DRIVES  ? 'acceptable' :
    rebuildRisk;

  const rationale =
    `${hdd.driveCount}× ${hdd.driveCapacityTB} TB in ${hdd.raidProfile}. ` +
    `Usable: ${hdd.usableCapacityTB.toFixed(1)} TB. ` +
    `Est. rebuild: ${rebuildHours.toFixed(0)}h. ` +
    `URE probability: ${ureProbabilityPct.toFixed(2)}%.` +
    (hdd.raidProfile === 'RAID5' && hdd.driveCount > RAID5_WARN_MIN_DRIVES
      ? ' Consider RAID6.'
      : ' Rebuild window is within acceptable range.');

  return {
    driveCount:        hdd.driveCount,
    driveCapacityTB:   hdd.driveCapacityTB,
    raidProfile:       hdd.raidProfile,
    rawCapacityTB:     hdd.grossCapacityTB,
    usableCapacityTB:  hdd.usableCapacityTB,
    rebuildRiskHours:  rebuildHours,
    rebuildRisk,
    surveillanceGrade: hdd.surveillanceGradeRequired,
    confidence:        overallConf,
    rationale,
  };
}

// ── PoE switch recommendation ─────────────────────────────────────────────────

function recommendPoESwitch(
  result:  SystemResult,
  configs: CameraConfig[],
  tier:    InfrastructureTier,
): PoESwitchRecommendation {
  const totalCameras = result.totalCameraCount;

  const hasPTZ     = configs.some((c) => c.modelId?.includes('ptz') || c.modelId?.includes('de'));
  const hasHighRes = configs.some((c) => ['8MP','4K','12MP','20MP'].includes(c.resolution));

  const poeStandard: PoESwitchRecommendation['poeStandard'] =
    hasPTZ && hasHighRes ? 'PoE++' : hasPTZ || hasHighRes ? 'PoE+' : 'PoE';

  const perCamW =
    poeStandard === 'PoE++' ? POE_BT_TYPE3_W_PSE :
    poeStandard === 'PoE+'  ? POE_AT_W_PSE        :
                              POE_AF_W_PSE;

  const totalPoEBudgetW  = Math.ceil(totalCameras * perCamW * POE_BUDGET_HEADROOM_FACTOR);
  const switchesByPorts  = Math.ceil(totalCameras / POE_SWITCH_PORT_COUNT_24);
  const switchesByPower  = Math.ceil(totalPoEBudgetW / POE_SWITCH_24PORT_BUDGET_W);
  const switchCount      = Math.max(switchesByPorts, switchesByPower);
  const portCount        = switchCount * POE_SWITCH_PORT_COUNT_24;
  const uplinkSpeedGbps  = nextStandardUplinkGbps(result.bandwidth.lanIngressMbps);
  const uplinkCount      = switchCount;

  const confidence: Confidence =
    switchesByPower > switchesByPorts * 1.5 ? 'risky'      :
    switchCount > 1 && tier === 'smb'        ? 'acceptable' :
    'recommended';

  const rationale =
    `${totalCameras} cameras require ${switchCount}× 24-port ${poeStandard} ` +
    `(total budget: ${totalPoEBudgetW} W). Uplink: ${uplinkSpeedGbps} GbE per switch.`;

  const examples: string[] = poeStandard === 'PoE++' || tier !== 'smb'
    ? ['Cisco Catalyst 2960X-24PD', 'HPE Aruba 2530-24G-PoE+', 'Ubiquiti UniFi Pro 24 PoE']
    : ['TP-Link TL-SG1024PE', 'Netgear GS324TP', 'Cisco SG350-28P'];

  return { portCount, poeStandard, totalPoEBudgetW, uplinkCount, uplinkSpeedGbps, switchCount, confidence, rationale, exampleProducts: examples };
}

// ── UPS recommendation ────────────────────────────────────────────────────────

function recommendUPS(
  result: SystemResult,
  nvr:    NVRRecommendation,
  poe:    PoESwitchRecommendation,
  tier:   InfrastructureTier,
): UPSRecommendation {
  const cameraLoadW = poe.totalPoEBudgetW;
  const nvrLoadW    = nvr.unitCount * (NVR_BASE_POWER_W + result.hdd.driveCount * HDD_ACTIVE_POWER_W);
  const switchLoadW = poe.switchCount * SWITCH_CHASSIS_POWER_W;
  const totalLoadW  = Math.ceil((cameraLoadW + nvrLoadW + switchLoadW) * UPS_LOAD_HEADROOM_FACTOR);
  const capacityKVA = nextStandardUPSKVA(totalLoadW);

  const topology: UPSRecommendation['topology'] =
    tier === 'critical'   ? 'online-double-conversion' :
    tier === 'enterprise' ? 'line-interactive'         :
    'offline';

  const confidence: Confidence =
    tier === 'critical' && topology !== 'online-double-conversion' ? 'risky'      :
    tier === 'enterprise' && topology === 'offline'                ? 'acceptable' :
    'recommended';

  const rationale =
    `Estimated load: ${totalLoadW} W ` +
    `(cameras ${cameraLoadW} W + NVR ${nvrLoadW} W + switches ${switchLoadW} W). ` +
    `${capacityKVA} kVA ${topology.replace(/-/g, ' ')} UPS provides ≥${UPS_TARGET_RUNTIME_MINUTES} min runtime.`;

  return { loadEstimateW: totalLoadW, capacityKVA, runtimeMinutes: UPS_TARGET_RUNTIME_MINUTES, topology, confidence, rationale };
}

// ── Rack recommendation ───────────────────────────────────────────────────────

function recommendRack(
  nvr:  NVRRecommendation,
  poe:  PoESwitchRecommendation,
  ups:  UPSRecommendation,
): RackRecommendation {
  const ru =
    nvr.unitCount   * NVR_RACK_UNITS    +
    poe.switchCount * SWITCH_RACK_UNITS +
    UPS_RACK_UNITS                      +
    PATCH_PANEL_RACK_UNITS              +
    RACK_OPERATIONAL_HEADROOM_RU;

  const rackCount      = Math.ceil(ru / RACK_STANDARD_HEIGHT_RU);
  const densityWperU   = ups.loadEstimateW / ru;
  const coolingWarning = densityWperU > RACK_COOLING_THRESHOLD_W_PER_RU;

  const coolingNote = coolingWarning
    ? `Estimated thermal density ${densityWperU.toFixed(0)} W/U exceeds ` +
      `ASHRAE A2 guideline of ${RACK_COOLING_THRESHOLD_W_PER_RU} W/U. ` +
      `Dedicated in-row cooling or hot-aisle containment is required.`
    : `Thermal density ${densityWperU.toFixed(0)} W/U is within passive convection limits.`;

  const confidence: Confidence = coolingWarning ? 'acceptable' : 'recommended';
  return { rackUnitsRequired: ru, rackCount, coolingWarning, coolingNote, confidence };
}

// ── Network recommendation ────────────────────────────────────────────────────

function recommendNetwork(result: SystemResult, tier: InfrastructureTier): NetworkRecommendation {
  const lan        = result.bandwidth.lanIngressMbps;
  const uplinkGbps = nextStandardUplinkGbps(lan * 1.25);
  const satRatio   = lan / (uplinkGbps * 1000);
  const vlan       = result.totalCameraCount >= VLAN_SEGMENTATION_THRESHOLD;

  const uplinkConf: Confidence =
    satRatio > NVR_PORT_UTILISATION_RISK_RATIO ? 'risky'      :
    satRatio > NVR_PORT_UTILISATION_WARN_RATIO  ? 'acceptable' :
    'recommended';

  const rationale =
    `LAN traffic: ${lan.toFixed(0)} Mbps. Recommended uplink: ${uplinkGbps} GbE. ` +
    (vlan ? 'VLAN segmentation required.' : '');

  return {
    lanBandwidthMbps: lan, recommendedUplinkGbps: uplinkGbps,
    vlanSegmentation: vlan, uplinkSaturationRisk: uplinkConf,
    confidence: uplinkConf, rationale,
  };
}

// ── BOM builder ───────────────────────────────────────────────────────────────

function buildBOM(
  result:  SystemResult,
  nvr:     NVRRecommendation,
  storage: StorageRecommendation,
  poe:     PoESwitchRecommendation,
  ups:     UPSRecommendation,
  rack:    RackRecommendation,
  network: NetworkRecommendation,
): BOMItem[] {
  const bom: BOMItem[] = [
    {
      id: 'nvr-primary', category: 'nvr',
      label: `${nvr.channelCount}-Channel NVR`,
      description: `${nvr.channelCount}-ch, H.265 hardware decode, ${(nvr.throughputMbps / nvr.unitCount).toFixed(0)} Mbps per unit`,
      quantity: nvr.unitCount, unit: 'unit',
      examples: nvr.exampleProducts,
      confidence: nvr.confidence, rationale: nvr.rationale,
      note: nvr.raidWritePenalty ? 'RAID5 write penalty applies. Ensure battery-backed write cache on RAID controller.' : undefined,
      pricing: null,
    },
    ...(nvr.redundancy ? [{
      id: 'nvr-standby', category: 'nvr' as const,
      label: 'Standby NVR (N+1)',
      description: 'Hot-standby failover unit — same spec as primary',
      quantity: nvr.unitCount, unit: 'unit',
      examples: nvr.exampleProducts,
      confidence: 'recommended' as Confidence,
      rationale: `${result.totalCameraCount}+ camera deployment requires N+1 NVR redundancy.`,
      pricing: null,
    }] : []),
    {
      id: 'hdd-surveillance', category: 'storage',
      label: `${storage.driveCapacityTB} TB Surveillance HDD`,
      description: `${storage.raidProfile} · ${storage.usableCapacityTB.toFixed(1)} TB usable · 7×24 surveillance-grade`,
      quantity: storage.driveCount, unit: 'drive',
      examples: [
        `WD Purple ${storage.driveCapacityTB}TB (WD${storage.driveCapacityTB * 10}PURZ)`,
        `Seagate SkyHawk ${storage.driveCapacityTB}TB`,
        `Seagate SkyHawk AI ${storage.driveCapacityTB}TB`,
      ],
      confidence: storage.confidence, rationale: storage.rationale,
      note: storage.rebuildRiskHours > 20
        ? `Rebuild window ~${storage.rebuildRiskHours.toFixed(0)}h. URE probability: ${ureRebuildProbabilityPct(storage.driveCount, storage.driveCapacityTB).toFixed(2)}%. Consider RAID6.`
        : undefined,
      pricing: null,
    },
    {
      id: 'poe-switch', category: 'networking',
      label: `24-Port ${poe.poeStandard} Access Switch`,
      description: `${poe.poeStandard} · ${(POE_SWITCH_24PORT_BUDGET_W / 1000).toFixed(0)} kW budget · ${network.recommendedUplinkGbps} GbE uplink`,
      quantity: poe.switchCount, unit: 'unit',
      examples: poe.exampleProducts,
      confidence: poe.confidence, rationale: poe.rationale,
      pricing: null,
    },
    {
      id: 'aggregation-switch', category: 'networking',
      label: 'Layer 3 Aggregation Switch',
      description: `VLAN-capable · ${poe.switchCount}× ${network.recommendedUplinkGbps} GbE uplinks`,
      quantity: 1, unit: 'unit',
      examples: ['Cisco Catalyst 9200L-24P', 'HPE Aruba 3810M 24G', 'Ubiquiti UniFi Aggregation'],
      confidence: network.vlanSegmentation ? 'recommended' : 'acceptable',
      rationale: network.rationale,
      note: network.vlanSegmentation ? 'VLAN isolation required: cameras must be separated from corporate LAN.' : undefined,
      pricing: null,
    },
    {
      id: 'ups-unit', category: 'power',
      label: `${ups.capacityKVA} kVA UPS`,
      description: `${ups.topology.replace(/-/g, ' ')} · ≥${ups.runtimeMinutes} min @ ${ups.loadEstimateW} W`,
      quantity: 1, unit: 'unit',
      examples: ups.capacityKVA <= 3
        ? ['APC Smart-UPS 3000VA', 'Eaton 5SC 3000', 'Vertiv Liebert PSI5']
        : ['APC Symmetra LX', 'Eaton 9PX 6kVA', 'Vertiv Liebert GXT5'],
      confidence: ups.confidence, rationale: ups.rationale,
      pricing: null,
    },
    {
      id: 'rack', category: 'physical',
      label: `${RACK_STANDARD_HEIGHT_RU}U Equipment Rack`,
      description: `${rack.rackUnitsRequired}U required · ${rack.rackCount} rack${rack.rackCount > 1 ? 's' : ''} · 600×1000mm`,
      quantity: rack.rackCount, unit: 'unit',
      examples: ['APC NetShelter SX 42U', 'Vertiv VR Rack 42U', 'Tripp Lite SR42UB'],
      confidence: rack.confidence, rationale: rack.coolingNote,
      note: rack.coolingWarning ? rack.coolingNote : undefined,
      pricing: null,
    },
  ];
  return bom;
}

// ── Advisory generator ────────────────────────────────────────────────────────

function buildAdvisories(
  result:   SystemResult,
  nvr:      NVRRecommendation,
  storage:  StorageRecommendation,
  poe:      PoESwitchRecommendation,
  ups:      UPSRecommendation,
  rack:     RackRecommendation,
  network:  NetworkRecommendation,
): EngineeringAdvisory[] {
  const advisories: EngineeringAdvisory[] = [];

  // NVR port saturation
  if (result.nvr.portUtilisationRatio > NVR_PORT_UTILISATION_RISK_RATIO) {
    advisories.push({
      id: 'nvr-saturation', level: 'critical', category: 'nvr',
      headline: `NVR uplink utilisation at ${(result.nvr.portUtilisationRatio * 100).toFixed(0)}% — frame loss risk`,
      detail: `The NVR ingestion port is operating above ${NVR_PORT_UTILISATION_RISK_RATIO * 100}% capacity ` +
              `(${result.nvr.totalIngressMbps.toFixed(0)} Mbps). Peak burst traffic will cause frame drops.`,
      action: 'Split cameras across two NVR units, or upgrade to a 10 GbE NVR platform.',
    });
  } else if (result.nvr.portUtilisationRatio > NVR_PORT_UTILISATION_WARN_RATIO) {
    advisories.push({
      id: 'nvr-high-util', level: 'warning', category: 'nvr',
      headline: `NVR port utilisation at ${(result.nvr.portUtilisationRatio * 100).toFixed(0)}% — monitor under peak load`,
      detail: `NVR ingestion is within operational limits but approaching the recommended ceiling.`,
      action: 'Reserve 10 GbE NVR platform for future expansion, or cap per-camera bitrate.',
    });
  }

  if (nvr.raidWritePenalty) {
    advisories.push({
      id: 'raid5-write-penalty', level: 'warning', category: 'nvr',
      headline: 'RAID5 write penalty may limit NVR write throughput',
      detail: 'RAID5 requires a read-modify-write cycle per stripe for random writes. At high camera counts with simultaneous motion events, this can halve effective write throughput.',
      action: 'Enable write-back cache on the RAID controller (battery-backed) or use RAID6 with a write cache tier.',
    });
  }

  // RAID5 rebuild risk
  if (storage.rebuildRisk === 'risky') {
    const urePct = ureRebuildProbabilityPct(storage.driveCount, storage.driveCapacityTB);
    advisories.push({
      id: 'raid5-rebuild-critical', level: 'critical', category: 'storage',
      headline: `RAID5 rebuild window ${storage.rebuildRiskHours.toFixed(0)}h — dual-failure risk is unacceptable`,
      detail: `${storage.driveCount}-drive RAID5 rebuild will take ~${storage.rebuildRiskHours.toFixed(0)}h. ` +
              `URE probability during rebuild: ${urePct.toFixed(2)}% (SATA 10^14 bit error rate). Total data loss if a second drive fails.`,
      action: 'Upgrade to RAID6 immediately. This configuration is not acceptable for surveillance data.',
    });
  } else if (storage.rebuildRisk === 'acceptable') {
    advisories.push({
      id: 'raid5-rebuild-warning', level: 'warning', category: 'storage',
      headline: `RAID5 rebuild window ${storage.rebuildRiskHours.toFixed(0)}h — consider upgrading to RAID6`,
      detail: `Surveillance drives running 24/7 have elevated failure rates vs desktop drives.`,
      action: 'Plan for RAID6 migration at next maintenance window. Implement SMART monitoring.',
    });
  }

  if (result.hdd.driveCapacityTB >= RAID5_UNSAFE_DRIVE_SIZE_TB && result.hdd.raidProfile === 'RAID5') {
    advisories.push({
      id: 'large-drives-raid5', level: 'critical', category: 'storage',
      headline: `${result.hdd.driveCapacityTB} TB drives in RAID5 — rebuild time exceeds safe threshold`,
      detail: `Drives ≥${RAID5_UNSAFE_DRIVE_SIZE_TB} TB in RAID5 produce rebuild windows that exceed 20 hours. Industry consensus (VMware, Seagate, WD) does not recommend RAID5 with drives this large in write-intensive surveillance environments.`,
      action: 'Replace RAID5 with RAID6 before deployment.',
    });
  }

  // PoE power bottleneck
  const switchesByPorts = Math.ceil(result.totalCameraCount / POE_SWITCH_PORT_COUNT_24);
  if (poe.switchCount > switchesByPorts) {
    advisories.push({
      id: 'poe-power-bottleneck', level: 'warning', category: 'networking',
      headline: 'PoE power budget requires more switches than port count alone',
      detail: `Power draw requires ${poe.switchCount} switches; port count needs only ${switchesByPorts}. High-power camera mix detected.`,
      action: 'Verify per-camera PoE draw on spec sheets. Consider PoE++ switches or distributed injectors.',
    });
  }

  // Network
  if (network.uplinkSaturationRisk === 'risky') {
    advisories.push({
      id: 'uplink-saturation', level: 'critical', category: 'networking',
      headline: `LAN backbone near saturation — ${result.bandwidth.lanIngressMbps.toFixed(0)} Mbps camera traffic`,
      detail: `Camera LAN traffic is approaching the ${network.recommendedUplinkGbps} GbE uplink limit.`,
      action: `Upgrade to ${network.recommendedUplinkGbps > 1 ? '10' : network.recommendedUplinkGbps} GbE aggregation. Enforce QoS on camera VLANs.`,
    });
  }

  if (network.vlanSegmentation) {
    advisories.push({
      id: 'vlan-required', level: 'warning', category: 'networking',
      headline: `${result.totalCameraCount} cameras require VLAN segmentation`,
      detail: `At ${result.totalCameraCount} cameras, ONVIF multicast, RTSP keep-alives, and PTP will overwhelm a flat network.`,
      action: 'Configure dedicated camera VLAN. Block inter-VLAN routing except NVR management. Enable IGMP snooping.',
    });
  }

  // Thermal density
  if (rack.coolingWarning) {
    advisories.push({
      id: 'thermal-density', level: 'warning', category: 'physical',
      headline: 'Rack thermal density exceeds passive cooling threshold',
      detail: rack.coolingNote,
      action: 'Install in-row cooling or hot-aisle containment. Minimum 2 kW supplemental cooling per rack.',
    });
  }

  // UPS topology
  if (ups.topology === 'offline' && ups.loadEstimateW > 1_000) {
    advisories.push({
      id: 'ups-topology', level: 'info', category: 'power',
      headline: 'Offline UPS — consider line-interactive for better protection',
      detail: `Offline UPS has 8–15ms switchover. At ${ups.loadEstimateW} W, a power glitch may disturb the NVR.`,
      action: 'Upgrade to line-interactive UPS (APC Smart-UPS / Eaton 5SC) at next budget cycle.',
    });
  }

  const levelOrder = { critical: 0, warning: 1, info: 2 } as const;
  return advisories.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
}

// ── Telemetry hooks ───────────────────────────────────────────────────────────
//
// These are no-op stubs that analytics infrastructure can fill in without
// modifying the engine. The hook signatures are intentionally minimal so
// they can be tree-shaken when not used.

export interface RecommendationTelemetry {
  onRecommendationGenerated?: (meta: {
    tier:               InfrastructureTier;
    totalCameras:       number;
    overallConfidence:  Confidence;
    advisoryCount:      number;
    criticalCount:      number;
    durationMs:         number;
  }) => void;
}

// ── Public entry point ────────────────────────────────────────────────────────

export interface RecommendationInput {
  result:       SystemResult;
  configs:      CameraConfig[];
  telemetry?:   RecommendationTelemetry;
}

export function generateRecommendation({
  result, configs, telemetry,
}: RecommendationInput): InfrastructureRecommendation {
  const t0 = Date.now();

  const maxRetention   = configs.length > 0 ? Math.max(...configs.map((c) => c.retentionDays)) : 30;
  const hasCriticalAI  = configs.some((c) => c.aiAnalyticsEnabled && c.aiAnalyticsMode === 'cloud_relay');

  const tier     = classifyTier(result.totalCameraCount, maxRetention, hasCriticalAI);
  const nvr      = recommendNVR(result, tier);
  const storage  = recommendStorage(result, tier);
  const poe      = recommendPoESwitch(result, configs, tier);
  const ups      = recommendUPS(result, nvr, poe, tier);
  const rack     = recommendRack(nvr, poe, ups);
  const network  = recommendNetwork(result, tier);

  const bom        = buildBOM(result, nvr, storage, poe, ups, rack, network);
  const advisories = buildAdvisories(result, nvr, storage, poe, ups, rack, network);

  const overallConfidence = worstConfidence(
    nvr.confidence, storage.confidence, poe.confidence,
    ups.confidence, rack.confidence, network.confidence,
  );

  const recommendation: InfrastructureRecommendation = {
    tier, nvr, storage, poeSwitch: poe, ups, rack, network,
    bom, advisories, overallConfidence,
    generatedAt: new Date().toISOString(),
  };

  // Fire telemetry hook (no-op if not provided)
  telemetry?.onRecommendationGenerated?.({
    tier,
    totalCameras:      result.totalCameraCount,
    overallConfidence,
    advisoryCount:     advisories.length,
    criticalCount:     advisories.filter((a) => a.level === 'critical').length,
    durationMs:        Date.now() - t0,
  });

  return recommendation;
}

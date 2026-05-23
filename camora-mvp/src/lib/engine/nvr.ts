// ─────────────────────────────────────────────────────────────────────────────
// NVR Throughput and Bandwidth Engine
// ─────────────────────────────────────────────────────────────────────────────

import type { CameraConfig, CameraResult, NVRThroughputResult, BandwidthResult } from '@/lib/engine/types';
import { mbpsToMBps }  from '@/lib/engine/units';
import {
  NVR_THROUGHPUT_HEADROOM_FACTOR,
  NVR_BURST_BUFFER_RATIO,
  NVR_PORT_UTILISATION_WARN_RATIO,
  NVR_PORT_UTILISATION_RISK_RATIO,
  NVR_REFERENCE_PORT_CAPACITY_MBPS,
  SUBSTREAM_RATIO_VS_MAIN,
  WAN_UPLINK_HEADROOM_FACTOR,
  SWITCH_UPLINK_TIERS_MBPS,
  VLAN_SEGMENTATION_THRESHOLD,
} from '@/lib/engine/constants';

// ─────────────────────────────────────────────────────────────────────────────
// NVR throughput
// ─────────────────────────────────────────────────────────────────────────────

export function calculateNVRThroughput(results: readonly CameraResult[]): NVRThroughputResult {
  const warnings: string[] = [];

  const totalIngressMbps             = results.reduce((sum, r) => sum + r.groupEffectiveMbps, 0);
  const rawPeakMbps                  = results.reduce((sum, r) => sum + r.groupPeakMbps, 0);
  const peakBurstMbps                = rawPeakMbps * NVR_BURST_BUFFER_RATIO;
  const recommendedNVRThroughputMbps = totalIngressMbps * NVR_THROUGHPUT_HEADROOM_FACTOR;
  const minHDDWriteSpeedMBps         = mbpsToMBps(recommendedNVRThroughputMbps);
  const portUtilisationRatio         = totalIngressMbps / NVR_REFERENCE_PORT_CAPACITY_MBPS;

  if (portUtilisationRatio > NVR_PORT_UTILISATION_WARN_RATIO) {
    warnings.push(
      `NVR port utilisation is ${(portUtilisationRatio * 100).toFixed(1)}% of a 1 GbE port — ` +
      `exceeds ${NVR_PORT_UTILISATION_WARN_RATIO * 100}% safe threshold. ` +
      `Consider a 10 GbE NVR uplink or segment cameras across multiple switches/NVRs.`,
    );
  }

  if (peakBurstMbps > 900) {
    warnings.push(
      `Peak burst (${peakBurstMbps.toFixed(0)} Mbps) approaches 1 GbE saturation — ` +
      `ensure NVR has a 10 GbE internal bus or hardware burst buffer.`,
    );
  }

  if (minHDDWriteSpeedMBps > 150) {
    warnings.push(
      `Required HDD write speed (${minHDDWriteSpeedMBps.toFixed(0)} MB/s) exceeds typical ` +
      `single SATA HDD capability (~150 MB/s seq). Deploy a RAID controller with ` +
      `write-back cache or an NVMe cache tier (SSD journal).`,
    );
  }

  if (minHDDWriteSpeedMBps > 50 && results.some((r) => r.warnings.some((w) => w.includes('RAID5')))) {
    warnings.push(
      `RAID5 write penalty warning: at ${minHDDWriteSpeedMBps.toFixed(0)} MB/s write demand, ` +
      `RAID5 read-modify-write cycles may limit effective throughput. ` +
      `Enable write-back cache on the RAID controller or use RAID6 with a battery-backed unit.`,
    );
  }

  if (totalIngressMbps > 500 && results.length > 1) {
    const maxPlaybackMbps = totalIngressMbps * 0.50;
    warnings.push(
      `High ingress (${totalIngressMbps.toFixed(0)} Mbps). Concurrent live-view + playback ` +
      `may require up to ${maxPlaybackMbps.toFixed(0)} Mbps additional read throughput. ` +
      `Verify NVR storage bus bandwidth covers simultaneous read + write.`,
    );
  }

  return {
    totalIngressMbps,
    peakBurstMbps,
    recommendedNVRThroughputMbps,
    minHDDWriteSpeedMBps,
    portUtilisationRatio,
    warnings,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bandwidth estimation
// ─────────────────────────────────────────────────────────────────────────────

export function calculateBandwidth(
  configs: readonly CameraConfig[],
  results: readonly CameraResult[],
): BandwidthResult {
  const warnings: string[] = [];

  const lanIngressMbps    = results.reduce((sum, r) => sum + r.groupEffectiveMbps, 0);
  const remoteViewingMbps = lanIngressMbps * SUBSTREAM_RATIO_VS_MAIN;

  const cloudRelayMbps = results.reduce((sum, r, i) => {
    const config = configs[i];
    if (config === undefined) return sum;
    if (
      config.aiAnalyticsEnabled &&
      (config.aiAnalyticsMode === 'cloud_relay' || config.aiAnalyticsMode === 'hybrid')
    ) {
      return sum + r.aiOverheadMbps * r.quantity;
    }
    return sum;
  }, 0);

  const recommendedUplinkMbps = (remoteViewingMbps + cloudRelayMbps) * WAN_UPLINK_HEADROOM_FACTOR;

  if (lanIngressMbps > 800) {
    warnings.push(
      `LAN ingress (${lanIngressMbps.toFixed(0)} Mbps) is approaching 1 GbE capacity. ` +
      `Segment cameras across multiple VLANs/switches or upgrade to a multi-port GbE or 10 GbE switch fabric.`,
    );
  }

  if (recommendedUplinkMbps > 100) {
    warnings.push(
      `Recommended WAN uplink (${recommendedUplinkMbps.toFixed(0)} Mbps) requires a ` +
      `dedicated business-grade fibre circuit. Consumer broadband will be insufficient.`,
    );
  }

  if (cloudRelayMbps > 50) {
    warnings.push(
      `Cloud relay bandwidth (${cloudRelayMbps.toFixed(0)} Mbps) is significant. ` +
      `Consider switching some cameras from cloud_relay to edge_full to reduce WAN consumption.`,
    );
  }

  const peakLanMbps = results.reduce((sum, r) => sum + r.groupPeakMbps, 0);
  if (peakLanMbps > 1_000) {
    warnings.push(
      `Worst-case LAN peak (${peakLanMbps.toFixed(0)} Mbps) exceeds 1 GbE — ` +
      `upgrade switch uplinks to 10 GbE and verify NVR NIC capacity.`,
    );
  }

  return {
    lanIngressMbps,
    remoteViewingMbps,
    cloudRelayMbps,
    recommendedUplinkMbps,
    warnings,
  };
}

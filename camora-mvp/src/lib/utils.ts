import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMbps(mbps: number): string {
  if (mbps < 1)    return `${(mbps * 1000).toFixed(0)} kbps`;
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(2)} Gbps`;
  return `${mbps.toFixed(2)} Mbps`;
}

export function formatTB(tb: number): string {
  if (tb < 0.001)  return `${(tb * 1_000_000).toFixed(1)} MB`;
  if (tb < 1)      return `${(tb * 1000).toFixed(1)} GB`;
  return `${tb.toFixed(2)} TB`;
}

export function formatMBps(MBps: number): string {
  return `${MBps.toFixed(1)} MB/s`;
}

export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

import type { Metadata } from "next";
import { SEOLandingPage } from "@/components/landing/SEOLandingPage";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://camora.app";
const PAGE_URL = `${BASE_URL}/nvr-storage-estimator`;

export const metadata: Metadata = {
  title: "NVR Storage Estimator — How Many Hard Drives Do I Need?",
  description:
    "Estimate NVR storage requirements for any camera count and retention period. Get drive count, total capacity, and RAID recommendations for Hikvision, Dahua, and generic NVR systems.",
  keywords: [
    "NVR storage estimator",
    "NVR hard drive calculator",
    "how many hard drives for NVR",
    "NVR capacity calculator",
    "Hikvision NVR storage calculator",
    "Dahua NVR storage",
    "network video recorder storage",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title:       "NVR Storage Estimator — How Many Hard Drives Do I Need?",
    description: "Find the exact drive count and capacity for any NVR system. Free, no signup, instant results.",
    url:         PAGE_URL,
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "NVR Storage Estimator",
    description: "Calculate exactly how many hard drives your NVR needs for any camera count and retention period.",
  },
};

export default function Page() {
  return (
    <SEOLandingPage
      content={{
        h1: "NVR Storage Estimator",
        subheadline:
          "Find out exactly how many hard drives your NVR needs. Enter your cameras and retention period — get a drive count, total capacity, and RAID recommendation.",
        description:
          "Most NVR sizing guides give you rough estimates based on 'average' cameras. " +
          "This estimator calculates storage from the actual bitrate your specific cameras produce, " +
          "taking into account resolution, codec, scene complexity, motion percentage, and recording schedule. " +
          "It then recommends surveillance-grade drives (WD Purple, Seagate SkyHawk) " +
          "in the right capacity tier, with RAID configuration matched to your deployment size. " +
          "Works with all major NVR brands: Hikvision DS-7600/DS-9600 series, Dahua NVR4000/NVR6000, " +
          "Uniview, Milesight, and any generic ONVIF NVR.",
        ctaLabel: "Estimate NVR Storage",
        trustPoints: [
          "✓ Hikvision & Dahua",
          "✓ Surveillance HDDs",
          "✓ PDF Export",
          "✓ No Signup",
        ],
        faqs: [
          {
            q: "How much storage does a 16-channel NVR need?",
            a: "A fully loaded 16-channel NVR with 4MP H.265 cameras at 20 FPS (30-day retention) typically needs 8–12 TB of usable storage, or 2–3 drives of 4–6TB in RAID 5. If you're running 8MP cameras or H.264 instead of H.265, expect 2–3× more storage for the same retention period.",
          },
          {
            q: "What hard drives should I use in an NVR?",
            a: "Use surveillance-grade drives rated for 24/7 operation: Seagate SkyHawk (1–16TB), WD Purple (1–18TB), or WD Purple Pro (8–18TB) for high-load systems. Standard desktop drives are not designed for the constant write cycles of NVR recording and fail significantly faster in this application.",
          },
          {
            q: "Can I mix different drive sizes in my NVR?",
            a: "For JBOD (no RAID) setups, yes — the NVR treats each drive independently. For RAID configurations, use identical drives. Mixing sizes in RAID forces all drives to operate at the size of the smallest drive, wasting capacity on larger ones. Always plan your RAID with identical drive models.",
          },
          {
            q: "How long can a 4TB hard drive record CCTV footage?",
            a: "A single 4TB drive holds approximately 20–30 days of footage from one 4MP H.265 camera recording continuously. For 8 cameras, divide that by 8 — so about 2–4 days. For multi-camera systems, you typically need multiple drives and RAID to meet retention requirements. Use this estimator to get the exact figure for your setup.",
          },
          {
            q: "Does the number of cameras affect NVR hard drive speed requirements?",
            a: "Yes. Every camera writes simultaneously, so your total write throughput is the sum of all camera bitrates. At 16 cameras × 3 Mbps = 48 Mbps sustained write. A single SATA drive handles ~150 MB/s, so throughput is rarely the bottleneck for under 50 cameras. Above 100+ cameras at high bitrates, you need multiple drives or an NVMe cache tier to avoid dropped frames.",
          },
        ],
      }}
    />
  );
}

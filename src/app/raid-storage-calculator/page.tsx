import type { Metadata } from "next";
import { SEOLandingPage } from "@/components/landing/SEOLandingPage";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://camora.app";
const PAGE_URL = `${BASE_URL}/raid-storage-calculator`;

export const metadata: Metadata = {
  title: "RAID Storage Calculator for CCTV & NVR Systems",
  description:
    "Calculate usable RAID storage capacity for CCTV and NVR deployments. Compare RAID 5, RAID 6, and RAID 10. Get drive count recommendations with fault tolerance and rebuild risk analysis.",
  keywords: [
    "RAID storage calculator",
    "RAID 5 calculator",
    "RAID 6 calculator",
    "NVR RAID planning",
    "CCTV RAID calculator",
    "surveillance RAID storage",
    "drive redundancy calculator",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title:       "RAID Storage Calculator for CCTV & NVR Systems",
    description: "Calculate usable RAID capacity, drive count, and fault tolerance for surveillance deployments.",
    url:         PAGE_URL,
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "RAID Storage Calculator for CCTV & NVR Systems",
    description: "Calculate usable RAID capacity and drive count for any surveillance deployment.",
  },
};

export default function Page() {
  return (
    <SEOLandingPage
      content={{
        h1: "RAID Storage Calculator for CCTV Systems",
        subheadline:
          "Compare RAID 5, RAID 6, and RAID 10 for your NVR. Get usable capacity, drive count, and rebuild risk analysis — sized for your exact camera configuration.",
        description:
          "RAID planning for surveillance is different from general storage. " +
          "Cameras write continuously 24/7, which stresses RAID 5 rebuild operations differently than office file servers. " +
          "This calculator computes the required raw storage from your camera specs, then determines how many drives you need " +
          "under each RAID level to meet your retention target. " +
          "It also evaluates rebuild risk: large RAID 5 arrays with drives over 8TB have a measurable probability " +
          "of encountering an Unrecoverable Read Error (URE) during rebuild — and this calculator warns you when you're in that zone.",
        ctaLabel: "Calculate RAID Requirements",
        trustPoints: [
          "✓ RAID 5 / 6 / 10",
          "✓ Rebuild Risk Analysis",
          "✓ Drive Count",
          "✓ Free Forever",
        ],
        faqs: [
          {
            q: "Which RAID level should I use for a CCTV NVR?",
            a: "RAID 5 is the most common choice for small to medium deployments (4–12 cameras). It provides one drive fault tolerance and uses about 75–80% of raw capacity. RAID 6 is recommended for 16+ cameras or retention periods over 90 days — it survives two simultaneous drive failures, which matters during long rebuild windows. RAID 10 is best for high-performance NVRs with 50+ high-FPS cameras.",
          },
          {
            q: "How many drives do I need for 30 days of CCTV footage?",
            a: "It depends on your cameras. As a rough guide: 8 cameras at 4MP H.265 (30-day retention) typically needs 2–4 drives of 4–6TB each in RAID 5. Use this calculator to get the exact drive count for your specific camera mix, resolution, and codec.",
          },
          {
            q: "What is URE risk in RAID 5?",
            a: "SATA hard drives have an Unrecoverable Read Error rate of 1 bit in 10^14 bits read. During a RAID 5 rebuild, the system reads every bit on every remaining drive. For arrays with large drives (8TB+), the probability of hitting a URE during rebuild becomes significant — potentially corrupting the rebuilt array. RAID 6 avoids this problem by tolerating two errors simultaneously.",
          },
          {
            q: "How much capacity is wasted in RAID 5 vs RAID 6?",
            a: "RAID 5 with N drives wastes exactly 1 drive's worth of capacity for parity. RAID 6 wastes 2 drives. Example: 6 × 8TB drives in RAID 5 gives 40TB usable (83%). The same 6 drives in RAID 6 gives 32TB usable (67%). The extra protection of RAID 6 costs approximately 20% capacity compared to RAID 5.",
          },
          {
            q: "Can I use RAID 0 for CCTV recording?",
            a: "RAID 0 (striping, no redundancy) is not recommended for surveillance. Any single drive failure causes complete data loss. CCTV storage is legally and operationally critical — the cost of re-recording is far higher than the cost of a few extra drives. Use RAID 5 at minimum.",
          },
        ],
      }}
    />
  );
}

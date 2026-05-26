import type { Metadata } from "next";
import { SEOLandingPage } from "@/components/landing/SEOLandingPage";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://camora.app";
const PAGE_URL = `${BASE_URL}/cctv-storage-calculator`;

export const metadata: Metadata = {
  title: "CCTV Storage Calculator — Free Online Tool",
  description:
    "Calculate exactly how much storage your CCTV system needs. Enter camera count, resolution, codec, FPS, and retention period. Supports H.264, H.265, H.265+, and RAID configurations.",
  keywords: [
    "CCTV storage calculator",
    "surveillance storage calculator",
    "IP camera storage calculator",
    "NVR hard drive calculator",
    "security camera storage estimator",
    "CCTV HDD size calculator",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title:       "CCTV Storage Calculator — Free Online Tool",
    description: "Calculate exactly how much storage your CCTV system needs. Free, no signup, instant results.",
    url:         PAGE_URL,
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "CCTV Storage Calculator — Free Online Tool",
    description: "Calculate exactly how much storage your CCTV system needs.",
  },
};

export default function Page() {
  return (
    <SEOLandingPage
      content={{
        h1: "CCTV Storage Calculator",
        subheadline:
          "Enter your cameras, resolution, and retention period — get the exact storage requirement in seconds. Works with H.264, H.265, and H.265+.",
        description:
          "This tool calculates CCTV storage based on the actual bitrate produced by your cameras — not rough estimates. " +
          "Enter the number of cameras, resolution (1080p, 4MP, 8MP), codec (H.264, H.265, H.265+), frames per second, " +
          "scene complexity, and how many days of footage you need to keep. " +
          "The calculator accounts for motion percentage, recording schedule, audio streams, and RAID overhead " +
          "to give you an accurate drive count and total capacity figure ready for procurement.",
        ctaLabel: "Calculate My CCTV Storage",
        trustPoints: [
          "✓ PDF Export",
          "✓ RAID Planning",
          "✓ Free Forever",
          "✓ No Signup",
        ],
        faqs: [
          {
            q: "How much storage does a CCTV camera use per day?",
            a: "It depends on resolution, codec, and motion level. A 4MP H.265 camera recording continuously at medium scene complexity typically uses 8–15 GB per day. A 1080p H.264 camera in the same conditions uses 18–25 GB per day. H.265+ can reduce this by 50–70% compared to H.264.",
          },
          {
            q: "How do I calculate how many hard drives I need for my NVR?",
            a: "Multiply the number of cameras by the daily storage per camera, then by your retention period in days. Add 20% overhead for the filesystem and RAID parity. This tool does all of that automatically and recommends the exact drive count and capacity.",
          },
          {
            q: "What is the difference between H.264 and H.265 for storage?",
            a: "H.265 (HEVC) uses roughly 40–50% less storage than H.264 at the same image quality. H.265+ (Hikvision's scene-adaptive variant) can reduce storage by up to 70% compared to H.264 in static scenes. The savings depend on motion percentage and scene complexity.",
          },
          {
            q: "Does this calculator work for Hikvision, Dahua, and Axis cameras?",
            a: "Yes. The calculator includes vendor-specific bitrate presets from Hikvision, Dahua, Axis, Hanwha, and Uniview. You can also enter custom bitrate values for any camera brand.",
          },
          {
            q: "How does RAID affect CCTV storage capacity?",
            a: "RAID 5 gives you approximately 75–80% usable capacity of the total raw drive space. RAID 6 gives about 67%. RAID 10 gives 50%. JBOD (no RAID) gives 100% but has no redundancy. The calculator shows usable capacity after RAID for each configuration.",
          },
        ],
      }}
    />
  );
}

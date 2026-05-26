import type { Metadata } from "next";
import { SEOLandingPage } from "@/components/landing/SEOLandingPage";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://camora.app";
const PAGE_URL = `${BASE_URL}/ip-camera-bandwidth-calculator`;

export const metadata: Metadata = {
  title: "IP Camera Bandwidth Calculator — NVR & Network Planning",
  description:
    "Calculate the total network bandwidth your IP cameras require. Get LAN ingress, NVR throughput, remote viewing bandwidth, and WAN uplink recommendations for any CCTV deployment.",
  keywords: [
    "IP camera bandwidth calculator",
    "CCTV bandwidth calculator",
    "NVR bandwidth estimator",
    "camera network bandwidth",
    "surveillance bandwidth calculator",
    "IP camera network planning",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title:       "IP Camera Bandwidth Calculator — NVR & Network Planning",
    description: "Calculate LAN, NVR, and WAN bandwidth for your IP camera system. Free, instant results.",
    url:         PAGE_URL,
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "IP Camera Bandwidth Calculator",
    description: "Calculate LAN, NVR, and WAN bandwidth requirements for any IP camera deployment.",
  },
};

export default function Page() {
  return (
    <SEOLandingPage
      content={{
        h1: "IP Camera Bandwidth Calculator",
        subheadline:
          "Find out how much network bandwidth your cameras consume — LAN ingress, NVR throughput, and WAN uplink — before you buy the switches and routers.",
        description:
          "Planning a network for an IP camera system requires knowing three bandwidth figures: " +
          "LAN ingress (total camera traffic hitting the switch), NVR ingestion throughput (what the recorder must handle), " +
          "and WAN uplink (for remote viewing and cloud relay). " +
          "This calculator derives all three from your camera count, resolution, codec, FPS, and motion settings. " +
          "It also warns when you're approaching switch saturation or NVR port limits, " +
          "and accounts for radio type overhead if some cameras are on Wi-Fi, 4G/5G, or mesh networks.",
        ctaLabel: "Calculate Bandwidth Now",
        trustPoints: [
          "✓ LAN + WAN Bandwidth",
          "✓ NVR Throughput",
          "✓ Port Utilisation",
          "✓ No Signup",
        ],
        faqs: [
          {
            q: "How much bandwidth does a 4MP IP camera use?",
            a: "A 4MP camera on H.265 at 20 FPS typically uses 1.5–3 Mbps in average scenes. In high-motion environments it can reach 4–6 Mbps. H.265+ reduces this by 40–60%. H.264 at the same settings uses roughly 2× more bandwidth.",
          },
          {
            q: "What is NVR throughput and why does it matter?",
            a: "NVR throughput is the total bitrate the recorder must ingest simultaneously from all cameras. A standard embedded NVR has a 1 Gbps (1000 Mbps) network port. You should not exceed 70% of this (700 Mbps) to allow headroom for motion spikes. This calculator warns you when you approach that limit.",
          },
          {
            q: "How much WAN bandwidth do I need for remote camera viewing?",
            a: "Remote viewing typically uses the sub-stream, which is about 10–15% of the main stream bitrate. For 16 cameras at 2 Mbps each, you need approximately 3–5 Mbps of upload bandwidth for smooth remote access. This calculator estimates WAN requirements based on your sub-stream ratio.",
          },
          {
            q: "Do wireless cameras use more bandwidth than wired cameras?",
            a: "The video bitrate is the same, but Wi-Fi cameras add 10–15% overhead due to packet retransmissions, acknowledgements, and connection re-establishment. 4G/5G cameras add 20–25% overhead due to variable latency and buffering. This affects storage requirements more than raw network bandwidth.",
          },
          {
            q: "What switch do I need for 32 cameras?",
            a: "For 32 × 4MP H.265 cameras at 2 Mbps each, you need about 64 Mbps on the camera VLAN — a standard 1 GbE switch handles this easily. If cameras are 4K (8MP) at 4–6 Mbps, total traffic reaches 128–192 Mbps, still within 1 GbE but approaching 20% port utilisation. Use a managed switch with QoS for any deployment over 16 cameras.",
          },
        ],
      }}
    />
  );
}

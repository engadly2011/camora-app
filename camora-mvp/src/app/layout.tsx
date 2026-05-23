import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/i18n/LocaleContext";
import "./globals.css";

// ─── Base URL ─────────────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://camora.app";

// ─── SEO + Open Graph metadata ────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Camora — Professional CCTV Storage Calculator",
    template: "%s | Camora",
  },

  description:
    "Calculate CCTV storage requirements, NVR throughput, RAID configuration, and PoE switch sizing. " +
    "Supports H.265+, AI analytics, and bilingual EN/AR output with PDF export. " +
    "حاسبة التخزين الاحترافية لأنظمة المراقبة",

  keywords: [
    "CCTV storage calculator",
    "NVR throughput calculator",
    "RAID planning",
    "IP camera storage",
    "H.265 bitrate calculator",
    "surveillance storage",
    "PoE switch sizing",
    "حاسبة تخزين كاميرات المراقبة",
  ],

  authors: [{ name: "Camora" }],
  creator: "Camora",

  openGraph: {
    type:        "website",
    url:         BASE_URL,
    siteName:    "Camora",
    title:       "Camora — Professional CCTV Storage Calculator",
    description: "Calculate storage, NVR throughput, RAID, and PoE switch requirements for any CCTV deployment. Free. No signup required.",
    images: [
      {
        url:    "/og.svg",
        width:  1200,
        height: 630,
        alt:    "Camora CCTV Storage Calculator",
      },
    ],
  },

  twitter: {
    card:        "summary_large_image",
    title:       "Camora — Professional CCTV Storage Calculator",
    description: "Calculate storage, NVR throughput, RAID, and PoE switch requirements for any CCTV deployment.",
    images:      ["/og.svg"],
  },

  icons: {
    icon:        [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple:       [{ url: "/icon.svg" }],
    shortcut:    "/icon.svg",
  },

  manifest: "/site.webmanifest",

  alternates: {
    canonical: BASE_URL,
  },

  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  width:       "device-width",
  initialScale: 1,
  themeColor:  "#0891b2",
};

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/*
          Noto Sans Arabic: professional Arabic typeface for RTL mode.
          IBM Plex Mono: engineering numeric values (Mbps, TB, GB).
          preconnect reduces latency; display=swap prevents invisible text.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}

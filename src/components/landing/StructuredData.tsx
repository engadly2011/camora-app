// ─────────────────────────────────────────────────────────────────────────────
// Structured Data — SoftwareApplication + FAQPage schemas
// Injected as JSON-LD in <head> via Next.js Script component
// ─────────────────────────────────────────────────────────────────────────────

import type { FAQItem } from "./SEOLandingPage";

interface StructuredDataProps {
  name:        string;
  description: string;
  url:         string;
  faqs:        FAQItem[];
}

export function StructuredData({ name, description, url, faqs }: StructuredDataProps) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://camora.app";

  const appSchema = {
    "@context":        "https://schema.org",
    "@type":           "SoftwareApplication",
    "name":            name,
    "description":     description,
    "url":             url,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type":  "Offer",
      "price":  "0",
      "priceCurrency": "USD",
    },
    "author": {
      "@type": "Organization",
      "name":  "Camora",
      "url":   BASE_URL,
    },
    "featureList": [
      "CCTV storage calculation",
      "NVR throughput estimation",
      "RAID configuration planning",
      "PDF report export",
      "Arabic and English support",
      "H.264/H.265/H.265+ codec support",
    ],
  };

  const faqSchema = {
    "@context":  "https://schema.org",
    "@type":     "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name":  faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text":  faq.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

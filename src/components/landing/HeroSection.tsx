"use client";

import { FileDown, Shield, Globe, ArrowRight } from "lucide-react";
import { analytics } from "@/lib/analytics";

interface HeroSectionProps {
  onLaunch: () => void;
}

function launch(onLaunch: () => void, source: 'hero_cta' | 'nav_button' | 'seo_page') {
  analytics.calculatorOpened(source);
  onLaunch();
}

export function HeroSection({ onLaunch }: HeroSectionProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between border-b border-zinc-800/60 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10">
            <span className="font-mono text-sm font-bold text-cyan-400">C</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">Camora</span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/message/camora"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-xs text-zinc-500 hover:text-zinc-300 transition-colors sm:block"
          >
            Contact
          </a>
          <button
            onClick={() => launch(onLaunch, 'nav_button')}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-cyan-500 transition-colors"
          >
            Start Calculating
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">

        {/* Eyebrow */}
        <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-cyan-500">
          Free · No signup · Works offline
        </p>

        {/* H1 — clear, direct, keyword-rich */}
        <h1 className="mx-auto max-w-2xl text-4xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-5xl">
          CCTV Storage &amp; Bandwidth Calculator
        </h1>

        {/* Subheadline — what it does, for whom */}
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-zinc-400">
          Calculate storage, NVR throughput, and bandwidth for any IP camera deployment.
          Get a drive count, RAID recommendation, and PDF report in under a minute.
        </p>

        {/* Arabic subtitle */}
        <p className="mt-2 text-sm text-zinc-600" dir="rtl" lang="ar">
          حاسبة تخزين وعرض نطاق لأنظمة كاميرات المراقبة — مجانية وتدعم اللغتين
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => launch(onLaunch, 'hero_cta')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-8 py-3.5 text-sm font-semibold text-zinc-950 hover:bg-cyan-500 transition-colors sm:w-auto"
          >
            Start Calculating
          </button>
          <button
            onClick={() => launch(onLaunch, 'seo_page')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-8 py-3.5 text-sm text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors sm:w-auto"
          >
            <FileDown className="h-4 w-4" />
            Export PDF Report
          </button>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-zinc-400">{f.icon}</span>
                <span className="rounded border border-zinc-700/60 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
                  {f.tag}
                </span>
              </div>
              <div className="mb-1.5 text-sm font-semibold text-zinc-200">{f.title}</div>
              <div className="text-xs leading-relaxed text-zinc-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* ── How it works ── */}
      <section className="border-t border-zinc-800/60 px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-sm font-semibold text-zinc-400">How it works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 font-mono text-xs font-bold text-cyan-400">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-200">{step.title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-zinc-500">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO links to sub-pages ── */}
      <section className="border-t border-zinc-800/60 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-600">Related calculators</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "CCTV Storage Calculator",         href: "/cctv-storage-calculator"           },
              { label: "IP Camera Bandwidth Calculator",  href: "/ip-camera-bandwidth-calculator"    },
              { label: "RAID Storage Calculator",         href: "/raid-storage-calculator"           },
              { label: "NVR Storage Estimator",           href: "/nvr-storage-estimator"             },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/60 px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <span className="font-mono text-sm font-bold text-cyan-400">Camora</span>
              <span className="text-xs text-zinc-600">© {new Date().getFullYear()}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-600">
              CCTV storage and bandwidth calculator for integrators and consultants.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/message/camora"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:border-emerald-600/60 hover:text-emerald-400 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
            <button
              onClick={() => launch(onLaunch, 'hero_cta')}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-cyan-500 transition-colors"
            >
              Open Calculator
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon:  <Shield className="h-4 w-4" />,
    title: "Accurate Calculations",
    desc:  "Based on actual camera bitrates from vendor spec sheets, not rough estimates. H.264, H.265, H.265+.",
    tag:   "Hikvision · Dahua · Axis",
  },
  {
    icon:  <Globe className="h-4 w-4" />,
    title: "Arabic & English",
    desc:  "Full RTL Arabic support with correct technical terminology. PDF export in both languages.",
    tag:   "عربي + English",
  },
  {
    icon:  <FileDown className="h-4 w-4" />,
    title: "PDF Report",
    desc:  "Export a professional engineering report with cover page, camera summary, and drive recommendations.",
    tag:   "No server · Private",
  },
];

const STEPS = [
  {
    title: "Enter your cameras",
    desc:  "Add camera groups with vendor, resolution, codec, FPS, and retention period.",
  },
  {
    title: "Get instant results",
    desc:  "Storage requirement, drive count, RAID recommendation, and NVR throughput — calculated live.",
  },
  {
    title: "Export or share",
    desc:  "Download a PDF report or copy a share link to send the calculation to your client.",
  },
];

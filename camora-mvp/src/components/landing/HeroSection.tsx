"use client";

// ─────────────────────────────────────────────────────────────────────────────
// HeroSection
//
// Aesthetic direction: industrial-technical. Think surveillance control room
// meets engineering datasheet. Dark, high-contrast, monospace type for specs,
// tight grid, no gradients — just information density and precision.
//
// One job: convert a CCTV engineer into a calculator user in <8 seconds.
// ─────────────────────────────────────────────────────────────────────────────

import { ArrowRight, FileDown, Shield, Cpu, Globe } from "lucide-react";
import { useState, useEffect } from "react";

interface HeroSectionProps {
  onLaunch: () => void;
}

// Animated spec ticker — cycles through real engineering figures
const SPECS = [
  { label: "Cameras",   value: "256",      unit: "ch"    },
  { label: "Storage",   value: "180+",     unit: "TB"    },
  { label: "Codec",     value: "H.265+",   unit: ""      },
  { label: "Retention", value: "365",      unit: "days"  },
  { label: "RAID",      value: "RAID6",    unit: ""      },
  { label: "Bitrate",   value: "1.2",      unit: "Gbps"  },
];

export function HeroSection({ onLaunch }: HeroSectionProps) {
  const [specIdx, setSpecIdx] = useState(0);
  const [fading,  setFading]  = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setSpecIdx((i) => (i + 1) % SPECS.length);
        setFading(false);
      }, 250);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const spec = SPECS[specIdx]!;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between border-b border-zinc-800/60 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10">
            <span className="font-mono text-sm font-bold text-cyan-400">C</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">Camora</span>
          <span className="hidden rounded border border-zinc-700 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:block">
            v1.0
          </span>
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
            onClick={onLaunch}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-cyan-500 transition-colors"
          >
            Open Calculator
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Free · No signup · Works offline
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
          CCTV Storage{" "}
          <span className="text-cyan-400">Engineering</span>
          <br className="hidden sm:block" />
          {" "}Done Right
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-zinc-400">
          Calculate storage requirements, NVR throughput, RAID configuration,
          and PoE switch sizing for any surveillance deployment.
          Export a professional PDF report in seconds.
        </p>

        {/* Arabic subtitle */}
        <p className="mt-2 text-sm text-zinc-600" dir="rtl" lang="ar">
          حاسبة احترافية لتخزين كاميرات المراقبة — تدعم اللغة العربية
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onLaunch}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-8 py-3.5 text-sm font-semibold text-zinc-950 hover:bg-cyan-500 active:scale-[0.98] transition-all sm:w-auto"
          >
            <Cpu className="h-4 w-4" />
            Start Calculating — Free
          </button>
          <button
            onClick={onLaunch}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-8 py-3.5 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors sm:w-auto"
          >
            <FileDown className="h-4 w-4" />
            Export PDF Report
          </button>
        </div>

        {/* Live spec ticker */}
        <div className="mt-14 flex items-center gap-4">
          <div className="h-px w-16 bg-zinc-800" />
          <div className="flex items-baseline gap-1.5 min-w-[140px] justify-center">
            <span
              className="font-mono text-3xl font-bold text-cyan-400 tabular-nums transition-opacity duration-200"
              style={{ opacity: fading ? 0 : 1 }}
            >
              {spec.value}
            </span>
            {spec.unit && (
              <span className="font-mono text-sm text-zinc-500">{spec.unit}</span>
            )}
          </div>
          <div className="h-px w-16 bg-zinc-800" />
        </div>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-zinc-600">
          {spec.label} support
        </p>

        {/* Feature grid */}
        <div className="mt-20 grid w-full max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </main>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="border-t border-zinc-800/60 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
            How it works
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 font-mono text-xs font-bold text-cyan-400">
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

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/60 px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <span className="font-mono text-sm font-bold text-cyan-400">Camora</span>
              <span className="text-xs text-zinc-600">© {new Date().getFullYear()}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-600">
              Professional CCTV engineering calculator. Built for integrators and consultants.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/message/camora"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:border-emerald-600/60 hover:text-emerald-400 transition-colors"
            >
              {/* WhatsApp icon — inline SVG, no external dep */}
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>

            <button
              onClick={onLaunch}
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

// ─── Feature cards ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon:  <Shield className="h-4 w-4" />,
    title: "Engineering Accurate",
    desc:  "H.264/H.265/H.265+ bitrate regression, RAID rebuild risk, URE probability. Not guesswork.",
    tag:   "355 passing tests",
  },
  {
    icon:  <Globe className="h-4 w-4" />,
    title: "Bilingual EN / AR",
    desc:  "Full RTL Arabic support. Technical terms stay in English. Correct for professional reports.",
    tag:   "عربي + English",
  },
  {
    icon:  <FileDown className="h-4 w-4" />,
    title: "PDF Export",
    desc:  "Generate a professional engineering report for clients and consultants. Cover page included.",
    tag:   "No server, private",
  },
];

function FeatureCard({
  icon, title, desc, tag,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tag: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-zinc-400">{icon}</span>
        <span className="rounded border border-zinc-700/60 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
          {tag}
        </span>
      </div>
      <div className="mb-1.5 text-sm font-semibold text-zinc-200">{title}</div>
      <div className="text-xs leading-relaxed text-zinc-500">{desc}</div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    title: "Configure cameras",
    desc:  "Select vendor, resolution, codec, FPS, scene type, and recording schedule. Add as many groups as needed.",
  },
  {
    title: "Get instant results",
    desc:  "Storage, NVR throughput, RAID recommendation, PoE switch sizing, and UPS load — updated live.",
  },
  {
    title: "Export the report",
    desc:  "Download a PDF engineering report with cover page, BOM, and infrastructure recommendations.",
  },
];

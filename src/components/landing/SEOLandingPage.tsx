"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SEOLandingPage
//
// Shared shell for all SEO-targeted calculator pages.
// Each page passes its own copy — the calculator itself is identical.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { CalculatorShell } from "@/components/calculator/CalculatorShell";
import { FileDown, ArrowRight } from "lucide-react";
import { StructuredData }   from "./StructuredData";

export interface FAQItem {
  q: string;
  a: string;
}

export interface SEOPageContent {
  h1:          string;
  subheadline: string;
  description: string;
  ctaLabel:    string;
  faqs:        FAQItem[];
  trustPoints: string[];
}

interface SEOLandingPageProps {
  content: SEOPageContent;
}

export function SEOLandingPage({ content }: SEOLandingPageProps) {
  const [showCalculator, setShowCalculator] = useState(false);

  if (showCalculator) {
    return <CalculatorShell />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <StructuredData
        name={content.h1}
        description={content.subheadline}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        faqs={content.faqs}
      />

      {/* ── Nav ── */}
      <nav className="border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10">
              <span className="font-mono text-sm font-bold text-cyan-400">C</span>
            </div>
            <span className="text-sm font-semibold text-zinc-100">Camora</span>
          </a>
        </div>
        <button
          onClick={() => setShowCalculator(true)}
          className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-cyan-500 transition-colors"
        >
          {content.ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </nav>

      {/* ── Hero ── */}
      <header className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Free · No signup · Works offline
        </div>

        <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
          {content.h1}
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
          {content.subheadline}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => setShowCalculator(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-8 py-3.5 text-sm font-semibold text-zinc-950 hover:bg-cyan-500 transition-colors sm:w-auto"
          >
            {content.ctaLabel}
          </button>
          <button
            onClick={() => setShowCalculator(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-8 py-3.5 text-sm text-zinc-300 hover:border-zinc-600 transition-colors sm:w-auto"
          >
            <FileDown className="h-4 w-4" />
            Export PDF Report
          </button>
        </div>
      </header>

      {/* ── Description ── */}
      <section className="border-t border-zinc-800/40 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm leading-relaxed text-zinc-500">{content.description}</p>
        </div>
      </section>

      {/* ── Trust signals ── */}
      <section className="border-t border-zinc-800/40 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {content.trustPoints.map((point) => (
              <div
                key={point}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-center"
              >
                <span className="text-xs font-medium text-zinc-400">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-zinc-800/40 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-lg font-semibold text-zinc-200">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {content.faqs.map((faq) => (
              <div key={faq.q} className="border-b border-zinc-800/60 pb-6 last:border-0 last:pb-0">
                <h3 className="mb-2 text-sm font-semibold text-zinc-200">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="border-t border-zinc-800/40 px-6 py-12 text-center">
        <p className="mb-4 text-sm text-zinc-500">Ready to calculate? It takes under a minute.</p>
        <button
          onClick={() => setShowCalculator(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-8 py-3.5 text-sm font-semibold text-zinc-950 hover:bg-cyan-500 transition-colors"
        >
          {content.ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/60 px-6 py-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="font-mono text-xs text-zinc-600">Camora © {new Date().getFullYear()}</span>
          <a href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">← Back to home</a>
        </div>
      </footer>
    </div>
  );
}

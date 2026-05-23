# Camora MVP — Deployment Guide

## Pre-deployment checklist

- [x] `npm run build` passes with zero errors
- [x] `npx tsc --noEmit` passes with zero TypeScript errors
- [x] No `@camora/calc-engine` package references (engine inlined)
- [x] No broken imports
- [x] No SSR-unsafe APIs outside `useEffect` or `"use client"` components
- [x] `suppressHydrationWarning` on `<html>` (locale sets `dir` client-side)
- [x] `vercel.json` configured
- [x] SEO metadata complete (title, description, OG, Twitter cards)
- [x] `robots.txt` and `sitemap.xml` via Next.js route handlers
- [x] Security headers configured in `next.config.ts`
- [x] PDF generation uses dynamic import (excluded from initial bundle)
- [x] jsPDF never imported server-side
- [x] Arabic font loaded via Google Fonts with `display=swap`
- [x] `NEXT_PUBLIC_BASE_URL` environment variable documented

---

## Environment variables

### Required for production
```
NEXT_PUBLIC_BASE_URL=https://camora.app
```

### Optional
```
# None required — no database, no auth, no external APIs
```

Set in Vercel Dashboard → Project → Settings → Environment Variables.

---

## Vercel deployment steps

### Option A — Vercel CLI (fastest)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. From the camora-mvp directory
cd camora-mvp

# 3. Deploy (first time — follow prompts)
vercel

# 4. Set environment variable
vercel env add NEXT_PUBLIC_BASE_URL production
# Enter: https://camora.app (or your domain)

# 5. Deploy to production
vercel --prod
```

### Option B — GitHub + Vercel dashboard

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "chore: initial MVP launch"
git remote add origin https://github.com/YOUR_ORG/camora.git
git push -u origin main
```

Then:
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Root directory: `.` (already at app root — no monorepo)
5. Build command: `next build` (default)
6. Environment variables: add `NEXT_PUBLIC_BASE_URL`
7. Click **Deploy**

### Custom domain

In Vercel Dashboard → Project → Settings → Domains:
- Add `camora.app`
- Add `www.camora.app` → redirect to `camora.app`
- SSL is automatic

---

## Production build commands

```bash
# Local development
npm run dev

# Type check only
npm run typecheck

# Production build (runs on Vercel)
npm run build

# Start production server locally
npm run build && npm start
```

---

## Final file structure

```
camora-mvp/
├── public/
│   ├── icon.svg            ← SVG favicon + Apple icon
│   ├── og.svg              ← Open Graph 1200×630
│   ├── robots.txt          ← Static fallback
│   └── site.webmanifest    ← PWA manifest
│
├── src/
│   ├── app/
│   │   ├── globals.css     ← Tailwind + RTL typography
│   │   ├── layout.tsx      ← Root layout with full SEO metadata
│   │   ├── page.tsx        ← Landing → Calculator router
│   │   ├── robots.ts       ← Next.js robots.txt handler
│   │   └── sitemap.ts      ← Next.js sitemap.xml handler
│   │
│   ├── components/
│   │   ├── landing/
│   │   │   ├── LandingPage.tsx   ← Hero ↔ Calculator state router
│   │   │   └── HeroSection.tsx   ← Full landing: nav, hero, features, footer
│   │   ├── calculator/
│   │   │   ├── CalculatorShell.tsx
│   │   │   ├── CameraRow.tsx
│   │   │   ├── ResultsPanel.tsx
│   │   │   ├── RecommendationPanel.tsx
│   │   │   └── ExportModal.tsx
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── NumberInput.tsx
│   │       ├── Select.tsx
│   │       ├── Slider.tsx
│   │       ├── StatCard.tsx
│   │       └── Toggle.tsx
│   │
│   ├── hooks/
│   │   └── useCalculator.ts      ← Form state + live calc, no external deps
│   │
│   ├── i18n/
│   │   ├── LocaleContext.tsx     ← EN/AR context, localStorage persistence
│   │   ├── en.ts
│   │   ├── ar.ts
│   │   ├── index.ts
│   │   └── types.ts
│   │
│   ├── lib/
│   │   ├── constants.ts          ← UI option lists
│   │   ├── utils.ts              ← cn(), formatMbps(), formatTB()
│   │   ├── engine/               ← Full calculation engine (inlined)
│   │   │   ├── index.ts          ← calculate(), generateRecommendation()
│   │   │   ├── types.ts          ← CameraConfig, SystemResult, all types
│   │   │   ├── calculator.ts     ← Main orchestrator
│   │   │   ├── bitrate.ts        ← 5-stage bitrate pipeline
│   │   │   ├── storage.ts        ← HDD sizing, RAID selection
│   │   │   ├── nvr.ts            ← NVR throughput + bandwidth
│   │   │   ├── recommendation.ts ← Infrastructure BOM + advisories
│   │   │   ├── recommendationTypes.ts
│   │   │   ├── constants.ts      ← Engineering constants (IEEE/IEC/ASHRAE)
│   │   │   ├── units.ts          ← Unit conversions, PoE class mapping
│   │   │   ├── validation.ts
│   │   │   └── data/
│   │   │       ├── codecs.ts
│   │   │       ├── resolutions.ts
│   │   │       ├── sceneProfiles.ts
│   │   │       └── vendors.ts
│   │   └── pdf/
│   │       ├── schema.ts         ← ReportDocument IR
│   │       ├── renderer.ts       ← jsPDF renderer (dynamic import)
│   │       └── export.ts         ← usePdfExport hook
│   │
│   └── types/
│       └── calculator.ts         ← CameraRow, CalculatorFormState
│
├── next.config.ts          ← Security headers
├── vercel.json             ← Vercel deployment config
├── package.json            ← Single package, no workspace
├── postcss.config.mjs
└── tsconfig.json
```

---

## What is NOT in this MVP

| Not included | Why |
|---|---|
| Database | Not needed — all calculations are client-side |
| Authentication | Not needed — public tool |
| User accounts | Not needed — no data to persist server-side |
| API routes | Not needed — engine runs in the browser |
| Analytics | Add PostHog or Vercel Analytics post-launch |
| Stripe / payments | Add after validating demand |
| Multi-tenancy | Future SaaS layer |

---

## Performance baseline (Vercel Edge Network)

| Metric | Value |
|---|---|
| Initial JS bundle | 167 kB (gzipped ~55 kB) |
| jsPDF chunk | Code-split, loaded on export click only |
| Time to interactive | < 2s on 4G |
| Lighthouse Performance | 90+ expected |
| All routes | Static (○) — no server compute on request |

---

## Launch day verification

```bash
# 1. Build passes
npm run build

# 2. No type errors
npm run typecheck

# 3. Check deployed routes
curl https://camora.app/robots.txt
curl https://camora.app/sitemap.xml

# 4. Check OG metadata
# Use: https://opengraph.xyz or https://metatags.io

# 5. Check mobile (Chrome DevTools → Device toolbar)
# Verify: landing page, calculator, PDF export modal
```

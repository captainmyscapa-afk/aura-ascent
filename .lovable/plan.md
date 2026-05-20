# Plan: Dynamic Industry Mode System for AURUM OS

Transform AURUM OS from feeling like separate sections into one adaptive operating system whose entire content, copy, AI context, and visual mood shift when the user switches between **Yachts / Villas / Jets / Cars**.

## 1. Global Industry Context

Create a single source of truth that every screen reads from.

- `src/lib/industry/types.ts` — `IndustryId = "yachts" | "villas" | "jets" | "cars"` and an `IndustryConfig` shape covering: label, icon, accent color tokens, ambient gradient, mentor persona, terminology, intel feed items, daily objectives, networking targets, content prompts, opportunities, learning modules, market trend tags, event names, authority strategies.
- `src/lib/industry/config.ts` — fully populated config object for all 4 modes (rich, distinct, industry-accurate copy, no placeholders).
- `src/lib/industry/IndustryProvider.tsx` — React context + `useIndustry()` hook. Persists selection in `localStorage` (`aurum.industry`). Default = `yachts`.
- Wire provider into `src/routes/__root.tsx` so every route has access.

## 2. Immersive Mode Switcher

A cinematic switcher accessible from the TopBar (and a richer one on Dashboard).

- `src/components/aurum/IndustrySwitcher.tsx` — compact dropdown/segmented control in `TopBar`, showing icon + label of active mode, with the 4 options. Switching triggers a brief fade/cross-dissolve on the main content (CSS transition on a key change).
- Mode switch updates a `data-industry` attribute on `<html>` so CSS can adapt ambient visuals.
- `src/components/aurum/AmbientBackdrop.tsx` — fixed full-screen layered gradient + subtle noise/grain, color-shifts per mode using CSS vars `--ambient-1`, `--ambient-2`, `--ambient-accent`. Mounted in `AppShell`.

## 3. Visual Adaptation (one identity, four moods)

In `src/styles.css`, define per-mode CSS variables under `[data-industry="yachts"]`, etc.:

- Yachts → deep ocean navy + platinum gold (current default)
- Villas → warm sand + terracotta + gold
- Jets → midnight steel + ice blue + gold
- Cars → carbon black + ember red + gold

Components keep using semantic tokens; only ambient/accent layer changes. Aurum gold identity remains constant.

## 4. Onboarding → Industry

Refactor `src/routes/onboarding.tsx` so Step 01 chooses the industry, and finishing onboarding sets the global industry. Replace the current mixed list with the 4 canonical modes (Yachts/Villas/Jets/Cars) with correct icons (Sailboat, House, Plane, Car).

## 5. Industry-Adaptive Screens

Every primary route reads `useIndustry()` and renders config-driven content. No screen should contain hardcoded industry copy.

- **Dashboard** (`src/routes/dashboard.tsx`) — hero greeting uses mentor persona; "Today's objectives" come from `config.dailyObjectives`; KPI tiles use mode terminology; market-trend chips from `config.marketTrends`.
- **Mentor** (`src/routes/mentor.tsx`) — header shows mentor persona name + specialty; suggested prompts come from `config.mentorPrompts`; chat shell only (no live AI yet — prompts visible as starters).
- **Intelligence** (`src/routes/intelligence.tsx`) — feed cards from `config.intelFeed` (sources, headlines, tags).
- **Network** (`src/routes/network.tsx`) — networking targets + suggested outreach lines from `config.networking`.
- **Studio** (`src/routes/studio.tsx`) — content prompt templates from `config.contentPrompts`.
- **Academy** (`src/routes/academy.tsx`) — learning modules from `config.learningModules`.
- **TopBar** — shows current mode chip + switcher; subtle accent line uses mode accent.
- **Sidebar** — active item highlight uses mode accent var.

## 6. AI-Readiness Hook

`src/lib/industry/useIndustryPrompt.ts` — helper returning a prefixed system prompt:

> "You are AURUM AI mentoring a {level} entering {industry.label} ({industry.specialtyShort}). Focus on {industry.focusAreas}. Use terminology: {industry.terms}."

Even though no live AI call is wired today, this is exported and used in mentor/studio starter prompts so the wiring is ready.

## 7. Mode-Switch Feel

- On switch: 220ms cross-fade of main content (via `key={industry}` on `<main>` in `AppShell`), 600ms ambient backdrop color tween, toast: *"Entering {Industry} ecosystem."*
- Sidebar icon for active section flashes with accent color.

## Technical notes

- All new files use semantic tokens defined in `src/styles.css`; no raw hex in components.
- Context is client-only; safe under TanStack Start SSR by guarding `localStorage` access with `typeof window !== "undefined"`.
- Route files stay thin — they consume config, they don't define it.
- No backend changes; no Lovable Cloud needed yet. AI wiring is deferred but the prompt builder is in place.

## Out of scope (next iterations)

- Live Lovable AI Gateway calls per mode (hook is ready; UI is wired with starter prompts only).
- Mode-specific photography/video backdrops (using gradients + grain now).
- Per-mode notification feeds from real sources.

Ready to implement on approval.
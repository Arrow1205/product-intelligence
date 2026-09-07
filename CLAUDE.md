# Product Intelligence — Claude Code Instructions

## Project overview
A Product Intelligence workspace connecting real data, research, personas, growth prioritization, and experimentation. See the full specification embedded in conversation history.

## Tech stack
- Next.js 16 (App Router, TypeScript strict)
- Supabase (PostgreSQL 15, no Auth for POC)
- Tailwind CSS v4 (CSS-first, semantic tokens in globals.css)
- Radix UI (headless primitives)
- Lucide icons, Recharts, TanStack Table, Zustand, date-fns

## Critical rules
1. BRASS scoring is ALWAYS manual. No AI prefill, no AI suggestions for individual dimensions. AI must never call any endpoint that writes to `brass_scores`.
2. OBSERVED evidence always has higher base confidence than GENERATED.
3. Never expose `SUPABASE_SERVICE_ROLE_KEY` or any GA4 credentials to the browser. All sensitive operations go through `/app/api/` Route Handlers.
4. `POC_USER_ID = '00000000-0000-0000-0000-000000000001'` is used as a placeholder user ID for the POC (no auth).
5. Mock/demo data lives in `lib/demo/` only. Never mix with Supabase data.
6. Every component uses CSS custom properties from `globals.css`. No hardcoded color values.

## Design token system
All semantic colors are defined as CSS custom properties in `app/globals.css` under `:root` (light) and `[data-theme="dark"]` (dark). Tailwind v4 maps them via `@theme inline`. Always use `var(--token-name)` syntax.

## File structure
```
app/                       # Next.js App Router pages
  project/[projectId]/     # Project-scoped pages
    data-sources/
    analytics/
    (Phase 2+...)
components/
  ui/                      # Design system primitives
  layout/                  # Shell, sidebar, theme
  project/                 # Project-level components
  data-sources/            # Data source UI
lib/
  supabase/                # client.ts (browser), server.ts (server-only)
  types/database.ts        # Full DB type definitions
  utils/cn.ts              # Tailwind merge utility
docs/                      # Architecture docs
supabase/migrations/       # SQL migration files
```

## Current Phase: 1 — Foundation
See `docs/ROADMAP.md` for what is implemented and what comes next.

## Before implementing any feature
Follow the 10-step feature checklist in the specification:
1. Define user objective
2. Define required data
3. Define database impact
4. Define server/API impact
5. Define UI states (loading/empty/error/success)
6. Define contextual help/tooltips
7. Implement
8. Test
9. Verify Light and Dark modes
10. Verify accessibility and no regression

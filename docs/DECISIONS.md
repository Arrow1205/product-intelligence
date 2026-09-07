# Architecture Decision Records

## ADR-001 — No authentication in POC
**Decision:** Auth is skipped for POC. All DB operations use a hardcoded `POC_USER_ID = '00000000-0000-0000-0000-000000000001'`.
**Rationale:** Faster iteration; auth can be added without schema changes (user_id column already present on all tables).
**Consequence:** Do not enable RLS during POC phase. Enable it when Supabase Auth is wired up.

## ADR-002 — Tailwind v4 CSS-first tokens
**Decision:** Design tokens are defined as CSS custom properties in `:root` / `[data-theme="dark"]` in `globals.css`, exposed to Tailwind v4 via `@theme inline`.
**Rationale:** Tailwind v4 uses CSS-first configuration. This gives us semantic tokens usable both in CSS (`var(--token)`) and Tailwind utility classes (`bg-surface-primary`).
**Consequence:** No `tailwind.config.js` file. All theme values are in `globals.css`.

## ADR-003 — Server-only Supabase for sensitive routes
**Decision:** `lib/supabase/server.ts` uses the service role key (or anon key as fallback). GA4 credentials and all integration secrets are never returned in API responses to the browser.
**Rationale:** Credentials must never reach the client bundle or browser network tab.
**Consequence:** All integration sync logic must live in Next.js Route Handlers or Server Actions.

## ADR-004 — BRASS is strictly manual
**Decision:** No AI endpoint accepts or returns BRASS dimension scores. The BRASS UI never calls an AI route. Only the total (B+R+A+S) is calculated automatically.
**Rationale:** Spec requirement. BRASS validity depends on human judgment, not AI inference.
**Consequence:** When Ask AI is built, it must explicitly exclude BRASS from its output schema.

## ADR-005 — Evidence entity is project-scoped
**Decision:** The `evidence` table is scoped to a `project_id`. Future entity-specific links (to personas, pain points, etc.) will use `evidence_links` junction tables added in later migrations.
**Rationale:** Keeps Phase 1 schema minimal while not blocking future phases. Links are additive.

## ADR-006 — POC uses anon key with RLS disabled
**Decision:** For POC, Supabase is used with anon key and no RLS policies. The service role key is used server-side.
**Rationale:** RLS policies require auth.uid() which is not available without Supabase Auth.
**Migration path:** Add RLS policies referencing auth.uid() = user_id when auth is introduced.

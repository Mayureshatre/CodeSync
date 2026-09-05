# AGENTS.md
## Persistent Instructions for AI Coding Agents Working on CodeSync

This file governs how an AI coding agent (Google Antigravity, Cursor, Claude Code, or similar) works in this repository. It applies to every task, every session, and every file change unless a human maintainer explicitly overrides it in writing for that task.

---

## 1. Project Context

**CodeSync** is a developer matchmaking platform. Its tagline: **"Where developers find their missing piece."**

Fundamentally, CodeSync lets a developer who has a project but is missing a specific skill (e.g., a JavaScript/PostgreSQL developer who needs a Python developer) get matched with developers who have that skill and are interested in collaborating. The platform computes explainable match scores between developers and projects, supports applications and invitations, and gives matched collaborators a lightweight shared workspace. It is a matchmaking and light-collaboration product — not a job board, not a full project-management suite, and not (at MVP) a recruiting/organizations platform.

---

## 2. Source of Truth

Three documents govern this repository, in this order of authority for their respective domains:

- **`SRS.md`** — defines *what* the product does: features, user journeys, personas, data entities (conceptual), scope (MVP/Phase 2/Phase 3). Authoritative for product behavior.
- **`ARCHITECTURE.md`** — defines *how* the product is built: system design, concrete schema, API design, module boundaries, matching engine design, security model, configuration mechanism. Authoritative for technical implementation.
- **`AGENTS.md`** (this file) — defines *how the agent behaves* while writing code. Authoritative for process, conventions, and workflow — never for product or architecture decisions.

**If these documents conflict:**
- A product-behavior conflict → `SRS.md` wins.
- A technical-implementation conflict (schema shape, API contract, module boundary) → `ARCHITECTURE.md` wins, unless it directly contradicts a product behavior stated in `SRS.md`, in which case stop and flag it rather than guessing.
- Anything in `AGENTS.md` that seems to conflict with either document is a process/style detail only — it never overrides product or architecture content.
- **If the agent cannot resolve a conflict from the documents alone, it must stop and ask for clarification instead of picking a side.** Do not silently resolve ambiguity by making a new product or architecture decision.

---

## 3. Development Principles

- **Build incrementally.** Implement one milestone, module, or task at a time, following the order in `ARCHITECTURE.md` §38 (Implementation Order and Dependencies). Never attempt to scaffold the entire application in a single step.
- **Follow the approved architecture.** Do not introduce alternative patterns, frameworks, or structures not present in `ARCHITECTURE.md`.
- **Prefer simple, maintainable solutions** over clever ones. If two approaches satisfy the requirement, choose the one with less code and fewer moving parts.
- **Avoid unnecessary dependencies.** Every new package must be justified against `ARCHITECTURE.md` §2's approved stack. Do not add a library to solve a problem the existing stack already solves.
- **Avoid premature optimization.** Do not add caching, batching, or performance work beyond what `ARCHITECTURE.md` specifies unless a measured problem justifies it.
- **Do not silently change requirements.** If implementing a task reveals that a requirement is unclear, contradictory, or seemingly wrong, do not "fix" it unilaterally — flag it (see §14, §15).

---

## 4. Technology Rules (per `ARCHITECTURE.md` §2)

Use only the approved stack, for its intended purpose:

| Technology | Use for | Do not use for |
|---|---|---|
| Next.js (App Router) + React + TypeScript | Frontend pages/components and API route handlers | A separate frontend framework or a separate backend framework |
| Tailwind CSS | All styling | CSS-in-JS libraries, ad hoc inline styles as a substitute for design tokens |
| Framer Motion | Animations/transitions | Custom animation libraries |
| Prisma + PostgreSQL | All persistence and schema | Any other ORM or a second database engine |
| Redis (via BullMQ) | Caching, job queue, rate-limit counters | A separate message broker |
| Auth.js (NextAuth) | Authentication (credentials + Google + GitHub OAuth) | Rolling custom OAuth/session handling |
| Zod | Request/response and form validation, shared client/server | Manual/ad hoc validation logic |
| TanStack Query | Server-state fetching/caching on the frontend | Redux or other global state libraries |
| S3-compatible storage | Resumes, avatars, images | Storing binary files in the database |
| Sentry / PostHog | Error tracking / product analytics | Custom logging-analytics pipelines |

Any technology not in `ARCHITECTURE.md` §2 requires explicit approval before use — the agent must not add it unilaterally, even for a seemingly small utility need.

---

## 5. Repository / Folder Structure

Follow `ARCHITECTURE.md` §32 exactly. Summary of where new code belongs:

- `apps/web/app/(public)/` — SSR/ISR public pages (landing, explore, public profiles/projects).
- `apps/web/app/(app)/` — authenticated app pages.
- `apps/web/app/(admin)/` — admin panel pages.
- `apps/web/app/api/v1/**` — route handlers only. Thin controllers: parse/validate input, call a service, shape the response. No business logic here.
- `apps/web/src/server/services/` — one service module per feature area (e.g., `matchingService.ts`, `applicationService.ts`). All business logic and authorization checks live here.
- `apps/web/src/server/jobs/` — background job definitions.
- `apps/web/src/server/errors/` — typed domain error classes.
- `apps/web/src/server/middleware/` — authentication verification, global error handler.
- `apps/web/src/server/db/` — Prisma client singleton.
- `apps/web/src/components/` — app-specific (non-shared) components.
- `apps/web/src/hooks/` — React Query hooks per resource.
- `apps/web/src/lib/` — shared Zod schemas and utilities.
- `packages/ui/` — shared design-system components (Navbar, Cards, MatchScore, etc.).
- `packages/shared-types/` — types shared across client/server/tests.
- `prisma/schema.prisma`, `prisma/migrations/` — schema and migrations.
- `worker/` — background worker process entry point (deployed separately).
- `tests/unit/`, `tests/integration/`, `tests/e2e/` — per `ARCHITECTURE.md` §31.

New code must go in the module matching its feature area. Do not create new top-level directories without checking `ARCHITECTURE.md` §32 first.

---

## 6. Frontend Rules

- **Next.js App Router:** respect the `(public)` / `(app)` / `(admin)` route groups; public pages are Server Components using SSR/ISR, authenticated pages are Client Components backed by React Query.
- **React components:** functional components only; props-driven, no internal data fetching inside `packages/ui` components — fetching happens in page/hook layers (`ARCHITECTURE.md` §33).
- **TypeScript:** strict mode on; no `any` without a comment explaining why it's unavoidable.
- **Tailwind:** use design tokens/utility classes per `ARCHITECTURE.md` §3/SRS §10; do not hardcode colors, spacing, or type sizes that already have a token.
- **Shared UI components:** reuse `packages/ui` components (Navbar, Sidebar, SkillBadge, DeveloperCard, ProjectCard, MatchScore, ApplicationCard, NotificationItem, Modal, Toast, DataTable, EmptyState, Skeleton, ConfirmDialog, etc.) instead of building one-off equivalents.
- **Responsive design:** every page must work at the breakpoints in `SRS.md` §10.2 (mobile/tablet/laptop/desktop) — test navigation, forms, and feeds at each.
- **Accessibility:** semantic HTML first; ARIA only where semantic HTML is insufficient; visible focus states always present; form errors associated via `aria-describedby`; respect `prefers-reduced-motion`.
- **Loading/error/empty states:** every list, feed, or data-driven view must implement its own skeleton loading state, empty state (with a specific message and primary action), and error state (with retry) — never a generic "Something went wrong."
- **Form validation:** use React Hook Form + a Zod schema shared with the corresponding API endpoint's validation — do not duplicate validation rules by hand on the client.
- **API interaction:** all server communication goes through a React Query hook in `src/hooks/`; components never call `fetch`/`axios` directly.
- **Animations:** use Framer Motion per the motion system in `SRS.md` §10 (page transitions, hover/modal/dropdown timing) — animations must degrade gracefully under `prefers-reduced-motion`.

---

## 7. Backend Rules

- **Route Handlers are thin controllers only:** parse and validate the request (Zod), call the relevant service, map the result/error to a response. No Prisma calls, no business logic, no authorization logic directly in a route handler.
- **Service layer owns business logic and authorization.** Every service method that reads or mutates scoped data takes the authenticated actor explicitly and enforces the applicable permission check inside the service (`ARCHITECTURE.md` §4, §8) — never assume middleware already handled authorization.
- **Zod validation:** every endpoint has a request schema; invalid input is rejected before reaching the service layer.
- **Typed domain errors:** throw `NotFoundError`, `ForbiddenError`, `ConflictError`, `ValidationError`, `RateLimitedError` (or the established equivalents) from services; a single global error-handling wrapper maps them to the standard error envelope. Do not construct raw HTTP error responses inside a route handler.
- **Database access through Prisma only,** and only from the service layer (or job handlers) — never from route handlers or frontend code.
- **Keep business logic out of route handlers**, and keep cross-module calls going through a service's public interface, never direct database reads of another module's tables.

---

## 8. Database Rules

- **Follow the approved Prisma schema and relationships** in `ARCHITECTURE.md` §6. Do not add, remove, or restructure tables/fields without first checking whether the change is already covered there.
- **Do not casually change schema design.** A schema change is only acceptable when it implements something already specified in `SRS.md`/`ARCHITECTURE.md` but not yet modeled, or fixes a genuine bug — never as a stylistic preference.
- **Migrations:** every schema change is an explicit, reviewed Prisma migration file (`prisma/migrate dev` locally, applied via CI/CD per `ARCHITECTURE.md` §30). Never hand-edit the database schema outside a migration.
- **Avoid N+1 queries:** use Prisma `include`/`select` deliberately for any list endpoint returning related entities; this is a required review check, not a suggestion.
- **Indexes:** preserve and extend the indexing scheme in `ARCHITECTURE.md` §6.2 (unique constraints, composite indexes on status/foreign-key pairs, GIN/full-text indexes for search) when adding queries that would otherwise scan a large table.
- **Preserve data integrity:** respect soft-delete conventions (`status`/timestamp fields) for User, Project, and Review per `ARCHITECTURE.md` §5/§20 — do not hard-delete rows that the architecture specifies as soft-deleted.

---

## 9. Authentication & Authorization

- Follow the authentication approach in `ARCHITECTURE.md` §8 exactly: Auth.js with credentials + Google + GitHub providers, JWT access token + rotating refresh token in httpOnly cookies.
- **Never trust client-side authorization.** Hiding a button or route in the UI is a UX courtesy only — it is never a substitute for a server-side check.
- **Authorization must be enforced server-side**, inside the service layer, using the authenticated actor's role and resource ownership (`ARCHITECTURE.md` §8, §18) — every new service method must include this check before touching data.
- **Never expose secrets** — no API keys, tokens, or credentials in client-side code, logs, error messages, or committed files.

---

## 10. Code Quality

- **TypeScript strictness:** no implicit `any`; prefer explicit types/interfaces from `packages/shared-types` over duplicating type definitions.
- **Naming conventions:** `camelCase` for variables/functions, `PascalCase` for components/types/classes, files named after their primary export (e.g., `matchingService.ts`, `ProjectCard.tsx`).
- **Reusable functions:** extract shared logic into a service, hook, or utility rather than copy-pasting across files.
- **Avoid duplicated logic** — especially state-machine/validation logic that must match between frontend display and backend enforcement (e.g., `getAvailableActions` per `ARCHITECTURE.md` §33 is shared, not reimplemented twice).
- **Comments only where useful** — explain *why*, not *what*; do not narrate obvious code.
- **Keep functions/components reasonably focused** — a function or component that's doing several unrelated things should be split.

---

## 11. Security

- **Input validation:** every endpoint validates input via Zod before it reaches business logic; never trust client-supplied IDs/roles/permissions.
- **Authentication:** per §9 above; email must be verified before publishing a project or applying (enforced in the service layer, per `ARCHITECTURE.md` §8).
- **Authorization:** per §9 above — always server-side, always in the service layer.
- **File uploads:** validate MIME type and size server-side (never rely on client-side checks alone); resumes and images go through the pre-signed upload flow in `ARCHITECTURE.md` §17; private files (resumes) are never served via a public URL.
- **Secrets/environment variables:** stored in the deployment platform's secret manager, never committed; product-tunable values (match threshold, review window, deletion grace period) live in `PlatformConfig` (database), not environment variables — see §12 below.
- **API security:** rate limiting on auth and creation endpoints per `ARCHITECTURE.md` §19; CSRF protection on state-changing requests; parameterized queries only (Prisma handles this by construction — never construct raw SQL via string concatenation).
- **User-generated content:** render as plain text/escaped by default (React's default encoding); never render user content as raw HTML without sanitization.
- **Privacy-sensitive data:** `User` (PII) and `Profile` (public-facing) are structurally separate — never serialize `User.email`/`passwordHash` in a public-facing response; resumes are private by default (`ARCHITECTURE.md` §11, §20).

---

## 12. CodeSync-Specific Rules

These implement specific, already-decided architectural constraints. **Do not deviate from them, and do not invent additional behavior beyond what is listed:**

- **Strict matching logic:** a developer must satisfy every `required` project/role skill at or above its minimum proficiency to be considered a candidate at all. This is a hard filter, not a scoring factor — a developer failing it receives no `Match` row for that project (absence, not a zero score).
- **Deterministic, versioned matching:** `matchingService.computeMatchScore()` is a pure function (no side effects, no database calls inside it) and every `Match` row stores an `algorithmVersion`. Changing scoring weights/logic requires incrementing the version and triggering a deliberate recompute — never modify scoring logic without this.
- **Required-skill filtering:** applies before any weighted scoring occurs (see above) — do not weight a missing required skill instead of hard-filtering it out.
- **Match score factors:** skill match (40%), experience match (15%), collaboration/project-type match (15%), availability match (10%), technology/domain interest match (10%), profile completeness (10%) — weights are stored in `PlatformConfig`, not hardcoded.
- **Match explanation behavior:** explanations are generated by a deterministic template-rendering function reading the stored `factorBreakdown` — never generated by an LLM or freeform text, so the explanation always matches the actual score.
- **Configurable match threshold:** the recommendation-surfacing threshold (default 75%) is read from `PlatformConfig.matchSurfacingThreshold` via `configService` at request/job time — never a hardcoded constant.
- **Configurable review visibility window:** reviews become visible immediately if both sides have submitted; otherwise after `PlatformConfig.reviewVisibilityWindowDays` (default 14 days) via a delayed job. Never hardcode this window.
- **Configurable account deletion grace period:** account deletion is a soft-delete (`pending_deletion` status) with a cancellable delayed hard-delete job firing after `PlatformConfig.accountDeletionGraceDays` (default 30 days). Users can restore during the grace period. Never hardcode this period.
- **Event-driven match recomputation:** matches recompute in response to specific triggers (profile/skill change, resume-extraction approval, project publish/edit) via queued jobs — never a scheduled full-table sweep.
- **Resume extraction behavior:** MVP extraction is deterministic rule-based alias matching against the `Skill` taxonomy — no LLM call at MVP.
- **Explicit user approval for extracted profile changes:** nothing extracted from a resume writes to `UserSkill`/`Experience`/`Education` except through the explicit review-and-approve endpoint. Never auto-apply extracted data.
- **Polling-based messaging for MVP:** no WebSockets/realtime infrastructure at MVP; the client polls `GET /conversations/{id}/messages?since=` while a thread is open. Do not introduce realtime messaging infrastructure without an explicit Phase 2 approval.
- **Workspace creation behavior:** a `Workspace` is created automatically the moment the second active `ProjectMember` is added (i.e., on the first accepted application/invitation) — as a side effect inside the acceptance transaction, not a separate manual step.
- **GitHub data exclusion from matching score:** GitHub-sourced fields (contribution activity, repo stars, etc.) must never be passed into `computeMatchScore()`'s inputs. This is a structural constraint, not a policy — do not add a "GitHub activity" scoring factor under any framing.
- **PostgreSQL search approach for MVP:** search uses native Postgres full-text (`tsvector`/`tsquery`) and trigram (`pg_trgm`) similarity — do not introduce a dedicated search engine (Elasticsearch, Algolia, etc.) at MVP.
- **Notification architecture:** every notification is first written to the `Notification` table (in-app is the source of truth); email is best-effort supplementary delivery gated by per-category `NotificationPreference` settings — a failed email send must never block or hide the in-app notification.
- **Background jobs:** all jobs (BullMQ) must be idempotent — a job handler checks current state before acting, since jobs may be retried. Do not write a job that assumes it only ever runs once.

---

## 13. Testing Rules

Add tests when implementing or modifying:

- **Authentication:** login, OAuth callback, email verification gating, session refresh/revocation — unit and integration tests.
- **Authorization:** every service method that enforces a permission check needs at least one test proving the forbidden case is rejected (e.g., a non-owner cannot accept an application) — not just the happy path.
- **Matching logic:** `computeMatchScore()` needs exhaustive unit tests covering hard-filter pass/fail cases and each weighted factor in isolation; any change to weights or the hard-filter rules requires updated tests.
- **API validation:** each endpoint's Zod schema needs tests for valid input, missing required fields, and malformed types.
- **Database operations:** integration tests for any new Prisma query, especially ones involving joins/relations, run against an ephemeral test database.
- **Critical user flows (E2E, per `ARCHITECTURE.md` §31):** signup → verify → onboarding → profile; project publish → developer recommendation; apply → accept → workspace created; invite → accept → same outcome; report → admin resolution. Do not skip these when a change touches any part of these flows.
- **Edge cases:** cover the cases in `SRS.md` §19 relevant to the change being made (duplicate applications, self-application blocking, project deletion cascades, etc.).

---

## 14. AI Agent Workflow

**Before implementing any task, the agent must, in order:**

1. Read `AGENTS.md` (this file).
2. Read the relevant section(s) of `SRS.md` for the feature being touched.
3. Read the relevant section(s) of `ARCHITECTURE.md` for the same feature.
4. Inspect the existing code in the relevant module(s) — do not assume the codebase matches the documents without checking.
5. Explain the implementation plan (what will change, which files, which approach) before writing code.
6. Identify assumptions or ambiguities explicitly — if something in the task isn't fully covered by `SRS.md`/`ARCHITECTURE.md`, say so before proceeding rather than guessing silently.
7. Only then implement the change.

**After implementation, the agent must:**

1. Run relevant tests (unit/integration/E2E as applicable to the change).
2. Run lint and type checks.
3. Fix any errors surfaced by the above before considering the task done.
4. Review the implementation against `SRS.md` and `ARCHITECTURE.md` to confirm it matches the specified behavior and design — not just that it "works."
5. Summarize the changed files and the resulting behavior in plain language for the human reviewer.

---

## 15. Change Management

The agent must:

- Avoid unrelated refactoring — a task to implement feature X should not also reformat, rename, or restructure unrelated code.
- Avoid changing architecture without approval — if a task seems to require deviating from `ARCHITECTURE.md`, stop and flag it rather than proceeding.
- Avoid modifying requirements — if `SRS.md` seems wrong or incomplete for the task at hand, do not silently reinterpret it; flag the discrepancy.
- Ask for clarification when a requirement is genuinely ambiguous, rather than picking an interpretation and proceeding silently.
- Keep changes focused and reviewable — a pull request/change set should be scoped to one task, with a diff a human can reasonably review in one pass.

---

## 16. Git Rules

- **Small commits:** one logical change per commit; do not bundle unrelated changes.
- **Meaningful commit messages:** describe what changed and why, referencing the relevant SRS/Architecture section where useful (e.g., "Add strict hard-filter check to matchingService per ARCHITECTURE.md §9.1").
- **Never commit secrets:** no API keys, tokens, `.env` files, or credentials — verify `.gitignore` covers them before committing.
- **Review diffs before committing:** check that the diff only contains the intended change, with no accidental debug code, commented-out blocks, or unrelated formatting churn.
- **Do not blindly accept generated code:** any code produced by the agent (or by another agent/tool) must be read and verified against this file, `SRS.md`, and `ARCHITECTURE.md` before being committed — generation is not itself approval.

---

## 17. Definition of Done

Before considering a task complete, confirm all of the following:

- [ ] The implementation matches the relevant behavior described in `SRS.md`.
- [ ] The implementation matches the relevant design described in `ARCHITECTURE.md` (module boundaries, schema, API contract, service/authorization pattern).
- [ ] No product requirement or architectural decision was silently changed, reinterpreted, or worked around.
- [ ] Authorization checks are enforced server-side in the service layer, not only in the UI.
- [ ] All new/changed endpoints have Zod validation and typed domain error handling.
- [ ] All new database changes are captured in a reviewed Prisma migration.
- [ ] N+1 queries and missing indexes have been checked for any new data-fetching code.
- [ ] Relevant tests (unit/integration/E2E as applicable) are added or updated and passing.
- [ ] Lint and type checks pass with no new errors.
- [ ] Loading, empty, and error states are implemented for any new user-facing view.
- [ ] Accessibility basics are met (semantic HTML, focus states, reduced-motion support) for any new UI.
- [ ] No secrets, credentials, or debug code are committed.
- [ ] The change is scoped to the task — no unrelated refactoring bundled in.
- [ ] A plain-language summary of changed files and behavior is provided for human review.
- [ ] Any assumptions or ambiguities encountered were surfaced, not silently resolved.

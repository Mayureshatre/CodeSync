# Software Requirements Specification
## Developer Matchmaking Platform

**Document version:** 1.0
**Status:** Draft for approval
**Audience:** Founders, designers, engineers, and AI coding agents (e.g., Antigravity) implementing the product

---

## 1. Executive Summary

The Developer Matchmaking Platform is a web application that connects developers who need complementary technical skills to collaborate on software projects. A project owner describes what they're building and which skills are missing; the platform surfaces developers whose skills fit, and developers discover projects that match their own skills and interests. The product is positioned as a premium, trust-first matchmaking and light collaboration tool — not a job board and not a full project-management suite.

This document specifies the full product: personas, journeys, functional requirements, UX system, data model, APIs, matching engine, security, and a phased delivery plan. It is written so an AI coding agent can implement the system without further product clarification for MVP scope, while explicitly flagging decisions that need human approval.

---

## 2. Product Vision

The platform should feel like the intersection of a developer social network, a curated project marketplace, and a lightweight collaboration space — closer in spirit to Linear, GitHub, and Stripe than to a generic job board or freelance marketplace. Three principles anchor every feature decision:

1. **Signal over noise.** Every match, recommendation, and notification must be explainable. If the system can't say *why* it's showing something, it shouldn't show it.
2. **Respect for developer time.** Applying, inviting, and messaging should take seconds, not forms-within-forms.
3. **Trust before scale.** Verification, reputation, and moderation are core to the MVP's credibility, not an afterthought bolted on later.

---

## 3. Problem Statement

Developers who want to build something ambitious are frequently blocked by a skills gap they can't fill alone (e.g., a frontend developer needs a backend engineer, or a solo founder needs a designer). Existing channels — Twitter/X threads, Discord servers, generic freelance marketplaces, and job boards — are noisy, untrusted, or optimized for paid work rather than collaborative building. There is no dedicated, trustworthy, skill-aware system that matches *specific technical gaps* in a *specific project* to *specific developers* who have those skills and the interest/availability to help.

---

## 4. Goals

- Let a project owner describe required skills and get in front of qualified, interested developers within days, not weeks.
- Give developers a feed of projects genuinely matched to their skills and stated interests, with a transparent match score.
- Make the apply → review → accept → collaborate loop fast and low-friction.
- Establish a reputation and verification system that rewards real collaboration over vanity metrics.
- Ship a lightweight workspace so a match can start working together on day one, without forcing them off-platform for basic coordination.

## 5. Non-Goals (for the product overall, distinct from MVP scope in §30)

- Replacing GitHub, Jira, Slack, or other professional tooling.
- Operating as a paid freelance marketplace, escrow service, or payments processor.
- Acting as a recruiting/ATS platform for traditional employment (organizations are a secondary, later persona).
- Guaranteeing project outcomes or vetting code quality — the platform matches people, it does not certify skill.

---

## 6. Personas

### 6.1 Project Owner — "Maya, the Builder"
- **Goals:** Ship her side project/startup idea; fill a specific skill gap (e.g., needs a Python/FastAPI developer).
- **Motivations:** Momentum — she wants to keep building and not stall waiting for the right collaborator.
- **Frustrations:** Generic applicants who don't have the actual skill; ghosting; spending hours re-explaining the project to unqualified candidates.
- **Common actions:** Create project, define required/preferred skills and roles, review applications, message applicants, accept/reject, manage team.
- **Key information needed:** Applicant's real skill evidence (GitHub, portfolio, resume-derived skills), availability, and collaboration-preference fit.
- **Journey:** Sign up → build profile → create project → get recommended developers → review applications → accept → move into workspace.

### 6.2 Developer Looking for Projects — "Diego, the Contributor"
- **Goals:** Find interesting projects that match his skills and grow his portfolio/experience.
- **Motivations:** Learning, portfolio building, meeting collaborators, working on something that matters to him.
- **Frustrations:** Feeds full of irrelevant listings; unclear whether he's actually qualified; applying into a void with no response.
- **Common actions:** Browse personalized feed, filter/search projects, apply with a short pitch, track application status.
- **Key information needed:** Match score and why; team composition; expected commitment; project legitimacy signals.
- **Journey:** Sign up → onboarding (skills, interests, availability) → personalized feed → apply → get accepted → workspace.

### 6.3 Developer Looking for Co-founders/Teammates — "Priya, the Long-Term Collaborator"
- **Goals:** Find 1-2 people to build something long-term with, not a one-off gig.
- **Motivations:** Shared ownership, complementary skills, long-term working chemistry.
- **Frustrations:** Most platforms treat every collaboration as short-term/transactional; hard to signal "I want a long-term partner" distinctly from "I want a quick contributor."
- **Common actions:** Sets collaboration preference to "long-term"/"startup"; filters discovery by the same; engages in longer messaging threads before applying/accepting.
- **Key information needed:** The other person's long-term availability, values/interests alignment, track record of finishing things.
- **Journey:** Same core loop as Diego, but discovery and matching weight collaboration-preference and interest-alignment more heavily.

### 6.4 Recruiter / Organization (secondary, Phase 3)
- **Goals:** Identify developers for organizational projects or contract work.
- **Motivations:** Efficient sourcing of vetted, skill-matched talent.
- **Frustrations:** Can't tell who's actually active/available; no organizational account concept.
- **Common actions:** Create an organization account, post projects on behalf of the org, browse developer directory.
- **Key information needed:** Same match/skill data as individual project owners, plus organizational verification.
- **Journey:** Out of scope for MVP; see §31 Future Roadmap.

### 6.5 Administrator — "Sam, the Moderator"
- **Goals:** Keep the platform trustworthy: remove spam/scam projects, handle abuse reports, keep skill taxonomy clean.
- **Motivations:** Platform health and user safety.
- **Frustrations:** Manual moderation without tooling; no visibility into flagged patterns.
- **Common actions:** Review reports queue, suspend/delete accounts, moderate projects/profiles, manage skill taxonomy, view analytics.
- **Key information needed:** Report context, user history, prior violations, platform-wide trends.
- **Journey:** Logs into admin panel → triages report queue → takes action → logs audit trail.

---

## 7. User Stories (representative sample; full backlog derives from §12 Feature Specifications)

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-01 | Project Owner | define required and preferred skills with minimum proficiency | I only see/attract genuinely qualified developers |
| US-02 | Developer | see a personalized feed ranked by skill match | I don't waste time scanning irrelevant projects |
| US-03 | Developer | see *why* a project matched me | I trust the recommendation and act on it |
| US-04 | Project Owner | invite a specific developer the system suggests | I can proactively reach out instead of waiting for applications |
| US-05 | Developer | upload a resume and review/edit extracted skills before they're saved | I retain control over my profile data |
| US-06 | Project Owner | message an applicant before accepting | I can clarify fit before committing |
| US-07 | Developer | withdraw an application | I'm not stuck in a stale process |
| US-08 | Admin | suspend a user and see their report history | I can act on abuse quickly and with context |
| US-09 | Developer | set my availability to "Not looking" | I stop receiving irrelevant recommendations without deleting my profile |
| US-10 | Project Owner | see a lightweight workspace after a match is accepted | my new collaborator and I can start immediately |

---

## 8. Core User Journeys

### Journey 1 — Developer creates a project
Sign up → build profile (skills, experience, availability) → optionally upload resume for skill extraction (user reviews/approves extracted skills) → create project (description, required/preferred skills with proficiency, team size, roles, duration, remote/collaboration type) → publish → system computes matches and notifies qualified developers → developer applies → owner reviews application (message, shortlist, accept/reject) → on acceptance, both become project members and gain access to the shared workspace.

### Journey 2 — Developer discovers a suitable project
Log in → personalized feed ranks open projects by computed match score → developer opens a project → reviews requirements, team, and tech stack → applies with a short pitch → receives status updates as the owner reviews (Applied → Under Review → Shortlisted → Accepted/Rejected) → on acceptance, joins the project workspace.

### Journey 3 — Direct/proactive matchmaking
Independent of any explicit search, the matching engine continuously scores developer profiles against open project requirements. When a score crosses a threshold (default ≥ 75%, configurable), the system: (a) surfaces the developer in the owner's "Recommended Developers" list with an explanation, and (b) surfaces the project in the developer's "Recommended Projects" feed. The owner may invite the developer directly; the developer may apply directly. Both paths converge on the same Application/Invitation state machine (§14 status model).

### Journey 4 — Collaboration after matching
On acceptance: a Project Workspace is created (or the developer is added to the existing one) containing Overview, Team, Tasks (simple kanban), Roadmap (milestone list), Chat, Files/Links, linked Repository, and an Activity Feed recording joins, role changes, task updates, and milestone completions. Members can update their role/status, leave the project (with a confirmation and owner notification), or the owner can remove a member (with notice period and audit log entry). Project status can progress: Active → Paused → Completed → Archived, each visible to all members and reflected in both members' profiles as project history.

---

## 9. Functional Requirements Overview

Functional requirements are grouped by feature area in §12. Each requirement is written to be independently testable and is tagged with its MVP phase (P1/P2/P3, see §30).

---

## 10. UX/UI Requirements

- **Visual language:** Original identity inspired by, but not copying, Linear/Vercel/GitHub/Stripe: high-contrast type, generous whitespace, restrained color used purposefully (e.g., match-score gradient, status badges), subtle depth via shadow/blur rather than heavy skeuomorphism.
- **Typography:** One primary UI typeface (variable font, e.g., Inter or a similar geometric sans) for interface text, and a distinct but complementary typeface for large marketing/landing headlines. Type scale: 12/14/16/18/24/32/48px steps with consistent line-height ratios (1.4–1.6 for body, 1.1–1.2 for display).
- **Color system:** Neutral gray scale (10–12 steps) for surfaces/text, one primary brand accent, and semantic colors (success, warning, danger, info) each defined for both light and dark mode. Match-score uses a dedicated gradient scale (e.g., red→amber→green) never reused for other meanings.
- **Elevation & materials:** Cards use 1px hairline borders plus a soft 1-2 step shadow; modals and command palette use a blurred backdrop (glass effect) at reduced opacity, never applied to large content surfaces (keeps it tasteful, not gimmicky).
- **Micro-interactions:** Hover states on all interactive elements (2–4% surface lightness shift + border emphasis), animated match-score reveal (count-up + color transition, ≤600ms), skill tag hover shows proficiency tooltip, button press states with subtle scale (0.98).
- **Motion system:** Page transitions are fade/slide of 150–200ms; modals scale-fade in from 96%→100% over 150ms; dropdowns slide 4px + fade over 100ms; loading uses skeleton screens, not spinners, for anything with a known layout. All animation respects `prefers-reduced-motion` by falling back to instant/opacity-only transitions.
- **Dark mode:** First-class, not an inverted filter. See dedicated palette in §10.1.
- **Empty/loading/error states:** Every list/feed/dashboard view must define its own empty state illustration + message + primary action (e.g., "No matches yet — complete your profile to improve matching"), a skeleton loading state, and a distinguishable error state with a retry action (see full catalog in §29 of the original brief, consolidated into the Component System, §12.9).

### 10.1 Dark Mode Palette (baseline, refine during design phase)

| Token | Light | Dark |
|---|---|---|
| surface-base | #FFFFFF | #0B0D10 |
| surface-raised | #F7F8F9 | #14171B |
| surface-overlay | #FFFFFF (blur) | #1B1F24 (blur) |
| border-subtle | #E5E7EB | #262B31 |
| border-strong | #D1D5DB | #363C44 |
| text-primary | #0B0D10 | #F5F6F7 |
| text-secondary | #4B5563 | #9CA3AF |
| accent | #4F46E5 | #818CF8 |
| success | #16A34A | #4ADE80 |
| warning | #D97706 | #FBBF24 |
| danger | #DC2626 | #F87171 |

Charts in dark mode use desaturated variants of the same accent set to avoid neon glare; contrast ratios must meet WCAG AA (4.5:1 body text, 3:1 large text/icons) in both themes.

### 10.2 Responsive Design

- **Breakpoints:** mobile <640px, tablet 640–1024px, laptop 1024–1440px, desktop >1440px.
- **Navigation:** top nav + sidebar on laptop/desktop; sidebar collapses to a bottom tab bar (Discover, Projects, Messages, Notifications, Profile) on mobile; command palette remains accessible via a floating action button on mobile.
- **Cards/feeds:** multi-column grid on desktop collapses to single-column stacked cards on mobile; filters move from an inline sidebar to a bottom-sheet drawer on mobile/tablet.
- **Forms (project/profile creation):** desktop uses multi-section single page with sticky progress sidebar; mobile uses a step-by-step wizard with a persistent progress bar.
- **Messaging:** desktop shows conversation list + thread side-by-side; mobile shows conversation list OR thread (full-screen), with back navigation.

### 10.3 Accessibility

- All interactive elements reachable and operable via keyboard, with visible focus rings (never `outline: none` without a replacement).
- Semantic HTML (`<button>`, `<nav>`, `<main>`, `<form>` with associated `<label>`s) throughout; ARIA roles only where semantic HTML is insufficient (e.g., command palette, custom dropdowns).
- All form errors are associated with their field via `aria-describedby` and announced to screen readers; error messages are specific ("GitHub URL must start with https://github.com/", not "Invalid input").
- Color is never the sole indicator of status (icons/text accompany all status badges and match-score colors).
- Reduced motion respected platform-wide (§10 above).

---

## 11. Information Architecture

**Public:** Home · Explore Projects · Explore Developers · Project Detail (public view) · Developer Profile (public view) · About · Pricing (future) · Login · Signup

**Authenticated:** Dashboard · Discover (feed) · Projects (mine + browsable) · Applications · Invitations · Messages · Notifications · My Profile · My Projects · Workspace (per project) · Settings

**Admin:** Dashboard · Users · Projects · Reports · Moderation Queue · Skill Taxonomy Manager · Analytics · Settings

Improvement over the original outline: "Explore Developers" and "Explore Projects" are separated from "Discover" (the latter is the *personalized, authenticated* feed; the former are public, SEO-indexable, unauthenticated browse/search pages) — this supports both growth/SEO goals (§26) and personalization goals (§13) without conflating the two experiences.

---

## 12. Feature Specifications

### 12.1 Authentication
- Email/password signup with email verification required before a profile can be published (project creation and applying are blocked until verified; browsing is not).
- OAuth via Google and GitHub (GitHub OAuth doubles as the first step of GitHub account linking, §12.8).
- Forgot password / reset password via time-limited, single-use token (expires in 1 hour).
- Session management: JWT access token (short-lived, ~15 min) + rotating refresh token (long-lived, ~30 days) stored as httpOnly secure cookie; "active sessions/devices" list in Settings with per-session revoke.
- Logout revokes the current refresh token; "log out of all devices" revokes all.
- 2FA (TOTP-based) — **Phase 3**, not MVP.

### 12.2 Developer Profile
Fields: name, username (unique, URL-safe), avatar, short bio (≤280 chars), location (city/country, optional timezone), availability status, experience level, skills (with proficiency), programming languages/frameworks/databases/cloud/tools (all modeled as typed skills, §12.4), GitHub/LinkedIn/portfolio/personal website links, resume file, projects (platform-native + imported GitHub repos), achievements/certifications, education, work experience, preferred project types, preferred collaboration type, profile visibility setting.

**Enumerations:**
- Availability: `available` · `open_to_projects` · `busy` · `not_looking`
- Experience level: `beginner` · `intermediate` · `advanced` · `expert`
- Collaboration preference (multi-select): `short_term` · `long_term` · `open_source` · `startup` · `freelance` · `hackathon` · `learning_project` · `side_project`

### 12.3 Resume Intelligence
- Upload PDF/DOCX resume (max 5MB). Backend extracts text and runs skill/experience extraction (rule-based keyword matching for MVP; LLM-assisted extraction in Phase 2, see §15).
- Extraction produces a **staged draft** (skills, experience entries, education entries) shown to the user in a review screen with per-item accept/reject/edit before anything is written to the live profile. **Nothing is auto-applied.**
- Extracted skills merge into the matching engine's inputs only after user approval.
- Privacy: raw resume file is stored encrypted at rest, never publicly accessible, and visible only to the owner and (temporarily) an applied-to project owner if the developer explicitly attaches it to an application.

### 12.4 Skill System
A standardized, admin-curated taxonomy (categories: Languages, Frameworks, Libraries, Databases, Cloud, DevOps, AI/ML, Mobile, Frontend, Backend, Full-stack, Security, Data, Blockchain, Testing, UI/UX, Other). Each skill has a canonical name, category, and aliases (e.g., "JS" → "JavaScript") for search/extraction matching.

- **UserSkill:** skill + proficiency (`beginner`/`intermediate`/`advanced`/`expert`) + optional years-of-experience + optional endorsement count.
- **ProjectSkill:** skill + requirement type (`required`/`preferred`) + minimum proficiency + notes.
- New skill requests from users go into an admin approval queue rather than being created freely, to keep the taxonomy clean (edge case handling, §27).

### 12.5 Project Creation
Fields: name, description, problem statement, goals, category, technologies, required skills, preferred skills, team size (current/target), required roles (each role = title + required/preferred skills + minimum proficiency + slots), duration estimate, expected weekly commitment, status (`draft`/`open`/`in_progress`/`paused`/`completed`/`archived`), remote/on-site (remote default; on-site is metadata only, no MVP location-matching logic beyond optional timezone overlap), collaboration type, open-source vs private, GitHub repo link, demo/website link, images, tags, application deadline (optional), experience requirement.

Draft projects are not visible to matching/discovery until explicitly published, preventing incomplete listings from polluting recommendations.

### 12.6 Matchmaking Engine
Deterministic, explainable scoring function (not a black box) computed for every (developer, open project) pair where at least one hard filter passes (see below), recomputed on relevant profile/project changes (event-driven, not full recompute sweeps at MVP scale).

**Hard filters (must pass to be considered a candidate match at all):**
- Developer's availability is not `not_looking`.
- Developer possesses every **required** skill at or above its minimum proficiency (configurable per project as strict vs. relaxed — MVP ships strict only).

**Weighted score (0–100), applied to candidates passing hard filters:**

| Factor | Weight | Basis |
|---|---|---|
| Skill match (required + preferred coverage, weighted by proficiency delta) | 40% | Required skills present/exceeded; preferred skills as bonus |
| Experience match | 15% | Developer level vs. project's stated experience requirement |
| Collaboration/project-type match | 15% | Overlap between developer's preferred collaboration types and project's collaboration type |
| Availability match | 10% | `available` scores highest, `open_to_projects` next, `busy` lowest (already filtered out `not_looking`) |
| Technology/domain interest match | 10% | Overlap between developer's preferred project categories/tags and the project's category/tags |
| Profile completeness | 10% | Encourages complete profiles; also a data-quality proxy for match confidence |

Each match stores its **factor breakdown**, not just the final number, so the UI can render a human-readable explanation, e.g.: "92% Match — 7 of 8 required skills, Advanced experience matches the project's requirement, and you're both interested in AI/ML projects." Weights are stored as configuration (not hardcoded) so they can be tuned without a schema change — flagged as a **recommendation, not a fixed decision** (see Open Questions, §34).

### 12.7 Personalized Discovery
Authenticated home feed sections: Recommended Projects, Recommended Developers (owner-side), New Projects Matching Your Skills, People Looking for Your Skills, Recently Posted, Trending (by application velocity), Closing Soon (deadline-based), Saved Projects, Applications, Invitations, Collaboration Activity. Feed ranking blends match score with recency and (Phase 2+) implicit behavioral signals (saves, dwell time, application rate) — MVP uses match score + recency only, explicitly deferring behavioral personalization to avoid over-engineering the MVP.

### 12.8 GitHub Integration
- OAuth connect; import a user-selected subset of repositories to display as portfolio evidence (name, description, primary language, stars, last-updated — pulled at connect time and refreshed on a schedule, not live-polled).
- Contribution graph shown as a portfolio signal only; **never used as a hard filter or hidden scoring input** in the matching engine — this is an explicit product principle from the brief and is treated as a hard constraint, not a style preference.
- Users can disconnect at any time; disconnecting removes displayed repo data but does not delete profile skills that were manually added.

### 12.9 Reputation & Trust
Composed of: profile verification (email + optional GitHub verification badge), completed-project history (count + which projects, self-reported by both parties on project completion), collaboration reviews (structured, two-sided, only unlockable after a project reaches `completed` status — prevents pre-emptive review-bombing), skill endorsements (limited to people who were actual collaborators, not open to anyone), and a reliability score derived from response rate to applications/invitations and completion rate of joined projects. Endorsements and reviews are capped in frequency per relationship to reduce gaming, and the score explicitly **excludes** raw follower-style counts to avoid becoming a popularity contest.

### 12.10 Saving & Bookmarking
Save Projects, Save Developers, Save Searches (with optional alert: notify me when new results match this search). Saved items are private to the user.

### 12.11 Notifications
Categories: Project Matches, Applications, Invitations, Messages, Project Activity, Platform Updates — each independently toggleable per channel (in-app / email / push). Push is web-push (Phase 2+); in-app and email are MVP. Every notification links directly to the relevant object (project, application, conversation).

### 12.12 Search & Discovery
- **Developer search:** filter by skill, experience, location, availability, project interests, technology.
- **Project search:** filter by skill, technology, category, team size, duration, difficulty, availability, project type.
- Both support sort (relevance/match score, recency, popularity), saved searches with alerts, and are backed by PostgreSQL full-text search + trigram similarity at MVP scale (see §16 stack rationale); natural-language search (§15) is Phase 3.

### 12.13 Application System
A developer applies with: short message, the specific skills they're offering, availability, desired role, experience summary, and optional portfolio/GitHub attachment. Owner can review, shortlist, message, accept, reject, or invite.

**Status model:** `applied` → `under_review` → `shortlisted` → (optional `interviewing`) → `accepted` | `rejected`; a developer may `withdraw` from any pre-terminal state. Each transition fires a notification to the affected party and is recorded in an audit trail visible to both participants (not just internally).

### 12.14 Invitation System
Owner invites a specific developer, with the invite auto-populated with the match score and the specific reason/required skills that triggered the recommendation. Developer can accept, decline, ask a question (opens a message thread without committing), or view the full project first. Accepting an invitation performs the same state transition as an accepted application.

### 12.15 Messaging
One-to-one messaging plus per-project team chat. Unread counts, timestamps, delivery/read status, typing indicator (Phase 2 — requires realtime infra, see §16), basic file/link attachments, and a report/block action on any conversation. Architecture built on a `Conversation`/`Message` model that supports both DM and group-chat shapes from day one, so team chat doesn't require a data-model migration later.

### 12.16 Project Workspace
Sections: Overview, Team, Tasks (simple kanban: `todo`/`in_progress`/`done`), Roadmap (milestone list with target dates), Chat (reuses §12.15), Files/Links (URL + label list; no file hosting at MVP — links to GitHub/Drive/etc.), linked Repository (pulled from GitHub integration if connected), and an Activity Feed (auto-generated from membership changes, task updates, and milestone completions). Explicitly scoped as a lightweight coordination layer, not a Jira/Linear replacement — deep task management (subtasks, sprints, custom workflows) is out of scope.

---

## 13. Data Model

Core entities, key fields, and relationships. Full column-level DDL is an implementation detail for the coding agent to derive from this model plus §16 ORM choice; this section defines the required shape and constraints.

| Entity | Key Fields | Relationships | Notes |
|---|---|---|---|
| **User** | id, email (unique), password_hash (nullable if OAuth-only), auth_provider, email_verified_at, created_at, status (`active`/`suspended`/`deleted`) | 1–1 Profile; 1–many Project (as owner) | Auth root; PII lives here, not on Profile |
| **Profile** | user_id (FK), username (unique), display_name, avatar_url, bio, location, timezone, availability, experience_level, preferred_collaboration (array), profile_visibility | 1–many UserSkill, Experience, Education; 1–1 Resume | Public-facing surface |
| **Skill** | id, name, category, aliases (array), status (`approved`/`pending`) | many–many via UserSkill/ProjectSkill | Curated taxonomy |
| **UserSkill** | user_id, skill_id, proficiency, years_experience, endorsement_count | belongs to Profile + Skill | Composite unique (user_id, skill_id) |
| **Resume** | id, user_id, file_url (encrypted), parsed_at, status | 1–1 Profile | Raw file private by default |
| **Experience** | id, user_id, title, company, start_date, end_date, description | belongs to Profile | |
| **Education** | id, user_id, institution, degree, field, start_date, end_date | belongs to Profile | |
| **Project** | id, owner_id (FK User), name, description, problem_statement, goals, category, status, team_size_current, team_size_target, duration_estimate, weekly_commitment, remote_flag, collaboration_type, visibility (`open_source`/`private`), repo_url, demo_url, tags (array), deadline, experience_requirement, created_at | 1–many ProjectSkill, ProjectRole, ProjectMember, Application, Invitation | |
| **ProjectSkill** | project_id, skill_id, requirement_type, min_proficiency | belongs to Project + Skill | |
| **ProjectRole** | id, project_id, title, slots_available, required_skills (via ProjectSkill scoped to role, or a join table `ProjectRoleSkill`) | belongs to Project | |
| **ProjectMember** | id, project_id, user_id, role_id (nullable), joined_at, left_at (nullable), status (`active`/`left`/`removed`) | belongs to Project + User | Distinct from Application — created on acceptance |
| **Application** | id, project_id, user_id, role_id (nullable), message, status, created_at, updated_at | belongs to Project + User | Unique (project_id, user_id) while status not terminal, preventing duplicates |
| **Invitation** | id, project_id, invited_user_id, invited_by_user_id, match_score_snapshot, reason_snapshot, status, created_at | belongs to Project + User | |
| **Match** | id, user_id, project_id, score, factor_breakdown (JSON), computed_at | belongs to User + Project | Recomputed, not appended-forever; latest per pair is authoritative |
| **Recommendation** | id, user_id, target_type (`project`/`developer`), target_id, surfaced_at, dismissed_at | derived from Match | Tracks what was actually shown, for feedback-loop analytics |
| **Conversation** | id, type (`dm`/`project`), project_id (nullable) | many–many Users via ConversationParticipant | |
| **Message** | id, conversation_id, sender_id, body, attachment_url (nullable), created_at, read_at (nullable per-participant via a join table) | belongs to Conversation | |
| **Notification** | id, user_id, type, payload (JSON), read_at, created_at | belongs to User | |
| **SavedProject / SavedDeveloper** | user_id, target_id, created_at | join tables | |
| **SavedSearch** | id, user_id, query_params (JSON), alert_enabled | belongs to User | |
| **Review** | id, project_id, reviewer_id, reviewee_id, rating, comment, created_at | belongs to Project; only creatable when project.status = completed | Two-sided, capped at one per relationship per project |
| **Report** | id, reporter_id, target_type, target_id, reason, status, created_at | belongs to User | Feeds Moderation Queue |
| **AdminAction** | id, admin_id, action_type, target_type, target_id, notes, created_at | audit trail | Immutable, append-only |
| **AuditLog** | id, actor_id, action, entity_type, entity_id, metadata (JSON), created_at | system-wide | Append-only; covers auth events, status transitions, admin actions |

**Indexing/constraints highlights:** unique index on `username` and `email`; composite index on `(project_id, status)` for Application and Invitation queries; GIN index on `tags` and full-text search columns for Project/Profile search; foreign keys with `ON DELETE` policies favoring soft-delete/status flags over hard deletes for anything with audit or trust implications (Users, Projects, Reviews).

**Entities added beyond the original brief's list (identified gaps):** `ProjectRole` and `ProjectMember` were missing distinctions in the original outline (it only listed `ProjectMember`) — the platform needs both a *role definition* (what's needed) and a *membership record* (who filled it). `Recommendation` was separated from `Match` because "what the score is" and "what was actually shown to the user" are different concerns needed for feedback-loop analytics (§25). `AdminAction` was separated from the generic `AuditLog` to keep moderation-specific accountability queryable on its own.

---

## 14. API Requirements (representative endpoints per group; full CRUD implied for each resource)

| Group | Method & Route | Purpose | Auth |
|---|---|---|---|
| Auth | `POST /auth/signup` | Create account, send verification email | Public |
| Auth | `POST /auth/login` | Issue access/refresh tokens | Public |
| Auth | `POST /auth/oauth/{provider}/callback` | Complete Google/GitHub OAuth | Public |
| Auth | `POST /auth/forgot-password` / `POST /auth/reset-password` | Password recovery | Public |
| Auth | `POST /auth/logout` | Revoke session | User |
| Profiles | `GET /profiles/{username}` | Public profile view | Public |
| Profiles | `PATCH /profiles/me` | Update own profile | User |
| Skills | `GET /skills?query=` | Search taxonomy (autocomplete) | Public |
| Skills | `POST /skills/requests` | Request a new taxonomy skill | User |
| Resume | `POST /resume` | Upload resume, trigger parsing job | User |
| Resume | `GET /resume/extraction/{id}` / `POST /resume/extraction/{id}/apply` | Review and approve extracted data | User |
| Projects | `POST /projects` / `GET /projects/{id}` / `PATCH /projects/{id}` | CRUD | User (owner for write) |
| Projects | `POST /projects/{id}/publish` | Publish draft, trigger matching | Owner |
| Applications | `POST /projects/{id}/applications` | Apply to project | User |
| Applications | `PATCH /applications/{id}` | Transition status (owner action) | Owner |
| Invitations | `POST /projects/{id}/invitations` | Invite a developer | Owner |
| Invitations | `PATCH /invitations/{id}` | Accept/decline | Invited user |
| Matches | `GET /matches/projects` / `GET /matches/developers/{project_id}` | Ranked candidates | User / Owner |
| Notifications | `GET /notifications` / `PATCH /notifications/{id}/read` | Read/manage | User |
| Messaging | `GET /conversations` / `POST /conversations/{id}/messages` | Messaging | Participant |
| Search | `GET /search/projects` / `GET /search/developers` | Faceted search | Public/User |
| Saved | `POST /saved/projects` etc. | Bookmarking | User |
| Reviews | `POST /projects/{id}/reviews` | Post-completion review | Member (completed project only) |
| Reports | `POST /reports` | File a report | User |
| Admin | `GET /admin/reports` / `PATCH /admin/reports/{id}` | Moderation queue | Admin |
| Admin | `PATCH /admin/users/{id}/suspend` | Suspend user | Admin |

Standard conventions: JSON request/response, pagination via cursor (`?cursor=&limit=`), consistent error envelope `{ "error": { "code", "message", "field_errors" } }`, and idempotency keys required on all state-mutating POSTs that could be double-submitted (apply, invite, review).

---

## 15. AI Features (where AI adds value, and where it must stay assistive rather than authoritative)

- **Resume/skill extraction:** MVP uses deterministic keyword/alias matching against the skill taxonomy; Phase 2 upgrades to LLM-assisted extraction for higher recall (e.g., inferring "built REST APIs for a fintech client" → `REST APIs`, `Backend`). Always staged for user approval (§12.3) — never auto-applied.
- **Natural-language project search** ("I need someone who can build the backend for my AI SaaS" → suggested skills: Python, FastAPI, Django, Node.js, PostgreSQL, APIs, cloud): Phase 3, implemented as a query-expansion layer in front of the existing structured search/matching, not a replacement for the deterministic matching engine.
- **Match explanations:** generated from the deterministic factor breakdown (§12.6) via templated natural-language rendering — not model-generated free text, to guarantee the explanation is always accurate to the actual score.
- **Duplicate project / spam detection:** similarity + heuristic checks (Phase 2) flagging likely duplicates or spam for admin review — never auto-deletes.

**Principle enforced throughout:** AI assists discovery and data entry; it never single-handedly makes an accept/reject/suspend decision. All AI-influenced decisions with user-facing consequences (matching, extraction, spam flags) remain human-reviewable and explainable.

---

## 16. Technology Stack & Rationale

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js + React + TypeScript | Server-side rendering for public/SEO pages (§20) plus a modern SPA-like experience for authenticated app; TypeScript for type-safe API contracts with the shared data model. |
| Styling | Tailwind CSS + a small custom design-token layer | Fast, consistent implementation of the design system (§10) without fighting a heavy component library's defaults. |
| Animation | Framer Motion | Declarative, respects `prefers-reduced-motion` easily, integrates cleanly with React. |
| Backend | Next.js API routes / route handlers (or a separate Node.js service if team scale demands it later) | Keeps one language/type system across the stack for an MVP team; can be split into a dedicated service later without a rewrite since the data model and API contract are already decoupled. |
| Database | PostgreSQL | Relational integrity is essential (applications, memberships, skills are highly relational); native full-text + trigram search covers MVP search needs without a separate search service. |
| ORM | Prisma | Type-safe queries matching the TypeScript stack; migrations are explicit and reviewable, which matters for an AI coding agent generating schema changes. |
| Auth | NextAuth.js (or equivalent) for OAuth + custom email/password flow | Battle-tested OAuth handling for Google/GitHub; custom flow needed anyway for email/password + verification, so a hybrid is more practical than forcing everything through one library. |
| Object storage | S3-compatible bucket (e.g., AWS S3 or Cloudflare R2) | Resume files, avatars; encrypted at rest, private by default with signed URLs. |
| Realtime | WebSockets via a managed service (e.g., Pusher/Ably) or Socket.io on a dedicated node — introduced at Phase 2 for typing indicators/live message delivery | Avoids building custom realtime infra before it's needed; MVP messaging can work via polling/optimistic UI. |
| Deployment | Vercel (frontend/API) + managed Postgres (e.g., Supabase/Neon/RDS) | Fits the Next.js stack natively; managed Postgres removes ops burden at MVP scale. |
| Monitoring | Sentry (errors) + a product analytics tool (e.g., PostHog) + platform logs | Error visibility and product metrics (§25) from day one, without building custom analytics infra. |

This stack is chosen for team-size-one-to-few AI-assisted development velocity; it is explicitly **not** over-engineered with microservices, message queues, or a dedicated search cluster at MVP scale — those are called out as Phase 2/3 additions if usage demands them (§30).

---

## 17. Notifications, Messaging, Admin & Moderation, Security & Privacy, Performance, Accessibility, SEO, Analytics, Email

These cross-cutting areas are specified inline above (§10.3 Accessibility; §12.11 Notifications; §12.15 Messaging) plus the following:

### 17.1 Admin & Moderation
Admin capabilities: view/search users, suspend/delete users, review reports, moderate projects/profiles (hide/unpublish pending review), manage the skill taxonomy (approve/reject/merge requested skills), review flagged messages, view platform analytics, manage platform-wide settings (e.g., match threshold defaults). Role-based access control with at least `admin` and `moderator` roles (moderator: reports/content only; admin: full access including user deletion and settings).

**Reporting flow:** user reports a target (user/project/message) with a reason category → enters Moderation Queue (`open`) → admin reviews → resolves (`actioned`/`dismissed`) with notes → reporter is notified of resolution (without necessarily disclosing the action taken against the reported party, to avoid retaliation).

### 17.2 Security & Privacy
Bcrypt/argon2 password hashing; RBAC enforced at the API layer (not just UI-hidden); rate limiting on auth and application/invitation endpoints; strict input validation and output encoding (XSS prevention); CSRF protection on cookie-based session mutations; parameterized queries via Prisma (injection prevention by construction); file upload validation (type/size/virus-scan hook); secrets in environment/secret-manager, never in code; resumes and private profile fields never exposed via public endpoints; account deletion is a genuine data-erasure flow (with a grace period) distinct from suspension; users can export their own data (GDPR-style data portability); all auth events, admin actions, and status transitions are audit-logged.

### 17.3 Performance
Fast initial load via SSR/static generation for public pages; image optimization (Next.js Image, responsive sizes); lazy-loading below the fold; cursor-based pagination/infinite scroll on feeds; caching of computed match scores (invalidated on relevant profile/project change, not recomputed per request); database indexes per §13; API p95 target <300ms for read endpoints at MVP scale; search debounced client-side.

### 17.4 SEO
Indexable: public developer profiles, public projects, skill pages, category pages. Metadata + Open Graph tags per page type; JSON-LD structured data for profiles/projects where applicable; sitemap.xml generated from published/public entities; robots.txt disallowing all authenticated routes (`/dashboard`, `/settings`, etc.); canonical URLs on any content reachable via multiple query-param variants.

### 17.5 Analytics
User-facing: profile completion, match rate. Product/admin-facing: registered users, active developers (rolling 30-day), active projects, project creation rate, application rate, match-to-application conversion, acceptance rate, time-to-first-match, retention (D7/D30), profile completion distribution, project completion rate, notification engagement (open/click rate per category).

### 17.6 Email
Transactional: verification, password reset, application received/accepted/rejected, invitation received, new strong match, project update, security alert (new device login). Digest: weekly "new matches for you" summary (opt-out respecting notification settings, §12.11).

---

## 18. Testing Strategy

- **Unit tests** on matching-score calculation, skill-taxonomy alias resolution, and status-transition state machines (Application/Invitation) — these are the highest-risk logic and must be deterministic and covered.
- **Integration/API tests** for every endpoint group in §14, including auth/permission edge cases (e.g., a non-owner attempting to accept an application must receive 403).
- **E2E tests required for these critical flows:** signup → email verify → onboarding → profile creation; project creation → publish → developer receives recommendation; apply → owner accepts → workspace created for both parties; invitation → accept → same workspace outcome; report → admin resolves.
- **Accessibility tests:** automated axe-core checks in CI on key pages, plus manual keyboard-navigation pass before each release.
- **Responsive tests:** visual regression snapshots at each breakpoint for feed, profile, project detail, and dashboard pages.
- **Performance tests:** load test on the matching recompute path and the feed query, since these are the most write/read-heavy paths at scale.

---

## 19. Edge Cases & Expected Behavior

| Edge Case | Expected Behavior |
|---|---|
| User applies to their own project | Blocked at the API layer with a clear error; UI hides the Apply button on own projects. |
| Project already full (team_size_current = target) | New applications still allowed (owner may want a backup pipeline) but UI shows a "Team is currently full" notice on the project page. |
| Required skill removed from project after applications exist | Existing applications are unaffected (evaluated against the snapshot at apply time is not required, but re-matching only affects future candidates); owner sees a warning that removing a required skill will change future recommendations. |
| User changes skills after applying | Application unaffected; Match score for future recommendations recalculates on next relevant event. |
| Owner deletes project | Soft-delete (status → archived); existing members retain workspace read-access for a grace period; open applications/invitations are auto-withdrawn with notification. |
| Developer leaves project | ProjectMember.status → `left`; workspace access revoked after a grace period; project history retains the collaboration record for both parties' profiles. |
| Project owner becomes inactive (no login for X days) | Flagged internally; open applications older than a threshold show applicants a "No response in X days" indicator rather than leaving them silently pending. |
| Duplicate applications | Prevented by a unique constraint on (project_id, user_id) while non-terminal; re-applying after withdrawal/rejection is allowed. |
| Duplicate projects | Phase 2 similarity check flags likely duplicates for admin review; not auto-blocked at MVP. |
| Spam / fake accounts | Rate limiting on project/application creation per new account; email verification gate; admin suspension flow. |
| Resume parsing errors | Extraction job fails gracefully, user is notified and can fill fields manually; failure never blocks account usage. |
| Match score changes after profile edits | Recomputed asynchronously; UI shows the last-computed score with a timestamp, not a stale silent number. |
| User blocks another user | Blocked user's messages/applications/invitations to the blocker are hidden from the blocker; existing workspace membership is unaffected by a block (block ≠ project removal). |
| User deletes account | Soft-delete with grace period, then hard-delete of PII; retained project history is anonymized ("a former collaborator") rather than fully deleted, to preserve other members' project records. |
| Notification delivery failure (email bounce, push failure) | Logged and surfaced in-app regardless (in-app notification is the source of truth; email/push are best-effort supplements). |

---

## 20. Product Safety & Trust

Abuse scenarios and mitigations: spam/scam projects (rate limits + report flow + Phase 2 duplicate/spam detection), malicious links in messages/projects (basic URL scanning against known-bad-domain lists, Phase 2), harassment (block + report + admin suspension), scraping (rate limiting + auth-gating of full profile/project data, public pages show a reduced data set), fake skills (endorsements restricted to actual collaborators, GitHub verification as a corroborating signal), impersonation (username uniqueness + optional verification badge + report flow for impersonation claims).

---

## 21. Non-Functional Requirements

Security, scalability, maintainability, reliability, accessibility, and performance requirements are specified in their dedicated sections above (§17.2–17.3, §10.3). Additionally: **observability** — structured logging + error tracking (Sentry) + uptime monitoring from MVP launch, not deferred. **Internationalization readiness** — all user-facing strings pass through a translation-ready layer (e.g., i18n keys) even though only English ships at MVP, to avoid a costly retrofit. **Mobile support** — full responsive web experience at MVP; native apps are explicitly out of scope until product-market fit is established (§31).

---

## 22. Development Milestones

| Milestone | Objectives | Key Deliverables |
|---|---|---|
| M1 — Foundations | Project setup, design system, CI/CD | Repo scaffold, design tokens, component library shell, deploy pipeline |
| M2 — Authentication | Full auth flow | Signup/login/OAuth/verification/reset, session management |
| M3 — Profile & Skills | Developer identity | Profile CRUD, skill taxonomy, UserSkill, resume upload + staged extraction |
| M4 — Project Creation | Owner-side core | Project CRUD, ProjectSkill/Role, draft/publish flow |
| M5 — Discovery | Browse/search | Public explore pages, authenticated feed (recency-based initially) |
| M6 — Matching Engine | Core differentiator | Deterministic scoring, factor breakdown storage, match-driven feed ranking, explanations |
| M7 — Applications & Invitations | Core loop closes | Full status state machines, notifications on transitions |
| M8 — Notifications | Engagement layer | In-app + email, per-category settings |
| M9 — Messaging | Communication | DM + project chat, unread counts |
| M10 — Workspace | Post-match collaboration | Overview/Team/Tasks/Roadmap/Chat/Files/Activity feed |
| M11 — Admin & Moderation | Trust & safety | Admin panel, reports queue, RBAC |
| M12 — Hardening | Production readiness | Security review, performance pass, accessibility audit, full E2E suite |

Each milestone's acceptance criteria are the corresponding items in §23; dependencies flow linearly (M6 depends on M3+M4; M7 depends on M6; M9 depends on M7 for project-scoped chat; M10 depends on M7).

---

## 23. Acceptance Criteria (representative set; full set derives from every functional requirement above)

- **Given** a developer has Python in their profile at Intermediate proficiency, **when** a project requiring Python at Intermediate or below is published, **then** the project appears in the developer's recommendations with a factor breakdown citing the Python match.
- **Given** a project owner receives an application, **when** they change its status to `accepted`, **then** a ProjectMember record is created, the applicant is notified, and both parties gain access to the project's workspace.
- **Given** an unverified email account, **when** the user attempts to publish a project, **then** the action is blocked with a message directing them to verify their email.
- **Given** a user uploads a resume, **when** extraction completes, **then** no profile field changes until the user explicitly approves the extracted data on the review screen.
- **Given** a project reaches `completed` status, **when** either member submits a review, **then** the review is only visible once both sides have submitted or a review-window has elapsed (preventing one-sided pressure), per the two-sided review design in §12.9.
- **Given** an admin suspends a user, **when** the suspension is applied, **then** the user cannot log in, their open projects are hidden from discovery, and an AuditLog entry is created.

---

## 24. Freemium / Monetization (future consideration, not MVP focus)

Potential future models: premium profiles (enhanced visibility, priority discovery), advanced matching filters, recruiter/organization plans, featured project placement, analytics add-ons. Explicitly deferred past MVP to keep focus on validating the core matchmaking loop before introducing monetization friction.

---

## 25. Recommendation System

Inputs: computed Match scores, explicit saves/dismissals, (Phase 2+) implicit engagement signals. Ranking at MVP is match score + recency; cold-start (new user with an incomplete profile) falls back to recency + broad category match and prompts profile completion rather than showing a low-confidence personalized ranking. Feedback loop: dismissed recommendations are recorded (via the `Recommendation` entity, §13) and, from Phase 2 onward, down-weight similar future recommendations. Explainability is preserved at every stage — no factor is used in ranking that can't also be shown to the user.

---

## 26. MVP Scope, Phase 2, and Phase 3

### Phase 1 — MVP (validates the core matchmaking loop)
Authentication (email/password + Google + GitHub, no 2FA), Developer Profile + Skill System, Resume upload with manual-review extraction, Project Creation, deterministic Matchmaking Engine with explanations, Personalized Discovery (recency + score, no behavioral personalization), core Notifications (in-app + email only), basic Search (structured filters, no NL search), Application + Invitation system with full status model, one-to-one + project Messaging (polling-based, no typing indicators), lightweight Project Workspace, GitHub integration (portfolio display only), basic Reputation (verification + completed-project history + reviews), Saving/Bookmarking, Admin panel with reports/moderation/RBAC, core Security/Privacy/Performance/Accessibility/SEO requirements as specified.

### Phase 2 — Growth
Realtime messaging (typing indicators, push notifications), LLM-assisted resume/skill extraction, behavioral personalization in the feed, duplicate-project/spam detection, saved-search alerts, endorsement/review refinements, command palette, follow/connect social features if validated as improving the core loop (not added by default).

### Phase 3 — Advanced
Organization/recruiter accounts, natural-language project search, AI project-brief generation, skill-gap analysis, smart team balancing, monetization features (§24), 2FA, advanced analytics dashboards, and the broader ambitious future-features list (co-pilot, hackathon mode, calendar integration, expanded integrations).

**Rationale:** every MVP item is required for at least one side of the core loop (create project → get matched → apply/invite → accept → collaborate) or for baseline trust/safety without which the loop can't be trusted. Everything deferred either amplifies an already-working loop (Phase 2) or depends on scale/validation the MVP hasn't yet produced (Phase 3).

---

## 27. Open Questions

1. Should the matching engine's hard-filter strictness (must-have-all-required-skills) be relaxed to a "near match" tier at MVP, or strictly enforced as specified in §12.6? *(Recommendation: strict at MVP for trust; revisit once real match volume data exists.)*
2. Should organizations be pulled into MVP scope given persona D's inclusion in the brief, or held to Phase 3 as this document recommends? *(Recommendation: Phase 3 — including it at MVP risks diluting the core individual-developer loop.)*
3. What is the right default match-score threshold for proactive recommendation surfacing (this document assumes 75%)? *(Recommendation: ship configurable, tune post-launch with real data.)*
4. Should on-site/location-based matching do anything beyond metadata display at MVP (e.g., real distance/timezone-overlap scoring)? *(Recommendation: metadata-only at MVP; the brief's own matching model already treats it as a minor factor.)*

---

## 28. Architectural Recommendations Summary

Keep the MVP a single well-typed Next.js + Postgres + Prisma application; avoid microservices, a dedicated search cluster, or a message queue until usage data justifies them. Treat the matching engine as a deterministic, explainable, versioned scoring function from day one — this is the product's core differentiator and the hardest thing to retrofit trust into later. Model Application/Invitation as parallel paths into one shared status/membership outcome so the workspace and reputation systems don't need to special-case how a match originated.

---

## PRODUCT DECISIONS THAT NEED YOUR APPROVAL

1. **Matching strictness (§12.6, §27.1):** Ship with strict hard-filters (all required skills must be met) at MVP, or allow a "near match" relaxed tier from day one?
2. **Organization/Recruiter persona timing (§27.2):** Confirm Phase 3 placement, or pull into MVP?
3. **Match-score recommendation threshold (§27.3):** Confirm the default 75% proactive-surfacing threshold, or set a different starting value?
4. **Resume extraction method at MVP (§12.3, §15):** Confirm rule-based/keyword extraction for MVP (cheaper, fully deterministic) versus starting directly with LLM-assisted extraction (higher recall, added cost/latency, less deterministic).
5. **Realtime messaging timing (§12.15, §16):** Confirm polling-based messaging is acceptable for MVP, with true realtime (typing indicators, instant delivery) deferred to Phase 2.

---

## RECOMMENDED MVP

Build exactly the Phase 1 scope in §26: authentication (email/password + Google/GitHub), developer profiles with the skill system, manually-reviewed resume extraction, project creation, the deterministic and explainable matchmaking engine, a recency+score personalized feed, structured search, the full application/invitation state machine, in-app + email notifications, one-to-one and project messaging (polling-based), a lightweight project workspace, GitHub portfolio display, baseline reputation (verification, completed-project history, two-sided post-completion reviews), saving/bookmarking, and an admin panel with reporting/moderation and RBAC — built on the security, performance, accessibility, and SEO baselines specified throughout this document. This is the minimum system that lets a real project owner and a real developer complete the full loop — create, match, apply or invite, accept, and start collaborating — with enough trust and polish to be credible as a premium product, not a prototype.

---

## NEXT STEP FOR THE CODING AGENT

1. Start with **M1 (Foundations)**: scaffold the Next.js + TypeScript + Tailwind + Prisma + PostgreSQL project, set up the design tokens from §10/§10.1, and stand up CI/CD before writing feature code.
2. Implement the **data model in §13** as the Prisma schema first — every subsequent feature depends on it, and getting entity relationships right early avoids costly migrations later.
3. Build milestones **in the order listed in §22** (M2 → M12); each milestone's acceptance criteria in §23 (and the fuller set implied by every "Given/When/Then"-testable requirement in §12) define "done" for that milestone — do not proceed to the next milestone until the current one's criteria pass.
4. Treat **§12.6 (Matchmaking Engine)** as the most architecturally important feature: implement it as an isolated, unit-tested, versioned scoring module with a stored factor breakdown, since the UI (§12.6 explanation text), recommendations (§25), and reputation (§12.9) all depend on its output being transparent and stable.
5. Do not implement anything listed under **Phase 2 or Phase 3 (§26)** until the full Phase 1 (MVP) scope is complete and the open questions in §27 have been resolved by the product owner — resolve the five items in **PRODUCT DECISIONS THAT NEED YOUR APPROVAL** before or during M6/M7, since they materially affect the matching and application logic.

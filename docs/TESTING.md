# CodeSync Testing & Observability Guide

## 1. Unit & Integration Tests
Run the Vitest suite:
\`\`\`bash
corepack pnpm test
\`\`\`
*Required Env Vars:* Mocked Prisma is used for unit tests. For integration tests, a running PostgreSQL database is needed via \`DATABASE_URL\`.

## 2. Playwright E2E & Accessibility
Run the E2E suite and automated axe-core accessibility checks:
\`\`\`bash
npx playwright test
\`\`\`
*Required Env Vars:* A real running server on \`http://localhost:3000\`, a database at \`DATABASE_URL\`, and \`NEXTAUTH_SECRET\`.

## 3. Performance & Load Testing
Run the Artillery load test against local discovery endpoints:
\`\`\`bash
npx artillery run scripts/load-test.yml
\`\`\`

## 4. Observability (Sentry)
Sentry is instrumented in \`next.config.js\` and initialized across client/server/edge.
*Required Env Vars:* \`SENTRY_DSN\`
Errors boundary fallbacks are deployed via \`app/error.tsx\` and \`app/global-error.tsx\`. No sensitive data or PII is leaked to Sentry.

## 5. Explicit Architectural Exceptions
* **i18n Readiness:** Per SRS §21, internationalization was scheduled for MVP. However, introducing a repository-wide i18n abstraction during the M12 Hardening phase presented severe regression risk. **i18n has been formally deferred to Phase 2.**

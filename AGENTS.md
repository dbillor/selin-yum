# Repository Guidelines

## Project Structure & Module Organization
- `src/` — app code: `components/` (UI), `pages/` (routes), `styles/` (Tailwind CSS), `utils.ts` (helpers), `types.ts` (shared types), `db.ts` (Dexie/IndexedDB), `App.tsx`, `main.tsx`.
- `public/` — PWA assets: `sw.js` (service worker), `manifest.webmanifest`, icons/.
- Root config: `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`, `index.html`.
- Import alias: `@/*` → `src/*`.

## Build, Test, and Development Commands
- `npm install` — install dependencies (Node 18+ recommended).
- `npm run dev` — Vite dev server with HMR.
- `npm run build` — type‑check then build (`tsc -b && vite build`).
- `npm run preview` — serve the production build locally.

## Coding Style & Naming Conventions
- TypeScript strict mode; prefer explicit types at public boundaries.
- Indentation: 2 spaces; keep line length reasonable (~100–120).
- React components: PascalCase (`Header.tsx`, `GrowthPage.tsx`).
- Variables/functions: camelCase; constants UPPER_SNAKE_CASE as needed.
- File types: components/pages `*.tsx`; utilities/types `*.ts`; styles in `src/styles/*.css`.
- Tailwind for layout/spacing; extract reusable UI into `components/`.
- Follow existing file’s semicolon/quote style; do not reformat whole files unnecessarily.

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Name tests `*.test.ts`/`*.test.tsx` colocated near sources or under `src/__tests__/`.
- Focus on pure logic in `utils.ts` and DB behaviors in `db.ts`; mock Dexie where practical.
- Example (once configured): `npx vitest --run`.

## Commit & Pull Request Guidelines
- Use focused commits; message style: Conventional Commits (e.g., `feat: add diaper targets pill`).
- PRs should include: concise description, rationale, before/after screenshots for UI, steps to test, and any schema/cache changes.
- Keep diffs small and single‑purpose; update docs/README when behavior changes.
- Verify: `npm run build` passes, app loads with no console errors, offline still works (service worker).

## Security & Configuration Tips
- App is client‑only; do not add secrets or tokens.
- When changing cached assets, bump `CACHE_NAME` in `public/sw.js` and validate update flow.
- For Dexie migrations, increment `version(...)` in `db.ts` and provide store upgrades.

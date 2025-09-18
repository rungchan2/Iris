# Repository Guidelines

## Project Structure & Module Organization
- App (Next.js App Router): `app/` (routes, layouts, API handlers under `app/api`).
- UI & features: `components/` (kebab-case filenames, PascalCase component names).
- Domain logic & utilities: `lib/` (e.g., `lib/actions/*`, `lib/supabase/*`, `lib/matching.ts`).
- Types: `types/` (generated `database.types.ts`, app-specific `*.types.ts`).
- Static assets: `public/`.
- Docs & specs: `docs/`, `specs/`.
- SQL and migrations helpers: `sql/`, `scripts/*.sql`.

## Build, Test, and Development Commands
- `npm run dev` — Run local dev server (Turbopack).
- `npm run build` — Production build.
- `npm start` — Start built app.
- `npm run lint` — ESLint (Next + Tailwind rules).
- `npm run update-type` — Generate Supabase types to `types/database.types.ts` (requires Supabase CLI and linked project).

## Coding Style & Naming Conventions
- Language: TypeScript (strict where possible). Indent 2 spaces.
- Components: PascalCase exports; files kebab-case (e.g., `login-form.tsx`).
- Routes: lowercase/hyphenated directories in `app/`.
- Modules: colocate feature code under `components/<feature>/` and logic in `lib/`.
- Linting: `eslint.config.mjs` (Next Core Web Vitals, TS, Tailwind plugin). Fix or disable with justification.
- Styling: Tailwind CSS v4 via PostCSS; prefer utility classes over ad‑hoc CSS.

## Testing Guidelines
- No formal test runner configured yet. At minimum: run `npm run lint` and ensure a clean `npm run build`.
- For new features/bug fixes, add lightweight tests if introducing a test runner (Vitest/Playwright) and place under `__tests__/` or `e2e/` accordingly. Document how to run them in PR.
- Provide manual QA steps for core flows (auth, matching, payment, booking) in the PR description.

## Commit & Pull Request Guidelines
- Prefer Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`. Keep scope concise (e.g., `feat(matching): add score weights`).
- Write clear, imperative messages (English preferred; Korean acceptable when precise).
- PRs: include summary, linked issue, screenshots for UI, migration notes for SQL/Supabase, and any env changes. Ensure `npm run build` and `npm run lint` pass.

## Security & Configuration Tips
- Do not commit secrets. Use `.env.local` for local dev (see `README.md` for required vars).
- Regenerate Supabase types after schema changes: `npm run update-type`.

## Agent-Specific Instructions
- Make minimal, scoped changes; avoid unrelated refactors.
- Follow structure above and keep edits within relevant folders.
- Update docs in `docs/` or `specs/` when behavior or schema changes.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Dream Jewels — a Vite + React 18 + TypeScript SPA with a role-based dashboard (super-admin / admin / designer / customer) plus a legacy Figma-generated marketing landing page. Built from a Figma Make export (`@figma/my-make-file` in package.json) using pnpm/npm.

## Commands

```
npm i              # install deps
npm run dev         # start dev server on http://localhost:5173/
npm run build       # production build (vite build)
```

There is no lint script, no test framework, and no `tsconfig.json` — type errors are not checked at build time (Vite/esbuild only transpiles). Verification is manual: use the `verify` skill (`.claude/skills/verify/SKILL.md`) to drive the app in a browser via `playwright-core` + system Edge (`channel: "msedge"`), since there's nothing to run headlessly otherwise.

## Architecture

### Two apps living in one repo

- **`src/routes/AppRouter.tsx`** (entry via `src/main.tsx`) is the real, active application: a `react-router` `BrowserRouter` with role-gated dashboard routes. `/` currently redirects straight to `/login` — there is no route wired up for the landing page.
- **`src/app/`** is the original Figma-generated marketing landing page (`App.tsx` + `components/sections/*`: Navbar, Hero, Collections, DiamondShowcase, Heritage, Occasions, Testimonials, Bespoke, Contact, Footer). It is not mounted by the router, but its **shadcn/radix UI kit at `src/app/components/ui/`** (48 components) is still the shared component library — e.g. `src/pages/customer/MyProductsPage.tsx` imports `dialog` from there. There is no separate `src/components/ui/`, so when a page needs a base UI primitive (dialog, select, tabs, etc.), pull it from `src/app/components/ui/`, don't create a parallel one.
- `src/layouts/PublicLayout.tsx` exists to wrap the landing page but isn't referenced by `AppRouter` — treat the marketing site as effectively orphaned/legacy unless a task specifically asks to revive it.

### Routing & access control

`AppRouter` nests layouts as: `AppLayout` (provides `AuthProvider` + `ChatNotificationProvider` to everything) → `ProtectedRoute` (redirects to `/login` if unauthenticated, preserves `state.from`) → `DashboardLayout` (sidebar + header shell) → `RoleRoute allowedRoles={[...]}` (redirects to `/unauthorized` if the user's role isn't allowed). Each of the four roles has its own route subtree under `/dashboard/<role>/...` and its own page directory (`src/pages/{super-admin,admin,designer,customer}/`). When adding a page for a role, add both the page file and its `<Route>` entry inside the matching `<RoleRoute>` block in `AppRouter.tsx`.

Roles are the single source of truth in `src/types/role.types.ts` (`UserRole`, `USER_ROLES`) and `src/constants/roles.ts` (labels/colors per role, `ALL_ROLES`). `useRole()` (`src/hooks/useRole.ts`) exposes `hasAnyRole()`, used by `RoleRoute`.

### Auth

Auth is currently **mocked**: `src/services/auth.service.ts` checks credentials against `src/data/mock-users.ts` and persists the session via `src/utils/session.ts` (SessionStorage) — there's a deliberate ~600ms artificial delay to simulate a network call. The file's own comment says the intent is to swap the function bodies for real backend calls later while keeping the same signatures (`authLogin`, `authLogout`, `authGetCurrentUser`) so no UI changes are needed. `AuthContext`/`AuthProvider` (`src/context/AuthContext.tsx`) wraps this service and is the only thing pages/components should consume (`useAuth()` hook), not the service directly.

Note: `src/services/firebase.ts` initializes Firebase Realtime Database (`firebaseDatabase`) — this is a separate concern from auth (used for chat/notifications, not login), and currently has hardcoded config values with the `import.meta.env.VITE_FIREBASE_*` reads commented out.

### State/data patterns

- `src/context/ChatNotificationContext.tsx` — cross-cutting chat/notification state available app-wide via `AppLayout`.
- Dashboard chrome (`Sidebar`, `Header`, `Breadcrumb`, `PageContainer`) lives in `src/components/layout/`; reusable dashboard widgets (`StatCard`, `DetailCard`, `Modal`, `ConfirmModal`, `EmptyState`, `Avatar`, `Badge`, `Loader`, `PageTitle`) live in `src/components/common/`. Prefer these over ad-hoc markup when building new dashboard pages.
- Path alias `@` → `src/` is configured in `vite.config.ts`.

### Build quirks (vite.config.ts)

- A custom `figmaAssetResolver` plugin resolves `figma:asset/<name>` import specifiers to `src/assets/<name>` — this is a leftover from the Figma Make export and must stay for any component still using that import style.
- The React and Tailwind Vite plugins must not be removed even if Tailwind looks unused in a given change — this is called out explicitly in the config comments.
- `assetsInclude` is limited to `.svg`/`.csv`; never add `.css`/`.tsx`/`.ts` to it.
- PWA is enabled via `vite-plugin-pwa` (`registerSW` called in `main.tsx`); manifest name is "Jewelry Dream".

### Deployment

Both Firebase Hosting (`firebase.json`, serves `dist/`, SPA rewrite to `index.html`) and Vercel (`vercel.json`, same SPA rewrite) configs are present. Firebase Realtime Database rules are in `database.rules.json`.

---
name: Video Courses Platform
description: Key decisions and quirks for the videomontazh.ru online course platform
---

## Zod v4 bundling
Zod v4 causes `Class2 is not a constructor` when bundled by esbuild. Fix: add `"zod"` to the `external` array in `artifacts/api-server/build.mjs` AND add zod as a direct `dependency` in `artifacts/api-server/package.json`. Without both steps, bundling passes but runtime fails with `Cannot find package 'zod'`.

**Why:** esbuild can't correctly tree-shake Zod v4 class inheritance. Externalizing forces Node to resolve it at runtime from node_modules, but only if the package is listed in the artifact's own dependencies.

**How to apply:** Any time a new lib uses class-based inheritance + is bundled by the api-server esbuild config, either externalize it or test carefully.

## Auth
- Admin credentials: `admin@videomontazh.ru` / `admin123`  
- User credentials: `user@example.com` / `user123`
- JWT signed with `SESSION_SECRET` env var; stored as `auth_token` (users) or `admin_token` (admin) in localStorage
- Admin panel at `/admm`

## API routes
All mounted under `/api` prefix. Auth via `requireAuth` / `requireAdmin` middlewares that validate Bearer JWT.

## Workspace lib exports
`@workspace/db` exports all schema tables; must run `pnpm run typecheck:libs` (tsc --build) after adding new schema files to regenerate declarations.
`@workspace/api-zod` and `@workspace/api-client-react` export from TypeScript source directly (no build step needed for dev).

## useListOrders return type
`useListOrders()` returns `Order[]` directly, NOT `{ orders: Order[] }`. The OpenAPI spec has a wrapper but the generated hook unwraps it. Always check generated api.ts before assuming shape.

## Thumbnail empty string
Videos seeded without thumbnailUrl get empty string `""` from DB. All `<img>` tags must use `src={video.thumbnailUrl || undefined}` to avoid React browser warnings.

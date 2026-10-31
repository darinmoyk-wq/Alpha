# Sandbox / development notes

## What runs where
Single Node service. The whole app is one process: the Vite dev server on port 3000,
with the Express API from `server/api.ts` mounted as Vite middleware
(`apiServerPlugin` in `vite.config.ts` intercepts `/api*`). There is **no** separate
API process or database — client and API share one origin, so the UI calls `/api/...`
relatively.

- Run: `docker compose -f docker-compose.base44.yml up -d --build`
- App: http://localhost:3000 — API: `/api/health`, `POST /api/aws-ai/analyze`
- Dependencies install at container start into the `node_modules` named volume
  (`npm install` from the bind-mounted `package.json` + `package-lock.json`), so
  edits to source are live and no image rebuild is needed.

## Gotchas
- `esbuild` is a direct devDependency but nothing imports it. It must stay on a
  version that satisfies Vite 8's `peerOptional esbuild@^0.27 || ^0.28`, otherwise
  `npm install` fails with `ERESOLVE` and the container crash-loops. It is pinned
  to `^0.28.0` for that reason.
- Node 22 (`node:22-bookworm-slim`) is enough for Vite 8; the host has no Node, so
  run everything through compose (`docker compose exec -T web ...`).
- `GEMINI_API_KEY` is **optional**. Without it `server/api.ts` sets `ai = null` and
  the analyze endpoint answers from the deterministic Autonomy Matrix engine
  (`src/utils/autonomyMatrix.ts`); `/api/health` then reports
  `"gemini_enabled": false`. Secrets reach the container through
  `/run/base44/app.env` (`env_file` in the compose file), never a repo `.env`.
- `DISABLE_HMR=true` disables HMR *and* file watching (an AI Studio artifact in
  `vite.config.ts`). Do not set it here — it would break live reload.
- Preview hostname: the Vite allowlist comes from the platform-provided
  `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` env var (passed bare in compose).

## Tests
Plain `node:test` files next to the source (`*.test.ts`), no test runner configured
in `package.json`. Run them with Node's built-in type stripping:

```
docker compose -f docker-compose.base44.yml exec -T web \
  node --experimental-strip-types --test src/utils/autonomyMatrix.test.ts src/data/managementFeatures.test.ts
```

## Verify it works
```
curl -s localhost:3000/api/health
curl -s -X POST localhost:3000/api/aws-ai/analyze \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"disk usage is 92% on prod api server, clean temporary files"}'
```
In the UI, clicking a quick-scenario card on "Copilot & Dispatcher" posts to
`/api/aws-ai/analyze` and appends an agent reply.

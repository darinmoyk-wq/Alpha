# Project notes

Single-process app: one Vite dev server on port 3000 serves the React frontend **and** mounts the Express API from `server/api.ts` under `/api` (via the `aws-ai-api-server` plugin in `vite.config.ts`). There is no separate backend service.

## Sandbox setup

- Run everything through `docker-compose.base44.yml`: `docker compose -f docker-compose.base44.yml up -d --build`.
- The repo ships no lockfile history of its own; `npm install` runs on container start.

## Dependency gotcha (this is what broke startup at a810c5f)

`npm install` failed with `ERESOLVE`: `vite@8` declares `peerOptional esbuild@^0.27.0 || ^0.28.0`, while `devDependencies` pinned `esbuild@^0.25.0`. Nothing imports `esbuild` directly (Vite and `tsx` bring their own), so keep the pin inside Vite 8's peer range — do not lower it back to 0.25.

## Preview host allowlist

The Base44 preview proxy sends the public host (`3000-$BASE44_PUBLIC_HOST_SUFFIX`), which Vite rejects with `403 Blocked request` unless it is in `server.allowedHosts`. `vite.config.ts` appends it (and `.` + `BASE44_SANDBOX_HOST_DOMAIN`) only when `BASE44_PREVIEW_MODE === '1'`; with the variable unset, Vite's default host checks are untouched.

## Env

`GEMINI_API_KEY` is optional. Unset/empty ⇒ `/api/aws-ai/analyze` returns the deterministic Autonomy Matrix result (`gemini_enabled: false`) instead of calling the model, so the app is fully functional without it. `.env.base44-defaults` holds the placeholder; `/run/base44/app.env` is loaded after it and wins.

## Verify

```sh
curl -s localhost:3000/api/health          # {"status":"ONLINE",...}
docker compose -f docker-compose.base44.yml exec -T web \
  node --experimental-strip-types --test src/utils/autonomyMatrix.test.ts src/data/managementFeatures.test.ts
```

The two `*.test.ts` files use `node:test` (no test runner is installed); they need Node's type stripping, hence the flag.

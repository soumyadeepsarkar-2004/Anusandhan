# AGENTS.md

Anusandhan — research-internship discovery + academic outreach platform. React SPA + Express gateway + FastAPI AI microservice + Electron/Capacitor packaging. Windows/PowerShell dev environment.

## Layout (three runtimes, three installs)

- `src/` — React 18 + Vite 5 + Tailwind SPA. `npm install` at repo root.
- `server/` — Express API gateway (port 5000). **Separate `package.json`**; needs its own `npm install`. Entry: `server/server.js`.
- `backend/` — Python FastAPI AI service (port 8000). Entry: `app.main:app`. Tests: `backend/tests/` via pytest.
- `tests/` — root-level opaque-box suites (`.mjs`) that hit **running** servers. Subdirs: `e2e/`, `adversarial/`, `unit/`, `load/`.
- `server/tests/` — gateway unit tests (`.js`), run by `server`'s own `npm test`.
- `docs/` — VitePress site. `electron/`, `android/`, `capacitor.config.ts` — desktop/mobile packaging.
- `.agents/teamwork/` — past agent-orchestration logs; history, not source of truth.

## Commands

```powershell
npm run build                 # tsc && vite build — THE typecheck gate (no lint/format scripts exist)
npm run dev                   # Vite dev server on :5173

cd server; npm install; npm start    # gateway on :5000  (dev reload: npm run dev)
cd server; npm test                  # node --test tests/gateway.test.js

cd backend; pip install -r requirements.txt
cd backend; pytest                   # pytest.ini sets pythonpath=. ; CI sets ENVIRONMENT=test + dummy GEMINI_API_KEY

# E2E (requires gateway running on 127.0.0.1:5000; some tiers also need :8000)
node --test tests/e2e/tier1_features.test.mjs        # or: node --test tests/e2e/*.test.mjs
node tests/load/concurrency_benchmark_1000.cjs       # 1000-user load benchmark

npm run docs:build            # VitePress → docs/.vitepress/dist
node scripts/validate_environment.js   # production preflight (loads root .env + server/.env)
```

Verification order that matches CI (`.github/workflows/production_ci_cd.yml`): `npm run build` → `cd server && npm test` → `cd backend && pytest`.

## Gotchas

- **No `pyproject.toml`** — `uv sync` in README/docs will fail; use `pip install -r requirements.txt` (that's what CI does).
- **Frontend picks its API base itself** in `src/services/apiClient.ts`: localhost:5173 → `http://localhost:5000/api` and `http://localhost:8000/api/v1`; Electron/Capacitor → `https://anusandhan.vercel.app/api`; anything else → `/api`. The Vite `/api` proxy targets **production** (`anusandhan.vercel.app`), not localhost — so raw `fetch('/api')` calls during dev hit prod.
- **Env files**: `server/.env` (copy from `server/.env.example`), `backend/.env`, root `.env` — all gitignored. `server/server.js` only auto-loads `server/.env` when `NODE_ENV !== 'production'`. Missing `JWT_SECRET` in dev generates an ephemeral random one (sessions die on restart); production refuses to boot without it.
- **E2E tests are opaque-box**: no mocks, they need live gateway (and often FastAPI) on 127.0.0.1. Override target with `TARGET_URL`.
- **Server deps must be installed in `server/`** — root `npm install` does not cover them (CI runs `npm ci` in both).
- README/docs contain aspirational or stale details (e.g., `railway.json` referenced but absent, "uv sync", some test counts). Trust `package.json`, CI workflow, and pytest/node test files over prose.
- `dist/`, `*.log`, `.env*` are gitignored; `server_run.log` at root is local debris.

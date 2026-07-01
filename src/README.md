# Talent Intelligence Platform - Frontend

React + TypeScript + Tailwind (Vite), consuming the FastAPI backend in `../backend/api/`.

See the [repo root README](../README.md) for full run instructions. Quick start:

```bash
npm install
npm run dev
```

Requires the API running at `localhost:8000` (`uvicorn backend.api.main:app --reload --port 8000` from the repo root) - Vite proxies `/api/*` to it in dev (see `vite.config.ts`).

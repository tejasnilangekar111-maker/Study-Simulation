#!/usr/bin/env bash
# Populates the GitHub wiki for tejasnilangekar111-maker/Study-Simulation.
# Prereqs (do these once in the GitHub UI first):
#   1. Repo Settings -> Features -> enable "Wikis"
#   2. Wiki tab -> "Create the first page" -> Save (creates the wiki git repo)
set -euo pipefail

REPO_URL="https://github.com/tejasnilangekar111-maker/Study-Simulation.wiki.git"
WORKDIR="$(mktemp -d)"

git clone "$REPO_URL" "$WORKDIR"
cd "$WORKDIR"

cat > Home.md <<'EOF'
# Study Simulation — Immersive AI Study Library

A productivity web app that recreates the feeling of studying inside a living digital
library: an animated day/night library scene, a floating Pomodoro timer, a multi-channel
ambient sound mixer, a productivity sidebar (todos/notes/flashcards/streak), and a floating
AI study companion.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 (Vite), React Router, Tailwind CSS v4, Framer Motion, Zustand, React Icons, Howler.js |
| Backend | Spring Boot 3.3, Java 17, Spring Security (JWT), Spring Data JPA, PostgreSQL, Redis, WebSocket (STOMP) |
| Infra | Docker, Docker Compose, Nginx, Vercel (frontend), Render (backend), GitHub Actions |

## Pages

- [[Deployment]] — how the app is deployed to Vercel + Render
- [[Architecture]] — project layout and key modules

## No-login access

The app has no login/register screen. On load, the frontend silently calls
`POST /api/auth/guest`, which finds-or-creates a shared `guest` account and returns a JWT.
All pomodoro/notes/flashcards/analytics data persists normally under that guest account.
EOF

cat > Deployment.md <<'EOF'
# Deployment

## Split

- **Frontend** (Vite/React) → **Vercel**
- **Backend** (Spring Boot) → **Render** (Docker, via `backend/Dockerfile`)
- **Postgres + Redis** → managed instances on Render (or Upstash Redis)

## Vercel setup

1. Import the repo, set **Root Directory** to `frontend` (monorepo).
2. Framework preset: Vite (auto-detected) — build `npm run build`, output `dist`.
3. Environment variables (build-time, must point at the live backend):
   ```
   VITE_API_URL=https://<render-backend>.onrender.com/api
   VITE_WS_URL=wss://<render-backend>.onrender.com/ws
   ```
4. `frontend/vercel.json` already has the SPA rewrite so `/study`, `/todo`, `/analytics`
   don't 404 on refresh.

## Render setup

1. Web Service from this repo, root directory `backend/`, using the existing `Dockerfile`.
2. Attach a Postgres instance and a Redis instance.
3. Environment variables:
   `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `REDIS_HOST`, `REDIS_PORT`, `JWT_SECRET`,
   `FRONTEND_ORIGIN` (the Vercel URL, no trailing slash), `SPRING_PROFILES_ACTIVE=prod`.
4. Prod profile runs Flyway (`V1__init_schema.sql`) + Hibernate `ddl-auto: validate`.
   Requires the `flyway-database-postgresql` dependency in `pom.xml` — Flyway 10 split
   database support out of `flyway-core`, and without it boot fails with
   `Unsupported Database: PostgreSQL 16.x`.

## CORS

Spring Security allows exactly one origin via `app.cors.allowed-origin` /
`FRONTEND_ORIGIN`. If you change the Vercel domain, update `FRONTEND_ORIGIN` on Render
and restart the service, or every API call from the frontend will fail CORS.
EOF

git add Home.md Deployment.md
git commit -m "Add project overview and deployment docs"
git push origin master

echo "Done. Wiki updated at: https://github.com/tejasnilangekar111-maker/Study-Simulation/wiki"

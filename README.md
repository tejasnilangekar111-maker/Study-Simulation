# Study Simulation — Immersive AI Study Library

A productivity web app that recreates the feeling of studying inside a living digital
library: an animated day/night library scene, a floating Pomodoro timer, a
multi-channel ambient sound mixer, a productivity sidebar (todos/notes/flashcards/streak),
and a floating AI study companion.

This repo is a **working vertical slice**, not the full future roadmap described in the
original spec (no 3D/react-three-fiber scene, no rendered student character animations,
no live OpenAI wiring yet — see [Status & Known Gaps](#status--known-gaps)). Everything
listed under [Implemented](#implemented) is real, running code.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 (Vite), React Router, Tailwind CSS v4, Framer Motion, Zustand, React Icons, Howler.js |
| Backend | Spring Boot 3.3, Java 17 (one-line bump to 21, see `backend/pom.xml`), Spring Security (JWT), Spring Data JPA, PostgreSQL, Redis, WebSocket (STOMP) |
| Infra | Docker, Docker Compose, Nginx, GitHub Actions |

## Project layout

```
study-simulation/
├── frontend/          Vite React app
│   └── src/
│       ├── components/ Pomodoro/ LibraryScene/ StudentAnimations/ AIAssistant/ SoundMixer/ Sidebar/ Navbar/
│       ├── pages/       LandingPage, StudyRoomPage, LoginPage, RegisterPage
│       ├── hooks/       useIdleDetection, useFocusMode
│       ├── services/    api.js (axios + JWT interceptor)
│       ├── store/       Zustand stores (session, sound, sidebar, auth, ui) — persisted to localStorage
│       └── utils/
├── backend/            Spring Boot app
│   └── src/main/java/com/studylibrary/app/
│       ├── controller/ service/ repository/ entity/ dto/
│       ├── security/    JWT filter, SecurityConfig
│       ├── websocket/   STOMP config + Pomodoro live sync
│       ├── ai/          AiService interface, StubAiService (active), OpenAiService (stub, gated by OPENAI_API_KEY)
│       └── config/ exception/
├── nginx/nginx.conf    Reverse proxy used by docker-compose (routes /api, /ws, /swagger-ui to backend)
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Implemented

**Frontend**
- Cinematic landing page: layered animated library background (rain, dust particles, light rays, parallax bookshelves), fade-in, glass "Start Focus Session" CTA
- Study room: same background + real-time day/night gradient cycle (recomputed every minute from local clock), background student silhouettes with randomized idle animation loops
- Circular Pomodoro timer: 25/5 default, editable durations, pause/resume/skip, completion pulse + sound
- 9-channel ambient sound mixer (rain, fireplace, pages, keyboard, clock, birds, wind, café, white noise) via Howler — independent volume/mute per channel
- Collapsible productivity sidebar: goals, to-do list, quick notes, flashcards, study streak, weekly bar chart — all autosaved via Zustand `persist`
- Draggable floating AI orb + chat panel calling `/api/ai/chat`
- Focus mode: UI auto-hides after 10s of inactivity, restores on mouse/key activity
- JWT auth (login/register), protected `/study` route, lazy-loaded heavy views

**Backend**
- JWT authentication (register/login, BCrypt, stateless security filter chain)
- Pomodoro REST (`start`/`pause`/`complete`/`history`) backed by Postgres + Redis-cached live state, plus a STOMP WebSocket endpoint (`/ws`, topic `/topic/pomodoro/{sessionId}`) for live timer sync across tabs/devices
- Notes and Flashcards CRUD
- Weekly analytics aggregation endpoint
- AI endpoints (`/api/ai/chat`, `/quiz`, `/summary`) served by a `StubAiService` returning realistic mocked responses; `OpenAiService` is scaffolded and activates automatically once `OPENAI_API_KEY` is set (currently TODO-stubbed method bodies — see [AI integration](#ai-integration))
- Global exception handling, bean validation, Swagger/OpenAPI UI at `/swagger-ui.html`
- `V1__init_schema.sql` reference Flyway migration (Flyway is on the classpath but disabled by default; dev uses `ddl-auto: update`)

## Status & Known Gaps

This was built as a first vertical slice, prioritizing a real, running end-to-end app over
partial coverage of every item in the original spec. Not yet built:

- No react-three-fiber / 3D scene — background is CSS + Framer Motion (lighter, still performant, swappable later)
- No rendered student character art — idle "students" are simple animated silhouettes, not illustrated sprites
- No real ambient audio files shipped — drop `.mp3`/`.ogg` loops into `frontend/public/sounds/` named to match `SoundMixer` channel keys; Howler fails silently if a file is missing, so the UI still works without them
- `OpenAiService` is scaffolded (config, gating, DI) but its three methods are TODO — wire an OpenAI Responses API client call using the `openai.api-key` property once you have a key
- No real-time multi-user features (leaderboards, multiplayer rooms, avatars) — out of scope for this slice, listed as future premium features in the original spec

## Running locally (without Docker)

**Backend** (needs local Postgres + Redis, or point `DB_URL`/`REDIS_HOST` at hosted ones):
```bash
cd backend
mvn spring-boot:run
# API on http://localhost:8080, Swagger UI on http://localhost:8080/swagger-ui.html
```

**Frontend**:
```bash
cd frontend
cp .env.example .env   # adjust VITE_API_URL/VITE_WS_URL if needed
npm install
npm run dev
# App on http://localhost:5173
```

## Running with Docker Compose

```bash
cp .env.example .env   # set JWT_SECRET and optionally OPENAI_API_KEY
docker compose up --build
# App on http://localhost:8081 (nginx reverse-proxies /api and /ws to the backend)
```

Services: `postgres`, `redis`, `backend` (Spring Boot), `frontend` (static build served by
its own nginx), and a top-level `nginx` reverse proxy that fronts everything on port 8081.

## Environment variables

| Var | Used by | Default |
|---|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | backend | local Postgres |
| `REDIS_HOST`, `REDIS_PORT` | backend | `localhost:6379` |
| `JWT_SECRET`, `JWT_EXPIRATION_MS` | backend | dev placeholder — **override in production** |
| `OPENAI_API_KEY` | backend | empty → `StubAiService` used |
| `FRONTEND_ORIGIN` | backend (CORS) | `http://localhost:5173` |
| `VITE_API_URL`, `VITE_WS_URL` | frontend (build-time) | `http://localhost:8080/api` / `/ws` |

## API overview

Full interactive docs at `/swagger-ui.html` once the backend is running. Summary:

```
POST /api/auth/register        POST /api/auth/login
POST /api/pomodoro/start       POST /api/pomodoro/pause
POST /api/pomodoro/complete    GET  /api/pomodoro/history
GET|POST|PUT|DELETE /api/notes[/{id}]
GET|POST|PUT|DELETE /api/flashcards[/{id}]
GET  /api/analytics/weekly
POST /api/ai/chat              POST /api/ai/quiz              POST /api/ai/summary
WS   /ws  (STOMP; subscribe /topic/pomodoro/{sessionId})
```

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main`: Maven build+test for the
backend, `npm run build` for the frontend, then (on push) builds both Docker images.

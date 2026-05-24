# DzidzaAI

DzidzaAI is an AI-powered adaptive learning platform that personalizes study experiences using conversational tutoring, AI-generated quizzes and flashcards, study planning, and analytics.

This repository contains:

- `backend/` — Node.js API (Express) and worker code
- `frontend/` — React + Vite single-page application
- `doc_assets/` — diagrams and image assets used in documentation
- documentation files: `SYSTEM_ARCHITECTURE.md`, `API_DOCUMENTATION.md`, `DATABASE_DOCUMENTATION.md`, `SECURITY_REPORT.md`, etc.
- deployment artifacts: `docker-compose.prod.yml`, `.env.example`, `.github/workflows/deploy.yml`

## Quickstart

1. Clone the repository and copy example env files:

````bash
git clone https://github.com/<org>/dzidzaai.git
# DzidzaAI

AI-powered adaptive learning: tutor chat, AI quizzes, flashcards, and document study.

Quick notes — short and ready for GitHub:

- Stack: Node.js (Express) backend, React + Vite frontend
- Dev requirements: Node 18+ (Node 20+ recommended), MongoDB, optional Redis

Getting started (local dev)

```bash
git clone <repo-url>
cd dzidzaai
cp .env.example .env     # set MONGODB_URI and secrets

# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev
````

Production build (quick)

```bash
cd frontend && npm run build
# Recommended: run backend with PM2 or Docker; example:
docker compose -f docker-compose.prod.yml up --build -d
```

Notes

- Onboarding flow runs before signup in the app; drafts are autosaved.
- Store secrets in `.env` or a secret manager; do not commit `.env`.

License

MIT — see `LICENSE`.

Contact

Project maintainer: check repo owner or open an issue for questions.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to view the app (Vite proxy forwards `/api` to backend).

## Development

- Backend: `backend/` — run `npm run dev` (Node's `--watch` used for fast reload)
- Frontend: `frontend/` — run `npm run dev` (Vite)
- Workers: run `npm run worker` in `backend/` to start background processors (BullMQ)

Run tests:

```bash
cd backend && npm test
cd frontend && npm test
```

## Deployment

Use `docker-compose.prod.yml` for a simple container-based deployment, or provision images via the included GitHub Actions workflow.

```bash
cp .env.example .env
# update .env with production values
docker compose -f docker-compose.prod.yml up --build -d
```

## Contributing

Please read `CONTRIBUTING.md` for contribution guidelines. Quick notes:

- Create feature branches: `feature/<short-description>`
- Run linters and tests before opening PRs
- Include migration notes when changing data models

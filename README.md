# ReviewBot — AI Code Review

> Better Software — Associate Software Engineer Assessment
> Candidate: Prashant Singh Hooda

An AI-powered code review tool. Paste a public GitHub PR URL, get a structured review covering architecture, security, correctness, and code quality — streamed live, saved, and shareable.

---

## Data Flow

```
                        USER
                          │
                          │  pastes GitHub PR URL
                          ▼
              ┌─────────────────────┐
              │   React (Vite)      │
              │   Vercel            │
              │                     │
              │  Zod validates URL  │
              │  client-side first  │
              └────────┬────────────┘
                       │
                       │  POST /api/reviews
                       │  Authorization: Bearer <JWT>
                       │  { pr_url: "https://github.com/..." }
                       │
                       ▼
              ┌─────────────────────┐
              │   Flask API         │
              │   Render            │
              │                     │
              │  1. auth_middleware  │
              │     decode JWT,     │
              │     attach user_id  │
              │                     │
              │  2. ReviewRequest   │◄── Pydantic v2 validates
              │     schema check    │    URL format (regex)
              │                     │
              │  3. review_service  │
              │     orchestrates    │
              │     the pipeline    │
              └────────┬────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
  ┌──────────────┐  ┌──────────┐  ┌──────────────────┐
  │ github_      │  │    DB    │  │   ai_service      │
  │ service      │  │ Supabase │  │   OpenAI GPT-4o   │
  │              │  │ Postgres │  │                   │
  │ fetch PR     │  │          │  │ system prompt +   │
  │ metadata     │  │ INSERT   │  │ PR diff →         │
  │              │  │ review   │  │ stream=True       │
  │ check 4000    │  │ status=  │  │                   │
  │ line limit   │  │ pending  │  │ yields tokens     │
  │              │  │          │  │ one by one        │
  │ fetch diff   │  └──────────┘  └────────┬─────────┘
  └──────┬───────┘                         │
         │                                 │
         │ raw diff text                   │ token stream
         └─────────────────────────────────┘
                       │
                       │  SSE: data: {"token": "..."}
                       │  data: {"token": "..."}
                       │  data: {"token": "..."}
                       │       ... (streaming)
                       │  data: {"done": true, "review_id": "..."}
                       │
                       ▼
              ┌─────────────────────┐
              │  accumulated JSON   │
              │                     │
              │  AIReviewOutput     │◄── Pydantic v2 validates
              │  schema validation  │    AI output before DB write
              │                     │
              │  if valid →         │
              │    status=completed │──► DB UPDATE
              │    result_json=...  │
              │                     │
              │  if invalid →       │
              │    status=failed    │──► DB UPDATE
              └────────┬────────────┘
                       │
                       │  SSE stream consumed by
                       │  useReviewStream hook
                       ▼
              ┌─────────────────────┐
              │   React (Vite)      │
              │                     │
              │  tokens render      │
              │  live (typewriter)  │
              │                     │
              │  on done event →    │
              │  GET /api/reviews/  │──► fetch saved review from DB
              │  :review_id         │
              │                     │
              │  ReviewResult       │
              │  renders sections   │
              │                     │
              │  ShareButton →      │
              │  /share/<hex>       │
              └─────────────────────┘
```

---

## Project Info

ReviewBot is a full-stack developer tool that automates code review using AI. It is built as a submission for the Better Software Associate Software Engineer assessment.

The system is intentionally small and well-structured. Every layer has a single responsibility — routes delegate to services, services own business logic, schemas validate all external input, and the AI layer is fully isolated as a pure function. Complexity is centralized in `review_service.py` rather than spread across the codebase.

Key design decisions:

- AI output is validated through a Pydantic schema before any DB write. The model is never trusted blindly.
- Reviews are stored as `result_json` (JSONB) rather than normalized columns — the review structure can evolve without migrations.
- Streaming (SSE) is the transport layer only. The pipeline logic is identical whether streaming or not.
- Share links require authentication — a deliberate tradeoff of convenience for simplicity and privacy.
- The 4000-line PR limit is enforced at the metadata fetch step, before the diff is downloaded, keeping token usage predictable.

---

## Tech Stack

| Layer                 | Technology                    | Notes                                          |
| --------------------- | ----------------------------- | ---------------------------------------------- |
| Frontend              | React 18 + Vite               | TypeScript, strict mode                        |
| Styling               | CSS variables + inline styles | No CSS framework                               |
| State                 | Zustand                       | Auth store with localStorage persistence       |
| Validation (frontend) | Zod                           | Mirrors server-side URL regex exactly          |
| HTTP client           | Axios                         | With 401 interceptor + auto token refresh      |
| Streaming (frontend)  | Native `fetch` + SSE          | `useReviewStream` hook                         |
| Backend               | Python 3.11 + Flask 3         | App factory pattern, blueprints                |
| Validation (backend)  | Pydantic v2                   | All API input + AI output validated            |
| ORM                   | SQLAlchemy 2 + Flask-Migrate  | Alembic migrations                             |
| Database              | PostgreSQL                    | Supabase (prod), SQLite in-memory (tests)      |
| Auth                  | PyJWT + bcrypt                | Access token (15 min) + refresh token (7 days) |
| Email                 | Google SMTP (smtplib)         | OTP emails for signup and password reset       |
| AI Model              | OpenAI GPT-4o                 | `stream=True`, `response_format: json_object`  |
| GitHub Data           | GitHub REST API               | PAT auth — 5000 req/hr                         |
| Deployment (frontend) | Vercel                        | Auto-deploy from `main`                        |
| Deployment (backend)  | Render                        | Gunicorn WSGI                                  |
| Deployment (database) | Supabase                      | Managed PostgreSQL                             |

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL running locally (or a Supabase project)
- A Gmail account with 2FA enabled (for App Password)
- An OpenAI API key

---

### 1. Clone the repo

```bash
git clone https://github.com/Prashant-S29/better-assignment.git
cd better-assignment
```

---

### 2. Backend setup

```bash
cd server

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env file and fill in values
cp .env.example .env
```

Edit `server/.env`:

```env
SECRET_KEY=any-random-string
FLASK_DEBUG=true

DATABASE_URL=postgresql://postgres:password@localhost:5432/codereview_dev

JWT_SECRET=any-random-jwt-secret
JWT_ACCESS_EXPIRES_MINUTES=15
JWT_REFRESH_EXPIRES_DAYS=7

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

GITHUB_TOKEN=ghp_...

FRONTEND_URL=http://localhost:5173
PR_MAX_LINES=4000
```

> **Gmail App Password setup:** Google Account → Security → 2-Step Verification → App Passwords → Generate. Use the 16-character code as `GMAIL_APP_PASSWORD`.

> **GitHub PAT setup:** GitHub → Settings → Developer Settings → Personal Access Tokens (classic) → Generate. Check `public_repo` scope only.

```bash
# Create the local database
createdb codereview_dev

# Run migrations
flask --app run db upgrade

# Start the server
python run.py
```

Server runs at `http://localhost:5000`. Verify: `curl http://localhost:5000/api/health`

---

### 3. Frontend setup

```bash
cd web

# Install dependencies
npm install

# Copy env file
cp .env.example .env
```

Edit `web/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

### 4. Run tests

```bash
cd server
source venv/bin/activate
pytest -v
```

31 tests across auth, GitHub service, AI service, and review pipeline. All external APIs are mocked — tests never make real API calls.

---

### 5. Full local flow

1. Open `http://localhost:5173`
2. Sign up with your email — check inbox for OTP
3. Verify OTP → land on dashboard
4. Paste any public GitHub PR URL (≤ 4000 changed lines)
5. Watch the review stream live
6. Copy the share link — open in a new tab (login required)
7. Check History tab for all past reviews

---

## Known Limitations

- GitHub API rate limit: 5,000 req/hr with PAT (60/hr without). Acceptable for current scale.
- PR size limit: 4000 changed lines (additions + deletions). Large refactors cannot be reviewed.
- Streaming is synchronous — no retry on mid-stream failure. Review is marked `failed` and user must resubmit.
- Share links require login — no anonymous viewing by design.
- No rate limiting on review submissions per user.
- Render free tier spins down after inactivity — first request after sleep may be slow (~30s).

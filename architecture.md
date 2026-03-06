# architecture.md — AI Code Review Bot

> Better Software — Associate Software Engineer Assessment
> Candidate: Prashant Singh Hooda

---

## Guiding Principles

Every architectural decision in this system is made against one question: **does this make the system easier to understand, change, and verify?** Not faster to write. Not more impressive. Just clearer.

- **Boundaries over cleverness** — modules communicate through defined contracts, not shared state
- **Validate at the edge** — all external input (API requests, AI responses, GitHub data) is validated before it touches business logic or the database
- **AI is a dependency, not a foundation** — the AI layer is isolated so the rest of the system doesn't know or care how it works
- **Fail visibly** — errors surface with context, not silence

---

## High-Level System Diagram

```
Browser (React + Vite)
    │
    │  REST + SSE (streaming)
    ▼
Flask API (Render)
    ├── Auth routes          → AuthService → DB
    ├── Review routes        → ReviewService
    │                              ├── GitHubService  → GitHub REST API
    │                              ├── AIService      → OpenAI API (streaming)
    │                              └── DB (Supabase PostgreSQL)
    └── Share routes         → ReviewService → DB

Email (Google SMTP) ← triggered by AuthService on signup / password reset
```

The frontend never talks directly to OpenAI, GitHub, or the database. Everything flows through the Flask API. This keeps secrets server-side and makes the system auditable.

---

## Repository Structure

```
betterhq-assignment/
│
├── server/                        # Python Flask backend
│   ├── app/
│   │   ├── __init__.py            # App factory — creates Flask app, registers blueprints
│   │   ├── config.py              # Config class — reads env vars, never hardcoded values
│   │   │
│   │   ├── models/                # SQLAlchemy ORM models — DB rules live here
│   │   │   ├── user.py            # User (id, email, password_hash, is_verified)
│   │   │   ├── otp.py             # OTP (user_id, code_hash, purpose, expires_at, used)
│   │   │   ├── review.py          # Review (id, user_id, pr_url, share_code, status, result_json)
│   │   │   └── __init__.py
│   │   │
│   │   ├── schemas/               # Pydantic models — validate all input and output
│   │   │   ├── auth_schema.py     # SignupInput, LoginInput, OTPVerifyInput, ResetInput
│   │   │   ├── review_schema.py   # ReviewRequest (pr_url), AIReviewOutput (structured)
│   │   │   └── __init__.py
│   │   │
│   │   ├── services/              # Business logic — routes call services, never skip them
│   │   │   ├── auth_service.py    # Signup, login, OTP generation/verification, JWT issue
│   │   │   ├── email_service.py   # Google SMTP wrapper — sends OTP emails
│   │   │   ├── github_service.py  # Fetch PR metadata + diff from GitHub REST API
│   │   │   ├── ai_service.py      # OpenAI streaming — pure fn: diff_text → token stream
│   │   │   └── review_service.py  # Orchestrates github → ai → db. Owns streaming logic.
│   │   │
│   │   ├── routes/                # Flask blueprints — thin, delegate everything to services
│   │   │   ├── auth_routes.py     # /api/auth/*
│   │   │   ├── review_routes.py   # /api/reviews/*
│   │   │   ├── share_routes.py    # /api/share/:hex
│   │   │   └── health_routes.py   # /api/health
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth_middleware.py # JWT decode, attach user to request context
│   │   │   └── error_handler.py   # Global error handler — consistent JSON error shape
│   │   │
│   │   └── tests/
│   │       ├── test_auth.py
│   │       ├── test_review_service.py
│   │       ├── test_github_service.py
│   │       ├── test_ai_service.py
│   │       └── conftest.py        # Fixtures, test DB setup, mocked AI/GitHub
│   │
│   ├── migrations/                # Alembic DB migrations
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py                     # Entrypoint
│
├── web/                           # React + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js          # Axios instance — base URL, token injection, 401 handling
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js         # Auth state, login/logout/signup actions
│   │   │   └── useReviewStream.js # Consumes SSE stream from Flask, Vercel AI SDK
│   │   │
│   │   ├── components/
│   │   │   ├── ReviewForm.jsx     # PR URL input + Scan button + validation feedback
│   │   │   ├── ReviewResult.jsx   # Renders streaming review — section by section
│   │   │   ├── ReviewCard.jsx     # Summary card used in history list
│   │   │   ├── ShareButton.jsx    # Copy share link to clipboard
│   │   │   └── ProtectedRoute.jsx # Redirects to /login if not authenticated
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── Dashboard.jsx      # Shell with [Review] and [History] tabs
│   │   │   └── ShareView.jsx      # /share/:hex — fetches and renders saved review
│   │   │
│   │   ├── store/
│   │   │   └── authStore.js       # Zustand store — JWT tokens, user info
│   │   │
│   │   ├── utils/
│   │   │   └── prUrl.js           # PR URL format validation (client-side, mirrors server)
│   │   │
│   │   └── App.jsx                # Router setup, route protection wiring
│   │
│   ├── index.html
│   └── vite.config.js
│
├── architecture.md
├── plan.md
├── claude.md                      # AI agent guidance file
└── README.md
```

---

## Database Schema

Four tables. Simple, no over-engineering.

### `users`

Holds identity and verification state.

| Column        | Type                    | Notes                       |
| ------------- | ----------------------- | --------------------------- |
| id            | UUID PK                 |                             |
| email         | VARCHAR UNIQUE NOT NULL |                             |
| password_hash | TEXT NOT NULL           | bcrypt                      |
| is_verified   | BOOLEAN DEFAULT false   | flipped after OTP confirmed |
| created_at    | TIMESTAMP               |                             |

### `otps`

Short-lived codes for signup and password reset. Separate table keeps `users` clean.

| Column     | Type                                 | Notes                                 |
| ---------- | ------------------------------------ | ------------------------------------- |
| id         | UUID PK                              |                                       |
| user_id    | UUID FK → users                      |                                       |
| code_hash  | TEXT NOT NULL                        | hashed before storage, never raw      |
| purpose    | VARCHAR CHECK IN ('signup', 'reset') | enforced at DB level                  |
| expires_at | TIMESTAMP NOT NULL                   | 10 min window                         |
| used       | BOOLEAN DEFAULT false                | flipped on consumption, never deleted |

### `reviews`

One row per submitted PR. `result_json` stores the full structured AI output.

| Column        | Type                                                | Notes                                       |
| ------------- | --------------------------------------------------- | ------------------------------------------- |
| id            | UUID PK                                             |                                             |
| user_id       | UUID FK → users                                     |                                             |
| pr_url        | TEXT NOT NULL                                       | stored as-is                                |
| pr_title      | TEXT                                                | fetched from GitHub                         |
| pr_diff_size  | INTEGER                                             | additions + deletions count                 |
| share_code    | VARCHAR(12) UNIQUE NOT NULL                         | hex, generated on creation                  |
| status        | VARCHAR CHECK IN ('pending', 'completed', 'failed') |                                             |
| result_json   | JSONB                                               | full AI review output, null until completed |
| error_message | TEXT                                                | populated if status = 'failed'              |
| created_at    | TIMESTAMP                                           |                                             |

> `result_json` is JSONB not normalized columns. The review structure may evolve (new sections added) without requiring a schema migration. The sections are defined by the AI prompt contract, not the DB schema.

### `refresh_tokens`

Tracks issued refresh tokens to support revocation.

| Column     | Type                  | Notes |
| ---------- | --------------------- | ----- |
| id         | UUID PK               |       |
| user_id    | UUID FK → users       |       |
| token_hash | TEXT UNIQUE NOT NULL  |       |
| expires_at | TIMESTAMP             |       |
| revoked    | BOOLEAN DEFAULT false |       |

---

## Service Layer Design

Each service has a single responsibility. Routes never contain logic — they parse the request, call a service, and return the result.

### `auth_service.py`

Owns the full identity lifecycle. Handles signup, OTP verification, login, token issuance, and password reset. Calls `email_service` for OTP delivery. Issues JWTs and stores refresh tokens.

Key rules it enforces:

- Cannot login until `is_verified = true`
- OTP codes expire in 10 minutes and can only be used once
- Passwords are never stored or logged — only bcrypt hashes

### `email_service.py`

A thin wrapper around Python's `smtplib` using Google SMTP. Takes a `to`, `subject`, and `body`. Nothing more. Auth service composes the email content; this service just sends it. This means switching from Gmail to Resend tomorrow is a one-file change.

### `github_service.py`

Responsible for all GitHub API interaction. Two operations only:

1. **Fetch PR metadata** — title, author, base/head branches, `additions`, `deletions`. Used to enforce the 4000-line limit before any diff is fetched.
2. **Fetch PR diff** — raw unified diff text. Only called if metadata check passes.

Detects private repos via 404 response and raises a typed exception that maps to a user-friendly error. No GitHub token required for public repos.

### `ai_service.py`

The most isolated service in the system. Its contract is intentionally narrow:

- **Input:** `diff_text: str`, `pr_title: str`
- **Output:** a generator that yields string tokens (the stream)

It knows nothing about Flask, the database, or the user. It constructs the system prompt, calls OpenAI with `stream=True`, and yields tokens. That's it.

The system prompt instructs the model to respond in a strict JSON structure with defined sections. This is validated downstream — the AI output is **never trusted blindly**.

### `review_service.py`

The orchestrator. This is the most complex service and intentionally so — complexity is centralized here rather than spread across routes.

Flow:

1. Validate PR URL format (via schema)
2. Call `github_service` → fetch metadata → enforce 4000-line limit
3. Create a `review` row in DB with `status = 'pending'`
4. Call `github_service` → fetch diff
5. Call `ai_service` → get token stream
6. Stream tokens to the HTTP response via Flask SSE
7. After stream completes, validate the full accumulated text against `AIReviewOutput` Pydantic schema
8. If valid → update review row: `status = 'completed'`, `result_json = parsed_output`
9. If invalid → update review row: `status = 'failed'`, `error_message = validation_error`

This means the DB always reflects the true state of a review. No orphaned pending rows.

---

## API Contract

All endpoints return `{ success: bool, data: {}, error: { code, message } }`. Error shape is always the same — this is enforced by the global error handler.

### Auth

| Method | Path                               | Body                            | Returns                           |
| ------ | ---------------------------------- | ------------------------------- | --------------------------------- |
| POST   | `/api/auth/signup`                 | `{ email, password }`           | `{ message }`                     |
| POST   | `/api/auth/verify-otp`             | `{ email, code, purpose }`      | `{ access_token, refresh_token }` |
| POST   | `/api/auth/login`                  | `{ email, password }`           | `{ access_token, refresh_token }` |
| POST   | `/api/auth/refresh`                | `{ refresh_token }`             | `{ access_token }`                |
| POST   | `/api/auth/reset-password`         | `{ email }`                     | `{ message }`                     |
| POST   | `/api/auth/reset-password/confirm` | `{ email, code, new_password }` | `{ message }`                     |
| POST   | `/api/auth/logout`                 | `{ refresh_token }`             | `{ message }`                     |

### Reviews

| Method | Path               | Auth | Notes                                                         |
| ------ | ------------------ | ---- | ------------------------------------------------------------- |
| POST   | `/api/reviews`     | ✅   | Starts review, returns `review_id`. Streams response via SSE. |
| GET    | `/api/reviews`     | ✅   | Returns list of user's past reviews (history)                 |
| GET    | `/api/reviews/:id` | ✅   | Returns single review with full result                        |

### Share

| Method | Path              | Auth | Notes                                                           |
| ------ | ----------------- | ---- | --------------------------------------------------------------- |
| GET    | `/api/share/:hex` | ✅   | Returns review by share_code. Auth required — no public access. |

### Health

| Method | Path          | Auth | Notes                                         |
| ------ | ------------- | ---- | --------------------------------------------- |
| GET    | `/api/health` | ❌   | Returns DB connectivity + OpenAI reachability |

---

## Streaming Architecture

This is worth explaining carefully because it spans both layers.

**Flask side:**
`POST /api/reviews` returns a streaming response (`Content-Type: text/event-stream`). As `ai_service` yields tokens, `review_service` forwards them to the response stream in SSE format. Concurrently, tokens are accumulated in memory. When the stream ends, the accumulated string is validated and written to the DB.

SSE event shape (per token):

```
data: {"token": "..."}\n\n
```

On completion:

```
data: {"done": true, "review_id": "..."}\n\n
```

On error:

```
data: {"error": "..."}\n\n
```

**React side:**
`useReviewStream.js` hook uses the Vercel AI SDK's streaming utilities to consume the SSE stream. It manages three states: `streaming` (tokens arriving), `done` (full review ready), and `error`. The `ReviewResult` component renders sections progressively as they stream in, giving a live typewriter feel.

**Important:** The `review_id` is returned in the final `done` event. The frontend uses this to build the share URL and to record the review in history without a separate API call.

---

## Auth & Token Flow

```
Signup → OTP email sent → User verifies OTP → Access + Refresh tokens issued
Login  → Access + Refresh tokens issued

Access token:  short-lived (15 min), sent in Authorization header
Refresh token: long-lived (7 days), stored in DB, sent in request body on /refresh

Protected routes: auth_middleware decodes access token, attaches user_id to request context
Token refresh: frontend intercepts 401 responses via Axios interceptor, calls /refresh, retries
Logout: refresh token is revoked in DB (revoked = true)
```

OTP codes are hashed before storage (same principle as passwords). The raw code is emailed to the user and never stored.

---

## Validation Strategy — Pydantic v2

Pydantic v2 is the validation backbone of the backend. It is the Python equivalent of Zod in the TypeScript ecosystem — you define a schema as a class, pass data in, and it either returns a validated object or raises a `ValidationError` with field-level detail.

| Concept          | Zod (TS / frontend)                       | Pydantic v2 (Python / backend)                  |
| ---------------- | ----------------------------------------- | ----------------------------------------------- |
| Define schema    | `z.object({ email: z.string().email() })` | `class SignupInput(BaseModel): email: EmailStr` |
| Parse + validate | `schema.parse(data)`                      | `SignupInput(**data)`                           |
| On failure       | throws `ZodError`                         | raises `ValidationError`                        |
| Nested schemas   | `z.object({ review: reviewSchema })`      | nested `BaseModel` classes                      |
| Custom rules     | `.refine(val => ...)`                     | `@field_validator(...)`                         |

Pydantic v2 compiles validators to Rust via `pydantic-core` — it is not a weaker alternative to Zod, it is genuinely fast and production-grade.

Validation happens at **three distinct boundaries** in our system:

**Boundary 1 — API input** (`schemas/auth_schema.py`, `schemas/review_schema.py`)
Every request body is parsed through a Pydantic model before it reaches any service. Invalid input never touches business logic. The global error handler catches `ValidationError` automatically and returns a 422 with field-level error messages. No manual validation code in routes.

Schemas in use: `SignupInput`, `LoginInput`, `OTPVerifyInput`, `ResetPasswordInput`, `ResetPasswordConfirmInput`, and `ReviewRequest` (pr_url validated against a regex enforcing `https://github.com/{owner}/{repo}/pull/{number}`).

**Boundary 2 — GitHub response**
PR metadata from GitHub is parsed into a small Pydantic model (`PRMetadata`) before `review_service` uses it. Raw dict responses are never passed around. HTTP status codes are checked explicitly — 404 raises `PrivateRepoError`, 403 raises `GitHubRateLimitError`.

**Boundary 3 — AI output** (`AIReviewOutput` in `schemas/review_schema.py`)
This is the most critical boundary. After the stream completes, the full accumulated JSON string is parsed through `AIReviewOutput`. If OpenAI returns a malformed structure, missing fields, or wrong types — Pydantic catches it before anything reaches the DB. The review is marked `failed` with the validation error stored in `error_message`. AI output is never trusted blindly.

`AIReviewOutput` enforces: `summary`, `architecture`, `quality`, `correctness`, `security`, `error_handling` (each with `observations: str` and `score: int 1–5`), and `overall_score: float`.

The frontend mirrors this with **Zod** — the PR URL pattern is validated client-side in `utils/prUrl.js` for instant feedback before any network request. Both layers validate independently; the server is always the source of truth.

---

## Error Handling

All services raise typed exceptions (e.g., `PRTooLargeError`, `PrivateRepoError`, `AIValidationError`). The global error handler in `middleware/error_handler.py` catches these and maps them to HTTP status codes and user-friendly messages. Routes never contain try/catch — they trust the error handler.

```
PRTooLargeError        → 422  "This PR exceeds the 4000 line limit"
PrivateRepoError       → 422  "This PR is from a private repository"
InvalidPRURLError      → 422  "Please enter a valid GitHub PR URL"
GitHubRateLimitError   → 429  "GitHub API rate limit reached, try again later"
AIValidationError      → 4000  "Review generation failed, please try again"
AuthenticationError    → 401  "Invalid or expired token"
```

This means error behavior is defined in one place and is completely consistent across the API.

---

## Testing Strategy

Tests are organized by layer, not by feature. AI and GitHub are always mocked — tests must not make real API calls.

- **`test_auth.py`** — signup flow, OTP expiry, login, token refresh, bad credentials
- **`test_github_service.py`** — valid PR URL, private repo 404, rate limit 403, diff > 4000 lines
- **`test_ai_service.py`** — prompt construction, stream token output shape (mock OpenAI)
- **`test_review_service.py`** — full orchestration with mocked GitHub + AI, DB state after completion, DB state after failure
- **`conftest.py`** — shared fixtures: test DB (SQLite in-memory or test Supabase), mocked OpenAI client, mocked GitHub responses

The most important tests are in `test_review_service.py` — they verify that the DB always ends in a valid state regardless of where the pipeline fails.

---

## Observability

- **`/api/health`** — checks DB connection and whether OpenAI key is configured. Returns structured JSON. Used by Render for uptime monitoring.
- **Structured errors** — every error response includes a `code` (machine-readable) and `message` (human-readable). No stack traces in production responses.
- **Review `status` field** — `pending → completed / failed` gives instant visibility into review pipeline state. Failed reviews store `error_message`.
- **Logging** — Python's `logging` module, structured with request context (user_id where available). Log level controlled via env var.

---

## AI Guidance File — `claude.md`

This file is committed to the repo root and used throughout development to constrain AI agent behavior.

Key rules it enforces:

- Routes must never contain business logic — always delegate to services
- AI service must remain a pure function with no side effects
- All AI output must be validated against `AIReviewOutput` schema before any DB write
- New DB columns require a migration — never modify models directly
- Tests must mock `ai_service` and `github_service` — no real API calls in test suite
- `share_code` generation must use `secrets.token_hex()` — not `uuid` or `random`
- JWT secrets and SMTP credentials must never appear in code — env vars only
- Error handler is the single source of truth for HTTP error codes — services only raise typed exceptions

---

## Key Tradeoffs Worth Mentioning in Walkthrough

| Decision                                      | Why                                                 | What we gave up                               |
| --------------------------------------------- | --------------------------------------------------- | --------------------------------------------- |
| `result_json` as JSONB not normalized columns | Review structure can evolve without migrations      | Can't query individual review sections in SQL |
| Streaming over async queue                    | Simpler infra for assessment scale, perceived speed | No retry on failure, no background processing |
| Share links require auth                      | Privacy and simplicity — no token management        | Friction for casual sharing                   |
| 4000-line PR limit                            | Predictable token usage, avoids context overflow    | Can't review large refactors                  |
| Unauthenticated GitHub API                    | No setup required                                   | 60 req/hr rate limit per IP                   |
| OTP hashed in DB                              | Same security principle as passwords                | Slightly more complex OTP verification        |

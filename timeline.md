# timeline.md — AI Code Review Bot
> Better Software — Associate Software Engineer Assessment
> Candidate: Prashant Singh Hooda

---

## Core Building Philosophy

Every milestone in this timeline produces a **working, deployable slice** of the system.
We never break what already works. Each milestone:

- Adds behaviour on top of a stable base
- Has a clear "done" condition (not "looks good", but verifiable)
- Is independently testable before the next one starts
- Introduces no breaking changes to previously completed milestones

If a milestone feels too risky, we build a thinner version and expand later.

---

## Timeline Overview

| Milestone | What It Delivers | Stability Gate |
|---|---|---|
| M0 | Scaffolding + CI baseline | Project runs locally, tests pass |
| M1 | Database + models | Migrations run clean, models load |
| M2 | Auth API (backend) | All auth endpoints tested and working |
| M3 | Auth UI (frontend) | User can sign up, verify OTP, log in |
| M4 | GitHub + PR validation | PR metadata fetched, size limit enforced |
| M5 | AI review engine (non-streaming) | Full review generated, saved to DB |
| M6 | Streaming | Same review, now streamed token-by-token |
| M7 | Share + History | Share links work, history renders |
| M8 | Error handling + observability | All error paths return correct shape |
| M9 | Tests + verification | Coverage across all service layers |
| M10 | Deployment | Live on Vercel + Render + Supabase |
| M11 | AI Guidance + Docs | `claude.md`, `README.md`, final polish |

Total estimated time: **42–46 hours** across 48-hour window.

---

## M0 — Scaffolding + CI Baseline
**Goal:** Empty but fully wired project. Both apps run without errors. The test runner works.
**Time estimate: 1.5 hrs**

### Backend
- [ ] Init Flask app with app factory pattern (`create_app()` in `__init__.py`)
- [ ] `config.py` — reads all env vars, fails loudly if required ones are missing
- [ ] Register blueprints (empty for now): `auth`, `reviews`, `share`, `health`
- [ ] `GET /api/health` returns `{ status: "ok" }` — no DB yet, just a live check
- [ ] `requirements.txt` with pinned versions: Flask, SQLAlchemy, Alembic, **Pydantic v2** (`pydantic[email]`), python-dotenv, bcrypt, PyJWT, openai
- [ ] `.env.example` with all required keys documented
- [ ] Global error handler wired up — returns `{ success: false, error: { code, message } }` shape
- [ ] `pytest` installed, `conftest.py` created, one smoke test: `GET /api/health` returns 200

### Frontend
- [ ] Vite + React scaffold (`npm create vite`)
- [ ] Install: Axios, Zustand, React Router, Vercel AI SDK
- [ ] `api/client.js` — Axios instance with base URL from env, placeholder 401 interceptor
- [ ] React Router wired with placeholder pages: Home, Login, Signup, Dashboard, ShareView
- [ ] `ProtectedRoute.jsx` created — redirects to `/login` (auth store always false for now)
- [ ] App runs on `localhost:5173` without errors

### Done Condition
`GET /api/health` returns 200. Frontend loads without console errors. `pytest` exits clean.

---

## M1 — Database + Models
**Goal:** Database connected, all tables created via migrations, models load correctly.
**Time estimate: 2 hrs**

### Backend
- [ ] SQLAlchemy configured, connected to local PostgreSQL via pgAdmin
- [ ] Alembic initialised (`alembic init migrations`)
- [ ] Models created:
  - `User` — id, email, password_hash, is_verified, created_at
  - `OTP` — id, user_id, code_hash, purpose (CHECK: signup/reset), expires_at, used
  - `Review` — id, user_id, pr_url, pr_title, pr_diff_size, share_code, status (CHECK: pending/completed/failed), result_json, error_message, created_at
  - `RefreshToken` — id, user_id, token_hash, expires_at, revoked
- [ ] First migration generated and applied — all 4 tables created
- [ ] `GET /api/health` updated — now also checks DB connectivity, returns `{ status: "ok", db: "connected" }`
- [ ] Test: health endpoint returns DB connected status

### Done Condition
`alembic upgrade head` runs clean. All 4 tables exist in DB. Health endpoint confirms DB connected.

> **Stability gate:** From this point, model changes require a new migration. We never edit the DB directly.

---

## M2 — Auth API (Backend Only)
**Goal:** Full auth flow working via API. Tested entirely with curl or pytest — no UI yet.
**Time estimate: 4 hrs**

### Schemas (Pydantic v2 — Python's equivalent of Zod)
Each schema is a `BaseModel` subclass. Parsing raises `ValidationError` on failure — caught globally by the error handler, returned as 422 with field-level detail. No manual validation in routes.

- [ ] `SignupInput` — `email: EmailStr`, `password: str (min_length=8)`
- [ ] `LoginInput` — `email: EmailStr`, `password: str`
- [ ] `OTPVerifyInput` — `email: EmailStr`, `code: str (6 digits)`, `purpose: Literal['signup', 'reset']`
- [ ] `ResetPasswordInput` — `email: EmailStr`
- [ ] `ResetPasswordConfirmInput` — `email: EmailStr`, `code: str`, `new_password: str (min_length=8)`

### Services
- [ ] `email_service.py` — Google SMTP wrapper using `smtplib`. Takes `to`, `subject`, `body`. Reads credentials from env. Tested with a real send to verify SMTP config.
- [ ] `auth_service.py`:
  - `signup(email, password)` — hashes password, creates unverified user, generates 6-digit OTP, hashes OTP, saves to `otps` table, calls email_service
  - `verify_otp(email, code, purpose)` — finds latest unused OTP for user+purpose, checks expiry, compares hash, marks used, flips `is_verified`
  - `login(email, password)` — checks verified status, compares password hash, issues access + refresh JWT
  - `refresh_token(token)` — validates refresh token against DB, issues new access token
  - `request_reset(email)` — generates reset OTP, emails it
  - `confirm_reset(email, code, new_password)` — verifies OTP, updates password hash
  - `logout(token)` — marks refresh token revoked

### Routes (`/api/auth/*`)
- [ ] `POST /signup` → auth_service.signup
- [ ] `POST /verify-otp` → auth_service.verify_otp
- [ ] `POST /login` → auth_service.login
- [ ] `POST /refresh` → auth_service.refresh_token
- [ ] `POST /reset-password` → auth_service.request_reset
- [ ] `POST /reset-password/confirm` → auth_service.confirm_reset
- [ ] `POST /logout` → auth_service.logout

### Middleware
- [ ] `auth_middleware.py` — `@require_auth` decorator: decodes JWT, attaches `user_id` to `g`. Returns 401 on invalid/expired token.

### Tests
- [ ] Signup creates unverified user + sends OTP
- [ ] Cannot login before OTP verified
- [ ] OTP expires after 10 minutes (mock `datetime.now`)
- [ ] OTP cannot be reused
- [ ] Login returns valid JWT pair
- [ ] Refresh issues new access token
- [ ] Revoked refresh token is rejected
- [ ] Password reset flow end-to-end

### Done Condition
All auth tests pass. Full flow testable via curl: signup → verify OTP → login → get token → refresh → logout.

> **Stability gate:** Auth API is now frozen. M3 onwards only consumes it — never modifies it.

---

## M3 — Auth UI (Frontend)
**Goal:** User can sign up, verify OTP, log in, reset password, and access a protected route.
**Time estimate: 3 hrs**

### State
- [ ] `authStore.js` (Zustand) — `accessToken`, `refreshToken`, `user`, `setAuth()`, `clearAuth()`
- [ ] Tokens persisted to `localStorage`, rehydrated on app load

### API
- [ ] `api/auth.js` — functions: `signup`, `verifyOtp`, `login`, `refresh`, `resetPassword`, `confirmReset`, `logout`
- [ ] Axios 401 interceptor in `client.js` — auto-calls `/refresh`, retries original request, on failure clears store and redirects to `/login`

### Pages
- [ ] `Signup.jsx` — form, OTP step shown after submit, calls verify-otp, redirects to dashboard
- [ ] `Login.jsx` — form, on success stores tokens, redirects to dashboard
- [ ] `ResetPassword.jsx` — email entry, then OTP + new password form
- [ ] `ProtectedRoute.jsx` — reads `authStore`, redirects to `/login` if no token
- [ ] `Dashboard.jsx` — shell with two tabs: [Review] and [History]. Both show "Coming soon" placeholders.

### Done Condition
Full auth flow works in browser. Refreshing dashboard keeps user logged in. `/dashboard` redirects to login if not authenticated.

> **Stability gate:** Auth UI is stable. No auth files touched again unless a bug is found.

---

## M4 — GitHub Service + PR Validation
**Goal:** Given a PR URL, the system fetches metadata, enforces the 500-line limit, and fetches the diff. No AI yet.
**Time estimate: 2.5 hrs**

### Schemas (Pydantic v2)
- [ ] `ReviewRequest` — `pr_url: str` with `@field_validator` enforcing regex `https://github.com/{owner}/{repo}/pull/{number}`. Raises `ValidationError` on mismatch → 422.
- [ ] `PRMetadata` — `title: str`, `additions: int`, `deletions: int`. GitHub API response parsed into this before use — raw dicts never passed around.

### Service
- [ ] `github_service.py`:
  - `parse_pr_url(url)` → extracts owner, repo, pr_number or raises `InvalidPRURLError`
  - `fetch_pr_metadata(owner, repo, number)` → calls GitHub API, returns title + additions + deletions. Raises `PrivateRepoError` on 404, `GitHubRateLimitError` on 403.
  - `check_size_limit(additions, deletions)` → raises `PRTooLargeError` if total > 500
  - `fetch_pr_diff(owner, repo, number)` → fetches raw diff text with `Accept: application/vnd.github.v3.diff`

### Typed Exceptions
- [ ] `InvalidPRURLError` → 422
- [ ] `PrivateRepoError` → 422
- [ ] `GitHubRateLimitError` → 429
- [ ] `PRTooLargeError` → 422

All wired into `error_handler.py`.

### Routes
- [ ] `POST /api/reviews` (non-streaming stub) — validates input schema, calls github_service steps, returns PR metadata as confirmation. No AI call yet.

### Frontend
- [ ] `ReviewForm.jsx` — PR URL input, client-side URL format validation (mirrors server regex), Scan button, displays error messages for all typed error cases

### Tests
- [ ] Valid PR URL parses correctly
- [ ] Invalid URL format returns 422
- [ ] Private repo (mocked 404) returns correct error
- [ ] Rate limit (mocked 403) returns correct error
- [ ] PR with 501 lines returns PRTooLargeError
- [ ] PR with exactly 500 lines passes

### Done Condition
`POST /api/reviews` with a valid public PR URL returns PR title and line count. All error cases return correct HTTP codes and messages. Frontend shows correct error for each case.

> **Stability gate:** GitHub service is locked. AI service in M5 calls it — never modifies it.

---

## M5 — AI Review Engine (Non-Streaming)
**Goal:** Full review generated end-to-end, saved to DB, returned in response. No streaming yet — response waits until complete.
**Time estimate: 4 hrs**

### Schema (Pydantic v2 — the most critical validation boundary)
- [ ] `AIReviewOutput(BaseModel)` — parses and validates the full accumulated stream JSON before any DB write. If OpenAI returns a malformed structure, wrong types, or missing fields, Pydantic raises `ValidationError` → review marked `failed`. AI output is never trusted blindly.

  Validated structure:
  ```
  summary: str
  architecture: { observations: str, score: int (1-5) }
  quality: { observations: str, score: int (1-5) }
  correctness: { observations: str, score: int (1-5) }
  security: { observations: str, score: int (1-5) }
  error_handling: { observations: str, score: int (1-5) }
  overall_score: float
  ```

### Service
- [ ] `ai_service.py`:
  - `build_system_prompt()` → returns the system prompt instructing GPT-4o to respond in the exact JSON structure matching `AIReviewOutput`. Prompt lives here, not in routes.
  - `build_user_prompt(pr_title, diff_text)` → formats the actual content for review
  - `generate_review(pr_title, diff_text)` → calls OpenAI (non-streaming for now), returns raw response string

- [ ] `review_service.py` (full orchestration):
  1. Validate PR URL
  2. Fetch metadata → check size limit
  3. Create `Review` row with `status = 'pending'`
  4. Fetch diff
  5. Call `ai_service.generate_review()`
  6. Parse + validate response against `AIReviewOutput`
  7. If valid → update review: `status = 'completed'`, `result_json = output`
  8. If invalid → update review: `status = 'failed'`, `error_message = validation error`
  9. Return review object

### Routes
- [ ] `POST /api/reviews` — full flow, returns complete review JSON
- [ ] `GET /api/reviews/:id` — returns saved review by ID (requires auth, user must own review)
- [ ] `GET /api/reviews` — returns list of user's reviews for history

### Frontend
- [ ] `ReviewResult.jsx` — renders all sections of the review statically (no streaming yet)
- [ ] `api/reviews.js` — `submitReview(prUrl)`, `getReview(id)`, `getReviews()`
- [ ] Dashboard Review tab wired: form → submit → show result

### Tests
- [ ] Full review pipeline with mocked GitHub + mocked OpenAI
- [ ] DB state is `completed` after successful review
- [ ] DB state is `failed` if AI returns malformed JSON
- [ ] `GET /api/reviews/:id` returns 403 if user doesn't own the review
- [ ] Re-fetching same review returns saved result (no re-generation)

### Done Condition
Submit a real PR URL in the browser. Full review renders on screen. DB row shows `status = completed`. Revisiting the review page loads from DB, not from OpenAI.

> **Stability gate:** Review pipeline is working. M6 only changes the transport layer (streaming), not the logic.

---

## M6 — Streaming
**Goal:** Same review, same data, same DB result — but now delivered token-by-token over SSE. No logic changes, only transport changes.
**Time estimate: 3 hrs**

### Backend
- [ ] `ai_service.py` — add `generate_review_stream(pr_title, diff_text)` → generator that yields string tokens using `stream=True`. Original `generate_review()` kept intact (used in tests).
- [ ] `review_service.py` — add `stream_review(pr_url, user_id)`:
  - Same orchestration as M5 up to step 4
  - Calls `generate_review_stream()` instead
  - Yields SSE events: `data: {"token": "..."}` per token
  - Accumulates full text in memory
  - On stream end: validates + saves to DB (same as M5 steps 6–8)
  - Yields final event: `data: {"done": true, "review_id": "..."}`
  - On any error mid-stream: yields `data: {"error": "..."}`, marks review failed
- [ ] `POST /api/reviews` route updated to return `Response(stream_review(...), mimetype='text/event-stream')`
- [ ] `GET /api/reviews/:id` and `GET /api/reviews` unchanged — M5 routes untouched

### Frontend
- [ ] `useReviewStream.js` hook:
  - Opens SSE connection to `POST /api/reviews`
  - Accumulates tokens into state
  - Sets `isDone = true` on `done` event, stores `review_id`
  - Sets `error` on error event
  - Exposes: `{ content, isDone, error, reviewId, start }`
- [ ] `ReviewResult.jsx` updated — renders progressively as `content` grows. Sections appear as their headers are streamed.
- [ ] Loading state shown while streaming. "Copy share link" button appears only after `isDone = true`.

### Tests
- [ ] Stream yields tokens in correct SSE format
- [ ] DB state is `completed` after stream ends
- [ ] DB state is `failed` if stream errors mid-way
- [ ] `GET /api/reviews/:id` still works (M5 test re-runs, must pass)

### Done Condition
Review streams live in the browser, section by section. DB state is identical to M5. All M5 tests still pass.

> **Stability gate:** Streaming is additive. Non-streaming GET routes are completely unchanged.

---

## M7 — Share Links + History
**Goal:** Users can share reviews via protected links. History tab lists all past reviews.
**Time estimate: 2.5 hrs**

### Backend
- [ ] `share_code` generated using `secrets.token_hex(6)` at review creation time (wired in M5, exposed now)
- [ ] `GET /api/share/:hex` — requires auth, finds review by `share_code`, returns full review. Returns 404 if not found.
- [ ] `GET /api/reviews` — already exists from M5, confirm it returns `share_code` in response

### Frontend
- [ ] `ShareButton.jsx` — copies `/share/{share_code}` to clipboard, shows "Copied!" confirmation
- [ ] `ShareView.jsx` — fetches review from `/api/share/:hex`, renders using `ReviewResult.jsx` (already built). Protected by `ProtectedRoute`.
- [ ] `Dashboard/History` tab — calls `getReviews()`, renders list of `ReviewCard` components
- [ ] `ReviewCard.jsx` — shows PR title, date, summary snippet, link to full review

### Tests
- [ ] Share link resolves to correct review
- [ ] Share link requires auth (401 if no token)
- [ ] share_code is unique per review
- [ ] History returns only reviews belonging to the requesting user

### Done Condition
Share link copied from review page opens the same review when visited (logged in). History shows all past reviews. Visiting history item opens full review.

---

## M8 — Error Handling + Observability Polish
**Goal:** Every error path returns the correct shape, correct HTTP code, and a user-readable message. No silent failures.
**Time estimate: 2 hrs**

### Backend
- [ ] Audit all typed exceptions — ensure every one is registered in `error_handler.py`
- [ ] Unhandled exceptions catch-all — returns 500 with generic message, logs full traceback
- [ ] `GET /api/health` final version — checks: DB ping, OpenAI key present, SMTP config present. Returns `{ status, db, ai, email }`.
- [ ] Review `status` field audited — confirm no review can be stuck in `pending` indefinitely. Add a note in README about this known limitation (no timeout worker).
- [ ] All 401 responses include `{ code: "TOKEN_EXPIRED" | "TOKEN_INVALID" | "TOKEN_MISSING" }` — frontend uses this to decide whether to refresh or redirect.

### Frontend
- [ ] Toast or inline error display for all API error codes
- [ ] Loading states on all async actions (submit, history fetch, share load)
- [ ] Empty state for history (no reviews yet)
- [ ] "PR too large" error shown inline below the URL input (not a generic alert)

### Done Condition
Every listed error from `architecture.md` error table returns the correct HTTP code and message. No unhandled promise rejections in browser console.

---

## M9 — Tests + Verification
**Goal:** Test suite covers all service layers. No test makes real API calls. All existing tests still pass.
**Time estimate: 3 hrs**

### Backend
- [ ] `conftest.py` — test DB (SQLite in-memory), mocked OpenAI client (returns fixture response), mocked GitHub responses (fixture JSON files per scenario)
- [ ] Re-run all milestone tests together — confirm no regressions
- [ ] Coverage check — aim for 80%+ on `services/` directory
- [ ] Add any missing edge case tests discovered during audit:
  - OTP with wrong purpose rejected
  - Review owned by user A not accessible by user B
  - Concurrent review submissions don't conflict
  - Malformed AI JSON fails gracefully

### Frontend
- [ ] Manual test checklist — walk through every user flow end-to-end in browser:
  - Signup → OTP → Dashboard
  - Submit valid PR → see stream → copy share link
  - Visit share link → see review
  - Submit PR > 500 lines → see error
  - Submit private repo → see error
  - History shows all reviews
  - Logout → protected routes redirect
  - Token expiry → auto-refresh works

### Done Condition
`pytest` exits with 0 failures. Manual checklist fully checked. No regressions from any prior milestone.

---

## M10 — Deployment
**Goal:** System live on Vercel + Render + Supabase. Environment variables set. Both apps communicate correctly.
**Time estimate: 3 hrs**

### Database (Supabase)
- [ ] Create Supabase project
- [ ] Run `alembic upgrade head` against Supabase connection string
- [ ] Confirm all 4 tables created in Supabase dashboard
- [ ] Connection pooling mode set to `transaction` (Supabase requirement for SQLAlchemy)

### Backend (Render)
- [ ] Create Render web service, connect to GitHub repo, set root to `server/`
- [ ] Set all env vars: `DATABASE_URL`, `OPENAI_API_KEY`, `JWT_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `FRONTEND_URL` (for CORS)
- [ ] CORS configured in Flask — allow only Vercel domain in production
- [ ] `GET /api/health` returns healthy on live Render URL
- [ ] Confirm SSE streaming works on Render (disable response buffering — `X-Accel-Buffering: no` header)

### Frontend (Vercel)
- [ ] Create Vercel project, connect to GitHub repo, set root to `web/`
- [ ] Set env vars: `VITE_API_BASE_URL` = Render URL
- [ ] Deploy, confirm app loads
- [ ] Run manual test checklist against production URLs
- [ ] Confirm streaming works end-to-end in production

### Done Condition
Full user flow works on production URLs. Health endpoint confirms all services connected. Streaming renders correctly in production browser.

> **Critical check:** SSE streaming on Render requires response buffering disabled. Test this explicitly — it's a common production-only failure.

---

## M11 — AI Guidance + Final Documentation
**Goal:** `claude.md`, `README.md`, and `architecture.md` are complete, accurate, and ready for submission.
**Time estimate: 2 hrs**

### `claude.md`
- [ ] Documents all constraints for AI agents working on this codebase:
  - Route → Service boundary (no logic in routes)
  - AI output must always be validated before DB write
  - New columns require Alembic migration
  - Tests must mock `ai_service` and `github_service`
  - `share_code` uses `secrets.token_hex()` only
  - Secrets via env vars only — never in code
  - Error handler is single source of truth for HTTP codes
  - Streaming route must always yield a final `done` or `error` event

### `README.md`
- [ ] Project overview (2–3 sentences)
- [ ] Local setup: backend, frontend, DB
- [ ] Required env vars (reference `.env.example`)
- [ ] Gmail App Password setup instructions
- [ ] How to run tests
- [ ] Production URLs
- [ ] Known limitations (from plan.md)
- [ ] Key technical decisions (reference architecture.md)

### Final Checks
- [ ] No secrets committed to repo (audit `.env`, `.gitignore`)
- [ ] `.env.example` has all keys with placeholder values
- [ ] `architecture.md` and `plan.md` committed to repo root
- [ ] Repo is public or shareable with assessors

### Done Condition
A new developer can clone the repo, follow the README, and run the project locally in under 10 minutes.

---

## Incremental Safety Rules

These apply across every milestone without exception:

1. **Never modify a completed service to add a new feature** — extend it or add a new method. Existing method signatures don't change.
2. **Never change a DB model without a migration** — even a small column addition needs `alembic revision`.
3. **Every new route gets a test before moving to the next milestone.**
4. **Run the full test suite before starting each new milestone.** If anything is red, fix it first.
5. **The `GET /api/reviews` and `GET /api/reviews/:id` endpoints are frozen after M5** — share and history features only add new endpoints, never modify existing ones.
6. **Streaming (M6) is purely additive** — non-streaming paths are kept for tests. Nothing from M5 is deleted.
7. **Frontend API client (`api/`) is the only place that talks to the backend** — components never call `fetch` or `axios` directly.

---

## Contingency — If Time Runs Short

If the 48-hour window is tighter than expected, cut in this order (least to most impactful):

| Cut | Impact |
|---|---|
| Skip password reset UI (keep API) | Minor — mention in walkthrough |
| Skip History tab | Minor — share links still work |
| Skip deployment to Render/Vercel | Moderate — demo locally, record walkthrough locally |
| Simplify AI output to 3 sections instead of 6 | Low — schema stays valid, just fewer fields |
| Remove refresh token rotation (keep access token only) | Moderate — note as known security tradeoff |

**Never cut:** Tests, error handling, AI output validation, streaming, `claude.md`.

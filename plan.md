# plan.md — AI Code Review Bot
> Better Software — Associate Software Engineer Assessment
> Candidate: Prashant Singh Hooda

---

## What We're Building

An AI-powered code review tool for developers. You paste a **public GitHub PR URL**, and the system fetches the diff, sends it to OpenAI, and returns a structured, detailed review covering architecture, security, quality, and more. Reviews are saved, shareable via protected links, and tied to your account.

---

## Who It's For

Developers who want fast, structured AI feedback on their pull requests — without leaving their workflow to prompt ChatGPT manually.

---

## Core User Flow

```
Sign up / Log in
    ↓
Dashboard → [Review] tab
    ↓
Paste a public GitHub PR URL → Click Scan
    ↓
System fetches PR diff from GitHub API (no auth needed for public repos)
    ↓
Diff sent to OpenAI → Structured review generated
    ↓
Review saved to DB → Displayed on screen
    ↓
User can share it → Gets a /share/<hex_code> link
    ↓
Shareable link is auth-protected (viewer must be logged in)
    ↓
[History] tab shows all past reviews for the user
```

---

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Landing / Home page |
| `/login` | Login with email + password |
| `/signup` | Signup with email OTP verification (Nodemailer) |
| `/reset-password` | Request reset OTP via email |
| `/reset-password/confirm` | Enter OTP + set new password |
| `/dashboard` | Main app shell (protected) |
| `/dashboard/review` | Submit PR URL, view live result |
| `/dashboard/history` | List of all past reviews |
| `/share/:hex` | View a shared review (auth-protected) |

---

## Features

### Auth
- Email + Password signup
- OTP via email on signup (Nodemailer / SMTP)
- Password reset via email OTP
- JWT-based sessions (access token + refresh token)
- Protected routes on frontend and backend

### Review Engine
- Accepts public GitHub PR URLs only
- Validates URL format before calling GitHub API
- Fetches PR metadata + diff via GitHub REST API (unauthenticated, public repos only)
- **PR size limit: ≤ 500 lines changed** (additions + deletions). Checked upfront via PR metadata before fetching diff. Clear error shown if exceeded — "This PR is too large for review. Please submit a PR with fewer than 500 changed lines."
- Sends structured prompt to OpenAI (GPT-4o) with `stream=True`
- **Streaming response** — Flask streams via `text/event-stream` (SSE), frontend consumes via Vercel AI SDK for a live typewriter-style review experience
- Returns a detailed review with the following sections:
  - **Summary** — what this PR does in plain English
  - **Architecture & Patterns** — design decisions, structure observations
  - **Code Quality & Maintainability** — readability, duplication, naming
  - **Correctness** — logic bugs, edge cases, off-by-one errors
  - **Security** — vulnerabilities, injection risks, secrets exposure
  - **Error Handling** — missing try/catch, unhandled edge cases
  - **Overall Score** — a simple rating per category (1–5)
- Result is saved to DB — no re-generation on revisit
- Graceful error if PR is from a private repo (clear user feedback)

### Sharing
- Each review has a unique `share_code` (hex, e.g. `a3f9c2`)
- Shareable link: `/share/<share_code>`
- Viewing a shared review requires login (no anonymous access)
- Share link is copyable from the review page

### History
- Lists all reviews the user has ever run
- Shows PR URL, date, overall summary snippet
- Click to re-open full review

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) — deployed on Vercel |
| Backend | Python + Flask — deployed on Render |
| Validation (backend) | Pydantic v2 — schema validation for all API input, GitHub responses, and AI output. Python's equivalent of Zod. |
| Validation (frontend) | Zod — client-side schema validation mirroring server rules |
| Database | PostgreSQL via Supabase (prod) / local pgAdmin (dev) |
| Auth | JWT (access + refresh tokens), OTP emails via Google SMTP |
| AI | OpenAI API (GPT-4o) with streaming (`stream=True`) |
| Streaming | Flask SSE (`text/event-stream`) → Vercel AI SDK on frontend |
| GitHub Data | GitHub REST API (public, no token needed) |
| Email | Nodemailer-style via Google SMTP (Gmail App Password) |

---

## What We Are NOT Building (Scope Boundaries)

- No GitHub OAuth / app installation
- No private repo support
- No team/org accounts
- No webhook-based auto-review
- No in-line comment posting back to GitHub
- No billing or usage limits (out of scope for assessment)

---

## How This Scores Against the Evaluation Criteria

| Criteria | Our approach |
|---|---|
| **Structure** | Routes → Services → Models → Schemas. AI logic fully isolated in `ai_service.py` |
| **Simplicity** | Each module does one thing. No clever abstractions |
| **Correctness** | DB constraints enforce valid states. AI output validated before DB write |
| **Interface Safety** | Pydantic v2 schemas on all API input + AI output (Python's Zod equivalent). Zod on frontend. URL validation before GitHub call. |
| **Change Resilience** | Swapping OpenAI model = change in one file. New review section = no DB migration |
| **Verification** | Unit tests for services (AI mocked), integration tests for routes |
| **Observability** | Structured error responses, `/health` endpoint, logged failures |
| **AI Guidance** | `claude.md` constrains AI agent behavior throughout development |
| **AI Usage** | All AI-generated code reviewed, tested, and validated before use |

---

## Deployment Plan

- **Frontend** → Vercel (auto-deploy from `main` branch)
- **Backend** → Render (Docker or native Python)
- **DB** → Supabase PostgreSQL (prod), local pgAdmin (dev)
- **Env vars** → `.env` locally, platform env vars on Vercel/Render

---

## Out of Scope / Known Limitations (to mention in walkthrough)

- **Google SMTP** — requires Gmail App Password (2FA enabled on sender account). Noted in README setup guide.
- **Streaming** — review streams token-by-token via SSE. Full review saved to DB only after stream completes successfully
- No queue/worker needed — streaming handles perceived performance
- Shareable links require login — intentional tradeoff (privacy over convenience)
- GitHub API has rate limits for unauthenticated requests (~60/hr per IP) — acceptable for assessment scale
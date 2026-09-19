# CivicSolve AI

**“From Citizen Problems to Collaborative Solutions”**

An AI-powered civic innovation platform connecting **citizens, universities and industries** to transform real-world
societal problems into measurable solutions.

Built for **SIH26043 — Digital Platform to Crowdsource Societal Problems and Connect Them With Universities & Industry.**

---

## ⚠️ Important note about the runtime stack

The brief asked for **React + Vite** and a **Java / Spring Boot** backend. This sandbox can only build, start and
health-check a **single Next.js (App Router) + PostgreSQL** process — there is no JVM/Maven runtime or second server
port available, so a Spring Boot service could not be started or validated here.

To still deliver a **fully functional end-to-end product** (not a mock UI), the application is implemented as:

| Requested (Spring Boot)              | Delivered here (runnable)                                    |
| ------------------------------------ | ------------------------------------------------------------ |
| `controller/` (`@RestController`)    | `src/app/api/**/route.ts` (thin HTTP handlers)                |
| `service/`                           | `src/server/service/*` (all business logic)                   |
| `repository/` (Spring Data JPA)      | `src/server/service/challengeQueries.ts` + Drizzle queries    |
| `entity/` (JPA entities + Hibernate) | `src/db/schema.ts` (typed PostgreSQL tables)                  |
| `dto/` + Jakarta Bean Validation     | `src/server/dto/validate.ts`                                  |
| `security/` (Spring Security + JWT)  | `src/server/security/auth.ts` (JWT + BCrypt + role guards)    |
| `exception/` (`@ControllerAdvice`)   | `src/server/exception/http.ts` (global error handler)         |
| `ai/`                                | `src/server/ai/analysisEngine.ts`                             |
| `matching/`                          | `src/server/matching/matchingEngine.ts`                       |
| React + Vite SPA                     | React 19 client components under `src/app/**` (axios + Recharts) |

Every architectural rule from the brief is respected: **thin controllers, business logic in services, repositories for
data access, DTO validation, JWT auth, role-based authorization, ownership checks and one canonical table per entity**.
The REST contract is identical to the requested Spring Boot API, so a Java backend can be dropped in behind
`NEXT_PUBLIC_API_BASE_URL` without touching the UI.

---

## Core workflow

```
Citizen → Report Problem → AI Understands → Classify → Duplicate Detection → Priority
       → Required Expertise → University Matching → University Accepts → Project
       → Milestones → Industry Collaboration → Progress → Implementation
       → Citizen Feedback → Impact Report
```

Traditional systems stop at `Citizen → Complaint → Authority → Status`.
CivicSolve closes the loop: `Citizen → AI → University → Industry → Project → Implementation → Citizen Validation`.

## Features

- **4 roles with separate dashboards** — Citizen, University, Industry, Admin.
- **Citizen ownership guarantee** — `GET /api/challenges/my` filters `WHERE citizen_id = <JWT user id>` in the backend.
- **8 regional languages** (English, Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali) stored per user.
- **Voice input** with the browser Web Speech API (speech → text → edit → submit, graceful permission fallback).
- **IVR prototype** (`*#437`) — simulated language → category → description → confirm → complaint code, persisted in `ivr_sessions`.
- **AI Problem Intelligence** — category, subcategory, summary, impact, expertise, confidence, explainable priority.
- **Explainable priority score (0–100)** — severity 25 + urgency 20 + people 20 + duration 15 + safety 20, with geographic and community-vote boosts. `90+ CRITICAL / 75+ HIGH / 50+ MEDIUM / <50 LOW`.
- **Semantic duplicate detection** — synonym-expanded concept overlap + category + location; duplicates are **flagged, never deleted**.
- **University matching** with reasons (departments, research areas, skills, faculty, student teams, track record, region).
- **Industry matching** with reasons (technology, domain, support types, deployment capability).
- **University acceptance** persisted in `challenge_matches` (status + `accepted_at`) → project auto-created with 7 milestones.
- **Project lifecycle** events, milestones, progress updates, messaging, industry support, impact report.
- **Community voting** (one vote per citizen, enforced by a unique index) feeding priority.
- **Notifications** for every lifecycle event, with delivery records.
- **Citizen feedback** (1–5 stars, resolved yes/no, comment, suggestion) as the final validation layer.
- **Analytics** with Recharts: category, priority, status, monthly trend, university/industry participation, satisfaction, top-voted.

## Technology

React 19 · TypeScript · Tailwind CSS · Axios · Recharts · Lucide React · Next.js App Router (REST API layer) ·
PostgreSQL · Drizzle ORM (typed SQL / migrations) · JWT (jose) · BCrypt.

## Database (one canonical table per entity)

`users`, `universities_expertise`, `industry_expertise`, `challenges`, `challenge_ai_analysis`,
`challenge_duplicates`, `challenge_matches`, `challenge_lifecycle_events`, `challenge_votes`, `projects`,
`project_members`, `project_milestones`, `project_progress_updates`, `project_messages`, `industry_support`,
`citizen_satisfaction`, `community_feedback`, `notifications`, `notification_deliveries`, `ivr_sessions`,
`call_requests`, `impact_reports`, `funding_transactions`, `essential_services`, `service_providers`, `audit_logs`.

Key relationships (all real foreign keys, never name matching):

```
users 1─* challenges 1─1 challenge_ai_analysis
              │            1─* challenge_duplicates
              │            1─* challenge_matches (university acceptance)
              │            1─* challenge_lifecycle_events
              └──1─1 projects ─┬─* project_milestones
                               ├─* project_progress_updates
                               ├─* project_members / project_messages
                               ├─* industry_support
                               └─1 impact_reports
challenges 1─* citizen_satisfaction
```

**One problem = one challenge ID**, reused by analysis, duplicates, matches, acceptance, project, milestones,
progress, industry support, notifications, feedback and impact report.

## Setup

```bash
# 1. Install
npm install

# 2. Environment
cp .env.example .env      # set DATABASE_URL, JWT_SECRET, (optional) AI_API_KEY

# 3. Apply the schema (no destructive drops)
npx drizzle-kit push

# 4. Load seed / demo data (idempotent)
npx tsx src/db/seed.ts        # or: curl -X POST http://localhost:3000/api/seed

# 5. Run
npm run dev      # development
npm run build && npm run start   # production
```

Health check: `GET /api/health`.

### Environment variables

| Variable                   | Purpose                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`             | PostgreSQL connection (Spring: `SPRING_DATASOURCE_URL`)     |
| `DB_USERNAME` / `DB_PASSWORD` | Datasource credentials                                   |
| `JWT_SECRET`               | HMAC signing secret for JWTs                                |
| `AI_API_KEY`               | Optional LLM provider key — omit to use the fallback engine |
| `AI_API_BASE_URL`, `AI_MODEL` | Provider configuration                                   |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API base (Vite equivalent: `VITE_API_BASE_URL`)    |

Secrets are **only** read server-side; nothing sensitive is exposed to the browser bundle.

## Demo credentials (seed data — all marked `is_seed = true`)

| Role       | Email                                | Password   |
| ---------- | ------------------------------------ | ---------- |
| Citizen    | `priya.citizen@civicsolve.in`        | `demo1234` |
| Citizen    | `ravi.citizen@civicsolve.in`         | `demo1234` |
| University | `abc.university@civicsolve.in`       | `demo1234` |
| University | `xyz.university@civicsolve.in`       | `demo1234` |
| Industry   | `urbaniot.industry@civicsolve.in`    | `demo1234` |
| Industry   | `gridsense.industry@civicsolve.in`   | `demo1234` |
| Admin      | `admin@civicsolve.in`                | `demo1234` |

Seed contents: 6 citizens · 3 universities · 3 industries · 12 challenges · 5 projects (one fully completed with
citizen validation + impact report).

## API overview

```
POST /api/auth/register            POST /api/auth/login
GET  /api/users/me                 PUT  /api/users/me

POST /api/challenges               GET  /api/challenges
GET  /api/challenges/my            GET/PUT /api/challenges/{id}
POST /api/challenges/{id}/analyze  GET  /api/challenges/{id}/analysis
GET  /api/challenges/{id}/duplicates
GET  /api/challenges/{id}/matches  POST /api/challenges/{id}/accept
POST /api/challenges/{id}/vote     GET/POST /api/challenges/{id}/feedback

GET  /api/universities             GET  /api/universities/recommended
GET  /api/industry/recommended

GET/POST /api/projects             GET  /api/projects/{id}
GET/POST /api/projects/{id}/milestones     PUT /api/milestones/{id}
POST /api/projects/{id}/progress
GET/POST /api/projects/{id}/industry-support
POST /api/industry-support/{id}/accept
GET/POST /api/projects/{id}/messages

GET  /api/notifications            PUT  /api/notifications/{id}/read
GET  /api/analytics                GET  /api/impact-reports
GET  /api/admin/users
POST /api/ivr/sessions             PUT  /api/ivr/sessions/{id}
POST /api/seed                     GET  /api/health
```

Errors use proper status codes (400 / 401 / 403 / 404 / 409 / 500) with friendly messages — stack traces and SQL are
never returned to the client.

## AI workflow

1. `POST /api/challenges` → `ChallengeService.createChallenge()`
2. `AIAnalysisService.analyzeProblem()` — provider call if `AI_API_KEY` is set, otherwise the deterministic engine
3. Structured result saved to `challenge_ai_analysis`; challenge category/priority updated
4. `DuplicateDetectionService.detectDuplicates()` → `challenge_duplicates` (flagged)
5. `UniversityMatchingService.generateMatches()` → `challenge_matches` + notifications
6. React renders the analysis, the explainable priority factors, duplicates and matches

Example output:

```json
{
  "category": "Infrastructure",
  "subcategory": "Road Safety",
  "summary": "Road damage causing safety risks",
  "priorityScore": 87,
  "priorityLevel": "HIGH",
  "requiredExpertise": ["Civil Engineering", "Transportation", "Road Safety"],
  "confidence": 0.89
}
```

## Hackathon demo script

1. Login as **Citizen** (`priya.citizen@civicsolve.in` / `demo1234`).
2. **Report a Problem** (or press the mic): *“There are large potholes near our college and students are facing accidents.”*
3. AI returns Infrastructure / Road Safety, a HIGH–CRITICAL priority with visible score factors and required expertise.
4. A **possible duplicate** is shown with a similarity percentage and the related complaint code.
5. **University matches** are listed with match % and reasons.
6. Logout → login as **University** (`abc.university@civicsolve.in`).
7. Open *Recommended* → view the challenge → **Accept Challenge** (project + 7 milestones created automatically).
8. In the project workspace: start/complete milestones, add a milestone, post a progress update.
9. Login as **Industry** (`urbaniot.industry@civicsolve.in`) → *Recommended Projects* → **Support Project**.
10. Login back as **Citizen** → the problem now shows *Accepted by ABC University*, the project title and live progress.
11. Push progress to 100% (university) → project completed, impact report generated, citizen notified.
12. Citizen submits **feedback** (stars + resolved + comment) → status becomes `CITIZEN_VALIDATION`.
13. Login as **Admin** → analytics, impact reports and platform-wide governance views.

## Tested guarantees

- Citizen A sees only Citizen A’s problems in *My Problems*; Citizen B never sees them (server-side filter).
- University acceptance is persisted (`challenge_matches.status = ACCEPTED`, `accepted_at`) and visible to the citizen.
- The project references the same challenge ID; milestones, progress, industry support, notifications, feedback and
  the impact report all hang off that single ID.
- Votes are unique per citizen; duplicate votes return `409`.
- Role guards: only universities can accept challenges, only owners/admins can edit a challenge, only project
  participants can read/write project messages.

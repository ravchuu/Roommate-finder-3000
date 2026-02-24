# Roommate Finder

A full-stack web app for schools and organizations to run roommate matching: admins manage roster, room config, rooming groups, and settings; students complete a lifestyle survey and Big Five personality assessment, see compatibility scores with every other student, and find roommates. Built for clarity and grading.

**Tech stack:** Next.js (App Router), NextAuth, Prisma, SQLite (dev) / file DB on Railway. TypeScript throughout.

---

## For professors / evaluators (grading)

- **Demo credentials and step-by-step flow:** **[DEMO.md](./DEMO.md)** — log in as **Demo Admin**, then **claim** and use **Demo Student** (onboarding, dashboard, Find Roommates, Requests, Messages, My Group).
- **Quick local run:** clone → `npm install` → create `.env` with `DATABASE_URL="file:./dev.db"` and `AUTH_SECRET` → `npx prisma db push` → `npm run db:seed` → `npm run dev` → open http://localhost:3000. Detailed steps: **[GETTING_STARTED.md](./GETTING_STARTED.md)**.
- **Production:** If deployed on Railway, the live URL is in the repo’s deployment docs; seed must be run once on the production DB (see [Deploy to Railway](#deploy-to-railway) below).

### Demo credentials (summary)

| Role | Where | Credentials |
|------|--------|-------------|
| **Demo Admin** | `/admin/login` | Email: `demo.admin@westfield.edu` · Password: `admin123` |
| **Demo Student** | Claim at `/claim`, then `/login` | Org: `westfield` · Email: `demo.student@westfield.edu` · Claim token: `demo-claim-token` · Password: `student123` |
| **Other students** | `/login` | Org: `westfield` · Email: `firstname.lastname@university.edu` (e.g. `alex.chen@university.edu`) · Password: `student123` |

---

## Compatibility algorithm (what’s implemented)

The **Find Roommates** list shows every claimed student in the org (except yourself), **ranked by a 0–100 compatibility score**. The score combines **lifestyle fit** and **Big Five personality fit**. No ML training — deterministic from survey and Big Five inputs.

### 1. Lifestyle similarity (65% of final score)

- **Traits:** bedtime, wake time, cleanliness (1–5), guest frequency, noise tolerance, space usage, roommate relationship preference, conflict style, room size preference.
- **Computation:** Ordinal traits use position-in-scale similarity \(1 - |i - j| / (L-1)\). Numeric (e.g. cleanliness) uses \(1 - |a - b| / \text{range}\). Room size: 1 if preferred sizes overlap, else 0.
- **Per-trait weights:** Stored per student in `MatchWeight` (default 1.0); used as \( \sum (\text{similarity}_k \cdot w_k) / \sum w_k \) to get a single lifestyle score in [0, 1].

### 2. Big Five personality (35% of final score)

- **Traits:** Openness (O), Conscientiousness (C), Extraversion (E), Agreeableness (A), Emotional stability / low Neuroticism (N), each 0–100.
- **Trait weights (roommate-focused):** Agreeableness 1.3, Conscientiousness 1.25, Neuroticism 1.15, others 1.0 — to emphasize cooperation and cleanliness.
- **Similarity:** Base \(1 - |a - b|/100\) per trait. **Agreeableness:** penalty if large mismatch (conflict risk). **Neuroticism:** blend of similarity and “both low is better” (emotional stability).
- **Overall Big Five score:** Weighted average of trait scores, then combined with lifestyle.

### 3. Final score

\[
\text{score} = 0.65 \times \text{lifestyleScore} + 0.35 \times \text{bigFiveScore}
\]

Rounded to 0–100 and shown on each roommate card. The UI also shows a short **explanation** (top lifestyle alignments and personality notes). Code: `lib/compatibility.ts`; API: `app/api/compatibility/route.ts`.

### 4. Room assignment (admin / auto-assign)

A separate **room-assignment** model for partitioning students into fixed-size rooms (greedy + local search) is described in **[ROOMMATE-ASSIGNMENT-ALGORITHM.md](./ROOMMATE-ASSIGNMENT-ALGORITHM.md)**. The current “Find Roommates” ranking uses the compatibility algorithm above; the assignment doc is for the admin rooming/auto-assign step.

---

## Architecture and project layout

- **Auth:** NextAuth with credentials (org code + email + password). Separate admin vs student sessions; claim flow for unclaimed student profiles.
- **Data:** Prisma + SQLite (dev). One `Organization`; `Student`, `SurveyResponse`, `MatchWeight`, `RoommateRequest`, `Group`, `GroupMember`, `Invite`, `RoomConfig`, etc. Seed creates one demo org, 100 students, room configs, groups, and demo accounts.
- **App structure:**
  - `app/` — App Router: `(admin)/`, `(student)/`, `(onboarding)/`, API routes under `app/api/`.
  - `lib/` — `compatibility.ts` (scoring), `auth.ts`, `db.ts`, `survey-questions.ts`, `auto-assign.ts`, etc.
  - `components/` — Shared UI (e.g. layout, sidebar, cards, forms).
  - `prisma/` — `schema.prisma`, `seed.ts`.

---

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:seed` | Seed demo org, students, demo accounts (resets seed data) |
| `npx prisma db push` | Sync schema to database |
| `npx prisma studio` | Open Prisma Studio to browse/edit DB |

---

## Deploy to Railway

1. **Connect repo:** Railway → New Project → Deploy from GitHub repo → select this repo.
2. **Persistent DB:** Add a **Volume** with mount path `/data`. Set `DATABASE_URL=file:/data/sqlite.db` in Variables.
3. **Env:** Add `AUTH_SECRET` (e.g. `npx auth secret`) and `NEXTAUTH_URL` = your Railway app URL (no trailing slash).
4. **Build/Start:** Build: `npm run build`, Start: `npm start`.
5. **One-time seed on production:** After first deploy, run migrations and seed on Railway (e.g. Railway Shell or CLI: `railway run npx prisma db push`, `railway run npx tsx prisma/seed.ts`).

Detailed steps: **[DEPLOY.md](./DEPLOY.md)** and **[RAILWAY-NEXT-STEPS.md](./RAILWAY-NEXT-STEPS.md)**. Pushing to the connected branch (e.g. `main`) triggers a new deploy.

---

## What to grade (checklist for evaluators)

- **Admin:** Login, dashboard, roster (students), room config, rooming (groups), standards (e.g. housing type).  
- **Student:** Claim flow, onboarding (profile, room size, lifestyle + Big Five), dashboard, **Find Roommates** (compatibility ranking and explanation), **Requests** (sent), **Messages**, **My Group**.  
- **Algorithm:** Compatibility is transparent: lifestyle + Big Five, weighted combination; see `lib/compatibility.ts` and [Compatibility algorithm](#compatibility-algorithm-whats-implemented) above.  
- **Docs:** README (this file), DEMO.md (demo flow), GETTING_STARTED.md (local setup), ROOMMATE-ASSIGNMENT-ALGORITHM.md (room assignment model).

---

## Security and env

- Do **not** commit `.env` or `.env.local` (in `.gitignore`). Use `.env.example` as a template. Professors create their own `.env` when cloning. For production (Railway), set variables in the dashboard.

---

## Quick start (developers)

1. Clone, then `npm install`.
2. Create `.env` with at least:
   ```env
   DATABASE_URL="file:./dev.db"
   AUTH_SECRET="your-dev-secret-at-least-32-chars"
   ```
3. `npx prisma db push` then `npm run db:seed`.
4. `npm run dev` → http://localhost:3000.

For step-by-step instructions (including where to create `.env`), see **[GETTING_STARTED.md](./GETTING_STARTED.md)**.

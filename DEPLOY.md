# Push to production (step-by-step)

Your app is **Next.js 16** (frontend + API in one app), **Prisma** (SQLite), and **NextAuth**. Everything runs as a single app, so you deploy it to **one** host.

**→ If your app is already “online” on Railway and you’re not sure what to do next:** use the detailed click-by-click guide in **[RAILWAY-NEXT-STEPS.md](./RAILWAY-NEXT-STEPS.md)**.

**Recommended host: Railway** — simple, one place for app + database file, good paid plans, no free-tier hoops.

---

## Before you start

- Code is on **GitHub** (e.g. `https://github.com/ravchuu/Roommate-finder-3000`).
- You have a **Railway** account (or sign up at [railway.app](https://railway.app)).
- You’ll add your **GoDaddy domain** later; these steps only get the app live on a `*.railway.app` URL.

---

## Step 1: Create a new project on Railway

1. Go to [railway.app](https://railway.app) and log in (or sign up with GitHub).
2. Click **“New Project”**.
3. Choose **“Deploy from GitHub repo”**.
4. If asked, connect your GitHub account and allow Railway to see your repos.
5. Select the repo: **Roommate-finder-3000**.
6. Railway will create a project and start a first deploy. **Don’t worry if the first deploy fails** — we’ll add settings next.

---

## Step 2: Add a volume (so the database isn’t lost on redeploy)

1. In your Railway project, click your **service** (the one linked to the repo).
2. Open the **Variables** tab (or **Settings**).
3. Go to the **Volumes** section (or **“Add volume”**).
4. **Create a volume** and set the **mount path** to:  
   **`/data`**  
   (exactly that).
5. Save.

This gives your app a persistent folder so the SQLite file survives redeploys.

---

## Step 3: Set environment variables

In the same service, open **Variables** and add these **one by one**:

| Variable           | Value |
|--------------------|--------|
| `DATABASE_URL`     | `file:/data/sqlite.db` |
| `AUTH_SECRET`      | A long random string (see below) |
| `NEXTAUTH_URL`     | Your app URL (see below) |

**How to get the values:**

- **`AUTH_SECRET`**  
  On your own computer, in a terminal, run:  
  `npx auth secret`  
  Copy the output and paste it as the value of `AUTH_SECRET`. (Or use: `openssl rand -base64 33`.)

- **`NEXTAUTH_URL`**  
  After the first deploy, Railway will show a URL like:  
  `https://roommate-finder-3000-production-xxxx.up.railway.app`  
  Set `NEXTAUTH_URL` to that URL **with no slash at the end** (e.g. `https://roommate-finder-3000-production-xxxx.up.railway.app`).  
  If you change the URL later (e.g. custom domain), update `NEXTAUTH_URL` to match.

Save the variables. Railway will redeploy when you save.

---

## Step 4: Set build and start commands

1. In the same service, go to **Settings** (or the place where “Build Command” and “Start Command” are).
2. Set:
   - **Build Command:**  
     `npm run build`
   - **Start Command:**  
     `npm start`
3. **Root Directory** (if asked): leave empty (repo root).
4. Save.

The `build` script in the repo already runs `prisma generate` before `next build`, so the DB client is ready.

---

## Step 5: Run database migrations (one time)

After the app has deployed at least once with the volume and `DATABASE_URL` set:

1. In Railway, open your service.
2. Find **“Shell”** or **“Run command”** (or use the **CLI**).
3. Run these **once**:

   ```bash
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   ```

   - `prisma migrate deploy` creates the tables.
   - `prisma/seed.ts` fills demo data (orgs, students, etc.).

If Railway doesn’t offer a shell, you can run the same commands via the **Railway CLI** from your computer (after linking the project).

---

## Step 6: Open the app

1. In Railway, open your service and click the **generated URL** (e.g. `https://….railway.app`).
2. You should see the app (login page or onboarding).
3. Try the **demo login** (e.g. org `westfield`, email `alex.chen@university.edu`, password `student123`) if you kept the seed.

---

## Checklist

- [ ] Railway project created from GitHub repo.
- [ ] Volume added with mount path `/data`.
- [ ] `DATABASE_URL` = `file:/data/sqlite.db`
- [ ] `AUTH_SECRET` = output of `npx auth secret`
- [ ] `NEXTAUTH_URL` = your app URL (no trailing slash).
- [ ] Build = `npm run build`, Start = `npm start`.
- [ ] Ran `npx prisma migrate deploy` and `npx tsx prisma/seed.ts` once.
- [ ] App opens in browser and login works.

---

## Local development after this change

The app now reads the database path from `DATABASE_URL`. For **local** development:

1. Copy `.env.example` to `.env.local`.
2. In `.env.local` set:  
   `DATABASE_URL="file:./dev.db"`  
   (and optionally `AUTH_SECRET` for local auth).
3. Run `npm run dev` as usual. Your local DB stays in `prisma/dev.db`.

---

## Connecting your GoDaddy domain later

When you’re ready to use your own domain:

1. In Railway, open your service → **Settings** → **Networking** (or **Domains**).
2. Add your domain (e.g. `roommatefinder.example.com`).
3. Railway will show the **CNAME** (or DNS) instructions.
4. In **GoDaddy**, add the CNAME record they give you.
5. In Railway **Variables**, set **`NEXTAUTH_URL`** to your full domain URL (e.g. `https://roommatefinder.example.com`) and redeploy.

That’s it. You’ll have one app (frontend + backend) on Railway, and later your domain pointing to it.

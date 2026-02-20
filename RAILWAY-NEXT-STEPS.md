# Railway: What to Do Now (App Is Online)

Your app is **online** on Railway. Follow these steps **in order**. Take your time; you can’t break anything.

---

## Step A: Find your app’s URL (you’ll need it in a minute)

1. In Railway, you should see your **project** (one card or box, usually with your repo name like **Roommate-finder-3000**).
2. **Click** that card to open the **service** (the thing that’s “online”).
3. Look for a **link** or **URL** at the top or under a **“Settings”** or **“Deployments”** area. It will look like:
   - `https://something.up.railway.app`
   or
   - A **“Generate domain”** or **“Settings” → “Networking”** or **“Domains”** button that gives you a URL.
4. If you see **“Generate domain”**, click it once. Railway will create a URL like `https://roommate-finder-3000-production-xxxx.up.railway.app`.
5. **Copy that full URL** (e.g. `https://roommate-finder-3000-production-xxxx.up.railway.app`) and **paste it into a Notepad or sticky note**. Do **not** add a slash at the end.
6. You’ll paste this same URL later as `NEXTAUTH_URL`.

---

## Step B: Add a volume (so your database isn’t wiped on redeploy)

1. Stay on the **same service** (the one that’s online).
2. Look for tabs or a menu: **Variables**, **Settings**, **Deployments**, etc.
3. Open **“Variables”** (or **“Settings”** and then look for **“Volumes”**).
4. Scroll until you see **“Volumes”** or **“Add volume”** or **“Mount volume”**.
5. Click **“Add volume”** (or **“New volume”** / **“Create volume”**).
6. When it asks for **Mount path** or **Path**, type exactly:
   ```
   /data
   ```
   (just those 5 characters: slash, then the word data)
7. Save or confirm. The volume is now attached so your app can store the database file in `/data`.

---

## Step C: Add environment variables (3 total)

Still on the **same service**, go to the **Variables** tab (or the place where you see **“Variables”** or **“Environment variables”**).

You’ll add **3 variables**. For each one:
- There’s usually a **“New variable”** or **“Add variable”** or **“+”** button, or empty boxes for **Name** and **Value**.
- Type the **name** exactly as shown (case-sensitive).
- Type or paste the **value** exactly as shown (no extra spaces).

---

### Variable 1: DATABASE_URL

- **Name:**  
  `DATABASE_URL`
- **Value:**  
  `file:/data/sqlite.db`

(That’s the word **file**, then a **colon**, then **/data/sqlite.db** — no spaces.)

Click **Add** or **Save** (or move to the next variable if it’s a list).

---

### Variable 2: AUTH_SECRET

You need a long random string. You’ll create it on **your own computer** (Windows), then paste it into Railway.

**On your computer (Windows):**

1. Open **Command Prompt** or **PowerShell**.
   - Easiest: press **Windows key**, type `cmd` or `powershell`, press Enter.
2. Go to your project folder. Type (adjust the path if your project is somewhere else):
   ```bash
   cd C:\Project\Roommate-finder-3000
   ```
   Press Enter.
3. Run this and press Enter:
   ```bash
   npx auth secret
   ```
   - If it says “not found” or asks to install something, type **y** and press Enter.
4. It will print a long line of random characters (e.g. `abc123XYZ...`). That’s your secret.
5. **Select that whole line** (click and drag, or triple-click), then **copy** it (Ctrl+C).

**Back in Railway:**

- **Name:**  
  `AUTH_SECRET`
- **Value:**  
  Paste the line you just copied (Ctrl+V). No quotes needed.

Add/Save.

---

### Variable 3: NEXTAUTH_URL

- **Name:**  
  `NEXTAUTH_URL`
- **Value:**  
  The **exact URL** you saved in Step A (e.g. `https://roommate-finder-3000-production-xxxx.up.railway.app`).
  - **No slash at the end.**  
  - Must start with `https://`.

Add/Save.

---

After you save these, Railway will usually **redeploy** the app automatically. Wait until the deployment finishes (status shows “Success” or “Active” / “Online” again).

---

## Step D: Check build and start commands (optional but good)

1. On the same service, open **“Settings”** (or the gear icon).
2. Find **“Build Command”** and **“Start Command”** (sometimes under “Build” or “Deploy”).
3. Set them to:
   - **Build Command:**  
     `npm run build`
   - **Start Command:**  
     `npm start`
4. If you don’t see these options, that’s okay — Railway often detects them from your project. Save if you changed anything.

---

## Step E: Create the database and add demo data (one time)

Your app needs **tables** in the database and **demo users** so you can log in. You run two commands **once**.

**Option 1 – Railway dashboard (if you have a “Shell” or “Console”)**

1. On your service, look for **“Shell”**, **“Console”**, **“Run command”**, or **“Terminal”**.
2. If you see it, open it. A terminal will open **inside** Railway.
3. Run the first command (copy-paste, then Enter):
   ```bash
   npx prisma migrate deploy
   ```
   Wait until it says something like “Applied X migration(s).”
4. Run the second command:
   ```bash
   npx tsx prisma/seed.ts
   ```
   Wait until it finishes (may take a few seconds).
5. You’re done with this step.

**Option 2 – No Shell in Railway: use your computer**

1. On your computer, open **Command Prompt** or **PowerShell**.
2. Go to your project folder:
   ```bash
   cd C:\Project\Roommate-finder-3000
   ```
3. You need to run the commands **on Railway’s server** with the production database. The easiest way is the **Railway CLI**:
   - Install: run `npm install -g @railway/cli` (or see [railway.app](https://railway.app) → Docs → CLI).
   - Log in: run `railway login` and follow the browser steps.
   - Link this folder to your project: run `railway link` and pick your project and service.
   - Then run:
     ```bash
     railway run npx prisma migrate deploy
     railway run npx tsx prisma/seed.ts
     ```
   When you run these, they use Railway’s environment (and the database in `/data`).

If you’re not sure which option you have: try Option 1 first. If there’s no Shell/Console, use Option 2 with the CLI.

---

## Step F: Open your app and test login

1. In Railway, go back to your service and find the **app URL** again (the same one you used for `NEXTAUTH_URL`).
2. **Click it** (or copy and paste into your browser). Your app should open (e.g. login or onboarding page).
3. Try the **demo login**:
   - **Organization:** `westfield`
   - **Email:** `alex.chen@university.edu`
   - **Password:** `student123`
4. If that works, you’re done. The app is live and the database is set up.

---

## Quick checklist (where you are now)

- [ ] **Step A** – Found and copied your app URL.
- [ ] **Step B** – Added a volume with mount path `/data`.
- [ ] **Step C** – Added variables: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`.
- [ ] **Step D** – Build = `npm run build`, Start = `npm start` (if you could set them).
- [ ] **Step E** – Ran `npx prisma migrate deploy` and `npx tsx prisma/seed.ts` once.
- [ ] **Step F** – Opened the app in the browser and logged in with the demo account.

If something doesn’t look like what’s described (e.g. no “Volumes”, no “Shell”), note what you *do* see (tab names, buttons) and you can ask for help with that screen. Railway sometimes changes the UI, but the ideas (volume, variables, run commands once) stay the same.

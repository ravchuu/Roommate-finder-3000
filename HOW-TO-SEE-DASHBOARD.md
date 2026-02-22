# How to see the dashboard

You can get to the dashboard in two ways.

---

## If "Demo account not found" after seeding

The seed and the app must use the **same database file**. If they use different folders, you get "demo not found" even though the seed said "Seeding complete!"

**Do this:**

1. Run the seed again in the terminal:
   ```bash
   npx tsx prisma/seed.ts
   ```
2. At the end of the output you’ll see something like:
   ```text
   Database file: C:/Project/Roommate-finder-3000/prisma/dev.db
   If the app says 'demo not found', put this in .env.local (same folder as package.json):
     DATABASE_URL="file:C:/Project/Roommate-finder-3000/prisma/dev.db"
   ```
3. Open **`.env.local`** in your project (same folder as **package.json**). If you’re not sure which folder that is, use **Cursor’s left sidebar** and look for **package.json**; **.env.local** should be in that same folder.
4. Add or replace the **`DATABASE_URL`** line with the one the seed printed (the full `file:...` path). Save the file.
5. **Restart the app:** in the terminal where the website is running, press **Ctrl+C**, then run **`npm run dev`** again.
6. In the browser, go to **Student Login** and click **“Sign in as demo (try the finder)”** again.

---

## Option 1: Log in with a demo profile (recommended)

Demo accounts already have the survey and Big Five filled in, so you can go straight to the dashboard after login.

1. **Seed the database** (one time) so demo accounts exist:
   ```bash
   npx tsx prisma/seed.ts
   ```

2. **Open the app** (e.g. http://localhost:3000) and go to **Student Login**.

3. **Log in** with:
   - **Organization:** `westfield`
   - **Email:** `alex.chen@university.edu` (or any other seed student — see list below)
   - **Password:** `student123`

4. You’ll land on the **dashboard**. You can also go directly to:
   - http://localhost:3000/dashboard  
   - http://localhost:3000/roommates  
   (as long as you’re logged in with that demo account.)

**More demo emails** (same org `westfield`, same password `student123`):

- alex.chen@university.edu  
- brianna.f@university.edu  
- c.ramirez@university.edu  
- d.park@university.edu  
- e.okafor@university.edu  
- (and the rest from the seed — any `*@university.edu` in the seed list)

---

## Option 2: Skip the survey gate (for testing)

If you want to log in with **your own** (or a newly claimed) profile and still go **directly to the dashboard** without doing the survey:

1. In your project root, open or create **`.env.local`**.

2. Add this line:
   ```env
   NEXT_PUBLIC_SKIP_SURVEY_GATE=true
   ```

3. **Restart the dev server** (`npm run dev`).

4. Log in with any student account. You can now open **/dashboard** or **/roommates** directly; the app will not redirect you to the survey.

**Note:** This is for local testing only. Don’t set this in production.

---

## Summary

| Goal | What to do |
|------|------------|
| See dashboard with pre-filled data | Run `npx tsx prisma/seed.ts`, then log in with org `westfield`, email `alex.chen@university.edu`, password `student123`. |
| See dashboard with your own account without doing the survey | Add `NEXT_PUBLIC_SKIP_SURVEY_GATE=true` to `.env.local`, restart the app, then log in and go to `/dashboard`. |

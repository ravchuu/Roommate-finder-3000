# Fix: Admin Login on Railway Goes to Wrong URL or Blank Page

Follow these steps **in order**. Do them on the Railway website and (for one step) on your computer.

---

## Part 1: Open Railway and find your app

1. Open your web browser and go to **https://railway.app**
2. Log in if it asks you to.
3. You’ll see a list of **projects**. Click the one that has your app (e.g. **Roommate-finder-3000** or whatever you named it).
4. Inside the project you’ll see a **service** (one box/card that represents your app). Click that service.
5. You’re now on the page for your app. Keep this tab open.

---

## Part 2: Find your app’s web address (URL)

You need the exact web address where your app is live (e.g. `https://something.up.railway.app`).

1. On the same **service** page, look for one of these:
   - A **link** that says something like `https://....up.railway.app` (click “Open” or copy it), or
   - A **“Settings”** or **“Deployments”** tab, or
   - A **“Generate domain”** or **“Domains”** button.
2. If you see **“Generate domain”**, click it once. Railway will create a URL.
3. **Copy the full URL** (it should look like `https://roommate-finder-3000-production-xxxx.up.railway.app`).
4. **Paste it into Notepad** (or any text file) and **save**. You will use this exact URL in Part 4.
5. **Important:** The URL must **not** end with a slash. So it must be `https://....railway.app` and **not** `https://....railway.app/`.

---

## Part 3: Open the place where you set variables

1. On the **same service** page, look at the **tabs** at the top or the menu on the side. You might see: **Deployments**, **Variables**, **Settings**, **Metrics**, etc.
2. Click **“Variables”** (or **“Environment Variables”** or **“Env”**).
3. You’ll see a list of variable names and values (or an empty list). This is where you’ll add or fix the settings that make admin login work.

---

## Part 4: Set NEXTAUTH_URL (the most important one)

This tells the app which web address it’s running on. If this is wrong, login can send you to the wrong URL and you get a blank page.

1. In the **Variables** area, look for a variable named **NEXTAUTH_URL**.
2. **If you see NEXTAUTH_URL already:**
   - Click it to edit, or click **Edit** / the pencil icon.
   - Set the **value** to the **exact URL** you saved in Part 2 (e.g. `https://roommate-finder-3000-production-xxxx.up.railway.app`).
   - No slash at the end. No spaces. Click **Save**.
3. **If you don’t see NEXTAUTH_URL:**
   - Click **“New variable”** or **“Add variable”** or the **+** button.
   - In the **name** box, type exactly: **NEXTAUTH_URL**
   - In the **value** box, paste the **exact URL** from Part 2 (again, no slash at the end).
   - Save.
4. After you save, Railway will usually **redeploy** your app (you might see “Deploying…” or “Building…”). Wait until it says **“Success”** or **“Active”** again (this can take a few minutes).

---

## Part 5: Make sure AUTH_SECRET exists

The app needs a secret key to keep logins secure.

1. Still in **Variables**, look for **AUTH_SECRET**.
2. **If AUTH_SECRET is already there** and has a long random value (lots of letters and numbers), you’re done with this part. Skip to Part 6.
3. **If it’s missing or empty**, you need to create a secret on your computer and paste it here:
   - On your **computer**, open **Command Prompt** or **PowerShell** (press Windows key, type `cmd` or `powershell`, press Enter).
   - Type this and press Enter (change the path if your project is somewhere else):
     ```bash
     cd C:\Project\Roommate-finder-3000
     ```
   - Then type this and press Enter:
     ```bash
     npx auth secret
     ```
   - The computer will print a long line of random characters. **Select that whole line** and **copy** it (Ctrl+C).
   - Back in **Railway**, in **Variables**, click **“New variable”** (or **Add**).
   - **Name:** `AUTH_SECRET`
   - **Value:** paste the line you copied (Ctrl+V). Save.
   - Railway will redeploy again; wait until it finishes.

---

## Part 6: Add AUTH_TRUST_HOST (so the host is trusted)

This tells the login system to trust your Railway URL. Without it, you can get a wrong redirect or blank page.

1. In **Variables**, look for **AUTH_TRUST_HOST**.
2. **If it’s already there** and the value is `true`, you’re done. Skip to Part 7.
3. **If it’s not there:**
   - Click **“New variable”** (or **Add**).
   - **Name:** `AUTH_TRUST_HOST`
   - **Value:** `true` (the word true, in lowercase). Save.
   - Wait for redeploy to finish.

---

## Part 7: Redeploy so the latest code is live (trustHost fix)

The code was updated to fix the blank-page issue. Your app on Railway needs to use that new code.

1. On the **same service** page, find the **Deployments** tab (or **“Deploys”**).
2. Click **Deployments**.
3. Look for a **“Redeploy”** or **“Deploy”** or **“Trigger deploy”** button (sometimes it’s the three dots **⋮** next to the latest deployment, then **Redeploy**).
4. Click it so Railway builds and runs the app again with the latest code from GitHub.
5. Wait until the new deployment shows **“Success”** or **“Active”**.

---

## Part 8: Try admin login again

1. In your browser, go to your app’s URL (the one you saved in Part 2).
2. Go to the **admin login** page (often something like `https://your-app.up.railway.app/admin/login`, or click “Admin Login” on the home page).
3. Enter your **demo admin** email and password:
   - Email: **demo.admin@westfield.edu**
   - Password: **admin123**
4. Click **Sign In**.

You should stay on the same website (your Railway URL) and see the **admin dashboard** instead of a blank page or a different site.

---

## If it still doesn’t work

- **Blank page or wrong URL:** Double-check that **NEXTAUTH_URL** in Railway is **exactly** the same as the address in your browser’s bar when you open your app (no slash at the end).
- **“Invalid credentials”:** The database on Railway might not have the demo accounts yet. You need to run the **seed** once on Railway (see **RAILWAY-NEXT-STEPS.md**, the section about “Run migrations and seed”). That creates the demo org and demo admin so login works.

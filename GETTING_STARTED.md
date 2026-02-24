# How to Run the Roommate Finder App — Plain English, Step by Step

This guide assumes you have never used a “terminal” or “commands” before. Every step says **where to look** and **what to do**. You can copy and paste the typed parts.

---

## What you’re looking at

- **Cursor** = The program you have open (like Word or Chrome). It’s where we’ll do everything.
- **Project folder** = The folder that holds all the app’s files. Its name is something like **Roommate-finder-3000**. When we say “open the project,” we mean: in Cursor, use **File → Open Folder** and choose that folder.
- **Left sidebar** = The column on the left in Cursor that shows a list of **files and folders** (names like `app`, `prisma`, `package.json`). That’s your “project folder” in list form.
- **Terminal** = A box (usually at the **bottom** of Cursor) where you type **commands** — short instructions — and press Enter. The computer runs them. No coding needed; you’re just typing a few lines we give you.
- **Command** = One line of text you type (or paste) into the terminal and then press **Enter** to run it.

---

## Step 1: Make sure the project is open in Cursor

1. At the **top left** of Cursor, click **File**.
2. Click **Open Folder**.
3. In the window that opens, go to the place where your project lives (e.g. **Project** or **Documents**) and click the folder **Roommate-finder-3000** (or whatever the folder is called).
4. Click **Select Folder** (or **Open**).
5. You should see the **left sidebar** fill with files and folders. That means the project is open.

---

## Step 2: Open the terminal (the box where you type commands)

1. Look at the **top menu** in Cursor (File, Edit, View, etc.).
2. Click **Terminal**.
3. Click **New Terminal**.
4. A **panel** will open at the **bottom** of the window. You’ll see a line of text (maybe something like `PS C:\Project\Roommate-finder-3000>`) and a **blinking line** (the cursor).
5. **That bottom panel is the terminal.** From now on, when we say “in the terminal,” we mean: click inside that bottom panel so the typing goes there, then type or paste the line we give you and press **Enter**.

*If you don’t see the bottom panel:* Try **View → Terminal** or press **Ctrl + `** (the key above Tab, same key as the tilde ~).

---

## Step 3: Install what the app needs (first time only)

1. **Click inside the terminal** (the bottom panel) so your typing goes there.
2. Type exactly (or copy and paste):
   ```
   npm install
   ```
3. Press **Enter**.
4. Wait. Lots of lines will scroll. When it’s done, you’ll get your typing line back (e.g. `PS C:\...>`). That’s normal. You might see something like “added 200 packages” — that’s good.

**What this did:** “npm” is a tool that downloads the pieces the app needs. “Install” means “download them.” You only need to do this once per project.

---

## Step 4: Set up the database and load sample students

The app stores data (students, rooms, etc.) in a **database** — like a digital filing cabinet. We’ll create it and then put in 100 sample students.

**4a – Create the database**

1. In the **terminal** (bottom panel), type exactly:
   ```
   npx prisma db push
   ```
2. Press **Enter**.
3. Wait until you see a line like **“Your database is now in sync with your schema.”** Then you’re done with this part.

**4b – Load 100 sample students and groups**

1. In the **terminal**, type exactly:
   ```
   npm run db:seed
   ```
2. Press **Enter**.
3. Wait until you see something like **“Seeding complete!”** and lines about “Created 100 students” and groups. Then the sample data is in.

**If you see an error about “DATABASE_URL” or “Environment variable not found: DATABASE_URL”:**

- The app needs a small settings file named **.env** in the project folder (same folder as `package.json`). Prisma reads **.env** when you run `npx prisma db push`.
- **If the project already has a .env file:** Open it and make sure it has a line that says `DATABASE_URL="file:./dev.db"`. Save (**Ctrl + S**), then run **npx prisma db push** again.
- **If you don’t have a .env file:** Create one:
  1. In the **left sidebar** (the file list), **right‑click** in the empty area under the files → **New File**.
  2. Name it exactly: **.env** (including the dot at the start).
  3. Click the new **.env** file to open it. Type (or paste) this line:
     ```
     DATABASE_URL="file:./dev.db"
     ```
  4. Save (**Ctrl + S**).
  5. Go back to **Step 4** and run both commands again: **npx prisma db push** then **npm run db:seed**.

---

## Step 5: Start the app

1. In the **terminal** (bottom panel), type:
   ```
   npm run dev
   ```
2. Press **Enter**.
3. Wait until you see a line that says something like **“Ready”** and shows an address: **http://localhost:3000**. Leave this terminal running; don’t close it.

**What this did:** “dev” means “run the app for development.” The app is now running on your computer. “localhost” means “this computer,” and 3000 is the “door number” the app uses.

---

## Step 6: Open the app in your web browser

1. Open your **web browser** (Chrome, Edge, Firefox, etc.) — the same one you use for normal websites.
2. Click in the **address bar** at the top (where you usually type google.com or a URL).
3. Type exactly:
   ```
   http://localhost:3000
   ```
4. Press **Enter**.
5. You should see the **Roommate Finder** home page (title and maybe “For administrators” or “Admin Login”). That’s the app.

---

## Step 7: Log in as Demo Admin

1. On that home page, find and click **“Admin Login”** or **“Go to Admin”** (usually near the top or in an “For administrators” section).
2. You’ll see a **login** page (email and password boxes).
3. In **Email**, type:
   ```
   demo.admin@westfield.edu
   ```
   (This is the **Demo Admin** account — the org name will show as “Demo — Westfield University.”)
4. In **Password**, type:
   ```
   admin123
   ```
5. Click the button to **log in** (e.g. “Sign in” or “Log in”).
6. You should land on the **Dashboard** — a page with several boxes (cards) showing numbers like “Total students,” “Claimed profiles,” “Room configs,” “Deadline,” and **“Housing type.”**

---

## Step 8: Where to change “Co-ed” vs “Single gender” (housing type)

**Housing type** = whether rooms can be **Co-ed** (mixed gender) or **Single gender** (same gender only).

You can change it in two ways:

**Option A – From the Dashboard**

1. On the **Dashboard** (the page you see after login), look at the **boxes (cards)**.
2. Find the one that says **“Housing type”** and shows either **“Co-ed”** or **“Single gender.”**
3. **Click that whole box.** It will take you to the **Standards** page.
4. On that page, find **“Housing type (rooms)”** and choose:
   - **Co-ed** — mixed gender (any students can room together), or  
   - **Single gender** — same gender only.
5. Click **“Save Settings.”**

**Option B – From the left menu**

1. On the **left side** of the admin screen you’ll see a **menu** (list of links): Dashboard, Roster, Room config, Rooming, Standards, etc.
2. Click **“Standards.”**
3. Scroll until you see **“Housing type (rooms).”**
4. Choose **Co-ed** or **Single gender** (same as above).
5. Click **“Save Settings.”**

That’s where you pick whether rooms are co-ed or not. The Dashboard just shows what’s currently set and lets you click through to change it.

---

## Step 9: What the other menu items do (so you know where to find things)

- **Dashboard** = Overview: student count, room configs, deadline, housing type. Click any box to go to the page that edits that thing.
- **Roster** = List of students. Add one student or upload a list (CSV).
- **Room config** = How many rooms of each size (e.g. 2-person, 4-person) and how many of each.
- **Rooming** = Who is in which group; move students between groups, create new groups.
- **Standards** = Organization name, deadline, and **Housing type** (Co-ed vs Single gender). This is the page where you actually change Co-ed vs Single gender.

---

## Step 10: When you’re done — stop the app

1. Go back to **Cursor** and find the **terminal** at the bottom (where you ran **npm run dev**).
2. Click inside that terminal so it’s active.
3. Press **Ctrl + C** once (hold Ctrl, press C). The app will stop and the terminal will be idle again.
4. You can close the terminal panel or Cursor. Next time, start again from **Step 5** (npm run dev) and **Step 6** (open http://localhost:3000 in the browser).

---

## Quick reminder list

| What you want to do | Where / What to do |
|---------------------|--------------------|
| Open the place to type commands | Cursor → **Terminal** → **New Terminal** (bottom panel) |
| Install project stuff (first time) | In terminal: `npm install` then Enter |
| Set up database + load 100 students | In terminal: `npx prisma db push` then Enter, then `npm run db:seed` then Enter |
| Start the app | In terminal: `npm run dev` then Enter |
| Open the app in the browser | In browser address bar: `http://localhost:3000` |
| Log in as Demo Admin | Email: `demo.admin@westfield.edu`  Password: `admin123` |
| Change Co-ed vs Single gender | **Dashboard** → click **“Housing type”** box, **or** left menu → **Standards** → Housing type → Save |
| Stop the app | In the terminal where it’s running: **Ctrl + C** |

---

## Words used in this guide

- **Cursor** — The program (editor) you use to open the project and run the app.
- **Terminal** — The bottom panel in Cursor where you type **commands** and press Enter.
- **Command** — A line of text you type (or paste) in the terminal and press Enter so the computer does something (e.g. `npm install`, `npm run dev`).
- **Dashboard** — The main admin page after login, with the summary boxes.
- **Standards** — The settings page where you set organization name, deadline, and **Housing type** (Co-ed or Single gender).
- **Housing type** — The setting that controls whether rooms are Co-ed (mixed gender) or Single gender (same gender only). You change it on the **Standards** page; the **Dashboard** shows the current value and links to Standards.

If something doesn’t work, do the steps in order and make sure Step 4 finished without red error messages. If you see an error, copy the exact message and ask someone for help, or look for the “DATABASE_URL” fix in Step 4.

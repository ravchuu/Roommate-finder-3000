# How to Get the Demo Working — Plain English, Step by Step

This guide uses no technical words. Do each step in order.

---

## Part A: Get the App Open in Your Browser

### Step A1: Close Any Other Copy of the App

If you tried to start the app before, it might still be "on" in the background. We need to turn it off first.

1. Look at the **bottom of the Cursor window**. You might see one or more **panels** (boxes) with black or dark backgrounds and white text.
2. In each of those panels, look at the **top right**. If you see a **trash can** or **X** to close the panel, click it to close that panel. Do that for every panel that looks like a black box with text.
3. If you have **more than one Cursor window** open with this project, close all but one. Use the X on the window title bar to close the extra windows.
4. Save your work (Ctrl + S if you have a file open) and then **close Cursor completely** (File → Exit, or click the X on the Cursor window).
5. **Open Cursor again** and open your project folder (File → Open Folder → choose **Roommate-finder-3000**).

This way, nothing is "running" in the background from before.

---

### Step A2: Open the Box Where You Type Instructions

1. At the **top of the Cursor window**, click the word **Terminal** in the menu bar.
2. In the menu that drops down, click **New Terminal**.
3. A **new panel** will appear at the **bottom** of the window. It will have a line of text and a **blinking line** (cursor). This is where you will type the next steps. **Click inside that panel** so your typing goes there.

---

### Step A3: Load the Demo Data (First Time Only)

You only need to do this once, or if you want to reset the demo so your professor sees a fresh copy.

1. In the **bottom panel** (where the blinking line is), type exactly:  
   `npm run db:seed`  
   (You can copy and paste it.)
2. Press **Enter** on your keyboard.
3. Wait. Lots of lines will scroll. When it stops and you see a line like **"Seeding complete!"** and **"Demo Admin"** and **"Demo Student"**, you are done. If you see red error text instead, go to the **"If Something Goes Wrong"** section at the end.

---

### Step A4: Start the App

1. In the **same bottom panel**, type exactly:  
   `npm run dev`  
2. Press **Enter**.
3. Wait until you see a line that says something like **"Ready"** and shows an address like **http://localhost:3000**.
4. **Leave this panel open.** Do not close it and do not type anything else in it while you use the demo. (Closing it will turn off the app.)

---

### Step A5: Open the App in Your Web Browser

1. Open your **web browser** (Chrome, Edge, or whatever you normally use).
2. Click in the **address bar** at the top (where you usually type google.com or a website address).
3. Type exactly:  
   `http://localhost:3000`  
4. Press **Enter**.
5. You should see the **Roommate Finder** home page. If you see "This site can’t be reached" or a blank page, the app is not running — go back to Step A4 and make sure the bottom panel is still open and shows "Ready".

---

## Part B: Log In as Demo Admin

1. On the home page, click **Admin Login** (or **Go to Admin**).
2. In the **Email** box, type:  
   `demo.admin@westfield.edu`
3. In the **Password** box, type:  
   `admin123`
4. Click the button to **log in** (e.g. Sign in or Log in).
5. You should see the **admin area** with a name like **"Demo — Westfield University"** at the top. You can click **Dashboard**, **Roster**, **Rooms**, **Rooming**, **Standards** and look around or make a few changes.
6. When you are done, **log out** (use the menu or button that says Log out or Sign out).

---

## Part C: Claim the Demo Student Account

1. Go back to the **home page** (click the site name or type `http://localhost:3000` in the address bar again).
2. Find the link that says **Claim it here** (under Student Login) and click it. Or type in the address bar:  
   `http://localhost:3000/claim`  
   and press Enter.
3. On the claim page, fill in the boxes:
   - **Organization code:** type `westfield`
   - **Email:** type `demo.student@westfield.edu`
   - **Claim token:** type `demo-claim-token`
   - **Password:** type `student123`
4. Click the button to **submit** (e.g. Claim profile).
5. You should see a message like **"Profile claimed successfully! You can now log in."**

---

## Part D: Log In as Demo Student and Do Onboarding

1. Click the link to go to **Student Login** (or type in the address bar:  
   `http://localhost:3000/login`  
   and press Enter).
2. Fill in:
   - **Organization code:** `westfield`
   - **Email:** `demo.student@westfield.edu`
   - **Password:** `student123`
3. Click **Sign in** (or Log in).
4. You will be taken to the **onboarding** page (first-time setup). Fill in the steps: about you, room size, lifestyle survey. Click **Next** or **Submit** until you finish.
5. When onboarding is done, you will land on the **student dashboard**.

---

## Part E: See the Two Rooming Requests

1. On the **left side** of the student screen, you should see a menu. Click **Requests**.
2. You should see **Incoming (2)** — two roommate requests from other students. You can **Accept** or **Decline** them.
3. You can also click **Find Roommates**, **Messages**, and **My Group** to try those parts of the app.

---

## If Something Goes Wrong

**"Port 3000 is in use" or "Unable to acquire lock"**

- Another copy of the app is still running. Do **Part A1** again: close all the bottom panels in Cursor, close Cursor completely, open Cursor again, open the project, then do Steps A2 through A5 again.

**"This site can’t be reached" when you open localhost:3000**

- The app is not running. Make sure you did Step A4 and that the **bottom panel** is still open and shows "Ready". If you closed that panel, do Step A2 again (New Terminal), then A4 again (`npm run dev`), then open the browser to `http://localhost:3000` again.

**"Environment variable not found" or "DATABASE_URL"**

- The app needs a small settings file. In the **left sidebar** in Cursor (where you see the list of files), right-click in the empty area → **New File**. Name the file exactly: `.env` (with the dot at the start). Open it and type this one line:  
  `DATABASE_URL="file:./dev.db"`  
  Save (Ctrl + S). Then do Step A3 again (`npm run db:seed`), then A4 and A5.

**Wrong password or "Invalid" when logging in**

- Make sure you typed the email and password exactly as in this guide (no extra spaces). For Demo Admin use `demo.admin@westfield.edu` and `admin123`. For Demo Student use `demo.student@westfield.edu` and `student123`, and org code `westfield`.

---

## Quick Copy-Paste Reference

| What you're doing        | What to type or use |
|--------------------------|---------------------|
| Load/reset demo data     | `npm run db:seed` (in bottom panel, then Enter) |
| Start the app            | `npm run dev` (in bottom panel, then Enter) |
| Open the app in browser  | In address bar: `http://localhost:3000` |
| Demo Admin login         | Email: `demo.admin@westfield.edu`  Password: `admin123` |
| Claim Demo Student       | Org: `westfield`  Email: `demo.student@westfield.edu`  Claim token: `demo-claim-token`  Password: `student123` |
| Demo Student login       | Org: `westfield`  Email: `demo.student@westfield.edu`  Password: `student123` |

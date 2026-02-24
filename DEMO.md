# Demo Guide — For Professors / Evaluators

Demo flow order: **Admin first** (look around, roster, make changes) → **Log out** → **Claim** the demo student account → **Onboarding** → **Dashboard** with rooming requests already there → accept a request, see rooming, find roommates, messaging.

All data is **already in the seed**. Run the app and seed once (see below), then follow the steps in order.

---

## 1. Run the app and load demo data (one-time)

1. Open the project in a code editor. In a terminal at the project folder:
   - `npm install`
   - Create a `.env` file in the project root with: `DATABASE_URL="file:./dev.db"`
   - `npx prisma db push`
   - `npm run db:seed` (creates one org, 100 students, room configs, groups, and one **unclaimed** demo student with 2 roommate requests waiting for them)
2. Start the app: `npm run dev` → open **http://localhost:3000** in your browser.

More detail: **GETTING_STARTED.md**.

---

## 2. Demo flow (do in this order)

### Step 1 — Log in as Demo Admin

1. Go to **http://localhost:3000** → click **Admin Login** (or open `/admin/login`).
2. **Email:** `demo.admin@westfield.edu`  
   **Password:** `admin123`
3. You’ll see the org name **“Demo — Westfield University”** so it’s clear this is the demo. Look around: **Dashboard**, **Roster (Students)**, **Room config (Rooms)**, **Rooming**, **Standards (Settings)**.
4. Make a few changes if you like (e.g. add a student, edit roster, change room config or housing type).
5. **Log out** when done.

---

### Step 2 — Claim the Demo Student account

1. Go to **Claim your profile**: from the home page click **Claim it here** (under Student Login), or open **http://localhost:3000/claim**.
2. Fill in:
   - **Organization code:** `westfield`
   - **Email:** `demo.student@westfield.edu`
   - **Claim token:** `demo-claim-token`
   - **Password:** `student123` (or any password ≥ 6 characters; we use `student123` for the rest of the demo)
3. Submit. You should see “Profile claimed successfully! You can now log in.”

---

### Step 3 — Log in as Demo Student and go through onboarding

1. Go to **Student Login** (or **http://localhost:3000/login**).
2. **Organization code:** `westfield`  
   **Email:** `demo.student@westfield.edu`  
   **Password:** `student123`
3. Submit. You’ll be sent to the **onboarding** page (first-time flow).
4. Complete onboarding: about you, room size, lifestyle survey. Submit when done.
5. You land on the **Dashboard**.

---

### Step 4 — Dashboard and rooming

After onboarding, **Demo Student** has **2 roommate requests** already in the system (from Alex Chen and Brianna Foster; used for data consistency).

1. Open **Requests** to see **Sent** requests (requests you send appear here). Use **Find Roommates** to browse compatibility-ranked matches and send requests.
2. Use **Messages** to open conversations and try the messaging system.
3. Use **My Group** to see your group after forming or joining a room (e.g. via Find Roommates and accepted requests).

---

## 3. Quick reference

| Step   | Where        | What |
|--------|--------------|------|
| 1      | /admin/login | **Demo Admin:** `demo.admin@westfield.edu` / `admin123` — look around, roster, make changes, then log out. |
| 2      | /claim       | **Demo Student:** Org: `westfield`, Email: `demo.student@westfield.edu`, Claim token: `demo-claim-token`, Password: `student123`. |
| 3      | /login       | **Demo Student:** Org: `westfield`, Email: `demo.student@westfield.edu`, Password: `student123` → complete onboarding. |
| 4      | Dashboard    | **Requests** (sent); **Find Roommates** (browse & send); **Messages**; **My Group**. |

Reseed anytime with `npm run db:seed` to reset (including the unclaimed demo student and 2 requests).

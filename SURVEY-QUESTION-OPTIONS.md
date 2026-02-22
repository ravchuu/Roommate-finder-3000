# Survey question options (for review before implementation)

Goal: **Shortest number of questions** that capture (1) **living-condition profile** (so we predict good roommates) and (2) **signals that predict who would get along / become friends** (so the Big Five “bubble” and future algorithm can be as accurate as your friend’s).

Big Five stays separate (entered via the dashboard / existing flow). This survey is only the **lifestyle + a few “relationship” signals**.

Below are **three lists**. Pick one, or mix and match questions across lists, then tell me which set to implement.

---

## List A: Minimal (5 questions) — living only

Absolute minimum for roommate compatibility. No explicit “friendship” question; Big Five does that job.

| # | Key | Question | Type | Options / scale |
|---|-----|----------|------|-----------------|
| 1 | **sleepSchedule** | When do you usually go to bed and wake up? | Select | 9pm–5am / 10pm–6am / 11pm–7am / 12am–8am / 1am–9am / 2am–10am |
| 2 | **cleanliness** | How clean do you keep your space? | Slider 1–5 | Relaxed ← → Spotless |
| 3 | **guestFrequency** | How often do you have guests over? | Select | Never / Rarely / Sometimes / Often |
| 4 | **noiseTolerance** | How much noise are you okay with at home? | Select | I need silence / Low is fine / Moderate is okay / I can handle anything |
| 5 | **spaceUsage** | When you’re home, do you mostly keep to your room or use shared space? | Select | Mostly my room / Mix of room and common areas / Often in common areas |

**Rationale:** Sleep, cleanliness, guests, and noise are the main conflict drivers. “Space usage” (one question) replaces “morning vs night” + “where do you study” to keep it short while still signaling how much they’re “in the space” and what kind of overlap to expect.

---

## List B: Balanced (6 questions) — living + one relationship signal

Same as A but adds one short question that hints at whether they want a “friendly” vs “just coexist” dynamic. Helps the algorithm separate “would be good roommates” from “would actually get along / become friends.”

| # | Key | Question | Type | Options / scale |
|---|-----|----------|------|-----------------|
| 1 | **sleepSchedule** | When do you usually go to bed and wake up? | Select | (same as List A) |
| 2 | **cleanliness** | How clean do you keep your space? | Slider 1–5 | Relaxed ← → Spotless |
| 3 | **guestFrequency** | How often do you have guests over? | Select | (same as List A) |
| 4 | **noiseTolerance** | How much noise are you okay with at home? | Select | (same as List A) |
| 5 | **spaceUsage** | When you’re home, do you mostly keep to your room or use shared space? | Select | (same as List A) |
| 6 | **roommateRelationship** | What do you want with a roommate? | Select | We keep to ourselves / We’re friendly but independent / We hang out sometimes / I’d like us to be close friends |

**Rationale:** “Roommate relationship” preference correlates with how much someone will invest in the relationship and with Big Five (e.g. extraversion, agreeableness). One question, strong signal for “would get along given the chance.”

---

## List C: With conflict style (7 questions) — living + relationship + conflict

Adds one more question that predicts how clashes (noise, cleanliness, guests) will play out. Useful if you want the algorithm to favor pairs who are less likely to escalate when they disagree.

| # | Key | Question | Type | Options / scale |
|---|-----|----------|------|-----------------|
| 1–6 | (same as List B) | | | |
| 7 | **conflictStyle** | When something bothers you about a living situation, you usually… | Select | Bring it up directly / Drop hints or leave a note / Let it go unless it’s serious / Avoid conflict and adapt |

**Rationale:** Pairs with similar conflict style (e.g. both “bring it up directly”) or complementary (one direct, one “let it go unless serious”) tend to resolve issues better. One question gives a rough but useful signal.

---

## Alternative single questions (swap-ins)

If you want to keep the same **number** of questions but change what we capture, here are drop-in alternatives.

- **Replace “spaceUsage”** with:
  - **dailyRoutine** — “Are you a morning person or night owl?” (Morning person / Flexible / Night owl)
  - **studyHabits** — “Where do you prefer to study?” (In my room / Library / Cafe or common areas / Mix)

- **Replace “roommateRelationship”** with:
  - **socialEnergy** — “After a long day, you usually want to…” (Be alone / Light chat is fine / Down to hang if someone’s around)

- **Replace “conflictStyle”** with:
  - **communicationPreference** — “How do you prefer to coordinate with a roommate?” (In person / Text or app / Either / Prefer minimal coordination)

---

## Summary

| List | # of questions | Focus |
|------|----------------|--------|
| **A** | 5 | Living only (sleep, cleanliness, guests, noise, space usage) |
| **B** | 6 | Living + what they want from the relationship (good for “would get along”) |
| **C** | 7 | Living + relationship + how they handle conflict |

Recommendation: **List B** if you want the shortest set that still supports “good roommates **and** would be good friends / get along.” List A if you want to rely entirely on Big Five for the friendship side. List C if you also want a conflict-style signal in the mix.

Once you pick a list (or a custom mix), say which one and I’ll implement it and wire compatibility to the new keys where needed.

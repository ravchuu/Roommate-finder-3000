# Roommate assignment algorithm (for future room partitioning)

This document describes a **deterministic optimization model** for assigning students into fixed-size roommate groups. It is intended for the step where you **partition** students into rooms (e.g. admin “finalize” or auto-assign), not for the **browse** list.

**Current behavior:** The “Find roommates” page already shows **everyone** in the org (all claimed students except yourself), **ranked by compatibility** (best first). Low compatibility does not hide anyone. Pagination is used when the list is long.

---

## Goal

Assign students into fixed-size roommate groups that maximize:

1. **Living habit compatibility** (conflict minimization)
2. **Personality proximity** (friendship likelihood proxy via Big Five similarity)

No training data. Deterministic given inputs.

---

## Inputs (per student)

1. **Big Five raw scores:** O, C, E, A, N (0–100 or normalized)
2. **Living habit responses** (encoded numerically), e.g.:
   - Cleanliness (ordinal)
   - Noise tolerance (ordinal)
   - Sleep schedule (bedtime / wake)
   - Guest tolerance (ordinal)
   - Optional: substance, temperature, shared boundaries
3. **Room size** \(r\) (fixed per room)

---

## Step 1: Standardize Big Five

For each trait \(k \in \{O,C,E,A,N\}\):

\[
z_{ik} = \frac{x_{ik} - \text{mean}_k}{\text{std}_k}
\]

Optional: clip \(z_{ik}\) to \([-2.5, +2.5]\).

---

## Step 2: Pairwise Big Five similarity

Weighted Euclidean distance:

\[
d_P(i,j) = \sqrt{
  1.2(O_i - O_j)^2 +
  1.0(C_i - C_j)^2 +
  1.6(E_i - E_j)^2 +
  1.2(A_i - A_j)^2 +
  0.8(N_i - N_j)^2
}
\]

Let \(\sigma_P\) = median of all \(d_P\) over the cohort.

Similarity:

\[
P(i,j) = \exp\left( -\frac{d_P(i,j)^2}{2 \sigma_P^2} \right)
\]

---

## Step 3: Pairwise habit similarity

Encode habits numerically. Example weights:

- Cleanliness: 2.0  
- Sleep schedule: 1.5  
- Noise tolerance: 1.5  
- Guest tolerance: 1.2  
- Others: 1.0  

Habit distance:

\[
d_H(i,j) = \sqrt{ \sum_m w_m (h_{im} - h_{jm})^2 }
\]

Let \(\sigma_H\) = median of all \(d_H\). Then:

\[
H(i,j) = \exp\left( -\frac{d_H(i,j)^2}{2 \sigma_H^2} \right)
\]

---

## Step 4: Hard constraints (dealbreakers)

If any of the following hold for pair \((i,j)\), they **cannot** share a room:

- Explicit quiet-required vs frequent late-night activity  
- No-guests-ever vs frequent-guests  
- Smoking/substance incompatibility  
- Any predefined categorical conflict  

Set \(S(i,j) = -\infty\) and exclude the pair from grouping.

---

## Step 5: Combined pair score

\(\lambda\) = habit priority (e.g. 0.7 stability, 0.5 balanced, 0.4 friendship-priority).

\[
S(i,j) = \lambda \, H(i,j) + (1-\lambda) \, P(i,j)
\]

---

## Step 6: Room score

For room \(G\) of size \(r\):

\[
\text{Score}(G) = \sum_{\text{pairs } (i,j) \in G} S(i,j) - \text{Penalty}(G)
\]

---

## Step 7: Personality risk penalties (group level)

- If more than one member has Agreeableness \(z < -1.2\): subtract 0.15 per violating pair.  
- If more than one member has Neuroticism \(z > +1.2\): subtract 0.15 per violating pair.  

\(\text{Penalty}(G)\) = total of these deductions.

---

## Step 8: Optimization procedure

**Goal:** Partition all students into disjoint groups of size \(r\); maximize total \(\text{Score}(G)\) over all rooms.

1. **Greedy seed formation**  
   While unassigned students remain:  
   - Pick the student with lowest average \(S(i,j)\).  
   - Start a new room with that student.  
   - Repeatedly add the student that maximizes the marginal increase in \(\text{Score}(G)\) until the room has size \(r\).

2. **Local improvement (2-swap)**  
   Repeat until no improvement:  
   - For every pair of rooms \(A\), \(B\): try swapping one member from \(A\) with one from \(B\); if total score increases, accept the swap.

---

## Output

- Final room assignments  
- Room-level scores  
- Average habit similarity per room  
- Average Big Five similarity per room  

---

## Implementation note

The **current app** uses a simpler compatibility score for **ranking** the “Find roommates” list (lifestyle traits + Big Five, no z-scores or median sigma). That is fine for browsing. When you implement **auto-assign** or **admin finalize**, you can plug in this algorithm (Steps 1–8) to compute \(S(i,j)\) and run the greedy + 2-swap procedure to produce the actual room partition.

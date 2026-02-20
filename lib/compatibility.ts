import type { SurveyAnswers } from "./survey-questions";

export type BigFiveScores = { O: number; C: number; E: number; A: number; N: number };

const BIG_FIVE_WEIGHT = 0.35; // 35% personality, 65% lifestyle

// Roommate-relevant weights: Agreeableness & Conscientiousness matter most (cooperation, cleanliness)
const BIG_FIVE_TRAIT_WEIGHTS: Record<keyof BigFiveScores, number> = {
  O: 1.0,
  C: 1.25,
  E: 1.0,
  A: 1.3,
  N: 1.15,
};

const BIG_FIVE_NAMES: Record<keyof BigFiveScores, string> = {
  O: "openness",
  C: "conscientiousness",
  E: "extraversion",
  A: "agreeableness",
  N: "emotional stability",
};

const SLEEP_ORDER = ["9pm-5am", "10pm-6am", "11pm-7am", "12am-8am", "1am-9am", "2am-10am"];
const GUEST_ORDER = ["never", "rarely", "sometimes", "often"];
const NOISE_ORDER = ["silent", "low", "medium", "high"];
const ROUTINE_MAP: Record<string, number> = { morning: 0, flexible: 0.5, night: 1 };
const STUDY_MAP: Record<string, number> = { room: 0, library: 0.33, cafe: 0.66, mixed: 1 };

// Human-readable labels for lifestyle traits (for explanations)
const LIFESTYLE_LABELS: Record<string, string> = {
  sleepSchedule: "sleep schedules",
  cleanliness: "cleanliness expectations",
  guestFrequency: "guest preferences",
  noiseTolerance: "noise tolerance",
  dailyRoutine: "morning vs night rhythm",
  studyHabits: "study habits",
};

function ordinalSimilarity(a: string, b: string, order: string[]): number {
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  if (ia === -1 || ib === -1) return 0.5;
  return 1 - Math.abs(ia - ib) / Math.max(order.length - 1, 1);
}

function numericSimilarity(a: number, b: number, max: number, min = 1): number {
  return 1 - Math.abs(a - b) / (max - min);
}

function mapSimilarity(a: string, b: string, map: Record<string, number>): number {
  const va = map[a];
  const vb = map[b];
  if (va === undefined || vb === undefined) return 0.5;
  return 1 - Math.abs(va - vb);
}

export interface TraitScore {
  key: string;
  similarity: number;
}

export function computeTraitScores(
  answersA: SurveyAnswers,
  answersB: SurveyAnswers
): TraitScore[] {
  const scores: TraitScore[] = [];

  if (answersA.sleepSchedule && answersB.sleepSchedule) {
    scores.push({
      key: "sleepSchedule",
      similarity: ordinalSimilarity(
        answersA.sleepSchedule as string,
        answersB.sleepSchedule as string,
        SLEEP_ORDER
      ),
    });
  }

  if (answersA.cleanliness != null && answersB.cleanliness != null) {
    scores.push({
      key: "cleanliness",
      similarity: numericSimilarity(
        answersA.cleanliness as number,
        answersB.cleanliness as number,
        5
      ),
    });
  }

  if (answersA.guestFrequency && answersB.guestFrequency) {
    scores.push({
      key: "guestFrequency",
      similarity: ordinalSimilarity(
        answersA.guestFrequency as string,
        answersB.guestFrequency as string,
        GUEST_ORDER
      ),
    });
  }

  if (answersA.noiseTolerance && answersB.noiseTolerance) {
    scores.push({
      key: "noiseTolerance",
      similarity: ordinalSimilarity(
        answersA.noiseTolerance as string,
        answersB.noiseTolerance as string,
        NOISE_ORDER
      ),
    });
  }

  if (answersA.dailyRoutine && answersB.dailyRoutine) {
    scores.push({
      key: "dailyRoutine",
      similarity: mapSimilarity(
        answersA.dailyRoutine as string,
        answersB.dailyRoutine as string,
        ROUTINE_MAP
      ),
    });
  }

  if (answersA.studyHabits && answersB.studyHabits) {
    scores.push({
      key: "studyHabits",
      similarity: mapSimilarity(
        answersA.studyHabits as string,
        answersB.studyHabits as string,
        STUDY_MAP
      ),
    });
  }

  return scores;
}

export interface BigFiveTraitScore {
  key: keyof BigFiveScores;
  score: number;
  similarity: number;
}

/**
 * Roommate-focused Big Five scoring:
 * - Similarity (1 - |a-b|/100) is the base for all traits.
 * - Agreeableness: penalize large mismatch (one very high, one very low → conflict risk).
 * - Neuroticism: reward both low (emotional stability = calmer living). Blend similarity with low-average bonus.
 * - Weight A and C higher (cooperation, cleanliness matter most for roommates).
 */
export function computeBigFiveScores(
  a: BigFiveScores | null,
  b: BigFiveScores | null
): { overall: number; traits: BigFiveTraitScore[] } | null {
  if (!a || !b) return null;

  const keys = Object.keys(BIG_FIVE_TRAIT_WEIGHTS) as (keyof BigFiveScores)[];
  const traits: BigFiveTraitScore[] = [];

  for (const k of keys) {
    const va = a[k];
    const vb = b[k];
    if (typeof va !== "number" || typeof vb !== "number") continue;

    let similarity = 1 - Math.abs(va - vb) / 100;

    // Agreeableness: penalize large mismatch (one very agreeable, one not = conflict)
    if (k === "A" && Math.abs(va - vb) > 35) {
      similarity *= 0.8;
    }

    // Neuroticism: reward both low (emotional stability). Blend similarity with "low is good".
    let score = similarity;
    if (k === "N") {
      const avgN = (va + vb) / 2;
      const lowBonus = 1 - avgN / 100; // 0-1, higher when both low
      score = 0.65 * similarity + 0.35 * lowBonus;
    }

    traits.push({ key: k, score, similarity });
  }

  if (traits.length === 0) return null;

  const totalWeight = traits.reduce((sum, t) => sum + BIG_FIVE_TRAIT_WEIGHTS[t.key], 0);
  const weightedSum = traits.reduce((sum, t) => sum + t.score * BIG_FIVE_TRAIT_WEIGHTS[t.key], 0);
  const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return { overall, traits };
}

/** Legacy: simple average similarity (for backward compatibility if needed). */
export function bigFiveSimilarity(a: BigFiveScores | null, b: BigFiveScores | null): number | null {
  const result = computeBigFiveScores(a, b);
  return result ? result.overall : null;
}

export interface CompatibilityResult {
  score: number;
  lifestyleScore: number;
  bigFiveScore: number | null;
  lifestyleScores: TraitScore[];
  bigFiveTraits: BigFiveTraitScore[] | null;
  explanation: string;
}

export function computeCompatibilityWithBreakdown(
  answersA: SurveyAnswers,
  answersB: SurveyAnswers,
  weights: Record<string, number> = {},
  bigFiveA: BigFiveScores | null = null,
  bigFiveB: BigFiveScores | null = null
): CompatibilityResult {
  const lifestyleScores = computeTraitScores(answersA, answersB);
  const lifestyleScore =
    lifestyleScores.length === 0
      ? 0
      : (() => {
          let weightedSum = 0;
          let totalWeight = 0;
          for (const s of lifestyleScores) {
            const w = weights[s.key] ?? 1.0;
            weightedSum += s.similarity * w;
            totalWeight += w;
          }
          return totalWeight === 0 ? 0 : weightedSum / totalWeight;
        })();

  const bigFiveResult = computeBigFiveScores(bigFiveA, bigFiveB);
  const bigFiveScore = bigFiveResult?.overall ?? null;
  const bigFiveTraits = bigFiveResult?.traits ?? null;

  let totalScore: number;
  if (bigFiveScore !== null) {
    totalScore =
      (1 - BIG_FIVE_WEIGHT) * lifestyleScore + BIG_FIVE_WEIGHT * bigFiveScore;
  } else {
    totalScore = lifestyleScore;
  }

  const explanation = getMatchExplanation(
    lifestyleScores,
    bigFiveTraits,
    bigFiveA,
    bigFiveB
  );

  return {
    score: Math.round(totalScore * 100),
    lifestyleScore,
    bigFiveScore,
    lifestyleScores,
    bigFiveTraits,
    explanation,
  };
}

export function computeCompatibility(
  answersA: SurveyAnswers,
  answersB: SurveyAnswers,
  weights: Record<string, number> = {},
  bigFiveA: BigFiveScores | null = null,
  bigFiveB: BigFiveScores | null = null
): number {
  return computeCompatibilityWithBreakdown(
    answersA,
    answersB,
    weights,
    bigFiveA,
    bigFiveB
  ).score;
}

/**
 * Build a short, readable explanation of why two people might get along as roommates.
 */
function getMatchExplanation(
  lifestyleScores: TraitScore[],
  bigFiveTraits: BigFiveTraitScore[] | null,
  bigFiveA: BigFiveScores | null,
  bigFiveB: BigFiveScores | null
): string {
  const parts: string[] = [];

  // Top 2–3 lifestyle alignments (similarity > 0.6)
  const strongLifestyle = lifestyleScores
    .filter((s) => s.similarity >= 0.55)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
  if (strongLifestyle.length > 0) {
    const labels = strongLifestyle
      .map((s) => LIFESTYLE_LABELS[s.key] ?? s.key)
      .join(", ");
    parts.push(`You’re aligned on ${labels}.`);
  }

  // Big Five: 1–2 strongest traits (high score) or “similar personality”
  if (bigFiveTraits && bigFiveTraits.length > 0 && bigFiveA && bigFiveB) {
    const strong = bigFiveTraits
      .filter((t) => t.score >= 0.65)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    if (strong.length >= 1) {
      const names = strong.map((t) => BIG_FIVE_NAMES[t.key]).join(" and ");
      parts.push(`Similar ${names}—good for cooperation and a calm space.`);
    } else {
      const avgScore =
        bigFiveTraits.reduce((s, t) => s + t.score, 0) / bigFiveTraits.length;
      if (avgScore >= 0.5) {
        parts.push("Your personality profiles are a good fit for living together.");
      }
    }

    // If both low on Neuroticism, call it out
    const nTrait = bigFiveTraits.find((t) => t.key === "N");
    if (nTrait && nTrait.score >= 0.7 && bigFiveA.N < 45 && bigFiveB.N < 45) {
      if (!parts.some((p) => p.includes("emotional stability"))) {
        parts.push("Both of you tend to be emotionally steady—helps keep the peace.");
      }
    }
  }

  if (parts.length === 0) {
    return "You share some lifestyle overlap; we think you could be a good fit.";
  }

  return parts.join(" ");
}

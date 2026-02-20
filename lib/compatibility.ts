import type { SurveyAnswers } from "./survey-questions";

const SLEEP_ORDER = ["9pm-5am", "10pm-6am", "11pm-7am", "12am-8am", "1am-9am", "2am-10am"];
const GUEST_ORDER = ["never", "rarely", "sometimes", "often"];
const NOISE_ORDER = ["silent", "low", "medium", "high"];
const ROUTINE_MAP: Record<string, number> = { morning: 0, flexible: 0.5, night: 1 };
const STUDY_MAP: Record<string, number> = { room: 0, library: 0.33, cafe: 0.66, mixed: 1 };

function ordinalSimilarity(a: string, b: string, order: string[]): number {
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  if (ia === -1 || ib === -1) return 0.5;
  return 1 - Math.abs(ia - ib) / (order.length - 1);
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

interface TraitScore {
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

export function computeCompatibility(
  answersA: SurveyAnswers,
  answersB: SurveyAnswers,
  weights: Record<string, number> = {}
): number {
  const traitScores = computeTraitScores(answersA, answersB);
  if (traitScores.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const score of traitScores) {
    const w = weights[score.key] ?? 1.0;
    weightedSum += score.similarity * w;
    totalWeight += w;
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 100);
}

import type { SurveyAnswers } from "./survey-questions";

export interface Tag {
  label: string;
  color: "blue" | "green" | "yellow" | "purple" | "pink" | "orange";
}

export function generateTags(answers: SurveyAnswers): Tag[] {
  const tags: Tag[] = [];

  const sleep = answers.sleepSchedule as string;
  if (sleep === "9pm-5am" || sleep === "10pm-6am") {
    tags.push({ label: "Early Bird", color: "yellow" });
  } else if (sleep === "1am-9am" || sleep === "2am-10am") {
    tags.push({ label: "Night Owl", color: "purple" });
  }

  const clean = answers.cleanliness as number;
  if (clean >= 4) {
    tags.push({ label: "Very Tidy", color: "green" });
  } else if (clean <= 2) {
    tags.push({ label: "Relaxed Cleaner", color: "orange" });
  }

  const guests = answers.guestFrequency as string;
  if (guests === "never" || guests === "rarely") {
    tags.push({ label: "Low Guests", color: "blue" });
  } else if (guests === "often") {
    tags.push({ label: "Social Host", color: "pink" });
  }

  const noise = answers.noiseTolerance as string;
  if (noise === "silent" || noise === "low") {
    tags.push({ label: "Quiet Space", color: "blue" });
  } else if (noise === "high") {
    tags.push({ label: "Noise Friendly", color: "orange" });
  }

  const routine = answers.dailyRoutine as string;
  if (routine === "morning") {
    tags.push({ label: "Morning Person", color: "yellow" });
  } else if (routine === "night") {
    tags.push({ label: "Night Active", color: "purple" });
  }

  const study = answers.studyHabits as string;
  if (study === "room") {
    tags.push({ label: "Studies in Room", color: "blue" });
  } else if (study === "library") {
    tags.push({ label: "Library Goer", color: "green" });
  }

  if (answers.personality) {
    tags.push({ label: String(answers.personality).toUpperCase(), color: "pink" });
  }

  return tags;
}

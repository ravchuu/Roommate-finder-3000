import type { SurveyAnswers } from "./survey-questions";

export interface Tag {
  label: string;
  color: "blue" | "green" | "yellow" | "purple" | "pink" | "orange";
}

export function generateTags(answers: SurveyAnswers | null | undefined): Tag[] {
  const tags: Tag[] = [];
  if (!answers || typeof answers !== "object") return tags;

  const bedtime = answers.sleepBedtime as string | undefined;
  const wake = answers.sleepWake as string | undefined;
  if (bedtime === "8-10pm" && (wake === "5-7am" || wake === "7-9am")) {
    tags.push({ label: "Early Bird", color: "yellow" });
  } else if ((bedtime === "12-2am" || bedtime === "2am-later") && (wake === "9-11am" || wake === "12pm-later")) {
    tags.push({ label: "Night Owl", color: "purple" });
  } else if (bedtime === "depends" || wake === "depends") {
    tags.push({ label: "Flexible Sleep", color: "blue" });
  }

  const clean = Number(answers.cleanliness);
  if (!Number.isNaN(clean) && clean >= 4) {
    tags.push({ label: "Very Tidy", color: "green" });
  } else if (!Number.isNaN(clean) && clean <= 2) {
    tags.push({ label: "Relaxed Cleaner", color: "orange" });
  }

  const guests = answers.guestFrequency as string | undefined;
  if (guests === "never" || guests === "rarely") {
    tags.push({ label: "Low Guests", color: "blue" });
  } else if (guests === "often" || guests === "very-often") {
    tags.push({ label: "Social Host", color: "pink" });
  }

  const noise = answers.noiseTolerance as string | undefined;
  if (noise === "silent" || noise === "low") {
    tags.push({ label: "Quiet Space", color: "blue" });
  } else if (noise === "high" || noise === "any") {
    tags.push({ label: "Noise Friendly", color: "orange" });
  }

  const space = answers.spaceUsage as string | undefined;
  if (space === "always-room" || space === "mostly-room") {
    tags.push({ label: "Room Homebody", color: "blue" });
  } else if (space === "mostly-common" || space === "always-common") {
    tags.push({ label: "Common Area", color: "green" });
  }

  const relationship = answers.roommateRelationship as string | undefined;
  if (relationship === "close-friends" || relationship === "good-friends") {
    tags.push({ label: "Wants Close Friends", color: "pink" });
  } else if (relationship === "keep-to-ourselves") {
    tags.push({ label: "Prefers Independence", color: "purple" });
  }

  return tags;
}

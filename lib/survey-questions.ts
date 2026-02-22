export interface SurveyQuestion {
  key: string;
  title: string;
  description: string;
  type: "select" | "slider" | "text";
  options?: { value: string; label: string; emoji: string }[];
  min?: number;
  max?: number;
  labels?: { min: string; max: string };
  required: boolean;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    key: "sleepBedtime",
    title: "When do you usually go to sleep?",
    description: "Your typical bedtime",
    type: "select",
    options: [
      { value: "8-10pm", label: "8–10 PM", emoji: "🌙" },
      { value: "10-12am", label: "10 PM–12 AM", emoji: "🕚" },
      { value: "12-2am", label: "12–2 AM", emoji: "🦉" },
      { value: "2am-later", label: "2 AM or later", emoji: "🌃" },
      { value: "depends", label: "It depends", emoji: "🔄" },
    ],
    required: true,
  },
  {
    key: "sleepWake",
    title: "When do you usually wake up?",
    description: "Your typical wake time",
    type: "select",
    options: [
      { value: "5-7am", label: "5–7 AM", emoji: "🌅" },
      { value: "7-9am", label: "7–9 AM", emoji: "☀️" },
      { value: "9-11am", label: "9–11 AM", emoji: "🌤️" },
      { value: "12pm-later", label: "12 PM or later", emoji: "🕛" },
      { value: "depends", label: "It depends", emoji: "🔄" },
    ],
    required: true,
  },
  {
    key: "cleanliness",
    title: "How clean do you keep your space?",
    description: "Which best describes your typical cleanliness?",
    type: "select",
    options: [
      { value: "1", label: "Very relaxed", emoji: "😌" },
      { value: "2", label: "Relaxed", emoji: "🙂" },
      { value: "3", label: "Moderate", emoji: "👍" },
      { value: "4", label: "Tidy", emoji: "✨" },
      { value: "5", label: "Spotless", emoji: "🌟" },
    ],
    required: true,
  },
  {
    key: "guestFrequency",
    title: "How often do you have guests over?",
    description: "Friends visiting, study groups, etc.",
    type: "select",
    options: [
      { value: "never", label: "Never", emoji: "🚫" },
      { value: "rarely", label: "Rarely (a few times a month)", emoji: "🤏" },
      { value: "sometimes", label: "Sometimes (about weekly)", emoji: "👋" },
      { value: "often", label: "Often (multiple times a week)", emoji: "🎉" },
      { value: "very-often", label: "Very often (most days)", emoji: "🏠" },
    ],
    required: true,
  },
  {
    key: "noiseTolerance",
    title: "How much noise are you okay with at home?",
    description: "Ambient noise when you're in your space",
    type: "select",
    options: [
      { value: "silent", label: "I need silence", emoji: "🤫" },
      { value: "low", label: "Low noise only", emoji: "🔈" },
      { value: "moderate", label: "Moderate noise is okay", emoji: "🔉" },
      { value: "high", label: "I can handle a lot of noise", emoji: "🔊" },
      { value: "any", label: "Noise doesn't bother me", emoji: "✅" },
    ],
    required: true,
  },
  {
    key: "spaceUsage",
    title: "When you're home, do you mostly keep to your room or use shared space?",
    description: "Where you tend to be when you're in the building",
    type: "select",
    options: [
      { value: "always-room", label: "Almost always in my room", emoji: "🚪" },
      { value: "mostly-room", label: "Mostly my room", emoji: "🛏️" },
      { value: "mix", label: "Mix of room and common areas", emoji: "🔄" },
      { value: "mostly-common", label: "Mostly common areas", emoji: "🛋️" },
      { value: "always-common", label: "Almost always in common areas", emoji: "👥" },
    ],
    required: true,
  },
  {
    key: "roommateRelationship",
    title: "What do you want with a roommate?",
    description: "The kind of relationship you're looking for",
    type: "select",
    options: [
      { value: "keep-to-ourselves", label: "We keep to ourselves", emoji: "🙂" },
      { value: "friendly-independent", label: "We're friendly but independent", emoji: "👋" },
      { value: "hang-out-sometimes", label: "We hang out sometimes", emoji: "☕" },
      { value: "good-friends", label: "I'd like us to be good friends", emoji: "💬" },
      { value: "close-friends", label: "I'd like us to be close friends", emoji: "❤️" },
    ],
    required: true,
  },
  {
    key: "conflictStyle",
    title: "When something bothers you about a living situation, you usually…",
    description: "How you tend to handle minor conflicts",
    type: "select",
    options: [
      { value: "direct", label: "Bring it up directly", emoji: "💬" },
      { value: "hints", label: "Drop hints or leave a note", emoji: "📝" },
      { value: "let-go", label: "Let it go unless it's serious", emoji: "🤷" },
      { value: "avoid", label: "Avoid conflict and adapt", emoji: "😌" },
      { value: "depends", label: "It depends on the situation", emoji: "🔄" },
    ],
    required: true,
  },
];

export type SurveyAnswers = Record<string, string | number>;

/** Get human-readable label for a survey answer (for display on dashboard, etc.) */
export function getSurveyAnswerLabel(
  question: SurveyQuestion,
  value: string | number | undefined
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (question.type === "select" && question.options) {
    const opt = question.options.find((o) => o.value === String(value));
    return opt ? `${opt.emoji} ${opt.label}` : String(value);
  }
  if (question.type === "slider") return String(value);
  return String(value);
}

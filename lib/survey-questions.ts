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
    key: "sleepSchedule",
    title: "What's your sleep schedule?",
    description: "When do you typically go to bed and wake up?",
    type: "select",
    options: [
      { value: "9pm-5am", label: "9 PM - 5 AM", emoji: "🌙" },
      { value: "10pm-6am", label: "10 PM - 6 AM", emoji: "🌅" },
      { value: "11pm-7am", label: "11 PM - 7 AM", emoji: "☀️" },
      { value: "12am-8am", label: "12 AM - 8 AM", emoji: "🕛" },
      { value: "1am-9am", label: "1 AM - 9 AM", emoji: "🦉" },
      { value: "2am-10am", label: "2 AM - 10 AM", emoji: "🌃" },
    ],
    required: true,
  },
  {
    key: "cleanliness",
    title: "How clean do you keep your space?",
    description: "Rate your typical cleanliness level",
    type: "slider",
    min: 1,
    max: 5,
    labels: { min: "Relaxed", max: "Spotless" },
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
      { value: "sometimes", label: "Sometimes (weekly)", emoji: "👋" },
      { value: "often", label: "Often (multiple times a week)", emoji: "🎉" },
    ],
    required: true,
  },
  {
    key: "noiseTolerance",
    title: "What's your noise tolerance?",
    description: "How much ambient noise are you comfortable with?",
    type: "select",
    options: [
      { value: "silent", label: "I need silence", emoji: "🤫" },
      { value: "low", label: "Low noise is fine", emoji: "🔈" },
      { value: "medium", label: "Moderate noise is okay", emoji: "🔉" },
      { value: "high", label: "I can handle anything", emoji: "🔊" },
    ],
    required: true,
  },
  {
    key: "dailyRoutine",
    title: "Are you a morning person or night owl?",
    description: "When are you most active and productive?",
    type: "select",
    options: [
      { value: "morning", label: "Morning person", emoji: "🌅" },
      { value: "flexible", label: "Flexible / Depends on the day", emoji: "🔄" },
      { value: "night", label: "Night owl", emoji: "🦉" },
    ],
    required: true,
  },
  {
    key: "studyHabits",
    title: "Where do you prefer to study?",
    description: "This helps match you with someone who has similar habits",
    type: "select",
    options: [
      { value: "room", label: "In my room", emoji: "🏠" },
      { value: "library", label: "At the library", emoji: "📚" },
      { value: "cafe", label: "Coffee shops / common areas", emoji: "☕" },
      { value: "mixed", label: "A mix of places", emoji: "🔄" },
    ],
    required: true,
  },
  {
    key: "personality",
    title: "What's your personality type? (Optional)",
    description: "MBTI, Big Five, or a brief self-description",
    type: "text",
    required: false,
  },
];

export type SurveyAnswers = Record<string, string | number>;

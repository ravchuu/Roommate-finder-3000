"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { SURVEY_QUESTIONS, type SurveyAnswers } from "@/lib/survey-questions";

const BIG_FIVE_KEYS = ["O", "C", "E", "A", "N"] as const;
const BIG_FIVE_LABELS: Record<string, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  N: "Neuroticism",
};

type BigFiveScores = Record<(typeof BIG_FIVE_KEYS)[number], number>;

const DEFAULT_BIG_FIVE: BigFiveScores = { O: 50, C: 50, E: 50, A: 50, N: 50 };

export default function SurveyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [bigFive, setBigFive] = useState<BigFiveScores>(() => ({ ...DEFAULT_BIG_FIVE }));
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);

  const totalQuestionSteps = SURVEY_QUESTIONS.length;
  const totalSteps = totalQuestionSteps + 1; // +1 for Big Five
  const isBigFiveStep = step === totalQuestionSteps;

  useEffect(() => {
    async function load() {
      const [surveyRes, profileRes] = await Promise.all([
        fetch("/api/survey"),
        fetch("/api/profile"),
      ]);
      const surveyData = await surveyRes.json();
      const profileData = await profileRes.json();
      if (surveyData.answers) setAnswers(surveyData.answers);
      if (profileData.bigFiveScores && typeof profileData.bigFiveScores === "object") {
        setBigFive((prev) => ({ ...prev, ...profileData.bigFiveScores }));
      }
      setLoading(false);
    }
    load();
  }, []);

  const question = !isBigFiveStep ? SURVEY_QUESTIONS[step] : null;
  const progress = ((step + 1) / totalSteps) * 100;

  function setAnswer(value: string | number) {
    if (question) setAnswers((prev) => ({ ...prev, [question.key]: value }));
  }

  function next() {
    if (step < totalSteps - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  }

  function prev() {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  }

  const bigFiveValid =
    BIG_FIVE_KEYS.every((k) => typeof bigFive[k] === "number" && bigFive[k] >= 0 && bigFive[k] <= 100);

  async function handleSubmit() {
    setSaving(true);
    await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bigFiveScores: bigFive }),
    });
    setComplete(true);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (complete) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">Survey Complete!</h1>
        <p className="text-muted-foreground mb-8">
          Your answers have been saved. We&apos;ll use them to find your best
          roommate matches.
        </p>
        <Button onClick={() => router.push("/roommates")} size="lg">
          View Potential Roommates
        </Button>
      </div>
    );
  }

  const canProceedQuestion =
    question && (!question.required || answers[question.key] !== undefined);
  const canProceed = isBigFiveStep ? bigFiveValid : canProceedQuestion;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              {isBigFiveStep ? "Step" : "Question"} {step + 1} of {totalSteps}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -50 }}
          transition={{ duration: 0.25 }}
          className="min-h-[300px]"
        >
          {isBigFiveStep ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-2">Big Five personality (final step)</h2>
              <p className="text-muted-foreground mb-4">
                Complete this to access your dashboard and roommate matches. Take the free Big Five test (about 10 minutes), then record your scores below.
              </p>
              <p className="mb-6">
                <a
                  href="https://bigfive-test.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-medium underline hover:no-underline"
                >
                  Take the Big Five personality test →
                </a>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your scores below (0–100 per trait). If your test uses a 1–5 scale, multiply each score by 20.
              </p>
              <div className="space-y-5">
                {BIG_FIVE_KEYS.map((key) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">
                        {BIG_FIVE_LABELS[key]} <span className="text-muted-foreground font-mono">({key})</span>
                      </Label>
                      <span className="text-sm text-muted-foreground font-mono w-10 text-right">
                        {bigFive[key]}
                      </span>
                    </div>
                    <Slider
                      value={[bigFive[key]]}
                      onValueChange={([val]) =>
                        setBigFive((prev) => ({ ...prev, [key]: val }))
                      }
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : question ? (
            <>
              <h2 className="text-2xl font-bold mb-2">{question.title}</h2>
              <p className="text-muted-foreground mb-6">{question.description}</p>

              {question.type === "select" && question.options && (
                <div className="space-y-2">
                  {question.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAnswer(opt.value)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3",
                        answers[question.key] === opt.value
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          onClick={prev}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {step < totalSteps - 1 ? (
          <Button onClick={next} disabled={!canProceed}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finish Survey
          </Button>
        )}
      </div>
    </div>
  );
}

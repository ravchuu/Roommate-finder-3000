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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SURVEY_QUESTIONS, type SurveyAnswers } from "@/lib/survey-questions";

export default function SurveyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/survey");
      const data = await res.json();
      if (data.answers) setAnswers(data.answers);
      setLoading(false);
    }
    load();
  }, []);

  const question = SURVEY_QUESTIONS[step];
  const totalSteps = SURVEY_QUESTIONS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  function setAnswer(value: string | number) {
    setAnswers((prev) => ({ ...prev, [question.key]: value }));
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

  async function handleSubmit() {
    setSaving(true);
    await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
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

  const canProceed =
    !question.required || answers[question.key] !== undefined;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              Question {step + 1} of {totalSteps}
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

          {question.type === "slider" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {Array.from(
                  { length: (question.max || 5) - (question.min || 1) + 1 },
                  (_, i) => i + (question.min || 1)
                ).map((val) => (
                  <button
                    key={val}
                    onClick={() => setAnswer(val)}
                    className={cn(
                      "flex-1 py-4 rounded-xl border text-lg font-bold transition-all",
                      answers[question.key] === val
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{question.labels?.min}</span>
                <span>{question.labels?.max}</span>
              </div>
            </div>
          )}

          {question.type === "text" && (
            <Input
              value={(answers[question.key] as string) || ""}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. INTJ, or describe yourself briefly..."
              className="text-lg py-6"
            />
          )}
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

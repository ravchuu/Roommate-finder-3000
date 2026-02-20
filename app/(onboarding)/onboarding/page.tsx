"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  DoorOpen,
  ClipboardList,
  Users,
  CheckCircle2,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SURVEY_QUESTIONS, type SurveyAnswers } from "@/lib/survey-questions";

interface RoomAvailability {
  roomSize: number;
  totalRooms: number;
  seatsRemaining: number;
  available: boolean;
}

interface StudentInfo {
  name: string;
  age: number | null;
  gender: string | null;
  email: string;
  nickname: string | null;
  phone: string | null;
  personalEmail: string | null;
  preferPersonalEmail: boolean;
  preferredRoomSizes: number[];
  onboardingComplete: boolean;
}

const STEPS = [
  { label: "Welcome", icon: User },
  { label: "About You", icon: User },
  { label: "Room Size", icon: DoorOpen },
  { label: "Lifestyle Survey", icon: ClipboardList },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState(1);
  const [complete, setComplete] = useState(false);

  // Step 1 state
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [preferPersonalEmail, setPreferPersonalEmail] = useState(false);

  // Step 2 state
  const [roomOptions, setRoomOptions] = useState<RoomAvailability[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);

  // Step 3 state
  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>({});
  const [surveyDirection, setSurveyDirection] = useState(1);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/onboarding");
      const data = await res.json();
      if (data.student) {
        setStudent(data.student);
        if (data.student.nickname) setNickname(data.student.nickname);
        if (data.student.phone) setPhone(data.student.phone);
        if (data.student.personalEmail) setPersonalEmail(data.student.personalEmail);
        setPreferPersonalEmail(data.student.preferPersonalEmail || false);
        if (data.student.preferredRoomSizes?.length) setSelectedRooms(data.student.preferredRoomSizes);
        if (data.student.onboardingComplete) {
          router.push("/dashboard");
          return;
        }
      }
      if (data.surveyAnswers) setSurveyAnswers(data.surveyAnswers);
      setRoomOptions(data.roomAvailability || []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function saveStep1() {
    setSaving(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: 1, nickname, phone, personalEmail, preferPersonalEmail }),
    });
    setSaving(false);
    goNext();
  }

  async function saveStep2() {
    if (selectedRooms.length === 0) return;
    setSaving(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: 2, roomSizes: selectedRooms }),
    });
    setSaving(false);
    goNext();
  }

  async function saveStep3() {
    setSaving(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: 3, answers: surveyAnswers }),
    });
    setSaving(false);
    setComplete(true);
  }

  function goNext() {
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
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
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">You&apos;re All Set!</h1>
        <p className="text-muted-foreground mb-8">
          Your profile is ready. Let&apos;s find you some roommates.
        </p>
        <Button onClick={() => router.push("/dashboard")} size="lg">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator (hidden on welcome screen) */}
      {step > 0 && (
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.slice(1).map((s, i) => {
            const Icon = s.icon;
            const adjustedStep = step - 1;
            const isDone = i < adjustedStep;
            const isCurrent = i === adjustedStep;
            return (
              <div key={s.label} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={cn("w-10 h-0.5 rounded-full", isDone ? "bg-primary" : "bg-muted")} />
                )}
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors",
                    isCurrent && "bg-pastel-teal/50 text-primary font-medium",
                    isDone && "bg-primary/10 text-primary",
                    !isCurrent && !isDone && "text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -60 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && <StepWelcome />}
          {step === 1 && <StepAboutYou />}
          {step === 2 && <StepRoomSize />}
          {step === 3 && <StepSurvey />}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  // --- STEP 0: Welcome ---
  function StepWelcome() {
    const firstName = student?.name?.split(" ")[0] || "";
    return (
      <div className="relative flex flex-col items-center justify-center text-center py-16 overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-pastel-teal/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -right-16 w-52 h-52 bg-pastel-mint/25 rounded-full blur-3xl" />
        <div className="absolute top-10 right-10 w-32 h-32 bg-pastel-peach/15 rounded-full blur-2xl" />

        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="relative z-10 mb-6"
        >
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-pastel-teal via-pastel-mint to-pastel-green flex items-center justify-center shadow-lg shadow-pastel-teal/30">
            <Users className="h-10 w-10 text-white" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative z-10"
        >
          <h1 className="text-5xl font-bold mb-3 tracking-tight">
            Welcome, <span className="bg-gradient-to-r from-primary to-teal-500 bg-clip-text text-transparent">{firstName}</span>!
          </h1>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto mb-10 leading-relaxed">
            Let&apos;s set up your profile and find you the perfect roommates.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="relative z-10"
        >
          <Button onClick={goNext} size="lg" className="px-12 py-6 text-base rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-shadow">
            Get Started
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // --- STEP 1: About You ---
  function StepAboutYou() {
    return (
      <div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">A few things about you</h1>
          <p className="text-muted-foreground">
            This info helps your future roommates get to know you.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nickname" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Nickname <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="What your roommates should call you"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
            <p className="text-xs text-muted-foreground">
              Only visible to your roommate group members.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="personalEmail" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Personal Email <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="personalEmail"
              type="email"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
              placeholder="your@personal-email.com"
            />
            {personalEmail && (
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={preferPersonalEmail}
                  onChange={(e) => setPreferPersonalEmail(e.target.checked)}
                  className="rounded border-border h-4 w-4 accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  I prefer to be contacted at this email
                </span>
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={goBack} size="lg">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button onClick={saveStep1} disabled={saving} className="flex-1" size="lg">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Continue
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // --- STEP 2: Room Size ---
  function StepRoomSize() {
    function toggleRoom(size: number) {
      setSelectedRooms((prev) =>
        prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
      );
    }

    return (
      <div>
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-pastel-teal/50 text-primary flex items-center justify-center mx-auto mb-4">
            <DoorOpen className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Room Size Preferences</h1>
          <p className="text-muted-foreground">
            Select all the room sizes you&apos;d be open to. You&apos;ll commit to
            one when you find your first roommate.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {roomOptions.map((opt) => {
            const isSelected = selectedRooms.includes(opt.roomSize);
            return (
              <Card
                key={opt.roomSize}
                className={cn(
                  "cursor-pointer transition-all",
                  isSelected
                    ? "ring-2 ring-primary shadow-md"
                    : "hover:shadow-sm",
                  !opt.available && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => opt.available && toggleRoom(opt.roomSize)}
              >
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {opt.roomSize}-Person Room
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {opt.seatsRemaining} seats remaining &middot; {opt.totalRooms} rooms total
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  {!opt.available && (
                    <span className="text-xs text-destructive font-medium">Full</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={goBack} size="lg">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            onClick={saveStep2}
            disabled={selectedRooms.length === 0 || saving}
            className="flex-1"
            size="lg"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Continue
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // --- STEP 3: Lifestyle Survey ---
  function StepSurvey() {
    const question = SURVEY_QUESTIONS[surveyStep];
    const totalQ = SURVEY_QUESTIONS.length;
    const progress = ((surveyStep + 1) / totalQ) * 100;
    const canProceed = !question.required || surveyAnswers[question.key] !== undefined;
    const isLast = surveyStep === totalQ - 1;

    function setAnswer(value: string | number, autoAdvance = false) {
      setSurveyAnswers((prev) => ({ ...prev, [question.key]: value }));
      if (autoAdvance && !isLast) {
        setTimeout(() => {
          setSurveyDirection(1);
          setSurveyStep((s) => Math.min(s + 1, totalQ - 1));
        }, 350);
      }
    }

    function surveyNext() {
      if (surveyStep < totalQ - 1) {
        setSurveyDirection(1);
        setSurveyStep(surveyStep + 1);
      }
    }

    function surveyPrev() {
      if (surveyStep > 0) {
        setSurveyDirection(-1);
        setSurveyStep(surveyStep - 1);
      }
    }

    return (
      <div>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                Question {surveyStep + 1} of {totalQ}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait" custom={surveyDirection}>
          <motion.div
            key={surveyStep}
            custom={surveyDirection}
            initial={{ opacity: 0, x: surveyDirection * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: surveyDirection * -50 }}
            transition={{ duration: 0.2 }}
            className="min-h-[280px]"
          >
            <h2 className="text-2xl font-bold mb-2">{question.title}</h2>
            <p className="text-muted-foreground mb-6">{question.description}</p>

            {question.type === "select" && question.options && (
              <div className="space-y-2">
                {question.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswer(opt.value, true)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3",
                      surveyAnswers[question.key] === opt.value
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
                      onClick={() => setAnswer(val, true)}
                      className={cn(
                        "flex-1 py-4 rounded-xl border text-lg font-bold transition-all",
                        surveyAnswers[question.key] === val
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
                value={(surveyAnswers[question.key] as string) || ""}
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
            onClick={surveyStep === 0 ? goBack : surveyPrev}
            size="lg"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {isLast ? (
            <Button onClick={saveStep3} disabled={!canProceed || saving} size="lg">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finish Setup
            </Button>
          ) : (
            <Button onClick={surveyNext} disabled={!canProceed} size="lg">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    );
  }
}

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * For students: redirect to /survey if they haven't completed the survey and Big Five.
 * Ensures first-time users can't access dashboard/roommates until the full survey (including Big Five) is done.
 * Set NEXT_PUBLIC_SKIP_SURVEY_GATE=true in .env.local to bypass (e.g. to view dashboard directly when testing).
 */
export function SurveyGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const skipGate = process.env.NEXT_PUBLIC_SKIP_SURVEY_GATE === "true";

  useEffect(() => {
    if (skipGate || pathname === "/survey") return;

    let cancelled = false;
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const hasSurvey = data.surveyAnswers != null && typeof data.surveyAnswers === "object";
        const hasBigFive =
          data.bigFiveScores != null &&
          typeof data.bigFiveScores === "object" &&
          ["O", "C", "E", "A", "N"].every((k) => typeof data.bigFiveScores[k] === "number");
        if (!hasSurvey || !hasBigFive) {
          router.replace("/survey");
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return <>{children}</>;
}

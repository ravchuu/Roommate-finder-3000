"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen, Loader2, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RoomAvailability {
  roomSize: number;
  totalRooms: number;
  roomsFormed: number;
  seatsRemaining: number;
  available: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [options, setOptions] = useState<RoomAvailability[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/onboarding");
      const data = await res.json();
      setOptions(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleContinue() {
    if (!selected) return;
    setSaving(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomSize: selected }),
    });
    router.push("/survey");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <DoorOpen className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Choose Your Room Size</h1>
        <p className="text-muted-foreground">
          Select your preferred room size. This helps us match you with
          roommates looking for the same setup.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {options.map((opt) => (
          <Card
            key={opt.roomSize}
            className={cn(
              "cursor-pointer transition-all",
              selected === opt.roomSize
                ? "ring-2 ring-primary shadow-md"
                : "hover:shadow-sm",
              !opt.available && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => opt.available && setSelected(opt.roomSize)}
          >
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center",
                    selected === opt.roomSize
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
                    {opt.seatsRemaining} seats remaining &middot;{" "}
                    {opt.totalRooms} rooms total
                  </p>
                </div>
              </div>
              {selected === opt.roomSize && (
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
              )}
              {!opt.available && (
                <span className="text-xs text-destructive font-medium">
                  Full
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!selected || saving}
        className="w-full"
        size="lg"
      >
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continue to Lifestyle Survey
      </Button>
    </div>
  );
}

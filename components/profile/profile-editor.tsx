"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Save,
  Loader2,
  CheckCircle2,
  SlidersHorizontal,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SURVEY_QUESTIONS } from "@/lib/survey-questions";
import { generateTags, type Tag } from "@/lib/tags";
import { cn } from "@/lib/utils";

const TAG_COLORS: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  green: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

const BIG_FIVE_LABELS: { key: keyof BigFiveScores; label: string }[] = [
  { key: "O", label: "Openness" },
  { key: "C", label: "Conscientiousness" },
  { key: "E", label: "Extraversion" },
  { key: "A", label: "Agreeableness" },
  { key: "N", label: "Neuroticism" },
];

interface BigFiveScores {
  O: number;
  C: number;
  E: number;
  A: number;
  N: number;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  age: number | null;
  gender: string | null;
  bio: string | null;
  photo: string | null;
  preferredRoomSizes: number[];
  bigFiveScores: BigFiveScores | null;
  surveyAnswers: Record<string, string | number> | null;
  matchWeights: Record<string, number>;
}

const TRAIT_KEYS = SURVEY_QUESTIONS.filter((q) => q.required).map((q) => ({
  key: q.key,
  label: q.title.replace("What's your ", "").replace("?", "").replace("How ", ""),
}));

export function ProfileEditor({ profile }: { profile: ProfileData }) {
  const [bio, setBio] = useState(profile.bio || "");
  const [weights, setWeights] = useState<Record<string, number>>(
    TRAIT_KEYS.reduce(
      (acc, t) => ({
        ...acc,
        [t.key]: profile.matchWeights[t.key] ?? 1.0,
      }),
      {}
    )
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(profile.photo);
  const [bigFive, setBigFive] = useState<BigFiveScores>(() =>
    profile.bigFiveScores
      ? { ...profile.bigFiveScores }
      : { O: 50, C: 50, E: 50, A: 50, N: 50 }
  );
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("photo", file);

    const res = await fetch("/api/profile", {
      method: "PUT",
      body: formData,
    });

    if (res.ok) {
      setPhotoUrl(`/uploads/${profile.id}.${file.name.split(".").pop()}?t=${Date.now()}`);
    }
    setUploading(false);
  }

  const router = useRouter();
  const [bigFiveDialogOpen, setBigFiveDialogOpen] = useState(false);
  const [savingBigFive, setSavingBigFive] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, matchWeights: weights }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleSaveBigFive() {
    setSavingBigFive(true);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bigFiveScores: bigFive }),
    });
    setSavingBigFive(false);
    setBigFiveDialogOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>Edit your bio and profile photo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={photoUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90"
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-semibold text-lg">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              {profile.age && profile.gender && (
                <p className="text-sm text-muted-foreground">
                  {profile.age} &middot; {profile.gender}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">About Me</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell potential roommates about yourself..."
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/300
            </p>
          </div>

          {profile.surveyAnswers && Object.keys(profile.surveyAnswers).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">How others see you</Label>
                <Link
                  href="/survey"
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <Pencil className="h-3 w-3" /> Edit survey
                </Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {generateTags(profile.surveyAnswers).map((tag: Tag) => (
                  <span
                    key={tag.label}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-medium",
                      TAG_COLORS[tag.color] || TAG_COLORS.blue
                    )}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-3">
        <span className="text-sm font-medium">Personality (Big Five):</span>
        {profile.bigFiveScores ? (
          <span className="text-sm text-muted-foreground">
            O {profile.bigFiveScores.O} · C {profile.bigFiveScores.C} · E {profile.bigFiveScores.E} · A {profile.bigFiveScores.A} · N {profile.bigFiveScores.N}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Not set</span>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto shrink-0"
          onClick={() => setBigFiveDialogOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5 mr-1" />
          {profile.bigFiveScores ? "Edit" : "Enter scores"}
        </Button>
      </div>

      <Dialog open={bigFiveDialogOpen} onOpenChange={setBigFiveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Big Five scores</DialogTitle>
            <DialogDescription>
              Take the free{" "}
              <a
                href="https://bigfive-test.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                Big Five test
              </a>{" "}
              then enter your scores (0–100 per trait).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {BIG_FIVE_LABELS.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">
                    {label} <span className="text-muted-foreground font-mono">({key})</span>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setBigFiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBigFive} disabled={savingBigFive}>
              {savingBigFive && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <CardTitle>Match Priorities</CardTitle>
          </div>
          <CardDescription>
            Adjust how much each trait matters when finding roommate matches.
            Higher values mean the trait is more important to you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {TRAIT_KEYS.map((trait) => (
            <div key={trait.key} className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm capitalize">
                  {trait.key.replace(/([A-Z])/g, " $1").trim()}
                </Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {(weights[trait.key] || 1).toFixed(1)}
                </span>
              </div>
              <Slider
                value={[weights[trait.key] || 1]}
                onValueChange={([val]) =>
                  setWeights((prev) => ({ ...prev, [trait.key]: val }))
                }
                min={0}
                max={2}
                step={0.1}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Saved!
          </span>
        )}
      </div>
    </div>
  );
}

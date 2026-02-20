"use client";

import { useState, useRef } from "react";
import {
  Camera,
  Save,
  Loader2,
  CheckCircle2,
  SlidersHorizontal,
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
import { SURVEY_QUESTIONS } from "@/lib/survey-questions";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  age: number | null;
  gender: string | null;
  bio: string | null;
  photo: string | null;
  preferredRoomSizes: number[];
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
        </CardContent>
      </Card>

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

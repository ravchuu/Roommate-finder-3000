"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Search,
  UserPlus,
  Filter,
  UserSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/tags";

interface MatchProfile {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  bio: string | null;
  photo: string | null;
  preferredRoomSizes: number[];
  compatibility: number;
  explanation?: string;
  tags: Tag[];
  hasSurvey: boolean;
  inGroup: boolean;
}

const TAG_COLORS: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  green: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

export default function RoommatesPage() {
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const [loadError, setLoadError] = useState<string | null>(null);
  const [emptyReason, setEmptyReason] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function load() {
      setLoadError(null);
      setEmptyReason(undefined);
      try {
        const res = await fetch("/api/compatibility");
        const text = await res.text();
        if (!text.trim()) {
          setMatches([]);
          setLoading(false);
          setLoadError("No response from server.");
          return;
        }
        const data = JSON.parse(text);
        setMatches(data.matches ?? []);
        setEmptyReason(data.emptyReason);
        if (!res.ok) {
          const msg = data.error ?? "Failed to load matches.";
          if (res.status === 404) {
            setLoadError("Your account wasn't found. If you reset the database, log out and sign in again.");
          } else if (res.status === 401) {
            setLoadError("Please log in again.");
          } else {
            setLoadError(msg);
          }
        }
      } catch {
        setMatches([]);
        setLoadError("Could not load matches. Try again.");
      } finally {
        setLoading(false);
      }
    }
    load();

    async function loadSentRequests() {
      const res = await fetch("/api/requests");
      if (res.ok) {
        const data = await res.json();
        const sent = new Set<string>(
          (data.sent || []).map((r: { toStudentId: string }) => r.toStudentId)
        );
        setSentRequests(sent);
      }
    }
    loadSentRequests();
  }, []);

  async function sendRequest(toId: string) {
    setSendingRequest(toId);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStudentId: toId }),
    });
    if (res.ok) {
      setSentRequests((prev) => new Set(prev).add(toId));
    }
    setSendingRequest(null);
  }

  const allTags = Array.from(
    new Set(matches.flatMap((m) => m.tags.map((t) => t.label)))
  );

  const filtered = matches.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterTag && !m.tags.some((t) => t.label === filterTag)) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <UserSearch className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Potential Roommates</h1>
        </div>
        <p className="text-muted-foreground">
          {matches.length} students ranked by compatibility
        </p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => setFilterTag(null)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              !filterTag
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            All
          </button>
          {allTags.slice(0, 8).map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                filterTag === tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
          >
          <Card
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-mono w-6">
                    #{index + 1}
                  </span>
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={match.photo || undefined} />
                    <AvatarFallback>
                      {match.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{match.name}</h3>
                    {match.age && (
                      <span className="text-sm text-muted-foreground">
                        {match.age}
                      </span>
                    )}
                    {match.preferredRoomSizes?.map((size: number) => (
                      <Badge key={size} variant="outline" className="text-xs">
                        {size}-person
                      </Badge>
                    ))}
                    {match.inGroup && (
                      <Badge variant="secondary" className="text-xs">
                        In a group
                      </Badge>
                    )}
                  </div>
                  {match.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {match.bio}
                    </p>
                  )}
                  {match.explanation && (
                    <p className="text-xs text-muted-foreground mb-2 leading-snug">
                      {match.explanation}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {match.tags.map((tag) => (
                      <span
                        key={tag.label}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          TAG_COLORS[tag.color] || TAG_COLORS.blue
                        )}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <div
                      className={cn(
                        "text-2xl font-bold",
                        match.compatibility >= 80
                          ? "text-green-600"
                          : match.compatibility >= 60
                            ? "text-yellow-600"
                            : "text-muted-foreground"
                      )}
                    >
                      {match.compatibility}%
                    </div>
                    <p className="text-xs text-muted-foreground">match</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendRequest(match.id)}
                    disabled={
                      sendingRequest === match.id ||
                      sentRequests.has(match.id)
                    }
                  >
                    {sendingRequest === match.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : sentRequests.has(match.id) ? (
                      "Sent"
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground space-y-2">
            {loadError ? (
              <>
                <p className="font-medium text-foreground">{loadError}</p>
                <p className="text-sm">Refresh the page or try again later.</p>
                {loadError.includes("log out and sign in") && (
                  <div className="mt-4 p-4 rounded-xl bg-muted/50 text-left max-w-md mx-auto text-sm">
                    <p className="font-medium text-foreground mb-2">Demo login (after running seed):</p>
                    <p className="mb-1">Org code: <strong>westfield</strong></p>
                    <p className="mb-1">Email: <strong>alex.chen@university.edu</strong></p>
                    <p>Password: <strong>student123</strong></p>
                  </div>
                )}
              </>
            ) : (
              <>
                <UserSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium text-foreground">No compatible roommates right now</p>
                <p className="text-sm max-w-md mx-auto">
                  {emptyReason === "no_other_students"
                    ? "There are no other students in your organization who have claimed their profile yet. Once others join and complete onboarding, they’ll show up here."
                    : emptyReason === "single_gender"
                      ? "Your organization uses single-gender housing and there are no other students with the same gender who have claimed their profile yet."
                      : "Try adjusting your search or filters. If you just joined, more matches may appear as others complete their profiles."}
                </p>
                {emptyReason === "no_other_students" && (
                  <div className="mt-4 p-4 rounded-xl bg-muted/50 text-left max-w-md mx-auto text-sm">
                    <p className="font-medium text-foreground mb-2">To see matches with demo data:</p>
                    <p className="mb-1">1. Run in terminal: <code className="bg-muted px-1 rounded">npx tsx prisma/seed.ts</code></p>
                    <p className="mb-1">2. Log out, then sign in with org <strong>westfield</strong>, email <strong>alex.chen@university.edu</strong>, password <strong>student123</strong>.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

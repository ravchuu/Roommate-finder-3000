"use client";

import { useEffect, useState } from "react";
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
  preferredRoomSize: number | null;
  compatibility: number;
  tags: Tag[];
  hasSurvey: boolean;
  inRoom: boolean;
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

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/compatibility");
      const data = await res.json();
      setMatches(data.matches || []);
      setLoading(false);
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
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <UserSearch className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Potential Roommates</h1>
        </div>
        <p className="text-muted-foreground">
          {matches.length} students ranked by compatibility
        </p>
      </div>

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
          <Card
            key={match.id}
            className="hover:shadow-sm transition-shadow"
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
                    {match.preferredRoomSize && (
                      <Badge variant="outline" className="text-xs">
                        {match.preferredRoomSize}-person
                      </Badge>
                    )}
                    {match.inRoom && (
                      <Badge variant="secondary" className="text-xs">
                        In a room
                      </Badge>
                    )}
                  </div>
                  {match.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {match.bio}
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
                      sentRequests.has(match.id) ||
                      match.inRoom
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
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <UserSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No matches found. Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

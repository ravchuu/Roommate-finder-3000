"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  DoorOpen,
  Pencil,
  Users,
  Check,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StaggerParent, StaggerChild } from "@/components/motion/animated-section";
import { cn } from "@/lib/utils";

interface RoomAvailability {
  roomSize: number;
  totalRooms: number;
  bedsRemaining: number;
  available: boolean;
}

interface DashboardCardsProps {
  preferredRoomSizes: number[];
  hasSurvey: boolean;
  roomStatusLabel: string;
}

export function DashboardCards({
  preferredRoomSizes: initialRoomSizes,
  hasSurvey,
  roomStatusLabel,
}: DashboardCardsProps) {
  const router = useRouter();
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomOptions, setRoomOptions] = useState<RoomAvailability[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<number[]>(initialRoomSizes);
  const [saving, setSaving] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    setSelectedRooms(initialRoomSizes);
  }, [initialRoomSizes]);

  useEffect(() => {
    if (!roomDialogOpen) return;
    setLoadingRooms(true);
    fetch("/api/onboarding")
      .then((res) => res.json())
      .then((data) => {
        setRoomOptions(data.roomAvailability || []);
        setSelectedRooms((prev) =>
          prev.length ? prev : (data.student?.preferredRoomSizes || [])
        );
      })
      .finally(() => setLoadingRooms(false));
  }, [roomDialogOpen]);

  function toggleRoom(size: number) {
    setSelectedRooms((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  async function saveRoomPreferences() {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredRoomSizes: selectedRooms }),
    });
    setSaving(false);
    setRoomDialogOpen(false);
    router.refresh();
  }

  const cardClass =
    "rounded-2xl p-5 relative overflow-hidden hover:shadow-md transition-all flex flex-col min-h-[140px] h-full w-full";
  const linkClass =
    "block h-full w-full min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl text-left";
  const contentBlockClass = "min-h-[3.5rem] flex flex-col flex-1 w-full";

  return (
    <>
      <StaggerParent className="grid sm:grid-cols-3 gap-4 mb-8 items-stretch [&>*]:min-w-0">
        <StaggerChild className="min-w-0">
          <button
            type="button"
            onClick={() => setRoomDialogOpen(true)}
            className={cn(
              linkClass,
              "rounded-2xl bg-pastel-teal/30 border border-pastel-teal/50 hover:border-pastel-teal hover:bg-pastel-teal/40"
            )}
          >
            <div className={cardClass}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-pastel-teal/20 rounded-full -translate-y-6 translate-x-6" />
              <DoorOpen className="h-5 w-5 text-primary mb-3 relative z-10 shrink-0" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
                Room Preferences
              </p>
              <div className={cn("flex flex-wrap gap-1.5 mt-1 relative z-10 w-full", contentBlockClass)}>
                {(initialRoomSizes.length ? initialRoomSizes : []).map(
                  (size: number) => (
                    <span
                      key={size}
                      className="text-sm font-bold bg-white/60 rounded-full px-2.5 py-0.5 shrink-0"
                    >
                      {size}-person
                    </span>
                  )
                )}
              </div>
              <span className="mt-auto pt-2 flex items-center gap-1 text-xs text-muted-foreground relative z-10 shrink-0">
                <Pencil className="h-3 w-3" /> Change
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </button>
        </StaggerChild>

        <StaggerChild className="min-w-0">
          <Link
            href="/survey"
            className={cn(
              linkClass,
              "rounded-2xl bg-pastel-mint/30 border border-pastel-mint/50 hover:border-pastel-mint hover:bg-pastel-mint/40"
            )}
          >
            <div className={cardClass}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-pastel-mint/20 rounded-full -translate-y-6 translate-x-6" />
              <ClipboardList className="h-5 w-5 text-primary mb-3 relative z-10 shrink-0" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
                Lifestyle Survey
              </p>
              <div className={cn("flex items-center gap-2 mt-1 relative z-10 w-full", contentBlockClass)}>
                <Badge
                  variant={hasSurvey ? "default" : "secondary"}
                  className="rounded-full shrink-0"
                >
                  {hasSurvey ? "Completed" : "Not Started"}
                </Badge>
              </div>
              <span className="mt-auto pt-2 flex items-center gap-1 text-xs text-muted-foreground relative z-10 shrink-0">
                <Pencil className="h-3 w-3" /> Update answers
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        </StaggerChild>

        <StaggerChild className="min-w-0">
          <Link
            href="/room"
            className={cn(
              linkClass,
              "rounded-2xl bg-pastel-green/30 border border-pastel-green/50 hover:border-pastel-green hover:bg-pastel-green/40"
            )}
          >
            <div className={cardClass}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-pastel-green/20 rounded-full -translate-y-6 translate-x-6" />
              <Users className="h-5 w-5 text-primary mb-3 relative z-10 shrink-0" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
                Room Status
              </p>
              <div className={cn("flex items-start mt-1 relative z-10 w-full min-w-0", contentBlockClass)}>
                <Badge
                  variant={roomStatusLabel.startsWith("Not") ? "secondary" : "default"}
                  className="rounded-full max-w-full truncate shrink-0"
                >
                  {roomStatusLabel}
                </Badge>
              </div>
              <span className="mt-auto pt-2 flex items-center gap-1 text-xs text-muted-foreground relative z-10 shrink-0">
                View details
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        </StaggerChild>
      </StaggerParent>

      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Room size preferences</DialogTitle>
            <DialogDescription>
              Select all the room sizes you&apos;d be open to. At least one is
              required.
            </DialogDescription>
          </DialogHeader>
          {loadingRooms ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {roomOptions.map((opt) => {
                const isSelected = selectedRooms.includes(opt.roomSize);
                return (
                  <Card
                    key={opt.roomSize}
                    className={cn(
                      "cursor-pointer transition-all",
                      isSelected && "ring-2 ring-primary shadow-md",
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
                            {opt.bedsRemaining} beds remaining · {opt.totalRooms}{" "}
                            {opt.roomSize}-person rooms
                          </p>
                        </div>
                      </div>
                      {isSelected && (
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
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoomDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={saveRoomPreferences}
              disabled={selectedRooms.length === 0 || saving || loadingRooms}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

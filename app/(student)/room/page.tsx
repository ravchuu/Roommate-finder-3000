"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  DoorOpen,
  Crown,
  UserPlus,
  ArrowRightLeft,
  LogOut,
  ThumbsUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface StudentInfo {
  id: string;
  name: string;
  photo: string | null;
  email: string;
  bio: string | null;
}

interface RoomMember {
  id: string;
  studentId: string;
  student: StudentInfo;
  joinedAt: string;
}

interface Endorsement {
  id: string;
  endorsedStudent: { id: string; name: string; photo: string | null };
  endorsedBy: { id: string; name: string };
}

interface Room {
  id: string;
  roomSize: number;
  status: string;
  leaderId: string | null;
  leader: { id: string; name: string } | null;
  members: RoomMember[];
  endorsements: Endorsement[];
}

export default function RoomPage() {
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [endorseId, setEndorseId] = useState("");
  const [endorsing, setEndorsing] = useState(false);
  const [endorseMsg, setEndorseMsg] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [transferring, setTransferring] = useState<string | null>(null);
  const [mergeableRooms, setMergeableRooms] = useState<
    { id: string; roomSize: number; memberCount: number; leaderName: string; memberNames: string[] }[]
  >([]);
  const [merging, setMerging] = useState<string | null>(null);
  const [mergeMsg, setMergeMsg] = useState("");

  useEffect(() => {
    fetchRoom();
    fetchMergeableRooms();
  }, []);

  async function fetchRoom() {
    const res = await fetch("/api/rooms");
    const data = await res.json();
    setRoom(data.room);
    setLoading(false);
  }

  async function handleEndorse() {
    if (!endorseId.trim()) return;
    setEndorsing(true);
    setEndorseMsg("");
    const res = await fetch("/api/rooms/endorse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: endorseId.trim() }),
    });
    const data = await res.json();
    setEndorseMsg(data.message || data.error);
    setEndorsing(false);
    if (data.joined) {
      setEndorseId("");
      fetchRoom();
    }
  }

  async function handleTransferLeader(newLeaderId: string) {
    setTransferring(newLeaderId);
    await fetch("/api/rooms/leader", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newLeaderId }),
    });
    await fetchRoom();
    setTransferring(null);
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this room?")) return;
    setLeaving(true);
    await fetch("/api/rooms/leave", { method: "POST" });
    router.push("/dashboard");
  }

  async function fetchMergeableRooms() {
    const res = await fetch("/api/rooms/mergeable");
    const data = await res.json();
    setMergeableRooms(data.rooms || []);
  }

  async function handleMerge(targetRoomId: string) {
    setMerging(targetRoomId);
    setMergeMsg("");
    const res = await fetch("/api/rooms/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetRoomId }),
    });
    const data = await res.json();
    setMergeMsg(data.message || data.error);
    setMerging(null);
    if (data.success) {
      fetchRoom();
      fetchMergeableRooms();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-20">
        <DoorOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h1 className="text-2xl font-bold mb-2">No Room Yet</h1>
        <p className="text-muted-foreground mb-6">
          Send and accept roommate requests to form a room automatically.
        </p>
        <Button onClick={() => router.push("/roommates")}>
          <Users className="h-4 w-4 mr-2" />
          Find Roommates
        </Button>
      </div>
    );
  }

  const spotsLeft = room.roomSize - room.members.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <DoorOpen className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">Your Room</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={room.status === "full" ? "default" : "secondary"}>
              {room.status === "full" ? "Full" : room.status === "locked" ? "Locked" : "Forming"}
            </Badge>
            <span className="text-muted-foreground">
              {room.members.length}/{room.roomSize} members
              {spotsLeft > 0 && ` (${spotsLeft} spots left)`}
            </span>
          </div>
        </div>
        {room.status !== "locked" && (
          <Button
            variant="outline"
            onClick={handleLeave}
            disabled={leaving}
            className="text-destructive hover:text-destructive"
          >
            {leaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Leave Room
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {room.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.student.photo || undefined} />
                      <AvatarFallback>
                        {member.student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.student.name}</p>
                        {member.studentId === room.leaderId && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Crown className="h-3 w-3" />
                            Leader
                          </Badge>
                        )}
                      </div>
                      {member.student.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {member.student.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  {room.leaderId !== member.studentId && room.status !== "locked" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTransferLeader(member.studentId)}
                      disabled={transferring === member.studentId}
                      title="Transfer leadership"
                    >
                      {transferring === member.studentId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRightLeft className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {room.endorsements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Pending Endorsements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {room.endorsements.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 py-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={e.endorsedStudent.photo || undefined} />
                      <AvatarFallback className="text-xs">
                        {e.endorsedStudent.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm">
                      <span className="font-medium">{e.endorsedBy.name}</span>
                      {" endorsed "}
                      <span className="font-medium">
                        {e.endorsedStudent.name}
                      </span>
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {room.status === "forming" && spotsLeft > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-4 w-4" />
                  Endorse a Candidate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  When all current members endorse the same person, they
                  automatically join the room.
                </p>
                <Input
                  value={endorseId}
                  onChange={(e) => setEndorseId(e.target.value)}
                  placeholder="Student ID"
                />
                <Button
                  onClick={handleEndorse}
                  disabled={endorsing || !endorseId.trim()}
                  className="w-full"
                  size="sm"
                >
                  {endorsing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ThumbsUp className="h-4 w-4 mr-2" />
                  )}
                  Endorse
                </Button>
                {endorseMsg && (
                  <p className="text-sm text-muted-foreground">{endorseMsg}</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Room Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room Size</span>
                <span className="font-medium">{room.roomSize}-person</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{room.status}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Leader</span>
                <span className="font-medium">{room.leader?.name || "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">
                  {room.members.length}/{room.roomSize}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {mergeableRooms.length > 0 && room.status === "forming" && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Merge With Another Room</h2>
          <p className="text-sm text-muted-foreground mb-4">
            As room leader, you can propose merging with another forming room.
          </p>
          <div className="space-y-3">
            {mergeableRooms.map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {r.memberCount}-member room (led by {r.leaderName})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Members: {r.memberNames.join(", ")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMerge(r.id)}
                    disabled={merging === r.id}
                  >
                    {merging === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Merge"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {mergeMsg && (
            <p className="text-sm text-muted-foreground mt-2">{mergeMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}

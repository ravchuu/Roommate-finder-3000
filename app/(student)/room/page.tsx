"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  DoorOpen,
  Crown,
  UserPlus,
  ArrowRightLeft,
  LogOut,
  ThumbsUp,
  Users,
  Lock,
  GitMerge,
  UserCheck,
  X,
  Clock,
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
  preferredRoomSizes?: number[];
}

interface GroupMember {
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

interface InviteInfo {
  id: string;
  student: { id: string; name: string; photo: string | null };
  invitedBy: { id: string; name: string };
  status: string;
  expiresAt: string;
}

interface MergeRequestInfo {
  id: string;
  status: string;
  fromLeaderApproved: boolean;
  toLeaderApproved: boolean;
  fromGroup?: GroupSummary;
  toGroup?: GroupSummary;
}

interface GroupSummary {
  id: string;
  members: { student: { id: string; name: string; photo: string | null } }[];
  leader: { id: string; name: string } | null;
}

interface ReservedConfig {
  roomSize: number;
  totalRooms: number;
  reservationThresholdPercent: number;
}

interface Group {
  id: string;
  targetRoomSize: number | null;
  status: string;
  leaderId: string | null;
  leader: { id: string; name: string } | null;
  members: GroupMember[];
  endorsements: Endorsement[];
  invites: InviteInfo[];
  mergeRequestsFrom: MergeRequestInfo[];
  mergeRequestsTo: MergeRequestInfo[];
  reservedConfig: ReservedConfig | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  unreserved: { label: "Forming", color: "secondary" },
  reserved: { label: "Reserved", color: "default" },
  waitlisted: { label: "Waitlisted", color: "outline" },
  locked: { label: "Locked", color: "default" },
};

export default function GroupPage() {
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [endorseId, setEndorseId] = useState("");
  const [endorsing, setEndorsing] = useState(false);
  const [endorseMsg, setEndorseMsg] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [transferring, setTransferring] = useState<string | null>(null);
  const [mergeableGroups, setMergeableGroups] = useState<GroupSummary[]>([]);
  const [mergingTo, setMergingTo] = useState<string | null>(null);
  const [actingOnInvite, setActingOnInvite] = useState<string | null>(null);
  const [actingOnMerge, setActingOnMerge] = useState<string | null>(null);

  useEffect(() => {
    fetchGroup();
    fetchMergeableGroups();
  }, []);

  async function fetchGroup() {
    const res = await fetch("/api/groups");
    const data = await res.json();
    setGroup(data.group);
    setLoading(false);
  }

  async function fetchMergeableGroups() {
    const res = await fetch("/api/groups/mergeable");
    const data = await res.json();
    setMergeableGroups(data.groups || []);
  }

  async function handleEndorse() {
    if (!endorseId.trim() || !group) return;
    setEndorsing(true);
    setEndorseMsg("");
    const res = await fetch("/api/groups/endorse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.id, studentId: endorseId.trim() }),
    });
    const data = await res.json();
    if (data.joined) {
      setEndorseMsg("They joined the group!");
      setEndorseId("");
    } else if (data.endorsements != null) {
      setEndorseMsg(`Endorsement recorded (${data.endorsements}/${data.needed} needed)`);
    } else {
      setEndorseMsg(data.error || "Could not endorse");
    }
    setEndorsing(false);
    fetchGroup();
  }

  async function handleTransferLeader(newLeaderId: string) {
    if (!group) return;
    setTransferring(newLeaderId);
    await fetch("/api/groups/leader", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.id, newLeaderId }),
    });
    await fetchGroup();
    setTransferring(null);
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this group?")) return;
    setLeaving(true);
    await fetch("/api/groups/leave", { method: "POST" });
    router.push("/dashboard");
  }

  async function handleLock() {
    if (!group) return;
    if (!confirm("Lock this group? No more members can join after locking.")) return;
    setLocking(true);
    await fetch("/api/groups/lock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.id }),
    });
    await fetchGroup();
    setLocking(false);
  }

  async function handleMerge(toGroupId: string) {
    setMergingTo(toGroupId);
    await fetch("/api/groups/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toGroupId }),
    });
    setMergingTo(null);
    fetchGroup();
    fetchMergeableGroups();
  }

  async function handleInviteAction(inviteId: string, action: "approve" | "decline") {
    setActingOnInvite(inviteId);
    await fetch("/api/groups/invite", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId, action }),
    });
    setActingOnInvite(null);
    fetchGroup();
  }

  async function handleMergeAction(mergeRequestId: string, action: "approve" | "decline") {
    setActingOnMerge(mergeRequestId);
    await fetch("/api/groups/merge", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mergeRequestId, action }),
    });
    setActingOnMerge(null);
    fetchGroup();
    fetchMergeableGroups();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center py-20"
      >
        <DoorOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h1 className="text-2xl font-bold mb-2">No Group Yet</h1>
        <p className="text-muted-foreground mb-6">
          Send and accept roommate requests to form a group automatically.
        </p>
        <Button onClick={() => router.push("/roommates")}>
          <Users className="h-4 w-4 mr-2" />
          Find Roommates
        </Button>
      </motion.div>
    );
  }

  const statusInfo = STATUS_LABELS[group.status] || STATUS_LABELS.unreserved;
  const isLeader = group.leaderId === undefined; // will be checked via session
  const capacity = group.targetRoomSize || group.reservedConfig?.roomSize || 0;
  const spotsLeft = capacity > 0 ? capacity - group.members.length : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <DoorOpen className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">Your Group</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusInfo.color as "default" | "secondary" | "outline"}>
              {statusInfo.label}
            </Badge>
            <span className="text-muted-foreground">
              {group.members.length} member{group.members.length !== 1 && "s"}
              {capacity > 0 && ` / ${capacity} capacity`}
              {spotsLeft != null && spotsLeft > 0 && ` (${spotsLeft} spots left)`}
            </span>
            {group.targetRoomSize && (
              <Badge variant="outline">{group.targetRoomSize}-person target</Badge>
            )}
            {!group.targetRoomSize && (
              <Badge variant="outline">Flexible size</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {group.status !== "locked" && (
            <>
              <Button
                variant="outline"
                onClick={handleLock}
                disabled={locking || group.members.length < 2}
                title="Lock this group"
              >
                {locking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                Lock Group
              </Button>
              <Button
                variant="outline"
                onClick={handleLeave}
                disabled={leaving}
                className="text-destructive hover:text-destructive"
              >
                {leaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
                Leave
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Members */}
          <Card>
            <CardHeader><CardTitle>Members</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.student.photo || undefined} />
                      <AvatarFallback>
                        {member.student.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.student.name}</p>
                        {member.studentId === group.leaderId && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Crown className="h-3 w-3" /> Leader
                          </Badge>
                        )}
                      </div>
                      {member.student.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{member.student.bio}</p>
                      )}
                    </div>
                  </div>
                  {group.leaderId !== member.studentId && group.status !== "locked" && (
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => handleTransferLeader(member.studentId)}
                      disabled={transferring === member.studentId}
                      title="Transfer leadership"
                    >
                      {transferring === member.studentId
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <ArrowRightLeft className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pending Invites (leader can approve/decline) */}
          {group.invites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> Pending Join Invites
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.invites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={inv.student.photo || undefined} />
                        <AvatarFallback className="text-xs">
                          {inv.student.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{inv.student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Invited by {inv.invitedBy.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleInviteAction(inv.id, "approve")}
                        disabled={actingOnInvite === inv.id}
                      >
                        {actingOnInvite === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        onClick={() => handleInviteAction(inv.id, "decline")}
                        disabled={actingOnInvite === inv.id}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Incoming Merge Requests */}
          {group.mergeRequestsTo.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitMerge className="h-4 w-4" /> Incoming Merge Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.mergeRequestsTo.map((mr) => (
                  <div key={mr.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Group led by {mr.fromGroup?.leader?.name || "Unknown"} ({mr.fromGroup?.members.length || 0} members)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mr.fromLeaderApproved ? "Their leader approved" : "Awaiting their leader"}
                        {" · "}
                        {mr.toLeaderApproved ? "You approved" : "Awaiting your approval"}
                      </p>
                    </div>
                    {!mr.toLeaderApproved && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleMergeAction(mr.id, "approve")}
                          disabled={actingOnMerge === mr.id}
                        >
                          {actingOnMerge === mr.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve Merge"}
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          onClick={() => handleMergeAction(mr.id, "decline")}
                          disabled={actingOnMerge === mr.id}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Outgoing Merge Requests */}
          {group.mergeRequestsFrom.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Outgoing Merge Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.mergeRequestsFrom.map((mr) => (
                  <div key={mr.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Merge with group led by {mr.toGroup?.leader?.name || "Unknown"} ({mr.toGroup?.members.length || 0} members)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mr.fromLeaderApproved ? "You approved" : "Awaiting your approval"}
                        {" · "}
                        {mr.toLeaderApproved ? "They approved" : "Awaiting their leader"}
                      </p>
                    </div>
                    {!mr.fromLeaderApproved && (
                      <Button
                        size="sm"
                        onClick={() => handleMergeAction(mr.id, "approve")}
                        disabled={actingOnMerge === mr.id}
                      >
                        {actingOnMerge === mr.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Endorsements */}
          {group.endorsements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" /> Pending Endorsements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {group.endorsements.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={e.endorsedStudent.photo || undefined} />
                      <AvatarFallback className="text-xs">
                        {e.endorsedStudent.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm">
                      <span className="font-medium">{e.endorsedBy.name}</span>
                      {" endorsed "}
                      <span className="font-medium">{e.endorsedStudent.name}</span>
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {/* Endorse a candidate */}
          {group.status !== "locked" && (spotsLeft === null || spotsLeft > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-4 w-4" /> Endorse a Candidate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  When all current members endorse the same person, they automatically join.
                </p>
                <Input
                  value={endorseId}
                  onChange={(e) => setEndorseId(e.target.value)}
                  placeholder="Student ID"
                />
                <Button onClick={handleEndorse} disabled={endorsing || !endorseId.trim()} className="w-full" size="sm">
                  {endorsing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ThumbsUp className="h-4 w-4 mr-2" />}
                  Endorse
                </Button>
                {endorseMsg && <p className="text-sm text-muted-foreground">{endorseMsg}</p>}
              </CardContent>
            </Card>
          )}

          {/* Group Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Group Info</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Size</span>
                <span className="font-medium">{group.targetRoomSize ? `${group.targetRoomSize}-person` : "Flexible"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{statusInfo.label}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Leader</span>
                <span className="font-medium">{group.leader?.name || "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">
                  {group.members.length}{capacity > 0 && ` / ${capacity}`}
                </span>
              </div>
              {group.reservedConfig && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reserved Room</span>
                    <span className="font-medium">{group.reservedConfig.roomSize}-person</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Merge with another group */}
          {mergeableGroups.length > 0 && group.status !== "locked" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitMerge className="h-4 w-4" /> Merge Groups
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  As leader, propose merging with another group. Both leaders must approve.
                </p>
                {mergeableGroups.map((g) => (
                  <div key={g.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">
                        {g.leader?.name || "Unknown"}&apos;s group
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {g.members.length} member{g.members.length !== 1 && "s"}
                      </p>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      onClick={() => handleMerge(g.id)}
                      disabled={mergingTo === g.id}
                    >
                      {mergingTo === g.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Request Merge"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}

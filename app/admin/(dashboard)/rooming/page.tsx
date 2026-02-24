"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Users,
  UserPlus,
  UserMinus,
  Plus,
  Lock,
  DoorOpen,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type Member = { id: string; name: string; email: string; claimed: boolean };

type Group = {
  id: string;
  targetRoomSize: number | null;
  status: string;
  leaderId: string | null;
  leaderName: string | null;
  reservedRoomConfigId: string | null;
  reservedConfig: { id: string; roomSize: number; totalRooms: number } | null;
  members: Member[];
};

type UnassignedStudent = { id: string; name: string; email: string };

export default function RoomingPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [unassigned, setUnassigned] = useState<UnassignedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addStudentId, setAddStudentId] = useState<string>("");
  const [addGroupId, setAddGroupId] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createSelectedIds, setCreateSelectedIds] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/groups");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setGroups(data.groups ?? []);
      setUnassigned(data.unassignedStudents ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load rooming");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const allStudentsForAdd: { id: string; name: string; email: string; label: string }[] = [
    ...unassigned.map((s) => ({ ...s, label: `${s.name} (unassigned)` })),
    ...groups.flatMap((g) =>
      g.members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        label: `${m.name} (${g.members.length}-person group)`,
      }))
    ),
  ];

  async function handleAddToGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!addStudentId || !addGroupId) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/groups/${addGroupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: addStudentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      await fetchData();
      setAddStudentId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add to group");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(groupId: string, studentId: string) {
    setRemoving(`${groupId}-${studentId}`);
    setError("");
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/members/${studentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove");
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setRemoving(null);
    }
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (createSelectedIds.size === 0) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: Array.from(createSelectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create group");
      await fetchData();
      setCreateSelectedIds(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  }

  function toggleCreateStudent(id: string) {
    setCreateSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-2xl bg-pastel-teal flex items-center justify-center">
          <DoorOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rooming</h1>
          <p className="text-muted-foreground">
            View groups, who&apos;s with whom, and manually assign or move students.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add or move student to a group
            </CardTitle>
            <CardDescription>
              Select a student and a target group. The student will be removed from their current group (if any) and added to the chosen group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddToGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-student">Student</Label>
                <select
                  id="add-student"
                  value={addStudentId}
                  onChange={(e) => setAddStudentId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select student</option>
                  {allStudentsForAdd.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-group">Target group</Label>
                <select
                  id="add-group"
                  value={addGroupId}
                  onChange={(e) => setAddGroupId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.members.length} person{g.members.length !== 1 ? "s" : ""} — {g.members.map((m) => m.name).join(", ")}
                      {g.status !== "unreserved" && ` (${g.status})`}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={adding || !addStudentId || !addGroupId}>
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ArrowRight className="mr-2 h-4 w-4" />
                Add to group
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create new group
            </CardTitle>
            <CardDescription>
              Select one or more unassigned students to form a new group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unassigned students</label>
                <div className="max-h-40 overflow-y-auto rounded-lg border p-2 space-y-1">
                  {unassigned.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No unassigned students.</p>
                  ) : (
                    unassigned.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/60 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={createSelectedIds.has(s.id)}
                          onChange={() => toggleCreateStudent(s.id)}
                          className="rounded border-primary"
                        />
                        <span className="text-sm">{s.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{s.email}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <Button
                type="submit"
                disabled={creating || createSelectedIds.size === 0}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create group ({createSelectedIds.size} selected)
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Groups ({groups.length})
        </h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="border-pastel-mint">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {group.members.length} person{group.members.length !== 1 ? "s" : ""}
                    {group.targetRoomSize != null && ` (target ${group.targetRoomSize})`}
                  </CardTitle>
                  <Badge
                    variant={
                      group.status === "locked"
                        ? "default"
                        : group.status === "reserved"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {group.status === "locked" && <Lock className="h-3 w-3 mr-1" />}
                    {group.status}
                  </Badge>
                </div>
                {group.leaderName && (
                  <CardDescription>Leader: {group.leaderName}</CardDescription>
                )}
                {group.reservedConfig && (
                  <CardDescription>
                    Room: {group.reservedConfig.roomSize}-person × {group.reservedConfig.totalRooms}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {group.members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-destructive hover:text-destructive"
                        disabled={removing !== null}
                        onClick={() => handleRemoveMember(group.id, member.id)}
                      >
                        {removing === `${group.id}-${member.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        {groups.length === 0 && (
          <p className="text-muted-foreground">No groups yet. Create a group above or use Finalize on the dashboard to auto-assign.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Unassigned students ({unassigned.length})
        </h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Name</th>
                <th className="text-left p-3 text-sm font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {unassigned.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3 text-sm font-medium">{s.name}</td>
                  <td className="p-3 text-sm text-muted-foreground">{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {unassigned.length === 0 && (
          <p className="text-muted-foreground py-4">All claimed students are in a group.</p>
        )}
      </section>
    </div>
  );
}

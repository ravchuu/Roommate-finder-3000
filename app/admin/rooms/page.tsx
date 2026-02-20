"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RoomConfig {
  id: string;
  roomSize: number;
  totalRooms: number;
}

export default function RoomsPage() {
  const [configs, setConfigs] = useState<RoomConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    const res = await fetch("/api/admin/rooms");
    const data = await res.json();
    setConfigs(data);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomSize: formData.get("roomSize"),
        totalRooms: formData.get("totalRooms"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
    } else {
      (e.target as HTMLFormElement).reset();
      fetchConfigs();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/rooms?id=${id}`, { method: "DELETE" });
    fetchConfigs();
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const totalCapacity = configs.reduce(
    (sum, c) => sum + c.roomSize * c.totalRooms,
    0
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Room Configuration</h1>
      <p className="text-muted-foreground mb-8">
        Define available room sizes and quantities. Total capacity:{" "}
        <strong>{totalCapacity} beds</strong>
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Add / Update Room Size</CardTitle>
            <CardDescription>
              If a room size already exists, its count will be updated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomSize">Room Size (people per room)</Label>
                <Input
                  id="roomSize"
                  name="roomSize"
                  type="number"
                  min={2}
                  max={20}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalRooms">Number of Rooms</Label>
                <Input
                  id="totalRooms"
                  name="totalRooms"
                  type="number"
                  min={1}
                  max={100}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Configuration
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Current Configurations</h2>
          {configs.length === 0 && (
            <p className="text-muted-foreground">
              No room configurations yet. Add one to get started.
            </p>
          )}
          {configs.map((config) => (
            <Card key={config.id}>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">
                    {config.roomSize}-person rooms
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.totalRooms} rooms &middot;{" "}
                    {config.roomSize * config.totalRooms} total beds
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(config.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

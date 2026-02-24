"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Copy, Check, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Student {
  id: string;
  name: string;
  email: string;
  age: number | null;
  gender: string | null;
  claimed: boolean;
  claimToken: string;
  preferredRoomSizes: string | null;
  createdAt: string;
  isPending?: boolean;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ created: number; updated: number; errors?: string[] } | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    const res = await fetch("/api/admin/students");
    const data = await res.json();
    setStudents(data);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        age: formData.get("age"),
        gender: formData.get("gender"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
    } else {
      setShowForm(false);
      fetchStudents();
    }
    setCreating(false);
  }

  function copyToken(token: string) {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  function parseCSV(text: string): { name: string; email: string; age?: number; gender?: string }[] {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const nameIdx = header.findIndex((h) => h === "name" || h === "full name");
    const emailIdx = header.findIndex((h) => h === "email");
    if (nameIdx === -1 || emailIdx === -1) return [];
    const ageIdx = header.findIndex((h) => h === "age");
    const genderIdx = header.findIndex((h) => h === "gender");
    const rows: { name: string; email: string; age?: number; gender?: string }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/("([^"]*)"|[^,]*)(?=\s*,|\s*$)/g)?.map((v) => v.replace(/^["']|["']$/g, "").trim()) ?? lines[i].split(",").map((v) => v.trim());
      const name = values[nameIdx] ?? "";
      const email = (values[emailIdx] ?? "").toLowerCase();
      if (!name || !email) continue;
      const age = ageIdx >= 0 && values[ageIdx] ? parseInt(values[ageIdx], 10) : undefined;
      const gender = genderIdx >= 0 ? values[genderIdx] : undefined;
      rows.push({ name, email, age: Number.isNaN(age!) ? undefined : age, gender });
    }
    return rows;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadResult(null);
    setUploading(true);
    setError("");
    try {
      const text = await file.text();
      const students = parseCSV(text);
      if (students.length === 0) {
        setError("CSV must have a header row with 'name' and 'email' columns, and at least one data row.");
        setUploading(false);
        return;
      }
      const res = await fetch("/api/admin/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
      } else {
        setUploadResult({ created: data.created, updated: data.updated, errors: data.errors });
        fetchStudents();
      }
    } catch {
      setError("Failed to read or parse file.");
    } finally {
      setUploading(false);
      setFileInputKey((k) => k + 1);
    }
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            {students.length} students &middot;{" "}
            {students.filter((s) => s.claimed).length} claimed
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      <Card className="mb-8 border-pastel-teal/60 bg-pastel-teal/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload roster (CSV)
          </CardTitle>
          <CardDescription>
            Import students in bulk. CSV must have a header row with <strong>name</strong> and <strong>email</strong>; optional columns: <strong>age</strong>, <strong>gender</strong>. Existing emails are updated; new emails are added.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Input
              key={fileInputKey}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploading}
              className="max-w-xs"
            />
            {uploading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>
          {(error || uploadResult) && (
            <div className="rounded-lg border bg-background/80 p-3 text-sm">
              {error && <p className="text-destructive">{error}</p>}
              {uploadResult && (
                <p className="text-muted-foreground">
                  <strong>{uploadResult.created}</strong> created, <strong>{uploadResult.updated}</strong> updated.
                  {uploadResult.errors?.length ? (
                    <span className="block mt-1 text-destructive">
                      {uploadResult.errors.slice(0, 5).join(" ")}
                      {uploadResult.errors.length > 5 ? ` (+${uploadResult.errors.length - 5} more)` : ""}
                    </span>
                  ) : null}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Student</CardTitle>
            <CardDescription>
              Create a profile that the student can claim later
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" name="age" type="number" min={16} max={99} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Input id="gender" name="gender" placeholder="e.g. Male, Female, Non-binary" />
              </div>
              {error && (
                <p className="text-sm text-destructive md:col-span-2">{error}</p>
              )}
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Student
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Name</th>
              <th className="text-left p-3 text-sm font-medium">Email</th>
              <th className="text-left p-3 text-sm font-medium">Age</th>
              <th className="text-left p-3 text-sm font-medium">Gender</th>
              <th className="text-left p-3 text-sm font-medium">Status</th>
              <th className="text-left p-3 text-sm font-medium">Claim Token</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-t">
                <td className="p-3 text-sm font-medium">{student.name}</td>
                <td className="p-3 text-sm text-muted-foreground">
                  {student.email}
                </td>
                <td className="p-3 text-sm">{student.age ?? "—"}</td>
                <td className="p-3 text-sm">{student.gender ?? "—"}</td>
                <td className="p-3">
                  <Badge variant={student.isPending ? "outline" : student.claimed ? "default" : "secondary"}>
                    {student.isPending ? "Pending" : student.claimed ? "Claimed" : "Unclaimed"}
                  </Badge>
                </td>
                <td className="p-3">
                  {!student.claimed && !student.isPending && (
                    <button
                      onClick={() => copyToken(student.claimToken)}
                      className="flex items-center gap-1 text-xs font-mono bg-muted px-2 py-1 rounded hover:bg-accent transition-colors"
                    >
                      {copiedToken === student.claimToken ? (
                        <>
                          <Check className="h-3 w-3 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          {student.claimToken.slice(0, 12)}...
                        </>
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

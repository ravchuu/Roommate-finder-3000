"use client";

import { useState } from "react";
import Link from "next/link";
import { UserCheck, Loader2, CheckCircle2 } from "lucide-react";
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

export default function ClaimPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug: formData.get("orgSlug"),
          email: formData.get("email"),
          claimToken: formData.get("claimToken"),
          password: formData.get("password"),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setSuccess(`Welcome, ${data.studentName}! Your profile has been claimed.`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl">Claim Your Profile</CardTitle>
          <CardDescription>
            Your organization created a profile for you. Enter your details and
            claim token to set up your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-green-700 font-medium">{success}</p>
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgSlug">Organization Code</Label>
                <Input
                  id="orgSlug"
                  name="orgSlug"
                  placeholder="e.g. westfield"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@university.edu"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claimToken">Claim Token</Label>
                <Input
                  id="claimToken"
                  name="claimToken"
                  placeholder="Token from your organization"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This was provided by your organization administrator.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Set Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Claim Profile
              </Button>
            </form>
          )}
          <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
            <p>
              Already claimed?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <p>
              <Link href="/" className="text-primary hover:underline">
                Back to home
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

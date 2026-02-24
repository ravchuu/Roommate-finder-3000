"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Users, Loader2, FlaskConical } from "lucide-react";
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

const DEMO_ORG = "westfield";
const DEMO_EMAIL = "alex.chen@university.edu";
const DEMO_PASSWORD = "student123";

export default function StudentLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <StudentLoginForm />
    </Suspense>
  );
}

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = await signIn("student-login", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      orgSlug: formData.get("orgSlug") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email, password, or organization. Make sure you've claimed your profile first.");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleDemoLogin() {
    setError("");
    setLoading(true);
    const result = await signIn("student-login", {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      orgSlug: DEMO_ORG,
      redirect: false,
    });
    if (result?.error) {
      setError("Demo account not found. Run: npx tsx prisma/seed.ts");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl">Student Login</CardTitle>
          <CardDescription>
            Sign in with your claimed profile credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your.email@university.edu"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Your password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <div className="relative my-4">
              <span className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </span>
              <span className="relative flex justify-center text-xs uppercase text-muted-foreground bg-card px-2">
                or
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={handleDemoLogin}
            >
              <FlaskConical className="mr-2 h-4 w-4" />
              Sign in as demo (try the finder)
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Demo logs you in as a student in a pre-filled org with many profiles. Run <code className="bg-muted px-1 rounded">npx tsx prisma/seed.ts</code> if you get an error.
            </p>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
            <p>
              Haven&apos;t claimed your profile yet?{" "}
              <Link href="/claim" className="text-primary hover:underline">
                Claim it here
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GoLiveButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleGoLive() {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch("/api/admin/go-live", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        alert(data.error || "Failed to go live");
      }
    } catch {
      alert("Failed to go live");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-green-600 font-medium">
        <CheckCircle2 className="h-4 w-4" />
        Changes are live
      </span>
    );
  }

  return (
    <Button onClick={handleGoLive} disabled={loading} className="gap-2">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Rocket className="h-4 w-4" />
      )}
      Go live
    </Button>
  );
}

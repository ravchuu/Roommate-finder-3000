"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalizeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState("");

  async function handleFinalize() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/finalize", { method: "POST" });
    const data = await res.json();
    setResult(data.message || data.error);
    setLoading(false);
    router.refresh();
  }

  if (result) {
    return <p className="text-sm font-medium text-green-600">{result}</p>;
  }

  return (
    <div className="space-y-2">
      {confirmed && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>
            This will auto-assign unmatched students and lock all rooms. Click
            again to confirm.
          </span>
        </div>
      )}
      <Button
        onClick={handleFinalize}
        disabled={loading}
        variant={confirmed ? "destructive" : "default"}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Lock className="h-4 w-4 mr-2" />
        )}
        {confirmed ? "Confirm Finalization" : "Finalize & Lock Rooms"}
      </Button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface StudentInfo {
  id: string;
  name: string;
  photo: string | null;
  email: string;
  preferredRoomSize: number | null;
}

interface Request {
  id: string;
  fromStudentId: string;
  toStudentId: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  fromStudent?: StudentInfo;
  toStudent?: StudentInfo;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  pending: { label: "Pending", variant: "outline", icon: <Clock className="h-3 w-3" /> },
  accepted: { label: "Accepted", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  declined: { label: "Declined", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  expired: { label: "Expired", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
};

export default function RequestsPage() {
  const [sent, setSent] = useState<Request[]>([]);
  const [received, setReceived] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    const res = await fetch("/api/requests");
    const data = await res.json();
    setSent(data.sent || []);
    setReceived(data.received || []);
    setLoading(false);
  }

  async function handleAction(requestId: string, action: "accept" | "decline") {
    setActing(requestId);
    await fetch("/api/requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    await fetchRequests();
    setActing(null);
  }

  function timeRemaining(expiresAt: string): string {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
    return `${hours}h left`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const pendingReceived = received.filter((r) => r.status === "pending");

  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <Mail className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Roommate Requests</h1>
      </div>

      {pendingReceived.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Incoming ({pendingReceived.length})
          </h2>
          <div className="space-y-3">
            {pendingReceived.map((req) => (
              <Card key={req.id} className="border-primary/20">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={req.fromStudent?.photo || undefined} />
                      <AvatarFallback>
                        {req.fromStudent?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{req.fromStudent?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Wants to be your roommate &middot;{" "}
                        {timeRemaining(req.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(req.id, "accept")}
                      disabled={acting === req.id}
                    >
                      {acting === req.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Accept"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(req.id, "decline")}
                      disabled={acting === req.id}
                    >
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="h-4 w-4" />
              Sent Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sent.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No sent requests yet. Browse roommates to send one.
              </p>
            ) : (
              <div className="space-y-3">
                {sent.map((req) => {
                  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={req.toStudent?.photo || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {req.toStudent?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {req.toStudent?.name}
                          </p>
                          {req.status === "pending" && (
                            <p className="text-xs text-muted-foreground">
                              {timeRemaining(req.expiresAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={cfg.variant} className="flex items-center gap-1">
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-4 w-4" />
              Received Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {received.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No received requests yet.
              </p>
            ) : (
              <div className="space-y-3">
                {received.map((req) => {
                  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={req.fromStudent?.photo || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {req.fromStudent?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {req.fromStudent?.name}
                          </p>
                        </div>
                      </div>
                      <Badge variant={cfg.variant} className="flex items-center gap-1">
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

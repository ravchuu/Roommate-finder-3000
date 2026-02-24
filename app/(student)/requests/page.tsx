"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StudentInfo {
  id: string;
  name: string;
  photo: string | null;
  email: string;
  preferredRoomSizes: number[];
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    const res = await fetch("/api/requests");
    const data = await res.json();
    setSent(data.sent || []);
    setLoading(false);
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

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 mb-8"
      >
        <Mail className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Roommate Requests</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
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
      </motion.div>
    </div>
  );
}

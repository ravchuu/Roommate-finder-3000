"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  MessageCircle,
  Send,
  ChevronLeft,
  ArrowLeft,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SentRequest {
  id: string;
  toStudentId: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

const REQUEST_STATUS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  pending: { label: "Request pending", variant: "outline", icon: <Clock className="h-3 w-3" /> },
  accepted: { label: "Request accepted", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  declined: { label: "Request declined", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  expired: { label: "Request expired", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
};

interface OtherStudent {
  id: string;
  name: string;
  photo: string | null;
}

interface ConversationSummary {
  conversationId: string;
  otherStudent: OtherStudent | null;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string; photo: string | null };
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const openId = searchParams.get("conversation");

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(openId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [sendingRequest, setSendingRequest] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedId(openId);
  }, [openId]);

  useEffect(() => {
    async function load() {
      setLoadingList(true);
      const res = await fetch("/api/messages");
      const data = await res.json();
      setConversations(data.conversations ?? []);
      setLoadingList(false);
    }
    load();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    fetch(`/api/messages/${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages ?? []);
        setLoadingMessages(false);
      })
      .catch(() => setLoadingMessages(false));
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const content = draft.trim();
    if (!content || !selectedId || sending) return;

    setSending(true);
    setDraft("");

    const res = await fetch(`/api/messages/${selectedId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === selectedId
            ? {
                ...c,
                lastMessage: {
                  content: data.message.content,
                  createdAt: data.message.createdAt,
                  senderId: data.message.senderId,
                },
              }
            : c
        )
      );
    }
    setSending(false);
  }

  const selectedConv = conversations.find((c) => c.conversationId === selectedId);
  const otherStudent = selectedConv?.otherStudent ?? null;
  const requestToOther = otherStudent
    ? sentRequests.find((r) => r.toStudentId === otherStudent.id)
    : null;

  async function fetchRequests() {
    const res = await fetch("/api/requests");
    if (res.ok) {
      const data = await res.json();
      setSentRequests(data.sent ?? []);
    }
  }

  async function sendRequestToOther() {
    if (!otherStudent || sendingRequest) return;
    setSendingRequest(true);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStudentId: otherStudent.id }),
    });
    if (res.ok) {
      const created = await res.json();
      setSentRequests((prev) => [...prev, { ...created, toStudentId: otherStudent.id }]);
    } else if (res.status === 409) {
      await fetchRequests();
    }
    setSendingRequest(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/roommates"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors -ml-2"
            aria-label="Back to potential roommates"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to roommates
          </Link>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>
        <p className="text-muted-foreground">
          Chat with potential roommates before committing. No request needed.
        </p>
      </motion.div>

      <div className="flex flex-1 min-h-0 border rounded-xl bg-card overflow-hidden">
        {/* Conversation list */}
        <div
          className={cn(
            "flex flex-col w-full lg:w-80 shrink-0 border-r",
            selectedId ? "hidden lg:flex" : "flex"
          )}
        >
          {loadingList ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium text-foreground">No conversations yet</p>
              <p className="text-sm mt-1">
                Go to Find Roommates and tap &quot;Message&quot; on someone to start chatting.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.map((c) => (
                <button
                  key={c.conversationId}
                  onClick={() => {
                    setSelectedId(c.conversationId);
                    router.replace(`/messages?conversation=${c.conversationId}`, { scroll: false });
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left border-b hover:bg-muted/50 transition-colors",
                    selectedId === c.conversationId && "bg-muted/50"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={c.otherStudent?.photo ?? undefined} />
                    <AvatarFallback>
                      {c.otherStudent?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.otherStudent?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.lastMessage?.content ?? "No messages yet"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thread */}
        <div
          className={cn(
            "flex flex-col flex-1 min-w-0",
            !selectedId && "hidden lg:flex lg:items-center lg:justify-center lg:bg-muted/20"
          )}
        >
          {selectedId ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => {
                    setSelectedId(null);
                    router.replace("/messages", { scroll: false });
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={otherStudent?.photo ?? undefined} />
                  <AvatarFallback>
                    {otherStudent?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold truncate flex-1 min-w-0">{otherStudent?.name}</p>
                {requestToOther ? (
                  <Badge
                    variant={REQUEST_STATUS[requestToOther.status]?.variant ?? "secondary"}
                    className="gap-1 shrink-0 shadow-sm ring-1 ring-border/80"
                  >
                    {REQUEST_STATUS[requestToOther.status]?.icon}
                    {REQUEST_STATUS[requestToOther.status]?.label ?? requestToOther.status}
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={sendRequestToOther}
                    disabled={sendingRequest}
                    className="gap-1 shrink-0 bg-primary/12 text-primary border-primary/40 hover:bg-primary/20 hover:border-primary/50"
                  >
                    {sendingRequest ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    Send roommate request
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex",
                        m.senderId === otherStudent?.id ? "justify-start" : "justify-end"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                          m.senderId === otherStudent?.id
                            ? "bg-muted text-foreground"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <p
                          className={cn(
                            "text-[10px] mt-1",
                            m.senderId === otherStudent?.id
                              ? "text-muted-foreground"
                              : "text-primary-foreground/80"
                          )}
                        >
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                className="flex gap-2 p-3 border-t bg-card shrink-0"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button type="submit" size="icon" disabled={!draft.trim() || sending}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center text-muted-foreground p-8">
              <ArrowLeft className="h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium text-foreground">Select a conversation</p>
              <p className="text-sm mt-1">Or start one from Find Roommates.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}

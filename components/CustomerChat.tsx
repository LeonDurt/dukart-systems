"use client";

import { useEffect, useRef, useState } from "react";

type ChatUser = {
  id: string;
  email: string;
  role: string;
  staffProfile?: { displayName: string } | null;
  customer?: { firstName: string; lastName: string } | null;
};

type Message = {
  id: string;
  message: string;
  createdAt: string;
  user: ChatUser;
};

function displayName(user: ChatUser) {
  if (user.role === "CUSTOMER") {
    if (user.customer) return `${user.customer.firstName} ${user.customer.lastName}`;
    return user.email.split("@")[0];
  }
  if (user.staffProfile?.displayName) return user.staffProfile.displayName;
  return "Geschäftsführung";
}

function roleLabel(role: string) {
  if (role === "ADMIN" || role === "SUPERVISOR") return "Geschäftsführung";
  if (role === "STAFF") return "Mitarbeiter";
  return null;
}

export default function CustomerChat({
  orderId,
  currentUserId,
}: {
  orderId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const prevCountRef = useRef(0);
  const isInitialLoad = useRef(true);

  function isNearBottom() {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  async function loadMessages() {
    try {
      const res = await fetch(`/api/chat/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("[Chat] Nachrichten konnten nicht geladen werden:", err);
    }
  }

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [orderId]);

  useEffect(() => {
    const newCount = messages.length;
    const hadNewMessages = newCount > prevCountRef.current;
    prevCountRef.current = newCount;

    // Initial load: immer nach unten scrollen
    if (isInitialLoad.current && newCount > 0) {
      isInitialLoad.current = false;
      bottomRef.current?.scrollIntoView({ behavior: "instant" } as any);
      return;
    }

    // Bei neuen Nachrichten: nur scrollen wenn schon nahe am Ende
    if (hadNewMessages && isNearBottom()) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    await fetch(`/api/chat/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    setSending(false);
    await loadMessages();
  }

  return (
    <div className="flex flex-col">
      <div ref={scrollContainerRef} className="h-72 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3 mb-3">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-slate-600 pt-6">Noch keine Nachrichten. Schreib uns!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user.id === currentUserId;
            const isStaff = msg.user.role !== "CUSTOMER";
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  <div className="flex items-center gap-1.5 px-1">
                    {!isMe && (
                      <span className={`text-xs font-medium ${isStaff ? "text-cyan-300" : "text-slate-400"}`}>
                        {displayName(msg.user)}
                        {isStaff && roleLabel(msg.user.role) && (
                          <span className="ml-1 rounded-full bg-cyan-400/10 px-1.5 py-0.5 text-[10px]">
                            {roleLabel(msg.user.role)}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                    isMe
                      ? "bg-cyan-400 text-slate-950 rounded-tr-sm"
                      : isStaff
                      ? "bg-white/10 text-white rounded-tl-sm border border-cyan-400/20"
                      : "bg-white/10 text-white rounded-tl-sm"
                  }`}>
                    {msg.message}
                  </div>
                  <span className="px-1 text-[10px] text-slate-600">
                    {new Date(msg.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nachricht schreiben…"
          className="flex-1 rounded-2xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-300 placeholder:text-slate-600"
        />
        <button type="submit" disabled={sending || !input.trim()}
          className="rounded-2xl bg-cyan-300 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:scale-105 disabled:opacity-50">
          Senden
        </button>
      </form>
    </div>
  );
}

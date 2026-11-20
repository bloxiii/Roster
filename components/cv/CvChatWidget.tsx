"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import type { AgentMessage } from "@/lib/agent/types";

type Status = "idle" | "loading" | "error";
type CvChatResponse = { reply: string; conversationId: string };

/** Variante simplifiée de ChatWidget — pas de prospect, pas de widget key. */
export function CvChatWidget() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [conversationId, setConversationId] = useState<string | undefined>();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  const sendToAgent = useCallback(
    async (allMessages: AgentMessage[]) => {
      setStatus("loading");

      try {
        const response = await fetch("/api/cv/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: allMessages, conversationId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: CvChatResponse = await response.json();
        setConversationId(data.conversationId);
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        setStatus("idle");
      } catch (error) {
        console.error("[CvChatWidget] Erreur:", error);
        setStatus("error");
      }
    },
    [conversationId],
  );

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    sendToAgent([{ role: "user", content: "Bonjour" }]);
  }, [sendToAgent]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || status === "loading") return;

    const updated: AgentMessage[] = [...messages, { role: "user", content: text }];
    setMessages(updated);
    setInput("");
    sendToAgent(updated);
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brass/20">
          <span className="font-mono text-sm font-medium text-brass">E</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-paper">Enzo</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-status/30 bg-status/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-status">
              <span className="relative flex h-1 w-1">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex h-1 w-1 rounded-full bg-status" />
              </span>
              En ligne
            </span>
          </div>
          <span className="text-xs text-paper-dim">Posez vos questions sur mon parcours</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "rounded-br-md bg-brass text-on-brass"
                  : "rounded-bl-md border border-border/60 bg-surface text-paper"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {status === "loading" && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-border/60 bg-surface px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-paper-dim/40 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-paper-dim/40 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-paper-dim/40 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
            Erreur de communication. Veuillez réessayer, ou me contacter directement.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 border-t border-border/60 px-4 py-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez votre message..."
          disabled={status === "loading"}
          className="flex-1 rounded-lg border border-border bg-ink px-4 py-2.5 text-sm text-paper placeholder:text-paper-dim/50 outline-none transition-colors focus:border-brass disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || status === "loading"}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brass text-on-brass transition-colors hover:bg-brass-bright disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}

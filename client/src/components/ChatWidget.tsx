import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ChevronDown, LoaderCircle, MessageCircleMore, Send, UserRound } from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { openChatSession, sendChatMessage, type ChatConversation, type ChatMessage } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const SESSION_STORAGE_KEY = "cvs_visitor_session";

function getSessionId() {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed.id || null;
  } catch {
    return null;
  }
}

function formatTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ChatWidget() {
  const [location] = useLocation();
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [introVisibleCount, setIntroVisibleCount] = useState<number | null>(null);
  const [showAgentCard, setShowAgentCard] = useState(false);
  const [inputLocked, setInputLocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const introTimersRef = useRef<number[]>([]);
  const replyTypingTimerRef = useRef<number | null>(null);

  function clearIntroTimers() {
    introTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    introTimersRef.current = [];
  }

  function clearReplyTypingTimer() {
    if (replyTypingTimerRef.current !== null) {
      window.clearTimeout(replyTypingTimerRef.current);
      replyTypingTimerRef.current = null;
    }
  }

  const copy = useMemo(() => {
    if (locale === "fr") {
      return {
        button: "Chat",
        waiting: "Connexion en cours...",
        placeholder: "Ecrivez votre question...",
        empty: "Commencez ici.",
        error: "Impossible de charger le chat.",
        typing: "ecrit...",
        locked: "Attendez un instant...",
      };
    }

    if (locale === "ar") {
      return {
        button: "الدردشة",
        waiting: "جارٍ ربطك...",
        placeholder: "اكتب سؤالك هنا...",
        empty: "ابدأ من هنا.",
        error: "تعذر تحميل الدردشة.",
        typing: "يكتب الآن...",
        locked: "انتظر قليلًا...",
      };
    }

    return {
      button: "Chat",
      waiting: "Connecting you...",
      placeholder: "Type your question...",
      empty: "Start here.",
      error: "Failed to load the chat.",
      typing: "is typing...",
      locked: "Please wait...",
    };
  }, [locale]);

  const hidden = location.includes("/dashboard");

  useEffect(() => {
    return () => {
      clearIntroTimers();
      clearReplyTypingTimer();
    };
  }, []);

  useEffect(() => {
    if (!open || hidden) return;

    clearIntroTimers();
    setBusy(true);
    setTyping(false);
    setError(null);
    setShowAgentCard(false);
    setInputLocked(false);

    openChatSession({
      locale,
      path: window.location.pathname + window.location.search + window.location.hash,
      sessionId: getSessionId(),
    })
      .then((payload) => {
        setConversation(payload.conversation);

        if (payload.isNew && payload.conversation.messages.length) {
          setIntroVisibleCount(1);
          setInputLocked(true);

          const agentDelay = window.setTimeout(() => {
            setShowAgentCard(true);
          }, 7000);

          const typingDelay = window.setTimeout(() => {
            setTyping(true);
          }, 9000);

          const revealDelay = window.setTimeout(() => {
            setIntroVisibleCount(2);
          }, 14000);

          const doneDelay = window.setTimeout(() => {
            setTyping(false);
            setIntroVisibleCount(null);
            setInputLocked(false);
          }, 14600);

          introTimersRef.current = [agentDelay, typingDelay, revealDelay, doneDelay];
          return;
        }

        setIntroVisibleCount(null);
      })
      .catch((err) => {
        setError(err?.message || copy.error);
      })
      .finally(() => {
        setBusy(false);
      });
  }, [open, hidden, locale, copy.error]);

  async function handleSend(message: string) {
    const content = message.trim();
    if (!content || busy) return;

    try {
      setBusy(true);
      setTyping(false);
      setError(null);
      clearIntroTimers();
      clearReplyTypingTimer();
      setIntroVisibleCount(null);
      setInputLocked(false);

      const currentConversation =
        conversation ||
        (
          await openChatSession({
            locale,
            path: window.location.pathname + window.location.search + window.location.hash,
            sessionId: getSessionId(),
          })
        ).conversation;

      const optimisticMessage: ChatMessage = {
        id: `pending-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      setConversation({
        ...currentConversation,
        messages: [...currentConversation.messages, optimisticMessage],
      });
      setDraft("");
      replyTypingTimerRef.current = window.setTimeout(() => {
        setTyping(true);
      }, 2000);

      const payload = await sendChatMessage({
        conversationId: currentConversation.id,
        locale,
        path: window.location.pathname + window.location.search + window.location.hash,
        message: content,
        sessionId: getSessionId(),
      });

      clearReplyTypingTimer();
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      setConversation(payload.conversation);
    } catch (err: any) {
      clearReplyTypingTimer();
      setError(err?.message || copy.error);
    } finally {
      setTyping(false);
      setBusy(false);
    }
  }

  const visibleMessages = useMemo(() => {
    if (!conversation) return [];
    if (introVisibleCount === null) return conversation.messages;
    return conversation.messages.slice(0, introVisibleCount);
  }, [conversation, introVisibleCount]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [visibleMessages.length, open, typing, showAgentCard]);

  if (hidden) return null;

  return (
    <div className="fixed bottom-6 right-4 z-[65] sm:right-6">
      {open ? (
        <div className="relative pt-8">
          <button
            type="button"
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-full bg-white p-3 text-slate-500 shadow-lg transition hover:bg-slate-100"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            <ChevronDown className="h-4 w-4" />
          </button>

          <Card className="w-[calc(100vw-2rem)] max-w-[300px] overflow-hidden rounded-[24px] border-slate-200 bg-white shadow-2xl">
            <div ref={scrollRef} className="h-[320px] overflow-y-auto px-3 pb-3 pt-3">
              <div className="space-y-3">
              {showAgentCard && conversation?.assistantName ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1d3278] text-white">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800">{conversation.assistantName}</div>
                    <div className="text-[11px] text-slate-500">{copy.waiting}</div>
                  </div>
                </div>
              ) : null}

              {!visibleMessages.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  {copy.empty}
                </div>
              ) : null}

              {visibleMessages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[86%] rounded-2xl px-3.5 py-3 text-sm leading-6 ${
                    message.role === "assistant"
                      ? "bg-slate-100 text-slate-800"
                      : "ms-auto bg-[#1d3278] text-white"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`mt-2 text-[11px] ${message.role === "assistant" ? "text-slate-400" : "text-white/65"}`}>
                    {formatTime(message.createdAt, locale)}
                  </div>
                </div>
              ))}

              {typing ? (
                <div className="max-w-[72%] rounded-2xl bg-slate-100 px-3.5 py-3 text-slate-500">
                  <div className="mb-2 text-[11px] text-slate-400">
                    {conversation?.assistantName ? `${conversation.assistantName} ${copy.typing}` : copy.typing}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  </div>
                </div>
              ) : null}
              </div>
            </div>

            <div className="border-t border-slate-100 bg-white px-3 py-3">
              {error ? <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}
              <div className="flex items-end gap-3">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={inputLocked ? copy.locked : copy.placeholder}
                  className="min-h-[50px] resize-none rounded-2xl border-slate-200 text-sm"
                  rows={2}
                  disabled={inputLocked}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend(draft);
                    }
                  }}
                />
                <Button
                  type="button"
                  className="h-11 w-11 rounded-2xl px-0"
                  disabled={busy || inputLocked || !draft.trim()}
                  onClick={() => void handleSend(draft)}
                >
                  {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Button
          type="button"
          className="group h-14 w-14 rounded-[20px] border border-white/20 bg-gradient-to-br from-[#1d3278] via-[#27439a] to-[#0f8b5f] p-0 text-white shadow-[0_20px_50px_rgba(29,50,120,0.35)] transition-all hover:scale-[1.03] hover:shadow-[0_24px_60px_rgba(15,139,95,0.28)]"
          onClick={() => setOpen(true)}
          aria-label={copy.button}
        >
          <span className="relative flex h-full w-full items-center justify-center">
            <MessageCircleMore className="h-6 w-6 transition-transform group-hover:scale-105" />
          </span>
        </Button>
      )}
    </div>
  );
}

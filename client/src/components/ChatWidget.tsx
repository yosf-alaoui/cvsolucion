import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { LoaderCircle, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { openChatSession, sendChatMessage, type ChatConversation } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const copy = useMemo(() => {
    if (locale === "fr") {
      return {
        button: "Assistant",
        title: "Assistant CVsolucion",
        subtitle: "Posez une question sur les services, la formation ou la tarification.",
        placeholder: "Ecrivez votre question...",
        send: "Envoyer",
        starters: [
          "J'ai besoin d'aide sur Cabinet Vision",
          "Quelle formation me convient ?",
          "Je veux un service design & pricing",
        ],
        statusOpen: "Reponse en cours",
        statusWaiting: "En attente du client",
        statusHuman: "A rediriger vers WhatsApp",
        empty: "Commencez par une question simple.",
        error: "Impossible de charger l'assistant.",
      };
    }
    if (locale === "ar") {
      return {
        button: "المجيب",
        title: "مجيب CVsolucion",
        subtitle: "اسأل عن الخدمات أو التدريب أو التصميم والتسعير.",
        placeholder: "اكتب سؤالك هنا...",
        send: "إرسال",
        starters: [
          "أحتاج دعماً في Cabinet Vision",
          "ما الباقة التدريبية المناسبة لي؟",
          "أريد خدمة التصميم والتسعير",
        ],
        statusOpen: "المحادثة نشطة",
        statusWaiting: "بانتظار رد العميل",
        statusHuman: "يفضل التحويل إلى واتساب",
        empty: "ابدأ بسؤال بسيط.",
        error: "تعذر تحميل المجيب.",
      };
    }
    return {
      button: "Assistant",
      title: "CVsolucion Assistant",
      subtitle: "Ask about services, training, design, or pricing.",
      placeholder: "Type your question...",
      send: "Send",
      starters: [
        "I need Cabinet Vision support",
        "Which training level fits me?",
        "I want design & pricing help",
      ],
      statusOpen: "Conversation active",
      statusWaiting: "Waiting for client reply",
      statusHuman: "Best moved to WhatsApp",
      empty: "Start with a simple question.",
      error: "Failed to load the assistant.",
    };
  }, [locale]);

  const hidden = location.includes("/dashboard");

  useEffect(() => {
    if (!open || hidden) return;
    setBusy(true);
    setError(null);
    openChatSession({
      locale,
      path: window.location.pathname + window.location.search + window.location.hash,
      sessionId: getSessionId(),
    })
      .then((payload) => {
        setConversation(payload.conversation);
      })
      .catch((err) => {
        setError(err?.message || copy.error);
      })
      .finally(() => {
        setBusy(false);
      });
  }, [open, hidden, locale, copy.error]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [conversation?.messages.length, open]);

  async function handleSend(message: string) {
    const content = message.trim();
    if (!content || busy) return;

    try {
      setBusy(true);
      setError(null);
      const currentConversation =
        conversation ||
        (
          await openChatSession({
            locale,
            path: window.location.pathname + window.location.search + window.location.hash,
            sessionId: getSessionId(),
          })
        ).conversation;

      setConversation(currentConversation);
      const payload = await sendChatMessage({
        conversationId: currentConversation.id,
        locale,
        path: window.location.pathname + window.location.search + window.location.hash,
        message: content,
        sessionId: getSessionId(),
      });
      setConversation(payload.conversation);
      setDraft("");
    } catch (err: any) {
      setError(err?.message || copy.error);
    } finally {
      setBusy(false);
    }
  }

  if (hidden) return null;

  return (
    <div className="fixed bottom-6 left-4 z-[65] sm:left-6">
      {open ? (
        <Card className="w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-[28px] border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-[#1d3278] to-[#2f4aa3] px-5 py-4 text-white">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                <Sparkles className="h-4 w-4" />
                CVsolucion
              </div>
              <div className="mt-2 text-xl font-semibold">{copy.title}</div>
              <div className="mt-1 text-sm text-white/80">{copy.subtitle}</div>
            </div>
            <button
              type="button"
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-slate-100 px-5 py-3 text-xs text-slate-500">
            {conversation?.status === "needs_human"
              ? copy.statusHuman
              : conversation?.status === "waiting_client"
                ? copy.statusWaiting
                : copy.statusOpen}
            {user?.email ? ` • ${user.email}` : ""}
          </div>

          <ScrollArea className="h-[360px] px-4 py-4">
            <div ref={messagesRef} className="space-y-3">
              {!conversation?.messages.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  {copy.empty}
                </div>
              ) : null}

              {conversation?.messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
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

              {!conversation?.messages.length ? (
                <div className="flex flex-wrap gap-2">
                  {copy.starters.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-primary hover:text-primary"
                      onClick={() => handleSend(starter)}
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </ScrollArea>

          <div className="border-t border-slate-100 bg-white px-4 py-4">
            {error ? <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}
            <div className="flex items-end gap-3">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={copy.placeholder}
                className="min-h-[56px] resize-none rounded-2xl border-slate-200"
                rows={2}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend(draft);
                  }
                }}
              />
              <Button
                type="button"
                className="h-12 rounded-2xl px-4"
                disabled={busy || !draft.trim()}
                onClick={() => void handleSend(draft)}
              >
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button
          type="button"
          className="h-14 rounded-full bg-[#1d3278] px-5 text-white shadow-xl hover:bg-[#243f93]"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="me-2 h-5 w-5" />
          {copy.button}
        </Button>
      )}
    </div>
  );
}

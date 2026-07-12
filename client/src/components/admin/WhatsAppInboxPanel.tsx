import { type FormEvent, useMemo, useState } from "react";
import type { AdminWhatsAppInboxConversation } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getPhoneCountryOptions } from "@/lib/phone";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "Francais" },
  { value: "es", label: "Espanol" },
  { value: "ar", label: "Arabic" },
];

function formatDate(value: string | null, locale: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function statusVariant(status: AdminWhatsAppInboxConversation["status"]) {
  if (status === "needs_reply") return "destructive" as const;
  if (status === "waiting_customer") return "secondary" as const;
  return "default" as const;
}

function lastMessagePreview(conversation: AdminWhatsAppInboxConversation) {
  return conversation.messages[conversation.messages.length - 1]?.body || "";
}

function contactLabel(conversation: AdminWhatsAppInboxConversation) {
  return (
    conversation.contactName ||
    conversation.email ||
    conversation.displayPhone ||
    conversation.phone
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

export default function WhatsAppInboxPanel({
  copy,
  locale,
  enabled,
  conversations,
  selectedConversationId,
  sending,
  startingTemplate,
  onSelect,
  onSend,
  onStartTemplate,
}: {
  copy: Record<string, string>;
  locale: string;
  enabled: boolean;
  conversations: AdminWhatsAppInboxConversation[];
  selectedConversationId: string | null;
  sending: boolean;
  startingTemplate: boolean;
  onSelect: (conversationId: string) => void;
  onSend: (conversationId: string, body: string) => Promise<void>;
  onStartTemplate: (payload: {
    name?: string;
    phone: string;
    countryCode: string;
    language: string;
    templateName?: string;
  }) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactCountryCode, setNewContactCountryCode] = useState("CA");
  const [newContactLanguage, setNewContactLanguage] = useState(
    locale === "fr" ? "fr" : locale === "ar" ? "ar" : "en",
  );
  const [newContactTemplateName, setNewContactTemplateName] = useState("");
  const countryOptions = useMemo(
    () => getPhoneCountryOptions(locale),
    [locale],
  );
  const selected = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId,
      ) ??
      conversations[0] ??
      null,
    [conversations, selectedConversationId],
  );

  const handleSend = async () => {
    if (!selected || !draft.trim()) return;
    const message = draft.trim();
    await onSend(selected.id, message);
    setDraft("");
  };

  const handleStartTemplate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newContactPhone.trim()) return;
    await onStartTemplate({
      name: newContactName.trim() || undefined,
      phone: newContactPhone.trim(),
      countryCode: newContactCountryCode,
      language: newContactLanguage,
      templateName: newContactTemplateName.trim() || undefined,
    });
    setNewContactName("");
    setNewContactPhone("");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{copy.whatsappInbox}</CardTitle>
            <Badge variant={enabled ? "default" : "secondary"}>
              {enabled ? copy.enabled : copy.notConfigured}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleStartTemplate}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="mb-4">
              <div className="text-sm font-semibold text-slate-950">
                {copy.newWhatsAppMessage}
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {copy.newWhatsAppTemplateHelp}
              </p>
            </div>
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="new-whatsapp-name">
                  {copy.contactNameOptional}
                </Label>
                <Input
                  id="new-whatsapp-name"
                  value={newContactName}
                  onChange={(event) => setNewContactName(event.target.value)}
                  placeholder={copy.contactNameOptional}
                  maxLength={120}
                  disabled={!enabled || startingTemplate}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1.1fr]">
                <div className="space-y-2">
                  <Label>{copy.country}</Label>
                  <Select
                    value={newContactCountryCode}
                    onValueChange={setNewContactCountryCode}
                    disabled={!enabled || startingTemplate}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-whatsapp-phone">{copy.phone}</Label>
                  <Input
                    id="new-whatsapp-phone"
                    type="tel"
                    value={newContactPhone}
                    onChange={(event) => setNewContactPhone(event.target.value)}
                    placeholder="+1 514 000 0000"
                    disabled={!enabled || startingTemplate}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-2">
                  <Label>{copy.templateLanguage}</Label>
                  <Select
                    value={newContactLanguage}
                    onValueChange={setNewContactLanguage}
                    disabled={!enabled || startingTemplate}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-whatsapp-template">
                    {copy.templateNameOptional}
                  </Label>
                  <Input
                    id="new-whatsapp-template"
                    value={newContactTemplateName}
                    onChange={(event) =>
                      setNewContactTemplateName(event.target.value)
                    }
                    placeholder="career_qna_start"
                    maxLength={120}
                    disabled={!enabled || startingTemplate}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={
                  !enabled || startingTemplate || !newContactPhone.trim()
                }
              >
                {startingTemplate ? copy.sending : copy.startWhatsAppTemplate}
              </Button>
            </div>
          </form>

          <ScrollArea className="h-[450px] pr-3">
            <div className="space-y-3">
              {conversations.length ? (
                conversations.map((conversation) => {
                  const isSelected = conversation.id === selected?.id;
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => onSelect(conversation.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 bg-white hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-950">
                            {contactLabel(conversation)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {conversation.displayPhone}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {conversation.unreadCount ? (
                            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                              {conversation.unreadCount}
                            </span>
                          ) : null}
                          <Badge variant={statusVariant(conversation.status)}>
                            {copy[conversation.status] || conversation.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 line-clamp-2 text-sm text-slate-600">
                        {lastMessagePreview(conversation) || copy.noMessages}
                      </div>
                      <div className="mt-3 text-xs text-slate-500">
                        {formatDate(conversation.lastMessageAt, locale)}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                  {copy.noWhatsAppConversations}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.whatsappConversation}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {selected ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <StatPill label={copy.client} value={contactLabel(selected)} />
                <StatPill label={copy.phone} value={selected.displayPhone} />
                <StatPill
                  label={copy.status}
                  value={copy[selected.status] || selected.status}
                />
                <StatPill label={copy.unread} value={selected.unreadCount} />
              </div>

              <ScrollArea className="h-[440px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-3 pr-3">
                  {selected.messages.length ? (
                    selected.messages.map((message) => {
                      const outbound = message.direction === "outbound";
                      return (
                        <div
                          key={message.id}
                          className={`flex ${outbound ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                              outbound
                                ? "bg-[#1d3278] text-white"
                                : "bg-white text-slate-900"
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">
                              {message.body}
                            </div>
                            <div
                              className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] ${
                                outbound ? "text-white/70" : "text-slate-500"
                              }`}
                            >
                              <span>{formatDate(message.createdAt, locale)}</span>
                              <span>{message.status}</span>
                              {message.error ? <span>{message.error}</span> : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-500">{copy.noMessages}</div>
                  )}
                </div>
              </ScrollArea>

              <div className="space-y-3">
                {!enabled ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {copy.whatsappNotConfigured}
                  </div>
                ) : null}
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={copy.writeWhatsAppReply}
                  className="min-h-28 resize-none bg-white"
                  maxLength={1600}
                  disabled={!enabled || sending}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    {draft.trim().length}/1600
                  </span>
                  <Button
                    type="button"
                    onClick={handleSend}
                    disabled={!enabled || sending || !draft.trim()}
                  >
                    {sending ? copy.sending : copy.sendWhatsApp}
                  </Button>
                </div>
                <div className="text-xs leading-5 text-slate-500">
                  {copy.whatsappWindowNote}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              {copy.noWhatsAppConversations}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

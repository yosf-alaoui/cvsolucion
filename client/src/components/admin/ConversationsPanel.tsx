import type { AdminDashboardConversation } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatDate(value: string | null, locale: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function localeBadge(locale: string | null) {
  if (locale === "fr") return "FR";
  if (locale === "ar") return "AR";
  return "EN";
}

function statusVariant(status: AdminDashboardConversation["status"]) {
  if (status === "needs_human") return "destructive" as const;
  if (status === "waiting_client") return "secondary" as const;
  return "default" as const;
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-base font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function ConversationsPanel({
  copy,
  locale,
  conversations,
  selectedConversationId,
  onSelect,
}: {
  copy: Record<string, string>;
  locale: string;
  conversations: AdminDashboardConversation[];
  selectedConversationId: string | null;
  onSelect: (conversationId: string) => void;
}) {
  const selected =
    conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0] ?? null;

  return (
    <div className="grid gap-6 md:grid-cols-[1.02fr_0.98fr]">
      <Card>
        <CardHeader>
          <CardTitle>{copy.conversations}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.email}</TableHead>
                  <TableHead>{copy.status}</TableHead>
                  <TableHead>{copy.lastSeen}</TableHead>
                  <TableHead>{copy.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.length ? (
                  conversations.map((conversation) => {
                    const isSelected = conversation.id === selectedConversationId;
                    return (
                      <TableRow
                        key={conversation.id}
                        className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-slate-50"}`}
                        onClick={() => onSelect(conversation.id)}
                      >
                        <TableCell className="font-medium">
                          <div>{conversation.email || conversation.visitor?.email || conversation.visitor?.ip || conversation.id.slice(0, 10)}</div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span>{conversation.title}</span>
                            <span>{localeBadge(conversation.locale)}</span>
                            <span>{copy.leadScore}: {conversation.leadScore}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(conversation.status)}>{copy[conversation.status] || conversation.status}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(conversation.lastMessageAt, locale)}</TableCell>
                        <TableCell>
                          <button
                            type="button"
                            className={`rounded-md px-3 py-1.5 text-sm font-medium ${isSelected ? "bg-primary text-white" : "border border-slate-200 text-slate-700"}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              onSelect(conversation.id);
                            }}
                          >
                            {copy.select}
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500">
                      {copy.noResults}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.conversationDetail}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {selected ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <StatPill label={copy.status} value={copy[selected.status] || selected.status} />
                <StatPill label={copy.leadScore} value={selected.leadScore} />
                <StatPill label={copy.created} value={formatDate(selected.createdAt, locale)} />
                <StatPill label={copy.lastSeen} value={formatDate(selected.lastMessageAt, locale)} />
                <StatPill label={copy.messages} value={selected.messageCount} />
                <StatPill label={copy.locale} value={localeBadge(selected.locale)} />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">{copy.clientProfile}</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <StatPill label={copy.email} value={selected.email || selected.visitor?.email || "-"} />
                  <StatPill label="IP" value={selected.visitor?.ip || "-"} />
                  <StatPill label={copy.deviceType} value={selected.visitor?.deviceType || "-"} />
                  <StatPill label={copy.registeredState} value={selected.visitor?.isRegistered ? copy.registeredYes : copy.registeredNo} />
                  <StatPill label={copy.source} value={selected.visitor?.utmSource || "-"} />
                  <StatPill label={copy.medium} value={selected.visitor?.utmMedium || "-"} />
                  <StatPill label={copy.campaign} value={selected.visitor?.utmCampaign || "-"} />
                  <StatPill label={copy.landingPage} value={selected.visitor?.landingPath || "-"} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">{copy.engagement}</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <StatPill label={copy.totalSessions} value={selected.visitor?.totalSessions ?? "-"} />
                  <StatPill label={copy.totalPageViews} value={selected.visitor?.totalPageViews ?? "-"} />
                  <StatPill label={copy.whatsappClicks} value={selected.visitor?.whatsappClicks ?? "-"} />
                  <StatPill label={copy.emailClicks} value={selected.visitor?.emailClicks ?? "-"} />
                  <StatPill label={copy.ctaClicks} value={selected.visitor?.ctaClicks ?? "-"} />
                  <StatPill label={copy.lastPage} value={selected.visitor?.lastPath || selected.lastPath || "-"} />
                </div>
              </div>

              {selected.supportIntake ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">{copy.supportDetails || "Support details"}</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <StatPill label={copy.name || "Name"} value={selected.supportIntake.name || "-"} />
                  <StatPill label={copy.country || "Country"} value={selected.supportIntake.country || "-"} />
                  <StatPill label={copy.phone || "Phone"} value={selected.supportIntake.phone} />
                  <StatPill label={copy.email} value={selected.supportIntake.email} />
                  <StatPill label={copy.submittedAt || "Submitted"} value={formatDate(selected.supportIntake.submittedAt, locale)} />
                </div>
              </div>
              ) : null}

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">{copy.messages}</h3>
                {selected.messages.length ? (
                  selected.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                        message.role === "assistant" ? "bg-slate-100 text-slate-800" : "bg-[#1d3278] text-white"
                      }`}
                    >
                      <div className="text-xs uppercase tracking-[0.14em] opacity-70">
                        {message.role === "assistant" ? copy.assistant : copy.client}
                      </div>
                      <div className="mt-2 whitespace-pre-wrap">{message.content}</div>
                      <div className={`mt-2 text-[11px] ${message.role === "assistant" ? "text-slate-400" : "text-white/70"}`}>
                        {formatDate(message.createdAt, locale)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">{copy.noResults}</div>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-500">{copy.noResults}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

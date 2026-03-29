import { useEffect, useMemo, useState } from "react";
import { Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminContactLead } from "@/lib/admin";

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getCopy(locale: string) {
  if (locale === "ar") {
    return {
      title: "طلبات الزبائن",
      subtitle: "كل الطلبات القادمة من نموذج التواصل في مكان واحد.",
      noResults: "لا توجد طلبات حالياً.",
      name: "الاسم",
      email: "البريد",
      interest: "الاهتمام",
      createdAt: "الوصول",
      details: "تفاصيل الطلب",
      company: "الشركة",
      phone: "الهاتف",
      message: "الرسالة",
    };
  }

  if (locale === "fr") {
    return {
      title: "Demandes clients",
      subtitle: "Toutes les demandes du formulaire de contact dans un seul endroit.",
      noResults: "Aucune demande pour le moment.",
      name: "Nom",
      email: "Email",
      interest: "Interet",
      createdAt: "Recue",
      details: "Detail de la demande",
      company: "Societe",
      phone: "Telephone",
      message: "Message",
    };
  }

  return {
    title: "Customer requests",
    subtitle: "All contact-form requests in one operational view.",
    noResults: "No requests yet.",
    name: "Name",
    email: "Email",
    interest: "Interest",
    createdAt: "Received",
    details: "Request detail",
    company: "Company",
    phone: "Phone",
    message: "Message",
  };
}

export default function RequestsManager({
  locale,
  leads,
}: {
  locale: string;
  leads: AdminContactLead[];
}) {
  const copy = useMemo(() => getCopy(locale), [locale]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (!leads.length) {
      setSelectedLeadId(null);
      return;
    }
    if (!selectedLeadId || !leads.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <p className="text-sm text-slate-500">{copy.subtitle}</p>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>{copy.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.name}</TableHead>
                    <TableHead>{copy.email}</TableHead>
                    <TableHead>{copy.interest}</TableHead>
                    <TableHead>{copy.createdAt}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.length ? (
                    leads.map((lead) => (
                      <TableRow
                        key={lead.id}
                        className={`cursor-pointer ${selectedLeadId === lead.id ? "bg-primary/5" : "hover:bg-slate-50"}`}
                        onClick={() => setSelectedLeadId(lead.id)}
                      >
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>{lead.email}</TableCell>
                        <TableCell>{lead.interest || "-"}</TableCell>
                        <TableCell>{formatDate(lead.createdAt, locale)}</TableCell>
                      </TableRow>
                    ))
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
            <CardTitle>{copy.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedLead ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{copy.name}</div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedLead.name}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{copy.company}</div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedLead.company || "-"}</div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-primary/35 hover:bg-primary/5"
                  >
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                      <Mail className="h-4 w-4" />
                      {copy.email}
                    </div>
                    <div className="mt-1 break-all font-semibold text-slate-900">{selectedLead.email}</div>
                  </a>
                  <a
                    href={selectedLead.phone ? `tel:${selectedLead.phone}` : undefined}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-primary/35 hover:bg-primary/5"
                  >
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                      <Phone className="h-4 w-4" />
                      {copy.phone}
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">{selectedLead.phone || "-"}</div>
                  </a>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">{copy.message}</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{selectedLead.message}</div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500">{copy.noResults}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

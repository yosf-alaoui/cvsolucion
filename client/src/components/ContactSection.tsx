import { useMemo, useState } from "react";
import { CalendarDays, Mail, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import { submitContactLead } from "@/lib/contact";
import { CONTACT_EMAIL, WHATSAPP_PHONE, getBookingHref, getContactMailHref } from "@/lib/site";

const interestOptions = {
  en: ["Consulting", "Training", "CNC troubleshooting", "Migration / restore", "Pricing / design", "General inquiry"],
  fr: ["Conseil", "Formation", "Depannage CNC", "Migration / restauration", "Tarification / design", "Demande generale"],
  ar: ["استشارات", "تدريب", "حل مشاكل CNC", "ترحيل / استعادة", "تسعير / تصميم", "استفسار عام"],
} as const;

export default function ContactSection() {
  const { locale, t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error" | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    interest: interestOptions[locale][0],
    message: "",
  });

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        kicker: "تواصل منظم",
        title: "ابدأ عبر نموذج رسمي أو احجز استشارة",
        subtitle:
          "إذا كنت تفضل تواصلاً منظماً بدل المحادثة السريعة، اترك تفاصيلك هنا وسنراجع الحالة ونعود إليك بخطوة واضحة.",
        formTitle: "أرسل طلبك",
        name: "الاسم",
        email: "البريد الإلكتروني",
        company: "الشركة",
        phone: "الهاتف / واتساب",
        interest: "نوع الطلب",
        message: "رسالتك",
        submit: "إرسال الطلب",
        sending: "جارٍ الإرسال...",
        success: "تم استلام طلبك بنجاح. سنعود إليك قريباً.",
        asideTitle: "خيارات تواصل إضافية",
        asideText:
          "اختر القناة الأنسب لفريقك: نموذج رسمي، حجز استشارة، أو واتساب عندما تكون المشكلة عاجلة.",
        book: "احجز استشارة",
        emailDirect: "راسلنا مباشرة",
        whatsapp: "واتساب",
        checklist: [
          "مراجعة الحالة قبل أي تعديل",
          "توصية أولية واضحة بدل رد عام",
          "تنفيذ آمن مع مراعاة النسخ الاحتياطي",
        ],
      };
    }
    if (locale === "fr") {
      return {
        kicker: "Contact structure",
        title: "Demarrez avec un formulaire clair ou reservez une consultation",
        subtitle:
          "Si votre equipe prefere un canal formel plutot qu'un simple message WhatsApp, laissez votre demande ici et nous reviendrons avec une prochaine etape claire.",
        formTitle: "Envoyer une demande",
        name: "Nom",
        email: "Email",
        company: "Societe",
        phone: "Telephone / WhatsApp",
        interest: "Type de demande",
        message: "Message",
        submit: "Envoyer la demande",
        sending: "Envoi en cours...",
        success: "Votre demande a bien ete recue. Nous revenons vers vous rapidement.",
        asideTitle: "Autres canaux",
        asideText:
          "Choisissez le canal adapte a votre contexte: formulaire formel, reservation de consultation, ou WhatsApp si la situation est urgente.",
        book: "Reserver une consultation",
        emailDirect: "Nous ecrire",
        whatsapp: "WhatsApp",
        checklist: [
          "Analyse du contexte avant intervention",
          "Recommandation claire plutot qu'une reponse generique",
          "Execution securisee avec plan de sauvegarde",
        ],
      };
    }
    return {
      kicker: "Structured Contact",
      title: "Start with a formal request or book a consultation",
      subtitle:
        "If your team prefers a structured intake instead of a quick chat, leave your details here and we will return with a clear next step.",
      formTitle: "Send your request",
      name: "Name",
      email: "Email",
      company: "Company",
      phone: "Phone / WhatsApp",
      interest: "Request type",
      message: "Message",
      submit: "Send request",
      sending: "Sending...",
      success: "Your request has been received. We will reply shortly.",
      asideTitle: "Other channels",
      asideText:
        "Choose the channel that fits your team best: a formal form, a booked consultation, or WhatsApp when the issue is urgent.",
      book: "Book a consultation",
      emailDirect: "Email us directly",
      whatsapp: "WhatsApp",
      checklist: [
        "Context reviewed before any change",
        "Clear first recommendation, not generic support",
        "Safe execution with backup-first thinking",
      ],
    };
  }, [locale]);

  const whatsappHref = useMemo(() => buildWhatsAppLink(WHATSAPP_PHONE, t("whatsapp.needHelp")), [t]);
  const bookingHref = getBookingHref();
  const emailHref = getContactMailHref("Cabinet Vision support request");

  const onChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    setTone(null);
    try {
      await submitContactLead({ ...form, locale });
      setStatus(copy.success);
      setTone("success");
      setForm({
        name: "",
        email: "",
        company: "",
        phone: "",
        interest: interestOptions[locale][0],
        message: "",
      });
    } catch (error: any) {
      setStatus(error?.message || t("auth.genericError"));
      setTone("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="contact" className="py-22">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="glass-chip inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
            {copy.kicker}
          </span>
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{copy.title}</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{copy.subtitle}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-card-strong card-static rounded-[32px] p-8">
            <h3 className="text-2xl font-bold text-slate-950">{copy.formTitle}</h3>
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">{copy.name}</Label>
                  <Input id="contact-name" value={form.name} onChange={(e) => onChange("name", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">{copy.email}</Label>
                  <Input id="contact-email" type="email" value={form.email} onChange={(e) => onChange("email", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-company">{copy.company}</Label>
                  <Input id="contact-company" value={form.company} onChange={(e) => onChange("company", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">{copy.phone}</Label>
                  <Input id="contact-phone" value={form.phone} onChange={(e) => onChange("phone", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-interest">{copy.interest}</Label>
                <Input id="contact-interest" value={form.interest} onChange={(e) => onChange("interest", e.target.value)} list="contact-interest-options" />
                <datalist id="contact-interest-options">
                  {interestOptions[locale].map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">{copy.message}</Label>
                <Textarea id="contact-message" className="min-h-40" value={form.message} onChange={(e) => onChange("message", e.target.value)} required />
              </div>

              <Button type="submit" className="rounded-full bg-primary px-6 text-white hover:bg-primary/90" disabled={busy}>
                <Send className="mr-2 h-4 w-4" />
                {busy ? copy.sending : copy.submit}
              </Button>
            </form>

            {status ? (
              <div
                className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                  tone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {status}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="glass-card-strong card-static rounded-[32px] p-8">
              <h3 className="text-2xl font-bold text-slate-950">{copy.asideTitle}</h3>
              <p className="mt-4 text-base leading-8 text-slate-600">{copy.asideText}</p>

              <div className="mt-6 space-y-3">
                <a href={bookingHref} target={bookingHref.startsWith("http") ? "_blank" : undefined} rel={bookingHref.startsWith("http") ? "noopener noreferrer" : undefined} className="glass-chip flex items-center justify-between rounded-2xl px-5 py-4 text-slate-900">
                  <span className="font-semibold">{copy.book}</span>
                  <CalendarDays className="h-5 w-5 text-primary" />
                </a>
                <a href={emailHref} className="glass-chip flex items-center justify-between rounded-2xl px-5 py-4 text-slate-900">
                  <span className="font-semibold">{copy.emailDirect}</span>
                  <Mail className="h-5 w-5 text-primary" />
                </a>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="glass-chip flex items-center justify-between rounded-2xl px-5 py-4 text-slate-900">
                  <span className="font-semibold">{copy.whatsapp}</span>
                  <MessageCircle className="h-5 w-5 text-primary" />
                </a>
              </div>

              <div className="mt-8 border-t border-slate-200/70 pt-6">
                <ul className="space-y-4">
                  {copy.checklist.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                      <ShieldCheck className="mt-1 h-4 w-4 flex-none text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 text-sm text-slate-500">
                {CONTACT_EMAIL}
                <div className="mt-1" dir="ltr">{WHATSAPP_PHONE}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

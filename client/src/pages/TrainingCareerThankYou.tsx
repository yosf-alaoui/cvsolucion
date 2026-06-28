import { useEffect } from "react";
import { CheckCircle2, Mail, MessageCircle } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import {
  consumeCareerLeadForThankYou,
  trackCampaignEvent,
} from "@/lib/campaignTracking";

const copy = {
  en: {
    title: "Career evaluation request received | CVsolucion",
    heading: "Thank you. Your request has been received.",
    body: "We will review your shop experience, your goals, and your preferred time, then contact you to confirm the best next step.",
    reminder: "Please check your email and WhatsApp messages.",
    home: "Return to the training page",
    question: "Ask a question on WhatsApp",
    message:
      "Hello CVsolucion, I submitted a Cabinet Vision career evaluation request and have a question.",
  },
  fr: {
    title: "Demande d'evaluation recue | CVsolucion",
    heading: "Merci. Votre demande a bien ete recue.",
    body: "Nous examinerons votre experience, votre objectif et votre disponibilite, puis nous vous contacterons pour confirmer la meilleure prochaine etape.",
    reminder: "Verifiez votre email et vos messages WhatsApp.",
    home: "Retourner a la page de formation",
    question: "Poser une question sur WhatsApp",
    message:
      "Bonjour CVsolucion, j'ai envoye une demande d'evaluation de carriere Cabinet Vision et j'ai une question.",
  },
  ar: {
    title: "تم استلام طلب التقييم | CVsolucion",
    heading: "شكرا. تم استلام طلبك.",
    body: "سنراجع خبرتك الحالية وهدفك والوقت المفضل، ثم نتواصل معك لتأكيد أفضل خطوة تالية.",
    reminder: "يرجى متابعة بريدك الإلكتروني ورسائل واتساب.",
    home: "العودة إلى صفحة التدريب",
    question: "اطرح سؤالا عبر واتساب",
    message:
      "مرحبا CVsolucion، أرسلت طلب تقييم مهني لتدريب Cabinet Vision ولدي سؤال.",
  },
} as const;

export default function TrainingCareerThankYou() {
  const { locale } = useI18n();
  const pageLocale = locale === "fr" || locale === "ar" ? locale : "en";
  const text = copy[pageLocale];
  const base = pageLocale === "en" ? "" : `/${pageLocale}`;
  const whatsappHref = buildWhatsAppLink("+1 438 807 8747", text.message);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const confirmedLeadId =
      params.get("confirmed") === "1" ? params.get("lead") || "confirmed" : null;
    const leadId = consumeCareerLeadForThankYou() || confirmedLeadId;
    if (!leadId) return;
    trackCampaignEvent("Lead", {
      lead_id: leadId,
      content_name: "Cabinet Vision Career Evaluation",
      locale: pageLocale,
    });
  }, [pageLocale]);

  return (
    <div
      className="site-page flex min-h-screen flex-col bg-transparent"
      dir={pageLocale === "ar" ? "rtl" : "ltr"}
    >
      <Seo
        title={text.title}
        description={text.body}
        robots="noindex, nofollow"
      />
      <Header />
      <main className="flex flex-1 items-center px-5 pb-20 pt-36">
        <div className="mx-auto w-full max-w-3xl text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
          <h1 className="mt-7 text-4xl font-black text-slate-950 sm:text-6xl">
            {text.heading}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            {text.body}
          </p>
          <div className="mx-auto mt-7 flex max-w-xl items-center justify-center gap-3 border-y border-slate-200 py-5 text-sm font-bold text-slate-700">
            <Mail className="h-5 w-5 text-primary" />
            {text.reminder}
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="rounded-md bg-primary text-white">
              <a href={`${base}/training/career`}>{text.home}</a>
            </Button>
            <Button asChild variant="outline" className="rounded-md bg-white">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackCampaignEvent("Contact", {
                    contact_method: "whatsapp",
                    locale: pageLocale,
                  })
                }
              >
                <MessageCircle className="me-2 h-5 w-5" />
                {text.question}
              </a>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

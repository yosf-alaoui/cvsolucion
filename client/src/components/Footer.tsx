import { useMemo } from "react";
import { Facebook, Instagram, Linkedin, Mail, MessageCircle } from "lucide-react";
import { buildWhatsAppLink, useI18n } from "@/i18n/i18n";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Footer Component - CV Solution
 * Footer with links and contact information
 * Design: Professional footer with organized sections
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { locale, t, content } = useI18n();
  const prefix = locale === "en" ? "" : `/${locale}`;
  const trainingHref = locale === "en" ? "/training" : `/${locale}/training`;
  const designPricingHref = locale === "en" ? "/design-pricing" : `/${locale}/design-pricing`;
  const servicesHref = `${prefix}/#services`;
  const aboutHref = `${prefix}/about`;
  const articlesHref = `${prefix}/articles`;
  const contactHref = `${prefix || "/"}#contact`;
  const aboutLabel = locale === "ar" ? "من نحن" : locale === "fr" ? "A propos" : "About";
  const articlesLabel = locale === "ar" ? "المقالات" : locale === "fr" ? "Articles" : "Articles";
  const contactLabel = locale === "ar" ? "تواصل" : locale === "fr" ? "Contact" : "Contact";

  const whatsappHref = useMemo(() => buildWhatsAppLink("+1 438 807 8747", t("whatsapp.general")), [t]);

  return (
    <footer className="bg-primary text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <h3 
              className="text-lg font-bold mb-4"
              style={{ fontFamily: 'Playfair Display' }}
            >
              {content.footer.aboutTitle}
            </h3>
            <p className="text-white/80 text-sm">{content.footer.aboutText}</p>
          </div>

          {/* Services Links */}
          <div>
            <h4 className="font-semibold mb-4">{t("footer.servicesTitle")}</h4>
            <ul className="space-y-2 text-sm text-white/80">
              {content.footer.servicesLinks.map((label: string, index: number) => (
                <li key={label}>
                  <a
                    href={index === 1 ? trainingHref : servicesHref}
                    className="hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions Links */}
          <div>
            <h4 className="font-semibold mb-4">{t("footer.solutionsTitle")}</h4>
            <ul className="space-y-2 text-sm text-white/80">
              {content.footer.solutionsLinks.map((label: string) => (
                <li key={label}>
                  <a href={servicesHref} className="hover:text-white transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Links */}
          <div>
            <h4 className="font-semibold mb-4">{t("footer.contactTitle")}</h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white transition-colors">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <a 
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  dir="ltr"
                  style={{ direction: "ltr", unicodeBidi: "isolate" }}
                >
                  +1 438 807 8747
                </a>
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-3 text-white/80">
              <a
                href="https://www.instagram.com/cvsolucion"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/cvsolucion/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/cvsolucion"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="hover:text-white transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://pinterest.com/cvsolucion/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
                className="hover:text-white transition-colors"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                >
                  <path d="M12 2a10 10 0 0 0-3.64 19.32c-.05-.82-.1-2.07.02-2.96l1.02-4.33s-.26-.52-.26-1.29c0-1.2.7-2.1 1.57-2.1.74 0 1.1.56 1.1 1.23 0 .75-.48 1.87-.72 2.9-.2.86.43 1.56 1.28 1.56 1.53 0 2.71-1.61 2.71-3.93 0-2.05-1.47-3.48-3.57-3.48-2.43 0-3.86 1.82-3.86 3.7 0 .74.28 1.52.64 1.95.07.08.08.15.06.24l-.24.96c-.04.16-.13.2-.3.12-1.12-.52-1.82-2.14-1.82-3.45 0-2.8 2.04-5.37 5.9-5.37 3.1 0 5.5 2.21 5.5 5.17 0 3.08-1.94 5.56-4.63 5.56-.9 0-1.75-.47-2.04-1.02l-.55 2.1c-.2.77-.76 1.73-1.12 2.32A10 10 0 1 0 12 2z" />
                </svg>
              </a>
              <a
                href="https://x.com/cvsolucion"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="hover:text-white transition-colors"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                >
                  <path d="M17.4 3h3.4l-7.4 8.46L22 21h-6.9l-5.4-6.52L4.2 21H.8l7.92-9.06L2 3h7l4.88 5.87L17.4 3zm-1.2 15.9h1.88L7.02 4.02H5.02l11.18 14.88z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 pt-8">
          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-white/70">
            <p>&copy; {currentYear} CV Solution. {t("footer.rights")}</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href={aboutHref} className="hover:text-white transition-colors">
                {aboutLabel}
              </a>
              <a href={articlesHref} className="hover:text-white transition-colors">
                {articlesLabel}
              </a>
              <a href={contactHref} className="hover:text-white transition-colors">
                {contactLabel}
              </a>
              <a href={designPricingHref} className="hover:text-white transition-colors">
                {t("footer.designPricing")}
              </a>
              <a href={`${prefix}/privacy`} className="hover:text-white transition-colors">
                {t("footer.privacy")}
              </a>
              <a href={`${prefix}/terms`} className="hover:text-white transition-colors">
                {t("footer.terms")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

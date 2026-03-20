export const LAST_UPDATED = "December 24, 2025";

const CONTACT_EMAIL = "contact@cvsolucion.com";
const WHATSAPP_NUMBER_DISPLAY = "+1 438 807 8747";
const WHATSAPP_LINK = "https://wa.me/14388078747";

export function PrivacyPolicyContent({ locale = "en" }: { locale?: "en" | "fr" }) {
  if (locale === "fr") {
    return (
      <div>
        <p>
          Cette politique de confidentialité explique comment CVsolucion (« CVsolucion », « nous », « notre »)
          collecte, utilise et protège vos informations personnelles lorsque vous visitez notre site,
          demandez du support ou nous contactez (email ou WhatsApp).
        </p>

        <p>
          <strong>Dernière mise à jour :</strong> {LAST_UPDATED}
        </p>

        <h4>1) Informations collectées</h4>
        <ul>
          <li>
            <strong>Contact :</strong> nom, email, téléphone/WhatsApp, nom d’entreprise (si fourni), et vos messages.
          </li>
          <li>
            <strong>Service :</strong> détails partagés sur votre configuration Cabinet Vision, bibliothèques, sorties CNC, et problèmes.
          </li>
          <li>
            <strong>Données techniques :</strong> infos de base appareil/navigateur (ex. type, pages visitées) via cookies et analytics.
          </li>
        </ul>

        <h4>2) Utilisation</h4>
        <ul>
          <li>Répondre à vos demandes et fournir les services demandés.</li>
          <li>Diagnostiquer les problèmes et proposer des solutions.</li>
          <li>Améliorer notre site, nos offres et la qualité du support.</li>
          <li>Communiquer avec vous (email/WhatsApp).</li>
        </ul>

        <h4>3) Cookies et analytics</h4>
        <p>Nous utilisons des cookies/analytics pour comprendre l’usage et améliorer l’expérience. Vous pouvez limiter via votre navigateur.</p>

        <h4>4) Partage</h4>
        <p>
          Nous ne vendons pas vos données. Nous partageons uniquement si nécessaire : (a) prestataires techniques (hébergement, analytics) ;
          (b) conformité légale ; (c) protection de nos droits.
        </p>

        <h4>5) Sécurité</h4>
        <p>Mesures raisonnables de protection, mais aucun système n’est 100% sûr.</p>

        <h4>6) Conservation</h4>
        <p>Durée nécessaire pour fournir le service, obligations légales ou résolution des litiges.</p>

        <h4>7) Vos droits</h4>
        <p>Vous pouvez demander accès, rectification ou suppression, selon la loi applicable.</p>

        <h4>8) Contact</h4>
        <p>
          Email : <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <br />
          WhatsApp : <a className="underline" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">{WHATSAPP_NUMBER_DISPLAY}</a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <p>
        This Privacy Policy explains how CVsolucion (“CVsolucion”, “we”, “us”) collects, uses, and protects personal information
        when you visit our website, request support, or contact us (including by email or WhatsApp).
      </p>

      <p><strong>Last updated:</strong> {LAST_UPDATED}</p>

      <h4>1) What we collect</h4>
      <ul>
        <li><strong>Contact:</strong> name, email, phone/WhatsApp, company name (if provided), and your messages.</li>
        <li><strong>Service:</strong> details about your Cabinet Vision setup, libraries, CNC outputs, and issues.</li>
        <li><strong>Technical data:</strong> basic device/browser info (e.g., type, pages visited) via cookies/analytics.</li>
      </ul>

      <h4>2) How we use information</h4>
      <ul>
        <li>Respond to your requests and provide requested support/services.</li>
        <li>Diagnose issues and propose solutions.</li>
        <li>Improve the website, offerings, and support quality.</li>
        <li>Communicate with you about your request (email/WhatsApp).</li>
      </ul>

      <h4>3) Cookies and analytics</h4>
      <p>We use cookies/analytics to understand usage and improve experience. You can limit cookies via browser settings.</p>

      <h4>4) Sharing</h4>
      <p>
        We do not sell your data. We may share limited data only when needed: (a) with technical providers (hosting, analytics);
        (b) to comply with law; (c) to protect our rights.
      </p>

      <h4>5) Security</h4>
      <p>We apply reasonable protections, but no system is 100% secure.</p>

      <h4>6) Retention</h4>
      <p>We keep data as long as needed for services, legal obligations, or dispute resolution.</p>

      <h4>7) Your rights</h4>
      <p>You may request access, correction, or deletion, subject to applicable law.</p>

      <h4>8) Contact</h4>
      <p>
        Email: <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <br />
        WhatsApp: <a className="underline" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">{WHATSAPP_NUMBER_DISPLAY}</a>
      </p>
    </div>
  );
}

export function TermsContent({ locale = "en" }: { locale?: "en" | "fr" }) {
  if (locale === "fr") {
    return (
      <div>
        <p>
          Les présentes conditions (« Conditions ») régissent l’accès et l’utilisation du site CVsolucion et la demande de services
          (conseil, formation, support Cabinet Vision). En utilisant le site ou en nous contactant, vous acceptez ces Conditions.
        </p>

        <p><strong>Dernière mise à jour :</strong> {LAST_UPDATED}</p>

        <h4>1) Services</h4>
        <p>Services de support/consulting Cabinet Vision, généralement à distance. Le périmètre dépend de ce qui est convenu.</p>

        <h4>2) Responsabilités client</h4>
        <ul>
          <li>Fournir des informations exactes et l’accès nécessaire (partage d’écran, fichiers, etc.).</li>
          <li>Faire des sauvegardes avant changements majeurs et suivre les recommandations de sécurité.</li>
          <li>Respecter les licences logicielles et les conditions du fournisseur Cabinet Vision.</li>
        </ul>

        <h4>3) Paiement</h4>
        <p>Tarifs/modalités (forfait, annuel…) communiqués avant intervention. Paiement dû selon accord.</p>

        <h4>4) Propriété intellectuelle</h4>
        <p>Méthodes, scripts, livrables restent propriété CVsolucion sauf accord écrit. Licence d’usage interne pour votre activité.</p>

        <h4>5) Confidentialité</h4>
        <p>Traitement confidentiel des informations/fichiers, usage uniquement pour fournir le service.</p>

        <h4>6) Limitation de responsabilité</h4>
        <p>Services fournis « tels quels ». Pas de garantie de résultats spécifiques. Responsabilité limitée aux montants payés.</p>

        <h4>7) Résiliation</h4>
        <p>Vous pouvez cesser d’utiliser le site à tout moment. Conditions d’annulation précisées à la commande.</p>

        <h4>8) Droit applicable</h4>
        <p>Conditions régies par les lois applicables selon votre juridiction et celle de CVsolucion, sous réserve des règles impératives.</p>

        <h4>9) Contact</h4>
        <p>
          Email : <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <br />
          WhatsApp : <a className="underline" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">{WHATSAPP_NUMBER_DISPLAY}</a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <p>
        These Terms of Service (“Terms”) govern access to and use of the CVsolucion website and requests for services
        (Cabinet Vision consulting, training, and support). By using the site or contacting us, you agree to these Terms.
      </p>

      <p><strong>Last updated:</strong> {LAST_UPDATED}</p>

      <h4>1) Services</h4>
      <p>Cabinet Vision support/consulting services, typically remote. Scope depends on what is agreed.</p>

      <h4>2) Client responsibilities</h4>
      <ul>
        <li>Provide accurate info and necessary access (screen share, files, etc.).</li>
        <li>Back up data before major changes and follow safety recommendations.</li>
        <li>Respect software licensing and Cabinet Vision vendor terms.</li>
      </ul>

      <h4>3) Payment</h4>
      <p>Pricing/terms (packages, annual plan, etc.) shared before work. Payment due per agreement.</p>

      <h4>4) Intellectual property</h4>
      <p>Methods, scripts, deliverables remain CVsolucion property unless agreed in writing. Internal-use license for your business.</p>

      <h4>5) Confidentiality</h4>
      <p>We treat your information/files as confidential and use them only to deliver the service.</p>

      <h4>6) Limitation of liability</h4>
      <p>Services are provided “as is”. No guaranteed specific results. Liability limited to amounts paid for the relevant service.</p>

      <h4>7) Termination</h4>
      <p>You may stop using the site at any time. Cancellation terms for services are defined at order time.</p>

      <h4>8) Governing law</h4>
      <p>These Terms follow applicable laws in your jurisdiction and ours, subject to mandatory rules.</p>

      <h4>9) Contact</h4>
      <p>
        Email: <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <br />
        WhatsApp: <a className="underline" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">{WHATSAPP_NUMBER_DISPLAY}</a>
      </p>
    </div>
  );
}

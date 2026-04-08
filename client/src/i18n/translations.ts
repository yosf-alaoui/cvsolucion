export type Locale = "en" | "fr" | "ar";

export type ProblemCard = { title: string; items: string[] };
export type ServiceCard = { title: string; description: string; included: string[] };
export type PackageCard = {
  title: string;
  subtitle: string;
  duration: string;
  price?: string;
  highlight?: boolean;
  bullets: string[];
};
export type BenefitCard = { title: string; description: string };
export type FaqItem = { question: string; answer: string };

export const translations: Record<Locale, any> = {
  en: {
    meta: {
      title: "Cabinet Vision Consulting, Training & Support | CVsolucion",
      description:
        "Cabinet Vision consulting, training, support, and optimization for cabinet shops: fix errors, speed up workflows, standardize libraries, and stabilize CNC output.",
    },
    nav: {
      services: "Services",
      training: "Training",
      designPricing: "Design & Pricing",
      packages: "Packages",
      faq: "FAQ",
      whatsapp: "WhatsApp",
      languageLabel: "Language",
      english: "English",
      french: "French",
      arabic: "Arabic",
      switchToArabic: "AR",
      switchToFrench: "FR",
      switchToEnglish: "EN",
    },
    auth: {
      title: "Sign in",
      subtitle: "Log in to view pricing. Email confirmation is required.",
      login: "Login",
      signup: "Sign up",
      magic: "Magic link",
      email: "Email",
      emailPlaceholder: "name@company.com",
      password: "Password",
      passwordPlaceholder: "Your password",
      submit: "Continue",
      working: "Working...",
      loggedIn: "Logged in. If prices are still hidden, confirm your email first.",
      checkEmail: "Check your inbox to confirm your email, then log in.",
      magicDisabled: "Magic link sign-in has been removed. Use your password or reset it if needed.",
      unverifiedLogin: "Confirm your email first. Sign-in is blocked until your email is verified.",
      missingConfig: "Supabase is not configured.",
      genericError: "Something went wrong. Please try again.",
      invalidInbox: "This email address cannot receive messages. Check the spelling or use a different inbox.",
      emailDeliveryIssue: "We couldn't send the email right now. Please try again in a moment.",
      note: "Prices appear after login and email confirmation.",
      signIn: "Sign in",
      signUp: "Sign up",
      signInUp: "Sign in / up",
      account: "Account",
      signOut: "Sign out",
      showPassword: "Show",
      hidePassword: "Hide",
      forgotPassword: "Forgot password?",
      resetSent: "Password reset email sent.",
      resetMissingEmail: "Enter your email to reset password.",
      newPassword: "New password",
      newPasswordPlaceholder: "Enter a new password",
      confirmPassword: "Confirm password",
      confirmPasswordPlaceholder: "Re-enter password",
      savePassword: "Save password",
      resetSuccess: "Password updated. You can sign in.",
      passwordMismatch: "Passwords do not match.",
      sessionMissing: "Reset link expired. Please request a new one.",
    },
    whatsapp: {
      general: "Hello CVsolucion",
      needHelp: "Hello CVsolucion, I need help with Cabinet Vision.",
      annualPlan: "Hello CVsolucion, I'm interested in the Annual Support Plan.",
    },
    hero: {
      title: "Cabinet Vision\nSetup, Support & Training",
      subtitle:
        "Expert Cabinet Vision consulting, training, and support to fix errors, optimize performance, and standardize libraries and CNC output.",
      statsLabel: "Successful Cabinet Vision Optimizations",
      ctaWhatsapp: "Get Started on WhatsApp",
      scroll: "Scroll to explore",
    },
    problems: {
      title: "Common Cabinet Vision Problems We Solve",
      subtitle:
        "Cabinet Vision issues cost time and production. We solve the most common problems quickly and safely.",
      cards: [
        {
          title: "Performance Issues",
          items: [
            "Freezes when changing materials",
            "Unexpected crashes",
            "Slow rendering on large files",
            "CxADODatabase errors",
            "Performance degradation over time",
          ],
        },
        {
          title: "Libraries & Components",
          items: [
            "Custom library setup challenges",
            "Hardware library missing or incomplete",
            "Material library configuration issues",
            "Parts not appearing in the library",
            "Library compatibility problems",
          ],
        },
        {
          title: "Assembly & Production",
          items: [
            "Custom assembly method creation",
            "Breakout and cut list errors",
            "Dimension shrinkage issues",
            "Assembly optimization challenges",
            "Production workflow inefficiencies",
          ],
        },
        {
          title: "CNC & Output",
          items: [
            "CNC integration and setup",
            "DXF export errors",
            "Screen to Machine (S2M) failures",
            "Shop drawing generation issues",
            "Nesting and layout problems",
          ],
        },
        {
          title: "Reports & Data",
          items: [
            "UCS (User Created Standards) issues",
            "Report generation and customization",
            "Material schedule problems",
            "Bill of Materials (BOM) errors",
            "Workgroup file errors",
          ],
        },
      ] as ProblemCard[],
    },
    services: {
      title: "Cabinet Vision Services",
      subtitle:
        "Specialized Cabinet Vision consulting, training, and support designed for real production environments.",
      includedLabel: "Included",
      cards: [
        {
          title: "Cabinet Vision Consulting",
          description:
            "Fast diagnosis and a clear action plan to stabilize, speed up, and standardize your workflow.",
          included: [
            "Workflow audit (libraries, settings, outputs)",
            "Priority action plan with quick wins",
            "Remote implementation session",
            "Notes and next steps for your team",
          ],
        },
        {
          title: "Remote Support",
          description:
            "On-call troubleshooting for urgent issues and daily blockers with safe, reliable fixes.",
          included: [
            "Fast diagnosis of Cabinet Vision errors and crashes",
            "Output and CNC troubleshooting",
            "Library and material quick fixes",
            "Backup/rollback-safe changes",
          ],
        },
        {
          title: "Install + Backup/Restore (Safe Migration)",
          description:
            "Clean installation, full backup, and safe migration with minimal downtime.",
          included: [
            "Pre-check: version, prerequisites, permissions, storage",
            "Full backup before any change",
            "Safe restore or migration to a new PC",
            "Staged transfer and verification",
            "Post-restore validation (paths, licenses, shares)",
            "Rollback plan if anything breaks",
          ],
        },
        {
          title: "Performance Optimization",
          description:
            "Remove bottlenecks, fix configuration issues, and tune libraries for real shop speed.",
          included: [
            "Speed audit (startup, search, rendering, output)",
            "Cleanup of heavy catalogs and broken links",
            "Workgroup tuning (paths, cache, permissions)",
            "Template/report optimization for faster runs",
          ],
        },
        {
          title: "Custom UCS & Reports",
          description:
            "Automation and outputs aligned to your factory: rules, naming, cutlists, and more.",
          included: [
            "Custom logic (naming, labels, rules)",
            "Report templates aligned to your workflow",
            "Data consistency checks",
            "Versioned delivery for safe rollout",
          ],
        },
        {
          title: "CNC Setup & Troubleshooting",
          description:
            "Post setup, output debugging, and stable manufacturing files with repeatable results.",
          included: [
            "Post-processor validation (units, coordinates, tools)",
            "Fix common CNC output errors",
            "Test runs with safe sample parts",
            "Documentation for operators and engineers",
          ],
        },
        {
          title: "Library & Hardware Setup",
          description:
            "Build or clean libraries: materials, doors, drawers, fittings, and hardware.",
          included: [
            "Create/clean catalogs (materials, doors, hardware)",
            "Fix broken links and duplicates",
            "Standards for naming and folder structure",
            "Team-safe workflow for adding new items",
          ],
        },
      ] as ServiceCard[],
    },
    packages: {
      title: "Service Packages",
      subtitle: "Choose based on urgency and depth, then open the booking flow with the right service already selected.",
      cta: "Book a session",
      priceHidden: "Log in to see price",
      note:
        "Annual Support Plan is billed yearly (pricing shared on request). Audit and Fix Day are fixed-price.",
      cards: [
        {
          title: "Annual Support Plan",
          subtitle: "Priority support + continuous optimization",
          duration: "Billed yearly (no monthly billing)",
          highlight: true,
          bullets: [
            "Priority WhatsApp support",
            "Monthly system and workflow check",
            "Library, material, and hardware updates",
            "CNC output troubleshooting when needed",
            "Performance monitoring and recommendations",
          ],
        },
        {
          title: "Audit",
          subtitle: "Fast clarity in one session",
          price: "$299",
          duration: "90 minutes",
          highlight: false,
          bullets: [
            "System and workflow review",
            "Root-cause identification",
            "Priority fix plan",
            "Quick wins implemented",
            "Clear next steps for your team",
          ],
        },
        {
          title: "Fix Day",
          subtitle: "Hands-on fixes and setup",
          price: "$899",
          duration: "Full day (remote)",
          highlight: false,
          bullets: [
            "Error diagnosis and resolution",
            "Library and material setup",
            "Hardware and path configuration",
            "CNC and output fixes",
            "Stability checks and backup guidance",
          ],
        },
      ] as PackageCard[],
    },
    benefits: {
      title: "Why Choose CVsolucion?",
      subtitle: "Expert Cabinet Vision knowledge, proven results, and dedicated support",
      cards: [
        {
          title: "Expert Knowledge",
          description: "Deep Cabinet Vision expertise with years of real shop experience",
        },
        {
          title: "Proven Results",
          description: "Documented success fixing complex Cabinet Vision issues",
        },
        {
          title: "Transparent Pricing",
          description: "Clear pricing with no hidden fees or surprises",
        },
        {
          title: "Dedicated Support",
          description: "Responsive support focused on keeping production running",
        },
        {
          title: "Smart Solutions",
          description: "Practical workflows designed for real factories",
        },
        {
          title: "Continuous Improvement",
          description: "Ongoing optimization to maximize your investment",
        },
      ] as BenefitCard[],
    },
    faq: {
      title: "Frequently Asked Questions",
      subtitle: "Quick answers before we jump into your setup.",
      items: [
        {
          question: "What Cabinet Vision versions do you support?",
          answer:
            "We support all modern Cabinet Vision versions used in production. We confirm your version during the first session and recommend the safest upgrade path if needed.",
        },
        {
          question: "What is included in the Annual Support Plan?",
          answer:
            "Priority support plus continuous optimization: monthly checkups, library and hardware updates, CNC output troubleshooting when needed, and performance recommendations.",
        },
        {
          question: "How fast do you respond?",
          answer:
            "Response time depends on the queue and issue severity. Annual Support Plan clients receive priority. Most standard issues are handled within 24–48 hours.",
        },
        {
          question: "Do you offer remote or on-site support?",
          answer:
            "Yes. Most work is done remotely via secure screen sharing. On-site consulting can be arranged based on location and scheduling.",
        },
        {
          question: "Do you help with CNC integration and post processors?",
          answer:
            "Yes. We troubleshoot CNC output, post processors, tooling, coordinates, and safe test parts. We validate changes to avoid production interruptions.",
        },
        {
          question: "Can you install Cabinet Vision and handle backup/restore safely?",
          answer:
            "Yes. We install and configure Cabinet Vision, create full backups before changes, and restore/migrate your setup with verification steps to prevent corruption or downtime.",
        },
      ] as FaqItem[],
    },
    cta: {
      title: "Ready for Annual Support That Keeps Production Running?",
      subtitle:
        "Get priority support and continuous optimization with the Annual Support Plan built for factories that can’t afford downtime.",
      whatsapp: "Contact on WhatsApp",
      email: "Email Us",
    },
    footer: {
      aboutTitle: "CVsolucion",
      aboutText:
        "Professional Cabinet Vision consulting, training, and support. We help you stabilize, standardize, and speed up production workflows.",
      servicesTitle: "Services",
      servicesLinks: ["Consulting", "Training", "Support"],
      solutionsTitle: "Solutions",
      solutionsLinks: [
        "Custom Programming",
        "Error Troubleshooting",
        "Install + Backup/Restore",
        "Library Setup",
        "CNC Integration",
        "Performance Optimization",
      ],
      contactTitle: "Contact",
      emailLabel: "Email",
      whatsappLabel: "WhatsApp",
      legalTitle: "Legal",
      designPricing: "Design & Pricing",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      rights: "All rights reserved.",
    },
    legal: {
      lastUpdatedLabel: "Last updated",
      disclaimer:
        "This content is a general template for a small service business website and is not legal advice.",
    },
    trainingPage: {
      title: "Cabinet Vision Training",
      subtitle:
        "Practical, production-focused training to design faster, avoid errors, and automate your workflow.",
      ctaButton: "Contact on WhatsApp",
      backHome: "Back to home",
      deliveryModes: ["Live video", "Screen sharing", "Q&A", "1:1", "Group", "Company team"],
      tracksTitle: "Training tracks",
      tracks: [
        {
          title: "Design & Production Workflow",
          bullets: [
            "Standards, templates, and clean deliverables",
            "Better drawings with fewer production errors",
            "Real shop-focused practices",
          ],
        },
        {
          title: "Libraries & Configuration",
          bullets: [
            "Materials, hardware, assemblies",
            "Database structure and best practices",
            "Troubleshooting and optimization",
          ],
        },
        {
          title: "UCS & Automation",
          bullets: [
            "Rules, conditions, and automation logic",
            "Connectors and production constraints",
            "Scalable workflows for teams",
          ],
        },
      ],
      goalLabel: "Goal",
      skillsLabel: "Skills you gain",
      deliverableLabel: "Deliverable",
      showMore: "Show details",
      showLess: "Hide details",
      packagesTitle: "Training packages",
      packagesSubtitle: "Live video, screen sharing, and Q&A. Available 1:1, group, or company team.",
      packageCta: "Contact on WhatsApp",
      packages: [
        {
          title: "Beginner (Foundations)",
          subtitle: "Core workflow + clean modeling habits",
          summary: "Go from first login to confidently building a clean job.",
          duration: "Live 1:1, group, or company team",
          highlight: false,
          preview: ["Clean job setup", "Correct cabinet placement", "Basic outputs and validation"],
          whatsappMessage: "Hello CVsolucion, I want the Beginner training package.",
          goal: "Go from first login to confidently building a clean job.",
          skills: [
            "Understand the Cabinet Vision hierarchy and why it affects editing, reports, and manufacturing.",
            "Create and manage jobs/rooms, set up project basics, and avoid common setup mistakes.",
            "Place and edit cabinets correctly (dimensions, basic construction choices, consistent organization).",
            "Generate and read basic reports/outputs to validate the design.",
          ],
          deliverable:
            "A complete room + cabinets sample project built cleanly and ready to move into production-focused setup.",
        },
        {
          title: "Intermediate (Production Workflow + Outputs)",
          subtitle: "Reports, labels, and production readiness",
          summary: "Make your work repeatable, faster, and production-ready.",
          duration: "Live 1:1, group, or company team",
          highlight: true,
          preview: ["Setup Reports groups", "Label configuration", "Production handoff standards"],
          whatsappMessage: "Hello CVsolucion, I want the Intermediate training package.",
          goal: "Make your work repeatable, faster, and production-ready.",
          skills: [
            "Use Assembly Wizard and construction methods more effectively to standardize cabinet builds.",
            "Set up and organize reports using Setup Reports (groups and consistent runs).",
            "Configure labels (part labels, fields/variables, practical label workflows).",
            "Improve job handoff to production with consistent naming and standards.",
          ],
          deliverable:
            "A production-ready output package (reports + labels) that matches your shop or team needs.",
        },
        {
          title: "Professional / Advanced (Automation + Manufacturing)",
          subtitle: "UCS + S2M/xMachining + automation depth",
          summary: "Reduce manual work and build a smarter system for teams or companies.",
          duration: "Live 1:1, group, or company team",
          highlight: false,
          preview: ["UCS + JavaScript UCS", "S2M/xMachining workflow", "Automation rules for teams"],
          whatsappMessage: "Hello CVsolucion, I want the Professional/Advanced training package.",
          goal: "Reduce manual work and build a smarter system for teams or companies.",
          skills: [
            "Understand and implement UCS: where they live, how they run, and how they control behavior.",
            "Use JavaScript UCS (when available) to automate decisions and extend logic.",
            "Work confidently with S2M Center / xMachining to improve manufacturing readiness.",
            "Build rules-based behavior for consistency across projects and people.",
          ],
          deliverable:
            "A streamlined workflow that produces consistent outputs and reduces repetitive work.",
        },
      ],
      formatTitle: "Format",
      formatBullets: [
        "Live remote sessions (screen share)",
        "Exercises, files, and checklists",
        "Support via chat/WhatsApp",
      ],
      ctaTitle: "Start now",
      ctaText: "Tell us your current setup and goals. We'll suggest the best training plan.",
    },
    designPricingPage: {
      badge: "Factory-ready service",
      remote: "Remote delivery",
      factoryReady: "Aligned with your workflow",
      title: "Design & Project Pricing for Manufacturing",
      subtitle:
        "Technical design and accurate estimating for kitchens, cabinets, bathrooms, bedrooms, beds, and custom furniture with production-ready files.",
      cta: "Contact on WhatsApp",
      note: "We deliver files matched to your factory system.",
      scopeTitle: "Project scope",
      scopeSubtitle:
        "We handle full residential and commercial woodworking projects with a focus on manufacturability.",
      scopeItems: [
        "Complete kitchens and modules",
        "Cabinets, wardrobes, and storage systems",
        "Bathroom vanities and wall units",
        "Bedrooms, beds, and custom storage",
        "Reception desks and office furniture",
        "Custom pieces and special requests",
      ],
      designTitle: "Production-ready design",
      pricingTitle: "Technical pricing",
      designIncludes: [
        "Optimized layouts based on site constraints",
        "Final dimensions aligned with cutting and machining",
        "Material and finish selection aligned to production",
        "Construction details: edges, joinery, hardware",
        "Clean unit organization to reduce shop errors",
        "Standards for naming, grouping, and structure",
        "Hardware positioning and accessory clearance",
        "Revision control for smooth approvals",
      ],
      pricingIncludes: [
        "Detailed material takeoff (panels, finishes, consumables)",
        "Hardware and accessories based on your catalogs",
        "Waste factor and sheet yield calculations",
        "Cost estimation for material + production + assembly",
        "Pricing per unit or full project, based on your method",
        "Optional breakdown by room or zone",
        "Highlight of high-cost items and drivers",
        "Clear totals ready for client proposals",
      ],
      detailsTitle: "Files and reports you receive",
      deliverablesTitle: "Deliverables",
      deliverables: [
        "Complete project files ready for production",
        "BOM reports per unit and total project",
        "Material consumption and cutting reports",
        "Assembly and installation notes (when required)",
        "Export formats aligned with your shop workflow",
        "Documentation for revisions and approvals",
        "Structured folders and naming conventions",
        "Optional CNC-ready outputs if required",
      ],
      compatibilityTitle: "Factory compatibility",
      compatibility: [
        "Aligned to your libraries, standards, and templates",
        "Naming and folder structure matched to your system",
        "Outputs adapted for your machines and processes",
        "Reports organized for production and purchasing",
        "Consistent structure for multi-user teams",
        "Clean files ready for immediate release",
      ],
      accuracyTitle: "Accuracy and control",
      accuracy: [
        "Reliable pricing with fewer surprises",
        "Reduced waste and better sheet utilization",
        "Less rework through clean technical details",
        "Clear visibility of quantities and costs",
        "Faster approval cycles and production prep",
        "Standardized output for repeatable quality",
      ],
      whoForTitle: "Who this is for",
      whoFor: [
        "Factories that need precise estimating",
        "Shops that require production-ready files",
        "Teams seeking consistency across projects",
        "Operations with CNC or manual production",
        "Businesses that want better cost control",
      ],
      requirementsTitle: "What we need from you",
      requirements: [
        "Site dimensions or architectural drawings",
        "Material and finish preferences",
        "Hardware catalogs or chosen brands",
        "Pricing method (per unit or total project)",
        "Any factory standards or naming rules",
        "Special constraints or production notes",
      ],
      workflowTitle: "How the process works",
      stepLabel: "Step",
      workflow: [
        "Collect drawings, measurements, and requirements",
        "Build a production-ready design model",
        "Generate technical pricing and reports",
        "Review and adjust to match your standards",
        "Deliver final files ready for production",
      ],
      finalTitle: "Factory-ready delivery with full costing",
      finalSubtitle:
        "Receive clean files, reliable pricing, and organized reports that let your team manufacture faster with fewer errors.",
      deliveryNote: "Deliverables aligned with your factory system.",
    },
  },
  fr: {
    meta: {
      title: "Conseil, formation et support Cabinet Vision | CVsolucion",
      description:
        "Conseil, formation, support et optimisation Cabinet Vision pour ateliers: correction des erreurs, accélération des workflows, standardisation des bibliothèques et sorties CNC stables.",
    },
    nav: {
      services: "Services",
      training: "Formation",
      designPricing: "Design & chiffrage",
      packages: "Forfaits",
      faq: "FAQ",
      whatsapp: "WhatsApp",
      languageLabel: "Langue",
      english: "Anglais",
      french: "Français",
      arabic: "Arabe",
      switchToArabic: "AR",
      switchToFrench: "FR",
      switchToEnglish: "EN",
    },
    auth: {
      title: "Connexion",
      subtitle: "Connectez-vous pour voir les prix. La confirmation email est requise.",
      login: "Se connecter",
      signup: "S'inscrire",
      magic: "Lien magique",
      email: "Email",
      emailPlaceholder: "nom@entreprise.com",
      password: "Mot de passe",
      passwordPlaceholder: "Votre mot de passe",
      submit: "Continuer",
      working: "Chargement...",
      loggedIn: "Connecté. Si les prix restent masqués, confirmez votre email.",
      checkEmail: "Vérifiez votre email pour confirmer, puis reconnectez-vous.",
      magicDisabled: "La connexion par lien magique a été supprimée. Utilisez votre mot de passe ou réinitialisez-le si nécessaire.",
      unverifiedLogin: "Confirmez d'abord votre email. La connexion reste bloquée tant que l'email n'est pas vérifié.",
      missingConfig: "Supabase n'est pas configuré.",
      genericError: "Une erreur est survenue. Réessayez.",
      invalidInbox: "Cette adresse email ne peut pas recevoir de messages. Verifiez l'adresse ou utilisez une autre boite.",
      emailDeliveryIssue: "Impossible d'envoyer l'email pour le moment. Reessayez dans un instant.",
      note: "Les prix apparaissent après connexion et confirmation email.",
      signIn: "Se connecter",
      signUp: "S'inscrire",
      signInUp: "Connexion / inscription",
      account: "Compte",
      signOut: "Se déconnecter",
      showPassword: "Afficher",
      hidePassword: "Masquer",
      forgotPassword: "Mot de passe oublié ?",
      resetSent: "Email de réinitialisation envoyé.",
      resetMissingEmail: "Entrez votre email pour réinitialiser.",
      newPassword: "Nouveau mot de passe",
      newPasswordPlaceholder: "Saisissez un nouveau mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      confirmPasswordPlaceholder: "Confirmez le mot de passe",
      savePassword: "Enregistrer le mot de passe",
      resetSuccess: "Mot de passe mis à jour. Vous pouvez vous connecter.",
      passwordMismatch: "Les mots de passe ne correspondent pas.",
      sessionMissing: "Le lien de réinitialisation a expiré. Demandez-en un nouveau.",
    },
    whatsapp: {
      general: "Bonjour CVsolucion",
      needHelp: "Bonjour CVsolucion, j'ai besoin d'aide avec Cabinet Vision.",
      annualPlan: "Bonjour CVsolucion, je suis intéressé par le Plan de Support Annuel.",
    },
    hero: {
      title: "Cabinet Vision\nConfiguration, support et formation",
      subtitle:
        "Conseil, formation et support Cabinet Vision pour corriger les erreurs, optimiser les performances et standardiser les sorties CNC.",
      statsLabel: "Optimisations Cabinet Vision réussies",
      ctaWhatsapp: "Démarrer sur WhatsApp",
      scroll: "Faites défiler",
    },
    problems: {
      title: "Problèmes Cabinet Vision courants que nous résolvons",
      subtitle:
        "Les problèmes Cabinet Vision ralentissent la production. Nous les corrigeons rapidement et proprement.",
      cards: [
        {
          title: "Performances",
          items: [
            "Blocage lors du changement de matériaux",
            "Crashs inattendus",
            "Rendu lent sur les gros fichiers",
            "Erreurs CxADODatabase",
            "Dégradation des performances avec le temps",
          ],
        },
        {
          title: "Bibliothèques & composants",
          items: [
            "Configuration des bibliothèques",
            "Quincaillerie manquante ou incomplète",
            "Problèmes de bibliothèque de matériaux",
            "Pièces absentes dans la bibliothèque",
            "Incompatibilités de versions",
          ],
        },
        {
          title: "Assemblage & production",
          items: [
            "Création de méthodes d'assemblage",
            "Erreurs de Breakout et de liste de coupe",
            "Problèmes de shrink",
            "Optimisation des assemblages",
            "Inefficacités du flux de production",
          ],
        },
        {
          title: "CNC & sorties",
          items: [
            "Intégration et configuration CNC",
            "Erreurs d'export DXF",
            "Échecs Screen to Machine (S2M)",
            "Problèmes de plans atelier",
            "Problèmes de nesting et layout",
          ],
        },
        {
          title: "Rapports & données",
          items: [
            "Problèmes UCS (User Created Standards)",
            "Génération et personnalisation de rapports",
            "Problèmes de nomenclature matériaux",
            "Erreurs BOM (Bill of Materials)",
            "Erreurs de fichiers Workgroup",
          ],
        },
      ] as ProblemCard[],
    },
    services: {
      title: "Services Cabinet Vision",
      subtitle:
        "Des services Cabinet Vision adaptés à la réalité atelier: conseil, formation, support et optimisation.",
      includedLabel: "Inclus",
      cards: [
        {
          title: "Conseil Cabinet Vision",
          description:
            "Diagnostic rapide et plan d'action clair pour stabiliser et accélérer votre workflow.",
          included: [
            "Audit workflow (bibliothèques, réglages, sorties)",
            "Plan d'action priorisé avec quick wins",
            "Session à distance pour appliquer les correctifs",
            "Notes et prochaines étapes pour l'équipe",
          ],
        },
        {
          title: "Support à distance",
          description:
            "Dépannage rapide des blocages urgents avec des modifications propres et sécurisées.",
          included: [
            "Diagnostic rapide des erreurs et crashs",
            "Dépannage sorties et CNC",
            "Corrections rapides bibliothèques et matériaux",
            "Modifications safe (backup/rollback)",
          ],
        },
        {
          title: "Installation + backup/restauration",
          description:
            "Installation propre, backup complet et migration sécurisée avec vérification.",
          included: [
            "Pre-check: version, prérequis, droits, stockage",
            "Backup complet avant toute modification",
            "Restauration/migration vers nouveau PC",
            "Transfert par étapes + vérification",
            "Validation post-restauration",
            "Plan de retour arrière",
          ],
        },
        {
          title: "Optimisation des performances",
          description:
            "Suppression des goulots d'étranglement et optimisation des bibliothèques.",
          included: [
            "Audit vitesse (démarrage, recherche, rendu, sorties)",
            "Nettoyage des catalogues lourds",
            "Optimisation workgroup (chemins, cache, permissions)",
            "Optimisation des templates/rapports",
          ],
        },
        {
          title: "UCS & rapports sur mesure",
          description:
            "Automatisations et sorties alignées sur votre production.",
          included: [
            "Logique personnalisée (naming, étiquettes, règles)",
            "Templates de rapports adaptés",
            "Contrôles de cohérence des données",
            "Livraison versionnée",
          ],
        },
        {
          title: "Configuration CNC & dépannage",
          description:
            "Posts, sorties CNC et fichiers de fabrication stables et répétables.",
          included: [
            "Validation post-processeur (unités, coordonnées, outils)",
            "Correction des erreurs CNC courantes",
            "Tests avec pièces d'exemple",
            "Documentation pour opérateurs",
          ],
        },
        {
          title: "Bibliothèques & quincaillerie",
          description:
            "Création ou nettoyage des bibliothèques matériaux, portes, tiroirs, quincaillerie.",
          included: [
            "Création/nettoyage catalogues",
            "Correction des liens cassés",
            "Standards de nommage",
            "Workflow sécurisé pour l'équipe",
          ],
        },
      ] as ServiceCard[],
    },
    packages: {
      title: "Forfaits",
      subtitle:
        "Choisissez selon l'urgence et la profondeur, puis ouvrez directement le booking avec le bon service déjà sélectionné.",
      cta: "Réserver une session",
      priceHidden: "Connectez-vous pour voir le prix",
      note:
        "Le Plan de Support Annuel est facturé à l'année (tarif sur demande). Audit et Fix Day sont à prix fixe.",
      cards: [
        {
          title: "Plan de Support Annuel",
          subtitle: "Support prioritaire + optimisation continue",
          duration: "Facturation annuelle (pas de mensuel)",
          highlight: true,
          bullets: [
            "Support WhatsApp prioritaire",
            "Contrôle mensuel système & workflow",
            "Mises à jour bibliothèques / matériaux",
            "Dépannage CNC si nécessaire",
            "Suivi performance + recommandations",
          ],
        },
        {
          title: "Audit",
          subtitle: "Clarté rapide en une session",
          price: "299 $",
          duration: "90 minutes",
          highlight: false,
          bullets: [
            "Revue système + workflow",
            "Identification des causes racines",
            "Plan de correction priorisé",
            "Quick wins appliqués",
            "Étapes suivantes claires",
          ],
        },
        {
          title: "Fix Day",
          subtitle: "Corrections & mise en place",
          price: "899 $",
          duration: "Journée complète (à distance)",
          highlight: false,
          bullets: [
            "Diagnostic et résolution d'erreurs",
            "Mise en place bibliothèques",
            "Configuration quincaillerie + chemins",
            "Correctifs CNC / sorties",
            "Contrôles de stabilité + backup",
          ],
        },
      ] as PackageCard[],
    },
    benefits: {
      title: "Pourquoi choisir CVsolucion ?",
      subtitle: "Expertise Cabinet Vision, résultats prouvés et support réactif",
      cards: [
        {
          title: "Expertise",
          description: "Années d'expérience Cabinet Vision en atelier",
        },
        {
          title: "Résultats prouvés",
          description: "Succès documenté sur des problèmes complexes",
        },
        {
          title: "Tarification transparente",
          description: "Tarifs clairs, sans surprises",
        },
        {
          title: "Support dédié",
          description: "Support réactif pour garder la production active",
        },
        {
          title: "Solutions intelligentes",
          description: "Workflows pratiques adaptés à l'atelier",
        },
        {
          title: "Amélioration continue",
          description: "Optimisations régulières pour maximiser l'investissement",
        },
      ] as BenefitCard[],
    },
    faq: {
      title: "Questions fréquentes",
      subtitle: "Réponses rapides avant d'entrer dans votre configuration.",
      items: [
        {
          question: "Quelles versions Cabinet Vision supportez-vous ?",
          answer:
            "Nous supportons toutes les versions modernes en production. Nous confirmons votre version lors de la première session.",
        },
        {
          question: "Que contient le Plan de Support Annuel ?",
          answer:
            "Support prioritaire et optimisation continue: contrôles mensuels, mises à jour, dépannage CNC et recommandations de performance.",
        },
        {
          question: "Quel est votre délai de réponse ?",
          answer:
            "Selon la file et la gravité. Les clients du plan annuel sont prioritaires. La plupart des demandes standard sont traitées sous 24 à 48 heures.",
        },
        {
          question: "Faites-vous du support à distance ou sur site ?",
          answer:
            "Oui. La majorité du travail est à distance via partage d'écran. Le support sur site est possible selon la localisation.",
        },
        {
          question: "Aidez-vous pour l'intégration CNC et les post-processeurs ?",
          answer:
            "Oui. Nous dépannons les sorties CNC, post-processeurs, outillage et coordonnées avec tests sécurisés.",
        },
        {
          question: "Pouvez-vous installer Cabinet Vision et gérer backup/restauration ?",
          answer:
            "Oui. Installation, backups complets et restauration/migration avec vérification pour éviter toute corruption.",
        },
      ] as FaqItem[],
    },
    cta: {
      title: "Prêt pour un support annuel qui maintient la production ?",
      subtitle:
        "Support prioritaire et optimisation continue avec un plan adapté aux ateliers qui ne peuvent pas s'arrêter.",
      whatsapp: "Contacter sur WhatsApp",
      email: "Nous écrire",
    },
    footer: {
      aboutTitle: "CVsolucion",
      aboutText:
        "Conseil, formation et support Cabinet Vision. Nous stabilisons, standardisons et accélérons vos workflows.",
      servicesTitle: "Services",
      servicesLinks: ["Conseil", "Formation", "Support"],
      solutionsTitle: "Solutions",
      solutionsLinks: [
        "Programmation sur mesure",
        "Dépannage d'erreurs",
        "Installation + backup/restauration",
        "Mise en place bibliothèques",
        "Intégration CNC",
        "Optimisation performances",
      ],
      contactTitle: "Contact",
      emailLabel: "Email",
      whatsappLabel: "WhatsApp",
      legalTitle: "Légal",
      designPricing: "Design & chiffrage",
      privacy: "Politique de confidentialité",
      terms: "Conditions d'utilisation",
      rights: "Tous droits réservés.",
    },
    legal: {
      lastUpdatedLabel: "Dernière mise à jour",
      disclaimer:
        "Ce contenu est un modèle général pour un site de services et ne constitue pas un avis juridique.",
    },
    trainingPage: {
      title: "Formation Cabinet Vision",
      subtitle:
        "Formation pratique orientée production pour concevoir plus vite, réduire les erreurs et automatiser le workflow.",
      ctaButton: "Contacter sur WhatsApp",
      backHome: "Retour à l'accueil",
      deliveryModes: ["Vidéo en direct", "Partage d'écran", "Questions/Réponses", "1:1", "Groupe", "Équipe entreprise"],
      packagesTitle: "Formules de formation",
      packagesSubtitle: "Vidéo en direct, partage d'écran et Q&A. Disponible en 1:1, groupe ou équipe entreprise.",
      goalLabel: "Objectif",
      skillsLabel: "Compétences acquises",
      deliverableLabel: "Livrable",
      showMore: "Afficher les détails",
      showLess: "Masquer les détails",
      packageCta: "Contacter sur WhatsApp",
      packages: [
        {
          title: "Débutant (Fondations)",
          subtitle: "Workflow de base + modélisation propre",
          summary: "Passer du premier login à un projet propre et fiable.",
          duration: "En direct 1:1, groupe ou équipe entreprise",
          highlight: false,
          preview: ["Mise en place propre", "Placement correct des caissons", "Sorties de base et validation"],
          whatsappMessage: "Bonjour CVsolucion, je veux la formule Débutant.",
          goal: "Passer du premier login à la création d’un projet propre et cohérent.",
          skills: [
            "Comprendre la hiérarchie Cabinet Vision et son impact sur l’édition, les rapports et la fabrication.",
            "Créer et gérer des Jobs/Rooms, poser les bases et éviter les erreurs courantes.",
            "Placer et modifier correctement les caissons (dimensions, constructions de base, organisation).",
            "Générer et lire des rapports/sorties de base pour valider le design.",
          ],
          deliverable: "Un projet complet Room + Cabinets propre et prêt pour la mise en production.",
        },
        {
          title: "Intermédiaire (Workflow production + sorties)",
          subtitle: "Rapports, étiquettes, préparation production",
          summary: "Rendre le travail répétable, plus rapide et prêt production.",
          duration: "En direct 1:1, groupe ou équipe entreprise",
          highlight: true,
          preview: ["Groupes Setup Reports", "Configuration des étiquettes", "Standards de passage atelier"],
          whatsappMessage: "Bonjour CVsolucion, je veux la formule Intermédiaire.",
          goal: "Standardiser le workflow et fiabiliser les sorties production.",
          skills: [
            "Utiliser Assembly Wizard et méthodes de construction pour standardiser.",
            "Configurer Setup Reports (groupes, exécutions cohérentes).",
            "Mettre en place les étiquettes (champs/variables, workflow).",
            "Améliorer la transmission atelier via des standards de nommage.",
          ],
          deliverable: "Pack de sortie production (rapports + étiquettes) aligné à votre atelier.",
        },
        {
          title: "Professionnel / Avancé (Automatisation + Fabrication)",
          subtitle: "UCS + S2M/xMachining + automatisation",
          summary: "Réduire le manuel et construire un système plus intelligent.",
          duration: "En direct 1:1, groupe ou équipe entreprise",
          highlight: false,
          preview: ["UCS + JavaScript UCS", "Workflow S2M/xMachining", "Règles d’automatisation d’équipe"],
          whatsappMessage: "Bonjour CVsolucion, je veux la formule Avancée.",
          goal: "Réduire les tâches manuelles et améliorer la préparation fabrication.",
          skills: [
            "Comprendre et implémenter les UCS (emplacement, exécution, comportement).",
            "Utiliser JavaScript UCS (si disponible) pour automatiser les décisions.",
            "Maîtriser S2M Center / xMachining pour la préparation fabrication.",
            "Mettre en place des règles pour cohérence multi-projets/équipes.",
          ],
          deliverable: "Workflow optimisé avec sorties cohérentes et moins de tâches répétitives.",
        },
      ],
      tracksTitle: "Parcours de formation",
      tracks: [
        {
          title: "Conception & workflow production",
          bullets: [
            "Standards, gabarits et livrables propres",
            "Moins d'erreurs en atelier",
            "Méthodes orientées fabrication",
          ],
        },
        {
          title: "Bibliothèques & configuration",
          bullets: [
            "Matériaux, quincaillerie, assemblies",
            "Structure de base de données",
            "Dépannage et optimisation",
          ],
        },
        {
          title: "UCS & automatisation",
          bullets: [
            "Règles, conditions et logique d'automatisation",
            "Connecteurs et contraintes production",
            "Workflow scalable pour équipes",
          ],
        },
      ],
      formatTitle: "Format",
      formatBullets: [
        "Sessions live à distance (partage d'écran)",
        "Exercices, fichiers et checklists",
        "Support via chat/WhatsApp",
      ],
      ctaTitle: "Commencer",
      ctaText: "Dites-nous votre configuration et vos objectifs. Nous proposons le meilleur plan.",
    },
    designPricingPage: {
      badge: "Service compatible usine",
      remote: "Livraison à distance",
      factoryReady: "Aligné sur votre workflow",
      title: "Design & tarification pour la fabrication",
      subtitle:
        "Design technique et chiffrage précis pour cuisines, placards, salles de bain, chambres, lits et mobilier sur mesure, avec fichiers prêts à produire.",
      cta: "Contact WhatsApp",
      note: "Livraison de fichiers adaptés à votre système usine.",
      scopeTitle: "Périmètre des projets",
      scopeSubtitle:
        "Nous prenons en charge des projets bois complets avec un focus sur la fabricabilité.",
      scopeItems: [
        "Cuisines complètes et modules",
        "Placards, dressings et rangements",
        "Salles de bain (meubles vasques, colonnes)",
        "Chambres, lits et solutions sur mesure",
        "Mobilier de bureau et espaces d'accueil",
        "Pièces spéciales et demandes personnalisées",
      ],
      designTitle: "Design orienté production",
      pricingTitle: "Tarification technique",
      designIncludes: [
        "Plans optimisés selon les contraintes du site",
        "Dimensions finales adaptées à la découpe",
        "Choix matériaux et finitions orientés atelier",
        "Détails constructifs: chants, assemblages, quincaillerie",
        "Organisation claire des unités pour limiter les erreurs",
        "Standards de nommage, regroupement et structure",
        "Positionnement des accessoires et dégagements",
        "Gestion des révisions pour validation fluide",
      ],
      pricingIncludes: [
        "Quantités détaillées (panneaux, finitions, consommables)",
        "Quincaillerie selon vos catalogues",
        "Calcul des pertes et rendement matière",
        "Estimation des coûts matière + production + montage",
        "Chiffrage par unité ou par projet complet",
        "Ventilation possible par zone ou pièce",
        "Identification des postes coûteux",
        "Totaux clairs prêts pour devis client",
      ],
      detailsTitle: "Fichiers et rapports livrés",
      deliverablesTitle: "Livrables",
      deliverables: [
        "Fichiers projet complets prêts à produire",
        "BOM détaillé par unité et total",
        "Rapports de consommation matière",
        "Notes d'assemblage et d'installation (si requis)",
        "Exports adaptés à votre workflow",
        "Documentation pour validation et suivi",
        "Organisation des dossiers et nommage",
        "Sorties CNC si demandées",
      ],
      compatibilityTitle: "Compatibilité usine",
      compatibility: [
        "Aligné sur vos bibliothèques et standards",
        "Structure de dossiers conforme à votre système",
        "Sorties adaptées à vos machines et process",
        "Rapports organisés pour achats et production",
        "Cohérence pour équipes multi-utilisateurs",
        "Fichiers propres prêts à lancer",
      ],
      accuracyTitle: "Précision et contrôle",
      accuracy: [
        "Chiffrage fiable avec moins d'écarts",
        "Réduction des pertes matière",
        "Moins de reprises grâce aux détails techniques",
        "Visibilité claire des quantités et coûts",
        "Préparation plus rapide en atelier",
        "Qualité répétable et standardisée",
      ],
      whoForTitle: "Pour qui",
      whoFor: [
        "Usines qui ont besoin d'un chiffrage précis",
        "Ateliers qui veulent des fichiers prêts",
        "Équipes recherchant une structure fiable",
        "Production CNC ou manuelle",
        "Entreprises voulant mieux contrôler les coûts",
      ],
      requirementsTitle: "Ce dont nous avons besoin",
      requirements: [
        "Plans ou dimensions du site",
        "Choix matériaux et finitions",
        "Catalogues de quincaillerie utilisés",
        "Méthode de tarification souhaitée",
        "Règles de nommage ou standards usine",
        "Contraintes spéciales ou notes production",
      ],
      workflowTitle: "Processus",
      stepLabel: "Étape",
      workflow: [
        "Collecte des plans, mesures et exigences",
        "Modélisation orientée production",
        "Génération du chiffrage et des rapports",
        "Ajustements selon vos standards",
        "Livraison finale prête pour la fabrication",
      ],
      finalTitle: "Livraison prête usine avec coût complet",
      finalSubtitle:
        "Recevez des fichiers propres, un chiffrage fiable et des rapports clairs pour produire plus vite avec moins d'erreurs.",
      deliveryNote: "Livrables alignés sur votre système usine.",
    },
  },
  ar: {
    meta: {
      title: "استشارات وتدريب ودعم Cabinet Vision | CVsolucion",
      description:
        "استشارات وتدريب ودعم Cabinet Vision لورش الخزائن: إصلاح الأخطاء، تحسين الأداء، توحيد المكتبات، واستقرار مخرجات CNC.",
    },
    nav: {
      services: "الخدمات",
      training: "التدريب",
      designPricing: "التصميم والتسعير",
      packages: "الباقات",
      faq: "الأسئلة الشائعة",
      whatsapp: "واتساب",
      languageLabel: "اللغة",
      english: "الإنجليزية",
      french: "الفرنسية",
      arabic: "العربية",
      switchToFrench: "FR",
      switchToEnglish: "EN",
      switchToArabic: "AR",
    },
    auth: {
      title: "تسجيل الدخول",
      subtitle: "سجّل الدخول لعرض الأسعار. يلزم تأكيد البريد الإلكتروني.",
      login: "دخول",
      signup: "تسجيل",
      magic: "رابط سحري",
      email: "البريد الإلكتروني",
      emailPlaceholder: "name@company.com",
      password: "كلمة المرور",
      passwordPlaceholder: "كلمة المرور",
      submit: "متابعة",
      working: "جارٍ المعالجة...",
      loggedIn: "تم تسجيل الدخول. إذا بقيت الأسعار مخفية، أكّد البريد أولاً.",
      checkEmail: "تحقق من بريدك لتأكيد الحساب ثم سجّل الدخول.",
      magicDisabled: "تمت إزالة تسجيل الدخول عبر الرابط السحري. استخدم كلمة المرور أو أعد تعيينها إذا لزم الأمر.",
      unverifiedLogin: "أكّد بريدك الإلكتروني أولاً. تسجيل الدخول موقوف حتى يتم تأكيد البريد.",
      missingConfig: "Supabase غير مُهيّأ.",
      genericError: "حدث خطأ. حاول مرة أخرى.",
      invalidInbox: "هذا البريد الإلكتروني لا يمكنه استقبال الرسائل. تحقق من كتابته أو استخدم بريدًا آخر.",
      emailDeliveryIssue: "تعذر إرسال الرسالة الآن. حاول مرة أخرى بعد قليل.",
      note: "تظهر الأسعار بعد تسجيل الدخول وتأكيد البريد.",
      signIn: "تسجيل الدخول",
      signUp: "إنشاء حساب",
      signInUp: "تسجيل / إنشاء حساب",
      account: "الحساب",
      signOut: "تسجيل الخروج",
      showPassword: "إظهار",
      hidePassword: "إخفاء",
      forgotPassword: "نسيت كلمة المرور؟",
      resetSent: "تم إرسال رابط الاستعادة.",
      resetMissingEmail: "اكتب بريدك أولاً.",
      newPassword: "كلمة مرور جديدة",
      newPasswordPlaceholder: "أدخل كلمة مرور جديدة",
      confirmPassword: "تأكيد كلمة المرور",
      confirmPasswordPlaceholder: "أعد إدخال كلمة المرور",
      savePassword: "حفظ كلمة المرور",
      resetSuccess: "تم تحديث كلمة المرور. يمكنك تسجيل الدخول.",
      passwordMismatch: "كلمتا المرور غير متطابقتين.",
      sessionMissing: "انتهت صلاحية رابط الاستعادة. اطلب رابطاً جديداً.",
    },
    whatsapp: {
      general: "مرحبا CVsolucion",
      needHelp: "مرحبا CVsolucion، أحتاج مساعدة في Cabinet Vision.",
      annualPlan: "مرحبا CVsolucion، مهتم بخطة الدعم السنوية.",
    },
    hero: {
      title: "Cabinet Vision\nإعداد، دعم وتدريب",
      subtitle:
        "استشارات وتدريب ودعم Cabinet Vision لإصلاح الأخطاء وتحسين الأداء وتوحيد مخرجات CNC.",
      statsLabel: "نجاحات موثّقة في تحسين Cabinet Vision",
      ctaWhatsapp: "ابدأ عبر واتساب",
      scroll: "مرّر للاكتشاف",
    },
    problems: {
      title: "مشكلات Cabinet Vision الشائعة التي نعالجها",
      subtitle:
        "مشكلات Cabinet Vision تؤثر على الإنتاج. نحلّها بسرعة وبشكل آمن.",
      cards: [
        {
          title: "مشكلات الأداء",
          items: [
            "تجمّد عند تغيير المواد",
            "انهيارات مفاجئة",
            "بطء في ملفات كبيرة",
            "أخطاء CxADODatabase",
            "تراجع الأداء بمرور الوقت",
          ],
        },
        {
          title: "المكتبات والمكوّنات",
          items: [
            "تحديات إعداد المكتبات",
            "نقص في مكتبة الإكسسوارات",
            "مشكلات مكتبة المواد",
            "أجزاء لا تظهر في المكتبة",
            "عدم توافق بين المكتبات والإصدارات",
          ],
        },
        {
          title: "التجميع والإنتاج",
          items: [
            "إنشاء طرق تجميع مخصصة",
            "أخطاء Breakout وCut List",
            "مشكلات الانكماش",
            "تحسين التجميع",
            "عدم كفاءة تدفق الإنتاج",
          ],
        },
        {
          title: "الـ CNC والمخرجات",
          items: [
            "تكامل وإعداد CNC",
            "أخطاء تصدير DXF",
            "فشل Screen to Machine (S2M)",
            "مشكلات رسومات الورشة",
            "مشكلات Nesting والتخطيط",
          ],
        },
        {
          title: "التقارير والبيانات",
          items: [
            "مشكلات UCS (User Created Standards)",
            "توليد التقارير وتخصيصها",
            "مشكلات جداول المواد",
            "أخطاء BOM (Bill of Materials)",
            "أخطاء ملفات Workgroup",
          ],
        },
      ] as ProblemCard[],
    },
    services: {
      title: "خدمات Cabinet Vision",
      subtitle:
        "خدمات متخصصة من واقع الورش: استشارات، تدريب، دعم، وتحسين شامل.",
      includedLabel: "يشمل",
      cards: [
        {
          title: "استشارات Cabinet Vision",
          description:
            "تشخيص سريع وخطة واضحة لتثبيت النظام وتسريع العمل وتوحيد المعايير.",
          included: [
            "تدقيق سير العمل (المكتبات، الإعدادات، المخرجات)",
            "خطة أولويات مع حلول سريعة",
            "جلسة تطبيق عن بُعد",
            "ملاحظات وخطوات لاحقة للفريق",
          ],
        },
        {
          title: "دعم عن بُعد",
          description:
            "حلول سريعة للأعطال اليومية والعاجلة مع تغييرات آمنة.",
          included: [
            "تشخيص سريع للأخطاء والانهيارات",
            "حل مشكلات المخرجات وCNC",
            "إصلاح سريع للمكتبات والمواد",
            "تغييرات آمنة مع إمكانية الرجوع",
          ],
        },
        {
          title: "تثبيت + نسخ احتياطي/استعادة",
          description:
            "تثبيت نظيف ونسخ احتياطي كامل وترحيل آمن مع تحقق شامل.",
          included: [
            "فحص أولي للإصدار والمتطلبات والصلاحيات",
            "نسخ احتياطي كامل قبل أي تغيير",
            "استعادة أو ترحيل إلى جهاز جديد",
            "نقل مرحلي مع التحقق",
            "تحقق بعد الاستعادة",
            "خطة رجوع عند الحاجة",
          ],
        },
        {
          title: "تحسين الأداء",
          description:
            "إزالة الاختناقات ومعالجة الإعدادات وتحسين المكتبات.",
          included: [
            "تدقيق السرعة (الإقلاع والبحث والرندر والمخرجات)",
            "تنظيف الكتالوجات الثقيلة والروابط المكسورة",
            "ضبط Workgroup (المسارات، الكاش، الصلاحيات)",
            "تحسين القوالب والتقارير",
          ],
        },
        {
          title: "UCS وتقارير مخصصة",
          description: "أتمتة ومخرجات متوافقة مع واقع المصنع.",
          included: [
            "منطق مخصص (تسمية، ملصقات، قواعد)",
            "قوالب تقارير وفق سير العمل",
            "فحص اتساق البيانات",
            "تسليم بإصدارات آمنة",
          ],
        },
        {
          title: "إعداد CNC وحل الأعطال",
          description:
            "تهيئة الـ CNC ومخرجات تصنيع مستقرة وقابلة للتكرار.",
          included: [
            "التحقق من الـ post (الوحدات، الإحداثيات، الأدوات)",
            "إصلاح أخطاء CNC الشائعة",
            "اختبارات بقطع آمنة",
            "توثيق للمشغلين والمهندسين",
          ],
        },
        {
          title: "المكتبات والإكسسوارات",
          description:
            "إنشاء أو تنظيف مكتبات المواد والأبواب والأدراج والإكسسوارات.",
          included: [
            "إنشاء/تنظيف الكتالوجات",
            "تصحيح الروابط المكسورة والتكرارات",
            "معايير للتسمية وهيكلة المجلدات",
            "سير عمل آمن لإضافة عناصر جديدة",
          ],
        },
      ] as ServiceCard[],
    },
    packages: {
      title: "الباقات",
      subtitle:
        "اختر حسب درجة الاستعجال والعمق، ثم افتح الحجز مباشرة مع تحديد الخدمة المناسبة مسبقًا.",
      cta: "احجز حصة",
      priceHidden: "سجّل الدخول لرؤية السعر",
      note:
        "خطة الدعم السنوية تُفوتر سنويًا (السعر عند الطلب). باقة Audit وFix Day بسعر ثابت.",
      cards: [
        {
          title: "خطة الدعم السنوية",
          subtitle: "دعم أولوية + تحسين مستمر",
          duration: "فوترة سنوية (بدون شهري)",
          highlight: true,
          bullets: [
            "دعم واتساب بأولوية",
            "فحص شهري للنظام وسير العمل",
            "تحديثات المكتبات والمواد والإكسسوارات",
            "حل مشكلات CNC عند الحاجة",
            "متابعة الأداء وتوصيات",
          ],
        },
        {
          title: "Audit",
          subtitle: "وضوح سريع في جلسة واحدة",
          price: "$299",
          duration: "90 دقيقة",
          highlight: false,
          bullets: [
            "مراجعة النظام وسير العمل",
            "تحديد الأسباب الجذرية",
            "خطة إصلاح ذات أولوية",
            "حلول سريعة مطبقة",
            "خطوات تالية واضحة",
          ],
        },
        {
          title: "Fix Day",
          subtitle: "إصلاحات وإعداد عملي",
          price: "$899",
          duration: "يوم كامل (عن بُعد)",
          highlight: false,
          bullets: [
            "تشخيص وحل الأخطاء",
            "إعداد المكتبات والمواد",
            "تهيئة الإكسسوارات والمسارات",
            "إصلاحات CNC والمخرجات",
            "تحقق من الاستقرار وإرشادات النسخ",
          ],
        },
      ] as PackageCard[],
    },
    benefits: {
      title: "لماذا CVsolucion؟",
      subtitle: "خبرة متخصصة في Cabinet Vision ودعم سريع ونتائج موثوقة",
      cards: [
        {
          title: "خبرة متخصصة",
          description: "معرفة عميقة بواقع الإنتاج وCabinet Vision",
        },
        {
          title: "نتائج مثبتة",
          description: "نجاحات موثقة في حل مشكلات معقدة",
        },
        {
          title: "تسعير واضح",
          description: "أسعار شفافة بلا رسوم مخفية",
        },
        {
          title: "دعم مخصص",
          description: "دعم سريع للحفاظ على استمرار الإنتاج",
        },
        {
          title: "حلول ذكية",
          description: "حلول عملية تتناسب مع واقع الورش",
        },
        {
          title: "تحسين مستمر",
          description: "تطوير مستمر لزيادة عائد الاستثمار",
        },
      ] as BenefitCard[],
    },
    faq: {
      title: "الأسئلة الشائعة",
      subtitle: "إجابات سريعة قبل أن نبدأ.",
      items: [
        {
          question: "ما إصدارات Cabinet Vision التي تدعمونها؟",
          answer:
            "ندعم جميع الإصدارات الحديثة المستخدمة في الإنتاج. نؤكد الإصدار في أول جلسة ونوصي بمسار التحديث الآمن.",
        },
        {
          question: "ماذا تشمل خطة الدعم السنوية؟",
          answer:
            "دعم أولوية وتحسين مستمر: فحوصات شهرية، تحديثات المكتبات والإكسسوارات، وحلول CNC عند الحاجة.",
        },
        {
          question: "ما سرعة الاستجابة؟",
          answer:
            "تختلف حسب الضغط وشدة المشكلة. عملاء الخطة السنوية لهم أولوية. غالبًا ما تتم الاستجابة خلال 24–48 ساعة.",
        },
        {
          question: "هل تقدمون دعمًا عن بُعد أم ميدانيًا؟",
          answer:
            "نعم. أغلب العمل عن بُعد عبر مشاركة الشاشة، ويمكن ترتيب الدعم الميداني حسب الموقع والجدولة.",
        },
        {
          question: "هل تساعدون في تكامل CNC والبوست؟",
          answer:
            "نعم. نعالج مخرجات CNC والبوست والأدوات والإحداثيات مع اختبارات آمنة.",
        },
        {
          question: "هل يمكنكم تثبيت Cabinet Vision مع نسخ احتياطي آمن؟",
          answer:
            "نعم. نقوم بالتثبيت والنسخ الاحتياطي الكامل والاستعادة/الترحيل مع خطوات تحقق لتفادي الأعطال.",
        },
      ] as FaqItem[],
    },
    cta: {
      title: "جاهز لدعم سنوي يحافظ على الإنتاج؟",
      subtitle:
        "احصل على دعم أولوية وتحسين مستمر بخطة مصممة للمصانع التي لا تتحمل التوقف.",
      whatsapp: "تواصل عبر واتساب",
      email: "راسلنا",
    },
    footer: {
      aboutTitle: "CVsolucion",
      aboutText:
        "استشارات وتدريب ودعم Cabinet Vision. نساعدك على تثبيت النظام وتوحيد المعايير وتسريع الإنتاج.",
      servicesTitle: "الخدمات",
      servicesLinks: ["استشارات", "تدريب", "دعم"],
      solutionsTitle: "الحلول",
      solutionsLinks: [
        "برمجة مخصصة",
        "حل أخطاء النظام",
        "تثبيت + نسخ احتياطي/استعادة",
        "إعداد المكتبات",
        "تكامل CNC",
        "تحسين الأداء",
      ],
      contactTitle: "التواصل",
      emailLabel: "البريد الإلكتروني",
      whatsappLabel: "واتساب",
      legalTitle: "القانونية",
      designPricing: "التصميم والتسعير",
      privacy: "سياسة الخصوصية",
      terms: "شروط الاستخدام",
      rights: "جميع الحقوق محفوظة.",
    },
    legal: {
      lastUpdatedLabel: "آخر تحديث",
      disclaimer:
        "هذا المحتوى قالب عام لموقع خدمات ولا يُعد استشارة قانونية.",
    },
    trainingPage: {
      title: "تدريب Cabinet Vision",
      subtitle:
        "تدريب عملي موجّه للإنتاج لتصميم أسرع وتجنب الأخطاء وأتمتة سير العمل.",
      ctaButton: "تواصل عبر واتساب",
      backHome: "العودة للرئيسية",
      deliveryModes: ["فيديو مباشر", "مشاركة الشاشة", "أسئلة وأجوبة", "1:1", "مجموعة", "فريق شركة"],
      packagesTitle: "باقات التدريب",
      packagesSubtitle: "فيديو مباشر، مشاركة شاشة، وأسئلة وأجوبة. متاح فردي، مجموعة، أو فريق شركة.",
      goalLabel: "الهدف",
      skillsLabel: "المهارات المكتسبة",
      deliverableLabel: "التسليم",
      showMore: "إظهار التفاصيل",
      showLess: "إخفاء التفاصيل",
      packageCta: "تواصل عبر واتساب",
      packages: [
        {
          title: "مبتدئ (الأساسيات)",
          subtitle: "سير عمل أساسي + نمذجة نظيفة",
          summary: "الانتقال من أول تسجيل دخول إلى بناء مشروع نظيف بثقة.",
          duration: "مباشر 1:1 أو مجموعة أو فريق شركة",
          highlight: false,
          preview: ["إعداد مشروع نظيف", "وضع الخزائن بشكل صحيح", "مخرجات أساسية والتحقق"],
          whatsappMessage: "مرحباً CVsolucion، أريد باقة المبتدئ.",
          goal: "بناء مشروع مرتب وواضح من البداية.",
          skills: [
            "فهم هيكل Cabinet Vision وتأثيره على التعديل والتقارير والتصنيع.",
            "إنشاء وإدارة Jobs/Rooms وتجنب أخطاء الإعداد الشائعة.",
            "وضع الخزائن وتعديلها بشكل صحيح (الأبعاد والاختيارات الأساسية والتنظيم).",
            "إنشاء وقراءة التقارير الأساسية للتحقق من التصميم.",
          ],
          deliverable: "مشروع Room + Cabinets مكتمل ونظيف وجاهز للانتقال للإنتاج.",
        },
        {
          title: "متوسط (سير العمل والإخراجات)",
          subtitle: "تقارير، ملصقات، وتجهيز للإنتاج",
          summary: "جعل العمل قابلاً للتكرار وأسرع وجاهزاً للإنتاج.",
          duration: "مباشر 1:1 أو مجموعة أو فريق شركة",
          highlight: true,
          preview: ["مجموعات Setup Reports", "إعداد الملصقات", "معايير التسليم للإنتاج"],
          whatsappMessage: "مرحباً CVsolucion، أريد باقة المتوسّط.",
          goal: "توحيد سير العمل وضمان مخرجات إنتاجية دقيقة.",
          skills: [
            "استخدام Assembly Wizard وطرق البناء لتوحيد الخزائن.",
            "إعداد التقارير عبر Setup Reports (مجموعات وتشغيلات ثابتة).",
            "إعداد الملصقات وحقولها ومتغيراتها.",
            "تحسين تسليم العمل للإنتاج عبر معايير تسمية واضحة.",
          ],
          deliverable: "حزمة مخرجات إنتاج (تقارير + ملصقات) مناسبة لورشتك.",
        },
        {
          title: "احترافي/متقدم (أتمتة وتصنيع)",
          subtitle: "UCS + S2M/xMachining + أتمتة",
          summary: "تقليل العمل اليدوي وبناء نظام ذكي للفرق.",
          duration: "مباشر 1:1 أو مجموعة أو فريق شركة",
          highlight: false,
          preview: ["UCS + JavaScript UCS", "سير عمل S2M/xMachining", "قواعد أتمتة للفرق"],
          whatsappMessage: "مرحباً CVsolucion، أريد الباقة المتقدمة.",
          goal: "تقليل التعديلات اليدوية وتحسين جاهزية التصنيع.",
          skills: [
            "فهم وتطبيق UCS (أماكنها، تشغيلها، وتأثيرها).",
            "استخدام JavaScript UCS (إن توفر) لأتمتة القرارات.",
            "العمل بثقة مع S2M Center / xMachining لتحسين التصنيع.",
            "بناء قواعد أتمتة لتوحيد النتائج بين المشاريع والأشخاص.",
          ],
          deliverable: "سير عمل مبسط بمخرجات ثابتة وتقليل الأعمال المتكررة.",
        },
      ],
      tracksTitle: "مسارات التدريب",
      tracks: [
        {
          title: "تصميم وسير عمل الإنتاج",
          bullets: [
            "معايير وقوالب ومخرجات منظمة",
            "رسومات أفضل وأخطاء أقل",
            "ممارسات واقعية للورشة",
          ],
        },
        {
          title: "المكتبات والإعدادات",
          bullets: [
            "المواد والإكسسوارات والتجميعات",
            "هيكلة قاعدة البيانات وأفضل الممارسات",
            "استكشاف الأخطاء والتحسين",
          ],
        },
        {
          title: "UCS والأتمتة",
          bullets: [
            "القواعد والشروط ومنطق الأتمتة",
            "الموصلات وقيود الإنتاج",
            "سير عمل قابل للتوسع للفرق",
          ],
        },
      ],
      formatTitle: "طريقة التدريب",
      formatBullets: [
        "جلسات مباشرة عن بُعد (مشاركة الشاشة)",
        "تمارين وملفات وقوائم تحقق",
        "دعم عبر الدردشة/واتساب",
      ],
      ctaTitle: "ابدأ الآن",
      ctaText: "أخبرنا بإعدادك الحالي وأهدافك، وسنقترح أفضل خطة تدريب.",
    },
    designPricingPage: {
      badge: "خدمة جاهزة للمصنع",
      remote: "تسليم عن بعد",
      factoryReady: "متوافق مع نظام المصنع",
      title: "التصميم والتسعير للمشاريع الإنتاجية",
      subtitle:
        "تصميم تقني وتسعير دقيق لمشاريع المطابخ والخزائن والحمامات وغرف النوم والأسرّة والأثاث المخصص، مع ملفات جاهزة للإنتاج.",
      cta: "تواصل عبر واتساب",
      note: "نُسلم ملفات متوافقة مع نظام المصنع.",
      scopeTitle: "نطاق المشاريع",
      scopeSubtitle:
        "نتعامل مع مشاريع خشبية كاملة مع التركيز على قابلية التصنيع.",
      scopeItems: [
        "مطابخ كاملة ووحدات تنفيذية",
        "خزائن ودواليب وأنظمة تخزين",
        "حمامات (وحدات مغاسل وخزائن)",
        "غرف نوم وأسرّة وحلول مخصصة",
        "أثاث مكاتب واستقبال",
        "قطع خاصة حسب الطلب",
      ],
      designTitle: "تصميم جاهز للإنتاج",
      pricingTitle: "تسعير تقني",
      designIncludes: [
        "توزيع المساحات وفق قيود الموقع",
        "مقاسات نهائية متوافقة مع القص والتشغيل",
        "اختيار المواد والتشطيبات بما يناسب الإنتاج",
        "تفاصيل إنشائية: حواف، تجميعات، إكسسوارات",
        "تنظيم الوحدات لتقليل الأخطاء في الورشة",
        "معايير واضحة للتسمية والتنظيم",
        "تحديد مواقع الإكسسوارات والمسافات",
        "إدارة التعديلات لتسريع الموافقات",
      ],
      pricingIncludes: [
        "حصر المواد بدقة (ألواح، تشطيبات، لواصق)",
        "تحديد الإكسسوارات وفق كتالوجات المصنع",
        "حساب نسبة الهدر ومردود الألواح",
        "تقدير التكلفة: مواد + تشغيل + تجميع",
        "تسعير حسب الوحدة أو المشروع الكامل",
        "تفصيل حسب الغرفة أو المنطقة عند الحاجة",
        "تحديد العناصر الأعلى تكلفة",
        "إجماليات واضحة جاهزة للعروض",
      ],
      detailsTitle: "الملفات والتقارير المسلّمة",
      deliverablesTitle: "مخرجات التسليم",
      deliverables: [
        "ملفات المشروع كاملة وجاهزة للإنتاج",
        "قوائم مواد تفصيلية لكل وحدة وللمشروع",
        "تقارير استهلاك المواد والقص",
        "ملاحظات التجميع والتركيب عند الحاجة",
        "صيغ تصدير متوافقة مع سير العمل",
        "توثيق للمراجعات والموافقات",
        "تنظيم المجلدات والتسميات",
        "مخرجات CNC عند الطلب",
      ],
      compatibilityTitle: "التوافق مع المصنع",
      compatibility: [
        "متوافق مع المكتبات والمعايير الخاصة بكم",
        "هيكلة ملفات وفق نظام المصنع",
        "تقارير مناسبة للإنتاج والشراء",
        "مخرجات ملائمة للماكينات الحالية",
        "تنظيم موحد لفرق متعددة",
        "ملفات نظيفة وجاهزة للتنفيذ",
      ],
      accuracyTitle: "الدقة والتحكم",
      accuracy: [
        "تسعير موثوق بدون مفاجآت",
        "تقليل الهدر وتحسين استغلال المواد",
        "تقليل إعادة العمل بسبب التفاصيل الواضحة",
        "رؤية دقيقة للكميات والتكاليف",
        "تحضير أسرع للورشة",
        "جودة قابلة للتكرار",
      ],
      whoForTitle: "لمن هذه الخدمة",
      whoFor: [
        "مصانع تحتاج تسعيرًا دقيقًا",
        "ورش تريد ملفات جاهزة للإنتاج",
        "فرق تبحث عن توحيد المعايير",
        "إنتاج CNC أو إنتاج يدوي",
        "شركات تريد تحكمًا أفضل بالتكاليف",
      ],
      requirementsTitle: "المطلوب قبل البدء",
      requirements: [
        "أبعاد دقيقة أو مخططات معمارية",
        "اختيارات المواد والتشطيبات",
        "كتالوجات الإكسسوارات المستخدمة",
        "طريقة التسعير المطلوبة",
        "معايير التسمية أو تنظيم الملفات",
        "أي ملاحظات إنتاج خاصة",
      ],
      workflowTitle: "مراحل العمل",
      stepLabel: "الخطوة",
      workflow: [
        "جمع المخططات والقياسات والمتطلبات",
        "بناء تصميم جاهز للإنتاج",
        "إخراج التسعير والتقارير الفنية",
        "مراجعة وتعديل حسب معايير المصنع",
        "تسليم نهائي جاهز للتصنيع",
      ],
      finalTitle: "تسليم جاهز للإنتاج مع تكلفة واضحة",
      finalSubtitle:
        "تحصل على ملفات نظيفة وتسعير موثوق وتقارير منظمة لتسريع الإنتاج وتقليل الأخطاء.",
      deliveryNote: "مخرجات متوافقة مع نظام المصنع.",
    },
  },
};

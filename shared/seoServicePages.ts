export type SeoServicePageKey =
  | "support"
  | "troubleshooting"
  | "library-setup"
  | "cnc-integration"
  | "performance-optimization"
  | "install-backup-restore"
  | "custom-programming";

export type SeoLocale = "en" | "fr" | "ar";

export type SeoServicePageBlock =
  | {
      type: "cards";
      title: string;
      intro?: string;
      items: string[];
    }
  | {
      type: "copy";
      title: string;
      paragraphs: string[];
    }
  | {
      type: "steps";
      title: string;
      items: Array<{ label: string; text: string }>;
    }
  | {
      type: "facts";
      title: string;
      items: Array<{ label: string; text: string }>;
    };

export type SeoServicePage = {
  key: SeoServicePageKey;
  canonicalPath: string;
  shortTitle: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  heroBadge: string;
  heroLead: string;
  heroBody: string;
  blocks: SeoServicePageBlock[];
  faq: Array<{ question: string; answer: string }>;
  relatedPaths: string[];
};

export type SeoServicePageContent = Pick<
  SeoServicePage,
  "shortTitle" | "seoTitle" | "metaDescription" | "h1" | "heroBadge" | "heroLead" | "heroBody" | "blocks" | "faq"
>;

export const SEO_SERVICE_PAGE_ORDER: SeoServicePageKey[] = [
  "support",
  "troubleshooting",
  "library-setup",
  "cnc-integration",
  "performance-optimization",
  "install-backup-restore",
  "custom-programming",
];

export const SEO_SERVICE_PAGES: Record<SeoServicePageKey, SeoServicePage> = {
  support: {
    key: "support",
    canonicalPath: "/cabinet-vision-support",
    shortTitle: "Cabinet Vision Support",
    seoTitle: "Cabinet Vision Support for Cabinet Shops | CVsolucion",
    metaDescription:
      "Practical Cabinet Vision support for cabinet shops that need reliable setup, troubleshooting, library cleanup, reporting fixes, and production-ready output.",
    h1: "Cabinet Vision Support for Real Production Workflows",
    heroBadge: "CABINET VISION SUPPORT",
    heroLead:
      "Practical Cabinet Vision support for cabinet shops that need clean setup, faster execution, and reliable output from design to production.",
    heroBody:
      "When Cabinet Vision becomes difficult to trust, the problem is rarely just software. It usually affects pricing, reports, library consistency, CNC output, and day-to-day production flow. CVsolucion helps shops stabilize the system, remove recurring friction, and build a setup the team can actually rely on.",
    blocks: [
      {
        type: "cards",
        title: "Common reasons shops contact us",
        intro:
          "Many shops do not need generic software support. They need someone who understands what happens when quoting logic breaks, reports stop matching the shop floor, libraries become inconsistent, or CNC output starts creating doubt. This service is built for those situations.",
        items: [
          "Slow, unstable, or inconsistent Cabinet Vision behavior",
          "Libraries, reports, and pricing logic that no longer align",
          "CNC output or production handoff issues that create risk",
        ],
      },
      {
        type: "copy",
        title: "What this support includes",
        paragraphs: [
          "CVsolucion supports the operational side of Cabinet Vision implementation. That includes system review, problem isolation, workflow cleanup, structure improvements, and production-focused recommendations. The goal is not to patch one issue in isolation, but to make the whole workflow more predictable.",
          "This support can include troubleshooting, library structure review, design and pricing validation, report alignment, operator-ready output review, and guidance on how to reduce recurring errors across the team.",
        ],
      },
      {
        type: "copy",
        title: "Best fit for this page",
        paragraphs: [
          "This page is ideal for cabinet shops that are already using Cabinet Vision but feel that the system has become fragile, slow, inconsistent, or dependent on too much manual correction. It is also a strong fit for companies that inherited a setup from a former employee or an outside provider and no longer trust how the system was built.",
        ],
      },
      {
        type: "steps",
        title: "How we work",
        items: [
          { label: "1", text: "Review the current setup, workflow, and reported pain points" },
          { label: "2", text: "Identify the highest-risk issues affecting speed, consistency, or output" },
          { label: "3", text: "Fix or reorganize the critical areas first" },
          { label: "4", text: "Leave the team with a clearer, more stable working structure" },
        ],
      },
      {
        type: "copy",
        title: "Expected outcomes",
        paragraphs: [
          "After the work is completed, shops usually gain more confidence in their data, better alignment between design and production, fewer repeated questions inside the team, and a much clearer understanding of what to fix next. Even when the engagement starts with one urgent issue, the real value often comes from restoring trust in the workflow.",
        ],
      },
    ],
    faq: [
      {
        question: "What kind of support does CVsolucion provide?",
        answer:
          "Support can include troubleshooting, workflow cleanup, library review, pricing logic review, report alignment, and production output validation.",
      },
      {
        question: "Is this for beginners or experienced shops?",
        answer:
          "Both. Some shops need structured guidance from the beginning, while others need expert help correcting a setup that already exists.",
      },
      {
        question: "Can support start with one urgent issue?",
        answer:
          "Yes. Many projects begin with one visible problem and then expand into broader cleanup once the root cause becomes clear.",
      },
      {
        question: "Do you work remotely?",
        answer:
          "Yes. The service is designed for practical remote collaboration through live review, screen sharing, and structured follow-up.",
      },
    ],
    relatedPaths: [
      "/training",
      "/design-pricing",
      "/cabinet-vision-troubleshooting",
      "/cabinet-vision-cnc-integration",
      "/book",
    ],
  },
  troubleshooting: {
    key: "troubleshooting",
    canonicalPath: "/cabinet-vision-troubleshooting",
    shortTitle: "Cabinet Vision Troubleshooting",
    seoTitle: "Cabinet Vision Troubleshooting, S2M Errors & Workflow Fixes | CVsolucion",
    metaDescription:
      "Fix Cabinet Vision errors, S2M issues, database problems, slow performance, broken reports, and unstable production workflows with practical troubleshooting.",
    h1: "Cabinet Vision Troubleshooting for Errors, S2M Issues, and Production Failures",
    heroBadge: "ERROR TROUBLESHOOTING",
    heroLead:
      "Fix Cabinet Vision errors, S2M output problems, unstable behavior, broken reports, and workflow failures before they turn into production delays.",
    heroBody:
      "Most recurring Cabinet Vision issues are not random. They are usually connected to formulas, libraries, material structure, reports, machine output, S2M/xMachining assumptions, or changes made without a stable process. CVsolucion helps shops isolate the root cause, correct the structure, and reduce the chance of the same issue returning.",
    blocks: [
      {
        type: "cards",
        title: "Problems this page targets",
        items: [
          "Repeated errors and warning messages",
          "Reports, labels, or cutlists that no longer match production",
          "Jobs that behave differently from one file to the next",
        ],
      },
      {
        type: "cards",
        title: "Specific Cabinet Vision issues covered",
        intro:
          "This page is positioned for search intent around real Cabinet Vision problems, not generic software support. It helps shops that are looking for a practical next step when production output is slow, inconsistent, or unsafe to trust.",
        items: [
          "S2M and Screen-to-Machine output that needs manual correction",
          "Database, material, or catalog errors that block reliable job setup",
          "Slow Cabinet Vision jobs, freezes, report failures, and unstable files",
        ],
      },
      {
        type: "copy",
        title: "What usually causes the issue",
        paragraphs: [
          "Troubleshooting is often slowed down when teams focus only on the visible symptom. In reality, the source may be a formula issue, a misnamed part, a damaged standard, a broken report condition, or a mismatch between design intent and production logic. The purpose of this service is to identify that hidden layer instead of wasting time on temporary workarounds.",
        ],
      },
      {
        type: "copy",
        title: "S2M and Screen-to-Machine troubleshooting",
        paragraphs: [
          "When S2M or Screen-to-Machine output becomes unreliable, the visible problem may appear at the CNC, but the root cause often starts earlier. CVsolucion checks the connection between material logic, construction methods, machining assumptions, report output, and operator expectations so the shop can understand whether the issue is really a post problem, a setup problem, or a workflow validation problem.",
          "This is especially important when old CAM output is still used as a comparison point. If the new Cabinet Vision output is technically correct but not validated by the operator, the team will keep second-guessing every file. Troubleshooting must solve both the technical mismatch and the trust gap.",
        ],
      },
      {
        type: "copy",
        title: "Database, reports, and slow performance",
        paragraphs: [
          "Cabinet Vision database errors, broken report conditions, slow jobs, and inconsistent labels usually point to structural issues. The fix is rarely a single click. The system needs a controlled review of naming, standards, report groups, materials, assemblies, and the exact sequence that reproduces the failure.",
          "By documenting the symptom, isolating the cause, and validating the corrected output, the shop gets a clearer path than trial-and-error support calls or repeated manual corrections.",
        ],
      },
      {
        type: "copy",
        title: "What CVsolucion checks",
        paragraphs: [
          "CVsolucion reviews the current complaint in context. That can include material assignment logic, cabinet standards, report group logic, UCS behavior, output conditions, or the sequence of actions that reliably reproduces the error. Once the pattern is clear, the correction becomes much faster and more durable.",
        ],
      },
      {
        type: "copy",
        title: "Troubleshooting outcomes",
        paragraphs: [
          "The goal is not just to remove one message from the screen. The goal is to restore predictable behavior. That means cleaner files, fewer repeated failures, less operator confusion, and faster decision-making when something does go wrong.",
        ],
      },
    ],
    faq: [
      {
        question: "Can you help with one specific error?",
        answer: "Yes. A focused troubleshooting session can start from a single error or unexpected behavior.",
      },
      {
        question: "Do you also fix report and label issues?",
        answer: "Yes. Many troubleshooting projects involve reports, labels, or production handoff inconsistencies.",
      },
      {
        question: "What if the problem only happens in certain jobs?",
        answer:
          "That is common. Reproducible job-specific behavior often reveals deeper structural issues.",
      },
      {
        question: "Do you provide long-term fixes or just diagnosis?",
        answer:
          "The objective is always to move from diagnosis toward correction and prevention when possible.",
      },
    ],
    relatedPaths: [
      "/cabinet-vision-support",
      "/cabinet-vision-performance-optimization",
      "/cabinet-vision-cnc-integration",
      "/cabinet-vision-s2m-troubleshooting",
      "/cabinet-vision-database-errors",
      "/cabinet-vision-report-errors",
      "/cabinet-vision-cnc-output-problems",
      "/training",
      "/cabinet-vision-install-backup-restore",
      "/articles",
    ],
  },
  "library-setup": {
    key: "library-setup",
    canonicalPath: "/cabinet-vision-library-setup",
    shortTitle: "Cabinet Vision Library Setup",
    seoTitle: "Cabinet Vision Library Setup & Cleanup | CVsolucion",
    metaDescription:
      "Organize Cabinet Vision libraries, materials, assemblies, and standards for cleaner workflows, fewer errors, and more scalable production.",
    h1: "Cabinet Vision Library Setup for Cleaner, More Scalable Workflows",
    heroBadge: "LIBRARY SETUP",
    heroLead:
      "Organize materials, assemblies, standards, and naming logic so your Cabinet Vision setup becomes easier to manage and easier to trust.",
    heroBody:
      "A weak library structure creates problems everywhere else. Quoting becomes inconsistent, design becomes slower, reports become harder to verify, and production teams lose confidence in what they receive. CVsolucion helps shops clean the structure, simplify the logic, and build a more maintainable library foundation.",
    blocks: [
      {
        type: "copy",
        title: "Signs your library needs work",
        paragraphs: [
          "Your library may need cleanup if the same material appears under multiple names, if designers use different conventions for similar items, if assemblies behave inconsistently, or if new team members struggle to understand what should be used and when.",
        ],
      },
      {
        type: "copy",
        title: "What this service covers",
        paragraphs: [
          "This service can include material organization, hardware review, assembly cleanup, naming conventions, folder logic, standardization of common components, and clarification of how the team should use the library in daily work. The purpose is not simply to make the database look cleaner. It is to improve repeatability.",
        ],
      },
      {
        type: "copy",
        title: "Business impact",
        paragraphs: [
          "A cleaner library reduces decision fatigue, lowers the chance of accidental misuse, and makes the system easier to scale across more designers or more jobs. It also supports better reporting, cleaner pricing logic, and more consistent production output.",
        ],
      },
      {
        type: "facts",
        title: "Deliverables",
        items: [
          { label: "Structure review", text: "Identify clutter, duplication, and weak logic areas" },
          { label: "Cleanup plan", text: "Define what stays, what changes, and what gets standardized" },
          { label: "Implementation guidance", text: "Apply cleaner structure and usage rules" },
          { label: "Team clarity", text: "Make the library easier for others to understand and maintain" },
        ],
      },
    ],
    faq: [
      {
        question: "Is this only for large factories?",
        answer:
          "No. Even small shops benefit from a cleaner library if they want faster work and less confusion.",
      },
      {
        question: "Can you work on an existing messy setup?",
        answer: "Yes. In many cases, the project starts with an inherited or inconsistent library.",
      },
      {
        question: "Does this help with pricing and reports too?",
        answer: "Yes. Library quality often affects both quoting logic and downstream reporting.",
      },
      {
        question: "Will this make training easier for new staff?",
        answer: "Usually yes, because clearer structure reduces ambiguity and rework.",
      },
    ],
    relatedPaths: [
      "/training",
      "/design-pricing",
      "/cabinet-vision-custom-programming",
      "/cabinet-vision-support",
    ],
  },
  "cnc-integration": {
    key: "cnc-integration",
    canonicalPath: "/cabinet-vision-cnc-integration",
    shortTitle: "Cabinet Vision CNC Integration",
    seoTitle: "Cabinet Vision S2M, CNC Integration & Output Support | CVsolucion",
    metaDescription:
      "Improve Cabinet Vision S2M, Screen-to-Machine, CNC integration, output consistency, and operator trust with structured workflow review.",
    h1: "Cabinet Vision S2M and CNC Integration for Reliable Machine-Ready Output",
    heroBadge: "CNC INTEGRATION",
    heroLead:
      "Improve the connection between Cabinet Vision, S2M, xMachining, and your CNC workflow so output becomes more predictable and easier to trust on the shop floor.",
    heroBody:
      "CNC issues are rarely just machine issues. They often begin upstream in design logic, materials, reports, machining assumptions, or post behavior. CVsolucion helps shops review the full path from model to machine-ready output so operators spend less time second-guessing files.",
    blocks: [
      {
        type: "copy",
        title: "When this page is the right fit",
        paragraphs: [
          "This service is a strong fit when the shop experiences inconsistent output, excessive operator checks, machining surprises, unreliable cutlist behavior, or repeated doubt about whether the files are really ready for production.",
        ],
      },
      {
        type: "copy",
        title: "What gets reviewed",
        paragraphs: [
          "CVsolucion reviews how data moves from design into production output. That can include material logic, machining expectations, report consistency, cutlist behavior, and the practical usability of the resulting files. The goal is not theoretical integration. It is dependable output that production teams can use with confidence.",
        ],
      },
      {
        type: "copy",
        title: "S2M and Screen-to-Machine validation",
        paragraphs: [
          "For Cabinet Vision S2M and Screen-to-Machine workflows, the strongest validation happens before live production pressure. The review looks at how selected materials, construction methods, machining rules, reports, and output files behave together. If the operator cannot trust the output, the integration is not finished.",
          "This page is designed for shops searching for Cabinet Vision S2M support, CNC output troubleshooting, or a safer way to move from design data to machine-ready files.",
        ],
      },
      {
        type: "copy",
        title: "What better integration looks like",
        paragraphs: [
          "A stronger integration produces more consistent output, fewer manual clarifications, smoother operator handoff, and less friction between design staff and the shop floor. It also creates a better foundation for scaling volume without multiplying risk.",
        ],
      },
      {
        type: "cards",
        title: "Outcomes that matter on the floor",
        items: [
          "More predictable CNC output",
          "Better alignment between design and machining intent",
          "Greater operator trust in released files",
        ],
      },
    ],
    faq: [
      {
        question: "Do you work with S2M and machining workflows?",
        answer:
          "Yes. This page is specifically positioned for Cabinet Vision S2M, xMachining, and machine-ready output reliability.",
      },
      {
        question: "Can this help if the output is not wrong every time?",
        answer:
          "Yes. Inconsistent output is often the most dangerous case because it reduces trust.",
      },
      {
        question: "Is this only about posts?",
        answer: "No. Post behavior matters, but many CNC problems start earlier in the workflow.",
      },
      {
        question: "Can this reduce manual checks on the floor?",
        answer: "That is one of the main goals of the service.",
      },
    ],
    relatedPaths: [
      "/cabinet-vision-troubleshooting",
      "/cabinet-vision-s2m-troubleshooting",
      "/cabinet-vision-cnc-output-problems",
      "/cabinet-vision-performance-optimization",
      "/articles",
    ],
  },
  "performance-optimization": {
    key: "performance-optimization",
    canonicalPath: "/cabinet-vision-performance-optimization",
    shortTitle: "Cabinet Vision Performance Optimization",
    seoTitle: "Slow Cabinet Vision Performance Optimization | CVsolucion",
    metaDescription:
      "Fix slow Cabinet Vision jobs, freezes, and crashes with a structured review of files, libraries, reports, workstations, networks, and workflow.",
    h1: "Slow Cabinet Vision Performance Optimization for Faster, More Stable Work",
    heroBadge: "PERFORMANCE OPTIMIZATION",
    heroLead:
      "Find what is making Cabinet Vision slow, unstable, or difficult to trust before lost minutes become missed production deadlines.",
    heroBody:
      "CVsolucion reviews the complete design-to-production environment to separate file, library, workstation, network, and workflow problems. The goal is a faster daily experience and a stable setup your team can rely on under real production pressure.",
    blocks: [
      {
        type: "cards",
        title: "Signs Cabinet Vision needs a performance review",
        items: [
          "Jobs take too long to open, save, regenerate, or respond while editing",
          "Cabinet Vision freezes, crashes, or behaves differently between users",
          "Large or complex projects interrupt the design-to-production flow",
        ],
      },
      {
        type: "facts",
        title: "Find where the slowdown starts",
        items: [
          {
            label: "Project-specific",
            text: "One job or a group of similar jobs is slow while other work remains responsive.",
          },
          {
            label: "User-specific",
            text: "The same workflow behaves differently between designers, catalogs, or user standards.",
          },
          {
            label: "Workstation-specific",
            text: "The problem follows one computer, local configuration, storage path, or installed component.",
          },
          {
            label: "System-wide",
            text: "Multiple users experience the same delay through shared libraries, reports, databases, or network resources.",
          },
        ],
      },
      {
        type: "copy",
        title: "Why performance problems spread",
        paragraphs: [
          "Poor performance does more than waste minutes. It changes behavior. Designers avoid heavy operations, postpone cleanup, and create workarounds that make the environment harder to maintain.",
          "A slow Cabinet Vision system should be treated as an operational problem, not only a hardware problem. The visible delay can begin in project structure, catalogs, material logic, reports, UCS rules, database access, storage, networking, or the workstation itself.",
        ],
      },
      {
        type: "steps",
        title: "A structured Cabinet Vision performance review",
        items: [
          {
            label: "1",
            text: "Capture the exact action, job, user, and environment where the slowdown appears.",
          },
          {
            label: "2",
            text: "Reproduce the behavior and compare it with a known responsive workflow.",
          },
          {
            label: "3",
            text: "Isolate the bottleneck across files, libraries, reports, databases, network, and hardware.",
          },
          {
            label: "4",
            text: "Apply focused changes, retest the original case, and document the stable result.",
          },
        ],
      },
      {
        type: "copy",
        title: "What we check when Cabinet Vision is slow",
        paragraphs: [
          "The review can include job size and structure, catalogs and standards, material organization, report logic, UCS behavior, database health, local and shared storage, network paths, workstation resources, and the sequence used to release work to production.",
          "CVsolucion follows the pattern before recommending a change. This prevents unnecessary hardware purchases and avoids broad cleanup that creates risk without fixing the original bottleneck.",
        ],
      },
      {
        type: "cards",
        title: "Optimization areas",
        items: [
          "Simplify avoidable project, catalog, material, report, or UCS complexity",
          "Improve database, storage, network, and workstation reliability",
          "Standardize the workflow so performance remains consistent across the team",
        ],
      },
      {
        type: "copy",
        title: "The result: a workflow that stays responsive",
        paragraphs: [
          "A stable setup supports faster design decisions, smoother collaboration, more predictable production handoff, and greater confidence when deadlines are tight.",
          "The objective is not a temporary speed boost. It is a documented, maintainable improvement that reduces repeated interruption and gives the team a clear baseline for future troubleshooting.",
        ],
      },
    ],
    faq: [
      {
        question: "Why is Cabinet Vision running slow?",
        answer:
          "Slow performance can start in a specific job, catalog, library, material structure, report, UCS rule, database, network path, storage device, workstation, or a combination of these. The first step is to reproduce the slowdown and identify which layer changes the result.",
      },
      {
        question: "Can large jobs or Cabinet Vision libraries cause freezes?",
        answer:
          "Yes. Heavy project structure, accumulated standards, duplicated material logic, complex reports, and custom rules can increase processing time. The review determines whether that complexity is necessary and where it can be reduced safely.",
      },
      {
        question: "Does performance optimization include crash investigation?",
        answer:
          "Yes. Crashes, freezes, long waits, and inconsistent responsiveness are reviewed as part of the same performance and stability picture.",
      },
      {
        question: "Should we upgrade hardware before reviewing Cabinet Vision?",
        answer:
          "Not automatically. Hardware can be a bottleneck, but workflow structure, shared resources, reports, libraries, and database behavior should be checked before purchasing equipment that may not solve the issue.",
      },
      {
        question: "Can Cabinet Vision performance problems be diagnosed remotely?",
        answer:
          "Yes. Most reviews can begin remotely by reproducing the problem, comparing affected and unaffected cases, checking the environment, and documenting the exact conditions that trigger the slowdown.",
      },
    ],
    relatedPaths: [
      "/cabinet-vision-troubleshooting",
      "/cabinet-vision-slow-performance",
      "/cabinet-vision-support",
      "/cabinet-vision-cnc-integration",
    ],
  },
  "install-backup-restore": {
    key: "install-backup-restore",
    canonicalPath: "/cabinet-vision-install-backup-restore",
    shortTitle: "Cabinet Vision Install, Backup & Restore",
    seoTitle: "Cabinet Vision Install, Backup & Restore Support | CVsolucion",
    metaDescription:
      "Get help with Cabinet Vision installation, upgrades, backup, restore, migration, and recovery to reduce downtime and protect workflow continuity.",
    h1: "Cabinet Vision Install, Backup, Restore, and Recovery Support",
    heroBadge: "INSTALL + BACKUP / RESTORE",
    heroLead:
      "Protect your Cabinet Vision setup during installation, migration, upgrade, backup, or recovery so downtime does not turn into workflow chaos.",
    heroBody:
      "Critical system changes should be handled with structure. Whether the goal is a fresh install, a version change, a machine replacement, or a recovery scenario, CVsolucion helps shops reduce risk and keep the workflow intact.",
    blocks: [
      {
        type: "copy",
        title: "Situations this page covers",
        paragraphs: [
          "This page is relevant when a shop is installing Cabinet Vision, upgrading to a newer version, moving to another workstation or environment, rebuilding after data loss, or trying to restore continuity after an unexpected issue.",
        ],
      },
      {
        type: "copy",
        title: "Why these moments are risky",
        paragraphs: [
          "Installation and recovery work affects more than access to the software. It can affect libraries, standards, output logic, team continuity, and confidence in what is still valid. That is why structured backup and restore planning matters.",
        ],
      },
      {
        type: "copy",
        title: "What CVsolucion helps with",
        paragraphs: [
          "Support may include installation guidance, migration review, backup planning, restore coordination, validation after major changes, and helping the team confirm that critical workflow areas still behave as expected.",
        ],
      },
      {
        type: "copy",
        title: "Continuity first",
        paragraphs: [
          "The core purpose of this service is continuity. Shops should not have to choose between moving forward and risking disorder. A better process protects both the software environment and the production workflow built around it.",
        ],
      },
    ],
    faq: [
      {
        question: "Can you help before an upgrade happens?",
        answer: "Yes. Preventive planning is often more valuable than recovery after a failed change.",
      },
      {
        question: "Can you assist after a system problem or lost setup?",
        answer: "Yes. Recovery and restore scenarios are a core use case for this page.",
      },
      {
        question: "Is this only about software installation?",
        answer: "No. The service also addresses continuity, validation, and workflow protection.",
      },
      {
        question: "Can this reduce downtime risk?",
        answer: "That is one of the main reasons to use the service.",
      },
    ],
    relatedPaths: [
      "/cabinet-vision-support",
      "/cabinet-vision-troubleshooting",
      "/book",
      "/about",
    ],
  },
  "custom-programming": {
    key: "custom-programming",
    canonicalPath: "/cabinet-vision-custom-programming",
    shortTitle: "Cabinet Vision Custom Programming",
    seoTitle: "Cabinet Vision Custom Programming & UCS Development | CVsolucion",
    metaDescription:
      "Extend Cabinet Vision with custom programming, UCS logic, reporting improvements, and workflow-specific automation built for real manufacturing needs.",
    h1: "Cabinet Vision Custom Programming for Smarter, More Scalable Workflows",
    heroBadge: "CUSTOM PROGRAMMING",
    heroLead:
      "Extend Cabinet Vision with custom logic, smarter automation, and workflow-specific improvements that support how your shop actually works.",
    heroBody:
      "Standard functionality can only go so far. When the workflow requires deeper logic, more control, cleaner automation, or more useful output, custom programming becomes the bridge between software capability and operational reality. CVsolucion helps define, build, and refine that bridge.",
    blocks: [
      {
        type: "copy",
        title: "What this page is for",
        paragraphs: [
          "This page is for shops that already understand their workflow but need Cabinet Vision to do more. That may involve UCS development, custom logic, better reporting behavior, reusable standards, or targeted automation that reduces repetitive manual work.",
        ],
      },
      {
        type: "copy",
        title: "Where custom programming creates value",
        paragraphs: [
          "The value of customization is not complexity for its own sake. The value is in making the workflow more repeatable, faster, and easier to manage at scale. Good custom programming reduces dependency on memory, individual habits, and repeated correction.",
        ],
      },
      {
        type: "facts",
        title: "Typical customization themes",
        items: [
          { label: "UCS and logic rules", text: "Add workflow-specific behavior and controlled automation" },
          { label: "Reports and output", text: "Improve the usefulness and consistency of production information" },
          { label: "Reusable standards", text: "Support repeatable design practices across the team" },
          { label: "Process efficiency", text: "Remove unnecessary manual steps and repeated corrections" },
        ],
      },
      {
        type: "copy",
        title: "Ideal client profile",
        paragraphs: [
          "This service is best for shops that already know the pain points in their current process and want to invest in a system that works more intelligently for their team, product mix, and production reality.",
        ],
      },
    ],
    faq: [
      {
        question: "Is this only for advanced users?",
        answer: "Usually yes, or for teams that are growing into more advanced needs.",
      },
      {
        question: "Can custom programming support reports too?",
        answer: "Yes. Reporting and logic refinement often go together.",
      },
      {
        question: "Will this replace training?",
        answer: "No. Custom programming is strongest when paired with clear workflow usage.",
      },
      {
        question: "Can you help define the requirement before building anything?",
        answer: "Yes. Scoping the actual operational need is an important part of the process.",
      },
    ],
    relatedPaths: [
      "/training",
      "/cabinet-vision-library-setup",
      "/design-pricing",
      "/cabinet-vision-support",
    ],
  },
};

export function getSeoServicePageByCanonicalPath(path: string) {
  return Object.values(SEO_SERVICE_PAGES).find((page) => page.canonicalPath === path) ?? null;
}

export const HOME_SERVICE_SEO_TARGETS = [
  "/cabinet-vision-support",
  "/cabinet-vision-troubleshooting",
  "/cabinet-vision-install-backup-restore",
  "/cabinet-vision-performance-optimization",
  "/cabinet-vision-custom-programming",
  "/cabinet-vision-cnc-integration",
  "/cabinet-vision-library-setup",
] as const;

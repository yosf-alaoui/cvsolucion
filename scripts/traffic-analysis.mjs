import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIODS = [7, 30, 90];
const BOT_PATTERN =
  /bot|crawler|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|telegrambot|discordbot|bingpreview|google-inspectiontool/i;

function resolvePath(value, fallback) {
  const resolved = value?.trim() || fallback;
  return path.isAbsolute(resolved)
    ? resolved
    : path.resolve(process.cwd(), resolved);
}

function percent(numerator, denominator) {
  return denominator > 0
    ? Number(((numerator / denominator) * 100).toFixed(1))
    : 0;
}

function hostFromReferrer(value) {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function normalizedPath(value) {
  try {
    const pathname = new URL(value || "/", "https://cvsolucion.com").pathname;
    return pathname.replace(/\/+$/, "") || "/";
  } catch {
    return "/";
  }
}

function sourceForVisitor(visitor) {
  if (visitor.utm_source) {
    return {
      source: visitor.utm_source.toLowerCase(),
      medium: (visitor.utm_medium || "campaign").toLowerCase(),
      category: "campaign",
    };
  }
  if (visitor.gclid || visitor.wbraid || visitor.gbraid) {
    return { source: "google", medium: "paid", category: "paid_search" };
  }
  if (visitor.fbclid) {
    return { source: "meta", medium: "paid", category: "paid_social" };
  }
  if (visitor.msclkid) {
    return { source: "microsoft", medium: "paid", category: "paid_search" };
  }
  if (visitor.ttclid) {
    return { source: "tiktok", medium: "paid", category: "paid_social" };
  }
  if (visitor.li_fat_id) {
    return { source: "linkedin", medium: "paid", category: "paid_social" };
  }

  const host = hostFromReferrer(visitor.referrer);
  if (!host) {
    return { source: "direct", medium: "none", category: "direct_unknown" };
  }
  if (/google\.|bing\.|yahoo\.|duckduckgo\.|yandex\./.test(host)) {
    return { source: host, medium: "organic", category: "organic_search" };
  }
  if (
    /facebook\.|instagram\.|linkedin\.|tiktok\.|youtube\.|reddit\.|x\.com$|twitter\./.test(
      host,
    )
  ) {
    return { source: host, medium: "social", category: "organic_social" };
  }
  if (host === "cvsolucion.com" || host.endsWith(".cvsolucion.com")) {
    return {
      source: "internal referrer (legacy)",
      medium: "unknown",
      category: "attribution_lost",
    };
  }
  if (host === "localhost" || host === "127.0.0.1") {
    return { source: "local_test", medium: "test", category: "test" };
  }
  return { source: host, medium: "referral", category: "referral" };
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function topEntries(map, limit = 12) {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit);
}

function parseDocument(db, key, fallback) {
  const row = db.prepare("SELECT value FROM documents WHERE key = ?").get(key);
  if (!row?.value) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

function isCareerPath(value) {
  return /^\/(?:fr\/|ar\/)?training\/career$/i.test(normalizedPath(value));
}

function isThankYouPath(value) {
  return /^\/(?:fr\/|ar\/)?training\/career\/thank-you$/i.test(
    normalizedPath(value),
  );
}

const dataDir = resolvePath(
  process.env.APP_DATA_DIR,
  path.join(process.cwd(), "data"),
);
const databasePath = resolvePath(
  process.env.APP_DATABASE_PATH,
  path.join(dataDir, "cvsolucion.sqlite"),
);

if (!fs.existsSync(databasePath)) {
  console.error(`SQLite database not found: ${databasePath}`);
  process.exit(1);
}

const db = new Database(databasePath, {
  readonly: true,
  fileMustExist: true,
});

const visitors = db
  .prepare(
    `
  SELECT id, first_seen_at, last_seen_at, landing_path, locale, referrer,
    user_agent, device_type, total_sessions, total_page_views,
    utm_source, utm_medium, utm_campaign, gclid, fbclid, msclkid,
    ttclid, li_fat_id, wbraid, gbraid
  FROM visitors
`,
  )
  .all();
const humanVisitors = visitors.filter(
  (visitor) =>
    visitor.device_type !== "bot" &&
    !BOT_PATTERN.test(visitor.user_agent || "") &&
    sourceForVisitor(visitor).category !== "test",
);
const humanVisitorIds = new Set(humanVisitors.map((visitor) => visitor.id));

const pageViews = db
  .prepare(
    `
    SELECT visitor_id, path, locale, referrer, session_id, occurred_at
    FROM visitor_page_views
  `,
  )
  .all()
  .filter((row) => humanVisitorIds.has(row.visitor_id));
const interactions = db
  .prepare(
    `
    SELECT visitor_id, type, path, label, session_id, duration_ms,
      page_count, occurred_at
    FROM visitor_interactions
  `,
  )
  .all()
  .filter((row) => humanVisitorIds.has(row.visitor_id));
const contactLeads = db
  .prepare(`SELECT source, locale, created_at FROM contact_leads`)
  .all();
const bookings = db
  .prepare(
    `
    SELECT service_type, priority, locale, status, payment_status,
      payment_reference, unit_amount, created_at
    FROM bookings
  `,
  )
  .all();
const authUsers = db
  .prepare(`SELECT role, email_verified_at, created_at FROM auth_users`)
  .all();
const pendingContactDb = parseDocument(db, "pending-contact-leads.json", {
  pendingLeads: [],
});
const pendingLeads = Array.isArray(pendingContactDb.pendingLeads)
  ? pendingContactDb.pendingLeads
  : [];

function createPeriodReport(days, now) {
  const cutoffMs = now - days * DAY_MS;
  const inPeriod = (value) => {
    const timestamp = new Date(value || 0).getTime();
    return (
      Number.isFinite(timestamp) && timestamp >= cutoffMs && timestamp <= now
    );
  };

  const periodPageViews = pageViews.filter((row) => inPeriod(row.occurred_at));
  const activeVisitorIds = new Set(
    periodPageViews.map((row) => row.visitor_id),
  );
  const activeVisitors = humanVisitors.filter((visitor) =>
    activeVisitorIds.has(visitor.id),
  );
  const newVisitors = activeVisitors.filter((visitor) =>
    inPeriod(visitor.first_seen_at),
  );
  const returningVisitors = activeVisitors.length - newVisitors.length;
  const periodInteractions = interactions.filter((row) =>
    inPeriod(row.occurred_at),
  );

  const sessionStarts = periodInteractions.filter(
    (row) => row.type === "session_start",
  );
  const sessionEnds = periodInteractions.filter(
    (row) => row.type === "session_end",
  );
  const endedSessions = sessionEnds.filter(
    (row) =>
      Number.isFinite(row.duration_ms) && Number.isFinite(row.page_count),
  );
  const engagedSessions = endedSessions.filter(
    (row) => row.duration_ms >= 10_000 || row.page_count >= 2,
  );
  const shortSessions = endedSessions.filter(
    (row) => row.duration_ms < 10_000 && row.page_count <= 1,
  );
  const averageDurationSeconds = endedSessions.length
    ? Math.round(
        endedSessions.reduce((sum, row) => sum + row.duration_ms, 0) /
          endedSessions.length /
          1000,
      )
    : 0;

  const sourceMap = new Map();
  const sourceCategoryMap = new Map();
  const deviceMap = new Map();
  const localeMap = new Map();
  const campaignMap = new Map();
  for (const visitor of activeVisitors) {
    const source = sourceForVisitor(visitor);
    increment(sourceMap, `${source.source} / ${source.medium}`);
    increment(sourceCategoryMap, source.category);
    increment(deviceMap, visitor.device_type || "unknown");
    increment(localeMap, visitor.locale || "unknown");
    if (visitor.utm_campaign) increment(campaignMap, visitor.utm_campaign);
  }

  const pageMap = new Map();
  const landingMap = new Map();
  for (const pageView of periodPageViews) {
    increment(pageMap, normalizedPath(pageView.path));
  }
  for (const visitor of newVisitors) {
    increment(landingMap, normalizedPath(visitor.landing_path));
  }

  const interactionMap = new Map();
  for (const interaction of periodInteractions) {
    increment(interactionMap, interaction.type);
  }

  const careerPageViews = periodPageViews.filter((row) =>
    isCareerPath(row.path),
  );
  const careerVisitors = new Set(careerPageViews.map((row) => row.visitor_id))
    .size;
  const careerThankYouViews = periodPageViews.filter((row) =>
    isThankYouPath(row.path),
  ).length;
  const careerPending = pendingLeads.filter(
    (lead) =>
      lead.sourceType === "career_evaluation" && inPeriod(lead.createdAt),
  );
  const careerConfirmed = careerPending.filter((lead) => lead.confirmedAt);
  const careerLeadRows = contactLeads.filter(
    (lead) =>
      lead.source === "Cabinet Vision career evaluation" &&
      inPeriod(lead.created_at),
  );
  const careerLocaleMap = new Map();
  const careerSourceMap = new Map();
  for (const lead of careerPending) {
    increment(careerLocaleMap, lead.locale || "unknown");
    const trackingSource =
      lead.tracking?.utm_source ||
      (lead.tracking?.fbclid ? "meta" : "direct_unknown");
    increment(careerSourceMap, trackingSource);
  }

  const periodBookings = bookings.filter((booking) =>
    inPeriod(booking.created_at),
  );
  const paidBookings = periodBookings.filter(
    (booking) => booking.payment_status === "paid",
  );
  const paymentReferences = new Set(
    paidBookings.map((booking) => booking.payment_reference).filter(Boolean),
  );
  const paidRevenueMinor = paidBookings.reduce(
    (sum, booking) => sum + Number(booking.unit_amount || 0),
    0,
  );
  const newAccounts = authUsers.filter((user) => inPeriod(user.created_at));
  const periodLeadRows = contactLeads.filter((lead) =>
    inPeriod(lead.created_at),
  );
  const leadSourceMap = new Map();
  for (const lead of periodLeadRows) {
    increment(leadSourceMap, lead.source || "unknown");
  }

  return {
    days,
    visitors: {
      active: activeVisitors.length,
      new: newVisitors.length,
      returning: returningVisitors,
      returningRate: percent(returningVisitors, activeVisitors.length),
    },
    behavior: {
      pageViews: periodPageViews.length,
      sessionsStarted: sessionStarts.length,
      sessionsEnded: endedSessions.length,
      averageViewsPerVisitor: activeVisitors.length
        ? Number((periodPageViews.length / activeVisitors.length).toFixed(2))
        : 0,
      averageDurationSeconds,
      engagedSessions: engagedSessions.length,
      engagementRate: percent(engagedSessions.length, endedSessions.length),
      shortSinglePageSessions: shortSessions.length,
      shortSinglePageRate: percent(shortSessions.length, endedSessions.length),
    },
    acquisition: {
      categories: topEntries(sourceCategoryMap),
      sources: topEntries(sourceMap),
      campaigns: topEntries(campaignMap),
      directUnknownRate: percent(
        sourceCategoryMap.get("direct_unknown") || 0,
        activeVisitors.length,
      ),
    },
    audience: {
      devices: topEntries(deviceMap),
      locales: topEntries(localeMap),
    },
    content: {
      topPages: topEntries(pageMap, 20),
      newVisitorLandingPages: topEntries(landingMap, 20),
    },
    actions: Object.fromEntries(interactionMap),
    careerFunnel: {
      pageViews: careerPageViews.length,
      uniqueVisitors: careerVisitors,
      submissions: careerPending.length,
      confirmedSubmissions: careerConfirmed.length,
      storedLeads: careerLeadRows.length,
      thankYouViews: careerThankYouViews,
      visitorToSubmissionRate: percent(careerPending.length, careerVisitors),
      emailConfirmationRate: percent(
        careerConfirmed.length,
        careerPending.length,
      ),
      languages: topEntries(careerLocaleMap),
      submittedSources: topEntries(careerSourceMap),
    },
    commercialFunnel: {
      contactLeads: periodLeadRows.length,
      visitorToLeadRate: percent(periodLeadRows.length, activeVisitors.length),
      leadTypes: topEntries(leadSourceMap),
      newAccounts: newAccounts.length,
      verifiedAccounts: newAccounts.filter((user) => user.email_verified_at)
        .length,
      bookingSlotsCreated: periodBookings.length,
      paidBookingSlots: paidBookings.length,
      paidOrders: paymentReferences.size,
      paidRevenueMinor,
    },
  };
}

const allTimestamps = [
  ...pageViews.map((row) => new Date(row.occurred_at).getTime()),
  ...interactions.map((row) => new Date(row.occurred_at).getTime()),
].filter(Number.isFinite);
const now = Math.max(Date.now(), ...allTimestamps);
const report = {
  generatedAt: new Date().toISOString(),
  latestTrackedAt: allTimestamps.length
    ? new Date(Math.max(...allTimestamps)).toISOString()
    : null,
  database: path.basename(databasePath),
  excludedBots: visitors.length - humanVisitors.length,
  periods: PERIODS.map((days) => createPeriodReport(days, now)),
};

console.log(JSON.stringify(report, null, 2));
db.close();

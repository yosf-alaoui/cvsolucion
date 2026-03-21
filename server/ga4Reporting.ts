import crypto from "crypto";
import fs from "fs";
import path from "path";

type Ga4ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

export type Ga4DashboardSnapshot = {
  enabled: boolean;
  propertyId: string | null;
  fetchedAt: string | null;
  error: string | null;
  overview: {
    activeUsers1d: number;
    activeUsers7d: number;
    sessions7d: number;
    pageViews7d: number;
    avgSessionDuration7d: number;
  };
  events7d: {
    pageViews: number;
    whatsappClicks: number;
    emailClicks: number;
    ctaClicks: number;
  };
  topPages: Array<{ pagePath: string; views: number }>;
  trafficSources: Array<{ sourceMedium: string; users: number }>;
  countries: Array<{ country: string; users: number }>;
  devices: Array<{ deviceCategory: string; users: number }>;
};

const TOKEN_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CACHE_MS = 1000 * 60 * 5;

let cache:
  | {
      expiresAt: number;
      value: Ga4DashboardSnapshot;
    }
  | null = null;

function base64UrlEncode(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getPropertyId() {
  const propertyId = (process.env.GA4_PROPERTY_ID || "").trim();
  return propertyId || null;
}

function getServiceAccount(): Ga4ServiceAccount | null {
  const rawJson = (process.env.GA4_SERVICE_ACCOUNT_JSON || "").trim();
  if (rawJson) {
    return JSON.parse(rawJson) as Ga4ServiceAccount;
  }

  const configuredPath = (process.env.GA4_SERVICE_ACCOUNT_PATH || "").trim();
  if (!configuredPath) return null;

  const absolutePath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);

  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, "utf8")) as Ga4ServiceAccount;
}

async function getAccessToken(serviceAccount: Ga4ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: TOKEN_SCOPE,
      aud: serviceAccount.token_uri || TOKEN_URL,
      exp: now + 3600,
      iat: now,
    })
  );

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();

  const signature = signer.sign(serviceAccount.private_key);
  const assertion = `${header}.${payload}.${base64UrlEncode(signature)}`;

  const response = await fetch(serviceAccount.token_uri || TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as { access_token?: string; error_description?: string; error?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Failed to obtain GA4 access token.");
  }

  return data.access_token;
}

async function runReport(accessToken: string, propertyId: string, body: Record<string, unknown>) {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as any;
  if (!response.ok) {
    const message = data?.error?.message || "GA4 report request failed.";
    throw new Error(message);
  }
  return data;
}

function metricValue(row: any, index: number) {
  return Number(row?.metricValues?.[index]?.value || 0);
}

function dimensionValue(row: any, index: number) {
  return String(row?.dimensionValues?.[index]?.value || "");
}

function createEmptySnapshot(propertyId: string | null, error: string | null = null): Ga4DashboardSnapshot {
  return {
    enabled: false,
    propertyId,
    fetchedAt: null,
    error,
    overview: {
      activeUsers1d: 0,
      activeUsers7d: 0,
      sessions7d: 0,
      pageViews7d: 0,
      avgSessionDuration7d: 0,
    },
    events7d: {
      pageViews: 0,
      whatsappClicks: 0,
      emailClicks: 0,
      ctaClicks: 0,
    },
    topPages: [],
    trafficSources: [],
    countries: [],
    devices: [],
  };
}

export async function getGa4DashboardSnapshot() {
  const propertyId = getPropertyId();
  const serviceAccount = getServiceAccount();

  if (!propertyId || !serviceAccount) {
    return createEmptySnapshot(propertyId, "GA4 is not configured yet.");
  }

  if (cache && cache.expiresAt > Date.now()) {
    return cache.value;
  }

  try {
    const accessToken = await getAccessToken(serviceAccount);

    const [overview1d, overview7d, events7d, topPages, trafficSources, countries, devices] = await Promise.all([
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "today", endDate: "today" }],
        metrics: [{ name: "activeUsers" }],
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "averageSessionDuration" }],
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: {
              values: ["page_view", "whatsapp_click", "email_click", "cta_click"],
            },
          },
        },
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 8,
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        dimensions: [{ name: "sessionSourceMedium" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 8,
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 8,
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 8,
      }),
    ]);

    const eventRows = Array.isArray(events7d.rows) ? events7d.rows : [];
    const eventMap = new Map<string, number>();
    for (const row of eventRows) {
      eventMap.set(dimensionValue(row, 0), metricValue(row, 0));
    }

    const snapshot: Ga4DashboardSnapshot = {
      enabled: true,
      propertyId,
      fetchedAt: new Date().toISOString(),
      error: null,
      overview: {
        activeUsers1d: metricValue(overview1d.rows?.[0], 0),
        activeUsers7d: metricValue(overview7d.rows?.[0], 0),
        sessions7d: metricValue(overview7d.rows?.[0], 1),
        pageViews7d: metricValue(overview7d.rows?.[0], 2),
        avgSessionDuration7d: metricValue(overview7d.rows?.[0], 3),
      },
      events7d: {
        pageViews: eventMap.get("page_view") || 0,
        whatsappClicks: eventMap.get("whatsapp_click") || 0,
        emailClicks: eventMap.get("email_click") || 0,
        ctaClicks: eventMap.get("cta_click") || 0,
      },
      topPages: (topPages.rows || []).map((row: any) => ({
        pagePath: dimensionValue(row, 0) || "/",
        views: metricValue(row, 0),
      })),
      trafficSources: (trafficSources.rows || []).map((row: any) => ({
        sourceMedium: dimensionValue(row, 0) || "(direct) / (none)",
        users: metricValue(row, 0),
      })),
      countries: (countries.rows || []).map((row: any) => ({
        country: dimensionValue(row, 0) || "Unknown",
        users: metricValue(row, 0),
      })),
      devices: (devices.rows || []).map((row: any) => ({
        deviceCategory: dimensionValue(row, 0) || "unknown",
        users: metricValue(row, 0),
      })),
    };

    cache = {
      value: snapshot,
      expiresAt: Date.now() + CACHE_MS,
    };

    return snapshot;
  } catch (error: any) {
    const snapshot = createEmptySnapshot(propertyId, error?.message || "Failed to load GA4 data.");
    cache = {
      value: snapshot,
      expiresAt: Date.now() + 1000 * 60,
    };
    return snapshot;
  }
}

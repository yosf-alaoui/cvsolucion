import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { Ga4DashboardSnapshot } from "./contracts";

export type Ga4ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

export type CreateGa4ReportingModuleOptions = {
  propertyId: string;
  serviceAccount: Ga4ServiceAccount;
  cacheMs?: number;
};

const TOKEN_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

function base64UrlEncode(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function metricValue(row: any, index: number) {
  return Number(row?.metricValues?.[index]?.value || 0);
}

function dimensionValue(row: any, index: number) {
  return String(row?.dimensionValues?.[index]?.value || "");
}

export function readGa4ServiceAccountFromEnv() {
  const rawJson = (process.env.GA4_SERVICE_ACCOUNT_JSON || "").trim();
  if (rawJson) {
    return JSON.parse(rawJson) as Ga4ServiceAccount;
  }

  const configuredPath = (process.env.GA4_SERVICE_ACCOUNT_PATH || "").trim();
  if (!configuredPath) {
    return null;
  }

  const absolutePath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(absolutePath, "utf8")) as Ga4ServiceAccount;
}

export function createGa4ReportingModule(options: CreateGa4ReportingModuleOptions) {
  let cache: { expiresAt: number; value: Ga4DashboardSnapshot } | null = null;
  const cacheMs = options.cacheMs ?? 1000 * 60 * 5;

  async function getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = base64UrlEncode(
      JSON.stringify({
        iss: options.serviceAccount.client_email,
        scope: TOKEN_SCOPE,
        aud: options.serviceAccount.token_uri || TOKEN_URL,
        exp: now + 3600,
        iat: now,
      })
    );

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(`${header}.${payload}`);
    signer.end();

    const assertion = `${header}.${payload}.${base64UrlEncode(signer.sign(options.serviceAccount.private_key))}`;

    const response = await fetch(options.serviceAccount.token_uri || TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string };
    if (!response.ok || !data.access_token) {
      throw new Error(data.error_description || data.error || "Failed to obtain GA4 access token.");
    }

    return data.access_token;
  }

  async function runReport(accessToken: string, body: Record<string, unknown>) {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${options.propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = (await response.json().catch(() => ({}))) as any;
    if (!response.ok) {
      throw new Error(data?.error?.message || "GA4 report request failed.");
    }

    return data;
  }

  function createEmptySnapshot(error: string | null = null): Ga4DashboardSnapshot {
    return {
      enabled: false,
      propertyId: options.propertyId || null,
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

  return {
    async getSnapshot() {
      if (cache && cache.expiresAt > Date.now()) {
        return cache.value;
      }

      try {
        const accessToken = await getAccessToken();
        const [overview1d, overview7d, events7d] = await Promise.all([
          runReport(accessToken, {
            dateRanges: [{ startDate: "today", endDate: "today" }],
            metrics: [{ name: "activeUsers" }],
          }),
          runReport(accessToken, {
            dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
            metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "averageSessionDuration" }],
          }),
          runReport(accessToken, {
            dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
            dimensions: [{ name: "eventName" }],
            metrics: [{ name: "eventCount" }],
          }),
        ]);

        const eventRows = Array.isArray(events7d.rows) ? events7d.rows : [];
        const eventMap = new Map<string, number>();
        for (const row of eventRows) {
          eventMap.set(dimensionValue(row, 0), metricValue(row, 0));
        }

        const snapshot: Ga4DashboardSnapshot = {
          enabled: true,
          propertyId: options.propertyId,
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
          topPages: [],
          trafficSources: [],
          countries: [],
          devices: [],
        };

        cache = {
          value: snapshot,
          expiresAt: Date.now() + cacheMs,
        };

        return snapshot;
      } catch (error) {
        const snapshot = createEmptySnapshot(error instanceof Error ? error.message : "Failed to load GA4 data.");
        cache = {
          value: snapshot,
          expiresAt: Date.now() + 1000 * 60,
        };
        return snapshot;
      }
    },
  };
}


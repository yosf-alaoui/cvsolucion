export type VisitorTrackingEvent = {
  type:
    | "session_start"
    | "session_end"
    | "whatsapp_click"
    | "email_click"
    | "cta_click"
    | "chat_open"
    | "chat_message";
  path: string;
  href?: string | null;
  label?: string | null;
  sessionId?: string | null;
  durationMs?: number | null;
  pageCount?: number | null;
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


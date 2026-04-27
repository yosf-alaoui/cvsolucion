import assert from "node:assert/strict";
import {
  applySeoDocumentToHead,
  buildAdminDashboardStats,
  buildChatSystemPrompt,
  buildCustomerDashboardSummary,
  buildPathWithLocale,
  buildRobotsTxt,
  buildSeoAlternates,
  buildSitemapXml,
  buildWhatsAppLink,
  calculateBookingCharge,
  calculateOrderTotals,
  createArticlesModuleClient,
  createArticleTranslationModule,
  createAuthModuleClient,
  createAuthSessionCookieOptions,
  createBookingHoursConfig,
  createBookingModuleClient,
  createCatalogModule,
  createCatalogModuleClient,
  createChatConversationSeed,
  createChatModuleClient,
  createClientAnalyticsModule,
  createContactLeadStore,
  createContactModuleClient,
  createCustomerProfileModuleClient,
  createCustomerProfileStore,
  createDashboardModuleClient,
  createEmailModule,
  createGa4ReportingModule,
  createI18nModule,
  createInvoicesModuleClient,
  createJsonHttpClient,
  createPaymentsModuleClient,
  createStripePaymentsModule,
  createVisitorId,
  createVisitorTrackingModuleClient,
  createVisitorTrackingStore,
  escapeSeoHtml,
  getLocaleFromPath,
  normalizeAuthEmail,
  shouldRequireSupportIntake,
  sortDashboardBookings,
  summarizeCustomerInvoices,
  toBookingSlotId,
  validateAuthLoginPayload,
  validateAuthSignupPayload,
  validateCreateBookingPayload,
} from "../index";

function createFetchStub(responseData: unknown) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init = {}) => {
    calls.push({ url: String(input), init });
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  return { fetchImpl, calls };
}

async function main() {
  const shared = createFetchStub({ ok: true });
  const jsonRequest = createJsonHttpClient({ baseUrl: "https://api.example.com", fetchImpl: shared.fetchImpl });
  await jsonRequest("/ping", { method: "GET" });
  assert.equal(shared.calls[0]?.url, "https://api.example.com/ping");

  assert.equal(normalizeAuthEmail(" USER@Example.com "), "user@example.com");
  assert.equal(validateAuthLoginPayload({ email: "a@b.com", password: "x" }).email, "a@b.com");
  assert.equal(validateAuthSignupPayload({ email: "u@b.com", password: "x", locale: "FR" }).locale, "fr");
  assert.equal(createAuthSessionCookieOptions().cookieName, "session");
  const authFetch = createFetchStub({ user: { id: "u1", email: "user@example.com", emailVerifiedAt: null } });
  const authClient = createAuthModuleClient({ fetchImpl: authFetch.fetchImpl });
  await authClient.login({ email: "user@example.com", password: "pw" });
  assert.equal(authFetch.calls[0]?.url, "/api/auth/login");

  const fallbackEmail = createEmailModule(null);
  const emailResult = await fallbackEmail.send({
    to: "a@b.com",
    subject: "Hi",
    text: "Body",
    html: "<p>Body</p>",
  });
  assert.equal(emailResult.delivered, false);

  const chatPrompt = buildChatSystemPrompt("Base prompt", { bookingUrl: "https://site/book", maxWords: 25 });
  assert.ok(chatPrompt.includes("25"));
  assert.equal(shouldRequireSupportIntake({ message: "Need support", messageCount: 1 }), true);
  assert.equal(createChatConversationSeed({ locale: "fr" }).locale, "fr");
  const chatFetch = createFetchStub({
    ok: true,
    enabled: true,
    isNew: true,
    conversation: createChatConversationSeed({ locale: "en" }),
  });
  const chatClient = createChatModuleClient({ fetchImpl: chatFetch.fetchImpl });
  await chatClient.openSession({ locale: "en", path: "/" });
  assert.equal(chatFetch.calls[0]?.url, "/api/chat/session");

  const bookingConfig = createBookingHoursConfig();
  assert.ok(bookingConfig.standardHours.includes(8));
  assert.equal(toBookingSlotId({ date: "2026-04-26", hour: 8 }, "standard"), "2026-04-26:8:standard");
  assert.equal(calculateBookingCharge({ unitAmountCents: 14000, slotCount: 2, cardPaymentFeeCents: 1500 }).totalCents, 29500);
  const bookingPayload = validateCreateBookingPayload({
    serviceType: "consultation",
    priority: "standard",
    name: "Yosf",
    email: "yosf@example.com",
    phone: "123",
    country: "CA",
    company: "",
    notes: "",
    locale: "en",
    slots: [{ date: "2026-04-26", hour: 8 }],
  });
  assert.equal(bookingPayload.email, "yosf@example.com");
  const bookingFetch = createFetchStub({ timeZone: "America/Toronto", priority: "standard", isOpen: true, schedule: { standardOpen: true, expressOpen: true, updatedAt: new Date().toISOString() }, days: [], window: { startDate: "2026-04-26", endDate: "2026-05-03" }, rules: { standardHours: [8], expressHours: [8], lunchBreak: "12:00-13:00" } });
  const bookingClient = createBookingModuleClient({ fetchImpl: bookingFetch.fetchImpl });
  await bookingClient.getAvailability("standard");
  assert.ok(bookingFetch.calls[0]?.url.includes("/api/bookings/availability"));

  const dashboardClientFetch = createFetchStub({ user: { id: "u1", email: "admin@test.com", emailVerifiedAt: null }, profile: { userId: "u1", email: "admin@test.com", name: null, country: null, phone: null, company: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, bookings: [] });
  const dashboardClient = createDashboardModuleClient({ fetchImpl: dashboardClientFetch.fetchImpl });
  await dashboardClient.getCustomerDashboard();
  assert.equal(dashboardClientFetch.calls[0]?.url, "/api/customer/dashboard");
  const sampleBookings = [
    {
      id: "b1",
      userId: "u1",
      serviceType: "consultation",
      priority: "standard",
      packageKey: null,
      currency: "usd",
      date: "2030-01-01",
      hour: 9,
      name: "User",
      email: "user@test.com",
      phone: "123",
      country: "CA",
      company: null,
      notes: null,
      locale: "en",
      status: "confirmed",
      createdAt: "2030-01-01T00:00:00.000Z",
      updatedAt: "2030-01-01T00:00:00.000Z",
      rescheduledFromBookingId: null,
      paymentStatus: "paid",
      paymentProvider: "stripe",
      paymentReference: null,
      unitAmount: 14000,
      refundStatus: "none",
      refundReference: null,
      refundAmount: 0,
      refundedAt: null,
    },
  ] as any[];
  assert.equal(sortDashboardBookings(sampleBookings)[0]?.id, "b1");
  assert.equal(buildCustomerDashboardSummary({ bookings: sampleBookings, invoices: [] }).upcomingBookings, 1);
  assert.equal(buildAdminDashboardStats({ bookings: sampleBookings, usersCount: 4, leadsCount: 3, visitorsCount: 12, conversationsCount: 2 }).paidBookings, 1);
  assert.equal(summarizeCustomerInvoices([]).count, 0);

  const sentEvents: any[] = [];
  const pushedEvents: any[] = [];
  const analyticsClient = createClientAnalyticsModule({
    sendEvent(event) {
      sentEvents.push(event);
    },
    pushDataLayer(payload) {
      pushedEvents.push(payload);
    },
  });
  analyticsClient.trackVirtualPageView({ path: "/", title: "Home", locale: "en", userStatus: "anonymous" });
  analyticsClient.trackInteraction({ type: "cta_click", path: "/" } as any);
  assert.equal(sentEvents.length, 1);
  assert.equal(pushedEvents.length, 1);
  const ga4 = createGa4ReportingModule({
    propertyId: "123456",
    serviceAccount: { client_email: "bot@example.com", private_key: "invalid" },
    cacheMs: 1000,
  });
  const ga4Snapshot = await ga4.getSnapshot();
  assert.equal(ga4Snapshot.enabled, false);

  const articleModule = createArticleTranslationModule({ apiKey: "test-key" });
  const articleRecord = {
    id: "a1",
    slug: "hello",
    sourceLocale: "en",
    translations: {
      en: { title: "Hello", body: "<p>Body</p>" },
      fr: { title: "Bonjour", body: "<p>Corps</p>" },
      ar: { title: "مرحبا", body: "<p>نص</p>" },
    },
    imageUrl: null,
    publishedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  } as any;
  assert.equal(articleModule.uniqueSlug([articleRecord], "Hello", "a1"), "hello");
  assert.equal(articleModule.localizeArticle(articleRecord, "fr").title, "Bonjour");
  const articleFetch = createFetchStub({ articles: [] });
  const articlesClient = createArticlesModuleClient({ fetchImpl: articleFetch.fetchImpl });
  await articlesClient.getArticles("en");
  assert.ok(articleFetch.calls[0]?.url.includes("/api/articles?locale=en"));

  const leadStorage: any = { items: [] };
  const leads = createContactLeadStore({
    load: async () => leadStorage.items,
    save: async (items) => {
      leadStorage.items = items;
    },
  });
  await leads.createLead({ name: "Lead", email: "lead@test.com", message: "Need help" });
  assert.equal((await leads.listLeads()).length, 1);
  const contactFetch = createFetchStub({ ok: true });
  const contactClient = createContactModuleClient({ fetchImpl: contactFetch.fetchImpl });
  await contactClient.submitLead({ name: "Lead", email: "lead@test.com", message: "Need help" } as any);
  assert.equal(contactFetch.calls[0]?.url, "/api/contact");

  const profileStorage: any = { items: [] };
  const profiles = createCustomerProfileStore({
    load: async () => profileStorage.items,
    save: async (items) => {
      profileStorage.items = items;
    },
  });
  await profiles.upsertProfile({ userId: "u1", email: "u@test.com", country: "CA" });
  assert.equal((await profiles.getProfile("u1"))?.country, "CA");
  const profileFetch = createFetchStub({ ok: true, profile: { userId: "u1", email: "u@test.com" } });
  const customerProfileClient = createCustomerProfileModuleClient({ fetchImpl: profileFetch.fetchImpl });
  await customerProfileClient.updateProfile({ name: "User", country: "CA", phone: "", company: "" });
  assert.equal(profileFetch.calls[0]?.url, "/api/customer/profile");

  const catalogStorage: any = { snapshot: null };
  const catalog = createCatalogModule({
    storage: {
      load: async () => catalogStorage.snapshot,
      save: async (snapshot) => {
        catalogStorage.snapshot = snapshot;
      },
    },
  });
  await catalog.updateBookingPrices({ standardConsultation: 14000, standardSupport: 14000, expressConsultation: 18000, expressSupport: 18000 });
  await catalog.createPackage({
    translations: {
      en: { title: "Audit", subtitle: "Fast", duration: "1h", priceLabel: "US$140", bullets: ["One"] },
      fr: { title: "Audit", subtitle: "Rapide", duration: "1h", priceLabel: "140 $US", bullets: ["Un"] },
      ar: { title: "تدقيق", subtitle: "سريع", duration: "ساعة", priceLabel: "140$", bullets: ["واحد"] },
    },
  });
  await catalog.createTrainingProgram({
    key: "level1",
    priceCents: 59700,
    translations: {
      en: { badge: "L1", title: "Level 1", hours: "8h", duration: "1 week", prerequisite: "None", certification: "Yes", project: "Base", modules: ["A"] },
      fr: { badge: "N1", title: "Niveau 1", hours: "8h", duration: "1 semaine", prerequisite: "Aucun", certification: "Oui", project: "Base", modules: ["A"] },
      ar: { badge: "م1", title: "المستوى 1", hours: "8س", duration: "أسبوع", prerequisite: "لا شيء", certification: "نعم", project: "أساس", modules: ["A"] },
    },
  });
  assert.equal((await catalog.getSnapshot()).servicePackages.length, 1);
  const catalogFetch = createFetchStub({ bookingPrices: {}, servicePackages: [] });
  const catalogClient = createCatalogModuleClient({ fetchImpl: catalogFetch.fetchImpl });
  await catalogClient.getPublicCatalog("en");
  assert.ok(catalogFetch.calls[0]?.url.includes("/api/catalog?locale=en"));

  const i18n = createI18nModule({
    translations: {
      en: { hero: { title: "Hello" } },
      fr: { hero: { title: "Bonjour" } },
      ar: { hero: { title: "مرحبا" } },
    },
  });
  assert.equal(getLocaleFromPath("/fr/about"), "fr");
  assert.equal(buildPathWithLocale("/about", "ar"), "/ar/about");
  assert.equal(i18n.createContext("/fr").t("hero.title"), "Bonjour");
  assert.ok(buildWhatsAppLink("+1 514 000 0000", "Hello").includes("wa.me/15140000000"));

  const invoiceFetch = createFetchStub({ invoices: [{ id: "i1" }] });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = invoiceFetch.fetchImpl;
  try {
    const invoicesClient = createInvoicesModuleClient("");
    const invoices = await invoicesClient.listCustomerInvoices();
    assert.equal(invoices.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }

  const payments = createStripePaymentsModule({
    publishableKey: "pk_test",
    currency: "usd",
    cardPaymentFeeCents: 1500,
  });
  assert.equal(payments.isConfigured(), false);
  assert.equal(payments.getConfig().cardPaymentFeeCents, 1500);
  assert.equal(calculateOrderTotals([{ id: "a", title: "Consultation", quantity: 2, unitAmount: 14000 } as any], 0, 1500).total, 29500);
  const paymentFetch = createFetchStub({ enabled: true, publishableKey: "pk_test", currency: "usd" });
  const paymentsClient = createPaymentsModuleClient({ fetchImpl: paymentFetch.fetchImpl });
  await paymentsClient.getConfig();
  assert.equal(paymentFetch.calls[0]?.url, "/api/stripe/config");

  assert.ok(buildSitemapXml([{ url: "https://cvsolucion.com/" } as any]).includes("<loc>https://cvsolucion.com/</loc>"));
  assert.ok(buildRobotsTxt({ origin: "https://cvsolucion.com" }).includes("Sitemap: https://cvsolucion.com/sitemap.xml"));
  assert.ok(buildSeoAlternates([{ href: "https://cvsolucion.com/fr", hreflang: "fr" }]).includes('hreflang="fr"'));
  assert.equal(escapeSeoHtml("<script>"), "&lt;script&gt;");
  assert.equal(typeof applySeoDocumentToHead, "function");

  const visitorStorage: any = { items: [] };
  const visitors = createVisitorTrackingStore({
    load: async () => visitorStorage.items,
    save: async (items) => {
      visitorStorage.items = items;
    },
  });
  const visitorId = createVisitorId();
  await visitors.trackVisit({ visitorId, path: "/", locale: "en", userAgent: "Mozilla/5.0 iPhone" });
  await visitors.trackInteraction({ visitorId, type: "chat_open", path: "/" });
  assert.equal((await visitors.getVisitorById(visitorId))?.chatOpens, 1);
  const visitorFetch = createFetchStub({ ok: true, visitor: null });
  const visitorClient = createVisitorTrackingModuleClient({ fetchImpl: visitorFetch.fetchImpl });
  await visitorClient.trackInteraction({ visitorId, type: "cta_click", path: "/" });
  assert.equal(visitorFetch.calls[0]?.url, "/api/analytics/interaction");

  console.log("modules smoke tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

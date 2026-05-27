import type Database from "better-sqlite3";

type SqliteDatabase = Database.Database;
type JsonObject = Record<string, any>;

function text(value: unknown) {
  return typeof value === "string" ? value : null;
}

function requiredText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function integerValue(value: unknown) {
  const next = Number(value);
  return Number.isInteger(next) ? next : 0;
}

function booleanValue(value: unknown) {
  return value ? 1 : 0;
}

function jsonValue(value: unknown) {
  return JSON.stringify(value ?? null);
}

function arrayValue(value: unknown): JsonObject[] {
  return Array.isArray(value) ? value.filter((item): item is JsonObject => Boolean(item) && typeof item === "object") : [];
}

function runMany(db: SqliteDatabase, statements: string[]) {
  db.exec(statements.join("\n"));
}

export function ensureStructuredSchema(db: SqliteDatabase) {
  runMany(db, [
    `CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      email_verified_at TEXT,
      terms_accepted_at TEXT,
      terms_version TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role);`,
    `CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);`,
    `CREATE TABLE IF NOT EXISTS auth_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_type ON auth_tokens(user_id, type);`,
    `CREATE TABLE IF NOT EXISTS auth_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      user_id TEXT,
      email TEXT,
      locale TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events(created_at);`,
    `CREATE INDEX IF NOT EXISTS idx_auth_events_type ON auth_events(type);`,
    `CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      service_type TEXT NOT NULL,
      priority TEXT NOT NULL,
      package_key TEXT,
      currency TEXT,
      date TEXT NOT NULL,
      hour INTEGER NOT NULL,
      name TEXT,
      email TEXT,
      phone TEXT,
      country TEXT,
      country_code TEXT,
      company TEXT,
      locale TEXT,
      status TEXT,
      designer_user_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      payment_status TEXT,
      payment_provider TEXT,
      payment_reference TEXT,
      unit_amount INTEGER,
      refund_status TEXT,
      refund_reference TEXT,
      refund_amount INTEGER,
      refunded_at TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);`,
    `CREATE INDEX IF NOT EXISTS idx_bookings_date_hour ON bookings(date, hour);`,
    `CREATE INDEX IF NOT EXISTS idx_bookings_payment_reference ON bookings(payment_reference);`,
    `CREATE TABLE IF NOT EXISTS blocked_booking_slots (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      hour INTEGER NOT NULL,
      priority TEXT NOT NULL,
      reason TEXT,
      created_by_user_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_booking_slots_unique ON blocked_booking_slots(date, hour, priority);`,
    `CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      source_locale TEXT NOT NULL,
      image_url TEXT,
      published_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS article_translations (
      article_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      PRIMARY KEY(article_id, locale)
    );`,
    `CREATE INDEX IF NOT EXISTS idx_article_translations_locale ON article_translations(locale);`,
    `CREATE TABLE IF NOT EXISTS visitors (
      id TEXT PRIMARY KEY,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      visit_count INTEGER NOT NULL,
      landing_path TEXT,
      last_path TEXT,
      locale TEXT,
      referrer TEXT,
      ip TEXT,
      user_agent TEXT,
      device_type TEXT,
      is_registered INTEGER NOT NULL,
      user_id TEXT,
      email TEXT,
      total_sessions INTEGER NOT NULL,
      total_page_views INTEGER NOT NULL,
      total_duration_ms INTEGER NOT NULL,
      whatsapp_clicks INTEGER NOT NULL,
      email_clicks INTEGER NOT NULL,
      cta_clicks INTEGER NOT NULL,
      chat_opens INTEGER NOT NULL,
      chat_messages INTEGER NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_visitors_last_seen_at ON visitors(last_seen_at);`,
    `CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);`,
    `CREATE TABLE IF NOT EXISTS contact_leads (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      company TEXT,
      message TEXT,
      locale TEXT,
      source TEXT,
      created_at TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_contact_leads_created_at ON contact_leads(created_at);`,
    `CREATE TABLE IF NOT EXISTS customer_profiles (
      user_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT,
      phone TEXT,
      company TEXT,
      country_code TEXT,
      country TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS designer_profiles (
      user_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT,
      title TEXT,
      notes TEXT,
      active INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS designer_tasks (
      id TEXT PRIMARY KEY,
      designer_user_id TEXT NOT NULL,
      booking_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      due_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_designer_tasks_designer_user_id ON designer_tasks(designer_user_id);`,
    `CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      sequence INTEGER NOT NULL,
      booking_id TEXT NOT NULL,
      user_id TEXT,
      email TEXT,
      status TEXT,
      currency TEXT,
      subtotal_amount INTEGER,
      tax_amount INTEGER,
      total_amount INTEGER,
      issued_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);`,
    `CREATE TABLE IF NOT EXISTS stripe_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      processed_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS trainer_profiles (
      user_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT,
      title TEXT,
      notes TEXT,
      active INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS training_enrollments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT,
      program_id TEXT,
      program_title TEXT,
      locale TEXT,
      status TEXT NOT NULL,
      trainer_user_id TEXT,
      payment_reference TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_training_enrollments_user_id ON training_enrollments(user_id);`,
    `CREATE TABLE IF NOT EXISTS training_session_progress (
      id TEXT PRIMARY KEY,
      enrollment_id TEXT NOT NULL,
      module_id TEXT,
      session_id TEXT,
      status TEXT NOT NULL,
      score INTEGER,
      updated_at TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_training_session_progress_enrollment_id ON training_session_progress(enrollment_id);`,
    `CREATE TABLE IF NOT EXISTS catalog_packages (
      id TEXT PRIMARY KEY,
      key TEXT,
      active INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      data_json TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS catalog_training_programs (
      id TEXT PRIMARY KEY,
      key TEXT,
      active INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      data_json TEXT NOT NULL
    );`,
  ]);
}

function replaceAuth(db: SqliteDatabase, data: JsonObject) {
  const users = arrayValue(data.users);
  const sessions = arrayValue(data.sessions);
  const tokens = arrayValue(data.tokens);
  const events = arrayValue(data.events);
  const tx = db.transaction(() => {
    db.exec("DELETE FROM auth_users; DELETE FROM auth_sessions; DELETE FROM auth_tokens; DELETE FROM auth_events;");
    const insertUser = db.prepare(`INSERT INTO auth_users VALUES (@id, @email, @role, @emailVerifiedAt, @termsAcceptedAt, @termsVersion, @createdAt, @updatedAt)`);
    const insertSession = db.prepare(`INSERT INTO auth_sessions VALUES (@id, @userId, @createdAt, @expiresAt)`);
    const insertToken = db.prepare(`INSERT INTO auth_tokens VALUES (@id, @userId, @type, @createdAt, @expiresAt, @usedAt)`);
    const insertEvent = db.prepare(`INSERT INTO auth_events VALUES (@id, @type, @userId, @email, @locale, @ip, @userAgent, @createdAt)`);
    for (const user of users) {
      insertUser.run({
        id: requiredText(user.id),
        email: requiredText(user.email),
        role: requiredText(user.role) || "customer",
        emailVerifiedAt: text(user.emailVerifiedAt),
        termsAcceptedAt: text(user.termsAcceptedAt),
        termsVersion: text(user.termsVersion),
        createdAt: requiredText(user.createdAt),
        updatedAt: requiredText(user.updatedAt || user.createdAt),
      });
    }
    for (const session of sessions) {
      insertSession.run({
        id: requiredText(session.id),
        userId: requiredText(session.userId),
        createdAt: requiredText(session.createdAt),
        expiresAt: requiredText(session.expiresAt),
      });
    }
    for (const token of tokens) {
      insertToken.run({
        id: requiredText(token.id),
        userId: requiredText(token.userId),
        type: requiredText(token.type),
        createdAt: requiredText(token.createdAt),
        expiresAt: requiredText(token.expiresAt),
        usedAt: text(token.usedAt),
      });
    }
    for (const event of events) {
      insertEvent.run({
        id: requiredText(event.id),
        type: requiredText(event.type),
        userId: text(event.userId),
        email: text(event.email),
        locale: text(event.locale),
        ip: text(event.ip),
        userAgent: text(event.userAgent),
        createdAt: requiredText(event.createdAt),
      });
    }
  });
  tx();
}

function replaceBookings(db: SqliteDatabase, data: JsonObject) {
  const bookings = arrayValue(data.bookings);
  const blockedSlots = arrayValue(data.blockedSlots);
  const tx = db.transaction(() => {
    db.exec("DELETE FROM bookings; DELETE FROM blocked_booking_slots;");
    const insertBooking = db.prepare(`INSERT INTO bookings VALUES (
      @id, @userId, @serviceType, @priority, @packageKey, @currency, @date, @hour, @name, @email, @phone,
      @country, @countryCode, @company, @locale, @status, @designerUserId, @createdAt, @updatedAt,
      @paymentStatus, @paymentProvider, @paymentReference, @unitAmount, @refundStatus, @refundReference,
      @refundAmount, @refundedAt
    )`);
    const insertBlocked = db.prepare(`INSERT INTO blocked_booking_slots VALUES (@id, @date, @hour, @priority, @reason, @createdByUserId, @createdAt, @updatedAt)`);
    for (const booking of bookings) {
      insertBooking.run({
        id: requiredText(booking.id),
        userId: text(booking.userId),
        serviceType: requiredText(booking.serviceType),
        priority: requiredText(booking.priority),
        packageKey: text(booking.packageKey),
        currency: text(booking.currency),
        date: requiredText(booking.date),
        hour: integerValue(booking.hour),
        name: text(booking.name),
        email: text(booking.email),
        phone: text(booking.phone),
        country: text(booking.country),
        countryCode: text(booking.countryCode),
        company: text(booking.company),
        locale: text(booking.locale),
        status: text(booking.status),
        designerUserId: text(booking.designerUserId),
        createdAt: requiredText(booking.createdAt),
        updatedAt: requiredText(booking.updatedAt || booking.createdAt),
        paymentStatus: text(booking.paymentStatus),
        paymentProvider: text(booking.paymentProvider),
        paymentReference: text(booking.paymentReference),
        unitAmount: integerValue(booking.unitAmount),
        refundStatus: text(booking.refundStatus),
        refundReference: text(booking.refundReference),
        refundAmount: integerValue(booking.refundAmount),
        refundedAt: text(booking.refundedAt),
      });
    }
    for (const slot of blockedSlots) {
      insertBlocked.run({
        id: requiredText(slot.id),
        date: requiredText(slot.date),
        hour: integerValue(slot.hour),
        priority: requiredText(slot.priority),
        reason: text(slot.reason),
        createdByUserId: text(slot.createdByUserId),
        createdAt: requiredText(slot.createdAt),
        updatedAt: requiredText(slot.updatedAt || slot.createdAt),
      });
    }
  });
  tx();
}

function replaceArticles(db: SqliteDatabase, data: JsonObject) {
  const articles = arrayValue(data.articles);
  const tx = db.transaction(() => {
    db.exec("DELETE FROM articles; DELETE FROM article_translations;");
    const insertArticle = db.prepare(`INSERT INTO articles VALUES (@id, @slug, @sourceLocale, @imageUrl, @publishedAt, @createdAt, @updatedAt)`);
    const insertTranslation = db.prepare(`INSERT INTO article_translations VALUES (@articleId, @locale, @title, @body)`);
    for (const article of articles) {
      const articleId = requiredText(article.id);
      insertArticle.run({
        id: articleId,
        slug: requiredText(article.slug),
        sourceLocale: requiredText(article.sourceLocale),
        imageUrl: text(article.imageUrl),
        publishedAt: text(article.publishedAt),
        createdAt: requiredText(article.createdAt),
        updatedAt: requiredText(article.updatedAt || article.createdAt),
      });
      for (const [locale, translation] of Object.entries(article.translations || {})) {
        if (translation && typeof translation === "object") {
          insertTranslation.run({
            articleId,
            locale,
            title: requiredText((translation as JsonObject).title),
            body: requiredText((translation as JsonObject).body),
          });
        }
      }
    }
  });
  tx();
}

function replaceVisitors(db: SqliteDatabase, data: JsonObject) {
  const visitors = arrayValue(data.visitors);
  const tx = db.transaction(() => {
    db.exec("DELETE FROM visitors;");
    const insertVisitor = db.prepare(`INSERT INTO visitors VALUES (
      @id, @firstSeenAt, @lastSeenAt, @visitCount, @landingPath, @lastPath, @locale, @referrer, @ip,
      @userAgent, @deviceType, @isRegistered, @userId, @email, @totalSessions, @totalPageViews,
      @totalDurationMs, @whatsappClicks, @emailClicks, @ctaClicks, @chatOpens, @chatMessages
    )`);
    for (const visitor of visitors) {
      insertVisitor.run({
        id: requiredText(visitor.id),
        firstSeenAt: requiredText(visitor.firstSeenAt),
        lastSeenAt: requiredText(visitor.lastSeenAt || visitor.firstSeenAt),
        visitCount: integerValue(visitor.visitCount),
        landingPath: text(visitor.landingPath),
        lastPath: text(visitor.lastPath),
        locale: text(visitor.locale),
        referrer: text(visitor.referrer),
        ip: text(visitor.ip),
        userAgent: text(visitor.userAgent),
        deviceType: text(visitor.deviceType),
        isRegistered: booleanValue(visitor.isRegistered),
        userId: text(visitor.userId),
        email: text(visitor.email),
        totalSessions: integerValue(visitor.totalSessions),
        totalPageViews: integerValue(visitor.totalPageViews),
        totalDurationMs: integerValue(visitor.totalDurationMs),
        whatsappClicks: integerValue(visitor.whatsappClicks),
        emailClicks: integerValue(visitor.emailClicks),
        ctaClicks: integerValue(visitor.ctaClicks),
        chatOpens: integerValue(visitor.chatOpens),
        chatMessages: integerValue(visitor.chatMessages),
      });
    }
  });
  tx();
}

function replaceSimpleDocument(db: SqliteDatabase, key: string, data: JsonObject) {
  const tableMap: Record<string, { table: string; listKey: string; mapper: (item: JsonObject) => JsonObject }> = {
    "contact-leads.json": {
      table: "contact_leads",
      listKey: "leads",
      mapper: (item) => ({
        id: requiredText(item.id),
        name: text(item.name),
        email: text(item.email),
        phone: text(item.phone),
        company: text(item.company),
        message: text(item.message),
        locale: text(item.locale),
        source: text(item.source || item.interest),
        created_at: requiredText(item.createdAt),
      }),
    },
    "customer-profiles-db.json": {
      table: "customer_profiles",
      listKey: "profiles",
      mapper: (item) => ({
        user_id: requiredText(item.userId),
        email: requiredText(item.email),
        display_name: text(item.displayName || item.name),
        phone: text(item.phone),
        company: text(item.company),
        country_code: text(item.countryCode),
        country: text(item.country),
        notes: text(item.notes),
        created_at: requiredText(item.createdAt),
        updated_at: requiredText(item.updatedAt || item.createdAt),
      }),
    },
    "stripe-events-db.json": {
      table: "stripe_events",
      listKey: "processed",
      mapper: (item) => ({ id: requiredText(item.id), type: requiredText(item.type), processed_at: requiredText(item.processedAt || item.createdAt) }),
    },
  };
  const config = tableMap[key];
  if (!config) return;

  const rows = arrayValue(data[config.listKey]);
  const columns = rows[0] ? Object.keys(config.mapper(rows[0])) : [];
  const tx = db.transaction(() => {
    db.exec(`DELETE FROM ${config.table};`);
    if (!columns.length) return;
    const insert = db.prepare(`INSERT INTO ${config.table} (${columns.join(", ")}) VALUES (${columns.map((column) => `@${column}`).join(", ")})`);
    for (const row of rows) insert.run(config.mapper(row));
  });
  tx();
}

function replaceDesigners(db: SqliteDatabase, data: JsonObject) {
  const profiles = arrayValue(data.profiles);
  const tasks = arrayValue(data.tasks);
  const tx = db.transaction(() => {
    db.exec("DELETE FROM designer_profiles; DELETE FROM designer_tasks;");
    const insertProfile = db.prepare(`INSERT INTO designer_profiles VALUES (@userId, @email, @displayName, @title, @notes, @active, @createdAt, @updatedAt)`);
    const insertTask = db.prepare(`INSERT INTO designer_tasks VALUES (@id, @designerUserId, @bookingId, @title, @description, @status, @priority, @dueAt, @createdAt, @updatedAt)`);
    for (const profile of profiles) {
      insertProfile.run({
        userId: requiredText(profile.userId),
        email: requiredText(profile.email),
        displayName: text(profile.displayName),
        title: text(profile.title),
        notes: text(profile.notes),
        active: booleanValue(profile.active),
        createdAt: requiredText(profile.createdAt),
        updatedAt: requiredText(profile.updatedAt || profile.createdAt),
      });
    }
    for (const task of tasks) {
      insertTask.run({
        id: requiredText(task.id),
        designerUserId: requiredText(task.designerUserId),
        bookingId: text(task.bookingId),
        title: requiredText(task.title),
        description: text(task.description),
        status: requiredText(task.status),
        priority: requiredText(task.priority),
        dueAt: text(task.dueAt),
        createdAt: requiredText(task.createdAt),
        updatedAt: requiredText(task.updatedAt || task.createdAt),
      });
    }
  });
  tx();
}

function replaceInvoices(db: SqliteDatabase, data: JsonObject) {
  const invoices = arrayValue(data.invoices);
  const tx = db.transaction(() => {
    db.exec("DELETE FROM invoices;");
    const insert = db.prepare(`INSERT INTO invoices VALUES (@id, @sequence, @bookingId, @userId, @email, @status, @currency, @subtotalAmount, @taxAmount, @totalAmount, @issuedAt, @createdAt, @updatedAt)`);
    for (const invoice of invoices) {
      insert.run({
        id: requiredText(invoice.id),
        sequence: integerValue(invoice.sequence),
        bookingId: requiredText(invoice.bookingId),
        userId: text(invoice.userId),
        email: text(invoice.email),
        status: text(invoice.status),
        currency: text(invoice.currency),
        subtotalAmount: integerValue(invoice.subtotalAmount),
        taxAmount: integerValue(invoice.taxAmount),
        totalAmount: integerValue(invoice.totalAmount),
        issuedAt: text(invoice.issuedAt),
        createdAt: requiredText(invoice.createdAt || invoice.issuedAt),
        updatedAt: requiredText(invoice.updatedAt || invoice.createdAt || invoice.issuedAt),
      });
    }
  });
  tx();
}

function replaceTraining(db: SqliteDatabase, data: JsonObject) {
  const profiles = arrayValue(data.trainers || data.trainerProfiles);
  const enrollments = arrayValue(data.enrollments);
  const progress = arrayValue(data.sessionProgress);
  const tx = db.transaction(() => {
    db.exec("DELETE FROM trainer_profiles; DELETE FROM training_enrollments; DELETE FROM training_session_progress;");
    const insertProfile = db.prepare(`INSERT INTO trainer_profiles VALUES (@userId, @email, @displayName, @title, @notes, @active, @createdAt, @updatedAt)`);
    const insertEnrollment = db.prepare(`INSERT INTO training_enrollments VALUES (@id, @userId, @email, @programId, @programTitle, @locale, @status, @trainerUserId, @paymentReference, @createdAt, @updatedAt)`);
    const insertProgress = db.prepare(`INSERT INTO training_session_progress VALUES (@id, @enrollmentId, @moduleId, @sessionId, @status, @score, @updatedAt)`);
    for (const profile of profiles) {
      insertProfile.run({
        userId: requiredText(profile.userId),
        email: requiredText(profile.email),
        displayName: text(profile.displayName),
        title: text(profile.title),
        notes: text(profile.notes),
        active: booleanValue(profile.active),
        createdAt: requiredText(profile.createdAt),
        updatedAt: requiredText(profile.updatedAt || profile.createdAt),
      });
    }
    for (const enrollment of enrollments) {
      insertEnrollment.run({
        id: requiredText(enrollment.id),
        userId: requiredText(enrollment.userId),
        email: text(enrollment.email || enrollment.userEmail),
        programId: text(enrollment.programId || enrollment.programKey),
        programTitle: text(enrollment.programTitle || enrollment.programKey || enrollment.curriculumKey),
        locale: text(enrollment.locale),
        status: requiredText(enrollment.status),
        trainerUserId: text(enrollment.trainerUserId),
        paymentReference: text(enrollment.paymentReference || enrollment.paymentIntentId),
        createdAt: requiredText(enrollment.createdAt),
        updatedAt: requiredText(enrollment.updatedAt || enrollment.createdAt),
      });
    }
    for (const item of progress) {
      insertProgress.run({
        id: requiredText(item.id),
        enrollmentId: requiredText(item.enrollmentId),
        moduleId: text(item.moduleId || item.levelKey),
        sessionId: text(item.sessionId || item.sessionCode),
        status: requiredText(item.status),
        score: item.score === null || item.score === undefined ? null : integerValue(item.score),
        updatedAt: requiredText(item.updatedAt || item.createdAt),
      });
    }
  });
  tx();
}

function replaceCatalog(db: SqliteDatabase, data: JsonObject) {
  const packages = arrayValue(data.packages);
  const programs = arrayValue(data.trainingPrograms);
  const tx = db.transaction(() => {
    db.exec("DELETE FROM catalog_packages; DELETE FROM catalog_training_programs;");
    const insertPackage = db.prepare(`INSERT INTO catalog_packages VALUES (@id, @key, @active, @sortOrder, @dataJson)`);
    const insertProgram = db.prepare(`INSERT INTO catalog_training_programs VALUES (@id, @key, @active, @sortOrder, @dataJson)`);
    for (const item of packages) {
      insertPackage.run({
        id: requiredText(item.id),
        key: text(item.key),
        active: booleanValue(item.active),
        sortOrder: integerValue(item.sortOrder),
        dataJson: jsonValue(item),
      });
    }
    for (const item of programs) {
      insertProgram.run({
        id: requiredText(item.id),
        key: text(item.key),
        active: booleanValue(item.active),
        sortOrder: integerValue(item.sortOrder),
        dataJson: jsonValue(item),
      });
    }
  });
  tx();
}

export function syncStructuredDocument(db: SqliteDatabase, key: string, data: unknown) {
  ensureStructuredSchema(db);
  if (!data || typeof data !== "object") return;
  const document = data as JsonObject;

  switch (key) {
    case "auth-db.json":
      replaceAuth(db, document);
      break;
    case "bookings-db.json":
      replaceBookings(db, document);
      break;
    case "articles-db.json":
      replaceArticles(db, document);
      break;
    case "visitors-db.json":
      replaceVisitors(db, document);
      break;
    case "designers-db.json":
      replaceDesigners(db, document);
      break;
    case "invoices-db.json":
      replaceInvoices(db, document);
      break;
    case "training-db.json":
      replaceTraining(db, document);
      break;
    case "catalog-db.json":
      replaceCatalog(db, document);
      break;
    default:
      replaceSimpleDocument(db, key, document);
      break;
  }
}

export const structuredTableNames = [
  "auth_users",
  "auth_sessions",
  "auth_tokens",
  "auth_events",
  "bookings",
  "blocked_booking_slots",
  "articles",
  "article_translations",
  "visitors",
  "contact_leads",
  "customer_profiles",
  "designer_profiles",
  "designer_tasks",
  "invoices",
  "stripe_events",
  "trainer_profiles",
  "training_enrollments",
  "training_session_progress",
  "catalog_packages",
  "catalog_training_programs",
] as const;

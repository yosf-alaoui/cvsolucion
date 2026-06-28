type BotDecision = {
  automated: boolean;
  allowed: boolean;
  blocked: boolean;
  label: string;
};

const allowedAutomationPatterns: Array<[RegExp, string]> = [
  [/\bgooglebot\b|\badsbot-google\b|\bgoogle-inspectiontool\b/i, "Google"],
  [/\bbingbot\b|\bmsnbot\b/i, "Microsoft Bing"],
  [/\bduckduckbot\b/i, "DuckDuckGo"],
  [/\bapplebot\b/i, "Apple"],
  [/\bfacebookexternalhit\b|\bfacebot\b/i, "Meta preview"],
  [/\btwitterbot\b/i, "X preview"],
  [/\blinkedinbot\b/i, "LinkedIn preview"],
  [/\bwhatsapp\b/i, "WhatsApp preview"],
  [/\bslackbot\b|\bdiscordbot\b|\btelegrambot\b/i, "Chat preview"],
  [/\bpinterestbot\b/i, "Pinterest preview"],
  [/\bahrefsbot\b/i, "Ahrefs"],
];

const blockedAutomationPatterns: Array<[RegExp, string]> = [
  [/\bsemrushbot\b|\bsemrush\b/i, "SemrushBot"],
  [/\bmj12bot\b/i, "MJ12bot"],
  [/\bdotbot\b/i, "DotBot"],
  [/\bblexbot\b/i, "BLEXBot"],
  [/\bbytespider\b/i, "Bytespider"],
  [/\bpetalbot\b/i, "PetalBot"],
  [/\bdataforseobot\b/i, "DataForSEO"],
  [/\bmauibot\b/i, "MauiBot"],
  [/\bserpstatbot\b/i, "SerpstatBot"],
  [/\bseekportbot\b/i, "SeekportBot"],
  [/\bmegaindex\b/i, "MegaIndex"],
  [/\bclaudebot\b|\bgptbot\b|\bchatgpt-user\b|\bccbot\b|\bperplexitybot\b|\bcommoncrawl\b/i, "AI crawler"],
  [/\bsqlmap\b|\bnikto\b|\bnmap\b|\bmasscan\b|\bzgrab\b|\bcensysinspect\b/i, "Scanner"],
];

const genericAutomationPattern =
  /\b(bot|crawler|spider|slurp|scraper|preview|fetcher|unfurl)\b/i;

export function getBotDecision(userAgent?: string | null): BotDecision {
  const ua = String(userAgent || "").trim();
  if (!ua) {
    return { automated: false, allowed: true, blocked: false, label: "Human" };
  }

  const allowed = allowedAutomationPatterns.find(([pattern]) => pattern.test(ua));
  if (allowed) {
    return {
      automated: true,
      allowed: true,
      blocked: false,
      label: allowed[1],
    };
  }

  const blocked = blockedAutomationPatterns.find(([pattern]) => pattern.test(ua));
  if (blocked) {
    return {
      automated: true,
      allowed: false,
      blocked: true,
      label: blocked[1],
    };
  }

  if (genericAutomationPattern.test(ua)) {
    return {
      automated: true,
      allowed: true,
      blocked: false,
      label: "Generic bot",
    };
  }

  return { automated: false, allowed: true, blocked: false, label: "Human" };
}

export function isAutomatedUserAgent(userAgent?: string | null) {
  return getBotDecision(userAgent).automated;
}

export function shouldBlockBotRequest(userAgent?: string | null) {
  return getBotDecision(userAgent).blocked;
}

export function shouldIgnoreVisitorTracking(userAgent?: string | null) {
  return isAutomatedUserAgent(userAgent);
}

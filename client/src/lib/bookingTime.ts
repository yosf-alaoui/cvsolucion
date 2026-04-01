const COUNTRY_TIMEZONE_OPTIONS = [
  { code: "CA", timeZone: "America/Toronto" },
  { code: "US", timeZone: "America/New_York" },
  { code: "MX", timeZone: "America/Mexico_City" },
  { code: "BR", timeZone: "America/Sao_Paulo" },
  { code: "AR", timeZone: "America/Argentina/Buenos_Aires" },
  { code: "CL", timeZone: "America/Santiago" },
  { code: "GB", timeZone: "Europe/London" },
  { code: "IE", timeZone: "Europe/Dublin" },
  { code: "FR", timeZone: "Europe/Paris" },
  { code: "BE", timeZone: "Europe/Brussels" },
  { code: "CH", timeZone: "Europe/Zurich" },
  { code: "DE", timeZone: "Europe/Berlin" },
  { code: "ES", timeZone: "Europe/Madrid" },
  { code: "IT", timeZone: "Europe/Rome" },
  { code: "PT", timeZone: "Europe/Lisbon" },
  { code: "NL", timeZone: "Europe/Amsterdam" },
  { code: "MA", timeZone: "Africa/Casablanca" },
  { code: "DZ", timeZone: "Africa/Algiers" },
  { code: "TN", timeZone: "Africa/Tunis" },
  { code: "EG", timeZone: "Africa/Cairo" },
  { code: "SA", timeZone: "Asia/Riyadh" },
  { code: "AE", timeZone: "Asia/Dubai" },
  { code: "QA", timeZone: "Asia/Qatar" },
  { code: "KW", timeZone: "Asia/Kuwait" },
  { code: "OM", timeZone: "Asia/Muscat" },
  { code: "JO", timeZone: "Asia/Amman" },
  { code: "LB", timeZone: "Asia/Beirut" },
  { code: "TR", timeZone: "Europe/Istanbul" },
  { code: "IN", timeZone: "Asia/Kolkata" },
  { code: "PK", timeZone: "Asia/Karachi" },
  { code: "SG", timeZone: "Asia/Singapore" },
  { code: "AU", timeZone: "Australia/Sydney" },
  { code: "NZ", timeZone: "Pacific/Auckland" },
  { code: "ZA", timeZone: "Africa/Johannesburg" },
] as const;

export type BookingCountryOption = {
  code: string;
  timeZone: string;
  label: string;
};

function localeTag(locale: string) {
  if (locale === "ar") return "ar";
  if (locale === "fr") return "fr-CA";
  return "en-CA";
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getDisplayNames(locale: string) {
  return new Intl.DisplayNames([localeTag(locale)], { type: "region" });
}

export function getBookingCountryOptions(locale: string): BookingCountryOption[] {
  const names = getDisplayNames(locale);
  return COUNTRY_TIMEZONE_OPTIONS.map((option) => ({
    code: option.code,
    timeZone: option.timeZone,
    label: names.of(option.code) || option.code,
  }));
}

export function getBookingCountryLabel(code: string, locale: string) {
  return getBookingCountryOptions(locale).find((option) => option.code === code)?.label || code;
}

export function getBookingTimeZone(countryCode: string | null | undefined) {
  return COUNTRY_TIMEZONE_OPTIONS.find((option) => option.code === countryCode)?.timeZone || "America/Toronto";
}

export function findBookingCountryCode(value: string | null | undefined) {
  const normalized = normalizeText(value || "");
  if (!normalized) return null;

  const byCode = COUNTRY_TIMEZONE_OPTIONS.find((option) => option.code.toLowerCase() === normalized);
  if (byCode) return byCode.code;

  for (const locale of ["en", "fr", "ar"]) {
    const options = getBookingCountryOptions(locale);
    const matched = options.find((option) => normalizeText(option.label) === normalized);
    if (matched) return matched.code;
  }

  return null;
}

export function guessBookingCountryCode(value: string | null | undefined) {
  const stored = findBookingCountryCode(value);
  if (stored) return stored;

  if (typeof window !== "undefined") {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const matched = COUNTRY_TIMEZONE_OPTIONS.find((option) => option.timeZone === browserTimeZone);
    if (matched) return matched.code;
  }

  return "CA";
}

function getDateParts(utcStart: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(utcStart));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
  };
}

export function getBookingLocalDateKey(utcStart: string, timeZone: string) {
  return getDateParts(utcStart, timeZone).dateKey;
}

export function formatBookingDate(utcStart: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(utcStart));
}

export function formatBookingTime(utcStart: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(utcStart));
}

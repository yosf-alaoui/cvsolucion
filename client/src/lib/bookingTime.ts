import { getAllCountries, getCountry, getCountryForTimezone } from "countries-and-timezones";

type RegionConfig = {
  code: string;
  timeZone: string;
  labels: {
    en: string;
    fr: string;
    ar: string;
  };
};

type CountryConfig = {
  code: string;
  defaultTimeZone: string;
  regions: RegionConfig[];
};

const DETAILED_COUNTRY_CONFIG: CountryConfig[] = [
  {
    code: "CA",
    defaultTimeZone: "America/Toronto",
    regions: [
      { code: "CA-QC", timeZone: "America/Toronto", labels: { en: "Quebec", fr: "Quebec", ar: "Quebec" } },
      { code: "CA-ON", timeZone: "America/Toronto", labels: { en: "Ontario", fr: "Ontario", ar: "Ontario" } },
      { code: "CA-NB", timeZone: "America/Moncton", labels: { en: "New Brunswick", fr: "Nouveau-Brunswick", ar: "New Brunswick" } },
      { code: "CA-NS", timeZone: "America/Halifax", labels: { en: "Nova Scotia", fr: "Nouvelle-Ecosse", ar: "Nova Scotia" } },
      { code: "CA-PE", timeZone: "America/Halifax", labels: { en: "Prince Edward Island", fr: "Ile-du-Prince-Edouard", ar: "PEI" } },
      { code: "CA-NL", timeZone: "America/St_Johns", labels: { en: "Newfoundland and Labrador", fr: "Terre-Neuve-et-Labrador", ar: "Newfoundland" } },
      { code: "CA-MB", timeZone: "America/Winnipeg", labels: { en: "Manitoba", fr: "Manitoba", ar: "Manitoba" } },
      { code: "CA-SK", timeZone: "America/Regina", labels: { en: "Saskatchewan", fr: "Saskatchewan", ar: "Saskatchewan" } },
      { code: "CA-AB", timeZone: "America/Edmonton", labels: { en: "Alberta", fr: "Alberta", ar: "Alberta" } },
      { code: "CA-BC", timeZone: "America/Vancouver", labels: { en: "British Columbia", fr: "Colombie-Britannique", ar: "BC" } },
      { code: "CA-YT", timeZone: "America/Whitehorse", labels: { en: "Yukon", fr: "Yukon", ar: "Yukon" } },
      { code: "CA-NT", timeZone: "America/Yellowknife", labels: { en: "Northwest Territories", fr: "Territoires du Nord-Ouest", ar: "NWT" } },
      { code: "CA-NU", timeZone: "America/Iqaluit", labels: { en: "Nunavut", fr: "Nunavut", ar: "Nunavut" } },
    ],
  },
  {
    code: "US",
    defaultTimeZone: "America/New_York",
    regions: [
      { code: "US-ET", timeZone: "America/New_York", labels: { en: "Eastern", fr: "Est", ar: "Eastern" } },
      { code: "US-CT", timeZone: "America/Chicago", labels: { en: "Central (Chicago)", fr: "Centre (Chicago)", ar: "Central (Chicago)" } },
      { code: "US-MT", timeZone: "America/Denver", labels: { en: "Mountain (Denver)", fr: "Montagne (Denver)", ar: "Mountain (Denver)" } },
      { code: "US-PT", timeZone: "America/Los_Angeles", labels: { en: "Pacific (Los Angeles)", fr: "Pacifique (Los Angeles)", ar: "Pacific (LA)" } },
      { code: "US-AK", timeZone: "America/Anchorage", labels: { en: "Alaska", fr: "Alaska", ar: "Alaska" } },
      { code: "US-HI", timeZone: "Pacific/Honolulu", labels: { en: "Hawaii", fr: "Hawaii", ar: "Hawaii" } },
    ],
  },
  { code: "MX", defaultTimeZone: "America/Mexico_City", regions: [{ code: "MX-DEFAULT", timeZone: "America/Mexico_City", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "BR", defaultTimeZone: "America/Sao_Paulo", regions: [{ code: "BR-DEFAULT", timeZone: "America/Sao_Paulo", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "AR", defaultTimeZone: "America/Argentina/Buenos_Aires", regions: [{ code: "AR-DEFAULT", timeZone: "America/Argentina/Buenos_Aires", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "CL", defaultTimeZone: "America/Santiago", regions: [{ code: "CL-DEFAULT", timeZone: "America/Santiago", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "GB", defaultTimeZone: "Europe/London", regions: [{ code: "GB-DEFAULT", timeZone: "Europe/London", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "IE", defaultTimeZone: "Europe/Dublin", regions: [{ code: "IE-DEFAULT", timeZone: "Europe/Dublin", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "FR", defaultTimeZone: "Europe/Paris", regions: [{ code: "FR-DEFAULT", timeZone: "Europe/Paris", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "BE", defaultTimeZone: "Europe/Brussels", regions: [{ code: "BE-DEFAULT", timeZone: "Europe/Brussels", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "CH", defaultTimeZone: "Europe/Zurich", regions: [{ code: "CH-DEFAULT", timeZone: "Europe/Zurich", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "DE", defaultTimeZone: "Europe/Berlin", regions: [{ code: "DE-DEFAULT", timeZone: "Europe/Berlin", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "ES", defaultTimeZone: "Europe/Madrid", regions: [{ code: "ES-DEFAULT", timeZone: "Europe/Madrid", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "IT", defaultTimeZone: "Europe/Rome", regions: [{ code: "IT-DEFAULT", timeZone: "Europe/Rome", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "PT", defaultTimeZone: "Europe/Lisbon", regions: [{ code: "PT-DEFAULT", timeZone: "Europe/Lisbon", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "NL", defaultTimeZone: "Europe/Amsterdam", regions: [{ code: "NL-DEFAULT", timeZone: "Europe/Amsterdam", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "MA", defaultTimeZone: "Africa/Casablanca", regions: [{ code: "MA-DEFAULT", timeZone: "Africa/Casablanca", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "DZ", defaultTimeZone: "Africa/Algiers", regions: [{ code: "DZ-DEFAULT", timeZone: "Africa/Algiers", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "TN", defaultTimeZone: "Africa/Tunis", regions: [{ code: "TN-DEFAULT", timeZone: "Africa/Tunis", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "EG", defaultTimeZone: "Africa/Cairo", regions: [{ code: "EG-DEFAULT", timeZone: "Africa/Cairo", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "SA", defaultTimeZone: "Asia/Riyadh", regions: [{ code: "SA-DEFAULT", timeZone: "Asia/Riyadh", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "AE", defaultTimeZone: "Asia/Dubai", regions: [{ code: "AE-DEFAULT", timeZone: "Asia/Dubai", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "QA", defaultTimeZone: "Asia/Qatar", regions: [{ code: "QA-DEFAULT", timeZone: "Asia/Qatar", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "KW", defaultTimeZone: "Asia/Kuwait", regions: [{ code: "KW-DEFAULT", timeZone: "Asia/Kuwait", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "OM", defaultTimeZone: "Asia/Muscat", regions: [{ code: "OM-DEFAULT", timeZone: "Asia/Muscat", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "JO", defaultTimeZone: "Asia/Amman", regions: [{ code: "JO-DEFAULT", timeZone: "Asia/Amman", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "LB", defaultTimeZone: "Asia/Beirut", regions: [{ code: "LB-DEFAULT", timeZone: "Asia/Beirut", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "TR", defaultTimeZone: "Europe/Istanbul", regions: [{ code: "TR-DEFAULT", timeZone: "Europe/Istanbul", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "IN", defaultTimeZone: "Asia/Kolkata", regions: [{ code: "IN-DEFAULT", timeZone: "Asia/Kolkata", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "PK", defaultTimeZone: "Asia/Karachi", regions: [{ code: "PK-DEFAULT", timeZone: "Asia/Karachi", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "SG", defaultTimeZone: "Asia/Singapore", regions: [{ code: "SG-DEFAULT", timeZone: "Asia/Singapore", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "AU", defaultTimeZone: "Australia/Sydney", regions: [{ code: "AU-DEFAULT", timeZone: "Australia/Sydney", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "NZ", defaultTimeZone: "Pacific/Auckland", regions: [{ code: "NZ-DEFAULT", timeZone: "Pacific/Auckland", labels: { en: "National", fr: "National", ar: "National" } }] },
  { code: "ZA", defaultTimeZone: "Africa/Johannesburg", regions: [{ code: "ZA-DEFAULT", timeZone: "Africa/Johannesburg", labels: { en: "National", fr: "National", ar: "National" } }] },
];

const ALL_COUNTRY_CODES = Object.keys(getAllCountries()).sort();

function nationalLabel(language: "en" | "fr" | "ar") {
  if (language === "fr") return "National";
  if (language === "ar") return "وطني";
  return "National";
}

export type BookingCountryOption = {
  code: string;
  label: string;
};

export type BookingRegionOption = {
  code: string;
  countryCode: string;
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

function getCountryConfig(countryCode: string | null | undefined) {
  return DETAILED_COUNTRY_CONFIG.find((country) => country.code === countryCode);
}

export function getBookingCountryOptions(locale: string): BookingCountryOption[] {
  const names = getDisplayNames(locale);
  return ALL_COUNTRY_CODES.map((code) => ({
    code,
    label: names.of(code) || getCountry(code)?.name || code,
  })).sort((a, b) => a.label.localeCompare(b.label, localeTag(locale)));
}

export function getBookingCountryLabel(code: string, locale: string) {
  return getBookingCountryOptions(locale).find((country) => country.code === code)?.label || code;
}

export function getBookingRegionOptions(countryCode: string, locale: string): BookingRegionOption[] {
  const country = getCountryConfig(countryCode);
  const language = locale === "ar" ? "ar" : locale === "fr" ? "fr" : "en";
  if (!country) {
    const defaultTimeZone = getCountry(countryCode)?.timezones?.[0] || "America/Toronto";
    return [{
      code: `${countryCode}-DEFAULT`,
      countryCode,
      timeZone: defaultTimeZone,
      label: nationalLabel(language),
    }];
  }

  return country.regions.map((region) => ({
    code: region.code,
    countryCode: country.code,
    timeZone: region.timeZone,
    label: region.labels[language],
  }));
}

export function getBookingRegionLabel(countryCode: string, regionCode: string | null | undefined, locale: string) {
  if (!regionCode) return "";
  return getBookingRegionOptions(countryCode, locale).find((region) => region.code === regionCode)?.label || regionCode;
}

export function getBookingTimeZone(countryCode: string | null | undefined, regionCode?: string | null) {
  const country = getCountryConfig(countryCode);
  if (!country) return getCountry(countryCode || "")?.timezones?.[0] || "America/Toronto";

  if (regionCode) {
    const region = country.regions.find((entry) => entry.code === regionCode);
    if (region) return region.timeZone;
  }

  return country.defaultTimeZone;
}

export function findBookingCountryCode(value: string | null | undefined) {
  const normalized = normalizeText(value || "");
  if (!normalized) return null;

  const code = normalized.toUpperCase();
  const byCode = getCountry(code);
  if (byCode) return byCode.id;

  for (const locale of ["en", "fr", "ar"]) {
    const options = getBookingCountryOptions(locale);
    const matched = options.find((country) => normalizeText(country.label) === normalized);
    if (matched) return matched.code;
  }

  return null;
}

export function guessBookingCountryCode(value: string | null | undefined) {
  const stored = findBookingCountryCode(value);
  if (stored) return stored;

  if (typeof window !== "undefined") {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const detailedMatch = DETAILED_COUNTRY_CONFIG.find((country) =>
      country.regions.some((region) => region.timeZone === browserTimeZone)
    );
    if (detailedMatch) return detailedMatch.code;

    const matched = getCountryForTimezone(browserTimeZone);
    if (matched?.id) return matched.id;
  }

  return "CA";
}

export function guessBookingRegionCode(countryCode: string, value: string | null | undefined) {
  const country = getCountryConfig(countryCode);
  if (!country) return "";

  const normalized = normalizeText(value || "");
  if (normalized) {
    const byCode = country.regions.find((region) => normalizeText(region.code) === normalized);
    if (byCode) return byCode.code;

    for (const language of ["en", "fr", "ar"] as const) {
      const matchedByLabel = country.regions.find((region) => normalizeText(region.labels[language]) === normalized);
      if (matchedByLabel) return matchedByLabel.code;
    }
  }

  if (typeof window !== "undefined") {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const byZone = country.regions.find((region) => region.timeZone === browserTimeZone);
    if (byZone) return byZone.code;
  }

  return country.regions[0]?.code || "";
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

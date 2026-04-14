import { getCountries, getCountryCallingCode, isSupportedCountry, type CountryCode } from "libphonenumber-js";
import { getBookingCountryLabel } from "@/lib/bookingTime";

export type PhoneCountryOption = {
  code: string;
  callingCode: string;
  label: string;
};

function toSupportedCountryCode(countryCode: string | null | undefined): CountryCode | null {
  const normalized = String(countryCode || "").trim().toUpperCase();
  return isSupportedCountry(normalized) ? normalized : null;
}

export function getPhoneCountryOptions(locale: string): PhoneCountryOption[] {
  return getCountries()
    .map((code) => {
      const callingCode = getCountryCallingCode(code);
      const countryLabel = getBookingCountryLabel(code, locale);
      return {
        code,
        callingCode,
        label: `${countryLabel} +${callingCode}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA"));
}

export function getDefaultPhoneCountryCode(countryCode: string | null | undefined) {
  return toSupportedCountryCode(countryCode) || "CA";
}

export function getPhoneCallingCode(countryCode: string | null | undefined) {
  const supportedCountryCode = getDefaultPhoneCountryCode(countryCode);
  return getCountryCallingCode(supportedCountryCode);
}

export function splitInternationalPhone(phone: string | null | undefined, fallbackCountryCode: string | null | undefined) {
  const fallback = getDefaultPhoneCountryCode(fallbackCountryCode);
  const trimmed = String(phone || "").trim();
  if (!trimmed.startsWith("+")) {
    return {
      phoneCountryCode: fallback,
      localPhone: trimmed,
    };
  }

  const digits = trimmed.replace(/[^\d]/g, "");
  const matchingCountry = getCountries()
    .map((code) => ({ code, callingCode: getCountryCallingCode(code) }))
    .sort((a, b) => b.callingCode.length - a.callingCode.length)
    .find((option) => digits.startsWith(option.callingCode));

  if (!matchingCountry) {
    return {
      phoneCountryCode: fallback,
      localPhone: trimmed.replace(/^\+/, "").trim(),
    };
  }

  return {
    phoneCountryCode: matchingCountry.code,
    localPhone: digits.slice(matchingCountry.callingCode.length),
  };
}

export function buildInternationalPhone(phoneCountryCode: string | null | undefined, localPhone: string) {
  const trimmed = localPhone.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  return `+${getPhoneCallingCode(phoneCountryCode)} ${trimmed}`;
}

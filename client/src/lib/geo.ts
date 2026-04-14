export type GeoCountryResponse = {
  countryCode: string | null;
  source: "profile" | "request" | "unknown";
};

export async function getDetectedCountry() {
  const response = await fetch("/api/geo/country", {
    method: "GET",
    credentials: "include",
  });
  const data = (await response.json().catch(() => ({}))) as Partial<GeoCountryResponse> & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Country detection failed.");
  }
  return {
    countryCode: typeof data.countryCode === "string" ? data.countryCode : null,
    source: data.source || "unknown",
  } satisfies GeoCountryResponse;
}

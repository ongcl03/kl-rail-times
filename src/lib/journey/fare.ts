import type { JourneyFare, JourneyFareRange } from "./types";
import { isKtmKomuterStop, isKtmNorthernStop, isKtmEtsStop, lookupKtmFare } from "./ktm-fares";
import { lookupEtsFareRange, getNorthernKomuterFareLink } from "./ets-fares";

const FARE_API_BASE = "https://jp-web.myrapid.com.my/endpoint/geoservice/fares";

async function fetchRapidKLFare(
  fromStopId: string,
  toStopId: string
): Promise<JourneyFare | null> {
  try {
    const url = `${FARE_API_BASE}?agency=rapidkl&from=${encodeURIComponent(fromStopId)}&to=${encodeURIComponent(toStopId)}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.fares) return null;

    return {
      cash: data.fares.cash,
      cashless: data.fares.cashless,
      concession: data.fares.consession, // API typo: "consession"
    };
  } catch {
    return null;
  }
}

export interface FareResult {
  fare?: JourneyFare;
  fareRange?: JourneyFareRange;
}

export async function fetchFare(
  fromStopId: string,
  toStopId: string
): Promise<JourneyFare | null> {
  // Legacy function — kept for backward compat, delegates to fetchJourneyFare
  const result = await fetchJourneyFare(fromStopId, toStopId);
  return result.fare ?? null;
}

export async function fetchJourneyFare(
  fromStopId: string,
  toStopId: string
): Promise<FareResult> {
  const fromKtmKomuter = isKtmKomuterStop(fromStopId);
  const toKtmKomuter = isKtmKomuterStop(toStopId);
  const fromNorthern = isKtmNorthernStop(fromStopId);
  const toNorthern = isKtmNorthernStop(toStopId);
  const fromEts = isKtmEtsStop(fromStopId);
  const toEts = isKtmEtsStop(toStopId);

  // Both stops are KTM Komuter (KL/Klang Valley)
  if (fromKtmKomuter && toKtmKomuter) {
    const fare = lookupKtmFare(fromStopId, toStopId);
    return { fare: fare ?? undefined };
  }

  // Either stop is Northern/Ipoh Komuter — link to MTREC
  if (fromNorthern || toNorthern) {
    return { fareRange: getNorthernKomuterFareLink() };
  }

  // ETS journey — show fare range
  if (fromEts && toEts && !fromKtmKomuter && !toKtmKomuter) {
    const range = lookupEtsFareRange(fromStopId, toStopId);
    return { fareRange: range ?? undefined };
  }

  // RapidKL (default)
  const fare = await fetchRapidKLFare(fromStopId, toStopId);
  return { fare: fare ?? undefined };
}

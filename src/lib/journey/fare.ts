import type { JourneyFare } from "./types";

const FARE_API_BASE = "https://jp-web.myrapid.com.my/endpoint/geoservice/fares";

export async function fetchFare(
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

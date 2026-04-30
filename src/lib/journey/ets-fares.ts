export interface FareRange {
  min: string;
  max: string;
  bookingUrl: string;
  service: string;
}

const KTMB_BOOKING_URL = "https://online.ktmb.com.my/";
const MTREC_URL = "https://www.mtrec.name.my/travelguide.html";

// ETS base fare ranges (Gold class, adult, approximate)
// Source: KTMB booking site, subject to dynamic pricing
const ETS_FARES: Record<string, { min: number; max: number }> = {
  // From KL Sentral (19100)
  "9000-19100": { min: 25, max: 46 },   // KL Sentral - Ipoh
  "100-19100": { min: 59, max: 79 },    // KL Sentral - Butterworth
  "47300-19100": { min: 76, max: 102 }, // KL Sentral - Padang Besar
  "19100-41400": { min: 47, max: 67 },  // KL Sentral - Sungai Petani
  "19100-44000": { min: 62, max: 84 },  // KL Sentral - Alor Setar
  "15200-19100": { min: 12, max: 20 },  // KL Sentral - Tanjung Malim (ETS)
  "17800-19100": { min: 8, max: 14 },   // KL Sentral - Rawang (ETS)
  // From Ipoh (9000)
  "100-9000": { min: 35, max: 50 },     // Ipoh - Butterworth
  "9000-47300": { min: 52, max: 72 },   // Ipoh - Padang Besar
  "9000-15200": { min: 15, max: 28 },   // Ipoh - Tanjung Malim
  // From Butterworth (100)
  "100-47300": { min: 18, max: 28 },    // Butterworth - Padang Besar
  "100-41400": { min: 8, max: 15 },     // Butterworth - Sungai Petani
};

function fareKey(a: string, b: string): string {
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);
  return numA <= numB ? `${a}-${b}` : `${b}-${a}`;
}

export function lookupEtsFareRange(
  fromStopId: string,
  toStopId: string
): FareRange | null {
  const key = fareKey(fromStopId, toStopId);
  const range = ETS_FARES[key];

  if (range) {
    return {
      min: range.min.toFixed(0),
      max: range.max.toFixed(0),
      bookingUrl: KTMB_BOOKING_URL,
      service: "ETS",
    };
  }

  return {
    min: "",
    max: "",
    bookingUrl: KTMB_BOOKING_URL,
    service: "ETS",
  };
}

export function getNorthernKomuterFareLink(): FareRange {
  return {
    min: "",
    max: "",
    bookingUrl: MTREC_URL,
    service: "KTM Komuter",
  };
}

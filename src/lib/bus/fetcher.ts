import AdmZip from "adm-zip";
import type { BusOperator } from "./types";

const BASE_URL = "https://api.data.gov.my/gtfs-static/prasarana?category=";

async function fetchZip(url: string): Promise<Map<string, string>> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch GTFS static ${response.status} from ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(buffer);
  const files = new Map<string, string>();
  for (const entry of zip.getEntries()) {
    if (entry.entryName.endsWith(".txt")) {
      files.set(entry.entryName, entry.getData().toString("utf-8"));
    }
  }
  return files;
}

export async function fetchBusStaticZip(operator: BusOperator): Promise<Map<string, string>> {
  return fetchZip(`${BASE_URL}${operator}`);
}

export const BUS_REALTIME_URLS: Record<BusOperator, string> = {
  "rapid-bus-kl":
    "https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana?category=rapid-bus-kl",
  "rapid-bus-mrtfeeder":
    "https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana?category=rapid-bus-mrtfeeder",
  "rapid-bus-penang":
    "https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana?category=rapid-bus-penang",
  "rapid-bus-kuantan":
    "https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana?category=rapid-bus-kuantan",
};

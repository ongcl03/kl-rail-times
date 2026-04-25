import AdmZip from "adm-zip";

const GTFS_PRASARANA_URL =
  "https://api.data.gov.my/gtfs-static/prasarana?category=rapid-rail-kl";

const GTFS_KTMB_URL =
  "https://api.data.gov.my/gtfs-static/ktmb";

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

export async function fetchGTFSStaticZip(): Promise<Map<string, string>> {
  return fetchZip(GTFS_PRASARANA_URL);
}

export async function fetchKTMBStaticZip(): Promise<Map<string, string>> {
  return fetchZip(GTFS_KTMB_URL);
}

import AdmZip from "adm-zip";

const GTFS_STATIC_URL =
  "https://api.data.gov.my/gtfs-static/prasarana?category=rapid-rail-kl";

export async function fetchGTFSStaticZip(): Promise<Map<string, string>> {
  const response = await fetch(GTFS_STATIC_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch GTFS static  ${response.status}`);
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

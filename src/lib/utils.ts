const TZ = "Asia/Kuala_Lumpur";

export function getMalaysiaTime(): Date {
  const str = new Date().toLocaleString("en-US", { timeZone: TZ });
  return new Date(str);
}

export function getMalaysiaTimeString(): string {
  const d = getMalaysiaTime();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function getMalaysiaDayOfWeek(): number {
  return getMalaysiaTime().getDay(); // 0=Sun, 6=Sat
}

export function getMalaysiaDateString(): string {
  const d = getMalaysiaTime();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** Parse GTFS time string (can be >24:00:00) to total seconds since midnight */
export function parseGTFSTime(time: string): number {
  const parts = time.trim().split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parseInt(parts[2] || "0", 10);
  return h * 3600 + m * 60 + s;
}

/** Get current Malaysia time as seconds since midnight */
export function getCurrentSeconds(): number {
  const d = getMalaysiaTime();
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

/** Format seconds since midnight to "HH:MM" */
export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600) % 24;
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

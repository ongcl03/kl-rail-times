export interface InterchangeGroup {
  name: string;
  stops: string[];
  walkMinutes: number;
}

// AG/PH shared trunk stations (same physical platform, 0 transfer time)
const AG_PH_SHARED: InterchangeGroup[] = [
  { name: "Sentul Timur", stops: ["AG1", "SP1"], walkMinutes: 0 },
  { name: "Sentul", stops: ["AG2", "SP2"], walkMinutes: 0 },
  { name: "PWTC", stops: ["AG4", "SP4"], walkMinutes: 0 },
  { name: "Sultan Ismail", stops: ["AG5", "SP5"], walkMinutes: 0 },
  { name: "Bandaraya - UOB", stops: ["AG6", "SP6"], walkMinutes: 0 },
  { name: "Plaza Rakyat", stops: ["AG8", "SP8"], walkMinutes: 0 },
  { name: "Pudu", stops: ["AG10", "SP10"], walkMinutes: 0 },
];

// Cross-line interchanges (walking transfer between platforms)
const CROSS_LINE: InterchangeGroup[] = [
  { name: "Titiwangsa", stops: ["AG3", "SP3", "PY17", "MR11"], walkMinutes: 5 },
  { name: "Masjid Jamek", stops: ["AG7", "SP7", "KJ13"], walkMinutes: 4 },
  { name: "Hang Tuah", stops: ["AG9", "SP9", "MR4"], walkMinutes: 4 },
  { name: "Chan Sow Lin", stops: ["AG11", "SP11", "PY24"], walkMinutes: 4 },
  { name: "Maluri", stops: ["AG13", "KG22"], walkMinutes: 5 },
  { name: "KL Sentral", stops: ["KJ15", "MR1", "19100"], walkMinutes: 5 },
  { name: "Pasar Seni", stops: ["KJ14", "KG16"], walkMinutes: 4 },
  { name: "Ampang Park", stops: ["KJ9", "PY20"], walkMinutes: 4 },
  { name: "Putra Heights", stops: ["KJ37", "SP31"], walkMinutes: 3 },
  { name: "Kwasa Damansara", stops: ["KG04", "PY01"], walkMinutes: 4 },
  { name: "Bukit Bintang", stops: ["KG18A", "MR6"], walkMinutes: 5 },
  { name: "Tun Razak Exchange", stops: ["KG20", "PY23"], walkMinutes: 4 },
  { name: "Sungai Besi", stops: ["SP16", "PY29"], walkMinutes: 4 },
];

// KTM ↔ Prasarana interchanges
const KTM_PRASARANA: InterchangeGroup[] = [
  { name: "Bank Negara / PWTC", stops: ["18900", "AG4", "SP4"], walkMinutes: 5 },
  { name: "KTM KL / Pasar Seni", stops: ["19000", "KJ14", "KG16"], walkMinutes: 5 },
  { name: "Bandar Tasik Selatan", stops: ["19600", "SP15"], walkMinutes: 3 },
  { name: "Salak Selatan", stops: ["19400", "SP13"], walkMinutes: 5 },
  { name: "Sungai Buloh", stops: ["18500", "PY04"], walkMinutes: 4 },
  { name: "Subang Jaya", stops: ["53700", "KJ28"], walkMinutes: 3 },
  { name: "Kajang", stops: ["20400", "KG35"], walkMinutes: 5 },
];

export const INTERCHANGE_GROUPS: InterchangeGroup[] = [
  ...AG_PH_SHARED,
  ...CROSS_LINE,
  ...KTM_PRASARANA,
];

/** Lookup: stopId -> interchange name (if any) */
export function getInterchangeName(stopId: string): string | null {
  for (const group of INTERCHANGE_GROUPS) {
    if (group.stops.includes(stopId)) return group.name;
  }
  return null;
}

/**
 * CivicSolve AI — Problem Intelligence engine.
 *
 * The engine is provider-configurable (AI_API_KEY / AI_API_BASE_URL / AI_MODEL).
 * If no provider is configured (or the call fails), a deterministic fallback
 * analysis engine is used so the prototype always works offline.
 */

export const CATEGORIES = [
  "Water",
  "Roads",
  "Waste Management",
  "Sanitation",
  "Electricity",
  "Transportation",
  "Education",
  "Agriculture",
  "Environment",
  "Public Safety",
  "Infrastructure",
  "Digital Services",
  "Healthcare",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type AnalysisInput = {
  title: string;
  description: string;
  category: string;
  location: string;
  severity: string;
  durationDays: number;
  peopleAffected: number;
  votes?: number;
};

export type PriorityFactor = { label: string; score: number; max: number };

export type AiAnalysis = {
  category: string;
  subcategory: string;
  summary: string;
  impact: string;
  severityScore: number;
  urgencyScore: number;
  peopleScore: number;
  durationScore: number;
  safetyScore: number;
  geoScore: number;
  votesScore: number;
  priorityScore: number;
  priorityLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  requiredExpertise: string[];
  keywords: string[];
  confidence: number;
  engine: string;
  factors: PriorityFactor[];
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Water: ["water", "tap", "borewell", "pipeline", "supply", "drinking", "tanker", "shortage", "leak"],
  Roads: ["road", "pothole", "potholes", "street", "highway", "asphalt", "footpath", "speedbreaker"],
  "Waste Management": ["garbage", "waste", "trash", "dump", "dustbin", "segregation", "litter", "landfill"],
  Sanitation: ["toilet", "sewage", "drain", "drainage", "sanitation", "manhole", "open defecation"],
  Electricity: ["electricity", "power", "streetlight", "transformer", "voltage", "outage", "current", "lamp"],
  Transportation: ["bus", "transport", "auto", "metro", "traffic", "commute", "railway", "parking"],
  Education: ["school", "college", "student", "teacher", "classroom", "library", "education", "dropout"],
  Agriculture: ["farm", "farmer", "crop", "irrigation", "soil", "pesticide", "harvest", "agriculture"],
  Environment: ["pollution", "tree", "air quality", "lake", "river", "environment", "smoke", "noise"],
  "Public Safety": ["accident", "safety", "crime", "unsafe", "danger", "theft", "fire", "harassment"],
  Infrastructure: ["bridge", "building", "construction", "infrastructure", "collapse", "culvert", "flood"],
  "Digital Services": ["internet", "network", "portal", "online", "digital", "wifi", "server", "app"],
  Healthcare: ["hospital", "clinic", "medicine", "ambulance", "doctor", "health"],
};

const SUBCATEGORY_RULES: { match: string[]; category: string; subcategory: string; expertise: string[] }[] = [
  { match: ["pothole", "road damage", "damaged road", "accident", "road safety"], category: "Infrastructure", subcategory: "Road Safety", expertise: ["Civil Engineering", "Transportation", "Road Safety"] },
  { match: ["water shortage", "no water", "drinking water", "tanker", "borewell"], category: "Water", subcategory: "Water Supply", expertise: ["Environmental Engineering", "Hydrology", "Water Resource Management"] },
  { match: ["garbage", "waste", "dump", "segregation"], category: "Waste Management", subcategory: "Solid Waste Handling", expertise: ["Environmental Science", "Waste Management", "Community Design"] },
  { match: ["sewage", "drain", "toilet", "sanitation"], category: "Sanitation", subcategory: "Drainage & Sewage", expertise: ["Civil Engineering", "Public Health", "Environmental Engineering"] },
  { match: ["street lighting", "streetlight", "street light", "lighting", "streetlights", "dark street"], category: "Public Safety", subcategory: "Street Lighting", expertise: ["Electrical", "IoT", "Street Lighting"] },
  { match: ["power cut", "transformer", "outage", "voltage", "blackout"], category: "Electricity", subcategory: "Power Distribution", expertise: ["Electrical Engineering", "IoT", "Energy Systems"] },
  { match: ["bus", "transport", "commute", "traffic"], category: "Transportation", subcategory: "Public Transit", expertise: ["Transportation Engineering", "Data Analytics", "Urban Planning"] },
  { match: ["irrigation", "crop", "farmer", "soil"], category: "Agriculture", subcategory: "Smart Farming", expertise: ["Agricultural Engineering", "IoT", "Data Science"] },
  { match: ["flood", "waterlogging", "bridge", "collapse"], category: "Infrastructure", subcategory: "Urban Flooding & Structures", expertise: ["Civil Engineering", "Hydrology", "GIS"] },
  { match: ["pollution", "air quality", "smoke", "noise"], category: "Environment", subcategory: "Pollution Control", expertise: ["Environmental Science", "Sensor Networks", "Public Policy"] },
  { match: ["internet", "wifi", "portal", "digital"], category: "Digital Services", subcategory: "Digital Access", expertise: ["Computer Science", "Networking", "Human Computer Interaction"] },
  { match: ["school", "student", "classroom", "teacher"], category: "Education", subcategory: "Learning Infrastructure", expertise: ["Education Technology", "Computer Science", "Social Sciences"] },
];

const SAFETY_WORDS = ["accident", "injury", "falling", "fall", "danger", "death", "unsafe", "collapse", "fire", "shock", "snake", "disease", "electrocut"];
const URGENCY_WORDS = ["urgent", "immediately", "daily", "every day", "worse", "emergency", "critical", "months", "repeatedly"];

const STOPWORDS = new Set(["the", "a", "an", "is", "are", "was", "were", "and", "or", "of", "in", "on", "at", "to", "for", "our", "we", "they", "there", "here", "with", "near", "from", "this", "that", "it", "has", "have", "been", "very", "not", "no", "by", "as", "be", "but", "also", "so", "their", "its", "his", "her", "who", "which"]);

const SYNONYMS: Record<string, string> = {
  potholes: "roaddamage", pothole: "roaddamage", damaged: "roaddamage", broken: "roaddamage",
  road: "roaddamage", roads: "roaddamage", street: "roaddamage", tar: "roaddamage",
  garbage: "waste", trash: "waste", rubbish: "waste", dump: "waste", dumping: "waste", litter: "waste",
  water: "watersupply", tap: "watersupply", borewell: "watersupply", pipeline: "watersupply", tanker: "watersupply",
  streetlight: "lighting", streetlights: "lighting", lamp: "lighting", lights: "lighting", light: "lighting",
  electricity: "power", transformer: "power", voltage: "power", outage: "power",
  drainage: "sewage", drain: "sewage", drains: "sewage", sewer: "sewage",
  accidents: "safety", accident: "safety", injury: "safety", injuries: "safety", falling: "safety", unsafe: "safety",
  bus: "transit", buses: "transit", transport: "transit", commute: "transit",
  students: "college", student: "college", campus: "college", school: "college",
  flooding: "flood", waterlogging: "flood", overflow: "flood",
  irrigation: "farming", crop: "farming", crops: "farming", farmer: "farming", farmers: "farming",
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))
    .map((t) => SYNONYMS[t] ?? t);
}

/** Deterministic semantic-ish similarity (Dice coefficient + category + location signals). */
export function similarityScore(
  a: { title: string; description: string; category: string; location: string },
  b: { title: string; description: string; category: string; location: string },
): number {
  const setA = new Set(tokenize(`${a.title} ${a.description}`));
  const setB = new Set(tokenize(`${b.title} ${b.description}`));
  if (setA.size === 0 || setB.size === 0) return 0;
  let overlap = 0;
  setA.forEach((t) => {
    if (setB.has(t)) overlap += 1;
  });
  const dice = (2 * overlap) / (setA.size + setB.size);
  const containment = overlap / Math.min(setA.size, setB.size);
  const categoryMatch = a.category.toLowerCase() === b.category.toLowerCase() ? 1 : 0;
  const locA = new Set(tokenize(a.location));
  const locB = new Set(tokenize(b.location));
  let locOverlap = 0;
  locA.forEach((t) => {
    if (locB.has(t)) locOverlap += 1;
  });
  const locScore = locA.size && locB.size ? locOverlap / Math.min(locA.size, locB.size) : 0;
  // Concept overlap is dampened with a power curve so that strongly related
  // reports (same concepts, same place, same category) score in the 75–95 band.
  const conceptual = Math.pow(Math.max(dice, containment), 0.6);
  const raw = 0.5 * conceptual + 0.28 * categoryMatch + 0.22 * locScore;
  return Math.min(99, Math.round(raw * 100));
}

function levelFor(score: number): AiAnalysis["priorityLevel"] {
  if (score >= 90) return "CRITICAL";
  if (score >= 75) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

function classify(text: string, fallbackCategory: string) {
  const lower = text.toLowerCase();
  for (const rule of SUBCATEGORY_RULES) {
    if (rule.match.some((m) => lower.includes(m))) {
      return { category: rule.category, subcategory: rule.subcategory, expertise: rule.expertise };
    }
  }
  let best = fallbackCategory || "Other";
  let bestHits = 0;
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    const hits = words.filter((w) => lower.includes(w)).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = cat;
    }
  }
  return {
    category: best,
    subcategory: `${best} — General`,
    expertise: ["Civil Engineering", "Data Science", "Public Policy"],
  };
}

/** Deterministic fallback engine — always available. */
export function deterministicAnalysis(input: AnalysisInput): AiAnalysis {
  const text = `${input.title}. ${input.description}`;
  const lower = text.toLowerCase();
  const cls = classify(text, input.category);

  const severityMap: Record<string, number> = { CRITICAL: 25, HIGH: 21, MEDIUM: 15, LOW: 9 };
  let severityScore = severityMap[(input.severity || "MEDIUM").toUpperCase()] ?? 15;
  if (SAFETY_WORDS.some((w) => lower.includes(w))) severityScore = Math.min(25, severityScore + 2);

  const urgencyHits = URGENCY_WORDS.filter((w) => lower.includes(w)).length;
  const urgencyScore = Math.min(20, 10 + urgencyHits * 3 + (input.durationDays > 30 ? 4 : 0));

  const people = input.peopleAffected || 0;
  const peopleScore = people >= 5000 ? 20 : people >= 1000 ? 18 : people >= 500 ? 16 : people >= 100 ? 13 : people >= 50 ? 10 : 7;

  const d = input.durationDays || 0;
  const durationScore = d >= 180 ? 15 : d >= 90 ? 14 : d >= 30 ? 12 : d >= 14 ? 9 : d >= 7 ? 7 : 5;

  const safetyHits = SAFETY_WORDS.filter((w) => lower.includes(w)).length;
  const safetyScore = Math.min(20, 6 + safetyHits * 5);

  const locTokens = tokenize(input.location).length;
  const geoScore = Math.min(5, 2 + Math.floor(locTokens / 2));
  const votesScore = Math.min(5, Math.floor((input.votes ?? 0) / 5));

  const base = severityScore + urgencyScore + peopleScore + durationScore + safetyScore;
  const priorityScore = Math.max(5, Math.min(100, base + Math.round((geoScore + votesScore) / 2)));

  const keywords = Array.from(new Set(tokenize(text))).slice(0, 10);

  return {
    category: cls.category,
    subcategory: cls.subcategory,
    summary: `${cls.subcategory} issue reported at ${input.location}: ${input.description.slice(0, 150)}${input.description.length > 150 ? "…" : ""}`,
    impact: `Approximately ${people.toLocaleString("en-IN")} residents affected for ${d} day(s). ${safetyHits > 0 ? "Direct safety risk detected in the report." : "No direct safety risk keywords detected."}`,
    severityScore,
    urgencyScore,
    peopleScore,
    durationScore,
    safetyScore,
    geoScore,
    votesScore,
    priorityScore,
    priorityLevel: levelFor(priorityScore),
    requiredExpertise: cls.expertise,
    keywords,
    confidence: Number((0.72 + Math.min(0.2, keywords.length * 0.02)).toFixed(2)),
    engine: "FALLBACK_DETERMINISTIC",
    factors: [
      { label: "Severity", score: severityScore, max: 25 },
      { label: "Urgency", score: urgencyScore, max: 20 },
      { label: "People affected", score: peopleScore, max: 20 },
      { label: "Duration", score: durationScore, max: 15 },
      { label: "Safety risk", score: safetyScore, max: 20 },
      { label: "Geographic impact (boost)", score: geoScore, max: 5 },
      { label: "Community votes (boost)", score: votesScore, max: 5 },
    ],
  };
}

/** Optional LLM provider (OpenAI-compatible). Falls back deterministically on any failure. */
async function providerAnalysis(input: AnalysisInput): Promise<AiAnalysis | null> {
  const key = process.env.AI_API_KEY;
  if (!key) return null;
  const baseUrl = process.env.AI_API_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are CivicSolve AI. Analyse a civic problem and reply with STRICT JSON keys: category, subcategory, summary, impact, severityScore(0-25), urgencyScore(0-20), peopleScore(0-20), durationScore(0-15), safetyScore(0-20), requiredExpertise(string array), keywords(string array), confidence(0-1).",
          },
          { role: "user", content: JSON.stringify(input) },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as Partial<AiAnalysis>;
    const base = deterministicAnalysis(input);
    const merged: AiAnalysis = {
      ...base,
      ...parsed,
      requiredExpertise: parsed.requiredExpertise?.length ? parsed.requiredExpertise : base.requiredExpertise,
      keywords: parsed.keywords?.length ? parsed.keywords : base.keywords,
      engine: `PROVIDER:${model}`,
    };
    const total =
      (merged.severityScore ?? 0) +
      (merged.urgencyScore ?? 0) +
      (merged.peopleScore ?? 0) +
      (merged.durationScore ?? 0) +
      (merged.safetyScore ?? 0);
    merged.priorityScore = Math.max(5, Math.min(100, Math.round(total)));
    merged.priorityLevel = levelFor(merged.priorityScore);
    merged.factors = [
      { label: "Severity", score: merged.severityScore, max: 25 },
      { label: "Urgency", score: merged.urgencyScore, max: 20 },
      { label: "People affected", score: merged.peopleScore, max: 20 },
      { label: "Duration", score: merged.durationScore, max: 15 },
      { label: "Safety risk", score: merged.safetyScore, max: 20 },
      { label: "Geographic impact (boost)", score: merged.geoScore, max: 5 },
      { label: "Community votes (boost)", score: merged.votesScore, max: 5 },
    ];
    return merged;
  } catch {
    return null;
  }
}

export async function analyzeProblem(input: AnalysisInput): Promise<AiAnalysis> {
  const remote = await providerAnalysis(input);
  return remote ?? deterministicAnalysis(input);
}

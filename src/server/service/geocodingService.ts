/**
 * Geocoding Service for CivicSolve AI.
 * 
 * Provides robust coordinate resolution for Indian and Telangana civic locations.
 * Uses a two-tier strategy:
 * 1. Curated high-precision gazetteer for Telangana districts, towns, mandals, and major Indian cities.
 *    Provides instant (< 1ms), reliable, offline-safe coordinates for known locations.
 * 2. OpenStreetMap Nominatim geocoding with prioritisation for Telangana and India.
 * 
 * Validates coordinate ranges: Latitude [-90, 90], Longitude [-180, 180].
 * NEVER returns random or fabricated coordinates. If unresolved, returns null.
 */

export type GeocodedResult = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  source: "GAZETTEER" | "NOMINATIM";
};

// Curated high-precision gazetteer for Telangana and major Indian civic hubs
// Coordinates represent the verified municipal / town / district centers
const KNOWN_LOCATIONS: Record<string, { lat: number; lon: number; name: string }> = {
  // Nalgonda & surrounding areas
  "nalgonda": { lat: 17.0504, lon: 79.2669, name: "Nalgonda, Telangana, India" },
  "nalgonda town": { lat: 17.0504, lon: 79.2669, name: "Nalgonda, Telangana, India" },
  "nalgonda district": { lat: 17.0504, lon: 79.2669, name: "Nalgonda District, Telangana, India" },
  "miryalaguda": { lat: 16.8722, lon: 79.5627, name: "Miryalaguda, Nalgonda, Telangana, India" },
  "suryapet": { lat: 17.1439, lon: 79.6239, name: "Suryapet, Telangana, India" },
  "devarakonda": { lat: 16.6978, lon: 78.9242, name: "Devarakonda, Nalgonda, Telangana, India" },

  // Hyderabad & Urban Localities
  "hyderabad": { lat: 17.3850, lon: 78.4867, name: "Hyderabad, Telangana, India" },
  "shapur": { lat: 17.5169, lon: 78.4350, name: "Shapur Nagar, Jeedimetla, Hyderabad, Telangana, India" },
  "shapur nagar": { lat: 17.5169, lon: 78.4350, name: "Shapur Nagar, Jeedimetla, Hyderabad, Telangana, India" },
  "kukatpally": { lat: 17.4938, lon: 78.3914, name: "Kukatpally, Hyderabad, Telangana, India" },
  "jntu": { lat: 17.4938, lon: 78.3914, name: "JNTU, Kukatpally, Hyderabad, Telangana, India" },
  "miyapur": { lat: 17.4965, lon: 78.3580, name: "Miyapur, Hyderabad, Telangana, India" },
  "madhapur": { lat: 17.4483, lon: 78.3915, name: "Madhapur, Hyderabad, Telangana, India" },
  "hitec city": { lat: 17.4474, lon: 78.3762, name: "HITEC City, Hyderabad, Telangana, India" },
  "gachibowli": { lat: 17.4401, lon: 78.3489, name: "Gachibowli, Hyderabad, Telangana, India" },
  "secunderabad": { lat: 17.4399, lon: 78.4983, name: "Secunderabad, Telangana, India" },
  "jeedimetla": { lat: 17.5256, lon: 78.4485, name: "Jeedimetla, Hyderabad, Telangana, India" },
  "bachupally": { lat: 17.5350, lon: 78.3700, name: "Bachupally, Hyderabad, Telangana, India" },
  "kompally": { lat: 17.5450, lon: 78.4850, name: "Kompally, Hyderabad, Telangana, India" },
  "shamirpet": { lat: 17.6000, lon: 78.5700, name: "Shamirpet, Hyderabad, Telangana, India" },
  "shamirpet mandal": { lat: 17.6000, lon: 78.5700, name: "Shamirpet Mandal, Hyderabad, Telangana, India" },
  "charminar": { lat: 17.3616, lon: 78.4747, name: "Charminar, Hyderabad, Telangana, India" },
  "begumpet": { lat: 17.4440, lon: 78.4680, name: "Begumpet, Hyderabad, Telangana, India" },
  "ameerpet": { lat: 17.4375, lon: 78.4482, name: "Ameerpet, Hyderabad, Telangana, India" },
  "dilsukhnagar": { lat: 17.3685, lon: 78.5247, name: "Dilsukhnagar, Hyderabad, Telangana, India" },
  "lb nagar": { lat: 17.3457, lon: 78.5522, name: "LB Nagar, Hyderabad, Telangana, India" },

  // Telangana Districts & Major Towns
  "warangal": { lat: 17.9689, lon: 79.5941, name: "Warangal, Telangana, India" },
  "hanamkonda": { lat: 18.0135, lon: 79.5516, name: "Hanamkonda, Telangana, India" },
  "kazipet": { lat: 17.9818, lon: 79.5218, name: "Kazipet, Warangal, Telangana, India" },
  "gudur": { lat: 17.8500, lon: 79.7500, name: "Gudur, Warangal, Telangana, India" },
  "karimnagar": { lat: 18.4386, lon: 79.1288, name: "Karimnagar, Telangana, India" },
  "nizamabad": { lat: 18.6725, lon: 78.0941, name: "Nizamabad, Telangana, India" },
  "khammam": { lat: 17.2473, lon: 80.1514, name: "Khammam, Telangana, India" },
  "mahbubnagar": { lat: 16.7488, lon: 78.0035, name: "Mahbubnagar, Telangana, India" },
  "siddipet": { lat: 18.1018, lon: 78.8520, name: "Siddipet, Telangana, India" },
  "adilabad": { lat: 19.6641, lon: 78.5320, name: "Adilabad, Telangana, India" },
  "mancherial": { lat: 18.8679, lon: 79.4639, name: "Mancherial, Telangana, India" },
  "ramagundam": { lat: 18.7645, lon: 79.4770, name: "Ramagundam, Telangana, India" },
  "kamareddy": { lat: 18.3228, lon: 78.3396, name: "Kamareddy, Telangana, India" },
  "jagtial": { lat: 18.7954, lon: 78.9128, name: "Jagtial, Telangana, India" },
  "peddapalli": { lat: 18.6163, lon: 79.3789, name: "Peddapalli, Telangana, India" },
  "bhupalpally": { lat: 18.4287, lon: 79.8631, name: "Jayashankar Bhupalpally, Telangana, India" },
  "kothagudem": { lat: 17.5524, lon: 80.6186, name: "Bhadradri Kothagudem, Telangana, India" },
  "medak": { lat: 18.0463, lon: 78.2635, name: "Medak, Telangana, India" },
  "sangareddy": { lat: 17.6190, lon: 78.0818, name: "Sangareddy, Telangana, India" },
  "vikarabad": { lat: 17.3364, lon: 77.9048, name: "Vikarabad, Telangana, India" },
  "wanaparthy": { lat: 16.3624, lon: 78.0628, name: "Wanaparthy, Telangana, India" },
  "gadwal": { lat: 16.2323, lon: 77.8078, name: "Jogulamba Gadwal, Telangana, India" },
  "nagarkurnool": { lat: 16.4856, lon: 78.3090, name: "Nagarkurnool, Telangana, India" },
  "asifabad": { lat: 19.3582, lon: 79.2844, name: "Komaram Bheem Asifabad, Telangana, India" },
  "nirmal": { lat: 19.0964, lon: 78.3427, name: "Nirmal, Telangana, India" },
  "jangaon": { lat: 17.7247, lon: 79.1824, name: "Jangaon, Telangana, India" },
  "yadadri": { lat: 17.5855, lon: 78.9482, name: "Yadadri Bhuvanagiri, Telangana, India" },
  "bhuvanagiri": { lat: 17.5140, lon: 78.8837, name: "Bhuvanagiri, Telangana, India" },

  // Key other cities referenced in seed data / nationwide tests
  "pune": { lat: 18.5204, lon: 73.8567, name: "Pune, Maharashtra, India" },
  "kothrud": { lat: 18.5074, lon: 73.8077, name: "Kothrud, Pune, Maharashtra, India" },
  "baner": { lat: 18.5590, lon: 73.7868, name: "Baner, Pune, Maharashtra, India" },
  "aundh": { lat: 18.5580, lon: 73.8070, name: "Aundh, Pune, Maharashtra, India" },
  "bengaluru": { lat: 12.9716, lon: 77.5946, name: "Bengaluru, Karnataka, India" },
  "bangalore": { lat: 12.9716, lon: 77.5946, name: "Bengaluru, Karnataka, India" },
  "hsr layout": { lat: 12.9121, lon: 77.6446, name: "HSR Layout, Bengaluru, Karnataka, India" },
  "bommanahalli": { lat: 12.9029, lon: 77.6242, name: "Bommanahalli, Bengaluru, Karnataka, India" },
  "chennai": { lat: 13.0827, lon: 80.2707, name: "Chennai, Tamil Nadu, India" },
  "tambaram": { lat: 12.9249, lon: 80.1000, name: "Tambaram, Chennai, Tamil Nadu, India" },
  "pallavaram": { lat: 12.9675, lon: 80.1491, name: "Pallavaram, Chennai, Tamil Nadu, India" },
  "mumbai": { lat: 19.0760, lon: 72.8777, name: "Mumbai, Maharashtra, India" },
  "delhi": { lat: 28.6139, lon: 77.2090, name: "New Delhi, Delhi, India" },
};

/**
 * Validates that latitude and longitude are finite numbers within valid global ranges.
 * Latitude must be between -90 and 90.
 * Longitude must be between -180 and 180.
 * Excludes (0, 0) as an unmapped coordinate.
 */
export function normalizeCoordinates(lat: unknown, lon: unknown): { latitude: number; longitude: number } | null {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    return null;
  }
  const nLat = Number(lat);
  const nLon = Number(lon);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLon)) {
    return null;
  }
  if (nLat < -90 || nLat > 90 || nLon < -180 || nLon > 180) {
    return null;
  }
  // Exclude (0, 0) null island
  if (Math.abs(nLat) < 0.0001 && Math.abs(nLon) < 0.0001) {
    return null;
  }
  return { latitude: Number(nLat.toFixed(6)), longitude: Number(nLon.toFixed(6)) };
}

/**
 * Normalizes an address query string for gazetteer lookup by stripping punctuation and extra spaces.
 */
function cleanQuery(str: string): string {
  return str
    .toLowerCase()
    .replace(/[,;.\-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Looks up an address in the built-in Indian / Telangana gazetteer.
 * Matches full strings, token prefixes, and key locality words.
 */
function matchGazetteer(query: string, landmark?: string): GeocodedResult | null {
  const fullText = cleanQuery(`${query} ${landmark ?? ""}`);

  // 1. Direct exact match
  const direct = cleanQuery(query);
  if (KNOWN_LOCATIONS[direct]) {
    const r = KNOWN_LOCATIONS[direct];
    return { latitude: r.lat, longitude: r.lon, formattedAddress: r.name, source: "GAZETTEER" };
  }

  // 2. Tokenized match:
  // In Indian civic addresses, the specific locality comes first (e.g. "Shapur, Hyderabad", "Kukatpally, Hyderabad").
  // Prioritize earlier match position, then phrase length.
  let bestMatch: { lat: number; lon: number; name: string } | null = null;
  let bestScore = -1;

  for (const [key, val] of Object.entries(KNOWN_LOCATIONS)) {
    const regex = new RegExp(`\\b${key}\\b`, "i");
    const match = regex.exec(fullText);
    if (match) {
      // Score: earlier position in query gets high priority, plus bonus for exact key length
      const pos = match.index;
      // Closer to start of string gets up to 1000 points; key length adds specificity
      const score = (1000 - Math.min(pos, 900)) * 10 + key.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = val;
      }
    }
  }

  if (bestMatch) {
    return {
      latitude: bestMatch.lat,
      longitude: bestMatch.lon,
      formattedAddress: bestMatch.name,
      source: "GAZETTEER",
    };
  }

  return null;
}

/**
 * Queries OpenStreetMap Nominatim with prioritizing criteria for Telangana and India.
 */
async function queryNominatim(query: string, landmark?: string): Promise<GeocodedResult | null> {
  const searchTerms = [
    // Priority 1: explicitly target Telangana, India
    `${query}${landmark ? ` ${landmark}` : ""}, Telangana, India`,
    // Priority 2: target India
    `${query}${landmark ? ` ${landmark}` : ""}, India`,
    // Priority 3: raw query
    query,
  ];

  for (const term of searchTerms) {
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", term);
      url.searchParams.set("format", "json");
      url.searchParams.set("countrycodes", "in");
      url.searchParams.set("limit", "5");
      url.searchParams.set("addressdetails", "1");

      const res = await fetch(url.toString(), {
        headers: {
          "User-Agent": "CivicSolveAI-GeocodingService/1.0 (contact: civic@civicsolve.in)",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(4000), // 4 second timeout
      });

      if (!res.ok) continue;
      const data = (await res.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
        class?: string;
        type?: string;
        address?: {
          state?: string;
          country?: string;
          city?: string;
          town?: string;
          county?: string;
        };
      }>;

      if (!Array.isArray(data) || data.length === 0) continue;

      // Smart ranking: prefer items located in Telangana, India
      const scored = data.map((item) => {
        let score = 0;
        const nameLower = (item.display_name ?? "").toLowerCase();
        const stateLower = (item.address?.state ?? "").toLowerCase();

        if (stateLower.includes("telangana") || nameLower.includes("telangana")) score += 40;
        if (nameLower.includes("india")) score += 10;
        if (item.type === "city" || item.type === "town" || item.type === "administrative") score += 20;
        if (item.class === "place" || item.class === "boundary") score += 10;

        return { item, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const chosen = scored[0]?.item;

      if (chosen) {
        const coords = normalizeCoordinates(chosen.lat, chosen.lon);
        if (coords) {
          return {
            latitude: coords.latitude,
            longitude: coords.longitude,
            formattedAddress: chosen.display_name,
            source: "NOMINATIM",
          };
        }
      }
    } catch {
      // If network fails or times out, proceed to next term or fallback
      continue;
    }
  }

  return null;
}

/**
 * Geocodes a civic location string to validated numeric GPS coordinates.
 * 
 * 1. Checks the high-precision gazetteer (fast, deterministic, Telangana-centric).
 * 2. If not matched, queries Nominatim OpenStreetMap with Telangana/India ranking.
 * 3. Validates spherical boundaries [-90, 90], [-180, 180].
 * 4. Returns null if unresolved (DO NOT fabricate coordinates).
 */
export async function geocodeLocation(location: string, landmark?: string): Promise<GeocodedResult | null> {
  const trimmed = location?.trim();
  if (!trimmed || trimmed.length < 2) {
    return null;
  }

  // 1. Try local gazetteer
  const local = matchGazetteer(trimmed, landmark);
  if (local) {
    return local;
  }

  // 2. Try online geocoder with Telangana, India bias
  const online = await queryNominatim(trimmed, landmark);
  if (online) {
    return online;
  }

  // Could not resolve
  return null;
}

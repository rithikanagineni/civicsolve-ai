import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";

type Responder = {
  id: number;
  name: string;
  distanceKm: number;
  skill: string;
  reputation: number;
  status: "Available" | "Reviewing" | "Assigned";
};

const responders: Responder[] = [
  { id: 1, name: "Water Systems Advisory Cell", distanceKm: 3.2, skill: "Water infrastructure", reputation: 4.9, status: "Available" },
  { id: 2, name: "Urban Mobility Lab", distanceKm: 7.6, skill: "Transport and road safety", reputation: 4.7, status: "Reviewing" },
  { id: 3, name: "Smart Grids Task Force", distanceKm: 11.4, skill: "Energy and sensor systems", reputation: 4.8, status: "Assigned" },
];

export async function GET(req: Request) {
  try {
    await requireAuth(req);
    return ok({ items: responders });
  } catch (error) {
    return handleError(error);
  }
}

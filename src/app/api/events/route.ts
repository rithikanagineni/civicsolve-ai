import { handleError, ok } from "@/server/exception/http";
import { requireAuth, type Role } from "@/server/security/auth";

type EventItem = {
  id: number;
  title: string;
  date: string;
  location: string;
  seats: number;
  description: string;
  registered: boolean;
  role: Role;
  ownerRole: Role;
  createdBy: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
};

const events: EventItem[] = [
  { id: 1, title: "Civic Repair Sprint", date: "2026-09-18", location: "Hyderabad Tech Park", seats: 36, description: "Volunteer repair drive for civic infrastructure issues and community remediation planning.", registered: true, role: "CITIZEN", ownerRole: "CITIZEN", createdBy: "community@civicsolve.ai", status: "PUBLISHED" },
  { id: 2, title: "University–Industry Innovation Clinic", date: "2026-09-26", location: "Bengaluru Innovation Center", seats: 24, description: "Cross-sector innovation clinic connecting students, faculty and industry partners.", registered: false, role: "UNIVERSITY", ownerRole: "UNIVERSITY", createdBy: "campus@civicsolve.ai", status: "PUBLISHED" },
  { id: 3, title: "Community Problem Jam", date: "2026-10-03", location: "Warangal Public Square", seats: 48, description: "Problem-solving jam where residents and institutions co-design civic solutions.", registered: true, role: "CITIZEN", ownerRole: "CITIZEN", createdBy: "district@civicsolve.ai", status: "PUBLISHED" },
  { id: 4, title: "Startup Partnership Forum", date: "2026-10-12", location: "Pune Civic Lab", seats: 30, description: "Industry-led civic innovation forum for startups, policy teams and public innovators.", registered: false, role: "INDUSTRY", ownerRole: "INDUSTRY", createdBy: "partners@civicsolve.ai", status: "PUBLISHED" },
];

const registrationSet = new Map<number, Set<number>>();

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    const url = new URL(req.url);
    const role = (url.searchParams.get("role") as Role | null) ?? auth.role;

    const data = events
      .filter((item) => {
        if (auth.role === "ADMIN") return true;
        if (item.status === "CLOSED") return false;
        if (item.ownerRole === auth.role || item.role === auth.role) return true;
        if (item.role === role || item.ownerRole === role) return true;
        if (item.role === "CITIZEN" || item.ownerRole === "CITIZEN") return true;
        return false;
      })
      .map((item) => ({
        ...item,
        registered: !!(registrationSet.get(item.id)?.has(auth.id) || item.registered),
      }));

    return ok({ items: data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json().catch(() => ({} as {
      eventId?: number;
      title?: string;
      date?: string;
      location?: string;
      seats?: number;
      description?: string;
      ownerRole?: Role;
      status?: "DRAFT" | "PUBLISHED" | "CLOSED";
    }));

    if (typeof body.eventId === "number") {
      const eventId = Number(body.eventId ?? 0);
      const item = events.find((e) => e.id === eventId);
      if (!item) return ok({ success: false, message: "Event not found" }, 404);
      if (auth.role === "CITIZEN" && item.role !== "CITIZEN") {
        return ok({ success: false, message: "You can only register for events available in your portal." }, 403);
      }
      if (!registrationSet.has(eventId)) registrationSet.set(eventId, new Set());
      registrationSet.get(eventId)!.add(auth.id);
      return ok({ item: { ...item, registered: true } });
    }

    if (auth.role === "CITIZEN") {
      return ok({ success: false, message: "Citizens can register for events but cannot create them." }, 403);
    }

    const ownerRole = body.ownerRole ?? auth.role;
    if (auth.role !== "ADMIN" && ownerRole !== auth.role) {
      return ok({ success: false, message: "You can only manage events in your own portal." }, 403);
    }

    const title = (body.title ?? "").trim();
    if (!title || !body.date || !body.location) {
      return ok({ success: false, message: "Title, date and location are required." }, 400);
    }

    const item: EventItem = {
      id: Date.now(),
      title,
      date: body.date,
      location: body.location,
      seats: Number(body.seats ?? 20),
      description: body.description ?? "",
      registered: false,
      role: ownerRole,
      ownerRole,
      createdBy: auth.email,
      status: body.status ?? (auth.role === "ADMIN" ? "PUBLISHED" : "DRAFT"),
    };

    events.unshift(item);
    return ok({ item });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json().catch(() => ({} as {
      id?: number;
      title?: string;
      date?: string;
      location?: string;
      seats?: number;
      description?: string;
      ownerRole?: Role;
      status?: "DRAFT" | "PUBLISHED" | "CLOSED";
    }));

    const id = Number(body.id ?? 0);
    const item = events.find((e) => e.id === id);
    if (!item) return ok({ success: false, message: "Event not found" }, 404);
    if (auth.role !== "ADMIN" && item.ownerRole !== auth.role) {
      return ok({ success: false, message: "You can only edit your own events." }, 403);
    }

    if (body.title) item.title = body.title;
    if (body.date) item.date = body.date;
    if (body.location) item.location = body.location;
    if (body.seats) item.seats = Number(body.seats);
    if (body.description) item.description = body.description;
    if (body.ownerRole) item.ownerRole = body.ownerRole;
    if (body.status) item.status = body.status;
    item.role = item.ownerRole;

    return ok({ item });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAuth(req);
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id") ?? 0);
    const item = events.find((e) => e.id === id);
    if (!item) return ok({ success: false, message: "Event not found" }, 404);
    if (auth.role !== "ADMIN" && item.ownerRole !== auth.role) {
      return ok({ success: false, message: "You can only delete your own events." }, 403);
    }

    const idx = events.findIndex((e) => e.id === id);
    if (idx >= 0) events.splice(idx, 1);
    return ok({ success: true, deleted: id });
  } catch (error) {
    return handleError(error);
  }
}

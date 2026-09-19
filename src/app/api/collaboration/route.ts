import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { collaborationGroupMembers, collaborationGroups, projects } from "@/db/schema";
import { handleError, ok, notFound, forbidden } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { parseId, readJson, requireString, optionalString, toInt } from "@/server/dto/validate";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, ["UNIVERSITY", "ADMIN"]);
    const rows = await db
      .select({ group: collaborationGroups, project: projects })
      .from(collaborationGroups)
      .leftJoin(projects, eq(projects.id, collaborationGroups.projectId))
      .where(eq(collaborationGroups.universityId, auth.id))
      .orderBy(desc(collaborationGroups.createdAt));

    const groupIds = rows.map((row) => row.group.id);
    const members = groupIds.length
      ? await db.select().from(collaborationGroupMembers).where(inArray(collaborationGroupMembers.groupId, groupIds))
      : [];

    return ok({
      groups: rows.map(({ group, project }) => ({
        id: group.id,
        universityId: group.universityId,
        name: group.name,
        description: group.description,
        goal: group.goal,
        status: group.status,
        projectId: group.projectId,
        projectTitle: project?.title ?? null,
        createdAt: group.createdAt,
        members: members
          .filter((member) => member.groupId === group.id)
          .map((member) => ({
            id: member.id,
            name: member.name,
            role: member.role,
            email: member.email,
            expertise: member.expertise,
            kind: member.kind,
          })),
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["UNIVERSITY", "ADMIN"]);
    const body = await readJson(req);
    const name = requireString(body.name, "Collaboration group name", { min: 2, max: 120 });
    const description = optionalString(body.description, 500) ?? "";
    const goal = optionalString(body.goal, 500) ?? "";
    const status = optionalString(body.status, 20) ?? "ACTIVE";
    const projectId = body.projectId === undefined || body.projectId === null || body.projectId === "" ? null : parseId(String(body.projectId), "projectId");

    if (auth.role !== "ADMIN") {
      if (projectId) {
        const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
        if (!project) throw notFound("Project not found");
        if (project.universityId !== auth.id) throw forbidden("Not your project");
      }
    }

    const [group] = await db.insert(collaborationGroups).values({
      universityId: auth.id,
      name,
      description,
      goal,
      status,
      projectId,
    }).returning();

    return ok({ group }, 201);
  } catch (error) {
    return handleError(error);
  }
}

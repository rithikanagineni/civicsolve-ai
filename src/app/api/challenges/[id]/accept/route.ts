import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";
import { acceptChallenge, getChallengeDetail } from "@/server/service/challengeService";
import { optionalString, parseId, readJson } from "@/server/dto/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth(req, ["UNIVERSITY"]);
    const id = parseId((await ctx.params).id);
    const body = await readJson(req).catch(() => ({}) as Record<string, unknown>);

    const toMember = (member: Record<string, unknown> | undefined) => {
      const entry = member ?? {};
      return {
        name: String(entry.name ?? "").trim(),
        role: String(entry.role ?? "").trim(),
        email: String(entry.email ?? "").trim(),
        expertise: String(entry.expertise ?? "").trim(),
        phone: String(entry.phone ?? "").trim(),
      };
    };

    const lead = toMember((body.lead as Record<string, unknown> | undefined) ?? undefined);
    const teamMembers = Array.isArray(body.teamMembers)
      ? body.teamMembers
          .map((member) => toMember(member as Record<string, unknown> | undefined))
          .filter((member) => member.name || member.role || member.email || member.expertise || member.phone)
      : [];

    const mergedMembers = [...teamMembers];
    if (lead.name || lead.role || lead.email || lead.expertise || lead.phone) {
      mergedMembers.push(lead);
    }

    const { project } = await acceptChallenge(id, auth.id, optionalString(body.department, 120), mergedMembers);
    const detail = await getChallengeDetail(id);
    return ok({ project, challenge: detail.challenge, acceptedBy: detail.acceptedBy }, 201);
  } catch (error) {
    return handleError(error);
  }
}

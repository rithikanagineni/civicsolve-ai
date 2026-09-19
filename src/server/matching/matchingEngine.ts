import { tokenize } from "@/server/ai/analysisEngine";

export type UniversityProfile = {
  universityId: number;
  name: string;
  departments: string[];
  skills: string[];
  researchAreas: string[];
  facultyExpertise: string[];
  studentTeams: number;
  previousProjects: number;
  city?: string | null;
};

export type IndustryProfile = {
  industryId: number;
  name: string;
  technologies: string[];
  domains: string[];
  supportTypes: string[];
  deploymentCapability: boolean;
  city?: string | null;
};

const overlap = (need: string[], have: string[]) => {
  const haveTokens = new Set(have.flatMap((h) => tokenize(h)));
  return need.filter((n) => tokenize(n).some((t) => haveTokens.has(t)));
};

/** University matching: departments, skills, research areas, faculty, teams, track record. */
export function scoreUniversity(
  requiredExpertise: string[],
  category: string,
  location: string,
  uni: UniversityProfile,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 30; // baseline capability of any accredited university

  const deptHits = overlap(requiredExpertise, uni.departments);
  score += Math.min(24, deptHits.length * 12);
  deptHits.forEach((d) => reasons.push(`Department match: ${d}`));

  const researchHits = overlap([...requiredExpertise, category], uni.researchAreas);
  score += Math.min(18, researchHits.length * 9);
  researchHits.forEach((r) => reasons.push(`Active research area: ${r}`));

  const skillHits = overlap(requiredExpertise, uni.skills);
  score += Math.min(14, skillHits.length * 7);
  skillHits.forEach((s) => reasons.push(`Skill available: ${s}`));

  const facultyHits = overlap(requiredExpertise, uni.facultyExpertise);
  score += Math.min(8, facultyHits.length * 4);
  facultyHits.forEach((f) => reasons.push(`Faculty expertise: ${f}`));

  if (uni.studentTeams > 0) {
    score += Math.min(6, uni.studentTeams);
    reasons.push(`${uni.studentTeams} active student teams available`);
  }
  if (uni.previousProjects > 0) {
    score += Math.min(6, uni.previousProjects * 2);
    reasons.push(`${uni.previousProjects} previous civic projects delivered`);
  }
  if (uni.city && location.toLowerCase().includes(uni.city.toLowerCase())) {
    score += 6;
    reasons.push(`Located in the same region (${uni.city})`);
  }
  if (reasons.length === 0) reasons.push("General multidisciplinary capability");
  return { score: Math.max(35, Math.min(99, Math.round(score))), reasons: reasons.slice(0, 6) };
}

/** Industry matching: technology, domain, support capability, deployment. */
export function scoreIndustry(
  requiredTech: string[],
  category: string,
  ind: IndustryProfile,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 28;

  const techHits = overlap(requiredTech, ind.technologies);
  score += Math.min(30, techHits.length * 12);
  techHits.forEach((t) => reasons.push(`Technology capability: ${t}`));

  const domainHits = overlap([...requiredTech, category], ind.domains);
  score += Math.min(20, domainHits.length * 10);
  domainHits.forEach((d) => reasons.push(`Domain experience: ${d}`));

  if (ind.supportTypes.length) {
    score += Math.min(12, ind.supportTypes.length * 3);
    reasons.push(`Can provide: ${ind.supportTypes.join(", ")}`);
  }
  if (ind.deploymentCapability) {
    score += 8;
    reasons.push("Field deployment capability");
  }
  if (reasons.length === 0) reasons.push("General engineering and mentorship capacity");
  return { score: Math.max(32, Math.min(99, Math.round(score))), reasons: reasons.slice(0, 6) };
}

export type ChallengeSummary = {
  id: number;
  complaintCode: string;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  location: string;
  status: string;
  priorityScore: number;
  priorityLevel: string;
  votes: number;
  peopleAffected: number;
  inputMethod: string;
  language: string;
  createdAt: string;
  citizenId: number;
  citizenName: string | null;
  requiredExpertise: string[];
  summary: string | null;
  matchedUniversity: string | null;
  matchedUniversityScore: number | null;
  acceptedUniversity: string | null;
  acceptedUniversityId: number | null;
  projectId: number | null;
  projectTitle: string | null;
  projectProgress: number | null;
};

export type Analysis = {
  id: number;
  challengeId: number;
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
  priorityLevel: string;
  requiredExpertise: string[];
  keywords: string[];
  confidence: number;
  engine: string;
};

export type Milestone = {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: string;
  percentage: number;
  sortOrder: number;
  dueDate: string | null;
  completedAt: string | null;
};

export type ProjectSummary = {
  id: number;
  title: string;
  description: string;
  status: string;
  progress: number;
  department: string | null;
  requiredTech: string[];
  startedAt: string;
  completedAt: string | null;
  universityId: number;
  universityName: string;
  challengeId: number;
  complaintCode: string;
  challengeTitle: string;
  category: string;
  location: string;
  priorityLevel: string;
  citizenId: number;
  supporters: { id: number; industryId: number; industryName: string; supportType: string; status: string }[];
};

export type ChallengeDetail = {
  challenge: ChallengeSummary & {
    landmark: string | null;
    severity: string;
    durationDays: number;
    originalText: string | null;
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
  };
  citizen: { id: number; name: string; city: string | null } | null;
  analysis: Analysis | null;
  duplicates: { id: number; similarity: number; status: string; relatedChallengeId: number; complaintCode: string; title: string }[];
  matches: { id: number; universityId: number; universityName: string; city: string | null; matchScore: number; reasons: string[]; status: string; acceptedAt: string | null }[];
  acceptedBy: { universityId: number; name: string } | null;
  lifecycle: { id: number; stage: string; note: string; createdAt: string }[];
  project: { id: number; title: string; description: string; status: string; progress: number; department: string | null; startedAt: string; completedAt: string | null } | null;
  milestones: Milestone[];
  progressUpdates: { id: number; progress: number; note: string; createdAt: string; stage: string | null }[];
  industrySupport: { id: number; industryId: number; industryName: string; supportType: string; description: string; status: string; matchScore: number; reasons: string[] }[];
  field?: { assignments: { assignment: { id: number; status: string; assignedAt: string; distanceKm: number | null; recommendationScore: number }; person: { id: number; fullName: string; availabilityStatus: string } }[]; reports: { id: number; assignmentId: number; verified: boolean; problemExists: string; observations: string; severity: string | null; recommendedSolution: string | null; canResolveDirectly: boolean; solutionPerformed: string | null; universitySupportReason: string | null; submittedAt: string }[] };
};

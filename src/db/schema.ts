import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * CivicSolve AI — canonical schema (one table per entity).
 * Every challenge belongs to the citizen who created it (challenges.citizen_id).
 */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 24 }).notNull().default("CITIZEN"), // CITIZEN | UNIVERSITY | INDUSTRY | ADMIN
  fullName: varchar("full_name", { length: 160 }).notNull(),
  organizationName: varchar("organization_name", { length: 180 }),
  phone: varchar("phone", { length: 24 }),
  language: varchar("language", { length: 12 }).notNull().default("en"),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 120 }),
  bio: text("bio"),
  verificationStatus: varchar("verification_status", { length: 24 }).notNull().default("PENDING"), // PENDING | VERIFIED | REJECTED
  verificationDocType: varchar("verification_doc_type", { length: 80 }),
  verificationDocuments: text("verification_documents"),
  verificationNotes: text("verification_notes"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  isSeed: boolean("is_seed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const universitiesExpertise = pgTable("universities_expertise", {
  id: serial("id").primaryKey(),
  universityId: integer("university_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  departments: jsonb("departments").$type<string[]>().notNull().default([]),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  researchAreas: jsonb("research_areas").$type<string[]>().notNull().default([]),
  facultyExpertise: jsonb("faculty_expertise").$type<string[]>().notNull().default([]),
  studentTeams: integer("student_teams").notNull().default(0),
  previousProjects: integer("previous_projects").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const industryExpertise = pgTable("industry_expertise", {
  id: serial("id").primaryKey(),
  industryId: integer("industry_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  technologies: jsonb("technologies").$type<string[]>().notNull().default([]),
  domains: jsonb("domains").$type<string[]>().notNull().default([]),
  supportTypes: jsonb("support_types").$type<string[]>().notNull().default([]),
  deploymentCapability: boolean("deployment_capability").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  complaintCode: varchar("complaint_code", { length: 24 }).notNull().unique(),
  citizenId: integer("citizen_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  subcategory: varchar("subcategory", { length: 80 }),
  location: varchar("location", { length: 200 }).notNull(),
  landmark: varchar("landmark", { length: 200 }),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationDescription: text("location_description"),
  attachmentUrls: jsonb("attachment_urls").$type<{ images?: string[]; videos?: string[]; documents?: string[] }>().notNull().default({}),
  severity: varchar("severity", { length: 20 }).notNull().default("MEDIUM"),
  durationDays: integer("duration_days").notNull().default(7),
  peopleAffected: integer("people_affected").notNull().default(50),
  imageUrl: text("image_url"),
  language: varchar("language", { length: 12 }).notNull().default("en"),
  inputMethod: varchar("input_method", { length: 12 }).notNull().default("TEXT"), // TEXT | VOICE | IVR
  originalLanguage: varchar("original_language", { length: 12 }).notNull().default("en"),
  originalText: text("original_text"),
  status: varchar("status", { length: 32 }).notNull().default("REPORTED"),
  priorityScore: integer("priority_score").notNull().default(0),
  priorityLevel: varchar("priority_level", { length: 12 }).notNull().default("LOW"),
  votes: integer("votes").notNull().default(0),
  isSeed: boolean("is_seed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const challengeAiAnalysis = pgTable("challenge_ai_analysis", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 60 }).notNull(),
  subcategory: varchar("subcategory", { length: 80 }).notNull(),
  summary: text("summary").notNull(),
  impact: text("impact").notNull(),
  severityScore: integer("severity_score").notNull(),
  urgencyScore: integer("urgency_score").notNull(),
  peopleScore: integer("people_score").notNull(),
  durationScore: integer("duration_score").notNull(),
  safetyScore: integer("safety_score").notNull(),
  geoScore: integer("geo_score").notNull(),
  votesScore: integer("votes_score").notNull(),
  priorityScore: integer("priority_score").notNull(),
  priorityLevel: varchar("priority_level", { length: 12 }).notNull(),
  requiredExpertise: jsonb("required_expertise").$type<string[]>().notNull().default([]),
  keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
  confidence: real("confidence").notNull().default(0.8),
  engine: varchar("engine", { length: 40 }).notNull().default("FALLBACK_DETERMINISTIC"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const challengeDuplicates = pgTable("challenge_duplicates", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  relatedChallengeId: integer("related_challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  similarity: integer("similarity").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("FLAGGED"), // FLAGGED | CONFIRMED | REJECTED
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const challengeMatches = pgTable("challenge_matches", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  universityId: integer("university_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchScore: integer("match_score").notNull(),
  reasons: jsonb("reasons").$type<string[]>().notNull().default([]),
  status: varchar("status", { length: 20 }).notNull().default("RECOMMENDED"), // RECOMMENDED | ACCEPTED | DECLINED
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueMatch: uniqueIndex("challenge_match_unique").on(t.challengeId, t.universityId),
}));

export const challengeLifecycleEvents = pgTable("challenge_lifecycle_events", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  stage: varchar("stage", { length: 32 }).notNull(),
  note: text("note").notNull(),
  actorId: integer("actor_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const challengeVotes = pgTable("challenge_votes", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  citizenId: integer("citizen_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueVote: uniqueIndex("challenge_vote_unique").on(t.challengeId, t.citizenId),
}));

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  universityId: integer("university_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description").notNull(),
  department: varchar("department", { length: 120 }),
  status: varchar("status", { length: 32 }).notNull().default("PROJECT_CREATED"),
  progress: integer("progress").notNull().default(0),
  requiredTech: jsonb("required_tech").$type<string[]>().notNull().default([]),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  memberRole: varchar("member_role", { length: 40 }).notNull(),
  memberName: varchar("member_name", { length: 160 }),
  memberEmail: varchar("member_email", { length: 180 }),
  memberExpertise: varchar("member_expertise", { length: 180 }),
  memberPhone: varchar("member_phone", { length: 30 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** University-managed people. These are deliberately separate from login users so
 * historical project membership survives a person leaving the institution. */
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  universityId: integer("university_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  studentEmployeeId: varchar("student_employee_id", { length: 80 }),
  email: varchar("email", { length: 180 }),
  mobile: varchar("mobile", { length: 30 }),
  projectRole: varchar("project_role", { length: 80 }).notNull(),
  department: varchar("department", { length: 120 }),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  experience: text("experience"),
  responsibility: text("responsibility"),
  photoUrl: text("photo_url"),
  profileUrl: text("profile_url"),
  availability: varchar("availability", { length: 32 }).notNull().default("AVAILABLE"),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fieldPersons = pgTable("field_persons", {
  id: serial("id").primaryKey(),
  universityId: integer("university_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  photoUrl: text("photo_url"),
  mobile: varchar("mobile", { length: 30 }),
  email: varchar("email", { length: 180 }),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  expertise: jsonb("expertise").$type<string[]>().notNull().default([]),
  role: varchar("role", { length: 120 }).default("Field Engineer"),
  employeeId: varchar("employee_id", { length: 80 }),
  department: varchar("department", { length: 120 }),
  organization: varchar("organization", { length: 180 }),
  experienceYears: integer("experience_years").notNull().default(0),
  registeredLocation: varchar("registered_location", { length: 200 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  serviceRadiusKm: real("service_radius_km").notNull().default(25),
  languages: jsonb("languages").$type<string[]>().notNull().default([]),
  availabilityStatus: varchar("availability_status", { length: 24 }).notNull().default("AVAILABLE"),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fieldAssignments = pgTable("field_assignments", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  fieldPersonId: integer("field_person_id").notNull().references(() => fieldPersons.id, { onDelete: "restrict" }),
  universityId: integer("university_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedBy: integer("assigned_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  expectedVisitAt: timestamp("expected_visit_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  distanceKm: real("distance_km"),
  recommendationScore: integer("recommendation_score").notNull().default(0),
  recommendationReasons: jsonb("recommendation_reasons").$type<string[]>().notNull().default([]),
  status: varchar("status", { length: 32 }).notNull().default("FIELD_PERSON_ASSIGNED"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fieldVerificationReports = pgTable("field_verification_reports", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => fieldAssignments.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  fieldPersonId: integer("field_person_id").notNull().references(() => fieldPersons.id, { onDelete: "restrict" }),
  verified: boolean("verified").notNull(),
  problemExists: varchar("problem_exists", { length: 20 }).notNull(),
  currentSituation: text("current_situation"),
  observations: text("observations").notNull(),
  severity: varchar("severity", { length: 20 }),
  affectedPeople: integer("affected_people"),
  locationConfirmed: boolean("location_confirmed").notNull().default(true),
  requiredResources: text("required_resources"),
  recommendedSolution: text("recommended_solution"),
  recommendedAction: text("recommended_action"),
  canResolveDirectly: boolean("can_resolve_directly").notNull(),
  solutionPerformed: text("solution_performed"),
  materialsUsed: text("materials_used"),
  universitySupportReason: text("university_support_reason"),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  videos: jsonb("videos").$type<string[]>().notNull().default([]),
  documents: jsonb("documents").$type<string[]>().notNull().default([]),
  latitude: real("latitude"),
  longitude: real("longitude"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const collaborationGroups = pgTable("collaboration_groups", {
  id: serial("id").primaryKey(),
  universityId: integer("university_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  goal: text("goal"),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const collaborationGroupMembers = pgTable("collaboration_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => collaborationGroups.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  role: varchar("role", { length: 80 }).notNull(),
  email: varchar("email", { length: 180 }),
  expertise: varchar("expertise", { length: 180 }),
  kind: varchar("kind", { length: 20 }).notNull().default("STUDENT"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectMilestones = pgTable("project_milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"), // PENDING | IN_PROGRESS | COMPLETED
  percentage: integer("percentage").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  documentUrl: text("document_url"),
});

export const projectProgressUpdates = pgTable("project_progress_updates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  progress: integer("progress").notNull(),
  note: text("note").notNull(),
  stage: varchar("stage", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectMessages = pgTable("project_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const industrySupport = pgTable("industry_support", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  industryId: integer("industry_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  supportType: varchar("support_type", { length: 40 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("REQUESTED"), // REQUESTED | ACTIVE | DECLINED | COMPLETED
  matchScore: integer("match_score").notNull().default(0),
  reasons: jsonb("reasons").$type<string[]>().notNull().default([]),
  requestedBy: varchar("requested_by", { length: 20 }).notNull().default("UNIVERSITY"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
});

export const citizenSatisfaction = pgTable("citizen_satisfaction", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  citizenId: integer("citizen_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  resolved: boolean("resolved").notNull().default(true),
  suggestion: text("suggestion"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityFeedback = pgTable("community_feedback", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 40 }).notNull().default("INFO"),
  link: varchar("link", { length: 200 }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationDeliveries = pgTable("notification_deliveries", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" }),
  channel: varchar("channel", { length: 20 }).notNull().default("IN_APP"),
  status: varchar("status", { length: 20 }).notNull().default("DELIVERED"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ivrSessions = pgTable("ivr_sessions", {
  id: serial("id").primaryKey(),
  sessionCode: varchar("session_code", { length: 24 }).notNull().unique(),
  phone: varchar("phone", { length: 24 }).notNull(),
  language: varchar("language", { length: 12 }),
  category: varchar("category", { length: 60 }),
  transcript: text("transcript"),
  step: varchar("step", { length: 24 }).notNull().default("LANGUAGE"),
  status: varchar("status", { length: 20 }).notNull().default("IN_PROGRESS"),
  complaintCode: varchar("complaint_code", { length: 24 }),
  challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const callRequests = pgTable("call_requests", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 24 }).notNull(),
  language: varchar("language", { length: 12 }).notNull().default("en"),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const impactReports = pgTable("impact_reports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  solution: text("solution").notNull(),
  peopleBenefited: integer("people_benefited").notNull().default(0),
  implementationDate: timestamp("implementation_date", { withTimezone: true }).notNull().defaultNow(),
  durationDays: integer("duration_days").notNull().default(0),
  satisfaction: real("satisfaction").notNull().default(0),
  impactScore: integer("impact_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fundingTransactions = pgTable("funding_transactions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  funderId: integer("funder_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("INR"),
  purpose: text("purpose"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const essentialServices = pgTable("essential_services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  contact: varchar("contact", { length: 60 }),
  region: varchar("region", { length: 120 }),
});

export const serviceProviders = pgTable("service_providers", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => essentialServices.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 24 }),
  region: varchar("region", { length: 120 }),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 80 }).notNull(),
  entity: varchar("entity", { length: 60 }).notNull(),
  entityId: integer("entity_id"),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

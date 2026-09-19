CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" varchar(80) NOT NULL,
	"entity" varchar(60) NOT NULL,
	"entity_id" integer,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(24) NOT NULL,
	"language" varchar(12) DEFAULT 'en' NOT NULL,
	"reason" text,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_ai_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"category" varchar(60) NOT NULL,
	"subcategory" varchar(80) NOT NULL,
	"summary" text NOT NULL,
	"impact" text NOT NULL,
	"severity_score" integer NOT NULL,
	"urgency_score" integer NOT NULL,
	"people_score" integer NOT NULL,
	"duration_score" integer NOT NULL,
	"safety_score" integer NOT NULL,
	"geo_score" integer NOT NULL,
	"votes_score" integer NOT NULL,
	"priority_score" integer NOT NULL,
	"priority_level" varchar(12) NOT NULL,
	"required_expertise" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence" real DEFAULT 0.8 NOT NULL,
	"engine" varchar(40) DEFAULT 'FALLBACK_DETERMINISTIC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_duplicates" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"related_challenge_id" integer NOT NULL,
	"similarity" integer NOT NULL,
	"status" varchar(20) DEFAULT 'FLAGGED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_lifecycle_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"stage" varchar(32) NOT NULL,
	"note" text NOT NULL,
	"actor_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"university_id" integer NOT NULL,
	"match_score" integer NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'RECOMMENDED' NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"citizen_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"complaint_code" varchar(24) NOT NULL,
	"citizen_id" integer NOT NULL,
	"title" varchar(220) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(60) NOT NULL,
	"subcategory" varchar(80),
	"location" varchar(200) NOT NULL,
	"landmark" varchar(200),
	"address" text,
	"latitude" real,
	"longitude" real,
	"location_description" text,
	"attachment_urls" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"severity" varchar(20) DEFAULT 'MEDIUM' NOT NULL,
	"duration_days" integer DEFAULT 7 NOT NULL,
	"people_affected" integer DEFAULT 50 NOT NULL,
	"image_url" text,
	"language" varchar(12) DEFAULT 'en' NOT NULL,
	"input_method" varchar(12) DEFAULT 'TEXT' NOT NULL,
	"original_language" varchar(12) DEFAULT 'en' NOT NULL,
	"original_text" text,
	"status" varchar(32) DEFAULT 'REPORTED' NOT NULL,
	"priority_score" integer DEFAULT 0 NOT NULL,
	"priority_level" varchar(12) DEFAULT 'LOW' NOT NULL,
	"votes" integer DEFAULT 0 NOT NULL,
	"is_seed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "challenges_complaint_code_unique" UNIQUE("complaint_code")
);
--> statement-breakpoint
CREATE TABLE "citizen_satisfaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"project_id" integer,
	"citizen_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"resolved" boolean DEFAULT true NOT NULL,
	"suggestion" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"role" varchar(80) NOT NULL,
	"email" varchar(180),
	"expertise" varchar(180),
	"kind" varchar(20) DEFAULT 'STUDENT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"university_id" integer NOT NULL,
	"project_id" integer,
	"name" varchar(120) NOT NULL,
	"description" text,
	"goal" text,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "essential_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"category" varchar(60) NOT NULL,
	"contact" varchar(60),
	"region" varchar(120)
);
--> statement-breakpoint
CREATE TABLE "field_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"field_person_id" integer NOT NULL,
	"university_id" integer NOT NULL,
	"assigned_by" integer NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_visit_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"distance_km" real,
	"recommendation_score" integer DEFAULT 0 NOT NULL,
	"recommendation_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'FIELD_PERSON_ASSIGNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_persons" (
	"id" serial PRIMARY KEY NOT NULL,
	"university_id" integer NOT NULL,
	"user_id" integer,
	"full_name" varchar(160) NOT NULL,
	"photo_url" text,
	"mobile" varchar(30),
	"email" varchar(180),
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expertise" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"role" varchar(120) DEFAULT 'Field Engineer',
	"employee_id" varchar(80),
	"department" varchar(120),
	"organization" varchar(180),
	"experience_years" integer DEFAULT 0 NOT NULL,
	"registered_location" varchar(200),
	"latitude" real,
	"longitude" real,
	"service_radius_km" real DEFAULT 25 NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"availability_status" varchar(24) DEFAULT 'AVAILABLE' NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_verification_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"challenge_id" integer NOT NULL,
	"field_person_id" integer NOT NULL,
	"verified" boolean NOT NULL,
	"problem_exists" varchar(20) NOT NULL,
	"current_situation" text,
	"observations" text NOT NULL,
	"severity" varchar(20),
	"affected_people" integer,
	"location_confirmed" boolean DEFAULT true NOT NULL,
	"required_resources" text,
	"recommended_solution" text,
	"recommended_action" text,
	"can_resolve_directly" boolean NOT NULL,
	"solution_performed" text,
	"materials_used" text,
	"university_support_reason" text,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"videos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"latitude" real,
	"longitude" real,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funding_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"funder_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"purpose" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "impact_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"challenge_id" integer NOT NULL,
	"solution" text NOT NULL,
	"people_benefited" integer DEFAULT 0 NOT NULL,
	"implementation_date" timestamp with time zone DEFAULT now() NOT NULL,
	"duration_days" integer DEFAULT 0 NOT NULL,
	"satisfaction" real DEFAULT 0 NOT NULL,
	"impact_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industry_expertise" (
	"id" serial PRIMARY KEY NOT NULL,
	"industry_id" integer NOT NULL,
	"technologies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"support_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deployment_capability" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industry_support" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"industry_id" integer NOT NULL,
	"support_type" varchar(40) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(20) DEFAULT 'REQUESTED' NOT NULL,
	"match_score" integer DEFAULT 0 NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requested_by" varchar(20) DEFAULT 'UNIVERSITY' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ivr_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_code" varchar(24) NOT NULL,
	"phone" varchar(24) NOT NULL,
	"language" varchar(12),
	"category" varchar(60),
	"transcript" text,
	"step" varchar(24) DEFAULT 'LANGUAGE' NOT NULL,
	"status" varchar(20) DEFAULT 'IN_PROGRESS' NOT NULL,
	"complaint_code" varchar(24),
	"challenge_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ivr_sessions_session_code_unique" UNIQUE("session_code")
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_id" integer NOT NULL,
	"channel" varchar(20) DEFAULT 'IN_APP' NOT NULL,
	"status" varchar(20) DEFAULT 'DELIVERED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(160) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(40) DEFAULT 'INFO' NOT NULL,
	"link" varchar(200),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"member_role" varchar(40) NOT NULL,
	"member_name" varchar(160),
	"member_email" varchar(180),
	"member_expertise" varchar(180),
	"member_phone" varchar(30),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"percentage" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"document_url" text
);
--> statement-breakpoint
CREATE TABLE "project_progress_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"progress" integer NOT NULL,
	"note" text NOT NULL,
	"stage" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"university_id" integer NOT NULL,
	"title" varchar(220) NOT NULL,
	"description" text NOT NULL,
	"department" varchar(120),
	"status" varchar(32) DEFAULT 'PROJECT_CREATED' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"required_tech" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "service_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"phone" varchar(24),
	"region" varchar(120)
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"university_id" integer NOT NULL,
	"challenge_id" integer NOT NULL,
	"project_id" integer,
	"full_name" varchar(160) NOT NULL,
	"student_employee_id" varchar(80),
	"email" varchar(180),
	"mobile" varchar(30),
	"project_role" varchar(80) NOT NULL,
	"department" varchar(120),
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"experience" text,
	"responsibility" text,
	"photo_url" text,
	"profile_url" text,
	"availability" varchar(32) DEFAULT 'AVAILABLE' NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universities_expertise" (
	"id" serial PRIMARY KEY NOT NULL,
	"university_id" integer NOT NULL,
	"departments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"research_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"faculty_expertise" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"student_teams" integer DEFAULT 0 NOT NULL,
	"previous_projects" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(180) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(24) DEFAULT 'CITIZEN' NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"organization_name" varchar(180),
	"phone" varchar(24),
	"language" varchar(12) DEFAULT 'en' NOT NULL,
	"city" varchar(120),
	"state" varchar(120),
	"bio" text,
	"verification_status" varchar(24) DEFAULT 'PENDING' NOT NULL,
	"verification_doc_type" varchar(80),
	"verification_documents" text,
	"verification_notes" text,
	"verified_at" timestamp with time zone,
	"is_seed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_ai_analysis" ADD CONSTRAINT "challenge_ai_analysis_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_duplicates" ADD CONSTRAINT "challenge_duplicates_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_duplicates" ADD CONSTRAINT "challenge_duplicates_related_challenge_id_challenges_id_fk" FOREIGN KEY ("related_challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_lifecycle_events" ADD CONSTRAINT "challenge_lifecycle_events_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_lifecycle_events" ADD CONSTRAINT "challenge_lifecycle_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_matches" ADD CONSTRAINT "challenge_matches_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_matches" ADD CONSTRAINT "challenge_matches_university_id_users_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_votes" ADD CONSTRAINT "challenge_votes_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_votes" ADD CONSTRAINT "challenge_votes_citizen_id_users_id_fk" FOREIGN KEY ("citizen_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_citizen_id_users_id_fk" FOREIGN KEY ("citizen_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citizen_satisfaction" ADD CONSTRAINT "citizen_satisfaction_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citizen_satisfaction" ADD CONSTRAINT "citizen_satisfaction_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citizen_satisfaction" ADD CONSTRAINT "citizen_satisfaction_citizen_id_users_id_fk" FOREIGN KEY ("citizen_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_group_members" ADD CONSTRAINT "collaboration_group_members_group_id_collaboration_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."collaboration_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_groups" ADD CONSTRAINT "collaboration_groups_university_id_users_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_groups" ADD CONSTRAINT "collaboration_groups_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_feedback" ADD CONSTRAINT "community_feedback_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_feedback" ADD CONSTRAINT "community_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_assignments" ADD CONSTRAINT "field_assignments_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_assignments" ADD CONSTRAINT "field_assignments_field_person_id_field_persons_id_fk" FOREIGN KEY ("field_person_id") REFERENCES "public"."field_persons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_assignments" ADD CONSTRAINT "field_assignments_university_id_users_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_assignments" ADD CONSTRAINT "field_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_persons" ADD CONSTRAINT "field_persons_university_id_users_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_persons" ADD CONSTRAINT "field_persons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_verification_reports" ADD CONSTRAINT "field_verification_reports_assignment_id_field_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."field_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_verification_reports" ADD CONSTRAINT "field_verification_reports_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_verification_reports" ADD CONSTRAINT "field_verification_reports_field_person_id_field_persons_id_fk" FOREIGN KEY ("field_person_id") REFERENCES "public"."field_persons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funding_transactions" ADD CONSTRAINT "funding_transactions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funding_transactions" ADD CONSTRAINT "funding_transactions_funder_id_users_id_fk" FOREIGN KEY ("funder_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_reports" ADD CONSTRAINT "impact_reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_reports" ADD CONSTRAINT "impact_reports_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_expertise" ADD CONSTRAINT "industry_expertise_industry_id_users_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_support" ADD CONSTRAINT "industry_support_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_support" ADD CONSTRAINT "industry_support_industry_id_users_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ivr_sessions" ADD CONSTRAINT "ivr_sessions_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_messages" ADD CONSTRAINT "project_messages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_messages" ADD CONSTRAINT "project_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_progress_updates" ADD CONSTRAINT "project_progress_updates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_progress_updates" ADD CONSTRAINT "project_progress_updates_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_university_id_users_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_service_id_essential_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."essential_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_university_id_users_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "universities_expertise" ADD CONSTRAINT "universities_expertise_university_id_users_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_match_unique" ON "challenge_matches" USING btree ("challenge_id","university_id");--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_vote_unique" ON "challenge_votes" USING btree ("challenge_id","citizen_id");
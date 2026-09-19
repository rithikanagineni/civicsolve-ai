import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsSchemaReady?: Promise<void>;
};

const useSsl = /neon|vercel|render|supabase|azure/i.test(databaseUrl);
export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

export async function ensureDatabaseSchema() {
  if (globalForDb.__arenaNextJsSchemaReady) return globalForDb.__arenaNextJsSchemaReady;

  globalForDb.__arenaNextJsSchemaReady = (async () => {
    const statements = [
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_status" varchar(24) NOT NULL DEFAULT 'PENDING'`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_doc_type" varchar(80)`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_documents" text`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_notes" text`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone`,
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "required_tech" jsonb NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE "project_members" ADD COLUMN IF NOT EXISTS "member_name" varchar(160)`,
      `ALTER TABLE "project_members" ADD COLUMN IF NOT EXISTS "member_email" varchar(180)`,
      `ALTER TABLE "project_members" ADD COLUMN IF NOT EXISTS "member_expertise" varchar(180)`,
      `ALTER TABLE "project_members" ADD COLUMN IF NOT EXISTS "member_phone" varchar(30)`,
      `ALTER TABLE "project_milestones" ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0`,
      `ALTER TABLE "project_milestones" ADD COLUMN IF NOT EXISTS "due_date" timestamp with time zone`,
      `ALTER TABLE "project_milestones" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone`,
      `ALTER TABLE "project_milestones" ADD COLUMN IF NOT EXISTS "document_url" text`,
      `ALTER TABLE "industry_support" ADD COLUMN IF NOT EXISTS "requested_by" varchar(20) NOT NULL DEFAULT 'UNIVERSITY'`,
      `ALTER TABLE "industry_support" ADD COLUMN IF NOT EXISTS "accepted_at" timestamp with time zone`,
      `ALTER TABLE "challenge_lifecycle_events" ADD COLUMN IF NOT EXISTS "actor_id" integer`,
      `ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "address" text`,
      `ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "latitude" real`,
      `ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "longitude" real`,
      `ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "location_description" text`,
      `ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "attachment_urls" jsonb NOT NULL DEFAULT '{}'::jsonb`,
      `CREATE TABLE IF NOT EXISTS "collaboration_groups" ("id" serial primary key, "university_id" integer not null references "users"("id") on delete cascade, "project_id" integer references "projects"("id") on delete set null, "name" varchar(120) not null, "description" text, "goal" text, "status" varchar(20) not null default 'ACTIVE', "created_at" timestamp with time zone not null default now())`,
      `CREATE TABLE IF NOT EXISTS "collaboration_group_members" ("id" serial primary key, "group_id" integer not null references "collaboration_groups"("id") on delete cascade, "name" varchar(160) not null, "role" varchar(80) not null, "email" varchar(180), "expertise" varchar(180), "kind" varchar(20) not null default 'STUDENT', "created_at" timestamp with time zone not null default now())`,
      `CREATE TABLE IF NOT EXISTS "project_messages" ("id" serial primary key, "project_id" integer not null references "projects"("id") on delete cascade, "sender_id" integer not null references "users"("id") on delete cascade, "body" text not null, "created_at" timestamp with time zone not null default now())`,
      `CREATE TABLE IF NOT EXISTS "project_progress_updates" ("id" serial primary key, "project_id" integer not null references "projects"("id") on delete cascade, "author_id" integer not null references "users"("id") on delete cascade, "progress" integer not null, "note" text not null, "stage" varchar(32), "created_at" timestamp with time zone not null default now())`,
      `CREATE TABLE IF NOT EXISTS "team_members" ("id" serial primary key, "university_id" integer not null references "users"("id") on delete cascade, "challenge_id" integer not null references "challenges"("id") on delete cascade, "project_id" integer references "projects"("id") on delete set null, "full_name" varchar(160) not null, "student_employee_id" varchar(80), "email" varchar(180), "mobile" varchar(30), "project_role" varchar(80) not null, "department" varchar(120), "skills" jsonb not null default '[]'::jsonb, "experience" text, "responsibility" text, "photo_url" text, "profile_url" text, "availability" varchar(32) not null default 'AVAILABLE', "status" varchar(20) not null default 'ACTIVE', "created_at" timestamp with time zone not null default now(), "updated_at" timestamp with time zone not null default now())`,
      `CREATE TABLE IF NOT EXISTS "field_persons" ("id" serial primary key, "university_id" integer not null references "users"("id") on delete cascade, "user_id" integer references "users"("id") on delete set null, "full_name" varchar(160) not null, "photo_url" text, "mobile" varchar(30), "email" varchar(180), "skills" jsonb not null default '[]'::jsonb, "expertise" jsonb not null default '[]'::jsonb, "department" varchar(120), "organization" varchar(180), "experience_years" integer not null default 0, "registered_location" varchar(200), "latitude" real, "longitude" real, "service_radius_km" real not null default 25, "languages" jsonb not null default '[]'::jsonb, "availability_status" varchar(24) not null default 'AVAILABLE', "status" varchar(20) not null default 'ACTIVE', "created_at" timestamp with time zone not null default now(), "updated_at" timestamp with time zone not null default now())`,
      `CREATE TABLE IF NOT EXISTS "field_assignments" ("id" serial primary key, "challenge_id" integer not null references "challenges"("id") on delete cascade, "field_person_id" integer not null references "field_persons"("id") on delete restrict, "university_id" integer not null references "users"("id") on delete cascade, "assigned_by" integer not null references "users"("id") on delete restrict, "assigned_at" timestamp with time zone not null default now(), "expected_visit_at" timestamp with time zone, "started_at" timestamp with time zone, "completed_at" timestamp with time zone, "distance_km" real, "recommendation_score" integer not null default 0, "status" varchar(32) not null default 'FIELD_PERSON_ASSIGNED', "created_at" timestamp with time zone not null default now(), "updated_at" timestamp with time zone not null default now())`,
      `ALTER TABLE "field_assignments" ADD COLUMN IF NOT EXISTS "recommendation_reasons" jsonb NOT NULL DEFAULT '[]'::jsonb`,
      `CREATE TABLE IF NOT EXISTS "field_verification_reports" ("id" serial primary key, "assignment_id" integer not null references "field_assignments"("id") on delete cascade, "challenge_id" integer not null references "challenges"("id") on delete cascade, "field_person_id" integer not null references "field_persons"("id") on delete restrict, "verified" boolean not null, "problem_exists" varchar(20) not null, "current_situation" text, "observations" text not null, "severity" varchar(20), "affected_people" integer, "required_resources" text, "recommended_solution" text, "can_resolve_directly" boolean not null, "solution_performed" text, "university_support_reason" text, "photos" jsonb not null default '[]'::jsonb, "videos" jsonb not null default '[]'::jsonb, "documents" jsonb not null default '[]'::jsonb, "latitude" real, "longitude" real, "submitted_at" timestamp with time zone not null default now())`,
      `ALTER TABLE "field_verification_reports" ADD COLUMN IF NOT EXISTS "location_confirmed" boolean NOT NULL DEFAULT true`,
      `ALTER TABLE "field_verification_reports" ADD COLUMN IF NOT EXISTS "recommended_action" text`,
      `ALTER TABLE "field_verification_reports" ADD COLUMN IF NOT EXISTS "materials_used" text`,
      `ALTER TABLE "field_persons" ADD COLUMN IF NOT EXISTS "role" varchar(120) DEFAULT 'Field Engineer'`,
      `ALTER TABLE "field_persons" ADD COLUMN IF NOT EXISTS "employee_id" varchar(80)`,
    ] as const;

    for (const statement of statements) {
      await db.execute(sql.raw(statement));
    }
  })();

  return globalForDb.__arenaNextJsSchemaReady;
}

void ensureDatabaseSchema();

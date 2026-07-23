import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const applications = sqliteTable(
  "applications",
  {
    userId: text("user_id").notNull(),
    id: text("id").notNull(),
    companyId: text("company_id").notNull(),
    companyName: text("company_name").notNull(),
    roleTitle: text("role_title").notNull(),
    employmentType: text("employment_type").notNull().default("internship"),
    region: text("region").notNull().default("US"),
    status: text("status").notNull().default("researching"),
    priority: text("priority").notNull().default("medium"),
    jobUrl: text("job_url").notNull().default(""),
    deadline: text("deadline").notNull().default(""),
    sponsorshipSignal: text("sponsorship_signal").notNull().default("unknown"),
    exportSignal: text("export_signal").notNull().default("unknown"),
    contact: text("contact").notNull().default(""),
    resumeVersion: text("resume_version").notNull().default(""),
    jdKeywords: text("jd_keywords").notNull().default(""),
    sourceObservedAt: text("source_observed_at").notNull().default(""),
    matchScore: integer("match_score").notNull().default(0),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.id] })],
);

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    userId: text("user_id").notNull(),
    companyId: text("company_id").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.companyId] })],
);

export const skillProgress = sqliteTable(
  "skill_progress",
  {
    userId: text("user_id").notNull(),
    skillId: text("skill_id").notNull(),
    mastery: integer("mastery").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.skillId] })],
);

export const questionAttempts = sqliteTable(
  "question_attempts",
  {
    userId: text("user_id").notNull(),
    id: text("id").notNull(),
    questionId: text("question_id").notNull(),
    questionVersion: text("question_version").notNull(),
    score: integer("score").notNull().default(0),
    confidence: integer("confidence").notNull().default(0),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.id] })],
);

export const questionStats = sqliteTable(
  "question_stats",
  {
    userId: text("user_id").notNull(),
    questionId: text("question_id").notNull(),
    questionVersion: text("question_version").notNull(),
    attempts: integer("attempts").notNull().default(0),
    bestScore: integer("best_score").notNull().default(0),
    latestScore: integer("latest_score").notNull().default(0),
    totalScore: integer("total_score").notNull().default(0),
    latestConfidence: integer("latest_confidence").notNull().default(0),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.questionId, table.questionVersion],
    }),
  ],
);

export const preferences = sqliteTable(
  "preferences",
  {
    userId: text("user_id").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.key] })],
);

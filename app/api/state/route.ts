import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ApplicationInput = {
  id?: string;
  companyId?: string;
  companyName?: string;
  roleTitle?: string;
  employmentType?: string;
  region?: string;
  status?: string;
  priority?: string;
  jobUrl?: string;
  deadline?: string;
  sponsorshipSignal?: string;
  exportSignal?: string;
  contact?: string;
  resumeVersion?: string;
  jdKeywords?: string;
  sourceObservedAt?: string;
  matchScore?: number;
  notes?: string;
};

const applicationStatuses = new Set([
  "researching",
  "ready",
  "applied",
  "oa",
  "interview",
  "offer",
  "closed",
]);
const priorities = new Set(["high", "medium", "low"]);
const opportunitySignals = new Set([
  "green",
  "yellow",
  "orange",
  "red",
  "unknown",
]);
const employmentTypes = new Set([
  "internship",
  "co-op",
  "research",
  "part-time",
  "new-grad",
  "unpaid",
  "open-source",
]);

function text(value: unknown, maximum = 500): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function integer(value: unknown, minimum: number, maximum: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return minimum;
  return Math.max(minimum, Math.min(maximum, Math.round(parsed)));
}

function httpUrl(value: unknown, maximum = 1200): string | null {
  const normalized = text(value, maximum);
  if (!normalized) return "";
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function privateJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

function isAuthorized(request: Request): boolean {
  return Boolean(userId(request));
}

function userId(request: Request): string {
  const url = new URL(request.url);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return "local-dev";
  }
  return text(request.headers.get("oai-authenticated-user-email"), 320)
    .toLowerCase();
}

async function ensureSchema() {
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS applications (
      user_id TEXT NOT NULL,
      id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      company_name TEXT NOT NULL,
      role_title TEXT NOT NULL,
      employment_type TEXT NOT NULL DEFAULT 'internship',
      region TEXT NOT NULL DEFAULT 'US',
      status TEXT NOT NULL DEFAULT 'researching',
      priority TEXT NOT NULL DEFAULT 'medium',
      job_url TEXT NOT NULL DEFAULT '',
      deadline TEXT NOT NULL DEFAULT '',
      sponsorship_signal TEXT NOT NULL DEFAULT 'unknown',
      export_signal TEXT NOT NULL DEFAULT 'unknown',
      contact TEXT NOT NULL DEFAULT '',
      resume_version TEXT NOT NULL DEFAULT '',
      jd_keywords TEXT NOT NULL DEFAULT '',
      source_observed_at TEXT NOT NULL DEFAULT '',
      match_score INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS question_stats (
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      question_version TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      best_score INTEGER NOT NULL DEFAULT 0,
      latest_score INTEGER NOT NULL DEFAULT 0,
      total_score INTEGER NOT NULL DEFAULT 0,
      latest_confidence INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, question_id, question_version)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS bookmarks (
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, company_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS skill_progress (
      user_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      mastery INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, skill_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS question_attempts (
      user_id TEXT NOT NULL,
      id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      question_version TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      confidence INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS preferences (
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, key)
    )`),
  ]);
}

async function readState(ownerId: string) {
  const db = env.DB;
  const [applications, stats, bookmarks, progress, attempts, preferences] =
    await Promise.all([
      db
        .prepare(
          "SELECT id, company_id, company_name, role_title, employment_type, region, status, priority, job_url, deadline, sponsorship_signal, export_signal, contact, resume_version, jd_keywords, source_observed_at, match_score, notes, created_at, updated_at FROM applications WHERE user_id = ? ORDER BY updated_at DESC",
        )
        .bind(ownerId)
        .all(),
      db
        .prepare(
          "SELECT question_id, question_version, attempts, best_score, latest_score, total_score, latest_confidence, updated_at FROM question_stats WHERE user_id = ?",
        )
        .bind(ownerId)
        .all(),
      db
        .prepare("SELECT company_id FROM bookmarks WHERE user_id = ?")
        .bind(ownerId)
        .all(),
      db
        .prepare(
          "SELECT skill_id, mastery, attempts, updated_at FROM skill_progress WHERE user_id = ?",
        )
        .bind(ownerId)
        .all(),
      db
        .prepare(
          "SELECT id, question_id, question_version, score, confidence, notes, created_at FROM question_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 250",
        )
        .bind(ownerId)
        .all(),
      db
        .prepare("SELECT key, value FROM preferences WHERE user_id = ?")
        .bind(ownerId)
        .all(),
    ]);

  const bookmarkRows = bookmarks.results as Array<{ company_id: string }>;
  const preferenceRows = preferences.results as Array<{
    key: string;
    value: string;
  }>;
  return {
    applications: applications.results,
    bookmarks: bookmarkRows.map((row) => row.company_id),
    skillProgress: progress.results,
    questionAttempts: attempts.results,
    questionStats: stats.results,
    preferences: Object.fromEntries(preferenceRows.map((row) => [row.key, row.value])),
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return privateJson({ error: "Authentication required" }, { status: 401 });
  }
  await ensureSchema();
  return privateJson(await readState(userId(request)));
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return privateJson({ error: "Authentication required" }, { status: 401 });
  }
  await ensureSchema();

  let body: Record<string, unknown>;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 50_000) {
      return privateJson({ error: "Request body too large" }, { status: 413 });
    }
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return privateJson({ error: "Malformed JSON" }, { status: 400 });
  }
  const action = text(body.action, 40);
  const db = env.DB;
  const ownerId = userId(request);

  if (action === "saveApplication") {
    const input = (body.application ?? {}) as ApplicationInput;
    const id = text(input.id, 100) || crypto.randomUUID();
    const companyId = text(input.companyId, 120);
    const companyName = text(input.companyName, 180);
    const roleTitle = text(input.roleTitle, 240);
    const jobUrl = httpUrl(input.jobUrl);
    if (!companyId || !companyName || !roleTitle) {
      return privateJson(
        { error: "Company and role are required" },
        { status: 400 },
      );
    }
    if (jobUrl === null) {
      return privateJson(
        { error: "Job URL must use http or https" },
        { status: 400 },
      );
    }
    const status = applicationStatuses.has(text(input.status, 30))
      ? text(input.status, 30)
      : "researching";
    const priority = priorities.has(text(input.priority, 20))
      ? text(input.priority, 20)
      : "medium";
    const employmentType = employmentTypes.has(text(input.employmentType, 30))
      ? text(input.employmentType, 30)
      : "internship";
    const sponsorshipSignal = opportunitySignals.has(
      text(input.sponsorshipSignal, 20),
    )
      ? text(input.sponsorshipSignal, 20)
      : "unknown";
    const exportSignal = opportunitySignals.has(text(input.exportSignal, 20))
      ? text(input.exportSignal, 20)
      : "unknown";

    await db
      .prepare(`INSERT INTO applications (
        user_id, id, company_id, company_name, role_title, employment_type,
        region, status, priority, job_url, deadline, sponsorship_signal,
        export_signal, contact, resume_version, jd_keywords, source_observed_at,
        match_score, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, id) DO UPDATE SET
        company_id = excluded.company_id,
        company_name = excluded.company_name,
        role_title = excluded.role_title,
        employment_type = excluded.employment_type,
        region = excluded.region,
        status = excluded.status,
        priority = excluded.priority,
        job_url = excluded.job_url,
        deadline = excluded.deadline,
        sponsorship_signal = excluded.sponsorship_signal,
        export_signal = excluded.export_signal,
        contact = excluded.contact,
        resume_version = excluded.resume_version,
        jd_keywords = excluded.jd_keywords,
        source_observed_at = excluded.source_observed_at,
        match_score = excluded.match_score,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP`)
      .bind(
        ownerId,
        id,
        companyId,
        companyName,
        roleTitle,
        employmentType,
        text(input.region, 40) || "US",
        status,
        priority,
        jobUrl,
        text(input.deadline, 40),
        sponsorshipSignal,
        exportSignal,
        text(input.contact, 500),
        text(input.resumeVersion, 120),
        text(input.jdKeywords, 3000),
        text(input.sourceObservedAt, 40),
        integer(input.matchScore, 0, 100),
        text(input.notes, 3000),
      )
      .run();
  } else if (action === "patchApplication") {
    const id = text(body.id, 100);
    const patch = (body.patch ?? {}) as Record<string, unknown>;
    if (!id || !patch || typeof patch !== "object" || Array.isArray(patch)) {
      return privateJson(
        { error: "Application id and patch are required" },
        { status: 400 },
      );
    }

    const updates: Array<{ column: string; value: string | number }> = [];
    const has = (key: string) =>
      Object.prototype.hasOwnProperty.call(patch, key);
    if (has("roleTitle")) {
      const value = text(patch.roleTitle, 240);
      if (!value) {
        return privateJson({ error: "Role title is required" }, { status: 400 });
      }
      updates.push({ column: "role_title", value });
    }
    if (has("employmentType")) {
      const value = text(patch.employmentType, 30);
      if (!employmentTypes.has(value)) {
        return privateJson({ error: "Invalid employment type" }, { status: 400 });
      }
      updates.push({ column: "employment_type", value });
    }
    if (has("status")) {
      const value = text(patch.status, 30);
      if (!applicationStatuses.has(value)) {
        return privateJson({ error: "Invalid application status" }, { status: 400 });
      }
      updates.push({ column: "status", value });
    }
    if (has("priority")) {
      const value = text(patch.priority, 20);
      if (!priorities.has(value)) {
        return privateJson({ error: "Invalid priority" }, { status: 400 });
      }
      updates.push({ column: "priority", value });
    }
    if (has("jobUrl")) {
      const value = httpUrl(patch.jobUrl);
      if (value === null) {
        return privateJson(
          { error: "Job URL must use http or https" },
          { status: 400 },
        );
      }
      updates.push({ column: "job_url", value });
    }
    if (has("deadline")) {
      updates.push({ column: "deadline", value: text(patch.deadline, 40) });
    }
    if (has("sponsorshipSignal")) {
      const value = text(patch.sponsorshipSignal, 20);
      if (!opportunitySignals.has(value)) {
        return privateJson({ error: "Invalid sponsorship signal" }, { status: 400 });
      }
      updates.push({ column: "sponsorship_signal", value });
    }
    if (has("exportSignal")) {
      const value = text(patch.exportSignal, 20);
      if (!opportunitySignals.has(value)) {
        return privateJson({ error: "Invalid export signal" }, { status: 400 });
      }
      updates.push({ column: "export_signal", value });
    }
    if (has("contact")) {
      updates.push({ column: "contact", value: text(patch.contact, 500) });
    }
    if (has("resumeVersion")) {
      updates.push({
        column: "resume_version",
        value: text(patch.resumeVersion, 120),
      });
    }
    if (has("jdKeywords")) {
      updates.push({
        column: "jd_keywords",
        value: text(patch.jdKeywords, 3000),
      });
    }
    if (has("sourceObservedAt")) {
      updates.push({
        column: "source_observed_at",
        value: text(patch.sourceObservedAt, 40),
      });
    }
    if (has("matchScore")) {
      updates.push({
        column: "match_score",
        value: integer(patch.matchScore, 0, 100),
      });
    }
    if (has("notes")) {
      updates.push({ column: "notes", value: text(patch.notes, 3000) });
    }
    if (!updates.length) {
      return privateJson({ error: "No supported patch fields" }, { status: 400 });
    }

    await db.batch(
      updates.map(({ column, value }) =>
        db
          .prepare(
            `UPDATE applications SET ${column} = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?`,
          )
          .bind(value, ownerId, id),
      ),
    );
  } else if (action === "deleteApplication") {
    await db
      .prepare("DELETE FROM applications WHERE user_id = ? AND id = ?")
      .bind(ownerId, text(body.id, 100))
      .run();
  } else if (action === "toggleBookmark") {
    const companyId = text(body.companyId, 120);
    if (!companyId) {
      return privateJson({ error: "Company id required" }, { status: 400 });
    }
    if (Boolean(body.active)) {
      await db
        .prepare(
          "INSERT INTO bookmarks (user_id, company_id) VALUES (?, ?) ON CONFLICT(user_id, company_id) DO NOTHING",
        )
        .bind(ownerId, companyId)
        .run();
    } else {
      await db
        .prepare("DELETE FROM bookmarks WHERE user_id = ? AND company_id = ?")
        .bind(ownerId, companyId)
        .run();
    }
  } else if (action === "setSkillProgress") {
    const skillId = text(body.skillId, 120);
    if (!skillId) {
      return privateJson({ error: "Skill id required" }, { status: 400 });
    }
    await db
      .prepare(`INSERT INTO skill_progress (user_id, skill_id, mastery, attempts, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, skill_id) DO UPDATE SET
          mastery = excluded.mastery,
          attempts = excluded.attempts,
          updated_at = CURRENT_TIMESTAMP`)
      .bind(
        ownerId,
        skillId,
        integer(body.mastery, 0, 100),
        integer(body.attempts, 0, 100000),
      )
      .run();
  } else if (action === "recordQuestionAttempt") {
    const questionId = text(body.questionId, 120);
    const questionVersion = text(body.questionVersion, 80);
    if (!questionId || !questionVersion) {
      return privateJson(
        { error: "Question id and content version required" },
        { status: 400 },
      );
    }
    const score = integer(body.score, 0, 100);
    const confidence = integer(body.confidence, 0, 100);
    await db.batch([
      db
        .prepare(`INSERT INTO question_attempts (
          user_id, id, question_id, question_version, score, confidence, notes,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
        .bind(
          ownerId,
          crypto.randomUUID(),
          questionId,
          questionVersion,
          score,
          confidence,
          text(body.notes, 3000),
        ),
      db
        .prepare(`INSERT INTO question_stats (
          user_id, question_id, question_version, attempts, best_score,
          latest_score, total_score, latest_confidence, updated_at
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, question_id, question_version) DO UPDATE SET
          attempts = question_stats.attempts + 1,
          best_score = MAX(question_stats.best_score, excluded.best_score),
          latest_score = excluded.latest_score,
          total_score = question_stats.total_score + excluded.total_score,
          latest_confidence = excluded.latest_confidence,
          updated_at = CURRENT_TIMESTAMP`)
        .bind(
          ownerId,
          questionId,
          questionVersion,
          score,
          score,
          score,
          confidence,
        ),
    ]);
  } else if (action === "setPreference") {
    const key = text(body.key, 80);
    if (!key) {
      return privateJson({ error: "Preference key required" }, { status: 400 });
    }
    await db
      .prepare(`INSERT INTO preferences (user_id, key, value, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP`)
      .bind(ownerId, key, text(body.value, 8000))
      .run();
  } else {
    return privateJson({ error: "Unsupported action" }, { status: 400 });
  }

  return privateJson(await readState(ownerId));
}

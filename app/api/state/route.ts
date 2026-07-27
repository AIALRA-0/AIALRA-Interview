import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ApplicationInput = {
  id?: string;
  companyId?: string;
  companyName?: string;
  roleTitle?: string;
  requisitionId?: string;
  roleFamilyId?: string;
  team?: string;
  businessUnit?: string;
  level?: string;
  targetLocation?: string;
  workplaceMode?: string;
  postedAt?: string;
  postingStatus?: string;
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
  responsibilities?: string;
  minimumQualifications?: string;
  preferredQualifications?: string;
  eligibilityNotes?: string;
  sourceObservedAt?: string;
  compensationStatus?: string;
  salaryMin?: string;
  salaryMax?: string;
  salaryCurrency?: string;
  salaryPeriod?: string;
  salaryLocation?: string;
  salarySourceUrl?: string;
  salarySourceTitle?: string;
  salaryBasis?: string;
  salaryObservedAt?: string;
  salaryNotes?: string;
  matchScore?: number;
  notes?: string;
};

type NormalizedCompensation = {
  compensationStatus: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryPeriod: string;
  salaryLocation: string;
  salarySourceUrl: string;
  salarySourceTitle: string;
  salaryBasis: string;
  salaryObservedAt: string;
  salaryNotes: string;
};

type CompensationValidation =
  | { value: NormalizedCompensation; error?: never }
  | { value?: never; error: string };

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
const postingStatuses = new Set(["unknown", "open", "paused", "closed"]);
const workplaceModes = new Set(["unknown", "on-site", "hybrid", "remote"]);
const compensationStatuses = new Set([
  "disclosed",
  "estimated",
  "not-disclosed",
]);
const compensationPeriods = new Set([
  "hour",
  "day",
  "week",
  "month",
  "year",
  "one-time",
  "project",
]);
const compensationBases = new Set([
  "employer-posting",
  "government-statistic",
  "government-disclosure",
  "third-party-estimate",
]);
const disclosedBases = new Set(["employer-posting", "government-disclosure"]);
const estimatedBases = new Set([
  "government-statistic",
  "third-party-estimate",
]);

const applicationColumnMigrations = {
  requisition_id: "TEXT NOT NULL DEFAULT ''",
  role_family_id: "TEXT NOT NULL DEFAULT ''",
  team: "TEXT NOT NULL DEFAULT ''",
  business_unit: "TEXT NOT NULL DEFAULT ''",
  level: "TEXT NOT NULL DEFAULT ''",
  target_location: "TEXT NOT NULL DEFAULT ''",
  workplace_mode: "TEXT NOT NULL DEFAULT 'unknown'",
  posted_at: "TEXT NOT NULL DEFAULT ''",
  posting_status: "TEXT NOT NULL DEFAULT 'unknown'",
  responsibilities: "TEXT NOT NULL DEFAULT ''",
  minimum_qualifications: "TEXT NOT NULL DEFAULT ''",
  preferred_qualifications: "TEXT NOT NULL DEFAULT ''",
  eligibility_notes: "TEXT NOT NULL DEFAULT ''",
  compensation_status: "TEXT NOT NULL DEFAULT 'not-disclosed'",
  salary_min: "TEXT NOT NULL DEFAULT ''",
  salary_max: "TEXT NOT NULL DEFAULT ''",
  salary_currency: "TEXT NOT NULL DEFAULT ''",
  salary_period: "TEXT NOT NULL DEFAULT ''",
  salary_location: "TEXT NOT NULL DEFAULT ''",
  salary_source_url: "TEXT NOT NULL DEFAULT ''",
  salary_source_title: "TEXT NOT NULL DEFAULT ''",
  salary_basis: "TEXT NOT NULL DEFAULT ''",
  salary_observed_at: "TEXT NOT NULL DEFAULT ''",
  salary_notes: "TEXT NOT NULL DEFAULT ''",
} as const;

const compensationPatchKeys = [
  "compensationStatus",
  "salaryMin",
  "salaryMax",
  "salaryCurrency",
  "salaryPeriod",
  "salaryLocation",
  "salarySourceUrl",
  "salarySourceTitle",
  "salaryBasis",
  "salaryObservedAt",
  "salaryNotes",
] as const;

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

function isoDate(value: unknown): string | null {
  const normalized = text(value, 10);
  if (!normalized) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) return null;
  const date = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== normalized
    ? null
    : normalized;
}

function salaryDecimal(value: unknown): string | null {
  const normalized = text(value, 24);
  if (!normalized) return "";
  return /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/.test(normalized)
    ? normalized
    : null;
}

function decimalUnits(value: string): number {
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function normalizeCompensation(
  input: Partial<Record<(typeof compensationPatchKeys)[number], unknown>>,
): CompensationValidation {
  const compensationStatus =
    text(input.compensationStatus, 30) || "not-disclosed";
  if (!compensationStatuses.has(compensationStatus)) {
    return { error: "Invalid compensation status" };
  }

  const salaryMin = salaryDecimal(input.salaryMin);
  const salaryMax = salaryDecimal(input.salaryMax);
  if (salaryMin === null || salaryMax === null) {
    return {
      error:
        "Salary bounds must be plain non-negative decimal values with at most two decimal places",
    };
  }
  if (
    salaryMin &&
    salaryMax &&
    decimalUnits(salaryMin) > decimalUnits(salaryMax)
  ) {
    return { error: "Salary minimum cannot exceed salary maximum" };
  }

  const rawCurrency = text(input.salaryCurrency, 3);
  const salaryCurrency = rawCurrency.toUpperCase();
  if (salaryCurrency && !/^[A-Z]{3}$/.test(salaryCurrency)) {
    return {
      error: "Salary currency must be a three-letter ISO currency code",
    };
  }

  const salaryPeriod = text(input.salaryPeriod, 20);
  if (salaryPeriod && !compensationPeriods.has(salaryPeriod)) {
    return { error: "Invalid salary period" };
  }

  const salarySourceUrl = httpUrl(input.salarySourceUrl);
  if (salarySourceUrl === null) {
    return { error: "Salary source URL must use http or https" };
  }
  const salaryObservedAt = isoDate(input.salaryObservedAt);
  if (salaryObservedAt === null) {
    return { error: "Salary observation date must use YYYY-MM-DD" };
  }

  const salaryBasis = text(input.salaryBasis, 40);
  if (salaryBasis && !compensationBases.has(salaryBasis)) {
    return { error: "Invalid salary evidence basis" };
  }

  const salaryLocation = text(input.salaryLocation, 240);
  const salarySourceTitle = text(input.salarySourceTitle, 500);
  const salaryNotes = text(input.salaryNotes, 4000);
  const hasEvidence = Boolean(
    salarySourceUrl || salarySourceTitle || salaryBasis || salaryObservedAt,
  );
  const hasCompleteEvidence = Boolean(
    salarySourceUrl && salarySourceTitle && salaryBasis && salaryObservedAt,
  );

  if (hasEvidence && !hasCompleteEvidence) {
    return {
      error:
        "Salary evidence requires a source URL, source title, basis, and observation date",
    };
  }

  if (compensationStatus === "not-disclosed") {
    if (salaryMin || salaryMax || salaryCurrency || salaryPeriod) {
      return {
        error:
          "Not-disclosed compensation cannot include salary bounds, currency, or period",
      };
    }
    if (hasCompleteEvidence && salaryBasis !== "employer-posting") {
      return {
        error:
          "Not-disclosed compensation evidence must reference the employer posting",
      };
    }
  } else {
    if (!salaryMin && !salaryMax) {
      return {
        error: "Disclosed or estimated compensation requires a salary bound",
      };
    }
    if (
      !salaryCurrency ||
      !salaryPeriod ||
      !salaryLocation ||
      !hasCompleteEvidence
    ) {
      return {
        error:
          "Disclosed or estimated compensation requires currency, period, location, and complete source evidence",
      };
    }
    if (
      compensationStatus === "disclosed" &&
      !disclosedBases.has(salaryBasis)
    ) {
      return {
        error:
          "Disclosed compensation must come from an employer posting or government disclosure",
      };
    }
    if (
      compensationStatus === "estimated" &&
      !estimatedBases.has(salaryBasis)
    ) {
      return {
        error:
          "Estimated compensation must use a government statistic or third-party estimate",
      };
    }
  }

  return {
    value: {
      compensationStatus,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryPeriod,
      salaryLocation,
      salarySourceUrl,
      salarySourceTitle,
      salaryBasis,
      salaryObservedAt,
      salaryNotes,
    },
  };
}

function privateJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

function isAuthorized(request: Request): boolean {
  return Boolean(userId(request));
}

function constantTimeTextEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function userId(request: Request): string {
  const url = new URL(request.url);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return "local-dev";
  }
  const proxySecret = text(
    (env as unknown as { AIALRA_PROXY_SHARED_SECRET?: string })
      .AIALRA_PROXY_SHARED_SECRET,
    512,
  );
  const presentedSecret = text(
    request.headers.get("x-aialra-proxy-secret"),
    512,
  );
  if (
    proxySecret &&
    presentedSecret &&
    constantTimeTextEqual(proxySecret, presentedSecret) &&
    request.headers.get("x-aialra-authenticated") === "1"
  ) {
    const email = text(
      request.headers.get("x-aialra-email"),
      320,
    ).toLowerCase();
    if (email) return email;
    const subject = text(request.headers.get("x-aialra-sub"), 320);
    if (subject) return `authentik:${subject}`;
  }
  return text(
    request.headers.get("oai-authenticated-user-email"),
    320,
  ).toLowerCase();
}

async function ensureApplicationColumns() {
  const db = env.DB;
  const current = await db.prepare("PRAGMA table_info(applications)").all();
  const knownColumns = new Set(
    (current.results as Array<{ name?: unknown }>).flatMap((row) =>
      typeof row.name === "string" ? [row.name] : [],
    ),
  );

  for (const [column, definition] of Object.entries(
    applicationColumnMigrations,
  )) {
    if (knownColumns.has(column)) continue;
    try {
      await db
        .prepare(`ALTER TABLE applications ADD COLUMN ${column} ${definition}`)
        .run();
      knownColumns.add(column);
    } catch (error) {
      // Multiple isolates can observe the same missing column. Confirm another
      // request completed the migration before treating the race as a failure.
      const refreshed = await db
        .prepare("PRAGMA table_info(applications)")
        .all();
      const migrated = (refreshed.results as Array<{ name?: unknown }>).some(
        (row) => row.name === column,
      );
      if (!migrated) throw error;
      knownColumns.add(column);
    }
  }
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
      requisition_id TEXT NOT NULL DEFAULT '',
      role_family_id TEXT NOT NULL DEFAULT '',
      team TEXT NOT NULL DEFAULT '',
      business_unit TEXT NOT NULL DEFAULT '',
      level TEXT NOT NULL DEFAULT '',
      target_location TEXT NOT NULL DEFAULT '',
      workplace_mode TEXT NOT NULL DEFAULT 'unknown',
      posted_at TEXT NOT NULL DEFAULT '',
      posting_status TEXT NOT NULL DEFAULT 'unknown',
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
      responsibilities TEXT NOT NULL DEFAULT '',
      minimum_qualifications TEXT NOT NULL DEFAULT '',
      preferred_qualifications TEXT NOT NULL DEFAULT '',
      eligibility_notes TEXT NOT NULL DEFAULT '',
      source_observed_at TEXT NOT NULL DEFAULT '',
      compensation_status TEXT NOT NULL DEFAULT 'not-disclosed',
      salary_min TEXT NOT NULL DEFAULT '',
      salary_max TEXT NOT NULL DEFAULT '',
      salary_currency TEXT NOT NULL DEFAULT '',
      salary_period TEXT NOT NULL DEFAULT '',
      salary_location TEXT NOT NULL DEFAULT '',
      salary_source_url TEXT NOT NULL DEFAULT '',
      salary_source_title TEXT NOT NULL DEFAULT '',
      salary_basis TEXT NOT NULL DEFAULT '',
      salary_observed_at TEXT NOT NULL DEFAULT '',
      salary_notes TEXT NOT NULL DEFAULT '',
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
  await ensureApplicationColumns();
}

async function readState(ownerId: string) {
  const db = env.DB;
  const [applications, stats, bookmarks, progress, attempts, preferences] =
    await Promise.all([
      db
        .prepare(
          `SELECT id, company_id, company_name, role_title, requisition_id,
            role_family_id, team, business_unit, level, target_location,
            workplace_mode, posted_at, posting_status, employment_type, region,
            status, priority, job_url, deadline, sponsorship_signal,
            export_signal, contact, resume_version, jd_keywords,
            responsibilities, minimum_qualifications, preferred_qualifications,
            eligibility_notes, source_observed_at, compensation_status,
            salary_min, salary_max, salary_currency, salary_period,
            salary_location, salary_source_url, salary_source_title,
            salary_basis, salary_observed_at, salary_notes, match_score, notes,
            created_at, updated_at
          FROM applications WHERE user_id = ?
          ORDER BY updated_at DESC`,
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
    preferences: Object.fromEntries(
      preferenceRows.map((row) => [row.key, row.value]),
    ),
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
    const deadline = isoDate(input.deadline);
    const postedAt = isoDate(input.postedAt);
    const sourceObservedAt = isoDate(input.sourceObservedAt);
    if (deadline === null || postedAt === null || sourceObservedAt === null) {
      return privateJson(
        { error: "Job dates must use YYYY-MM-DD" },
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
    const workplaceMode = text(input.workplaceMode, 30) || "unknown";
    const postingStatus = text(input.postingStatus, 30) || "unknown";
    if (!workplaceModes.has(workplaceMode)) {
      return privateJson({ error: "Invalid workplace mode" }, { status: 400 });
    }
    if (!postingStatuses.has(postingStatus)) {
      return privateJson({ error: "Invalid posting status" }, { status: 400 });
    }
    const compensation = normalizeCompensation(input);
    if ("error" in compensation) {
      return privateJson({ error: compensation.error }, { status: 400 });
    }
    const salary = compensation.value;

    await db
      .prepare(
        `INSERT INTO applications (
        user_id, id, company_id, company_name, role_title, requisition_id,
        role_family_id, team, business_unit, level, target_location,
        workplace_mode, posted_at, posting_status, employment_type, region,
        status, priority, job_url, deadline, sponsorship_signal, export_signal,
        contact, resume_version, jd_keywords, responsibilities,
        minimum_qualifications, preferred_qualifications, eligibility_notes,
        source_observed_at, compensation_status, salary_min, salary_max,
        salary_currency, salary_period, salary_location, salary_source_url,
        salary_source_title, salary_basis, salary_observed_at, salary_notes,
        match_score, notes, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT(user_id, id) DO UPDATE SET
        company_id = excluded.company_id,
        company_name = excluded.company_name,
        role_title = excluded.role_title,
        requisition_id = excluded.requisition_id,
        role_family_id = excluded.role_family_id,
        team = excluded.team,
        business_unit = excluded.business_unit,
        level = excluded.level,
        target_location = excluded.target_location,
        workplace_mode = excluded.workplace_mode,
        posted_at = excluded.posted_at,
        posting_status = excluded.posting_status,
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
        responsibilities = excluded.responsibilities,
        minimum_qualifications = excluded.minimum_qualifications,
        preferred_qualifications = excluded.preferred_qualifications,
        eligibility_notes = excluded.eligibility_notes,
        source_observed_at = excluded.source_observed_at,
        compensation_status = excluded.compensation_status,
        salary_min = excluded.salary_min,
        salary_max = excluded.salary_max,
        salary_currency = excluded.salary_currency,
        salary_period = excluded.salary_period,
        salary_location = excluded.salary_location,
        salary_source_url = excluded.salary_source_url,
        salary_source_title = excluded.salary_source_title,
        salary_basis = excluded.salary_basis,
        salary_observed_at = excluded.salary_observed_at,
        salary_notes = excluded.salary_notes,
        match_score = excluded.match_score,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        ownerId,
        id,
        companyId,
        companyName,
        roleTitle,
        text(input.requisitionId, 120),
        text(input.roleFamilyId, 120),
        text(input.team, 240),
        text(input.businessUnit, 240),
        text(input.level, 120),
        text(input.targetLocation, 240),
        workplaceMode,
        postedAt,
        postingStatus,
        employmentType,
        text(input.region, 40) || "US",
        status,
        priority,
        jobUrl,
        deadline,
        sponsorshipSignal,
        exportSignal,
        text(input.contact, 500),
        text(input.resumeVersion, 120),
        text(input.jdKeywords, 3000),
        text(input.responsibilities, 8000),
        text(input.minimumQualifications, 8000),
        text(input.preferredQualifications, 8000),
        text(input.eligibilityNotes, 6000),
        sourceObservedAt,
        salary.compensationStatus,
        salary.salaryMin,
        salary.salaryMax,
        salary.salaryCurrency,
        salary.salaryPeriod,
        salary.salaryLocation,
        salary.salarySourceUrl,
        salary.salarySourceTitle,
        salary.salaryBasis,
        salary.salaryObservedAt,
        salary.salaryNotes,
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
    const existingResult = await db
      .prepare(
        `SELECT compensation_status, salary_min, salary_max, salary_currency,
          salary_period, salary_location, salary_source_url,
          salary_source_title, salary_basis, salary_observed_at, salary_notes
        FROM applications
        WHERE user_id = ? AND id = ?`,
      )
      .bind(ownerId, id)
      .all();
    const existing = existingResult.results[0] as
      Record<string, unknown> | undefined;
    if (!existing) {
      return privateJson({ error: "Application not found" }, { status: 404 });
    }

    const requiredTextFields = [
      ["companyId", "company_id", 120, "Company id"],
      ["companyName", "company_name", 180, "Company name"],
      ["roleTitle", "role_title", 240, "Role title"],
      ["region", "region", 40, "Region"],
    ] as const;
    for (const [key, column, maximum, label] of requiredTextFields) {
      if (!has(key)) continue;
      const value = text(patch[key], maximum);
      if (!value) {
        return privateJson({ error: `${label} is required` }, { status: 400 });
      }
      updates.push({ column, value });
    }

    const optionalTextFields = [
      ["requisitionId", "requisition_id", 120],
      ["roleFamilyId", "role_family_id", 120],
      ["team", "team", 240],
      ["businessUnit", "business_unit", 240],
      ["level", "level", 120],
      ["targetLocation", "target_location", 240],
      ["contact", "contact", 500],
      ["resumeVersion", "resume_version", 120],
      ["jdKeywords", "jd_keywords", 3000],
      ["responsibilities", "responsibilities", 8000],
      ["minimumQualifications", "minimum_qualifications", 8000],
      ["preferredQualifications", "preferred_qualifications", 8000],
      ["eligibilityNotes", "eligibility_notes", 6000],
      ["notes", "notes", 3000],
    ] as const;
    for (const [key, column, maximum] of optionalTextFields) {
      if (has(key)) {
        updates.push({ column, value: text(patch[key], maximum) });
      }
    }

    if (has("workplaceMode")) {
      const value = text(patch.workplaceMode, 30);
      if (!workplaceModes.has(value)) {
        return privateJson(
          { error: "Invalid workplace mode" },
          { status: 400 },
        );
      }
      updates.push({ column: "workplace_mode", value });
    }
    if (has("postingStatus")) {
      const value = text(patch.postingStatus, 30);
      if (!postingStatuses.has(value)) {
        return privateJson(
          { error: "Invalid posting status" },
          { status: 400 },
        );
      }
      updates.push({ column: "posting_status", value });
    }
    if (has("employmentType")) {
      const value = text(patch.employmentType, 30);
      if (!employmentTypes.has(value)) {
        return privateJson(
          { error: "Invalid employment type" },
          { status: 400 },
        );
      }
      updates.push({ column: "employment_type", value });
    }
    if (has("status")) {
      const value = text(patch.status, 30);
      if (!applicationStatuses.has(value)) {
        return privateJson(
          { error: "Invalid application status" },
          { status: 400 },
        );
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
    const dateFields = [
      ["deadline", "deadline"],
      ["postedAt", "posted_at"],
      ["sourceObservedAt", "source_observed_at"],
    ] as const;
    for (const [key, column] of dateFields) {
      if (!has(key)) continue;
      const value = isoDate(patch[key]);
      if (value === null) {
        return privateJson(
          { error: `${key} must use YYYY-MM-DD` },
          { status: 400 },
        );
      }
      updates.push({ column, value });
    }
    if (has("sponsorshipSignal")) {
      const value = text(patch.sponsorshipSignal, 20);
      if (!opportunitySignals.has(value)) {
        return privateJson(
          { error: "Invalid sponsorship signal" },
          { status: 400 },
        );
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
    if (has("matchScore")) {
      updates.push({
        column: "match_score",
        value: integer(patch.matchScore, 0, 100),
      });
    }

    if (compensationPatchKeys.some((key) => has(key))) {
      const compensationInput = {
        compensationStatus: has("compensationStatus")
          ? patch.compensationStatus
          : existing.compensation_status,
        salaryMin: has("salaryMin") ? patch.salaryMin : existing.salary_min,
        salaryMax: has("salaryMax") ? patch.salaryMax : existing.salary_max,
        salaryCurrency: has("salaryCurrency")
          ? patch.salaryCurrency
          : existing.salary_currency,
        salaryPeriod: has("salaryPeriod")
          ? patch.salaryPeriod
          : existing.salary_period,
        salaryLocation: has("salaryLocation")
          ? patch.salaryLocation
          : existing.salary_location,
        salarySourceUrl: has("salarySourceUrl")
          ? patch.salarySourceUrl
          : existing.salary_source_url,
        salarySourceTitle: has("salarySourceTitle")
          ? patch.salarySourceTitle
          : existing.salary_source_title,
        salaryBasis: has("salaryBasis")
          ? patch.salaryBasis
          : existing.salary_basis,
        salaryObservedAt: has("salaryObservedAt")
          ? patch.salaryObservedAt
          : existing.salary_observed_at,
        salaryNotes: has("salaryNotes")
          ? patch.salaryNotes
          : existing.salary_notes,
      };
      const compensation = normalizeCompensation(compensationInput);
      if ("error" in compensation) {
        return privateJson({ error: compensation.error }, { status: 400 });
      }
      const salary = compensation.value;
      updates.push(
        { column: "compensation_status", value: salary.compensationStatus },
        { column: "salary_min", value: salary.salaryMin },
        { column: "salary_max", value: salary.salaryMax },
        { column: "salary_currency", value: salary.salaryCurrency },
        { column: "salary_period", value: salary.salaryPeriod },
        { column: "salary_location", value: salary.salaryLocation },
        { column: "salary_source_url", value: salary.salarySourceUrl },
        { column: "salary_source_title", value: salary.salarySourceTitle },
        { column: "salary_basis", value: salary.salaryBasis },
        { column: "salary_observed_at", value: salary.salaryObservedAt },
        { column: "salary_notes", value: salary.salaryNotes },
      );
    }
    if (!updates.length) {
      return privateJson(
        { error: "No supported patch fields" },
        { status: 400 },
      );
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
      .prepare(
        `INSERT INTO skill_progress (user_id, skill_id, mastery, attempts, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, skill_id) DO UPDATE SET
          mastery = excluded.mastery,
          attempts = excluded.attempts,
          updated_at = CURRENT_TIMESTAMP`,
      )
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
        .prepare(
          `INSERT INTO question_attempts (
          user_id, id, question_id, question_version, score, confidence, notes,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        )
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
        .prepare(
          `INSERT INTO question_stats (
          user_id, question_id, question_version, attempts, best_score,
          latest_score, total_score, latest_confidence, updated_at
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, question_id, question_version) DO UPDATE SET
          attempts = question_stats.attempts + 1,
          best_score = MAX(question_stats.best_score, excluded.best_score),
          latest_score = excluded.latest_score,
          total_score = question_stats.total_score + excluded.total_score,
          latest_confidence = excluded.latest_confidence,
          updated_at = CURRENT_TIMESTAMP`,
        )
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
      .prepare(
        `INSERT INTO preferences (user_id, key, value, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(ownerId, key, text(body.value, 8000))
      .run();
  } else {
    return privateJson({ error: "Unsupported action" }, { status: 400 });
  }

  return privateJson(await readState(ownerId));
}

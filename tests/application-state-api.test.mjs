import assert from "node:assert/strict";
import test from "node:test";

const legacyApplicationColumns = [
  "user_id",
  "id",
  "company_id",
  "company_name",
  "role_title",
  "employment_type",
  "region",
  "status",
  "priority",
  "job_url",
  "deadline",
  "sponsorship_signal",
  "export_signal",
  "contact",
  "resume_version",
  "jd_keywords",
  "source_observed_at",
  "match_score",
  "notes",
  "created_at",
  "updated_at",
];

const addedApplicationColumns = [
  "requisition_id",
  "role_family_id",
  "team",
  "business_unit",
  "level",
  "target_location",
  "workplace_mode",
  "posted_at",
  "posting_status",
  "responsibilities",
  "minimum_qualifications",
  "preferred_qualifications",
  "eligibility_notes",
  "compensation_status",
  "salary_min",
  "salary_max",
  "salary_currency",
  "salary_period",
  "salary_location",
  "salary_source_url",
  "salary_source_title",
  "salary_basis",
  "salary_observed_at",
  "salary_notes",
];

class MockStatement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
    this.args = [];
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async all() {
    return { results: this.database.rowsFor(this.sql, this.args) };
  }

  async run() {
    return this.database.run(this.sql, this.args);
  }
}

class MockD1 {
  constructor(application) {
    this.applicationColumns = new Set(legacyApplicationColumns);
    this.application = application;
    this.operations = [];
  }

  prepare(sql) {
    return new MockStatement(this, sql);
  }

  async batch(statements) {
    return Promise.all(statements.map((statement) => statement.run()));
  }

  rowsFor(sql, args) {
    if (/^\s*PRAGMA table_info\(applications\)/i.test(sql)) {
      return [...this.applicationColumns].map((name) => ({ name }));
    }
    if (/^\s*SELECT compensation_status/i.test(sql)) {
      if (
        this.application &&
        args[0] === this.application.user_id &&
        args[1] === this.application.id
      ) {
        return [this.application];
      }
      return [];
    }
    if (sql.includes(" FROM applications")) return [];
    return [];
  }

  async run(sql, args) {
    this.operations.push({ sql, args });
    const migration = /^\s*ALTER TABLE applications ADD COLUMN (\w+)/i.exec(
      sql,
    );
    if (migration) this.applicationColumns.add(migration[1]);
    return { success: true };
  }
}

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "application-state-test",
    `${process.pid}-${Date.now()}-${Math.random()}`,
  );
  return (await import(workerUrl.href)).default;
}

function runtimeEnv(database) {
  return {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
    DB: database,
    AIALRA_PROXY_SHARED_SECRET: "test-proxy-shared-secret",
  };
}

const context = {
  waitUntil() {},
  passThroughOnException() {},
};

async function dispatch(app, request, database) {
  const environment = runtimeEnv(database);
  globalThis.__AIALRA_TEST_CLOUDFLARE_ENV__ = environment;
  return app.fetch(request, environment, context);
}

function authentikHeaders() {
  return {
    "content-type": "application/json",
    "x-aialra-authenticated": "1",
    "x-aialra-sub": "candidate|aialra-123",
    "x-aialra-email": "Candidate@Example.com",
    "x-aialra-proxy-secret": "test-proxy-shared-secret",
  };
}

function validDisclosedApplication(overrides = {}) {
  return {
    companyId: "tsmc-arizona",
    companyName: "TSMC Arizona",
    roleTitle: "Physical Design Intern",
    requisitionId: "REQ-2027-123",
    roleFamilyId: "physical-design-sta",
    team: "Design Technology",
    businessUnit: "Advanced Technology",
    level: "Intern",
    targetLocation: "Phoenix, Arizona",
    workplaceMode: "on-site",
    postedAt: "2026-07-20",
    postingStatus: "open",
    employmentType: "internship",
    region: "US",
    status: "researching",
    priority: "high",
    jobUrl: "https://example.com/jobs/123",
    deadline: "2026-10-01",
    sponsorshipSignal: "unknown",
    exportSignal: "unknown",
    contact: "",
    resumeVersion: "hardware-v2",
    jdKeywords: "STA, Tcl",
    responsibilities: "Build and analyze timing constraints.",
    minimumQualifications: "Digital design coursework.",
    preferredQualifications: "PrimeTime project experience.",
    eligibilityNotes: "Posting-specific review required.",
    sourceObservedAt: "2026-07-26",
    compensationStatus: "disclosed",
    salaryMin: "35.50",
    salaryMax: "42",
    salaryCurrency: "usd",
    salaryPeriod: "hour",
    salaryLocation: "Phoenix, Arizona",
    salarySourceUrl: "https://example.com/jobs/123",
    salarySourceTitle: "Physical Design Intern",
    salaryBasis: "employer-posting",
    salaryObservedAt: "2026-07-26",
    salaryNotes: "Base pay only.",
    matchScore: 82,
    notes: "Target application.",
    ...overrides,
  };
}

test("legacy application tables migrate without synthetic zero salaries", async () => {
  const app = await worker();
  const database = new MockD1();
  const response = await dispatch(
    app,
    new Request("https://carreerdojo.aialra.online/api/state", {
      headers: authentikHeaders(),
    }),
    database,
  );

  assert.equal(response.status, 200);
  for (const column of addedApplicationColumns) {
    assert.ok(
      database.applicationColumns.has(column),
      `migration must add ${column}`,
    );
  }
  const migrationSql = database.operations
    .filter(({ sql }) => /^ALTER TABLE applications/i.test(sql))
    .map(({ sql }) => sql)
    .join("\n");
  assert.doesNotMatch(migrationSql, /salary_(?:min|max).+DEFAULT\s+0/i);
  assert.match(
    migrationSql,
    /salary_min TEXT NOT NULL DEFAULT ''/,
    "missing salaries must remain unknown, not zero",
  );
});

test("Authentik identity requires the private origin-proxy secret", async () => {
  const app = await worker();
  const trusted = await dispatch(
    app,
    new Request("https://carreerdojo.aialra.online/api/state", {
      headers: authentikHeaders(),
    }),
    new MockD1(),
  );
  assert.equal(trusted.status, 200);

  const spoofed = await dispatch(
    app,
    new Request("https://aialra-career-dojo.aialra0.chatgpt.site/api/state", {
      headers: {
        ...authentikHeaders(),
        "x-aialra-proxy-secret": "wrong-secret",
      },
    }),
    new MockD1(),
  );
  assert.equal(spoofed.status, 401);

  const sites = await dispatch(
    app,
    new Request("https://aialra-career-dojo.aialra0.chatgpt.site/api/state", {
      headers: { "oai-authenticated-user-email": "Owner@Example.com" },
    }),
    new MockD1(),
  );
  assert.equal(sites.status, 200);
});

test("saveApplication persists detailed requisition and salary evidence", async () => {
  const app = await worker();
  const database = new MockD1();
  const response = await dispatch(
    app,
    new Request("https://carreerdojo.aialra.online/api/state", {
      method: "POST",
      headers: authentikHeaders(),
      body: JSON.stringify({
        action: "saveApplication",
        application: validDisclosedApplication(),
      }),
    }),
    database,
  );

  assert.equal(response.status, 200, await response.text());
  const insert = database.operations.find(({ sql }) =>
    /^\s*INSERT INTO applications/i.test(sql),
  );
  assert.ok(insert, "application insert must execute");
  assert.equal(insert.args[0], "candidate@example.com");
  assert.equal(insert.args[5], "REQ-2027-123");
  assert.equal(insert.args[25], "Build and analyze timing constraints.");
  assert.equal(insert.args[30], "disclosed");
  assert.equal(insert.args[31], "35.50");
  assert.equal(insert.args[32], "42");
  assert.equal(insert.args[33], "USD");
  assert.equal(insert.args[34], "hour");
  assert.equal(insert.args[36], "https://example.com/jobs/123");
  assert.equal(insert.args[38], "employer-posting");
  assert.equal(insert.args[39], "2026-07-26");
});

test("salary validation rejects inconsistent, malformed, and unsupported evidence", async () => {
  const cases = [
    [{ salaryMin: "50", salaryMax: "40" }, /minimum cannot exceed/i],
    [{ salaryCurrency: "US$" }, /three-letter ISO currency/i],
    [{ salaryObservedAt: "2026-02-30" }, /YYYY-MM-DD/i],
    [{ salarySourceTitle: "" }, /requires a source URL/i],
    [{ salaryBasis: "third-party-estimate" }, /Disclosed compensation/i],
    [
      {
        compensationStatus: "estimated",
        salaryBasis: "employer-posting",
      },
      /Estimated compensation/i,
    ],
    [
      {
        compensationStatus: "not-disclosed",
        salaryMin: "0",
        salaryMax: "",
        salaryCurrency: "",
        salaryPeriod: "",
      },
      /Not-disclosed compensation/i,
    ],
    [{ salaryMin: "35.555" }, /plain non-negative decimal/i],
  ];

  for (const [overrides, expectedError] of cases) {
    const app = await worker();
    const response = await dispatch(
      app,
      new Request("https://carreerdojo.aialra.online/api/state", {
        method: "POST",
        headers: authentikHeaders(),
        body: JSON.stringify({
          action: "saveApplication",
          application: validDisclosedApplication(overrides),
        }),
      }),
      new MockD1(),
    );
    assert.equal(response.status, 400, JSON.stringify(overrides));
    const result = await response.json();
    assert.match(result.error, expectedError);
  }
});

test("patchApplication validates merged compensation and supports every detail group", async () => {
  const ownerId = "candidate@example.com";
  const application = {
    user_id: ownerId,
    id: "application-1",
    compensation_status: "not-disclosed",
    salary_min: "",
    salary_max: "",
    salary_currency: "",
    salary_period: "",
    salary_location: "",
    salary_source_url: "",
    salary_source_title: "",
    salary_basis: "",
    salary_observed_at: "",
    salary_notes: "",
  };
  const app = await worker();
  const database = new MockD1(application);
  const patch = {
    companyId: "qolab",
    companyName: "Qolab",
    roleTitle: "Quantum Hardware Engineer",
    requisitionId: "QH-2026",
    roleFamilyId: "quantum-hardware",
    team: "Quantum Hardware",
    businessUnit: "Research",
    level: "Entry",
    targetLocation: "Madison, Wisconsin",
    workplaceMode: "on-site",
    postedAt: "2026-07-21",
    postingStatus: "open",
    employmentType: "new-grad",
    region: "US",
    status: "ready",
    priority: "high",
    jobUrl: "https://example.com/qh",
    deadline: "2026-09-30",
    sponsorshipSignal: "yellow",
    exportSignal: "orange",
    contact: "Recruiting team",
    resumeVersion: "quantum-v1",
    jdKeywords: "RF, cryogenics",
    responsibilities: "Characterize devices.",
    minimumQualifications: "Laboratory experience.",
    preferredQualifications: "RF measurement experience.",
    eligibilityNotes: "Review work authorization.",
    sourceObservedAt: "2026-07-26",
    compensationStatus: "estimated",
    salaryMin: "90000",
    salaryMax: "120000",
    salaryCurrency: "USD",
    salaryPeriod: "year",
    salaryLocation: "Madison, Wisconsin",
    salarySourceUrl: "https://www.bls.gov/example",
    salarySourceTitle: "Government occupation statistic",
    salaryBasis: "government-statistic",
    salaryObservedAt: "2026-07-26",
    salaryNotes: "Market benchmark, not an employer offer.",
    matchScore: 74,
    notes: "Detailed target.",
  };
  const response = await dispatch(
    app,
    new Request("https://carreerdojo.aialra.online/api/state", {
      method: "POST",
      headers: authentikHeaders(),
      body: JSON.stringify({
        action: "patchApplication",
        id: application.id,
        patch,
      }),
    }),
    database,
  );

  assert.equal(response.status, 200, await response.text());
  const updatedColumns = new Set(
    database.operations.flatMap(({ sql }) => {
      const match = /^\s*UPDATE applications SET (\w+) =/i.exec(sql);
      return match ? [match[1]] : [];
    }),
  );
  const expectedColumns = [
    "company_id",
    "company_name",
    "role_title",
    "requisition_id",
    "role_family_id",
    "team",
    "business_unit",
    "level",
    "target_location",
    "workplace_mode",
    "posted_at",
    "posting_status",
    "responsibilities",
    "minimum_qualifications",
    "preferred_qualifications",
    "eligibility_notes",
    ...addedApplicationColumns.filter((column) => column.startsWith("salary_")),
    "compensation_status",
  ];
  for (const column of expectedColumns) {
    assert.ok(updatedColumns.has(column), `patch must update ${column}`);
  }
});

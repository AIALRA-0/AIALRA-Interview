import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

const publishedQuestionFields = [
  "id",
  "title",
  "titleZh",
  "roleFamilies",
  "skills",
  "prerequisiteSkills",
  "level",
  "difficulty",
  "type",
  "prompt",
  "promptZh",
  "deliverables",
  "deliverablesZh",
  "rubric",
  "rubricZh",
  "commonFailures",
  "commonFailuresZh",
  "followUps",
  "followUpsZh",
  "sourcePolicy",
  "sourceRefs",
  "estimatedMinutes",
  "evidenceDate",
  "status",
  "referenceOutline",
  "referenceOutlineZh",
  "oracle",
  "oracleZh",
  "blueprintId",
  "contentVersion",
];

function publishedQuestionFor(question) {
  return Object.fromEntries(
    publishedQuestionFields
      .filter((field) => Object.hasOwn(question, field))
      .map((field) => [field, question[field]]),
  );
}

function preview(value, maxLength) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  const characters = Array.from(normalized);
  if (characters.length <= maxLength) return normalized;
  return `${characters.slice(0, maxLength - 1).join("").trimEnd()}…`;
}

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
    return { success: true };
  }
}

class MockD1 {
  constructor(users = {}) {
    this.users = users;
  }

  prepare(sql) {
    return new MockStatement(this, sql);
  }

  async batch(statements) {
    return statements.map(() => ({ success: true }));
  }

  rowsFor(sql, args) {
    const owner = String(args[0] || "");
    const data = this.users[owner] || {};
    if (sql.includes(" FROM applications ")) return data.applications || [];
    if (sql.includes(" FROM bookmarks ")) return data.bookmarks || [];
    if (sql.includes(" FROM skill_progress ")) return [];
    if (sql.includes(" FROM question_attempts ")) return [];
    if (sql.includes(" FROM question_stats ")) return [];
    if (sql.includes(" FROM preferences ")) return [];
    return [];
  }
}

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}

function runtimeEnv(database = new MockD1()) {
  return {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
    DB: database,
  };
}

const context = {
  waitUntil() {},
  passThroughOnException() {},
};

async function dispatch(app, request, environment = runtimeEnv()) {
  globalThis.__AIALRA_TEST_CLOUDFLARE_ENV__ = environment;
  return app.fetch(request, environment, context);
}

test("server-renders the complete Career Dojo product", async () => {
  const [
    usCompanies,
    cnCompanies,
    questionSource,
    questionIndexText,
    questionManifest,
  ] =
    await Promise.all([
      readFile(new URL("data/companies.us.json", root), "utf8").then(JSON.parse),
      readFile(new URL("data/companies.cn.json", root), "utf8").then(JSON.parse),
      readFile(new URL("data/questions.seed.json", root), "utf8").then(JSON.parse),
      readFile(new URL("public/question-bank/index.json", root), "utf8"),
      readFile(new URL("public/question-bank/manifest.json", root), "utf8").then(
        JSON.parse,
      ),
    ]);
  const expectedCompanyCount = usCompanies.length + cnCompanies.length;
  const app = await worker();
  const response = await dispatch(
    app,
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>AIALRA Career Dojo<\/title>/i);
  assert.match(html, /不是盲投，也不是盲刷/);
  assert.match(html, /公司宇宙/);
  assert.match(html, /Interview Dojo/);
  assert.match(html, /投递作战室/);
  assert.match(html, new RegExp(`<strong>${expectedCompanyCount}</strong>`));
  assert.match(html, /下一实习周期/);
  assert.match(html, /lang="zh-CN"/);
  assert.doesNotMatch(
    html,
    new RegExp(
      questionSource.questions[0].deliverables[0].replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      ),
    ),
  );
  assert.doesNotMatch(
    html,
    new RegExp(
      questionSource.questions[0].id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    ),
    "the question summary index must not be serialized into initial HTML",
  );
  assert.match(
    html,
    new RegExp(questionManifest.index.sha256),
    "the bootstrap should pin the separately fetched index",
  );
  for (const shard of questionManifest.shards) {
    assert.match(
      html,
      new RegExp(shard.sha256),
      `the bootstrap should pin shard ${shard.id}`,
    );
  }
  assert.ok(
    Buffer.byteLength(html) < Buffer.byteLength(questionIndexText),
    "initial HTML should stay smaller than the separately fetched question index",
  );
  assert.doesNotMatch(html, /codex-preview/);
  assert.doesNotMatch(html, /react-loading-skeleton/);
  assert.doesNotMatch(html, /USC MSECE|Fall 2026/);
});

test("production state API rejects unauthenticated access", async () => {
  const app = await worker();
  const response = await dispatch(
    app,
    new Request("https://career.example/api/state"),
  );
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), { error: "Authentication required" });
});

test("state reads are isolated by authenticated user", async () => {
  const database = new MockD1({
    "a@example.com": {
      applications: [
        {
          id: "a-1",
          company_id: "synopsys",
          company_name: "Synopsys",
          role_title: "EDA Intern",
        },
      ],
    },
    "b@example.com": {
      applications: [
        {
          id: "b-1",
          company_id: "cadence",
          company_name: "Cadence",
          role_title: "CAD Intern",
        },
      ],
    },
  });
  const app = await worker();

  async function read(email) {
    const response = await dispatch(
      app,
      new Request("https://career.example/api/state", {
        headers: { "oai-authenticated-user-email": email },
      }),
      runtimeEnv(database),
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    return response.json();
  }

  const [a, b] = await Promise.all([
    read("a@example.com"),
    read("b@example.com"),
  ]);
  assert.equal(a.applications[0].company_name, "Synopsys");
  assert.equal(b.applications[0].company_name, "Cadence");
  assert.notDeepEqual(a.applications, b.applications);
});

test("state API validates body size, JSON, and job URL protocol", async () => {
  const app = await worker();
  const headers = {
    "oai-authenticated-user-email": "a@example.com",
    "content-type": "application/json",
  };

  const malformed = await dispatch(
    app,
    new Request("https://career.example/api/state", {
      method: "POST",
      headers,
      body: "{",
    }),
  );
  assert.equal(malformed.status, 400);

  const oversized = await dispatch(
    app,
    new Request("https://career.example/api/state", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "x", value: "a".repeat(50_100) }),
    }),
  );
  assert.equal(oversized.status, 413);

  const invalidUrl = await dispatch(
    app,
    new Request("https://career.example/api/state", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "saveApplication",
        application: {
          companyId: "x",
          companyName: "Example",
          roleTitle: "Intern",
          jobUrl: "javascript:alert(1)",
        },
      }),
    }),
  );
  assert.equal(invalidUrl.status, 400);

  const missingQuestionVersion = await dispatch(
    app,
    new Request("https://career.example/api/state", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "recordQuestionAttempt",
        questionId: "q-example",
        score: 80,
      }),
    }),
  );
  assert.equal(missingQuestionVersion.status, 400);
});

test("public source keeps the private candidate profile out of git", async () => {
  const migrationNames = (await readdir(new URL("drizzle/", root))).filter(
    (name) => /^0000_.+\.sql$/.test(name),
  );
  assert.equal(migrationNames.length, 1);
  const [profile, gitignore, page, migration] = await Promise.all([
    readFile(new URL("data/profile.json", root), "utf8"),
    readFile(new URL(".gitignore", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL(`drizzle/${migrationNames[0]}`, root), "utf8"),
  ]);

  assert.doesNotMatch(
    profile,
    /USC MSECE|Fall 2026|Summer 2027|TinyTapeout|Ramulator2|ZU4EV/,
  );
  assert.match(gitignore, /^\/private\/$/m);
  assert.doesNotMatch(page, /private\/profile/);
  assert.match(migration, /`user_id` text NOT NULL/);
  assert.match(migration, /PRIMARY KEY\(`user_id`, `id`\)/);
  assert.match(migration, /`question_version` text NOT NULL/);
  assert.match(
    migration,
    /PRIMARY KEY\(`user_id`, `question_id`, `question_version`\)/,
  );
  assert.doesNotMatch(migration, /SELECT "user_id"/);
});

test("Dojo keeps every assessment field bilingual and renders a bounded page", async () => {
  const [component, types] = await Promise.all([
    readFile(new URL("app/CareerDojoApp.tsx", root), "utf8"),
    readFile(new URL("app/types.ts", root), "utf8"),
  ]);

  for (const field of [
    "promptZh",
    "deliverablesZh",
    "rubricZh",
    "commonFailuresZh",
    "followUpsZh",
    "referenceOutlineZh",
    "oracleZh",
  ]) {
    assert.match(types, new RegExp(`\\b${field}\\??:`));
    assert.match(component, new RegExp(`selectedQuestionDetail\\.${field}`));
  }

  assert.match(
    component,
    /useState<QuestionLanguageMode>\("bilingual"\)/,
  );
  assert.match(component, /id: "zh-first"/);
  assert.match(component, /id: "en-first"/);
  assert.match(component, /\[24, 48, 96\]\.map/);
  assert.match(component, /visibleQuestions\.map/);
  assert.match(
    component,
    /filteredQuestions\.slice\([\s\S]*questionPageSize/,
  );
  assert.doesNotMatch(
    component,
    /className="question-grid">\s*\{filteredQuestions\.map/,
  );
  assert.match(component, /重置筛选 \/ Reset/);
  assert.match(component, /aria-current=\{page === safeQuestionPage/);
  assert.match(component, /questionDetailState === "loading"/);
  assert.match(component, /questionDetailState === "error"/);
  assert.match(component, /重试 \/ Retry/);
  assert.match(
    component,
    /useState<InterviewQuestionSummary\[\]>\(\[\]\)/,
  );
  assert.match(component, /validateQuestionBankIndex\(value, questionBank\)/);
  assert.match(component, /fetch\(indexUrl,[\s\S]*cache: "no-store"/);
  assert.match(
    component,
    /parseVerifiedJson\([\s\S]*questionBank\.indexSha256/,
  );
  assert.match(component, /questionBank\.shardSha256ById\[question\.shardId\]/);
  assert.match(component, /validateQuestionBankShard\(/);
  const digestPosition = component.indexOf(
    "const actualSha256 = await sha256Hex(rawText)",
  );
  const parsePosition = component.indexOf("JSON.parse(rawText)");
  assert.ok(
    digestPosition >= 0 && parsePosition > digestPosition,
    "raw asset text must be hashed before it is parsed as JSON",
  );
  assert.match(component, /questionIndexState !== "ready"/);
  assert.match(component, /重试题库加载 \/ Retry question index/);
  assert.match(
    component,
    /210 个基础场景 \+ 每场 9 个递进训练 = 2,100/,
  );
  assert.match(
    component,
    /210 anchor scenarios \+ 1,890 progressive drills = 2,100/,
  );
  assert.match(
    component,
    /question-bank\/shards\/\$\{question\.shardId\}\.json/,
  );
  assert.match(
    component,
    /\(initialFocusable\[0\] \|\| modal\)\.focus\(\)/,
    "a modal should initially focus its first interactive control",
  );
  assert.match(
    component,
    /activeElement === modal \|\|[\s\S]*focusIsOutside/,
    "the modal focus trap should recover from its container or outside focus",
  );
  assert.match(
    component,
    /document\.addEventListener\("focusin", handleFocusIn\)/,
    "the modal should recover focus even when focus moves outside without Tab",
  );
  assert.match(
    component,
    /document\.removeEventListener\("focusin", handleFocusIn\)/,
    "the focus recovery listener should be cleaned up with the modal",
  );
  assert.doesNotMatch(
    types,
    /\bgenerationSpec\??:/,
    "the browser-facing detail type must not expose generator provenance",
  );
});

test("navigation, filters, sources, and focus rings expose accessible state", async () => {
  const [component, styles, questionSource] = await Promise.all([
    readFile(new URL("app/CareerDojoApp.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
    readFile(new URL("data/questions.seed.json", root), "utf8").then(JSON.parse),
  ]);

  assert.equal(
    (
      component.match(
        /aria-current=\{view === item\.id \? "page" : undefined\}/g,
      ) || []
    ).length,
    2,
    "desktop and mobile navigation should both expose the current view",
  );
  assert.match(
    component,
    /key=\{value\}[\s\S]*?aria-pressed=\{region === value\}/,
    "every region-filter button should expose its pressed state",
  );

  const sourceRenderStart = component.indexOf(
    "{selectedQuestionDetail.sourceRefs.map",
  );
  const sourceRenderEnd = component.indexOf("</details>", sourceRenderStart);
  assert.ok(
    sourceRenderStart >= 0 && sourceRenderEnd > sourceRenderStart,
    "question details should render a dedicated public-source disclosure",
  );
  const sourceRenderer = component.slice(sourceRenderStart, sourceRenderEnd);
  assert.doesNotMatch(
    sourceRenderer,
    /\.slice\(/,
    "the source renderer must not truncate question source references",
  );
  assert.match(sourceRenderer, /href=\{url\}/);
  assert.match(sourceRenderer, /target="_blank"/);
  assert.match(sourceRenderer, /sourceTitle\(source, index\)/);
  assert.match(
    component,
    /new URL\(url\)\.hostname\.replace/,
    "string source URLs should receive a readable hostname-based title",
  );
  assert.ok(
    questionSource.questions.some((question) => question.sourceRefs.length > 1),
    "the bank should exercise the all-sources rendering path",
  );

  const finalFocusRule = styles.lastIndexOf("):focus-visible {");
  const finalOutlineRemoval = styles.lastIndexOf("outline: none");
  assert.ok(
    finalFocusRule > finalOutlineRemoval,
    "the shared focus-visible rule must override every outline removal",
  );
  const focusRule = styles.slice(finalFocusRule);
  for (const control of [
    "button",
    "a[href]",
    "input",
    "select",
    "textarea",
    "summary",
    "[tabindex]",
  ]) {
    assert.ok(
      styles.slice(styles.lastIndexOf(":is("), finalFocusRule).includes(control),
      `the shared focus ring should cover ${control}`,
    );
  }
  assert.match(focusRule, /outline: 3px solid var\(--blue\)/);
  assert.match(focusRule, /outline-offset: 2px/);
});

test("question index and deterministic detail shards stay synchronized", async () => {
  const [sourceText, indexText, manifestText, pageSource] = await Promise.all([
    readFile(new URL("data/questions.seed.json", root), "utf8"),
    readFile(new URL("public/question-bank/index.json", root), "utf8"),
    readFile(new URL("public/question-bank/manifest.json", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
  ]);
  const source = JSON.parse(sourceText);
  const index = JSON.parse(indexText);
  const manifest = JSON.parse(manifestText);
  const sourceById = new Map(
    source.questions.map((question) => [question.id, question]),
  );

  assert.equal(manifest.sourceSha256, sha256(sourceText));
  assert.equal(index.sourceSha256, manifest.sourceSha256);
  assert.equal(index.assetVersion, manifest.assetVersion);
  assert.equal(index.previewLength, 160);
  assert.equal(manifest.previewLength, index.previewLength);
  assert.equal(index.questionCount, source.questions.length);
  assert.equal(index.questions.length, source.questions.length);
  assert.equal(manifest.questionCount, source.questions.length);
  assert.equal(manifest.index.sha256, sha256(indexText));
  assert.equal(manifest.index.bytes, Buffer.byteLength(indexText));
  assert.ok(
    Buffer.byteLength(indexText) < Buffer.byteLength(sourceText) * 0.4,
    "initial question index should remain substantially smaller than full content",
  );
  assert.doesNotMatch(pageSource, /questions\.seed\.json/);
  assert.match(pageSource, /question-bank\/manifest\.json/);
  assert.match(pageSource, /question-bank\/index\.json/);
  assert.match(pageSource, /indexSha256: questionManifestRaw\.index\.sha256/);
  assert.match(pageSource, /shardSha256ById: Object\.fromEntries/);
  assert.doesNotMatch(
    pageSource,
    /import\s+\w+\s+from\s+["'][^"']*question-bank\/index\.json["']/,
  );

  const indexedIds = new Set();
  for (const summary of index.questions) {
    const full = sourceById.get(summary.id);
    assert.ok(full, `summary ${summary.id} must exist in the source bank`);
    assert.equal(
      summary.shardId,
      sha256(summary.id).slice(0, 2),
      `summary ${summary.id} must point to its deterministic shard`,
    );
    assert.equal(summary.contentVersion, full.contentVersion);
    assert.equal(summary.title, full.title);
    assert.equal(summary.titleZh, full.titleZh || "");
    assert.equal(
      summary.promptPreview,
      preview(full.prompt, index.previewLength),
    );
    assert.equal(
      summary.promptPreviewZh,
      preview(full.promptZh, index.previewLength),
    );
    assert.ok(!indexedIds.has(summary.id), `duplicate summary ${summary.id}`);
    indexedIds.add(summary.id);
  }

  const actualShardNames = (await readdir(
    new URL("public/question-bank/shards/", root),
  ))
    .filter((name) => name.endsWith(".json"))
    .sort();
  assert.deepEqual(
    actualShardNames,
    manifest.shards.map((shard) => `${shard.id}.json`).sort(),
  );

  const detailedIds = new Set();
  for (const shard of manifest.shards) {
    const shardText = await readFile(
      new URL(`public/question-bank/${shard.path}`, root),
      "utf8",
    );
    const payload = JSON.parse(shardText);
    assert.doesNotMatch(
      shardText,
      /"generationSpec"\s*:/,
      "public shards must not publish internal generator provenance",
    );
    assert.equal(shard.sha256, sha256(shardText));
    assert.equal(shard.bytes, Buffer.byteLength(shardText));
    assert.equal(payload.assetVersion, manifest.assetVersion);
    assert.equal(payload.shardId, shard.id);
    assert.equal(payload.questionCount, shard.questionCount);
    assert.equal(payload.questions.length, shard.questionCount);
    for (const question of payload.questions) {
      assert.equal(sha256(question.id).slice(0, 2), shard.id);
      const sourceQuestion = sourceById.get(question.id);
      assert.ok(sourceQuestion.generationSpec);
      assert.deepEqual(question, publishedQuestionFor(sourceQuestion));
      assert.equal(question.blueprintId, sourceQuestion.blueprintId);
      assert.ok(!detailedIds.has(question.id), `duplicate detail ${question.id}`);
      detailedIds.add(question.id);
    }
  }
  assert.deepEqual(detailedIds, new Set(sourceById.keys()));
  assert.ok(
    Math.max(...manifest.shards.map((shard) => shard.bytes)) <
      Buffer.byteLength(sourceText) * 0.1,
    "a detail request must stay much smaller than the complete bank",
  );
});

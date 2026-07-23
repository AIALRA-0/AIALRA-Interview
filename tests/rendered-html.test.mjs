import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

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
  assert.match(html, /390/);
  assert.match(html, /下一实习周期/);
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

import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const timeoutMs = 12_000;
const concurrency = 12;

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

function recordsOf(value, key) {
  return Array.isArray(value) ? value : value[key] || [];
}

const [
  usRaw,
  usExpansionRaw,
  cnRaw,
  cnExpansionRaw,
  questionsRaw,
  organizationRelations,
  chinaCompanyOwnership,
] = await Promise.all([
  readJson("data/companies.us.json"),
  readJson("data/expansion-us-candidates.json"),
  readJson("data/companies.cn.json"),
  readJson("data/expansion-cn-candidates.json"),
  readJson("data/questions.seed.json"),
  readJson("data/organization-relations.json"),
  readJson("data/china-company-ownership.json"),
]);

const urls = new Map();
function register(url, owner) {
  if (!url || !/^https?:\/\//i.test(url)) return;
  if (!urls.has(url)) urls.set(url, []);
  urls.get(url).push(owner);
}

for (const company of [
  ...recordsOf(usRaw, "companies"),
  ...recordsOf(usExpansionRaw, "companies"),
  ...recordsOf(cnRaw, "companies"),
  ...recordsOf(cnExpansionRaw, "companies"),
]) {
  register(company.careerUrl, `company:${company.id}:career`);
  for (const evidence of company.evidence || []) {
    register(evidence.url, `company:${company.id}:evidence`);
  }
}

for (const question of recordsOf(questionsRaw, "questions")) {
  for (const source of question.sourceRefs || []) {
    register(
      typeof source === "string" ? source : source.url,
      `question:${question.id}`,
    );
  }
}

for (const relation of organizationRelations) {
  for (const evidence of relation.officialEvidence || []) {
    register(evidence.url, `relation:${relation.id}:evidence`);
  }
}

for (const record of chinaCompanyOwnership.records) {
  for (const evidence of record.evidence || []) {
    register(evidence.url, `ownership:${record.organizationId}:evidence`);
  }
}

function categoryFor(status) {
  if (status >= 200 && status < 400) return "reachable";
  if ([401, 403, 405, 418, 429].includes(status)) return "access-controlled";
  if ([404, 410].includes(status)) return "missing";
  if (status >= 500) return "server-error";
  return "other-http";
}

async function inspect([url, owners]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/pdf;q=0.8,*/*;q=0.5",
        "user-agent": "AIALRA-Evidence-Audit/1.0 (+link-integrity-check)",
      },
    });
    const result = {
      url,
      owners,
      status: response.status,
      category: categoryFor(response.status),
      finalUrl: response.url,
    };
    await response.body?.cancel();
    return result;
  } catch (error) {
    return {
      url,
      owners,
      status: null,
      category:
        error instanceof Error && error.name === "AbortError"
          ? "timeout"
          : "network-error",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

const entries = [...urls.entries()];
const results = [];
let cursor = 0;

async function worker() {
  while (cursor < entries.length) {
    const index = cursor;
    cursor += 1;
    results[index] = await inspect(entries[index]);
  }
}

await Promise.all(
  Array.from({ length: Math.min(concurrency, entries.length) }, () => worker()),
);

const summary = Object.fromEntries(
  [
    "reachable",
    "access-controlled",
    "missing",
    "server-error",
    "other-http",
    "timeout",
    "network-error",
  ].map((category) => [
    category,
    results.filter((result) => result.category === category).length,
  ]),
);

console.log(
  JSON.stringify(
    {
      observedAt: new Date().toISOString(),
      totalUniqueUrls: results.length,
      summary,
      // Only a confirmed 404/410 proves that the stored URL is gone. A 5xx
      // response describes the remote server (and is common for bot-sensitive
      // career sites), so keep it in manual review instead of presenting it as
      // a broken-link fact.
      actionRequired: results.filter((result) => result.category === "missing"),
      manualReview: results.filter((result) =>
        [
          "access-controlled",
          "server-error",
          "other-http",
          "timeout",
          "network-error",
        ].includes(result.category),
      ),
    },
    null,
    2,
  ),
);

if (summary.missing > 0) process.exitCode = 1;

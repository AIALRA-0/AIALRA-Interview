import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const httpsPattern = /^https:\/\//;
const technicalRoleIds = [
  "rf-eda-rd",
  "rf-ai-eda",
  "rf-cad-flow",
  "rf-rtl",
  "rf-dv",
  "rf-fpga",
  "rf-architecture",
  "rf-physical-design",
  "rf-dft",
  "rf-analog-custom",
  "rf-embedded",
  "rf-manufacturing-automation",
];
const crossCuttingRoleIds = [
  "rf-behavioral",
  "rf-project-deep-dive",
  "rf-english-communication",
];

const expectedUs = {
  "rf-eda-rd": ["15-1252", 105210, 135980, 171980],
  "rf-ai-eda": ["15-1221", 103570, 140300, 188700],
  "rf-cad-flow": ["15-1252", 105210, 135980, 171980],
  "rf-rtl": ["17-2061", 126090, 161740, 202990],
  "rf-dv": ["17-2061", 126090, 161740, 202990],
  "rf-fpga": ["17-2061", 126090, 161740, 202990],
  "rf-architecture": ["17-2061", 126090, 161740, 202990],
  "rf-physical-design": ["17-2061", 126090, 161740, 202990],
  "rf-dft": ["17-2061", 126090, 161740, 202990],
  "rf-analog-custom": ["17-2072", 101680, 130220, 167670],
  "rf-embedded": ["15-1252", 105210, 135980, 171980],
  "rf-manufacturing-automation": ["17-2112", 83600, 102440, 129250],
};

const expectedChina = {
  "cn-eda-cpp-jingjinji": {
    statistic: "mean",
    values: { mean: 20600 },
  },
  "cn-ai-eda-algorithm-regional": {
    statistic: "regional-mean-envelope",
    values: { low: 21400, high: 21900, points: [21400, 21900] },
  },
  "cn-cad-flow-cpp-jingjinji": {
    statistic: "mean",
    values: { mean: 20600 },
  },
  "cn-cad-flow-python-jingjinji": {
    statistic: "mean",
    values: { mean: 16400 },
  },
  "cn-cad-flow-operations-regional": {
    statistic: "regional-mean-envelope",
    values: { low: 9900, high: 11100, points: [9900, 10700, 11100] },
  },
  "cn-rtl-hardware-regional": {
    statistic: "regional-mean-envelope",
    values: { low: 16300, high: 16900, points: [16300, 16900] },
  },
  "cn-dv-hardware-test-yangtze": {
    statistic: "mean",
    values: { mean: 11100 },
  },
  "cn-dv-hardware-test-iot-industry": {
    statistic: "mean",
    values: { mean: 12000 },
  },
  "cn-fpga-hardware-regional": {
    statistic: "regional-mean-envelope",
    values: { low: 16300, high: 16900, points: [16300, 16900] },
  },
  "cn-architecture-hardware-regional": {
    statistic: "regional-mean-envelope",
    values: { low: 16300, high: 16900, points: [16300, 16900] },
  },
  "cn-physical-design-hardware-regional": {
    statistic: "regional-mean-envelope",
    values: { low: 16300, high: 16900, points: [16300, 16900] },
  },
  "cn-dft-hardware-test-yangtze": {
    statistic: "mean",
    values: { mean: 11100 },
  },
  "cn-dft-hardware-test-iot-industry": {
    statistic: "mean",
    values: { mean: 12000 },
  },
  "cn-analog-chip-design-semiconductor": {
    statistic: "mean",
    values: { mean: 30700 },
  },
  "cn-embedded-software-regional": {
    statistic: "regional-mean-envelope",
    values: { low: 17200, high: 19500, points: [17200, 19500, 19100] },
  },
  "cn-semiconductor-equipment-engineer": {
    statistic: "mean",
    values: { mean: 13200 },
  },
  "cn-semiconductor-automation-engineer": {
    statistic: "mean",
    values: { mean: 8100 },
  },
  "cn-automation-engineer-regional": {
    statistic: "regional-mean-envelope",
    values: { low: 9500, high: 10500, points: [9500, 9700, 10500] },
  },
};

const expectedChinaContext = {
  "cn-context-computer-software-engineering": [90000, 143300, 220100],
  "cn-context-computer-software-testing": [73900, 98800, 150500],
  "cn-context-engineering-technical-personnel": [55200, 79500, 123700],
  "cn-context-digital-product-manufacturing": [67100, 96000, 134100],
};

async function json(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

function assertPositiveNumber(value, label) {
  assert.equal(typeof value, "number", `${label} must be a number`);
  assert.ok(Number.isFinite(value), `${label} must be finite`);
  assert.ok(value > 0, `${label} must be greater than zero`);
}

function assertPercentiles(values, label) {
  assertPositiveNumber(values.p25, `${label}.p25`);
  assertPositiveNumber(values.median, `${label}.median`);
  assertPositiveNumber(values.p75, `${label}.p75`);
  assert.ok(values.p25 <= values.median, `${label} p25 exceeds median`);
  assert.ok(values.median <= values.p75, `${label} median exceeds p75`);
}

function assertRecruitmentStatistic(benchmark) {
  if (benchmark.statistic === "mean") {
    assert.deepEqual(Object.keys(benchmark.values), ["mean"]);
    assertPositiveNumber(benchmark.values.mean, `${benchmark.id}.mean`);
    return;
  }

  assert.equal(benchmark.statistic, "regional-mean-envelope");
  assertPositiveNumber(benchmark.values.low, `${benchmark.id}.low`);
  assertPositiveNumber(benchmark.values.high, `${benchmark.id}.high`);
  assert.ok(
    benchmark.values.low <= benchmark.values.high,
    `${benchmark.id} low exceeds high`,
  );
  assert.ok(
    Array.isArray(benchmark.values.points) &&
      benchmark.values.points.length >= 2,
    `${benchmark.id} requires at least two regional mean points`,
  );
  const means = benchmark.values.points.map((point) => {
    assert.ok(point.geographyZh.trim());
    assert.ok(point.geographyEn.trim());
    assertPositiveNumber(point.mean, `${benchmark.id}.point.mean`);
    return point.mean;
  });
  assert.equal(benchmark.values.low, Math.min(...means));
  assert.equal(benchmark.values.high, Math.max(...means));
}

test("compensation benchmarks preserve exact sources, periods, currencies, and statistics", async () => {
  const [asset, roleFamilyAsset] = await Promise.all([
    json("data/role-compensation-benchmarks.json"),
    json("data/role-families.json"),
  ]);

  assert.equal(asset.schemaVersion, "2.0.0");
  assert.equal(asset.evidenceDate, "2026-07-26");
  assert.match(asset.evidenceDate, isoDatePattern);
  assert.ok(asset.assetPurposeZh.trim());
  assert.ok(asset.assetPurposeEn.trim());

  const sourceById = new Map();
  for (const source of asset.sourceCatalog) {
    assert.ok(!sourceById.has(source.id), `duplicate source ${source.id}`);
    sourceById.set(source.id, source);
    assert.ok(source.publisherZh.trim());
    assert.ok(source.publisherEn.trim());
    assert.ok(source.titleZh.trim());
    assert.ok(source.titleEn.trim());
    assert.match(source.url, httpsPattern);
    assert.match(source.methodologyUrl, httpsPattern);
    assert.match(source.publishedAt, isoDatePattern);
    assert.match(source.observedAt, isoDatePattern);
    assert.equal(source.observedAt, asset.evidenceDate);
    assert.ok(source.referencePeriod.trim());
    assert.match(source.sourceKind, /^official-government-/);
  }
  assert.deepEqual([...sourceById.keys()].sort(), [
    "bls-oews-2025-national",
    "mohrss-enterprise-compensation-2025",
    "mohrss-market-recruitment-2026-q1",
  ]);

  const canonicalRoleIds = new Set(
    roleFamilyAsset.roleFamilies.map((role) => role.id),
  );
  const recordsById = new Map(
    asset.benchmarks.map((benchmark) => [benchmark.roleFamilyId, benchmark]),
  );
  assert.equal(recordsById.size, asset.benchmarks.length);
  assert.deepEqual(
    [...recordsById.keys()].sort(),
    [...technicalRoleIds, ...crossCuttingRoleIds].sort(),
  );
  for (const id of recordsById.keys()) {
    assert.ok(canonicalRoleIds.has(id), `unknown role family ${id}`);
  }

  for (const roleFamilyId of technicalRoleIds) {
    const record = recordsById.get(roleFamilyId);
    const [occupationCode, p25, median, p75] = expectedUs[roleFamilyId];
    assert.equal(record.compensationScope, "technical-role");
    assert.equal(record.benchmarkStatus, "available-with-proxies");
    assert.ok(record.roleNameZh.trim());
    assert.ok(record.roleNameEn.trim());
    assert.ok(record.notesZh.trim());
    assert.ok(record.notesEn.trim());

    const us = record.us;
    assert.ok(us, `${roleFamilyId} lacks a U.S. benchmark`);
    assert.equal(us.occupationCode, occupationCode);
    assert.equal(us.currency, "USD");
    assert.equal(us.period, "year");
    assert.equal(us.statistic, "p25-p50-p75");
    assert.equal(us.employmentLevel, "all-levels");
    assert.equal(us.employmentType, "wage-and-salary-employment");
    assert.equal(us.basis, "oews-straight-time-gross-wage");
    assert.equal(us.sourceId, "bls-oews-2025-national");
    assert.equal(us.matchQuality, "adjacent");
    assertPercentiles(us.values, `${roleFamilyId}.us.values`);
    assert.deepEqual(
      [us.values.p25, us.values.median, us.values.p75],
      [p25, median, p75],
    );

    const socDigits = occupationCode.replace("-", "");
    assert.deepEqual(us.apiSeries, {
      p25: `OEUN0000000000000${socDigits}12`,
      median: `OEUN0000000000000${socDigits}13`,
      p75: `OEUN0000000000000${socDigits}14`,
    });
    assert.ok(us.occupationZh.trim());
    assert.ok(us.occupationEn.trim());
    assert.ok(us.matchNoteZh.trim());
    assert.ok(us.matchNoteEn.trim());
    assert.ok(us.includedZh.trim());
    assert.ok(us.includedEn.trim());
    assert.ok(us.excludedZh.trim());
    assert.ok(us.excludedEn.trim());
    assert.ok(sourceById.has(us.sourceId));

    assert.ok(
      Array.isArray(record.china) && record.china.length > 0,
      `${roleFamilyId} lacks a China direct or adjacent proxy`,
    );
  }

  const chinaBenchmarks = asset.benchmarks
    .flatMap((benchmark) => benchmark.china)
    .filter(Boolean);
  const chinaById = new Map(
    chinaBenchmarks.map((benchmark) => [benchmark.id, benchmark]),
  );
  assert.equal(chinaById.size, chinaBenchmarks.length);
  assert.deepEqual(
    [...chinaById.keys()].sort(),
    Object.keys(expectedChina).sort(),
  );
  for (const [id, expected] of Object.entries(expectedChina)) {
    const benchmark = chinaById.get(id);
    assert.ok(benchmark, `missing China benchmark ${id}`);
    assert.equal(benchmark.currency, "CNY");
    assert.equal(benchmark.period, "month");
    assert.equal(benchmark.statistic, expected.statistic);
    assert.equal(benchmark.employmentType, "market-recruitment");
    assert.equal(benchmark.employmentLevel, "unspecified");
    assert.equal(benchmark.basis, "market-posted-recruitment-average");
    assert.equal(benchmark.sourceId, "mohrss-market-recruitment-2026-q1");
    assert.ok(["direct", "adjacent"].includes(benchmark.matchQuality));
    assert.ok(benchmark.occupationZh.trim());
    assert.ok(benchmark.occupationEn.trim());
    assert.ok(benchmark.matchNoteZh.trim());
    assert.ok(benchmark.matchNoteEn.trim());
    assert.ok(benchmark.geographyZh.trim());
    assert.ok(benchmark.geographyEn.trim());
    assert.ok(sourceById.has(benchmark.sourceId));
    assertRecruitmentStatistic(benchmark);
    if (expected.statistic === "mean") {
      assert.equal(benchmark.values.mean, expected.values.mean);
    } else {
      assert.equal(benchmark.values.low, expected.values.low);
      assert.equal(benchmark.values.high, expected.values.high);
      assert.deepEqual(
        benchmark.values.points.map((point) => point.mean),
        expected.values.points,
      );
    }
  }

  const contextById = new Map(
    asset.chinaContextBenchmarks.map((benchmark) => [benchmark.id, benchmark]),
  );
  assert.equal(contextById.size, asset.chinaContextBenchmarks.length);
  assert.deepEqual(
    [...contextById.keys()].sort(),
    Object.keys(expectedChinaContext).sort(),
  );
  for (const [id, expected] of Object.entries(expectedChinaContext)) {
    const benchmark = contextById.get(id);
    assert.equal(benchmark.matchQuality, "broad-context");
    assert.equal(benchmark.currency, "CNY");
    assert.equal(benchmark.period, "year");
    assert.equal(benchmark.statistic, "p25-p50-p75");
    assert.equal(benchmark.employmentType, "enterprise-employees");
    assert.equal(benchmark.basis, "enterprise-total-wage");
    assert.equal(benchmark.sourceId, "mohrss-enterprise-compensation-2025");
    assert.ok(benchmark.intendedRoleFamilyIds.length > 0);
    assert.ok(
      benchmark.intendedRoleFamilyIds.every((roleFamilyId) =>
        technicalRoleIds.includes(roleFamilyId),
      ),
    );
    assertPercentiles(benchmark.values, `${id}.values`);
    assert.deepEqual(
      [benchmark.values.p25, benchmark.values.median, benchmark.values.p75],
      expected,
    );
    assert.ok(benchmark.includedZh.trim());
    assert.ok(benchmark.includedEn.trim());
    assert.ok(benchmark.excludedZh.trim());
    assert.ok(benchmark.excludedEn.trim());
    assert.ok(sourceById.has(benchmark.sourceId));
  }

  for (const roleFamilyId of crossCuttingRoleIds) {
    const record = recordsById.get(roleFamilyId);
    assert.equal(record.compensationScope, "cross-cutting-skill");
    assert.equal(record.benchmarkStatus, "not-applicable");
    assert.equal(record.us, null);
    assert.deepEqual(record.china, []);
    assert.ok(record.notesZh.trim());
    assert.ok(record.notesEn.trim());
    assert.doesNotMatch(record.notesZh, /薪资为?0|0 元/);
    assert.doesNotMatch(record.notesEn, /(?:salary|pay)\s+(?:is|of)\s+\$?0/i);
  }
});

test("current jobs preserve exact employer disclosure and explicit omissions", async () => {
  const [jobsAsset, organizationUniverse] = await Promise.all([
    json("data/current-job-observations.json"),
    json("public/organization-universe.json"),
  ]);
  const organizationIds = new Set(
    organizationUniverse.organizations.map((organization) => organization.id),
  );

  assert.equal(jobsAsset.evidenceDate, "2026-07-28");
  assert.equal(jobsAsset.jobs.length, 4);
  assert.equal(
    new Set(jobsAsset.jobs.map((job) => job.sourceUrl)).size,
    jobsAsset.jobs.length,
  );
  assert.deepEqual(jobsAsset.jobs.map((job) => job.id).sort(), [
    "job-qolab-quantum-hardware-engineer",
    "job-synopsys-applications-engineering-scientist-17642",
    "job-synopsys-senior-rd-starrc-17637",
    "job-tsmc-arizona-summer-2027-engineering",
  ]);

  for (const job of jobsAsset.jobs) {
    assert.ok(
      organizationIds.has(job.organizationId),
      `${job.id} must bind to a published organization`,
    );
    assert.ok(job.roleFamilyIds.length > 0);
    assert.ok(
      job.roleFamilyIds.every((roleFamilyId) =>
        technicalRoleIds.includes(roleFamilyId),
      ),
    );
    assert.match(job.observedAt, isoDatePattern);
    assert.equal(job.observedAt, jobsAsset.evidenceDate);
    assert.match(job.sourceUrl, httpsPattern);
    assert.equal(job.compensation.basis, "employer-posting");
    assert.equal(job.compensation.observedAt, job.observedAt);
    assert.equal(job.compensation.sourceUrl, job.sourceUrl);
    assert.match(job.compensation.sourceUrl, httpsPattern);
    assert.ok(job.compensation.sourceTitle.trim());
    assert.ok(job.compensation.location.trim());
    assert.ok(job.responsibilitiesZh.length >= 3);
    assert.equal(job.responsibilitiesZh.length, job.responsibilitiesEn.length);
    assert.ok(job.minimumQualificationsZh.length >= 3);
    assert.equal(
      job.minimumQualificationsZh.length,
      job.minimumQualificationsEn.length,
    );
    assert.equal(job.eligibilityZh.length, job.eligibilityEn.length);
    if (job.compensation.status === "not-disclosed") {
      assert.equal(job.compensation.minimum, null);
      assert.equal(job.compensation.maximum, null);
      assert.equal(job.compensation.currency, null);
      assert.equal(job.compensation.period, null);
      assert.ok(job.compensation.notesZh.includes("未披露"));
      assert.match(job.compensation.notesEn, /did not disclose/i);
    } else {
      assert.equal(job.compensation.status, "disclosed");
      assert.ok(Number(job.compensation.minimum) > 0);
      assert.ok(
        Number(job.compensation.maximum) >= Number(job.compensation.minimum),
      );
      assert.equal(job.compensation.currency, "USD");
      assert.equal(job.compensation.period, "year");
      assert.match(job.compensation.notesZh, /基本工资区间/);
      assert.match(job.compensation.notesEn, /base-salary range/i);
    }
  }
});

test("compensation methodology is bilingual and states the non-mixing guardrails", async () => {
  const methodology = await readFile(
    new URL("research/compensation-methodology.md", root),
    "utf8",
  );

  assert.match(methodology, /薪资基准方法论/);
  assert.match(methodology, /Compensation Benchmark Methodology/);
  assert.match(methodology, /regional-mean-envelope/);
  assert.match(methodology, /不能.*拼接|不得合并/);
  assert.match(methodology, /must never splice|must not be merged/i);
  assert.match(methodology, /not-disclosed/);
  assert.match(methodology, /TSMC Arizona Summer 2027/);
  assert.match(methodology, /Qolab Quantum Hardware Engineer/);
  assert.match(methodology, /不能填 0/);
  assert.match(
    methodology,
    /zero and invented broad values are both prohibited/i,
  );
});

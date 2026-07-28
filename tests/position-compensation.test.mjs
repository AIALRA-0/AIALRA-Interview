import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const asset = JSON.parse(
  await readFile(
    new URL("data/position-compensation-comparisons.json", root),
    "utf8",
  ),
);
const roleFamilies = JSON.parse(
  await readFile(new URL("data/role-families.json", root), "utf8"),
);
const organizationUniverse = JSON.parse(
  await readFile(
    new URL("public/organization-universe.json", root),
    "utf8",
  ),
);

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
const allowedBasis = new Set([
  "employer-posting",
  "third-party-job-board",
  "third-party-campus-posting",
  "third-party-estimate",
]);
const forbiddenSpecificPositionKeys = new Set([
  "p25",
  "p50",
  "median",
  "p75",
  "mean",
]);

function assertNonEmpty(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.ok(value.trim(), `${label} must not be empty`);
}

function assertSpecificPosition(position, market, evidenceDate) {
  for (const field of [
    "id",
    "companyZh",
    "companyEn",
    "titleZh",
    "titleEn",
    "locationZh",
    "locationEn",
    "levelZh",
    "levelEn",
    "compensationTypeZh",
    "compensationTypeEn",
    "sourceUrl",
    "sourceTitle",
    "notesZh",
    "notesEn",
  ]) {
    assertNonEmpty(position[field], `${position.id}.${field}`);
  }
  assert.match(position.sourceUrl, /^https:\/\//);
  assert.equal(position.observedAt, evidenceDate);
  assert.ok(allowedBasis.has(position.basis), `${position.id} has unknown basis`);
  assert.ok(
    ["current", "historical-current-cycle"].includes(position.sourceStatus),
    `${position.id} has unknown source status`,
  );
  assert.equal(typeof position.minimum, "number");
  assert.equal(typeof position.maximum, "number");
  assert.ok(position.minimum > 0);
  assert.ok(position.maximum >= position.minimum);
  assert.equal(typeof position.payMonthsPerYear, "number");
  assert.ok(position.payMonthsPerYear >= 12);
  assert.ok(position.payMonthsPerYear <= 16);

  if (market === "US") {
    assert.equal(position.currency, "USD");
    assert.equal(position.period, "year");
    assert.equal(position.payMonthsPerYear, 12);
    assert.ok(["CA", "TX"].includes(position.taxRegion));
  } else {
    assert.equal(position.currency, "CNY");
    assert.equal(position.period, "month");
    assert.equal(position.taxRegion, "SH");
  }

  for (const key of Object.keys(position)) {
    assert.ok(
      !forbiddenSpecificPositionKeys.has(key.toLowerCase()),
      `${position.id} must not mislabel posting ranges with ${key}`,
    );
  }
}

test("specific-position compensation covers every technical role with independent evidence", () => {
  assert.equal(asset.schemaVersion, "1.1.0");
  assert.equal(asset.evidenceDate, "2026-07-26");
  assert.match(asset.evidenceDate, /^\d{4}-\d{2}-\d{2}$/);
  assertNonEmpty(asset.titleZh, "titleZh");
  assertNonEmpty(asset.titleEn, "titleEn");
  assert.equal(asset.comparisons.length, technicalRoleIds.length);

  const canonicalRoleIds = new Set(
    roleFamilies.roleFamilies.map((role) => role.id),
  );
  const canonicalOrganizationIds = new Set(
    organizationUniverse.organizations.map((organization) => organization.id),
  );
  const roleIds = asset.comparisons.map((comparison) => comparison.roleFamilyId);
  assert.equal(new Set(roleIds).size, roleIds.length);
  assert.deepEqual([...roleIds].sort(), [...technicalRoleIds].sort());

  const positionIds = new Set();
  const sourceUrls = new Set();
  const resultTuples = new Set();
  for (const comparison of asset.comparisons) {
    assert.ok(canonicalRoleIds.has(comparison.roleFamilyId));
    assertNonEmpty(comparison.roleNameZh, `${comparison.roleFamilyId}.roleNameZh`);
    assertNonEmpty(comparison.roleNameEn, `${comparison.roleFamilyId}.roleNameEn`);
    assertNonEmpty(
      comparison.comparisonNoteZh,
      `${comparison.roleFamilyId}.comparisonNoteZh`,
    );
    assertNonEmpty(
      comparison.comparisonNoteEn,
      `${comparison.roleFamilyId}.comparisonNoteEn`,
    );

    for (const [market, position] of [
      ["US", comparison.us],
      ["CN", comparison.china],
    ]) {
      assertSpecificPosition(position, market, asset.evidenceDate);
      assertNonEmpty(
        position.organizationId,
        `${position.id}.organizationId`,
      );
      assert.ok(
        canonicalOrganizationIds.has(position.organizationId),
        `${position.id} references an unknown organization`,
      );
      assert.ok(!positionIds.has(position.id), `reused position id ${position.id}`);
      assert.ok(
        !sourceUrls.has(position.sourceUrl),
        `reused position source ${position.sourceUrl}`,
      );
      positionIds.add(position.id);
      sourceUrls.add(position.sourceUrl);

      const tuple = [
        position.companyEn,
        position.titleEn,
        position.locationEn,
        position.minimum,
        position.maximum,
        position.currency,
        position.period,
        position.payMonthsPerYear,
      ].join("|");
      assert.ok(!resultTuples.has(tuple), `reused position result ${tuple}`);
      resultTuples.add(tuple);
    }
  }
  assert.equal(positionIds.size, 24);
  assert.equal(sourceUrls.size, 24);
  assert.equal(resultTuples.size, 24);
});

test("tax, FX, and PPP assumptions are frozen to auditable public sources", () => {
  const { methodology } = asset;
  assert.equal(methodology.nominalFx.cnyPerUsd, 6.776);
  assert.equal(methodology.nominalFx.referenceDate, "2026-07-17");
  assert.equal(
    methodology.nominalFx.sourceUrl,
    "https://www.federalreserve.gov/releases/h10/hist/dat00_ch.htm",
  );

  assert.equal(
    methodology.privateConsumptionPpp.chinaCnyPerInternationalDollar,
    3.4595580434271,
  );
  assert.equal(
    methodology.privateConsumptionPpp.unitedStatesUsdPerInternationalDollar,
    1,
  );
  assert.equal(methodology.privateConsumptionPpp.referenceYear, 2025);
  assert.match(
    methodology.privateConsumptionPpp.sourceUrl,
    /^https:\/\/data\.worldbank\.org\//,
  );

  const china = methodology.chinaTaxScenario;
  assert.equal(china.employeeSocialInsuranceRate, 0.105);
  assert.equal(china.employeeHousingFundRateAssumption, 0.07);
  assert.equal(china.monthlyContributionBaseMinimum, 7460);
  assert.equal(china.monthlyContributionBaseMaximum, 37302);
  assert.equal(methodology.usTaxScenario.federalTaxYear, 2026);
  assert.equal(
    methodology.usTaxScenario.californiaLiabilityScheduleYear,
    2025,
  );
  assert.equal(methodology.usTaxScenario.californiaSdiYear, 2026);

  const methodUrls = [
    methodology.nominalFx.sourceUrl,
    methodology.privateConsumptionPpp.sourceUrl,
    ...methodology.usTaxScenario.sources.map((source) => source.url),
    ...methodology.chinaTaxScenario.sources.map((source) => source.url),
  ];
  assert.equal(new Set(methodUrls).size, methodUrls.length);
  for (const url of methodUrls) assert.match(url, /^https:\/\//);
});

test("the UI exposes annual, monthly, net, PPP, nominal-FX, and F-1 scenarios", async () => {
  const app = await readFile(new URL("app/CareerDojoApp.tsx", root), "utf8");
  for (const phrase of [
    "具体职位薪资对照 / Specific-position pay",
    "税前年薪 / Gross annual",
    "税前月均 / Gross monthly average",
    "预估现金到手年薪 / Estimated annual cash net",
    "预估现金到手月均 / Estimated monthly cash net",
    "税后购买力等效 / After-tax purchasing-power equivalence",
    "世界银行私人消费 PPP / World Bank private-consumption PPP",
    "中国名义汇率折算 / China nominal-FX conversion",
    "合资格 F-1 敏感性 / Eligible F-1 sensitivity",
    "通用能力不单独定价 / Cross-cutting skill is not",
  ]) {
    assert.match(app, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

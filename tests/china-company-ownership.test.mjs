import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function json(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

test("China ownership audit exactly covers every company node", async () => {
  const [cnBase, cnExpansion, ownership, releaseManifest] = await Promise.all([
    json("data/companies.cn.json"),
    json("data/expansion-cn-candidates.json"),
    json("data/china-company-ownership.json"),
    json("data/release-manifest.json"),
  ]);
  const companyIds = [...cnBase, ...cnExpansion]
    .filter((company) => company.companyType === "company")
    .map((company) => company.id)
    .sort();
  const recordIds = ownership.records
    .map((record) => record.organizationId)
    .sort();

  assert.equal(new Set(recordIds).size, recordIds.length);
  assert.deepEqual(recordIds, companyIds);
  assert.equal(
    recordIds.length,
    releaseManifest.organizations.chinaCompanyOwnershipRecords,
  );
  assert.deepEqual(
    Object.keys(ownership.ownershipClasses).sort(),
    ownership.recordSchema.properties.ownershipClass.enum.sort(),
  );
  assert.equal(
    ownership.statistics.reviewStatusCounts["provisionally-audited"],
    releaseManifest.organizations.provisionallyAuditedOwnershipRecords,
  );
  assert.equal(
    ownership.statistics.reviewStatusCounts["needs-direct-control-source"],
    releaseManifest.organizations.ownershipNeedsDirectSource,
  );
  const evidenceScopeCounts = Object.fromEntries(
    ["direct-ownership-registry", "organization-record-context"].map(
      (evidenceScope) => [
        evidenceScope,
        ownership.records.reduce(
          (count, record) =>
            count +
            record.evidence.filter(
              (evidence) => evidence.evidenceScope === evidenceScope,
            ).length,
          0,
        ),
      ],
    ),
  );
  assert.deepEqual(
    evidenceScopeCounts,
    ownership.statistics.evidenceScopeCounts,
  );
  assert.equal(
    Object.values(evidenceScopeCounts).reduce((sum, count) => sum + count, 0),
    ownership.statistics.evidenceEntries,
  );
  assert.equal(
    ownership.statistics.evidenceEntries,
    ownership.records.reduce(
      (count, record) => count + record.evidence.length,
      0,
    ),
  );
  const foreignRecords = ownership.records.filter((record) =>
    record.organizationId.startsWith("cn-foreign-"),
  );
  assert.equal(foreignRecords.length, 88);
  assert.ok(
    foreignRecords.every(
      (record) =>
        record.ownershipClass === "foreign-controlled" &&
        record.reviewStatus === "provisionally-audited" &&
        record.sourceOwnershipTag,
    ),
  );
  assert.equal(
    new Set(foreignRecords.map((record) => record.evidence[0].url)).size,
    foreignRecords.length,
    "Every foreign-China organization must have its own official entry.",
  );
  for (const record of ownership.records) {
    assert.ok(record.summaryZh.trim());
    assert.ok(record.summaryEn.trim());
    assert.ok(record.evidence.length);
    assert.ok(record.evidence.every((item) => /^https?:\/\//.test(item.url)));
    if (record.sourceOwnershipTag === null) {
      assert.equal(record.ownershipClass, "mixed-or-unknown");
      assert.equal(record.confidence, "low");
      assert.equal(record.reviewStatus, "needs-direct-control-source");
    }
  }
});

test("foreign-company Chinese labels never use generated China suffixes or invented translations", async () => {
  const expansion = await json("data/expansion-cn-candidates.json");
  const foreignCompanies = expansion.filter((company) =>
    company.id.startsWith("cn-foreign-"),
  );
  const englishOnlyIds = new Set([
    "cn-foreign-abb",
    "cn-foreign-altair",
    "cn-foreign-amd",
    "cn-foreign-ansys",
    "cn-foreign-asm-international",
    "cn-foreign-axcelis",
    "cn-foreign-formfactor",
    "cn-foreign-imagination",
    "cn-foreign-jsr",
    "cn-foreign-screen",
    "cn-foreign-vat-group",
  ]);

  assert.equal(foreignCompanies.length, 88);
  for (const company of foreignCompanies) {
    assert.doesNotMatch(
      company.nameZh || "",
      /中国$/,
      `${company.id} must not concatenate 中国 onto a brand name`,
    );
    if (englishOnlyIds.has(company.id)) {
      assert.equal(
        company.nameZh,
        undefined,
        `${company.id} must retain its official English brand in Chinese-only mode`,
      );
    }
  }
  assert.equal(
    foreignCompanies.find((company) => company.id === "cn-foreign-ansys")
      ?.nameEn,
    "Ansys China",
  );
  assert.equal(
    foreignCompanies.find(
      (company) => company.id === "cn-foreign-analog-devices",
    )?.nameZh,
    "亚德诺半导体",
  );
});

test("published organization asset and UI expose audited ownership safely", async () => {
  const [ownership, organizationAsset, component, buildScript] =
    await Promise.all([
      json("data/china-company-ownership.json"),
      json("public/organization-universe.json"),
      readFile(new URL("app/CareerDojoApp.tsx", root), "utf8"),
      readFile(new URL("scripts/build-organization-assets.mjs", root), "utf8"),
    ]);
  const ownershipById = new Map(
    ownership.records.map((record) => [record.organizationId, record]),
  );
  const published = organizationAsset.organizations.filter(
    (organization) => organization.ownership,
  );

  assert.equal(published.length, ownership.records.length);
  for (const organization of published) {
    const record = ownershipById.get(organization.id);
    assert.ok(
      record,
      `published ownership has an unknown ID ${organization.id}`,
    );
    assert.equal(
      organization.ownership.ownershipClass,
      record.ownershipClass,
      `${organization.id} ownership class changed during publication`,
    );
    assert.equal(organization.ownership.summaryZh, record.summaryZh);
    assert.equal(organization.ownership.summaryEn, record.summaryEn);
    assert.equal(
      organization.ownership.sourceOwnershipTag,
      record.sourceOwnershipTag,
    );
    assert.equal(
      organization.ownership.evidence.length,
      record.evidence.length,
    );
  }

  assert.match(buildScript, /data\/china-company-ownership\.json/);
  assert.match(component, /中国企业所有制 \/ China ownership/);
  assert.match(
    component,
    /所有制证据与复核入口 \/ Ownership evidence and review sources/,
  );
  assert.match(component, /evidence\.evidenceScope/);
  assert.match(component, /evidence\.noteZh/);
  assert.match(component, /evidence\.noteEn/);
  assert.match(component, /sourceOwnershipTag/);
  assert.match(component, /ownershipClassificationBasisLabel/);
  assert.match(component, /company\.ownership\?\.ownershipClass === ownership/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const hanPattern = /[\u3400-\u9fff]/;
const latinPattern = /[A-Za-z]/;

async function json(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

test("organization relations are bilingual, first-party, and resolve to canonical nodes", async () => {
  const [
    relations,
    releaseManifest,
    us,
    usExpansion,
    cn,
    cnExpansion,
    page,
    component,
  ] = await Promise.all([
    json("data/organization-relations.json"),
    json("data/release-manifest.json"),
    json("data/companies.us.json"),
    json("data/expansion-us-candidates.json"),
    json("data/companies.cn.json"),
    json("data/expansion-cn-candidates.json"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/CareerDojoApp.tsx", root), "utf8"),
  ]);
  const companies = [...us, ...usExpansion, ...cn, ...cnExpansion];
  const companyIds = new Set(companies.map((company) => company.id));
  const relationIds = new Set();

  assert.equal(relations.length, releaseManifest.organizationRelations);
  for (const relation of relations) {
    assert.ok(
      !relationIds.has(relation.id),
      `duplicate relation ${relation.id}`,
    );
    relationIds.add(relation.id);
    assert.ok(companyIds.has(relation.fromOrganizationId));
    assert.ok(companyIds.has(relation.toOrganizationId));
    assert.notEqual(relation.fromOrganizationId, relation.toOrganizationId);
    assert.match(relation.summaryZh, hanPattern);
    assert.match(relation.summaryEn, latinPattern);
    assert.match(relation.lastVerified, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(relation.officialEvidence.length > 0);
    for (const evidence of relation.officialEvidence) {
      assert.match(evidence.titleZh, hanPattern);
      assert.match(evidence.titleEn, latinPattern);
      assert.match(evidence.url, /^https:\/\//);
      assert.ok(evidence.publisher.trim());
    }
  }

  const pendingRelations = relations.filter(
    (relation) => relation.status === "pending",
  );
  assert.equal(pendingRelations.length, 4);
  for (const relation of pendingRelations) {
    assert.ok(
      companyIds.has(relation.fromOrganizationId) &&
        companyIds.has(relation.toOrganizationId),
      `pending relation ${relation.id} must retain both independent nodes`,
    );
  }

  const groqLicense = relations.find(
    (relation) => relation.id === "groq-nvidia-technology-license",
  );
  assert.equal(groqLicense.relationType, "technology-license");
  assert.equal(groqLicense.status, "active");
  assert.match(groqLicense.summaryEn, /not an acquisition/i);

  const usLightelligence = companies.find(
    (company) => company.id === "lightelligence",
  );
  const cnLightelligence = companies.find(
    (company) => company.id === "cn-lightelligence",
  );
  assert.equal(cnLightelligence.name, "上海曦智科技股份有限公司");
  assert.equal(cnLightelligence.companyType, "public-company");
  assert.equal(cnLightelligence.nameEn, "Shanghai Xizhi Technology Co., Ltd.");
  assert.ok(!cnLightelligence.aliases.includes(usLightelligence.name));

  assert.match(page, /organizationRelationsRaw/);
  assert.match(page, /organizationRelations=\{organizationRelations\}/);
  assert.match(component, /selectedCompanyRelations/);
  assert.match(component, /Primary relation evidence/);
});

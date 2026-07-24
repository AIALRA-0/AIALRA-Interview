import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { mappedRoleFamilyIds } from "../shared/role-matching.js";

const root = new URL("../", import.meta.url);
const checkOnly = process.argv.includes("--check");
const assetVersion = "2026-07-24.1";
const schemaVersion = "1.0.0";
const evidenceDate = "2026-07-23";
const sourcePaths = [
  "data/companies.us.json",
  "data/expansion-us-candidates.json",
  "data/companies.cn.json",
  "data/expansion-cn-candidates.json",
  "data/organization-labels.json",
  "data/organization-profile-content.json",
  "data/organization-relations.json",
  "data/china-company-ownership.json",
  "data/organization-category-labels.en.json",
  "data/organization-category-labels.zh.json",
  "data/expansion-us-category-labels.json",
  "data/expansion-cn-category-labels.json",
  "data/expansion-cn-company-type-labels.json",
  "data/organization-intelligence.json",
  "data/role-mapping.json",
  "data/release-manifest.json",
];

const sourceTexts = await Promise.all(
  sourcePaths.map((path) => readFile(new URL(path, root), "utf8")),
);
const sourceData = Object.fromEntries(
  sourcePaths.map((path, index) => [path, JSON.parse(sourceTexts[index])]),
);
const sourceHash = createHash("sha256");
for (const [index, path] of sourcePaths.entries()) {
  sourceHash.update(path);
  sourceHash.update("\0");
  sourceHash.update(sourceTexts[index]);
  sourceHash.update("\0");
}
const sourceSha256 = sourceHash.digest("hex");

const organizationLabels = sourceData["data/organization-labels.json"];
const organizationProfiles =
  sourceData["data/organization-profile-content.json"].profiles;
const chinaCompanyOwnership = sourceData["data/china-company-ownership.json"];
const chinaOwnershipById = new Map(
  chinaCompanyOwnership.records.map((record) => [
    record.organizationId,
    record,
  ]),
);
const categoryLabels = {
  ...sourceData["data/organization-category-labels.en.json"].labels,
  ...sourceData["data/organization-category-labels.zh.json"].labels,
  ...sourceData["data/expansion-us-category-labels.json"],
  ...sourceData["data/expansion-cn-category-labels.json"],
};
const companyTypeLabels = {
  ...organizationLabels.companyTypes,
  ...sourceData["data/expansion-cn-company-type-labels.json"],
};
const intelligence = sourceData["data/organization-intelligence.json"];
const roleMapping = sourceData["data/role-mapping.json"];
const releaseManifest = sourceData["data/release-manifest.json"];
const hanPattern = /[\u3400-\u9fff]/;
const latinPattern = /[A-Za-z]/;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function uniqueTerms(terms, limit = Number.POSITIVE_INFINITY) {
  const seen = new Set();
  return terms
    .filter((term) => {
      if (seen.has(term.id)) return false;
      seen.add(term.id);
      return true;
    })
    .slice(0, limit);
}

function normalizedNames(company) {
  const sourceNameIsChinese = hanPattern.test(company.name);
  const aliasEn = company.aliases.find((alias) => latinPattern.test(alias));
  const aliasZh = company.aliases.find((alias) => hanPattern.test(alias));
  const nameEn =
    company.nameEn ||
    (sourceNameIsChinese
      ? organizationLabels.companyNameEn[company.id] || aliasEn
      : organizationLabels.companyNameEn[company.id] || company.name);
  assert.ok(
    nameEn && latinPattern.test(nameEn) && !hanPattern.test(nameEn),
    `Organization ${company.id} needs an English name`,
  );
  const nameZh =
    company.nameZh ||
    (sourceNameIsChinese
      ? company.name
      : organizationLabels.companyNameZh[company.id] || aliasZh);
  return {
    nameEn,
    ...(nameZh && nameZh !== nameEn ? { nameZh } : {}),
  };
}

function categoryAtoms(categories) {
  return uniqueTerms(
    categories.flatMap((category) => {
      if (intelligence.categoryAtomOverrides[category]) {
        return intelligence.categoryAtomOverrides[category];
      }
      const label = categoryLabels[category];
      return label
        ? [{ id: `category:${category}`, zh: label.zh, en: label.en }]
        : [];
    }),
    6,
  );
}

function roleAtoms(roleFamilyIds) {
  return uniqueTerms(
    roleFamilyIds.flatMap(
      (roleFamilyId) => intelligence.roleAtoms[roleFamilyId] || [],
    ),
    8,
  );
}

function opportunityAtoms(opportunityTypes) {
  const corpus = opportunityTypes.join(" ").toLowerCase();
  const matches = intelligence.opportunityAtoms.filter((definition) =>
    definition.patterns.some((pattern) =>
      corpus.includes(pattern.toLowerCase()),
    ),
  );
  return uniqueTerms(
    matches.length ? matches : [intelligence.fallbackOpportunity],
    8,
  );
}

function roleTerms(roleFamilyIds, catalog, fallback, limit) {
  const terms = roleFamilyIds.flatMap(
    (roleFamilyId) => catalog[roleFamilyId] || [],
  );
  return uniqueTerms(terms.length ? terms : fallback, limit);
}

function joinZh(terms) {
  return terms.map((term) => term.zh).join("、");
}

function joinEn(terms) {
  const values = terms.map((term) => term.en);
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function enrich(company) {
  const focusAtoms = categoryAtoms(company.categories);
  const targetRoleAtoms = roleAtoms(company.roleFamilyIds);
  const opportunityTermAtoms = opportunityAtoms(company.opportunityTypes);
  const requirementAtoms = roleTerms(
    company.roleFamilyIds,
    intelligence.roleRequirements,
    intelligence.fallbackRequirement,
    8,
  );
  const preparationAtoms = roleTerms(
    company.roleFamilyIds,
    intelligence.rolePreparation,
    intelligence.fallbackPreparation,
    6,
  );
  const type = companyTypeLabels[company.companyType] || {
    zh: "组织",
    en: "organization",
  };
  const focusZh = joinZh(focusAtoms.slice(0, 4)) || "工程技术";
  const focusEn = joinEn(focusAtoms.slice(0, 4)) || "engineering technology";
  const rolesZh = joinZh(targetRoleAtoms.slice(0, 4)) || "具体岗位待核";
  const rolesEn =
    joinEn(targetRoleAtoms.slice(0, 4)) || "posting-specific roles";
  const generatedDescription = {
    zh: `${company.nameZh || company.nameEn}是本图谱中的${type.zh}节点，主要覆盖${focusZh}。可重点关注的目标岗位包括${rolesZh}；是否有当期机会仍须以具体招聘公告为准。`,
    en: `${company.nameEn} is a ${type.en.toLowerCase()} in this atlas, with work spanning ${focusEn}. The most relevant target roles include ${rolesEn}; current availability must still be verified against an exact posting.`,
  };
  const generatedRelevance = {
    zh: `纳入原因：其${joinZh(focusAtoms.slice(0, 3)) || "相关工程领域"}业务与${joinZh(targetRoleAtoms.slice(0, 3)) || "目标岗位"}能力路径存在可验证交集。`,
    en: `Why it is included: its work in ${joinEn(focusAtoms.slice(0, 3)) || "the relevant engineering domain"} has a verifiable intersection with the ${joinEn(targetRoleAtoms.slice(0, 3)) || "target roles"} capability path.`,
  };
  const rawRelevance = company.whyRelevant.trim();
  const rawIsChinese = hanPattern.test(rawRelevance);
  return {
    descriptionZh: company.descriptionZh?.trim() || generatedDescription.zh,
    descriptionEn: company.descriptionEn?.trim() || generatedDescription.en,
    relevanceZh:
      company.relevanceZh?.trim() ||
      (rawIsChinese ? rawRelevance : generatedRelevance.zh),
    relevanceEn:
      company.relevanceEn?.trim() ||
      (rawIsChinese
        ? generatedRelevance.en
        : rawRelevance || generatedRelevance.en),
    focusAtoms,
    roleAtoms: targetRoleAtoms,
    opportunityAtoms: opportunityTermAtoms,
    requirementAtoms,
    preparationAtoms,
  };
}

const regionalSources = [
  ["data/companies.us.json", "US"],
  ["data/expansion-us-candidates.json", "US"],
  ["data/companies.cn.json", "CN"],
  ["data/expansion-cn-candidates.json", "CN"],
];
const organizations = regionalSources
  .flatMap(([path, opportunityMarket]) =>
    sourceData[path].map((company) => ({
      ...company,
      opportunityMarket,
    })),
  )
  .map((rawCompany) => {
    const ownershipRecord = chinaOwnershipById.get(rawCompany.id);
    const ownershipClass = ownershipRecord
      ? chinaCompanyOwnership.ownershipClasses[ownershipRecord.ownershipClass]
      : null;
    const company = {
      ...rawCompany,
      ...(organizationProfiles[rawCompany.id] || {}),
      ...normalizedNames(rawCompany),
      roleFamilyIds: mappedRoleFamilyIds(rawCompany, roleMapping.rules),
      ...(ownershipRecord && ownershipClass
        ? {
            ownership: {
              ownershipClass: ownershipRecord.ownershipClass,
              labelZh: ownershipClass.zh,
              labelEn: ownershipClass.en,
              definitionZh: ownershipClass.definitionZh,
              definitionEn: ownershipClass.definitionEn,
              summaryZh: ownershipRecord.summaryZh,
              summaryEn: ownershipRecord.summaryEn,
              confidence: ownershipRecord.confidence,
              classificationBasis: ownershipRecord.classificationBasis,
              sourceOwnershipTag: ownershipRecord.sourceOwnershipTag,
              reviewStatus: ownershipRecord.reviewStatus,
              reviewedAt: chinaCompanyOwnership.reviewedAt,
              evidence: ownershipRecord.evidence,
            },
          }
        : {}),
    };
    return { ...company, ...enrich(company) };
  });

assert.equal(organizations.length, releaseManifest.organizations.total);
assert.equal(
  new Set(organizations.map((company) => company.id)).size,
  organizations.length,
  "organization IDs must be unique",
);
assert.deepEqual(
  organizations
    .filter(
      (company) =>
        company.opportunityMarket === "CN" && company.companyType === "company",
    )
    .map((company) => company.id)
    .sort(),
  [...chinaOwnershipById.keys()].sort(),
  "China ownership records must exactly cover every CN company node",
);
assert.equal(
  organizations.filter((company) => company.ownership).length,
  chinaCompanyOwnership.statistics.total,
  "generated ownership-profile count must match the reviewed dataset",
);

const asset = {
  schemaVersion,
  assetVersion,
  sourceSha256,
  evidenceDate,
  organizationCount: organizations.length,
  organizations,
};
const assetText = JSON.stringify(asset);
const manifest = {
  schemaVersion,
  assetVersion,
  sourceSha256,
  evidenceDate,
  organizationCount: organizations.length,
  regionCounts: {
    US: organizations.filter((company) => company.opportunityMarket === "US")
      .length,
    CN: organizations.filter((company) => company.opportunityMarket === "CN")
      .length,
    Global: organizations.filter(
      (company) => company.opportunityMarket === "Global",
    ).length,
  },
  asset: {
    url: "/organization-universe.json",
    sha256: sha256(assetText),
    bytes: Buffer.byteLength(assetText),
  },
};
assert.deepEqual(
  manifest.regionCounts,
  releaseManifest.organizations.regionCounts,
  "organization region counts must match the release manifest",
);
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
const assetUrl = new URL("public/organization-universe.json", root);
const manifestUrl = new URL("public/organization-universe.manifest.json", root);

if (checkOnly) {
  const [currentAsset, currentManifest] = await Promise.all([
    readFile(assetUrl, "utf8"),
    readFile(manifestUrl, "utf8"),
  ]);
  assert.equal(
    currentAsset,
    assetText,
    "public/organization-universe.json is stale; run npm run organizations:build",
  );
  assert.equal(
    currentManifest,
    manifestText,
    "public/organization-universe.manifest.json is stale; run npm run organizations:build",
  );
  console.log(
    `Verified ${organizations.length} organizations (${manifest.asset.bytes} B, sha256 ${manifest.asset.sha256}).`,
  );
} else {
  await Promise.all([
    writeFile(assetUrl, assetText),
    writeFile(manifestUrl, manifestText),
  ]);
  console.log(
    `Built ${organizations.length} organizations (${manifest.asset.bytes} B, sha256 ${manifest.asset.sha256}).`,
  );
}

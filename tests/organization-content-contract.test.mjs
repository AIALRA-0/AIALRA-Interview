import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  mappedRoleFamilyIds,
  matchesRoleKeyword,
} from "../shared/role-matching.js";

const root = new URL("../", import.meta.url);
const hanPattern = /[\u3400-\u9fff]/;
const latinPattern = /[A-Za-z]/;
const englishCompoundPattern = /\s+(?:and|&)\s+|[/／]/i;
const chineseCompoundPattern = /[、与及和/／]/;

async function json(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
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

function assertBilingualTerm(term, context) {
  assert.ok(term && typeof term === "object", `${context} must be an object`);
  assert.ok(term.id?.trim(), `${context} needs a stable id`);
  assert.ok(term.zh?.trim(), `${context} needs a Chinese label`);
  assert.ok(term.en?.trim(), `${context} needs an English label`);
  assert.match(term.en, latinPattern, `${context}.en needs Latin text`);
}

function assertAtomicTerm(term, context) {
  assertBilingualTerm(term, context);
  const isCompound =
    englishCompoundPattern.test(term.en) ||
    englishCompoundPattern.test(term.zh) ||
    chineseCompoundPattern.test(term.zh) ||
    chineseCompoundPattern.test(term.en);

  if (term.compoundExempt === true) {
    assert.ok(
      term.compoundExceptionReason?.trim(),
      `${context} marks a compound exception without a reason`,
    );
    return;
  }

  assert.equal(
    isCompound,
    false,
    `${context} is a compound visible label; split it into atomic bilingual terms or document an exception`,
  );
}

function normalizeNames(company, organizationLabels) {
  const sourceNameIsChinese = hanPattern.test(company.name);
  const aliasEn = company.aliases.find((alias) => latinPattern.test(alias));
  const aliasZh = company.aliases.find((alias) => hanPattern.test(alias));
  const nameEn =
    company.nameEn ||
    (sourceNameIsChinese
      ? organizationLabels.companyNameEn[company.id] || aliasEn
      : organizationLabels.companyNameEn[company.id] || company.name);
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

function joinZh(terms) {
  return terms.map((term) => term.zh).join("、");
}

function joinEn(terms) {
  const values = terms.map((term) => term.en);
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function createEnricher({ intelligence, categoryLabels, companyTypeLabels }) {
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

  return function enrich(company) {
    const focus = categoryAtoms(company.categories);
    const roles = roleAtoms(company.roleFamilyIds);
    const opportunities = opportunityAtoms(company.opportunityTypes);
    const requirements = roleTerms(
      company.roleFamilyIds,
      intelligence.roleRequirements,
      intelligence.fallbackRequirement,
      8,
    );
    const preparation = roleTerms(
      company.roleFamilyIds,
      intelligence.rolePreparation,
      intelligence.fallbackPreparation,
      6,
    );
    const companyType = companyTypeLabels[company.companyType] || {
      zh: "组织",
      en: "organization",
    };
    const focusZh = joinZh(focus.slice(0, 4)) || "工程技术";
    const focusEn = joinEn(focus.slice(0, 4)) || "engineering technology";
    const rolesZh = joinZh(roles.slice(0, 4)) || "具体岗位待核";
    const rolesEn = joinEn(roles.slice(0, 4)) || "posting-specific roles";
    const description = {
      zh: `${company.nameZh || company.nameEn}是本图谱中的${companyType.zh}节点，主要覆盖${focusZh}。可重点关注的目标岗位包括${rolesZh}；是否有当期机会仍须以具体招聘公告为准。`,
      en: `${company.nameEn} is a ${companyType.en.toLowerCase()} in this atlas, with work spanning ${focusEn}. The most relevant target roles include ${rolesEn}; current availability must still be verified against an exact posting.`,
    };
    const relevanceFocusZh = joinZh(focus.slice(0, 3)) || "相关工程领域";
    const relevanceFocusEn =
      joinEn(focus.slice(0, 3)) || "the relevant engineering domain";
    const relevanceRolesZh = joinZh(roles.slice(0, 3)) || "目标岗位";
    const relevanceRolesEn = joinEn(roles.slice(0, 3)) || "target roles";
    const generatedRelevance = {
      zh: `纳入原因：其${relevanceFocusZh}业务与${relevanceRolesZh}能力路径存在可验证交集。`,
      en: `Why it is included: its work in ${relevanceFocusEn} has a verifiable intersection with the ${relevanceRolesEn} capability path.`,
    };
    const rawRelevance = company.whyRelevant.trim();
    const rawIsChinese = hanPattern.test(rawRelevance);

    return {
      descriptionZh: company.descriptionZh?.trim() || description.zh,
      descriptionEn: company.descriptionEn?.trim() || description.en,
      relevanceZh:
        company.relevanceZh?.trim() ||
        (rawIsChinese ? rawRelevance : generatedRelevance.zh),
      relevanceEn:
        company.relevanceEn?.trim() ||
        (rawIsChinese
          ? generatedRelevance.en
          : rawRelevance || generatedRelevance.en),
      focusAtoms: focus,
      roleAtoms: roles,
      opportunityAtoms: opportunities,
      requirementAtoms: requirements,
      preparationAtoms: preparation,
    };
  };
}

test("all organizations generate distinct bilingual overview and relevance content", async () => {
  const [
    usCompanies,
    usExpansion,
    cnCompanies,
    cnExpansion,
    organizationLabels,
    categoriesEn,
    categoriesZh,
    categoriesUsExpansion,
    categoriesCnExpansion,
    companyTypesCnExpansion,
    profileContent,
    roleMapping,
    intelligence,
    pageSource,
    releaseManifest,
  ] = await Promise.all([
    json("data/companies.us.json"),
    json("data/expansion-us-candidates.json"),
    json("data/companies.cn.json"),
    json("data/expansion-cn-candidates.json"),
    json("data/organization-labels.json"),
    json("data/organization-category-labels.en.json"),
    json("data/organization-category-labels.zh.json"),
    json("data/expansion-us-category-labels.json"),
    json("data/expansion-cn-category-labels.json"),
    json("data/expansion-cn-company-type-labels.json"),
    json("data/organization-profile-content.json"),
    json("data/role-mapping.json"),
    json("data/organization-intelligence.json"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    json("data/release-manifest.json"),
  ]);
  const companies = [
    ...usCompanies,
    ...usExpansion,
    ...cnCompanies,
    ...cnExpansion,
  ];
  const enrich = createEnricher({
    intelligence,
    categoryLabels: {
      ...categoriesEn.labels,
      ...categoriesZh.labels,
      ...categoriesUsExpansion,
      ...categoriesCnExpansion,
    },
    companyTypeLabels: {
      ...organizationLabels.companyTypes,
      ...companyTypesCnExpansion,
    },
  });

  assert.equal(companies.length, releaseManifest.organizations.total);
  assert.deepEqual(
    Object.keys(profileContent.profiles).sort(),
    [...usCompanies, ...cnCompanies].map((company) => company.id).sort(),
    "reviewed profile content must cover all 529 base organizations",
  );
  assert.match(pageSource, /import \{ enrichOrganization \}/);
  assert.match(
    pageSource,
    /\.\.\.enrichOrganization\(normalized\)/,
    "every normalized organization must be enriched before reaching the UI",
  );

  let canonicalRoleEdgeCount = 0;
  for (const rawCompany of companies) {
    const company = {
      ...rawCompany,
      ...(profileContent.profiles[rawCompany.id] || {}),
      ...normalizeNames(rawCompany, organizationLabels),
      roleFamilyIds: mappedRoleFamilyIds(rawCompany, roleMapping.rules),
    };
    canonicalRoleEdgeCount += company.roleFamilyIds.length;
    const profile = enrich(company);
    const context = `organization ${company.id}`;

    assert.ok(profile.descriptionZh.trim(), `${context} lacks descriptionZh`);
    assert.ok(profile.descriptionEn.trim(), `${context} lacks descriptionEn`);
    assert.ok(profile.relevanceZh.trim(), `${context} lacks relevanceZh`);
    assert.ok(profile.relevanceEn.trim(), `${context} lacks relevanceEn`);
    assert.match(profile.descriptionZh, hanPattern, `${context} descriptionZh`);
    assert.match(
      profile.descriptionEn,
      latinPattern,
      `${context} descriptionEn`,
    );
    assert.match(profile.relevanceZh, hanPattern, `${context} relevanceZh`);
    assert.match(profile.relevanceEn, latinPattern, `${context} relevanceEn`);
    assert.notEqual(
      profile.descriptionZh.trim(),
      profile.relevanceZh.trim(),
      `${context} Chinese overview and relevance must serve different purposes`,
    );
    assert.notEqual(
      profile.descriptionEn.trim(),
      profile.relevanceEn.trim(),
      `${context} English overview and relevance must serve different purposes`,
    );

    for (const field of [
      "focusAtoms",
      "roleAtoms",
      "opportunityAtoms",
      "requirementAtoms",
      "preparationAtoms",
    ]) {
      assert.ok(profile[field].length > 0, `${context} has no ${field}`);
      profile[field].forEach((term, index) =>
        assertAtomicTerm(term, `${context}.${field}[${index}]`),
      );
    }
  }
  assert.equal(
    canonicalRoleEdgeCount,
    releaseManifest.organizations.canonicalRoleEdges,
    "canonical organization-to-role edges must match the release contract",
  );
});

test("all 15 role families and every visible taxonomy use bilingual atomic labels", async () => {
  const [roles, intelligence, presentation] = await Promise.all([
    json("data/role-families.json"),
    json("data/organization-intelligence.json"),
    json("data/role-presentation.json"),
  ]);
  const roleIds = roles.roleFamilies.map((role) => role.id).sort();

  assert.equal(roleIds.length, 15);
  assert.deepEqual(Object.keys(presentation.roles).sort(), roleIds);
  assert.deepEqual(Object.keys(intelligence.roleAtoms).sort(), roleIds);
  assert.deepEqual(Object.keys(intelligence.roleRequirements).sort(), roleIds);
  assert.deepEqual(Object.keys(intelligence.rolePreparation).sort(), roleIds);

  const catalogs = [
    ["roleAtoms", Object.values(intelligence.roleAtoms).flat()],
    ["roleRequirements", Object.values(intelligence.roleRequirements).flat()],
    ["rolePreparation", Object.values(intelligence.rolePreparation).flat()],
    [
      "categoryAtomOverrides",
      Object.values(intelligence.categoryAtomOverrides).flat(),
    ],
    ["opportunityAtoms", intelligence.opportunityAtoms],
    ["fallbackRequirement", intelligence.fallbackRequirement],
    ["fallbackPreparation", intelligence.fallbackPreparation],
    ["fallbackOpportunity", [intelligence.fallbackOpportunity]],
  ];

  for (const [catalogName, terms] of catalogs) {
    assert.ok(terms.length > 0, `${catalogName} must not be empty`);
    terms.forEach((term, index) =>
      assertAtomicTerm(term, `${catalogName}[${index}]`),
    );
  }

  for (const [roleId, role] of Object.entries(presentation.roles)) {
    assert.match(role.descriptionZh, hanPattern, `${roleId}.descriptionZh`);
    assert.match(role.descriptionEn, latinPattern, `${roleId}.descriptionEn`);
    for (const field of ["typicalTitleAtoms", "interviewStageAtoms"]) {
      assert.ok(role[field].length > 0, `${roleId}.${field} must not be empty`);
      role[field].forEach((term, index) =>
        assertAtomicTerm(term, `rolePresentation.${roleId}.${field}[${index}]`),
      );
    }
  }
});

test("all skill nodes render through the bilingual atomic presentation catalog", async () => {
  const [skillGraph, presentation, component, releaseManifest] =
    await Promise.all([
      json("data/skill-graph.json"),
      json("data/skill-presentation.json"),
      readFile(new URL("app/CareerDojoApp.tsx", root), "utf8"),
      json("data/release-manifest.json"),
    ]);
  const skillIds = skillGraph.skills.map((skill) => skill.id).sort();
  assert.equal(skillIds.length, releaseManifest.skills.nodes);
  assert.deepEqual(Object.keys(presentation.skills).sort(), skillIds);

  let termCount = 0;
  for (const [skillId, entry] of Object.entries(presentation.skills)) {
    assert.ok(entry.displayTerms.length > 0, `${skillId} has no display terms`);
    termCount += entry.displayTerms.length;
    entry.displayTerms.forEach((term, index) =>
      assertAtomicTerm(term, `skillPresentation.${skillId}[${index}]`),
    );
  }
  assert.equal(termCount, releaseManifest.skills.displayTerms);
  assert.match(component, /import skillPresentationRaw/);
  assert.match(component, /function skillTerms\(/);
  assert.ok(
    (component.match(/skillTerms\(/g) || []).length >= 4,
    "skill graph, prerequisites, and question cards must share atomic skill rendering",
  );
  assert.doesNotMatch(component, /function skillTerm\(/);
});

test("short role abbreviations require explicit token boundaries", () => {
  assert.equal(matchesRoleKeyword("standards metrology", "sta"), false);
  assert.equal(matchesRoleKeyword("private-company", "ate"), false);
  assert.equal(matchesRoleKeyword("performance analysis", "rf"), false);
  assert.equal(matchesRoleKeyword("research academy", "cad"), false);
  assert.equal(matchesRoleKeyword("scientific society", "soc"), false);

  assert.equal(matchesRoleKeyword("STA signoff", "sta"), true);
  assert.equal(matchesRoleKeyword("ATE engineering", "ate"), true);
  assert.equal(matchesRoleKeyword("RF systems", "rf"), true);
  assert.equal(matchesRoleKeyword("CAD flow", "cad"), true);
  assert.equal(matchesRoleKeyword("SoC architecture", "soc"), true);
});

test("the NIST role mapping excludes the standards-to-STA false positive", async () => {
  const [companies, roleMapping, intelligence] = await Promise.all([
    json("data/companies.us.json"),
    json("data/role-mapping.json"),
    json("data/organization-intelligence.json"),
  ]);
  const nist = companies.find((company) => company.id === "nist-chips-rd");
  assert.ok(nist, "NIST CHIPS R&D organization is missing");

  const roleFamilyIds = mappedRoleFamilyIds(nist, roleMapping.rules);
  assert.deepEqual(roleFamilyIds, ["rf-dft", "rf-manufacturing-automation"]);
  const atoms = uniqueTerms(
    roleFamilyIds.flatMap(
      (roleFamilyId) => intelligence.roleAtoms[roleFamilyId] || [],
    ),
  );
  assert.deepEqual(
    atoms.map((term) => term.id),
    [
      "design-for-test",
      "production-test",
      "semiconductor-manufacturing",
      "equipment-automation",
    ],
  );
  assert.equal(atoms.length, 4);
  atoms.forEach((term, index) =>
    assertAtomicTerm(term, `NIST.roleAtoms[${index}]`),
  );
});

test("evidence types always resolve to a bilingual label or the explicit fallback", async () => {
  const [
    usCompanies,
    usExpansion,
    cnCompanies,
    cnExpansion,
    intelligence,
    source,
  ] = await Promise.all([
    json("data/companies.us.json"),
    json("data/expansion-us-candidates.json"),
    json("data/companies.cn.json"),
    json("data/expansion-cn-candidates.json"),
    json("data/organization-intelligence.json"),
    readFile(new URL("app/organization-intelligence.ts", root), "utf8"),
  ]);
  assert.ok(
    intelligence.fallbackEvidenceType,
    "fallbackEvidenceType is required",
  );
  assertBilingualTerm(
    { id: "fallback-evidence", ...intelligence.fallbackEvidenceType },
    "fallbackEvidenceType",
  );
  assert.match(source, /function evidenceTypeLabel\(/);
  assert.match(source, /fallbackEvidenceType/);

  const observedTypes = new Set(
    [...usCompanies, ...usExpansion, ...cnCompanies, ...cnExpansion].flatMap(
      (company) =>
        company.evidence.map((evidence) => evidence.type).filter(Boolean),
    ),
  );
  assert.ok(observedTypes.size > 0);
  for (const type of observedTypes) {
    const label =
      intelligence.evidenceTypes[type] || intelligence.fallbackEvidenceType;
    assertBilingualTerm({ id: type, ...label }, `evidence type ${type}`);
  }
});

test("organization UI renders enriched bilingual atoms instead of raw compound fields", async () => {
  const component = await readFile(
    new URL("app/CareerDojoApp.tsx", root),
    "utf8",
  );
  const modalStart = component.indexOf("{selectedCompany ? (");
  const modalEnd = component.indexOf("{selectedQuestion ? (", modalStart);
  assert.ok(modalStart >= 0, "company modal was not found");
  assert.ok(modalEnd > modalStart, "company modal boundary was not found");
  const modal = component.slice(modalStart, modalEnd);
  const cardStart = component.indexOf('<div className="company-grid">');
  const cardEnd = component.indexOf(
    "{companyLimit < filteredCompanies.length ? (",
    cardStart,
  );
  assert.ok(cardStart >= 0, "organization card grid was not found");
  assert.ok(
    cardEnd > cardStart,
    "organization card grid boundary was not found",
  );
  const cards = component.slice(cardStart, cardEnd);

  for (const field of [
    "focusAreas",
    "roleFamilies",
    "opportunityTypes",
    "requirements",
    "gaps",
    "whyRelevant",
  ]) {
    assert.doesNotMatch(
      modal,
      new RegExp(`selectedCompany\\.${field}\\b`),
      `company modal directly renders raw ${field}`,
    );
  }

  for (const field of [
    "roleAtoms",
    "focusAtoms",
    "opportunityAtoms",
    "requirementAtoms",
    "preparationAtoms",
  ]) {
    assert.match(
      modal,
      new RegExp(`selectedCompany\\.${field}\\.map\\(`),
      `company modal must render ${field}`,
    );
  }

  assert.match(modal, /selectedCompany\.descriptionZh/);
  assert.match(modal, /selectedCompany\.descriptionEn/);
  assert.match(modal, /selectedCompany\.relevanceZh/);
  assert.match(modal, /selectedCompany\.relevanceEn/);
  assert.match(modal, /<BilingualTermLabel\b/);
  assert.match(modal, /evidenceTypeLabel\(evidence\.type\)/);
  assert.match(cards, /company\.descriptionZh/);
  assert.match(cards, /company\.descriptionEn/);
  assert.match(cards, /company\.focusAtoms\.slice\(0, 3\)\.map\(/);
  assert.doesNotMatch(
    `${cards}\n${modal}`,
    /\{(?:selectedCompany|company)\.(?:focusAreas|roleFamilies|opportunityTypes|requirements|gaps)(?:\.slice\([^)]*\))?\.(?:map|join)\(/,
    "raw organization analysis arrays must not be rendered directly",
  );
});

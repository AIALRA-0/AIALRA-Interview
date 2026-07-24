import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { mappedRoleFamilyIds } from "../shared/role-matching.js";

const root = new URL("../", import.meta.url);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

async function readTextCorpus(
  relativeDirectory,
  include,
  { optional = false } = {},
) {
  const directory = new URL(relativeDirectory, root);
  const corpus = {};

  async function visit(currentDirectory, prefix = "") {
    const entries = await readdir(currentDirectory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      const relativePath = `${prefix}${entry.name}`;
      const entryUrl = new URL(entry.name, currentDirectory);
      if (entry.isDirectory()) {
        await visit(
          new URL(`${entry.name}/`, currentDirectory),
          `${relativePath}/`,
        );
      } else if (entry.isFile() && include(relativePath)) {
        corpus[relativePath] = await readFile(entryUrl, "utf8");
      }
    }
  }

  try {
    await visit(directory);
  } catch (error) {
    if (
      optional &&
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return corpus;
    }
    throw error;
  }
  return corpus;
}

async function readPublicResearchCorpus() {
  return readTextCorpus("research/", (relativePath) =>
    relativePath.endsWith(".md"),
  );
}

async function readSkillTranslationCatalog() {
  const directory = new URL("data/skill-translations/", root);
  const filenames = (await readdir(directory))
    .filter((name) => /^part-.+\.json$/.test(name))
    .sort();
  assert.ok(filenames.length > 0, "no skill translation fragments found");
  const catalog = {};
  for (const filename of filenames) {
    const fragment = JSON.parse(
      await readFile(new URL(filename, directory), "utf8"),
    );
    for (const [skillId, value] of Object.entries(fragment)) {
      assert.ok(
        !catalog[skillId],
        `duplicate skill description translation ${skillId} in ${filename}`,
      );
      const descriptionZh =
        typeof value === "string" ? value : value?.descriptionZh;
      assert.ok(
        typeof descriptionZh === "string" &&
          descriptionZh.length >= 8 &&
          /[\u3400-\u9fff]/.test(descriptionZh),
        `skill description translation ${skillId} in ${filename} is not usable Chinese`,
      );
      catalog[skillId] = descriptionZh;
    }
  }
  return catalog;
}

async function readQuestionTranslationCatalog() {
  const directory = new URL("data/question-translations/", root);
  const filenames = (await readdir(directory))
    .filter((name) => /^part-.+\.json$/.test(name))
    .sort();
  assert.ok(filenames.length > 0, "no question translation fragments found");
  const catalog = {};
  for (const filename of filenames) {
    const fragment = JSON.parse(
      await readFile(new URL(filename, directory), "utf8"),
    );
    assert.ok(
      fragment && typeof fragment === "object" && !Array.isArray(fragment),
      `question translation fragment ${filename} must be an object`,
    );
    for (const [questionId, translation] of Object.entries(fragment)) {
      assert.ok(
        !catalog[questionId],
        `duplicate question translation ${questionId} in ${filename}`,
      );
      assert.ok(
        translation &&
          typeof translation === "object" &&
          !Array.isArray(translation),
        `question translation ${questionId} in ${filename} must be an object`,
      );
      catalog[questionId] = translation;
    }
  }
  return catalog;
}

async function readOracleTranslationCatalog() {
  const directory = new URL("data/oracle-translations/", root);
  const filenames = (await readdir(directory))
    .filter((name) => /^part-.+\.json$/.test(name))
    .sort();
  assert.ok(filenames.length > 0, "no oracle translation fragments found");
  const catalog = {};
  for (const filename of filenames) {
    const fragment = JSON.parse(
      await readFile(new URL(filename, directory), "utf8"),
    );
    for (const [questionId, oracleZh] of Object.entries(fragment)) {
      assert.ok(
        !catalog[questionId],
        `duplicate exact oracle translation ${questionId} in ${filename}`,
      );
      assert.ok(
        oracleZh &&
          typeof oracleZh === "object" &&
          !Array.isArray(oracleZh) &&
          Object.keys(oracleZh).sort().join(",") ===
            "acceptance,kind,procedure",
        `exact oracle translation ${questionId} in ${filename} has an invalid schema`,
      );
      for (const [field, value] of Object.entries(oracleZh)) {
        assert.ok(
          typeof value === "string" &&
            value.length >= 3 &&
            hasChinese(value, field === "kind" ? 2 : 4),
          `exact oracle translation ${questionId}.${field} is not usable Chinese`,
        );
      }
      catalog[questionId] = oracleZh;
    }
  }
  assert.equal(
    Object.keys(catalog).length,
    45,
    "exact oracle translation catalog must contain 45 anchors",
  );
  return catalog;
}

async function readOracleSpecCatalog() {
  const directory = new URL("data/oracle-specs/", root);
  const filenames = (await readdir(directory))
    .filter((name) => /^part-.+\.json$/.test(name))
    .sort();
  assert.ok(filenames.length > 0, "no task-specific oracle specs found");
  const catalog = {};
  for (const filename of filenames) {
    const fragment = JSON.parse(
      await readFile(new URL(filename, directory), "utf8"),
    );
    for (const [questionId, spec] of Object.entries(fragment)) {
      assert.ok(
        !catalog[questionId],
        `duplicate task-specific oracle spec ${questionId} in ${filename}`,
      );
      assert.ok(
        spec &&
          typeof spec === "object" &&
          !Array.isArray(spec) &&
          Object.keys(spec).sort().join(",") === "oracle,oracleZh",
        `task-specific oracle spec ${questionId} in ${filename} must contain only oracle and oracleZh`,
      );
      for (const [field, oracle] of Object.entries(spec)) {
        assert.ok(
          oracle &&
            typeof oracle === "object" &&
            !Array.isArray(oracle) &&
            Object.keys(oracle).sort().join(",") ===
              "acceptance,kind,procedure",
          `task-specific oracle spec ${questionId}.${field} has an invalid schema`,
        );
        assert.ok(
          typeof oracle.procedure === "string" &&
            oracle.procedure.length >= 15 &&
            typeof oracle.acceptance === "string" &&
            oracle.acceptance.length >= 15,
          `task-specific oracle spec ${questionId}.${field} is too shallow`,
        );
        if (field === "oracle") {
          assert.ok(
            ["executable", "observable"].includes(oracle.kind),
            `task-specific oracle spec ${questionId}.oracle.kind is invalid`,
          );
        } else {
          assert.ok(
            ["可执行", "可观察"].includes(oracle.kind) &&
              hasChinese(oracle.procedure, 4) &&
              hasChinese(oracle.acceptance, 8),
            `task-specific oracle spec ${questionId}.oracleZh is invalid`,
          );
        }
      }
      catalog[questionId] = spec;
    }
  }
  assert.equal(
    Object.keys(catalog).length,
    210,
    "task-specific oracle spec catalog must contain exactly 210 anchors",
  );
  return catalog;
}

function recordsOf(value, key, path) {
  const records = Array.isArray(value) ? value : value?.[key];
  assert.ok(
    Array.isArray(records),
    `${path} must be an array or expose "${key}"`,
  );
  return records;
}

function assertUniqueIds(records, path) {
  const ids = records.map((item) => item?.id);
  assert.ok(ids.every(Boolean), `${path} contains a record without an id`);
  assert.equal(new Set(ids).size, ids.length, `${path} contains duplicate ids`);
}

function assertUrl(value, context) {
  assert.ok(
    typeof value === "string" && value.length > 0,
    `${context} is empty`,
  );
  const url = new URL(value);
  assert.ok(
    url.protocol === "https:" || url.protocol === "http:",
    `${context} must be an HTTP(S) URL`,
  );
}

function nonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function hasChinese(value, minimumHan = 2) {
  const matches = String(value || "").match(/[\u3400-\u9fff]/g) || [];
  return matches.length >= minimumHan;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function assertParallelArray(question, englishField, chineseField, minimum) {
  const context = `question ${question.id}`;
  const english = question[englishField];
  const chinese = question[chineseField];
  assert.ok(
    Array.isArray(english) && english.length >= minimum,
    `${context}.${englishField} needs at least ${minimum} items`,
  );
  assert.ok(
    Array.isArray(chinese),
    `${context}.${chineseField} must be an array`,
  );
  assert.equal(
    chinese.length,
    english.length,
    `${context}.${chineseField} must be item-aligned with ${englishField}`,
  );
  for (const [index, value] of chinese.entries()) {
    assert.ok(
      typeof value === "string" && value.length >= 4 && hasChinese(value, 2),
      `${context}.${chineseField}[${index}] is not usable Chinese`,
    );
  }
}

function wordShingles(value, width = 5) {
  const words = normalizeText(value).split(/\s+/).filter(Boolean);
  const shingles = new Set();
  for (let index = 0; index <= words.length - width; index += 1) {
    shingles.add(words.slice(index, index + width).join(" "));
  }
  return shingles;
}

function characterShingles(value, width = 12) {
  const characters = normalizeText(value).replace(/\s+/g, "");
  const shingles = new Set();
  for (let index = 0; index <= characters.length - width; index += 1) {
    shingles.add(characters.slice(index, index + width));
  }
  return shingles;
}

function jaccard(left, right) {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const value of left) {
    if (right.has(value)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection);
}

const [
  profile,
  usBaseRaw,
  usExpansionRaw,
  cnBaseRaw,
  cnExpansionRaw,
  rolesRaw,
  roleMapping,
  skillsRaw,
  questionsRaw,
  organizationLabels,
  categoryLabelsEn,
  categoryLabelsZh,
  expansionUsCategoryLabels,
  expansionCnCategoryLabels,
  expansionCnCompanyTypeLabels,
  chinaCompanyOwnership,
  organizationProfileContent,
  organizationIntelligence,
  rolePresentation,
  skillPresentation,
  organizationRelations,
  releaseManifest,
  organizationUniverseAsset,
  publicResearchCorpus,
  publicDataSourceCorpus,
  publicAppSourceCorpus,
  publicSharedSourceCorpus,
  publicTestSourceCorpus,
  publicReadme,
  publicQuestionAssetCorpus,
] = await Promise.all([
  readJson("data/profile.json"),
  readJson("data/companies.us.json"),
  readJson("data/expansion-us-candidates.json"),
  readJson("data/companies.cn.json"),
  readJson("data/expansion-cn-candidates.json"),
  readJson("data/role-families.json"),
  readJson("data/role-mapping.json"),
  readJson("data/skill-graph.json"),
  readJson("data/questions.seed.json"),
  readJson("data/organization-labels.json"),
  readJson("data/organization-category-labels.en.json"),
  readJson("data/organization-category-labels.zh.json"),
  readJson("data/expansion-us-category-labels.json"),
  readJson("data/expansion-cn-category-labels.json"),
  readJson("data/expansion-cn-company-type-labels.json"),
  readJson("data/china-company-ownership.json"),
  readJson("data/organization-profile-content.json"),
  readJson("data/organization-intelligence.json"),
  readJson("data/role-presentation.json"),
  readJson("data/skill-presentation.json"),
  readJson("data/organization-relations.json"),
  readJson("data/release-manifest.json"),
  readJson("public/organization-universe.json"),
  readPublicResearchCorpus(),
  readTextCorpus("data/", (relativePath) => relativePath.endsWith(".json")),
  readTextCorpus("app/", (relativePath) =>
    /\.(?:css|ts|tsx)$/.test(relativePath),
  ),
  readTextCorpus("shared/", (relativePath) =>
    /\.(?:js|mjs|ts)$/.test(relativePath),
  ),
  readTextCorpus("tests/", (relativePath) =>
    /\.(?:js|mjs|ts|tsx)$/.test(relativePath),
  ),
  readFile(new URL("README.md", root), "utf8"),
  readTextCorpus(
    "public/question-bank/",
    (relativePath) => relativePath.endsWith(".json"),
    { optional: true },
  ),
]);

assert.ok(profile.id);
assert.ok(nonEmptyArray(profile.priorityRoleFamilies));
assert.ok(nonEmptyArray(profile.criticalGaps));
const privateCandidateFingerprintPattern =
  /USC MSECE|Rensselaer|\bRPI\b|3\.67|ZU4EV|TinyTapeout|five-stage RISC-V|五级流水|FIR flow|Viterbi flow|Ramulator(?:2)?/i;
const privateStructuredTimelinePattern =
  /"(?:targetWindow|targetWindowEn|start|startEn)"\s*:\s*"(?:Fall 2026|Summer 2027)"/i;
const candidateAuthorizationPattern = /\b(?:F-1|CPT)\b/i;
const firstSemesterAuthorizationPattern =
  /(?:first semester|第一学期)[\s\S]{0,160}(?:F-1|CPT)|(?:F-1|CPT)[\s\S]{0,160}(?:first semester|第一学期)/i;
const publicOrganizationSources = {
  "data/profile.json": profile,
  "data/companies.us.json": usBaseRaw,
  "data/expansion-us-candidates.json": usExpansionRaw,
  "data/companies.cn.json": cnBaseRaw,
  "data/expansion-cn-candidates.json": cnExpansionRaw,
  "data/organization-labels.json": organizationLabels,
  "data/organization-category-labels.en.json": categoryLabelsEn,
  "data/organization-category-labels.zh.json": categoryLabelsZh,
  "data/expansion-us-category-labels.json": expansionUsCategoryLabels,
  "data/expansion-cn-category-labels.json": expansionCnCategoryLabels,
  "data/expansion-cn-company-type-labels.json": expansionCnCompanyTypeLabels,
  "data/china-company-ownership.json": chinaCompanyOwnership,
  "data/organization-profile-content.json": organizationProfileContent,
  "data/organization-intelligence.json": organizationIntelligence,
  "data/organization-relations.json": organizationRelations,
  "data/role-mapping.json": roleMapping,
  "data/release-manifest.json": releaseManifest,
  "public/organization-universe.json": organizationUniverseAsset,
};

for (const [path, value] of Object.entries(publicOrganizationSources)) {
  const serialized = JSON.stringify(value);
  assert.doesNotMatch(
    serialized,
    privateCandidateFingerprintPattern,
    `${path} contains a private candidate fingerprint`,
  );
  assert.doesNotMatch(
    serialized,
    privateStructuredTimelinePattern,
    `${path} contains a private candidate timeline`,
  );
  assert.doesNotMatch(
    serialized,
    firstSemesterAuthorizationPattern,
    `${path} combines a private enrollment timeline with work authorization`,
  );
}

for (const [filename, content] of Object.entries(publicResearchCorpus)) {
  assert.doesNotMatch(
    content,
    privateCandidateFingerprintPattern,
    `research/${filename} contains a private candidate fingerprint`,
  );
  assert.doesNotMatch(
    content,
    firstSemesterAuthorizationPattern,
    `research/${filename} combines a private enrollment timeline with work authorization`,
  );
}

for (const [filename, content] of Object.entries(publicDataSourceCorpus)) {
  assert.doesNotMatch(
    content,
    privateCandidateFingerprintPattern,
    `data/${filename} contains a private candidate fingerprint`,
  );
  assert.doesNotMatch(
    content,
    privateStructuredTimelinePattern,
    `data/${filename} contains a private candidate timeline`,
  );
  assert.doesNotMatch(
    content,
    firstSemesterAuthorizationPattern,
    `data/${filename} combines a private enrollment timeline with work authorization`,
  );
}

for (const [filename, content] of Object.entries({
  "README.md": publicReadme,
  ...Object.fromEntries(
    Object.entries(publicAppSourceCorpus).map(([path, value]) => [
      `app/${path}`,
      value,
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(publicSharedSourceCorpus).map(([path, value]) => [
      `shared/${path}`,
      value,
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(publicTestSourceCorpus).map(([path, value]) => [
      `tests/${path}`,
      value,
    ]),
  ),
})) {
  const privacyScannableContent = filename.startsWith("tests/")
    ? content.replace(/\/(?:\\.|[^/\n])+\/[dgimsuvy]*/g, "")
    : content;
  assert.doesNotMatch(
    privacyScannableContent,
    privateCandidateFingerprintPattern,
    `${filename} contains a private candidate fingerprint`,
  );
  assert.doesNotMatch(
    privacyScannableContent,
    privateStructuredTimelinePattern,
    `${filename} contains a private candidate timeline`,
  );
  assert.doesNotMatch(
    privacyScannableContent,
    firstSemesterAuthorizationPattern,
    `${filename} combines a private enrollment timeline with work authorization`,
  );
}

for (const [filename, content] of Object.entries(publicQuestionAssetCorpus)) {
  assert.doesNotMatch(
    content,
    privateCandidateFingerprintPattern,
    `public/question-bank/${filename} contains a private candidate fingerprint`,
  );
  assert.doesNotMatch(
    content,
    firstSemesterAuthorizationPattern,
    `public/question-bank/${filename} combines a private enrollment timeline with work authorization`,
  );
}

for (const [path, value] of Object.entries({
  "data/companies.us.json": usBaseRaw,
  "data/expansion-us-candidates.json": usExpansionRaw,
  "data/companies.cn.json": cnBaseRaw,
  "data/expansion-cn-candidates.json": cnExpansionRaw,
  "data/organization-profile-content.json": organizationProfileContent,
  "public/organization-universe.json": organizationUniverseAsset,
})) {
  assert.doesNotMatch(
    JSON.stringify(value),
    candidateAuthorizationPattern,
    `${path} contains candidate-specific work-authorization prose`,
  );
}

const usBaseCompanies = recordsOf(
  usBaseRaw,
  "companies",
  "data/companies.us.json",
);
const usExpansionCompanies = recordsOf(
  usExpansionRaw,
  "companies",
  "data/expansion-us-candidates.json",
);
const cnBaseCompanies = recordsOf(
  cnBaseRaw,
  "companies",
  "data/companies.cn.json",
);
const cnExpansionCompanies = recordsOf(
  cnExpansionRaw,
  "companies",
  "data/expansion-cn-candidates.json",
);
const usCompanies = [...usBaseCompanies, ...usExpansionCompanies];
const cnCompanies = [...cnBaseCompanies, ...cnExpansionCompanies];
const roles = recordsOf(rolesRaw, "roleFamilies", "data/role-families.json");
const skills = recordsOf(skillsRaw, "skills", "data/skill-graph.json");
const questions = recordsOf(
  questionsRaw,
  "questions",
  "data/questions.seed.json",
);
assert.equal(
  questionsRaw.status,
  "bilingual-review-ready-v3",
  "question bank root status must remain bilingual-review-ready-v3",
);
assert.deepEqual(
  [...new Set(questions.map((question) => question.contentVersion))],
  ["2026-07-23.5"],
  "all questions must share the reviewed 2026-07-23.5 content version",
);
const skillTranslationCatalog = await readSkillTranslationCatalog();
const questionTranslationCatalog = await readQuestionTranslationCatalog();
const oracleTranslationCatalog = await readOracleTranslationCatalog();
const oracleSpecCatalog = await readOracleSpecCatalog();
const editorialOverrideFile = await readJson(
  "data/question-editorial-overrides.json",
);
const skillFocusOverrideFile = await readJson(
  "data/question-skill-focus-overrides.json",
);
const editorialOverrides = editorialOverrideFile.questions;
const skillFocusOverrideRecords = recordsOf(
  skillFocusOverrideFile,
  "overrides",
  "data/question-skill-focus-overrides.json",
);

const minimums = [
  [
    usCompanies,
    releaseManifest.organizations.regionCounts.US,
    "US company and institution nodes",
  ],
  [
    cnCompanies,
    releaseManifest.organizations.regionCounts.CN,
    "China company and institution nodes",
  ],
  [roles, releaseManifest.roleFamilies, "role families"],
  [skills, releaseManifest.skills.nodes, "atomic skills"],
  [
    questions,
    releaseManifest.questions.total,
    "bilingual interview training tasks",
  ],
];

for (const [records, minimum, label] of minimums) {
  assert.ok(
    records.length >= minimum,
    `${label}: found ${records.length}; expected at least ${minimum}`,
  );
}

for (const [records, path] of [
  [usBaseCompanies, "data/companies.us.json"],
  [usExpansionCompanies, "data/expansion-us-candidates.json"],
  [cnBaseCompanies, "data/companies.cn.json"],
  [cnExpansionCompanies, "data/expansion-cn-candidates.json"],
  [roles, "data/role-families.json"],
  [skills, "data/skill-graph.json"],
  [questions, "data/questions.seed.json"],
]) {
  assertUniqueIds(records, path);
}

const companies = [...usCompanies, ...cnCompanies];
const companyIdSet = new Set(companies.map((company) => company.id));
assert.equal(
  companyIdSet.size,
  companies.length,
  "company ids must also be unique across regions",
);
const canonicalRoleEdgeCount = companies.reduce(
  (total, company) =>
    total + mappedRoleFamilyIds(company, roleMapping.rules).length,
  0,
);
assert.equal(
  canonicalRoleEdgeCount,
  releaseManifest.organizations.canonicalRoleEdges,
  "canonical organization-to-role edge count changed",
);
assert.equal(
  chinaCompanyOwnership.schemaVersion,
  "1.0.0",
  "China company ownership schemaVersion changed without an audit update",
);
assert.ok(
  chinaCompanyOwnership.scope?.policyZh &&
    chinaCompanyOwnership.scope?.policyEn,
  "China company ownership policy must remain bilingual",
);
const chinaCompanyIds = cnCompanies
  .filter((company) => company.companyType === "company")
  .map((company) => company.id)
  .sort();
const ownershipRecords = chinaCompanyOwnership.records;
const ownershipRecordIds = ownershipRecords
  .map((record) => record.organizationId)
  .sort();
assert.equal(
  new Set(ownershipRecordIds).size,
  ownershipRecordIds.length,
  "China ownership organization IDs must be unique",
);
assert.deepEqual(
  ownershipRecordIds,
  chinaCompanyIds,
  "China ownership records must exactly cover every CN company node",
);
assert.equal(
  ownershipRecords.length,
  releaseManifest.organizations.chinaCompanyOwnershipRecords,
  "China ownership record count changed",
);
const ownershipClassIds = new Set(
  chinaCompanyOwnership.recordSchema.properties.ownershipClass.enum,
);
assert.deepEqual(
  Object.keys(chinaCompanyOwnership.ownershipClasses).sort(),
  [...ownershipClassIds].sort(),
  "ownership class definitions must exactly match the record schema",
);
for (const [classId, definition] of Object.entries(
  chinaCompanyOwnership.ownershipClasses,
)) {
  assert.ok(
    hasChinese(definition.zh) &&
      hasChinese(definition.definitionZh) &&
      /[A-Za-z]/.test(definition.en) &&
      /[A-Za-z]/.test(definition.definitionEn),
    `ownership class ${classId} needs bilingual labels and definitions`,
  );
}
for (const record of ownershipRecords) {
  assert.ok(
    ownershipClassIds.has(record.ownershipClass),
    `ownership record ${record.organizationId} has an unknown class`,
  );
  assert.ok(
    typeof record.nameZh === "string" &&
      record.nameZh.trim() &&
      /[A-Za-z]/.test(record.nameEn) &&
      hasChinese(record.summaryZh) &&
      /[A-Za-z]/.test(record.summaryEn),
    `ownership record ${record.organizationId} needs bilingual identity and summary fields`,
  );
  assert.ok(
    ["high", "medium", "low"].includes(record.confidence),
    `ownership record ${record.organizationId} has invalid confidence`,
  );
  assert.ok(
    nonEmptyArray(record.evidence) &&
      record.evidence.every(
        (evidence) =>
          /^https?:\/\//.test(evidence.url) &&
          hasChinese(evidence.titleZh) &&
          /[A-Za-z]/.test(evidence.titleEn) &&
          hasChinese(evidence.noteZh) &&
          /[A-Za-z]/.test(evidence.noteEn),
      ),
    `ownership record ${record.organizationId} needs bilingual, traceable evidence`,
  );
  if (record.sourceOwnershipTag === null) {
    assert.equal(
      record.ownershipClass,
      "mixed-or-unknown",
      `ownership record ${record.organizationId} infers ownership without an explicit tag`,
    );
    assert.equal(record.confidence, "low");
    assert.equal(
      record.classificationBasis,
      "insufficient-direct-control-evidence",
    );
    assert.equal(record.reviewStatus, "needs-direct-control-source");
  }
}
const ownershipClassCounts = Object.fromEntries(
  [...ownershipClassIds].map((classId) => [
    classId,
    ownershipRecords.filter((record) => record.ownershipClass === classId)
      .length,
  ]),
);
const ownershipReviewStatusCounts = Object.fromEntries(
  ["provisionally-audited", "needs-direct-control-source"].map((status) => [
    status,
    ownershipRecords.filter((record) => record.reviewStatus === status).length,
  ]),
);
const ownershipEvidenceScopeCounts = Object.fromEntries(
  ["direct-ownership-registry", "organization-record-context"].map(
    (evidenceScope) => [
      evidenceScope,
      ownershipRecords.reduce(
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
  ownershipClassCounts,
  chinaCompanyOwnership.statistics.ownershipClassCounts,
  "China ownership class statistics are stale",
);
assert.deepEqual(
  ownershipReviewStatusCounts,
  chinaCompanyOwnership.statistics.reviewStatusCounts,
  "China ownership review-status statistics are stale",
);
assert.deepEqual(
  ownershipEvidenceScopeCounts,
  chinaCompanyOwnership.statistics.evidenceScopeCounts,
  "China ownership evidence-scope statistics are stale",
);
assert.equal(
  Object.values(ownershipEvidenceScopeCounts).reduce(
    (sum, count) => sum + count,
    0,
  ),
  chinaCompanyOwnership.statistics.evidenceEntries,
  "China ownership evidence-scope counts do not cover every evidence entry",
);
assert.equal(
  ownershipReviewStatusCounts["provisionally-audited"],
  releaseManifest.organizations.provisionallyAuditedOwnershipRecords,
);
assert.equal(
  ownershipReviewStatusCounts["needs-direct-control-source"],
  releaseManifest.organizations.ownershipNeedsDirectSource,
);
assert.equal(
  organizationRelations.length,
  releaseManifest.organizationRelations,
  "organization-relation count changed",
);
assertUniqueIds(organizationRelations, "data/organization-relations.json");
for (const relation of organizationRelations) {
  assert.ok(
    companyIdSet.has(relation.fromOrganizationId) &&
      companyIdSet.has(relation.toOrganizationId),
    `organization relation ${relation.id} references an unknown node`,
  );
  assert.notEqual(
    relation.fromOrganizationId,
    relation.toOrganizationId,
    `organization relation ${relation.id} is self-referential`,
  );
  assert.ok(
    hasChinese(relation.summaryZh) && /[A-Za-z]/.test(relation.summaryEn),
    `organization relation ${relation.id} needs bilingual summaries`,
  );
  assert.ok(
    nonEmptyArray(relation.officialEvidence),
    `organization relation ${relation.id} needs first-party evidence`,
  );
}

assert.equal(
  organizationLabels.schemaVersion,
  "1.0.0",
  "organization label schemaVersion changed without an audit update",
);
assert.ok(
  organizationLabels.policy?.zh && organizationLabels.policy?.en,
  "organization label policy must be bilingual",
);
assert.deepEqual(
  Object.keys(organizationLabels.regionGroups).sort(),
  ["CN", "Global", "US"],
  "opportunity-market roots need exact bilingual labels",
);
for (const [market, label] of Object.entries(organizationLabels.regionGroups)) {
  assert.ok(
    hasChinese(label.zh) && /[A-Za-z]/.test(label.en),
    `opportunity-market label ${market} is not bilingual`,
  );
}

const companyTypeIds = [
  ...new Set(companies.map((company) => company.companyType)),
].sort();
const combinedCompanyTypeLabels = {
  ...organizationLabels.companyTypes,
  ...expansionCnCompanyTypeLabels,
};
const hanPattern = /[\u3400-\u9fff]/;
const latinPattern = /[A-Za-z]/;
assert.deepEqual(
  Object.keys(combinedCompanyTypeLabels).sort(),
  companyTypeIds,
  "organization-type labels must cover the exact live taxonomy",
);
for (const [companyType, label] of Object.entries(combinedCompanyTypeLabels)) {
  assert.ok(
    hasChinese(label.zh) && /[A-Za-z]/.test(label.en),
    `organization-type label ${companyType} is not bilingual`,
  );
}

assert.equal(
  categoryLabelsEn.schemaVersion,
  "1.0.0",
  "English-origin organization-category label schemaVersion changed",
);
assert.equal(
  categoryLabelsZh.schemaVersion,
  "1.0.0",
  "Chinese-origin organization-category label schemaVersion changed",
);
const categoryLabelKeysEn = Object.keys(categoryLabelsEn.labels);
const categoryLabelKeysZh = Object.keys(categoryLabelsZh.labels);
const categoryLabelKeysUsExpansion = Object.keys(expansionUsCategoryLabels);
const categoryLabelKeysCnExpansion = Object.keys(expansionCnCategoryLabels);
assert.equal(
  new Set([
    ...categoryLabelKeysEn,
    ...categoryLabelKeysZh,
    ...categoryLabelKeysUsExpansion,
    ...categoryLabelKeysCnExpansion,
  ]).size,
  categoryLabelKeysEn.length +
    categoryLabelKeysZh.length +
    categoryLabelKeysUsExpansion.length +
    categoryLabelKeysCnExpansion.length,
  "organization-category label catalogs overlap",
);
const liveCategoryIds = [
  ...new Set(companies.flatMap((company) => company.categories)),
].sort();
assert.deepEqual(
  [
    ...categoryLabelKeysEn,
    ...categoryLabelKeysZh,
    ...categoryLabelKeysUsExpansion,
    ...categoryLabelKeysCnExpansion,
  ].sort(),
  liveCategoryIds,
  "bilingual organization-category labels must cover the exact live taxonomy",
);
assert.equal(
  categoryLabelKeysEn.length,
  184,
  "reviewed English-origin category-label coverage changed",
);
assert.equal(
  categoryLabelKeysZh.length,
  149,
  "reviewed Chinese-origin category-label coverage changed",
);
for (const [category, label] of Object.entries({
  ...categoryLabelsEn.labels,
  ...categoryLabelsZh.labels,
  ...expansionUsCategoryLabels,
  ...expansionCnCategoryLabels,
})) {
  assert.ok(
    typeof label.en === "string" &&
      latinPattern.test(label.en) &&
      !hanPattern.test(label.en),
    `organization-category ${category} needs a clean English label`,
  );
  assert.ok(
    typeof label.zh === "string" && hasChinese(label.zh),
    `organization-category ${category} needs a Chinese label`,
  );
}
const combinedCategoryLabels = {
  ...categoryLabelsEn.labels,
  ...categoryLabelsZh.labels,
  ...expansionUsCategoryLabels,
  ...expansionCnCategoryLabels,
};
const canonicalCategoryGroups = new Map();
const categoryEnglishByChinese = new Map();
for (const category of liveCategoryIds) {
  const canonicalId = combinedCategoryLabels[category].en
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\-–—_/（）()，,：:·.]/g, "");
  const group = canonicalCategoryGroups.get(canonicalId) || [];
  group.push(category);
  canonicalCategoryGroups.set(canonicalId, group);
  const englishLabels =
    categoryEnglishByChinese.get(combinedCategoryLabels[category].zh) || [];
  englishLabels.push(combinedCategoryLabels[category].en);
  categoryEnglishByChinese.set(
    combinedCategoryLabels[category].zh,
    englishLabels,
  );
}
const mergedCategoryAliasGroups = [...canonicalCategoryGroups.values()].filter(
  (group) => group.length > 1,
);
const atomicCategoryGroups = new Map();
for (const category of liveCategoryIds) {
  const terms = organizationIntelligence.categoryAtomOverrides[category] || [
    combinedCategoryLabels[category],
  ];
  for (const term of terms) {
    const canonicalId = term.en
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[\s\-–—_/（）()，,：:·.]/g, "");
    const group = atomicCategoryGroups.get(canonicalId) || new Set();
    group.add(category);
    atomicCategoryGroups.set(canonicalId, group);
  }
}
const mergedAtomicCategoryAliasGroups = [
  ...atomicCategoryGroups.values(),
].filter((group) => group.size > 1);
assert.equal(
  canonicalCategoryGroups.size,
  releaseManifest.organizations.canonicalCategoryGroups,
  "reviewed canonical industry-category count changed",
);
assert.equal(
  mergedCategoryAliasGroups.length,
  releaseManifest.organizations.categoryAliasGroups,
  "reviewed cross-market category-alias groups changed",
);
assert.equal(
  atomicCategoryGroups.size,
  releaseManifest.organizations.atomicCategoryFilters,
  "reviewed atomic industry-filter count changed",
);
assert.equal(
  mergedAtomicCategoryAliasGroups.length,
  releaseManifest.organizations.atomicCategoryAliasGroups,
  "reviewed atomic cross-market category-alias groups changed",
);
assert.deepEqual(
  [...categoryEnglishByChinese.entries()]
    .filter(([, labels]) => new Set(labels).size > 1)
    .map(([label]) => label),
  [],
  "one Chinese category label must not silently represent different English concepts",
);
assert.deepEqual(
  canonicalCategoryGroups.get("advancedpackaging")?.sort(),
  ["advanced-packaging", "先进封装"].sort(),
  "advanced packaging aliases must share one filter option",
);

const usCompanyIds = usBaseCompanies.map((company) => company.id).sort();
assert.deepEqual(
  Object.keys(organizationLabels.companyNameZh).sort(),
  usCompanyIds,
  "every US-first organization must explicitly choose a Chinese name or English-only status",
);
const companyIds = new Set(companies.map((company) => company.id));
for (const id of Object.keys(organizationLabels.companyNameEn)) {
  assert.ok(
    companyIds.has(id),
    `unknown English organization-name override ${id}`,
  );
}

let bilingualOrganizationCount = 0;
let englishOnlyOrganizationCount = 0;
const resolvedOrganizationNamesEn = [];
const resolvedOrganizationNamesZh = [];
for (const company of companies) {
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
  assert.ok(
    typeof nameEn === "string" &&
      nameEn.trim() &&
      latinPattern.test(nameEn) &&
      !hanPattern.test(nameEn),
    `company ${company.id} needs an explicit English organization name`,
  );
  resolvedOrganizationNamesEn.push(nameEn.trim().toLowerCase());
  if (nameZh && nameZh !== nameEn) {
    assert.ok(
      hanPattern.test(nameZh),
      `company ${company.id} has an unusable Chinese organization name`,
    );
    assert.notEqual(
      nameZh.trim().toLowerCase(),
      nameEn.trim().toLowerCase(),
      `company ${company.id} repeats the same organization name twice`,
    );
    resolvedOrganizationNamesZh.push(nameZh.trim().toLowerCase());
    bilingualOrganizationCount += 1;
  } else {
    assert.ok(
      !sourceNameIsChinese,
      `company ${company.id} silently degraded to a Chinese-only label`,
    );
    englishOnlyOrganizationCount += 1;
  }
}
assert.equal(
  bilingualOrganizationCount,
  releaseManifest.organizations.bilingualNames,
  "reviewed bilingual organization-name coverage changed",
);
assert.equal(
  englishOnlyOrganizationCount,
  releaseManifest.organizations.englishOnlyNames,
  "reviewed English-only organization-name decisions changed",
);
assert.equal(
  new Set(resolvedOrganizationNamesEn).size,
  resolvedOrganizationNamesEn.length,
  "canonical English organization names must be unique",
);
assert.equal(
  new Set(resolvedOrganizationNamesZh).size,
  resolvedOrganizationNamesZh.length,
  "canonical Chinese organization names must be unique",
);

assert.equal(
  organizationProfileContent.schemaVersion,
  "1.0.0",
  "organization profile-content schemaVersion changed without an audit update",
);
assert.ok(
  organizationProfileContent.policy?.zh &&
    organizationProfileContent.policy?.en,
  "organization profile-content policy must be bilingual",
);
const baseCompanyIds = [...usBaseCompanies, ...cnBaseCompanies]
  .map((company) => company.id)
  .sort();
assert.deepEqual(
  Object.keys(organizationProfileContent.profiles).sort(),
  baseCompanyIds,
  "reviewed organization profiles must cover every base organization exactly",
);
for (const [companyId, content] of Object.entries(
  organizationProfileContent.profiles,
)) {
  for (const field of [
    "descriptionZh",
    "descriptionEn",
    "relevanceZh",
    "relevanceEn",
  ]) {
    assert.ok(
      typeof content[field] === "string" && content[field].trim(),
      `organization profile ${companyId}.${field} is empty`,
    );
  }
  assert.ok(
    hasChinese(content.descriptionZh) && hasChinese(content.relevanceZh),
    `organization profile ${companyId} needs usable Chinese content`,
  );
  assert.ok(
    latinPattern.test(content.descriptionEn) &&
      latinPattern.test(content.relevanceEn),
    `organization profile ${companyId} needs usable English content`,
  );
}
for (const company of [...usExpansionCompanies, ...cnExpansionCompanies]) {
  for (const field of [
    "descriptionZh",
    "descriptionEn",
    "relevanceZh",
    "relevanceEn",
  ]) {
    assert.ok(
      typeof company[field] === "string" && company[field].trim(),
      `expanded organization ${company.id}.${field} is empty`,
    );
  }
  assert.ok(
    hasChinese(company.descriptionZh) && hasChinese(company.relevanceZh),
    `expanded organization ${company.id} needs usable Chinese content`,
  );
  assert.ok(
    latinPattern.test(company.descriptionEn) &&
      latinPattern.test(company.relevanceEn),
    `expanded organization ${company.id} needs usable English content`,
  );
}

assert.equal(
  rolePresentation.schemaVersion,
  "1.0.0",
  "role-presentation schemaVersion changed without an audit update",
);
const rolePresentationIds = Object.keys(rolePresentation.roles).sort();
const reviewedRoleIds = roles.map((role) => role.id).sort();
assert.deepEqual(
  rolePresentationIds,
  reviewedRoleIds,
  "role presentation must cover every role family exactly",
);
const englishVisibleCompoundPattern = /\s+(?:and|&)\s+|[/／]/i;
const chineseVisibleCompoundPattern = /[、与及和/／]/;
for (const [roleId, presentation] of Object.entries(rolePresentation.roles)) {
  assert.ok(
    hasChinese(presentation.descriptionZh) &&
      latinPattern.test(presentation.descriptionEn),
    `role presentation ${roleId} needs bilingual descriptions`,
  );
  for (const [field, terms] of [
    ["typicalTitleAtoms", presentation.typicalTitleAtoms],
    ["interviewStageAtoms", presentation.interviewStageAtoms],
  ]) {
    assert.ok(
      nonEmptyArray(terms),
      `role presentation ${roleId}.${field} is empty`,
    );
    for (const [index, term] of terms.entries()) {
      assert.ok(
        term.id &&
          typeof term.zh === "string" &&
          term.zh.trim() &&
          latinPattern.test(term.en),
        `role presentation ${roleId}.${field}[${index}] is not bilingual`,
      );
      if (!hasChinese(term.zh, 1)) {
        assert.match(
          term.zh,
          /^(?:SystemVerilog|UVM|ATPG|MBIST|JTAG|SPC)$/,
          `role presentation ${roleId}.${field}[${index}].zh needs Chinese or an approved international technical name`,
        );
      }
      assert.doesNotMatch(
        term.en,
        englishVisibleCompoundPattern,
        `role presentation ${roleId}.${field}[${index}].en is compound`,
      );
      assert.doesNotMatch(
        term.zh,
        chineseVisibleCompoundPattern,
        `role presentation ${roleId}.${field}[${index}].zh is compound`,
      );
    }
  }
}

assert.equal(
  skillPresentation.schemaVersion,
  "1.0.0",
  "skill-presentation schemaVersion changed without an audit update",
);
assert.deepEqual(
  Object.keys(skillPresentation.skills).sort(),
  skills.map((skill) => skill.id).sort(),
  "skill presentation must cover every skill node exactly",
);
let atomicSkillDisplayTermCount = 0;
for (const [skillId, presentation] of Object.entries(
  skillPresentation.skills,
)) {
  assert.ok(
    nonEmptyArray(presentation.displayTerms),
    `skill presentation ${skillId}.displayTerms is empty`,
  );
  atomicSkillDisplayTermCount += presentation.displayTerms.length;
  for (const [index, term] of presentation.displayTerms.entries()) {
    assert.ok(
      term.id &&
        typeof term.zh === "string" &&
        term.zh.trim() &&
        typeof term.en === "string" &&
        latinPattern.test(term.en),
      `skill presentation ${skillId}.displayTerms[${index}] is not bilingual`,
    );
    assert.doesNotMatch(
      term.en,
      englishVisibleCompoundPattern,
      `skill presentation ${skillId}.displayTerms[${index}].en is compound`,
    );
    assert.doesNotMatch(
      term.zh,
      chineseVisibleCompoundPattern,
      `skill presentation ${skillId}.displayTerms[${index}].zh is compound`,
    );
  }
}
assert.equal(
  atomicSkillDisplayTermCount,
  releaseManifest.skills.displayTerms,
  "reviewed atomic skill display-term count changed",
);

for (const company of companies) {
  const context = `company ${company.id}`;
  assert.ok(company.name, `${context} has no name`);
  assert.ok(company.country, `${context} has no country`);
  assert.ok(company.companyType, `${context} has no companyType`);
  assert.ok(nonEmptyArray(company.categories), `${context} has no categories`);
  assert.ok(nonEmptyArray(company.focusAreas), `${context} has no focusAreas`);
  assert.ok(
    nonEmptyArray(company.roleFamilies),
    `${context} has no roleFamilies`,
  );
  assert.ok(company.whyRelevant, `${context} has no relevance rationale`);
  assert.ok(
    nonEmptyArray(company.requirements),
    `${context} has no requirements`,
  );
  assert.ok(
    nonEmptyArray(company.gaps),
    `${context} has no candidate-gap analysis`,
  );
  assert.ok(
    nonEmptyArray(company.opportunityTypes),
    `${context} has no opportunityTypes`,
  );
  assertUrl(company.careerUrl, `${context} careerUrl`);
  assert.ok(nonEmptyArray(company.evidence), `${context} has no evidence`);
  for (const [index, evidence] of company.evidence.entries()) {
    assert.ok(evidence.title, `${context} evidence ${index} has no title`);
    assertUrl(evidence.url, `${context} evidence ${index}`);
    assert.match(
      evidence.observedAt || "",
      /^\d{4}-\d{2}-\d{2}$/,
      `${context} evidence ${index} has an invalid observedAt date`,
    );
  }
  assert.match(
    company.lastVerified || "",
    /^\d{4}-\d{2}-\d{2}$/,
    `${context} has an invalid lastVerified date`,
  );
}

const roleIds = new Set(roles.map((role) => role.id));
const skillIds = new Set(skills.map((skill) => skill.id));
const skillById = new Map(skills.map((skill) => [skill.id, skill]));
assert.ok(
  editorialOverrides &&
    typeof editorialOverrides === "object" &&
    !Array.isArray(editorialOverrides),
  "data/question-editorial-overrides.json must expose a questions object",
);
assert.equal(
  editorialOverrideFile.schemaVersion,
  "1.0.0",
  "editorial override schemaVersion changed without an audit update",
);
assert.equal(
  skillFocusOverrideFile.schemaVersion,
  "1.0.0",
  "skill-focus override schemaVersion changed without an audit update",
);
function skillFocusKey(roleId, baseQuestionId, archetype) {
  return `${roleId}|${baseQuestionId}|${archetype}`;
}
const skillFocusOverrideByKey = new Map();
for (const override of skillFocusOverrideRecords) {
  const key = skillFocusKey(
    override.roleId,
    override.baseQuestionId,
    override.archetype,
  );
  assert.ok(!skillFocusOverrideByKey.has(key), `duplicate skill focus ${key}`);
  assert.ok(roleIds.has(override.roleId), `${key} references a missing role`);
  assert.ok(
    skillIds.has(override.skillId),
    `${key} references a missing skill`,
  );
  assert.ok(
    typeof override.focusEn === "string" && override.focusEn.length >= 30,
    `${key}.focusEn is too shallow`,
  );
  assert.ok(
    typeof override.focusZh === "string" &&
      override.focusZh.length >= 18 &&
      hasChinese(override.focusZh, 8),
    `${key}.focusZh is not usable Chinese`,
  );
  skillFocusOverrideByKey.set(key, override);
}
const questionLevelRank = {
  foundation: 0,
  entry: 1,
  intermediate: 2,
  advanced: 3,
};
const skillLevelQuestionFloor = {
  foundation: "foundation",
  intermediate: "intermediate",
  advanced: "advanced",
};
const contractImplementationInstructionEn =
  /(?:^|[.!?]\s+|[;:]\s+|,\s+)(?!(?:do not|don't|never|without)\b)(?:please\s+)?(?:implement|create|write(?:\s+or\s+precisely\s+describe)?|code|build|develop|design)\b/i;
const contractImplementationInstructionZh =
  /(?:^|[。！？；：，])(?!(?:不要|不得|无需|避免|省略))(?:(?:请|需要|应当|必须)\s*)?(?:为[^。！？；：，]{0,80})?(?:实现|创建|编写|写出|设计|开发)/;
function contractInstructionTextEn(prompt = "") {
  const sourceMarker = " Source scenario (reference-only quotation;";
  const sourceIndex = prompt.indexOf(sourceMarker);
  if (sourceIndex < 0) return prompt;
  const policyIndex = prompt.lastIndexOf(" Use public concepts only;");
  return `${prompt.slice(0, sourceIndex)}${
    policyIndex > sourceIndex ? prompt.slice(policyIndex) : ""
  }`;
}
function contractInstructionTextZh(prompt = "") {
  const sourceMarker = "原始场景（仅作参考引文；";
  const sourceIndex = prompt.indexOf(sourceMarker);
  if (sourceIndex < 0) return prompt;
  const policyIndex = prompt.lastIndexOf("只使用公开概念");
  return `${prompt.slice(0, sourceIndex)}${
    policyIndex > sourceIndex ? prompt.slice(policyIndex) : ""
  }`;
}
function scenarioSourceForAudit(prompt = "") {
  return prompt
    .replace(
      /\s*State all assumptions that materially affect correctness;.*$/s,
      "",
    )
    .replace(/\s*Keep the example truthful;.*$/s, "")
    .trim();
}
function scenarioSourceZhForAudit(prompt = "") {
  return prompt.trim();
}
assert.deepEqual(
  new Set(Object.keys(skillTranslationCatalog)),
  skillIds,
  "skill translation catalog must cover exactly the canonical skill graph",
);
const curatedAnchors = questions.filter(
  (question) => question.generationSpec?.origin === "curated-v1",
);
const curatedAnchorById = new Map(
  curatedAnchors.map((question) => [question.id, question]),
);
assert.equal(
  Object.keys(questionTranslationCatalog).length,
  210,
  "question translation catalog must contain exactly 210 anchors",
);
assert.deepEqual(
  new Set(Object.keys(questionTranslationCatalog)),
  new Set(curatedAnchorById.keys()),
  "question translation catalog must cover exactly the 210 curated anchors",
);
const legacyGenericOutlinePatternsZh = [
  /^定义“.+”的对象、输入输出、单位与成功标准[。]?$/,
  /^运用.+建立最小正确模型，并列出关键不变量[。]?$/,
  /^推演正常、边界和失败路径，区分观测事实与原因推断[。]?$/,
  /^使用独立方法验证结果，并记录残余风险与下一项检查[。]?$/,
];
const legacyGenericOutlineViolations = [];
for (const [questionId, translation] of Object.entries(
  questionTranslationCatalog,
)) {
  const anchor = curatedAnchorById.get(questionId);
  assert.ok(
    Array.isArray(translation.referenceOutlineZh),
    `translation ${questionId}.referenceOutlineZh must be an explicit item-by-item array`,
  );
  assert.equal(
    translation.referenceOutlineZh.length,
    anchor.referenceOutline.length,
    `translation ${questionId}.referenceOutlineZh must align item-by-item with referenceOutline`,
  );
  for (const [index, item] of translation.referenceOutlineZh.entries()) {
    assert.ok(
      typeof item === "string" && item.length >= 4 && hasChinese(item, 2),
      `translation ${questionId}.referenceOutlineZh[${index}] is not usable Chinese`,
    );
    if (
      legacyGenericOutlinePatternsZh.some((pattern) =>
        pattern.test(item.trim()),
      )
    ) {
      legacyGenericOutlineViolations.push(
        `${questionId}.referenceOutlineZh[${index}]`,
      );
    }
  }
  assert.deepEqual(
    anchor.referenceOutlineZh,
    translation.referenceOutlineZh,
    `curated anchor ${questionId} does not use its reviewed item-by-item referenceOutlineZh`,
  );
}
assert.equal(
  legacyGenericOutlineViolations.length,
  0,
  [
    "reviewed referenceOutlineZh entries must not use the legacy generic fallback template",
    ...legacyGenericOutlineViolations.slice(0, 30).map((path) => `  - ${path}`),
    legacyGenericOutlineViolations.length > 30
      ? `  - ... ${legacyGenericOutlineViolations.length - 30} additional fallback items`
      : null,
  ]
    .filter(Boolean)
    .join("\n"),
);
assert.deepEqual(
  new Set(Object.keys(oracleSpecCatalog)),
  new Set(curatedAnchorById.keys()),
  "task-specific oracle specs must cover exactly the 210 curated anchors",
);
for (const [questionId, spec] of Object.entries(oracleSpecCatalog)) {
  assert.deepEqual(
    curatedAnchorById.get(questionId)?.oracle,
    spec.oracle,
    `curated anchor ${questionId} does not use its task-specific English oracle`,
  );
  assert.deepEqual(
    curatedAnchorById.get(questionId)?.oracleZh,
    spec.oracleZh,
    `curated anchor ${questionId} does not use its task-specific Chinese oracle`,
  );
}
assert.equal(
  new Set(
    curatedAnchors.map((question) => normalizeText(question.oracle.procedure)),
  ).size,
  curatedAnchors.length,
  "curated English oracle procedures must be task-specific and unique",
);
assert.equal(
  new Set(
    curatedAnchors.map((question) => normalizeText(question.oracle.acceptance)),
  ).size,
  curatedAnchors.length,
  "curated English oracle acceptance criteria must be task-specific and unique",
);
assert.equal(
  new Set(
    curatedAnchors.map((question) =>
      normalizeText(question.oracleZh.procedure),
    ),
  ).size,
  curatedAnchors.length,
  "curated Chinese oracle procedures must be task-specific and unique",
);
assert.equal(
  new Set(
    curatedAnchors.map((question) =>
      normalizeText(question.oracleZh.acceptance),
    ),
  ).size,
  curatedAnchors.length,
  "curated Chinese oracle acceptance criteria must be task-specific and unique",
);
for (const [questionId, legacyOracleZh] of Object.entries(
  oracleTranslationCatalog,
)) {
  assert.deepEqual(
    oracleSpecCatalog[questionId]?.oracleZh,
    legacyOracleZh,
    `full oracle spec ${questionId} diverges from the frozen exact Chinese oracle`,
  );
}
for (const [key, override] of skillFocusOverrideByKey) {
  const baseAnchor = curatedAnchorById.get(override.baseQuestionId);
  assert.ok(
    baseAnchor,
    `skill-focus override ${key} references a missing base`,
  );
  assert.ok(
    baseAnchor.roleFamilies.includes(override.roleId),
    `skill-focus override ${key} does not match its base anchor role`,
  );
  assert.ok(
    skillById.get(override.skillId).roleFamilies.includes(override.roleId),
    `skill-focus override ${key} targets a skill not declared for its role`,
  );
}

const allowedEditorialOverrideFields = new Set([
  "prompt",
  "promptZh",
  "appendPrompt",
  "appendPromptZh",
]);
let appliedEditorialOverrideCount = 0;
for (const [questionId, override] of Object.entries(editorialOverrides)) {
  const anchor = curatedAnchorById.get(questionId);
  assert.ok(anchor, `editorial override ${questionId} has no curated anchor`);
  assert.ok(
    override && typeof override === "object" && !Array.isArray(override),
    `editorial override ${questionId} must be an object`,
  );
  const fields = Object.keys(override);
  assert.ok(fields.length > 0, `editorial override ${questionId} is empty`);
  for (const field of fields) {
    assert.ok(
      allowedEditorialOverrideFields.has(field),
      `editorial override ${questionId}.${field} is unsupported`,
    );
    const value = override[field];
    assert.ok(
      typeof value === "string" && value.trim().length >= 5,
      `editorial override ${questionId}.${field} is empty`,
    );
    const targetField = field.endsWith("Zh") ? "promptZh" : "prompt";
    if (field.startsWith("append")) {
      assert.ok(
        anchor[targetField].includes(value.trim()),
        `editorial override ${questionId}.${field} was not applied to ${targetField}`,
      );
    } else {
      assert.equal(
        anchor[targetField],
        value.trim(),
        `editorial override ${questionId}.${field} was not applied exactly`,
      );
    }
  }
  appliedEditorialOverrideCount += 1;
}

const softPolicyAnchorIds = new Set([
  "q-beh-failure-ownership",
  "q-beh-technical-conflict",
  "q-beh-ambiguous-task",
  "q-beh-priority-tradeoff",
  "q-beh-influence-no-authority",
  "q-beh-quality-schedule",
  "q-beh-negative-feedback",
  "q-beh-cross-functional",
  "q-beh-ethical-data",
  "q-beh-lead-small-team",
  "q-beh-behavioral-loop-boss",
  "q-proj-project-one-liner",
  "q-proj-architecture-whiteboard",
  "q-proj-metric-defense",
  "q-proj-decision-replay",
  "q-proj-root-cause-replay",
  "q-proj-scale-counterfactual",
  "q-proj-testing-strategy",
  "q-proj-ownership-boundary",
  "q-proj-failed-project",
  "q-proj-five-minute-defense",
  "q-proj-project-loop-boss",
]);
assert.equal(
  softPolicyAnchorIds.size,
  22,
  "soft-policy release gate must cover exactly 22 reviewed anchors",
);
const globalSoftPolicyEn =
  "State all assumptions that materially affect correctness; do not rely on undisclosed vendor behavior or confidential interview knowledge.";
const globalSoftPolicyZh =
  /说明所有对(?:回答真实性|技术正确性)有实质影响的假设；不得依赖未披露的厂商行为或保密的面试知识。/;
for (const questionId of softPolicyAnchorIds) {
  const anchor = curatedAnchorById.get(questionId);
  const translation = questionTranslationCatalog[questionId];
  assert.ok(anchor, `soft-policy anchor ${questionId} is missing`);
  assert.ok(
    editorialOverrides[questionId],
    `soft-policy anchor ${questionId} has no reviewed editorial override`,
  );
  assert.ok(
    anchor.prompt.includes(globalSoftPolicyEn),
    `soft-policy anchor ${questionId} lacks the mandatory English assumptions/confidentiality constraint`,
  );
  assert.match(
    anchor.promptZh,
    globalSoftPolicyZh,
    `soft-policy anchor ${questionId} lacks the mandatory Chinese assumptions/confidentiality constraint`,
  );
  assert.ok(
    anchor.promptZh.includes(translation.promptZh),
    `soft-policy anchor ${questionId} dropped its reviewed question-specific Chinese policy`,
  );
}

const mandatoryEnglishResponseAnchorIds = new Set([
  "q-eng-misunderstanding-repair",
  "q-eng-concise-debug-summary",
  "q-eng-pushback",
  "q-eng-unknown-answer",
  "q-eng-questions-for-interviewer",
]);
for (const questionId of mandatoryEnglishResponseAnchorIds) {
  const anchor = curatedAnchorById.get(questionId);
  assert.ok(anchor, `mandatory-English anchor ${questionId} is missing`);
  assert.match(
    anchor.prompt,
    /(?:respond|answer|response).{0,24}(?:must be|in) English/i,
    `mandatory-English anchor ${questionId} does not explicitly require an English response in its English prompt`,
  );
  assert.match(
    anchor.promptZh,
    /(?:(?:请用|必须使用|须使用)(?:英语|英文)|(?:英语|英文)(?:回答|作答|提问))/,
    `mandatory-English anchor ${questionId} does not explicitly require an English response in its Chinese prompt`,
  );
}

const tapTraceQuestion = curatedAnchorById.get("q-dft-tap-trace");
const tapTraceOverride = editorialOverrides["q-dft-tap-trace"];
const tapFixtureMarkers = [
  "`1,1,1,1,1, 0,1,1,0,0, 0,0,0,1, 1,0, 1,0,0, 0,0,1, 1,0`",
  "`1,0,1,0`",
  "`1,1,0`",
];
assert.ok(
  tapTraceQuestion && tapTraceOverride,
  "q-dft-tap-trace and its exact editorial fixture must exist",
);
assert.equal(
  tapTraceQuestion.prompt,
  tapTraceOverride.prompt?.trim(),
  "q-dft-tap-trace English prompt must exactly match the reviewed TAP fixture",
);
assert.equal(
  tapTraceQuestion.promptZh,
  tapTraceOverride.promptZh?.trim(),
  "q-dft-tap-trace Chinese prompt must exactly match the reviewed TAP fixture",
);
for (const marker of tapFixtureMarkers) {
  assert.ok(
    tapTraceQuestion.prompt.includes(marker) &&
      tapTraceQuestion.promptZh.includes(marker),
    `q-dft-tap-trace bilingual prompts are missing exact fixture ${marker}`,
  );
}
const tapTraceLineage = questions.filter(
  (question) =>
    question.id === "q-dft-tap-trace" ||
    question.generationSpec?.baseQuestionId === "q-dft-tap-trace",
);
assert.equal(
  tapTraceLineage.length,
  10,
  "q-dft-tap-trace lineage must contain the anchor and all nine derivatives",
);
for (const question of tapTraceLineage) {
  for (const marker of tapFixtureMarkers) {
    assert.ok(
      question.prompt.includes(marker) && question.promptZh.includes(marker),
      `${question.id} bilingual prompt is not self-contained for exact TAP fixture ${marker}`,
    );
  }
}
const domainRoleIds = new Set(
  roles
    .map((role) => role.id)
    .filter(
      (id) =>
        ![
          "rf-behavioral",
          "rf-project-deep-dive",
          "rf-english-communication",
        ].includes(id),
    ),
);
const softRoleIds = new Set([
  "rf-behavioral",
  "rf-project-deep-dive",
  "rf-english-communication",
]);
const softwareIntegrationRoleIds = new Set([
  "rf-eda-rd",
  "rf-ai-eda",
  "rf-cad-flow",
]);
const embeddedIntegrationRoleId = "rf-embedded";
const manufacturingIntegrationRoleId = "rf-manufacturing-automation";
const digitalHardwareIntegrationRoleIds = new Set([
  "rf-rtl",
  "rf-dv",
  "rf-fpga",
  "rf-architecture",
  "rf-physical-design",
  "rf-dft",
]);

assert.ok(nonEmptyArray(roleMapping.rules), "role mapping has no rules");
for (const rule of roleMapping.rules) {
  assert.ok(
    domainRoleIds.has(rule.roleFamilyId),
    `role mapping references non-domain role ${rule.roleFamilyId}`,
  );
  assert.ok(
    nonEmptyArray(rule.keywords),
    `role mapping ${rule.roleFamilyId} has no keywords`,
  );
}

for (const company of companies) {
  assert.ok(
    mappedRoleFamilyIds(company, roleMapping.rules).length > 0,
    `company ${company.id} has no canonical role-family edge`,
  );
}

for (const role of roles) {
  assert.ok(role.name && role.nameZh, `role ${role.id} needs bilingual names`);
  assert.ok(nonEmptyArray(role.typicalTitles), `role ${role.id} has no titles`);
  assert.ok(
    nonEmptyArray(role.interviewStages),
    `role ${role.id} has no interview stages`,
  );
  assert.ok(
    nonEmptyArray(role.primarySkillDomains),
    `role ${role.id} has no skill domains`,
  );
}

for (const skill of skills) {
  const context = `skill ${skill.id}`;
  assert.ok(skill.title || skill.name, `${context} has no title`);
  assert.ok(skill.titleZh || skill.nameZh, `${context} has no Chinese title`);
  assert.ok(skill.domain || skill.category, `${context} has no domain`);
  assert.ok(
    skill.level in skillLevelQuestionFloor,
    `${context} has unsupported level ${skill.level}`,
  );
  assert.ok(
    nonEmptyArray(skill.roleFamilies),
    `${context} has no role mapping`,
  );
  for (const roleId of skill.roleFamilies) {
    assert.ok(
      roleIds.has(roleId),
      `${context} references missing role ${roleId}`,
    );
  }
  for (const prerequisite of skill.prerequisites || []) {
    assert.ok(
      skillIds.has(prerequisite),
      `${context} references missing prerequisite ${prerequisite}`,
    );
    assert.notEqual(
      prerequisite,
      skill.id,
      `${context} is its own prerequisite`,
    );
    const prerequisiteSkill = skillById.get(prerequisite);
    assert.ok(
      questionLevelRank[prerequisiteSkill.level] <=
        questionLevelRank[skill.level],
      `${context} (${skill.level}) has a higher-level prerequisite ${prerequisite} (${prerequisiteSkill.level})`,
    );
  }
}

const visitState = new Map();
function visitSkill(skillId, path = []) {
  const state = visitState.get(skillId);
  assert.notEqual(
    state,
    "visiting",
    `skill prerequisite cycle: ${[...path, skillId].join(" -> ")}`,
  );
  if (state === "visited") return;
  visitState.set(skillId, "visiting");
  const skill = skills.find((item) => item.id === skillId);
  for (const prerequisite of skill?.prerequisites || []) {
    visitSkill(prerequisite, [...path, skillId]);
  }
  visitState.set(skillId, "visited");
}
for (const skill of skills) visitSkill(skill.id);

const prerequisiteLevelViolations = [];
const contractInstructionViolations = [];
for (const question of questions) {
  const questionRank = questionLevelRank[question.level];
  if (questionRank === undefined) {
    prerequisiteLevelViolations.push({
      questionId: question.id,
      questionLevel: question.level,
      skillId: "(question-level)",
      skillLevel: "unknown",
    });
  }
  for (const skillId of question.prerequisiteSkills || []) {
    const skill = skillById.get(skillId);
    const requiredLevel = skillLevelQuestionFloor[skill?.level];
    if (
      questionRank !== undefined &&
      requiredLevel &&
      questionRank < questionLevelRank[requiredLevel]
    ) {
      prerequisiteLevelViolations.push({
        questionId: question.id,
        questionLevel: question.level,
        skillId,
        skillLevel: skill.level,
      });
    }
  }
  if (question.generationSpec?.archetype === "contract") {
    const languages = [];
    if (
      contractImplementationInstructionEn.test(
        contractInstructionTextEn(question.prompt),
      )
    ) {
      languages.push("EN");
    }
    if (
      contractImplementationInstructionZh.test(
        contractInstructionTextZh(question.promptZh),
      )
    ) {
      languages.push("ZH");
    }
    if (languages.length > 0) {
      contractInstructionViolations.push({
        questionId: question.id,
        languages: languages.join("+"),
      });
    }
  }
}
if (
  prerequisiteLevelViolations.length > 0 ||
  contractInstructionViolations.length > 0
) {
  const violatingQuestionCount = new Set(
    prerequisiteLevelViolations.map((violation) => violation.questionId),
  ).size;
  const prerequisiteDetails = prerequisiteLevelViolations
    .slice(0, 40)
    .map(
      (violation) =>
        `  - ${violation.questionId}: question ${violation.questionLevel} < prerequisite ${violation.skillId} (${violation.skillLevel})`,
    );
  const contractDetails = contractInstructionViolations
    .slice(0, 40)
    .map(
      (violation) =>
        `  - ${violation.questionId}: contradictory implementation instruction in ${violation.languages}`,
    );
  assert.fail(
    [
      "Question calibration gate failed.",
      prerequisiteLevelViolations.length > 0
        ? `${violatingQuestionCount} questions have ${prerequisiteLevelViolations.length} explicit prerequisite-level violations:`
        : "0 explicit prerequisite-level violations.",
      ...prerequisiteDetails,
      prerequisiteLevelViolations.length > prerequisiteDetails.length
        ? `  - ... ${prerequisiteLevelViolations.length - prerequisiteDetails.length} additional prerequisite edges`
        : null,
      contractInstructionViolations.length > 0
        ? `${contractInstructionViolations.length} contract prompts contain a positive implementation instruction:`
        : "0 contradictory contract prompts.",
      ...contractDetails,
      contractInstructionViolations.length > contractDetails.length
        ? `  - ... ${contractInstructionViolations.length - contractDetails.length} additional contract prompts`
        : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

const skillFocusOverrideUseCounts = new Map(
  [...skillFocusOverrideByKey.keys()].map((key) => [key, 0]),
);
let generatedDefaultTargetCount = 0;
let generatedOverrideTargetCount = 0;
let selfContainedTechnicalPromptCount = 0;
let reviewedMinimalImplementationCount = 0;
let contractReviewerOnlyOracleCount = 0;
for (const question of questions) {
  const context = `question ${question.id}`;
  assert.ok(question.title, `${context} has no title`);
  assert.ok(
    question.titleZh && hasChinese(question.titleZh),
    `${context} has no usable Chinese title`,
  );
  assert.match(
    question.contentVersion || "",
    /^\d{4}-\d{2}-\d{2}\.\d+$/,
    `${context} has an invalid contentVersion`,
  );
  assert.ok(question.prompt?.length >= 80, `${context} prompt is too shallow`);
  assert.ok(
    question.promptZh?.length >= 50 && hasChinese(question.promptZh, 30),
    `${context} Chinese prompt is too shallow`,
  );
  assert.doesNotMatch(
    question.prompt,
    /original public-concept scenario|new interview variant|primary capability|technical anchor/i,
    `${context} exposes generation metadata in the candidate prompt`,
  );
  assert.ok(
    nonEmptyArray(question.roleFamilies),
    `${context} has no role mapping`,
  );
  assert.ok(nonEmptyArray(question.skills), `${context} has no skill mapping`);
  assertParallelArray(question, "deliverables", "deliverablesZh", 1);
  assertParallelArray(question, "rubric", "rubricZh", 3);
  assertParallelArray(question, "commonFailures", "commonFailuresZh", 2);
  assertParallelArray(question, "followUps", "followUpsZh", 1);
  assertParallelArray(question, "referenceOutline", "referenceOutlineZh", 3);
  if (question.generationSpec?.origin === "blueprint-v2") {
    const baseAnchor = curatedAnchorById.get(
      question.generationSpec.baseQuestionId,
    );
    const targetSkill = skills[question.generationSpec.skillIndex];
    const roleId = question.roleFamilies[0];
    assert.ok(baseAnchor, `${context} references a missing curated anchor`);
    assert.ok(targetSkill, `${context} has an invalid target skill index`);
    const focusKey = skillFocusKey(
      roleId,
      baseAnchor.id,
      question.generationSpec.archetype,
    );
    const skillFocusOverride = skillFocusOverrideByKey.get(focusKey);
    const expectedTargetSkillId =
      skillFocusOverride?.skillId || baseAnchor.skills[0];
    assert.equal(
      targetSkill.id,
      expectedTargetSkillId,
      `${context} targets ${targetSkill.id}; expected ${
        skillFocusOverride
          ? `reviewed override ${skillFocusOverride.skillId}`
          : `base primary skill ${baseAnchor.skills[0]}`
      }`,
    );
    assert.equal(
      question.skills[0],
      expectedTargetSkillId,
      `${context}.skills[0] must expose the generated target skill`,
    );
    if (skillFocusOverride) {
      assert.ok(
        question.prompt.includes(skillFocusOverride.focusEn),
        `${context} does not include the exact reviewed English skill focus for ${focusKey}`,
      );
      assert.ok(
        question.promptZh.includes(skillFocusOverride.focusZh),
        `${context} does not include the exact reviewed Chinese skill focus for ${focusKey}`,
      );
      skillFocusOverrideUseCounts.set(
        focusKey,
        skillFocusOverrideUseCounts.get(focusKey) + 1,
      );
      generatedOverrideTargetCount += 1;
    } else {
      generatedDefaultTargetCount += 1;
    }
    if (!softRoleIds.has(roleId)) {
      const expectedSourceEn = scenarioSourceForAudit(baseAnchor.prompt);
      const expectedSourceZh = scenarioSourceZhForAudit(baseAnchor.promptZh);
      assert.ok(
        question.prompt.includes(`“${expectedSourceEn}”`),
        `${context} omits the complete quoted English source scenario`,
      );
      assert.ok(
        question.promptZh.includes(`《${expectedSourceZh}》`),
        `${context} omits the complete quoted Chinese source scenario`,
      );
      selfContainedTechnicalPromptCount += 1;
      assert.ok(
        question.oracle.procedure.includes(baseAnchor.oracle.procedure) &&
          question.oracle.acceptance.includes(baseAnchor.oracle.acceptance),
        `${context} does not preserve its task-specific English oracle core`,
      );
      assert.ok(
        question.oracleZh.procedure.includes(baseAnchor.oracleZh.procedure) &&
          question.oracleZh.acceptance.includes(baseAnchor.oracleZh.acceptance),
        `${context} does not preserve its task-specific Chinese oracle core`,
      );
      assert.match(
        question.oracle.procedure,
        /this exercise's additional check/i,
        `${context} lacks an archetype-specific English oracle check`,
      );
      assert.match(
        question.oracleZh.procedure,
        /本次练习的附加检查/,
        `${context} lacks an archetype-specific Chinese oracle check`,
      );
      const baseOracleTokens =
        `${baseAnchor.oracle.procedure} ${baseAnchor.oracle.acceptance}`.match(
          /[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?|\b(?:ps|ns|us|ms|mV|mA|mS|MHz|GHz|KiB|MiB|GiB)\b/gi,
        ) || [];
      const derivedOracleText = `${question.oracle.procedure} ${question.oracle.acceptance}`;
      for (const token of new Set(baseOracleTokens)) {
        assert.ok(
          derivedOracleText.includes(token),
          `${context} drops base oracle numeric or unit token ${token}`,
        );
      }
    }
    for (const [index, deliverable] of question.deliverables.entries()) {
      assert.doesNotMatch(
        deliverable,
        /^A [aeiou]/i,
        `${context}.deliverables[${index}] has an incorrect indefinite article`,
      );
      assert.doesNotMatch(
        deliverable,
        /\bartifact\b.*\bartifact\b/i,
        `${context}.deliverables[${index}] repeats "artifact" mechanically`,
      );
    }
    if (question.generationSpec.archetype === "contract") {
      assert.ok(
        question.prompt.includes(`“${targetSkill.title || targetSkill.name}”`),
        `${context} English contract prompt omits the target-skill lens`,
      );
      assert.ok(
        question.promptZh.includes(`“${targetSkill.titleZh}”`),
        `${context} Chinese contract prompt omits the target-skill lens`,
      );
      assert.match(
        question.prompt,
        /^For the “.+” scenario, reconstruct only /,
        `${context} must rewrite the anchor as a contract-only exercise`,
      );
      assert.match(
        question.promptZh,
        /^对于“.+”场景，只重构/,
        `${context} Chinese prompt must rewrite the anchor as a contract-only exercise`,
      );
      assert.doesNotMatch(
        contractInstructionTextEn(question.prompt),
        contractImplementationInstructionEn,
        `${context} retains a contradictory English implementation instruction`,
      );
      assert.doesNotMatch(
        contractInstructionTextZh(question.promptZh),
        contractImplementationInstructionZh,
        `${context} retains a contradictory Chinese implementation instruction`,
      );
      assert.match(
        question.prompt,
        /Source scenario \(reference-only quotation; do not execute its requested solution in this exercise\):/,
        `${context} does not distinguish quoted source material from the contract deliverable`,
      );
      assert.match(
        question.promptZh,
        /原始场景（仅作参考引文；本练习不执行其中要求的解法）/,
        `${context} Chinese prompt does not distinguish quoted source material from the contract deliverable`,
      );
      assert.doesNotMatch(
        question.oracle.procedure,
        /^First reproduce/i,
        `${context} incorrectly requires the candidate to solve the anchor before writing a contract`,
      );
      assert.doesNotMatch(
        question.oracleZh.procedure,
        /^先复现/,
        `${context} Chinese oracle incorrectly requires the anchor solution`,
      );
      assert.match(
        question.oracle.procedure,
        /independent reviewer check—not as a candidate deliverable/i,
        `${context} does not scope the frozen anchor oracle to reviewer use`,
      );
      assert.match(
        question.oracleZh.procedure,
        /独立评审检查，不作为作答者交付物/,
        `${context} Chinese oracle does not scope the frozen anchor oracle to reviewer use`,
      );
      contractReviewerOnlyOracleCount += 1;
    }
    if (
      !softRoleIds.has(roleId) &&
      question.generationSpec.archetype === "minimal-implementation"
    ) {
      assert.match(
        question.prompt,
        /construct exactly one minimally invalid input, observation, or constraint by violating a declared invariant/i,
        `${context} does not require a candidate-constructed minimally invalid fixture`,
      );
      assert.match(
        question.promptZh,
        /构造恰好一个最小无效输入、观测或约束；方法必须明确识别并拒绝它/,
        `${context} Chinese prompt does not require a candidate-constructed minimally invalid fixture`,
      );
      assert.doesNotMatch(
        question.prompt,
        /One supplied input, observation, or constraint is invalid/i,
        `${context} falsely claims that an invalid item was supplied`,
      );
      assert.doesNotMatch(
        question.promptZh,
        /一项给定输入、观测或约束无效/,
        `${context} Chinese prompt falsely claims that an invalid item was supplied`,
      );
      assert.match(
        question.oracle.procedure,
        /candidate-constructed minimally invalid input, observation, or constraint that violates exactly one declared invariant/i,
        `${context} oracle does not execute the candidate-constructed invalid fixture`,
      );
      assert.match(
        question.oracleZh.procedure,
        /由作答者构造且恰好违反一项已声明不变量的最小无效输入、观测或约束/,
        `${context} Chinese oracle does not execute the candidate-constructed invalid fixture`,
      );
      reviewedMinimalImplementationCount += 1;
    }
    if (
      !softRoleIds.has(roleId) &&
      ["contract", "worked-example"].includes(question.generationSpec.archetype)
    ) {
      const isContract = question.generationSpec.archetype === "contract";
      assert.equal(
        question.deliverables.length,
        1,
        `${context} short exercise must have exactly one scoped deliverable`,
      );
      assert.equal(
        question.followUps.length,
        1,
        `${context} short exercise must have exactly one scoped follow-up`,
      );
      assert.equal(
        question.referenceOutline.length,
        3,
        `${context} short exercise must have exactly three compact outline steps`,
      );
      if (isContract) {
        assert.match(
          question.prompt,
          /one page or less.*one explicit boundary.*one ambiguity/is,
          `${context} contract prompt is not scoped to one page, one boundary, and one ambiguity`,
        );
        assert.match(
          question.promptZh,
          /不超过一页.*一个明确边界.*一个必须澄清的歧义/s,
          `${context} Chinese contract prompt is not equivalently scoped`,
        );
      } else {
        assert.match(
          question.prompt,
          /exactly one nominal case plus one smallest counterexample/is,
          `${context} worked example is not scoped to two traces`,
        );
        assert.match(
          question.promptZh,
          /恰好一个正常案例和一个最小反例/s,
          `${context} Chinese worked example is not equivalently scoped`,
        );
      }
      if (question.level === "foundation") {
        assert.equal(
          question.difficulty,
          "easy",
          `${context} foundational short exercise must be easy`,
        );
        assert.ok(
          Number(question.estimatedMinutes) >= (isContract ? 12 : 15) &&
            Number(question.estimatedMinutes) <= (isContract ? 15 : 20),
          `${context} foundational short exercise has an implausible timebox`,
        );
      } else {
        assert.ok(
          ["intermediate", "advanced"].includes(question.level) &&
            Number(question.estimatedMinutes) >= (isContract ? 20 : 25),
          `${context} complex short exercise must be promoted and lengthened`,
        );
      }
      assert.doesNotMatch(
        question.deliverables.join(" "),
        /implementation plan|architecture plan|regression plan|residual-risk register|independent validation result/i,
        `${context} short deliverable expands beyond its timebox`,
      );
    }
    if (
      !softRoleIds.has(roleId) &&
      question.generationSpec.archetype === "integration"
    ) {
      const promptEn = question.prompt;
      const promptZh = question.promptZh;
      const deliverablesEn = question.deliverables.join(" ");
      const deliverablesZh = question.deliverablesZh.join(" ");
      const rubricEn = question.rubric.join(" ");
      const rubricZh = question.rubricZh.join(" ");
      const oracleEn = `${question.oracle.procedure} ${question.oracle.acceptance}`;
      const oracleZh = `${question.oracleZh.procedure} ${question.oracleZh.acceptance}`;
      const allEn = [promptEn, deliverablesEn, rubricEn, oracleEn].join(" ");
      const allZh = [promptZh, deliverablesZh, rubricZh, oracleZh].join(" ");
      if (softwareIntegrationRoleIds.has(roleId)) {
        assert.match(promptEn, /telemetry.*staged rollout.*rollback/is);
        assert.match(promptZh, /发布遥测.*分阶段上线.*回滚/s);
        assert.match(deliverablesEn, /staged release.*telemetry.*rollback/is);
        assert.match(deliverablesZh, /分阶段发布.*发布遥测.*回滚/s);
        assert.match(rubricEn, /Release evidence.*Recovery safety/is);
        assert.match(rubricZh, /发布证据.*恢复安全/s);
        assert.match(oracleEn, /limited release.*telemetry.*rollback/is);
        assert.match(oracleZh, /(?=.*受限发布)(?=.*遥测)(?=.*回滚)/s);
      } else {
        assert.doesNotMatch(
          allEn,
          /\b(?:release telemetry|staged rollout|canary release|software deployment|release cohort|limited release(?: cohort)?|upstream producer|downstream consumer)\b/i,
          `${context} applies software-release language outside a software/service role`,
        );
        assert.doesNotMatch(
          allZh,
          /发布遥测|分阶段(?:上线|发布)|金丝雀发布|软件部署|发布批次|受限发布|上游生产者|下游使用方/,
          `${context} Chinese integration content applies software-release language outside a software/service role`,
        );
        if (roleId === embeddedIntegrationRoleId) {
          assert.match(
            promptEn,
            /real peripheral.*clock\/reset\/power boundary.*(?:asynchronous sampling|CDC).*reset/is,
            `${context} lacks embedded hardware-boundary, CDC, or reset semantics`,
          );
          assert.match(
            promptZh,
            /真实外设.*时钟\/复位\/电源边界.*(?:异步采样|CDC).*复位/s,
            `${context} Chinese prompt lacks embedded hardware-boundary, CDC, or reset semantics`,
          );
          assert.match(
            deliverablesEn,
            /embedded hardware\/software integration.*clock\/reset\/power boundaries.*(?:asynchronous sampling|CDC).*reset/is,
            `${context} embedded deliverables lack hardware-boundary, CDC, or reset evidence`,
          );
          assert.match(
            deliverablesZh,
            /嵌入式软硬件集成.*时钟\/复位\/电源边界.*(?:异步采样|CDC).*复位/s,
            `${context} Chinese embedded deliverables lack hardware-boundary, CDC, or reset evidence`,
          );
          assert.match(
            rubricEn,
            /Boundary correctness.*Hardware evidence.*Recovery safety/is,
            `${context} embedded rubric lacks boundary/evidence/recovery dimensions`,
          );
          assert.match(
            rubricZh,
            /边界正确性.*硬件证据.*恢复安全/s,
            `${context} Chinese embedded rubric lacks boundary/evidence/recovery dimensions`,
          );
          assert.match(
            oracleEn,
            /independent peripheral or bus model.*(?:asynchronous sampling|CDC).*reset.*board-safe fallback/is,
            `${context} embedded oracle does not exercise CDC/reset and a board-safe fallback`,
          );
          assert.match(
            oracleZh,
            /独立外设或总线模型.*(?:异步采样|CDC).*复位.*板级安全后备方案/s,
            `${context} Chinese embedded oracle does not exercise CDC/reset and a board-safe fallback`,
          );
        } else if (roleId === manufacturingIntegrationRoleId) {
          assert.match(
            promptEn,
            /equipment control.*(?:sensor|interlock).*fail-safe de-energized state.*independent protection layer.*cannot bypass the interlock/is,
            `${context} lacks manufacturing fail-safe and independent-protection semantics`,
          );
          assert.match(
            promptZh,
            /设备控制.*(?:传感器|联锁).*失效安全的去激励状态.*独立保护层.*不能绕过联锁/s,
            `${context} Chinese prompt lacks manufacturing fail-safe and independent-protection semantics`,
          );
          assert.match(
            deliverablesEn,
            /hazard and validation matrix.*independent protection layer.*fail-safe de-energized state.*cannot bypass the interlock/is,
            `${context} manufacturing deliverables lack hazard/protection/fail-safe evidence`,
          );
          assert.match(
            deliverablesZh,
            /危害与验证矩阵.*独立保护层.*失效安全的去激励状态.*不能绕过联锁/s,
            `${context} Chinese manufacturing deliverables lack hazard/protection/fail-safe evidence`,
          );
          assert.match(
            rubricEn,
            /Independent safety.*independent protection layer.*fail-safe de-energized state.*without bypassing protection/is,
            `${context} manufacturing rubric lacks independent fail-safe protection`,
          );
          assert.match(
            rubricZh,
            /独立安全.*独立保护层.*失效安全的去激励状态.*不绕过保护/s,
            `${context} Chinese manufacturing rubric lacks independent fail-safe protection`,
          );
          assert.match(
            oracleEn,
            /independent protection layer.*controlled recovery.*fail-safe de-energized state.*cannot bypass the protection layer/is,
            `${context} manufacturing oracle does not exercise independent fail-safe protection`,
          );
          assert.match(
            oracleZh,
            /独立保护层.*受控恢复.*失效安全的去激励状态.*无法绕过保护层/s,
            `${context} Chinese manufacturing oracle does not exercise independent fail-safe protection`,
          );
        } else if (digitalHardwareIntegrationRoleIds.has(roleId)) {
          assert.match(
            promptEn,
            /verification and signoff.*incremental integration.*observability.*(?:bypass|ECO)/is,
          );
          assert.match(promptZh, /验证与签核.*增量集成.*可观测.*(?:旁路|ECO)/s);
          assert.match(
            deliverablesEn,
            /verification and signoff.*incremental integration.*(?:bypass|ECO)/is,
          );
          assert.match(deliverablesZh, /验证与签核.*增量集成.*(?:旁路|ECO)/s);
          assert.match(
            rubricEn,
            /Verification and signoff.*Integration safety/is,
          );
          assert.match(rubricZh, /验证与签核.*集成安全/s);
          assert.match(oracleEn, /simulation.*signoff.*fallback/is);
          assert.match(oracleZh, /仿真.*签核.*后备/s);
        } else {
          assert.equal(
            roleId,
            "rf-analog-custom",
            `${context} lacks a recognized integration domain`,
          );
          assert.match(
            promptEn,
            /source, load, bias, control, and test environment.*PVT and mixed-signal.*measurement hooks.*reversible ECO/is,
          );
          assert.match(
            promptZh,
            /信号源、负载、偏置、控制和测试环境.*PVT 与混合信号.*测量钩子.*可逆的 ECO/s,
          );
          assert.match(
            deliverablesEn,
            /source, load, bias, control, test environment.*PVT and mixed-signal.*measurement-hook.*reversible ECO/is,
          );
          assert.match(
            deliverablesZh,
            /信号源、负载、偏置、控制、测试环境.*PVT 与混合信号.*测量钩子.*可逆 ECO/s,
          );
          assert.match(
            rubricEn,
            /Electrical contract.*PVT and mixed-signal.*Integration safety/is,
          );
          assert.match(rubricZh, /电气契约.*PVT 与混合信号.*集成安全/s);
          assert.match(
            oracleEn,
            /(?=.*source, load, bias, control, PVT)(?=.*measurement hooks)(?=.*reversible ECO)/is,
          );
          assert.match(
            oracleZh,
            /(?=.*信号源、负载、偏置、控制、PVT)(?=.*测量钩子)(?=.*可逆 ECO)/s,
          );
        }
      }
    }
  }
  const englishQualityStrings = [
    question.title,
    question.prompt,
    ...question.deliverables,
    ...question.rubric,
    ...question.commonFailures,
    ...question.followUps,
    ...question.referenceOutline,
    question.oracle?.procedure,
    question.oracle?.acceptance,
  ];
  const chineseQualityStrings = [
    question.titleZh,
    question.promptZh,
    ...question.deliverablesZh,
    ...question.rubricZh,
    ...question.commonFailuresZh,
    ...question.followUpsZh,
    ...question.referenceOutlineZh,
    question.oracleZh?.procedure,
    question.oracleZh?.acceptance,
  ];
  if (question.generationSpec?.origin === "blueprint-v2") {
    const visibleEnglish = englishQualityStrings.join("\n");
    const visibleChinese = chineseQualityStrings.join("\n");
    assert.doesNotMatch(
      visibleEnglish,
      /\bassigned\b[^.!?]{0,60}\bvariant\b|\b(?:Contract Reconstruction|Worked Example and Boundary|Minimal Implementation|Fault Injection Debug|Independent Oracle|Scale and Resource Ceiling|Trade-off Decision Review|Ambiguous Production Incident|Cross-Layer Boss Fight)\s+variant\b|\b(?:archetype|blueprint)\b|\b(?:scenario|question|training|drill|technical)\s+(?:lineage|anchor|generation)\b/i,
      `${context} exposes internal generation terminology`,
    );
    assert.doesNotMatch(
      visibleChinese,
      /指定变体|(?:契约重构|算例与边界|最小实现|故障注入调试|独立判定器|规模与资源上限|权衡决策评审|模糊生产事故|跨层综合挑战)变体|题目原型|题目谱系|场景锚点|技术锚点|生成元数据|生成蓝图/,
      `${context} Chinese content exposes internal generation terminology`,
    );
    assert.doesNotMatch(
      visibleChinese,
      /(?:运用|对|把)[A-Za-z]/,
      `${context} glues a Latin skill name to preceding Chinese text`,
    );
    assert.doesNotMatch(
      visibleChinese,
      /[A-Za-z0-9+](?:的|在|建立|调整|正确应用|当作|最重要)/,
      `${context} glues a Latin skill name to following Chinese text`,
    );
  }
  for (const [index, value] of englishQualityStrings.entries()) {
    assert.doesNotMatch(
      value || "",
      /\b(contract|artifact|the)\s+\1\b/i,
      `${context} English quality string ${index} repeats a word mechanically`,
    );
  }
  for (const [index, value] of chineseQualityStrings.entries()) {
    assert.doesNotMatch(
      value || "",
      /契约[”"』】]?\s*契约/,
      `${context} Chinese quality string ${index} repeats 契约 mechanically`,
    );
  }
  assert.ok(question.sourcePolicy, `${context} has no source policy`);
  assert.ok(
    nonEmptyArray(question.sourceRefs),
    `${context} has no public source references`,
  );
  assert.ok(
    typeof question.blueprintId === "string" &&
      question.blueprintId.length >= 5,
    `${context} has no blueprint provenance`,
  );
  assert.ok(
    question.generationSpec &&
      ["curated-v1", "blueprint-v2"].includes(question.generationSpec.origin) &&
      question.generationSpec.baseQuestionId &&
      question.generationSpec.archetype &&
      Number.isInteger(question.generationSpec.contextIndex) &&
      Number.isInteger(question.generationSpec.skillIndex) &&
      question.generationSpec.seed,
    `${context} has invalid generationSpec provenance`,
  );
  assert.ok(
    ["draft", "review-ready", "active", "deprecated", "retired"].includes(
      question.status,
    ),
    `${context} has invalid review status`,
  );
  for (const skillId of question.prerequisiteSkills || []) {
    assert.ok(
      skillIds.has(skillId),
      `${context} references missing prerequisite skill ${skillId}`,
    );
  }
  const targetsAdvancedSkill = question.skills.some(
    (skillId) =>
      skills.find((skill) => skill.id === skillId)?.level === "advanced",
  );
  if (
    ["entry", "foundation"].includes(question.level) &&
    targetsAdvancedSkill
  ) {
    const advancedSkillIds = question.skills.filter(
      (skillId) => skillById.get(skillId)?.level === "advanced",
    );
    assert.fail(
      `${context} is labeled ${question.level} but targets advanced skills: ${advancedSkillIds.join(", ")}`,
    );
  }
  assert.ok(
    Number(question.estimatedMinutes) > 0,
    `${context} has invalid estimatedMinutes`,
  );
  for (const roleId of question.roleFamilies) {
    assert.ok(
      roleIds.has(roleId),
      `${context} references missing role ${roleId}`,
    );
  }
  for (const skillId of question.skills) {
    assert.ok(
      skillIds.has(skillId),
      `${context} references missing skill ${skillId}`,
    );
  }
  for (const [index, source] of (question.sourceRefs || []).entries()) {
    assertUrl(
      typeof source === "string" ? source : source.url,
      `${context} source ${index}`,
    );
  }
  for (const [field, requireChinese] of [
    ["oracle", false],
    ["oracleZh", true],
  ]) {
    const oracle = question[field];
    assert.ok(
      oracle && typeof oracle === "object" && !Array.isArray(oracle),
      `${context}.${field} must be a structured object`,
    );
    assert.deepEqual(
      Object.keys(oracle).sort(),
      ["acceptance", "kind", "procedure"],
      `${context}.${field} must use the canonical oracle schema`,
    );
    for (const key of ["kind", "procedure", "acceptance"]) {
      assert.ok(
        typeof oracle[key] === "string" && oracle[key].length >= 3,
        `${context}.${field}.${key} is empty`,
      );
      if (requireChinese) {
        assert.ok(
          hasChinese(oracle[key], key === "kind" ? 2 : 4),
          `${context}.${field}.${key} is not usable Chinese`,
        );
      }
    }
  }
}

const skillFocusUseViolations = [...skillFocusOverrideUseCounts].filter(
  ([, count]) => count !== 1,
);
assert.equal(
  skillFocusUseViolations.length,
  0,
  [
    "every reviewed question-skill-focus override must match exactly one generated drill",
    ...skillFocusUseViolations
      .slice(0, 30)
      .map(([key, count]) => `  - ${key}: used ${count} times`),
    skillFocusUseViolations.length > 30
      ? `  - ... ${skillFocusUseViolations.length - 30} additional override-use violations`
      : null,
  ]
    .filter(Boolean)
    .join("\n"),
);

const normalizedTitles = questions.map((question) =>
  normalizeText(`${question.title} ${question.titleZh}`),
);
const normalizedPrompts = questions.map((question) =>
  normalizeText(question.prompt),
);
const normalizedPromptsZh = questions.map((question) =>
  normalizeText(question.promptZh),
);
assert.equal(
  new Set(normalizedTitles).size,
  questions.length,
  "question bank contains duplicate bilingual titles",
);
assert.equal(
  new Set(normalizedPrompts).size,
  questions.length,
  "question bank contains duplicate English prompts",
);
assert.equal(
  new Set(normalizedPromptsZh).size,
  questions.length,
  "question bank contains duplicate Chinese prompts",
);

const seeds = questions.map((question) => question.generationSpec.seed);
assert.equal(
  new Set(seeds).size,
  questions.length,
  "question bank contains duplicate generation seeds",
);

const curatedQuestions = questions.filter(
  (question) => question.generationSpec.origin === "curated-v1",
);
const generatedQuestions = questions.filter(
  (question) => question.generationSpec.origin === "blueprint-v2",
);
assert.equal(
  curatedQuestions.length,
  210,
  "expected 210 curated scenario anchors",
);
assert.ok(
  generatedQuestions.length >= 1890,
  `only ${generatedQuestions.length} blueprint questions; expected at least 1890`,
);
const generatedTechnicalQuestions = generatedQuestions.filter(
  (question) => !softRoleIds.has(question.roleFamilies[0]),
);
assert.equal(
  generatedTechnicalQuestions.length,
  1512,
  "expected 1,512 generated technical exercises",
);
const targetSkillMatches = generatedQuestions.filter((question) => {
  const baseAnchor = curatedAnchorById.get(
    question.generationSpec.baseQuestionId,
  );
  const targetSkill = skills[question.generationSpec.skillIndex];
  const override = skillFocusOverrideByKey.get(
    skillFocusKey(
      question.roleFamilies[0],
      question.generationSpec.baseQuestionId,
      question.generationSpec.archetype,
    ),
  );
  return targetSkill?.id === (override?.skillId || baseAnchor?.skills[0]);
}).length;
assert.equal(
  targetSkillMatches,
  generatedQuestions.length,
  "every generated target skill must be the base primary skill or an exact reviewed focus override",
);
assert.equal(
  generatedDefaultTargetCount + generatedOverrideTargetCount,
  generatedQuestions.length,
  "generated target classification must cover every blueprint drill",
);
assert.equal(
  generatedOverrideTargetCount,
  skillFocusOverrideRecords.length,
  "every skill-focus override must be used exactly once",
);
const integrationQuestions = generatedTechnicalQuestions.filter(
  (question) => question.generationSpec.archetype === "integration",
);
assert.equal(
  integrationQuestions.length,
  168,
  "expected 168 role-aware technical integration exercises",
);
const embeddedIntegrationQuestions = integrationQuestions.filter(
  (question) => question.roleFamilies[0] === embeddedIntegrationRoleId,
);
const manufacturingIntegrationQuestions = integrationQuestions.filter(
  (question) => question.roleFamilies[0] === manufacturingIntegrationRoleId,
);
assert.equal(
  embeddedIntegrationQuestions.length,
  14,
  "expected 14 embedded hardware-boundary integration exercises",
);
assert.equal(
  manufacturingIntegrationQuestions.length,
  14,
  "expected 14 manufacturing fail-safe integration exercises",
);
for (const [field, label] of [
  ["procedure", "English procedures"],
  ["acceptance", "English acceptance criteria"],
]) {
  assert.equal(
    new Set(
      generatedTechnicalQuestions.map((question) =>
        normalizeText(question.oracle[field]),
      ),
    ).size,
    generatedTechnicalQuestions.length,
    `generated technical oracle ${label} must vary by task and exercise`,
  );
}
for (const [field, label] of [
  ["procedure", "Chinese procedures"],
  ["acceptance", "Chinese acceptance criteria"],
]) {
  assert.equal(
    new Set(
      generatedTechnicalQuestions.map((question) =>
        normalizeText(question.oracleZh[field]),
      ),
    ).size,
    generatedTechnicalQuestions.length,
    `generated technical oracle ${label} must vary by task and exercise`,
  );
}
const generatedSoftQuestions = generatedQuestions.filter((question) =>
  softRoleIds.has(question.roleFamilies[0]),
);
assert.equal(
  generatedSoftQuestions.length,
  378,
  "expected 378 generated behavioral/project/English exercises",
);
const softPromptFooters = {
  "rf-behavioral": {
    en: "Do not fabricate experience, metrics, motives, or outcomes, and do not disclose confidential information.",
    zh: "不得编造经历、指标、动机或结果，也不得披露保密信息。",
  },
  "rf-project-deep-dive": {
    en: "Use only real public-safe project evidence; label uncertainty and protect confidential implementation details.",
    zh: "只能使用真实且可公开的项目证据；标记不确定性并保护保密实现细节。",
  },
  "rf-english-communication": {
    en: "The final response must be in English. It is evaluated for clarity, technical accuracy, shared context, and repair—not accent.",
    zh: "最终回答必须使用英文。评分关注清晰度、技术准确性、共享上下文和修复能力，不评价口音。",
  },
};
function softVariantTitle(fullTitle, baseTitle, separator, context) {
  const prefix = `${baseTitle}${separator}`;
  assert.ok(
    fullTitle.startsWith(prefix),
    `${context} title must preserve its base title and reviewed variant separator`,
  );
  const variantTitle = fullTitle.slice(prefix.length).trim();
  assert.ok(variantTitle.length >= 2, `${context} has no variant title`);
  return variantTitle;
}
function softVariantAction(fullPrompt, basePrompt, footer, context) {
  assert.ok(
    fullPrompt.startsWith(basePrompt),
    `${context} prompt must preserve the exact base prompt before its variant action`,
  );
  const remainder = fullPrompt.slice(basePrompt.length).trimStart();
  const footerIndex = remainder.indexOf(footer);
  assert.ok(
    footerIndex > 0,
    `${context} prompt does not expose the reviewed variant action before its safety/language footer`,
  );
  const action = remainder.slice(0, footerIndex).trim();
  assert.ok(action.length >= 20, `${context} variant action is too shallow`);
  return action;
}
for (const question of generatedSoftQuestions) {
  const context = `question ${question.id}`;
  const base = curatedAnchorById.get(question.generationSpec.baseQuestionId);
  const roleId = question.roleFamilies[0];
  const footer = softPromptFooters[roleId];
  assert.ok(base && footer, `${context} has invalid soft-question lineage`);
  const variantTitle = softVariantTitle(
    question.title,
    base.title,
    " — ",
    context,
  );
  const variantTitleZh = softVariantTitle(
    question.titleZh,
    base.titleZh,
    "——",
    context,
  );
  const actionEn = softVariantAction(
    question.prompt,
    base.prompt,
    footer.en,
    `${context} English`,
  );
  const actionZh = softVariantAction(
    question.promptZh,
    base.promptZh,
    footer.zh,
    `${context} Chinese`,
  );
  for (const field of ["procedure", "acceptance"]) {
    assert.ok(
      question.oracle[field].includes(base.title) &&
        question.oracle[field].includes(variantTitle),
      `${context}.oracle.${field} must name both base title “${base.title}” and variant “${variantTitle}”`,
    );
    assert.ok(
      question.oracleZh[field].includes(base.titleZh) &&
        question.oracleZh[field].includes(variantTitleZh),
      `${context}.oracleZh.${field} must name both base title “${base.titleZh}” and variant “${variantTitleZh}”`,
    );
  }
  assert.ok(
    question.oracle.procedure.includes(actionEn),
    `${context}.oracle.procedure must embed the exact English variant action`,
  );
  assert.ok(
    question.oracleZh.procedure.includes(actionZh),
    `${context}.oracleZh.procedure must embed the exact Chinese variant action`,
  );
}
function duplicateOracleGroups(questionRecords, oracleField, textField) {
  const groups = new Map();
  for (const question of questionRecords) {
    const normalized = normalizeText(question[oracleField][textField]);
    if (!groups.has(normalized)) groups.set(normalized, []);
    groups.get(normalized).push(question.id);
  }
  return [...groups.values()].filter((ids) => ids.length > 1);
}
const softOracleDuplicateGroups = [];
for (const [oracleField, textField, label] of [
  ["oracle", "procedure", "English procedures"],
  ["oracle", "acceptance", "English acceptance criteria"],
  ["oracleZh", "procedure", "Chinese procedures"],
  ["oracleZh", "acceptance", "Chinese acceptance criteria"],
]) {
  const duplicates = duplicateOracleGroups(
    generatedSoftQuestions,
    oracleField,
    textField,
  );
  for (const ids of duplicates) {
    softOracleDuplicateGroups.push({ label, ids });
  }
}
assert.equal(
  softOracleDuplicateGroups.length,
  0,
  [
    "all 378 generated soft exercises need task-specific EN/ZH oracle procedures and acceptance criteria",
    ...softOracleDuplicateGroups
      .slice(0, 20)
      .map(({ label, ids }) => `  - ${label}: ${ids.join(", ")}`),
    softOracleDuplicateGroups.length > 20
      ? `  - ... ${softOracleDuplicateGroups.length - 20} additional duplicate groups`
      : null,
  ]
    .filter(Boolean)
    .join("\n"),
);
const generatedTargetSkillCounts = Object.fromEntries(
  skills.map((skill) => [skill.id, 0]),
);
for (const question of generatedQuestions) {
  const targetSkill = skills[question.generationSpec.skillIndex];
  assert.ok(targetSkill, `question ${question.id} has an invalid target skill`);
  generatedTargetSkillCounts[targetSkill.id] += 1;
}
assert.equal(
  Object.values(generatedTargetSkillCounts).filter((count) => count > 0).length,
  skills.length,
  "generated exercises must directly target all canonical skills",
);

const lineage = new Map();
for (const question of questions) {
  const key = question.generationSpec.baseQuestionId;
  if (!lineage.has(key)) lineage.set(key, []);
  lineage.get(key).push(question);
}
assert.equal(lineage.size, 210, "expected 210 distinct scenario lineages");
for (const [baseQuestionId, members] of lineage) {
  assert.equal(
    members.length,
    10,
    `scenario lineage ${baseQuestionId} must contain one anchor and nine distinct drills`,
  );
  assert.equal(
    new Set(members.map((question) => question.generationSpec.archetype)).size,
    10,
    `scenario lineage ${baseQuestionId} repeats an archetype`,
  );
}

let closestPromptPair = { similarity: 0, left: "", right: "" };
let closestPromptPairZh = { similarity: 0, left: "", right: "" };
let suspiciousNearDuplicatePairs = 0;
let suspiciousNearDuplicatePairsZh = 0;
const duplicateCandidateGroups = [
  ...lineage.values(),
  ...Object.values(
    Object.groupBy(
      generatedQuestions,
      (question) => question.generationSpec.archetype,
    ),
  ),
];
for (const group of duplicateCandidateGroups) {
  const shingleSets = group.map((question) => wordShingles(question.prompt));
  const shingleSetsZh = group.map((question) =>
    characterShingles(question.promptZh),
  );
  for (let leftIndex = 0; leftIndex < group.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < group.length;
      rightIndex += 1
    ) {
      const similarity = jaccard(
        shingleSets[leftIndex],
        shingleSets[rightIndex],
      );
      if (similarity > closestPromptPair.similarity) {
        closestPromptPair = {
          similarity,
          left: group[leftIndex].id,
          right: group[rightIndex].id,
        };
      }
      if (similarity >= 0.9) suspiciousNearDuplicatePairs += 1;
      const similarityZh = jaccard(
        shingleSetsZh[leftIndex],
        shingleSetsZh[rightIndex],
      );
      if (similarityZh > closestPromptPairZh.similarity) {
        closestPromptPairZh = {
          similarity: similarityZh,
          left: group[leftIndex].id,
          right: group[rightIndex].id,
        };
      }
      if (similarityZh >= 0.9) suspiciousNearDuplicatePairsZh += 1;
    }
  }
}
assert.equal(
  suspiciousNearDuplicatePairs,
  0,
  `question bank has ${suspiciousNearDuplicatePairs} prompt pairs with 5-gram Jaccard similarity >= 0.9; closest is ${closestPromptPair.left}/${closestPromptPair.right}`,
);
assert.equal(
  suspiciousNearDuplicatePairsZh,
  0,
  `question bank has ${suspiciousNearDuplicatePairsZh} Chinese prompt pairs with 12-character Jaccard similarity >= 0.9; closest is ${closestPromptPairZh.left}/${closestPromptPairZh.right}`,
);

const shortFoundationTasks = questions.filter(
  (question) =>
    question.difficulty === "easy" &&
    ["entry", "foundation"].includes(question.level) &&
    Number(question.estimatedMinutes) <= 15,
);
assert.ok(
  shortFoundationTasks.length >= 30,
  `only ${shortFoundationTasks.length} short foundation tasks; expected at least 30`,
);
const shortFoundationTaskCountsByRole = Object.fromEntries(
  [...roleIds].map((roleId) => [
    roleId,
    shortFoundationTasks.filter((question) =>
      question.roleFamilies.includes(roleId),
    ).length,
  ]),
);
const rolesWithoutShortFoundationTask = Object.entries(
  shortFoundationTaskCountsByRole,
).filter(([, count]) => count === 0);
assert.equal(
  rolesWithoutShortFoundationTask.length,
  0,
  `every role needs a real <=15-minute foundation/entry micro-exercise; missing: ${rolesWithoutShortFoundationTask
    .map(([roleId]) => roleId)
    .join(", ")}`,
);

const generatedSoftFoundationTasks = generatedSoftQuestions.filter(
  (question) => question.level === "foundation",
);
assert.ok(
  generatedSoftFoundationTasks.length > 0,
  "generated soft-skill curriculum has no foundation exercises",
);
const shortGeneratedSoftFoundationTasks = generatedSoftFoundationTasks.filter(
  (question) => Number(question.estimatedMinutes) < 25,
);
assert.equal(
  shortGeneratedSoftFoundationTasks.length,
  0,
  [
    "generated behavioral/project/English foundation exercises must allow at least 25 minutes:",
    ...shortGeneratedSoftFoundationTasks
      .slice(0, 40)
      .map(
        (question) =>
          `  - ${question.id}: ${question.estimatedMinutes} minutes`,
      ),
    shortGeneratedSoftFoundationTasks.length > 40
      ? `  - ... ${shortGeneratedSoftFoundationTasks.length - 40} additional short exercises`
      : null,
  ]
    .filter(Boolean)
    .join("\n"),
);

for (const roleId of roleIds) {
  const count = questions.filter((question) =>
    question.roleFamilies.includes(roleId),
  ).length;
  assert.ok(count >= 140, `role ${roleId} has only ${count} questions`);
  const easyCount = questions.filter(
    (question) =>
      question.roleFamilies.includes(roleId) && question.difficulty === "easy",
  ).length;
  assert.ok(easyCount >= 1, `role ${roleId} has no easy exercise`);
}

const skillQuestionCounts = Object.fromEntries(
  skills.map((skill) => [
    skill.id,
    questions.filter((question) => question.skills.includes(skill.id)).length,
  ]),
);
for (const [skillId, count] of Object.entries(skillQuestionCounts)) {
  assert.ok(count >= 7, `skill ${skillId} has only ${count} questions`);
}

const declaredRoleSkillEdges = skills.flatMap((skill) =>
  skill.roleFamilies.map((roleId) => ({
    roleId,
    skillId: skill.id,
    count: questions.filter(
      (question) =>
        question.roleFamilies.includes(roleId) &&
        question.skills.includes(skill.id),
    ).length,
  })),
);
const missingRoleSkillEdges = declaredRoleSkillEdges.filter(
  (edge) => edge.count === 0,
);
assert.equal(
  missingRoleSkillEdges.length,
  0,
  [
    "declared role-to-skill edges without direct question.skills coverage:",
    ...missingRoleSkillEdges
      .slice(0, 50)
      .map(({ roleId, skillId }) => `  - ${roleId} -> ${skillId}`),
    missingRoleSkillEdges.length > 50
      ? `  - ... ${missingRoleSkillEdges.length - 50} additional missing edges`
      : null,
  ]
    .filter(Boolean)
    .join("\n"),
);

for (const level of ["foundation", "entry", "intermediate", "advanced"]) {
  const count = questions.filter((question) => question.level === level).length;
  const minimum = level === "entry" ? 20 : 25;
  assert.ok(count >= minimum, `level ${level} has only ${count} questions`);
}

for (const difficulty of ["easy", "medium", "hard"]) {
  const count = questions.filter(
    (question) => question.difficulty === difficulty,
  ).length;
  const minimum = difficulty === "easy" ? roles.length * 4 : 200;
  assert.ok(
    count >= minimum,
    `difficulty ${difficulty} has only ${count} questions`,
  );
}

const companyTypes = new Set(companies.map((company) => company.companyType));
const categories = new Set(companies.flatMap((company) => company.categories));
const currentJobCount = companies.filter((company) =>
  company.evidence.some((evidence) => evidence.type === "official-current-job"),
).length;
const questionsFileBytes = (
  await stat(new URL("data/questions.seed.json", root))
).size;
const roleQuestionCounts = Object.fromEntries(
  roles.map((role) => [
    role.id,
    questions.filter((question) => question.roleFamilies.includes(role.id))
      .length,
  ]),
);
const skillCountValues = Object.values(skillQuestionCounts);
const generatedTargetSkillCountValues = Object.values(
  generatedTargetSkillCounts,
);
const levelCounts = Object.fromEntries(
  ["foundation", "entry", "intermediate", "advanced"].map((level) => [
    level,
    questions.filter((question) => question.level === level).length,
  ]),
);
const difficultyCounts = Object.fromEntries(
  ["easy", "medium", "hard"].map((difficulty) => [
    difficulty,
    questions.filter((question) => question.difficulty === difficulty).length,
  ]),
);
assert.ok(
  companyTypes.size >= 5,
  "company universe needs at least 5 organization types",
);
assert.ok(
  categories.size >= 15,
  "company universe needs at least 15 industry categories",
);

console.log(
  JSON.stringify(
    {
      status: "passed",
      snapshot: profile.evidenceDate,
      coverage: {
        organizations: companies.length,
        usCompanies: usCompanies.length,
        chinaCompanies: cnCompanies.length,
        organizationRelations: organizationRelations.length,
        organizationTypes: companyTypes.size,
        bilingualOrganizationTypeLabels: companyTypeIds.length,
        industryCategories: categories.size,
        bilingualIndustryCategoryLabels: liveCategoryIds.length,
        canonicalIndustryCategoryFilters: canonicalCategoryGroups.size,
        mergedIndustryCategoryAliasGroups: mergedCategoryAliasGroups.length,
        atomicIndustryCategoryFilters: atomicCategoryGroups.size,
        mergedAtomicIndustryCategoryAliasGroups:
          mergedAtomicCategoryAliasGroups.length,
        bilingualOrganizationNames: bilingualOrganizationCount,
        reviewedEnglishOnlyOrganizationNames: englishOnlyOrganizationCount,
        chinaCompanyOwnershipRecords: ownershipRecords.length,
        provisionallyAuditedOwnershipRecords:
          ownershipReviewStatusCounts["provisionally-audited"],
        ownershipNeedsDirectSource:
          ownershipReviewStatusCounts["needs-direct-control-source"],
        chinaOwnershipClassCounts: ownershipClassCounts,
        canonicalRoleEdges: canonicalRoleEdgeCount,
        currentJobEvidence: currentJobCount,
        roleFamilies: roles.length,
        atomicSkills: skills.length,
        atomicSkillDisplayTerms: atomicSkillDisplayTermCount,
        declaredRoleSkillEdges: declaredRoleSkillEdges.length,
        missingRoleSkillEdges: missingRoleSkillEdges.length,
        interviewTasks: questions.length,
        shortFoundationTasks: shortFoundationTasks.length,
        shortFoundationTaskCountsByRole,
        generatedSoftFoundationTasks: generatedSoftFoundationTasks.length,
        minimumGeneratedSoftFoundationMinutes: Math.min(
          ...generatedSoftFoundationTasks.map((question) =>
            Number(question.estimatedMinutes),
          ),
        ),
        roleQuestionCounts,
        skillQuestionCountRange: {
          minimum: Math.min(...skillCountValues),
          maximum: Math.max(...skillCountValues),
        },
        levelCounts,
        difficultyCounts,
      },
      questionQuality: {
        contentVersion: "2026-07-23.5",
        bankStatus: questionsRaw.status,
        curatedAnchors: curatedQuestions.length,
        generatedDrills: generatedQuestions.length,
        generatedTechnicalExercises: generatedTechnicalQuestions.length,
        scenarioLineages: lineage.size,
        taskSpecificOracleSpecs: Object.keys(oracleSpecCatalog).length,
        reviewedQuestionTranslations: Object.keys(questionTranslationCatalog)
          .length,
        alignedReferenceOutlineZhItems: curatedQuestions.reduce(
          (total, question) => total + question.referenceOutlineZh.length,
          0,
        ),
        legacyGenericReferenceOutlineZhItems:
          legacyGenericOutlineViolations.length,
        legacyExactOracleCrossChecks: Object.keys(oracleTranslationCatalog)
          .length,
        uniqueCuratedOracleProcedures: curatedQuestions.length,
        uniqueDerivedTechnicalOracleProcedures:
          generatedTechnicalQuestions.length,
        generatedSoftExercises: generatedSoftQuestions.length,
        uniqueDerivedSoftOracleProcedures: generatedSoftQuestions.length,
        uniqueDerivedSoftOracleAcceptanceCriteria:
          generatedSoftQuestions.length,
        generatedTargetSkillMatches: targetSkillMatches,
        generatedTargetSkillMatchRate:
          targetSkillMatches / generatedQuestions.length,
        generatedDefaultPrimarySkillTargets: generatedDefaultTargetCount,
        generatedReviewedFocusTargets: generatedOverrideTargetCount,
        reviewedSkillFocusOverrides: skillFocusOverrideRecords.length,
        reviewedEditorialOverrides: Object.keys(editorialOverrides).length,
        appliedEditorialOverrides: appliedEditorialOverrideCount,
        bilingualSoftPolicyAnchors: softPolicyAnchorIds.size,
        mandatoryEnglishResponseAnchors: mandatoryEnglishResponseAnchorIds.size,
        exactTapFixtureApplied: true,
        exactTapFixtureLineageMembers: tapTraceLineage.length,
        selfContainedTechnicalPrompts: selfContainedTechnicalPromptCount,
        reviewedMinimalImplementationExercises:
          reviewedMinimalImplementationCount,
        contractReviewerOnlyOracles: contractReviewerOnlyOracleCount,
        generatedTargetSkillCoverage: generatedTargetSkillCountValues.filter(
          (count) => count > 0,
        ).length,
        generatedTargetSkillCountRange: {
          minimum: Math.min(...generatedTargetSkillCountValues),
          maximum: Math.max(...generatedTargetSkillCountValues),
        },
        roleAwareIntegrationExercises: integrationQuestions.length,
        embeddedHardwareIntegrationExercises:
          embeddedIntegrationQuestions.length,
        manufacturingSafetyIntegrationExercises:
          manufacturingIntegrationQuestions.length,
        skillPrerequisiteLevelInversions: 0,
        prerequisiteLevelViolations: prerequisiteLevelViolations.length,
        contractPromptImplementationConflicts:
          contractInstructionViolations.length,
        foundationalQuestionsWithAdvancedSkills: 0,
        blueprintFamilies: new Set(
          questions.map((question) => question.blueprintId),
        ).size,
        exactDuplicateTitles: 0,
        exactDuplicatePromptsEn: 0,
        exactDuplicatePromptsZh: 0,
        nearDuplicateThreshold: 0.9,
        nearDuplicatePairs: suspiciousNearDuplicatePairs,
        closestPromptPair,
        nearDuplicatePairsZh: suspiciousNearDuplicatePairsZh,
        closestPromptPairZh,
        questionsFileBytes,
      },
    },
    null,
    2,
  ),
);

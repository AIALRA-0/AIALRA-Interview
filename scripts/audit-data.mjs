import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

function recordsOf(value, key, path) {
  const records = Array.isArray(value) ? value : value?.[key];
  assert.ok(Array.isArray(records), `${path} must be an array or expose "${key}"`);
  return records;
}

function assertUniqueIds(records, path) {
  const ids = records.map((item) => item?.id);
  assert.ok(ids.every(Boolean), `${path} contains a record without an id`);
  assert.equal(new Set(ids).size, ids.length, `${path} contains duplicate ids`);
}

function assertUrl(value, context) {
  assert.ok(typeof value === "string" && value.length > 0, `${context} is empty`);
  const url = new URL(value);
  assert.ok(
    url.protocol === "https:" || url.protocol === "http:",
    `${context} must be an HTTP(S) URL`,
  );
}

function nonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

const [
  profile,
  usRaw,
  cnRaw,
  rolesRaw,
  roleMapping,
  skillsRaw,
  questionsRaw,
] = await Promise.all([
  readJson("data/profile.json"),
  readJson("data/companies.us.json"),
  readJson("data/companies.cn.json"),
  readJson("data/role-families.json"),
  readJson("data/role-mapping.json"),
  readJson("data/skill-graph.json"),
  readJson("data/questions.seed.json"),
]);

assert.ok(profile.id);
assert.ok(nonEmptyArray(profile.priorityRoleFamilies));
assert.ok(nonEmptyArray(profile.criticalGaps));
assert.doesNotMatch(
  JSON.stringify(profile),
  /USC MSECE|Fall 2026|Summer 2027|United States internship|TinyTapeout|Ramulator2|ZU4EV/i,
  "public profile contains private candidate facts",
);

const usCompanies = recordsOf(usRaw, "companies", "data/companies.us.json");
const cnCompanies = recordsOf(cnRaw, "companies", "data/companies.cn.json");
const roles = recordsOf(rolesRaw, "roleFamilies", "data/role-families.json");
const skills = recordsOf(skillsRaw, "skills", "data/skill-graph.json");
const questions = recordsOf(
  questionsRaw,
  "questions",
  "data/questions.seed.json",
);

const minimums = [
  [usCompanies, 150, "US company and institution nodes"],
  [cnCompanies, 180, "China company and institution nodes"],
  [roles, 15, "role families"],
  [skills, 120, "atomic skills"],
  [questions, 200, "interview training tasks"],
];

for (const [records, minimum, label] of minimums) {
  assert.ok(
    records.length >= minimum,
    `${label}: found ${records.length}; expected at least ${minimum}`,
  );
}

for (const [records, path] of [
  [usCompanies, "data/companies.us.json"],
  [cnCompanies, "data/companies.cn.json"],
  [roles, "data/role-families.json"],
  [skills, "data/skill-graph.json"],
  [questions, "data/questions.seed.json"],
]) {
  assertUniqueIds(records, path);
}

const companies = [...usCompanies, ...cnCompanies];
assert.equal(
  new Set(companies.map((company) => company.id)).size,
  companies.length,
  "company ids must also be unique across regions",
);

for (const company of companies) {
  const context = `company ${company.id}`;
  assert.ok(company.name, `${context} has no name`);
  assert.ok(company.country, `${context} has no country`);
  assert.ok(company.companyType, `${context} has no companyType`);
  assert.ok(nonEmptyArray(company.categories), `${context} has no categories`);
  assert.ok(nonEmptyArray(company.focusAreas), `${context} has no focusAreas`);
  assert.ok(nonEmptyArray(company.roleFamilies), `${context} has no roleFamilies`);
  assert.ok(company.whyRelevant, `${context} has no relevance rationale`);
  assert.ok(nonEmptyArray(company.requirements), `${context} has no requirements`);
  assert.ok(nonEmptyArray(company.gaps), `${context} has no candidate-gap analysis`);
  assert.ok(
    nonEmptyArray(company.opportunityTypes),
    `${context} has no opportunityTypes`,
  );
  assertUrl(company.careerUrl, `${context} careerUrl`);
  assert.ok(nonEmptyArray(company.evidence), `${context} has no evidence`);
  for (const [index, evidence] of company.evidence.entries()) {
    assert.ok(evidence.title, `${context} evidence ${index} has no title`);
    assertUrl(evidence.url, `${context} evidence ${index}`);
  }
  assert.match(
    company.lastVerified || "",
    /^\d{4}-\d{2}-\d{2}$/,
    `${context} has an invalid lastVerified date`,
  );
}

const roleIds = new Set(roles.map((role) => role.id));
const skillIds = new Set(skills.map((skill) => skill.id));
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

function mappedRoleIds(company) {
  const searchable = [
    company.companyType,
    ...company.categories,
    ...company.focusAreas,
    ...company.roleFamilies,
  ]
    .join(" ")
    .toLowerCase();
  return roleMapping.rules
    .filter((rule) =>
      rule.keywords.some((keyword) =>
        searchable.includes(String(keyword).toLowerCase()),
      ),
    )
    .map((rule) => rule.roleFamilyId);
}

for (const company of companies) {
  assert.ok(
    mappedRoleIds(company).length > 0,
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
  assert.ok(nonEmptyArray(skill.roleFamilies), `${context} has no role mapping`);
  for (const roleId of skill.roleFamilies) {
    assert.ok(roleIds.has(roleId), `${context} references missing role ${roleId}`);
  }
  for (const prerequisite of skill.prerequisites || []) {
    assert.ok(
      skillIds.has(prerequisite),
      `${context} references missing prerequisite ${prerequisite}`,
    );
    assert.notEqual(prerequisite, skill.id, `${context} is its own prerequisite`);
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

for (const question of questions) {
  const context = `question ${question.id}`;
  assert.ok(question.title, `${context} has no title`);
  assert.match(
    question.contentVersion || "",
    /^\d{4}-\d{2}-\d{2}\.\d+$/,
    `${context} has an invalid contentVersion`,
  );
  assert.ok(question.prompt?.length >= 80, `${context} prompt is too shallow`);
  assert.ok(nonEmptyArray(question.roleFamilies), `${context} has no role mapping`);
  assert.ok(nonEmptyArray(question.skills), `${context} has no skill mapping`);
  assert.ok(nonEmptyArray(question.deliverables), `${context} has no deliverables`);
  assert.ok(question.rubric?.length >= 3, `${context} rubric needs at least 3 items`);
  assert.ok(
    question.commonFailures?.length >= 2,
    `${context} needs at least 2 failure patterns`,
  );
  assert.ok(
    question.followUps?.length >= 1,
    `${context} needs at least 1 follow-up`,
  );
  assert.ok(question.sourcePolicy, `${context} has no source policy`);
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
    (skillId) => skills.find((skill) => skill.id === skillId)?.level === "advanced",
  );
  if (
    ["entry", "foundation"].includes(question.level) &&
    targetsAdvancedSkill
  ) {
    assert.ok(
      question.referenceOutline?.length && question.oracle,
      `${context} introduces an advanced target without explicit scaffolding`,
    );
  }
  assert.ok(
    Number(question.estimatedMinutes) > 0,
    `${context} has invalid estimatedMinutes`,
  );
  for (const roleId of question.roleFamilies) {
    assert.ok(roleIds.has(roleId), `${context} references missing role ${roleId}`);
  }
  for (const skillId of question.skills) {
    assert.ok(skillIds.has(skillId), `${context} references missing skill ${skillId}`);
  }
  for (const [index, source] of (question.sourceRefs || []).entries()) {
    assertUrl(
      typeof source === "string" ? source : source.url,
      `${context} source ${index}`,
    );
  }
  if (question.oracle && typeof question.oracle === "object") {
    assert.ok(question.oracle.kind, `${context} oracle has no kind`);
    assert.ok(
      question.oracle.procedure,
      `${context} oracle has no validation procedure`,
    );
    assert.ok(
      question.oracle.acceptance,
      `${context} oracle has no acceptance condition`,
    );
  }
}

const shortFoundationTasks = questions.filter(
  (question) =>
    question.difficulty === "easy" &&
    ["entry", "foundation"].includes(question.level) &&
    Number(question.estimatedMinutes) <= 15,
);
assert.ok(
  shortFoundationTasks.length >= 45,
  `only ${shortFoundationTasks.length} short foundation tasks; expected at least 45`,
);

for (const roleId of roleIds) {
  const count = questions.filter((question) =>
    question.roleFamilies.includes(roleId),
  ).length;
  assert.ok(count >= 14, `role ${roleId} has only ${count} questions`);
}

const companyTypes = new Set(companies.map((company) => company.companyType));
const categories = new Set(companies.flatMap((company) => company.categories));
const currentJobCount = companies.filter((company) =>
  company.evidence.some(
    (evidence) => evidence.type === "official-current-job",
  ),
).length;
assert.ok(companyTypes.size >= 5, "company universe needs at least 5 organization types");
assert.ok(categories.size >= 15, "company universe needs at least 15 industry categories");

console.log(
  JSON.stringify(
    {
      status: "passed",
      snapshot: profile.evidenceDate,
      coverage: {
        usCompanies: usCompanies.length,
        chinaCompanies: cnCompanies.length,
        organizationTypes: companyTypes.size,
        industryCategories: categories.size,
        canonicalRoleEdges: companies.reduce(
          (total, company) => total + mappedRoleIds(company).length,
          0,
        ),
        currentJobEvidence: currentJobCount,
        roleFamilies: roles.length,
        atomicSkills: skills.length,
        interviewTasks: questions.length,
        shortFoundationTasks: shortFoundationTasks.length,
      },
    },
    null,
    2,
  ),
);

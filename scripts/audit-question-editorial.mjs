import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const bank = JSON.parse(
  await readFile(new URL("data/questions.seed.json", root), "utf8"),
);
const questions = bank.questions || [];

assert.equal(questions.length, 2100, "question bank must contain 2,100 tasks");
assert.equal(
  new Set(questions.map((question) => question.id)).size,
  questions.length,
  "question IDs must be unique",
);

const bannedEditorialNoise =
  /Source scenario|Reference scenario|reference-only quotation|Reviewer procedure|task-specific reference|additional exercise|original task must|generation metadata|public-safe|Use public concepts only|falsifiable acceptance criterion|未披露的厂商行为|保密(?:的)?面试知识/i;
const textFields = [
  "title",
  "titleZh",
  "prompt",
  "promptZh",
  "deliverables",
  "deliverablesZh",
  "rubric",
  "rubricZh",
  "commonFailures",
  "commonFailuresZh",
  "followUps",
  "followUpsZh",
  "referenceOutline",
  "referenceOutlineZh",
];

for (const question of questions) {
  const context = `question ${question.id}`;
  assert.ok(question.title?.trim(), `${context} has no English title`);
  assert.ok(
    /[\u3400-\u9fff]/.test(question.titleZh || ""),
    `${context} has no Chinese title`,
  );
  assert.ok(
    question.prompt.length >= 80 && question.prompt.length <= 900,
    `${context} English prompt must stay between 80 and 900 characters`,
  );
  assert.ok(
    question.promptZh.length >= 45 && question.promptZh.length <= 450,
    `${context} Chinese prompt must stay between 45 and 450 characters`,
  );
  for (const field of textFields) {
    const values = Array.isArray(question[field])
      ? question[field]
      : [question[field]];
    for (const value of values) {
      assert.doesNotMatch(
        String(value || ""),
        bannedEditorialNoise,
        `${context}.${field} exposes editorial or generator chatter`,
      );
    }
  }
  for (const oracleField of ["oracle", "oracleZh"]) {
    assert.doesNotMatch(
      `${question[oracleField].procedure} ${question[oracleField].acceptance}`,
      bannedEditorialNoise,
      `${context}.${oracleField} exposes editorial or generator chatter`,
    );
  }
  for (const [englishField, chineseField, minimum, maximum] of [
    ["deliverables", "deliverablesZh", 1, 3],
    ["rubric", "rubricZh", 3, 4],
    ["commonFailures", "commonFailuresZh", 2, 3],
    ["followUps", "followUpsZh", 1, 2],
    ["referenceOutline", "referenceOutlineZh", 3, 4],
  ]) {
    assert.equal(
      question[englishField].length,
      question[chineseField].length,
      `${context} ${englishField}/${chineseField} must be parallel`,
    );
    assert.ok(
      question[englishField].length >= minimum &&
        question[englishField].length <= maximum,
      `${context}.${englishField} must contain ${minimum}-${maximum} focused items`,
    );
  }
  assert.match(
    question.contentVersion,
    /^2026-07-27\.\d+$/,
    `${context} did not pass the current editorial version`,
  );
}

const promptKeys = questions.map(
  (question) =>
    `${question.roleFamilies[0]}|${question.prompt
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()}`,
);
assert.equal(
  new Set(promptKeys).size,
  promptKeys.length,
  "no two questions in the same role may have an identical English prompt",
);

const communityGold = new Map([
  ["q2-dv-004", "Static vs Automatic Task Race"],
  ["q2-dv-030", "Tagged Two-Stream Scoreboard"],
  ["q2-dv-048", "Deterministic Coverage Triage Tool"],
  ["q2-dv-066", "Reachability-Checked Formal Proof"],
  ["q2-dv-111", "Bitfield Event Decoder for DV"],
]);
for (const [questionId, title] of communityGold) {
  const question = questions.find((candidate) => candidate.id === questionId);
  assert.equal(question?.title, title, `${questionId} lost its reviewed title`);
  assert.ok(
    question.sourceRefs.some((source) =>
      String(typeof source === "string" ? source : source.url).includes(
        "xiaohongshu.com/explore/",
      ),
    ),
    `${questionId} lost its public community-topic provenance`,
  );
  assert.match(
    question.blueprintId,
    /^community-signal-original-v1\//,
    `${questionId} is not labeled as an original community-signal task`,
  );
}

const promptLengths = questions
  .map((question) => question.prompt.length)
  .sort((left, right) => left - right);
const percentile = (fraction) =>
  promptLengths[Math.floor((promptLengths.length - 1) * fraction)];

console.log(
  JSON.stringify(
    {
      status: "passed",
      questionsReviewed: questions.length,
      bilingualQuestions: questions.filter(
        (question) =>
          question.promptZh && /[\u3400-\u9fff]/.test(question.promptZh),
      ).length,
      communitySignalOriginals: communityGold.size,
      englishPromptLength: {
        p50: percentile(0.5),
        p90: percentile(0.9),
        max: promptLengths.at(-1),
      },
      bannedEditorialNoiseMatches: 0,
    },
    null,
    2,
  ),
);

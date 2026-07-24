import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildCandidateProfileDisplay } from "../shared/profile-display.js";

const root = new URL("../", import.meta.url);

async function publicProfile() {
  return JSON.parse(await readFile(new URL("data/profile.json", root), "utf8"));
}

function renderedText(value) {
  return value.lines.map((line) => line.text);
}

test("legacy single-language private fields remain intact without invented translations", async () => {
  const fallback = await publicProfile();
  const legacy = {
    id: "synthetic-compatibility-fixture",
    evidenceDate: "2098-01-02",
    targetWindow: "Ten years from now",
    education: {
      program: "Marine biology doctorate",
      start: "A distant semester",
      status: "synthetic",
      workAuthorization: "STATUS-X",
    },
    positioning: "A deliberately unrelated synthetic positioning statement.",
    strengths: ["Synthetic strength alpha", "Synthetic strength beta"],
    priorityRoleFamilies: ["rf-synthetic"],
    criticalGaps: [
      "Synthetic gap alpha",
      "Synthetic gap beta",
      "Synthetic gap gamma",
    ],
    readinessByRole: { "rf-synthetic": 17 },
  };

  const display = buildCandidateProfileDisplay(legacy, fallback);

  assert.deepEqual(renderedText(display.targetWindow), [legacy.targetWindow]);
  assert.deepEqual(renderedText(display.program), [legacy.education.program]);
  assert.deepEqual(renderedText(display.positioning), [legacy.positioning]);
  assert.deepEqual(
    display.criticalGaps.flatMap(renderedText),
    legacy.criticalGaps,
  );
  assert.equal(display.criticalGaps.length, legacy.criticalGaps.length);
  assert.ok(
    display.criticalGaps.every((value) =>
      value.lines.every((line) => line.lang === "en"),
    ),
  );
  assert.ok(
    !display.criticalGaps
      .flatMap(renderedText)
      .some((value) => fallback.criticalGaps.includes(value)),
  );
});

test("reviewed bilingual fields preserve their explicit pairings", async () => {
  const fallback = await publicProfile();
  const reviewed = {
    ...fallback,
    targetWindow: "虚构窗口",
    targetWindowEn: "Synthetic window",
    criticalGaps: ["虚构缺口甲", "虚构缺口乙"],
    criticalGapsEn: ["Synthetic gap A", "Synthetic gap B"],
  };

  const display = buildCandidateProfileDisplay(reviewed, fallback);

  assert.deepEqual(renderedText(display.targetWindow), [
    reviewed.targetWindow,
    reviewed.targetWindowEn,
  ]);
  assert.deepEqual(display.criticalGaps.map(renderedText), [
    [reviewed.criticalGaps[0], reviewed.criticalGapsEn[0]],
    [reviewed.criticalGaps[1], reviewed.criticalGapsEn[1]],
  ]);
});

test("an explicit empty private list stays empty", async () => {
  const fallback = await publicProfile();
  const privateProfile = {
    ...fallback,
    criticalGaps: [],
    criticalGapsEn: [],
  };

  const display = buildCandidateProfileDisplay(privateProfile, fallback);

  assert.deepEqual(display.criticalGaps, []);
});

test("an explicit empty private scalar is not replaced with public copy", async () => {
  const fallback = await publicProfile();
  const privateProfile = {
    ...fallback,
    positioning: "",
    positioningEn: "",
  };

  const display = buildCandidateProfileDisplay(privateProfile, fallback);

  assert.deepEqual(display.positioning.lines, []);
});

test("the mission UI has no untranslated-profile placeholder copy", async () => {
  const source = await readFile(new URL("app/CareerDojoApp.tsx", root), "utf8");

  assert.doesNotMatch(
    source,
    /English (?:positioning statement|translation) not configured/i,
  );
  assert.match(source, /buildCandidateProfileDisplay/);
});

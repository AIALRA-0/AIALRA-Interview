import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cssUrl = new URL("../app/globals.css", import.meta.url);
const appUrl = new URL("../app/CareerDojoApp.tsx", import.meta.url);

test("the primary interface palette contains only neutral color literals", async () => {
  const css = await readFile(cssUrl, "utf8");

  for (const match of css.matchAll(/#([0-9a-f]{3}|[0-9a-f]{6})\b/gi)) {
    const normalized =
      match[1].length === 3
        ? [...match[1]].map((character) => character.repeat(2)).join("")
        : match[1];
    const channels = [
      normalized.slice(0, 2),
      normalized.slice(2, 4),
      normalized.slice(4, 6),
    ].map((value) => Number.parseInt(value, 16));
    assert.equal(
      new Set(channels).size,
      1,
      `${match[0]} must remain a neutral gray`,
    );
  }

  for (const match of css.matchAll(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi,
  )) {
    assert.equal(
      new Set(match.slice(1, 4).map(Number)).size,
      1,
      `${match[0]} must remain a neutral gray`,
    );
  }
});

test("the precise job, compensation, training, and editor layouts stay present", async () => {
  const [css, app] = await Promise.all([
    readFile(cssUrl, "utf8"),
    readFile(appUrl, "utf8"),
  ]);

  for (const selector of [
    ".current-job-grid",
    ".current-job-target-grid",
    ".position-compensation-card",
    ".specific-position-grid",
    ".equivalence-panel",
    ".pay-method-primer-grid",
    ".training-protocol-grid",
    ".application-editor-grid",
  ]) {
    assert.match(css, new RegExp(selector.replaceAll(".", "\\.")));
  }
  assert.match(app, /具体职位薪资对照 \/ Specific-position pay/);
  assert.match(app, /两侧各用独立证据|两个独立来源/);
  assert.match(app, /P25、P50、P75 是什么？/);
  assert.match(app, /JD 证据编译器/);
  assert.match(app, /完整岗位档案 \/ Full requisition profile/);
});

test("plain bilingual prompts use the full language-panel width", async () => {
  const [css, app] = await Promise.all([
    readFile(cssUrl, "utf8"),
    readFile(appUrl, "utf8"),
  ]);

  assert.match(
    app,
    /className={`prompt-section\${match \? "" : " prompt-section-plain"}`}/,
    "prompts without a Background/Task label need a distinct full-width layout",
  );
  assert.match(
    css,
    /\.prompt-section-plain\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
  );
  assert.match(
    css,
    /\.prompt-section-plain p\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s,
  );
});

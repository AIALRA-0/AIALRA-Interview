import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repositoryRoot = new URL("../", import.meta.url);
const require = createRequire(import.meta.url);

async function json(path) {
  return JSON.parse(
    await readFile(new URL(path, repositoryRoot), "utf8"),
  );
}

function versionAtLeast(actual, minimum) {
  const actualParts = actual.split(".").map(Number);
  const minimumParts = minimum.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    if (actualParts[index] !== minimumParts[index]) {
      return actualParts[index] > minimumParts[index];
    }
  }

  return true;
}

test("the minimatch 3 bridge preserves the callable ESLint plugin API", () => {
  const minimatch = require("minimatch");

  assert.equal(typeof minimatch, "function");
  assert.equal(typeof minimatch.Minimatch, "function");
  assert.equal(typeof minimatch.braceExpand, "function");
  assert.equal(minimatch("src/example.test.mjs", "**/*.test.mjs"), true);
  assert.equal(
    new minimatch.Minimatch("src/**/*.ts").match("src/example.ts"),
    true,
  );
  assert.deepEqual(minimatch.braceExpand("{src,test}/**/*.{ts,mjs}"), [
    "src/**/*.ts",
    "src/**/*.mjs",
    "test/**/*.ts",
    "test/**/*.mjs",
  ]);
});

test("every legacy lint consumer resolves the working root bridge", () => {
  const consumers = [
    "eslint",
    "eslint-plugin-import",
    "eslint-plugin-jsx-a11y",
    "eslint-plugin-react",
    "@eslint/config-array",
    "@eslint/eslintrc",
  ];

  for (const consumer of consumers) {
    const consumerRequire = createRequire(
      new URL(`../node_modules/${consumer}/package.json`, import.meta.url),
    );
    const minimatch = consumerRequire("minimatch");

    assert.equal(
      typeof minimatch,
      "function",
      `${consumer} must resolve the callable bridge`,
    );
    assert.equal(minimatch("src/example.ts", "src/**/*.ts"), true);
  }
});

test("the lockfile keeps security-patched React and brace expansion floors", async () => {
  const [manifest, lockfile] = await Promise.all([
    json("package.json"),
    json("package-lock.json"),
  ]);

  const minimumVersions = {
    next: "16.2.12",
    react: "19.2.8",
    "react-dom": "19.2.8",
    "react-server-dom-webpack": "19.2.8",
  };

  for (const [name, minimum] of Object.entries(minimumVersions)) {
    const packageEntry = lockfile.packages[`node_modules/${name}`];

    assert.ok(packageEntry, `${name} must remain present in the lockfile`);
    assert.ok(
      versionAtLeast(packageEntry.version, minimum),
      `${name}@${packageEntry.version} is below the audited floor ${minimum}`,
    );
  }

  assert.equal(
    manifest.devDependencies.minimatch,
    "file:vendor/minimatch3-safe",
  );
  assert.equal(
    lockfile.packages["node_modules/minimatch"].resolved,
    "vendor/minimatch3-safe",
  );
  assert.equal(lockfile.packages["node_modules/minimatch"].link, true);

  const localMinimatchLinks = Object.entries(lockfile.packages).filter(
    ([path, packageEntry]) =>
      path.endsWith("node_modules/minimatch") && packageEntry.link === true,
  );
  assert.deepEqual(
    localMinimatchLinks.map(([path]) => path),
    ["node_modules/minimatch"],
    "nested local links resolve relative to the wrong consumer directory",
  );

  const braceExpansionEntries = Object.entries(lockfile.packages).filter(
    ([path]) => path.endsWith("node_modules/brace-expansion"),
  );

  assert.ok(braceExpansionEntries.length > 0);
  for (const [path, packageEntry] of braceExpansionEntries) {
    assert.ok(
      versionAtLeast(packageEntry.version, "5.0.8"),
      `${path}@${packageEntry.version} reintroduces the vulnerable implementation`,
    );
  }
});

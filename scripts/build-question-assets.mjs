import { createHash } from "node:crypto";
import { readdir, readFile, rm, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const sourcePath = join(projectRoot, "data/questions.seed.json");
const outputDir = join(projectRoot, "public/question-bank");
const checkOnly = process.argv.includes("--check");
const assetSchemaVersion = "2.0.0";
const previewLength = 160;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compactJson(value) {
  return `${JSON.stringify(value)}\n`;
}

function preview(value) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  const characters = Array.from(normalized);
  if (characters.length <= previewLength) return normalized;
  return `${characters.slice(0, previewLength - 1).join("").trimEnd()}…`;
}

function shardIdFor(questionId) {
  return sha256(questionId).slice(0, 2);
}

function publishedQuestionFor(question) {
  const published = {
    id: question.id,
    title: question.title,
    titleZh: question.titleZh,
    roleFamilies: question.roleFamilies,
    skills: question.skills,
    level: question.level,
    difficulty: question.difficulty,
    type: question.type,
    prompt: question.prompt,
    promptZh: question.promptZh,
    deliverables: question.deliverables,
    deliverablesZh: question.deliverablesZh,
    rubric: question.rubric,
    rubricZh: question.rubricZh,
    commonFailures: question.commonFailures,
    commonFailuresZh: question.commonFailuresZh,
    followUps: question.followUps,
    followUpsZh: question.followUpsZh,
    sourcePolicy: question.sourcePolicy,
    sourceRefs: question.sourceRefs,
    estimatedMinutes: question.estimatedMinutes,
    evidenceDate: question.evidenceDate,
    status: question.status,
    referenceOutline: question.referenceOutline,
    referenceOutlineZh: question.referenceOutlineZh,
    oracle: question.oracle,
    oracleZh: question.oracleZh,
    blueprintId: question.blueprintId,
    contentVersion: question.contentVersion,
  };
  if (Array.isArray(question.prerequisiteSkills)) {
    published.prerequisiteSkills = question.prerequisiteSkills;
  }
  return published;
}

function summaryFor(question) {
  const summary = {
    id: question.id,
    title: question.title,
    titleZh: question.titleZh || "",
    roleFamilies: question.roleFamilies,
    skills: question.skills,
    level: question.level,
    difficulty: question.difficulty,
    type: question.type,
    promptPreview: preview(question.prompt),
    promptPreviewZh: preview(question.promptZh),
    estimatedMinutes: question.estimatedMinutes,
    status: question.status,
    contentVersion: question.contentVersion,
    shardId: shardIdFor(question.id),
  };
  if (question.blueprintId) summary.blueprintId = question.blueprintId;
  return summary;
}

async function buildExpectedFiles() {
  const sourceText = await readFile(sourcePath, "utf8");
  const source = JSON.parse(sourceText);
  if (!Array.isArray(source.questions) || source.questions.length === 0) {
    throw new Error("data/questions.seed.json must contain a non-empty questions array");
  }

  const ids = new Set();
  const shards = new Map();
  for (const question of source.questions) {
    if (!question?.id || typeof question.id !== "string") {
      throw new Error("Every question must have a string id");
    }
    if (ids.has(question.id)) {
      throw new Error(`Duplicate question id: ${question.id}`);
    }
    ids.add(question.id);
    const shardId = shardIdFor(question.id);
    const entries = shards.get(shardId) || [];
    entries.push(publishedQuestionFor(question));
    shards.set(shardId, entries);
  }

  const sourceSha256 = sha256(sourceText);
  const assetVersion = sha256(
    `${assetSchemaVersion}:${previewLength}:${sourceSha256}`,
  ).slice(0, 16);
  const summaries = source.questions.map(summaryFor);
  const files = new Map();
  const index = {
    schemaVersion: assetSchemaVersion,
    assetVersion,
    sourceSha256,
    questionCount: summaries.length,
    previewLength,
    questions: summaries,
  };
  const indexContent = compactJson(index);
  files.set("index.json", indexContent);

  const shardManifest = [];
  for (const shardId of [...shards.keys()].sort()) {
    const questions = shards
      .get(shardId)
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id));
    const shardContent = compactJson({
      schemaVersion: assetSchemaVersion,
      assetVersion,
      shardId,
      questionCount: questions.length,
      questions,
    });
    const path = `shards/${shardId}.json`;
    files.set(path, shardContent);
    shardManifest.push({
      id: shardId,
      path,
      questionCount: questions.length,
      sha256: sha256(shardContent),
      bytes: Buffer.byteLength(shardContent),
    });
  }

  const manifest = {
    schemaVersion: assetSchemaVersion,
    assetVersion,
    source: "data/questions.seed.json",
    sourceSha256,
    evidenceDate: source.evidenceDate || "",
    bankStatus: source.status || "",
    questionCount: source.questions.length,
    shardCount: shardManifest.length,
    previewLength,
    index: {
      path: "index.json",
      sha256: sha256(indexContent),
      bytes: Buffer.byteLength(indexContent),
    },
    shardStrategy: "sha256(question.id)[0:2]",
    detailPathTemplate: "shards/{shardId}.json",
    shards: shardManifest,
  };
  files.set("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);

  return {
    files,
    metrics: {
      sourceBytes: Buffer.byteLength(sourceText),
      indexBytes: Buffer.byteLength(indexContent),
      shardBytes: shardManifest.reduce((total, shard) => total + shard.bytes, 0),
      maxShardBytes: Math.max(...shardManifest.map((shard) => shard.bytes)),
      questionCount: source.questions.length,
      shardCount: shardManifest.length,
    },
  };
}

async function listFiles(directory) {
  const files = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) files.push(relative(directory, path).split(sep).join("/"));
    }
  }
  try {
    await visit(directory);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return files.sort();
}

async function checkFiles(expected) {
  const actualPaths = await listFiles(outputDir);
  const expectedPaths = [...expected.keys()].sort();
  const problems = [];
  for (const path of expectedPaths) {
    try {
      const actual = await readFile(join(outputDir, path), "utf8");
      if (actual !== expected.get(path)) problems.push(`changed: ${path}`);
    } catch (error) {
      if (error?.code === "ENOENT") problems.push(`missing: ${path}`);
      else throw error;
    }
  }
  for (const path of actualPaths) {
    if (!expected.has(path)) problems.push(`stale: ${path}`);
  }
  if (problems.length) {
    throw new Error(
      `Question assets are out of sync. Run npm run questions:build.\n${problems
        .slice(0, 20)
        .join("\n")}${problems.length > 20 ? `\n…and ${problems.length - 20} more` : ""}`,
    );
  }
}

async function writeFiles(files) {
  const expectedSuffix = ["public", "question-bank"].join(sep);
  if (!resolve(outputDir).endsWith(expectedSuffix)) {
    throw new Error(`Refusing to replace unexpected output directory: ${outputDir}`);
  }
  await rm(outputDir, { recursive: true, force: true });
  for (const [path, content] of files) {
    const target = join(outputDir, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }
}

const { files, metrics } = await buildExpectedFiles();
if (checkOnly) await checkFiles(files);
else await writeFiles(files);

const ratio = ((metrics.indexBytes / metrics.sourceBytes) * 100).toFixed(1);
console.log(
  `${checkOnly ? "Verified" : "Built"} ${metrics.questionCount} question summaries and ${metrics.shardCount} deterministic shards.`,
);
console.log(
  `Source ${metrics.sourceBytes} B → initial index ${metrics.indexBytes} B (${ratio}%); detail shards ${metrics.shardBytes} B total, ${metrics.maxShardBytes} B max.`,
);

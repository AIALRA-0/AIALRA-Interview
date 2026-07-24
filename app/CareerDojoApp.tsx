"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import categoryLabelsEnRaw from "../data/organization-category-labels.en.json";
import categoryLabelsZhRaw from "../data/organization-category-labels.zh.json";
import organizationLabelsRaw from "../data/organization-labels.json";
import type {
  ApplicationRecord,
  Company,
  InterviewQuestion,
  InterviewQuestionSummary,
  PersistedState,
  Profile,
  QuestionBankBootstrap,
  QuestionBankIndex,
  QuestionBankShard,
  QuestionOracle,
  RoleFamily,
  SkillNode,
} from "./types";

type ViewId =
  | "mission"
  | "atlas"
  | "roles"
  | "dojo"
  | "applications"
  | "evidence";

type AtlasLayout = "tree" | "cards";
type QuestionLanguageMode = "bilingual" | "zh-first" | "en-first";
type QuestionIndexState = "loading" | "ready" | "error";
type QuestionDetailState = "idle" | "loading" | "ready" | "error";

type AppProps = {
  companies: Company[];
  roles: RoleFamily[];
  skills: SkillNode[];
  questionBank: QuestionBankBootstrap;
  profile: Profile;
};

type ApplicationDraft = {
  roleTitle: string;
  employmentType: string;
  jobUrl: string;
  deadline: string;
  sponsorshipSignal: string;
  exportSignal: string;
  contact: string;
  resumeVersion: string;
  jdKeywords: string;
  sourceObservedAt: string;
  matchScore: number;
  notes: string;
};

const emptyApplicationDraft: ApplicationDraft = {
  roleTitle: "",
  employmentType: "internship",
  jobUrl: "",
  deadline: "",
  sponsorshipSignal: "unknown",
  exportSignal: "unknown",
  contact: "",
  resumeVersion: "",
  jdKeywords: "",
  sourceObservedAt: "",
  matchScore: 0,
  notes: "",
};

const emptyState: PersistedState = {
  applications: [],
  bookmarks: [],
  skillProgress: [],
  questionAttempts: [],
  questionStats: [],
  preferences: {},
};

function normalizePersistedState(
  value: Partial<PersistedState> | null | undefined,
): PersistedState {
  return {
    applications: Array.isArray(value?.applications)
      ? value.applications
      : [],
    bookmarks: Array.isArray(value?.bookmarks) ? value.bookmarks : [],
    skillProgress: Array.isArray(value?.skillProgress)
      ? value.skillProgress
      : [],
    questionAttempts: Array.isArray(value?.questionAttempts)
      ? value.questionAttempts
      : [],
    questionStats: Array.isArray(value?.questionStats)
      ? value.questionStats
      : [],
    preferences:
      value?.preferences &&
      typeof value.preferences === "object" &&
      !Array.isArray(value.preferences)
        ? value.preferences
        : {},
  };
}

const views: Array<{ id: ViewId; label: string; short: string }> = [
  { id: "mission", label: "任务总览", short: "总览" },
  { id: "atlas", label: "公司宇宙", short: "公司" },
  { id: "roles", label: "岗位与能力", short: "岗位" },
  { id: "dojo", label: "Interview Dojo", short: "训练" },
  { id: "applications", label: "投递作战室", short: "投递" },
  { id: "evidence", label: "证据与覆盖", short: "证据" },
];

const applicationStages = [
  ["researching", "调研中"],
  ["ready", "准备投递"],
  ["applied", "已投递"],
  ["oa", "OA"],
  ["interview", "面试"],
  ["offer", "Offer"],
  ["closed", "关闭"],
] as const;

const regionLabels = organizationLabelsRaw.regionGroups;
const companyTypeLabels = organizationLabelsRaw.companyTypes as Record<
  string,
  { zh: string; en: string }
>;
const categoryLabels = {
  ...categoryLabelsEnRaw.labels,
  ...categoryLabelsZhRaw.labels,
} as Record<string, { zh: string; en: string }>;

function regionOf(company: Company): "US" | "CN" | "Global" {
  return company.opportunityMarket;
}

function regionLabel(region: "US" | "CN" | "Global") {
  const label = regionLabels[region];
  return `${label.zh} / ${label.en}`;
}

function companyTypeLabel(companyType: string) {
  const label = companyTypeLabels[companyType];
  if (!label) return "未分类 / Unclassified";
  return `${label.zh} / ${label.en}`;
}

function categoryLabel(category: string) {
  const label = categoryLabels[category];
  if (!label) return "未分类 / Unclassified";
  return `${label.zh} / ${label.en}`;
}

function canonicalCategoryId(category: string) {
  const label = categoryLabels[category];
  return (label?.en || category)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\-–—_/（）()，,：:·.]/g, "");
}

function BilingualNodeLabel({
  label,
}: {
  label: { zh: string; en: string };
}) {
  return (
    <span className="bilingual-node-label">
      <span lang="zh-CN">{label.zh}</span>
      <span lang="en">{label.en}</span>
    </span>
  );
}

function companyName(company: Company) {
  return company.nameZh
    ? `${company.nameZh} / ${company.nameEn}`
    : company.nameEn;
}

function CompanyName({ company }: { company: Company }) {
  return (
    <span className="bilingual-organization-name">
      <span lang={company.nameZh ? "zh-CN" : "en"} className="organization-name-primary">
        {company.nameZh || company.nameEn}
      </span>
      {company.nameZh ? (
        <span lang="en" className="organization-name-secondary">
          {company.nameEn}
        </span>
      ) : null}
    </span>
  );
}

function signalKey(signal: string): "green" | "yellow" | "orange" | "red" | "unknown" {
  const value = signal.toLowerCase();
  if (value.includes("green") || value.includes("friendly")) return "green";
  if (value.includes("yellow") || value.includes("mixed")) return "yellow";
  if (value.includes("orange") || value.includes("export")) return "orange";
  if (value.includes("red") || value.includes("restricted")) return "red";
  return "unknown";
}

function confidenceLabel(value: string) {
  const normalized = String(value).toLowerCase();
  if (normalized.includes("high") || normalized.includes("高")) return "高置信";
  if (normalized.includes("medium") || normalized.includes("中")) return "中置信";
  if (normalized.includes("low") || normalized.includes("低")) return "待核验";
  return value || "待核验";
}

function signalLabel(signal: string) {
  const key = signalKey(signal);
  return key === "green"
    ? "可投初筛 / Initial fit"
    : key === "yellow"
      ? "赞助待核 / Sponsorship check"
      : key === "orange"
        ? "出口复核 / Export review"
        : key === "red"
          ? "硬门槛 / Restricted"
          : "待核验 / Unverified";
}

function fitRank(value: string) {
  const normalized = String(value).toUpperCase();
  if (normalized === "P0" || normalized.includes("S") || normalized === "1") {
    return 0;
  }
  if (normalized === "P1" || normalized.includes("A") || normalized === "2") {
    return 1;
  }
  if (normalized === "P2" || normalized.includes("B") || normalized === "3") {
    return 2;
  }
  return 3;
}

function skillName(skill: SkillNode) {
  return skill.titleZh || skill.nameZh || skill.title || skill.name || skill.id;
}

function sourceUrl(source: string | { url?: string }) {
  return typeof source === "string" ? source : source.url || "";
}

function sourceTitle(
  source: string | { title?: string; url?: string },
  index: number,
) {
  if (typeof source !== "string" && source.title?.trim()) {
    return source.title.trim();
  }
  const url = sourceUrl(source);
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return `公开依据 ${String(index + 1).padStart(2, "0")} · ${hostname}`;
  } catch {
    return `公开依据 ${String(index + 1).padStart(2, "0")} / Source ${index + 1}`;
  }
}

const languageModeOptions: Array<{
  id: QuestionLanguageMode;
  label: string;
  description: string;
}> = [
  {
    id: "bilingual",
    label: "中英对照",
    description: "Chinese and English side by side",
  },
  {
    id: "zh-first",
    label: "中文优先",
    description: "Chinese first, English retained",
  },
  {
    id: "en-first",
    label: "English first",
    description: "English first, Chinese retained",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const questionIndexKeys = new Set([
  "schemaVersion",
  "assetVersion",
  "sourceSha256",
  "questionCount",
  "previewLength",
  "questions",
]);
const questionSummaryKeys = new Set([
  "id",
  "title",
  "titleZh",
  "roleFamilies",
  "skills",
  "level",
  "difficulty",
  "type",
  "promptPreview",
  "promptPreviewZh",
  "estimatedMinutes",
  "status",
  "contentVersion",
  "shardId",
  "blueprintId",
]);
const questionShardKeys = new Set([
  "schemaVersion",
  "assetVersion",
  "shardId",
  "questionCount",
  "questions",
]);
const publishedQuestionKeys = new Set([
  "id",
  "title",
  "titleZh",
  "roleFamilies",
  "skills",
  "prerequisiteSkills",
  "level",
  "difficulty",
  "type",
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
  "sourcePolicy",
  "sourceRefs",
  "estimatedMinutes",
  "evidenceDate",
  "status",
  "referenceOutline",
  "referenceOutlineZh",
  "oracle",
  "oracleZh",
  "blueprintId",
  "contentVersion",
]);

function hasOnlyKeys(value: Record<string, unknown>, allowed: Set<string>) {
  return Object.keys(value).every((key) => allowed.has(key));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(isNonEmptyString)
  );
}

function isEvidenceRef(value: unknown) {
  if (isNonEmptyString(value)) return true;
  if (!isRecord(value)) return false;
  const allowed = new Set(["title", "url", "type", "observedAt"]);
  return (
    hasOnlyKeys(value, allowed) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.url) &&
    (value.type === undefined || typeof value.type === "string") &&
    (value.observedAt === undefined || typeof value.observedAt === "string")
  );
}

function isQuestionOracle(value: unknown): value is QuestionOracle {
  if (isNonEmptyString(value)) return true;
  return (
    isRecord(value) &&
    hasOnlyKeys(value, new Set(["kind", "procedure", "acceptance"])) &&
    isNonEmptyString(value.kind) &&
    isNonEmptyString(value.procedure) &&
    isNonEmptyString(value.acceptance)
  );
}

function arraysEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((item, index) => item === right[index])
  );
}

function previewText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const characters = Array.from(normalized);
  if (characters.length <= maxLength) return normalized;
  return `${characters.slice(0, maxLength - 1).join("").trimEnd()}…`;
}

async function sha256Hex(value: string) {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "当前浏览器不支持题库完整性校验 / This browser cannot verify question-bank integrity.",
    );
  }
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function parseVerifiedJson(
  response: Response,
  expectedSha256: string,
  label: string,
): Promise<unknown> {
  if (!/^[0-9a-f]{64}$/.test(expectedSha256)) {
    throw new Error(`${label} 缺少可信摘要 / ${label} has no trusted digest.`);
  }
  const rawText = await response.text();
  const actualSha256 = await sha256Hex(rawText);
  if (actualSha256 !== expectedSha256) {
    throw new Error(
      `${label} 完整性校验失败 / ${label} failed its integrity check.`,
    );
  }
  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    throw new Error(`${label} JSON 无效 / ${label} contains invalid JSON.`);
  }
}

function validateQuestionBankIndex(
  value: unknown,
  expected: QuestionBankBootstrap,
): QuestionBankIndex {
  if (!isRecord(value) || !hasOnlyKeys(value, questionIndexKeys)) {
    throw new Error("题库索引格式无效 / Invalid question index payload.");
  }
  if (value.schemaVersion !== expected.schemaVersion) {
    throw new Error(
      "题库索引结构版本不匹配 / Question index schema version mismatch.",
    );
  }
  if (value.assetVersion !== expected.assetVersion) {
    throw new Error(
      "题库资源版本不匹配 / Question bank asset version mismatch.",
    );
  }
  if (
    value.sourceSha256 !== expected.sourceSha256 ||
    value.previewLength !== expected.previewLength
  ) {
    throw new Error(
      "题库索引来源或预览契约不匹配 / Question index source or preview contract mismatch.",
    );
  }
  if (
    value.questionCount !== expected.questionCount ||
    !Array.isArray(value.questions) ||
    value.questions.length !== expected.questionCount
  ) {
    throw new Error(
      "题库索引数量不匹配 / Question index count mismatch.",
    );
  }
  if (
    !/^[0-9a-f]{64}$/.test(value.sourceSha256 as string) ||
    typeof value.previewLength !== "number" ||
    !Number.isInteger(value.previewLength) ||
    value.previewLength < 80 ||
    value.previewLength > 320
  ) {
    throw new Error(
      "题库索引元数据无效 / Invalid question index metadata.",
    );
  }

  const seen = new Set<string>();
  for (const summary of value.questions) {
    if (
      !isRecord(summary) ||
      !hasOnlyKeys(summary, questionSummaryKeys) ||
      typeof summary.id !== "string" ||
      !summary.id ||
      seen.has(summary.id) ||
      !isNonEmptyString(summary.title) ||
      !isNonEmptyString(summary.titleZh) ||
      !isNonEmptyStringArray(summary.roleFamilies) ||
      !isNonEmptyStringArray(summary.skills) ||
      !isNonEmptyString(summary.level) ||
      !isNonEmptyString(summary.difficulty) ||
      !isNonEmptyString(summary.type) ||
      !isNonEmptyString(summary.promptPreview) ||
      !isNonEmptyString(summary.promptPreviewZh) ||
      Array.from(summary.promptPreview as string).length >
        (value.previewLength as number) ||
      Array.from(summary.promptPreviewZh as string).length >
        (value.previewLength as number) ||
      typeof summary.estimatedMinutes !== "number" ||
      !Number.isFinite(summary.estimatedMinutes as number) ||
      (summary.estimatedMinutes as number) <= 0 ||
      !isNonEmptyString(summary.status) ||
      !isNonEmptyString(summary.contentVersion) ||
      typeof summary.shardId !== "string" ||
      !/^[0-9a-f]{2}$/.test(summary.shardId) ||
      !/^[0-9a-f]{64}$/.test(
        expected.shardSha256ById[summary.shardId] || "",
      ) ||
      (summary.blueprintId !== undefined &&
        !isNonEmptyString(summary.blueprintId))
    ) {
      throw new Error(
        "题目摘要结构无效或 ID 重复 / Invalid or duplicate question summary.",
      );
    }
    seen.add(summary.id);
  }

  return value as unknown as QuestionBankIndex;
}

function assertPublishedQuestion(
  value: unknown,
): asserts value is InterviewQuestion {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, publishedQuestionKeys) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.titleZh) ||
    !isNonEmptyStringArray(value.roleFamilies) ||
    !isNonEmptyStringArray(value.skills) ||
    (value.prerequisiteSkills !== undefined &&
      (!Array.isArray(value.prerequisiteSkills) ||
        !value.prerequisiteSkills.every(isNonEmptyString))) ||
    !isNonEmptyString(value.level) ||
    !isNonEmptyString(value.difficulty) ||
    !isNonEmptyString(value.type) ||
    !isNonEmptyString(value.prompt) ||
    !isNonEmptyString(value.promptZh) ||
    !isNonEmptyStringArray(value.deliverables) ||
    !isNonEmptyStringArray(value.deliverablesZh) ||
    !isNonEmptyStringArray(value.rubric) ||
    !isNonEmptyStringArray(value.rubricZh) ||
    !isNonEmptyStringArray(value.commonFailures) ||
    !isNonEmptyStringArray(value.commonFailuresZh) ||
    !isNonEmptyStringArray(value.followUps) ||
    !isNonEmptyStringArray(value.followUpsZh) ||
    !isNonEmptyString(value.sourcePolicy) ||
    !Array.isArray(value.sourceRefs) ||
    value.sourceRefs.length === 0 ||
    !value.sourceRefs.every(isEvidenceRef) ||
    typeof value.estimatedMinutes !== "number" ||
    !Number.isFinite(value.estimatedMinutes) ||
    value.estimatedMinutes <= 0 ||
    !isNonEmptyString(value.evidenceDate) ||
    !isNonEmptyString(value.status) ||
    !isNonEmptyStringArray(value.referenceOutline) ||
    !isNonEmptyStringArray(value.referenceOutlineZh) ||
    !isQuestionOracle(value.oracle) ||
    !isQuestionOracle(value.oracleZh) ||
    !isNonEmptyString(value.blueprintId) ||
    !isNonEmptyString(value.contentVersion)
  ) {
    throw new Error(
      "题目详情结构无效或含未发布字段 / Invalid detail or unpublished fields present.",
    );
  }
}

async function validateQuestionBankShard(
  value: unknown,
  expected: QuestionBankBootstrap,
  expectedShardId: string,
  index: QuestionBankIndex,
): Promise<QuestionBankShard> {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, questionShardKeys) ||
    value.schemaVersion !== expected.schemaVersion ||
    value.assetVersion !== expected.assetVersion ||
    value.shardId !== expectedShardId ||
    !Array.isArray(value.questions) ||
    value.questionCount !== value.questions.length
  ) {
    throw new Error("题目分片版本或结构不匹配");
  }

  const summaries = new Map(
    index.questions.map((summary) => [summary.id, summary]),
  );
  const expectedIds = new Set(
    index.questions
      .filter((summary) => summary.shardId === expectedShardId)
      .map((summary) => summary.id),
  );
  if (
    value.questions.length !== expectedIds.size ||
    value.questions.length === 0
  ) {
    throw new Error("题目分片数量与已验证索引不匹配");
  }

  const seen = new Set<string>();
  for (const candidate of value.questions) {
    assertPublishedQuestion(candidate);
    const summary = summaries.get(candidate.id);
    if (
      !summary ||
      summary.shardId !== expectedShardId ||
      seen.has(candidate.id) ||
      !expectedIds.has(candidate.id) ||
      candidate.title !== summary.title ||
      (candidate.titleZh || "") !== summary.titleZh ||
      !arraysEqual(candidate.roleFamilies, summary.roleFamilies) ||
      !arraysEqual(candidate.skills, summary.skills) ||
      candidate.level !== summary.level ||
      candidate.difficulty !== summary.difficulty ||
      candidate.type !== summary.type ||
      candidate.estimatedMinutes !== summary.estimatedMinutes ||
      candidate.status !== summary.status ||
      candidate.contentVersion !== summary.contentVersion ||
      candidate.blueprintId !== summary.blueprintId ||
      previewText(candidate.prompt, index.previewLength) !==
        summary.promptPreview ||
      previewText(candidate.promptZh || "", index.previewLength) !==
        summary.promptPreviewZh
    ) {
      throw new Error("题目详情与已验证摘要不一致");
    }
    const derivedShardId = (await sha256Hex(candidate.id)).slice(0, 2);
    if (derivedShardId !== expectedShardId) {
      throw new Error("题目 ID 与确定性分片不一致");
    }
    seen.add(candidate.id);
  }

  if (seen.size !== expectedIds.size) {
    throw new Error("题目分片缺失索引中的题目");
  }
  return value as unknown as QuestionBankShard;
}

function BilingualCopy({
  zh,
  en,
  mode,
  className = "",
}: {
  zh?: string | null;
  en?: string | null;
  mode: QuestionLanguageMode;
  className?: string;
}) {
  const copies = [
    {
      id: "zh",
      label: "中",
      language: "zh-CN",
      text: zh?.trim() || "中文版本待校订",
      missing: !zh?.trim(),
    },
    {
      id: "en",
      label: "EN",
      language: "en",
      text: en?.trim() || "English version pending editorial review.",
      missing: !en?.trim(),
    },
  ];
  if (mode === "en-first") copies.reverse();

  return (
    <span className={`bilingual-copy mode-${mode} ${className}`.trim()}>
      {copies.map((copy, index) => (
        <span
          className={`language-copy ${index === 0 ? "primary-copy" : ""} ${
            copy.missing ? "translation-missing" : ""
          }`}
          lang={copy.language}
          key={copy.id}
        >
          <span className="language-tag" aria-hidden="true">
            {copy.label}
          </span>
          <span>{copy.text}</span>
        </span>
      ))}
    </span>
  );
}

function BilingualList({
  zh,
  en,
  mode,
  ordered = false,
}: {
  zh?: string[];
  en?: string[];
  mode: QuestionLanguageMode;
  ordered?: boolean;
}) {
  const length = Math.max(zh?.length || 0, en?.length || 0);
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className="bilingual-list">
      {Array.from({ length }, (_, index) => (
        <li key={`${index}-${en?.[index] || zh?.[index] || "item"}`}>
          <BilingualCopy
            zh={zh?.[index]}
            en={en?.[index]}
            mode={mode}
            className="bilingual-list-copy"
          />
        </li>
      ))}
    </Tag>
  );
}

function oracleField(
  oracle: QuestionOracle | null | undefined,
  field: "kind" | "procedure" | "acceptance",
) {
  if (!oracle) return "";
  if (typeof oracle === "string") {
    return field === "procedure" ? oracle : "";
  }
  return oracle[field];
}

function BilingualOracle({
  oracle,
  oracleZh,
  mode,
}: {
  oracle?: QuestionOracle | null;
  oracleZh?: QuestionOracle | null;
  mode: QuestionLanguageMode;
}) {
  if (typeof oracle === "string" && typeof oracleZh === "string") {
    return (
      <p className="oracle-copy">
        <BilingualCopy zh={oracleZh} en={oracle} mode={mode} />
      </p>
    );
  }

  const fields = [
    ["kind", "类型 / Kind"],
    ["procedure", "验证步骤 / Procedure"],
    ["acceptance", "通过标准 / Acceptance"],
  ] as const;
  return (
    <dl className="oracle-copy oracle-details bilingual-oracle">
      {fields.map(([field, label]) => (
        <div key={field}>
          <dt>{label}</dt>
          <dd>
            <BilingualCopy
              zh={oracleField(oracleZh, field)}
              en={oracleField(oracle, field)}
              mode={mode}
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Metric({
  value,
  label,
  note,
}: {
  value: string | number;
  label: string;
  note?: string;
}) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

function StatusDot({ signal }: { signal: string }) {
  const key = signalKey(signal);
  return (
    <span className={`signal signal-${key}`}>
      <i aria-hidden="true" />
      {signalLabel(signal)}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

export function CareerDojoApp({
  companies,
  roles,
  skills,
  questionBank,
  profile,
}: AppProps) {
  const [view, setView] = useState<ViewId>("mission");
  const [persisted, setPersisted] = useState<PersistedState>(emptyState);
  const [syncState, setSyncState] = useState<"loading" | "ready" | "offline">(
    "loading",
  );
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [visa, setVisa] = useState("ALL");
  const [companyLimit, setCompanyLimit] = useState(60);
  const [atlasLayout, setAtlasLayout] = useState<AtlasLayout>("tree");
  const [expandedTreeGroups, setExpandedTreeGroups] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [questionType, setQuestionType] = useState("ALL");
  const [questionLevel, setQuestionLevel] = useState("ALL");
  const [questionDifficulty, setQuestionDifficulty] = useState("ALL");
  const [questionLanguageMode, setQuestionLanguageMode] =
    useState<QuestionLanguageMode>("bilingual");
  const [questions, setQuestions] = useState<InterviewQuestionSummary[]>([]);
  const [questionIndexState, setQuestionIndexState] =
    useState<QuestionIndexState>("loading");
  const [questionIndexError, setQuestionIndexError] = useState("");
  const [questionIndexRetryKey, setQuestionIndexRetryKey] = useState(0);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionPageSize, setQuestionPageSize] = useState(24);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedQuestion, setSelectedQuestion] =
    useState<InterviewQuestionSummary | null>(null);
  const [selectedQuestionDetail, setSelectedQuestionDetail] =
    useState<InterviewQuestion | null>(null);
  const [questionDetailState, setQuestionDetailState] =
    useState<QuestionDetailState>("idle");
  const [questionDetailError, setQuestionDetailError] = useState("");
  const [rubricVisible, setRubricVisible] = useState(false);
  const [attemptScore, setAttemptScore] = useState(50);
  const [attemptConfidence, setAttemptConfidence] = useState(50);
  const [attemptNotes, setAttemptNotes] = useState("");
  const [privateProfileDraft, setPrivateProfileDraft] = useState("");
  const [privateProfileMessage, setPrivateProfileMessage] = useState("");
  const [applicationBuilderVisible, setApplicationBuilderVisible] =
    useState(false);
  const [applicationDraft, setApplicationDraft] = useState<ApplicationDraft>(
    emptyApplicationDraft,
  );
  const companyModalRef = useRef<HTMLElement>(null);
  const questionModalRef = useRef<HTMLElement>(null);
  const questionResultsRef = useRef<HTMLDivElement>(null);
  const questionIndexRef = useRef<QuestionBankIndex | null>(null);
  const questionDetailCacheRef = useRef(new Map<string, InterviewQuestion>());
  const questionShardCacheRef = useRef(
    new Map<string, Promise<QuestionBankShard>>(),
  );
  const questionLoadRequestRef = useRef(0);
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const effectiveProfile = useMemo(() => {
    const stored = persisted.preferences.candidateProfile;
    if (!stored) return profile;
    try {
      const parsed = JSON.parse(stored) as Profile;
      if (
        parsed?.education?.program &&
        Array.isArray(parsed.priorityRoleFamilies) &&
        Array.isArray(parsed.criticalGaps)
      ) {
        return parsed;
      }
    } catch {
      // Ignore an incomplete private profile and keep the public-safe template.
    }
    return profile;
  }, [persisted.preferences.candidateProfile, profile]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const separator = questionBank.indexUrl.includes("?") ? "&" : "?";
    const indexUrl = `${questionBank.indexUrl}${separator}v=${encodeURIComponent(
      questionBank.assetVersion,
    )}`;

    questionLoadRequestRef.current += 1;
    questionIndexRef.current = null;
    questionDetailCacheRef.current.clear();
    questionShardCacheRef.current.clear();

    fetch(indexUrl, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `题库索引请求失败（${response.status}）/ Question index request failed (${response.status}).`,
          );
        }
        return parseVerifiedJson(
          response,
          questionBank.indexSha256,
          "题库索引 / Question index",
        );
      })
      .then((value) => {
        const index = validateQuestionBankIndex(value, questionBank);
        if (!active) return;
        questionIndexRef.current = index;
        setQuestions(index.questions);
        setQuestionIndexState("ready");
      })
      .catch((error: unknown) => {
        if (
          !active ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }
        questionIndexRef.current = null;
        setQuestions([]);
        setQuestionIndexState("error");
        setQuestionIndexError(
          error instanceof Error
            ? error.message
            : "题库索引暂时无法加载 / Question index is temporarily unavailable.",
        );
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [questionBank, questionIndexRetryKey]);

  useEffect(() => {
    let active = true;
    fetch("/api/state")
      .then(async (response) => {
        if (!response.ok) throw new Error("state unavailable");
        return (await response.json()) as PersistedState;
      })
      .then((value) => {
        if (!active) return;
        setPersisted(normalizePersistedState(value));
        setSyncState("ready");
      })
      .catch(() => {
        if (!active) return;
        setSyncState("offline");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const modal = selectedCompany
      ? companyModalRef.current
      : selectedQuestion
        ? questionModalRef.current
        : null;
    if (!modal) return;
    const focusModal = modal;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusableElements = () =>
      Array.from(
        modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
        ),
      );
    const initialFocusable = getFocusableElements();
    (initialFocusable[0] || modal).focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (selectedCompany) {
          setApplicationBuilderVisible(false);
          setSelectedCompany(null);
        } else {
          questionLoadRequestRef.current += 1;
          setSelectedQuestion(null);
          setSelectedQuestionDetail(null);
          setQuestionDetailState("idle");
          setQuestionDetailError("");
        }
        return;
      }
      if (event.key !== "Tab" || !modal) return;
      const focusable = getFocusableElements();
      if (!focusable.length) {
        event.preventDefault();
        modal.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      const focusIsOutside = !(
        activeElement instanceof Node && modal.contains(activeElement)
      );
      if (
        event.shiftKey &&
        (activeElement === first ||
          activeElement === modal ||
          focusIsOutside)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === last ||
          activeElement === modal ||
          focusIsOutside)
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    function handleFocusIn(event: FocusEvent) {
      const target = event.target;
      if (target instanceof Node && !focusModal.contains(target)) {
        const focusable = getFocusableElements();
        (focusable[0] || focusModal).focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [selectedCompany, selectedQuestion]);

  function mutate(body: Record<string, unknown>): Promise<boolean> {
    const operation = mutationQueueRef.current.then(async () => {
      try {
        const response = await fetch("/api/state", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error("write failed");
        setPersisted(
          normalizePersistedState(
            (await response.json()) as Partial<PersistedState>,
          ),
        );
        setSyncState("ready");
        return true;
      } catch {
        setSyncState("offline");
        return false;
      }
    });
    mutationQueueRef.current = operation.then(() => undefined);
    return operation;
  }

  const categoryOptions = useMemo(() => {
    const groups = new Map<
      string,
      { id: string; values: string[]; zh: string; en: string }
    >();
    for (const rawCategory of new Set(
      companies.flatMap((company) => company.categories),
    )) {
      if (!rawCategory) continue;
      const id = canonicalCategoryId(rawCategory);
      const label = categoryLabels[rawCategory];
      const current = groups.get(id);
      if (!current) {
        groups.set(id, {
          id,
          values: [rawCategory],
          zh: label.zh,
          en: label.en,
        });
        continue;
      }
      current.values.push(rawCategory);
      if (label.zh.length < current.zh.length) current.zh = label.zh;
      if (label.en.length < current.en.length) current.en = label.en;
    }
    return [...groups.values()].sort((a, b) =>
      `${a.zh} / ${a.en}`.localeCompare(`${b.zh} / ${b.en}`),
    );
  }, [companies]);
  const categoryValuesById = useMemo(
    () =>
      new Map(
        categoryOptions.map((option) => [option.id, new Set(option.values)]),
      ),
    [categoryOptions],
  );
  const companyById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );

  const questionTypes = useMemo(
    () =>
      Array.from(new Set(questions.map((question) => question.type)))
        .filter(Boolean)
        .sort(),
    [questions],
  );

  const filteredCompanies = useMemo(() => {
    const term = search.trim().toLowerCase();
    const selectedCategoryValues = categoryValuesById.get(category);
    return companies
      .filter((company) => region === "ALL" || regionOf(company) === region)
      .filter(
        (company) =>
          category === "ALL" ||
          company.categories.some((item) => selectedCategoryValues?.has(item)),
      )
      .filter(
        (company) =>
          visa === "ALL" || signalKey(company.visaSignal) === visa,
      )
      .filter((company) => {
        if (!term) return true;
        return [
          company.name,
          company.nameEn,
          company.nameZh || "",
          ...company.aliases,
          ...company.categories,
          ...company.categories.map(categoryLabel),
          companyTypeLabel(company.companyType),
          regionLabel(regionOf(company)),
          company.country,
          company.region,
          ...company.locations,
          ...company.focusAreas,
          ...company.roleFamilies,
          ...company.opportunityTypes,
          ...company.requirements,
          ...company.gaps,
          company.whyRelevant,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort(
        (a, b) =>
          fitRank(a.fitTier) - fitRank(b.fitTier) ||
          a.nameEn.localeCompare(b.nameEn),
      );
  }, [
    category,
    categoryValuesById,
    companies,
    region,
    search,
    visa,
  ]);

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    const levelOrder: Record<string, number> = {
      entry: 0,
      foundation: 0,
      intermediate: 1,
      advanced: 2,
    };
    const difficultyOrder: Record<string, number> = {
      easy: 0,
      medium: 1,
      hard: 2,
    };
    return questions
      .filter((question) => {
        if (
          roleFilter !== "ALL" &&
          !question.roleFamilies.includes(roleFilter)
        ) {
          return false;
        }
        if (questionType !== "ALL" && question.type !== questionType) {
          return false;
        }
        if (questionLevel !== "ALL" && question.level !== questionLevel) {
          return false;
        }
        if (
          questionDifficulty !== "ALL" &&
          question.difficulty !== questionDifficulty
        ) {
          return false;
        }
        if (!term) return true;
        return [
          question.title,
          question.titleZh || "",
          question.promptPreview,
          question.promptPreviewZh,
          ...question.skills,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort(
        (a, b) =>
          (levelOrder[a.level] ?? 9) - (levelOrder[b.level] ?? 9) ||
          (difficultyOrder[a.difficulty] ?? 9) -
            (difficultyOrder[b.difficulty] ?? 9) ||
          a.estimatedMinutes - b.estimatedMinutes,
      );
  }, [
    questionDifficulty,
    questionLevel,
    questionType,
    questions,
    roleFilter,
    search,
  ]);

  const questionPageCount = Math.max(
    1,
    Math.ceil(filteredQuestions.length / questionPageSize),
  );
  const safeQuestionPage = Math.min(questionPage, questionPageCount);
  const visibleQuestions = filteredQuestions.slice(
    (safeQuestionPage - 1) * questionPageSize,
    safeQuestionPage * questionPageSize,
  );
  const questionResultStart = filteredQuestions.length
    ? (safeQuestionPage - 1) * questionPageSize + 1
    : 0;
  const questionResultEnd = Math.min(
    safeQuestionPage * questionPageSize,
    filteredQuestions.length,
  );
  const activeQuestionFilterCount = [
    search.trim() ? search : "",
    roleFilter,
    questionType,
    questionLevel,
    questionDifficulty,
  ].filter((value) => value && value !== "ALL").length;
  const visibleQuestionPages = Array.from(
    { length: Math.min(5, questionPageCount) },
    (_, offset) => {
      const firstPage = Math.min(
        Math.max(1, safeQuestionPage - 2),
        Math.max(1, questionPageCount - 4),
      );
      return firstPage + offset;
    },
  );

  const companyTree = useMemo(
    () =>
      (["US", "CN", "Global"] as const)
        .map((treeRegion) => {
          const nodes = filteredCompanies.filter(
            (company) => regionOf(company) === treeRegion,
          );
          const groups = Array.from(
            new Set(nodes.map((company) => company.companyType)),
          )
            .sort((a, b) => a.localeCompare(b))
            .map((companyType) => ({
              companyType,
              companies: nodes.filter(
                (company) => company.companyType === companyType,
              ),
            }));
          return { region: treeRegion, nodes, groups };
        })
        .filter((group) => group.nodes.length > 0),
    [filteredCompanies],
  );

  const usCompanies = companies.filter((company) => regionOf(company) === "US");
  const cnCompanies = companies.filter((company) => regionOf(company) === "CN");
  const priorityCompanies = companies
    .filter((company) => fitRank(company.fitTier) <= 1)
    .sort((a, b) => fitRank(a.fitTier) - fitRank(b.fitTier))
    .slice(0, 8);
  const bookmarks = new Set(persisted.bookmarks);
  const currentQuestionVersion = new Map(
    questions.map((question) => [question.id, question.contentVersion]),
  );
  const completedQuestions = new Set(
    [
      ...persisted.questionStats
        .filter((stat) => stat.attempts > 0)
        .map((stat) => stat.question_id),
      ...persisted.questionAttempts.map((attempt) => attempt.question_id),
    ],
  );
  const skillById = new Map(skills.map((skill) => [skill.id, skill]));
  const latestQuestionScore = new Map(
    persisted.questionStats
      .filter(
        (stat) =>
          currentQuestionVersion.get(stat.question_id) ===
          stat.question_version,
      )
      .map((stat) => [stat.question_id, stat.latest_score]),
  );
  for (const attempt of persisted.questionAttempts) {
    if (
      currentQuestionVersion.get(attempt.question_id) ===
        attempt.question_version &&
      !latestQuestionScore.has(attempt.question_id)
    ) {
      latestQuestionScore.set(attempt.question_id, attempt.score);
    }
  }
  const totalAttemptCount = persisted.questionStats.length
    ? persisted.questionStats.reduce(
        (total, stat) => total + stat.attempts,
        0,
      )
    : persisted.questionAttempts.length;
  const missionQuestions = [...questions]
    .sort((a, b) => {
      const aAttempted = latestQuestionScore.has(a.id) ? 1 : 0;
      const bAttempted = latestQuestionScore.has(b.id) ? 1 : 0;
      const aPriority = a.roleFamilies.some((role) =>
        effectiveProfile.priorityRoleFamilies.includes(role),
      )
        ? 0
        : 1;
      const bPriority = b.roleFamilies.some((role) =>
        effectiveProfile.priorityRoleFamilies.includes(role),
      )
        ? 0
        : 1;
      return (
        aAttempted - bAttempted ||
        aPriority - bPriority ||
        (latestQuestionScore.get(a.id) ?? 101) -
          (latestQuestionScore.get(b.id) ?? 101) ||
        a.estimatedMinutes - b.estimatedMinutes
      );
    })
    .slice(0, 5);

  function masteryForSkill(skillId: string) {
    const relatedQuestionIds = new Set(
      questions
        .filter(
          (question) =>
            question.status === "active" &&
            question.skills.includes(skillId),
        )
        .map((question) => question.id),
    );
    const stats = persisted.questionStats.filter(
      (stat) =>
        stat.attempts > 0 &&
        relatedQuestionIds.has(stat.question_id) &&
        currentQuestionVersion.get(stat.question_id) ===
          stat.question_version,
    );
    if (stats.length) {
      const attempts = stats.reduce((total, stat) => total + stat.attempts, 0);
      return Math.round(
        stats.reduce((total, stat) => total + stat.total_score, 0) / attempts,
      );
    }
    return (
      persisted.skillProgress.find((item) => item.skill_id === skillId)
        ?.mastery || 0
    );
  }

  function hasTrainingForSkill(skillId: string) {
    const relatedQuestionIds = new Set(
      questions
        .filter(
          (question) =>
            question.status === "active" &&
            question.skills.includes(skillId),
        )
        .map((question) => question.id),
    );
    return persisted.questionStats.some(
      (stat) =>
        stat.attempts > 0 &&
        relatedQuestionIds.has(stat.question_id) &&
        currentQuestionVersion.get(stat.question_id) ===
          stat.question_version,
    );
  }

  function readinessForRole(roleId: string) {
    const baseline = effectiveProfile.readinessByRole?.[roleId] ?? 35;
    const trained = skills
      .filter((skill) => skill.roleFamilies?.includes(roleId))
      .filter((skill) => hasTrainingForSkill(skill.id))
      .map((skill) => masteryForSkill(skill.id));
    if (!trained.length) return baseline;
    const measured =
      trained.reduce((total, mastery) => total + mastery, 0) / trained.length;
    return Math.round(baseline * 0.75 + measured * 0.25);
  }

  async function toggleBookmark(company: Company) {
    const active = !bookmarks.has(company.id);
    await mutate({ action: "toggleBookmark", companyId: company.id, active });
  }

  function roleForCompany(company: Company) {
    return (
      roles.find((item) => company.roleFamilyIds.includes(item.id)) ||
      roles.find((item) =>
        company.roleFamilies.some(
          (value) =>
            value.toLowerCase().includes(item.name.toLowerCase()) ||
            item.name.toLowerCase().includes(value.toLowerCase()),
        ),
      )
    );
  }

  function beginApplication(company: Company) {
    const role = roleForCompany(company);
    const rank = fitRank(company.fitTier);
    setApplicationDraft({
      roleTitle:
        role?.nameZh || company.roleFamilies[0] || "目标岗位待确认",
      employmentType: "internship",
      jobUrl: company.careerUrl,
      deadline: "",
      sponsorshipSignal: signalKey(company.visaSignal),
      exportSignal:
        signalKey(company.visaSignal) === "red" ? "orange" : "unknown",
      contact: "",
      resumeVersion: "",
      jdKeywords: company.requirements.join(", "),
      sourceObservedAt: company.lastVerified,
      matchScore: rank === 0 ? 88 : rank === 1 ? 76 : rank === 2 ? 62 : 45,
      notes: company.whyRelevant,
    });
    setApplicationBuilderVisible(true);
  }

  async function saveApplication(company: Company) {
    const saved = await mutate({
      action: "saveApplication",
      application: {
        companyId: company.id,
        companyName: companyName(company),
        region: regionOf(company),
        status: "researching",
        priority: fitRank(company.fitTier) <= 1 ? "high" : "medium",
        ...applicationDraft,
      },
    });
    if (saved) {
      setApplicationBuilderVisible(false);
      setApplicationDraft(emptyApplicationDraft);
      setSelectedCompany(null);
      setView("applications");
    }
  }

  async function updateApplication(
    application: ApplicationRecord,
    patch: Partial<{
      roleTitle: string;
      employmentType: string;
      status: string;
      priority: string;
      jobUrl: string;
      deadline: string;
      sponsorshipSignal: string;
      exportSignal: string;
      contact: string;
      resumeVersion: string;
      jdKeywords: string;
      sourceObservedAt: string;
      matchScore: number;
      notes: string;
    }>,
  ) {
    await mutate({
      action: "patchApplication",
      id: application.id,
      patch,
    });
  }

  async function deleteApplication(application: ApplicationRecord) {
    const currentCompany = companyById.get(application.company_id);
    const currentCompanyName = currentCompany
      ? companyName(currentCompany)
      : application.company_name;
    if (
      !window.confirm(
        `确认从投递作战室删除 ${currentCompanyName} — ${application.role_title}？`,
      )
    ) {
      return;
    }
    await mutate({ action: "deleteApplication", id: application.id });
  }

  function exportPrivateState() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            evidenceDate: effectiveProfile.evidenceDate,
            ...persisted,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aialra-career-dojo-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importPrivateProfile() {
    setPrivateProfileMessage("");
    try {
      const parsed = JSON.parse(privateProfileDraft) as Profile;
      if (
        !parsed?.education?.program ||
        !Array.isArray(parsed.priorityRoleFamilies) ||
        !Array.isArray(parsed.criticalGaps)
      ) {
        throw new Error("missing required profile fields");
      }
      const serialized = JSON.stringify(parsed);
      if (serialized.length > 8000) {
        setPrivateProfileMessage("画像超过 8,000 字符，请精简后重试。");
        return;
      }
      const saved = await mutate({
        action: "setPreference",
        key: "candidateProfile",
        value: serialized,
      });
      if (saved) {
        setPrivateProfileDraft("");
        setPrivateProfileMessage("私有画像已保存并应用。");
      } else {
        setPrivateProfileMessage("暂时无法保存，请稍后重试。");
      }
    } catch {
      setPrivateProfileMessage(
        "画像格式无效：请使用完整 JSON，并保留教育、目标岗位和关键缺口字段。",
      );
    }
  }

  async function clearPrivateProfile() {
    const saved = await mutate({
      action: "setPreference",
      key: "candidateProfile",
      value: "",
    });
    setPrivateProfileDraft("");
    setPrivateProfileMessage(
      saved ? "已恢复公开安全的匿名模板。" : "暂时无法清除，请稍后重试。",
    );
  }

  async function saveAttempt() {
    if (!selectedQuestion) return;
    const saved = await mutate({
      action: "recordQuestionAttempt",
      questionId: selectedQuestion.id,
      questionVersion: selectedQuestion.contentVersion,
      score: attemptScore,
      confidence: attemptConfidence,
      notes: attemptNotes,
    });
    if (saved) {
      closeQuestion();
      setAttemptNotes("");
    }
  }

  async function loadQuestionDetail(question: InterviewQuestionSummary) {
    if (questionIndexState !== "ready") return;
    const requestId = ++questionLoadRequestRef.current;
    setQuestionDetailError("");
    const cached = questionDetailCacheRef.current.get(question.id);
    if (cached?.contentVersion === question.contentVersion) {
      setSelectedQuestionDetail(cached);
      setQuestionDetailState("ready");
      return;
    }

    setSelectedQuestionDetail(null);
    setQuestionDetailState("loading");
    try {
      const verifiedIndex = questionIndexRef.current;
      const expectedShardSha256 =
        questionBank.shardSha256ById[question.shardId];
      if (
        !verifiedIndex ||
        !/^[0-9a-f]{64}$/.test(expectedShardSha256 || "")
      ) {
        throw new Error("题库索引或分片摘要尚未通过校验");
      }
      let shardPromise = questionShardCacheRef.current.get(question.shardId);
      if (!shardPromise) {
        shardPromise = fetch(
          `/question-bank/shards/${question.shardId}.json?v=${encodeURIComponent(
            questionBank.assetVersion,
          )}`,
          {
            cache: "no-store",
            headers: { accept: "application/json" },
          },
        ).then(async (response) => {
          if (!response.ok) {
            throw new Error(`详情分片返回 ${response.status}`);
          }
          const value = await parseVerifiedJson(
            response,
            expectedShardSha256,
            `题目分片 ${question.shardId} / Question shard ${question.shardId}`,
          );
          const payload = await validateQuestionBankShard(
            value,
            questionBank,
            question.shardId,
            verifiedIndex,
          );
          for (const detail of payload.questions) {
            questionDetailCacheRef.current.set(detail.id, detail);
          }
          return payload;
        });
        questionShardCacheRef.current.set(question.shardId, shardPromise);
        shardPromise.catch(() => {
          if (questionShardCacheRef.current.get(question.shardId) === shardPromise) {
            questionShardCacheRef.current.delete(question.shardId);
          }
        });
      }

      await shardPromise;
      const detail = questionDetailCacheRef.current.get(question.id);
      if (!detail || detail.contentVersion !== question.contentVersion) {
        throw new Error("分片中找不到当前版本的题目详情");
      }
      if (questionLoadRequestRef.current !== requestId) return;
      setSelectedQuestionDetail(detail);
      setQuestionDetailState("ready");
    } catch (error) {
      if (questionLoadRequestRef.current !== requestId) return;
      setSelectedQuestionDetail(null);
      setQuestionDetailState("error");
      setQuestionDetailError(
        error instanceof Error ? error.message : "题目详情加载失败",
      );
    }
  }

  function openQuestion(question: InterviewQuestionSummary) {
    if (questionIndexState !== "ready") return;
    setSelectedQuestion(question);
    setSelectedQuestionDetail(null);
    setRubricVisible(false);
    setAttemptScore(50);
    setAttemptConfidence(50);
    setAttemptNotes("");
    void loadQuestionDetail(question);
  }

  function closeQuestion() {
    questionLoadRequestRef.current += 1;
    setSelectedQuestion(null);
    setSelectedQuestionDetail(null);
    setQuestionDetailState("idle");
    setQuestionDetailError("");
    setRubricVisible(false);
  }

  function retryQuestionIndex() {
    questionLoadRequestRef.current += 1;
    setQuestions([]);
    setQuestionPage(1);
    setSelectedQuestion(null);
    setSelectedQuestionDetail(null);
    setQuestionDetailState("idle");
    setQuestionDetailError("");
    setQuestionIndexState("loading");
    setQuestionIndexError("");
    setQuestionIndexRetryKey((value) => value + 1);
  }

  function resetQuestionFilters() {
    setSearch("");
    setRoleFilter("ALL");
    setQuestionType("ALL");
    setQuestionLevel("ALL");
    setQuestionDifficulty("ALL");
    setQuestionPage(1);
  }

  function goToQuestionPage(page: number) {
    setQuestionPage(Math.min(Math.max(1, page), questionPageCount));
    window.requestAnimationFrame(() => {
      questionResultsRef.current?.scrollIntoView({ block: "start" });
    });
  }

  function openRoleDojo(roleId: string) {
    setRoleFilter(roleId);
    setSearch("");
    setQuestionPage(1);
    setView("dojo");
  }

  return (
    <div className="app-shell">
      <aside className="side-rail">
        <button
          className="brand"
          onClick={() => setView("mission")}
          aria-label="回到任务总览"
        >
          <span className="brand-mark">A</span>
          <span>
            <strong>AIALRA</strong>
            <small>CAREER DOJO</small>
          </span>
        </button>

        <nav aria-label="主要导航">
          {views.map((item, index) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => {
                setView(item.id);
                setSearch("");
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="rail-status">
          <span className={`sync-dot sync-${syncState}`} />
          <div>
            <strong>
              {syncState === "ready"
                ? "进度已保存"
                : syncState === "loading"
                  ? "正在同步"
                  : "只读研究模式"}
            </strong>
            <small>D1 · evidence snapshot</small>
          </div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <span className="eyebrow">
              {effectiveProfile.targetWindow} · {effectiveProfile.education.program} ·{" "}
              {effectiveProfile.education.workAuthorization}
            </span>
            <h1>{views.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <span className="evidence-pill">
              <i />
              证据日期 {effectiveProfile.evidenceDate}
            </span>
            <button
              className="primary-button"
              onClick={() => {
                setRoleFilter(effectiveProfile.priorityRoleFamilies[0] || "ALL");
                setView("dojo");
              }}
            >
              开始今日训练
            </button>
          </div>
        </header>

        {syncState === "offline" ? (
          <div className="sync-banner">
            持久化服务暂不可用；公司与题库仍可浏览，进度写入将在部署后恢复。
          </div>
        ) : null}

        {view === "mission" ? (
          <section className="view mission-view">
            <div className="hero-grid">
              <article className="hero-card">
                <div>
                  <span className="section-kicker">EVIDENCE → MASTERY</span>
                  <h2>不是盲投，也不是盲刷。</h2>
                  <p>
                    以公司和岗位证据为起点，把每个缺口变成可验证项目、训练任务和下一次投递行动。
                  </p>
                </div>
                <div className="positioning">
                  <small>你的主叙事</small>
                  <p>{effectiveProfile.positioning}</p>
                </div>
                <div className="hero-actions">
                  <button
                    className="primary-button"
                    onClick={() => setView("atlas")}
                  >
                    浏览目标公司
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => setView("roles")}
                  >
                    查看能力缺口
                  </button>
                </div>
              </article>

              <article className="countdown-card">
                <span className="section-kicker">CURRENT WINDOW</span>
                <strong>现在开始</strong>
                <h3>{effectiveProfile.targetWindow}</h3>
                <ol>
                  <li>
                    <span>01</span>
                    立即投递已开放岗位，不等待全量研究结束
                  </li>
                  <li>
                    <span>02</span>
                    8–11 月覆盖大厂、EDA、芯片和设备公司主峰
                  </li>
                  <li>
                    <span>03</span>
                    同步争取校内实验室、开源上游和教授背书
                  </li>
                </ol>
              </article>
            </div>

            <div className="metric-grid">
              <Metric value={companies.length} label="公司与组织" note="中美双市场" />
              <Metric value={usCompanies.length} label="美国机会宇宙" note="美国优先" />
              <Metric value={cnCompanies.length} label="中国发展节点" note="企业 + 研究院" />
              <Metric value={skills.length} label="原子能力" note="带先修依赖" />
              <Metric
                value={questionBank.questionCount}
                label="高质量训练任务"
                note="原创与可追溯"
              />
              <Metric
                value={persisted.applications.length}
                label="投递管线"
                note={`${totalAttemptCount} 次训练记录`}
              />
            </div>

            <div className="dashboard-grid">
              <article className="panel priority-panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-kicker">TARGET RADAR</span>
                    <h3>高匹配目标雷达</h3>
                  </div>
                  <button onClick={() => setView("atlas")}>查看全部 →</button>
                </div>
                <div className="target-list">
                  {priorityCompanies.map((company, index) => (
                    <button
                      className="target-row"
                      key={company.id}
                      onClick={() => setSelectedCompany(company)}
                    >
                      <span className="target-rank">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="target-name">
                        <strong><CompanyName company={company} /></strong>
                        <small>
                          {company.categories
                            .slice(0, 2)
                            .map(categoryLabel)
                            .join(" · ") ||
                            companyTypeLabel(company.companyType)}
                        </small>
                      </span>
                      <span className="tier-badge">{company.fitTier || "TBD"}</span>
                      <StatusDot signal={company.visaSignal} />
                    </button>
                  ))}
                </div>
              </article>

              <article className="panel gap-panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-kicker">EVIDENCE GAPS</span>
                    <h3>最值钱的下一步</h3>
                  </div>
                </div>
                <ul className="gap-list">
                  {effectiveProfile.criticalGaps.map((gap, index) => (
                    <li key={gap}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <strong>{gap}</strong>
                        <small>
                          {index < 2
                            ? "最高杠杆 · 直接影响面试转化"
                            : "转化为可复现实验与公开证据"}
                        </small>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <article className="panel mission-queue-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">ADAPTIVE MISSION QUEUE</span>
                  <h3>下一组最值得训练的任务</h3>
                </div>
                <button onClick={() => setView("dojo")}>打开完整 Dojo →</button>
              </div>
              <div className="mission-queue">
                {missionQuestions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => openQuestion(question)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>
                        <BilingualCopy
                          zh={question.titleZh}
                          en={question.title}
                          mode={questionLanguageMode}
                          className="mission-question-title"
                        />
                      </strong>
                      <small>
                        {question.type} · {question.estimatedMinutes} 分钟 ·{" "}
                        {latestQuestionScore.has(question.id)
                          ? `上次 ${latestQuestionScore.get(question.id)} 分`
                          : "尚未训练"}
                      </small>
                    </div>
                    <b>开始 →</b>
                  </button>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        {view === "atlas" ? (
          <section className="view">
            <div className="filter-bar">
              <label className="search-field">
                <span>搜索</span>
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCompanyLimit(60);
                  }}
                  placeholder="公司、方向、岗位、技术栈…"
                />
              </label>
              <div className="segmented" aria-label="地区筛选">
                {[
                  ["ALL", "全部 / All"],
                  ["US", "美国 / U.S."],
                  ["CN", "中国 / China"],
                  ["Global", "全球 / Global"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={region === value ? "active" : ""}
                    aria-pressed={region === value}
                    onClick={() => {
                      setRegion(value);
                      setCompanyLimit(60);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label>
                <span>产业节点 / Industry node</span>
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setCompanyLimit(60);
                  }}
                >
                  <option value="ALL">全部产业节点 / All industry nodes</option>
                  {categoryOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.zh} / {option.en}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>资格信号</span>
                <select
                  value={visa}
                  onChange={(event) => {
                    setVisa(event.target.value);
                    setCompanyLimit(60);
                  }}
                >
                  <option value="ALL">全部信号</option>
                  <option value="green">可投初筛</option>
                  <option value="yellow">赞助待核</option>
                  <option value="orange">出口复核</option>
                  <option value="red">硬门槛</option>
                  <option value="unknown">待核验</option>
                </select>
              </label>
            </div>

            <div className="results-heading">
              <div>
                <span className="section-kicker">COMPANY ATLAS</span>
                <h2>{filteredCompanies.length} 个匹配节点</h2>
              </div>
              <div className="results-actions">
                <p>所有难度与身份判断均落到具体岗位；公司级信号只用于初筛。</p>
                <div className="segmented atlas-layout-toggle">
                  <button
                    className={atlasLayout === "tree" ? "active" : ""}
                    aria-pressed={atlasLayout === "tree"}
                    onClick={() => setAtlasLayout("tree")}
                  >
                    组织树 / Tree
                  </button>
                  <button
                    className={atlasLayout === "cards" ? "active" : ""}
                    aria-pressed={atlasLayout === "cards"}
                    onClick={() => setAtlasLayout("cards")}
                  >
                    档案卡
                  </button>
                </div>
              </div>
            </div>

            {atlasLayout === "tree" ? (
              <div className="company-tree">
                {companyTree.map((regionGroup) => (
                  <section key={regionGroup.region}>
                    <div className="company-tree-heading">
                      <h3>
                        <BilingualNodeLabel
                          label={regionLabels[regionGroup.region]}
                        />
                      </h3>
                      <span>{regionGroup.nodes.length} 个节点 / nodes</span>
                    </div>
                    {regionGroup.groups.map((typeGroup) => {
                      const groupId = `${regionGroup.region}:${typeGroup.companyType}`;
                      const expanded = expandedTreeGroups.includes(groupId);
                      return (
                        <details
                          key={groupId}
                          open={expanded}
                          onToggle={(event) => {
                            const shouldOpen = event.currentTarget.open;
                            setExpandedTreeGroups((current) => {
                              const hasGroup = current.includes(groupId);
                              if (hasGroup === shouldOpen) return current;
                              return shouldOpen
                                ? [...current, groupId]
                                : current.filter((item) => item !== groupId);
                            });
                          }}
                        >
                          <summary>
                            <BilingualNodeLabel
                              label={
                                companyTypeLabels[typeGroup.companyType] || {
                                  zh: "未分类",
                                  en: "Unclassified",
                                }
                              }
                            />
                            <b>{typeGroup.companies.length}</b>
                          </summary>
                          {expanded ? (
                            <div className="tree-company-list">
                              {typeGroup.companies.map((company) => (
                                <button
                                  key={company.id}
                                  onClick={() => setSelectedCompany(company)}
                                >
                                  <CompanyName company={company} />
                                  <small>
                                    {company.fitTier || "TBD"} ·{" "}
                                    {signalLabel(company.visaSignal)}
                                  </small>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </details>
                      );
                    })}
                  </section>
                ))}
              </div>
            ) : (
              <>
                <div className="company-grid">
                  {filteredCompanies.slice(0, companyLimit).map((company) => (
                    <article className="company-card" key={company.id}>
                      <div className="company-card-top">
                        <span className="company-avatar">
                          {company.nameEn.slice(0, 2).toUpperCase()}
                        </span>
                        <button
                          className={`bookmark-button ${
                            bookmarks.has(company.id) ? "active" : ""
                          }`}
                          aria-label={
                            bookmarks.has(company.id) ? "取消收藏" : "收藏公司"
                          }
                          onClick={() => toggleBookmark(company)}
                        >
                          {bookmarks.has(company.id) ? "★" : "☆"}
                        </button>
                      </div>
                      <div>
                        <div className="company-title-row">
                          <h3><CompanyName company={company} /></h3>
                          <span className="tier-badge">
                            {company.fitTier || "TBD"}
                          </span>
                        </div>
                        <p>
                          {company.whyRelevant || company.focusAreas.join(" · ")}
                        </p>
                      </div>
                      <div className="tag-row">
                        {company.categories.slice(0, 3).map((item) => (
                          <span key={item}>{categoryLabel(item)}</span>
                        ))}
                      </div>
                      <div className="company-meta">
                        <span>{regionLabel(regionOf(company))}</span>
                        <span>{company.difficulty || "难度待核"}</span>
                        <span>{confidenceLabel(company.confidence)}</span>
                      </div>
                      <div className="company-card-bottom">
                        <StatusDot signal={company.visaSignal} />
                        <button onClick={() => setSelectedCompany(company)}>
                          打开档案 →
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                {companyLimit < filteredCompanies.length ? (
                  <div className="load-more-row">
                    <button
                      className="secondary-button"
                      onClick={() => setCompanyLimit((value) => value + 60)}
                    >
                      再加载 60 个节点（已显示 {companyLimit}/
                      {filteredCompanies.length}）
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        {view === "roles" ? (
          <section className="view">
            <div className="results-heading role-heading">
              <div>
                <span className="section-kicker">ROLE × SKILL GRAPH</span>
                <h2>一条主线，两条副线，多层扩容</h2>
              </div>
              <p>
                分数是基于现有证据的准备度估计，不是录取概率；只有完成校准的训练才会更新它。
              </p>
            </div>

            <div className="role-grid">
              {roles.map((role) => {
                const readiness = readinessForRole(role.id);
                const priority =
                  effectiveProfile.priorityRoleFamilies.some(
                    (item) =>
                      role.id.includes(item) ||
                      item.includes(role.id.replace("rf-", "")),
                  ) || readiness >= 60;
                const roleQuestions =
                  questionIndexState === "ready"
                    ? questions.filter((question) =>
                        question.roleFamilies.includes(role.id),
                      ).length
                    : null;
                return (
                  <article
                    className={`role-card ${priority ? "priority" : ""}`}
                    key={role.id}
                  >
                    <div className="role-card-heading">
                      <span>{priority ? "CORE TRACK" : "EXPANSION"}</span>
                      <strong>{readiness}%</strong>
                    </div>
                    <h3>{role.nameZh}</h3>
                    <p>{role.description}</p>
                    <ProgressBar value={readiness} />
                    <div className="role-stats">
                      <span>{role.primarySkillDomains.length} 个能力域</span>
                      <span>
                        {roleQuestions === null
                          ? "题库加载中 / Loading"
                          : `${roleQuestions} 道训练任务`}
                      </span>
                    </div>
                    <div className="stage-list">
                      {role.interviewStages.slice(0, 4).map((stage) => (
                        <span key={stage}>{stage}</span>
                      ))}
                    </div>
                    <button onClick={() => openRoleDojo(role.id)}>
                      进入定向训练 →
                    </button>
                  </article>
                );
              })}
            </div>

            <article className="panel skill-map-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">ATOMIC CAPABILITIES</span>
                  <h3>原子能力地图</h3>
                </div>
                <span>{skills.length} 个节点 · 带先修依赖</span>
              </div>
              <div className="skill-ladder">
                {["foundation", "intermediate", "advanced"].map(
                  (level, levelIndex) => {
                  const levelSkills = skills.filter(
                    (skill) => (skill.level || "intermediate") === level,
                  );
                  const domains = Array.from(
                    new Set(
                      levelSkills.map(
                        (skill) => skill.domain || skill.category || "工程基础",
                      ),
                    ),
                  );
                  return (
                    <section className="skill-level" key={level}>
                      <div className="skill-level-heading">
                        <span>{String(levelIndex + 1).padStart(2, "0")}</span>
                        <div>
                          <strong>
                            {level === "foundation"
                              ? "基础层"
                              : level === "intermediate"
                                ? "核心工程层"
                                : "高级与系统层"}
                          </strong>
                          <small>{levelSkills.length} 个能力节点</small>
                        </div>
                      </div>
                      <div className="skill-columns">
                        {domains.map((domain) => (
                          <div className="skill-domain" key={`${level}-${domain}`}>
                            <strong>{domain}</strong>
                            {levelSkills
                              .filter(
                                (skill) =>
                                  (skill.domain ||
                                    skill.category ||
                                    "工程基础") === domain,
                              )
                              .map((skill) => {
                                const mastery = masteryForSkill(skill.id);
                                const trained = hasTrainingForSkill(skill.id);
                                return (
                                  <div className="skill-node" key={skill.id}>
                                    <span
                                      className={mastery >= 70 ? "mastered" : ""}
                                      title={`当前掌握度 ${mastery}%`}
                                    />
                                    <div>
                                      <b>{skillName(skill)}</b>
                                      <small>
                                        {(skill.prerequisites || []).length
                                          ? `先修：${(skill.prerequisites || [])
                                              .map(
                                                (id) =>
                                                  skillById.has(id)
                                                    ? skillName(
                                                        skillById.get(id)!,
                                                      )
                                                    : id,
                                              )
                                              .join(" / ")}`
                                          : "课程起点"}
                                        {trained ? ` · ${mastery}%` : ""}
                                      </small>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                  },
                )}
              </div>
            </article>
          </section>
        ) : null}

        {view === "dojo" ? (
          <section className="view">
            <div className="dojo-hero">
              <div>
                <span className="section-kicker">INTERVIEW DOJO</span>
                <h2>训练真实工程判断，而不是背答案。</h2>
                <p>
                  每道任务同时提供中文与 English
                  题干、交付物、评分规则、常见失败、追问和参考框架，并对应岗位信号与先修能力。
                  当前题库是研究沙箱；未完成专家与 learner pilot 的自评分不会改变岗位准备度。
                </p>
                <p className="dojo-lineage-summary">
                  <strong>
                    题库口径：210 个基础场景 + 每场 9 个递进训练 = 2,100
                    个任务。
                  </strong>
                  <span lang="en">
                    210 anchor scenarios + 1,890 progressive drills = 2,100
                    tasks.
                  </span>
                </p>
              </div>
              <div className="dojo-score">
                <strong>{completedQuestions.size}</strong>
                <span>已完成任务</span>
                <small>
                  {totalAttemptCount} 次可追溯尝试 ·{" "}
                  {questionBank.questionCount.toLocaleString()} 题
                </small>
              </div>
            </div>

            {questionIndexState !== "ready" ? (
              <div
                className={`question-index-state ${questionIndexState}`}
                role={questionIndexState === "error" ? "alert" : "status"}
                aria-live={questionIndexState === "error" ? "assertive" : "polite"}
                aria-busy={questionIndexState === "loading"}
              >
                <span className="question-index-state-mark" aria-hidden="true">
                  {questionIndexState === "error" ? "!" : ""}
                </span>
                <div>
                  <span className="section-kicker">
                    {questionIndexState === "loading"
                      ? "QUESTION BANK SYNC"
                      : "QUESTION BANK ERROR"}
                  </span>
                  <h3>
                    {questionIndexState === "loading"
                      ? "正在装载完整双语题库 / Loading the bilingual question index"
                      : "题库索引暂时无法加载 / Question index unavailable"}
                  </h3>
                  <p>
                    {questionIndexState === "loading"
                      ? `首屏保持轻量；正在校验并载入 ${questionBank.questionCount.toLocaleString()} 道题目的中英摘要。 / The first screen stays lightweight while ${questionBank.questionCount.toLocaleString()} bilingual summaries are fetched and validated.`
                      : questionIndexError ||
                        "请检查连接后重试。 / Check your connection and try again."}
                  </p>
                  {questionIndexState === "error" ? (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={retryQuestionIndex}
                    >
                      重试题库加载 / Retry question index
                    </button>
                  ) : (
                    <small>
                      版本校验、数量校验与摘要结构校验进行中。 / Validating
                      version, count, and summary schema.
                    </small>
                  )}
                </div>
              </div>
            ) : (
              <>
            <div className="dojo-toolbar">
              <div
                className="dojo-results-summary"
                aria-live="polite"
                aria-atomic="true"
              >
                <strong>{filteredQuestions.length.toLocaleString()}</strong>
                <span>
                  道匹配任务 / matched · 共{" "}
                  {questionBank.questionCount.toLocaleString()} 题
                </span>
                <small>
                  当前显示 {questionResultStart.toLocaleString()}–
                  {questionResultEnd.toLocaleString()} · 第 {safeQuestionPage} /{" "}
                  {questionPageCount} 页
                </small>
              </div>
              <label className="question-page-size">
                <span>每页 / Page size</span>
                <select
                  value={questionPageSize}
                  onChange={(event) => {
                    setQuestionPageSize(Number(event.target.value));
                    setQuestionPage(1);
                  }}
                >
                  {[24, 48, 96].map((size) => (
                    <option value={size} key={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="language-switcher">
                <legend>阅读顺序 / Reading mode</legend>
                <div className="segmented">
                  {languageModeOptions.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      className={
                        questionLanguageMode === option.id ? "active" : ""
                      }
                      aria-pressed={questionLanguageMode === option.id}
                      title={option.description}
                      onClick={() => setQuestionLanguageMode(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="filter-bar dojo-filters">
              <label className="search-field">
                <span>搜索 / Search</span>
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setQuestionPage(1);
                  }}
                  placeholder="题目、技能、故障类型 / title, skill, failure…"
                />
              </label>
              <label>
                <span>岗位 / Role</span>
                <select
                  value={roleFilter}
                  onChange={(event) => {
                    setRoleFilter(event.target.value);
                    setQuestionPage(1);
                  }}
                >
                  <option value="ALL">全部岗位 / All roles</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nameZh} / {role.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>任务类型 / Type</span>
                <select
                  value={questionType}
                  onChange={(event) => {
                    setQuestionType(event.target.value);
                    setQuestionPage(1);
                  }}
                >
                  <option value="ALL">全部类型 / All types</option>
                  {questionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>学习层级 / Level</span>
                <select
                  value={questionLevel}
                  onChange={(event) => {
                    setQuestionLevel(event.target.value);
                    setQuestionPage(1);
                  }}
                >
                  <option value="ALL">全部层级 / All levels</option>
                  {Array.from(
                    new Set(questions.map((question) => question.level)),
                  ).map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>难度 / Difficulty</span>
                <select
                  value={questionDifficulty}
                  onChange={(event) => {
                    setQuestionDifficulty(event.target.value);
                    setQuestionPage(1);
                  }}
                >
                  <option value="ALL">全部难度 / All difficulties</option>
                  {Array.from(
                    new Set(questions.map((question) => question.difficulty)),
                  ).map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="filter-reset"
                onClick={resetQuestionFilters}
                disabled={activeQuestionFilterCount === 0}
              >
                重置筛选 / Reset
                {activeQuestionFilterCount
                  ? ` (${activeQuestionFilterCount})`
                  : ""}
              </button>
            </div>

            <div ref={questionResultsRef} className="question-results-anchor">
              {visibleQuestions.length ? (
                <div className="question-grid">
                  {visibleQuestions.map((question) => (
                    <article
                      className={`question-card ${
                        question.type.toLowerCase().includes("boss") ? "boss" : ""
                      }`}
                      key={question.id}
                    >
                      <div className="question-card-top">
                        <span>{question.type}</span>
                        <span>
                          {question.estimatedMinutes} MIN · {question.status}
                        </span>
                      </div>
                      <h3>
                        <BilingualCopy
                          zh={question.titleZh}
                          en={question.title}
                          mode={questionLanguageMode}
                          className="question-card-title"
                        />
                      </h3>
                      <div className="question-card-prompt">
                        <BilingualCopy
                          zh={question.promptPreviewZh}
                          en={question.promptPreview}
                          mode={questionLanguageMode}
                          className="compact-bilingual"
                        />
                      </div>
                      <div className="question-skills">
                        {question.skills.slice(0, 4).map((skill) => (
                          <span key={skill}>
                            {skillName(skillById.get(skill) || { id: skill })}
                          </span>
                        ))}
                      </div>
                      <div className="question-card-bottom">
                        <span>
                          {question.difficulty} · {question.level}
                        </span>
                        <button
                          onClick={() => openQuestion(question)}
                          aria-label={`${
                            completedQuestions.has(question.id)
                              ? "再次训练"
                              : "开始任务"
                          }：${question.titleZh || question.title} / ${
                            question.title
                          }`}
                        >
                          {completedQuestions.has(question.id)
                            ? "再次训练 / Retry"
                            : "开始任务 / Start"}{" "}
                          →
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state question-empty">
                  <span>00</span>
                  <h3>没有匹配题目 / No matching tasks</h3>
                  <p>
                    放宽关键词或筛选条件，即可返回完整双语题库。
                    <br />
                    Clear or broaden the filters to return to the full bilingual
                    library.
                  </p>
                  <button className="secondary-button" onClick={resetQuestionFilters}>
                    重置筛选 / Reset filters
                  </button>
                </div>
              )}
            </div>

            {filteredQuestions.length > questionPageSize ? (
              <nav
                className="question-pagination"
                aria-label="题库分页 / Question library pagination"
              >
                <button
                  type="button"
                  onClick={() => goToQuestionPage(1)}
                  disabled={safeQuestionPage === 1}
                  aria-label="第一页 / First page"
                >
                  «
                </button>
                <button
                  type="button"
                  onClick={() => goToQuestionPage(safeQuestionPage - 1)}
                  disabled={safeQuestionPage === 1}
                >
                  上一页 / Prev
                </button>
                <div className="pagination-pages">
                  {visibleQuestionPages.map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={page === safeQuestionPage ? "active" : ""}
                      aria-current={page === safeQuestionPage ? "page" : undefined}
                      aria-label={`第 ${page} 页 / Page ${page}`}
                      onClick={() => goToQuestionPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => goToQuestionPage(safeQuestionPage + 1)}
                  disabled={safeQuestionPage === questionPageCount}
                >
                  下一页 / Next
                </button>
                <button
                  type="button"
                  onClick={() => goToQuestionPage(questionPageCount)}
                  disabled={safeQuestionPage === questionPageCount}
                  aria-label="最后一页 / Last page"
                >
                  »
                </button>
              </nav>
            ) : null}
              </>
            )}
          </section>
        ) : null}

        {view === "applications" ? (
          <section className="view">
            <div className="results-heading">
              <div>
                <span className="section-kicker">APPLICATION WAR ROOM</span>
                <h2>让每次投递产生信息，而不只是数量。</h2>
              </div>
              <div className="results-actions">
                <p>
                  当前版本先保存 JD、材料版本与阶段观察；样本充分前不自动推断拒绝原因或改写能力权重。
                </p>
                <button className="secondary-button" onClick={exportPrivateState}>
                  导出私有数据
                </button>
              </div>
            </div>

            {persisted.applications.length === 0 ? (
              <article className="empty-state">
                <span>00</span>
                <h3>投递管线仍为空</h3>
                <p>从公司宇宙中打开目标档案，加入作战室并逐步补齐具体岗位。</p>
                <button
                  className="primary-button"
                  onClick={() => setView("atlas")}
                >
                  选择第一个目标
                </button>
              </article>
            ) : (
              <div className="kanban">
                {applicationStages.map(([stage, label]) => {
                  const records = persisted.applications.filter(
                    (application) => application.status === stage,
                  );
                  return (
                    <div className="kanban-column" key={stage}>
                      <div className="kanban-heading">
                        <strong>{label}</strong>
                        <span>{records.length}</span>
                      </div>
                      {records.map((application) => (
                        <article className="application-card" key={application.id}>
                          <div>
                            <span
                              className={`priority priority-${application.priority}`}
                            >
                              {application.priority}
                            </span>
                            <small>{application.region}</small>
                          </div>
                          <h3>
                            {companyById.has(application.company_id) ? (
                              <CompanyName
                                company={companyById.get(application.company_id)!}
                              />
                            ) : (
                              application.company_name
                            )}
                          </h3>
                          <p>{application.role_title}</p>
                          <div className="application-signals">
                            <span>{application.employment_type}</span>
                            <span>匹配 {application.match_score || 0}</span>
                            <span>身份 {application.sponsorship_signal}</span>
                            <span>出口 {application.export_signal}</span>
                          </div>
                          <label>
                            <span>推进阶段</span>
                            <select
                              value={application.status}
                              onChange={(event) =>
                                updateApplication(
                                  application,
                                  { status: event.target.value },
                                )
                              }
                            >
                              {applicationStages.map(([value, stageLabel]) => (
                                <option key={value} value={value}>
                                  {stageLabel}
                                </option>
                              ))}
                            </select>
                          </label>
                          <details className="application-details">
                            <summary>编辑具体岗位</summary>
                            <label>
                              <span>岗位名称</span>
                              <input
                                defaultValue={application.role_title}
                                onBlur={(event) => {
                                  if (event.target.value !== application.role_title) {
                                    updateApplication(application, {
                                      roleTitle: event.target.value,
                                    });
                                  }
                                }}
                              />
                            </label>
                            <label>
                              <span>截止日期</span>
                              <input
                                type="date"
                                defaultValue={application.deadline}
                                onBlur={(event) =>
                                  updateApplication(application, {
                                    deadline: event.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              <span>优先级</span>
                              <select
                                value={application.priority}
                                onChange={(event) =>
                                  updateApplication(application, {
                                    priority: event.target.value,
                                  })
                                }
                              >
                                <option value="high">high</option>
                                <option value="medium">medium</option>
                                <option value="low">low</option>
                              </select>
                            </label>
                            <label>
                              <span>身份 / 赞助信号</span>
                              <select
                                value={application.sponsorship_signal}
                                onChange={(event) =>
                                  updateApplication(application, {
                                    sponsorshipSignal: event.target.value,
                                  })
                                }
                              >
                                {["green", "yellow", "orange", "red", "unknown"].map(
                                  (signal) => (
                                    <option value={signal} key={signal}>
                                      {signal}
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>
                            <label>
                              <span>出口管制信号</span>
                              <select
                                value={application.export_signal}
                                onChange={(event) =>
                                  updateApplication(application, {
                                    exportSignal: event.target.value,
                                  })
                                }
                              >
                                {["green", "yellow", "orange", "red", "unknown"].map(
                                  (signal) => (
                                    <option value={signal} key={signal}>
                                      {signal}
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>
                            <label>
                              <span>联系人 / 内推</span>
                              <input
                                defaultValue={application.contact}
                                onBlur={(event) =>
                                  updateApplication(application, {
                                    contact: event.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              <span>简历版本</span>
                              <input
                                defaultValue={application.resume_version}
                                onBlur={(event) =>
                                  updateApplication(application, {
                                    resumeVersion: event.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              <span>JD 关键词</span>
                              <textarea
                                defaultValue={application.jd_keywords}
                                onBlur={(event) =>
                                  updateApplication(application, {
                                    jdKeywords: event.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              <span>岗位链接</span>
                              <input
                                type="url"
                                defaultValue={application.job_url}
                                onBlur={(event) =>
                                  updateApplication(application, {
                                    jobUrl: event.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              <span>复盘备注</span>
                              <textarea
                                defaultValue={application.notes}
                                onBlur={(event) =>
                                  updateApplication(application, {
                                    notes: event.target.value,
                                  })
                                }
                              />
                            </label>
                            <button
                              className="delete-button"
                              onClick={() => deleteApplication(application)}
                            >
                              删除这条岗位记录
                            </button>
                          </details>
                          {application.job_url ? (
                            <a
                              href={application.job_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              官方招聘入口 ↗
                            </a>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {persisted.bookmarks.length ? (
              <article className="panel shortlist-panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-kicker">SHORTLIST</span>
                    <h3>已收藏但尚未进入管线</h3>
                  </div>
                </div>
                <div className="shortlist-row">
                  {companies
                    .filter(
                      (company) =>
                        bookmarks.has(company.id) &&
                        !persisted.applications.some(
                          (item) => item.company_id === company.id,
                        ),
                    )
                    .slice(0, 16)
                    .map((company) => (
                      <button
                        key={company.id}
                        onClick={() => setSelectedCompany(company)}
                      >
                        <strong><CompanyName company={company} /></strong>
                        <small>{company.fitTier}</small>
                      </button>
                    ))}
                </div>
              </article>
            ) : null}
          </section>
        ) : null}

        {view === "evidence" ? (
          <section className="view evidence-view">
            <div className="evidence-hero">
              <span className="section-kicker">TRUSTED RESEARCH SYSTEM</span>
              <h2>“全量”必须可以审计。</h2>
              <p>
                数量不是终点。每个节点都要说明从哪里来、何时观察、可信到什么程度，以及还有什么未知。
              </p>
              <p className="evidence-bank-lineage">
                <strong>
                  题库口径：210 个基础场景 + 每场 9 个递进训练 = 2,100
                  个任务。
                </strong>
                <span lang="en">
                  210 anchor scenarios + 1,890 progressive drills = 2,100
                  tasks.
                </span>
              </p>
            </div>

            <div className="metric-grid evidence-metrics">
              <Metric value={companies.length} label="规范化实体" />
              <Metric
                value={
                  companies.filter((item) =>
                    item.evidence.some(
                      (evidence) => evidence.type === "official-current-job",
                    ),
                  ).length
                }
                label="观察日具体岗位"
              />
              <Metric
                value={
                  companies.filter(
                    (item) => signalKey(item.visaSignal) === "unknown",
                  ).length
                }
                label="身份信号待核"
              />
              <Metric
                value={
                  companies.filter(
                    (item) => signalKey(item.visaSignal) === "red",
                  ).length
                }
                label="硬门槛节点"
              />
              <Metric
                value={questionBank.questionCount}
                label="合规训练任务"
              />
              <Metric value={skills.length} label="能力覆盖节点" />
            </div>

            <div className="evidence-grid">
              <article className="panel private-profile-panel">
                <div className="private-profile-heading">
                  <div>
                    <span className="section-kicker">PRIVATE PROFILE SYNC</span>
                    <h3>私有画像同步</h3>
                  </div>
                  <span
                    className={
                      persisted.preferences.candidateProfile
                        ? "profile-state active"
                        : "profile-state"
                    }
                  >
                    {persisted.preferences.candidateProfile
                      ? "私有画像已启用"
                      : "当前为匿名模板"}
                  </span>
                </div>
                <p>
                  在这里粘贴本机私有画像 JSON。通过格式校验后，它只写入当前登录用户的
                  D1 空间，不会进入公开仓库，也不会与其他账号共享。
                </p>
                <label>
                  <span>候选人画像 JSON</span>
                  <textarea
                    data-testid="private-profile-import"
                    aria-label="候选人画像 JSON"
                    value={privateProfileDraft}
                    onChange={(event) =>
                      setPrivateProfileDraft(event.target.value)
                    }
                    placeholder='{"education": {...}, "priorityRoleFamilies": [...]}'
                    spellCheck={false}
                  />
                </label>
                <div className="private-profile-actions">
                  <button
                    className="primary-button"
                    data-testid="private-profile-save"
                    onClick={importPrivateProfile}
                    disabled={!privateProfileDraft.trim()}
                  >
                    校验并保存
                  </button>
                  {persisted.preferences.candidateProfile ? (
                    <button
                      className="secondary-button"
                      onClick={clearPrivateProfile}
                    >
                      恢复匿名模板
                    </button>
                  ) : null}
                  <span role="status" aria-live="polite">
                    {privateProfileMessage}
                  </span>
                </div>
              </article>
              <article className="panel">
                <span className="section-kicker">COVERAGE CONTRACT</span>
                <h3>公司宇宙覆盖原则</h3>
                <ul className="method-list">
                  <li>官方产业目录、协会成员和会议生态建立种子集合</li>
                  <li>按法人、母公司、品牌与收购关系进行规范化去重</li>
                  <li>只把有官方入口的实体标记为已验证</li>
                  <li>身份、赞助与出口限制落到具体岗位，不一刀切公司</li>
                  <li>保留 residual report，公开尚未核验与已过期节点</li>
                </ul>
              </article>
              <article className="panel">
                <span className="section-kicker">QUESTION SUPPLY CHAIN</span>
                <h3>题目质量合同</h3>
                <ul className="method-list">
                  <li>公开规范、官方文档、开源项目和原创同构任务</li>
                  <li>禁止复制付费题库、NDA 题目和泄露面经原文</li>
                  <li>每题包含交付物、评分规则、失败模式和追问</li>
                  <li>语义去重并记录适用岗位、技能和证据日期</li>
                  <li>AI 评分显示证据与不确定度，并接受真人校准</li>
                </ul>
              </article>
              <article className="panel evidence-source-panel">
                <span className="section-kicker">SOURCE SAMPLE</span>
                <h3>最近验证的一手入口</h3>
                <div className="source-list">
                  {companies
                    .flatMap((company) =>
                      company.evidence.map((evidence) => ({
                        ...evidence,
                        company: companyName(company),
                      })),
                    )
                    .filter((evidence) => evidence.url)
                    .slice(0, 18)
                    .map((evidence, index) => (
                      <a
                        href={evidence.url}
                        target="_blank"
                        rel="noreferrer"
                        key={`${evidence.url}-${index}`}
                      >
                        <span>{evidence.company}</span>
                        <strong>{evidence.title || "官方证据"}</strong>
                        <small>
                          {evidence.observedAt || effectiveProfile.evidenceDate} ↗
                        </small>
                      </a>
                    ))}
                </div>
              </article>
            </div>
          </section>
        ) : null}
      </main>

      <nav className="mobile-nav" aria-label="移动端导航">
        {views.map((item) => (
          <button
            key={item.id}
            className={view === item.id ? "active" : ""}
            aria-current={view === item.id ? "page" : undefined}
            onClick={() => {
              setView(item.id);
              setSearch("");
            }}
          >
            {item.short}
          </button>
        ))}
      </nav>

      {selectedCompany ? (
        <div className="modal-backdrop" role="presentation">
          <section
            ref={companyModalRef}
            className="detail-modal company-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-dialog-title"
            tabIndex={-1}
          >
            <button
              className="modal-close"
              onClick={() => {
                setApplicationBuilderVisible(false);
                setSelectedCompany(null);
              }}
              aria-label="关闭公司档案"
            >
              ×
            </button>
            <div className="modal-header">
              <span className="company-avatar large">
                {selectedCompany.nameEn.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <span className="section-kicker">
                  {regionLabel(regionOf(selectedCompany))} ·{" "}
                  {companyTypeLabel(selectedCompany.companyType)}
                </span>
                <h2 id="company-dialog-title">
                  <CompanyName company={selectedCompany} />
                </h2>
                <div className="modal-status-row">
                  <span className="tier-badge">
                    FIT {selectedCompany.fitTier || "TBD"}
                  </span>
                  <StatusDot signal={selectedCompany.visaSignal} />
                  <span>{confidenceLabel(selectedCompany.confidence)}</span>
                </div>
              </div>
            </div>

            <div className="scope-notice">
              <strong>组织档案，不是当前 JD</strong>
              <span>
                方向、要求、缺口与难度是分析标签；只有标为
                official-current-job 的证据才证明观察日存在具体岗位。
              </span>
            </div>
            <p className="modal-summary">{selectedCompany.whyRelevant}</p>
            <div className="tag-row canonical-role-row">
              {selectedCompany.roleFamilyIds.map((roleId) => (
                <span key={roleId}>
                  {(() => {
                    const role = roles.find((item) => item.id === roleId);
                    return role ? `${role.nameZh} / ${role.name}` : roleId;
                  })()}
                </span>
              ))}
            </div>
            <div className="modal-columns">
              <div>
                <h3>重点方向</h3>
                <div className="tag-row">
                  {selectedCompany.focusAreas.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3>机会形态</h3>
                <div className="tag-row">
                  {selectedCompany.opportunityTypes.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3>常见要求</h3>
                <ul>
                  {selectedCompany.requirements.slice(0, 8).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>你的补强点</h3>
                <ul>
                  {selectedCompany.gaps.slice(0, 8).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="modal-evidence">
              <h3>证据与官方入口</h3>
              {selectedCompany.evidence.slice(0, 6).map((evidence, index) => (
                <a
                  href={evidence.url}
                  target="_blank"
                  rel="noreferrer"
                  key={`${evidence.url}-${index}`}
                >
                  <span>{evidence.type || "official"}</span>
                  <strong>{evidence.title}</strong>
                  <small>{evidence.observedAt || selectedCompany.lastVerified} ↗</small>
                </a>
              ))}
            </div>

            {applicationBuilderVisible ? (
              <div className="application-builder">
                <div>
                  <span className="section-kicker">REQUISITION RECORD</span>
                  <h3>把组织线索落到具体岗位</h3>
                  <p>
                    如果岗位尚未开放，可先保存通用招聘页；开放后再补 JD、截止日、
                    身份条款、联系人和简历版本。
                  </p>
                </div>
                <div className="application-builder-grid">
                  <label>
                    <span>岗位名称 *</span>
                    <input
                      value={applicationDraft.roleTitle}
                      onChange={(event) =>
                        setApplicationDraft((draft) => ({
                          ...draft,
                          roleTitle: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>机会类型</span>
                    <select
                      value={applicationDraft.employmentType}
                      onChange={(event) =>
                        setApplicationDraft((draft) => ({
                          ...draft,
                          employmentType: event.target.value,
                        }))
                      }
                    >
                      {[
                        "internship",
                        "co-op",
                        "research",
                        "part-time",
                        "new-grad",
                        "unpaid",
                        "open-source",
                      ].map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>具体岗位 / 招聘页 URL</span>
                    <input
                      type="url"
                      value={applicationDraft.jobUrl}
                      onChange={(event) =>
                        setApplicationDraft((draft) => ({
                          ...draft,
                          jobUrl: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>截止日期</span>
                    <input
                      type="date"
                      value={applicationDraft.deadline}
                      onChange={(event) =>
                        setApplicationDraft((draft) => ({
                          ...draft,
                          deadline: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>身份 / 赞助信号</span>
                    <select
                      value={applicationDraft.sponsorshipSignal}
                      onChange={(event) =>
                        setApplicationDraft((draft) => ({
                          ...draft,
                          sponsorshipSignal: event.target.value,
                        }))
                      }
                    >
                      {["green", "yellow", "orange", "red", "unknown"].map(
                        (signal) => (
                          <option key={signal} value={signal}>
                            {signal}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    <span>出口管制信号</span>
                    <select
                      value={applicationDraft.exportSignal}
                      onChange={(event) =>
                        setApplicationDraft((draft) => ({
                          ...draft,
                          exportSignal: event.target.value,
                        }))
                      }
                    >
                      {["green", "yellow", "orange", "red", "unknown"].map(
                        (signal) => (
                          <option key={signal} value={signal}>
                            {signal}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    <span>联系人 / 内推</span>
                    <input
                      value={applicationDraft.contact}
                      onChange={(event) =>
                        setApplicationDraft((draft) => ({
                          ...draft,
                          contact: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>简历版本</span>
                    <input
                      value={applicationDraft.resumeVersion}
                      onChange={(event) =>
                        setApplicationDraft((draft) => ({
                          ...draft,
                          resumeVersion: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="wide-field">
                    <span>JD 关键词 / 技术栈</span>
                    <textarea
                      value={applicationDraft.jdKeywords}
                      onChange={(event) =>
                        setApplicationDraft((draft) => ({
                          ...draft,
                          jdKeywords: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="wide-field">
                    <span>匹配依据与备注</span>
                    <textarea
                      value={applicationDraft.notes}
                      onChange={(event) =>
                        setApplicationDraft((draft) => ({
                          ...draft,
                          notes: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <div className="modal-actions">
                  <button
                    className="secondary-button"
                    onClick={() => setApplicationBuilderVisible(false)}
                  >
                    取消
                  </button>
                  <button
                    className="primary-button"
                    disabled={!applicationDraft.roleTitle.trim()}
                    onClick={() => saveApplication(selectedCompany)}
                  >
                    保存具体岗位
                  </button>
                </div>
              </div>
            ) : null}

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => toggleBookmark(selectedCompany)}
              >
                {bookmarks.has(selectedCompany.id) ? "取消收藏" : "收藏目标"}
              </button>
              <button
                className="primary-button"
                onClick={() => beginApplication(selectedCompany)}
              >
                {applicationBuilderVisible ? "正在配置岗位" : "建立具体岗位记录"}
              </button>
              {selectedCompany.careerUrl ? (
                <a
                  className="text-link"
                  href={selectedCompany.careerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  官方招聘页 ↗
                </a>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {selectedQuestion ? (
        <div className="modal-backdrop" role="presentation">
          <section
            ref={questionModalRef}
            className="detail-modal question-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-dialog-title"
            tabIndex={-1}
          >
            <button
              className="modal-close"
              onClick={closeQuestion}
              aria-label="关闭训练任务 / Close task"
            >
              ×
            </button>
            <div className="question-modal-heading">
              <div>
                <span className="section-kicker">
                  {selectedQuestion.type} · {selectedQuestion.estimatedMinutes} MIN ·{" "}
                  {selectedQuestion.status} · V{selectedQuestion.contentVersion}
                </span>
                <h2 id="question-dialog-title">
                  <BilingualCopy
                    zh={selectedQuestion.titleZh}
                    en={selectedQuestion.title}
                    mode={questionLanguageMode}
                    className="question-dialog-title"
                  />
                </h2>
                {selectedQuestion.blueprintId ? (
                  <small className="question-lineage">
                    课程谱系 / Curriculum lineage ·{" "}
                    <code>{selectedQuestion.blueprintId}</code>
                  </small>
                ) : null}
              </div>
              <span className="difficulty-badge">
                {selectedQuestion.difficulty}
              </span>
            </div>

            <div
              className="modal-language-switcher segmented"
              role="group"
              aria-label="阅读顺序 / Reading mode"
            >
              {languageModeOptions.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={
                    questionLanguageMode === option.id ? "active" : ""
                  }
                  aria-pressed={questionLanguageMode === option.id}
                  onClick={() => setQuestionLanguageMode(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {questionDetailState === "loading" ? (
              <div className="question-detail-state" role="status" aria-live="polite">
                <span className="question-detail-loader" aria-hidden="true" />
                <div>
                  <strong>正在加载完整双语任务 / Loading full task</strong>
                  <p>
                    首屏只携带轻量索引；当前仅请求这道题所在的小型静态分片。
                    Only this task&apos;s deterministic detail shard is being
                    requested.
                  </p>
                </div>
                <BilingualCopy
                  zh={selectedQuestion.promptPreviewZh}
                  en={selectedQuestion.promptPreview}
                  mode={questionLanguageMode}
                  className="detail-preview-copy"
                />
              </div>
            ) : questionDetailState === "error" ? (
              <div className="question-detail-state error-state" role="alert">
                <span aria-hidden="true">!</span>
                <div>
                  <strong>题目详情暂时无法加载 / Detail unavailable</strong>
                  <p>
                    {questionDetailError ||
                      "请检查连接后重试；已加载的题目不会受影响。"}
                  </p>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void loadQuestionDetail(selectedQuestion)}
                  >
                    重试 / Retry
                  </button>
                </div>
              </div>
            ) : selectedQuestionDetail ? (
              <>
                <div className="prompt-box">
                  <BilingualCopy
                    zh={selectedQuestionDetail.promptZh}
                    en={selectedQuestionDetail.prompt}
                    mode={questionLanguageMode}
                  />
                </div>
                {selectedQuestion.status === "review-ready" ? (
                  <div className="scope-notice">
                    <strong>待校准 / Calibration pending</strong>
                    <span>
                      已通过结构与来源检查；尚未完成领域专家与真实练习者 pilot，
                      分数只用于自我比较，不写入岗位准备度。 Structure and source
                      checks are complete; expert and learner pilots are still
                      pending.
                    </span>
                  </div>
                ) : null}
                <div className="question-modal-grid">
                  <div>
                    <h3>你需要交付 / Deliverables</h3>
                    <BilingualList
                      zh={selectedQuestionDetail.deliverablesZh}
                      en={selectedQuestionDetail.deliverables}
                      mode={questionLanguageMode}
                      ordered
                    />
                  </div>
                  <div>
                    <h3>面试官可能追问 / Follow-ups</h3>
                    <BilingualList
                      zh={selectedQuestionDetail.followUpsZh}
                      en={selectedQuestionDetail.followUps}
                      mode={questionLanguageMode}
                      ordered
                    />
                  </div>
                </div>

                <label className="attempt-notes">
                  <span>作答记录与复盘 / Answer notes &amp; reflection</span>
                  <textarea
                    value={attemptNotes}
                    onChange={(event) => setAttemptNotes(event.target.value)}
                    placeholder="先独立写出思路、假设、关键取舍和验证方法 / Capture your reasoning, assumptions, trade-offs, and validation plan…"
                  />
                </label>

                <button
                  className="rubric-toggle"
                  onClick={() => setRubricVisible((value) => !value)}
                  aria-expanded={rubricVisible}
                >
                  {rubricVisible
                    ? "收起评分与参考 / Hide rubric & reference"
                    : "完成后查看评分与参考 / Reveal after attempting"}
                </button>

                {rubricVisible ? (
                  <div className="rubric-grid">
                    <div>
                      <h3>评分规则 / Rubric</h3>
                      <BilingualList
                        zh={selectedQuestionDetail.rubricZh}
                        en={selectedQuestionDetail.rubric}
                        mode={questionLanguageMode}
                      />
                    </div>
                    <div>
                      <h3>常见失败 / Common failures</h3>
                      <BilingualList
                        zh={selectedQuestionDetail.commonFailuresZh}
                        en={selectedQuestionDetail.commonFailures}
                        mode={questionLanguageMode}
                      />
                    </div>
                    {selectedQuestionDetail.referenceOutline?.length ||
                    selectedQuestionDetail.referenceOutlineZh?.length ? (
                      <div>
                        <h3>参考解题骨架 / Reference outline</h3>
                        <BilingualList
                          zh={selectedQuestionDetail.referenceOutlineZh}
                          en={selectedQuestionDetail.referenceOutline}
                          mode={questionLanguageMode}
                          ordered
                        />
                      </div>
                    ) : null}
                    {selectedQuestionDetail.oracle ||
                    selectedQuestionDetail.oracleZh ? (
                      <div>
                        <h3>可验证完成标准 / Verifiable oracle</h3>
                        <BilingualOracle
                          oracle={selectedQuestionDetail.oracle}
                          oracleZh={selectedQuestionDetail.oracleZh}
                          mode={questionLanguageMode}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="self-score">
                  <label>
                    <span>本次表现 / Score</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={attemptScore}
                      onChange={(event) =>
                        setAttemptScore(Number(event.target.value))
                      }
                    />
                    <strong>{attemptScore}</strong>
                  </label>
                  <label>
                    <span>自评置信度 / Confidence</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={attemptConfidence}
                      onChange={(event) =>
                        setAttemptConfidence(Number(event.target.value))
                      }
                    />
                    <strong>{attemptConfidence}</strong>
                  </label>
                </div>

                <details className="question-sources">
                  <summary>
                    <span>公开依据 / Public sources</span>
                    <strong>
                      {selectedQuestionDetail.sourceRefs.length} 个链接 / links
                    </strong>
                  </summary>
                  <div className="question-source-list">
                    {selectedQuestionDetail.sourceRefs.map((source, index) => {
                      const url = sourceUrl(source);
                      if (!url) return null;
                      const title = sourceTitle(source, index);
                      return (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${title}，打开公开依据`}
                          key={`${url}-${index}`}
                        >
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <strong>{title}</strong>
                          <small>{url} ↗</small>
                        </a>
                      );
                    })}
                  </div>
                </details>

                <div className="modal-actions">
                  <button className="secondary-button" onClick={closeQuestion}>
                    暂不保存 / Close
                  </button>
                  <button className="primary-button" onClick={saveAttempt}>
                    保存本次训练 / Save attempt
                  </button>
                </div>
              </>
            ) : (
              <div className="question-detail-state error-state" role="alert">
                <span aria-hidden="true">!</span>
                <div>
                  <strong>详情状态异常 / Unexpected detail state</strong>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void loadQuestionDetail(selectedQuestion)}
                  >
                    重试 / Retry
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

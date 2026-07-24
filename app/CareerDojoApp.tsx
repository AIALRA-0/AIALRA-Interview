"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import categoryLabelsEnRaw from "../data/organization-category-labels.en.json";
import categoryLabelsZhRaw from "../data/organization-category-labels.zh.json";
import expansionCnCategoryLabelsRaw from "../data/expansion-cn-category-labels.json";
import expansionCnCompanyTypeLabelsRaw from "../data/expansion-cn-company-type-labels.json";
import expansionUsCategoryLabelsRaw from "../data/expansion-us-category-labels.json";
import organizationLabelsRaw from "../data/organization-labels.json";
import organizationIntelligenceRaw from "../data/organization-intelligence.json";
import rolePresentationRaw from "../data/role-presentation.json";
import skillPresentationRaw from "../data/skill-presentation.json";
import { evidenceTypeLabel } from "./organization-intelligence";
import type {
  ApplicationRecord,
  BilingualTerm,
  Company,
  InterviewQuestion,
  InterviewQuestionSummary,
  OrganizationBankBootstrap,
  OrganizationRelation,
  OrganizationUniverseAsset,
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
  "mission" | "atlas" | "roles" | "dojo" | "applications" | "evidence";

type AtlasLayout = "tree" | "cards";
type QuestionLanguageMode = "bilingual" | "zh-first" | "en-first";
type QuestionIndexState = "loading" | "ready" | "error";
type QuestionDetailState = "idle" | "loading" | "ready" | "error";
type OrganizationIndexState = "loading" | "ready" | "error";

type AppProps = {
  initialCompanies: Company[];
  organizationBank: OrganizationBankBootstrap;
  organizationRelations: OrganizationRelation[];
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
    applications: Array.isArray(value?.applications) ? value.applications : [],
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
  { id: "mission", label: "任务总览 / Mission", short: "总览 / Home" },
  {
    id: "atlas",
    label: "组织宇宙 / Organization Atlas",
    short: "组织 / Atlas",
  },
  {
    id: "roles",
    label: "岗位能力图 / Role Capability Map",
    short: "岗位 / Roles",
  },
  { id: "dojo", label: "面试道场 / Interview Dojo", short: "训练 / Dojo" },
  {
    id: "applications",
    label: "投递作战室 / Application War Room",
    short: "投递 / Apply",
  },
  {
    id: "evidence",
    label: "研究证据 / Research Evidence",
    short: "证据 / Evidence",
  },
];

const applicationStages = [
  ["researching", "调研中 / Researching"],
  ["ready", "准备投递 / Ready"],
  ["applied", "已投递 / Applied"],
  ["oa", "在线测评 / OA"],
  ["interview", "面试 / Interview"],
  ["offer", "录用 / Offer"],
  ["closed", "关闭 / Closed"],
] as const;

const employmentTypeOptions = [
  ["internship", "实习 / Internship"],
  ["co-op", "合作教育 / Co-op"],
  ["research", "科研 / Research"],
  ["part-time", "兼职 / Part-time"],
  ["new-grad", "应届岗位 / New graduate"],
  ["unpaid", "无薪机会 / Unpaid opportunity"],
  ["open-source", "开源贡献 / Open-source contribution"],
] as const;

const screeningSignalOptions = [
  ["green", "可投初筛 / Initial fit"],
  ["yellow", "赞助待核 / Sponsorship check"],
  ["orange", "出口复核 / Export review"],
  ["red", "硬门槛 / Restricted"],
  ["unknown", "待核验 / Unverified"],
] as const;

const regionLabels = organizationLabelsRaw.regionGroups;
const companyTypeLabels = {
  ...organizationLabelsRaw.companyTypes,
  ...expansionCnCompanyTypeLabelsRaw,
} as Record<string, { zh: string; en: string }>;
const chinaOwnershipLabels: Record<string, { zh: string; en: string }> = {
  "central-state-owned": {
    zh: "中央国有独资或中央企业集团",
    en: "Central State-Owned Enterprise or Group",
  },
  "central-state-controlled": {
    zh: "中央国有控股",
    en: "Central State-Controlled",
  },
  "central-state-subsidiary": {
    zh: "中央企业子公司",
    en: "Central State-Owned Subsidiary",
  },
  "local-state-owned": {
    zh: "地方国有企业",
    en: "Local State-Owned Enterprise",
  },
  "state-controlled": {
    zh: "国有控股",
    en: "State-Controlled",
  },
  "state-invested": {
    zh: "国有参股",
    en: "State-Invested",
  },
  "state-joint-venture": {
    zh: "国有合资",
    en: "State Joint Venture",
  },
  private: {
    zh: "民营控制",
    en: "Privately Controlled",
  },
  "foreign-controlled": {
    zh: "外资控制",
    en: "Foreign-Controlled",
  },
  "mixed-or-unknown": {
    zh: "混合或未知",
    en: "Mixed or Unknown",
  },
};
Object.assign(companyTypeLabels, chinaOwnershipLabels);
const chinaOwnershipOrder = Object.keys(chinaOwnershipLabels);
const categoryLabels = {
  ...categoryLabelsEnRaw.labels,
  ...categoryLabelsZhRaw.labels,
  ...expansionUsCategoryLabelsRaw,
  ...expansionCnCategoryLabelsRaw,
} as Record<string, { zh: string; en: string }>;
const categoryAtomOverrides =
  organizationIntelligenceRaw.categoryAtomOverrides as Record<
    string,
    BilingualTerm[]
  >;
const rolePresentation = rolePresentationRaw.roles as Record<
  string,
  {
    descriptionZh: string;
    descriptionEn: string;
    typicalTitleAtoms: BilingualTerm[];
    interviewStageAtoms: BilingualTerm[];
  }
>;
const skillPresentation = skillPresentationRaw.skills as Record<
  string,
  { displayTerms: BilingualTerm[] }
>;

function rolePresentationFor(role: RoleFamily) {
  return (
    rolePresentation[role.id] || {
      descriptionZh: role.nameZh,
      descriptionEn: role.description,
      typicalTitleAtoms: [
        { id: `${role.id}:primary`, zh: role.nameZh, en: role.name },
      ],
      interviewStageAtoms: role.interviewStages.map((stage, index) => ({
        id: `${role.id}:stage:${index + 1}`,
        zh: stage,
        en: stage,
      })),
    }
  );
}

const skillDomainLabels: Record<string, { zh: string; en: string }> = {
  "shared-foundations": { zh: "通用基础", en: "Shared Foundations" },
  "shared-communication": { zh: "通用沟通", en: "Shared Communication" },
  "eda-rd": { zh: "EDA 研发", en: "EDA Research" },
  "ai-for-eda": { zh: "EDA 智能", en: "AI for EDA" },
  "cad-flow": { zh: "CAD 流程", en: "CAD Flow" },
  rtl: { zh: "RTL 设计", en: "RTL Design" },
  verification: { zh: "设计验证", en: "Design Verification" },
  fpga: { zh: "FPGA 工程", en: "FPGA Engineering" },
  architecture: { zh: "计算机体系结构", en: "Computer Architecture" },
  "physical-design": { zh: "物理实现", en: "Physical Implementation" },
  dft: { zh: "可测试性设计", en: "Design for Test" },
  "analog-custom": { zh: "模拟电路设计", en: "Analog Circuit Design" },
  embedded: { zh: "嵌入式系统", en: "Embedded Systems" },
  "manufacturing-automation": {
    zh: "制造自动化",
    en: "Manufacturing Automation",
  },
  behavioral: { zh: "行为面试", en: "Behavioral Interview" },
  "project-deep-dive": { zh: "项目深挖", en: "Project Deep Dive" },
  "technical-english": { zh: "技术英语", en: "Technical English" },
};

const questionTypeLabels: Record<string, { zh: string; en: string }> = {
  conceptual: { zh: "概念推理", en: "Conceptual Reasoning" },
  coding: { zh: "编程任务", en: "Coding Task" },
  debugging: { zh: "调试任务", en: "Debugging Task" },
  design: { zh: "设计任务", en: "Design Task" },
  "log-analysis": { zh: "日志分析", en: "Log Analysis" },
  "waveform-analysis": { zh: "波形分析", en: "Waveform Analysis" },
  "system-task": { zh: "系统任务", en: "System Task" },
  "boss-fight": { zh: "综合挑战", en: "Boss Challenge" },
  behavioral: { zh: "行为面试", en: "Behavioral Interview" },
  "project-deep-dive": { zh: "项目深挖", en: "Project Deep Dive" },
  "english-communication": {
    zh: "英文表达",
    en: "English Communication",
  },
};

const learningLevelLabels: Record<string, { zh: string; en: string }> = {
  entry: { zh: "入门", en: "Entry" },
  foundation: { zh: "基础", en: "Foundation" },
  intermediate: { zh: "进阶", en: "Intermediate" },
  advanced: { zh: "高级", en: "Advanced" },
};

const difficultyLabels: Record<string, { zh: string; en: string }> = {
  entry: { zh: "入门", en: "Entry" },
  easy: { zh: "容易", en: "Easy" },
  medium: { zh: "中等", en: "Medium" },
  hard: { zh: "困难", en: "Hard" },
};

const questionStatusLabels: Record<string, { zh: string; en: string }> = {
  active: { zh: "已发布", en: "Active" },
  "review-ready": { zh: "可供审阅", en: "Review Ready" },
};

const relationTypeLabels: Record<string, { zh: string; en: string }> = {
  "corporate-family": { zh: "企业家族", en: "Corporate Family" },
  acquisition: { zh: "收购", en: "Acquisition" },
  combination: { zh: "合并", en: "Combination" },
  "technology-license": { zh: "技术许可", en: "Technology License" },
};

const relationStatusLabels: Record<string, { zh: string; en: string }> = {
  active: { zh: "有效", en: "Active" },
  pending: { zh: "待完成", en: "Pending" },
  completed: { zh: "已完成", en: "Completed" },
  terminated: { zh: "已终止", en: "Terminated" },
};

function bilingualLabel(
  value: string,
  catalog: Record<string, { zh: string; en: string }>,
) {
  const label = catalog[value];
  return label ? `${label.zh} / ${label.en}` : value;
}

function regionOf(company: Company): "US" | "CN" | "Global" {
  return company.opportunityMarket;
}

function regionLabel(region: string) {
  const label =
    regionLabels[region as keyof typeof organizationLabelsRaw.regionGroups];
  return label ? `${label.zh} / ${label.en}` : "地区待核验 / Region unverified";
}

function organizationClassKey(company: Company) {
  if (regionOf(company) !== "CN" || company.companyType !== "company") {
    return company.companyType;
  }
  if (company.ownership) return company.ownership.ownershipClass;

  const categories = new Set(company.categories);
  if (categories.has("央企子公司")) return "central-state-subsidiary";
  if (categories.has("央企控股")) return "central-state-controlled";
  if (categories.has("央企")) return "central-state-owned";
  if (categories.has("地方国企")) return "local-state-owned";
  if (categories.has("国企控股")) return "state-controlled";
  if (categories.has("国企参股")) return "state-invested";
  if (categories.has("国企合资")) return "state-joint-venture";
  if (categories.has("民营") || categories.has("民营上市")) {
    return "private";
  }
  return "mixed-or-unknown";
}

function organizationClassLabel(company: Company) {
  const label = organizationClassTerm(company);
  return `${label.zh} / ${label.en}`;
}

function organizationClassTerm(company: Company) {
  return company.ownership
    ? { zh: company.ownership.labelZh, en: company.ownership.labelEn }
    : companyTypeLabels[organizationClassKey(company)] || {
        zh: "未分类",
        en: "Unclassified",
      };
}

function categoryLabel(category: string) {
  const label = categoryLabels[category];
  if (!label) return "未分类 / Unclassified";
  return `${label.zh} / ${label.en}`;
}

function categoryAtoms(category: string): BilingualTerm[] {
  const override = categoryAtomOverrides[category];
  if (override) return override;
  const label = categoryLabels[category];
  return label
    ? [{ id: `category:${canonicalCategoryId(category)}`, ...label }]
    : [];
}

function canonicalCategoryId(category: string) {
  const label = categoryLabels[category];
  return (label?.en || category)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\-–—_/（）()，,：:·.]/g, "");
}

function BilingualNodeLabel({ label }: { label: { zh: string; en: string } }) {
  return (
    <span className="bilingual-node-label">
      <span lang="zh-CN">{label.zh}</span>
      <span lang="en">{label.en}</span>
    </span>
  );
}

function BilingualTermLabel({
  term,
  className = "",
}: {
  term: Pick<BilingualTerm, "zh" | "en">;
  className?: string;
}) {
  return (
    <span className={`bilingual-term ${className}`.trim()}>
      <span lang="zh-CN">{term.zh}</span>
      <span lang="en">{term.en}</span>
    </span>
  );
}

function BilingualHeading({ zh, en }: { zh: string; en: string }) {
  return (
    <span className="bilingual-heading">
      <span lang="zh-CN">{zh}</span>
      <span lang="en">{en}</span>
    </span>
  );
}

function BilingualParagraph({
  zh,
  en,
  className = "",
}: {
  zh: string;
  en: string;
  className?: string;
}) {
  return (
    <span className={`bilingual-paragraph ${className}`.trim()}>
      <span lang="zh-CN">{zh}</span>
      <span lang="en">{en}</span>
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
      <span
        lang={company.nameZh ? "zh-CN" : "en"}
        className="organization-name-primary"
      >
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

function signalKey(
  signal: string,
): "green" | "yellow" | "orange" | "red" | "unknown" {
  const value = signal.toLowerCase();
  if (value.includes("green") || value.includes("friendly")) return "green";
  if (value.includes("yellow") || value.includes("mixed")) return "yellow";
  if (value.includes("orange") || value.includes("export")) return "orange";
  if (value.includes("red") || value.includes("restricted")) return "red";
  return "unknown";
}

function confidenceLabel(value: string) {
  const normalized = String(value).toLowerCase();
  if (normalized.includes("high") || normalized.includes("高")) {
    return "高置信 / High confidence";
  }
  if (normalized.includes("medium") || normalized.includes("中")) {
    return "中置信 / Medium confidence";
  }
  if (normalized.includes("low") || normalized.includes("低")) {
    return "待核验 / Needs verification";
  }
  return value || "待核验 / Needs verification";
}

function ownershipReviewStatusLabel(value: string) {
  return value === "provisionally-audited"
    ? "暂定审计完成 / Provisionally audited"
    : "待补直接控制权来源 / Direct control source needed";
}

function ownershipClassificationBasisLabel(value: string) {
  return value === "existing-explicit-ownership-category"
    ? "已有明确源类别 / Existing explicit source tag"
    : "直接控制权证据不足 / Insufficient direct control evidence";
}

function ownershipEvidenceScopeLabel(value: string) {
  return value === "direct-ownership-registry"
    ? "直接所有制名录 / Direct ownership registry"
    : "组织资料复核入口 / Organization-context review source";
}

function fitTierLabel(value: string) {
  const normalized = String(value || "TBD").toUpperCase();
  if (normalized === "P0") return "P0 · 核心 / Core";
  if (normalized === "P1") return "P1 · 优先 / Priority";
  if (normalized === "P2") return "P2 · 扩展 / Expansion";
  if (normalized === "P3") return "P3 · 观察 / Watch";
  return "待评估 / To assess";
}

function organizationDifficultyLabel(value: string) {
  const normalized = String(value).toLowerCase();
  if (normalized === "s") return "极高竞争 / Extremely competitive";
  if (normalized === "a") return "高竞争 / Highly competitive";
  if (normalized === "b") return "选择性竞争 / Selective";
  if (normalized === "role-specific") {
    return "按具体岗位核验 / Verify per requisition";
  }
  return "待核验 / Unverified";
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

function employmentTypeLabel(value: string) {
  return (
    employmentTypeOptions.find(([id]) => id === value)?.[1] ||
    `${value} / Posting-specific type`
  );
}

function priorityLabel(value: string) {
  return value === "high"
    ? "高 / High"
    : value === "medium"
      ? "中 / Medium"
      : value === "low"
        ? "低 / Low"
        : `${value} / Unclassified`;
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

function skillTerms(skill: SkillNode): BilingualTerm[] {
  return (
    skillPresentation[skill.id]?.displayTerms || [
      {
        id: skill.id,
        zh:
          skill.titleZh ||
          skill.nameZh ||
          skill.title ||
          skill.name ||
          skill.id,
        en:
          skill.title ||
          skill.name ||
          skill.titleZh ||
          skill.nameZh ||
          skill.id,
      },
    ]
  );
}

function skillLabel(skill: SkillNode) {
  return skillTerms(skill)
    .map((term) => `${term.zh} / ${term.en}`)
    .join(" · ");
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
    return `公开依据 ${String(index + 1).padStart(2, "0")} / Public source ${String(
      index + 1,
    ).padStart(2, "0")} · ${hostname}`;
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
    label: "中英对照 / Bilingual",
    description: "中英并列 / Chinese and English side by side",
  },
  {
    id: "zh-first",
    label: "中文优先 / Chinese first",
    description: "中文在前，保留英文 / Chinese first, English retained",
  },
  {
    id: "en-first",
    label: "英文优先 / English first",
    description: "英文在前，保留中文 / English first, Chinese retained",
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
    Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)
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
  return `${characters
    .slice(0, maxLength - 1)
    .join("")
    .trimEnd()}…`;
}

async function sha256Hex(value: string) {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "当前浏览器不支持资源完整性校验 / This browser cannot verify asset integrity.",
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
    throw new Error("题库索引数量不匹配 / Question index count mismatch.");
  }
  if (
    !/^[0-9a-f]{64}$/.test(value.sourceSha256 as string) ||
    typeof value.previewLength !== "number" ||
    !Number.isInteger(value.previewLength) ||
    value.previewLength < 80 ||
    value.previewLength > 320
  ) {
    throw new Error("题库索引元数据无效 / Invalid question index metadata.");
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
      !/^[0-9a-f]{64}$/.test(expected.shardSha256ById[summary.shardId] || "") ||
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

function validateOrganizationUniverse(
  value: unknown,
  expected: OrganizationBankBootstrap,
): OrganizationUniverseAsset {
  if (
    !isRecord(value) ||
    value.schemaVersion !== expected.schemaVersion ||
    value.assetVersion !== expected.assetVersion ||
    value.sourceSha256 !== expected.sourceSha256 ||
    value.evidenceDate !== expected.evidenceDate ||
    value.organizationCount !== expected.organizationCount ||
    !Array.isArray(value.organizations) ||
    value.organizations.length !== expected.organizationCount
  ) {
    throw new Error(
      "组织资料版本或数量不匹配 / Organization-universe version or count mismatch.",
    );
  }
  const ids = new Set<string>();
  for (const organization of value.organizations) {
    if (
      !isRecord(organization) ||
      !isNonEmptyString(organization.id) ||
      ids.has(organization.id) ||
      !isNonEmptyString(organization.nameEn) ||
      !isNonEmptyString(organization.descriptionZh) ||
      !isNonEmptyString(organization.descriptionEn) ||
      !isNonEmptyString(organization.relevanceZh) ||
      !isNonEmptyString(organization.relevanceEn) ||
      !["US", "CN", "Global"].includes(
        String(organization.opportunityMarket),
      ) ||
      !Array.isArray(organization.focusAtoms) ||
      !Array.isArray(organization.roleAtoms) ||
      !Array.isArray(organization.opportunityAtoms) ||
      !Array.isArray(organization.requirementAtoms) ||
      !Array.isArray(organization.preparationAtoms) ||
      (organization.ownership !== undefined &&
        (!isRecord(organization.ownership) ||
          !isNonEmptyString(organization.ownership.ownershipClass) ||
          !isNonEmptyString(organization.ownership.labelZh) ||
          !isNonEmptyString(organization.ownership.labelEn) ||
          !isNonEmptyString(organization.ownership.definitionZh) ||
          !isNonEmptyString(organization.ownership.definitionEn) ||
          !isNonEmptyString(organization.ownership.summaryZh) ||
          !isNonEmptyString(organization.ownership.summaryEn) ||
          !isNonEmptyString(organization.ownership.confidence) ||
          !isNonEmptyString(organization.ownership.classificationBasis) ||
          !(
            organization.ownership.sourceOwnershipTag === null ||
            isNonEmptyString(organization.ownership.sourceOwnershipTag)
          ) ||
          !isNonEmptyString(organization.ownership.reviewStatus) ||
          !isNonEmptyString(organization.ownership.reviewedAt) ||
          !Array.isArray(organization.ownership.evidence) ||
          organization.ownership.evidence.length === 0 ||
          organization.ownership.evidence.some(
            (evidence) =>
              !isRecord(evidence) ||
              !isNonEmptyString(evidence.titleZh) ||
              !isNonEmptyString(evidence.titleEn) ||
              !isNonEmptyString(evidence.url) ||
              !isNonEmptyString(evidence.evidenceScope) ||
              !isNonEmptyString(evidence.noteZh) ||
              !isNonEmptyString(evidence.noteEn),
          )))
    ) {
      throw new Error(
        "组织资料包含无效或重复节点 / Organization universe contains an invalid or duplicate node.",
      );
    }
    ids.add(organization.id);
  }
  return value as unknown as OrganizationUniverseAsset;
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
    throw new Error(
      "题目分片版本或结构不匹配 / Question shard version or structure mismatch.",
    );
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
    throw new Error(
      "题目分片数量与已验证索引不匹配 / Question shard count does not match the verified index.",
    );
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
      throw new Error(
        "题目详情与已验证摘要不一致 / Question detail does not match the verified summary.",
      );
    }
    const derivedShardId = (await sha256Hex(candidate.id)).slice(0, 2);
    if (derivedShardId !== expectedShardId) {
      throw new Error(
        "题目 ID 与确定性分片不一致 / Question ID does not match its deterministic shard.",
      );
    }
    seen.add(candidate.id);
  }

  if (seen.size !== expectedIds.size) {
    throw new Error(
      "题目分片缺失索引中的题目 / Question shard is missing an indexed task.",
    );
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
      text: zh?.trim() || "中文版本待校订 / Chinese version pending review",
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
      aria-label="岗位准备度 / Role readiness"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

export function CareerDojoApp({
  initialCompanies,
  organizationBank,
  organizationRelations,
  roles,
  skills,
  questionBank,
  profile,
}: AppProps) {
  const [view, setView] = useState<ViewId>("mission");
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [organizationIndexState, setOrganizationIndexState] =
    useState<OrganizationIndexState>("loading");
  const [organizationIndexError, setOrganizationIndexError] = useState("");
  const [organizationIndexRetryKey, setOrganizationIndexRetryKey] = useState(0);
  const [persisted, setPersisted] = useState<PersistedState>(emptyState);
  const [syncState, setSyncState] = useState<"loading" | "ready" | "offline">(
    "loading",
  );
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [ownership, setOwnership] = useState("ALL");
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
    const separator = organizationBank.assetUrl.includes("?") ? "&" : "?";
    const assetUrl = `${organizationBank.assetUrl}${separator}v=${encodeURIComponent(
      organizationBank.assetVersion,
    )}`;

    fetch(assetUrl, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `组织资料请求失败（${response.status}）/ Organization-universe request failed (${response.status}).`,
          );
        }
        return parseVerifiedJson(
          response,
          organizationBank.assetSha256,
          "组织资料 / Organization universe",
        );
      })
      .then((value) => {
        const universe = validateOrganizationUniverse(value, organizationBank);
        if (!active) return;
        setCompanies(universe.organizations);
        setOrganizationIndexState("ready");
      })
      .catch((error: unknown) => {
        if (
          !active ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }
        setOrganizationIndexState("error");
        setOrganizationIndexError(
          error instanceof Error
            ? error.message
            : "组织资料暂时无法加载 / Organization universe is temporarily unavailable.",
        );
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [organizationBank, organizationIndexRetryKey]);

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
        (activeElement === first || activeElement === modal || focusIsOutside)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === last || activeElement === modal || focusIsOutside)
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
      for (const atom of categoryAtoms(rawCategory)) {
        const filterId = `category-filter:${canonicalCategoryId(atom.en)}`;
        const current = groups.get(filterId);
        if (!current) {
          groups.set(filterId, {
            id: filterId,
            values: [rawCategory],
            zh: atom.zh,
            en: atom.en,
          });
          continue;
        }
        current.values.push(rawCategory);
      }
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
  const ownershipOptions = useMemo(() => {
    const options = new Map<
      string,
      { id: string; label: { zh: string; en: string }; count: number }
    >();
    for (const company of companies) {
      if (
        regionOf(company) !== "CN" ||
        company.companyType !== "company" ||
        !company.ownership
      ) {
        continue;
      }
      const id = company.ownership.ownershipClass;
      const current = options.get(id);
      options.set(id, {
        id,
        label: {
          zh: company.ownership.labelZh,
          en: company.ownership.labelEn,
        },
        count: (current?.count || 0) + 1,
      });
    }
    return chinaOwnershipOrder
      .map((id) => options.get(id))
      .filter(
        (
          option,
        ): option is {
          id: string;
          label: { zh: string; en: string };
          count: number;
        } => Boolean(option),
      );
  }, [companies]);
  const companyById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );
  const selectedCompanyRelations = selectedCompany
    ? organizationRelations.filter(
        (relation) =>
          relation.fromOrganizationId === selectedCompany.id ||
          relation.toOrganizationId === selectedCompany.id,
      )
    : [];

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
          ownership === "ALL" ||
          company.ownership?.ownershipClass === ownership,
      )
      .filter(
        (company) => visa === "ALL" || signalKey(company.visaSignal) === visa,
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
          organizationClassLabel(company),
          company.ownership?.summaryZh || "",
          company.ownership?.summaryEn || "",
          company.ownership?.definitionZh || "",
          company.ownership?.definitionEn || "",
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
          company.descriptionZh,
          company.descriptionEn,
          company.relevanceZh,
          company.relevanceEn,
          ...company.focusAtoms.flatMap((item) => [item.zh, item.en]),
          ...company.roleAtoms.flatMap((item) => [item.zh, item.en]),
          ...company.opportunityAtoms.flatMap((item) => [item.zh, item.en]),
          ...company.requirementAtoms.flatMap((item) => [item.zh, item.en]),
          ...company.preparationAtoms.flatMap((item) => [item.zh, item.en]),
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
    ownership,
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
            new Set(nodes.map((company) => organizationClassKey(company))),
          )
            .sort((a, b) => {
              const leftOwnershipRank = chinaOwnershipOrder.indexOf(a);
              const rightOwnershipRank = chinaOwnershipOrder.indexOf(b);
              if (leftOwnershipRank >= 0 || rightOwnershipRank >= 0) {
                return (
                  (leftOwnershipRank < 0
                    ? Number.POSITIVE_INFINITY
                    : leftOwnershipRank) -
                  (rightOwnershipRank < 0
                    ? Number.POSITIVE_INFINITY
                    : rightOwnershipRank)
                );
              }
              return a.localeCompare(b);
            })
            .map((organizationClass) => ({
              organizationClass,
              companies: nodes.filter(
                (company) =>
                  organizationClassKey(company) === organizationClass,
              ),
            }));
          return { region: treeRegion, nodes, groups };
        })
        .filter((group) => group.nodes.length > 0),
    [filteredCompanies],
  );

  const priorityCompanies = companies
    .filter((company) => fitRank(company.fitTier) <= 1)
    .sort((a, b) => fitRank(a.fitTier) - fitRank(b.fitTier))
    .slice(0, 8);
  const bookmarks = new Set(persisted.bookmarks);
  const currentQuestionVersion = new Map(
    questions.map((question) => [question.id, question.contentVersion]),
  );
  const completedQuestions = new Set([
    ...persisted.questionStats
      .filter((stat) => stat.attempts > 0)
      .map((stat) => stat.question_id),
    ...persisted.questionAttempts.map((attempt) => attempt.question_id),
  ]);
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
    ? persisted.questionStats.reduce((total, stat) => total + stat.attempts, 0)
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
            question.status === "active" && question.skills.includes(skillId),
        )
        .map((question) => question.id),
    );
    const stats = persisted.questionStats.filter(
      (stat) =>
        stat.attempts > 0 &&
        relatedQuestionIds.has(stat.question_id) &&
        currentQuestionVersion.get(stat.question_id) === stat.question_version,
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
            question.status === "active" && question.skills.includes(skillId),
        )
        .map((question) => question.id),
    );
    return persisted.questionStats.some(
      (stat) =>
        stat.attempts > 0 &&
        relatedQuestionIds.has(stat.question_id) &&
        currentQuestionVersion.get(stat.question_id) === stat.question_version,
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
    const titleTerm = role
      ? rolePresentationFor(role).typicalTitleAtoms[0]
      : company.roleAtoms[0];
    const rank = fitRank(company.fitTier);
    setApplicationDraft({
      roleTitle: titleTerm
        ? `${titleTerm.zh} / ${titleTerm.en}`
        : "目标岗位待确认 / Target role to verify",
      employmentType: "internship",
      jobUrl: company.careerUrl,
      deadline: "",
      sponsorshipSignal: signalKey(company.visaSignal),
      exportSignal:
        signalKey(company.visaSignal) === "red" ? "orange" : "unknown",
      contact: "",
      resumeVersion: "",
      jdKeywords: company.requirementAtoms
        .map((term) => `${term.zh} / ${term.en}`)
        .join(" · "),
      sourceObservedAt: company.lastVerified,
      matchScore: rank === 0 ? 88 : rank === 1 ? 76 : rank === 2 ? 62 : 45,
      notes: `${company.relevanceZh}\n${company.relevanceEn}`,
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
        `确认从投递作战室删除 ${currentCompanyName} — ${application.role_title}？ / Remove ${currentCompanyName} — ${application.role_title} from the application war room?`,
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
        setPrivateProfileMessage(
          "画像超过 8,000 字符，请精简后重试。 / The profile exceeds 8,000 characters; shorten it and try again.",
        );
        return;
      }
      const saved = await mutate({
        action: "setPreference",
        key: "candidateProfile",
        value: serialized,
      });
      if (saved) {
        setPrivateProfileDraft("");
        setPrivateProfileMessage(
          "私有画像已保存并应用。 / Private profile saved and applied.",
        );
      } else {
        setPrivateProfileMessage(
          "暂时无法保存，请稍后重试。 / Unable to save right now; please try again later.",
        );
      }
    } catch {
      setPrivateProfileMessage(
        "画像格式无效：请使用完整 JSON，并保留教育、目标岗位和关键缺口字段。 / Invalid profile format: use complete JSON and retain the education, target-role, and critical-gap fields.",
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
      saved
        ? "已恢复公开安全的匿名模板。 / Restored the public-safe anonymous template."
        : "暂时无法清除，请稍后重试。 / Unable to clear the profile right now; please try again later.",
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
      if (!verifiedIndex || !/^[0-9a-f]{64}$/.test(expectedShardSha256 || "")) {
        throw new Error(
          "题库索引或分片摘要尚未通过校验 / The question index or shard digest has not been verified.",
        );
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
            throw new Error(
              `详情分片返回 ${response.status} / Detail shard returned ${response.status}.`,
            );
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
          if (
            questionShardCacheRef.current.get(question.shardId) === shardPromise
          ) {
            questionShardCacheRef.current.delete(question.shardId);
          }
        });
      }

      await shardPromise;
      const detail = questionDetailCacheRef.current.get(question.id);
      if (!detail || detail.contentVersion !== question.contentVersion) {
        throw new Error(
          "分片中找不到当前版本的题目详情 / The current question version is missing from its shard.",
        );
      }
      if (questionLoadRequestRef.current !== requestId) return;
      setSelectedQuestionDetail(detail);
      setQuestionDetailState("ready");
    } catch (error) {
      if (questionLoadRequestRef.current !== requestId) return;
      setSelectedQuestionDetail(null);
      setQuestionDetailState("error");
      setQuestionDetailError(
        error instanceof Error
          ? error.message
          : "题目详情加载失败 / Question detail failed to load.",
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
          aria-label="回到任务总览 / Return to mission overview"
        >
          <span className="brand-mark">A</span>
          <span>
            <strong>AIALRA</strong>
            <small>CAREER DOJO</small>
          </span>
        </button>

        <nav aria-label="主要导航 / Primary navigation">
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
                ? "进度已保存 / Progress saved"
                : syncState === "loading"
                  ? "正在同步 / Syncing"
                  : "只读研究模式 / Read-only research"}
            </strong>
            <small>D1 · 证据快照 / evidence snapshot</small>
          </div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <span className="eyebrow topbar-context-full">
              {effectiveProfile.targetWindow} /{" "}
              {effectiveProfile.targetWindowEn || "Target window"} ·{" "}
              {effectiveProfile.education.program} /{" "}
              {effectiveProfile.education.programEn || "Education"} ·{" "}
              {effectiveProfile.education.workAuthorization} /{" "}
              {effectiveProfile.education.workAuthorizationEn ||
                "Work authorization not configured"}
            </span>
            <span className="eyebrow topbar-context-mobile">
              {effectiveProfile.targetWindow} /{" "}
              {effectiveProfile.targetWindowEn || "Target window"}
            </span>
            <h1>{views.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <span className="evidence-pill">
              <i />
              证据日期 / Evidence date {effectiveProfile.evidenceDate}
            </span>
            <button
              className="primary-button"
              onClick={() => {
                setRoleFilter(
                  effectiveProfile.priorityRoleFamilies[0] || "ALL",
                );
                setView("dojo");
              }}
            >
              <span className="topbar-action-full">
                开始今日训练 / Start today&apos;s training
              </span>
              <span className="topbar-action-mobile">训练 / Train</span>
            </button>
          </div>
        </header>

        {syncState === "offline" ? (
          <div className="sync-banner">
            持久化服务暂不可用；公司与题库仍可浏览，进度写入将在部署后恢复。
            <span lang="en">
              Persistence is temporarily unavailable. The atlas and question
              bank remain readable; progress writes will resume after
              deployment.
            </span>
          </div>
        ) : null}

        {view === "mission" ? (
          <section className="view mission-view">
            <div className="hero-grid">
              <article className="hero-card">
                <div>
                  <span className="section-kicker">
                    证据 → 掌握 / EVIDENCE → MASTERY
                  </span>
                  <h2>
                    不是盲投，也不是盲刷。 / Apply with evidence. Train with
                    purpose.
                  </h2>
                  <p>
                    以公司和岗位证据为起点，把每个缺口变成可验证项目、训练任务和下一次投递行动。
                    <span className="inline-translation" lang="en">
                      Start from organization and role evidence, then turn every
                      gap into a verifiable project, training task, and next
                      application action.
                    </span>
                  </p>
                </div>
                <div className="positioning">
                  <small>你的主叙事 / Your positioning</small>
                  <p>
                    <BilingualParagraph
                      zh={effectiveProfile.positioning}
                      en={
                        effectiveProfile.positioningEn ||
                        "English positioning statement not configured."
                      }
                    />
                  </p>
                </div>
                <div className="hero-actions">
                  <button
                    className="primary-button"
                    onClick={() => setView("atlas")}
                  >
                    浏览目标组织 / Explore targets
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => setView("roles")}
                  >
                    查看能力缺口 / Review skill gaps
                  </button>
                </div>
              </article>

              <article className="countdown-card">
                <span className="section-kicker">
                  当前窗口 / CURRENT WINDOW
                </span>
                <strong>现在开始 / Start now</strong>
                <h3>
                  <BilingualHeading
                    zh={effectiveProfile.targetWindow}
                    en={effectiveProfile.targetWindowEn || "Target window"}
                  />
                </h3>
                <ol>
                  <li>
                    <span>01</span>
                    立即投递已开放岗位，不等待全量研究结束
                    <small>
                      Apply to open roles now; do not wait for research to end.
                    </small>
                  </li>
                  <li>
                    <span>02</span>
                    8–11 月覆盖大厂、EDA、芯片和设备公司主峰
                    <small>
                      Cover the main big-tech, EDA, silicon, and equipment cycle
                      from August through November.
                    </small>
                  </li>
                  <li>
                    <span>03</span>
                    同步争取校内实验室、开源上游和教授背书
                    <small>
                      Pursue campus labs, upstream open source, and faculty
                      evidence in parallel.
                    </small>
                  </li>
                </ol>
              </article>
            </div>

            <div className="metric-grid">
              <Metric
                value={organizationBank.organizationCount}
                label="组织节点 / Organizations"
                note="中美双市场 / Two markets"
              />
              <Metric
                value={organizationBank.regionCounts.US}
                label="美国机会宇宙 / U.S. universe"
                note="美国优先 / U.S. first"
              />
              <Metric
                value={organizationBank.regionCounts.CN}
                label="中国发展节点 / China nodes"
                note="企业与研究机构 / Employers and research"
              />
              <Metric
                value={skills.length}
                label="原子能力 / Atomic skills"
                note="带先修依赖 / Prerequisite-aware"
              />
              <Metric
                value={questionBank.questionCount}
                label="高质量训练任务 / Quality tasks"
                note="原创可追溯 / Original and traceable"
              />
              <Metric
                value={persisted.applications.length}
                label="投递管线 / Pipeline"
                note={`${totalAttemptCount} 次训练 / attempts`}
              />
            </div>

            <div className="dashboard-grid">
              <article className="panel priority-panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-kicker">
                      目标雷达 / TARGET RADAR
                    </span>
                    <h3>高匹配目标雷达 / High-fit target radar</h3>
                  </div>
                  <button onClick={() => setView("atlas")}>
                    查看全部 / View all →
                  </button>
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
                        <strong>
                          <CompanyName company={company} />
                        </strong>
                        <small className="target-focus-atoms">
                          {company.focusAtoms.slice(0, 2).map((term) => (
                            <BilingualTermLabel term={term} key={term.id} />
                          ))}
                        </small>
                      </span>
                      <span className="tier-badge">
                        {fitTierLabel(company.fitTier)}
                      </span>
                      <StatusDot signal={company.visaSignal} />
                    </button>
                  ))}
                </div>
              </article>

              <article className="panel gap-panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-kicker">
                      证据缺口 / EVIDENCE GAPS
                    </span>
                    <h3>最值钱的下一步 / Highest-leverage next steps</h3>
                  </div>
                </div>
                <ul className="gap-list">
                  {effectiveProfile.criticalGaps.map((gap, index) => (
                    <li key={gap}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <strong>
                          <BilingualParagraph
                            zh={gap}
                            en={
                              effectiveProfile.criticalGapsEn?.[index] ||
                              "English translation not configured."
                            }
                          />
                        </strong>
                        <small>
                          {index < 2
                            ? "最高杠杆 / Highest leverage"
                            : "转化为可复现实验 / Convert into reproducible evidence"}
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
                  <span className="section-kicker">
                    自适应任务队列 / ADAPTIVE MISSION QUEUE
                  </span>
                  <h3>下一组最值得训练的任务 / Next best training tasks</h3>
                </div>
                <button onClick={() => setView("dojo")}>
                  打开完整 Dojo / Open Dojo →
                </button>
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
                        {bilingualLabel(question.type, questionTypeLabels)} ·{" "}
                        {question.estimatedMinutes} 分钟 / min ·{" "}
                        {latestQuestionScore.has(question.id)
                          ? `上次 / last ${latestQuestionScore.get(question.id)} 分`
                          : "尚未训练 / Not attempted"}
                      </small>
                    </div>
                    <b>开始 / Start →</b>
                  </button>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        {view === "atlas" ? (
          <section className="view">
            {organizationIndexState !== "ready" ? (
              <article
                className="empty-state organization-loading-state"
                aria-live="polite"
                aria-busy={organizationIndexState === "loading"}
              >
                <span>{organizationIndexState === "loading" ? "…" : "!"}</span>
                <h2>
                  {organizationIndexState === "loading"
                    ? "正在校验完整组织资料 / Verifying the full organization universe"
                    : "组织资料暂时无法加载 / Organization universe is temporarily unavailable"}
                </h2>
                <p>
                  {organizationIndexState === "loading"
                    ? `正在加载 ${organizationBank.organizationCount} 个组织节点并校验内容摘要。 / Loading ${organizationBank.organizationCount} organization nodes and verifying their content digest.`
                    : organizationIndexError}
                </p>
                {organizationIndexState === "error" ? (
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setOrganizationIndexState("loading");
                      setOrganizationIndexError("");
                      setOrganizationIndexRetryKey((value) => value + 1);
                    }}
                  >
                    重试组织资料 / Retry organization universe
                  </button>
                ) : null}
              </article>
            ) : (
              <>
                <div className="filter-bar">
                  <label className="search-field">
                    <span>搜索 / Search</span>
                    <input
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setCompanyLimit(60);
                      }}
                      placeholder="组织、方向、岗位、技术栈 / Organization, domain, role, stack"
                    />
                  </label>
                  <div
                    className="segmented"
                    aria-label="地区筛选 / Region filter"
                  >
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
                          if (value !== "CN" && value !== "ALL") {
                            setOwnership("ALL");
                          }
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
                      <option value="ALL">
                        全部产业节点 / All industry nodes
                      </option>
                      {categoryOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.zh} / {option.en}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>中国企业所有制 / China ownership</span>
                    <select
                      value={ownership}
                      onChange={(event) => {
                        const value = event.target.value;
                        setOwnership(value);
                        if (value !== "ALL") setRegion("CN");
                        setCompanyLimit(60);
                      }}
                    >
                      <option value="ALL">
                        全部所有制 / All ownership classes
                      </option>
                      {ownershipOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label.zh} / {option.label.en} ({option.count})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>资格信号 / Eligibility signal</span>
                    <select
                      value={visa}
                      onChange={(event) => {
                        setVisa(event.target.value);
                        setCompanyLimit(60);
                      }}
                    >
                      <option value="ALL">全部信号 / All signals</option>
                      <option value="green">可投初筛 / Initial fit</option>
                      <option value="yellow">
                        赞助待核 / Sponsorship check
                      </option>
                      <option value="orange">出口复核 / Export review</option>
                      <option value="red">硬门槛 / Restricted</option>
                      <option value="unknown">待核验 / Unverified</option>
                    </select>
                  </label>
                </div>

                <div className="results-heading">
                  <div>
                    <span className="section-kicker">
                      组织图谱 / COMPANY ATLAS
                    </span>
                    <h2>
                      {filteredCompanies.length} 个匹配节点 / matching nodes
                    </h2>
                  </div>
                  <div className="results-actions">
                    <p>
                      所有难度与身份判断均落到具体岗位；组织级信号只用于初筛。
                      <span lang="en">
                        Difficulty and eligibility are decided at requisition
                        level; organization signals are triage only.
                      </span>
                    </p>
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
                        档案卡 / Cards
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
                          const groupId = `${regionGroup.region}:${typeGroup.organizationClass}`;
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
                                    : current.filter(
                                        (item) => item !== groupId,
                                      );
                                });
                              }}
                            >
                              <summary>
                                <BilingualNodeLabel
                                  label={organizationClassTerm(
                                    typeGroup.companies[0],
                                  )}
                                />
                                <b>{typeGroup.companies.length}</b>
                              </summary>
                              {expanded ? (
                                <div className="tree-company-list">
                                  {typeGroup.companies.map((company) => (
                                    <button
                                      key={company.id}
                                      onClick={() =>
                                        setSelectedCompany(company)
                                      }
                                    >
                                      <span className="tree-company-info">
                                        <CompanyName company={company} />
                                        {company.focusAtoms[0] ? (
                                          <BilingualTermLabel
                                            term={company.focusAtoms[0]}
                                            className="tree-company-focus"
                                          />
                                        ) : null}
                                      </span>
                                      <small>
                                        {fitTierLabel(company.fitTier)} ·{" "}
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
                      {filteredCompanies
                        .slice(0, companyLimit)
                        .map((company) => (
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
                                  bookmarks.has(company.id)
                                    ? "取消收藏 / Remove bookmark"
                                    : "收藏组织 / Bookmark organization"
                                }
                                onClick={() => toggleBookmark(company)}
                              >
                                {bookmarks.has(company.id) ? "★" : "☆"}
                              </button>
                            </div>
                            <div>
                              <div className="company-title-row">
                                <h3>
                                  <CompanyName company={company} />
                                </h3>
                                <span className="tier-badge">
                                  {fitTierLabel(company.fitTier)}
                                </span>
                              </div>
                              <p className="company-overview-preview">
                                <BilingualParagraph
                                  zh={company.descriptionZh}
                                  en={company.descriptionEn}
                                />
                              </p>
                            </div>
                            <div className="tag-row atomic-tag-row">
                              {company.focusAtoms.slice(0, 3).map((term) => (
                                <span key={term.id}>
                                  <BilingualTermLabel term={term} />
                                </span>
                              ))}
                            </div>
                            <div className="company-meta">
                              <span>{regionLabel(regionOf(company))}</span>
                              <span>{organizationClassLabel(company)}</span>
                              <span>{confidenceLabel(company.confidence)}</span>
                            </div>
                            <div className="company-card-bottom">
                              <StatusDot signal={company.visaSignal} />
                              <button
                                onClick={() => setSelectedCompany(company)}
                              >
                                打开档案 / Open profile →
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
                          再加载 60 个节点 / Load 60 more（已显示 / shown{" "}
                          {companyLimit}/{filteredCompanies.length}）
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </>
            )}
          </section>
        ) : null}

        {view === "roles" ? (
          <section className="view">
            <div className="results-heading role-heading">
              <div>
                <span className="section-kicker">
                  岗位 × 能力图 / ROLE × SKILL GRAPH
                </span>
                <h2>
                  <BilingualHeading
                    zh="一条主线，两条副线，多层扩容"
                    en="One core track, two adjacent tracks, layered expansion"
                  />
                </h2>
              </div>
              <p>
                <BilingualParagraph
                  zh="分数是基于现有证据的准备度估计，不是录取概率；只有完成校准的训练才会更新它。"
                  en="Scores estimate readiness from current evidence; they are not hiring probabilities. Only calibrated training updates them."
                />
              </p>
            </div>

            <div className="role-grid">
              {roles.map((role) => {
                const presentation = rolePresentationFor(role);
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
                      <span>
                        {priority
                          ? "核心方向 / CORE TRACK"
                          : "扩展方向 / EXPANSION"}
                      </span>
                      <strong>{readiness}%</strong>
                    </div>
                    <h3>
                      <BilingualTermLabel
                        term={presentation.typicalTitleAtoms[0]}
                      />
                    </h3>
                    <p>
                      <BilingualParagraph
                        zh={presentation.descriptionZh}
                        en={presentation.descriptionEn}
                      />
                    </p>
                    <ProgressBar value={readiness} />
                    <div className="role-stats">
                      <span>
                        {role.primarySkillDomains.length} 个能力域 / skill
                        domains
                      </span>
                      <span>
                        {roleQuestions === null
                          ? "题库加载中 / Loading"
                          : `${roleQuestions} 道训练任务 / drills`}
                      </span>
                    </div>
                    <div
                      className="stage-list atomic-stage-list"
                      aria-label="面试环节 / Interview stages"
                    >
                      {presentation.interviewStageAtoms
                        .slice(0, 4)
                        .map((stage) => (
                          <span key={stage.id}>
                            <BilingualTermLabel term={stage} />
                          </span>
                        ))}
                    </div>
                    <button onClick={() => openRoleDojo(role.id)}>
                      进入定向训练 / Start targeted training →
                    </button>
                  </article>
                );
              })}
            </div>

            <article className="panel skill-map-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">
                    原子能力 / ATOMIC CAPABILITIES
                  </span>
                  <h3>原子能力地图 / Atomic capability map</h3>
                </div>
                <span>
                  {skills.length} 个节点 / nodes · 带先修依赖 / prerequisites
                </span>
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
                          (skill) =>
                            skill.domain || skill.category || "工程基础",
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
                                ? "基础层 / Foundation"
                                : level === "intermediate"
                                  ? "核心工程层 / Core engineering"
                                  : "高级系统层 / Advanced systems"}
                            </strong>
                            <small>
                              {levelSkills.length} 个能力节点 / capability nodes
                            </small>
                          </div>
                        </div>
                        <div className="skill-columns">
                          {domains.map((domain) => (
                            <div
                              className="skill-domain"
                              key={`${level}-${domain}`}
                            >
                              <strong>
                                {bilingualLabel(domain, skillDomainLabels)}
                              </strong>
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
                                        className={
                                          mastery >= 70 ? "mastered" : ""
                                        }
                                        title={`当前掌握度 ${mastery}% / Current mastery ${mastery}%`}
                                      />
                                      <div>
                                        <div className="skill-node-terms">
                                          {skillTerms(skill).map((term) => (
                                            <b key={`${skill.id}:${term.id}`}>
                                              <BilingualTermLabel term={term} />
                                            </b>
                                          ))}
                                        </div>
                                        <small>
                                          {(skill.prerequisites || []).length
                                            ? `先修 / Prerequisites：${(
                                                skill.prerequisites || []
                                              )
                                                .map((id) =>
                                                  skillById.has(id)
                                                    ? skillLabel(
                                                        skillById.get(id)!,
                                                      )
                                                    : id,
                                                )
                                                .join(" · ")}`
                                            : "课程起点 / Entry point"}
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
                <span className="section-kicker">
                  面试道场 / INTERVIEW DOJO
                </span>
                <h2>
                  训练真实工程判断，而不是背答案。 / Train engineering judgment,
                  not memorization.
                </h2>
                <p>
                  每道任务同时提供中文与 English
                  题干、交付物、评分规则、常见失败、追问和参考框架，并对应岗位信号与先修能力。
                  当前题库是研究沙箱；未完成专家与 learner pilot
                  的自评分不会改变岗位准备度。
                  <span className="inline-translation" lang="en">
                    Every task pairs Chinese and English prompts, deliverables,
                    rubrics, failure modes, follow-ups, and reference outlines
                    with role signals and prerequisites. This bank remains a
                    research sandbox; uncalibrated self-scores do not change
                    role readiness.
                  </span>
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
                <span>已完成任务 / Completed tasks</span>
                <small>
                  {totalAttemptCount} 次可追溯尝试 / traceable attempts ·{" "}
                  {questionBank.questionCount.toLocaleString()} 题 / tasks
                </small>
              </div>
            </div>

            {questionIndexState !== "ready" ? (
              <div
                className={`question-index-state ${questionIndexState}`}
                role={questionIndexState === "error" ? "alert" : "status"}
                aria-live={
                  questionIndexState === "error" ? "assertive" : "polite"
                }
                aria-busy={questionIndexState === "loading"}
              >
                <span className="question-index-state-mark" aria-hidden="true">
                  {questionIndexState === "error" ? "!" : ""}
                </span>
                <div>
                  <span className="section-kicker">
                    {questionIndexState === "loading"
                      ? "题库同步 / QUESTION BANK SYNC"
                      : "题库错误 / QUESTION BANK ERROR"}
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
                      道匹配任务 / matched tasks · 共 / total{" "}
                      {questionBank.questionCount.toLocaleString()}
                    </span>
                    <small>
                      当前显示 / showing {questionResultStart.toLocaleString()}–
                      {questionResultEnd.toLocaleString()} · 第 / page{" "}
                      {safeQuestionPage} / {questionPageCount}
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
                      {roles.map((role) => {
                        const primaryTitle =
                          rolePresentationFor(role).typicalTitleAtoms[0];
                        return (
                          <option key={role.id} value={role.id}>
                            {primaryTitle.zh} / {primaryTitle.en}
                          </option>
                        );
                      })}
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
                          {bilingualLabel(type, questionTypeLabels)}
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
                          {bilingualLabel(level, learningLevelLabels)}
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
                        new Set(
                          questions.map((question) => question.difficulty),
                        ),
                      ).map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                          {bilingualLabel(difficulty, difficultyLabels)}
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

                <div
                  ref={questionResultsRef}
                  className="question-results-anchor"
                >
                  {visibleQuestions.length ? (
                    <div className="question-grid">
                      {visibleQuestions.map((question) => (
                        <article
                          className={`question-card ${
                            question.type.toLowerCase().includes("boss")
                              ? "boss"
                              : ""
                          }`}
                          key={question.id}
                        >
                          <div className="question-card-top">
                            <span>
                              {bilingualLabel(
                                question.type,
                                questionTypeLabels,
                              )}
                            </span>
                            <span>
                              {question.estimatedMinutes} MIN ·{" "}
                              {bilingualLabel(
                                question.status,
                                questionStatusLabels,
                              )}
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
                            {question.skills
                              .slice(0, 4)
                              .flatMap((skill) =>
                                skillTerms(
                                  skillById.get(skill) || { id: skill },
                                ).map((term) => ({ skill, term })),
                              )
                              .map(({ skill, term }) => (
                                <span key={`${skill}:${term.id}`}>
                                  <BilingualTermLabel term={term} />
                                </span>
                              ))}
                          </div>
                          <div className="question-card-bottom">
                            <span>
                              {bilingualLabel(
                                question.difficulty,
                                difficultyLabels,
                              )}{" "}
                              ·{" "}
                              {bilingualLabel(
                                question.level,
                                learningLevelLabels,
                              )}
                            </span>
                            <button
                              onClick={() => openQuestion(question)}
                              aria-label={`${
                                completedQuestions.has(question.id)
                                  ? "再次训练 / Retry"
                                  : "开始任务 / Start"
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
                        Clear or broaden the filters to return to the full
                        bilingual library.
                      </p>
                      <button
                        className="secondary-button"
                        onClick={resetQuestionFilters}
                      >
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
                          aria-current={
                            page === safeQuestionPage ? "page" : undefined
                          }
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
                <span className="section-kicker">
                  投递作战室 / APPLICATION WAR ROOM
                </span>
                <h2>
                  让每次投递产生信息，而不只是数量。 / Make every application
                  produce evidence.
                </h2>
              </div>
              <div className="results-actions">
                <p>
                  当前版本先保存
                  JD、材料版本与阶段观察；样本充分前不自动推断拒绝原因或改写能力权重。
                  <span lang="en">
                    This version records JDs, material versions, and stage
                    observations. It does not infer rejection causes or rewrite
                    skill weights before enough evidence exists.
                  </span>
                </p>
                <button
                  className="secondary-button"
                  onClick={exportPrivateState}
                >
                  导出私有数据 / Export private data
                </button>
              </div>
            </div>

            {persisted.applications.length === 0 ? (
              <article className="empty-state">
                <span>00</span>
                <h3>投递管线仍为空 / The pipeline is empty</h3>
                <p>
                  从组织宇宙中打开目标档案，加入作战室并逐步补齐具体岗位。
                  <span lang="en">
                    Open a target profile from the atlas, add it to the war
                    room, and complete the exact requisition over time.
                  </span>
                </p>
                <button
                  className="primary-button"
                  onClick={() => setView("atlas")}
                >
                  选择第一个目标 / Choose the first target
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
                        <article
                          className="application-card"
                          key={application.id}
                        >
                          <div>
                            <span
                              className={`priority priority-${application.priority}`}
                            >
                              {priorityLabel(application.priority)}
                            </span>
                            <small>{regionLabel(application.region)}</small>
                          </div>
                          <h3>
                            {companyById.has(application.company_id) ? (
                              <CompanyName
                                company={companyById.get(
                                  application.company_id,
                                )!}
                              />
                            ) : (
                              application.company_name
                            )}
                          </h3>
                          <p>{application.role_title}</p>
                          <div className="application-signals">
                            <span>
                              {employmentTypeLabel(application.employment_type)}
                            </span>
                            <span>
                              匹配 / Match {application.match_score || 0}
                            </span>
                            <span>
                              工作授权 / Authorization{" "}
                              {signalLabel(application.sponsorship_signal)}
                            </span>
                            <span>
                              出口管制 / Export{" "}
                              {signalLabel(application.export_signal)}
                            </span>
                          </div>
                          <label>
                            <span>推进阶段 / Stage</span>
                            <select
                              value={application.status}
                              onChange={(event) =>
                                updateApplication(application, {
                                  status: event.target.value,
                                })
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
                            <summary>编辑具体岗位 / Edit requisition</summary>
                            <label>
                              <span>岗位名称 / Role title</span>
                              <input
                                defaultValue={application.role_title}
                                onBlur={(event) => {
                                  if (
                                    event.target.value !==
                                    application.role_title
                                  ) {
                                    updateApplication(application, {
                                      roleTitle: event.target.value,
                                    });
                                  }
                                }}
                              />
                            </label>
                            <label>
                              <span>截止日期 / Deadline</span>
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
                              <span>优先级 / Priority</span>
                              <select
                                value={application.priority}
                                onChange={(event) =>
                                  updateApplication(application, {
                                    priority: event.target.value,
                                  })
                                }
                              >
                                <option value="high">高 / High</option>
                                <option value="medium">中 / Medium</option>
                                <option value="low">低 / Low</option>
                              </select>
                            </label>
                            <label>
                              <span>
                                工作授权信号 / Work authorization signal
                              </span>
                              <select
                                value={application.sponsorship_signal}
                                onChange={(event) =>
                                  updateApplication(application, {
                                    sponsorshipSignal: event.target.value,
                                  })
                                }
                              >
                                {screeningSignalOptions.map(
                                  ([value, label]) => (
                                    <option value={value} key={value}>
                                      {label}
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>
                            <label>
                              <span>出口管制信号 / Export-control signal</span>
                              <select
                                value={application.export_signal}
                                onChange={(event) =>
                                  updateApplication(application, {
                                    exportSignal: event.target.value,
                                  })
                                }
                              >
                                {screeningSignalOptions.map(
                                  ([value, label]) => (
                                    <option value={value} key={value}>
                                      {label}
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>
                            <label>
                              <span>联系人 / Contact</span>
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
                              <span>简历版本 / Resume version</span>
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
                              <span>岗位关键词 / JD keywords</span>
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
                              <span>岗位链接 / Requisition URL</span>
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
                              <span>复盘备注 / Reflection notes</span>
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
                              删除这条岗位记录 / Delete requisition
                            </button>
                          </details>
                          {application.job_url ? (
                            <a
                              href={application.job_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              官方招聘入口 / Official careers ↗
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
                    <span className="section-kicker">候选清单 / SHORTLIST</span>
                    <h3>已收藏但尚未进入管线 / Bookmarked, not in pipeline</h3>
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
                        <strong>
                          <CompanyName company={company} />
                        </strong>
                        <small>{fitTierLabel(company.fitTier)}</small>
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
              <span className="section-kicker">
                可信研究系统 / TRUSTED RESEARCH SYSTEM
              </span>
              <h2>“全量”必须可以审计。 / Coverage must be auditable.</h2>
              <p>
                数量不是终点。每个节点都要说明从哪里来、何时观察、可信到什么程度，以及还有什么未知。
                <span className="inline-translation" lang="en">
                  Count is not the endpoint. Every node must state its source,
                  observation date, confidence, and remaining unknowns.
                </span>
              </p>
              <p className="evidence-bank-lineage">
                <strong>
                  题库口径：210 个基础场景 + 每场 9 个递进训练 = 2,100 个任务。
                </strong>
                <span lang="en">
                  210 anchor scenarios + 1,890 progressive drills = 2,100 tasks.
                </span>
              </p>
            </div>

            <div className="metric-grid evidence-metrics">
              <Metric
                value={organizationBank.organizationCount}
                label="规范化实体 / Canonical entities"
              />
              <Metric
                value={
                  companies.filter((item) =>
                    item.evidence.some(
                      (evidence) => evidence.type === "official-current-job",
                    ),
                  ).length
                }
                label="观察日具体岗位 / Current postings"
              />
              <Metric
                value={
                  companies.filter(
                    (item) => signalKey(item.visaSignal) === "unknown",
                  ).length
                }
                label="身份信号待核 / Eligibility unknown"
              />
              <Metric
                value={
                  companies.filter(
                    (item) => signalKey(item.visaSignal) === "red",
                  ).length
                }
                label="硬门槛节点 / Restricted nodes"
              />
              <Metric
                value={questionBank.questionCount}
                label="合规训练任务 / Compliant tasks"
              />
              <Metric
                value={skills.length}
                label="能力覆盖节点 / Skill nodes"
              />
            </div>

            <div className="evidence-grid">
              <article className="panel private-profile-panel">
                <div className="private-profile-heading">
                  <div>
                    <span className="section-kicker">
                      私有画像同步 / PRIVATE PROFILE SYNC
                    </span>
                    <h3>私有画像同步 / Private profile sync</h3>
                  </div>
                  <span
                    className={
                      persisted.preferences.candidateProfile
                        ? "profile-state active"
                        : "profile-state"
                    }
                  >
                    {persisted.preferences.candidateProfile
                      ? "私有画像已启用 / Private profile active"
                      : "当前为匿名模板 / Anonymous template"}
                  </span>
                </div>
                <p>
                  在这里粘贴本机私有画像
                  JSON。通过格式校验后，它只写入当前登录用户的 D1
                  空间，不会进入公开仓库，也不会与其他账号共享。
                  <span className="inline-translation" lang="en">
                    Paste a local private-profile JSON here. After validation it
                    is written only to the signed-in user&apos;s private data
                    space, never to the public repository or another account.
                  </span>
                </p>
                <label>
                  <span>候选人画像 JSON / Candidate profile JSON</span>
                  <textarea
                    data-testid="private-profile-import"
                    aria-label="候选人画像 JSON / Candidate profile JSON"
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
                    校验并保存 / Validate and save
                  </button>
                  {persisted.preferences.candidateProfile ? (
                    <button
                      className="secondary-button"
                      onClick={clearPrivateProfile}
                    >
                      恢复匿名模板 / Restore anonymous template
                    </button>
                  ) : null}
                  <span role="status" aria-live="polite">
                    {privateProfileMessage}
                  </span>
                </div>
              </article>
              <article className="panel">
                <span className="section-kicker">
                  覆盖合同 / COVERAGE CONTRACT
                </span>
                <h3>组织宇宙覆盖原则 / Atlas coverage contract</h3>
                <ul className="method-list">
                  <li>
                    官方产业目录建立种子集合 / Seed from official industry
                    directories
                  </li>
                  <li>
                    按独立招聘身份规范化去重 / Deduplicate by independent
                    recruiting identity
                  </li>
                  <li>
                    只有官方入口可标记为已验证 / Require an official source for
                    verified status
                  </li>
                  <li>
                    资格限制落到具体岗位 / Resolve eligibility at requisition
                    level
                  </li>
                  <li>
                    公开 residual report / Publish the residual coverage report
                  </li>
                </ul>
              </article>
              <article className="panel">
                <span className="section-kicker">
                  题目供应链 / QUESTION SUPPLY CHAIN
                </span>
                <h3>题目质量合同 / Question quality contract</h3>
                <ul className="method-list">
                  <li>
                    公开规范与原创同构任务 / Public specifications and original
                    analogous tasks
                  </li>
                  <li>
                    禁止付费题库与 NDA 泄题 / No paid-bank copying or NDA leaks
                  </li>
                  <li>
                    每题有完整评分闭环 / Every task has a complete evaluation
                    loop
                  </li>
                  <li>
                    记录岗位、技能与证据日期 / Track roles, skills, and evidence
                    dates
                  </li>
                  <li>
                    AI 评分接受真人校准 / AI scoring remains human-calibrated
                  </li>
                </ul>
              </article>
              <article className="panel evidence-source-panel">
                <span className="section-kicker">来源样本 / SOURCE SAMPLE</span>
                <h3>最近验证的一手入口 / Recently verified primary sources</h3>
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
                        <strong>
                          {evidence.title || "官方证据 / Official evidence"}
                        </strong>
                        <small>
                          {evidence.observedAt || effectiveProfile.evidenceDate}{" "}
                          ↗
                        </small>
                      </a>
                    ))}
                </div>
              </article>
            </div>
          </section>
        ) : null}
      </main>

      <nav className="mobile-nav" aria-label="移动端导航 / Mobile navigation">
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
            <div className="company-modal-toolbar">
              <span>组织情报档案 / Organization intelligence profile</span>
              <button
                className="modal-close"
                onClick={() => {
                  setApplicationBuilderVisible(false);
                  setSelectedCompany(null);
                }}
                aria-label="关闭组织档案 / Close organization profile"
              >
                ×
              </button>
            </div>
            <div className="modal-header">
              <span className="company-avatar large">
                {selectedCompany.nameEn.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <span className="section-kicker">
                  {regionLabel(regionOf(selectedCompany))} ·{" "}
                  {organizationClassLabel(selectedCompany)}
                </span>
                <h2 id="company-dialog-title">
                  <CompanyName company={selectedCompany} />
                </h2>
                <div className="modal-status-row">
                  <span className="tier-badge">
                    匹配 / Fit · {fitTierLabel(selectedCompany.fitTier)}
                  </span>
                  <StatusDot signal={selectedCompany.visaSignal} />
                  <span>
                    {organizationDifficultyLabel(selectedCompany.difficulty)}
                  </span>
                  <span>{confidenceLabel(selectedCompany.confidence)}</span>
                </div>
              </div>
            </div>

            <div className="scope-notice">
              <strong>
                组织档案，不是当前 JD / Organization profile, not a current JD
              </strong>
              <BilingualParagraph
                zh="方向、要求与补强目标是结构化分析；只有“当前岗位”证据才证明观察日存在具体职位。"
                en="Domains, requirements, and preparation targets are structured analysis. Only Current Job Posting evidence proves that an exact role existed on the observation date."
              />
            </div>

            <div className="organization-narrative-grid">
              <article className="organization-overview">
                <h3>
                  <BilingualHeading zh="机构简介" en="Organization overview" />
                </h3>
                <BilingualParagraph
                  zh={selectedCompany.descriptionZh}
                  en={selectedCompany.descriptionEn}
                />
              </article>
              <article className="organization-relevance">
                <h3>
                  <BilingualHeading zh="与你的匹配" en="Why it matches" />
                </h3>
                <BilingualParagraph
                  zh={selectedCompany.relevanceZh}
                  en={selectedCompany.relevanceEn}
                />
              </article>
            </div>

            {selectedCompany.ownership ? (
              <section className="organization-ownership">
                <div className="organization-ownership-heading">
                  <div>
                    <span className="section-kicker">
                      中国企业所有制 / CHINA OWNERSHIP
                    </span>
                    <h3>
                      <BilingualHeading
                        zh={selectedCompany.ownership.labelZh}
                        en={selectedCompany.ownership.labelEn}
                      />
                    </h3>
                  </div>
                  <div className="ownership-status">
                    <span>
                      {confidenceLabel(selectedCompany.ownership.confidence)}
                    </span>
                    <span>
                      {ownershipReviewStatusLabel(
                        selectedCompany.ownership.reviewStatus,
                      )}
                    </span>
                    <span>
                      {ownershipClassificationBasisLabel(
                        selectedCompany.ownership.classificationBasis,
                      )}
                    </span>
                    <span>
                      审计 {selectedCompany.ownership.reviewedAt} / Reviewed{" "}
                      {selectedCompany.ownership.reviewedAt}
                    </span>
                  </div>
                </div>
                <BilingualParagraph
                  zh={selectedCompany.ownership.summaryZh}
                  en={selectedCompany.ownership.summaryEn}
                />
                {selectedCompany.ownership.sourceOwnershipTag ? (
                  <div className="ownership-source-tag">
                    <strong>
                      源记录所有制标签 / Source-record ownership tag
                    </strong>
                    <span>{selectedCompany.ownership.sourceOwnershipTag}</span>
                  </div>
                ) : null}
                <div className="ownership-definition">
                  <strong>分类定义 / Class definition</strong>
                  <BilingualParagraph
                    zh={selectedCompany.ownership.definitionZh}
                    en={selectedCompany.ownership.definitionEn}
                  />
                </div>
                <details>
                  <summary>
                    所有制证据与复核入口 / Ownership evidence and review sources
                    · {selectedCompany.ownership.evidence.length}
                  </summary>
                  <div className="ownership-evidence-list">
                    {selectedCompany.ownership.evidence.map(
                      (evidence, index) => (
                        <a
                          href={evidence.url}
                          target="_blank"
                          rel="noreferrer"
                          key={`${evidence.url}:${index}`}
                        >
                          <BilingualParagraph
                            zh={evidence.titleZh}
                            en={evidence.titleEn}
                          />
                          <span className="ownership-evidence-scope">
                            {ownershipEvidenceScopeLabel(
                              evidence.evidenceScope,
                            )}
                          </span>
                          <BilingualParagraph
                            zh={evidence.noteZh}
                            en={evidence.noteEn}
                            className="ownership-evidence-note"
                          />
                          <small>
                            观察 {evidence.observedAt} / Observed{" "}
                            {evidence.observedAt} ↗
                          </small>
                        </a>
                      ),
                    )}
                  </div>
                </details>
              </section>
            ) : null}

            {selectedCompanyRelations.length ? (
              <section className="organization-relations">
                <div className="organization-relations-heading">
                  <div>
                    <span className="section-kicker">
                      组织关系 / ORGANIZATION RELATIONS
                    </span>
                    <h3>
                      <BilingualHeading
                        zh="企业家族与交易状态"
                        en="Corporate family and transaction status"
                      />
                    </h3>
                  </div>
                  <span>
                    {selectedCompanyRelations.length} 条关系 / relations
                  </span>
                </div>
                <div className="organization-relation-list">
                  {selectedCompanyRelations.map((relation) => {
                    const peerId =
                      relation.fromOrganizationId === selectedCompany.id
                        ? relation.toOrganizationId
                        : relation.fromOrganizationId;
                    const peer = companyById.get(peerId);
                    return (
                      <article
                        className={`organization-relation relation-${relation.status}`}
                        key={relation.id}
                      >
                        <div className="organization-relation-top">
                          <div className="organization-relation-tags">
                            <span>
                              {bilingualLabel(
                                relation.relationType,
                                relationTypeLabels,
                              )}
                            </span>
                            <span>
                              {bilingualLabel(
                                relation.status,
                                relationStatusLabels,
                              )}
                            </span>
                          </div>
                          <small>
                            {relation.announcedAt
                              ? `公告 ${relation.announcedAt} / Announced ${relation.announcedAt}`
                              : `核验 ${relation.lastVerified} / Verified ${relation.lastVerified}`}
                          </small>
                        </div>
                        {peer ? (
                          <button
                            type="button"
                            className="organization-relation-peer"
                            onClick={() => setSelectedCompany(peer)}
                          >
                            <CompanyName company={peer} /> →
                          </button>
                        ) : (
                          <strong>{peerId}</strong>
                        )}
                        <BilingualParagraph
                          zh={relation.summaryZh}
                          en={relation.summaryEn}
                        />
                        <details>
                          <summary>
                            一手关系证据 / Primary relation evidence ·{" "}
                            {relation.officialEvidence.length}
                          </summary>
                          <div>
                            {relation.officialEvidence.map((evidence) => (
                              <a
                                href={evidence.url}
                                target="_blank"
                                rel="noreferrer"
                                key={evidence.url}
                              >
                                <BilingualHeading
                                  zh={evidence.titleZh}
                                  en={evidence.titleEn}
                                />
                                <small>
                                  {evidence.publisher} ·{" "}
                                  {evidence.publishedAt ||
                                    evidence.lastVerified}{" "}
                                  ↗
                                </small>
                              </a>
                            ))}
                          </div>
                        </details>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="organization-role-profile">
              <h3>
                <BilingualHeading zh="目标岗位" en="Target roles" />
              </h3>
              <div className="tag-row atomic-tag-row canonical-role-row">
                {selectedCompany.roleAtoms.map((term) => (
                  <span key={term.id}>
                    <BilingualTermLabel term={term} />
                  </span>
                ))}
              </div>
            </section>

            <div className="modal-columns organization-analysis-grid">
              <article>
                <h3>
                  <BilingualHeading zh="业务方向" en="Business domains" />
                </h3>
                <div className="tag-row atomic-tag-row">
                  {selectedCompany.focusAtoms.map((term) => (
                    <span key={term.id}>
                      <BilingualTermLabel term={term} />
                    </span>
                  ))}
                </div>
              </article>
              <article>
                <h3>
                  <BilingualHeading zh="机会形态" en="Opportunity formats" />
                </h3>
                <div className="tag-row atomic-tag-row">
                  {selectedCompany.opportunityAtoms.map((term) => (
                    <span key={term.id}>
                      <BilingualTermLabel term={term} />
                    </span>
                  ))}
                </div>
              </article>
              <article>
                <h3>
                  <BilingualHeading zh="需求能力" en="Required capabilities" />
                </h3>
                <ul className="atomic-content-list">
                  {selectedCompany.requirementAtoms.map((term) => (
                    <li key={term.id}>
                      <BilingualTermLabel term={term} />
                    </li>
                  ))}
                </ul>
              </article>
              <article>
                <h3>
                  <BilingualHeading
                    zh="你的补强目标"
                    en="Your preparation targets"
                  />
                </h3>
                <ul className="atomic-content-list">
                  {selectedCompany.preparationAtoms.map((term) => (
                    <li key={term.id}>
                      <BilingualTermLabel term={term} />
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="modal-evidence">
              <h3>
                <BilingualHeading
                  zh="证据与官方入口"
                  en="Evidence and official entry points"
                />
              </h3>
              {selectedCompany.evidence.slice(0, 6).map((evidence, index) => (
                <a
                  href={evidence.url}
                  target="_blank"
                  rel="noreferrer"
                  key={`${evidence.url}-${index}`}
                >
                  <span>
                    {(() => {
                      const label = evidenceTypeLabel(evidence.type);
                      return `${label.zh} / ${label.en}`;
                    })()}
                  </span>
                  <strong>
                    <small>原始标题 / Original title</small>
                    {evidence.title}
                  </strong>
                  <small>
                    {evidence.observedAt || selectedCompany.lastVerified} ↗
                  </small>
                </a>
              ))}
            </div>

            {applicationBuilderVisible ? (
              <div className="application-builder">
                <div>
                  <span className="section-kicker">
                    具体岗位记录 / REQUISITION RECORD
                  </span>
                  <h3>
                    把组织线索落到具体岗位 / Convert the lead into a requisition
                  </h3>
                  <p>
                    如果岗位尚未开放，可先保存通用招聘页；开放后再补
                    JD、截止日、 身份条款、联系人和简历版本。
                    <span lang="en">
                      If no exact role is open, save the general careers page
                      first; add the JD, deadline, eligibility terms, contact,
                      and resume version when a requisition appears.
                    </span>
                  </p>
                </div>
                <div className="application-builder-grid">
                  <label>
                    <span>岗位名称 / Role title *</span>
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
                    <span>机会类型 / Opportunity type</span>
                    <select
                      value={applicationDraft.employmentType}
                      onChange={(event) =>
                        setApplicationDraft((draft) => ({
                          ...draft,
                          employmentType: event.target.value,
                        }))
                      }
                    >
                      {employmentTypeOptions.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>岗位链接 / Requisition URL</span>
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
                    <span>截止日期 / Deadline</span>
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
                    <span>工作授权信号 / Work authorization signal</span>
                    <select
                      value={applicationDraft.sponsorshipSignal}
                      onChange={(event) =>
                        setApplicationDraft((draft) => ({
                          ...draft,
                          sponsorshipSignal: event.target.value,
                        }))
                      }
                    >
                      {screeningSignalOptions.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>出口管制信号 / Export-control signal</span>
                    <select
                      value={applicationDraft.exportSignal}
                      onChange={(event) =>
                        setApplicationDraft((draft) => ({
                          ...draft,
                          exportSignal: event.target.value,
                        }))
                      }
                    >
                      {screeningSignalOptions.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>联系人 / Contact</span>
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
                    <span>简历版本 / Resume version</span>
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
                    <span>岗位关键词 / JD keywords</span>
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
                    <span>匹配备注 / Match notes</span>
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
                    取消 / Cancel
                  </button>
                  <button
                    className="primary-button"
                    disabled={!applicationDraft.roleTitle.trim()}
                    onClick={() => saveApplication(selectedCompany)}
                  >
                    保存具体岗位 / Save requisition
                  </button>
                </div>
              </div>
            ) : null}

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => toggleBookmark(selectedCompany)}
              >
                {bookmarks.has(selectedCompany.id)
                  ? "取消收藏 / Remove bookmark"
                  : "收藏目标 / Bookmark target"}
              </button>
              <button
                className="primary-button"
                onClick={() => beginApplication(selectedCompany)}
              >
                {applicationBuilderVisible
                  ? "正在配置岗位 / Editing requisition"
                  : "建立具体岗位记录 / Create requisition"}
              </button>
              {selectedCompany.careerUrl ? (
                <a
                  className="text-link"
                  href={selectedCompany.careerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  官方招聘页 / Official careers ↗
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
                  {bilingualLabel(selectedQuestion.type, questionTypeLabels)} ·{" "}
                  {selectedQuestion.estimatedMinutes} 分钟 / MIN ·{" "}
                  {bilingualLabel(
                    selectedQuestion.status,
                    questionStatusLabels,
                  )}{" "}
                  · V{selectedQuestion.contentVersion}
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
                {bilingualLabel(selectedQuestion.difficulty, difficultyLabels)}
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
                  className={questionLanguageMode === option.id ? "active" : ""}
                  aria-pressed={questionLanguageMode === option.id}
                  onClick={() => setQuestionLanguageMode(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {questionDetailState === "loading" ? (
              <div
                className="question-detail-state"
                role="status"
                aria-live="polite"
              >
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
                      "请检查连接后重试；已加载的题目不会受影响。 / Check your connection and retry; already loaded tasks remain available."}
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
                      分数只用于自我比较，不写入岗位准备度。 Structure and
                      source checks are complete; expert and learner pilots are
                      still pending.
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
                          aria-label={`${title}，打开公开依据 / Open public source`}
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

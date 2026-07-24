import { readdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const questionsUrl = new URL("data/questions.seed.json", root);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

const [
  questionFile,
  roleFile,
  skillFile,
  editorialOverrideFile,
  skillFocusOverrideFile,
] = await Promise.all([
  readJson("data/questions.seed.json"),
  readJson("data/role-families.json"),
  readJson("data/skill-graph.json"),
  readJson("data/question-editorial-overrides.json"),
  readJson("data/question-skill-focus-overrides.json"),
]);

async function readTranslationCatalog() {
  const directory = new URL("data/question-translations/", root);
  const filenames = (await readdir(directory))
    .filter((name) => /^part-.+\.json$/.test(name))
    .sort();
  const catalog = {};
  for (const filename of filenames) {
    const fragment = JSON.parse(
      await readFile(new URL(filename, directory), "utf8"),
    );
    for (const [questionId, translation] of Object.entries(fragment)) {
      if (catalog[questionId]) {
        throw new Error(
          `Duplicate anchor translation ${questionId} in ${filename}`,
        );
      }
      catalog[questionId] = translation;
    }
  }
  return catalog;
}

async function readSkillTranslationCatalog() {
  const directory = new URL("data/skill-translations/", root);
  const filenames = (await readdir(directory))
    .filter((name) => /^part-.+\.json$/.test(name))
    .sort();
  if (filenames.length === 0) {
    throw new Error("No skill translation fragments found");
  }
  const catalog = {};
  for (const filename of filenames) {
    const fragment = JSON.parse(
      await readFile(new URL(filename, directory), "utf8"),
    );
    for (const [skillId, value] of Object.entries(fragment)) {
      if (catalog[skillId]) {
        throw new Error(
          `Duplicate skill description translation ${skillId} in ${filename}`,
        );
      }
      const descriptionZh =
        typeof value === "string" ? value : value?.descriptionZh;
      if (
        typeof descriptionZh !== "string" ||
        descriptionZh.length < 8 ||
        !/[\u3400-\u9fff]/.test(descriptionZh)
      ) {
        throw new Error(
          `Skill description translation ${skillId} in ${filename} is not usable Chinese`,
        );
      }
      catalog[skillId] = descriptionZh;
    }
  }
  return catalog;
}

async function readOracleTranslationCatalog() {
  const directory = new URL("data/oracle-translations/", root);
  const filenames = (await readdir(directory))
    .filter((name) => /^part-.+\.json$/.test(name))
    .sort();
  if (filenames.length === 0) {
    throw new Error("No oracle translation fragments found");
  }
  const catalog = {};
  for (const filename of filenames) {
    const fragment = JSON.parse(
      await readFile(new URL(filename, directory), "utf8"),
    );
    for (const [questionId, oracleZh] of Object.entries(fragment)) {
      if (catalog[questionId]) {
        throw new Error(
          `Duplicate exact oracle translation ${questionId} in ${filename}`,
        );
      }
      if (
        !oracleZh ||
        typeof oracleZh !== "object" ||
        Array.isArray(oracleZh) ||
        Object.keys(oracleZh).sort().join(",") !==
          "acceptance,kind,procedure" ||
        !Object.values(oracleZh).every(
          (value) =>
            typeof value === "string" &&
            value.length >= 3 &&
            /[\u3400-\u9fff]/.test(value),
        )
      ) {
        throw new Error(
          `Exact oracle translation ${questionId} in ${filename} has an invalid schema`,
        );
      }
      catalog[questionId] = oracleZh;
    }
  }
  if (Object.keys(catalog).length !== 45) {
    throw new Error(
      `Exact oracle translation catalog must contain 45 anchors; found ${Object.keys(catalog).length}`,
    );
  }
  return catalog;
}

async function readOracleSpecCatalog() {
  const directory = new URL("data/oracle-specs/", root);
  const filenames = (await readdir(directory))
    .filter((name) => /^part-.+\.json$/.test(name))
    .sort();
  if (filenames.length === 0) {
    throw new Error("No task-specific oracle spec fragments found");
  }
  const catalog = {};
  for (const filename of filenames) {
    const fragment = JSON.parse(
      await readFile(new URL(filename, directory), "utf8"),
    );
    for (const [questionId, spec] of Object.entries(fragment)) {
      if (catalog[questionId]) {
        throw new Error(
          `Duplicate task-specific oracle spec ${questionId} in ${filename}`,
        );
      }
      if (
        !spec ||
        typeof spec !== "object" ||
        Array.isArray(spec) ||
        Object.keys(spec).sort().join(",") !== "oracle,oracleZh"
      ) {
        throw new Error(
          `Task-specific oracle spec ${questionId} in ${filename} must contain only oracle and oracleZh`,
        );
      }
      for (const [field, oracle] of Object.entries(spec)) {
        if (
          !oracle ||
          typeof oracle !== "object" ||
          Array.isArray(oracle) ||
          Object.keys(oracle).sort().join(",") !==
            "acceptance,kind,procedure" ||
          typeof oracle.procedure !== "string" ||
          oracle.procedure.length < 15 ||
          typeof oracle.acceptance !== "string" ||
          oracle.acceptance.length < 15 ||
          !(field === "oracle"
            ? ["executable", "observable"].includes(oracle.kind)
            : ["可执行", "可观察"].includes(oracle.kind)) ||
          (field === "oracleZh" &&
            (!/[\u3400-\u9fff]/.test(oracle.procedure) ||
              !/[\u3400-\u9fff]/.test(oracle.acceptance)))
        ) {
          throw new Error(
            `Task-specific oracle spec ${questionId}.${field} in ${filename} has an invalid schema`,
          );
        }
      }
      catalog[questionId] = spec;
    }
  }
  if (Object.keys(catalog).length !== 210) {
    throw new Error(
      `Task-specific oracle catalog must contain exactly 210 anchors; found ${Object.keys(catalog).length}`,
    );
  }
  return catalog;
}

const translationCatalog = await readTranslationCatalog();
const skillTranslationCatalog = await readSkillTranslationCatalog();
const oracleTranslationCatalog = await readOracleTranslationCatalog();
const oracleSpecCatalog = await readOracleSpecCatalog();

const roles = roleFile.roleFamilies;
const skills = skillFile.skills;
const skillById = new Map(skills.map((skill) => [skill.id, skill]));
const editorialOverrides = editorialOverrideFile.questions || {};

function skillFocusKey(roleId, baseQuestionId, archetype) {
  return `${roleId}|${baseQuestionId}|${archetype}`;
}

const skillFocusOverrides = new Map();
for (const override of skillFocusOverrideFile.overrides || []) {
  const key = skillFocusKey(
    override.roleId,
    override.baseQuestionId,
    override.archetype,
  );
  if (skillFocusOverrides.has(key)) {
    throw new Error(`Duplicate skill-focus override ${key}`);
  }
  if (
    !override.skillId ||
    !skillById.has(override.skillId) ||
    typeof override.focusEn !== "string" ||
    typeof override.focusZh !== "string" ||
    !/[\u3400-\u9fff]/.test(override.focusZh)
  ) {
    throw new Error(`Invalid skill-focus override ${key}`);
  }
  skillFocusOverrides.set(key, override);
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
const difficultyRank = {
  easy: 0,
  medium: 1,
  hard: 2,
};
const metadataFloorByLevel = {
  foundation: { difficulty: "easy", minutes: 0 },
  entry: { difficulty: "easy", minutes: 0 },
  intermediate: { difficulty: "medium", minutes: 20 },
  advanced: { difficulty: "hard", minutes: 35 },
};
const knownSkillIds = new Set(skills.map((skill) => skill.id));
const missingSkillTranslations = skills
  .map((skill) => skill.id)
  .filter((skillId) => !skillTranslationCatalog[skillId]);
const extraSkillTranslations = Object.keys(skillTranslationCatalog).filter(
  (skillId) => !knownSkillIds.has(skillId),
);
if (missingSkillTranslations.length > 0 || extraSkillTranslations.length > 0) {
  throw new Error(
    [
      `Skill translation catalog must cover exactly ${skills.length} skills.`,
      `Missing: ${missingSkillTranslations.join(", ") || "none"}.`,
      `Extra: ${extraSkillTranslations.join(", ") || "none"}.`,
    ].join(" "),
  );
}

function calibrateToPrerequisiteFloor(metadata, prerequisiteSkills) {
  if (!(metadata.level in questionLevelRank)) {
    throw new Error(`Unknown question level ${metadata.level}`);
  }
  if (!(metadata.difficulty in difficultyRank)) {
    throw new Error(`Unknown question difficulty ${metadata.difficulty}`);
  }
  let requiredLevel = "foundation";
  for (const skillId of prerequisiteSkills || []) {
    const skill = skillById.get(skillId);
    if (!skill) {
      throw new Error(`Unknown prerequisite skill ${skillId}`);
    }
    const skillFloor = skillLevelQuestionFloor[skill.level];
    if (!skillFloor) {
      throw new Error(
        `Skill ${skillId} has unsupported calibration level ${skill.level}`,
      );
    }
    if (questionLevelRank[skillFloor] > questionLevelRank[requiredLevel]) {
      requiredLevel = skillFloor;
    }
  }
  const level =
    questionLevelRank[requiredLevel] > questionLevelRank[metadata.level]
      ? requiredLevel
      : metadata.level;
  const floor = metadataFloorByLevel[level];
  const difficulty =
    difficultyRank[floor.difficulty] > difficultyRank[metadata.difficulty]
      ? floor.difficulty
      : metadata.difficulty;
  return {
    level,
    difficulty,
    minutes: Math.max(Number(metadata.minutes) || 0, floor.minutes),
  };
}

const softwareIntegrationRoleIds = new Set([
  "rf-eda-rd",
  "rf-ai-eda",
  "rf-cad-flow",
]);
const digitalHardwareIntegrationRoleIds = new Set([
  "rf-rtl",
  "rf-dv",
  "rf-fpga",
  "rf-architecture",
  "rf-physical-design",
  "rf-dft",
]);

function integrationDomain(role) {
  if (softwareIntegrationRoleIds.has(role.id)) return "software-service";
  if (digitalHardwareIntegrationRoleIds.has(role.id)) return "digital-hardware";
  if (role.id === "rf-analog-custom") return "analog-custom";
  if (role.id === "rf-embedded") return "embedded-hardware";
  if (role.id === "rf-manufacturing-automation")
    return "manufacturing-safety";
  throw new Error(`No technical integration profile for ${role.id}`);
}

const variants = [
  {
    id: "contract",
    title: "Contract Reconstruction",
    titleZh: "契约重构",
    type: "conceptual",
    level: "foundation",
    difficulty: "easy",
    minutes: 12,
    action:
      "Reconstruct the smallest correct problem contract before proposing a solution. Name the inputs, outputs, invariants, exclusions, and one ambiguity that must be resolved.",
    actionZh:
      "在提出方案前重构最小且正确的问题契约，明确输入、输出、不变量、排除项，以及一个必须澄清的歧义。",
    twist:
      "The interviewer will remove one unstated assumption after your first answer.",
    twistZh: "面试官会在你的第一版回答后撤销一个未声明的假设。",
  },
  {
    id: "worked-example",
    title: "Worked Example and Boundary",
    titleZh: "算例与边界",
    type: "conceptual",
    level: "foundation",
    difficulty: "easy",
    minutes: 15,
    action:
      "Work one concrete nominal example and one smallest counterexample by hand. Preserve units, ordering, and state transitions so another engineer can reproduce every step.",
    actionZh:
      "手工推演一个正常算例和一个最小反例，保留单位、顺序与状态迁移，使另一位工程师能够逐步复现。",
    twist:
      "If two plausible boundary conventions predict different results, name the convention used and keep the exercise to one smallest counterexample.",
    twistZh:
      "如果两种合理的边界约定会预测不同结果，请明确采用哪一种，并把练习限制为一个最小反例。",
  },
  {
    id: "minimal-implementation",
    title: "Minimal Implementation",
    titleZh: "最小实现",
    type: "coding",
    level: "intermediate",
    difficulty: "medium",
    minutes: 35,
    action:
      "Design pseudocode or a minimal implementation with explicit data structures, interfaces, invariants, and time, memory, or hardware cost.",
    actionZh:
      "给出伪代码或最小实现，明确数据结构、接口、不变量，以及时间、内存或硬件成本。",
    twist:
      "After one nominal fixture passes, construct exactly one minimally invalid input, observation, or constraint by violating a declared invariant; the method must identify and reject it explicitly rather than silently producing a result.",
    twistZh:
      "在一个正常样例通过后，通过违反一项已声明不变量来构造恰好一个最小无效输入、观测或约束；方法必须明确识别并拒绝它，而不能静默地产生结果。",
  },
  {
    id: "fault-injection",
    title: "Fault Injection Debug",
    titleZh: "故障注入调试",
    type: "debugging",
    level: "intermediate",
    difficulty: "medium",
    minutes: 35,
    action:
      "Assume a plausible defect has been injected. Build a ranked hypothesis tree, choose the highest-information measurement, and isolate the first violated invariant.",
    actionZh:
      "假设系统中注入了一个合理缺陷；构建按优先级排序的假设树，选择信息增益最高的测量，并定位第一个被破坏的不变量。",
    twist:
      "The most visible symptom is downstream of the root cause and disappears when verbose logging is enabled.",
    twistZh: "最明显的症状位于根因下游，并且在开启详细日志后消失。",
  },
  {
    id: "oracle",
    title: "Independent Oracle",
    titleZh: "独立判定器",
    type: "system-task",
    level: "intermediate",
    difficulty: "medium",
    minutes: 30,
    action:
      "Build an independent oracle and a compact regression suite. Include a nominal case, a boundary, a negative case, and a metamorphic or differential check.",
    actionZh:
      "构建独立判定器和紧凑回归集，至少包含正常案例、边界案例、负面案例，以及变形测试或差分检查。",
    twist:
      "The primary answer or design and the first validation path share the same potentially wrong assumption.",
    twistZh: "主要答案或设计与第一条验证路径共享同一个可能错误的假设。",
  },
  {
    id: "scale",
    title: "Scale and Resource Ceiling",
    titleZh: "规模与资源上限",
    type: "design",
    level: "advanced",
    difficulty: "hard",
    minutes: 45,
    action:
      "Scale the solution by three orders of magnitude. Quantify the first resource ceiling, redesign the hot path, and state what correctness signal must not be traded away.",
    actionZh:
      "把方案规模扩大三个数量级，量化首个资源瓶颈，重构热点路径，并说明绝不能牺牲的正确性信号。",
    twist:
      "The headline case still fits the budget, but one boundary operating condition does not.",
    twistZh: "主要案例仍满足预算，但一个边界运行条件不满足。",
  },
  {
    id: "tradeoff",
    title: "Trade-off Decision Review",
    titleZh: "权衡决策评审",
    type: "design",
    level: "advanced",
    difficulty: "hard",
    minutes: 40,
    action:
      "Compare two credible alternatives using explicit criteria, quantitative assumptions, reversibility, and residual risk; then make a conditional recommendation.",
    actionZh:
      "依据明确标准、量化假设、可逆性与残余风险比较两个可信方案，并给出带条件的推荐。",
    twist:
      "One option wins the headline metric but loses observability, debuggability, or recovery safety.",
    twistZh:
      "其中一个方案在主指标上领先，却损失了可观测性、可调试性或恢复安全性。",
  },
  {
    id: "incident",
    title: "Ambiguous Production Incident",
    titleZh: "模糊生产事故",
    type: "log-analysis",
    level: "advanced",
    difficulty: "hard",
    minutes: 45,
    action:
      "Triage an intermittent production incident from incomplete evidence. Separate facts from inference, order the first five checks, and define containment, root-cause, and prevention evidence.",
    actionZh:
      "根据不完整证据排查一次间歇性生产事故；区分事实与推断，排列前五项检查，并定义止损、根因和预防证据。",
    twist:
      "Two evidence sources disagree because their observation windows, conditions, or timebases differ.",
    twistZh: "两个证据源因观测窗口、条件或时间基准不同而结论冲突。",
  },
  {
    id: "integration",
    title: "Cross-Layer Boss Fight",
    titleZh: "跨层综合挑战",
    type: "boss-fight",
    level: "advanced",
    difficulty: "hard",
    minutes: 60,
    action:
      "Integrate the technical solution with an upstream contract, a downstream consumer, rollout telemetry, rollback, and a concise stakeholder explanation.",
    actionZh:
      "把技术方案与上游契约、下游使用方、上线遥测、回滚机制及简洁的利益相关方说明整合起来。",
    twist:
      "A late requirement change invalidates one optimization but not the externally visible contract.",
    twistZh: "一个后期需求变更使某项优化失效，但不改变外部可见契约。",
  },
];

function softVariant(id, title, titleZh, level, difficulty, minutes, type) {
  return {
    id,
    title,
    titleZh,
    level,
    difficulty,
    minutes,
    type,
    action: title,
    actionZh: titleZh,
    twist:
      "A skeptical follow-up tests whether the answer remains truthful and internally consistent.",
    twistZh: "一项带有怀疑态度的追问将检验回答是否仍然真实且内部一致。",
  };
}

const behavioralVariants = [
  softVariant(
    "evidence-inventory",
    "Evidence Inventory",
    "证据盘点",
    "foundation",
    "easy",
    25,
    "behavioral",
  ),
  softVariant(
    "star-compression",
    "STAR Compression",
    "STAR 压缩",
    "foundation",
    "easy",
    30,
    "behavioral",
  ),
  softVariant(
    "ownership-boundary",
    "Ownership Boundary",
    "责任边界",
    "intermediate",
    "medium",
    25,
    "behavioral",
  ),
  softVariant(
    "followup-consistency",
    "Follow-up Consistency",
    "追问一致性",
    "intermediate",
    "medium",
    30,
    "behavioral",
  ),
  softVariant(
    "impact-quantification",
    "Impact Quantification",
    "影响量化",
    "intermediate",
    "medium",
    30,
    "behavioral",
  ),
  softVariant(
    "conflict-reflection",
    "Conflict and Failure Reflection",
    "冲突与失败复盘",
    "advanced",
    "hard",
    40,
    "behavioral",
  ),
  softVariant(
    "ambiguity-replan",
    "Ambiguity Replan",
    "模糊情境重规划",
    "advanced",
    "hard",
    40,
    "behavioral",
  ),
  softVariant(
    "skeptical-panel",
    "Skeptical Panel",
    "怀疑式追问",
    "advanced",
    "hard",
    45,
    "behavioral",
  ),
  softVariant(
    "behavioral-loop",
    "Behavioral Loop",
    "行为面试整轮",
    "advanced",
    "hard",
    60,
    "behavioral",
  ),
];

const projectVariants = [
  softVariant(
    "project-boundary",
    "Project Boundary",
    "项目边界",
    "foundation",
    "easy",
    25,
    "project-deep-dive",
  ),
  softVariant(
    "artifact-proof",
    "Artifact and Metric Proof",
    "工件与指标证据",
    "foundation",
    "easy",
    30,
    "project-deep-dive",
  ),
  softVariant(
    "architecture-whiteboard",
    "Architecture Whiteboard",
    "架构白板",
    "intermediate",
    "medium",
    30,
    "project-deep-dive",
  ),
  softVariant(
    "contribution-map",
    "Contribution Map",
    "个人贡献地图",
    "intermediate",
    "medium",
    25,
    "project-deep-dive",
  ),
  softVariant(
    "decision-reconstruction",
    "Decision Reconstruction",
    "决策重构",
    "intermediate",
    "medium",
    35,
    "project-deep-dive",
  ),
  softVariant(
    "root-cause-defense",
    "Root-Cause Defense",
    "根因答辩",
    "advanced",
    "hard",
    45,
    "project-deep-dive",
  ),
  softVariant(
    "scale-counterfactual",
    "Scale Counterfactual",
    "规模反事实",
    "advanced",
    "hard",
    45,
    "project-deep-dive",
  ),
  softVariant(
    "adversarial-crosscheck",
    "Adversarial Cross-check",
    "对抗性交叉核对",
    "advanced",
    "hard",
    45,
    "project-deep-dive",
  ),
  softVariant(
    "project-loop",
    "Project Deep-Dive Loop",
    "项目深挖整轮",
    "advanced",
    "hard",
    60,
    "project-deep-dive",
  ),
];

const englishVariants = [
  softVariant(
    "english-clarify",
    "Three Clarifying Questions",
    "三个英文澄清问题",
    "foundation",
    "easy",
    25,
    "english-communication",
  ),
  softVariant(
    "english-summary",
    "Thirty-Second Summary",
    "三十秒英文总结",
    "foundation",
    "easy",
    30,
    "english-communication",
  ),
  softVariant(
    "english-think-aloud",
    "Think-Aloud Checkpoints",
    "英文口述检查点",
    "intermediate",
    "medium",
    25,
    "english-communication",
  ),
  softVariant(
    "english-tradeoff",
    "Trade-off Explanation",
    "英文权衡解释",
    "intermediate",
    "medium",
    30,
    "english-communication",
  ),
  softVariant(
    "english-debug-handoff",
    "Debug Handoff",
    "英文调试交接",
    "intermediate",
    "medium",
    30,
    "english-communication",
  ),
  softVariant(
    "english-repair",
    "Misunderstanding Repair",
    "英文误解修复",
    "advanced",
    "hard",
    35,
    "english-communication",
  ),
  softVariant(
    "english-design-review",
    "Design Review Pushback",
    "英文设计评审质疑",
    "advanced",
    "hard",
    40,
    "english-communication",
  ),
  softVariant(
    "english-uncertainty",
    "Unknown and Uncertainty",
    "英文未知与不确定性",
    "advanced",
    "hard",
    35,
    "english-communication",
  ),
  softVariant(
    "english-loop",
    "English Interview Loop",
    "英文技术面试整轮",
    "advanced",
    "hard",
    60,
    "english-communication",
  ),
];

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function withIndefiniteArticle(phrase) {
  return `${/^[aeiou]/i.test(phrase) ? "An" : "A"} ${phrase}`;
}

function contractLabel(title) {
  return /\bcontract$/i.test(title.trim()) ? title : `${title} contract`;
}

function contractLabelZh(title) {
  return /契约$/.test(title.trim()) ? title : `${title}契约`;
}

function zhTerm(term) {
  const value = String(term || "");
  const leadingSpace = /^[A-Za-z0-9]/.test(value) ? " " : "";
  const trailingSpace = /[A-Za-z0-9+]$/.test(value) ? " " : "";
  return `${leadingSpace}${value}${trailingSpace}`;
}

function zhSkillNames(question) {
  return unique(question.skills.map((id) => skillById.get(id)?.titleZh)).join(
    "、",
  );
}

function enSkillNames(question) {
  return unique(
    question.skills.map(
      (id) => skillById.get(id)?.title || skillById.get(id)?.name,
    ),
  ).join(", ");
}

function appendOnce(value, addition, separator = " ") {
  const current = String(value || "").trim();
  const extra = String(addition || "").trim();
  if (!extra || current.includes(extra)) return current;
  return `${current}${separator}${extra}`.trim();
}

function insertBeforeEndingOnce(value, addition, ending, separator = " ") {
  const current = String(value || "").trim();
  const extra = String(addition || "").trim();
  if (!extra || current.includes(extra)) return current;
  if (!current.endsWith(ending)) return appendOnce(current, extra, separator);
  const prefix = current.slice(0, -ending.length).trimEnd();
  return `${prefix}${separator}${extra}${separator}${ending}`.trim();
}

function applyEditorialOverride(question) {
  const override = editorialOverrides[question.id];
  if (!override) return question;
  const prompt =
    typeof override.prompt === "string"
      ? override.prompt.trim()
      : appendOnce(question.prompt, override.appendPrompt, " ");
  const promptZh =
    typeof override.promptZh === "string"
      ? override.promptZh.trim()
      : appendOnce(question.promptZh, override.appendPromptZh, "");
  return {
    ...question,
    prompt,
    promptZh,
  };
}

function normalizeOracle(question) {
  const spec = oracleSpecCatalog[question.id];
  if (!spec) {
    throw new Error(`Missing task-specific oracle spec for ${question.id}`);
  }
  return {
    oracle: { ...spec.oracle },
    oracleZh: { ...spec.oracleZh },
  };
}

function enrichCurated(question, index) {
  const translation = translationCatalog[question.id];
  if (!translation) {
    throw new Error(`Missing reviewed Chinese translation for ${question.id}`);
  }
  for (const field of [
    "promptZh",
    "deliverablesZh",
    "rubricZh",
    "commonFailuresZh",
    "followUpsZh",
  ]) {
    if (
      !translation[field] ||
      (Array.isArray(question[field.replace(/Zh$/, "")]) &&
        translation[field].length !== question[field.replace(/Zh$/, "")].length)
    ) {
      throw new Error(
        `Translation ${question.id}.${field} is missing or not parallel`,
      );
    }
  }
  const referenceOutline =
    question.referenceOutline?.length > 0
      ? question.referenceOutline
      : [
          `Define the contract, inputs, outputs, units, and success criterion for ${question.title}.`,
          `Apply ${enSkillNames(question)} while keeping assumptions and invariants explicit.`,
          "Walk through a nominal case, a boundary case, and the highest-risk failure path.",
          "Validate independently and end with residual risks and the next discriminating check.",
        ];
  const { oracle, oracleZh } = normalizeOracle(question);
  const hasAdvancedTarget = question.skills.some(
    (skillId) => skillById.get(skillId)?.level === "advanced",
  );
  const promoteFoundationalLabel =
    hasAdvancedTarget && ["entry", "foundation"].includes(question.level);
  const calibratedMetadata = calibrateToPrerequisiteFloor(
    {
      level: promoteFoundationalLabel ? "intermediate" : question.level,
      difficulty:
        promoteFoundationalLabel && question.difficulty === "easy"
          ? "medium"
          : question.difficulty,
      minutes: promoteFoundationalLabel
        ? Math.max(Number(question.estimatedMinutes) || 0, 20)
        : question.estimatedMinutes,
    },
    question.prerequisiteSkills || [],
  );
  return applyEditorialOverride({
    ...question,
    ...translation,
    level: calibratedMetadata.level,
    difficulty: calibratedMetadata.difficulty,
    estimatedMinutes: calibratedMetadata.minutes,
    referenceOutline,
    referenceOutlineZh:
      translation.referenceOutlineZh ||
      referenceOutline.map(
        (_, outlineIndex) =>
          [
            `定义“${question.titleZh}”的对象、输入输出、单位与成功标准`,
            `运用${zhTerm(zhSkillNames(question))}建立最小正确模型，并列出关键不变量`,
            "推演正常、边界和失败路径，区分观测事实与原因推断",
            "使用独立方法验证结果，并记录残余风险与下一项检查",
          ][outlineIndex % 4],
      ),
    oracle,
    oracleZh,
    blueprintId: question.blueprintId || "curated-scenario-v1",
    generationSpec: {
      origin: "curated-v1",
      baseQuestionId: question.id,
      archetype: "curated",
      contextIndex: index,
      skillIndex: 0,
      seed: `curated:${question.id}`,
    },
    contentVersion: "2026-07-23.5",
  });
}

function scenarioSource(prompt) {
  return prompt
    .replace(
      /\s*State all assumptions that materially affect correctness;.*$/s,
      "",
    )
    .replace(/\s*Keep the example truthful;.*$/s, "")
    .trim();
}

function scenarioSourceZh(prompt) {
  return prompt.trim();
}

function standalonePrompt(base, variant, targetSkill, role) {
  const sourceScenario = scenarioSource(base.prompt);
  const lead = `Reference scenario (quoted only; the transformation below defines the required deliverable): “${sourceScenario}”`;
  const contractSource = `Source scenario (reference-only quotation; do not execute its requested solution in this exercise): “${sourceScenario}”`;
  const integrationTasks = {
    "software-service": `${lead} The solution must now connect to an upstream data or control source and a downstream tool, service, device, or operator-facing consumer while preserving its externally visible behavior. Specify both interface contracts, ownership, failure isolation, release telemetry and thresholds, staged rollout, rollback, and the concise explanation you would give reviewers. ${variant.twist}`,
    "digital-hardware": `${lead} The block, verification environment, or implementation change must now integrate with adjacent hardware while preserving architectural and cycle- or transaction-visible behavior. Specify source and sink interface contracts, clock, reset, power, and timing assumptions, verification and signoff evidence, incremental integration checkpoints, observability hooks, and a safe fallback using bypass, feature disable, or ECO. ${variant.twist}`,
    "analog-custom": `${lead} The circuit or custom block must now integrate with its source, load, bias, control, and test environment while preserving the externally visible electrical behavior. Specify impedance and range assumptions, bias and control sequencing, PVT and mixed-signal boundaries, measurement hooks, and a reversible ECO or test configuration. ${variant.twist}`,
    "embedded-hardware": `${lead} The firmware must now integrate with a real peripheral, interrupt or DMA path, clock/reset/power boundary, and external protocol while preserving the declared software-visible behavior. Specify MMIO ownership and ordering, asynchronous sampling or CDC assumptions, reset and low-power sequencing, cache or buffer coherency, electrical/protocol observability, bounded recovery, and a board-safe fallback. ${variant.twist}`,
    "manufacturing-safety": `${lead} The automation change must now integrate equipment control, PLC or GEM state, an upstream sensor or interlock, and a downstream MES or operator action without weakening safety. Specify deterministic handshakes, stale-data and timeout behavior, recipe and identity ownership, fail-safe de-energized state, an independent protection layer, evidence retention, controlled recovery, and rollback that cannot bypass the interlock. ${variant.twist}`,
  };
  const tasks = {
    contract: `For the “${base.title}” scenario, reconstruct only the smallest externally visible contract in one page or less: legal input and output, one invariant, one explicit boundary, and one ambiguity that must be resolved. Use “${targetSkill.title || targetSkill.name}” only as a lens for making those clauses precise; omit solution artifacts and expansion plans. ${variant.twist} ${contractSource}`,
    "worked-example": `${lead} Choose explicit values or states and show exactly one nominal case plus one smallest counterexample step by step, including where ${targetSkill.title || targetSkill.name} changes the result. Stop after the reproduced result; do not add an implementation, architecture, or regression plan. ${variant.twist}`,
    "minimal-implementation": `${lead} Produce the smallest executable method appropriate to this domain: code, RTL, calculation, constraint set, experiment, or test sequence. Declare inputs, procedure, invariants, expected output, invalid-evidence handling, and the relevant time, memory, hardware, or measurement cost. ${variant.twist}`,
    "fault-injection": `${lead} A previously passing implementation now fails intermittently after a small change. Build a ranked hypothesis tree, choose the highest-information measurement, minimize a reproducer, and identify the first violated invariant before proposing a fix. ${variant.twist}`,
    oracle: `${lead} The primary answer or design and its first validation path may share the same assumption. Create an independent oracle appropriate to the domain, plus nominal, boundary, negative, and differential or consistency checks. State what observation would falsify the answer, and show why the new reference is genuinely independent.`,
    scale: `${lead} Problem size, operating envelope, or required throughput changes by three orders of magnitude, so the original approach misses its stated resource, timing, or accuracy budget. Quantify the first ceiling, adapt the method using ${targetSkill.title || targetSkill.name}, and preserve the most important correctness signal. ${variant.twist}`,
    tradeoff: `${lead} Two engineers propose credible but incompatible solutions. Compare them using correctness, performance, implementation cost, observability, recovery safety, and reversibility; quantify the assumptions and make a conditional recommendation. ${variant.twist}`,
    incident: `${lead} Two evidence sources disagree because their observation windows, conditions, or timebases differ. Separate observations from inference, normalize the comparison, order the first five checks, and define the measurement that distinguishes artifact from a real failure.`,
    integration: integrationTasks[integrationDomain(role)],
  };
  return `${tasks[variant.id]} Use public concepts only; state assumptions and finish with a falsifiable acceptance criterion.`;
}

function standalonePromptZh(base, variant, targetSkill, role) {
  const sourceScenario = scenarioSourceZh(base.promptZh);
  const lead = `参考场景（仅作引文；以下变式要求定义本题交付物）：《${sourceScenario}》`;
  const contractSource = `原始场景（仅作参考引文；本练习不执行其中要求的解法）：《${sourceScenario}》`;
  const integrationTasks = {
    "software-service": `${lead}方案现在必须接入上游数据或控制源，以及下游工具、服务、设备或面向操作员的使用方，同时保持外部可见行为不变。请定义双方接口契约、责任归属、故障隔离、发布遥测与阈值、分阶段上线、回滚，以及向评审者说明方案的简洁表述。${variant.twistZh}`,
    "digital-hardware": `${lead}模块、验证环境或实现变更现在必须与相邻硬件集成，同时保持架构可见以及周期或事务可见行为不变。请定义源端和接收端接口契约、时钟、复位、电源和时序假设、验证与签核证据、增量集成检查点、可观测钩子，以及使用旁路、功能禁用或 ECO 的安全后备方案。${variant.twistZh}`,
    "analog-custom": `${lead}电路或定制模块现在必须与信号源、负载、偏置、控制和测试环境集成，同时保持外部可见电气行为不变。请定义阻抗与范围假设、偏置和控制时序、PVT 与混合信号边界、测量钩子，以及可逆的 ECO 或测试配置。${variant.twistZh}`,
    "embedded-hardware": `${lead}固件现在必须与真实外设、中断或 DMA 路径、时钟/复位/电源边界及外部协议集成，同时保持已声明的软件可见行为。请定义 MMIO 所有权与访问顺序、异步采样或 CDC 假设、复位与低功耗时序、缓存或缓冲一致性、电气/协议可观测性、有界恢复，以及板级安全的后备方案。${variant.twistZh}`,
    "manufacturing-safety": `${lead}自动化变更现在必须把设备控制、PLC 或 GEM 状态、上游传感器或联锁，以及下游 MES 或操作员动作集成起来，且不得削弱安全性。请定义确定性握手、陈旧数据与超时行为、配方和身份所有权、失效安全的去激励状态、独立保护层、证据保留、受控恢复，以及不能绕过联锁的回退。${variant.twistZh}`,
  };
  const tasks = {
    contract: `对于“${base.titleZh}”场景，只重构最小外部可见契约，并控制在不超过一页：合法输入与输出、一个不变量、一个明确边界，以及一个必须澄清的歧义。仅以“${targetSkill.titleZh}”为视角校准这些条款；省略解法工件与扩展计划。${variant.twistZh}${contractSource}`,
    "worked-example": `${lead}请选择明确数值或状态，逐步展示恰好一个正常案例和一个最小反例，并指出${zhTerm(targetSkill.titleZh)}在何处改变结果。复现结果后即停止，不要增加实现、架构或回归计划。${variant.twistZh}`,
    "minimal-implementation": `${lead}给出适合该领域的最小可执行方法：代码、RTL、计算、约束集、实验或测试序列。声明输入、步骤、不变量、预期输出、无效证据处理，以及相关的时间、内存、硬件或测量成本。${variant.twistZh}`,
    "fault-injection": `${lead}一个此前通过的实现，在小改动后开始间歇失败。请构建按优先级排序的假设树，选择信息增益最高的测量，最小化复现，并在提出修复前定位第一个被破坏的不变量。${variant.twistZh}`,
    oracle: `${lead}主要答案或设计与第一条验证路径可能共享同一个假设。请构建适合该领域的独立判定器，并加入正常、边界、负面和差分或一致性检查；说明什么观测会证伪答案，以及为何新的参考路径真正独立。`,
    scale: `${lead}问题规模、运行包络或所需吞吐改变三个数量级，使原方法无法满足已声明的资源、时序或准确度预算。请量化首个上限，运用${zhTerm(targetSkill.titleZh)}调整方法，并保留最重要的正确性信号。${variant.twistZh}`,
    tradeoff: `${lead}两位工程师提出了可信但互不兼容的方案。请从正确性、性能、实现成本、可观测性、恢复安全和可逆性出发比较，量化假设并给出带条件的推荐。${variant.twistZh}`,
    incident: `${lead}两个证据源因观测窗口、条件或时间基准不同而结论冲突。请区分观测与推断，统一比较口径，排列前五项检查，并定义能够区分测量伪象与真实故障的观测。`,
    integration: integrationTasks[integrationDomain(role)],
  };
  return `${tasks[variant.id]}只使用公开概念，明确所有假设，并以可证伪的验收条件收尾。`;
}

const softPromptActions = {
  "rf-behavioral": {
    "evidence-inventory": [
      "Before recording, inventory supportable facts, team context, your decisions and actions, the observable result, evidence gaps, and every confidential boundary.",
      "录音前盘点可支持的事实、团队背景、你的决策与行动、可观察结果、证据缺口和所有保密边界。",
    ],
    "star-compression": [
      "Give a truthful 90-second STAR answer, then compress it to 30 seconds without dropping personal action, consequence, or learning; compare the recordings and remove memorized filler.",
      "先给出真实的 90 秒 STAR 回答，再压缩到 30 秒，同时保留个人行动、后果和学习；比较两次录音并删除背诵式填充语。",
    ],
    "ownership-boundary": [
      "Retell the event using “I” only for work you personally owned and “we” for shared context; name help received, decision authority, escalation boundaries, and attributable impact.",
      "重述事件：只有亲自负责的工作使用“我”，共享背景使用“我们”；说明获得的帮助、决策权限、升级边界和可归因影响。",
    ],
    "followup-consistency": [
      "Answer five follow-ups about timeline, alternatives, disagreement, measurement, and what you would change; keep every fact consistent and explicitly correct any mismatch.",
      "回答关于时间线、替代方案、分歧、测量和改进的五个追问；让每项事实保持一致，并明确纠正任何矛盾。",
    ],
    "impact-quantification": [
      "Build a defensible impact statement with baseline, measurement window, team contribution, attributable personal contribution, uncertainty, and one result you must not claim.",
      "构建可辩护的影响陈述，包含基线、测量窗口、团队贡献、可归因的个人贡献、不确定性，以及一项绝不能声称的结果。",
    ],
    "conflict-reflection": [
      "Reconstruct the event from the most skeptical teammate’s perspective, state what they reasonably knew, identify a valid criticism of your behavior, and show later evidence of learning.",
      "从最怀疑你的队友视角重构事件，说明对方当时合理掌握的信息、对你行为的一项有效批评，以及后来证明你有所学习的证据。",
    ],
    "ambiguity-replan": [
      "Assume one key premise becomes false halfway through the story; explain the checkpoint that reveals it, how scope or priority changes, whom you notify, and which commitment remains.",
      "假设故事进行到一半时一个关键前提变为错误；说明哪个检查点会发现它、如何调整范围或优先级、通知谁，以及哪项承诺仍然有效。",
    ],
    "skeptical-panel": [
      "Respond to challenges about ownership, causality, and hindsight; support each important claim, protect confidential details, acknowledge one limitation, and revise anything indefensible.",
      "回应关于责任、因果和事后偏差的质疑；支持每项重要主张，保护保密细节，承认一项局限，并修正任何无法辩护的表述。",
    ],
    "behavioral-loop": [
      "Run a mini loop: a two-minute answer, four adaptive follow-ups, a 30-second compression, and a reflection on the weakest signal, all using one truthful public-safe example.",
      "完成一轮迷你面试：两分钟回答、四个动态追问、30 秒压缩，以及对最弱信号的反思；全程使用一个真实且可公开的案例。",
    ],
  },
  "rf-project-deep-dive": {
    "project-boundary": [
      "In six sentences or fewer, define the user, problem, start and end boundaries, one external dependency, your owned component, and the public-safe result.",
      "用不超过六句话定义用户、问题、起止边界、一个外部依赖、你负责的组件和可公开结果。",
    ],
    "artifact-proof": [
      "Create an evidence card for one important claim: artifact, version or date, baseline, measurement method, scope, personal contribution, and missing evidence.",
      "为一项重要主张制作证据卡：工件、版本或日期、基线、测量方法、范围、个人贡献和缺失证据。",
    ],
    "architecture-whiteboard": [
      "Draw the smallest architecture that preserves important interfaces, state, data or control flow, and failure boundaries; trace one item end to end and mark your ownership.",
      "绘制保留关键接口、状态、数据或控制流和故障边界的最小架构；端到端追踪一个对象并标记你的责任。",
    ],
    "contribution-map": [
      "Partition decisions and implementation you owned, shared work, dependencies owned by others, help received, and outcomes attributable to each part.",
      "划分你负责的决策与实现、共享工作、由他人负责的依赖、获得的帮助，以及可归因于各部分的结果。",
    ],
    "decision-reconstruction": [
      "Using only information available at the time, compare two credible alternatives, criteria, reversibility, decision owner, later evidence, and process quality independent of outcome.",
      "只使用当时可用信息，比较两个可信方案、标准、可逆性、决策负责人、后续证据，以及独立于结果的过程质量。",
    ],
    "root-cause-defense": [
      "Present a difficult failure as a hypothesis timeline: symptom, ranked causes, discriminating experiments, disconfirming evidence, root cause, fix, and recurrence-prevention artifact.",
      "把困难故障讲成假设时间线：症状、排序后的原因、区分性实验、反证、根因、修复和防止复发的工件。",
    ],
    "scale-counterfactual": [
      "Increase one measured project dimension by 10× with fixed staffing; identify the first bottleneck from evidence, quantify the limit, change only necessary boundaries, and define migration checks.",
      "在人员不变时把一个已测量项目维度扩大 10 倍；根据证据找出首个瓶颈，量化上限，只修改必要边界并定义迁移检查。",
    ],
    "adversarial-crosscheck": [
      "Defend metric definition, causal attribution, ownership, architecture trade-offs, and missing cases; revise every claim the underlying artifact cannot support.",
      "就指标定义、因果归因、责任、架构取舍和遗漏案例进行答辩；修改所有底层工件无法支持的主张。",
    ],
    "project-loop": [
      "Run a complete project deep dive: one-minute framing, architecture whiteboard, metric defense, decision replay, failure analysis, scale counterfactual, ownership audit, and lessons.",
      "完成整轮项目深挖：一分钟定位、架构白板、指标答辩、决策重演、失败分析、规模反事实、责任审计和经验。",
    ],
  },
  "rf-english-communication": {
    "english-clarify": [
      "Before attempting the assigned exercise, ask exactly three high-information English questions about audience, objective, measurable success, scope, or missing context; then restate the agreed task in one sentence.",
      "在完成指定练习前，用英文就受众、目标、可衡量成功标准、范围或缺失背景提出恰好三个高信息量问题；再用一句英文重述已达成共识的任务。",
    ],
    "english-summary": [
      "Complete the assigned exercise, then give a 30-second English summary with four moves: context, key point, evidence or uncertainty, and next step; record and transcribe one take.",
      "先完成指定练习，再用英文完成 30 秒四步总结：背景、关键要点、证据或不确定性、下一步；录制并转写一遍。",
    ],
    "english-think-aloud": [
      "Plan and perform the assigned exercise aloud in English using checkpoints for assumptions, structure, example, evidence, self-check, and correction; pause for interviewer input instead of delivering a closed monologue.",
      "用英文规划并完成指定练习，按假设、结构、案例、证据、自检和修正六个检查点口述；给面试官留出互动空间，不要封闭式独白。",
    ],
    "english-tradeoff": [
      "Choose two credible ways to frame or solve the assigned exercise. In English, compare them using explicit criteria, recommend one conditionally, state what reverses the choice, and name one residual risk.",
      "为指定练习选择两种可信的表述或解决方式。用英文依据明确标准比较，给出带条件的推荐，说明什么会逆转选择，并指出一项残余风险。",
    ],
    "english-debug-handoff": [
      "After a first attempt, give a 60-second English handoff covering what was requested, what you tried, strongest evidence, remaining uncertainty, next check, owner, and risk.",
      "完成第一次尝试后，用英文进行 60 秒交接：任务要求、已经尝试的内容、最强证据、剩余不确定性、下一项检查、负责人和风险。",
    ],
    "english-repair": [
      "When the interviewer identifies a misunderstanding, acknowledge it in English without defensiveness, restate the corrected requirement, preserve valid reasoning, discard invalid parts, and resume.",
      "面试官指出误解后，用英文不带防御地承认，重述修正后的要求，保留有效推理，丢弃无效部分并继续。",
    ],
    "english-design-review": [
      "Assume the interviewer challenges one choice in your answer. In English, confirm the criterion, compare a simpler alternative, remove unjustified complexity, and defend only the evidence-backed part.",
      "假设面试官质疑你答案中的一项选择。用英文确认评判标准，比较更简单的替代方案，删除无依据复杂度，并只为有证据的部分答辩。",
    ],
    "english-uncertainty": [
      "Assume a follow-up introduces one genuinely unknown detail. In English, state the boundary, connect a nearby principle without equating it, ask one focused question, and propose verification.",
      "假设追问引入一个真正未知的细节。用英文说明知识边界，关联但不等同一个相邻原理，提出一个聚焦问题并说明验证。",
    ],
    "english-loop": [
      "Complete an English mini-loop with clarification, technical explanation, trade-off, pushback, misunderstanding repair, concise summary, and one thoughtful interviewer question.",
      "用英文完成一轮迷你面试：澄清、技术解释、权衡、质疑、误解修复、简洁总结和一个有思考的反问。",
    ],
  },
};

function softQuestionFields(role, base, variant) {
  const action = softPromptActions[role.id][variant.id];
  const lead = base.prompt.trim();
  const leadZh = base.promptZh.trim();
  if (role.id === "rf-behavioral") {
    return {
      prompt: `${lead} ${action[0]} Do not fabricate experience, metrics, motives, or outcomes, and do not disclose confidential information.`,
      promptZh: `${leadZh}${action[1]}不得编造经历、指标、动机或结果，也不得披露保密信息。`,
      deliverables: [
        `A recorded ${variant.title.toLowerCase()} answer grounded in one truthful, public-safe example`,
        "A fact/claim/evidence table separating personal action, team context, result, uncertainty, and confidential boundaries",
        "A rubric self-review and one targeted revision that preserves factual consistency",
      ],
      deliverablesZh: [
        `一段基于真实且可公开案例的${variant.titleZh}录音回答`,
        "一张事实—主张—证据表，区分个人行动、团队背景、结果、不确定性和保密边界",
        "一次依据评分标准的自评，以及一轮保持事实一致的针对性修改",
      ],
      rubric: [
        "Truthfulness and evidence (0-4): every material claim is supportable, uncertainty is labeled, and confidential information is protected.",
        "Ownership (0-2): personal decisions and actions are distinct from team context, help received, and decision authority.",
        "Reflection (0-2): exposes a real trade-off, limitation, or changed behavior rather than a polished hero narrative.",
        "Communication (0-2): remains direct and internally consistent under follow-up and fits the stated time.",
      ],
      rubricZh: [
        "真实性与证据（0–4）：每项重要主张都有依据，明确标记不确定性，并保护保密信息。",
        "责任边界（0–2）：个人决策与行动区别于团队背景、获得的帮助和决策权限。",
        "反思（0–2）：呈现真实取舍、局限或行为改变，而不是完美英雄叙事。",
        "沟通（0–2）：回答直接，在追问中内部一致，并符合规定时间。",
      ],
      commonFailures: [
        "Invents experience, metrics, motives, or outcomes, or reveals confidential detail to sound credible.",
        "Uses generic “we” language without a verifiable personal decision, action, or consequence.",
        "Memorizes a script whose facts, timeline, or ownership change under follow-up.",
      ],
      commonFailuresZh: [
        "编造经历、指标、动机或结果，或为了显得可信而泄露保密细节。",
        "只使用笼统的“我们”，没有可核实的个人决策、行动或后果。",
        "背诵脚本，但在追问中改变事实、时间线或责任归属。",
      ],
      followUps: [
        "Which claim would a skeptical teammate challenge, and what evidence or correction would you offer?",
        "Compress the answer by half without dropping ownership, consequence, or learning.",
      ],
      followUpsZh: [
        "一位持怀疑态度的队友最可能质疑哪项主张？你会提供什么证据或修正？",
        "把回答压缩一半，同时保留责任、后果和学习。",
      ],
      referenceOutline: [
        "Select one truthful public-safe event and inventory facts before writing.",
        "Separate team context from the candidate's own task, decisions, and actions.",
        "Connect result and learning to supportable evidence; label uncertainty and confidentiality.",
        "Record, answer skeptical follow-ups, check consistency, and revise only weak communication.",
      ],
      referenceOutlineZh: [
        "选择一个真实且可公开的事件，在写作前盘点事实。",
        "把团队背景同候选人自己的任务、决策和行动分开。",
        "用可支持证据连接结果与学习；标记不确定性和保密边界。",
        "录音、回答怀疑式追问、检查一致性，只修改薄弱表达。",
      ],
      oracle: {
        kind: "observable",
        procedure: `For ${base.title} — ${variant.title}, perform the assigned action exactly: ${action[0]} Then review the recording against the candidate's public-safe fact and evidence map; score truthfulness, ownership, reflection, and consistency under follow-up.`,
        acceptance: `The ${variant.title} result for ${base.title} satisfies every explicit duration, count, and output constraint in the assigned action; no material claim is unsupported or confidential, ownership remains consistent, and revision improves clarity without changing facts.`,
      },
      oracleZh: {
        kind: "可观察",
        procedure: `针对“${base.titleZh}——${variant.titleZh}”，严格执行指定动作：${action[1]}然后将录音与候选人的可公开事实及证据表交叉核对；按真实性、责任、反思和追问一致性评分。`,
        acceptance: `“${base.titleZh}——${variant.titleZh}”的结果满足指定动作中的所有时长、数量和产出约束；没有重要主张缺乏依据或泄露保密信息，责任保持一致，修改版在不改变事实的前提下提高清晰度。`,
      },
    };
  }
  if (role.id === "rf-project-deep-dive") {
    return {
      prompt: `${lead} ${action[0]} Use only real public-safe project evidence; label uncertainty and protect confidential implementation details.`,
      promptZh: `${leadZh}${action[1]}只能使用真实且可公开的项目证据；标记不确定性并保护保密实现细节。`,
      deliverables: [
        `A completed “${variant.title}” package tied to one real public-safe project`,
        "A cross-check table linking architecture, metric definition, decision evidence, and personal contribution",
        "A recorded explanation, one adversarial follow-up, and an explicit evidence-gap list",
      ],
      deliverablesZh: [
        `一套关联到真实且可公开项目的“${variant.titleZh}”完整材料`,
        "一张交叉核对表，连接架构、指标定义、决策证据和个人贡献",
        "一段录音讲解、一次对抗性追问和明确的证据缺口清单",
      ],
      rubric: [
        "Technical integrity (0-4): architecture, interfaces, invariants, metrics, and trade-offs are internally consistent and defensible.",
        "Evidence (0-2): claims trace to real artifacts or are labeled as estimates, uncertainty, or missing evidence.",
        "Ownership (0-2): personal decisions and implementation are distinct from team work, dependencies, and help received.",
        "Communication (0-2): follows a clear arc, protects confidential detail, and survives adversarial follow-up.",
      ],
      rubricZh: [
        "技术完整性（0–4）：架构、接口、不变量、指标和取舍内部一致且可辩护。",
        "证据（0–2）：主张可追溯到真实工件，或明确标为估算、不确定性或缺失证据。",
        "责任（0–2）：个人决策与实现区别于团队工作、外部依赖和获得的帮助。",
        "沟通（0–2）：主线清楚，保护保密细节，并经得起对抗性追问。",
      ],
      commonFailures: [
        "Recites tools or resume bullets without interfaces, decisions, measurement definitions, or evidence.",
        "Claims team-wide architecture, metrics, or outcomes as solely personal work.",
        "Changes facts under follow-up or exposes proprietary detail to compensate for missing evidence.",
      ],
      commonFailuresZh: [
        "只背诵工具或简历要点，没有接口、决策、测量定义或证据。",
        "把团队整体架构、指标或结果完全声称为个人工作。",
        "在追问中改变事实，或用泄露专有细节弥补证据不足。",
      ],
      followUps: [
        "Which artifact and measurement procedure would let a reviewer falsify the strongest claim?",
        "Retell the project using only the component you owned and its two nearest interfaces.",
      ],
      followUpsZh: [
        "哪项工件和测量流程能够让评审者证伪最强主张？",
        "只保留你负责的组件及其最近两个接口，重新讲述项目。",
      ],
      referenceOutline: [
        "Set the project, public-safe scope, user, problem, and ownership boundary.",
        "Trace one flow through architecture, interfaces, state, and failure boundaries.",
        "Reconstruct one decision and metric from artifacts and measurement definitions.",
        "Cross-check contribution, uncertainty, and confidentiality under adversarial follow-up.",
      ],
      referenceOutlineZh: [
        "明确项目、可公开范围、用户、问题和责任边界。",
        "沿一条流程追踪架构、接口、状态和故障边界。",
        "依据工件和测量定义重构一项决策与一个指标。",
        "在对抗性追问中交叉核对贡献、不确定性和保密边界。",
      ],
      oracle: {
        kind: "observable",
        procedure: `For ${base.title} — ${variant.title}, perform the assigned action exactly: ${action[0]} Then cross-check the explanation against public-safe artifacts, metric definitions, timelines, and the contribution map; challenge architecture, causality, and ownership.`,
        acceptance: `The ${variant.title} result for ${base.title} satisfies every explicit duration, count, and artifact constraint in the assigned action; architecture and metrics remain consistent, unsupported claims are revised or labeled, and contribution matches artifacts without confidential disclosure.`,
      },
      oracleZh: {
        kind: "可观察",
        procedure: `针对“${base.titleZh}——${variant.titleZh}”，严格执行指定动作：${action[1]}然后将讲解与可公开工件、指标定义、时间线和贡献地图交叉核对；质疑架构、因果和责任主张。`,
        acceptance: `“${base.titleZh}——${variant.titleZh}”的结果满足指定动作中的所有时长、数量和工件约束；架构与指标保持一致，无依据主张被修正或标记，个人贡献与工件一致且不泄露保密信息。`,
      },
    };
  }
  return {
    prompt: `${lead} ${action[0]} The final response must be in English. It is evaluated for clarity, technical accuracy, shared context, and repair—not accent.`,
    promptZh: `${leadZh}${action[1]}最终回答必须使用英文。评分关注清晰度、技术准确性、共享上下文和修复能力，不评价口音。`,
    deliverables: [
      `An English recording for the “${variant.title}” task`,
      "A transcript annotated for structure, technical claims, uncertainty, clarification, and repair",
      "A targeted second take improving clarity without changing technical meaning",
    ],
    deliverablesZh: [
      `一段完成${variant.titleZh}任务的英文录音`,
      "一份转写文本，标注结构、技术主张、不确定性、澄清和修复",
      "一轮针对性重录，在不改变技术含义的前提下提高清晰度",
    ],
    rubric: [
      "Technical accuracy (0-4): preserves the contract, facts, assumptions, and engineering reasoning.",
      "Shared context (0-2): signposts structure, asks focused clarification, and keeps the interviewer oriented.",
      "Repair (0-2): recognizes uncertainty or misunderstanding, corrects it directly, and resumes without bluffing.",
      "Intelligibility (0-2): key terms and decisions are understandable and concise; accent is not scored.",
    ],
    rubricZh: [
      "技术准确性（0–4）：保持契约、事实、假设和工程推理准确。",
      "共享上下文（0–2）：标记结构，提出聚焦澄清，并让面试官持续跟得上。",
      "修复（0–2）：识别不确定性或误解，直接纠正，并在不虚张声势的情况下继续。",
      "可理解性（0–2）：关键术语和决策清楚且简洁；不评价口音。",
    ],
    commonFailures: [
      "Optimizes accent or memorized fluency while losing technical meaning or factual support.",
      "Goes silent, produces an uninterrupted monologue, or continues after a visible misunderstanding.",
      "Bluffs an unknown detail or changes the technical claim merely to avoid repair.",
    ],
    commonFailuresZh: [
      "追求口音或背诵流利度，却丢失技术含义或事实依据。",
      "长时间沉默、持续独白，或在明显发生误解后仍继续。",
      "对未知细节虚张声势，或只为避免修复而改变技术主张。",
    ],
    followUps: [
      "Restate the answer in half the time while preserving contract, evidence, and recommendation.",
      "Repair one deliberate misunderstanding, then summarize the shared conclusion.",
    ],
    followUpsZh: [
      "用一半时间重述答案，同时保留契约、证据和建议。",
      "修复一个故意制造的误解，再总结双方共识。",
    ],
    referenceOutline: [
      "Clarify the task and state a compact answer structure in English.",
      "Explain the technical point with one example and explicit uncertainty.",
      "Invite clarification and repair misunderstanding without defensiveness or bluffing.",
      "Close with recommendation, risk, and next step; review recording and transcript.",
    ],
    referenceOutlineZh: [
      "用英文澄清任务，并说明紧凑的回答结构。",
      "通过一个案例和明确的不确定性表达解释技术要点。",
      "主动邀请澄清；不带防御且不虚张声势地修复误解。",
      "以建议、风险和下一步收尾；复查录音与转写。",
    ],
    oracle: {
      kind: "observable",
      procedure: `For ${base.title} — ${variant.title}, perform the assigned action exactly in English: ${action[0]} Then review the recording and transcript against the original technical contract and a structure checklist; mark clarity, accuracy, clarification, uncertainty, and repair without scoring accent.`,
      acceptance: `The English ${variant.title} result for ${base.title} satisfies every explicit duration, count, and response constraint in the assigned action; it is technically faithful and intelligible, the decision path is followable, and the second take repairs the target issue without a new factual claim.`,
    },
    oracleZh: {
      kind: "可观察",
      procedure: `针对“${base.titleZh}——${variant.titleZh}”，严格用英文执行指定动作：${action[1]}然后依据原始技术契约和结构清单审查录音与转写；标记清晰度、准确性、澄清、不确定性和修复，不评价口音。`,
      acceptance: `“${base.titleZh}——${variant.titleZh}”的英文结果满足指定动作中的所有时长、数量和回答约束；技术含义准确且可理解，决策路径可以跟随，第二次录音修复目标问题且没有引入新的事实主张。`,
    },
  };
}

function generatedOutline(base, variant, targetSkill, role) {
  return [
    `Restate the ${contractLabel(base.title)} for this exercise and label every assumption.`,
    `Apply ${targetSkill.title || targetSkill.name} within the ${role.name} context; identify the first invariant that could fail.`,
    `Work one nominal path, one boundary or adversarial path, and quantify the relevant resource or measurement.`,
    "Cross-check with an independent oracle, state the acceptance threshold, and name the next evidence that would change the decision.",
  ];
}

function generatedOutlineZh(base, variant, targetSkill, role) {
  return [
    `针对本题重述“${contractLabelZh(base.titleZh)}”，并标记每项假设`,
    `在${role.nameZh}场景中运用${zhTerm(targetSkill.titleZh)}，指出最先可能失效的不变量`,
    "推演一条正常路径和一条边界或对抗路径，并量化相关资源或测量指标",
    "使用独立判定器交叉检查，声明验收阈值，并指出会改变决策的下一项证据",
  ];
}

function scopedFoundationQuestionFields(base, targetSkill, variant) {
  if (!["contract", "worked-example"].includes(variant.id)) return null;
  if (variant.id === "contract") {
    return {
      deliverables: [
        `One page or less for ${base.title}: legal input and output, one invariant, one explicit boundary, and one unresolved ambiguity`,
      ],
      deliverablesZh: [
        `不超过一页的“${base.titleZh}”最小契约：合法输入与输出、一个不变量、一个明确边界和一个未决歧义`,
      ],
      rubric: [
        "Contract (0-4): the legal input, output, and single invariant are precise and mutually consistent.",
        "Boundary (0-2): one concrete in-scope/out-of-scope boundary is explicit.",
        "Ambiguity (0-2): one unresolved choice is stated as a focused question with its correctness consequence.",
        "Scope (0-2): stays within one page and does not drift into implementation or expansion planning.",
      ],
      rubricZh: [
        "契约（0–4）：合法输入、输出和唯一不变量表述精确且相互一致。",
        "边界（0–2）：明确给出一个具体的范围内/范围外边界。",
        "歧义（0–2）：把一个未决选择写成聚焦问题，并说明它对正确性的影响。",
        "范围（0–2）：控制在一页内，不扩展到实现或扩展计划。",
      ],
      commonFailures: [
        "Lists vocabulary without a testable input/output relation or invariant.",
        "Adds architecture and implementation detail before resolving the one ambiguity.",
      ],
      commonFailuresZh: [
        "只罗列术语，没有可检验的输入/输出关系或不变量。",
        "尚未解决唯一歧义，就开始增加架构和实现细节。",
      ],
      followUps: [
        "If the stated boundary moves by one case, which single contract clause must change?",
      ],
      followUpsZh: ["如果已声明边界移动一个案例，哪一条契约必须改变？"],
      referenceOutline: [
        "Write the legal input and output in one compact relation.",
        `Use ${targetSkill.title || targetSkill.name} to state one invariant and one explicit boundary.`,
        "Name one unresolved ambiguity and the result that would differ.",
      ],
      referenceOutlineZh: [
        "用一个紧凑关系写出合法输入与输出",
        `运用${zhTerm(targetSkill.titleZh)}声明一个不变量和一个明确边界`,
        "指出一个未决歧义，以及会因此不同的结果",
      ],
      oracle: {
        kind: "observable",
        procedure:
          "Inspect the one-page contract, apply the stated boundary case by hand, and trace how each possible answer to the single ambiguity changes the expected output.",
        acceptance:
          "Input, output, invariant, and boundary are mutually consistent; the ambiguity has two distinguishable consequences and no implementation plan is required.",
      },
      oracleZh: {
        kind: "可观察",
        procedure:
          "检查这一页契约，手工应用已声明的边界案例，并追踪唯一歧义的每种可能答案如何改变预期输出。",
        acceptance:
          "输入、输出、不变量和边界相互一致；歧义对应两种可区分后果，且无需实现计划。",
      },
    };
  }
  return {
    deliverables: [
      `A step-by-step trace for ${base.title} containing exactly one nominal case and one smallest counterexample with reproduced results`,
    ],
    deliverablesZh: [
      `一份“${base.titleZh}”逐步推演：恰好一个正常案例和一个最小反例，并复现结果`,
    ],
    rubric: [
      "Nominal trace (0-3): every value, state, unit, or transition needed to reproduce the result is shown.",
      "Counterexample (0-3): the failing case is minimal and differs from the nominal case only where necessary.",
      "Reasoning (0-2): identifies the exact step where the expected behavior changes.",
      "Scope (0-2): stops after the two traces and does not add an implementation, architecture, or regression plan.",
    ],
    rubricZh: [
      "正常推演（0–3）：展示复现结果所需的每个数值、状态、单位或迁移。",
      "反例（0–3）：失败案例最小化，且只在必要位置不同于正常案例。",
      "推理（0–2）：指出预期行为发生变化的确切步骤。",
      "范围（0–2）：完成两条推演后即停止，不增加实现、架构或回归计划。",
    ],
    commonFailures: [
      "Skips intermediate values or states, so the claimed result cannot be reproduced.",
      "Uses a large adversarial scenario instead of the smallest counterexample.",
    ],
    commonFailuresZh: [
      "跳过中间数值或状态，导致声称的结果无法复现。",
      "使用庞大的对抗场景，而不是最小反例。",
    ],
    followUps: [
      "Remove one input feature from the counterexample; does it still fail, and why?",
    ],
    followUpsZh: ["从反例中删除一个输入特征；它是否仍然失败？为什么？"],
    referenceOutline: [
      "Choose explicit values or states for one nominal case.",
      "Record every step and reproduce the expected result.",
      `Change the minimum necessary condition, apply ${targetSkill.title || targetSkill.name}, and trace one smallest counterexample.`,
    ],
    referenceOutlineZh: [
      "为一个正常案例选择明确数值或状态",
      "记录每一步并复现预期结果",
      `只改变最少的必要条件，运用${zhTerm(targetSkill.titleZh)}推演一个最小反例`,
    ],
    oracle: {
      kind: "observable",
      procedure:
        "Independently recompute the two traces step by step, then try removing each changed condition from the counterexample.",
      acceptance:
        "Both results reproduce exactly, all intermediate steps are present, and removing any necessary changed condition eliminates the failure.",
    },
    oracleZh: {
      kind: "可观察",
      procedure: "独立逐步重算两条推演，再依次尝试删除反例中的每个变化条件。",
      acceptance:
        "两个结果均可精确复现，中间步骤完整，且删除任一必要变化条件都会使失败消失。",
    },
  };
}

function calibratedVariantMetadata(
  base,
  targetSkill,
  variant,
  prerequisiteSkills,
) {
  const baseHasAdvancedSkill = base.skills.some(
    (skillId) => skillById.get(skillId)?.level === "advanced",
  );
  let metadata;
  if (!["contract", "worked-example"].includes(variant.id)) {
    if (
      ["entry", "foundation"].includes(variant.level) &&
      (targetSkill.level === "advanced" || baseHasAdvancedSkill)
    ) {
      metadata = {
        level: "intermediate",
        difficulty:
          variant.difficulty === "easy" ? "medium" : variant.difficulty,
        minutes: Math.max(variant.minutes, 20),
      };
    } else {
      metadata = {
        level: variant.level,
        difficulty: variant.difficulty,
        minutes: variant.minutes,
      };
    }
  } else {
    const needsIntermediateScope =
      targetSkill.level === "advanced" ||
      baseHasAdvancedSkill ||
      !["entry", "foundation"].includes(base.level) ||
      base.difficulty === "hard";
    metadata = needsIntermediateScope
      ? {
          level: "intermediate",
          difficulty: "medium",
          minutes: variant.id === "contract" ? 20 : 25,
        }
      : {
          level: "foundation",
          difficulty: "easy",
          minutes: variant.id === "contract" ? 15 : 20,
        };
  }
  const calibrated = calibrateToPrerequisiteFloor(
    metadata,
    prerequisiteSkills,
  );
  if (
    ["contract", "worked-example"].includes(variant.id) &&
    ["intermediate", "advanced"].includes(calibrated.level)
  ) {
    calibrated.minutes = Math.max(
      calibrated.minutes,
      variant.id === "contract" ? 20 : 25,
    );
  }
  return calibrated;
}

function integrationQuestionFields(role, base, targetSkill, variant) {
  if (variant.id !== "integration") return null;
  const domain = integrationDomain(role);
  const profiles = {
    "software-service": {
      deliverables: [
        `A versioned integration contract for ${base.title} covering upstream and downstream interfaces, ownership, compatibility, and failure isolation`,
        `A staged release plan applying ${targetSkill.title || targetSkill.name}, with pre-release checks, release telemetry, thresholds, and a limited first cohort`,
        "A tested rollback and recovery record, residual-risk register, and reviewer-ready decision summary",
      ],
      deliverablesZh: [
        `一份针对“${base.titleZh}”的版本化集成契约，覆盖上下游接口、责任归属、兼容性和故障隔离`,
        `一份运用${zhTerm(targetSkill.titleZh)}的分阶段发布计划，包含发布前检查、发布遥测、阈值和受限首批范围`,
        "一份经过测试的回滚与恢复记录、残余风险清单，以及可供评审的决策摘要",
      ],
      rubric: [
        "Interface correctness (0-4): versioning, ownership, compatibility, and externally visible behavior remain explicit and internally consistent.",
        "Release evidence (0-2): pre-release checks, limited exposure, telemetry thresholds, and independent comparison can detect regression.",
        "Recovery safety (0-2): rollback, state reconciliation, and failure isolation are exercised rather than merely asserted.",
        "Communication (0-2): explains the conditional release decision, residual risk, and stop criteria directly.",
      ],
      rubricZh: [
        "接口正确性（0–4）：版本、责任、兼容性和外部可见行为均明确且内部一致。",
        "发布证据（0–2）：发布前检查、受限范围、遥测阈值和独立比较能够发现回归。",
        "恢复安全（0–2）：回滚、状态对账和故障隔离已经演练，而非只作口头声明。",
        "沟通（0–2）：直接说明带条件的发布决策、残余风险和停止标准。",
      ],
      oracle: {
        kind: "observable",
        procedure:
          "Run contract and compatibility checks, compare a limited release cohort with an independent baseline through declared telemetry, inject one failure, and exercise rollback plus state reconciliation.",
        acceptance:
          "External behavior stays compatible, every stop threshold is observable, injected failure remains isolated, and rollback restores the declared safe state without losing accountable work.",
      },
      oracleZh: {
        kind: "可观察",
        procedure:
          "运行契约与兼容性检查，通过已声明遥测把受限发布范围同独立基线比较；注入一次故障，并演练回滚与状态对账。",
        acceptance:
          "外部行为保持兼容，每个停止阈值均可观测，注入故障受到隔离，且回滚在不丢失可追责工作的情况下恢复到已声明安全状态。",
      },
    },
    "digital-hardware": {
      deliverables: [
        `A hardware integration specification for ${base.title} covering source and sink transaction or cycle semantics, clock, reset, power, timing, and ownership boundaries`,
        `A verification and signoff matrix applying ${targetSkill.title || targetSkill.name} across nominal, boundary, protocol, and implementation-sensitive cases`,
        "An incremental integration record with observability evidence and a tested bypass, feature-disable, or ECO fallback",
      ],
      deliverablesZh: [
        `一份针对“${base.titleZh}”的硬件集成规格，覆盖源端与接收端的事务或周期语义、时钟、复位、电源、时序和责任边界`,
        `一份运用${zhTerm(targetSkill.titleZh)}的验证与签核矩阵，覆盖正常、边界、协议和实现敏感案例`,
        "一份增量集成记录，包含可观测证据，以及经过测试的旁路、功能禁用或 ECO 后备方案",
      ],
      rubric: [
        "Interface correctness (0-4): architectural, cycle, or transaction behavior and clock/reset/power/timing assumptions are complete and consistent at both boundaries.",
        "Verification and signoff (0-2): uses domain-appropriate simulation, formal, emulation, lab, timing, physical, or test evidence with an independent reference.",
        "Integration safety (0-2): incremental checkpoints expose the first violated invariant and a bypass, feature disable, or ECO fallback is testable.",
        "Communication (0-2): distinguishes required behavior from implementation choice and states residual signoff risk precisely.",
      ],
      rubricZh: [
        "接口正确性（0–4）：两侧边界的架构、周期或事务行为，以及时钟、复位、电源和时序假设完整且一致。",
        "验证与签核（0–2）：使用适合领域的仿真、形式验证、仿真加速、实验室、时序、物理或测试证据，并具有独立参考。",
        "集成安全（0–2）：增量检查点能够暴露首个失效不变量，且旁路、功能禁用或 ECO 后备方案可测试。",
        "沟通（0–2）：区分必需行为与实现选择，并精确说明残余签核风险。",
      ],
      oracle: {
        kind: "observable",
        procedure:
          "Apply a domain-appropriate simulation, formal, emulation, lab, timing, physical, or test procedure across the source, changed block, and sink; compare with a separately derived reference and exercise the declared fallback.",
        acceptance:
          "Interface, clock/reset/power, timing, and architectural invariants hold at every incremental checkpoint; signoff evidence meets its threshold and the fallback prevents unsafe propagation.",
      },
      oracleZh: {
        kind: "可观察",
        procedure:
          "针对源端、变更模块和接收端，应用适合领域的仿真、形式验证、仿真加速、实验室、时序、物理或测试流程；同单独推导的参考比较，并演练已声明的后备方案。",
        acceptance:
          "每个增量检查点的接口、时钟/复位/电源、时序和架构不变量均成立；签核证据达到阈值，且后备方案能够阻止不安全影响传播。",
      },
    },
    "analog-custom": {
      deliverables: [
        `An integration specification for ${base.title} covering source, load, bias, control, test environment, ranges, impedance, and ownership boundaries`,
        `A PVT and mixed-signal validation matrix applying ${targetSkill.title || targetSkill.name}, with nominal, corner, startup, loading, and disturbance cases`,
        "A measurement-hook plan, independent reference result, and tested reversible ECO or test-configuration fallback",
      ],
      deliverablesZh: [
        `一份针对“${base.titleZh}”的集成规格，覆盖信号源、负载、偏置、控制、测试环境、范围、阻抗和责任边界`,
        `一份运用${zhTerm(targetSkill.titleZh)}的 PVT 与混合信号验证矩阵，包含正常、工艺角、启动、负载和扰动案例`,
        "一份测量钩子计划、独立参考结果，以及经过测试的可逆 ECO 或测试配置后备方案",
      ],
      rubric: [
        "Electrical contract (0-4): source/load ranges, impedance, bias, control sequencing, startup, and externally visible behavior are quantitatively consistent.",
        "PVT and mixed-signal evidence (0-2): corner, loading, disturbance, and boundary cases use an independent simulation or measurement reference.",
        "Integration safety (0-2): measurement hooks isolate the first violated assumption and the ECO or test configuration is reversible and testable.",
        "Communication (0-2): separates schematic intent, environment assumptions, extracted behavior, and residual measurement uncertainty.",
      ],
      rubricZh: [
        "电气契约（0–4）：信号源/负载范围、阻抗、偏置、控制时序、启动和外部可见行为在量化上保持一致。",
        "PVT 与混合信号证据（0–2）：工艺角、负载、扰动和边界案例采用独立仿真或测量参考。",
        "集成安全（0–2）：测量钩子能够隔离首个失效假设，且 ECO 或测试配置可逆并可测试。",
        "沟通（0–2）：区分原理图意图、环境假设、提取后行为和残余测量不确定性。",
      ],
      oracle: {
        kind: "observable",
        procedure:
          "Sweep declared source, load, bias, control, PVT, startup, and mixed-signal boundary conditions with an independent simulation or measurement reference; use the planned hooks and exercise the reversible ECO or test configuration.",
        acceptance:
          "Every electrical invariant remains within its stated tolerance, the measurement hooks distinguish circuit behavior from environment artifact, and the reversible configuration returns to the documented baseline.",
      },
      oracleZh: {
        kind: "可观察",
        procedure:
          "使用独立仿真或测量参考，扫描已声明的信号源、负载、偏置、控制、PVT、启动和混合信号边界条件；使用规划的测量钩子，并演练可逆 ECO 或测试配置。",
        acceptance:
          "每项电气不变量均保持在声明容差内，测量钩子能够区分电路行为与环境伪象，且可逆配置能够返回有记录的基线。",
      },
    },
    "embedded-hardware": {
      deliverables: [
        `An embedded hardware/software integration contract for ${base.title} covering MMIO ownership and ordering, interrupt or DMA behavior, clock/reset/power boundaries, buffers, cache, and external protocol timing`,
        `A board and model validation matrix applying ${targetSkill.title || targetSkill.name} across nominal traffic, asynchronous sampling or CDC, reset release, low-power entry and exit, overflow, timeout, and corrupted-input cases`,
        "An observability and recovery record with register or bus traces, independent reference evidence, bounded retries, and a tested board-safe fallback",
      ],
      deliverablesZh: [
        `一份针对“${base.titleZh}”的嵌入式软硬件集成契约，覆盖 MMIO 所有权与访问顺序、中断或 DMA 行为、时钟/复位/电源边界、缓冲、缓存和外部协议时序`,
        `一份运用${zhTerm(targetSkill.titleZh)}的板级与模型验证矩阵，覆盖正常流量、异步采样或 CDC、复位释放、低功耗进入与退出、溢出、超时和损坏输入`,
        "一份可观测与恢复记录，包含寄存器或总线追踪、独立参考证据、有界重试，以及经过测试的板级安全后备方案",
      ],
      rubric: [
        "Boundary correctness (0-4): MMIO, interrupt or DMA, clock/reset/power, buffer, cache, and protocol contracts are explicit and mutually consistent.",
        "Hardware evidence (0-2): model, emulator, logic-analyzer, trace, or board evidence covers asynchronous sampling or CDC and the declared failure boundaries.",
        "Recovery safety (0-2): retries and timeouts are bounded, reset and low-power recovery converge, and the board-safe fallback is exercised.",
        "Communication (0-2): separates software-visible behavior, hardware assumptions, measured evidence, and residual board risk.",
      ],
      rubricZh: [
        "边界正确性（0–4）：MMIO、中断或 DMA、时钟/复位/电源、缓冲、缓存和协议契约明确且相互一致。",
        "硬件证据（0–2）：模型、仿真器、逻辑分析仪、追踪或板级证据覆盖异步采样或 CDC 以及已声明故障边界。",
        "恢复安全（0–2）：重试与超时有界，复位与低功耗恢复能够收敛，且板级安全后备方案已经演练。",
        "沟通（0–2）：区分软件可见行为、硬件假设、实测证据和残余板级风险。",
      ],
      oracle: {
        kind: "observable",
        procedure:
          "Run the same fixture against an independent peripheral or bus model and the target board or emulator; inject one asynchronous sampling or CDC fault, one reset or low-power transition, and one timeout, then exercise the board-safe fallback.",
        acceptance:
          "Software-visible and external protocol behavior agree with the independent model, no MMIO or buffer operation violates ownership or ordering, reset and CDC obligations converge, every wait is bounded, and fallback leaves hardware in the declared safe state.",
      },
      oracleZh: {
        kind: "可观察",
        procedure:
          "在独立外设或总线模型以及目标板卡或仿真器上运行同一样例；注入一次异步采样或 CDC 故障、一次复位或低功耗迁移和一次超时，再演练板级安全后备方案。",
        acceptance:
          "软件可见行为和外部协议行为与独立模型一致，MMIO 或缓冲操作不违反所有权与顺序，复位和 CDC 义务能够收敛，所有等待均有界，且后备方案使硬件停留在已声明安全状态。",
      },
    },
    "manufacturing-safety": {
      deliverables: [
        `A safety-aware equipment integration contract for ${base.title} covering PLC or GEM state, sensor and actuator ownership, deterministic handshakes, stale data, timeout, recipe and carrier identity, and operator or MES authority`,
        `A hazard and validation matrix applying ${targetSkill.title || targetSkill.name} across nominal flow, interlock trip, sensor disagreement, communication loss, restart, stale command, and wrong-identity cases, including the independent protection layer`,
        "A controlled recovery record proving the fail-safe de-energized state, evidence retention, reconciliation, authorization, and a rollback path that cannot bypass the interlock",
      ],
      deliverablesZh: [
        `一份针对“${base.titleZh}”且考虑安全的设备集成契约，覆盖 PLC 或 GEM 状态、传感器与执行器所有权、确定性握手、陈旧数据、超时、配方与载具身份，以及操作员或 MES 权限`,
        `一份运用${zhTerm(targetSkill.titleZh)}的危害与验证矩阵，覆盖正常流程、联锁触发、传感器分歧、通信中断、重启、陈旧命令和身份错误，并包含独立保护层`,
        "一份受控恢复记录，证明失效安全的去激励状态、证据保留、对账、授权，以及不能绕过联锁的回退路径",
      ],
      rubric: [
        "Control contract (0-4): equipment, PLC or GEM, sensor, actuator, identity, recipe, timeout, and authority semantics are deterministic and internally consistent.",
        "Independent safety (0-2): the interlock and independent protection layer reach a fail-safe de-energized state despite stale data, communication loss, or an unsafe software command.",
        "Recovery evidence (0-2): restart, reconciliation, authorization, evidence retention, and rollback are exercised without bypassing protection.",
        "Communication (0-2): distinguishes production optimization from safety authority and states residual hazard and stop criteria directly.",
      ],
      rubricZh: [
        "控制契约（0–4）：设备、PLC 或 GEM、传感器、执行器、身份、配方、超时和权限语义确定且内部一致。",
        "独立安全（0–2）：即使出现陈旧数据、通信中断或不安全软件命令，联锁和独立保护层仍能进入失效安全的去激励状态。",
        "恢复证据（0–2）：在不绕过保护的前提下演练重启、对账、授权、证据保留和回退。",
        "沟通（0–2）：区分生产优化与安全权限，并直接说明残余危害和停止标准。",
      ],
      oracle: {
        kind: "observable",
        procedure:
          "Run a state-table or digital-twin reference alongside the equipment-control path; inject stale sensor data, communication loss, an unsafe command, and restart, then trip the independent protection layer and perform authorized controlled recovery.",
        acceptance:
          "Every state and handshake matches the independent reference, unsafe or stale commands cannot energize motion, the interlock reaches the fail-safe de-energized state independently, evidence survives the trip, and recovery or rollback cannot bypass the protection layer.",
      },
      oracleZh: {
        kind: "可观察",
        procedure:
          "在设备控制路径旁运行状态表或数字孪生参考；注入陈旧传感器数据、通信中断、不安全命令和重启，再触发独立保护层并执行经授权的受控恢复。",
        acceptance:
          "每个状态与握手均匹配独立参考，不安全或陈旧命令不能使运动机构得电，联锁能够独立进入失效安全的去激励状态，触发期间证据得以保留，且恢复或回退无法绕过保护层。",
      },
    },
  };
  return profiles[domain];
}

function technicalArchetypeOracleFields(base, targetSkill, variant) {
  const fields = {
    "minimal-implementation": {
      oracle: {
        kind: "executable",
        procedure: `Run the declared minimal method for ${base.title} on one candidate-declared valid fixture and one candidate-constructed minimally invalid input, observation, or constraint that violates exactly one declared invariant; record the output, rejection path, and relevant resource cost while applying ${targetSkill.title || targetSkill.name}.`,
        acceptance:
          "The valid fixture produces the declared result, the minimally invalid fixture names exactly one violated invariant and is rejected explicitly without corrupting valid state, and the measured cost agrees with the stated complexity or resource bound.",
      },
      oracleZh: {
        kind: "可执行",
        procedure: `在一个由作答者声明的合法样例，以及一个由作答者构造且恰好违反一项已声明不变量的最小无效输入、观测或约束上运行“${base.titleZh}”的最小方法；运用${zhTerm(targetSkill.titleZh)}记录输出、拒绝路径和相关资源成本。`,
        acceptance:
          "合法样例产生声明结果，最小无效样例明确指出恰好一项被违反的不变量并被显式拒绝，且不破坏有效状态；实测成本与声明的复杂度或资源上限一致。",
      },
    },
    "fault-injection": {
      oracle: {
        kind: "observable",
        procedure: `Inject one controlled defect into the ${base.title} setup, collect the ranked hypotheses and first discriminating measurement, minimize the reproducer, then remove the defect and repeat the same observation.`,
        acceptance:
          "The selected measurement separates the leading hypotheses, identifies the first violated invariant before downstream symptoms, and returns to the reference value after the defect is removed.",
      },
      oracleZh: {
        kind: "可观察",
        procedure: `向“${base.titleZh}”环境注入一个受控缺陷，记录排序后的假设和第一项区分性测量，最小化复现；移除缺陷后重复同一观测。`,
        acceptance:
          "所选测量能够区分主要假设，在下游症状之前定位首个被破坏的不变量，并在移除缺陷后恢复参考值。",
      },
    },
    oracle: {
      oracle: {
        kind: "observable",
        procedure: `Derive a second reference for ${base.title} without reusing the primary method's internal result, then run nominal, boundary, negative, and differential or metamorphic checks and deliberately perturb one shared assumption.`,
        acceptance:
          "The second reference is operationally independent, every declared check has a predicted observation, and perturbing the shared assumption either exposes disagreement or demonstrates why independence is preserved.",
      },
      oracleZh: {
        kind: "可观察",
        procedure: `在不复用主要方法内部结果的情况下，为“${base.titleZh}”推导第二条参考路径；运行正常、边界、负面以及差分或变形检查，并有意扰动一个可能共享的假设。`,
        acceptance:
          "第二条参考路径在操作上独立，每项检查都有预期观测；扰动共享假设后，要么暴露分歧，要么能够证明独立性仍然成立。",
      },
    },
    scale: {
      oracle: {
        kind: "observable",
        procedure: `Measure the ${base.title} method at the stated operating point and at a three-orders-of-magnitude larger problem size, operating envelope, or throughput; identify the first ceiling, apply ${targetSkill.title || targetSkill.name}, and repeat the correctness observation.`,
        acceptance:
          "The first resource, timing, or accuracy ceiling is quantified from measurements, the adapted method meets the revised bound, and the original correctness signal remains within its declared tolerance.",
      },
      oracleZh: {
        kind: "可观察",
        procedure: `分别在题目声明工作点，以及规模、运行包络或吞吐扩大三个数量级时测量“${base.titleZh}”方法；定位首个上限，运用${zhTerm(targetSkill.titleZh)}调整后重复正确性观测。`,
        acceptance:
          "首个资源、时序或准确度上限由测量量化，调整后的方法满足新边界，且原始正确性信号仍在声明容差内。",
      },
    },
    tradeoff: {
      oracle: {
        kind: "observable",
        procedure: `Evaluate both proposed ${base.title} alternatives against the same correctness, performance, implementation-cost, observability, recovery-safety, and reversibility criteria at two operating points, including the condition expected to reverse the choice.`,
        acceptance:
          "Both alternatives use the same evidence and units, the recommendation follows the declared criteria, the reversal condition changes the preferred option as predicted, and residual risk remains explicit.",
      },
      oracleZh: {
        kind: "可观察",
        procedure: `在两个工作点上，依据相同的正确性、性能、实现成本、可观测性、恢复安全和可逆性标准评估“${base.titleZh}”的两个方案，其中包括预计会逆转选择的条件。`,
        acceptance:
          "两个方案采用相同证据与单位，推荐由声明标准推出；逆转条件按预测改变首选方案，且残余风险保持明确。",
      },
    },
    incident: {
      oracle: {
        kind: "observable",
        procedure: `Recreate the disagreeing ${base.title} evidence with its original observation windows, conditions, and timebases, normalize one factor at a time, then exercise the proposed containment and root-cause check.`,
        acceptance:
          "The normalized comparison explains the disagreement without discarding evidence, the root-cause check predicts a distinct observation, and containment prevents recurrence while preserving diagnostic evidence.",
      },
      oracleZh: {
        kind: "可观察",
        procedure: `使用原始观测窗口、条件和时间基准复现“${base.titleZh}”中相互冲突的证据，每次只统一一个因素，再演练拟定的止损和根因检查。`,
        acceptance:
          "统一口径后的比较能够解释冲突而不丢弃证据，根因检查预测出可区分观测，且止损措施在保留诊断证据的同时防止再次发生。",
      },
    },
  };
  const result = fields[variant.id];
  if (!result) {
    throw new Error(
      `No technical archetype oracle for ${base.id}/${variant.id}`,
    );
  }
  return result;
}

function composeTechnicalOracle(base, exerciseOracleFields, variant) {
  const executable =
    /executable/i.test(base.oracle.kind) ||
    /executable/i.test(exerciseOracleFields.oracle.kind);
  const executableZh =
    /可执行/.test(base.oracleZh.kind) ||
    /可执行/.test(exerciseOracleFields.oracleZh.kind);
  if (variant.id === "contract") {
    return {
      oracle: {
        kind: /executable/i.test(exerciseOracleFields.oracle.kind)
          ? "executable"
          : "observable",
        procedure: `Compare the one-page contract for ${base.title} with the quoted source scenario. Use the frozen task-specific reference only as an independent reviewer check—not as a candidate deliverable. Reviewer procedure: ${base.oracle.procedure} Then run this exercise's additional check: ${exerciseOracleFields.oracle.procedure}`,
        acceptance: `The contract makes this original task criterion decidable without requiring the candidate to produce the original solution artifact: ${base.oracle.acceptance} The additional exercise criterion is: ${exerciseOracleFields.oracle.acceptance}`,
      },
      oracleZh: {
        kind: /可执行/.test(exerciseOracleFields.oracleZh.kind)
          ? "可执行"
          : "可观察",
        procedure: `把“${base.titleZh}”的一页契约与题目中引用的原始场景逐项比较。冻结的本题专属参考只作为独立评审检查，不作为作答者交付物。评审步骤：${base.oracleZh.procedure}再执行本次练习的附加检查：${exerciseOracleFields.oracleZh.procedure}`,
        acceptance: `契约必须使以下原题标准可判定，但不要求作答者产出原题解法工件：${base.oracleZh.acceptance}本次练习还必须满足：${exerciseOracleFields.oracleZh.acceptance}`,
      },
    };
  }
  return {
    oracle: {
      kind: executable ? "executable" : "observable",
      procedure: `First reproduce the task-specific reference for ${base.title}: ${base.oracle.procedure} Then run this exercise's additional check: ${exerciseOracleFields.oracle.procedure}`,
      acceptance: `The original task must still satisfy this criterion: ${base.oracle.acceptance} The additional exercise criterion is: ${exerciseOracleFields.oracle.acceptance}`,
    },
    oracleZh: {
      kind: executableZh ? "可执行" : "可观察",
      procedure: `先复现“${base.titleZh}”的本题专属参考：${base.oracleZh.procedure}再执行本次练习的附加检查：${exerciseOracleFields.oracleZh.procedure}`,
      acceptance: `原题必须继续满足这一标准：${base.oracleZh.acceptance}本次练习还必须满足：${exerciseOracleFields.oracleZh.acceptance}`,
    },
  };
}

function generateQuestion(
  base,
  role,
  targetSkill,
  variant,
  baseIndex,
  variantIndex,
  skillFocusOverride,
) {
  const roleSlug = role.id.replace(/^rf-/, "");
  const sequence = String(baseIndex * 9 + variantIndex + 1).padStart(3, "0");
  const title = `${base.title} — ${variant.title}`;
  const titleZh = `${base.titleZh}——${variant.titleZh}`;
  const skillsForQuestion = unique([targetSkill.id, ...base.skills]).slice(
    0,
    3,
  );
  const skillNames = unique(
    skillsForQuestion.map(
      (id) => skillById.get(id)?.title || skillById.get(id)?.name,
    ),
  ).join(", ");
  const skillNamesZh = unique(
    skillsForQuestion.map((id) => skillById.get(id)?.titleZh),
  ).join("、");
  const isSoftRole = [
    "rf-behavioral",
    "rf-project-deep-dive",
    "rf-english-communication",
  ].includes(role.id);
  const softFields = isSoftRole
    ? softQuestionFields(role, base, variant)
    : null;
  const integrationFields = isSoftRole
    ? null
    : integrationQuestionFields(role, base, targetSkill, variant);
  const scopedFields = isSoftRole
    ? null
    : scopedFoundationQuestionFields(base, targetSkill, variant);
  const prerequisiteSkills = unique(targetSkill.prerequisites || []).slice(
    0,
    2,
  );
  const calibratedMetadata = calibratedVariantMetadata(
    base,
    targetSkill,
    variant,
    prerequisiteSkills,
  );
  const exerciseOracleFields = isSoftRole
    ? null
    : integrationFields ||
      scopedFields ||
      technicalArchetypeOracleFields(base, targetSkill, variant);
  const technicalOracleFields = isSoftRole
    ? null
    : composeTechnicalOracle(base, exerciseOracleFields, variant);
  const basePrompt =
    softFields?.prompt || standalonePrompt(base, variant, targetSkill, role);
  const basePromptZh =
    softFields?.promptZh ||
    standalonePromptZh(base, variant, targetSkill, role);
  const prompt = isSoftRole
    ? appendOnce(basePrompt, skillFocusOverride?.focusEn, " ")
    : insertBeforeEndingOnce(
        basePrompt,
        skillFocusOverride?.focusEn,
        "Use public concepts only; state assumptions and finish with a falsifiable acceptance criterion.",
        " ",
      );
  const promptZh = isSoftRole
    ? appendOnce(basePromptZh, skillFocusOverride?.focusZh, "")
    : insertBeforeEndingOnce(
        basePromptZh,
        skillFocusOverride?.focusZh,
        "只使用公开概念，明确所有假设，并以可证伪的验收条件收尾。",
        "",
      );
  const referenceOutline =
    softFields?.referenceOutline ||
    scopedFields?.referenceOutline ||
    generatedOutline(base, variant, targetSkill, role);
  const referenceOutlineZh =
    softFields?.referenceOutlineZh ||
    scopedFields?.referenceOutlineZh ||
    generatedOutlineZh(base, variant, targetSkill, role);
  return {
    id: `q2-${roleSlug}-${sequence}`,
    title,
    titleZh,
    roleFamilies: [role.id],
    skills: skillsForQuestion,
    prerequisiteSkills,
    level: calibratedMetadata.level,
    difficulty: calibratedMetadata.difficulty,
    type: variant.type,
    prompt,
    promptZh,
    deliverables: softFields?.deliverables ||
      integrationFields?.deliverables ||
      scopedFields?.deliverables || [
        `${withIndefiniteArticle(variant.title.toLowerCase())} artifact for ${base.title} with an explicit contract, assumptions, and decision path`,
        `A concrete application of ${skillNames}, including a nominal case, a boundary or adversarial case, and quantified cost`,
        "An independent validation result, residual-risk register, and the next highest-information check",
      ],
    deliverablesZh: softFields?.deliverablesZh ||
      integrationFields?.deliverablesZh ||
      scopedFields?.deliverablesZh || [
        `一份针对“${base.titleZh}”的${variant.titleZh}产出，明确契约、假设与决策路径`,
        `对${zhTerm(skillNamesZh)}的具体应用，包含正常案例、边界或对抗案例，以及量化成本`,
        "一项独立验证结果、残余风险清单和下一项信息增益最高的检查",
      ],
    rubric: softFields?.rubric ||
      integrationFields?.rubric ||
      scopedFields?.rubric || [
        `Technical correctness (0-4): applies ${targetSkill.title || targetSkill.name} to the ${contractLabel(base.title)} without violating stated invariants or boundaries.`,
        `Reasoning (0-2): separates facts, assumptions, and inference; compares credible alternatives and explains the effect of “${variant.twist}”`,
        "Validation (0-2): uses an independent oracle, negative or boundary evidence, and a falsifiable acceptance threshold.",
        "Communication and scope (0-2): answers the assigned task directly, uses precise terms, quantifies uncertainty, and stays within budget.",
      ],
    rubricZh: softFields?.rubricZh ||
      integrationFields?.rubricZh ||
      scopedFields?.rubricZh || [
        `技术正确性（0–4）：把${zhTerm(targetSkill.titleZh)}正确应用于“${contractLabelZh(base.titleZh)}”，不破坏已声明的不变量与边界`,
        `推理质量（0–2）：区分事实、假设和推断，比较可信替代方案，并解释“${variant.twistZh}”的影响`,
        "验证质量（0–2）：使用独立判定器、负面或边界证据，以及可证伪的验收阈值",
        "沟通与范围（0–2）：直接回答本题要求，术语精确，量化不确定性，并遵守时间预算",
      ],
    commonFailures: softFields?.commonFailures ||
      scopedFields?.commonFailures || [
        `Repeats vocabulary from ${base.title} without defining the changed contract or the invariant under test.`,
        `Uses ${targetSkill.title || targetSkill.name} as a slogan instead of working a concrete case and quantifying the consequence.`,
        "Claims success from the implementation's own output without an independent oracle or a falsifiable threshold.",
      ],
    commonFailuresZh: softFields?.commonFailuresZh ||
      scopedFields?.commonFailuresZh || [
        `复述“${base.titleZh}”术语，却没有定义变化后的契约或正在检验的不变量`,
        `把${zhTerm(targetSkill.titleZh)}当作口号，没有推演具体案例或量化后果`,
        "只依据实现自身输出就宣称成功，缺少独立判定器或可证伪阈值",
      ],
    followUps: softFields?.followUps ||
      scopedFields?.followUps || [
        `Which assumption in the ${base.title} answer is most fragile, and what single observation would make you reverse the decision?`,
        `Reduce the time, memory, hardware, or evidence budget by half while preserving the most important ${targetSkill.title || targetSkill.name} correctness signal.`,
      ],
    followUpsZh: softFields?.followUpsZh ||
      scopedFields?.followUpsZh || [
        `“${base.titleZh}”答案中哪项假设最脆弱？哪一个观测会使你逆转决策？`,
        `把时间、内存、硬件或证据预算减半，同时保留${zhTerm(targetSkill.titleZh)}最重要的正确性信号`,
      ],
    sourcePolicy: "original-isomorphic-public-concepts-only",
    sourceRefs: base.sourceRefs,
    estimatedMinutes: calibratedMetadata.minutes,
    evidenceDate: "2026-07-23",
    status: "review-ready",
    referenceOutline,
    referenceOutlineZh,
    oracle: softFields?.oracle || technicalOracleFields.oracle,
    oracleZh: softFields?.oracleZh || technicalOracleFields.oracleZh,
    blueprintId: `scenario-transform-v2/${variant.id}`,
    generationSpec: {
      origin: "blueprint-v2",
      baseQuestionId: base.id,
      archetype: variant.id,
      contextIndex: baseIndex,
      skillIndex: skills.findIndex((skill) => skill.id === targetSkill.id),
      seed: `${role.id}:${base.id}:${variant.id}:${targetSkill.id}`,
    },
    contentVersion: "2026-07-23.5",
  };
}

const anchorSkillAdditions = {
  "q-ai-eda-foundation-rare-violation": ["sk-ml-supervised-basics"],
};
const curatedInput = questionFile.questions
  .filter((question) => question.generationSpec?.origin !== "blueprint-v2")
  .map((question) => ({
    ...question,
    skills: unique([
      ...(question.skills || []),
      ...(anchorSkillAdditions[question.id] || []),
    ]),
  }));
const curatedOracleIds = curatedInput.map((question) => question.id).sort();
const taskSpecificOracleIds = Object.keys(oracleSpecCatalog).sort();
if (
  curatedOracleIds.length !== taskSpecificOracleIds.length ||
  curatedOracleIds.some(
    (questionId, index) => questionId !== taskSpecificOracleIds[index],
  )
) {
  const expected = new Set(curatedOracleIds);
  const supplied = new Set(taskSpecificOracleIds);
  throw new Error(
    [
      "Task-specific oracle catalog does not match the 210 curated anchors.",
      `Missing: ${curatedOracleIds.filter((id) => !supplied.has(id)).join(", ") || "none"}.`,
      `Extra: ${taskSpecificOracleIds.filter((id) => !expected.has(id)).join(", ") || "none"}.`,
    ].join(" "),
  );
}
for (const [questionId, legacyOracleZh] of Object.entries(
  oracleTranslationCatalog,
)) {
  const replacement = oracleSpecCatalog[questionId]?.oracleZh;
  if (!replacement) {
    throw new Error(
      `Legacy exact oracle translation ${questionId} has no full-catalog replacement`,
    );
  }
  if (JSON.stringify(replacement) !== JSON.stringify(legacyOracleZh)) {
    throw new Error(
      `Full oracle spec ${questionId} diverges from the frozen exact Chinese oracle`,
    );
  }
  const preservedTokens = [
    ...new Set(
      `${legacyOracleZh.procedure} ${legacyOracleZh.acceptance}`.match(
        /[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?|\b(?:ps|ns|us|ms|mV|mA|mS|MHz|GHz|KiB|MiB|GiB)\b/gi,
      ) || [],
    ),
  ];
  const replacementText = `${replacement.procedure} ${replacement.acceptance}`;
  for (const token of preservedTokens) {
    if (!replacementText.includes(token)) {
      throw new Error(
        `Full oracle spec ${questionId} drops legacy numeric or unit token ${token}`,
      );
    }
  }
}
const curated = curatedInput.map(enrichCurated);
const generated = [];
const usedSkillFocusKeys = new Set();

for (const role of roles) {
  const bases = curated.filter(
    (question) =>
      question.roleFamilies[0] === role.id ||
      (question.roleFamilies.includes(role.id) &&
        !curated.some(
          (candidate) =>
            candidate.roleFamilies[0] === role.id &&
            candidate.id === question.id,
        )),
  );
  if (bases.length !== 14) {
    throw new Error(
      `Expected exactly 14 curated anchors for ${role.id}; found ${bases.length}`,
    );
  }
  const roleVariants =
    role.id === "rf-behavioral"
      ? behavioralVariants
      : role.id === "rf-project-deep-dive"
        ? projectVariants
        : role.id === "rf-english-communication"
          ? englishVariants
          : variants;
  if (roleVariants.length !== 9) {
    throw new Error(`Expected nine drill variants for ${role.id}`);
  }
  bases.forEach((base, baseIndex) => {
    const baseSkills = base.skills.map((skillId) => skillById.get(skillId));
    if (baseSkills.length === 0 || baseSkills.some((skill) => !skill)) {
      throw new Error(`Anchor ${base.id} has no valid target skills`);
    }
    roleVariants.forEach((variant, variantIndex) => {
      const focusKey = skillFocusKey(role.id, base.id, variant.id);
      const skillFocusOverride = skillFocusOverrides.get(focusKey);
      const targetSkill = skillFocusOverride
        ? skillById.get(skillFocusOverride.skillId)
        : baseSkills[0];
      if (!targetSkill) {
        throw new Error(`No target skill for ${focusKey}`);
      }
      if (
        skillFocusOverride &&
        !targetSkill.roleFamilies?.includes(role.id)
      ) {
        throw new Error(
          `Skill-focus override ${focusKey} uses ${targetSkill.id}, which is not mapped to ${role.id}`,
        );
      }
      if (skillFocusOverride) usedSkillFocusKeys.add(focusKey);
      generated.push(
        generateQuestion(
          base,
          role,
          targetSkill,
          variant,
          baseIndex,
          variantIndex,
          skillFocusOverride,
        ),
      );
    });
  });
}

const unusedSkillFocusKeys = [...skillFocusOverrides.keys()].filter(
  (key) => !usedSkillFocusKeys.has(key),
);
if (unusedSkillFocusKeys.length > 0) {
  throw new Error(
    `Unused skill-focus overrides: ${unusedSkillFocusKeys.join(", ")}`,
  );
}

const questions = [...curated, ...generated];
if (questions.length !== 2100) {
  throw new Error(
    `Expected exactly 2100 questions; generated ${questions.length}`,
  );
}

const output = {
  ...questionFile,
  schemaVersion: "2.0.0",
  evidenceDate: "2026-07-23",
  status: "bilingual-review-ready-v3",
  sourcePolicy:
    "All prompts are original, isomorphic tasks synthesized from public concepts. English and Chinese layers are parallel learning artifacts; NDA, leaked, paywalled, or memorized employer wording is prohibited.",
  levelScale: ["foundation", "entry", "intermediate", "advanced"],
  questions,
};

await writeFile(questionsUrl, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      status: "generated",
      curated: curated.length,
      generated: generated.length,
      total: questions.length,
      perRole: Object.fromEntries(
        roles.map((role) => [
          role.id,
          questions.filter((question) =>
            question.roleFamilies.includes(role.id),
          ).length,
        ]),
      ),
    },
    null,
    2,
  ),
);

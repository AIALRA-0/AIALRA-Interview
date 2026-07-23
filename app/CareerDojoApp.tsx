"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ApplicationRecord,
  Company,
  InterviewQuestion,
  PersistedState,
  Profile,
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

type AppProps = {
  companies: Company[];
  roles: RoleFamily[];
  skills: SkillNode[];
  questions: InterviewQuestion[];
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

function regionOf(company: Company): "US" | "CN" | "Global" {
  const value = `${company.country} ${company.region}`.toLowerCase();
  if (
    value.includes("china") ||
    value.includes("中国") ||
    value.includes("hong kong") ||
    value.includes("cn")
  ) {
    return "CN";
  }
  if (
    value.includes("united states") ||
    value.includes("美国") ||
    value.includes("usa") ||
    value.includes("us")
  ) {
    return "US";
  }
  return "Global";
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
    ? "可投初筛"
    : key === "yellow"
      ? "需核赞助"
      : key === "orange"
        ? "出口复核"
        : key === "red"
          ? "硬门槛"
          : "待核验";
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
  questions,
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
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedQuestion, setSelectedQuestion] =
    useState<InterviewQuestion | null>(null);
  const [rubricVisible, setRubricVisible] = useState(false);
  const [attemptScore, setAttemptScore] = useState(50);
  const [attemptConfidence, setAttemptConfidence] = useState(50);
  const [attemptNotes, setAttemptNotes] = useState("");
  const [applicationBuilderVisible, setApplicationBuilderVisible] =
    useState(false);
  const [applicationDraft, setApplicationDraft] = useState<ApplicationDraft>(
    emptyApplicationDraft,
  );
  const companyModalRef = useRef<HTMLElement>(null);
  const questionModalRef = useRef<HTMLElement>(null);
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

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (selectedCompany) {
          setApplicationBuilderVisible(false);
          setSelectedCompany(null);
        } else {
          setSelectedQuestion(null);
        }
        return;
      }
      if (event.key !== "Tab" || !modal) return;
      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
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

  const categories = useMemo(
    () =>
      Array.from(new Set(companies.flatMap((company) => company.categories)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
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
    return companies
      .filter((company) => region === "ALL" || regionOf(company) === region)
      .filter(
        (company) =>
          category === "ALL" || company.categories.includes(category),
      )
      .filter(
        (company) =>
          visa === "ALL" || signalKey(company.visaSignal) === visa,
      )
      .filter((company) => {
        if (!term) return true;
        return [
          company.name,
          ...company.aliases,
          ...company.categories,
          ...company.focusAreas,
          ...company.roleFamilies,
          company.whyRelevant,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort(
        (a, b) =>
          fitRank(a.fitTier) - fitRank(b.fitTier) ||
          a.name.localeCompare(b.name),
      );
  }, [category, companies, region, search, visa]);

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
          question.prompt,
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
        companyName: company.name,
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
    if (
      !window.confirm(
        `确认从投递作战室删除 ${application.company_name} — ${application.role_title}？`,
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
      setSelectedQuestion(null);
      setRubricVisible(false);
      setAttemptNotes("");
    }
  }

  function openRoleDojo(roleId: string) {
    setRoleFilter(roleId);
    setSearch("");
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
              <Metric value={questions.length} label="高质量训练任务" note="原创与可追溯" />
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
                        <strong>{company.name}</strong>
                        <small>
                          {company.categories.slice(0, 2).join(" · ") ||
                            company.companyType}
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
                    onClick={() => {
                      setSelectedQuestion(question);
                      setRubricVisible(false);
                      setAttemptScore(50);
                      setAttemptConfidence(50);
                      setAttemptNotes("");
                    }}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{question.titleZh || question.title}</strong>
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
                  ["ALL", "全部"],
                  ["US", "美国"],
                  ["CN", "中国"],
                  ["Global", "全球"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={region === value ? "active" : ""}
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
                <span>产业节点</span>
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setCompanyLimit(60);
                  }}
                >
                  <option value="ALL">全部产业节点</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
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
                    onClick={() => setAtlasLayout("tree")}
                  >
                    组织树
                  </button>
                  <button
                    className={atlasLayout === "cards" ? "active" : ""}
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
                      <h3>{regionGroup.region}</h3>
                      <span>{regionGroup.nodes.length} 个节点</span>
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
                            <span>{typeGroup.companyType}</span>
                            <b>{typeGroup.companies.length}</b>
                          </summary>
                          {expanded ? (
                            <div className="tree-company-list">
                              {typeGroup.companies.map((company) => (
                                <button
                                  key={company.id}
                                  onClick={() => setSelectedCompany(company)}
                                >
                                  <span>{company.name}</span>
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
                          {company.name.slice(0, 2).toUpperCase()}
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
                          <h3>{company.name}</h3>
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
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                      <div className="company-meta">
                        <span>{regionOf(company)}</span>
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
                const roleQuestions = questions.filter((question) =>
                  question.roleFamilies.includes(role.id),
                ).length;
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
                      <span>{roleQuestions} 道训练任务</span>
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
                  每道任务都对应岗位信号、先修能力、交付物、评分规则、常见失败和追问。
                  当前题库是研究沙箱；未完成专家与 learner pilot
                  的自评分不会改变岗位准备度。
                </p>
              </div>
              <div className="dojo-score">
                <strong>{completedQuestions.size}</strong>
                <span>已完成任务</span>
                <small>{totalAttemptCount} 次可追溯尝试</small>
              </div>
            </div>

            <div className="filter-bar dojo-filters">
              <label className="search-field">
                <span>搜索</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="题目、技能、故障类型…"
                />
              </label>
              <label>
                <span>岗位</span>
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  <option value="ALL">全部岗位</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nameZh}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>任务类型</span>
                <select
                  value={questionType}
                  onChange={(event) => setQuestionType(event.target.value)}
                >
                  <option value="ALL">全部类型</option>
                  {questionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>学习层级</span>
                <select
                  value={questionLevel}
                  onChange={(event) => setQuestionLevel(event.target.value)}
                >
                  <option value="ALL">全部层级</option>
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
                <span>难度</span>
                <select
                  value={questionDifficulty}
                  onChange={(event) =>
                    setQuestionDifficulty(event.target.value)
                  }
                >
                  <option value="ALL">全部难度</option>
                  {Array.from(
                    new Set(questions.map((question) => question.difficulty)),
                  ).map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="question-grid">
              {filteredQuestions.map((question) => (
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
                  <h3>{question.titleZh || question.title}</h3>
                  <p>{question.prompt}</p>
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
                      onClick={() => {
                        setSelectedQuestion(question);
                        setRubricVisible(false);
                        setAttemptScore(50);
                        setAttemptConfidence(50);
                        setAttemptNotes("");
                      }}
                    >
                      {completedQuestions.has(question.id) ? "再次训练" : "开始任务"} →
                    </button>
                  </div>
                </article>
              ))}
            </div>
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
                          <h3>{application.company_name}</h3>
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
                        <strong>{company.name}</strong>
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
              <Metric value={questions.length} label="合规训练任务" />
              <Metric value={skills.length} label="能力覆盖节点" />
            </div>

            <div className="evidence-grid">
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
                        company: company.name,
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
                {selectedCompany.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <span className="section-kicker">
                  {regionOf(selectedCompany)} · {selectedCompany.companyType}
                </span>
                <h2 id="company-dialog-title">{selectedCompany.name}</h2>
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
                  {roles.find((role) => role.id === roleId)?.nameZh || roleId}
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
              onClick={() => setSelectedQuestion(null)}
              aria-label="关闭训练任务"
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
                  {selectedQuestion.titleZh || selectedQuestion.title}
                </h2>
              </div>
              <span className="difficulty-badge">
                {selectedQuestion.difficulty}
              </span>
            </div>

            <div className="prompt-box">{selectedQuestion.prompt}</div>
            {selectedQuestion.status === "review-ready" ? (
              <div className="scope-notice">
                <strong>待校准题</strong>
                <span>
                  已通过结构与来源检查；尚未完成领域专家与真实练习者 pilot，
                  分数只用于自我比较，不写入岗位准备度。
                </span>
              </div>
            ) : null}
            <div className="question-modal-grid">
              <div>
                <h3>你需要交付</h3>
                <ol>
                  {selectedQuestion.deliverables.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h3>面试官可能追问</h3>
                <ol>
                  {selectedQuestion.followUps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            </div>

            <label className="attempt-notes">
              <span>作答记录 / 复盘</span>
              <textarea
                value={attemptNotes}
                onChange={(event) => setAttemptNotes(event.target.value)}
                placeholder="先独立写出思路、假设、关键取舍和验证方法…"
              />
            </label>

            <button
              className="rubric-toggle"
              onClick={() => setRubricVisible((value) => !value)}
            >
              {rubricVisible ? "收起评分规则" : "完成后查看评分规则"}
            </button>

            {rubricVisible ? (
              <div className="rubric-grid">
                <div>
                  <h3>评分规则</h3>
                  <ul>
                    {selectedQuestion.rubric.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>常见失败</h3>
                  <ul>
                    {selectedQuestion.commonFailures.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                {selectedQuestion.referenceOutline?.length ? (
                  <div>
                    <h3>参考解题骨架</h3>
                    <ol>
                      {selectedQuestion.referenceOutline.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
                {selectedQuestion.oracle ? (
                  <div>
                    <h3>可验证完成标准</h3>
                    {typeof selectedQuestion.oracle === "string" ? (
                      <p className="oracle-copy">{selectedQuestion.oracle}</p>
                    ) : (
                      <dl className="oracle-copy oracle-details">
                        <div>
                          <dt>类型</dt>
                          <dd>{selectedQuestion.oracle.kind}</dd>
                        </div>
                        <div>
                          <dt>验证步骤</dt>
                          <dd>{selectedQuestion.oracle.procedure}</dd>
                        </div>
                        <div>
                          <dt>通过标准</dt>
                          <dd>{selectedQuestion.oracle.acceptance}</dd>
                        </div>
                      </dl>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="self-score">
              <label>
                <span>本次表现</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={attemptScore}
                  onChange={(event) => setAttemptScore(Number(event.target.value))}
                />
                <strong>{attemptScore}</strong>
              </label>
              <label>
                <span>自评置信度</span>
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

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setSelectedQuestion(null)}
              >
                暂不保存
              </button>
              <button className="primary-button" onClick={saveAttempt}>
                保存本次训练
              </button>
              {selectedQuestion.sourceRefs
                .map(sourceUrl)
                .filter(Boolean)
                .slice(0, 1)
                .map((url) => (
                  <a
                    className="text-link"
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    key={url}
                  >
                    查看公开依据 ↗
                  </a>
                ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

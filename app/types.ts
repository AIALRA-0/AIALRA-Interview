export type Evidence = {
  title: string;
  url: string;
  type?: string;
  observedAt?: string;
};

export type OrganizationRelationEvidence = {
  titleZh: string;
  titleEn: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
  lastVerified: string;
};

export type OrganizationRelation = {
  id: string;
  fromOrganizationId: string;
  toOrganizationId: string;
  relationType:
    "corporate-family" | "acquisition" | "combination" | "technology-license";
  status: "active" | "pending" | "completed" | "terminated";
  announcedAt: string | null;
  lastVerified: string;
  summaryZh: string;
  summaryEn: string;
  officialEvidence: OrganizationRelationEvidence[];
};

export type BilingualTerm = {
  id: string;
  zh: string;
  en: string;
};

export type ChinaCompanyOwnershipClass =
  | "central-state-owned"
  | "central-state-controlled"
  | "central-state-subsidiary"
  | "local-state-owned"
  | "state-controlled"
  | "state-invested"
  | "state-joint-venture"
  | "private"
  | "foreign-controlled"
  | "mixed-or-unknown";

export type ChinaCompanyOwnership = {
  ownershipClass: ChinaCompanyOwnershipClass;
  labelZh: string;
  labelEn: string;
  definitionZh: string;
  definitionEn: string;
  summaryZh: string;
  summaryEn: string;
  confidence: "high" | "medium" | "low";
  classificationBasis:
    | "existing-explicit-ownership-category"
    | "insufficient-direct-control-evidence";
  sourceOwnershipTag: string | null;
  reviewStatus: "provisionally-audited" | "needs-direct-control-source";
  reviewedAt: string;
  evidence: Array<{
    titleZh: string;
    titleEn: string;
    url: string;
    sourceType: string;
    observedAt: string;
    evidenceScope: string;
    noteZh: string;
    noteEn: string;
  }>;
};

export type Company = {
  id: string;
  name: string;
  nameEn: string;
  nameZh?: string;
  aliases: string[];
  country: string;
  region: string;
  opportunityMarket: "US" | "CN" | "Global";
  companyType: string;
  categories: string[];
  locations: string[];
  focusAreas: string[];
  roleFamilies: string[];
  roleFamilyIds: string[];
  fitTier: string;
  difficulty: string;
  visaSignal: string;
  whyRelevant: string;
  requirements: string[];
  gaps: string[];
  opportunityTypes: string[];
  careerUrl: string;
  evidence: Evidence[];
  lastVerified: string;
  confidence: string;
  descriptionZh: string;
  descriptionEn: string;
  relevanceZh: string;
  relevanceEn: string;
  focusAtoms: BilingualTerm[];
  roleAtoms: BilingualTerm[];
  opportunityAtoms: BilingualTerm[];
  requirementAtoms: BilingualTerm[];
  preparationAtoms: BilingualTerm[];
  ownership?: ChinaCompanyOwnership;
};

export type OrganizationUniverseAsset = {
  schemaVersion: string;
  assetVersion: string;
  sourceSha256: string;
  evidenceDate: string;
  organizationCount: number;
  organizations: Company[];
};

export type OrganizationBankBootstrap = {
  schemaVersion: string;
  assetVersion: string;
  sourceSha256: string;
  evidenceDate: string;
  organizationCount: number;
  regionCounts: {
    US: number;
    CN: number;
    Global: number;
  };
  assetUrl: string;
  assetSha256: string;
};

export type RoleFamily = {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  typicalTitles: string[];
  interviewStages: string[];
  primarySkillDomains: string[];
  adjacentRoleFamilies: string[];
};

export type SkillNode = {
  id: string;
  name?: string;
  nameZh?: string;
  title?: string;
  titleZh?: string;
  domain?: string;
  category?: string;
  description?: string;
  prerequisites?: string[];
  roleFamilies?: string[];
  level?: string;
  evidence?: Evidence[];
};

export type QuestionOracle =
  | string
  | {
      kind: string;
      procedure: string;
      acceptance: string;
    };

export type InterviewQuestion = {
  id: string;
  title: string;
  titleZh: string;
  roleFamilies: string[];
  skills: string[];
  prerequisiteSkills?: string[];
  level: string;
  difficulty: string;
  type: string;
  prompt: string;
  promptZh: string;
  deliverables: string[];
  deliverablesZh: string[];
  rubric: string[];
  rubricZh: string[];
  commonFailures: string[];
  commonFailuresZh: string[];
  followUps: string[];
  followUpsZh: string[];
  sourcePolicy: string;
  sourceRefs: Evidence[] | string[];
  estimatedMinutes: number;
  evidenceDate: string;
  status: string;
  referenceOutline: string[];
  referenceOutlineZh: string[];
  oracle: QuestionOracle;
  oracleZh: QuestionOracle;
  blueprintId: string;
  contentVersion: string;
};

export type InterviewQuestionSummary = Pick<
  InterviewQuestion,
  | "id"
  | "title"
  | "titleZh"
  | "roleFamilies"
  | "skills"
  | "level"
  | "difficulty"
  | "type"
  | "estimatedMinutes"
  | "status"
  | "contentVersion"
  | "blueprintId"
> & {
  promptPreview: string;
  promptPreviewZh: string;
  shardId: string;
};

export type QuestionBankIndex = {
  schemaVersion: string;
  assetVersion: string;
  sourceSha256: string;
  questionCount: number;
  previewLength: number;
  questions: InterviewQuestionSummary[];
};

export type QuestionBankBootstrap = {
  schemaVersion: string;
  assetVersion: string;
  sourceSha256: string;
  questionCount: number;
  previewLength: number;
  indexUrl: string;
  indexSha256: string;
  shardSha256ById: Record<string, string>;
};

export type QuestionBankShard = {
  schemaVersion: string;
  assetVersion: string;
  shardId: string;
  questionCount: number;
  questions: InterviewQuestion[];
};

export type Profile = {
  id: string;
  evidenceDate: string;
  targetWindow: string;
  targetWindowEn?: string;
  education: {
    program: string;
    programEn?: string;
    start: string;
    startEn?: string;
    status: string;
    workAuthorization: string;
    workAuthorizationEn?: string;
  };
  positioning: string;
  positioningEn?: string;
  strengths: string[];
  strengthsEn?: string[];
  priorityRoleFamilies: string[];
  criticalGaps: string[];
  criticalGapsEn?: string[];
  readinessByRole?: Record<string, number>;
};

export type ApplicationRecord = {
  id: string;
  company_id: string;
  company_name: string;
  role_title: string;
  employment_type: string;
  region: string;
  status: string;
  priority: string;
  job_url: string;
  deadline: string;
  sponsorship_signal: string;
  export_signal: string;
  contact: string;
  resume_version: string;
  jd_keywords: string;
  source_observed_at: string;
  match_score: number;
  notes: string;
  created_at?: string;
  updated_at?: string;
};

export type SkillProgressRecord = {
  skill_id: string;
  mastery: number;
  attempts: number;
  updated_at?: string;
};

export type QuestionAttemptRecord = {
  id: string;
  question_id: string;
  question_version: string;
  score: number;
  confidence: number;
  notes: string;
  created_at?: string;
};

export type QuestionStatRecord = {
  question_id: string;
  question_version: string;
  attempts: number;
  best_score: number;
  latest_score: number;
  total_score: number;
  latest_confidence: number;
  updated_at?: string;
};

export type PersistedState = {
  applications: ApplicationRecord[];
  bookmarks: string[];
  skillProgress: SkillProgressRecord[];
  questionAttempts: QuestionAttemptRecord[];
  questionStats: QuestionStatRecord[];
  preferences: Record<string, string>;
};

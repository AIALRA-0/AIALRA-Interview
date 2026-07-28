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

export type CompensationStatus = "disclosed" | "estimated" | "not-disclosed";

export type CompensationPeriod =
  "hour" | "day" | "week" | "month" | "year" | "one-time" | "project";

export type CompensationBasis =
  | "employer-posting"
  | "government-statistic"
  | "government-disclosure"
  | "third-party-estimate";

export type CompensationRange = {
  status: CompensationStatus;
  minimum: string | null;
  maximum: string | null;
  currency: string | null;
  period: CompensationPeriod | null;
  location: string;
  sourceUrl: string;
  sourceTitle: string;
  basis: CompensationBasis | null;
  observedAt: string;
  notesZh: string;
  notesEn: string;
};

export type RoleCompensationBenchmark = {
  roleFamilyId: string;
  roleNameZh: string;
  roleNameEn: string;
  compensationScope: "technical-role" | "cross-cutting-skill";
  benchmarkStatus: "available-with-proxies" | "not-applicable";
  us: MarketCompensationBenchmark | null;
  china: MarketCompensationBenchmark[];
  notesZh: string;
  notesEn: string;
};

export type CompensationBenchmarkValues = {
  p25?: number;
  median?: number;
  p75?: number;
  mean?: number;
  low?: number;
  high?: number;
  points?: Array<{
    geographyZh: string;
    geographyEn: string;
    mean: number;
  }>;
};

export type MarketCompensationBenchmark = {
  id?: string;
  occupationCode?: string | null;
  occupationZh: string;
  occupationEn: string;
  matchQuality: "direct" | "adjacent" | "broad-context";
  matchNoteZh?: string;
  matchNoteEn?: string;
  employmentType: string;
  employmentLevel: string;
  geographyZh: string;
  geographyEn: string;
  currency: string;
  period: "month" | "year";
  statistic: "p25-p50-p75" | "mean" | "regional-mean-envelope";
  values: CompensationBenchmarkValues;
  basis: string;
  includedZh?: string;
  includedEn?: string;
  excludedZh?: string;
  excludedEn?: string;
  apiSeries?: Record<"p25" | "median" | "p75", string>;
  sourceId: string;
};

export type CompensationBenchmarkSource = {
  id: string;
  publisherZh: string;
  publisherEn: string;
  titleZh: string;
  titleEn: string;
  url: string;
  methodologyUrl: string;
  referencePeriod: string;
  publishedAt: string;
  observedAt: string;
  sourceKind: string;
};

export type ChinaContextCompensationBenchmark = MarketCompensationBenchmark & {
  id: string;
  occupationCode: string | null;
  intendedRoleFamilyIds: string[];
};

export type CompensationBenchmarkAsset = {
  schemaVersion: string;
  evidenceDate: string;
  assetPurposeZh: string;
  assetPurposeEn: string;
  sourceCatalog: CompensationBenchmarkSource[];
  chinaContextBenchmarks: ChinaContextCompensationBenchmark[];
  benchmarks: RoleCompensationBenchmark[];
};

export type PositionCompensationBasis =
  | "employer-posting"
  | "third-party-job-board"
  | "third-party-campus-posting"
  | "third-party-estimate";

export type SpecificPositionCompensation = {
  id: string;
  organizationId: string;
  companyZh: string;
  companyEn: string;
  titleZh: string;
  titleEn: string;
  locationZh: string;
  locationEn: string;
  taxRegion: "CA" | "TX" | "SH";
  levelZh: string;
  levelEn: string;
  minimum: number;
  maximum: number;
  currency: "USD" | "CNY";
  period: "month" | "year";
  payMonthsPerYear: number;
  compensationTypeZh: string;
  compensationTypeEn: string;
  basis: PositionCompensationBasis;
  sourceStatus: "current" | "historical-current-cycle";
  sourceUrl: string;
  sourceTitle: string;
  observedAt: string;
  notesZh: string;
  notesEn: string;
};

export type PositionCompensationComparison = {
  roleFamilyId: string;
  roleNameZh: string;
  roleNameEn: string;
  comparisonNoteZh: string;
  comparisonNoteEn: string;
  us: SpecificPositionCompensation;
  china: SpecificPositionCompensation;
};

export type PositionCompensationComparisonAsset = {
  schemaVersion: string;
  evidenceDate: string;
  titleZh: string;
  titleEn: string;
  methodology: {
    nominalFx: {
      cnyPerUsd: number;
      referenceDate: string;
      sourceTitleZh: string;
      sourceTitleEn: string;
      sourceUrl: string;
    };
    privateConsumptionPpp: {
      chinaCnyPerInternationalDollar: number;
      unitedStatesUsdPerInternationalDollar: number;
      referenceYear: number;
      sourceTitleZh: string;
      sourceTitleEn: string;
      sourceUrl: string;
    };
    usTaxScenario: {
      filingStatusZh: string;
      filingStatusEn: string;
      federalTaxYear: number;
      californiaLiabilityScheduleYear: number;
      californiaSdiYear: number;
      notesZh: string;
      notesEn: string;
      sources: Array<{
        titleZh: string;
        titleEn: string;
        url: string;
      }>;
    };
    chinaTaxScenario: {
      cityZh: string;
      cityEn: string;
      filingStatusZh: string;
      filingStatusEn: string;
      employeeSocialInsuranceRate: number;
      employeeHousingFundRateAssumption: number;
      monthlyContributionBaseMinimum: number;
      monthlyContributionBaseMaximum: number;
      notesZh: string;
      notesEn: string;
      sources: Array<{
        titleZh: string;
        titleEn: string;
        url: string;
      }>;
    };
  };
  comparisons: PositionCompensationComparison[];
};

export type CurrentJobObservation = {
  id: string;
  organizationId: string;
  titleZh: string;
  titleEn: string;
  originalTitle: string;
  requisitionId: string | null;
  employmentType: string;
  location: string;
  workplaceMode: string;
  postingStatus: "current-at-observation" | "closed" | "unknown";
  postedAt: string | null;
  observedAt: string;
  roleFamilyIds: string[];
  responsibilitiesZh: string[];
  responsibilitiesEn: string[];
  minimumQualificationsZh: string[];
  minimumQualificationsEn: string[];
  eligibilityZh: string[];
  eligibilityEn: string[];
  compensation: CompensationRange;
  sourceUrl: string;
};

export type CurrentJobObservationAsset = {
  schemaVersion: string;
  evidenceDate: string;
  jobs: CurrentJobObservation[];
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
  fallbackPackSha256ById: Record<string, string>;
};

export type QuestionBankShard = {
  schemaVersion: string;
  assetVersion: string;
  shardId: string;
  questionCount: number;
  questions: InterviewQuestion[];
};

export type QuestionBankFallbackPack = {
  schemaVersion: string;
  assetVersion: string;
  packId: string;
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
  requisition_id: string;
  role_family_id: string;
  team: string;
  business_unit: string;
  level: string;
  target_location: string;
  workplace_mode: string;
  posted_at: string;
  posting_status: string;
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
  responsibilities: string;
  minimum_qualifications: string;
  preferred_qualifications: string;
  eligibility_notes: string;
  source_observed_at: string;
  compensation_status: CompensationStatus;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  salary_period: string;
  salary_location: string;
  salary_source_url: string;
  salary_source_title: string;
  salary_basis: string;
  salary_observed_at: string;
  salary_notes: string;
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

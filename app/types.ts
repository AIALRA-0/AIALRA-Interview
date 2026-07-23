export type Evidence = {
  title: string;
  url: string;
  type?: string;
  observedAt?: string;
};

export type Company = {
  id: string;
  name: string;
  aliases: string[];
  country: string;
  region: string;
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

export type InterviewQuestion = {
  id: string;
  title: string;
  titleZh?: string;
  roleFamilies: string[];
  skills: string[];
  level: string;
  difficulty: string;
  type: string;
  prompt: string;
  deliverables: string[];
  rubric: string[];
  commonFailures: string[];
  followUps: string[];
  sourcePolicy: string;
  sourceRefs: Evidence[] | string[];
  estimatedMinutes: number;
  evidenceDate: string;
  status: string;
  referenceOutline?: string[];
  oracle?:
    | string
    | {
        kind: string;
        procedure: string;
        acceptance: string;
      }
    | null;
  contentVersion: string;
};

export type Profile = {
  id: string;
  evidenceDate: string;
  targetWindow: string;
  education: {
    program: string;
    start: string;
    status: string;
    workAuthorization: string;
  };
  positioning: string;
  strengths: string[];
  priorityRoleFamilies: string[];
  criticalGaps: string[];
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

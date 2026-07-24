import categoryLabelsEnRaw from "../data/organization-category-labels.en.json";
import categoryLabelsZhRaw from "../data/organization-category-labels.zh.json";
import expansionCnCategoryLabelsRaw from "../data/expansion-cn-category-labels.json";
import expansionCnCompanyTypeLabelsRaw from "../data/expansion-cn-company-type-labels.json";
import expansionUsCategoryLabelsRaw from "../data/expansion-us-category-labels.json";
import organizationIntelligenceRaw from "../data/organization-intelligence.json";
import organizationLabelsRaw from "../data/organization-labels.json";
import type { BilingualTerm, Company } from "./types";

type CompanyProfileInput = Omit<
  Company,
  | "descriptionZh"
  | "descriptionEn"
  | "relevanceZh"
  | "relevanceEn"
  | "focusAtoms"
  | "roleAtoms"
  | "opportunityAtoms"
  | "requirementAtoms"
  | "preparationAtoms"
> & {
  descriptionZh?: string;
  descriptionEn?: string;
  relevanceZh?: string;
  relevanceEn?: string;
};

type OpportunityDefinition = BilingualTerm & { patterns: string[] };

const hanPattern = /[\u3400-\u9fff]/;
const categoryLabels = {
  ...categoryLabelsEnRaw.labels,
  ...categoryLabelsZhRaw.labels,
  ...expansionUsCategoryLabelsRaw,
  ...expansionCnCategoryLabelsRaw,
} as Record<string, { zh: string; en: string }>;
const companyTypeLabels = {
  ...organizationLabelsRaw.companyTypes,
  ...expansionCnCompanyTypeLabelsRaw,
} as Record<string, { zh: string; en: string }>;
const roleAtomsById = organizationIntelligenceRaw.roleAtoms as Record<
  string,
  BilingualTerm[]
>;
const requirementsByRole =
  organizationIntelligenceRaw.roleRequirements as Record<
    string,
    BilingualTerm[]
  >;
const preparationByRole = organizationIntelligenceRaw.rolePreparation as Record<
  string,
  BilingualTerm[]
>;
const categoryAtomOverrides =
  organizationIntelligenceRaw.categoryAtomOverrides as Record<
    string,
    BilingualTerm[]
  >;
const opportunityDefinitions =
  organizationIntelligenceRaw.opportunityAtoms as OpportunityDefinition[];

function uniqueTerms(terms: BilingualTerm[], limit = Number.POSITIVE_INFINITY) {
  const seen = new Set<string>();
  return terms
    .filter((term) => {
      if (seen.has(term.id)) return false;
      seen.add(term.id);
      return true;
    })
    .slice(0, limit);
}

function categoryAtoms(categories: string[]) {
  return uniqueTerms(
    categories.flatMap((category) => {
      if (categoryAtomOverrides[category]) {
        return categoryAtomOverrides[category];
      }
      const label = categoryLabels[category];
      return label
        ? [
            {
              id: `category:${category}`,
              zh: label.zh,
              en: label.en,
            },
          ]
        : [];
    }),
    6,
  );
}

function roleAtoms(roleFamilyIds: string[]) {
  return uniqueTerms(
    roleFamilyIds.flatMap((roleId) => roleAtomsById[roleId] || []),
    8,
  );
}

function opportunityAtoms(opportunityTypes: string[]) {
  const corpus = opportunityTypes.join(" ").toLowerCase();
  const matches = opportunityDefinitions.filter((definition) =>
    definition.patterns.some((pattern) =>
      corpus.includes(pattern.toLowerCase()),
    ),
  );
  return uniqueTerms(
    matches.length
      ? matches
      : [organizationIntelligenceRaw.fallbackOpportunity as BilingualTerm],
    8,
  );
}

function roleTerms(
  roleFamilyIds: string[],
  catalog: Record<string, BilingualTerm[]>,
  fallback: BilingualTerm[],
  limit: number,
) {
  const terms = roleFamilyIds.flatMap((roleId) => catalog[roleId] || []);
  return uniqueTerms(terms.length ? terms : fallback, limit);
}

function joinZh(terms: BilingualTerm[]) {
  return terms.map((term) => term.zh).join("、");
}

function joinEn(terms: BilingualTerm[]) {
  const values = terms.map((term) => term.en);
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function generatedDescription(
  company: CompanyProfileInput,
  focus: BilingualTerm[],
  roles: BilingualTerm[],
) {
  const type =
    companyTypeLabels[company.companyType] ||
    ({ zh: "组织", en: "organization" } as const);
  const zhName = company.nameZh || company.nameEn;
  const focusZh = joinZh(focus.slice(0, 4)) || "工程技术";
  const focusEn = joinEn(focus.slice(0, 4)) || "engineering technology";
  const rolesZh = joinZh(roles.slice(0, 4)) || "具体岗位待核";
  const rolesEn = joinEn(roles.slice(0, 4)) || "posting-specific roles";
  return {
    zh: `${zhName}是本图谱中的${type.zh}节点，主要覆盖${focusZh}。可重点关注的目标岗位包括${rolesZh}；是否有当期机会仍须以具体招聘公告为准。`,
    en: `${company.nameEn} is a ${type.en.toLowerCase()} in this atlas, with work spanning ${focusEn}. The most relevant target roles include ${rolesEn}; current availability must still be verified against an exact posting.`,
  };
}

function generatedRelevance(
  company: CompanyProfileInput,
  focus: BilingualTerm[],
  roles: BilingualTerm[],
) {
  const focusZh = joinZh(focus.slice(0, 3)) || "相关工程领域";
  const focusEn =
    joinEn(focus.slice(0, 3)) || "the relevant engineering domain";
  const rolesZh = joinZh(roles.slice(0, 3)) || "目标岗位";
  const rolesEn = joinEn(roles.slice(0, 3)) || "target roles";
  return {
    zh: `纳入原因：其${focusZh}业务与${rolesZh}能力路径存在可验证交集。`,
    en: `Why it is included: its work in ${focusEn} has a verifiable intersection with the ${rolesEn} capability path.`,
  };
}

export function enrichOrganization(
  company: CompanyProfileInput,
): Pick<
  Company,
  | "descriptionZh"
  | "descriptionEn"
  | "relevanceZh"
  | "relevanceEn"
  | "focusAtoms"
  | "roleAtoms"
  | "opportunityAtoms"
  | "requirementAtoms"
  | "preparationAtoms"
> {
  const focus = categoryAtoms(company.categories);
  const roles = roleAtoms(company.roleFamilyIds);
  const opportunities = opportunityAtoms(company.opportunityTypes);
  const requirements = roleTerms(
    company.roleFamilyIds,
    requirementsByRole,
    organizationIntelligenceRaw.fallbackRequirement as BilingualTerm[],
    8,
  );
  const preparation = roleTerms(
    company.roleFamilyIds,
    preparationByRole,
    organizationIntelligenceRaw.fallbackPreparation as BilingualTerm[],
    6,
  );
  const description = generatedDescription(company, focus, roles);
  const relevance = generatedRelevance(company, focus, roles);
  const rawRelevance = company.whyRelevant.trim();
  const rawIsChinese = hanPattern.test(rawRelevance);

  return {
    descriptionZh: company.descriptionZh?.trim() || description.zh,
    descriptionEn: company.descriptionEn?.trim() || description.en,
    relevanceZh:
      company.relevanceZh?.trim() ||
      (rawIsChinese ? rawRelevance : relevance.zh),
    relevanceEn:
      company.relevanceEn?.trim() ||
      (rawIsChinese ? relevance.en : rawRelevance || relevance.en),
    focusAtoms: focus,
    roleAtoms: roles,
    opportunityAtoms: opportunities,
    requirementAtoms: requirements,
    preparationAtoms: preparation,
  };
}

export function evidenceTypeLabel(type?: string) {
  const labels = organizationIntelligenceRaw.evidenceTypes as Record<
    string,
    { zh: string; en: string }
  >;
  return (
    (type && labels[type]) ||
    (organizationIntelligenceRaw.fallbackEvidenceType as {
      zh: string;
      en: string;
    })
  );
}

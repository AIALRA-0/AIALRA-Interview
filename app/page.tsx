import cnCompaniesRaw from "../data/companies.cn.json";
import cnExpansionRaw from "../data/expansion-cn-candidates.json";
import usCompaniesRaw from "../data/companies.us.json";
import usExpansionRaw from "../data/expansion-us-candidates.json";
import organizationLabelsRaw from "../data/organization-labels.json";
import organizationProfileContentRaw from "../data/organization-profile-content.json";
import organizationRelationsRaw from "../data/organization-relations.json";
import profileRaw from "../data/profile.json";
import roleFamiliesRaw from "../data/role-families.json";
import roleMappingRaw from "../data/role-mapping.json";
import skillGraphRaw from "../data/skill-graph.json";
import organizationManifestRaw from "../public/organization-universe.manifest.json";
import questionManifestRaw from "../public/question-bank/manifest.json";
import { mappedRoleFamilyIds } from "../shared/role-matching";
import { CareerDojoApp } from "./CareerDojoApp";
import { enrichOrganization } from "./organization-intelligence";
import type {
  Company,
  OrganizationBankBootstrap,
  OrganizationRelation,
  Profile,
  QuestionBankBootstrap,
  RoleFamily,
  SkillNode,
} from "./types";

type RawCompany = Omit<
  Company,
  | "roleFamilyIds"
  | "nameEn"
  | "nameZh"
  | "opportunityMarket"
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
  nameEn?: string;
  nameZh?: string;
  opportunityMarket?: "US" | "CN" | "Global";
  descriptionZh?: string;
  descriptionEn?: string;
  relevanceZh?: string;
  relevanceEn?: string;
};

const hanPattern = /[\u3400-\u9fff]/;
const latinPattern = /[A-Za-z]/;
const companyNameEn = organizationLabelsRaw.companyNameEn as Record<
  string,
  string
>;
const companyNameZh = organizationLabelsRaw.companyNameZh as Record<
  string,
  string
>;
const organizationProfileContent =
  organizationProfileContentRaw.profiles as Record<
    string,
    Pick<
      Company,
      "descriptionZh" | "descriptionEn" | "relevanceZh" | "relevanceEn"
    >
  >;

function normalizedCompanyNames(company: RawCompany) {
  const sourceNameIsChinese = hanPattern.test(company.name);
  const aliasEn = company.aliases.find((alias) => latinPattern.test(alias));
  const aliasZh = company.aliases.find((alias) => hanPattern.test(alias));
  const nameEn =
    company.nameEn ||
    (sourceNameIsChinese
      ? companyNameEn[company.id] || aliasEn
      : companyNameEn[company.id] || company.name);
  if (!nameEn || hanPattern.test(nameEn)) {
    throw new Error(`Organization ${company.id} needs an English name`);
  }
  const nameZh =
    company.nameZh ||
    (sourceNameIsChinese ? company.name : companyNameZh[company.id] || aliasZh);
  return {
    nameEn,
    ...(nameZh && nameZh !== nameEn ? { nameZh } : {}),
  };
}

const companies = [
  ...(usCompaniesRaw as unknown as RawCompany[]).map((company) => ({
    ...company,
    opportunityMarket: "US" as const,
  })),
  ...(usExpansionRaw as unknown as RawCompany[]).map((company) => ({
    ...company,
    opportunityMarket: "US" as const,
  })),
  ...(cnCompaniesRaw as unknown as RawCompany[]).map((company) => ({
    ...company,
    opportunityMarket: "CN" as const,
  })),
  ...(cnExpansionRaw as unknown as RawCompany[]).map((company) => ({
    ...company,
    opportunityMarket: "CN" as const,
  })),
].map((company) => {
  const companyWithProfile = {
    ...company,
    ...(organizationProfileContent[company.id] || {}),
  };
  const normalized = {
    ...companyWithProfile,
    ...normalizedCompanyNames(companyWithProfile),
    roleFamilyIds: mappedRoleFamilyIds(
      companyWithProfile,
      roleMappingRaw.rules,
    ),
  };
  return {
    ...normalized,
    ...enrichOrganization(normalized),
  };
});
const roles = roleFamiliesRaw.roleFamilies as unknown as RoleFamily[];
const skills = skillGraphRaw.skills as unknown as SkillNode[];
const questionBank: QuestionBankBootstrap = {
  schemaVersion: questionManifestRaw.schemaVersion,
  assetVersion: questionManifestRaw.assetVersion,
  sourceSha256: questionManifestRaw.sourceSha256,
  questionCount: questionManifestRaw.questionCount,
  previewLength: questionManifestRaw.previewLength,
  indexUrl: "/question-bank/index.json",
  indexSha256: questionManifestRaw.index.sha256,
  shardSha256ById: Object.fromEntries(
    questionManifestRaw.shards.map((shard) => [shard.id, shard.sha256]),
  ),
};
const organizationBank: OrganizationBankBootstrap = {
  schemaVersion: organizationManifestRaw.schemaVersion,
  assetVersion: organizationManifestRaw.assetVersion,
  sourceSha256: organizationManifestRaw.sourceSha256,
  evidenceDate: organizationManifestRaw.evidenceDate,
  organizationCount: organizationManifestRaw.organizationCount,
  regionCounts: organizationManifestRaw.regionCounts,
  assetUrl: organizationManifestRaw.asset.url,
  assetSha256: organizationManifestRaw.asset.sha256,
};
const profile = profileRaw as unknown as Profile;
const organizationRelations =
  organizationRelationsRaw as unknown as OrganizationRelation[];

export default function Home() {
  return (
    <CareerDojoApp
      initialCompanies={companies.slice(0, 12)}
      organizationBank={organizationBank}
      organizationRelations={organizationRelations}
      roles={roles}
      skills={skills}
      questionBank={questionBank}
      profile={profile}
    />
  );
}

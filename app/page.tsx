import cnCompaniesRaw from "../data/companies.cn.json";
import usCompaniesRaw from "../data/companies.us.json";
import organizationLabelsRaw from "../data/organization-labels.json";
import profileRaw from "../data/profile.json";
import roleFamiliesRaw from "../data/role-families.json";
import roleMappingRaw from "../data/role-mapping.json";
import skillGraphRaw from "../data/skill-graph.json";
import questionManifestRaw from "../public/question-bank/manifest.json";
import { CareerDojoApp } from "./CareerDojoApp";
import type {
  Company,
  Profile,
  QuestionBankBootstrap,
  RoleFamily,
  SkillNode,
} from "./types";

type RawCompany = Omit<
  Company,
  "roleFamilyIds" | "nameEn" | "nameZh" | "opportunityMarket"
>;

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

function normalizedCompanyNames(company: RawCompany) {
  const sourceNameIsChinese = hanPattern.test(company.name);
  const aliasEn = company.aliases.find((alias) => latinPattern.test(alias));
  const aliasZh = company.aliases.find((alias) => hanPattern.test(alias));
  const nameEn = sourceNameIsChinese
    ? companyNameEn[company.id] || aliasEn
    : companyNameEn[company.id] || company.name;
  if (!nameEn || hanPattern.test(nameEn)) {
    throw new Error(`Organization ${company.id} needs an English name`);
  }
  const nameZh = sourceNameIsChinese
    ? company.name
    : companyNameZh[company.id] || aliasZh;
  return {
    nameEn,
    ...(nameZh && nameZh !== nameEn ? { nameZh } : {}),
  };
}

function mapRoleFamilies(company: RawCompany) {
  const searchable = [
    company.companyType,
    ...company.categories,
    ...company.focusAreas,
    ...company.roleFamilies,
  ]
    .join(" ")
    .toLowerCase();
  return roleMappingRaw.rules
    .filter((rule) =>
      rule.keywords.some((keyword) => searchable.includes(keyword.toLowerCase())),
    )
    .map((rule) => rule.roleFamilyId);
}

const companies = [
  ...(usCompaniesRaw as unknown as RawCompany[]).map((company) => ({
    ...company,
    opportunityMarket: "US" as const,
  })),
  ...(cnCompaniesRaw as unknown as RawCompany[]).map((company) => ({
    ...company,
    opportunityMarket: "CN" as const,
  })),
].map((company) => ({
  ...company,
  ...normalizedCompanyNames(company),
  roleFamilyIds: mapRoleFamilies(company),
}));
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
const profile = profileRaw as unknown as Profile;

export default function Home() {
  return (
    <CareerDojoApp
      companies={companies}
      roles={roles}
      skills={skills}
      questionBank={questionBank}
      profile={profile}
    />
  );
}

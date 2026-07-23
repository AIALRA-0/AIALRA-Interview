import cnCompaniesRaw from "../data/companies.cn.json";
import usCompaniesRaw from "../data/companies.us.json";
import profileRaw from "../data/profile.json";
import questionsRaw from "../data/questions.seed.json";
import roleFamiliesRaw from "../data/role-families.json";
import roleMappingRaw from "../data/role-mapping.json";
import skillGraphRaw from "../data/skill-graph.json";
import { CareerDojoApp } from "./CareerDojoApp";
import type {
  Company,
  InterviewQuestion,
  Profile,
  RoleFamily,
  SkillNode,
} from "./types";

type RawCompany = Omit<Company, "roleFamilyIds">;

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
  ...(usCompaniesRaw as unknown as RawCompany[]),
  ...(cnCompaniesRaw as unknown as RawCompany[]),
].map((company) => ({
  ...company,
  roleFamilyIds: mapRoleFamilies(company),
}));
const roles = roleFamiliesRaw.roleFamilies as unknown as RoleFamily[];
const skills = skillGraphRaw.skills as unknown as SkillNode[];
const questions = questionsRaw.questions as unknown as InterviewQuestion[];
const profile = profileRaw as unknown as Profile;

export default function Home() {
  return (
    <CareerDojoApp
      companies={companies}
      roles={roles}
      skills={skills}
      questions={questions}
      profile={profile}
    />
  );
}

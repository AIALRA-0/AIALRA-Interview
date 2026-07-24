import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const hanPattern = /[\u3400-\u9fff]/;
const latinPattern = /[A-Za-z]/;

async function json(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

function resolveNames(company, labels) {
  const sourceNameIsChinese = hanPattern.test(company.name);
  const aliasEn = company.aliases.find((alias) => latinPattern.test(alias));
  const aliasZh = company.aliases.find((alias) => hanPattern.test(alias));
  return {
    en: sourceNameIsChinese
      ? labels.companyNameEn[company.id] || aliasEn
      : labels.companyNameEn[company.id] || company.name,
    zh: sourceNameIsChinese
      ? company.name
      : labels.companyNameZh[company.id] || aliasZh,
  };
}

test("organization tree has complete reviewed bilingual label coverage", async () => {
  const [usCompanies, cnCompanies, labels, categoriesEn, categoriesZh] =
    await Promise.all([
      json("data/companies.us.json"),
      json("data/companies.cn.json"),
      json("data/organization-labels.json"),
      json("data/organization-category-labels.en.json"),
      json("data/organization-category-labels.zh.json"),
    ]);
  const companies = [...usCompanies, ...cnCompanies];
  const ids = new Set(companies.map((company) => company.id));
  const typeIds = [
    ...new Set(companies.map((company) => company.companyType)),
  ].sort();
  const categoryIds = [
    ...new Set(companies.flatMap((company) => company.categories)),
  ].sort();
  const categoryLabels = {
    ...categoriesEn.labels,
    ...categoriesZh.labels,
  };
  const canonicalCategoryGroups = new Map();
  for (const category of categoryIds) {
    const canonicalId = categoryLabels[category].en
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[\s\-–—_/（）()，,：:·.]/g, "");
    const values = canonicalCategoryGroups.get(canonicalId) || [];
    values.push(category);
    canonicalCategoryGroups.set(canonicalId, values);
  }

  assert.equal(companies.length, 529);
  assert.deepEqual(
    Object.keys(labels.companyTypes).sort(),
    typeIds,
    "every organization-type node must have one bilingual label",
  );
  assert.deepEqual(
    Object.keys(categoryLabels).sort(),
    categoryIds,
    "every industry-category node must have one bilingual label",
  );
  assert.deepEqual(Object.keys(labels.regionGroups).sort(), [
    "CN",
    "Global",
    "US",
  ]);
  assert.equal(canonicalCategoryGroups.size, 303);
  assert.equal(
    [...canonicalCategoryGroups.values()].filter((values) => values.length > 1)
      .length,
    30,
  );
  assert.deepEqual(
    canonicalCategoryGroups.get("advancedpackaging")?.sort(),
    ["advanced-packaging", "先进封装"].sort(),
  );

  let bilingual = 0;
  let englishOnly = 0;
  const resolvedNamesEn = [];
  const resolvedNamesZh = [];
  const resolvedById = new Map();
  for (const company of companies) {
    const resolved = resolveNames(company, labels);
    resolvedById.set(company.id, resolved);
    assert.ok(resolved.en && latinPattern.test(resolved.en));
    assert.doesNotMatch(resolved.en, hanPattern);
    resolvedNamesEn.push(resolved.en.trim().toLowerCase());
    if (resolved.zh) {
      assert.match(resolved.zh, hanPattern);
      resolvedNamesZh.push(resolved.zh.trim().toLowerCase());
      bilingual += 1;
    } else {
      englishOnly += 1;
    }
  }

  assert.equal(bilingual, 429);
  assert.equal(englishOnly, 100);
  assert.equal(new Set(resolvedNamesEn).size, resolvedNamesEn.length);
  assert.equal(new Set(resolvedNamesZh).size, resolvedNamesZh.length);
  assert.deepEqual(resolvedById.get("synopsys"), {
    en: "Synopsys",
    zh: "新思科技",
  });
  assert.deepEqual(resolvedById.get("cn-empyrean"), {
    en: "Empyrean Technology",
    zh: "华大九天",
  });
  assert.deepEqual(resolvedById.get("cn-vivo"), {
    en: "vivo",
    zh: undefined,
  });
  assert.deepEqual(resolvedById.get("sifive"), {
    en: "SiFive",
    zh: undefined,
  });
  assert.deepEqual(resolvedById.get("cn-starfive"), {
    en: "StarFive Technology",
    zh: "赛昉科技",
  });
  assert.ok(
    Object.keys(labels.companyNameEn).every((id) => ids.has(id)),
    "organization-name overrides must not reference removed nodes",
  );

  for (const [id, label] of Object.entries({
    ...labels.regionGroups,
    ...labels.companyTypes,
    ...categoryLabels,
  })) {
    assert.ok(label.en && latinPattern.test(label.en), `${id} lacks English`);
    assert.ok(label.zh && hanPattern.test(label.zh), `${id} lacks Chinese`);
  }
});

test("every organization-name surface uses the canonical bilingual renderer", async () => {
  const [component, page, types] = await Promise.all([
    readFile(new URL("app/CareerDojoApp.tsx", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/types.ts", root), "utf8"),
  ]);

  assert.match(types, /\bnameEn: string;/);
  assert.match(types, /\bnameZh\?: string;/);
  assert.match(types, /\bopportunityMarket: "US" \| "CN" \| "Global";/);
  assert.match(page, /Organization \$\{company\.id\} needs an English name/);
  assert.match(component, /function CompanyName\(/);
  assert.ok(
    (component.match(/<CompanyName\b/g) || []).length >= 6,
    "all major organization-name surfaces should use CompanyName",
  );
  assert.match(component, /company\.nameEn/);
  assert.match(component, /company\.nameZh \|\| ""/);
  assert.match(component, /company\.categories\.map\(categoryLabel\)/);
  assert.match(component, /function canonicalCategoryId\(/);
  assert.match(component, /selectedCategoryValues\?\.has\(item\)/);
  assert.match(component, /\.\.\.company\.requirements/);
  assert.match(component, /\.\.\.company\.gaps/);
  assert.doesNotMatch(
    component,
    />\s*\{(?:selectedCompany|company)\.name\}\s*</,
    "raw monolingual company.name must not be rendered",
  );
});

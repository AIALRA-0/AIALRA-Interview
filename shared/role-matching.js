/**
 * Match a role keyword against the normalized organization search surface.
 * Short ASCII abbreviations require token boundaries so terms such as STA,
 * ATE, RF, SoC, and CAD cannot match unrelated words such as standards,
 * private-company, performance, society, or academy.
 *
 * @param {string} searchable
 * @param {string} keyword
 */
export function matchesRoleKeyword(searchable, keyword) {
  const normalizedKeyword = String(keyword)
    .normalize("NFKC")
    .trim()
    .toLowerCase();
  if (!normalizedKeyword) return false;

  if (/^[a-z0-9]+$/.test(normalizedKeyword) && normalizedKeyword.length <= 4) {
    const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(
      searchable,
    );
  }

  return searchable.includes(normalizedKeyword);
}

/**
 * @param {{
 *   companyType?: string;
 *   categories?: string[];
 *   focusAreas?: string[];
 *   roleFamilies?: string[];
 * }} organization
 * @param {{ roleFamilyId: string; keywords: string[] }[]} rules
 */
export function mappedRoleFamilyIds(organization, rules) {
  const searchable = [
    organization.companyType || "",
    ...(organization.categories || []),
    ...(organization.focusAreas || []),
    ...(organization.roleFamilies || []),
  ]
    .join(" ")
    .normalize("NFKC")
    .toLowerCase();

  return rules
    .filter((rule) =>
      rule.keywords.some((keyword) =>
        matchesRoleKeyword(searchable, String(keyword)),
      ),
    )
    .map((rule) => rule.roleFamilyId);
}

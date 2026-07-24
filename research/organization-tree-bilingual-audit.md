# Organization-tree bilingual audit

Audit date: **2026-07-23**

## Display contract

The organization atlas uses one rule across the tree, cards, target radar,
shortlist, evidence view, details, and newly saved application records:

- when a reviewed Chinese name exists, show `中文名 / English name`;
- when the organization genuinely operates under an English-only name, show
  the English name once;
- do not treat a product, acquired company, former name, or unrelated alias as
  a translation;
- never expose internal taxonomy slugs such as `public-company` to the user.

The opportunity-market field is explicit. It does not infer the market from a
country or region substring, so organizations headquartered outside the United
States can still belong to the U.S.-first opportunity universe without being
misclassified.

## Audited coverage

| Layer | Coverage |
|---|---:|
| Opportunity-market roots | 3 / 3 bilingual |
| Organization types | 20 / 20 bilingual |
| Industry categories | 333 / 333 bilingual |
| Canonical category filters | 303 |
| Cross-market category alias groups merged | 30 |
| Organization leaves | 529 / 529 reviewed |
| Chinese/English organization-name pairs | 429 |
| Explicit English-only organization names | 100 |
| Chinese-only silent fallbacks | 0 |

The 429 bilingual leaves comprise 157 U.S.-first organizations with reviewed
Chinese names and 272 China-first organizations with an English name or
recognized English abbreviation. The 100 English-only decisions comprise 99
U.S.-first organizations without a dependable Chinese brand name and `vivo`,
whose canonical brand is already the Latin-script name.

## Runtime behavior

- Chinese and English organization names resolve to the same organization.
- Equivalent cross-market categories such as `advanced-packaging` and `先进封装`
  share one filter option and return the union of both raw category IDs.
- Search also covers bilingual organization types, bilingual industry
  categories, opportunity markets, locations, focus areas, opportunity types,
  requirements, candidate gaps, aliases, and relevance analysis.
- Existing application records are rendered through the current canonical
  organization label when their organization ID still exists; the stored name
  remains only as a fallback for removed nodes.
- Long bilingual organization and taxonomy labels wrap onto two lines in the
  tree instead of truncating the secondary language.

## Release gate

The deterministic data audit fails when:

- any reviewed organization lacks a usable English name;
- a Chinese-source organization silently falls back to Chinese-only display;
- an organization-type or industry-category label is missing or extra;
- equivalent category labels stop resolving to one canonical filter group;
- an English label contains Chinese characters, or a Chinese label lacks
  Chinese characters;
- the reviewed bilingual and English-only coverage counts drift;
- an organization-name override references a removed organization.
- two different organizations resolve to the same canonical English or Chinese
  name.

The organization-label regression test additionally verifies representative
U.S.-first, China-first, and English-only organizations and prevents direct
rendering of the old monolingual `company.name` field.

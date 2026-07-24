# Organization profile bilingual, atomic-taxonomy, and layout audit

Audit date: **2026-07-23**

Scope:

- the organization atlas and organization-detail modal in
  `app/CareerDojoApp.tsx`;
- the detail-modal styles in `app/globals.css`;
- all 529 organization records in `data/companies.us.json` and
  `data/companies.cn.json`;
- the 15 canonical role families and the existing organization label catalogs;
- the supplied NIST CHIPS R&D screenshot at a desktop-sized viewport.

This is a pre-implementation contract. It separates three different problems
that are currently coupled in one UI: translation, taxonomy atomization, and
responsive layout.

## Executive findings

1. Organization names, market roots, organization types, and industry
   categories already have reviewed bilingual label coverage. Most content
   inside an organization card or modal does not. The U.S. records are almost
   entirely English-only, while the China records are almost entirely
   Chinese-only.
2. There is no organization-description field. `whyRelevant` explains why the
   target may matter to the candidate; it does not explain what the
   organization is or does.
3. The organization arrays contain **3,194 unique raw content strings** across
   focus areas, opportunity types, requirements, gaps, and role labels. They
   are not paired translations.
4. The modal renders raw array strings directly. Consequently, a bilingual UI
   shell cannot make the modal bilingual without a bilingual content model.
5. Compound labels are systemic, not a one-off NIST defect. The five raw tag
   and list fields contain hundreds of `/`, `and`, `与`, `和`, `及`, and `、`
   forms. The 15 canonical role families also contain nine multi-scope names.
6. The current two-column grid stretches the shorter card to the height of its
   longer row peer. The supplied screenshot visibly shows empty lower halves
   in short cards. The title block also lets a long organization/program name
   dominate the first viewport.
7. Atomization must preserve logical relationships. Splitting `A or B` into
   two ordinary tags would incorrectly imply that both are required. The data
   model needs `all-of`, `any-of`, and qualifier relationships, not only a
   string-splitting function.

## Measured content inventory

Counts below are computed from the current 256 U.S.-first and 273 China-first
records. “Chinese-bearing” means that the raw value contains at least one Han
character. Pattern columns overlap and therefore must not be summed.

| Field             | Occurrences | Unique | Chinese-bearing | Latin/non-Han | English `and` | Chinese conjunction/list (`与和及、`) | `&` | `/` |
| ----------------- | ----------: | -----: | --------------: | ------------: | ------------: | ------------------------------------: | --: | --: |
| Focus areas       |       1,522 |  1,143 |             514 |           629 |            23 |                                   212 |   5 |  34 |
| Opportunity types |       1,223 |    137 |              84 |            53 |             0 |                                     0 |   0 |  33 |
| Requirements      |       1,231 |    724 |             259 |           465 |             3 |                                   256 |   0 | 259 |
| Candidate gaps    |         802 |    764 |             287 |           477 |            19 |                                   192 |   0 |  96 |
| Raw role labels   |       2,277 |    573 |             344 |           229 |             0 |                                    65 |   1 | 112 |

Additional translation scope:

| Surface                                       | Current unique values | Current state                                                    |
| --------------------------------------------- | --------------------: | ---------------------------------------------------------------- |
| Union of the five fields above                |                 3,194 | 1,467 Chinese-bearing; 1,727 non-Han; no paired content contract |
| Five fields + `whyRelevant` + evidence titles |                 4,267 | 2,017 Chinese-bearing; 2,250 non-Han                             |
| `whyRelevant`, U.S.                           |                   256 | 256 English-only                                                 |
| `whyRelevant`, China                          |                   273 | 273 Chinese-only                                                 |
| Evidence titles, U.S.                         |                   265 | 265 English-only                                                 |
| Evidence titles, China                        |                   279 | 277 Chinese-bearing; 2 English-only                              |
| Evidence types                                |                    38 | raw implementation slugs such as `official-current-job`          |
| Locations                                     |                   230 | 69 Chinese-bearing; 161 non-Han                                  |
| Countries                                     |                    18 | all English                                                      |
| New organization descriptions                 |     529 organizations | field is absent; requires 529 Chinese and 529 English texts      |

The upper-bound migration before deduplication/atomization is therefore 4,267
translation counterparts plus 1,058 new description texts. A canonical atom
dictionary should reduce the repeated tag portion substantially; the 529
descriptions and 529 candidate-relevance explanations remain organization
specific.

The 333 existing industry-category labels are bilingual. Seventeen category
labels nevertheless contain a compound pattern. Some are fixed industry terms
and some are genuinely over-broad categories; they need a semantic review, not
a blind regex rewrite.

## Visible bilingual audit

### Already compliant or intentionally exempt

- Opportunity-market roots, organization types, and category labels resolve
  through bilingual catalogs.
- Reviewed organization names use a Chinese primary line and English secondary
  line. A genuinely English-only brand is intentionally shown once.
- Organization-tree roots and type nodes are bilingual.
- Visa/export screening signals are bilingual.
- Codes and dates (`P0`, `P3`, ISO dates) are language-neutral, although a
  bilingual explanation should be available beside or behind each code.
- Official organization names may remain in their official language when no
  recognized translated name exists. This exception applies only to the proper
  name, not to the organization description or analysis.

### Organization atlas: remaining single-language surfaces

| Surface                          | Current rendering                      | Required rendering                                                          |
| -------------------------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| Atlas navigation/top heading     | Chinese-only labels such as `公司宇宙` | paired Chinese/English label                                                |
| Search label and placeholder     | Chinese-only                           | `搜索 / Search`; bilingual placeholder                                      |
| Region filter accessible name    | Chinese-only `地区筛选`                | bilingual accessible name                                                   |
| Eligibility filter label/options | Chinese-only                           | bilingual label and all options                                             |
| Result count                     | Chinese-only `个匹配节点`              | bilingual count grammar                                                     |
| Result-scope explanation         | Chinese-only                           | complete Chinese and English sentence                                       |
| Card-layout toggle               | Chinese-only `档案卡`                  | `档案卡 / Cards`                                                            |
| Card summary                     | raw `whyRelevant`, one language        | separate bilingual organization overview; candidate relevance follows below |
| Difficulty                       | raw `A`/`B` or Chinese fallback        | bilingual named scale plus stable code                                      |
| Confidence                       | Chinese-only derived label             | bilingual confidence label                                                  |
| Bookmark accessible name         | Chinese-only                           | bilingual accessible name                                                   |
| Open-profile action              | Chinese-only                           | bilingual action                                                            |
| Load-more action                 | Chinese-only                           | bilingual action and count                                                  |

### Organization detail: remaining single-language surfaces

| Surface                      | Current rendering                                                    | Required rendering                                                                 |
| ---------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Dialog close accessible name | `关闭公司档案`                                                       | `关闭组织档案 / Close organization profile`                                        |
| Confidence                   | `高置信`, `中置信`, or `待核验`                                      | bilingual                                                                          |
| Scope notice                 | Chinese prose with an exposed English evidence slug                  | complete Chinese and English copy; friendly bilingual evidence-type name           |
| Main summary                 | raw `whyRelevant`                                                    | organization overview in both languages; candidate relevance in a distinct section |
| Canonical role chips         | bilingual text but compound scopes                                   | bilingual atomic role chips                                                        |
| Section headings             | `重点方向`, `机会形态`, `常见要求`, `你的补强点`                     | paired Chinese/English headings                                                    |
| Focus areas                  | raw one-language strings                                             | bilingual atom references                                                          |
| Opportunity types            | raw one-language strings, often with slash and qualifier in one chip | bilingual opportunity atoms with qualifiers rendered separately                    |
| Requirements                 | raw one-language strings                                             | bilingual requirement groups preserving `all-of`/`any-of`                          |
| Candidate gaps               | raw one-language strings                                             | bilingual prose or atomic gap entries                                              |
| Evidence heading             | Chinese-only                                                         | bilingual                                                                          |
| Evidence type                | raw slug                                                             | bilingual evidence-type catalog                                                    |
| Evidence title               | source language only                                                 | translated title plus original title; do not overwrite the original                |
| Career-page action           | Chinese-only                                                         | bilingual                                                                          |
| Bookmark/application actions | Chinese-only                                                         | bilingual                                                                          |

### Requisition builder inside the organization modal

The modal is still non-compliant after opening the requisition builder:

- `REQUISITION RECORD` is English-only;
- the heading and explanatory paragraph are Chinese-only;
- field labels are Chinese-only or inconsistently mixed;
- opportunity options expose English slugs;
- sponsorship/export options expose color slugs;
- Cancel, Save, Bookmark, and Create-record actions are Chinese-only.

All of these are deterministic UI vocabulary and should live in a small
bilingual interface catalog. Color must not be the user-facing meaning of a
screening status.

## Organization overview contract

Every organization or research node needs a distinct overview, not a rewritten
`whyRelevant`.

Each overview must answer, in this order:

1. what kind of entity it is;
2. its main products, research mission, or public function;
3. the technical domains relevant to this atlas;
4. where the candidate would enter the organization, if that differs from the
   parent organization.

Recommended content limits:

- Chinese: 45–160 Han characters;
- English: 70–280 words is too long for a card, so use **35–85 words**;
- card preview: two to four lines, with an explicit “read full overview” path;
- no recruitment claim unless backed by current-job evidence;
- no template-only descriptions such as “a company in the semiconductor
  industry.”

Candidate fit belongs in a separate bilingual `relevance` field. A federal
program, university lab, association, open-source project, and employer must
not all be described as a “company.”

Suggested shape:

```ts
type LocalizedText = {
  zh: string;
  en: string;
};

type OrganizationProfileContent = {
  description: LocalizedText;
  relevance: LocalizedText;
  focusAtomIds: string[];
  opportunityEntries: OpportunityEntry[];
  requirementGroups: RequirementGroup[];
  gapEntries: LocalizedText[];
};
```

## Atomic-label contract

### What “atomic” means

An atomic tag names one independently searchable, independently filterable
concept. It does not contain a list, an alternative, a consequence, or a
qualification.

Examples:

- `物理设计 / Physical Design`
- `静态时序分析（STA） / Static Timing Analysis (STA)`
- `量产测试 / Production Test`
- `设备自动化 / Equipment Automation`

The following are not atomic tags:

- `Physical Design and Static Timing Analysis`
- `RTL/FPGA`
- `校招/实习（以官网为准）`
- `federal employment (eligibility review required)`

### Preserve relationships instead of flattening them

```ts
type ConceptAtom = {
  id: string;
  kind: "domain" | "skill" | "role" | "opportunity" | "constraint";
  label: LocalizedText;
  aliases?: string[];
};

type RequirementGroup = {
  relation: "single" | "all-of" | "any-of";
  atomIds: string[];
  note?: LocalizedText;
};

type OpportunityEntry = {
  opportunityAtomId: string;
  qualifierAtomIds?: string[];
  note?: LocalizedText;
};
```

- `A and B` becomes two atoms in an `all-of` group only when the source really
  requires both.
- `A or B` becomes two atoms in an `any-of` group. Two ordinary chips would
  falsely imply both are required.
- A slash is never interpreted without context. It may mean `and`, `or`, a
  lexical fixed term, or an official name.
- Parenthetical text such as `eligibility review required` is a qualifier, not
  part of the opportunity-type tag.
- Natural prose may use conjunctions. The no-compound rule applies to tags and
  filter labels, not to grammatical descriptions or evidence titles.

### Protected terms and names

Do not split:

- official organization names, for example `National Institute of Standards
and Technology`;
- official program/product/source titles;
- recognized lexical terms such as `R&D`, `I/O`, `SerDes`, `TCP/IP`, and
  `CHIPS R&D`;
- legal names containing `&`, for example `Kulicke & Soffa`.

Protection must be typed data (`kind: "proper-name"` or
`kind: "fixed-term"`) with a reason/source, not an ever-growing regex allowlist.
Proper names and evidence titles should not enter the tag-atom pipeline at all.

Context-sensitive examples:

| Raw label                              | Required treatment                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `ADC/DAC`                              | two atoms: ADC and DAC                                                                   |
| `CDC/RDC`                              | two atoms: Clock-Domain Crossing and Reset-Domain Crossing                               |
| `C/C++/Python`                         | alternatives or a sourced requirement group; never one skill tag                         |
| `AC-DC与功率管理`                      | AC–DC Conversion + Power Management                                                      |
| `CI/CD`                                | Continuous Integration + Continuous Delivery/Deployment, with the exact sourced relation |
| `SerDes` / `Serializer/Deserializer`   | one fixed technical term                                                                 |
| `R&D`                                  | one fixed lexical term                                                                   |
| official source title containing `and` | preserve title and add a translated title                                                |

### Screenshot-specific corrections

The NIST record demonstrates three concrete semantic defects:

1. `物理设计与 STA / Physical Design and Static Timing Analysis`
   becomes two tags: Physical Design and Static Timing Analysis.
2. `DFT 与量产测试 / Design for Test` is not only compound; its languages
   disagree. It becomes `可测性设计 / Design for Test (DFT)` and
   `量产测试 / Production Test`.
3. `半导体制造与设备自动化 / Semiconductor Manufacturing and Equipment
Automation` becomes two tags: `半导体制造 / Semiconductor Manufacturing`;
   `设备自动化 / Equipment Automation`.

The record title also conflates an organization and a program. Prefer:

- organization: `美国国家标准与技术研究院 / National Institute of
Standards and Technology`;
- program or node: `CHIPS 研发计划 / CHIPS R&D Program`.

This prevents a concatenated Chinese title and makes the organization/program
relationship explicit.

### Canonical role-family decomposition

The underlying role-family ID may remain an umbrella for question-bank
mapping. Its visible chips must resolve to atomic role concepts:

| Current role family                                                           | Visible atomic concepts                                        |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| EDA 研发与算法 / EDA Research & Development                                   | EDA R&D; EDA Algorithms                                        |
| CAD 与设计流程 / CAD and Design Flow Engineering                              | CAD Engineering; Design Flow Engineering                       |
| 数字验证、UVM 与形式验证 / Design Verification, UVM, and Formal               | Design Verification; UVM; Formal Verification                  |
| 计算机体系结构、性能与存储 / Computer Architecture, Performance, and Memory   | Computer Architecture; Performance Engineering; Memory Systems |
| 物理设计与 STA / Physical Design and Static Timing Analysis                   | Physical Design; Static Timing Analysis                        |
| DFT 与量产测试 / Design for Test                                              | Design for Test; Production Test                               |
| 模拟与定制 IC / Analog and Custom IC Design                                   | Analog IC Design; Custom IC Design                             |
| 嵌入式系统与固件 / Embedded Systems and Firmware                              | Embedded Systems; Firmware Engineering                         |
| 半导体制造与设备自动化 / Semiconductor Manufacturing and Equipment Automation | Semiconductor Manufacturing; Equipment Automation              |

The other six families are already single-scope at this display level.

### Existing category labels needing review

Likely split:

- Imaging and AI
- Robotics and Manufacturing
- Standards and Industry Research
- Standards and Testing
- Speech and Large Models
- Metrology and Inspection
- Radar and Electronic Systems
- Test and Measurement
- Power Management and Power Electronics where currently collapsed into
  `Power Technology`

Likely fixed-term protection or relabeling:

- CHIPS R&D
- OSAT
- SerDes
- TCAD
- Public R&D

`CDC/RDC` should not be protected as one atom; it is two independently useful
verification domains.

## Bilingual semantic-parity rules

1. Chinese and English must resolve from the same concept ID. Do not maintain
   two free-form arrays whose order may drift.
2. The number of concepts and their logical relation must match in both
   languages.
3. An acronym is included consistently on both sides:
   `静态时序分析（STA） / Static Timing Analysis (STA)`.
4. A missing translation is a build failure for descriptions, relevance,
   taxonomy atoms, requirement/gap copy, opportunity labels, UI labels, and
   evidence-type labels.
5. The only English-only display exception is an official proper name without
   a dependable Chinese name. Its description and analysis are still
   bilingual.
6. Evidence keeps `titleOriginal` and its language, plus a reviewed translated
   title. Translation must not overwrite the official title.
7. Do not expose a raw slug as a fallback. Missing catalog entries fail the
   audit.
8. `whyRelevant` and `description` may not be the same text. They answer
   different user questions.

## Layout diagnosis from the supplied screenshot

### Root causes in the current CSS/markup

- `.detail-modal` is capped at 920 CSS pixels, while a long bilingual title,
  avatar, status metadata, and close control share one header row.
- `.modal-header h2` uses one large typographic context for both name lines.
  Long Chinese program names have no semantic break between organization and
  program.
- `.modal-columns` is a two-column CSS grid. Grid items stretch by default, so
  the shorter card receives a large empty lower area when its row peer is
  taller.
- Bilingual role labels are joined into a single inline chip with `/`.
  Long compound concepts create very wide chips.
- Section headings and body copy use very small fixed sizes while the name is
  comparatively large, creating a compressed-body/oversized-header hierarchy.
- Evidence titles use `white-space: nowrap` and ellipsis, which hides the most
  useful part of long official titles.
- The close control is absolutely positioned and does not remain available
  after the modal scrolls.
- The mobile breakpoint changes the modal to a bottom sheet, but it does not
  provide a dedicated long-title/header layout or safe-area padding.

## Required layout structure

Recommended content order:

1. compact sticky dialog bar: entity kind, close action;
2. organization/program identity with controlled Chinese and English lines;
3. status metadata;
4. bilingual organization overview;
5. bilingual candidate relevance;
6. atomic role and focus concepts;
7. opportunity, requirement, and gap sections;
8. evidence;
9. requisition/action controls.

The summary and organization overview should not be one oversized quote block.
Use two named, bilingual sections so the user can answer both “what does this
organization do?” and “why is it relevant to me?”

For the four analysis cards:

- use content-height cards (`align-self: start`) rather than stretched grid
  cards;
- preferably group them as independent vertical stacks or use a responsive
  auto-fit grid with non-stretching items;
- preserve logical source order on mobile;
- do not use experimental CSS masonry as a release dependency.

Tags should render Chinese and English on two lines within a compact chip,
rather than concatenating two long labels with `/`.

## Visual acceptance criteria

### Desktop: 1440 × 900 and 1920 × 1080

- Dialog width is between 960 and 1180 CSS pixels, with at least 24 pixels of
  viewport margin.
- Dialog height never exceeds the viewport; only the dialog body scrolls.
- Close action remains visible while scrolling.
- Long organization and program names never collide with the close action,
  avatar, or status row.
- A long Chinese name uses at most two identity lines and its English
  counterpart at most two lines at 1440 pixels; neither is truncated.
- Body copy has a readable line length of approximately 55–75 characters.
- No analysis card is stretched merely to match the height of its row peer.
- Evidence titles wrap to at least two lines instead of ellipsizing the full
  title.
- Bilingual chips wrap internally and never force horizontal page scrolling.
- The first viewport shows the identity, overview, status, and at least the
  start of the technical profile; the title must not consume most of the
  viewport.

### Tablet: 768 × 1024

- Two columns are used only when each card retains at least 280 CSS pixels of
  content width.
- Identity metadata can wrap onto multiple rows without overlap.
- The dialog has no horizontal scrollbar.

### Mobile: 390 × 844 and minimum 320 × 568

- One content column only.
- Dialog uses `100dvh` with safe-area padding and no content hidden behind the
  browser or device inset.
- Close action has a minimum 44 × 44 CSS-pixel hit target and does not overlay
  the name.
- Chinese primary and English secondary copy remain visible; no language is
  hidden to save space.
- Body text is at least 14 CSS pixels and secondary text at least 12 CSS
  pixels.
- Every chip may occupy full width and wraps without clipping.
- Form controls and actions are at least 44 CSS pixels tall.
- `document.documentElement.scrollWidth === clientWidth` and the modal body's
  `scrollWidth === clientWidth`.

### Accessibility and interaction

- Dialog receives focus, closes with Escape, traps focus, and restores focus to
  the trigger.
- Chinese and English spans use `lang="zh-CN"` and `lang="en"`.
- Every visible control and accessible name is bilingual.
- Status meaning is conveyed by text, not color alone.
- Layout remains usable at 200% browser zoom and with reduced motion.

## Automated release gates

### Data-contract tests

1. Every organization has non-empty `description.zh`,
   `description.en`, `relevance.zh`, and `relevance.en`.
2. Every organization references at least one focus atom and one canonical
   role atom.
3. Every referenced atom exists and has both labels.
4. All tag-bearing fields contain atom IDs, never free-form display strings.
5. Every requirement group has a valid relation; `any-of` and `all-of` groups
   contain at least two distinct atoms.
6. Opportunity qualifiers are not embedded in the opportunity label.
7. Every evidence type resolves to a bilingual catalog entry.
8. Every evidence item has an original title and a bilingual display pair.
9. No organization description equals its relevance text after normalization.
10. Proper-name/fixed-term exceptions include an explicit kind and reason.

### Compound-label test

Run the compound check only against canonical tag labels, not prose or official
titles. After removing explicitly typed fixed terms, reject:

- the word `and`;
- standalone `&`;
- semantic slash separators;
- Chinese list/conjunction separators `与`, `和`, `及`, `、`;
- comma-separated concept lists.

Do not solve failures by adding strings to an allowlist. Either split the
concept, model its relation, relabel it as one accurate atom, or classify it as
a sourced fixed term/proper name.

### Bilingual-parity tests

- The same atom IDs drive both language lines.
- No non-proper content silently falls back from one language to the other.
- A semantic parity fixture explicitly covers the current mismatch
  `DFT 与量产测试 / Design for Test`.
- Representative fixtures cover an English-first employer, a China-first
  state-owned enterprise, a research institute, a university lab, a federal
  program, and an English-only official name.

### Static UI tests

- Detail tag rows may not render `selectedCompany.focusAreas`,
  `opportunityTypes`, or raw `roleFamilies` directly.
- Evidence type slugs may not be rendered directly.
- All organization-detail headings and actions resolve through the bilingual
  UI-label catalog.
- `CompanyName` remains the only organization-name renderer.

### Browser/visual tests

Use at least these fixtures:

1. NIST + CHIPS R&D: longest organization/program identity and restricted
   eligibility;
2. an English-only organization name;
3. a long China state-owned enterprise name;
4. an organization with eight requirements and eight gaps;
5. an organization with six evidence entries;
6. a record with `any-of` requirements and opportunity qualifiers.

For each required viewport, assert no overflow, no close/title overlap, no
ellipsized evidence title, visible bilingual overview, and non-stretched
analysis cards. Store reference screenshots for desktop, tablet, and mobile.

## Recommended implementation order

1. Introduce localized profile content, atom dictionaries, relation groups,
   and evidence-type labels.
2. Migrate all existing records and fail the build on missing bilingual
   content.
3. Decompose canonical role display concepts and high-frequency category
   concepts.
4. Replace direct raw-string rendering with atom/localized-text components.
5. Add the organization overview and separate candidate-relevance section.
6. Rebuild the modal header and content-height analysis layout.
7. Bilingualize the atlas controls and requisition builder.
8. Add data, static, semantic-parity, and visual release gates.
9. Verify the six fixtures at all required viewport sizes before deployment.

No test file is added by this audit because the target content schema is about
to change. Adding a test against the current raw-string schema would either
bless the defect or intentionally break the shared branch before the migration
lands.

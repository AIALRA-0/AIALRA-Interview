# Organization-level bilingual profile content audit

Date: 2026-07-24

## Scope and result

This audit covers every organization present in the two existing source catalogs at generation time:

| Source catalog           | Organizations |
| ------------------------ | ------------: |
| `data/companies.us.json` |           256 |
| `data/companies.cn.json` |           273 |
| Total                    |           529 |

The resulting `data/organization-profile-content.json` contains one profile for every source ID and no extra profile. Every profile has four non-empty fields:

- `descriptionZh`
- `descriptionEn`
- `relevanceZh`
- `relevanceEn`

The JSON is an ID-keyed catalog under `profiles`, so application code can look up a profile without changing the source company records.

## Content contract

Each description answers what the organization does using only facts already present in its source record:

- organization type;
- normalized bilingual categories;
- up to five atomic focus areas;
- the presence of cited evidence.

Each relevance paragraph explains how the organization intersects the semiconductor, EDA, hardware, or automation search using only:

- canonical bilingual role atoms derived from the existing role-mapping rules;
- the source record’s `whyRelevant` assessment.

No profile infers a product, live opening, internship, visa status, security eligibility, or sponsorship promise. Where the source record distinguishes a research program from a job, the profile preserves that distinction.

Chinese and English are assembled from the same fact vector. Organization-specific focus and relevance fragments are translated with organization names protected, then placed into independently written Chinese and English sentence structures. This avoids making one language a literal copy of the other while keeping their meaning aligned.

## Completeness checks

| Check                 | Result |
| --------------------- | -----: |
| Source IDs            |    529 |
| Duplicate source IDs  |      0 |
| Output profiles       |    529 |
| Missing source IDs    |      0 |
| Extra output IDs      |      0 |
| Empty required fields |      0 |

## Full-text uniqueness

Exact full-text duplication is measured separately for each language and purpose. A duplicate means two organization IDs have the same complete field value.

| Field           | Unique values | Duplicate values | Duplicate rate |
| --------------- | ------------: | ---------------: | -------------: |
| `descriptionZh` |           529 |                0 |         0.000% |
| `descriptionEn` |           529 |                0 |         0.000% |
| `relevanceZh`   |           529 |                0 |         0.000% |
| `relevanceEn`   |           529 |                0 |         0.000% |

The absence of exact duplicates is not achieved by appending IDs. Every text contains organization-specific type, category, focus, role, or relevance facts.

## Length distribution

Lengths are Unicode character counts, not token counts.

| Field           | Minimum | Mean | Maximum |
| --------------- | ------: | ---: | ------: |
| `descriptionZh` |      51 |   84 |     140 |
| `descriptionEn` |     176 |  273 |     397 |
| `relevanceZh`   |      61 |   92 |     134 |
| `relevanceEn`   |     209 |  293 |     415 |

## Language and readability rules

The final catalog was checked against the following global rules:

| Rule                                                                                                                                                                                                   | Violations |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------: |
| Unresolved generation placeholders, `undefined`, or `null` text                                                                                                                                        |          0 |
| ASCII list punctuation `, : ;` in Chinese prose                                                                                                                                                        |          0 |
| Missing space at a Chinese–Latin technical-term boundary                                                                                                                                               |          0 |
| Semantically repeated Chinese parenthetical, such as `术语（术语）`                                                                                                                                    |          0 |
| Known Chinese artifacts such as `知识产权核`, `官方早期职业`, `包装` for semiconductor packaging, `铸造厂` for foundry, or `代理工具` for agentic tooling                                              |          0 |
| Known English template artifacts such as `a cited official careers`, `a cited official research`, `among public company organizations`, `Analog a complete`, `high high technical`, or `an university` |          0 |

Normalization applied before release includes:

- splitting slash-, conjunction-, semicolon-, and enumeration-joined focus strings into atomic concepts before prose composition;
- using Chinese full-width punctuation;
- inserting readable spaces around English acronyms and technical terms in Chinese;
- removing redundant translated parentheticals;
- preserving organization names through translation;
- applying semiconductor-context corrections for `packaging` → `封装`, `foundry` → `晶圆代工`, `architecture` → `架构`, `analog` → `模拟`, and `agentic` → `智能体`;
- using countable, grammatical evidence wording instead of phrases such as `a cited official careers`.

## Manual bilingual sample

All four fields were manually inspected for the following cross-section. The review checked organization identity, “what it does,” role relevance, Chinese–English semantic agreement, technical terminology, and the absence of unsupported job claims.

| ID                              | Coverage reason                                             | Result |
| ------------------------------- | ----------------------------------------------------------- | ------ |
| `synopsys`                      | U.S. EDA, simulation, IP, AI for EDA                        | Pass   |
| `mathworks`                     | Engineering software, model-based design, HDL workflow      | Pass   |
| `sifive`                        | Private semiconductor IP and RISC-V ecosystem               | Pass   |
| `nist-chips-rd`                 | Federal research agency and program-versus-job boundary     | Pass   |
| `oak-ridge-national-laboratory` | National laboratory, microelectronics, eligibility caveat   | Pass   |
| `apptronik`                     | Private robotics and embedded-control extension             | Pass   |
| `amkor-technology`              | OSAT, advanced packaging, production test                   | Pass   |
| `cn-empyrean`                   | Chinese EDA and full-flow engineering software              | Pass   |
| `cn-smic`                       | Chinese foundry, process, manufacturing                     | Pass   |
| `cn-naura`                      | Chinese semiconductor equipment and automation              | Pass   |
| `cn-cas-ict`                    | Chinese Academy of Sciences research institute              | Pass   |
| `cn-tsinghua-sic`               | University laboratory and integrated-circuit research       | Pass   |
| `cn-huawei`                     | Large systems organization spanning compute, cloud, devices | Pass   |

## Boundary

This file is organization-level background intelligence, not a live-job database. Current openings, internship dates, work authorization, citizenship, security restrictions, and sponsorship must still be verified against the exact official posting.

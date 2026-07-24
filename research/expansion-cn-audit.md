# 中国组织宇宙扩容审计 / China Organization Universe Expansion Audit

证据快照 / Evidence snapshot: 2026-07-23  
数据文件 / Dataset: `data/expansion-cn-candidates.json`  
状态 / Status: integrated into the v4 main universe

## 1. 结论 / Outcome

本轮在现有 `data/companies.cn.json` 的 273 个中国机会市场节点之外，新增并已集成 **166 个无 ID 或规范名称冲突的节点**，使中国机会市场从 273 个增至 439 个节点。

This expansion integrates **166 nodes with no ID or canonical-name collision** against the 273-node China-market baseline, growing the China opportunity market from 273 to 439 nodes.

“全量”在这里仍表示有来源、可审计、可继续补入的覆盖流程，而不是宣称现实世界中永远没有遗漏。候选节点是组织档案，不等同于当前职位；只有具体、在有效期内的招聘公告才能证明某个岗位正在开放。

“Comprehensive” means a sourced and auditable coverage process, not a claim that the real world can never contain an omitted organization. These are organization records, not current job postings; only an exact, unexpired requisition proves that a role is open.

## 2. 规模与结构 / Size and structure

| 维度 / Dimension                                                                     | 数量 / Count |
| ------------------------------------------------------------------------------------ | -----------: |
| 新增候选组织 / New candidate organizations                                           |          166 |
| 公司及集团 / Companies and corporate groups                                          |           89 |
| 研究院所 / Research institutes                                                       |           69 |
| 高校实验室 / University labs                                                         |            5 |
| 创新平台 / Innovation platforms                                                      |            3 |
| 央企体系节点（非互斥）/ Central-SOE-system nodes, non-exclusive                      |          114 |
| 地方国企或地方实验室节点（非互斥）/ Local-state or regional-lab nodes, non-exclusive |           15 |
| 民营企业节点 / Privately owned enterprise nodes                                      |           19 |
| 研究及高校类节点 / Research and academic nodes                                       |           77 |

方向分组为多标签统计，因此不能相加作为总数：

Sector counts are multi-label and therefore do not sum to the total:

| 方向 / Sector                                                                             | 数量 / Count |
| ----------------------------------------------------------------------------------------- | -----------: |
| 航天、航空、船舶、雷达、核技术 / Aerospace, aviation, marine, radar, nuclear              |           30 |
| 通信、计算、网络、云、芯片 / Telecommunications, computing, networking, cloud, chips      |           47 |
| 能源、工业、制造、电池、轨交 / Energy, industrial systems, manufacturing, batteries, rail |           50 |
| 机器人 / Robotics                                                                         |            8 |
| 量子技术 / Quantum technology                                                             |            8 |

本轮重点补入：

- 航天科技、航天科工、航空工业、中国航发、中国船舶、中国电科、中国电子及其专业院所。
- 中国移动、中国电信、中国联通、中国信科及通信设备、光器件和云平台子节点。
- 国家电网、南方电网、国家能源、国家电投、华能、大唐、华电、三峡、中核及相关研究院。
- 北京电控、上海电气、申能、深圳能源、广电运通、上海地铁、广州地铁等地方国企节点。
- 中科院软件、信息工程、声学、物理、电工、空间科学、空间应用、沈阳自动化等研究所。
- 新华三、中科曙光、移远、广和通、中科创达、汇川、机器人、量子和光子计算长尾企业。

## 3. 官方来源骨架 / Authoritative source backbone

种子集合及身份核验优先使用以下官方入口：

- [国务院国资委 2026-07-11 央企名录](https://wap.sasac.gov.cn/n2588045/n27271785/n27271792/c14159097/content.html)
- [中国科学院机构设置](https://www.cas.cn/zz/index.shtml)
- [中国航天科技集团](https://www.spacechina.com/)
- [中国航天科工集团](https://www.casic.cn/)
- [中国航空工业集团](https://www.avic.com/)
- [中国船舶集团](https://www.cssc.net.cn/)
- [中国电子科技集团](https://www.cetc.com.cn/)
- [中国电子信息产业集团](https://www.cec.com.cn/)
- [中国信息通信科技集团](https://www.cict.com/)
- [国家电网招聘平台](https://zhaopin.sgcc.com.cn/)
- [中国移动招聘平台](https://job.10086.cn/)
- [中国电信招聘平台](https://job.chinatelecom.com.cn/)

专业院所若没有稳定的独立网站，使用集团官方成员信息、官方招生资料或官方组织报道作为组织存在证据，并降低置信度。所有当前岗位、学历、身份、政审、保密、出口管制或户籍判断仍须回到具体公告。

Where a specialist institute has no stable standalone site, the record uses an official parent directory, official graduate brochure, or official organizational article and receives lower confidence. Any current-role, education, identity, security-review, export-control, or residency conclusion must still be checked against the exact posting.

## 4. 证据质量 / Evidence quality

数据共保存 **211 条证据**，来自 116 个唯一 URL。曦智科技节点在公司简介之外新增官方加入我们入口；其中国上市实体与美国市场节点通过独立关系边归入同一企业家族。

| 证据类型 / Evidence type                     | 数量 / Count |
| -------------------------------------------- | -----------: |
| 官方主页 / Official home page                |           88 |
| 官方机构简介 / Official company profile      |            1 |
| 官方名录 / Official registry                 |           40 |
| 官方母集团入口 / Official parent source      |           53 |
| 官方招聘入口 / Official careers              |           20 |
| 官方培养或招生资料 / Official program        |            7 |
| 官方组织报道 / Official organization article |            2 |

未使用百科、商业聚合器、猎头页或媒体报道作为组织身份的主证据。

No encyclopedia, commercial aggregator, recruiter page, or media report is used as primary organizational identity evidence.

2026-07-23 对 117 个唯一 URL 做了并发 HEAD 探测：87 个返回低于 500 的 HTTP 状态；4 个返回 5xx 或站点防护状态；26 个因超时、TLS、拒绝 HEAD 或网络层限制未取得状态。后两类仍通过官方搜索索引、官方母集团资料或官方名录确认身份，但在生产合并时必须用浏览器逐个复核，不将“自动探测失败”误报为组织失效。

An automated HEAD probe reached 87 of 117 unique URLs with a sub-500 status. Four returned 5xx or site-protection responses, and 26 did not return a status because of timeout, TLS, rejected HEAD requests, or network-layer restrictions. The latter records retain official directory or parent evidence, but require browser verification during production integration; a failed automated probe is not treated as proof that an organization is defunct.

置信度分布：

| 置信度 / Confidence | 数量 / Count | 含义 / Meaning                                                                                                                                         |
| ------------------- | -----------: | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| high                |          109 | 有直接官方主页、招聘入口或官方名录与主页交叉证据 / Direct official page, careers page, or registry cross-check                                         |
| medium              |           55 | 组织身份可靠，但专业节点主要依赖母集团官方资料 / Reliable identity with evidence mainly at the official parent level                                   |
| low                 |            2 | 技术相关性合理，但当前独立法人、入口或组织边界仍需人工复核 / Plausible relevance but current entity boundary or direct entry still needs manual review |

`visaSignal` 在中国树中仅用于资格风险路由，不表示美国签证赞助：

- `open`: 83
- `mixed`: 27
- `restricted`: 56

涉军或安全敏感单位统一进入岗位级人工复核分支；没有因为集团内存在受限岗位就把整个集团删除，也没有把任何组织级标签当成个人资格结论。

`visaSignal` is used only as an eligibility-risk route in the China tree, not as a U.S. sponsorship claim. Defense-sensitive entities are routed to requisition-level manual review; a restricted role does not remove an entire group, and no organization-level tag is treated as an individual eligibility decision.

## 5. 双语、简介与原子标签 / Bilingual content, descriptions, and atomic taxonomy

质量门槛结果：

- 166/166 节点均有中文名称和至少一个英文名称或英文别名。
- 166/166 节点均有独立的 `descriptionZh` 和 `descriptionEn`。
- 166/166 节点均有语义一致的 `relevanceZh` 和 `relevanceEn`；最终文案按国企、市场化公司、企业研究院、中科院研究所、高校和创新平台等组织形态使用 15 类自然句式，不再复用单一机械模板。
- 166/166 双语相关性说明均明确：是否存在适合的实习、研究或全职岗位，以及个人资格，必须回到当期具体公告；不推断当前在招或赞助。
- 166/166 节点均有角色族、要求、缺口和机会形态。
- `categories`、`focusAreas`、`roleFamilies` 中没有 `/`、`A and B`、`A 与 B`、`A、B` 形式的复合标签。
- 候选集共有 192 个类别；相对现有双语类别目录新增 **151 个类别**。
- 新类别的中英标签完整保存在 `data/expansion-cn-category-labels.json`，151/151 覆盖。
- 新增 company type 为 **0**；候选使用现有 `company`、`public-company`、`research-institute`、`university-lab`、`innovation-platform`。
- `data/expansion-cn-company-type-labels.json` 因无新增类型而明确保存为空对象。

English descriptions are concise organizational explanations, not literal machine-translated copies. Chinese and English labels express the same concept, while the atomization gate prevents compound display tags.

## 6. 与现有数据的交叉审计 / Cross-audit against the existing universe

已执行的结构检查：

- JSON 可解析。
- 166 个 ID 全部唯一。
- 166 个中文主名称全部唯一。
- 与现有 273 个中国节点的 ID 冲突为 0。
- 与现有 273 个中国节点的中文名称冲突为 0。
- 所有 25 个必需原始字段均非空，包括双语组织简介和双语求职相关性说明。
- 所有证据均有 `observedAt: 2026-07-23`。
- 所有证据 URL 均为 HTTPS 或 HTTP 的可解析绝对地址。
- 所有节点的 `difficulty` 均为 `role-specific`，没有给整家公司贴 A、B 或 S 难度。

The expansion file remains a separate, versioned source shard, but it is now imported into the production universe after label, role-mapping, rendering, relation, and link audits.

## 7. 合并说明 / Integration notes

1. 将 `data/expansion-cn-candidates.json` 作为新的静态数据片段导入，或在复核后机械追加到 `companies.cn.json`。
2. 将 `data/expansion-cn-category-labels.json` 的 151 个键合并到主类别目录；不要覆盖已有人工标签。
3. 不需要新增 company type。
4. 对 `medium` 和 `low` 节点优先补独立官网、招聘入口或当期公告。
5. 在生产发布前重新运行组织标签、来源链接、渲染和搜索测试。

## 8. Residual report

尚未闭环的事项明确保留，不以“全量”掩盖：

- 多数军工专业院所没有稳定的独立招聘页，当前证据证明组织存在和技术方向，不证明有适合个人身份的岗位。
- 部分集团存在持续重组、资产划转或品牌共用；申请前必须确认招聘法人、劳动合同主体和团队归属。
- 官方根站可证明组织身份，但不能替代当前 requisition；具体职位应保存 URL、发布时间、截止日期和资格条款。
- 高校和新型实验室的 RA 通常由课题组临时发布，需按教授、课题和经费逐项追踪。
- 私营初创公司的团队规模和招聘节奏变化快，应设置较短的证据过期时间。
- 英文名称在少数专业院所中是通行译名；申请材料应优先采用该单位当期英文公告中的正式写法。
- 当前扩容仍不是对中国所有行业企业的无边界枚举；它优先覆盖与芯片、EDA、计算、通信、机器人、量子、控制、仪器和工业数字化存在工程交集的雇主及研究节点。

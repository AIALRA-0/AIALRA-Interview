# 组织关系审计 / Organization Relations Audit

证据快照 / Evidence snapshot: 2026-07-23  
数据文件 / Dataset: `data/organization-relations.json`  
范围 / Scope: corporate-family identity, pending transactions, and technology licensing

## 1. 结论 / Outcome

本轮建立 6 条可审计关系边，覆盖 12 个现有组织 ID：

- 1 条曦智科技 / Lightelligence 企业家族与跨市场视图关系
- 3 条待完成收购关系
- 1 条待完成合并关系
- 1 条非独家技术许可关系

The dataset adds six auditable relationship edges across 12 existing organization IDs:

- one Lightelligence corporate-family and cross-market-view relationship;
- three pending acquisitions;
- one pending combination; and
- one non-exclusive technology license.

所有证据 URL 均来自交易参与方、组织本身或其投资者关系页面。没有使用新闻聚合器、百科、社交媒体帖子或二手媒体来判定关系类型与状态。

Every evidence URL is a first-party company, newsroom, or investor-relations page belonging to a party to the relationship. No news aggregator, encyclopedia, social post, or secondary media source is used to determine relationship type or status.

## 2. 组织 ID 闭环 / Organization ID closure

| Organization ID       | Source file                         |
| --------------------- | ----------------------------------- |
| `lightelligence`      | `data/companies.us.json`            |
| `cn-lightelligence`   | `data/expansion-cn-candidates.json` |
| `texas-instruments`   | `data/companies.us.json`            |
| `silicon-labs`        | `data/companies.us.json`            |
| `onsemi`              | `data/companies.us.json`            |
| `synaptics`           | `data/companies.us.json`            |
| `skyworks-solutions`  | `data/companies.us.json`            |
| `qorvo`               | `data/companies.us.json`            |
| `ionq`                | `data/companies.us.json`            |
| `skywater-technology` | `data/companies.us.json`            |
| `groq`                | `data/companies.us.json`            |
| `nvidia`              | `data/companies.us.json`            |

已对当前四个组织源文件执行解析和 ID 联合检查：

- `data/companies.us.json`
- `data/companies.cn.json`
- `data/expansion-us-candidates.json`
- `data/expansion-cn-candidates.json`

结果为 12/12 引用 ID 均存在，缺失 ID 为 0。关系文件没有创建影子组织，也没有用名称字符串替代规范 ID。

All 12 referenced IDs resolve in the union of the four current organization source files. The relation dataset creates no shadow organization and uses canonical IDs rather than display-name strings.

## 3. 关系状态审计 / Relationship status audit

| Relation                         | Type                 | Status at snapshot | Key first-party finding                                                                                                                                                                             |
| -------------------------------- | -------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 曦智科技 / Lightelligence        | `corporate-family`   | `active`           | 中国官网说明 Lightelligence Inc. 在美国注册、曦智科技于 2026-04-28 在香港上市；英文官网列出波士顿和圣何塞办公室，并直接链接中国官网。中国节点是中国市场及上市实体视图，美国节点是美国市场存在视图。 |
| Texas Instruments → Silicon Labs | `acquisition`        | `pending`          | 2026-02-04 签署最终协议；预计 2027 年上半年完成，最初公告列明股东、监管及其他惯常交割条件。                                                                                                         |
| onsemi → Synaptics               | `acquisition`        | `pending`          | 2026-06-25 签署全股票最终协议；预计 2027 年年中完成，最初公告列明股东、监管及其他惯常交割条件。                                                                                                     |
| Skyworks ↔ Qorvo                 | `combination`        | `pending`          | 2025-10-28 宣布现金加股票合并；预计 2027 年初完成。2026-06-11 的官方票据交换更新仍把交割作为未来条件。                                                                                              |
| IonQ → SkyWater Technology       | `acquisition`        | `pending`          | 2026-01-26 宣布拟收购；SkyWater 股东于 2026-05-08 批准，但官方明确监管批准及其他交割条件仍未完成。                                                                                                  |
| Groq ↔ NVIDIA                    | `technology-license` | `active`           | 2025-12-24 签订非独家推理技术许可；Groq 明确继续独立运营，GroqCloud 继续运行。这不是收购。                                                                                                          |

### Lightelligence 边界 / Lightelligence boundary

`corporate-family` 是规范归组关系，不是未经披露的精确法律所有权声明。官方材料足以把两个记录归入同一曦智科技 / Lightelligence 企业家族，并区分：

- `cn-lightelligence`: 中国机会市场与香港上市实体视图，股票代码 01879.HK；
- `lightelligence`: 美国机会市场存在视图，官网列出波士顿与圣何塞办公室。

The `corporate-family` edge is a canonical grouping relation, not an unsupported claim about the exact legal ownership chain. The cited official pages support grouping the records into the same Lightelligence family while retaining separate China-listed-entity and U.S.-market-presence views.

两条记录都必须保留，因为所在地、招聘入口、劳动合同主体、岗位资格及申请流程可能不同。规范归组只应用于跨市场导航、去重提示与关系展示，不应用于删除节点或合并申请记录。

Both records must remain because location, recruiting entry point, employing entity, eligibility, and application workflow can differ. Canonical grouping may support cross-market navigation, duplicate warnings, and relationship display; it must not delete a node or combine applications.

## 4. 不得提前合并待完成交易 / Never merge pending entities early

`status: "pending"` 的关系边是交易情报，不是组织主数据合并指令。以下规则是发布门槛：

1. 在任一交易参与方发布明确的正式交割完成公告前，双方组织节点必须保持独立。
2. 不得因为签署最终协议、股东批准、票据交换、监管申报或计划中的交割日期而提前把公司合并。
3. 搜索索引、组织树、公司简介、岗位映射、申请记录、收藏、训练任务和证据引用必须继续使用各自的规范组织 ID。
4. 可在双方详情页显示双向“待完成交易”关系，但文案必须包含待完成状态和证据观察日期。
5. 只有一手完成公告才能把 `status` 改为 `completed`；修改时必须新增完成日期、完成公告和迁移策略审计。
6. 交易终止时应改为 `terminated`，保留历史边和终止公告，不应静默删除历史关系。

A `pending` edge is transaction intelligence, not a master-data merge instruction. A signed definitive agreement, stockholder vote, note exchange, regulatory filing, or projected closing window does not establish completion. Separate canonical IDs must remain in search, profiles, roles, applications, saved targets, training missions, and evidence until a first-party closing release confirms completion.

### IonQ 与 SkyWater 的特别说明 / IonQ and SkyWater special note

2026-05-08 的 SkyWater 股东批准只满足一项条件。该官方公告同页明确写明，所需监管批准和其他惯常交割条件仍然存在。因此：

- 不得把“股东批准”标成“收购完成”；
- 不得提前将 SkyWater 的晶圆代工岗位、招聘入口或资格风险继承到 IonQ；
- 必须等待 IonQ 或 SkyWater 的正式完成公告。

The May 8, 2026 stockholder approval satisfies one condition only. The same first-party release says required regulatory approvals and other customary closing conditions remained. It therefore must not be represented as completion.

## 5. Groq 与 NVIDIA 不是收购 / Groq and NVIDIA is not an acquisition

Groq 的 2025-12-24 官方公告同时给出三个关键事实：

- 协议是 `non-exclusive licensing agreement`；
- Groq 继续作为独立公司运营；
- GroqCloud 继续不间断运营。

NVIDIA 的 2026 财年第四季度官方业绩公告也将该事项描述为非独家许可。因此本数据使用 `relationType: "technology-license"` 与 `status: "active"`，不得改写为收购、子公司或已合并。

Groq's first-party announcement calls the arrangement a non-exclusive license, states that Groq will continue as an independent company, and says GroqCloud will continue operating. NVIDIA's fiscal 2026 fourth-quarter release independently characterizes it as a non-exclusive license. The edge therefore must not be rendered as an acquisition, subsidiary relationship, or completed merger.

## 6. 一手证据目录 / First-party evidence index

### Lightelligence / 曦智科技

- [曦智科技公司简介及发展历程 / Lightelligence company profile and history](https://www.xztech.ai/about-us/company-profile)
- [曦智科技香港交易所上市公告 / Hong Kong listing announcement](https://www.xztech.ai/about-us/news/dynamic/80)
- [Lightelligence 美国办公室联系方式 / U.S. office contact information](https://www.lightelligence.ai/about-us/contact-us)

### Texas Instruments → Silicon Labs

- [Texas Instruments transaction announcement](https://investor.ti.com/news-releases/news-release-details/texas-instruments-acquire-silicon-labs)
- [Silicon Labs transaction announcement](https://news.silabs.com/2026-02-04-Texas-Instruments-to-acquire-Silicon-Labs)

### onsemi → Synaptics

- [onsemi transaction announcement](https://investor.onsemi.com/news-releases/news-release-details/onsemi-acquire-synaptics-enable-next-generation-intelligent)
- [Synaptics transaction announcement](https://www.synaptics.com/company/news/onsemi-to-acquire-synaptics-to-enable-the-next-generation-of-intelligent-systems-for-physical-ai)

### Skyworks ↔ Qorvo

- [Skyworks combination announcement](https://investors.skyworksinc.com/news-releases/news-release-details/skyworks-and-qorvo-combine-create-22-billion-us-based-leader)
- [Qorvo combination announcement](https://ir.qorvo.com/node/25121)
- [Skyworks 2026-06-11 note-exchange update](https://investors.skyworksinc.com/news-releases/news-release-details/skyworks-announces-results-early-participation-exchange-offers)

### IonQ → SkyWater Technology

- [IonQ acquisition announcement](https://investors.ionq.com/news/news-details/2026/IonQ-to-Acquire-SkyWater-Technology-Creating-the-Only-Vertically-Integrated-Full-Stack-Quantum-Platform-Company/)
- [SkyWater 2026-05-08 stockholder approval](https://ir.skywatertechnology.com/news/news-details/2026/SkyWater-Technology-Stockholders-Approve-Merger-Agreement-with-IonQ/default.aspx)

### Groq ↔ NVIDIA

- [Groq non-exclusive technology licensing announcement](https://groq.com/newsroom/groq-and-nvidia-enter-non-exclusive-inference-technology-licensing-agreement-to-accelerate-ai-inference-at-global-scale)
- [NVIDIA fiscal 2026 fourth-quarter results](https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-fourth-quarter-and-fiscal-2026)

## 7. 结构质量 / Structural quality

- JSON 可解析 / JSON parses successfully.
- 关系 ID 为 6/6 唯一 / 6/6 relation IDs are unique.
- `fromOrganizationId` 与 `toOrganizationId` 均不同 / no self-relation.
- 引用组织 ID 为 12/12 可解析 / 12/12 referenced organization IDs resolve.
- 关系为 6/6 中英双语摘要 / 6/6 relations have Chinese and English summaries.
- 证据为 14/14 一手 URL / 14/14 evidence records use first-party URLs.
- 所有关系均有 `relationType`、`status`、`announcedAt`、`lastVerified` 与 `officialEvidence`.
- 非交易型企业家族边的 `announcedAt` 为 `null`，因为官方材料没有披露单一关系公告日；这比伪造日期更可审计。

## 8. 更新规则 / Update rules

关系状态具有时效性，不能只在网站初次发布时检查。建议至少每周复核所有 `pending` 边，并在以下事件后立即复核：

- 股东投票；
- 监管批准或附条件批准；
- 交割延期；
- 协议修订；
- 交易终止；
- 正式完成公告。

Pending relationship status is time-sensitive. Re-verify it at least weekly and immediately after a stockholder vote, regulatory decision, closing delay, agreement amendment, termination, or formal completion announcement.

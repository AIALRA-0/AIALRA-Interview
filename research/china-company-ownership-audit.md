# 中国企业所有制分类审计 / China Company Ownership Audit

审计日期 / Review date: 2026-07-27
数据文件 / Data file: `data/china-company-ownership.json`  
范围 / Scope: `data/companies.cn.json` 与 `data/expansion-cn-candidates.json` 中 `companyType = company` 的全部节点

## 结论 / Executive summary

本轮建立了一个独立、保守、可追踪的中国企业所有制数据层。数据层不改写原公司记录；发布链将其作为只读审计资料接入组织资产、组织树、所有制筛选器与组织详情。

This review creates an independent, conservative, and traceable ownership layer for Chinese company records. The layer does not rewrite the source company records; the release pipeline consumes it as read-only audit data in the organization asset, tree, ownership filter, and profile detail.

- 源节点 / Source nodes: **390**
- 所有制记录 / Ownership records: **390**
- 唯一 ID / Unique IDs: **390**
- 与源集合精确一致 / Exact source-set coverage: **390 / 390**
- 至少一项证据 / Records with at least one evidence entry: **390 / 390**
- 证据条目 / Evidence entries: **428**
- 直接所有制名录或境外母公司官方域名 / Direct ownership-registry or official foreign-parent entries: **115**
- 组织资料复核入口 / Organization-context review sources: **313**
- 具有明确现有所有制类别、完成暂定分类 / Provisionally classified from an existing explicit ownership tag: **176**
- 因缺少直接控制权来源而保守标为混合或未知 / Conservatively marked mixed or unknown for lack of direct control evidence: **214**

这里的“暂定分类”不是法律意见。最新年报、交易所实际控制人披露、国资监管名录或官方控制权公告优先于本数据。

“Provisionally classified” is not a legal opinion. A newer annual report, exchange controller disclosure, state-asset regulator directory, or first-party control announcement supersedes this dataset.

## 边界 / Boundaries

独立审计层新增 / Independent audit-layer additions:

- `data/china-company-ownership.json`
- `research/china-company-ownership-audit.md`

原始企业记录保持不变 / Source company records remain unchanged:

- `data/companies.cn.json`
- `data/expansion-cn-candidates.json`

发布集成读取该审计层，并同步到：

- `public/organization-universe.json` 中的 390 个 `ownership` 档案；
- 组织树的所有制分组与独立所有制筛选器；
- 组织详情中的双语分类定义、置信度、审核状态和证据入口；
- 数据门禁、发布清单与自动化测试。

The release integration consumes this audit layer in:

- 390 `ownership` profiles in `public/organization-universe.json`;
- ownership groups in the organization tree and a dedicated ownership filter;
- bilingual definitions, confidence, review status, and evidence links in each relevant organization profile;
- data gates, the release manifest, and automated tests.

## 分类方法 / Classification method

### 第一层：现有明确类别 / Tier 1: existing explicit ownership categories

只有当源记录已经包含以下明确类别时，才给出确定性分类：

| 源类别 / Source tag | 分类 / Ownership class     |
| ------------------- | -------------------------- |
| `央企`              | `central-state-owned`      |
| `央企控股`          | `central-state-controlled` |
| `央企子公司`        | `central-state-subsidiary` |
| `地方国企`          | `local-state-owned`        |
| `国企控股`          | `state-controlled`         |
| `国企参股`          | `state-invested`           |
| `国企合资`          | `state-joint-venture`      |
| `民营`、`民营上市`  | `private`                  |

中央企业集团节点若同时附有国务院国资委央企名录，置信度为 `high`。其他明确类别保留为 `medium`，因为当前文件中的公司官网或招聘页通常只提供复核入口，不一定单独构成最终控制人证明。

Central-enterprise group records with an attached SASAC directory are `high` confidence. Other explicit source tags remain `medium` because an official company or careers page provides a traceable review entry but may not independently prove the ultimate controller.

### 第二层：证据不足时不推断 / Tier 2: no inference without control evidence

其余节点不会因为以下原因被直接判为民营、国有或外资：

- 公司名称
- 所在行业
- 是否上市
- 创始人知名度
- 常识性印象
- 官网存在与否

若现有组织档案没有国资名录、交易所控制人披露、官方年报或同等直接证据，记录归入 `mixed-or-unknown`，置信度为 `low`，并标记 `needs-direct-control-source`。

The remaining records are not classified from names, industries, listing status, founder reputation, general knowledge, or the mere existence of an official website. When the current record lacks a regulator directory, exchange controller disclosure, official annual report, or equivalent direct evidence, the class is `mixed-or-unknown` with `low` confidence and `needs-direct-control-source`.

## 所有制定义 / Ownership definitions

| Class                      | 中文定义 / Chinese definition                        | English definition                                                                                |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `central-state-owned`      | 中央政府直接出资或纳入国务院国资委中央企业集团名录   | Directly central-government-owned or listed as a SASAC-administered central enterprise group      |
| `central-state-controlled` | 中央企业或中央国有资本拥有控制权                     | Controlled by a central state-owned enterprise or central state capital                           |
| `central-state-subsidiary` | 中央企业集团体系内子公司，不自动断言直接持股层级     | Subsidiary within a central SOE group without asserting an unverified direct ownership tier       |
| `local-state-owned`        | 地方政府、地方国资委或其全资平台所有                 | Owned by a local government, local SASAC, or wholly owned local state-capital platform            |
| `state-controlled`         | 国有资本控制，但当前证据不足以稳定区分中央或地方     | State-controlled without a stable central-versus-local distinction                                |
| `state-invested`           | 国有资本参股，但证据不支持国有控制                   | State capital is invested, but state control is not established                                   |
| `state-joint-venture`      | 国有资本与其他投资者共同设立或共同持有               | Joint venture involving state capital and other investors                                         |
| `private`                  | 现有明确类别为民营或民营上市；不等于未上市           | Explicitly tagged as privately controlled or privately controlled and listed                      |
| `foreign-controlled`       | 由中国大陆以外的最终控制人控制，仅在有官方证据时使用 | Controlled by an ultimate controller outside mainland China, only with explicit official evidence |
| `mixed-or-unknown`         | 控制权混合、分散，或当前证据不足                     | Mixed or dispersed control, or insufficient current evidence                                      |

## 分类统计 / Classification statistics

| Ownership class            |   Count | 示例 / Examples                                                                            |
| -------------------------- | ------: | ------------------------------------------------------------------------------------------ |
| `central-state-owned`      |      27 | 中国航空发动机集团、中国航空工业集团、中国航天科技集团                                     |
| `central-state-controlled` |      17 | 武汉光迅科技股份有限公司、中国航发动力股份有限公司、航天信息股份有限公司                   |
| `central-state-subsidiary` |      14 | 航天云网科技发展有限责任公司、中航光电系统有限公司、中国电子云                             |
| `local-state-owned`        |       7 | 北京电子控股有限责任公司、广电运通集团股份有限公司、广州地铁集团有限公司                   |
| `state-controlled`         |       1 | 沈阳新松机器人自动化股份有限公司                                                           |
| `state-invested`           |       3 | 国仪量子技术（合肥）股份有限公司、曙光信息产业股份有限公司、长飞光纤光缆股份有限公司       |
| `state-joint-venture`      |       1 | 新华三技术有限公司                                                                         |
| `private`                  |      18 | 宁德时代新能源科技股份有限公司、深圳市众擎机器人科技有限公司、南京埃斯顿自动化股份有限公司 |
| `foreign-controlled`       |      88 | Intel China、Synopsys China、ASML China、Bosch China 等                                    |
| `mixed-or-unknown`         |     214 | 思瑞浦、华峰测控、盛美上海等                                                               |
| **合计 / Total**           | **390** |                                                                                            |

置信度分布 / Confidence distribution:

| Confidence | Count | 解释 / Meaning                             |
| ---------- | ----: | ------------------------------------------ |
| `high`     |    27 | 明确央企类别并附国务院国资委央企名录       |
| `medium`   |    61 | 现有源记录含明确所有制类别和官方复核入口   |
| `low`      |   214 | 只有组织身份或业务来源，缺少直接控制人来源 |

源文件分布 / Source-file distribution:

| Source                              | Count |
| ----------------------------------- | ----: |
| `data/companies.cn.json`            |   214 |
| `data/expansion-cn-candidates.json` |    88 |

## 未决队列 / Unresolved research queue

214 个 `mixed-or-unknown` 节点不是“民营”的替代标签，而是明确的证据缺口。数量最多的技术类别包括：

| Category     | Unresolved records |
| ------------ | -----------------: |
| 半导体设备   |                 19 |
| 机器人       |                 17 |
| 半导体材料   |                 15 |
| MCU          |                 15 |
| EDA          |                 13 |
| 汽车芯片     |                 13 |
| 存储         |                 12 |
| 模拟芯片     |                 11 |
| IDM          |                 11 |
| AI 加速器    |                 10 |
| 电源管理芯片 |                 10 |

下一轮补证应优先使用：

1. 国务院国资委及地方国资委企业名录；
2. 交易所最新年报中的控股股东和实际控制人章节；
3. 公司投资者关系页面发布的官方年度报告；
4. 官方并购、重组、控制权变更公告；
5. 官方母公司组织架构或子公司清单。

官网首页、招聘页或产品页只能证明组织身份与业务，不能单独证明最终控制权。

## 完整性审计 / Integrity audit

执行的只读验证包括：

- 两个源文件中 `companyType = company` 的 ID 集合与新记录完全相同；
- 总数为 390；
- 390 个 `organizationId` 全部唯一；
- 每条均具有非空中英文名称、中英文摘要和置信度；
- 每条 `ownershipClass` 均属于 schema 枚举；
- 每条至少含一项 `http://` 或 `https://` 证据；
- `sourceOwnershipTag = null` 的记录均采用保守的 `mixed-or-unknown`；
- 统计汇总与逐条记录重新计算结果一致。

验证结果 / Validation result: **passed**

## 使用限制 / Usage limitations

- 214 个低置信度节点只能以“混合或未知”和“待补直接控制权来源”公开展示，不能作为确定所有制事实。 / The 214 low-confidence records may be exposed only as “Mixed or unknown” and “Direct control source needed,” never as determinate ownership facts.
- `private` 表示控制性质，不表示未上市。 / `private` describes control and does not mean unlisted.
- `state-invested` 不表示国有控制。 / `state-invested` does not establish state control.
- `central-state-subsidiary` 不推断未经证实的直接母子公司层级。 / `central-state-subsidiary` does not infer an unverified direct parent tier.
- 88 个 `foreign-controlled` 节点依据境外母公司官方域名中的在华机构、地点或招聘入口纳入；具体雇佣法人仍须逐 requisition 复核。 / The 88 `foreign-controlled` nodes are grounded in official foreign-parent domains that expose a China organization, location, or careers channel; verify the exact employing entity per requisition.
- 所有制会因增资、上市、并购、国资划转和控制权变更而变化，必须保留 `reviewedAt` 并定期复核。 / Ownership can change through financing, listing, acquisitions, state-capital transfers, or other control events; retain `reviewedAt` and re-verify periodically.

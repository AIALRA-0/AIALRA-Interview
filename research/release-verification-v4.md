# AIALRA Career Dojo v4 发布验收 / Release Verification

- 证据冻结日 / Evidence snapshot: `2026-07-23`
  (`America/Los_Angeles`)
- 最终验证执行日 / Final verification date: `2026-07-23`
  (`America/Los_Angeles`; UTC measurements fall on `2026-07-24`)
- 题库内容版本 / Question content version: `2026-07-23.5`
- 题库状态 / Question-bank status: `bilingual-review-ready-v3`
- 发布结论 / Release conclusion: **PASS，可进入私有生产部署 / PASS for
  private production deployment**

本报告是 v4 最终文件的可复现验收记录。权威的确定性发布门禁全部通过，最终实时
来源审计没有确认的 404/410。

This report is the reproducible acceptance record for the final v4 files. Every
authoritative deterministic release gate passed, and the final live source audit
found no confirmed 404/410 response.

> **边界 / Boundary:** 799 个组织是证据日上的、有来源且可审计的覆盖快照，不是
> “相关组织已被数学意义上穷尽”的证明。组织档案不是当前职位；只有精确、仍有效的
> 官方 JD 证据才能证明某个职位开放。
>
> The 799 organizations form a sourced, auditable coverage snapshot at the
> evidence date; they are not mathematical proof that every relevant organization
> has been exhausted. An organization profile is not a current job. Only exact,
> still-current official JD evidence proves that a position is open.

## 1. 最终覆盖 / Final coverage

| 层 / Layer                                                                                    | 最终结果 / Final result |
| --------------------------------------------------------------------------------------------- | ----------------------: |
| 组织总数 / Organizations                                                                      |                     799 |
| 美国机会市场 / U.S. opportunity market                                                        |                     360 |
| 中国机会市场 / China opportunity market                                                       |                     439 |
| 组织类型及双语标签 / Organization types and bilingual labels                                  |                 20 / 20 |
| 原始行业标签 / Raw industry labels                                                            |                     595 |
| 规范分类筛选 / Canonical category filters                                                     |                     528 |
| 原子分类筛选 / Atomic category filters                                                        |                     531 |
| 规范分类别名组 / Canonical category alias groups                                              |                      64 |
| 原子分类别名组 / Atomic category alias groups                                                 |                      70 |
| 中英双语组织名 / Bilingual organization names                                                 |                     643 |
| 经复核仅英文组织名 / Reviewed English-only organization names                                 |                     156 |
| 双语简介完整且逐组织唯一 / Complete, organization-unique bilingual descriptions               |               799 / 799 |
| 双语相关性说明完整且逐组织唯一 / Complete, organization-unique bilingual relevance statements |               799 / 799 |
| 组织 → 岗位族规范边 / Canonical organization-to-role edges                                    |                   2,217 |
| 当前职位级证据 / Current-job evidence records                                                 |                       2 |
| 中国公司所有制记录 / China-company ownership records                                          |                     302 |
| 暂定已审计 / Provisionally audited ownership records                                          |                      88 |
| 待直接控制权来源 / Ownership records needing a direct control source                          |                     214 |
| 组织关系 / Organization relations                                                             |                       6 |
| 岗位族 / Role families                                                                        |                      15 |
| 原子技能 / Atomic skills                                                                      |                     130 |
| 双语技能展示词 / Bilingual skill display terms                                                |                     177 |
| 声明的岗位 → 技能边 / 缺失边 / Declared role-to-skill edges / missing edges                   |                 198 / 0 |
| 双语面试任务 / Bilingual interview tasks                                                      |                   2,100 |
| 每岗位族任务 / Tasks per role family                                                          |                     140 |

`595 → 528 → 531` 分别表示原始来源标签、经别名归并的规范筛选组，以及将复合概念
拆开的原子筛选项；它们是三个不同层级，不应互相替代。美国/中国数字表示机会市场
视图，不必然等同于注册地或最终控制人所在地。

`595 → 528 → 531` denotes three different layers: raw source labels,
alias-normalized canonical filter groups, and atomic filters obtained by splitting
compound concepts. They are not interchangeable. The U.S./China counts describe
opportunity-market views and do not necessarily equal place of incorporation or
ultimate-control jurisdiction.

## 2. 中国公司所有制层 / China-company ownership layer

302 条记录精确覆盖中国组织树中的全部公司节点，并携带 340 条证据记录：27 条
`direct-ownership-registry`，313 条 `organization-record-context`。所有制筛选使用
分立的原子类别，不用含混的“A 与 B”或“A/B”标签代替判断。

The 302 records exactly cover every company node in the China organization tree
and carry 340 evidence entries: 27 `direct-ownership-registry` and 313
`organization-record-context`. Ownership filters use discrete atomic classes
rather than ambiguous “A and B” or “A/B” labels.

| 所有制类别 / Ownership class          | 数量 / Count |
| ------------------------------------- | -----------: |
| 中央国有 / Central state-owned        |           27 |
| 中央控股 / Central state-controlled   |           17 |
| 央企子公司 / Central-state subsidiary |           14 |
| 地方国有 / Local state-owned          |            7 |
| 国有控股 / State-controlled           |            1 |
| 国有参股 / State-invested             |            3 |
| 国有合资 / State joint venture        |            1 |
| 民营 / Private                        |           18 |
| 外资控股 / Foreign-controlled         |            0 |
| 混合或未知 / Mixed or unknown         |          214 |

88 条非未知记录目前为“暂定已审计”：27 条高置信、61 条中置信。其余 214 条为低
置信并明确标记 `needs-direct-control-source`，在获得直接股权或控制权来源前保守
保留为 `mixed-or-unknown`。UI 同时展示来源所有制标签、证据范围、分类依据、备注、
置信度与复核状态；本层不是法律意见，也不宣称已经确定最终受益所有人。

The 88 non-unknown records are currently “provisionally audited”: 27 are
high-confidence and 61 medium-confidence. The remaining 214 are low-confidence,
explicitly marked `needs-direct-control-source`, and conservatively retained as
`mixed-or-unknown` until direct ownership or control evidence is available. The UI
exposes the source ownership tag, evidence scope, classification basis, note,
confidence, and review status. This layer is not legal advice and does not claim
to have established ultimate beneficial ownership.

详见 / See
[中国公司所有制审计 / China-company ownership audit](china-company-ownership-audit.md)。

## 3. 组织关系不提前合并 / Organization relations are not merged early

6 条关系引用 14 条一手官方证据：

The six relations cite 14 first-party official evidence records:

| 关系 / Relation                                                                    | 状态 / Status                                                | 产品行为 / Product behavior                                                                                                 |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 曦智科技中国视图 ↔ Lightelligence 美国视图 / Lightelligence China view ↔ U.S. view | 活跃企业家族 / Active corporate family                       | 保留两个机会市场节点；不推断未披露的精确法律母子链 / Keep both market nodes; do not infer an undisclosed legal parent chain |
| Texas Instruments → Silicon Labs                                                   | 待完成收购 / Pending acquisition                             | 官方完成公告前保持独立 / Remain separate until a first-party closing announcement                                           |
| onsemi → Synaptics                                                                 | 待完成收购 / Pending acquisition                             | 交割前保持独立 / Remain separate before closing                                                                             |
| Skyworks ↔ Qorvo                                                                   | 待完成合并 / Pending combination                             | 交割前保持独立 / Remain separate before closing                                                                             |
| IonQ → SkyWater                                                                    | 待完成收购 / Pending acquisition                             | 2026-05-08 股东批准不等于完成；仍保持独立 / The 2026-05-08 shareholder approval was not closing; remain separate            |
| Groq ↔ NVIDIA                                                                      | 活跃非独家技术许可 / Active non-exclusive technology license | 明确不是收购；Groq 保持独立 / Explicitly not an acquisition; Groq remains independent                                       |

所有待完成实体继续拥有独立组织、岗位、证据和申请身份。任何一手完成公告出现后，
仍需新增证据并重新审计，不能仅按预计完成日期自动合并。

Every pending entity retains a separate organization, role, evidence, and
application identity. A future first-party closing announcement requires new
evidence and a fresh audit; an estimated closing date must never trigger an
automatic merge.

详见 / See
[组织关系审计 / Organization-relations audit](organization-relations-audit.md)。

## 4. 双语题库拓扑与质量 / Bilingual question-bank topology and quality

题库的诚实拓扑为：

The honest question-bank topology is:

`210 个策划场景锚点 ×（1 个锚点 + 9 个递进练习）= 2,100 个任务`

`210 curated scenario anchors × (1 anchor + 9 progressive drills) = 2,100 tasks`

- 210 个锚点、1,890 个派生训练；派生训练包含 1,512 个技术练习和 378 个软技能
  练习。  
  210 anchors and 1,890 derived drills, comprising 1,512 technical exercises and
  378 soft-skill exercises.
- 2,100/2,100 题均有中英双语标题、题干、交付物、评分规则、常见失败、追问、
  参考骨架和可验证完成标准。  
  All 2,100 tasks contain bilingual titles, prompts, deliverables, rubrics, common
  failures, follow-ups, reference outlines, and verifiable completion criteria.
- 210/210 锚点拥有人工维护的中文翻译和任务专属 oracle；795/795 中文参考骨架
  条目对齐，旧通用回退为 0。  
  All 210 anchors have maintained Chinese translations and task-specific oracles;
  all 795 Chinese reference-outline items align, with zero legacy generic
  fallbacks.
- 130/130 个原子技能获得派生目标覆盖；先修等级倒置、先修冲突、契约实现冲突、
  精确重复及中英文相似度 `>= 0.90` 的近重复均为 0。  
  All 130 atomic skills receive derived target coverage; prerequisite-level
  inversions, prerequisite conflicts, contract/implementation conflicts, exact
  duplicates, and English or Chinese near-duplicate pairs at similarity `>= 0.90`
  are all zero.

| 维度 / Dimension                                         | 分布 / Distribution                                          |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| 学习层级 / Learning level                                | foundation 66 / entry 24 / intermediate 894 / advanced 1,116 |
| 难度 / Difficulty                                        | easy 73 / medium 865 / hard 1,162                            |
| `<= 15` 分钟基础微练习 / Foundation micro-drills         | 35，覆盖 15/15 岗位族 / covering 15/15 role families         |
| 软技能生成基础题 / Generated soft-skill foundation tasks | 16，最短 25 分钟 / minimum 25 minutes                        |

`bilingual-review-ready-v3` 表示“已达到双语复核就绪”，不表示行业认证，也不表示
2,100 道题都是互不相关的雇主原题。真实领域专家和学习者 pilot 仍是评分一致性、
难度校准和学习收益验证的必要下一步。

`bilingual-review-ready-v3` means “ready for bilingual review.” It does not mean
industry-certified, nor does it claim that all 2,100 tasks are unrelated employer
originals. Domain-expert and learner pilots remain necessary to validate scoring
consistency, difficulty calibration, and learning outcomes.

## 5. 最终资产完整性与大小 / Final asset integrity and size

测量时间 / Measured at: `2026-07-24T17:22:36.218Z`  
压缩方法 / Compression method: gzip level 9; Brotli quality 11, text mode.

| 产物 / Artifact                               |   原始 / Raw |        gzip |      Brotli | SHA-256                                                            |
| --------------------------------------------- | -----------: | ----------: | ----------: | ------------------------------------------------------------------ |
| 完整源题库 / Full question source             | 18,531,846 B | 2,120,013 B |   499,122 B | `0ab07ee28bb1c4221939f017ee8df755bcbf6ac1a3dd1df7473912def1b1eedf` |
| 题库 manifest / Question manifest             |     50,359 B |    13,839 B |    10,775 B | `5c7741ec5b4774189ec3eb48d9d9dd6a3bf00072efa64a07410a6d7e39c55a91` |
| 浏览器题目索引 / Browser question index       |  2,299,694 B |   191,764 B |    96,864 B | `4f2e94ecd3ec50e7d97b4a1e0a4b385c2abbbde5692fd31c0dcced56e5a70959` |
| 256 个详情分片合计 / 256 detail shards, total | 16,337,213 B | 4,478,109 B | 3,569,901 B | `b45c2a0ad885703ed1e4bab5c8f2fd49ee6514c5cc14037701f595276b036364` |
| 最大详情分片 `a3` / Largest detail shard `a3` |    139,600 B |    28,930 B |    22,276 B | `2a25562a651a8f130a3fc4cfe58a403e4710d2fe80742320ea803c94aff9a626` |
| 完整组织资产 / Full organization asset        |  3,731,340 B |   432,842 B |   249,241 B | `c5b8a684191ebdbcee9843377db1b7352b82aa6dd8d4d416a0eb4a958e4b4c12` |
| 组织 manifest / Organization manifest         |        445 B |       292 B |       253 B | `6dd7a7053af71af1dd57561146f7f7e6d425bb909cfb0be2c60f7650a4c6c14a` |
| 中国所有制数据 / China ownership data         |    563,413 B |    26,419 B |    18,731 B | `2f5a9716f2d571f078cfae1230442ea4426113f35232b8f46380bf281e6568ab` |
| 组织关系数据 / Organization relations         |     12,019 B |     3,719 B |     2,842 B | `3ba4e04fb218a528d376734851c1b30f67ffecbfed3ace1c3b2c15e1b16fa142` |
| 发布 manifest / Release manifest              |        787 B |       412 B |       329 B | `65eeee44e01b8a3e056f50b71ff2371999039b88e841231d1cd491ba7ae7047c` |

256 分片合计 SHA 是按 `00.json` 至 `ff.json` 排序后逐字节串接所得的本次复核摘要；
浏览器实际完整性门禁使用 manifest 中每个分片各自的 SHA-256。

The aggregate SHA for the 256 shards is the audit digest of their bytewise
concatenation in `00.json` through `ff.json` order. Browser integrity enforcement
uses the individual SHA-256 value for every shard in the manifest.

题库 manifest 的 `assetVersion` 为 `07a6b589bded65f0`。组织 manifest 的
`sourceSha256` 为
`76a38f8e6938387e870bbbb9fa215c8eb84d47e37a26a23da7c7ae76475e0961`，完整组织
资产哈希与表中结果一致。

The question manifest has `assetVersion` `07a6b589bded65f0`. The organization
manifest has `sourceSha256`
`76a38f8e6938387e870bbbb9fa215c8eb84d47e37a26a23da7c7ae76475e0961`,
and its full-asset digest matches the table.

## 6. SSR 与按需加载 / SSR and demand loading

开发服务器首页先完成一次预热请求并丢弃，再以 `Accept-Encoding: identity` 连续
请求五次，最后离线使用与上节相同的 gzip/Brotli 参数压缩。RSC 请求时钟会令每次
响应相差少量字节，因此报告中位数和范围，而不把动态响应哈希当作固定发布哈希。

After one discarded warm-up request, the development-server home page was
requested five consecutive times with `Accept-Encoding: identity`, then compressed
offline with the same gzip/Brotli settings used above. The RSC request clock
changes a few response bytes, so this report uses medians and ranges rather than
treating the dynamic response digest as a release hash.

测量时间 / Measured at: `2026-07-24T18:47:12.813Z`

| 首页 SSR / Home-page SSR | 中位数 / Median |      范围 / Range |
| ------------------------ | --------------: | ----------------: |
| 原始 / Raw               |       179,669 B | 179,662–179,671 B |
| gzip                     |        47,062 B |   47,058–47,065 B |
| Brotli                   |        36,741 B |   36,735–36,768 B |

- SSR 只引导 12 个初始组织；完整 799 个组织在浏览器端按需获取、校验
  SHA-256 后装载。  
  SSR bootstraps only 12 initial organizations; the complete set of 799 is
  fetched on the client, SHA-256 verified, and then loaded.
- 题目摘要索引单独获取，详情使用 256 个确定性分片按需加载；完整题目详情不进入
  初始 HTML。  
  The question-summary index is fetched separately and full details are loaded on
  demand from 256 deterministic shards; full question details are absent from the
  initial HTML.
- 初始 HTML 不含完整组织宇宙、题目索引或首题详情，但包含期望的组织资产、题目
  索引和分片哈希。  
  Initial HTML excludes the full organization universe, question index, and first
  question details while carrying the expected organization-asset, index, and
  shard digests.
- 开发服务器提供的组织资产、组织 manifest、题目索引及题库 manifest 均为
  HTTP 200，且大小和 SHA-256 与本地最终文件逐字节一致。  
  The organization asset, organization manifest, question index, and question
  manifest served by the development server all returned HTTP 200 and matched the
  final local files byte for byte in size and SHA-256.

## 7. 确定性发布门禁 / Deterministic release gates

| 门禁 / Gate                                                               | 结果 / Result                                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run validate`                                                        | **PASS**：数据审计、资产构建/同步检查、TypeScript、ESLint、生产构建和 41/41 Node 测试通过 / Data audit, asset build/synchronization checks, TypeScript, ESLint, production build, and 41/41 Node tests passed |
| `npm audit --audit-level=low`                                             | **PASS**：0 个已知漏洞；全新 `npm ci` 后依赖树完整 / 0 known vulnerabilities with a clean dependency tree after a fresh `npm ci`                                                                              |
| `npm run questions:check`                                                 | **PASS**：2,100 摘要、256 分片与源数据同步 / 2,100 summaries and 256 shards synchronized with source                                                                                                          |
| `npm run organizations:check`                                             | **PASS**：799 个组织，最终资产哈希一致 / 799 organizations with matching final asset digest                                                                                                                   |
| 本轮手写文件 scoped Prettier / Scoped Prettier for hand-authored v4 files | **PASS**                                                                                                                                                                                                      |
| `git diff --check`                                                        | **PASS**                                                                                                                                                                                                      |

41 项测试包括中国所有制精确覆盖、公开所有制展示、799 份唯一双语简介/相关性说明、
15 个双语岗位族、130 个双语技能、短缩写 token 边界、NIST 不误映射 STA、组织关系、
SSR 边界、组织资产摘要校验、鉴权/用户隔离/输入校验、公开隐私边界、旧版单语私有
档案的语言安全呈现（不伪造翻译、不显示占位语、不按数组长度猜测配对、不丢弃私有
字段；显式双语对保持双语，空数组保持为空；显式空字符串不回退公开文案，UI 透明
显示“未配置 / Not configured”）、双语题目、无障碍状态以及题目索引/分片同步。
它们也锁定薪资证据边界、完整岗位档案写入、Authentik 回源身份、部署密钥隔离、
纯中性色界面、精确布局，以及 React/Next 安全版本和旧版 ESLint 通配符 API 的
安全兼容链。

The 41 tests cover exact China ownership coverage, safe public ownership display,
799 unique bilingual descriptions/relevance statements, 15 bilingual role
families, 130 bilingual skills, token boundaries for short abbreviations, the
NIST-to-STA false-positive guard, organization relations, SSR boundaries,
organization-asset digest verification, authentication/user isolation/input
validation, the public privacy boundary, legacy single-language private-profile
language-safe rendering without fabricated translations, public-profile
placeholder copy, positional array-pair guessing, or private-field loss (explicit
bilingual pairs remain bilingual, empty arrays remain empty, and explicit empty
strings do not fall back to public copy but render the transparent bilingual state
“未配置 / Not configured”), bilingual questions, accessibility state, and question
index/shard synchronization. They also lock compensation-evidence boundaries,
full requisition persistence, Authentik origin identity, deployment-secret
isolation, the neutral-only interface, precise layouts, patched React/Next
versions, and the safe compatibility bridge for the legacy ESLint minimatch API.

作为额外诊断，`npx prettier --check .` 返回 31 个文件警告。它不是
`package.json` 定义的发布门禁，且把有意采用紧凑确定性序列化的数据与公开生成资产
纳入普通源码格式范围，因此本次归类为 **advisory scope mismatch**，不批量重写
这些资产，也不据此把发布判为失败。针对本轮手写源码、测试和审计文档的 scoped
Prettier 检查已通过。

As an additional diagnostic, `npx prettier --check .` returned warnings for 31
files. It is
not the release gate defined by `package.json`, and its ordinary source-formatting
scope includes intentionally compact deterministic data and public generated
assets. It is therefore recorded as an **advisory scope mismatch**, not used to
fail the release, and those assets were not bulk-rewritten. The scoped Prettier
check for this release's hand-authored source, tests, and audit documents passed.

## 8. 实时网络审计 / Live network audits

实时结果与上节确定性门禁分开记录，因为远端防机器人策略、限流、DNS、路由和服务
状态会令重复运行产生不同结果。

Live results are recorded separately from deterministic gates because remote
anti-bot policy, rate limits, DNS, routing, and service state can change between
runs.

### 来源链接 / Source links

观测时间 / Observed at: `2026-07-24T17:11:11.892Z`

最终脚本覆盖公司招聘与证据、题目来源、6 条组织关系及 302 条所有制记录中的全部
去重 URL。

The final script covered every unique URL from company career/evidence records,
question sources, all six organization relations, and all 302 ownership records.

| 分类 / Category                              | 数量 / Count |
| -------------------------------------------- | -----------: |
| 去重 URL / Unique URLs                       |          866 |
| 可访问 / Reachable                           |          709 |
| 访问受限 / Access-controlled                 |           64 |
| 确认缺失 404/410 / Confirmed missing 404/410 |            0 |
| 服务器错误 / Server error                    |            4 |
| 其他 HTTP / Other HTTP                       |           11 |
| 超时 / Timeout                               |            1 |
| 网络错误 / Network error                     |           77 |
| 需要立即修复 / Action required               |            0 |
| 需要人工复核 / Manual review                 |          157 |

只有明确 404/410 进入 `actionRequired`；本轮为空。访问受限、5xx、其他 HTTP、
超时和网络错误进入 `manualReview`，它们不证明页面不存在。该结果是观测快照，不是
未来可达性保证。

Only confirmed 404/410 responses enter `actionRequired`; it was empty in this
run. Access-controlled, 5xx, other HTTP, timeout, and network-error results enter
`manualReview` and do not prove that a page is absent. This is an observation
snapshot, not a guarantee of future reachability.

### 依赖公告 / Dependency advisories

`npm audit --omit=dev --audit-level=high` 的实时注册表查询成功并返回
`found 0 vulnerabilities`。实时查询仍应在每次发布时重跑。

The live-registry `npm audit --omit=dev --audit-level=high` query succeeded and
returned `found 0 vulnerabilities`. The live query should still be repeated for
every release.

## 9. 人工浏览器 smoke 测量 / Manual browser smoke measurements

以下是最终页面的真实浏览器测量，不是从 CSS 推断的估计。对应 CSS 静态回归断言已
加入 `tests/rendered-html.test.mjs`。

These are measurements from the final page in a real browser, not estimates
inferred from CSS. Matching static CSS regression assertions were added to
`tests/rendered-html.test.mjs`.

| 视口 / Viewport                         | 结果 / Result                                                                                                                                                                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1440×900`                              | 文档横向溢出 0；桌面筛选器保持两行，五个控件宽度为 634 / 450 / 358 / 358 / 358 px / Zero document overflow; desktop filters remain on two rows with widths 634 / 450 / 358 / 358 / 358 px                                         |
| `1440×900`，仅 CN 市场 / CN-only market | 组织树宽度 1,124 px，section 宽度 1,124 px，单市场完整占宽 / Tree width 1,124 px equals section width 1,124 px; the single market uses the full width                                                                             |
| `390×844`                               | 横向溢出 0；五个筛选控件各 332 px 并单列；组织和题目 modal 均为 left 8 / right 382 / width 374 px / Zero overflow; five 332 px filters in one column; both organization and question modals are left 8 / right 382 / width 374 px |
| `390×844` 阅读模式 / Reading modes      | 三个中英双语阅读模式按钮全部可见 / All three bilingual reading-mode buttons are visible                                                                                                                                           |
| `768×1024`                              | 横向溢出 0；题目 modal 为 left 8 / right 760 / width 752 px / Zero overflow; question modal is left 8 / right 760 / width 752 px                                                                                                  |

## 10. 非阻断边界与发布判断 / Non-blocking boundaries and release judgment

- 799 是有来源、可审计的覆盖快照，不是全世界相关组织“一个不漏”的可证明全集；
  后续新增组织必须经过同一双语、证据和去重门禁。  
  The 799 records are a sourced, auditable coverage snapshot, not a provably
  exhaustive set of every relevant organization worldwide. Future additions must
  pass the same bilingual, evidence, and deduplication gates.
- 只有 2 条记录在冻结日具有精确 `official-current-job` 证据：TSMC Arizona 的
  Summer 2027 engineering internship，以及 Qolab 的 Quantum Hardware
  Engineer。即使这两条也必须在投递当天重新打开官方 JD 复核；其他组织档案只代表
  目标方向，不代表当前开放岗位。  
  Only two records carried exact `official-current-job` evidence at the snapshot:
  the TSMC Arizona Summer 2027 engineering internship and Qolab Quantum Hardware
  Engineer. Even these must be reopened and rechecked on the application date.
  Every other organization profile describes a target direction, not a current
  opening.
- 214 条中国公司所有制记录仍需直接控制权来源，保守显示为混合或未知，不应在筛选
  或申请决策中被解读成确定结论。  
  The 214 China-company ownership records still needing a direct control source
  remain conservatively mixed or unknown and must not be treated as definitive in
  filtering or application decisions.
- 157 个 URL 需要人工复核，但没有一个被确认 404/410；应周期性重跑实时审计。  
  157 URLs need manual review, but none was confirmed 404/410; the live audit
  should be rerun periodically.
- 题库仍是 review-ready。领域专家复核、真实学习者 pilot、评分者一致性和投递反馈
  闭环是下一阶段，而不是本次数据/运行时发布门禁的缺口。  
  The bank remains review-ready. Domain-expert review, learner pilots, inter-rater
  consistency, and an application-feedback loop are the next phase rather than
  missing data/runtime release gates.

在上述边界被明确保留的前提下，v4 的确定性门禁、资产完整性、SSR 负载边界、
双语覆盖、所有制/关系语义、桌面/移动布局和实时失效链接检查均满足私有生产部署
要求，最终结论为 **PASS**。

With those boundaries explicitly retained, v4 meets the private-production
requirements for deterministic gates, asset integrity, SSR payload boundaries,
bilingual coverage, ownership/relation semantics, desktop/mobile layout, and
live broken-link checks. The final result is **PASS**.

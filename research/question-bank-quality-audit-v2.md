# AIALRA Interview 题库 v3 独立发布审计（修复前基线）

审计日期：2026-07-23
审计对象：`contentVersion = 2026-07-23.3` 的 2,100 题冻结候选、公开题库分片与 Interview Dojo UI
权威题库源：`data/questions.seed.json`
审计性质：独立、以只读检查为主；本报告不修改题库、生成器或产品源文件
首轮结论：**FAIL — P0 为 0，但存在发布阻断级 P1；当前只能保持 `review-ready`，不得晋升 `active`。**

> 本项目当前仍使用题库 schema `2.0.0`、bank status
> `bilingual-review-ready-v2`。本报告中的“v3”指第三轮内容版本
> `2026-07-23.3`，不是一个不存在的 v3 schema；因此文件名仍为
> `questions.seed.json`、状态字符串仍带 v2 本身不构成缺陷。

## 1. 审计口径与覆盖

### 1.1 全库机器审计

已覆盖全部：

- 2,100 道题；
- 15 个 role family，每个 role 140 题；
- 210 个 curated anchor；
- 每个 anchor 的 9 种派生 archetype，共 1,890 个 drills；
- 210 条 lineage，每条严格为 1 anchor + 9 drills；
- 130 个 atomic skill；
- 5,130 条 question `sourceRefs`，65 个唯一 URL；
- 1 个公开 summary index、1 个 manifest、256 个 detail shards；
- SSR HTML、构建输出、题库加载、分页、modal、ARIA 与移动端相关代码及测试。

全库检查包括 schema、空字段、数组对齐、中文可用性、引用完整性、版本、
生命周期、skill coverage、重复、分片哈希、候选人可见 metadata、SSR
序列化边界和来源链接。

### 1.2 人工语义抽样

人工分层抽样 75 题，恰好每个 role 5 题；覆盖：

- 15 个 curated anchors；
- 64 条不同 lineage；
- 技术类全部 9 种派生 archetype：
  `contract`、`worked-example`、`minimal-implementation`、
  `fault-injection`、`oracle`、`scale`、`tradeoff`、`incident`、
  `integration`；
- Behavioral、Project、English 三类专用 soft-skill archetype；
- 数字、单位、时限、level、role-skill、prompt/oracle、
  software/hardware/analog integration 等高风险语义。

其余 195 个 anchors 虽未逐题进入 75 题人工样本，但全部进入 lineage、
schema、oracle、skill、双语结构、重复和来源的机器审计。因此本轮同时满足
“至少 75 题人工抽样”和“210 anchors 全覆盖”的两层口径。

### 1.3 75 题抽样矩阵

| Role family | 5 个语义样本 |
| --- | --- |
| EDA R&D | `q-eda-mini-sta-boss`; `q2-eda-rd-100` (`contract`); `q2-eda-rd-020` (`worked-example`); `q2-eda-rd-062` (`incident`); `q2-eda-rd-126` (`integration`) |
| AI for EDA | `q-aieda-routing-triage-boss`; `q2-ai-eda-019` (`contract`); `q2-ai-eda-030` (`minimal-implementation`); `q2-ai-eda-070` (`tradeoff`); `q2-ai-eda-105` (`scale`) |
| CAD / Flow | `q-cad-flow-platform-boss`; `q2-cad-flow-118` (`contract`); `q2-cad-flow-011` (`worked-example`); `q2-cad-flow-076` (`fault-injection`); `q2-cad-flow-108` (`integration`) |
| RTL | `q-rtl-width-converter-boss`; `q2-rtl-037` (`contract`); `q2-rtl-020` (`worked-example`); `q2-rtl-095` (`oracle`); `q2-rtl-108` (`integration`) |
| DV | `q-dv-formal-vacuity`; `q2-dv-100` (`contract`); `q2-dv-029` (`worked-example`); `q2-dv-066` (`minimal-implementation`); `q2-dv-108` (`integration`) |
| FPGA | `q-fpga-fifo-pointer-wave`; `q2-fpga-019` (`contract`); `q2-fpga-029` (`worked-example`); `q2-fpga-086` (`oracle`); `q2-fpga-126` (`integration`) |
| Architecture | `q-arch-roofline`; `q2-architecture-109` (`contract`); `q2-architecture-020` (`worked-example`); `q2-architecture-066` (`minimal-implementation`); `q2-architecture-108` (`integration`) |
| Physical Design | `q-pd-eco-choice`; `q2-physical-design-019` (`contract`); `q2-physical-design-020` (`worked-example`); `q2-physical-design-068` (`oracle`); `q2-physical-design-126` (`integration`) |
| DFT | `q-dft-tap-trace`; `q2-dft-100` (`contract`); `q2-dft-020` (`worked-example`); `q2-dft-066` (`minimal-implementation`); `q2-dft-108` (`integration`) |
| Analog / Custom | `q-analog-noise-budget`; `q2-analog-custom-010` (`contract`); `q2-analog-custom-029` (`worked-example`); `q2-analog-custom-050` (`oracle`); `q2-analog-custom-108` (`integration`) |
| Embedded | `q-emb-dma-cache`; `q2-embedded-028` (`contract`); `q2-embedded-029` (`worked-example`); `q2-embedded-095` (`oracle`); `q2-embedded-126` (`integration`) |
| Manufacturing Automation | `q-mfg-interlock-review`; `q2-manufacturing-automation-019` (`contract`); `q2-manufacturing-automation-029` (`worked-example`); `q2-manufacturing-automation-104` (`oracle`); `q2-manufacturing-automation-108` (`integration`) |
| Behavioral | `q-beh-ethical-data`; `q2-behavioral-010`; `q2-behavioral-011`; `q2-behavioral-057`; `q2-behavioral-108` |
| Project Deep Dive | `q-proj-root-cause-replay`; `q2-project-deep-dive-001`; `q2-project-deep-dive-011`; `q2-project-deep-dive-075`; `q2-project-deep-dive-108` |
| English Communication | `q-eng-misunderstanding-repair`; `q2-english-communication-001`; `q2-english-communication-011`; `q2-english-communication-075`; `q2-english-communication-108` |

### 1.4 已通过的高风险语义样本

- `q-arch-roofline` 的 `2e12` 与 `2×10^12` 语义一致；
- `q-pd-eco-choice` 的 “Ten days” 与 `10 天` 一致；
- `q2-rtl-108` 的 8/9-bit 极值与 wrap 推导正确；
- `q2-analog-custom-108` 的 `100 µA / 200 mV / 1 mS` 一致；
- `q2-embedded-126` 的 UART 8N1 结果 `0xA5` 正确；
- FPGA Gray-code oracle 正确区分“源域相邻更新单比特变化”与“目的域可能跳过合法中间码”；
- Analog noise oracle 正确区分 PSD 除以增益平方、ASD 除以增益；
- 抽样中的 RTL、Architecture、Analog 数学和 technical oracle 未发现事实性计算错误。

## 2. 总体机器结果

### 2.1 通过项

`npm run validate` 在该修复前快照上通过：

- `audit:data`：PASS；
- TypeScript typecheck：PASS；
- ESLint：PASS；
- production build：PASS；
- 7/7 Node tests：PASS。

题库结构：

| 指标 | 结果 |
| --- | ---: |
| 总题数 | 2,100 |
| 每 role 题数 | 140 |
| Curated anchors | 210 |
| Generated drills | 1,890 |
| Technical generated drills | 1,512 |
| Lineages | 210 |
| 每 lineage 成员数 | 10 |
| Atomic skills | 130 |
| 全局每 skill 题数范围 | 10–424 |
| Foundation / Entry / Intermediate / Advanced | 102 / 24 / 1,058 / 916 |
| Easy / Medium / Hard | 109 / 1,029 / 962 |
| Blueprint families | 37 |
| 空 required scalar/array | 0 |
| 中英数组长度错位 | 0 |
| 必需中文字段无汉字 | 0 |
| 无效 question/role/skill 引用 | 0 |
| Exact title/prompt duplicates | 0 |

全量 2,100 题两两 prompt 复核：

- English 5-word shingle Jaccard `>= 0.90`：0 对；
- English 最近一对：
  `q2-cad-flow-111` / `q2-architecture-120`，0.8333；
- Chinese 12-character shingle Jaccard `>= 0.90`：0 对；
- Chinese 最近一对：
  `q2-dv-111` / `q2-dft-111`，0.8071。

版本与 lifecycle：

- root schema：`2.0.0`；
- root status：`bilingual-review-ready-v2`；
- 2,100/2,100 question status：`review-ready`；
- 2,100/2,100 `contentVersion`：`2026-07-23.3`；
- 2,100/2,100 `evidenceDate`：`2026-07-23`。

### 2.2 分片、SSR 与构建

- 权威源大小：17,275,374 bytes；
- summary index：2,687,116 bytes；
- detail shards：256 个，共 15,552,367 bytes；
- 最大 shard：131,495 bytes；
- manifest、index 与所有 shard 的 count、byte length 和 SHA-256 与源题库一致；
- build 产物与 `public/question-bank` 生成物一致；
- SSR HTML：715,077 bytes raw，约 114–115 KB gzip；
- SSR HTML 不包含 question IDs、题干、提交物或整个题库；
- detail shard 仅在打开具体题目时加载；
- 但 summary index 会在应用 mount 后立即请求，见 P2。

### 2.3 来源链接

Question bank：

- 5,130 个引用实例；
- 65 个唯一 URL；
- 每题 1–3 个 syntactically valid HTTP(S) URL；
- 单独探测时 52 个 reachable、1 个 access-controlled、12 个 timeout；
- 未确认任何 question source 404/410。

包含公司来源在内的最终 link audit：

- 620 个唯一 URL；
- 459 reachable；
- 33 access-controlled；
- 0 confirmed missing；
- 2 server-error；
- 3 other HTTP；
- 1 timeout；
- 122 network-error；
- `actionRequired = 0`。

后四类多为自动化环境、反爬或网络限制，仍应保留人工复查队列，不能把
“未确认 404”解释为“全部来源已经可重复访问”。

## 3. P0

**0 项。**

未发现数据损坏、用户数据泄漏、鉴权绕过、恶意代码、版权题库搬运或会直接
导致整库不可用的缺陷。

## 4. P1 — 发布阻断

### P1-01：222 题的显式 prerequisite 高于题目 level

共有：

- 252 条违规 prerequisite edge；
- 222 道不同题；
- 覆盖 15/15 role families。

分布：

| Role | 违规题数 |
| --- | ---: |
| EDA R&D | 9 |
| AI for EDA | 17 |
| CAD / Flow | 18 |
| RTL | 3 |
| DV | 27 |
| FPGA | 21 |
| Architecture | 6 |
| Physical Design | 43 |
| DFT | 25 |
| Analog / Custom | 11 |
| Embedded | 15 |
| Manufacturing | 6 |
| Behavioral | 2 |
| Project | 8 |
| English | 11 |

代表证据：

- `q2-physical-design-019.level = foundation`，但
  `sk-eda-timing-graph = advanced`；
- `q2-eda-rd-100.level = foundation`，但
  `sk-graph-algorithms = intermediate`；
- `q2-embedded-028.level = foundation`，但
  `sk-emb-c-volatile = intermediate`；
- `q2-behavioral-010.level = foundation`，但
  `sk-tradeoff-communication = intermediate`。

这不是普通 target skill 的“首次接触”问题：字段名明确是
`prerequisiteSkills`，表示答题前需要掌握。当前进阶路径会先要求学习者掌握
比题目更高等级的先修项。现有 `audit:data` 只验证 prerequisite ID 存在，
没有执行 level gate，因此产生假绿灯。

### P1-02：45 个 curated foundation anchor 的中英参考思路不等价

45/210 anchors 的 English `referenceOutline` 是题目专属解法，而 Chinese
`referenceOutlineZh` 退化为“定义对象 / 运用技能 / 推演路径”的通用回退。

代表证据：

- `q-rtl-foundation-signed-width`：
  EN 给出 `-256/254`、signed 9-bit 范围和 8-bit wrap；
  ZH 未保留这些推导；
- `q-dv-foundation-scoreboard`：
  EN 明确 `260 mod 256 = 4`；
  ZH 没有该计算；
- `q-analog-foundation-gm`：
  EN 明确 `100 µA`、`200 mV` 与 `2ID/Vov`；
  ZH 全部省略；
- `q-dft-foundation-stuck-at`、`q-embedded-foundation-uart-frame`
  存在同类删减。

Oracle 中文版本可补偿一部分答案信息，但不能使
`referenceOutline` / `referenceOutlineZh` 本身重新同构。该缺陷违反
“中文与英文是同等完整学习入口”的发布规范。

### P1-03：22 个 soft-skill anchors 的双语 policy 不同，传播到 220 题

11 个 Behavioral 和 11 个 Project anchors 的 English 末尾统一要求：

`State all assumptions that materially affect correctness; do not rely on
undisclosed vendor behavior or confidential interview knowledge.`

Chinese 没有等价保留该规则，而改成另一组题目专属诚信、叙事或保密规则。
这些中文规则本身通常很好，但两种语言因此拿到不同提示量和不同约束。

受影响 anchors：

- Behavioral：
  `q-beh-failure-ownership`、`q-beh-technical-conflict`、
  `q-beh-ambiguous-task`、`q-beh-priority-tradeoff`、
  `q-beh-influence-no-authority`、`q-beh-quality-schedule`、
  `q-beh-negative-feedback`、`q-beh-cross-functional`、
  `q-beh-ethical-data`、`q-beh-lead-small-team`、
  `q-beh-behavioral-loop-boss`；
- Project：
  `q-proj-project-one-liner`、`q-proj-architecture-whiteboard`、
  `q-proj-metric-defense`、`q-proj-decision-replay`、
  `q-proj-root-cause-replay`、`q-proj-scale-counterfactual`、
  `q-proj-testing-strategy`、`q-proj-ownership-boundary`、
  `q-proj-failed-project`、`q-proj-five-minute-defense`、
  `q-proj-project-loop-boss`。

代表差异：

- `q-beh-ethical-data` ZH 新增“不得为了证明诚信而扩大泄密、不得无证据
  推断他人动机”，EN 无对应句；
- `q-proj-root-cause-replay` ZH 新增“不得把后来知道的根因伪装成一开始
  就知道”，EN 无对应句；
- `q-beh-technical-conflict` ZH 新增“不得把对方歪曲成不理性”，EN
  无对应句。

每个 anchor 的 9 个派生题继承原 prompt，因此影响 22 × 10 = 220 题。

### P1-04：至少 5 个 `contract` prompt 自相矛盾

Contract archetype 的统一尾句要求不要实现，但以下 base prompt 已明确要求实现
或写可执行工件：

- `q2-eda-rd-100`：先要求 write pseudocode，后说
  “Do not add an implementation”；
- `q2-rtl-037`：先要求 implement a counter，后禁止 implementation；
- `q2-dv-055`：先要求 create assertions，后禁止 implementation；
- `q2-dv-100`：先要求 write a clocked assertion，后禁止 implementation；
- `q2-embedded-028`：先要求 implement a driver，后禁止 implementation。

这会让候选人无法同时满足 prompt 两端，oracle 也无法给出唯一公平判定。

### P1-05：`q-dft-tap-trace` 缺失必需的 TMS fixture

`q-dft-tap-trace.prompt` 声称 “Given a TMS sequence”，但题目没有提供任何
TMS sequence 或 artifact 字段；其 oracle 又要求 “Feed the exact TMS
sequence”。

因此候选人无法生成题目要求的逐 TCK TAP state trace，也无法复现 oracle。
该缺陷污染同一 `baseQuestionId = q-dft-tap-trace` 的 1 anchor + 9 drills。

### P1-06：Supporting skill 被机械升级为主考技能

生成器在部分 worked/derived drills 中把 anchor 的 supporting skill 当成当前题
必须展示的主 hiring signal，即使它并不改变本题结果。

确定例：

- `q2-physical-design-020.skills[0] = sk-binary-representation`，prompt
  要求说明 Binary Representation 在哪里改变 setup/hold slack；实际并不会；
- `q2-eda-rd-110.skills[0] = sk-complexity-analysis`，题目实质只是固定的
  `60 + 90 + 110 + 40 ps` 加法；
- `q2-manufacturing-automation-119.skills[0] = sk-complexity-analysis`，
  题目实质只是 `90% × 80% × 95%` 的 OEE 乘法。

当前 `technicalTargetSkillMatch` 只检查该 skill 是否出现在 base anchor 的
skill list，不检查它是否真被 prompt、deliverable 与 oracle 观察。

### P1-07：Embedded / Manufacturing 的 28 个 integration 被路由到纯软件模板

`integrationDomain()` 把全部 Embedded 和 Manufacturing 题归入
`software-service`，导致 28 题统一要求 release cohort、staged rollout、
telemetry 和 rollback，而缺少相应硬件/安全语义。

代表证据：

- `q2-embedded-126` 是 UART 8N1 integration，却主要要求 limited release
  cohort / rollback；没有系统要求波特率误差、采样时钟、framing/error
  propagation、电气边界或 CDC；
- `q2-manufacturing-automation-108` 是 safety interlock，却主要使用软件
  发布模板；没有要求 fail-safe state、independent protection layer、
  hazard/commissioning、lockout 或 restart authority。

抽样中的纯软件 EDA/CAD/AI、digital hardware 和 analog integration 模板总体
合理；缺陷集中在 mixed-domain 的粗粒度分类。

### P1-08：378 个 generated soft drills 仅复用 3 组 oracle

以下 378 题每个 role 内的 EN/ZH `oracle.procedure` 与
`oracle.acceptance` 完全相同：

- `q2-behavioral-001..126`：126 题共 1 组；
- `q2-project-deep-dive-001..126`：126 题共 1 组；
- `q2-english-communication-001..126`：126 题共 1 组。

例如 `q2-behavioral-001` 要求 evidence inventory，而
`q2-behavioral-126` 要求完整 behavioral loop；两者仍使用同一个宽泛 oracle，
没有判定各自 archetype 的核心提交物。

根因位于 `softQuestionFields()` 的 per-role hard-coded oracle。现有审计只要求
1,512 个 generated technical drills 的 oracle 唯一，刻意漏掉这 378 个
soft drills。

### P1-09：35 条声明的 role ↔ skill edge 没有直接训练覆盖

内容合同要求每个 role 所链接的 atomic skill 至少出现在该 role 的一道题中。
当前 198 条声明边中有 35 条在相应 role 的 `question.skills` 覆盖为 0，
影响 11/15 roles。即使把 `prerequisiteSkills` 也算作覆盖，仍有 18 条缺失。

| Role | 缺失 direct question skill |
| --- | --- |
| `rf-eda-rd` | `sk-linear-algebra`, `sk-linux-shell`, `sk-git-workflows`, `sk-eda-optimization-objectives` |
| `rf-ai-eda` | `sk-complexity-analysis`, `sk-data-structures`, `sk-graph-algorithms`, `sk-linear-algebra`, `sk-python-scripting`, `sk-test-design` |
| `rf-cad-flow` | `sk-complexity-analysis` |
| `rf-rtl` | `sk-fpga-async-fifo` |
| `rf-dv` | `sk-boolean-logic`, `sk-probability-basics`, `sk-eda-event-simulation`, `sk-eda-sat-bdd`, `sk-rtl-cdc` |
| `rf-fpga` | `sk-binary-representation`, `sk-boolean-logic`, `sk-rtl-synthesizable-sv`, `sk-rtl-sequential-logic`, `sk-rtl-reset-design`, `sk-rtl-width-signedness` |
| `rf-architecture` | `sk-cpp-resource-safety`, `sk-rtl-ready-valid` |
| `rf-physical-design` | `sk-graph-algorithms`, `sk-eda-timing-graph` |
| `rf-embedded` | `sk-cpp-resource-safety`, `sk-linux-shell`, `sk-git-workflows`, `sk-dft-jtag` |
| `rf-manufacturing-automation` | `sk-probability-basics`, `sk-linux-shell`, `sk-dft-diagnosis-yield` |
| `rf-project-deep-dive` | `sk-git-workflows` |

现有 audit 只验证 130 个 skills 在全题库范围内都有题，没有按 role-skill edge
验证，因而掩盖了课程树局部断点。

### P1-10：两个 modal 的键盘 focus trap 可立即逃逸

打开 company 或 question modal 后，代码先把焦点放在带 `tabIndex=-1` 的
dialog 容器。Trap 只在 active element 已经是第一个 focusable child 时处理
Shift+Tab。

因此刚打开 modal 立即按 Shift+Tab，active element 仍是 dialog 容器，
既不等于 first 也不等于 last，浏览器默认行为会把焦点送回背景页面。这与
`aria-modal="true"` 的交互承诺不一致，影响两个 dialog 的键盘可访问性。

## 5. P2 — 非阻断但必须进入修复队列

### P2-01：28 个 soft foundation drills 的 timebox 偏紧

以下题只有 12–15 分钟，却要求三个复合 deliverables，包括录音、事实/证据表
或带标注 transcript、self-review/second take：

- Behavioral：
  `q2-behavioral-010`、`011`、`037`、`038`、`100`、`101`；
- Project：
  `q2-project-deep-dive-001`、`002`、`010`、`011`、`019`、`020`、
  `055`、`056`、`064`、`065`、`100`、`101`；
- English：
  `q2-english-communication-001`、`002`、`010`、`011`、`019`、`020`、
  `028`、`029`、`109`、`110`。

### P2-02：5 个 English-role anchor 只在中文明确要求“用英语”

- `q-eng-misunderstanding-repair`;
- `q-eng-concise-debug-summary`;
- `q-eng-pushback`;
- `q-eng-unknown-answer`;
- `q-eng-questions-for-interviewer`。

English prompt 的面试语境暗示了英语回答，但没有与 ZH 中“请用英语”同等明确
的 mandatory response mode。

### P2-03：来源可访问，但不可严格复现

- 5,130 个 `sourceRefs` 全是裸 URL；
- 65 个唯一 URL；
- 0 个 commit、release 或规范版本 pin；
- 1,280 个引用实例直接使用 `/latest/` 或 `/stable/` 路径。

例如 Zephyr `latest`、cocotb `stable` 和多个仓库根目录会随时间漂移。
`evidenceDate` 能说明审阅日，但不能复现当时具体文档内容。

### P2-04：运行时 shard validation 不完整

Build-time 测试能深比较源、index、manifest 和 256 个 shards，但 client runtime
只检查 shard schema/version/id、自报 count，以及 detail 是否有 `id` 和
`contentVersion`。

一个相同版本但缺少 `sourceRefs` 的 detail 会被缓存，随后 UI 在
`.sourceRefs.map()` 处崩溃。Manifest 已有每个 shard 的 count/hash/bytes，
但这些期望值没有传给 client，也没有在 fetch 后校验。

### P2-05：Question index 仍是 eager load

Detail shards 确实按题目懒加载，但 2,687,116-byte index 在应用 mount 时无条件
请求，即使用户从未进入 Interview Dojo。

- raw：2,687,116 bytes；
- gzip：约 225–228 KB；
- brotli：113,916 bytes。

SSR 已成功排除整库，因此这是带宽与低端移动设备启动成本问题，不是 SSR
泄漏或 P0。

### P2-06：内部 generation metadata 候选人可见

- `blueprintId` 出现在每个 public index summary；
- UI 直接显示 raw `blueprintId` 为 “Curriculum lineage”；
- 2,100/2,100 public detail 都携带完整 `generationSpec`，包括
  `origin`、`baseQuestionId`、`archetype`、`contextIndex`、
  `skillIndex` 和 deterministic seed。

这些字段不是 PII，也不直接暴露答案，但会暴露生成策略和同源题关系，方便
候选人针对模板取巧；同时它们不是普通学习者需要的产品信息。

### P2-07：正常 UI 隐藏了大部分 source refs

UI 对 `sourceRefs` 使用 `.slice(0, 1)`：

- 170 题只有 1 个来源；
- 830 题有 2 个来源；
- 1,100 题有 3 个来源；
- 共 1,930/2,100 题在正常界面隐藏至少一个支持来源。

完整引用仍在 public JSON，不是数据丢失；但会削弱普通用户的可追溯性。

### P2-08：ARIA 与 focus style 仍不完整

- Desktop/mobile active navigation 只有视觉状态，没有 `aria-current` 或
  pressed state；
- region filter 把 `aria-label` 放在 generic `<div>` 上，但选项没有
  `aria-pressed` / selected state；
- 部分 input 移除 outline，未提供等价 `:focus-visible` 样式。

正向项：

- dialog 已有 role、`aria-modal` 和 label；
- loading/error 使用 live region；
- CSS 在 760 px 以下正确折叠 question grid、双语列、filters 与 modal；
- 有 `prefers-reduced-motion`；
- pagination current state 已暴露。

### P2-09：`npm start` 的本地 production smoke path 失败

Build 成功后执行 `npm start` 会报：

```text
ERR_UNSUPPORTED_ESM_URL_SCHEME: Received protocol 'cloudflare:'
```

Cloudflare 正式部署路径仍可能正常，但 package 中声明的本地 production
启动命令不可用。当前 tests 通过自定义 import hook 绕过该问题。

### P2-10：缺少真实浏览器 E2E

现有 UI tests 能验证 SSR 边界、source 字符串和分片同步，但 loading/fetch
race、keyboard focus、实际 viewport、移动端触控、modal scroll lock 等多为
源码级断言，不是浏览器交互测试。

本轮尝试连接本地浏览器做补充复验时，当前执行环境没有可用浏览器实例；
因此本报告不声称这些路径已经过真实浏览器验证。应增加 Playwright 或同等
production E2E，至少覆盖：

1. 首次 index loading/error/retry；
2. 快速连续打开两个不同 shard 的 race；
3. modal 初始 focus、Tab/Shift+Tab、Escape 与 focus restore；
4. 360/390/768 px viewport；
5. bilingual、pagination、no-result 与 reduced-motion。

## 6. 为什么自动检查会通过但发布审计失败

当前自动门禁擅长验证“数量和形状”，但对以下语义缺口没有 gate：

- prerequisite level 只验证 ID，不比较等级；
- skill coverage 只验证全局 skill，不验证 role-skill edge；
- oracle uniqueness 只检查 technical drills，不检查 378 个 soft drills；
- target skill match 只检查 skill 是否来自 anchor，不检查是否真被考察；
- 双语数组只检查等长和中文字符，不检查信息量与 policy 同构；
- contract/integration 模板没有与 base task 的动作和领域做冲突检查；
- UI tests 没有真实键盘和 viewport。

因此 `npm run validate` 的 PASS 是必要条件，不是本次发布的充分条件。

## 7. 修复与复验门槛

进入下一轮发布复验前，至少需要关闭全部 P1：

1. 让每条 `prerequisiteSkills` 不高于题目 level，或把它改为被题目显式提供的
   scaffolding/target skill；
2. 为 45 个 foundation anchors 提供真正等价的
   `referenceOutlineZh`；
3. 让 22 个 soft-skill anchors 的所有 policy 在 EN/ZH 双向同构；
4. 让 contract 变体尊重 base task 已要求的实现动作；
5. 给 `q-dft-tap-trace` 提供确定 TMS sequence，并同步 oracle；
6. 避免用 supporting skill 机械主导派生题；
7. 为 Embedded 与 Manufacturing integration 建立 mixed-domain 模板；
8. 为 378 个 soft drills 提供 archetype/task-specific oracle；
9. 补齐 35 条 role-skill direct coverage，或从 skill graph 中删除不真实的
   role link；
10. 修复两个 modal 的初始 Shift+Tab focus trap。

复验必须重新执行：

- 2,100 题完整生成；
- prerequisite 和 role-skill edge 新 gate；
- 210 lineages 与 9 archetypes；
- 75 题原样回归样本，加所有被修 P1 的定向样本；
- EN/ZH policy、数字、单位、timebox、oracle；
- 全量重复；
- manifest/index/256 shards hash；
- SSR、typecheck、lint、build、tests；
- 至少一轮真实浏览器 keyboard/mobile E2E。

## 8. 可复现命令

基础门禁：

```bash
npm run validate
npm run audit:links
npm run questions:check
```

Anchor / lineage 数量：

```bash
jq '[.questions[] | select(.generationSpec.origin=="curated-v1")] | length' \
  data/questions.seed.json
# 210

jq '[.questions[]] | group_by(.generationSpec.baseQuestionId)
  | map(select(length != 10)) | length' data/questions.seed.json
# 0
```

Prerequisite level 缺陷：

```bash
jq --slurpfile sg data/skill-graph.json '
  def rank: {"foundation":0,"entry":1,"intermediate":2,"advanced":3}[.];
  [.questions[] as $q
   | ($q.prerequisiteSkills // [])[] as $sid
   | ($sg[0].skills[] | select(.id==$sid)) as $s
   | select(($q.level|rank) < ($s.level|rank))
   | {id:$q.id, role:$q.roleFamilies[0],
      qLevel:$q.level, prerequisite:$sid, prerequisiteLevel:$s.level}]
  | {edges:length, questions:(map(.id)|unique|length)}
' data/questions.seed.json
# {"edges":252,"questions":222}
```

## 9. 最终发布判断

**修复前基线：FAIL。**

- P0：0；
- P1：10 类；
- P2：10 类；
- 自动构建与结构门禁：PASS；
- 内容、课程路径和键盘可访问性发布门禁：FAIL；
- 允许状态：`review-ready`；
- 禁止状态：`active` / production content release。

本结论针对上述修复前快照。任何生成器、题库、UI 或 audit gate 修改后，都必须
重新生成全部公开资产并进行独立复验，不能把本报告的任何 PASS 自动继承到新
快照。

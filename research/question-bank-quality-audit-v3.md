# AIALRA 题库独立发布复核 v3

审计对象：`contentVersion = 2026-07-23.5` 的 2,100 题冻结候选、公开分片与
Interview Dojo 运行时
审计日期：2026-07-23（America/Los_Angeles）
结论：**PASS，无 P0/P1 发布阻断**

本报告是对
[v2 预修复审计](question-bank-quality-audit-v2.md)
所列问题的独立回归，不替代领域专家和真实学习者 pilot。

## 1. 独立复核方法

复核没有把生成器“运行成功”当成内容正确。它同时执行：

1. 固定 `15 个岗位族 × 每族 5 题` 的 75 题人工语义矩阵；
2. 全量 2,100 题中英字段、题干、交付物、评分、参考骨架和 oracle 结构检查；
3. 210 个场景谱系、1,512 个技术派生、378 个软技能派生的全量关系断言；
4. 全部 2,203,950 个题目对的中英文近重复穷举；
5. 公开摘要索引、256 个详情分片、SHA-256、SSR 边界与内部元数据检查；
6. TypeScript、lint、生产构建与 8 个运行时测试。

固定 75 题矩阵的判定维度为：

- 题目脱离生成器上下文后是否自包含；
- 中文和英文是否表达同一任务；
- 题干是否提供 oracle 执行所需的输入、约束或可构造样例；
- 交付物、rubric、参考骨架和 oracle 是否评估同一个 hiring signal；
- 数字、单位、状态、时序和否定条件是否漂移。

结果：**75/75 PASS**。数字检查出现的 7 处表面差异均为等价表达，例如
`2e12` / `2×10^12`、`Ten` / `10`、`seconds` / `秒`，不存在数值漂移。

## 2. v2 十类 P1 闭环

| v2 P1 | v3 复核 |
| --- | --- |
| 先修能力高于题目层级 | 0 个 skill prerequisite inversion；0 个 question prerequisite violation |
| 中文参考骨架使用通用回退 | 210/210 精确翻译；795/795 条目对齐；旧回退 0 |
| 软技能 policy 中英不对称 | 22/22 锚点双语 policy 已同步 |
| 契约题与实现指令冲突 | 168/168 contract-only，正向实现冲突 0 |
| TAP 缺少可执行 fixture | anchor + 9 派生共 10/10 均含精确 TMS 和两条 TDI |
| supporting skill 被机械当作主技能 | 1,848 个默认主技能 + 42 个审阅 override；130/130 目标技能覆盖 |
| Embedded/Manufacturing 被套用软件集成模板 | 各 14 题使用硬件边界 / 制造安全专属模板 |
| 378 个软技能派生 oracle 机械重复 | 378/378 中英 procedure 与 acceptance 均逐题唯一 |
| 岗位 → 技能边没有本岗位题目 | 198 条声明边缺失 0 |
| 弹窗 Shift+Tab 可逃逸 | 初始焦点、双向循环、focusin 恢复、Escape 恢复均有实现与回归测试 |

## 3. 二次审计中新发现的 P1

### 3.1 TAP 派生题不自包含

预修复版本只补了 `q-dft-tap-trace` 锚点，9 个派生 oracle 仍要求复现 exact
fixture，但派生题干没有完整给出 TMS/TDI。

v3 修复后：

- 谱系成员固定为 10；
- 10/10 中英文题干都包含 24-edge TMS；
- 10/10 都包含 Shift-IR TDI `1,0,1,0`；
- 10/10 都包含 Shift-DR TDI `1,1,0`；
- contract 题的锚点 oracle 只作为 reviewer check，不要求作答者先完成原题。

### 3.2 最小实现题虚构“已提供的无效项”

预修复的 168 个 technical minimal-implementation 统一声称有一个 supplied
invalid item，但大量锚点并没有真正提供。

v3 修复后，168/168 都要求：

1. 先声明并运行一个合法样例；
2. 通过违反恰好一项已声明不变量，构造一个最小无效输入、观测或约束；
3. 显式拒绝坏例且不破坏有效状态；
4. 记录与声明复杂度或资源界一致的成本。

题干和 oracle 对应完整，不再依赖不存在的坏输入。

### 3.3 技术派生题场景信息可能被截断

单点修复 TAP 仍不足以证明其他谱系自包含。v3 因而把修复扩大到全部
1,512 个技术派生：

- 1,512/1,512 英文题干包含完整任务专属 source-scenario payload；
- 1,512/1,512 中文题干包含完整对应场景；
- 1,512/1,512 保留任务专属双语 base oracle core；
- 168/168 契约题明确把原场景标记为 reference-only quotation；
- 168/168 契约 oracle 明确限定为 reviewer-only。

英文引文有 1,188 处有意移除了锚点末尾通用 assumptions/confidentiality
boilerplate；任务专属场景信息没有丢失，外层题干重新声明了等价公开概念和假设
策略。中文保留原 boilerplate。两种语言结构略不对称，但语义完整，不构成发布
阻断。

## 4. 全量指标

| 检查 | 结果 |
| --- | ---: |
| 总题数 | 2,100 |
| 场景锚点 / 递进练习 | 210 / 1,890 |
| 每岗位族 | 140 |
| 任务专属锚点 oracle | 210 |
| 技术派生自包含题干 | 1,512 / 1,512 |
| 最小实现坏例契约 | 168 / 168 |
| reviewer-only 契约 oracle | 168 / 168 |
| 唯一软技能派生 oracle | 378 / 378 |
| 岗位 → 技能缺失边 | 0 / 198 |
| 先修层级冲突 | 0 |
| 精确重复 EN / ZH | 0 / 0 |
| 近重复 `>= 0.90` EN / ZH | 0 / 0 |

英文最近题目对相似度为 `0.688679...`，中文为 `0.692307...`，均显著低于
`0.90` 门槛。

## 5. 运行时与发布门禁

- `npm run validate`：PASS；
- TypeScript / ESLint / production build：PASS；
- Node tests：8/8 PASS；
- 题库源、摘要索引和 2,100 个详情映射一致；
- 256/256 分片 SHA-256 一致；
- 公开详情中的 `generationSpec` 数量为 0；
- SSR 为 734,792 B raw / 125,905 B gzip / 99,471 B Brotli；
- SSR 不包含题目详情内容。

最终题库连续三次生成 SHA-256 一致：

`a93d82520aca72c50eed147126aacf1b059451ac5156dac865bc74cc3bc25590`

## 6. 非阻断 P2

1. 摘要索引仍为异步 eager load；这是使命队列和全局筛选的产品取舍。
2. 一部分公开 URL 使用 `latest`、`stable` 或未钉住提交的官方入口；证据日期
   已冻结，但严格 upstream pinning 仍可加强。
3. 本地 Node `vinext start` 受 `cloudflare:` scheme 兼容性限制；权威运行时为
   Sites/Cloudflare 生产部署。
4. `review-ready` 仍需领域专家与 learner pilot 才能升级为经校准内容。

以上项目不改变本次结论：**v3 可发布，但不得宣称为雇主原题或行业认证题库。**

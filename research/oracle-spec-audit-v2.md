# Oracle Spec V2 合并交叉审计

审计日期：2026-07-23
审计范围：`data/oracle-specs/part-01..15` 的 210 个课程树锚点 oracle，以及 `data/oracle-translations/part-01.json` 的 45 个冻结中文 oracle。
最终结论：**PASS — 当前 oracle 规格无遗留 P0/P1/P2，可进入题库合并与发布验证。**

## 发布门槛结果

| 检查项 | 结果 |
| --- | --- |
| 分片与数量 | 15 个分片，每片 14 项，共 210/210 |
| 锚点 ID 集合 | 相对 `questions.seed.json` 的 210 个 `curated-scenario-v1`：缺失 0、额外 0、重复 0 |
| Schema | 每种语言均严格包含 `kind`、`procedure`、`acceptance`；空字段 0 |
| `kind` 枚举 | EN 仅 `executable/observable`，ZH 仅 `可执行/可观察`；越界 0 |
| 冻结 exact45 | EN 与 `questions.seed.json`、ZH 与 oracle translation catalog 逐对象深比较；差异 0 |
| 新增 165 项数字对齐 | 330 对 procedure/acceptance 的阿拉伯数字序列差异 0 |
| 技术 token 对齐 | 大写缩写、代码式标识符丢失 0；单位语义抽检通过 |
| 字段重复 | 新增 165 项的 EN/ZH procedure/acceptance 均为 165/165 唯一；重复组 0 |
| 通用占位文案 | “All declared invariants hold”等已知模板命中 0 |
| 任务特异性 | 165/165 逐条语义复核通过；英文内容词启发式最小交集为 4，低于 3 的项目 0 |

## 技术与双语复核

- 前 8 个方向（EDA R&D、AI for EDA、CAD/Flow、RTL、DV、FPGA、Architecture、Physical Design）的 88 个新增 oracle 已逐条复核。
- 后 7 个方向（DFT、Analog/Custom、Embedded、Manufacturing Automation、Behavioral、Project Deep Dive、English Communication）的 77 个新增 oracle 由独立审查代理逐条复核。
- 合计 165/165 个新增 oracle 均具有可执行或可观察过程、可判定验收条件、任务专属证据链，以及语义对齐的中英文版本。
- 高风险代表项包括 `q-eda-mini-sta-boss`、`q-aieda-routing-triage-boss`、`q-cad-flow-platform-boss`、`q-rtl-pulse-cdc`、`q-dv-formal-vacuity`、`q-fpga-fifo-pointer-wave`、`q-arch-noc-deadlock`、`q-pd-generated-clock-sdc`、`q-dft-tap-trace`、`q-analog-noise-budget`、`q-emb-dma-cache`、`q-mfg-interlock-review`、`q-beh-ethical-data`、`q-proj-root-cause-replay` 与 `q-eng-misunderstanding-repair`。

## 本轮发现并已关闭的问题

1. `part-14/15` 曾有 19 个新增项使用自定义 `kind`，已统一为契约枚举；`part-15` 的 3 个冻结项已整对象恢复，最终 exact45 深比较为 0 差异。
2. `q-analog-monte-carlo-yield` 的英文 `three` 与中文 `3` 已统一为 `3`，使新增 165 项可机器审计的数字序列完全一致。
3. `q-analog-noise-budget` 曾把所有谱密度都按增益平方折算；现已明确区分功率谱密度除以增益平方、幅度谱密度除以增益。
4. `q-fpga-fifo-pointer-wave` 曾可能被误读为目的域连续采样只能变化一位；现已明确源域 Gray 更新单比特变化，而目的域可跳过合法中间码，但在声明的总线偏斜与 CDC 约束下不得采到源端未产生的混合码。

## 审计边界

本结论验证的是 210 个锚点 oracle 规格本身。题目中写作 “declared limit/tolerance/budget” 的数值由具体 fixture 或答题者显式假设提供；这不构成规格缺陷。由锚点派生的完整题库仍需在最终合并后执行生成、引用完整性、页面呈现和生产构建检查。

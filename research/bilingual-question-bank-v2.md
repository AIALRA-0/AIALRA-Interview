# AIALRA 双语面试题库 v2：设计、题源与验收

证据冻结日期：2026-07-23

状态：v2 发布规范；实际数量和分布以 `npm run audit:data` 的机器审计结果为准

## 1. 目标与边界

v2 的最低发布基线是：

`15 个角色族 × 每族至少 140 题 = 至少 2,100 道完整中英双语任务`

实际课程拓扑为 `210 个独立基础场景 ×（原始场景 + 9 个递进训练）= 2,100
个任务`。递进训练分别锻炼契约、算例、最小实现、故障定位、独立判定、
规模上限、权衡、事故处理和跨层整合；它们是同一工程上下文中的不同招聘
信号，不冒充 1,890 个互不相关的“公司原题”。

“一道题”必须同时包含中英文标题、题干、提交物、评分标准、常见失败、
追问、参考思路和可观察验收条件。只翻译标题、只给中文摘要，或用不同数字
重复同一模板，都不计入合格数量。

题库训练的是可迁移的招聘能力，不声称收录任何公司的真实、原题或高频题。
禁止 NDA 内容、泄露 OA、付费题库复制、面经原文搬运、隐藏测试和访问控制后
的材料。公司与岗位研究只用来确定能力权重；题目本身由公开概念和原创工程
场景构造。

## 2. 角色覆盖

| 角色族 | 训练主轴 |
| --- | --- |
| EDA 研发与算法 | 网表/IR、图算法、优化、解析器、性能和正确性 |
| AI for EDA | 数据与标签、代理目标、泛化、约束、评测与可复现性 |
| CAD 与设计流程 | 工具编排、Tcl/Python、回归、可观测性、环境与发布 |
| RTL 设计 | 微架构、时序逻辑、复位、接口、综合与低功耗意识 |
| 数字验证/UVM/形式验证 | testbench 架构、checker、coverage、SVA、debug |
| FPGA 工程 | RTL、约束、CDC、资源、时序收敛、板级调试 |
| 体系结构/性能/存储 | pipeline、cache、一致性、虚存、建模与瓶颈分析 |
| 物理设计/STA | 约束、时序、布局布线、功耗、信号完整性与签核 |
| DFT 与量产测试 | scan、ATPG、MBIST、覆盖率、诊断与测试成本 |
| 模拟与定制 IC | 器件、电路权衡、PVT、噪声、版图和验证 |
| 嵌入式与固件 | C/C++、中断、驱动、并发、接口、调试和可靠性 |
| 制造与设备自动化 | SECS/GEM、状态机、数据、控制、异常与恢复 |
| 行为面试 | 真实经历、所有权、冲突、失败、影响与反思 |
| 技术项目深挖 | 需求、个人贡献、证据、权衡、验证和复盘 |
| 技术英文表达 | 澄清、结构化解释、设计评审、debug 汇报和问答修复 |

共享基础技能可在多个场景中迁移，但每道题只映射真正被观察的能力，不能为了
覆盖率把无关技能堆进标签。

## 3. 由浅到深的训练结构

每个角色族都必须覆盖以下五类学习证据：

1. **基础辨识**：解释概念、读接口/报告/代码，并识别关键不变量；
2. **受约束实现**：在明确接口、资源或时间预算内完成代码或工程工件；
3. **故障定位**：从 log、waveform、counterexample、测量或复现步骤排除假设；
4. **设计与迁移**：面对新约束比较方案，说明边界、权衡与验证计划；
5. **整合关卡**：同一连续场景内完成澄清、实现、验证、debug 和口头总结。

难度不是术语生僻度。`easy / medium / hard` 由推理跨度、约束耦合、证据噪声、
可行方案数量和验证深度共同决定。`entry / intermediate / advanced` 表示预期
能力阶段；二者必须分别校准。

## 4. 双语同构标准

- 英文和中文是同等完整的学习入口，不存在“主语言 + 摘要语言”。
- 每一对数组逐项等长、同序、同义；评分项不得在翻译时合并。
- 数字、单位、信号、寄存器、API、文件名和协议 token 在两种语言中保持一致。
- 中文使用芯片与软件工程领域的自然术语；英文使用真实工作沟通所需的准确、
  简洁表达，避免逐字硬译。
- 英语表达题仍提供完整中文说明，但明确要求候选人用英文完成指定输出。
- `oracle` 与 `oracleZh` 结构相同；验收条件的严格程度完全一致。
- 双语审阅需要双向核对：只读英文或只读中文，都应得到相同任务、限制和评分。

完整字段约束见
[Interview Content Contract v2](interview-content-contract.md)。

## 5. 公开题源知识格

公开来源的作用是校验概念、术语和工具行为，不是复制题目。优先级为官方标准/
项目文档、官方工程资料、许可明确的开源仓库，最后才是可独立核验的二手资料。

| 知识域 | 代表性一手来源 | 合法使用方式 |
| --- | --- | --- |
| SystemVerilog/UVM | [Accellera UVM](https://www.accellera.org/downloads/standards/uvm) | 引用公开术语与方法，原创 DUT、约束、bug 和评分 |
| 开源 EDA/STA | [OpenROAD](https://openroad.readthedocs.io/en/latest/)、[OpenSTA](https://openroad.readthedocs.io/en/latest/main/src/sta/README.html)、[Yosys](https://yosyshq.readthedocs.io/projects/yosys/en/latest/) | 独立构造 netlist、flow、timing 和算法场景 |
| Python 验证 | [cocotb](https://docs.cocotb.org/en/stable/index.html) | 按许可使用公开 API，测试工件与隐藏检查原创 |
| ISA/体系结构 | [RISC-V ratified specifications](https://docs.riscv.org/reference/home/index.html) | 基于公开架构概念构造新的执行与性能问题 |
| 总线与接口 | [Arm AMBA AXI/ACE specification](https://developer.arm.com/-/media/Arm%20Developer%20Community/PDF/IHI0022H_amba_axi_protocol_spec.pdf) | 不长段复制规范文字；原创 transaction 与故障场景 |
| 安全硬件 | [OpenTitan documentation](https://opentitan.org/book/index.html) | 以公开设计原则构造威胁、验证和生命周期任务 |
| 嵌入式 | [Zephyr driver model](https://docs.zephyrproject.org/latest/kernel/drivers/index.html)、[interrupts](https://docs.zephyrproject.org/latest/kernel/services/interrupts.html) | 原创设备、驱动、并发与故障注入场景 |
| 半导体设备自动化 | [SEMI SECS/GEM overview](https://www.semi.org/en/node/128996) | 使用公开概念，不复制付费标准的表达、表格或测试 |

每个 URL 只证明其支持的公开概念，不表示来源方背书 AIALRA，也不表示该任务
曾在任何雇主的面试中出现。

## 6. 原创题的生成与区分

每道题保存稳定 `blueprintId` 和确定性 `generationSpec`。蓝图定义能力、工件、
中心不变量和验收路径；场景实例至少在一个招聘相关维度上产生实质变化：

- 输入工件或证据类型；
- 根因与失败机制；
- 资源、时延、PPA、可靠性或安全约束；
- 抽象层与系统边界；
- 需要候选人排除的替代假设；
- 最终提交物、验证方法或沟通对象。

仅替换名称、数字、器件型号或公司背景不构成新题。生成过程必须可复现，以便
发现错误后定位整组问题，但最终题目仍需技术和双语抽样复核。

## 7. 自动验收

发布闸门至少检查：

- 总数、每角色数量、角色与技能引用完整；
- 所有中英字段非空，数组等长，oracle 同构；
- ID、规范化标题和规范化题干无精确重复；
- 去除专名、数字和偶然标识后仍不存在结构重复；
- 每角色的 level、difficulty、type、skill 和 blueprint 分布；
- 开场句、长片段和 n-gram 的异常重复；
- 来源策略、公开引用、证据日期和生成 provenance；
- JSON 大小、构建产物、首屏渲染、筛选、分页和无结果状态；
- 移动端和桌面端的双栏/单栏语言阅读；
- API 鉴权、用户隔离、缓存隐私和历史尝试的内容版本边界。

自动检查通过只能得到 `review-ready`。进入 `active` 还需要角色专家、双语审阅者、
可执行 oracle/参考实现（适用时）以及候选人试做校准。

## 8. 训练使用顺序

推荐闭环是：

`目标岗位证据 → 技能差距 → 基础题 → 工件题 → debug 题 → 迁移题 →
整合关卡 → 延迟复测 → 项目证据 → 投递与复盘`

系统不以做题数量替代掌握度。只有在未查看答案、跨场景、延迟复测中仍能给出
可验证结果，相关技能才应提高置信度。单次自评或单次拒信都不能推导为确定的
能力因果。

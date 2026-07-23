# 面试准备与芯片训练平台竞品景观

证据冻结日期：2026-07-23

范围：候选人侧的刷题、课程、在线执行、模拟面试、求职社区与芯片/EDA/验证学习产品

结论用途：定义 AIALRA Career Dojo 的产品边界、差异化和题源治理；不是采购建议，也不是法律意见

## 1. 研究口径

本文只把平台自己的官网、帮助中心、条款或官方产品页作为“平台具有什么功能”的事实依据。没有登录后逐项验证或只在付费区可见的能力，一律不作肯定判断。

- **事实**：能在 2026-07-23 访问的官方页面直接验证；
- **推断**：由多个已验证事实导出的产品判断，明确标为推断；
- **决策**：建议 AIALRA 实施的产品选择，不伪装成市场事实；
- 表格中的 `—` 表示“在本次引用的公开官方页面中未观察到”，不等于证明该平台绝对没有；
- 数量、价格、题目和功能会变化，任何带数量的描述都只代表证据冻结日页面显示的状态；
- 本研究观察竞品的产品形态，不复制其题目、答案、隐藏测试、课程或付费内容。

## 2. 执行摘要

1. **通用刷题已经高度成熟。** LeetCode 的优势是大规模自动判题、题目标签、学习路径、公司相关内容、竞赛与社区；HackerRank 已把练习、模拟测评、AI 面试与认证串成软件工程师 Prep Kit。AIALRA 不应靠“再做一套算法题库”竞争。
2. **模拟面试也已有强者。** interviewing.io 强在匿名的资深工程师模拟与高质量反馈；Exponent Practice（原 Pramp）强在大规模同伴匹配、互换角色、协作编辑器和 AI 反馈。AIALRA 的机会不是复刻视频房间，而是先把芯片岗位的评分维度、工件和追问树做深。
3. **中国求职闭环的直接参照是牛客。** 牛客公开页面已把公司题库、专项练习、在线编程、面经、AI 模拟面试、简历、职位与社区放在同一入口；它证明“学习—面试—招聘”一体化有价值，也使“仅有公司列表和题库”不足以构成差异。
4. **芯片垂直内容并非空白。** HDLBits 已能自动仿真判定 Verilog 小电路；VLSI Verify 已覆盖教程、面试问答、测验、代码练习、弱项/进度视图及 EDA Playground 可执行链接；ChipVerify 和 Siemens Verification Academy 在 SystemVerilog、UVM、SVA、coverage、verification planning 等内容上很深；EDA Playground 提供多语言、多库、多仿真器的在线实验环境。
5. **仍然缺少的是闭环，而非单个功能。** 本次样本中，没有一个已验证平台同时把“有日期和来源的公司/岗位证据 → 标准角色族 → 先修技能图 → 可运行的芯片工程工件 → 结构化评分与迁移复测 → 投递与面试结果”作为同一个学习控制系统。这是差异化假设，不是对全球所有产品的排他性声明。
6. **题量不能以版权和诚信为代价。** 多个平台条款明确限制抓取、复制、衍生、竞争性使用或未经授权转载。AIALRA 必须依靠原创同构题、公开概念、许可明确的开源材料和经过同意且脱敏的用户信号；“网上能看到”不等于“可复制进题库”。

## 3. 功能矩阵

标记：`●` 为平台原生核心能力；`◐` 为部分覆盖或通过相邻能力实现；`—` 为本次官方公开页未观察到。

| 平台 | 自动判题或可执行环境 | 结构化学习/弱项反馈 | 真人或 AI 模拟 | 公司/岗位与求职闭环 | 芯片、EDA、RTL、DV 深度 | 可借鉴的强项 | AIALRA 不应照搬的部分 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LeetCode | ● 通用代码判题、Playground | ● Explore、Study Plan、完成进度 | ◐ 企业在线面试产品；候选人模拟不是公开页主轴 | ◐ 公司相关题和职业社区，无本项目所需的岗位证据链 | — | 低摩擦判题、题目发现、持续练习习惯 | 以公司题频和算法题量代替岗位能力建模 |
| HackerRank | ● 练习、限时 Mock Test、自动评估 | ● AI Tutor、报告、Prep Kit、认证 | ● AI coding/system-design interview | ◐ 模拟真实筛选流程，但公开页当前仅确认 Software Engineer Prep Kit | — | 从练习到测评再到认证的清晰阶段门 | 把通用软件工程认证逻辑直接套到芯片岗位 |
| interviewing.io | ● 协作编码环境 | ◐ 以每场专家反馈和定制辅导为主 | ● 匿名资深工程师模拟；● AI coding/system design | ◐ 公司过程指南和公司定向辅导 | — | 高真实性压力训练、可执行的专家反馈 | 在没有芯片评分标准前先建设昂贵的导师市场 |
| Exponent Practice / Pramp | ● DSA、SQL、Frontend 协作编辑器 | ● 课程、题库、rubric、AI/同伴反馈 | ● 同伴互换角色；● AI；◐ 付费教练 | ◐ 公司指南、经历和 referrals，但主训练仍以通用科技岗位为中心 | — | 匹配、排期、互评、复盘和练习频次 | 让低校准同伴评分直接成为“掌握”结论 |
| 牛客 | ● 在线编程与企业笔试 | ● 题库、专项、课程、面经、社区 | ● 官方入口列出 AI 模拟面试；另有企业笔面试产品 | ● 招聘、内推、公司真题、简历与社区同站 | ◐ 有硬件/芯片题材和社群，未观察到完整 HDL/UVM 工件判题闭环 | 中国校招节奏、社区信号和招聘入口整合 | 抓取或复刻公司真题、付费专栏与用户面经原文 |
| HDLBits | ● Verilog 仿真并与参考测试向量比对 | ● 按主题和大致难度组织，可跟踪进度 | — | — | ● Verilog、组合/时序逻辑、波形阅读、基础 testbench | 小步快反馈、硬件专用 oracle | 把“输出匹配”当作对架构、验证计划和 debug 能力的完整评价 |
| VLSI Verify | ◐ 代码练习并链接 EDA Playground；测验与模型答案 | ● 教程、分级问答、测验、弱项/进度面板 | — | — | ● Verilog、SystemVerilog、UVM、SVA、coverage、RAL、TLM、协议 | 垂直知识覆盖与从教程到练习的连续性 | 再做一套静态问答目录；未经授权复制其问答或代码 |
| EDA Playground | ● HDL、UVM/OVM 与多种免费/商业工具在线运行 | ◐ 示例和可分享 Playground，非完整自适应课程 | — | — | ● SystemVerilog/Verilog、VHDL、UVM、SVAUnit、SVUnit、SystemC 等 | 在线执行、分享复现、多工具后端 | 把工具沙箱本身误认为面试课程和可靠评分系统 |
| ChipVerify | ● Lab 提供仿真、综合、波形、STA、lint 等 | ● 教程和推荐学习顺序 | — | — | ● Digital Design、Verilog、SystemVerilog、UVM、verification、synthesis、UPF | 工具链一体化与概念—实验连接 | 复制其文章、源码和图；其条款明确要求转载前获许可 |
| Siemens Verification Academy | ◐ 可执行示例、课程与厂商工具生态 | ● 课程、Cookbook、论坛、按主题/难度内容 | — | — | ● UVM、coverage、SVA、formal、CDC/RDC、planning、debug 等工业主题 | 方法论深度、工业术语与专家社区 | 用单一厂商工作流冒充通用面试标准 |
| **AIALRA Career Dojo（目标）** | **● 多种工件 oracle，而非只判一段代码** | **● 岗位驱动的技能 DAG、误区记忆、迁移复测** | **● 芯片角色追问树；真人层后置** | **● 美中组织/岗位证据、投递、结果与训练权重闭环** | **● EDA R&D、CAD flow、RTL、DV、FPGA、架构、PD、DFT 等** | **把分散能力变成证据到掌握的控制系统** | **不得声称“题最多”或使用泄露题制造虚假命中率** |

## 4. 平台事实与产品推断

### 4.1 LeetCode

**事实**

- 官方首页在证据冻结日展示 `4200+` questions，并把 Problems、Explore、Contest、Discuss 和 Playground 作为核心能力：[LeetCode](https://leetcode.com/?locale=en_US)。
- 官方帮助页说明 Explore 的 Learn 卡与 Interview 卡提供章节结构、公司相关题目和完成状态：[QuickStart Guide](https://support.leetcode.com/hc/en-us/articles/360012067053-LeetCode-QuickStart-Guide)、[How to use Explore](https://support.leetcode.com/hc/en-us/articles/360013578114-How-to-use-Explore)。

**推断**

- 它解决的是规模化通用编程熟练度与题型识别，不会自然产出 verification plan、波形根因、SVA 性质、UVM 架构、PPA 权衡或 EDA 工具设计这些芯片招聘信号。
- AIALRA 应保留其“快速提交—即时反馈—连续进度”的交互效率，但评价单元必须从函数输出扩展为工程工件。

### 4.2 HackerRank

**事实**

- 当前官方 Prep Kit 把 role-specific practice、AI Tutor、Mock Test、AI Mock Interview、报告和可分享认证串联起来；公开页当前列出的 Prep Kit 是 Software Engineer：[Introduction to Prep Kits](https://help.hackerrank.com/articles/1723224478-introduction-to-prep-kits)。
- 该 Kit 明确包含 60 分钟 coding mock 和 60 分钟 system-design mock。

**推断**

- HackerRank 展示了“学习—仿真筛选—认证”的强产品节奏；AIALRA 需要类似阶段门，但认证只能在芯片任务具有可复核 oracle、校准样本和人工审查后推出。

### 4.3 interviewing.io

**事实**

- 官方页提供匿名、无视频的专家模拟，面试官定位为 Senior/Staff/Principal 工程师或经理，覆盖 coding、system design、ML、frontend、behavioral 等，并在结束后提供详细反馈：[interviewing.io](https://interviewing.io/)。
- 同页还提供 AI coding/system-design interviewer，并称可免费练习其合作书籍的 200 多个问题。

**推断**

- 它的护城河是高真实性人类反馈，而不是题库本身。AIALRA 在引入真人之前，应先做出可复用的芯片角色 rubric 和 interview packet，否则导师质量无法规模化校准。

### 4.4 Exponent Practice / Pramp

**事实**

- Pramp 已并入 Exponent；官方 Practice 页说明系统按时间、角色、经验和练习目标匹配同伴，双方各做约 30 分钟 interviewer/interviewee，并交换 rubric 反馈：[Exponent Practice](https://www.tryexponent.com/practice)、[Pramp integration announcement](https://www.tryexponent.com/blog/introducing-exponent-practice)。
- 当前支持 DSA、system design、behavioral、product、SQL、data science/ML、frontend 等；部分类型有协作代码编辑器，部分类型提供 AI 评分。

**推断**

- “当一次面试官”本身是有效学习机制，适合未来的 UVM environment review、RTL design review 和 bug triage。必须提供标准追问、参考信号与评分锚点，防止同伴互评漂移。

### 4.5 牛客

**事实**

- 官方首页把公司真题、专项练习、面试题库、在线编程、面经、AI 模拟面试、简历和求职放在统一导航中：[牛客首页](https://www.nowcoder.com/?target=main)。
- 官方“关于牛客”页面列出 IT 题库、在线编程、课程、社区、竞赛、笔面试和 ATS 等产品；官方 App 页明确覆盖互联网、硬件、汽车等笔试题和招聘/内推：[关于牛客](https://www.nowcoder.com/nowcoder/about/?fromPut=b2c_about)、[牛客 App](https://www.nowcoder.com/app)。
- 平台上存在大量芯片/硬件面经与岗位社区内容，但这类帖子是用户或运营整理内容，不应自动视为经企业确认的面试事实。

**推断**

- 牛客是 AIALRA 中国侧最重要的形态参照：用户需要的不只是“学会”，还需要招聘日历、岗位入口、社区情报和复盘。
- AIALRA 的差异不能是再聚合一份面经，而应是把面经降维为经过权利审查的“技能频率信号”，再由系统生成原创任务。

### 4.6 HDLBits

**事实**

- HDLBits 将小型 Verilog 电路与参考测试向量仿真对比并即时反馈；题目按 Verilog language、combinational、sequential、reading simulations、writing testbenches 等组织：[HDLBits](https://hdlbits.01xz.net/wiki/Main_Page)、[Problem sets](https://hdlbits.01xz.net/wiki/Problem_sets)。

**推断**

- 它证明硬件题可以拥有低成本自动 oracle。AIALRA 应把这个范式扩展到 lint、隐藏波形、形式性质、coverage、日志分类、资源/时序约束和解释质量，而不是只扩大 Verilog 小题数量。

### 4.7 VLSI Verify

**事实**

- 官方首页在证据冻结日列出 Verilog、SystemVerilog、UVM、assertions、coverage、RAL、TLM、协议教程，以及测验、guided coding problems、progress dashboards 和 EDA Playground 可执行链接：[VLSI Verify](https://vlsiverify.com/)。
- 其 interview section 按 basic/intermediate/difficult 组织 Verilog、SystemVerilog、UVM 和 AMBA 协议问答：[Interview Questions](https://vlsiverify.com/interview-questions/)。

**推断**

- 这是最接近“芯片刷题站”的直接竞品，说明垂直内容和进度面板本身已不足以独特。
- AIALRA 必须在动态岗位证据、先修图、真实工程工件、闭环复测、投递结果学习和来源审计上领先，而不是以页面数量竞争。

### 4.8 EDA Playground

**事实**

- 官方页面允许在浏览器编辑、运行和分享 HDL；证据冻结日公开选择项覆盖 SystemVerilog/Verilog、VHDL、Python+HDL、C++/SystemC、UVM/OVM、SVAUnit、SVUnit、VUnit，并列出免费和商业仿真/综合工具：[EDA Playground](https://www.edaplayground.com/home)。
- 运行代码需要登录；商业工具访问还受账号验证和批准限制。

**推断**

- 它适合作为外部执行与复现实验链接，但不应成为 AIALRA 的唯一执行依赖。核心练习必须有可控的开源 runner 和确定版本，商业工具仅作可选验证路径。

### 4.9 ChipVerify

**事实**

- 官方首页提供 Digital Design、Verilog、SystemVerilog、UVM、verification、RTL synthesis、UPF 的免费教程和推荐学习顺序；其 Lab 页面入口宣称支持 Icarus/Verilator、Yosys、OpenSTA、波形、FSM、lint 和 GitHub 同步：[ChipVerify](https://chipverify.com/)。

**推断**

- 它说明“概念文章 + 浏览器工具链”已经成立。AIALRA 应把同一工具链包进岗位化的任务、隐藏检查、rubric 和复盘，而不是单独建设文档站。

### 4.10 Siemens Verification Academy

**事实**

- 官方站点提供 UVM、SystemVerilog、coverage、formal、CDC/RDC、FPGA verification、verification planning 等内容入口，并有课程、Cookbook、示例、论坛和按受众难度筛选的内容：[Verification Academy](https://verificationacademy.com/)、[Forums](https://verificationacademy.com/forums/)。

**推断**

- 它是工业知识和术语的上游参考，不是候选人闭环刷题产品。AIALRA 可以引用公开概念和链接，但题目应保持厂商中立，并要求学习者解释何时结论依赖具体工具。

## 5. 半导体 / EDA / 验证的关键缺口

### 5.1 现有平台通常把招聘信号拆散

**推断**

一个真实的 DV 或 EDA 候选人需要同时证明：

1. 能读懂岗位和产品上下文；
2. 能写代码或 RTL；
3. 能设计验证策略，而非只解释术语；
4. 能从 waveform、log、seed、coverage hole 或 timing report 中定位根因；
5. 能写最小复现、自动化脚本、测试和工程说明；
6. 能在追问中说明权衡、边界和失败经历；
7. 能把这些证据映射回具体 requisition。

通用算法平台主要覆盖第 2 点；芯片教程覆盖第 1、3 点中的知识；在线 HDL 环境覆盖第 2、4 点的一部分；模拟平台覆盖第 6 点。缺口是把七点组织成可学习、可复测、可投递的系统。

### 5.2 “通过测试”不等于“达到招聘信号”

RTL 输出正确仍可能存在 latch、CDC、不可综合结构、糟糕复位、时序或可维护性问题；UVM 代码能编译仍可能缺少 checker independence、coverage intent、reuse boundary 和 debug observability。AIALRA 的 oracle 应至少分为：

- correctness；
- synthesis/lint/static checks；
- verification completeness；
- robustness and negative cases；
- debugging explanation；
- design trade-off；
- communication and artifact quality。

### 5.3 芯片岗位需要多回合、同一系统的纵深追问

面试很少停在一道孤立语法题。更有效的训练是围绕同一个 DUT 或工具问题逐层变化：

`读规格 → 澄清假设 → RTL/代码 → 写 checker → 注入 bug → 看 waveform/log → coverage closure → 修改约束 → 设计评审 → 英文总结`

这种“连续世界状态”的 Boss Fight 是 AIALRA 比静态问答更有价值的方向。

### 5.4 美中双轨需要显式建模

同一能力在美国企业、中国企业、研究院、高校实验室和开源项目中的岗位名称、招聘节奏、资格限制和评价工件不同。AIALRA 应保留统一技能图，但让岗位证据、机会可达性和投递流程分轨；不能把公司国别或签证状态混成一个伪精确的录取概率。

## 6. AIALRA Career Dojo 的独特定位

建议定位：

> **面向半导体、EDA 与验证岗位的 Evidence-to-Mastery Career OS：把当前机会证据编译成技能差距、可执行训练、可公开工程证据和下一次投递动作。**

这是一项可验证的产品假设，不使用“全球唯一”“题目最多”之类无法证明的营销语。

### 6.1 Job-Diff Compiler

**决策**

输入一条有来源和日期的当前 JD，提取 `must / should / bonus / eligibility / team problem / interview signal`，映射到规范角色族和技能节点，生成：

- 本周必须修复的前三个证据缺口；
- 可复现项目或题目；
- 该岗位专属追问；
- 投递前检查表；
- 需要人工核验的资格或出口管制语言。

验收标准：每个推荐动作能回溯到 JD 句子、技能节点和题目/工件，不产生无来源的“录取概率”。

### 6.2 Artifact-first Hardware Judge

**决策**

题目提交物不局限于答案文本，应支持：

- Verilog/SystemVerilog 源码和 testbench；
- waveform 标注与根因时间线；
- SVA property 与 counterexample 解释；
- coverage model、coverage hole 和 closure plan；
- UVM component diagram、sequence/checker 设计；
- Python/Tcl/C++ EDA 工具脚本、parser 与 regression report；
- synthesis/lint/STA/CDC 类报告的解读；
- design-review memo、项目 deep dive 与英文口述。

开源 runner 优先采用版本锁定的 Icarus Verilog、Verilator、Yosys、OpenSTA 和普通软件测试工具；商业仿真器只作为可选外链或用户自带环境。

### 6.3 Mastery Graph，而不是完成清单

**决策**

每次 attempt 更新：

- 技能掌握估计与置信度；
- 失败模式（概念、实现、debug、沟通、时间管理）；
- 是否看过提示或参考解；
- 同构题复测时间；
- 跨上下文迁移是否成功。

“做过”不等于“掌握”。只有在延迟复测和新的上下文仍能通过，技能节点才进入稳定状态。

### 6.4 Role-specific Boss Fight

**决策**

为 DV、RTL、EDA R&D、CAD flow、FPGA、architecture、physical design、DFT 等分别建立 60–180 分钟连续场景；共享底层工件协议，但拥有不同 rubric。每场输出：

1. 结构化分数；
2. 证据片段；
3. 最大失败模式；
4. 下一组微练习；
5. 可加入项目组合的工件；
6. 对目标岗位的 readiness 变化及其理由。

### 6.5 Application Learning Loop

**决策**

投递记录不是 CRM 附件，而是训练系统的反馈：

`岗位版本 → 投递材料版本 → OA/面试阶段 → 被问能力 → 结果 → 复盘 → 技能权重更新`

只在样本量足够时做趋势判断；单次拒绝不得被解释为某项能力或身份的确定因果。

### 6.6 Provenance-by-design

**决策**

每道题在 UI 中展示来源政策、证据日期、状态和审核等级。用户应能区分：

- 原创同构题；
- 公开规范概念衍生但完全原创表述；
- 明确开源许可的改编；
- 经同意且脱敏的用户贡献；
- 只保存链接和非表达性元数据。

来源不可审计的题不得进入“高频公司题”营销标签。

## 7. 版权、条款与题源风险

### 7.1 已验证的竞品条款信号

- LeetCode 条款把 questions、solutions 等列为平台内容，并明确禁止 crawling、scraping 或 spidering：[LeetCode Terms](https://leetcode.com/terms/)。
- HackerRank 候选人条款保留服务及材料权利，限制复制、衍生和用于竞争性分析/产品；用户还需保证上传内容不侵犯第三方权利或保密关系：[HackerRank Terms](https://www.hackerrank.com/about-us/terms-of-service)。
- interviewing.io 条款明确限制复制、抓取、自动采集，以及为竞争产品或机器学习产品使用其材料：[interviewing.io Terms](https://interviewing.io/terms)。
- Exponent 条款禁止未经许可抓取、复制、制作衍生物或用于竞争服务，也明确禁止披露违反现任、前任或潜在雇主保密义务的信息：[Exponent Terms](https://www.tryexponent.com/tos)。
- ChipVerify 明确声明站内文章、源码和信息受版权保护，分发或再发布需要许可：[ChipVerify Terms](https://chipverify.com/sitemap/info/terms-and-conditions)。
- 牛客免责声明表示用户原创作品由平台与作者共同享有版权，未经书面授权不得转载或用于商业用途：[牛客免责声明](https://www.nowcoder.com/html/disclaimer)。

这些条款本身已经足以否决“全网抓取竞品题目并改几个数字”的方案。

### 7.2 风险矩阵

| 来源类型 | 默认风险 | AIALRA 处理 |
| --- | --- | --- |
| 竞品免费/付费题目、答案、隐藏测试 | 极高 | 不抓取、不复制、不近似改写；只研究产品功能 |
| 候选人记忆的精确公司题、录音、面试官话术 | 极高 | 拒绝原文；只在无 NDA、已同意、已脱敏条件下保留 broad topic metadata |
| 公司 OA 泄漏、访问控制后的材料、群内“真题包” | 极高 | 禁止入库并记录拒绝原因 |
| 官方 JD、产品页、工程博客 | 中 | 保存链接、日期与事实；用原创场景训练对应能力，不声称题目真实出现 |
| 标准、协议和厂商文档 | 中 | 引用公开概念和链接；不复制付费标准文本、图、表或测试程序 |
| 开源代码、issue、test、文档 | 中 | 逐文件核验许可证与归属；遵守署名、notice、share-alike 等条件 |
| 用户自有项目与经验 | 中 | 获得权利确认、脱敏、允许删除；不接收雇主/客户机密 |
| 从基础工程概念独立创作的同构题 | 低 | 仍需重复检测、技术复核与来源说明 |

### 7.3 发布前强制闸门

每道题至少经过：

1. **来源登记**：来源类别、URL、访问日期、许可证/权利基础、允许做什么；
2. **保密筛查**：NDA、雇主材料、个人身份、未发布产品、隐藏测试；
3. **原创性筛查**：文本、结构、输入约束、答案路径四层重复检测；
4. **技术审核**：题目可解、假设完整、oracle 独立、边界与负例充分；
5. **双语审核**：中英文语义一致，术语与难度不漂移；
6. **可执行审核**：runner 版本锁定，公开与隐藏测试、超时和安全沙箱通过；
7. **状态发布**：`draft → review-ready → calibrated → published`，未校准题不能用于高风险 readiness 判断。

任何一个闸门缺失，都不能用“数量目标”覆盖。

## 8. 可执行差异化路线

### P0 — 先完成可信闭环

- 组织/岗位证据、角色族、技能 DAG、题目、attempt、application outcome 采用稳定 ID；
- 每个角色族至少包含概念、coding/RTL、debug、design、project deep dive、behavioral/communication 六类信号；
- UI 能从岗位一路点击到技能、先修、题目、工件、评分和下一步；
- 100% 已发布题显示 provenance、review status 和 evidence date；
- 不实现任何实时面试作弊、隐蔽提示或泄题功能。

### P1 — 建立芯片工件护城河

- 开源 HDL/软件 runner；
- waveform、log、lint、synthesis、STA 类任务；
- 误区级反馈与延迟复测；
- DV、RTL、EDA R&D/CAD flow 三条首发 Boss Fight；
- 将成功工件打包成可公开、可复现的 evidence packet。

### P2 — 岗位编译与申请学习

- 对当前 requisition 做带引用的需求拆解；
- 生成岗位专属 7/14/30 天 mission；
- 记录材料版本、阶段、面试信号和结果；
- 用漏斗证据调训练权重，不伪造因果和概率；
- 美国、中国、研究院/实验室、开源四条机会管线分别统计。

### P3 — 模拟与贡献生态

- 先上线有标准脚本和评分锚点的同伴 design review；
- 再引入经过校准的行业 reviewer；
- 用户贡献只接收已授权、可删除、可脱敏内容；
- 贡献奖励以高质量原创任务、参考实现、测试和审核为中心，不奖励“独家真题”。

## 9. 成功指标与护栏

### 9.1 北极星指标

`Evidence-backed qualified applications`

一次“合格投递”必须同时满足：

1. 当前岗位证据有效；
2. 关键技能没有未知阻断项；
3. 至少一个与岗位高度相关的可复现工件通过；
4. 最近一次相关 Boss Fight 达到最低 rubric；
5. 简历/作品集版本与岗位映射已记录；
6. 资格和风险项已人工核验。

### 9.2 学习质量指标

- 延迟复测通过率，而非累计做题数；
- 新上下文迁移成功率；
- 首次独立完成率与提示依赖率；
- debug 根因定位时间；
- rubric 维度的稳定性；
- 工件可复现率；
- 题目技术争议率和撤回率；
- 来源与审核完整率。

### 9.3 求职结果指标

- 合格投递到 recruiter/OA、技术面、终面的分阶段转化；
- 不同角色族和证据包的有效样本趋势；
- 被问能力与训练覆盖的差距；
- 拒绝/退出原因的已知与未知比例；
- 每次结果后是否产生了明确的训练或定位调整。

### 9.4 不可突破的护栏

- 禁止泄漏题、NDA 内容、付费墙复制和绕过访问控制；
- 禁止在真实受监督面试中提供隐蔽实时答案；
- 禁止把公司级标签当作当前职位资格结论；
- 禁止以身份、国籍或一次结果输出伪精确录取概率；
- 禁止以 AI 自评分替代技术 SME 校准；
- 禁止把“已完成”展示成“已掌握”。

## 10. 官方证据索引

全部链接最后核验于 2026-07-23。

| 平台 | 产品事实 | 条款/版权 |
| --- | --- | --- |
| LeetCode | [Homepage](https://leetcode.com/?locale=en_US) · [QuickStart](https://support.leetcode.com/hc/en-us/articles/360012067053-LeetCode-QuickStart-Guide) · [Explore](https://support.leetcode.com/hc/en-us/articles/360013578114-How-to-use-Explore) | [Terms](https://leetcode.com/terms/) |
| HackerRank | [Prep Kits](https://help.hackerrank.com/articles/1723224478-introduction-to-prep-kits) | [Community and Candidate Terms](https://www.hackerrank.com/about-us/terms-of-service) |
| interviewing.io | [Product](https://interviewing.io/) | [Terms](https://interviewing.io/terms) |
| Exponent / Pramp | [Practice](https://www.tryexponent.com/practice) · [Pramp integration](https://www.tryexponent.com/blog/introducing-exponent-practice) | [Terms](https://www.tryexponent.com/tos) |
| 牛客 | [Homepage](https://www.nowcoder.com/?target=main) · [About](https://www.nowcoder.com/nowcoder/about/?fromPut=b2c_about) · [App](https://www.nowcoder.com/app) | [免责声明](https://www.nowcoder.com/html/disclaimer) |
| HDLBits | [Main](https://hdlbits.01xz.net/wiki/Main_Page) · [Problem sets](https://hdlbits.01xz.net/wiki/Problem_sets) | 未在本次研究中确认独立授权条款；默认只链接，不复制 |
| VLSI Verify | [Home](https://vlsiverify.com/) · [Interview questions](https://vlsiverify.com/interview-questions/) | 未确认可再利用许可；默认只链接，不复制 |
| EDA Playground | [Product](https://www.edaplayground.com/home) | 未确认内容再利用许可；保存外链实验需遵守其账号、可见性和工具限制 |
| ChipVerify | [Product and Lab entry](https://chipverify.com/) | [Terms](https://chipverify.com/sitemap/info/terms-and-conditions) |
| Siemens Verification Academy | [Academy](https://verificationacademy.com/) · [Forums](https://verificationacademy.com/forums/) | 遵循页面及 Siemens 对应条款；本文不主张其内容可复制 |

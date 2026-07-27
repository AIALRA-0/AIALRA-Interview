# 面试准备与芯片训练平台竞品景观 / Interview Preparation & Semiconductor Training Landscape

证据冻结日期 / Evidence cutoff: **2026-07-26**

范围 / Scope: 候选人侧刷题、结构化课程、在线执行、模拟面试，以及数字芯片、RTL、验证、EDA 与流片学习平台 / Candidate-facing practice, structured learning, executable labs, mock interviews, and digital-design, RTL, verification, EDA, and tapeout learning platforms.

用途 / Purpose: 定义 AIALRA Career Dojo 的产品边界、差异化、训练协议与题源治理；不是采购建议、法律意见或对任何平台的完整审计 / Define the product boundary, differentiation, training protocol, and content governance for AIALRA Career Dojo; this is not purchasing advice, legal advice, or an exhaustive audit of any platform.

## 1. 研究口径 / Research method

- **已验证事实 / Verified fact**：能在证据冻结日从平台官网、官方帮助中心、官方文档、官方仓库或官方条款直接确认 / Directly supported by an official product page, help center, documentation, repository, or terms page available on the cutoff date.
- **结构化推断 / Structured inference**：由已验证事实导出的产品判断，不能冒充平台承诺 / A product conclusion derived from verified facts; it must not be represented as a platform promise.
- **AIALRA 决策 / AIALRA decision**：建议本项目采用的机制，不代表竞品现状 / A mechanism proposed for this product, not a claim about a competitor.
- **未知 / Unknown**：本次公开证据无法确认；`—` 表示“未在所引公开页面观察到”，不等于证明绝对不存在 / Not confirmed by the cited public evidence; `—` means “not observed in the cited public pages,” not “proven absent.”
- 数量、价格、可用课程、工具后端和产品状态都会变化；带数量的描述只代表冻结日页面显示 / Counts, pricing, available courses, tool backends, and product status can change; numeric claims are point-in-time observations.
- 没有登录、没有完成付费购买或没有逐项实际运行的能力，不作超出公开证据的肯定判断 / Capabilities not individually tested behind login or payment are not asserted beyond what public evidence supports.
- 本文研究产品机制，不复制竞品题目、答案、隐藏测试、课程正文、评分锚点或付费内容 / This document studies product mechanisms; it does not copy competitor questions, answers, hidden tests, course text, scoring anchors, or paid content.

## 2. 执行结论 / Executive conclusions

1. **通用算法题库不是空白市场 / General coding practice is not an open market.**
   LeetCode 已把大规模题库、自动判题、标签、学习计划、竞赛与社区做成习惯系统；NeetCode 把题型模式和先后顺序压缩为清晰路线；HackerRank 与 CodeSignal 又把训练、仿真筛选、结构化测评、反馈和认证连接起来。AIALRA 不应以“另一套算法题库”作为核心差异 / LeetCode has scaled problems, judging, tags, plans, contests, and community into a habit system; NeetCode compresses patterns into an ordered roadmap; HackerRank and CodeSignal connect practice, screening simulation, structured assessment, feedback, and validation. Another generic algorithm bank is not a defensible core.

2. **成熟产品正在从“看答案”走向“分阶段做题和反馈” / Mature products are moving from answer consumption to staged practice and feedback.**
   Hello Interview Guided Practice 让用户逐步完成系统设计并获得每一步反馈；Educative/Grokking 以模式组织课程、交互练习和章节模拟；AlgoExpert 强调精选题、概念解释、代码走读、复杂度与限时测评。AIALRA 应借鉴训练节奏，而不是复制其题面 / Hello Interview uses stepwise guided design with feedback; Educative/Grokking organizes interactive learning and mocks around reusable patterns; AlgoExpert combines curated tasks, conceptual explanations, code walkthroughs, complexity, and timed assessments. AIALRA should adopt the learning rhythm, not their expressions.

3. **真人模拟有价值，但成本、供给和校准决定可扩展性 / Human mocks are valuable, but supply, cost, and calibration determine scalability.**
   interviewing.io 强在匿名资深工程师模拟与详细反馈；Exponent Practice 强在同伴匹配、双方轮换角色和 rubric/AI 反馈。Hello Interview 已于 2026-05-31 结束真人模拟和导师服务，同时保留产品化训练，进一步说明 1:1 服务不应成为首发依赖 / interviewing.io differentiates through anonymous senior-engineer mocks and detailed feedback; Exponent Practice through peer matching, role switching, and rubric/AI feedback. Hello Interview ended live mock and mentorship services on 2026-05-31 while retaining productized practice, reinforcing that 1:1 supply should not be a launch dependency.

4. **芯片学习资源很多，但招聘闭环仍被拆散 / Semiconductor learning is rich, but the hiring loop remains fragmented.**
   HDLBits 提供小型 Verilog 自动 oracle；EDA Playground 提供多语言、多库、多仿真器在线实验；Siemens、Cadence、Synopsys 提供工业方法与厂商工具课程；OpenROAD 提供可复现 RTL-to-GDS 和 QoR；Tiny Tapeout 把项目送到真实制造；Nand2Tetris 提供由门到软件栈的递进项目。它们分别很强，却不负责把当前 JD、技能缺口、训练工件、面试表现和投递结果连接起来 / HDLBits offers a compact Verilog oracle; EDA Playground offers multi-language, multi-library execution; Siemens, Cadence, and Synopsys teach industrial methods and tools; OpenROAD makes RTL-to-GDS and QoR reproducible; Tiny Tapeout reaches real fabrication; Nand2Tetris builds a full stack from gates upward. Each is strong, but none is responsible for connecting a current JD to skill gaps, artifacts, interview performance, and application outcomes.

5. **AIALRA 的护城河必须是控制系统，而不是内容堆积 / AIALRA’s moat must be a control system, not a content pile.**
   本次样本中，没有一个已验证平台把“带日期和来源的 JD → 依赖能力图 → 中英两遍训练 → 真实硬件工程台 → 提示预算与分阶段 gate → 故障注入和 Boss Fight → 证据报告 → 盲测迁移 → 投递结果反馈”作为同一闭环。这是基于样本的差异化假设，不是“全球唯一”的排他性声明 / No verified platform in this sample presents the entire chain—dated JD evidence, dependency graph, bilingual two-pass training, authentic hardware workspace, hint budget and gates, fault injection and Boss Fight, evidence report, blind transfer, and application feedback—as one loop. This is a sample-based differentiation hypothesis, not a “world’s only” claim.

6. **题量不能以版权、保密或面试诚信为代价 / Volume cannot override copyright, confidentiality, or interview integrity.**
   公开可见不等于允许抓取；“真实公司题”不等于可发布。题库只能来自原创同构任务、公开事实与规范概念的独立表达、许可明确的开源材料，以及已同意且脱敏的用户信号 / Public visibility is not permission to scrape; “real company question” is not permission to publish. The bank must rely on independently authored isomorphic tasks, original expression of public facts and specification concepts, properly licensed open-source material, and consented, de-identified user signals.

## 3. 市场功能矩阵 / Market capability matrix

标记 / Legend: `●` 原生核心 / native core; `◐` 部分覆盖或相邻能力 / partial or adjacent; `—` 本次引用页面未观察到 / not observed in cited pages.

| 平台 / Platform                         | 核心训练单元 / Primary unit                                               | 结构与反馈 / Structure and feedback                                                                   | 真人或 AI 模拟 / Human or AI mock                                  | 芯片工程深度 / Semiconductor depth                                  | 最值得借鉴 / Best mechanism to learn from                                                           | 不应照搬 / Must not clone                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| LeetCode                                | ● 自动判题问题 / judged coding problem                                    | ● 标签、Study Plan、进度、竞赛 / tags, plans, progress, contests                                      | ◐                                                                  | —                                                                   | 提交摩擦低、发现路径清楚、重复练习习惯 / low-friction submit, discovery, repetition                 | 公司题频替代岗位能力模型 / company-frequency as a role model                              |
| NeetCode                                | ● 精选题与浏览器执行 / curated problems and in-browser execution          | ● 依模式排序的 Roadmap、课程、讲解 / pattern-ordered roadmap, courses, explanations                   | —                                                                  | —                                                                   | 先修顺序、模式压缩、复习重点 / prerequisite order, pattern compression, review focus                | 把路线图当成个体掌握证据 / treating a roadmap as mastery evidence                         |
| HackerRank                              | ● 练习与限时自动测评 / practice and timed assessment                      | ● Prep Kit、AI Tutor、报告、认证 / prep kit, tutor, reports, certification                            | ● AI coding/system design                                          | —                                                                   | 练习→Mock Test→Mock Interview→Certification 阶段门 / explicit stage gates                           | 未校准就复制认证逻辑 / premature certification                                            |
| CodeSignal                              | ● 练习、测评、真实 IDE / practice, assessment, authentic IDE              | ● 学习路径、AI Tutor、技能验证 / paths, tutor, skill validation                                       | ● AI 与 live interview 产品 / AI and live interview products       | —                                                                   | 真实工作环境、统一评价、测评与面试连续性 / authentic environment, consistent evaluation, continuity | 用软件工程框架冒充芯片有效性 / assuming software validity transfers to hardware           |
| Hello Interview                         | ● 分步骤设计练习 / stepwise design practice                               | ● Guided Practice、逐步 AI 反馈、内容库 / guided practice, step feedback, library                     | ◐ AI；真人服务已结束 / AI; live service ended                      | —                                                                   | 开放题分解、逐阶段叙述和反馈 / decomposition and stepwise narration                                 | 使用已结束的真人服务作为当前能力 / presenting sunset live service as current              |
| Exponent Practice / Pramp               | ● 同伴模拟 / peer mock                                                    | ● 匹配、排期、角色轮换、rubric 与 AI 反馈 / matching, scheduling, role switch, rubric and AI feedback | ● 同伴；◐ AI / peer; AI partial                                    | —                                                                   | 当面试官、复盘、持续匹配 / interviewer role, debrief, recurring matching                            | 未校准同伴分数直接判掌握 / raw peer score as mastery                                      |
| interviewing.io                         | ● 匿名模拟与协作环境 / anonymous mock and shared environment              | ● 资深面试官详细反馈 / detailed senior feedback                                                       | ● 真人和 AI / human and AI                                         | —                                                                   | 高压真实性与可执行反馈 / pressure fidelity and actionable feedback                                  | 先建昂贵导师市场、后补 rubric / mentor marketplace before rubric                          |
| Educative / Grokking                    | ● 交互课程与挑战 / interactive course and challenge                       | ● 模式、递进章节、章节模拟 / patterns, progression, chapter mocks                                     | ● AI mock（公开课程页所述） / AI mock per public course page       | —                                                                   | 识别可迁移模式，而非孤立记题 / transferable pattern recognition                                     | 复制课程正文、图、题或“解题配对” / copying lessons, diagrams, questions, solution pairing |
| AlgoExpert                              | ● 精选题与 coding workspace                                               | ● 概念视频、代码走读、复杂度、限时测评 / conceptual video, walkthrough, complexity, timed assessments | ◐ 同伴 mock                                                        | —                                                                   | 少而精、多表征解释、面试节奏 / curation, multi-representation explanation, interview pacing         | 复制精选题、视频结构或书面解 / copying curated tasks or explanations                      |
| 牛客 / Nowcoder                         | ● 在线编程、笔试与题库 / coding, assessments, banks                       | ● 课程、面经、社区、简历、职位 / courses, reports, community, résumé, jobs                            | ● AI 入口 / AI entry                                               | ◐ 硬件内容与社群 / hardware content and community                   | 中国校招节奏与招聘闭环 / China campus cadence and recruiting loop                                   | 抓取公司真题、付费专栏或用户面经原文 / scraping company questions or user posts           |
| HDLBits                                 | ● Verilog 仿真 oracle                                                     | ● 主题与大致难度顺序 / topic and approximate difficulty order                                         | —                                                                  | ● RTL 基础 / RTL foundations                                        | 硬件小步即时反馈 / compact hardware feedback loop                                                   | 输出匹配代表完整工程能力 / output match as full engineering skill                         |
| EDA Playground                          | ● 多 HDL/库/工具在线执行 / multi-HDL, library, tool execution             | ◐ 示例与可分享环境 / examples and shareable labs                                                      | —                                                                  | ● HDL、UVM、SVA 等执行 / execution                                  | 可复现外链、多后端对照 / reproducible links and backend comparison                                  | 把沙箱本身当课程和评分系统 / sandbox as curriculum and judge                              |
| Siemens Verification Academy            | ◐ 课程、示例、论坛 / courses, examples, forums                            | ● 方法论与工业主题 / methodology and industrial topics                                                | —                                                                  | ● DV、formal、coverage 等 / DV, formal, coverage                    | 工业术语、方法论、专家社区 / industrial vocabulary and methodology                                  | 单厂商流程等同通用标准 / vendor flow as universal standard                                |
| Cadence Training                        | ● 课程、lab、learning map、badge                                          | ● 推荐课程流与先修等级 / recommended course flow and levels                                           | —                                                                  | ● 设计、验证、实现与厂商工具 / design, verification, implementation | Learning Map 与真实工具 lab / maps and real-tool labs                                               | 厂商 badge 等同岗位 readiness / badge as job readiness                                    |
| Synopsys Learning Center                | ● 自学/讲师课程、quiz、lab / self-paced/instructor courses, quizzes, labs | ● role-based journey、badge、订阅层级 / role journeys, badges, tiers                                  | —                                                                  | ● 设计、工程、验证工具 / design, engineering, verification tools    | 角色旅程、版本化工具熟练度 / role journeys and versioned proficiency                                | 依赖付费或许可证内容作为公共题源 / paid or licensed material as public source             |
| OpenROAD / ORFS                         | ● 可运行 RTL-to-GDS flow                                                  | ● tutorial、阶段日志、QoR golden/rules                                                                | —                                                                  | ● PD、Tcl、报告、PPA/QoR                                            | 真实 repo、日志、报告、可回归指标 / repo, logs, reports, regression metrics                         | 把一次 flow 成功当作 PD 掌握 / one green run as PD mastery                                |
| Tiny Tapeout                            | ● 从项目到 GDS 与真实制造 / project to GDS and fabrication                | ● lessons、模板、CI、提交 gate                                                                        | —                                                                  | ● 真实 ASIC 工件 / real ASIC artifact                               | 物理结果、文档、CI 与截止日 / physical outcome, docs, CI, deadline                                  | 将流片名额或费用作为基础训练前提 / tapeout cost as baseline prerequisite                  |
| Nand2Tetris                             | ● 递进项目与测试脚本 / progressive projects and test scripts              | ● 从门到计算机与软件层级 / gates-to-computer hierarchy                                                | —                                                                  | ◐ 教育 HDL 与计算机体系 / educational HDL and architecture          | 连续世界、先修链、可执行项目 / continuous world, prerequisite chain, executable projects            | 复制项目文件、测试或教材表达 / copying projects, tests, or textbook expression            |
| **AIALRA Career Dojo（目标 / target）** | **● 多工件工程任务 / multi-artifact engineering task**                    | **● JD 驱动依赖图、误区记忆、迁移复测 / JD-driven graph, failure memory, transfer retest**            | **● 芯片追问树；真人后置 / hardware follow-up tree; humans later** | **● EDA R&D、CAD、RTL、DV、FPGA、架构、PD、DFT**                    | **证据→训练→工件→投递的控制系统 / evidence-to-application control system**                          | **不得以泄题、虚假命中率或伪精确概率竞争 / no leaks, fake hit rates, or false precision** |

## 4. 成熟面试产品逐项研究 / Mature interview-product analysis

### 4.1 LeetCode

**已验证事实 / Verified facts**

- 官方 QuickStart 把 Explore、Problems、Contests 和 Discuss 作为主要候选人能力；Explore 含 Learn 与 Interview 两类卡，Problems 支持按问题和公司相关内容发现，Contest 提供周期性限时练习 / The official QuickStart presents Explore, Problems, Contests, and Discuss as core candidate features; Explore includes Learn and Interview cards, Problems support topic/company-oriented discovery, and Contests provide recurring timed practice: [QuickStart Guide](https://support.leetcode.com/hc/en-us/articles/360012067053-LeetCode-QuickStart-Guide).
- 官方 Study Plan 说明题目按主题分组、可跟踪进度，并可形成周计划与日历习惯 / The official Study Plan announcement describes topic-grouped problems, progress tracking, and weekly/calendar planning: [Study Plan update](https://leetcode.com/discuss/post/3482910/feature-updates-plan-your-coding-journey-to-achieve-more/).

**可借鉴 / Learn**

- 题目发现、运行、提交、反馈和下一题之间的路径应极短 / Keep discovery, run, submit, feedback, and next-task navigation extremely short.
- 用主题路径、复习队列和限时场景建立持续练习，而不是只显示题量 / Build habit through topic paths, review queues, and timed sessions rather than a raw count.

**不能复制 / Do not copy**

- 不抓取题面、答案、讨论、公司标签频率或隐藏测试；公司标签也不能替代当前 JD 证据 / Do not scrape prompts, solutions, discussions, company frequencies, or hidden tests; company tags cannot substitute for current JD evidence.
- LeetCode 条款明确限制抓取与未经授权使用平台内容 / LeetCode’s terms restrict crawling/scraping and unauthorized content use: [Terms](https://leetcode.com/terms/).

### 4.2 NeetCode

**已验证事实 / Verified facts**

- NeetCode 250 把题目按 Arrays & Hashing、Two Pointers、Trees、Graphs、Dynamic Programming 等模式分组，并显示各组完成状态 / NeetCode 250 groups work by patterns such as Arrays & Hashing, Two Pointers, Trees, Graphs, and Dynamic Programming, with progress by group: [NeetCode 250](https://neetcode.io/practice/practice/neetcode250).
- 官方课程页明确强调主动练习、按先修关系排列主题和由浅入深；公开课程涵盖 DSA、system design、Python、SQL、full stack 与 OOD / Official course pages emphasize active practice and deliberately ordered prerequisites; public offerings include DSA, system design, Python, SQL, full stack, and OOD: [Courses](https://neetcode.io/courses), [DSA introduction](https://neetcode.io/courses/dsa-for-beginners/0).
- 官方使用指南主张学习模式、按顺序练习并回到未掌握问题，而非随机堆题 / The official guide favors pattern learning, ordered practice, and revisiting weak work over random volume: [How to use NeetCode effectively](https://neetcode.io/courses/lessons/how-to-use-neetcode-effectively).

**可借鉴 / Learn**

- 把一个巨大领域压缩为“少量可迁移模式 + 明确先修顺序 + 代表任务” / Compress a large domain into a small number of transferable patterns, explicit prerequisites, and representative tasks.
- AIALRA 的能力图应允许“从目标岗位反向裁剪路线”，而不是让每个人从同一入口线性刷完 / Let the target role prune the graph backward instead of forcing everyone through one linear list.

**不能复制 / Do not copy**

- 不复制其路线中的具体题目选择、顺序表达、视频、代码解或付费课程 / Do not copy its exact selection, ordering expression, videos, code solutions, or paid courses.
- “做完某路线”只能表示覆盖，不自动等于在新上下文中掌握 / Route completion is coverage, not evidence of transfer mastery.

### 4.3 HackerRank

**已验证事实 / Verified facts**

- 官方 Prep Kit 把 role-specific Practice Challenges、AI Tutor、限时自动评分 Mock Tests、AI Mock Interviews、反馈报告和 Role Certification 串成端到端准备；冻结日公开说明当前提供 Software Engineer Prep Kit / The official Prep Kit connects role-specific practice, AI Tutor, timed auto-evaluated mocks, AI interviews, feedback reports, and role certification; the public page currently identifies a Software Engineer Prep Kit: [Introduction to Prep Kits](https://help.hackerrank.com/articles/1723224478-introduction-to-prep-kits).
- 该 Kit 公开说明包含 60 分钟 coding mock 与 60 分钟 system-design mock / The kit publicly describes a 60-minute coding mock and a 60-minute system-design mock.

**可借鉴 / Learn**

- 训练需要明确阶段门：自由练习、受限测评、追问模拟、最终校准 / Use explicit gates: open practice, constrained assessment, follow-up simulation, and final calibration.
- 每个 gate 应产生下一步动作，而不只是一个总分 / Every gate should emit the next action, not only a total score.

**不能复制 / Do not copy**

- 不把软件工程认证框架直接套到 DV、RTL、PD 或 EDA R&D；芯片工件必须先建立独立 oracle 和人工校准 / Do not port a software certification frame directly to DV, RTL, PD, or EDA R&D; hardware artifacts need independent oracles and human calibration first.
- 不复制 HackerRank challenges、测评内容、认证题或报告表达 / Do not copy challenges, assessments, certification items, or report text.

### 4.4 CodeSignal

**已验证事实 / Verified facts**

- 官方候选人帮助页说明 Practice Questions 用于熟悉技术测评/面试题型与 CodeSignal IDE，且企业不会看到该练习表现 / The official candidate help page says Practice Questions simulate technical assessment/interview formats and familiarize candidates with the IDE; companies do not see practice performance: [Practice Content Overview](https://support.codesignal.com/hc/en-us/articles/12984563824279-Practice-Content-Overview).
- 官方 Interview 快速指南描述云端真实开发环境、视频、共享白板、代码编译、源代码控制和 Linux 命令行，并支持回看 interview coding replay / The official Interview guide describes a cloud development environment with video, shared whiteboard, compiled code, source control, Linux command line, and interview replay: [Interview Quick Start](https://support.codesignal.com/hc/en-us/articles/22112352841879-Quick-Start-Guide-Interview).
- CodeSignal Learn 公开提供 interview-prep learning paths、AI tutor、真实工作练习、IDE 与技能验证 / CodeSignal Learn publicly offers interview-prep paths, an AI tutor, job-like practice, an IDE, and skill validation: [CodeSignal Learn](https://codesignal.com/learn-app/), [Course paths](https://codesignal.com/learn/course-paths).

**可借鉴 / Learn**

- 练习环境与真实工作环境越接近，行为信号越可信；评价应包括 debug、工具使用、代码质量和沟通 / The closer practice is to real work, the more credible the behavioral signal; evaluate debugging, tool use, quality, and communication.
- 把练习记录、受限测评与模拟回放放进同一时间线，支持差异分析 / Put practice, constrained assessment, and replay on one timeline for delta analysis.

**不能复制 / Do not copy**

- 不复制 Certified Assessment framework、题目或评分模型；AIALRA 不能声称自己的芯片评分具有同等效度，除非完成独立验证 / Do not copy certified frameworks, items, or scoring; AIALRA must not claim equivalent validity without independent validation.
- 不把反作弊监控设计成真实面试中的隐蔽辅助或侵犯隐私的默认采集 / Do not turn integrity controls into covert live-interview assistance or default invasive capture.

### 4.5 Hello Interview

**已验证事实 / Verified facts**

- Guided Practice 公开覆盖 System Design、Low-Level Design、AI-Enabled Coding 与 Behavioral，要求用户分步骤完成并叙述思路，每一步获得由资深面试经验调校的 AI 反馈 / Guided Practice publicly covers System Design, Low-Level Design, AI-Enabled Coding, and Behavioral; users work step by step, narrate reasoning, and receive AI feedback tuned by experienced interviewers: [Guided Practice](https://www.hellointerview.com/practice/overview).
- **当前状态更正 / Current-state correction**：官方 sunset 页面声明真人 mock interview 与 mentorship 已于 **2026-05-31** 结束；Premium、Guided Practice、免费内容、视频与既有反馈仍继续 / The official sunset page states that live mock interviews and mentorship ended on **2026-05-31**, while Premium, Guided Practice, free content, videos, and existing feedback continue: [Program sunset](https://www.hellointerview.com/mock-sunset).
- 部分 landing/coach 页面仍可显示旧真人服务文案；本文以日期更新且明确说明结束的 sunset 页面作为当前状态依据 / Some landing/coach pages may still show legacy live-service copy; this report treats the dated sunset notice as controlling for current status.

**可借鉴 / Learn**

- 把开放式问题拆成可观察阶段：需求澄清、估算、架构、深挖、故障、权衡、总结 / Decompose open-ended work into observable stages: requirements, estimation, architecture, deep dive, failure, trade-offs, summary.
- 在每一步给局部反馈，但保留一次无提示完整重做，防止被步骤提示“扶着过关” / Give local feedback at each step, then require a full no-hint replay to avoid scaffold-dependent success.

**不能复制 / Do not copy**

- 不把已结束的真人服务列为当前可用能力，也不把旧页面宣传当作优先证据 / Do not list sunset live services as current or treat older marketing as higher-priority evidence.
- 不复制其问题库、设计图、分步提示、反馈模板或 Premium 内容 / Do not copy its question library, diagrams, staged hints, feedback templates, or Premium content.

### 4.6 Exponent Practice / Pramp

**已验证事实 / Verified facts**

- Pramp 已并入 Exponent；官方 Practice 页面说明可匹配同伴、预约 DSA、System Design、Behavioral、SQL、Data Science & ML、Frontend 等模拟，并在双方间轮换练习角色 / Pramp is now part of Exponent; the official Practice page describes peer matching and scheduled mocks across DSA, System Design, Behavioral, SQL, Data Science & ML, Frontend, and other tracks, with reciprocal practice: [Exponent Practice](https://www.tryexponent.com/practice).
- 官方公告强调按水平改善匹配、邀请朋友、联系过去的伙伴、时间跟踪和复看反馈 / The official announcement highlights improved skill matching, friend invites, reconnection with past partners, time tracking, and feedback review: [Practice announcement](https://www.tryexponent.com/blog/introducing-exponent-practice).
- 对部分非代码场次，官方页面说明可生成 transcript，并由 AI 按 rubric 维度评分；此能力在公开页标为 early access/member feature / For selected non-coding sessions, the public page describes transcripts and rubric-based AI scoring, marked as an early-access/member feature.

**可借鉴 / Learn**

- “当一次面试官”能迫使学习者理解 rubric、追问和好答案的证据信号 / Acting as interviewer forces the learner to understand rubrics, follow-ups, and evidence of a strong answer.
- 匹配必须考虑角色、水平、时区、目标和历史可靠性；反馈需要和自评、系统评分分开显示 / Matching should consider role, level, time zone, goal, and reliability; peer, self, and system scores must remain distinct.

**不能复制 / Do not copy**

- 不复制问题、rubric、transcript 结构、课程、视频或用户反馈 / Do not copy questions, rubrics, transcript structures, courses, videos, or user feedback.
- 同伴“通过”不能直接解锁掌握；需有锚点样例、评分者一致性和系统 oracle / Peer approval must not unlock mastery without anchor samples, inter-rater checks, and system oracles.

### 4.7 interviewing.io

**已验证事实 / Verified facts**

- 官方首页提供匿名真人模拟，面试官定位为来自顶级公司的 Senior/Staff/Principal 工程师或管理者，结束后给详细反馈 / The official site offers anonymous human mocks with Senior/Staff/Principal engineers or managers from top companies and detailed post-session feedback: [interviewing.io](https://interviewing.io/).
- 同页提供 AI coding 与 system-design interviewer，并公开说明可练习其合作书籍的一组问题 / The same page offers AI coding and system-design interviews and a set of problems associated with its partner book.

**可借鉴 / Learn**

- 高真实性来自时间压力、陌生人互动、不可预测追问和可执行反馈，而不是“公司题命中” / Fidelity comes from time pressure, unfamiliar interaction, unpredictable follow-ups, and actionable feedback—not claims of question matching.
- 录像/回放与反馈应定位到具体行为证据和时间点 / Replay and feedback should point to concrete behavior and timestamps.

**不能复制 / Do not copy**

- 在芯片 rubric、工件协议和 reviewer 校准完成前，不应优先建设昂贵导师市场 / Do not prioritize an expensive mentor marketplace before hardware rubrics, artifact protocols, and reviewer calibration exist.
- 官方条款限制复制、抓取、自动采集，以及为竞争产品或机器学习产品使用材料 / The official terms restrict copying, scraping, automated collection, and use for competing or ML products: [Terms](https://interviewing.io/terms).

### 4.8 Educative / Grokking

**已验证事实 / Verified facts**

- 官方 Grokking 课程页把 coding interview 组织为可复用模式，提供交互挑战、详细解释、多语言选择，并在章节设置 AI mock interview / Official Grokking pages organize coding interviews around reusable patterns with interactive challenges, detailed explanations, multiple languages, and chapter-level AI mocks: [Grokking the Coding Interview Patterns](https://www.educative.io/courses/grokking-coding-interview).
- “Challenge Yourself” 类无标签练习意在取消模式提示，要求学习者自行识别方法 / “Challenge Yourself” style work removes the pattern label and requires independent approach recognition.
- 公开课程页中的课时、lesson、challenge 和 mock 数量会频繁更新；本文不把具体数量作为稳定产品能力 / Public counts for hours, lessons, challenges, and mocks change frequently and are not treated as durable capabilities here.

**可借鉴 / Learn**

- 先显式教授模式，再在取消标签的新题中验证识别与迁移 / Teach a pattern explicitly, then verify recognition and transfer on unlabeled work.
- 一个知识节点需要多种表征：短解释、图、代码/工件、交互练习、口述 / A node benefits from multiple representations: concise text, diagram, code/artifact, interactive task, and oral explanation.

**不能复制 / Do not copy**

- 不复制课程章节结构、原文、图、代码、练习、mock 或解答；只抽象“模式学习→无标签迁移”的机制 / Do not copy lesson structure, text, diagrams, code, exercises, mocks, or solutions; abstract only the pattern-to-transfer mechanism.
- 平台自己的营销数量和效果声明不是 AIALRA 的效果证据 / Platform marketing counts and outcome claims are not evidence of AIALRA efficacy.

### 4.9 AlgoExpert

**已验证事实 / Verified facts**

- 官方产品页公开描述 hand-picked coding questions、两段式视频解释、数据结构 crash course、多语言解答、可运行 coding workspace、复杂度分析和限时 assessments / The official product page describes hand-picked questions, two-part video explanations, a data-structures crash course, multi-language solutions, a runnable workspace, complexity analysis, and timed assessments: [AlgoExpert](https://www.algoexpert.io/).
- 官方 mock 页面说明系统可匹配两个用户，在共享 workspace 中轮换 interviewer/interviewee，并安排答题和 debrief / The official mock page describes matching two users who alternate interviewer/interviewee roles in a shared workspace with solution and debrief time: [Mock Interviews](https://www.algoexpert.io/mock-interviews).
- SystemsExpert 等相邻产品说明开放式设计可通过引导 Q&A、scratchpad、视频 mock 和书面 walkthrough 组织 / Adjacent products such as SystemsExpert show that open-ended design can be organized with guided Q&A, scratchpad, video mock, and written walkthrough: [SystemsExpert](https://www.algoexpert.io/systems/product).

**可借鉴 / Learn**

- 精选代表任务、概念解释、实现走读、复杂度/权衡和限时重做形成一个完整学习包 / A curated representative task, conceptual explanation, implementation walkthrough, complexity/trade-offs, and timed replay form a coherent learning packet.
- 题量扩张前先定义“每道题能否解释一个独特失败模式” / Before expanding volume, ask whether each task isolates a distinct failure mode.

**不能复制 / Do not copy**

- 不复制其精选题集合、两段视频表达、代码解、测试、workspace 视觉或 assessment 组合 / Do not copy its curated set, two-part video expression, code solutions, tests, workspace visuals, or assessment composition.
- Testimonials 是用户陈述，不应被当作因果效果或预期录用率 / Testimonials are user statements, not causal efficacy or expected hiring probability.

### 4.10 牛客 / Nowcoder（中国市场参照 / China-market reference）

**已验证事实 / Verified facts**

- 官方入口把公司题库、专项练习、在线编程、面经、AI 模拟面试、简历、职位和社区放在同一产品内 / Official navigation combines company-oriented banks, focused practice, online coding, interview reports, AI mock, résumé, jobs, and community: [牛客首页 / Homepage](https://www.nowcoder.com/?target=main), [关于牛客 / About](https://www.nowcoder.com/nowcoder/about/?fromPut=b2c_about), [牛客 App](https://www.nowcoder.com/app).
- 用户帖与运营整理内容不等于企业确认的面试事实 / User posts and editorial compilations are not employer-verified interview facts.

**可借鉴 / Learn**

- 中国侧需要显式招聘日历、校招/社招入口、笔试节奏、内推状态和社区情报 / The China track needs explicit campus/experienced-hire calendars, assessment cadence, referral state, and community signals.
- 面经应降维为待核验的技能频率信号，再生成原创任务 / Interview reports should be reduced to reviewable skill-frequency signals, then used to author original tasks.

**不能复制 / Do not copy**

- 不抓取公司真题、付费专栏、用户帖子原文、截图或答案 / Do not scrape company questions, paid columns, user post text, screenshots, or answers.
- 官方免责声明表明用户原创作品存在版权约束 / The official disclaimer signals copyright constraints around user-authored work: [免责声明 / Disclaimer](https://www.nowcoder.com/html/disclaimer).

## 5. 芯片、EDA 与硬件工程平台 / Semiconductor, EDA, and hardware platforms

### 5.1 HDLBits

**已验证事实 / Verified facts**

- HDLBits 是小型 Verilog 电路练习集合，题目由教程式逐渐加深；提交后用测试向量仿真并与参考结果比较，立即返回正确性反馈 / HDLBits is a set of small Verilog circuit exercises that progress from tutorial-like work; submissions are simulated against test vectors and compared with a reference result for immediate correctness feedback: [HDLBits](https://hdlbits.01xz.net/wiki/Main_Page), [Problem sets](https://hdlbits.01xz.net/wiki/Problem_sets).

**可借鉴 / Learn**

- 硬件题可以有低成本、确定性的快速 oracle；失败后直接回到波形和实现 / Hardware tasks can have a low-cost deterministic oracle that returns the learner directly to waveform and implementation.

**不能复制 / Do not copy**

- 不复制题面、参考 testbench、测试向量或题目顺序；未确认再利用许可时只保存链接和非表达性元数据 / Do not copy prompts, reference testbenches, vectors, or sequence; without confirmed reuse permission, retain only links and non-expressive metadata.
- 功能输出正确不代表综合性、时序、CDC、可维护性或验证策略合格 / Functional output correctness does not prove synthesizability, timing, CDC quality, maintainability, or verification strategy.

### 5.2 EDA Playground

**已验证事实 / Verified facts**

- 官方首页允许在浏览器编辑、运行和分享 HDL，公开选项覆盖 Verilog/SystemVerilog、VHDL、Python+HDL、C++/SystemC、UVM/OVM、SVAUnit、SVUnit 等，并可选择免费或受审批的商业工具 / The official site supports browser-based editing, execution, and sharing across Verilog/SystemVerilog, VHDL, Python+HDL, C++/SystemC, UVM/OVM, SVAUnit, SVUnit, and other options, using free and approval-gated commercial tools: [EDA Playground](https://www.edaplayground.com/home), [Settings documentation](https://eda-playground.readthedocs.io/en/latest/settings.html).
- 执行需要登录；商业工具访问还受账号验证与批准限制 / Execution requires login, and commercial tools add account verification and approval constraints.

**可借鉴 / Learn**

- 用可分享、可复现的 playground 链接辅助讨论，并允许同一任务跨 simulator 对照 / Use shareable, reproducible playgrounds for discussion and allow cross-simulator comparison.
- AIALRA 的核心 runner 应版本锁定并可本地复现；EDA Playground 适合作为外部验证路径，不应是唯一依赖 / AIALRA’s core runner should be version-pinned and locally reproducible; EDA Playground is an optional external verification path, not the sole dependency.

**不能复制 / Do not copy**

- 不复制示例、保存的 playground 内容或商业工具输出；不得绕过登录、审批或许可证 / Do not copy examples, saved playground content, or commercial-tool output; do not bypass login, approval, or licenses.

### 5.3 Siemens Verification Academy

**已验证事实 / Verified facts**

- 官方站点提供 SystemVerilog、UVM、coverage、SVA、formal、CDC/RDC、verification planning、debug 等课程、Cookbook、示例和论坛入口 / The official site provides courses, cookbooks, examples, and forums covering SystemVerilog, UVM, coverage, SVA, formal, CDC/RDC, verification planning, debugging, and related topics: [Verification Academy](https://verificationacademy.com/), [Forums](https://verificationacademy.com/forums/).

**可借鉴 / Learn**

- 以工业术语、方法论边界、典型失败模式和专家争论作为知识图上游 / Use industrial terminology, methodology boundaries, failure modes, and expert debate as upstream knowledge signals.
- 角色训练需区分“语言知道”“方法会用”“工具能 debug”“计划能闭环” / Distinguish language knowledge, methodology use, tool debugging, and verification-plan closure.

**不能复制 / Do not copy**

- 不复制课程、Cookbook、示例、论坛答案或厂商图；只引用链接并独立创作任务 / Do not copy courses, cookbooks, examples, forum answers, or vendor diagrams; link and author tasks independently.
- 不把 Siemens/Questa 特定工作流冒充厂商中立面试标准 / Do not present a Siemens/Questa-specific flow as a vendor-neutral interview standard.

### 5.4 Cadence Training

**已验证事实 / Verified facts**

- Cadence Training Services 的 Learning Maps 提供推荐课程流、工具经验与知识等级，覆盖 custom IC、digital design/signoff、system design/verification、PCB 等 / Cadence Training Services Learning Maps provide recommended course flows plus tool-experience and knowledge levels across custom IC, digital design/signoff, system design/verification, PCB, and other domains: [All Courses and Learning Maps](https://www.cadence.com/en_US/home/training/all-courses.html).
- Front-End Digital Design and Verification certification 公开课程链包括 Semiconductor 101、Digital IC Design Fundamentals、Verilog、SystemVerilog 与 UVM，并含 lab 与 badge exams / The public front-end certification path includes Semiconductor 101, Digital IC Design Fundamentals, Verilog, SystemVerilog, and UVM, with labs and badge exams: [Front-End certification](https://www.cadence.com/en_US/home/training/all-courses/86356.html).
- Cadence University Program 公开说明参与者可访问培训与部分数字 badge / The Cadence University Program publicly describes access to training and selected digital badges: [University Program](https://www.cadence.com/en_US/home/resources/company/cadence-university-program.html).

**可借鉴 / Learn**

- 以 learning map 明确前置知识、工具经验层级和课程之间的关系 / Use learning maps to make prerequisites, tool experience, and course relationships explicit.
- 在题目元数据中记录工具与版本，但 rubric 抽象到可迁移概念 / Record tool and release metadata while keeping the rubric at a transferable concept level.

**不能复制 / Do not copy**

- 不复制课程材料、lab、badge exam、截图、厂商数据或需账号访问的内容 / Do not copy course materials, labs, badge exams, screenshots, vendor data, or account-gated content.
- 完成 Cadence 课程或 badge 只能作为外部证据之一，不能自动判定岗位 readiness / A Cadence course or badge is one external signal, not an automatic readiness decision.

### 5.5 Synopsys Learning Center

**已验证事实 / Verified facts**

- 官方培训页提供讲师授课、虚拟课程与 self-paced learning；公开说明包含 role-based learning journeys、视频/演示、quiz、hands-on lab、badging 与不同订阅层级 / Official training pages describe instructor-led, virtual, and self-paced learning with role-based journeys, videos/demos, quizzes, hands-on labs, badges, and subscription tiers: [Training and Education](https://www.synopsys.com/support/training.html), [Self-Paced Training](https://www.synopsys.com/support/training/self-paced.html).
- Learning Center 公开目录按 Silicon Design、Silicon Engineering、Silicon Verification 等类别组织，并包含具体工具课程 / The public catalog is organized by categories such as Silicon Design, Silicon Engineering, and Silicon Verification and includes tool-specific courses: [Synopsys Learning Center](https://training.synopsys.com/learn).

**可借鉴 / Learn**

- 同一角色需要按基础、方法、工具、全流程和版本更新拆层；quiz 只测知识，lab 才测操作 / Layer a role into foundations, methodology, tool, full flow, and release updates; quizzes test knowledge, while labs test operation.
- 将“需要商业许可证”作为环境约束明确显示，并提供开源替代练习 / Surface commercial-license requirements explicitly and offer an open-source alternative exercise.

**不能复制 / Do not copy**

- 不复制课程目录下的受限内容、lab、quiz、badge exam、工具数据或云实验 / Do not copy gated lessons, labs, quizzes, badge exams, tool data, or cloud labs.
- 不把厂商订阅可用性视为候选人能力缺口 / Do not treat lack of vendor-subscription access as a candidate skill gap.

### 5.6 OpenROAD / OpenROAD Flow Scripts

**已验证事实 / Verified facts**

- OpenROAD 是开放的数字实现工具链，目标覆盖从可综合 RTL 到可制造 GDSII；ORFS 提供自动 RTL-to-GDS flow，并允许 Tcl/Python 或分阶段人工干预 / OpenROAD is an open digital implementation toolchain from synthesizable RTL to manufacturable GDSII; ORFS provides an automated RTL-to-GDS flow with Tcl/Python and stage-level control: [OpenROAD documentation](https://openroad.readthedocs.io/en/latest/), [ORFS repository](https://github.com/The-OpenROAD-Project/OpenROAD-flow-scripts).
- 官方 tutorial 展示 synthesis、floorplan、placement、CTS、routing、finish 的完整流程，以及 logs、reports、timing、area、congestion 和 DRC 等结果 / The official tutorial covers synthesis, floorplan, placement, CTS, routing, and finish plus logs, reports, timing, area, congestion, and DRC outputs: [ORFS Flow Tutorial](https://openroad-flow-scripts.readthedocs.io/en/latest/tutorials/FlowTutorial.html).
- 官方 metrics 文档用 golden metadata 与 rules 比较 worst slack、DRC 等关键 QoR 变化 / Official metrics documentation compares key QoR such as worst slack and DRC count against golden metadata and rules: [ORFS Metrics](https://openroad-flow-scripts.readthedocs.io/en/latest/contrib/Metrics.html).

**可借鉴 / Learn**

- 将真实 repo、约束、日志、报告和 QoR delta 作为 PD/CAD/EDA 面试工件；评分不仅看“flow 绿了”，还看根因和权衡 / Use a real repo, constraints, logs, reports, and QoR deltas as PD/CAD/EDA artifacts; score root-cause and trade-offs, not only a green flow.
- 用固定容器、固定 design/platform 和 golden metrics 保证复现，再逐步开放变量 / Pin container, design/platform, and golden metrics for reproducibility before opening variables.

**不能复制 / Do not copy**

- 开源不等于所有依赖同一许可证；每个 tool、platform、design 都要逐项保留许可证与 notice / Open source does not mean every dependency shares one license; preserve the license and notice for every tool, platform, and design.
- 不复制第三方设计作为 AIALRA 原创题；改编必须符合其许可证并清楚标注 / Do not present third-party designs as original AIALRA tasks; adaptations require license compliance and attribution.

### 5.7 Tiny Tapeout

**已验证事实 / Verified facts**

- 官方入口将初学 lessons、Wokwi/Verilog/analog 模板、GitHub repository、GDS CI、shuttle 提交与真实芯片制造连接起来 / The official flow connects beginner lessons, Wokwi/Verilog/analog templates, a GitHub repository, GDS CI, shuttle submission, and real fabrication: [Tiny Tapeout](https://tinytapeout.com/), [Create GDS and submit](https://tinytapeout.com/guides/workshop/create-your-gds/).
- 官方 workshop 说明参与者可从数字设计到生成 ASIC 文件并提交制造；提交修订需要 GDS action 通过 / Official workshop materials take learners from digital design to ASIC files and fabrication submission; revisions require a passing GDS action: [Workshops](https://www.tinytapeout.com/workshops/), [Submit revision](https://tinytapeout.com/guides/workshop/submit-your-design/).
- 生产 run、费用、设计要求、知识产权和出口管制受其条款与各 shuttle 要求约束 / Production runs, fees, design requirements, IP, and export controls are governed by the terms and shuttle-specific requirements: [Terms](https://tinytapeout.com/terms/).

**可借鉴 / Learn**

- “能制造的工件”天然要求文档、接口、自动构建、约束和截止日，是强于静态答案的作品集证据 / A manufacturable artifact naturally requires documentation, interfaces, automated build, constraints, and a deadline—stronger evidence than a static answer.
- AIALRA 可提供 tapeout-ready mission，但基础训练必须能在不付费流片时完整完成 / AIALRA can offer tapeout-ready missions, but core training must remain complete without paying for fabrication.

**不能复制 / Do not copy**

- 不复制模板或项目，除非严格遵守其仓库许可证、署名和提交条款 / Do not copy templates or projects without complying with repository licenses, attribution, and submission terms.
- 不把“参加流片”自动解释为设计质量或个人独立完成 / Do not equate shuttle participation with design quality or independent authorship.

### 5.8 Nand2Tetris

**已验证事实 / Verified facts**

- 官方课程从逻辑门、ALU、CPU、机器语言、VM、编译器到操作系统组织连续项目，并提供 lecture、project material 和工具 / The official course organizes continuous projects from logic gates, ALU, and CPU through machine language, VM, compiler, and OS, with lectures, project material, and tools: [Nand2Tetris](https://www.nand2tetris.org/).
- 官方工具提供浏览器 IDE 与桌面工具、Hardware Simulator、CPU/VM emulator、assembler、compiler 和 test scripts；项目按 00–13 组织 / Official tooling includes a browser IDE and desktop tools, Hardware Simulator, CPU/VM emulators, assembler, compiler, and test scripts across projects 00–13: [Software](https://www.nand2tetris.org/software/HDL).
- 官方主页说明非营利场景下材料可免费、开源使用；任何商业再利用仍需逐项检查具体许可和权利条件 / The official homepage describes free/open use in a non-profit setting; any commercial reuse still requires checking the applicable license and rights conditions.

**可借鉴 / Learn**

- 用一个连续世界承载多层任务，让前一阶段工件成为后一阶段输入；学习者能看到抽象层如何相互约束 / Use one continuous world across layers, where each artifact feeds the next and abstraction boundaries become visible.
- AIALRA Boss Fight 可借鉴“同一系统逐层构建”，但必须独立设计 DUT、接口、测试和叙事 / AIALRA Boss Fights can use the continuous-system mechanism while independently authoring the DUT, interfaces, tests, and narrative.

**不能复制 / Do not copy**

- 不复制课程项目、骨架文件、测试脚本、compare files、工具界面或教材表述 / Do not copy course projects, skeleton files, tests, compare files, tool UI, or textbook expression.
- 不把教育 HDL 的成功直接等同于工业 RTL、CDC、约束和 signoff 能力 / Do not equate educational HDL success with industrial RTL, CDC, constraints, or signoff capability.

### 5.9 补充内容参照 / Additional content references

- **VLSI Verify** 公开提供 Verilog、SystemVerilog、UVM、SVA、coverage、RAL、TLM、协议教程、测验、guided coding 与 EDA Playground 链接；适合作为覆盖度参照，不作为可复制题源 / Publicly presents tutorials, quizzes, guided coding, and EDA Playground links across Verilog, SystemVerilog, UVM, SVA, coverage, RAL, TLM, and protocols; useful as a coverage reference, not a reusable bank: [VLSI Verify](https://vlsiverify.com/).
- **ChipVerify** 公开提供 digital design、Verilog、SystemVerilog、UVM、verification、synthesis、UPF 教程与 lab 入口；其文章、源码和信息受其版权条款约束 / Publicly presents tutorials and lab entry points across digital design, Verilog, SystemVerilog, UVM, verification, synthesis, and UPF; its articles, source, and information remain subject to its terms: [ChipVerify](https://chipverify.com/), [Terms](https://chipverify.com/sitemap/info/terms-and-conditions).

## 6. AIALRA 独有训练协议 / AIALRA differentiated training protocol

以下十二项必须作为同一控制系统实现；单独做其中一项并不构成差异化 / The following twelve mechanisms must operate as one control system; any one in isolation is not the differentiation.

### 6.1 JD Evidence Compiler / 岗位证据编译器

**输入 / Input**

- 带 URL、抓取/观察日期、posting status、地点、level、资格与薪资状态的当前 requisition / A current requisition with URL, observed date, posting status, location, level, eligibility, and compensation status.
- 只把官方当前岗位证据标为 `official-current-job`；组织介绍、历史岗位和人才社区不能伪装成空缺 / Only current official requisitions receive `official-current-job`; organization profiles, historical jobs, and talent communities must not masquerade as openings.

**编译输出 / Compiled output**

- `must / preferred / bonus / eligibility / team problem / interview signal / unknown`；
- 每条 JD 句子映射到规范角色族、技能节点、证据缺口与训练工件 / Each JD sentence maps to a normalized role family, skill node, evidence gap, and training artifact;
- 7/14/30 天 mission、投递前检查表、待人工核验项 / 7/14/30-day mission, pre-application checklist, and human-review queue.

**验收 / Acceptance**

- 每个建议动作可回溯到 JD 证据与技能节点；不生成无来源录取概率 / Every recommendation traces to JD evidence and a skill node; no unsupported admission probability.

### 6.2 依赖能力图 / Dependency capability graph

- 节点不是课程章节，而是可观察能力，如“从 counterexample 定位 property 假设错误” / Nodes are observable capabilities, not course chapters, such as locating a bad property assumption from a counterexample.
- 边区分 `prerequisite / co-requisite / transfer / evidence-for-role`，并记录版本与置信度 / Edges distinguish prerequisite, co-requisite, transfer, and evidence-for-role with version and confidence.
- 目标 JD 从后向前裁剪最小学习子图；已掌握节点需由近期无提示证据支持 / A target JD prunes a minimal graph backward; mastered nodes require recent no-hint evidence.
- 新失败更新具体误区，不把整条角色路线粗暴降级 / A new failure updates a specific misconception rather than collapsing an entire role score.

### 6.3 中英双语两遍训练 / Bilingual two-pass training

- **第一遍 / Pass 1**：以更强语言完成技术推理和工件，确保技术真实 / Solve and build in the stronger language to establish technical truth.
- **第二遍 / Pass 2**：切换另一语言，在不看逐字翻译的情况下重述规格、权衡、debug 过程和结论 / Switch languages and restate the specification, trade-offs, debugging process, and conclusion without reading a line-by-line translation.
- 中英文共用同一技术 oracle，但沟通 rubric 分开记录准确性、术语、结构和追问应对 / Both languages share the technical oracle, while communication rubrics separately score accuracy, terminology, structure, and follow-ups.
- 翻译等价性需人工/模型双重检查；不能用更简单英文题伪造“双语通过” / Translation equivalence needs human/model review; an easier English variant cannot simulate bilingual mastery.

### 6.4 真实硬件工程台 / Authentic hardware engineering workspace

训练对象是可复现工程目录，不是一块孤立文本框 / The unit is a reproducible engineering workspace, not an isolated textbox.

- repo、版本锁定 runner、terminal、tests、waveform、log、report、diff、README；
- RTL/SystemVerilog、testbench、SVA、coverage、UVM 设计、Python/Tcl/C++ 工具代码；
- synthesis、lint、STA、CDC 类静态报告与 PPA/QoR delta；
- 本地开源 runner 为默认，商业工具只作合法、可选、用户有权访问的验证路径 / Local open runners are the default; commercial tools are optional only when access is lawful and user-authorized.

### 6.5 提示预算 / Hint budget

- 提示按层级计费：重新读规格 → 指向失败区域 → 暴露概念 → 伪代码/结构 → 参考解 / Hints have a budgeted ladder: reread spec, failure region, concept, pseudocode/structure, reference solution.
- readiness 同时显示通过结果与提示成本；看过参考解的通过不能等同首次独立通过 / Readiness shows both outcome and hint cost; passing after a reference solution is not a first independent pass.
- 提示预算根据学习阶段变化，但不能暗中改变任务技术难度 / The budget can vary by learning phase but must not silently alter technical difficulty.

### 6.6 分阶段 Gate / Staged gates

每个复杂任务依次通过 / Each complex task progresses through:

1. **读规格 / Specify**：澄清假设、接口、边界与 success criteria；
2. **定位 / Localize**：从 log、waveform、report 或代码缩小问题；
3. **实现 / Implement**：完成最小正确修改；
4. **验证 / Verify**：设计独立 checker、负例与回归；
5. **优化 / Optimize**：解释 PPA、runtime、coverage、reuse 或可维护性权衡；
6. **表达 / Explain**：中文和英文分别完成结构化复盘。

前一 gate 的工件成为后一 gate 输入；系统记录在哪一阶段失败，不只记录最终 AC/WA / Each gate feeds the next; the system records the failure stage, not only final pass/fail.

### 6.7 主动故障注入 / Active fault injection

- 由系统控制 seed、bug class 与可观察信号，注入 reset、ordering、width、race、CDC assumption、constraint、coverage hole、parser、performance 或 flow regression 等故障 / The system controls seed, bug class, and observability across reset, ordering, width, race, CDC assumption, constraint, coverage hole, parser, performance, and flow-regression faults.
- 学习者提交 root-cause timeline、最小复现、修复、回归测试和“为什么旧测试漏掉” / The learner submits a root-cause timeline, minimal reproducer, fix, regression, and explanation of why previous tests missed it.
- 注入器和 oracle 独立于候选人可见实现，避免“迎合测试” / Injector and oracle remain independent from the visible implementation to discourage test gaming.

### 6.8 角色 Boss Fight / Role-specific Boss Fight

- 60–180 分钟连续场景，围绕同一 DUT、flow 或工具问题持续变化 / A 60–180 minute continuous scenario around one evolving DUT, flow, or tool problem.
- 典型序列 / Typical sequence:
  `读规格 → 澄清 → 设计/代码 → checker → 注入 bug → waveform/log → coverage/QoR closure → design review → 英文总结`
- DV、RTL、EDA R&D、CAD flow、FPGA、architecture、PD、DFT 共用工件协议，但 rubric 不混用 / DV, RTL, EDA R&D, CAD flow, FPGA, architecture, PD, and DFT share an artifact protocol but not one rubric.
- Boss Fight 不直接给“录取概率”，只输出已观察证据、最大风险和下一训练动作 / It emits observed evidence, top risk, and next action—not hiring probability.

### 6.9 证据报告 / Evidence-backed report

每次高风险训练输出可审计 packet / Every high-stakes attempt emits an auditable packet:

- task/version、环境、时长、提示使用、通过的 gates；
- transcript 片段、commit/diff、test、waveform 标注、log 根因、QoR 前后对比；
- rubric 各维度证据与不确定项；
- 可公开作品集版与私有复盘版分离 / Separate public portfolio and private retrospective versions;
- 不含第三方机密、受限 PDK、商业工具受保护输出或真实面试泄漏 / Exclude third-party confidential material, restricted PDKs, protected commercial-tool output, and real-interview leaks.

### 6.10 评分校准 / Calibration

- AI、自评、同伴、专家与确定性 oracle 分开存储，不平均成一个不透明分数 / Store AI, self, peer, expert, and deterministic-oracle scores separately instead of averaging them into an opaque number.
- 使用锚点工件、双盲复评、inter-rater agreement、争议回看和 rubric 版本 / Use anchor artifacts, blind double review, inter-rater agreement, dispute review, and rubric versions.
- AI 可以找证据和提出候选评分，不能独自认证高风险 mastery / AI may locate evidence and propose a score; it cannot independently certify high-stakes mastery.
- 当 rubric 或 runner 更新时，受影响的历史结论进入 `recalibration-needed` / When rubrics or runners change, affected history becomes `recalibration-needed`.

### 6.11 盲测迁移与间隔复测 / Blind transfer and spaced retest

- 学习后先做同构复测，再在无标签、不同协议/工具/上下文中盲测 / After learning, use an isomorphic retest, then an unlabeled blind task in a different protocol, tool, or context.
- 复测时间根据失败类型和提示依赖安排，而不是统一“连续打卡” / Schedule retests from failure type and hint dependence rather than a uniform streak.
- 只有在延迟、无提示、陌生上下文仍通过，能力节点才进入稳定状态 / A node becomes stable only after delayed, no-hint success in a novel context.
- 迁移失败应回写能力图中的边或误区，不只是再排原题 / Transfer failure updates graph edges or misconceptions, not merely rescheduling the same task.

### 6.12 投递结果反馈闭环 / Application-outcome feedback loop

闭环 / Loop:

`岗位版本 → 材料版本 → 投递阶段 → OA/面试能力信号 → 结果 → 复盘 → 技能/定位权重更新`

- 记录 `unknown`，不强迫每次拒绝归因；单次结果不能证明身份、技能或公司偏好是原因 / Preserve unknowns; a single rejection cannot prove identity, skill, or employer preference as the cause.
- 只在同角色、同阶段、足够样本下观察趋势 / Infer trends only within comparable roles/stages and sufficient samples.
- 训练推荐由“当前 JD 缺口 + 个人重复失败 + 投递漏斗”共同驱动 / Recommendations combine current-JD gaps, recurring personal failures, and funnel evidence.
- 个人材料、移民信息、联系人与申请笔记只进私有数据库，不进入公开研究文件 / Résumés, immigration records, contacts, and application notes stay in private storage, not public research files.

## 7. 由浅到深的产品训练层级 / Shallow-to-deep product progression

| 层级 / Level                                | 学习者任务 / Learner task                                                              | 系统提供 / System support                                                           | 解锁证据 / Unlock evidence                                       |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| L0 全局认知 / Orientation                   | 识别角色、流程、术语和岗位证据类型 / identify roles, flows, vocabulary, evidence types | 双语地图、JD Evidence Compiler 预览 / bilingual map and compiler preview            | 能解释目标角色与相邻角色边界 / explain role boundaries           |
| L1 概念与微练习 / Concepts and micro-drills | 完成单节点、短时、确定 oracle 任务 / short single-node tasks with deterministic oracle | 显式模式、提示预算、即时反馈 / explicit pattern, hint budget, fast feedback         | 无提示通过代表题 / no-hint representative pass                   |
| L2 依赖链 / Dependency chain                | 将多个节点组合成小型 RTL/DV/EDA 工件 / combine nodes into a small artifact             | repo、runner、wave/log/report / repo, runner, wave/log/report                       | 可复现工件与解释 / reproducible artifact and explanation         |
| L3 故障与迁移 / Failure and transfer        | debug 注入故障，并做无标签新上下文 / debug injected faults and unlabeled transfer      | 故障注入、分阶段 gate、延迟复测 / injection, gates, delayed retest                  | 根因、回归和迁移通过 / root cause, regression, transfer          |
| L4 角色 Boss Fight                          | 在时间限制内完成连续场景 / complete an evolving scenario under time                    | 追问树、角色 rubric、证据报告 / follow-up tree, role rubric, evidence report        | 校准后的多维证据 / calibrated multidimensional evidence          |
| L5 岗位编译 / Requisition compile           | 针对当前 JD 修补最小缺口并投递 / close minimal gaps for a current JD and apply         | 7/14/30 天 mission、材料映射 / mission and material mapping                         | 合格投递 / evidence-backed qualified application                 |
| L6 结果学习 / Outcome learning              | 复盘 OA/面试/结果并再训练 / debrief and retrain after outcomes                         | 漏斗分析、未知保留、权重更新 / funnel analysis, unknown preservation, weight update | 下一轮策略更具体且可追溯 / more precise, traceable next strategy |

## 8. 题源、版权与保密边界 / Content, copyright, and confidentiality boundary

### 8.1 可以借鉴什么 / What may be learned

- 可借鉴非表达性的产品机制：学习路径、阶段门、提示层级、复测、rubric 分维、回放、同伴轮换、真实工程环境 / Learn non-expressive mechanisms: paths, gates, hint ladders, retests, rubric dimensions, replay, peer role switching, and authentic workspaces.
- 可引用公开事实、官方 JD、公开规范概念和开源仓库元数据，并保留 URL、观察日期、许可证和置信度 / Cite public facts, official JDs, public specification concepts, and open-source repository metadata with URL, observed date, license, and confidence.
- 可基于基础工程原理独立创作“同技能、不同表达、不同状态空间、不同 oracle”的任务 / Independently author tasks that exercise the same skill with different expression, state space, and oracle.

### 8.2 不能复制什么 / What must not be copied

- 竞品免费或付费题面、答案、视频、图、课程章节、提示、rubric、隐藏测试、题目集合与编排 / Free or paid competitor prompts, solutions, videos, diagrams, lessons, hints, rubrics, hidden tests, sets, and sequencing.
- 候选人记忆的精确公司题、录音、截图、面试官话术、OA 材料、群内真题包或任何访问控制后的内容 / Exact remembered company questions, recordings, screenshots, interviewer scripts, OA material, leak packs, or access-controlled content.
- 雇主、客户、学校、研究组或工具厂商的 NDA/机密材料、未发布设计、受限 PDK 和许可证不允许公开的输出 / Employer, client, school, lab, or vendor confidential/NDA material, unreleased designs, restricted PDKs, and license-restricted outputs.
- “改数字、换变量名、翻译成另一语言”仍是近似复制，不是原创 / Changing numbers, variable names, or language is still near-copying, not independent authorship.

### 8.3 允许的题源类型 / Permitted source classes

| 来源 / Source                                              | 默认处理 / Default treatment                             | 发布条件 / Publication condition                                                                |
| ---------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 独立原创工程任务 / Independently authored engineering task | 可进入 / eligible                                        | 技术、双语、oracle 与原创性审核 / technical, bilingual, oracle, originality review              |
| 官方 JD/工程博客 / Official JD or engineering blog         | 只抽取事实与能力信号 / facts and skill signals only      | URL、日期、逐条事实/推断分离 / URL, date, fact/inference separation                             |
| 公开标准/协议概念 / Public specification concept           | 独立表达与独立场景 / independent expression and scenario | 不复制付费标准文本、图、表或测试 / no paid-standard text, figures, tables, tests                |
| 开源代码、issue、test / Open-source code, issue, test      | 逐文件审查 / file-by-file review                         | 许可证允许、署名/notice、改编标记 / compatible license, attribution/notice, adaptation label    |
| 已同意用户贡献 / Consented user contribution               | 私有待审 / private pending review                        | 权利确认、脱敏、可删除、无 NDA / rights attestation, de-identification, deletion, no NDA        |
| 竞品或公司题 / Competitor or company question              | 拒绝入库 / reject                                        | 仅保留平台级功能研究或 broad topic signal / platform-level mechanism or broad topic signal only |

### 8.4 发布前闸门 / Pre-publication gates

1. 来源登记 / provenance registration；
2. 权利与许可证审查 / rights and license review；
3. NDA、隐私与访问控制筛查 / NDA, privacy, and access-control screening；
4. 文本、结构、状态空间和解法路径原创性检查 / originality across text, structure, state space, and solution path；
5. 技术正确性、边界、负例与 oracle 独立性审核 / technical correctness, boundaries, negatives, oracle independence；
6. 中英文语义等价与术语审核 / bilingual semantic and terminology review；
7. runner 版本、安全、超时、公开/隐藏测试与可复现审核 / runner version, safety, timeout, public/hidden tests, reproducibility；
8. 校准状态 / calibration state: `draft → review-ready → calibrated → published`。

任一 gate 缺失，不得用“至少扩充十倍”或其他数量目标绕过 / No volume target—including a tenfold expansion—may bypass a missing gate.

## 9. 实施优先级 / Implementation priorities

### P0 — 可信最小闭环 / Trustworthy minimum loop

- 稳定 ID 连接 requisition、role、skill、task、attempt、artifact 与 application outcome；
- JD Evidence Compiler 逐句可追溯，明确 verified/inferred/unknown；
- 双语任务共享技术 oracle，分别记录沟通表现；
- 所有发布题显示 provenance、证据日、review status 和允许使用范围；
- 明确禁止实时面试作弊、泄题和隐蔽提示。

### P1 — 芯片工件护城河 / Semiconductor artifact moat

- 版本锁定的 HDL/软件 runner；
- waveform、log、lint、synthesis、STA、coverage 与 QoR 任务；
- 提示预算、分阶段 gate、主动故障注入；
- DV、RTL、EDA R&D/CAD flow 三条首发 Boss Fight；
- evidence packet 可导出公开版，同时私有复盘留在数据库。

### P2 — 迁移与岗位编译 / Transfer and requisition compilation

- 依赖能力图驱动最小训练子图；
- 延迟无提示复测与跨协议/工具盲测；
- 当前 requisition 生成 7/14/30 天 mission；
- 材料版本、阶段、面试信号和结果进入反馈闭环；
- 美国、中国、研究院/实验室与开源机会分轨统计。

### P3 — 校准贡献生态 / Calibrated contribution ecosystem

- 先上线有锚点样例和评分一致性检查的同伴 design review；
- 后引入经校准行业 reviewer；
- 用户贡献只接收已授权、可脱敏、可删除的原创工件；
- 奖励高质量原创任务、参考实现、独立测试和技术审核，不奖励“独家真题”。

## 10. 成功指标与护栏 / Success metrics and guardrails

### 10.1 北极星指标 / North-star metric

`Evidence-backed qualified applications / 有证据支撑的合格投递`

一次合格投递同时要求 / A qualified application requires:

1. 当前岗位证据仍有效 / current requisition evidence is valid;
2. 关键技能不存在未处理未知项 / critical skills have no unhandled unknowns;
3. 至少一个高相关可复现工件通过 / at least one highly relevant reproducible artifact passes;
4. 最近一次相关 Boss Fight 达到最低校准 rubric / a recent relevant Boss Fight meets the calibrated floor;
5. 简历/作品集版本与 JD 映射已记录 / résumé/portfolio version is mapped to the JD;
6. 资格、地点、薪资状态与风险项已人工核验 / eligibility, location, compensation status, and risks are human-reviewed.

### 10.2 学习质量 / Learning quality

- 延迟复测通过率 / delayed retest pass rate；
- 新上下文盲测迁移率 / blind transfer rate；
- 首次独立完成率与提示成本 / first independent pass and hint cost；
- root-cause 定位时间与误区复发率 / root-cause time and misconception recurrence；
- rubric 评分者一致性 / rubric inter-rater agreement；
- 工件可复现率与 QoR regression 解释质量 / artifact reproducibility and QoR-regression explanation；
- 来源、许可证、双语与审核完整率 / provenance, license, bilingual, and review completeness；
- 技术争议、撤回和再校准率 / dispute, withdrawal, and recalibration rate。

### 10.3 求职结果 / Career outcomes

- 合格投递到 recruiter/OA、技术面、终面的分阶段转化 / stage conversion from qualified application to recruiter/OA, technical, and final;
- 被问能力与训练覆盖之间的差距 / gap between observed interview signals and training coverage;
- 拒绝、退出与未知原因的分布 / distribution of rejection, withdrawal, and unknown reasons;
- 每次结果是否产生明确、可追溯的训练或定位调整 / whether each outcome creates a traceable training or positioning change.

### 10.4 不可突破护栏 / Non-negotiable guardrails

- 禁止泄漏题、NDA 内容、付费墙复制和绕过访问控制 / no leaks, NDA material, paywall copying, or access-control bypass;
- 禁止在受监督真实面试中提供隐蔽实时答案 / no covert live answers in supervised interviews;
- 禁止公司级标签替代当前职位资格判断 / no company-level label as posting-specific eligibility;
- 禁止基于身份或一次结果输出伪精确录取概率 / no false-precision hiring probability from identity or one outcome;
- 禁止 AI 单独认证高风险 mastery / no AI-only high-stakes mastery;
- 禁止把已完成、看过答案或同伴认可展示成已掌握 / no presenting completion, solution exposure, or peer approval as mastery.

## 11. 官方证据索引 / Official evidence index

全部链接最后核验于 / All links last checked: **2026-07-26**.

| 平台 / Platform              | 产品与当前状态证据 / Product and current-state evidence                                                                                                                                                                                                                                  | 条款、许可或使用边界 / Terms, license, or boundary                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| LeetCode                     | [QuickStart](https://support.leetcode.com/hc/en-us/articles/360012067053-LeetCode-QuickStart-Guide) · [Explore](https://leetcode.com/explore/learn/) · [Study Plan](https://leetcode.com/discuss/post/3482910/feature-updates-plan-your-coding-journey-to-achieve-more/)                 | [Terms](https://leetcode.com/terms/)                                                                                                             |
| NeetCode                     | [Courses](https://neetcode.io/courses) · [NeetCode 250](https://neetcode.io/practice/practice/neetcode250) · [Effective use](https://neetcode.io/courses/lessons/how-to-use-neetcode-effectively)                                                                                        | 未确认允许题库再利用；默认只研究机制、不复制内容 / No content-reuse permission confirmed; mechanisms only                                        |
| HackerRank                   | [Prep Kits](https://help.hackerrank.com/articles/1723224478-introduction-to-prep-kits)                                                                                                                                                                                                   | [Terms](https://www.hackerrank.com/about-us/terms-of-service)                                                                                    |
| CodeSignal                   | [Practice overview](https://support.codesignal.com/hc/en-us/articles/12984563824279-Practice-Content-Overview) · [Interview Quick Start](https://support.codesignal.com/hc/en-us/articles/22112352841879-Quick-Start-Guide-Interview) · [Learn](https://codesignal.com/learn-app/)       | 默认不复制评测、题目、framework 或评分 / No copying assessments, items, frameworks, or scoring                                                   |
| Hello Interview              | [Guided Practice](https://www.hellointerview.com/practice/overview) · [Live-service sunset, 2026-05-31](https://www.hellointerview.com/mock-sunset)                                                                                                                                      | [Terms](https://www.hellointerview.com/terms)                                                                                                    |
| Exponent / Pramp             | [Practice](https://www.tryexponent.com/practice) · [Integration announcement](https://www.tryexponent.com/blog/introducing-exponent-practice)                                                                                                                                            | [Terms](https://www.tryexponent.com/tos)                                                                                                         |
| interviewing.io              | [Product](https://interviewing.io/)                                                                                                                                                                                                                                                      | [Terms](https://interviewing.io/terms)                                                                                                           |
| Educative / Grokking         | [Grokking Coding Interview](https://www.educative.io/courses/grokking-coding-interview)                                                                                                                                                                                                  | 未确认允许课程/题目再利用；默认仅链接 / No reuse permission confirmed; link only                                                                 |
| AlgoExpert                   | [AlgoExpert](https://www.algoexpert.io/) · [Mock Interviews](https://www.algoexpert.io/mock-interviews) · [SystemsExpert](https://www.algoexpert.io/systems/product)                                                                                                                     | 未确认允许内容再利用；默认不复制 / No reuse permission confirmed; do not copy                                                                    |
| 牛客 / Nowcoder              | [Homepage](https://www.nowcoder.com/?target=main) · [About](https://www.nowcoder.com/nowcoder/about/?fromPut=b2c_about) · [App](https://www.nowcoder.com/app)                                                                                                                            | [免责声明 / Disclaimer](https://www.nowcoder.com/html/disclaimer)                                                                                |
| HDLBits                      | [Main](https://hdlbits.01xz.net/wiki/Main_Page) · [Problem sets](https://hdlbits.01xz.net/wiki/Problem_sets)                                                                                                                                                                             | 未确认独立再利用许可；默认只链接 / No standalone reuse license confirmed; link only                                                              |
| EDA Playground               | [Product](https://www.edaplayground.com/home) · [Documentation](https://eda-playground.readthedocs.io/en/latest/settings.html)                                                                                                                                                           | 登录、商业工具审批和各工具许可证继续适用 / Login, commercial approval, and tool licenses apply                                                   |
| Siemens Verification Academy | [Academy](https://verificationacademy.com/) · [Forums](https://verificationacademy.com/forums/)                                                                                                                                                                                          | 遵循 Siemens/页面条款；不主张内容可复制 / Follow applicable terms; no reuse claim                                                                |
| Cadence Training             | [All Courses](https://www.cadence.com/en_US/home/training/all-courses.html) · [Front-End certification](https://www.cadence.com/en_US/home/training/all-courses/86356.html) · [University Program](https://www.cadence.com/en_US/home/resources/company/cadence-university-program.html) | 账号、课程和工具许可继续适用 / Account, course, and tool licenses apply                                                                          |
| Synopsys Learning Center     | [Training](https://www.synopsys.com/support/training.html) · [Self-Paced](https://www.synopsys.com/support/training/self-paced.html) · [Catalog](https://training.synopsys.com/learn)                                                                                                    | 订阅、SolvNetPlus、工具许可和课程权利继续适用 / Subscription, SolvNetPlus, tool, and course rights apply                                         |
| OpenROAD / ORFS              | [OpenROAD docs](https://openroad.readthedocs.io/en/latest/) · [ORFS tutorial](https://openroad-flow-scripts.readthedocs.io/en/latest/tutorials/FlowTutorial.html) · [Metrics](https://openroad-flow-scripts.readthedocs.io/en/latest/contrib/Metrics.html)                               | [ORFS repository and BSD-3-Clause notice](https://github.com/The-OpenROAD-Project/OpenROAD-flow-scripts); dependencies retain their own licenses |
| Tiny Tapeout                 | [Home](https://tinytapeout.com/) · [Workshops](https://www.tinytapeout.com/workshops/) · [GDS submission](https://tinytapeout.com/guides/workshop/create-your-gds/)                                                                                                                      | [Terms](https://tinytapeout.com/terms/) and repository/shuttle-specific requirements                                                             |
| Nand2Tetris                  | [Home](https://www.nand2tetris.org/) · [Software](https://www.nand2tetris.org/software/HDL)                                                                                                                                                                                              | 官网说明非营利免费/开源使用；商业再利用需另行核验 / Official non-profit-use statement; verify commercial reuse separately                        |
| VLSI Verify                  | [Product](https://vlsiverify.com/)                                                                                                                                                                                                                                                       | 未确认再利用许可；默认只链接 / No reuse license confirmed; link only                                                                             |
| ChipVerify                   | [Product](https://chipverify.com/)                                                                                                                                                                                                                                                       | [Terms](https://chipverify.com/sitemap/info/terms-and-conditions)                                                                                |

## 12. 最终产品判断 / Final product judgment

**AIALRA 不应成为 / AIALRA should not become**

- “LeetCode for Verilog”的简单复刻 / a simple “LeetCode for Verilog” clone;
- 面经抓取器、公司真题排行榜或泄题仓库 / an interview-report scraper, company-question leaderboard, or leak repository;
- 只有课程目录、完成打卡和 AI 总分的内容站 / a content site with only course lists, streaks, and an AI total score;
- 把厂商课程、商业工具权限或流片费用当作求职门槛的系统 / a system that turns vendor training, commercial licenses, or tapeout fees into hiring prerequisites.

**AIALRA 应成为 / AIALRA should become**

> **面向半导体、EDA 与验证岗位的 Evidence-to-Mastery Career OS：把可追溯的当前岗位证据编译为依赖能力图、双语可执行训练、真实工程工件、校准后的迁移证据和下一次投递动作。**
> **An Evidence-to-Mastery Career OS for semiconductor, EDA, and verification roles: compile traceable current-job evidence into a dependency capability graph, bilingual executable training, authentic engineering artifacts, calibrated transfer evidence, and the next application action.**

该定位可以被验证和迭代，但不得使用“全球唯一”“题目最多”“保证录用”或其他无法证实的营销语言 / This positioning is testable and iterable; it must not use unverifiable claims such as “the world’s only,” “the most questions,” or “guaranteed offer.”

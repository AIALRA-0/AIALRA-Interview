# 美国硬件与芯片求职公司宇宙：覆盖口径与审计

> 版本：v1
>
> 信息观察日：2026-07-23
>
> 数据文件：`data/companies.us.json`

## 1. 这份清单是什么

这是一份面向美国求职的“候选组织全集种子”，不是一张声称所有公司都正在招聘的岗位表。v1 共收录 **200 个唯一实体**，覆盖：

- 半导体、EDA、IP、处理器、AI 加速器与存储；
- 晶圆制造、设备、材料、测试、封装与电子制造服务；
- 云厂商自研芯片、消费电子、服务器、网络与系统硬件；
- 汽车电子、自动驾驶、机器人与工业系统；
- 大学、研究所、国家实验室、科研联盟及开放硬件社区；
- 少量技术高度相关但受公民身份、安保许可或出口管制明显影响的组织，用作“边界提醒”，而非优先投递建议。

一个实体被收录，只代表它在美国存在相关团队、岗位渠道、研究/开源参与路径，或与目标能力高度相关。除非 `evidence.type` 明确标为 `official-current-job`，否则不得把记录解读为“当前有空缺”。

## 2. 覆盖方法

清单按下面的层级追踪，而不是只搜知名公司：

`产业链节点 → 法律母公司/美国实体 → 业务单元 → 岗位族 → 具体 requisition`

### 2.1 产业链起点

第一轮以权威行业目录建立候选集合：

- [Semiconductor Industry Association 成员](https://www.semiconductors.org/about/members/)
- [Global Semiconductor Alliance 成员目录](https://www.gsaglobal.org/membership/member-directory/)
- [SEMI 成员目录](https://www.semi.org/en/resources/member-directory)
- [RISC-V 技术社区成员](https://tech.riscv.org/members/)
- [CHIPS Alliance 成员](https://www.chipsalliance.org/about/members/)

随后补充官方会议赞助商/参展商、企业官网业务页面、官方 early-career 页面，以及与 USC 地理和校招渠道相关的组织。目录只负责发现候选，最终记录必须回到组织官网、官方项目页或政府规则页作证据。

### 2.2 纳入条件

满足以下任一条件即可进入候选集：

1. 在美国有与芯片、EDA、硬件系统、制造、汽车/机器人或相关研究直接有关的团队；
2. 有可核实的美国职业、学生项目、研究项目或开源贡献入口；
3. 技术匹配度很高，但存在明确资格限制，值得提前排除或按岗位逐条筛选；
4. 是能显著增强作品集、行业信号或转介绍网络的科研/开源组织。

国际总部所在地不等于工作所在地。数据中的 `country` 表示组织或母公司的注册/总部国家，`region:"US"` 或 `US-*` 表示本清单关注其美国机会。跨国企业尽量使用美国子公司或美国职业入口；无法稳定拆分的，保留母公司名称并列出美国地点。

### 2.3 排除与去重

- 同一公司品牌变体、旧名和常用缩写放进 `aliases`，不重复计数；
- 已完成的并购按当前官方结构处理，并在必要时保留原品牌别名；
- 纯软件、纯咨询或与目标方向没有可解释硬件交集的组织不纳入；
- 只有聚合站转载、无法回溯到官方入口的“公司/岗位”不纳入；
- 单个实验室或团队原则上并入所属大学/研究机构，除非其招聘与身份体系独立。

并购口径参考：

- [Synopsys 完成收购 Ansys](https://investor.synopsys.com/news/news-details/2025/Synopsys-Completes-Acquisition-of-Ansys/default.aspx)
- [Siemens 完成收购 Altair](https://press.siemens.com/global/en/pressrelease/siemens-acquires-altair-create-most-complete-ai-powered-portfolio-industrial-software)
- [Altera 与 Silver Lake 交易说明](https://www.altera.com/newsroom/news/press-release/altera-investment-silver-lake)

## 3. 数据字段与事实/推断边界

每个对象都具有统一字段：

- `id`、`name`、`aliases`：稳定标识和名称映射；
- `country`、`region`、`locations`：组织来源与美国机会地点；
- `companyType`、`categories`、`focusAreas`：产业位置与技术方向；
- `roleFamilies`：应该继续展开的岗位族，不表示当前一定有缺口；
- `fitTier`、`difficulty`：用于排投递顺序的分析标签；
- `visaSignal`：只表示目前证据强度，不是法律结论；
- `whyRelevant`、`requirements`、`gaps`：基于目标画像的分析推断；
- `opportunityTypes`：官网可见的长期渠道或分析上值得监控的机会类型；
- `careerUrl`、`evidence`、`lastVerified`、`confidence`：溯源与复查信息。

### 3.1 标签含义

`fitTier`：

- `P0`：应主动建立项目、内推和定向投递链路；
- `P1`：高相关，适合规模化但仍需岗位级定制；
- `P2`：邻近方向、制造/系统延伸或需要补足专门知识；
- `P3`：资格限制强、相关性较间接，或只应在特定条件下尝试。

`difficulty`：

- `S`：极高竞争、研究深度要求高，或存在硬性资格门槛；
- `A`：高竞争，需要明显高于课程作业的项目证据；
- `B`：仍需匹配，但可通过定向项目、校内经历和基础面试准备获得现实机会；
- `C`：预留等级；本版没有为了“看起来容易”而把任何组织降为 C。

`visaSignal`：

- `friendly`：存在对当前身份相对可行的非传统入口，例如 USC 校内工作或不构成雇佣的开源贡献；仍需遵守对应规则；
- `mixed`：公司、项目或岗位之间差异明显，必须逐条核实；
- `restricted`：官方规则或工作性质显示公民身份、安保许可或出口管制构成显著障碍；
- `unverified`：没有足够官方证据确认赞助或资格政策。**这是默认值，不代表拒绝，也不代表支持。**

### 3.2 证据等级

- `official-current-job`：当前直接岗位页；可以证明该岗位在观察日可见；
- `official-early-careers` / `official-careers`：证明组织有该招聘渠道，不能证明某个时间点有空缺；
- `official-program` / `official-research-program`：证明项目或参与路径存在；
- `official-restriction` / `official-export-guidance` / `official-clearance-guidance`：证明资格或监管框架；
- `official-company` / `official-us-site` / `official-ecosystem`：证明组织、美国业务或生态存在。

`whyRelevant`、`fitTier`、`difficulty`、`requirements` 和 `gaps` 是分析字段，不是公司原话。对岗位做最终判断时，必须以当时 requisition 的原文为准。

## 4. v1 覆盖审计

### 4.1 数量与完整性

自动校验结果：

| 指标 | 结果 |
|---|---:|
| JSON 对象数 | 200 |
| 唯一 `id` 数 | 200 |
| 重复 `id` | 0 |
| 缺失必填字段 | 0 |
| 缺失或空 `evidence` | 0 |
| `evidence` 子字段缺失 | 0 |

### 4.2 方向覆盖

下表按非互斥 `categories` 标签计数，因此总和会超过 200：

| 方向标签 | 实体数 |
|---|---:|
| semiconductor | 52 |
| AI-hardware | 27 |
| semiconductor-equipment | 21 |
| automotive | 20 |
| manufacturing | 18 |
| systems-hardware | 18 |
| systems | 17 |
| EDA | 15 |
| AI | 15 |
| robotics | 15 |
| analog | 13 |
| semiconductor-IP | 12 |
| connectivity | 12 |
| embedded | 12 |
| advanced-packaging | 11 |
| CPU | 10 |
| storage | 9 |
| research | 9 |
| RISC-V | 8 |
| networking | 8 |

优先级分布为 `P0 35 / P1 71 / P2 71 / P3 23`；难度分布为 `S 47 / A 84 / B 69`。这保证公司树既不只剩“大厂愿望清单”，也没有用低相关组织虚增数量。

### 4.3 签证信号审计

`visaSignal` 分布为：

| 信号 | 数量 |
|---|---:|
| unverified | 176 |
| mixed | 16 |
| friendly | 3 |
| restricted | 5 |

高比例 `unverified` 是有意的保守设计。公司是否办理 H-1B、某个团队是否能接收 F-1/CPT、某个项目是否涉及出口许可，通常无法从总公司招聘页可靠推断。

### 4.4 USC 国际学生实际可达性锚点

[USC Viterbi Summer Internships 2025 官方统计](https://viterbigradadmission.usc.edu/summerintern2025/)显示，截至 2025-05-27，共有 **416 名硕士生和 144 名博士生，即 560 名国际研究生，在 100+ 家公司进行 CPT 实习**。该页发布于 2025-06-12，并于 2025-07-01 更新。它不是公司自报的“愿意赞助”口径，而是 USC 国际研究生已经取得 CPT 实习的历史结果，因此可用作公司宇宙的可达性校验集。

该官方名单与 v1 的重点方向有大量交叉，包括 Cadence、Synopsys、Siemens Digital Industries Software、NVIDIA、Intel、Qualcomm、Arm、Applied Materials、KLA、Lightmatter、Tenstorrent、Texas Instruments、NXP、Renesas、Skyworks、Monolithic Power Systems、OmniVision、Micron、MathWorks、Arista、IBM、HPE、Rivian、Bosch、General Motors、Tesla、Toyota Research Institute、Waymo、Zoox、Boston Dynamics、Samsung Research America、Seagate 和 Lawrence Berkeley National Laboratory 等。这证明：

- 国际学生在芯片、EDA、设备、系统硬件、汽车和机器人方向获得 CPT 并非理论可能；
- “公司级历史可达”仍不等于 2027 年同一团队、同一岗位或同一国籍条件下可达；
- 应优先把名单中与目标方向重合的公司升级为校友检索、内推和岗位提醒对象；
- USC 全表是跨学科雇主集合，包含大量金融、医药、建筑、纯软件和小型咨询公司，不能不加筛选地全部并入硬件公司树。

残余覆盖也因此可以被具体化：TetraMem、Futurewei、Calix、Dolby、HARMAN、Honda Research Institute USA、Mercedes-Benz Research and Development North America、Intrinsic、Intuitive Surgical、Nokia、TE Connectivity、Viasat、XMotors.ai 等与硬件相邻、且出现在 2025 USC CPT 结果中的组织，构成 v2 的优先核验队列。它们没有被假装成 v1 已完成覆盖，也不能仅凭历史结果标成 `friendly`；下一步需回到各自官方岗位页核实 2027 的职位、团队、地点和身份措辞。

## 5. F-1、CPT、出口管制与安保许可筛选

这四件事必须分开判断：

1. **当前是否有工作授权**：例如学校批准的 CPT 或校内工作；
2. **公司现在是否愿意接收该授权**：即便 legally eligible，公司也可能有内部政策；
3. **未来是否需要/能否获得赞助**：这是毕业后的独立问题；
4. **岗位是否受出口管制、US-person 或安保许可限制**：与“是否赞助”不是同一个问题。

建议把岗位级筛选做成四档：

- **RED—HARD STOP**：岗位明确要求美国公民、现有 clearance，或明确仅限 US person 且没有许可路径；
- **ORANGE—LICENSE/TEAM REVIEW**：职位涉及出口管制，但文本说明可能通过许可证或团队评估处理；
- **YELLOW—SPONSORSHIP UNKNOWN**：没有硬性限制，但公司对 CPT/未来赞助没有可信公开说明；
- **GREEN—AUTHORIZATION PATH EXISTS**：当前授权路径在规则上可行；仍须获得 USC 批准并让雇主接受。

### 5.1 USC 规则边界

[USC OIS 的 CPT 指南](https://ois.usc.edu/employment/employment-f1/cpt/)说明，CPT 与课程/培养目标相关，由学校授权，并且有资格与时间要求；无薪实习也不能因为“没有工资”就绕过工作授权判断。[USC OIS 校内工作指南](https://ois.usc.edu/employment/employment-f1/f1oncampusemployment/)则使校内科研、学生岗位和实验室工作成为第一学期更现实的桥梁。

具体到任何 offer，应以当时 USC OIS 书面意见为准。本清单不是移民法律意见。

### 5.2 无薪实习不是捷径

[美国劳工部 Fact Sheet #71](https://www.dol.gov/agencies/whd/fact-sheets/71-flsa-internships)以“主要受益人”测试判断营利性雇主的实习生是否属于雇员。即便劳动法层面可能无薪，F-1 工作授权仍是另一套判断。因此：

- 不以“无薪”作为签证可行性的替代条件；
- 不把模糊的志愿者安排包装成实习；
- 对营利性公司优先追求结构清晰、学校可批准、职责与课程直接相关的项目。

### 5.3 出口管制与安保许可

[BIS 的 deemed export 指南](https://www.bis.gov/learn-support/deemed-exports/what-deemed-export)解释了向外国人释放受控技术可能被视作出口；这不等于所有外国学生都自动被排除，具体取决于技术、国籍、许可例外和公司合规政策。

[DCSA 的设施/安保许可 FAQ](https://www.dcsa.mil/Industrial-Security/Entity-Vetting-Facility-Clearances-FOCI/Facility-Clearances/FAQs-Facility-Security-Officers/)用于识别 clearance 相关硬门槛。NASA 学生项目的公民身份限制则以 [NASA Internship FAQ](https://www.nasa.gov/learning-resources/internship-programs/intern-frequently-asked-questions/)为准。科研机构和国家实验室不能一概而论，必须检查具体项目；例如 DOE SULI 有其独立的[官方资格要求](https://science.osti.gov/wdts/suli/Eligibility)。

历史 H-1B/LCA 数据可用来发现“曾经发生过赞助”的信号，但不能证明未来或某个团队会赞助，因此本版没有用历史记录把公司直接标成 `friendly`。

## 6. 2027 实习时间窗口

截至观察日，2027 招聘并非全部开放，但已经不能等到 2027 年才开始：

- TSMC Arizona 的 [Summer 2027 Engineering Internship](https://ro.careers.tsmc.com/job/Phoenix-Summer-2027-TSMC-AZ-Internship-Opportunities-Engineering-Roles-AZ-85001/1361003166/) 是本版唯一明确标为 `official-current-job` 的例子；
- [AMD Student Programs](https://www.amd.com/en/corporate/careers/student-programs/regional-programs.html)给出美国学生项目的一般申请周期，应从 2026 年夏末开始监控；
- [NVIDIA University Recruiting](https://www.nvidia.com/en-us/about-nvidia/careers/university-recruiting/)适合全年建立职位提醒，而不是只等一个统一批次；
- [Cerebras Intern Program](https://www.cerebras.ai/interns)展示了分学期/季度的实习入口；
- USC Viterbi 的 [2026 秋季招聘日历](https://viterbicareers.usc.edu/wp-content/uploads/2026/05/263-Fall-Recruiting-Calendar.pdf)显示 9 月已有集中招聘活动，简历、项目证据和目标公司短名单应在开学前完成。
- [USC Viterbi 2025 CPT 结果](https://viterbigradadmission.usc.edu/summerintern2025/)可用于反向检索已雇佣过 USC 国际研究生的公司和校友，但它不保证下一年度重复招聘。

上述页面证明的是观察日可见的官方窗口或长期节奏。除 TSMC 这条直接 requisition 外，不应把它们写成“2027 当前职位”。

## 7. 如何使用公司树

建议把 200 个实体转成四层行动队列，而不是一次性海投：

1. **认知层**：按 `categories → focusAreas → roleFamilies` 建立产业链和岗位地图；
2. **准备层**：对 P0/P1 的共同 `requirements` 做技能聚类，选择能同时服务多家公司的作品集项目；
3. **投递层**：只在具体 requisition 出现后记录岗位 ID、开放日、地点、授权问题、关键词差距和联系人；
4. **复盘层**：把 OA、面试、拒信和内推反馈反写为“岗位证据”，更新 `difficulty`、`gaps` 与优先级。

公司级 `visaSignal` 只能用于预筛。真正投递前应制作岗位级检查表：

- 是否明确接受学生/实习身份；
- CPT 开始、结束日期是否与学期规则一致；
- 是否写明 now or in the future sponsorship；
- 是否出现 citizen、clearance、US person、export license 等措辞；
- 工作地点、hybrid/on-site 要求与搬迁成本；
- 课程、项目和关键词能否给出可量化证据；
- 申请日期、推荐人、跟进日期和结果。

## 8. 已知缺口与下一轮更新

v1 的边界如下：

- 它覆盖组织，不覆盖每个组织的全部团队和 requisition；
- 2027 岗位仍处在陆续出现阶段，绝大多数记录不能视为当前空缺；
- 地点是代表性美国枢纽，不保证完整；
- 小公司、被并购品牌和职业网址可能变化，需要定期复核；
- `requirements` 是岗位族的共同能力推断，不能替代具体 JD；
- 出口管制结论可能随技术、国籍、团队和许可证改变；
- 公司级赞助政策通常不透明，不能根据传闻或单次历史案例下结论；
- 开源基金会、大学和联盟的“机会”可能是贡献、研究或网络入口，不一定是有薪雇佣。

下一轮不应继续无边界堆公司，而应做滚动验证：

1. 每周监控 P0/P1 官方职业页和 USC 校招渠道；
2. 新增具体岗位时保存原始 JD、开放日期和岗位 ID；
3. 每月复核并购、美国地点、学生项目和失效链接；
4. 每次真实申请/面试后更新技能缺口与难度；
5. 当新增目录连续两轮带来的“新且相关实体”低于既有清单的 3%，视为组织层覆盖趋于饱和，转向岗位层深挖。

这份 v1 的停止条件是：产业链主要节点均有代表性组织、公司类型不只集中在品牌大厂、汽车/机器人/科研等邻接领域已覆盖、资格受限组织被显式标记、且 200 条记录全部通过结构与唯一性校验。

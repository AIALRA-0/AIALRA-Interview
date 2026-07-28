# 薪资基准方法论 / Compensation Benchmark Methodology

**证据冻结日 / Evidence dates:** 具体职位薪资对照 2026-07-26；当前岗位观察 2026-07-28 / specific-position comparisons 2026-07-26; current-job observations 2026-07-28

**数据资产 / Data assets:** `data/position-compensation-comparisons.json`（具体职位到手测算 / specific-position net-pay modeling）、`data/current-job-observations.json`（当前岗位 / current jobs）与 `data/role-compensation-benchmarks.json`（背景 / background）

## 1. 目的与边界 / Purpose and boundaries

本方法为十二个技术岗位族提供可审计的薪资规划证据，并明确区分以下四类证据：

1. 美国雇主在具体岗位页披露的薪资；
2. 中国雇主或招聘平台上的具体岗位薪资；
3. 美国政府职业工资分位数；
4. 中国政府市场招聘薪酬均值及企业薪酬分位数。

主界面遵循“具体职位优先”：每个技术岗位族由一个美国具体职位与一个中国具体职位独立构成，不允许在多个岗位卡之间复用职位 ID、来源 URL 或薪资结果。它仍不是录用报价保证；招聘平台数据、历史快照和第三方估算必须显式标注，投递当天仍需重查。政府职业统计仅作为建立数量级认知、解释 P25/P50/P75 和发现异常报价的背景，不能冒充具体公司的工资。

This method provides auditable compensation-planning evidence for twelve technical role families while keeping four evidence classes separate:

1. pay disclosed on a specific U.S. employer posting;
2. pay on a specific China employer or job-board posting;
3. U.S. government occupational wage percentiles; and
4. China government recruitment-pay means and enterprise-wage percentiles.

The primary UI is specific-position-first: each technical role family has one independently sourced U.S. position and one independently sourced China position. Position IDs, source URLs, and computed results may not be reused across role cards. This is still not an offer guarantee; job-board observations, historical snapshots, and third-party estimates are labeled and must be rechecked on the application date. Government occupational statistics are background for order-of-magnitude awareness, percentile literacy, and anomaly detection—not a company's wage.

## 2. 具体职位对照、到手收入与等效方法 / Specific-position, take-home, and equivalence method

### 2.1 周期统一 / Period normalization

每个具体职位同时展示四个量：税前年薪、税前日历月均、预估现金到手年薪、预估现金到手日历月均。美国刊载年薪直接年化；中国刊载月薪必须乘该职位独立记录的 `payMonthsPerYear`，再除以 12 计算日历月均。13、14、15、16 薪不能在职位间继承或猜测。

Every specific position shows four measures: gross annual pay, gross calendar-month average, estimated annual cash net, and estimated calendar-month cash net. U.S. annual postings are already annualized. A China monthly posting is multiplied by that position's own `payMonthsPerYear`, then divided by 12 for a calendar-month average. A 13-, 14-, 15-, or 16-month structure must never be inherited from another position or guessed.

### 2.2 美国到手情景 / U.S. take-home scenarios

普通雇员情景按单身、无受抚养人、仅工资收入估算，纳入：

- IRS 2026 联邦税率及 16,100 美元标准扣除；
- 雇员 Social Security 6.2%（工资上限 184,500 美元）、Medicare 1.45%，以及 200,000 美元以上额外 0.9%；
- 加州岗位采用最新最终版 2025 加州税负表、5,706 美元标准扣除与 2026 SDI 1.3%；德州州所得税为零。

“合资格 F-1 免 FICA”只是一项敏感性情景：仅移除 FICA，其他所得税假设保持一致。真实的非居民报税、1040-NR、税收协定、扣除和抵免可能改变结果，页面不得把这一情景称为精确工资单。

The standard-employee estimate assumes single, no dependents, and wage income only. It includes:

- IRS 2026 federal brackets and the USD 16,100 standard deduction;
- employee Social Security at 6.2% up to USD 184,500, Medicare at 1.45%, and the additional 0.9% above USD 200,000; and
- for California roles, the latest final 2025 California liability schedule, a USD 5,706 standard deduction, and 2026 SDI at 1.3%. Texas state income tax is zero.

The “eligible F-1 FICA-exempt” output is a sensitivity scenario only: it removes FICA while holding the other income-tax assumptions constant. Actual nonresident filing, Form 1040-NR, treaties, deductions, and credits can change the result, so it must not be described as an exact paystub.

### 2.3 中国到手情景 / China take-home scenario

中国统一按上海居民个人、仅综合工资、无专项附加扣除估算。个人社保为养老 8% + 医疗 2% + 失业 0.5%，缴费基数采用最近公布的月下限 7,460 元与上限 37,302 元；住房公积金选择官方允许范围内的 7% 情景。年度应纳税所得额为工资减 60,000 元基本减除、个人社保和个人公积金，再按综合所得年度税率表计算。现金到手扣除税、个人社保和个人公积金；个人公积金作为受限个人储蓄另列，不能与现金混写，也不能当作税。

The China estimate assumes a Shanghai resident individual, wage income only, and no special additional deductions. Employee social insurance is pension 8% + medical 2% + unemployment 0.5%, using the latest published monthly contribution floor of CNY 7,460 and ceiling of CNY 37,302. Housing fund uses a 7% scenario within the official range. Annual taxable income equals wages less the CNY 60,000 basic deduction, employee social insurance, and employee housing fund, then applies the annual comprehensive-income schedule. Cash net deducts tax, employee social insurance, and employee housing fund. Employee housing fund is shown separately as restricted personal savings; it is neither cash nor tax.

### 2.4 等效算法与“更优”判定 / Equivalence algorithm and “better” signal

不存在一个能同时决定现金、职业发展、签证、福利、股权和生活质量的通用“最高认可度算法”。本产品采用公开、可复算的双视图：

1. **主判据：税后私人消费 PPP。** 两侧先独立计算现金到手中点，再除以世界银行私人消费 PPP 转换因子。2025 中国为 `3.4595580434271 CNY/Int$`，美国为 `1 USD/Int$`。较高者显示购买力优势百分比。
2. **辅助判据：名义汇率。** 使用美联储 H.10 在 2026-07-17 的 `6.7760 CNY/USD` 把中国现金到手中点折成美元，仅回答可兑换金额，不回答本地购买力。

优势百分比为 `(较高值 - 较低值) / 较低值`。页面必须称其为“税后现金购买力信号”，不得写成整体职业结论。奖金、股权、雇主医保、退休金、签证价值、住房与城市生活质量均未纳入。

No universal “most accepted” algorithm can jointly decide cash, career growth, immigration, benefits, equity, and quality of life. The product therefore uses two public and reproducible views:

1. **Primary: after-tax private-consumption PPP.** Compute each side's midpoint cash net independently, then divide by the World Bank private-consumption PPP factor. For 2025, China is `3.4595580434271 CNY/Int$` and the U.S. is `1 USD/Int$`. The higher value receives a purchasing-power advantage percentage.
2. **Secondary: nominal FX.** Use the Federal Reserve H.10 rate of `6.7760 CNY/USD` on 2026-07-17 to convert the China cash-net midpoint into USD. This answers convertibility, not local purchasing power.

The advantage percentage is `(higher - lower) / lower`. The UI must call it an after-tax cash purchasing-power signal, not an overall career conclusion. Bonus, equity, employer healthcare, retirement, immigration value, housing, and city quality of life are excluded.

## 3. 美国职业统计背景 / U.S. occupational-statistics background

美国主基准来自美国劳工统计局 Occupational Employment and Wage Statistics（OEWS）[2025 年 5 月全国数据](https://www.bls.gov/oes/tables.htm)，发布于 2026-05-15。资产保留每个职业的第 25 百分位数、中位数和第 75 百分位数，单位为美元/年。每个数值还保存可复查的 BLS API series ID。

OEWS 的样本包含非农行业中领取工资或薪水的全职与兼职雇员，不提供“应届”“硕士毕业生”“实习生”或单一公司的独立分布。因此：

- `employmentLevel` 固定为 `all-levels`；
- `employmentType` 为 `wage-and-salary-employment`；
- 这些数据不是 Summer 2027 实习时薪，也不是 new-grad offer band；
- 全国 P25–P75 不能替代地点、经验、公司层级和具体 JD 的薪资披露。

根据 BLS 的[工资口径说明](https://www.bls.gov/oes/oes_ques.htm)，OEWS 是不含溢价工资的税前直线工资。它包含基本工资、佣金、生活成本津贴、激励工资和生产奖金；不含股票、雇主福利成本、加班费、轮班差额、非生产奖金及年终奖金。因此页面必须写“工资基准”，不能写“总包”。

The U.S. primary benchmark is the Bureau of Labor Statistics Occupational Employment and Wage Statistics [May 2025 national dataset](https://www.bls.gov/oes/tables.htm), released on 2026-05-15. The asset preserves the 25th percentile, median, and 75th percentile in USD per year, plus the BLS API series IDs used to audit each value.

OEWS covers full- and part-time wage and salary employees in nonfarm establishments. It does not publish separate distributions for new graduates, master's graduates, interns, or individual employers. Consequently:

- `employmentLevel` is `all-levels`;
- `employmentType` is `wage-and-salary-employment`;
- the figures are not Summer 2027 internship hourly rates or new-grad offer bands; and
- national P25–P75 values do not replace posting-specific pay, geography, experience, or company level.

Under the BLS [wage definition](https://www.bls.gov/oes/oes_ques.htm), OEWS measures straight-time gross pay. It includes base rates, commissions, cost-of-living allowances, incentive pay, and production bonuses. It excludes stock, employer benefit costs, overtime, shift differentials, nonproduction bonuses, and year-end bonuses. The UI must therefore say wage benchmark, not total compensation.

## 4. 中国职业统计背景 / China occupational-statistics background

### 4.1 2026 年第一季度市场招聘均值 / 2026 Q1 recruitment means

当前招聘市场数据来自中国劳动和社会保障科学研究院课题组发布的[《基于市场招聘薪酬大数据的热门岗位和典型岗位薪酬数据（2026 年第一季度）》](https://www.mohrss.gov.cn/SYrlzyhshbzb/laodongguanxi_/fwyd/202607/t20260708_579828.html)，发布于 2026-07-08。来源将“平均招聘薪酬”定义为统计期内某岗位市场招聘总薪酬除以总招聘人数，单位为万元/月；资产换算成整数人民币/月存储。

该表发布的是均值，不是 P25–P75。若一个岗位在多个地区有均值，资产保存每个地区点值，并额外计算 `regional-mean-envelope` 方便浏览。这个 low–high 只是地区均值的最小值与最大值，绝不能显示为个人薪资带。行业切片与地区切片属于不同总体，亦不得合并。

Current recruitment-market data comes from the Chinese Academy of Labour and Social Security research group's [Market Recruitment Compensation for Popular and Typical Roles, 2026 Q1](https://www.mohrss.gov.cn/SYrlzyhshbzb/laodongguanxi_/fwyd/202607/t20260708_579828.html), published on 2026-07-08. The source defines average recruitment compensation as total advertised recruitment compensation divided by the number of recruits during the period. The published unit is CNY 10,000 per month; the asset stores integer CNY per month.

These are means, not P25–P75 bands. When the source reports the same role for several regions, the asset preserves every regional point and calculates a `regional-mean-envelope` for navigation. Its low and high are only the minimum and maximum of regional means—not an individual pay range. Industry slices and regional slices describe different populations and must also remain separate.

### 4.2 2025 年企业薪酬分位数 / 2025 enterprise wage percentiles

宽口径背景范围来自人力资源和社会保障部[《企业薪酬调查信息（2025 年）》](https://www.mohrss.gov.cn/SYrlzyhshbzb/laodongguanxi_/fwyd/202607/t20260708_579822.html)，同样发布于 2026-07-08。该调查以企业实际从业人员为总体，资产保留 P25、P50 和 P75，单位为人民币/年。其工资价位包括基本工资、奖金、津贴补贴、加班加点工资及特殊情况下支付的工资。

这些全国性类别比目标岗位宽得多。例如“计算机软件测试员”不是芯片设计验证，“工程技术人员”也不是某个 RTL 或物理设计岗位。因此它们只出现在 `chinaContextBenchmarks`，并标记为 `broad-context`。产品不得把 2025 在职员工分位数和 2026 Q1 招聘均值拼接成一个“薪资区间”，因为两者的总体、期间和统计量均不同。

Broad contextual ranges come from the Ministry of Human Resources and Social Security [Enterprise Compensation Survey Information, 2025](https://www.mohrss.gov.cn/SYrlzyhshbzb/laodongguanxi_/fwyd/202607/t20260708_579822.html), also released on 2026-07-08. It surveys actual enterprise employees. The asset preserves P25, P50, and P75 in CNY per year. Its wage measure includes base pay, bonuses, allowances, overtime, and pay under special circumstances.

These nationwide categories are much broader than the target roles. For example, Computer Software Tester is not chip design verification, and Engineering Technical Personnel is not a specific RTL or physical-design role. They therefore live only in `chinaContextBenchmarks` and are labeled `broad-context`. The product must never splice a 2025 employee percentile with a 2026 Q1 recruitment mean into one “salary range”: the populations, periods, and statistics differ.

## 5. 岗位映射判断 / Role-mapping judgment

- `direct`：来源岗位名称与目标方向直接一致，例如“模拟芯片设计工程师”“嵌入式软件开发工程师”“半导体设备工程师”。
- `adjacent`：存在明显技能和劳动力市场邻接，但不是同义词，例如用“计算机硬件工程师”代理 RTL、FPGA、体系结构、物理设计和 DFT。
- `broad-context`：只用于行业或职业大类背景，不应成为岗位卡片的主薪资，例如“工程技术人员”和“数字产品制造业”。

物理设计、DFT 和芯片体系结构在中国 2026 Q1 官方表中没有独立类别。资产保守使用“硬件工程师”或“硬件测试工程师”作为低精度邻近代理，并在中英文说明中明确限制。官方表中的“架构师”位于互联网、物联网与电子商务行业，语义更接近软件架构；本资产明确排除该数字，避免把它误写成 CPU/GPU 架构师薪资。

- `direct`: the source title directly matches the target direction, such as Analog Chip Design Engineer, Embedded Software Development Engineer, or Semiconductor Equipment Engineer.
- `adjacent`: the labor market and skill set overlap materially, but the titles are not synonyms—for example, Computer Hardware Engineers as the proxy for RTL, FPGA, architecture, physical design, and DFT.
- `broad-context`: an occupational or industry backdrop that must not become the primary role-card salary, such as Engineering Technical Personnel or Digital Product Manufacturing.

The China 2026 Q1 official table has no separate physical-design, DFT, or chip-architecture category. The asset conservatively uses Hardware Engineer or Hardware Test Engineer as low-specificity adjacent proxies and states the limitation bilingually. The table's Architect record belongs to the Internet, IoT, and e-commerce industry and is semantically closer to software architecture; this asset deliberately excludes it rather than mislabel it as CPU/GPU architect compensation.

## 6. 跨职能岗位族 / Cross-cutting role families

行为面试、技术项目深挖和技术英文表达是所有技术岗位共享的能力，不是可独立招聘的职业。它们的 `benchmarkStatus` 为 `not-applicable`，美国基准为 `null`，中国基准为空数组。薪资必须继承用户正在考察的技术岗位族，绝不能填 0，也不能为“补齐页面”而创造宽口径数字。

Behavioral Interview, Technical Project Deep Dive, and Technical English Communication are capabilities shared across technical roles, not independently hired occupations. Their `benchmarkStatus` is `not-applicable`, the U.S. benchmark is `null`, and the China list is empty. Compensation must come from the technical role being evaluated; zero and invented broad values are both prohibited.

## 7. 具体当前岗位的披露状态 / Current-job disclosure status

2026-07-28 的当前岗位资产含四条精确雇主岗位记录，其中两条披露基本工资，两条未披露现金薪资：

- [Synopsys Senior R&D Engineer — StarRC](https://careers.synopsys.com/job/sunnyvale/senior-r-and-d-engineer-17637/44408/95924563664)：雇主披露美国基本工资 116,000–174,000 美元/年；奖金与股权另计。
- [Synopsys Applications Engineering, Scientist](https://careers.synopsys.com/en/job/austin/applications-engineering-scientist/44408/95653634896)：雇主披露美国基本工资 196,000–294,000 美元/年；奖金与股权另计。
- [TSMC Arizona Summer 2027 Engineering Internship](https://ro.careers.tsmc.com/job/Phoenix-Summer-2027-TSMC-AZ-Internship-Opportunities-Engineering-Roles-AZ-85001/1361003166/)：官方页面未披露现金薪资区间；页面仅说明可提供搬迁协助。
- [Qolab Quantum Hardware Engineer](https://qolab.ai/careers/quantum-hardware-engineer)：官方页面未披露基本工资、奖金或股权区间。

Synopsys 两条记录使用 `status: "disclosed"`，只保存岗位页明确给出的基本工资，不把奖金或股权混入区间。TSMC 与 Qolab 使用 `status: "not-disclosed"`，且 `minimum`、`maximum`、`currency` 与 `period` 必须为 `null`。页面可以在其下方显示独立的市场代理，但标题必须明确说明“市场基准，非雇主披露”。申请当天还需重新打开官方页面复核。

The current-job asset contains four exact employer postings observed on 2026-07-28: two disclose base salary and two do not disclose cash compensation:

- [Synopsys Senior R&D Engineer — StarRC](https://careers.synopsys.com/job/sunnyvale/senior-r-and-d-engineer-17637/44408/95924563664): the employer discloses a U.S. base-salary range of $116,000–$174,000 per year; bonus and equity are separate.
- [Synopsys Applications Engineering, Scientist](https://careers.synopsys.com/en/job/austin/applications-engineering-scientist/44408/95653634896): the employer discloses a U.S. base-salary range of $196,000–$294,000 per year; bonus and equity are separate.
- [TSMC Arizona Summer 2027 Engineering Internship](https://ro.careers.tsmc.com/job/Phoenix-Summer-2027-TSMC-AZ-Internship-Opportunities-Engineering-Roles-AZ-85001/1361003166/): the official page disclosed no cash-pay range; it only stated that relocation assistance is available.
- [Qolab Quantum Hardware Engineer](https://qolab.ai/careers/quantum-hardware-engineer): the official page disclosed no base salary, bonus, or equity range.

The two Synopsys records use `status: "disclosed"` and store only the base range explicitly stated on each posting; bonus and equity are not folded into the range. TSMC and Qolab use `status: "not-disclosed"`, and `minimum`, `maximum`, `currency`, and `period` remain `null`. A separate market proxy may appear beneath a job, but its heading must say market benchmark, not employer disclosure. Reopen every official posting on the application date.

## 8. 显示护栏 / Display guardrails

1. 始终同时显示币种与期间，例如 `USD / year` 或 `CNY / month`。
2. 不静默年化月薪，不静默换算币种，不在未知奖金月数时乘以 12、13、14 或 16。
3. `mean` 显示为“平均招聘薪酬”；`p25-p50-p75` 显示为“职业工资分位数”；`regional-mean-envelope` 显示为“地区均值包络”。
4. 市场代理必须显示匹配质量和代理职业名称。
5. 具体岗位未披露薪资时显示“未披露”，不显示 `0`、`$0`、`待定区间`或由市场统计推断出的雇主报价。
6. 美国 OEWS 不显示成总包，也不显示成实习或应届范围。
7. 中国行业切片、地区切片与在职员工分位数保持独立卡片。
8. 每个数字旁必须可追溯到来源 URL、参考期和观察日。

9. Always display currency and period together, such as `USD / year` or `CNY / month`.
10. Do not silently annualize monthly pay, convert currencies, or multiply by 12, 13, 14, or 16 when bonus-month structure is unknown.
11. Render `mean` as average recruitment compensation, `p25-p50-p75` as occupational wage percentiles, and `regional-mean-envelope` as an envelope of regional means.
12. Every market proxy must expose its match quality and source occupation.
13. If a job does not disclose pay, show not disclosed—never `0`, `$0`, a placeholder range, or a market statistic presented as the employer's offer.
14. Do not label U.S. OEWS as total compensation, internship pay, or a new-grad range.
15. Keep China industry slices, regional slices, and employee percentiles in separate cards.
16. Every number must link to its source URL, reference period, and observation date.

## 9. 类型与维护说明 / Type and maintenance note

`app/types.ts` 分别建模具体职位对照与职业统计背景；`app/compensation-calculator.ts` 只接收前者计算税后与等效结果。完整性测试固定以下不变量：

- 十二个技术岗位族各且仅有一组中美职位；
- 二十四个职位 ID 与二十四个职位来源 URL 全部唯一；
- 美国记录必须为 `USD/year`，中国记录必须为 `CNY/month`，并各自保存计薪月数；
- 每个范围为正且下限不大于上限；
- 具体职位记录不得包含 `p25`、`median`、`p50` 或 `p75` 字段；
- 汇率、PPP、税费假设与官方来源 URL 必须随证据日冻结。

维护时每年至少在 BLS OEWS 新版发布后更新背景数据；中国季度均值按季度复核，企业薪酬分位数按年度复核。具体岗位薪资应在每次投递前重查。职位、税率、社保、公积金、汇率或 PPP 的任何变更，都必须更新观察日、来源、方法说明和完整性测试；不得只改显示数字。

`app/types.ts` models specific-position comparisons separately from occupational background statistics. `app/compensation-calculator.ts` accepts only the former for take-home and equivalence calculations. Integrity tests freeze these invariants:

- exactly one U.S.–China position pair for each of the twelve technical role families;
- all twenty-four position IDs and all twenty-four position-source URLs are unique;
- U.S. records use `USD/year`; China records use `CNY/month`; every record stores its own salary-month count;
- every range is positive and ordered;
- a specific-position record contains no `p25`, `median`, `p50`, or `p75` field; and
- FX, PPP, tax assumptions, and official source URLs are frozen with the evidence date.

Refresh occupational background after each annual BLS OEWS release, review China recruitment means quarterly, and review enterprise percentiles annually. Recheck specific-position pay before every application. Any position, tax, social-insurance, housing-fund, FX, or PPP change must update the observation date, source, method note, and integrity tests—not just the displayed number.

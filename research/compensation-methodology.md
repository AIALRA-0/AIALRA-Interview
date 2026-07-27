# 薪资基准方法论 / Compensation Benchmark Methodology

**证据冻结日 / Evidence date:** 2026-07-26

**数据资产 / Data asset:** `data/role-compensation-benchmarks.json`

## 1. 目的与边界 / Purpose and boundaries

本资产为十二个技术岗位族提供可审计的薪资规划基准，并明确区分以下三类证据：

1. 美国政府职业工资分位数；
2. 中国政府市场招聘薪酬均值及企业薪酬分位数；
3. 雇主在具体岗位页直接披露或未披露的薪资。

它不是雇主报价数据库，也不把职业统计代理解释为某家公司的实际薪资。岗位族与政府职业分类无法完全一一对应，因此每个映射都标明 `direct`、`adjacent` 或 `broad-context`。找工决策必须优先使用申请当日仍有效的具体 JD；岗位族基准只用于建立数量级认知、发现异常报价和准备谈薪问题。

This asset provides auditable compensation-planning benchmarks for twelve technical role families while keeping three evidence classes separate:

1. U.S. government occupational wage percentiles;
2. China government recruitment-pay means and enterprise-wage percentiles; and
3. salary figures disclosed—or not disclosed—by an employer on a specific job posting.

It is not an employer-offer database, and an occupational proxy must never be presented as a company's actual pay. Government occupations do not map one-to-one to the product's role families, so every mapping is labeled `direct`, `adjacent`, or `broad-context`. Application-date job postings take priority; role benchmarks are for order-of-magnitude awareness, offer anomaly detection, and negotiation preparation.

## 2. 美国口径 / United States basis

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

## 3. 中国口径 / China basis

### 3.1 2026 年第一季度市场招聘均值 / 2026 Q1 recruitment means

当前招聘市场数据来自中国劳动和社会保障科学研究院课题组发布的[《基于市场招聘薪酬大数据的热门岗位和典型岗位薪酬数据（2026 年第一季度）》](https://www.mohrss.gov.cn/SYrlzyhshbzb/laodongguanxi_/fwyd/202607/t20260708_579828.html)，发布于 2026-07-08。来源将“平均招聘薪酬”定义为统计期内某岗位市场招聘总薪酬除以总招聘人数，单位为万元/月；资产换算成整数人民币/月存储。

该表发布的是均值，不是 P25–P75。若一个岗位在多个地区有均值，资产保存每个地区点值，并额外计算 `regional-mean-envelope` 方便浏览。这个 low–high 只是地区均值的最小值与最大值，绝不能显示为个人薪资带。行业切片与地区切片属于不同总体，亦不得合并。

Current recruitment-market data comes from the Chinese Academy of Labour and Social Security research group's [Market Recruitment Compensation for Popular and Typical Roles, 2026 Q1](https://www.mohrss.gov.cn/SYrlzyhshbzb/laodongguanxi_/fwyd/202607/t20260708_579828.html), published on 2026-07-08. The source defines average recruitment compensation as total advertised recruitment compensation divided by the number of recruits during the period. The published unit is CNY 10,000 per month; the asset stores integer CNY per month.

These are means, not P25–P75 bands. When the source reports the same role for several regions, the asset preserves every regional point and calculates a `regional-mean-envelope` for navigation. Its low and high are only the minimum and maximum of regional means—not an individual pay range. Industry slices and regional slices describe different populations and must also remain separate.

### 3.2 2025 年企业薪酬分位数 / 2025 enterprise wage percentiles

宽口径背景范围来自人力资源和社会保障部[《企业薪酬调查信息（2025 年）》](https://www.mohrss.gov.cn/SYrlzyhshbzb/laodongguanxi_/fwyd/202607/t20260708_579822.html)，同样发布于 2026-07-08。该调查以企业实际从业人员为总体，资产保留 P25、P50 和 P75，单位为人民币/年。其工资价位包括基本工资、奖金、津贴补贴、加班加点工资及特殊情况下支付的工资。

这些全国性类别比目标岗位宽得多。例如“计算机软件测试员”不是芯片设计验证，“工程技术人员”也不是某个 RTL 或物理设计岗位。因此它们只出现在 `chinaContextBenchmarks`，并标记为 `broad-context`。产品不得把 2025 在职员工分位数和 2026 Q1 招聘均值拼接成一个“薪资区间”，因为两者的总体、期间和统计量均不同。

Broad contextual ranges come from the Ministry of Human Resources and Social Security [Enterprise Compensation Survey Information, 2025](https://www.mohrss.gov.cn/SYrlzyhshbzb/laodongguanxi_/fwyd/202607/t20260708_579822.html), also released on 2026-07-08. It surveys actual enterprise employees. The asset preserves P25, P50, and P75 in CNY per year. Its wage measure includes base pay, bonuses, allowances, overtime, and pay under special circumstances.

These nationwide categories are much broader than the target roles. For example, Computer Software Tester is not chip design verification, and Engineering Technical Personnel is not a specific RTL or physical-design role. They therefore live only in `chinaContextBenchmarks` and are labeled `broad-context`. The product must never splice a 2025 employee percentile with a 2026 Q1 recruitment mean into one “salary range”: the populations, periods, and statistics differ.

## 4. 岗位映射判断 / Role-mapping judgment

- `direct`：来源岗位名称与目标方向直接一致，例如“模拟芯片设计工程师”“嵌入式软件开发工程师”“半导体设备工程师”。
- `adjacent`：存在明显技能和劳动力市场邻接，但不是同义词，例如用“计算机硬件工程师”代理 RTL、FPGA、体系结构、物理设计和 DFT。
- `broad-context`：只用于行业或职业大类背景，不应成为岗位卡片的主薪资，例如“工程技术人员”和“数字产品制造业”。

物理设计、DFT 和芯片体系结构在中国 2026 Q1 官方表中没有独立类别。资产保守使用“硬件工程师”或“硬件测试工程师”作为低精度邻近代理，并在中英文说明中明确限制。官方表中的“架构师”位于互联网、物联网与电子商务行业，语义更接近软件架构；本资产明确排除该数字，避免把它误写成 CPU/GPU 架构师薪资。

- `direct`: the source title directly matches the target direction, such as Analog Chip Design Engineer, Embedded Software Development Engineer, or Semiconductor Equipment Engineer.
- `adjacent`: the labor market and skill set overlap materially, but the titles are not synonyms—for example, Computer Hardware Engineers as the proxy for RTL, FPGA, architecture, physical design, and DFT.
- `broad-context`: an occupational or industry backdrop that must not become the primary role-card salary, such as Engineering Technical Personnel or Digital Product Manufacturing.

The China 2026 Q1 official table has no separate physical-design, DFT, or chip-architecture category. The asset conservatively uses Hardware Engineer or Hardware Test Engineer as low-specificity adjacent proxies and states the limitation bilingually. The table's Architect record belongs to the Internet, IoT, and e-commerce industry and is semantically closer to software architecture; this asset deliberately excludes it rather than mislabel it as CPU/GPU architect compensation.

## 5. 跨职能岗位族 / Cross-cutting role families

行为面试、技术项目深挖和技术英文表达是所有技术岗位共享的能力，不是可独立招聘的职业。它们的 `benchmarkStatus` 为 `not-applicable`，美国基准为 `null`，中国基准为空数组。薪资必须继承用户正在考察的技术岗位族，绝不能填 0，也不能为“补齐页面”而创造宽口径数字。

Behavioral Interview, Technical Project Deep Dive, and Technical English Communication are capabilities shared across technical roles, not independently hired occupations. Their `benchmarkStatus` is `not-applicable`, the U.S. benchmark is `null`, and the China list is empty. Compensation must come from the technical role being evaluated; zero and invented broad values are both prohibited.

## 6. 具体当前岗位的披露状态 / Current-job disclosure status

冻结日只有两个组织记录具有精确 `official-current-job` 证据：

- [TSMC Arizona Summer 2027 Engineering Internship](https://ro.careers.tsmc.com/job/Phoenix-Summer-2027-TSMC-AZ-Internship-Opportunities-Engineering-Roles-AZ-85001/1361003166/)：官方页面未披露现金薪资区间；页面仅说明可提供搬迁协助。
- [Qolab Quantum Hardware Engineer](https://qolab.ai/careers/quantum-hardware-engineer)：官方页面未披露基本工资、奖金或股权区间。

二者在 `data/current-job-observations.json` 中均为 `status: "not-disclosed"`，且 `minimum`、`maximum`、`currency` 与 `period` 必须为 `null`。页面可以在其下方显示独立的市场代理，但标题必须明确说明“市场基准，非雇主披露”。申请当天还需重新打开官方页面复核。

Only two organization records had exact `official-current-job` evidence on the evidence date:

- [TSMC Arizona Summer 2027 Engineering Internship](https://ro.careers.tsmc.com/job/Phoenix-Summer-2027-TSMC-AZ-Internship-Opportunities-Engineering-Roles-AZ-85001/1361003166/): the official page disclosed no cash-pay range; it only stated that relocation assistance is available.
- [Qolab Quantum Hardware Engineer](https://qolab.ai/careers/quantum-hardware-engineer): the official page disclosed no base salary, bonus, or equity range.

Both records use `status: "not-disclosed"` in `data/current-job-observations.json`, and `minimum`, `maximum`, `currency`, and `period` must remain `null`. A separate market proxy may appear beneath the job, but its heading must say market benchmark, not employer disclosure. Reopen the official posting on the application date.

## 7. 显示护栏 / Display guardrails

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

## 8. 类型与维护说明 / Type and maintenance note

当前 `app/types.ts` 中的 `RoleCompensationBenchmark` 只允许每个市场一个 `CompensationRange`，无法无损表达：

- P25、P50、P75 三个统计量；
- 同一中国岗位族下多个独立行业或地区代理；
- 单点均值与地区均值包络；
- 宽口径背景范围与岗位主基准的分离。

因此本数据资产采用更严格的 2.0 结构。在应用直接导入前，应扩展 TypeScript 类型以表达 `statistic`、`values`、`matchQuality`、`employmentLevel`、`sourceId` 和中国代理数组；不能把 `mean` 复制到 `minimum`/`maximum`，也不能为了满足旧类型而合并不同切片。

维护时每年至少在 BLS OEWS 新版发布后更新一次；中国季度均值按季度复核，企业薪酬分位数按年度复核。具体岗位薪资应在每次投递前重查。任何变更都必须更新 `referencePeriod`、`publishedAt`、`observedAt` 和完整性测试中的冻结值。

The current `RoleCompensationBenchmark` type in `app/types.ts` permits only one `CompensationRange` per market. It cannot losslessly represent:

- three percentile statistics;
- multiple independent industry or regional proxies under one China role family;
- a point mean versus an envelope of regional means; or
- separate broad context and primary role benchmarks.

The data asset therefore uses a stricter 2.0 structure. Before importing it directly into the application, expand the TypeScript types to model `statistic`, `values`, `matchQuality`, `employmentLevel`, `sourceId`, and an array of China proxies. Do not copy a mean into `minimum` and `maximum`, and do not merge different slices merely to satisfy the old type.

Refresh the U.S. data at least annually after each OEWS release, review China recruitment means quarterly, and review enterprise percentiles annually. Recheck posting-level compensation before every application. Every update must revise `referencePeriod`, `publishedAt`, `observedAt`, and the frozen values in the integrity test.

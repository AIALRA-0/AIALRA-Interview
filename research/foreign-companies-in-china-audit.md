# 中国机会市场外企覆盖审计 / Foreign Companies in China Coverage Audit

证据日期 / Evidence date: 2026-07-27

## 结论 / Result

本轮在原有 439 个中国机会市场节点上新增 88 个外资控制节点，使中国组织宇宙增至 527 个、全局组织宇宙增至 887 个。新增节点不是把美国公司卡片复制到中国面板：每个节点都有独立中国市场 ID、在华地点、双语简介、岗位族、能力缺口、官方在华机构或招聘入口，以及单独的所有制证据记录。

This pass adds 88 foreign-controlled China-market nodes to the previous 439-node China universe, bringing the China universe to 527 and the global universe to 887. These are not copied U.S. cards: every node has a distinct China-market ID, mainland locations, a unique bilingual overview, role families, preparation gaps, an official China-presence or careers channel, and its own ownership evidence record.

## 覆盖分支 / Covered branches

- EDA、IP 与工程软件：Synopsys、Cadence、Siemens EDA、Ansys、MathWorks、Altair、Dassault Systèmes 等。
- CPU、GPU、SoC、模拟、存储与晶圆制造：Intel、AMD、NVIDIA、Qualcomm、NXP、ST、Infineon、TI、ADI、Micron、Samsung、SK hynix、TSMC Nanjing 等。
- 半导体设备、量测与现场服务：ASML、Applied Materials、Lam Research、KLA、Tokyo Electron、SCREEN、ASM、Onto、Axcelis、Veeco 等。
- ATE 与电子测试：Advantest、Teradyne、Cohu、Keysight、Rohde & Schwarz、Tektronix、NI、FormFactor、Chroma 等。
- 电子材料、气体、真空与零部件：Air Liquide、Linde、Merck Electronics、DuPont、Entegris、Air Products、JSR、TOK、Shin-Etsu、SUMCO、Siltronic、GlobalWafers 等。
- 汽车、工业系统与企业研究：Bosch、Continental、Aptiv、ZF、Tesla、ABB、Schneider Electric、Honeywell、Apple、Microsoft Research Asia、Ericsson、Nokia 等。

## 证据规则 / Evidence rules

1. 只用公司官方域名中的在华机构、地点或招聘入口作为本批次主证据。
2. 组织存在不等于具体岗位开放；具体职位必须另存 requisition、地点、团队、毕业时间和资格要求。
3. “外资控制”描述组织控制来源，不代表中国雇佣法人一定是母公司直接全资子公司；申请时仍需核验劳动合同主体。
4. 同一全球集团在美国和中国保留不同组织 ID，因为岗位、薪资、资格、出口管制、语言和雇佣实体都可能不同。
5. 名册是有来源的目标市场覆盖快照，不是工商登记意义上全行业所有外商投资企业的数学全集；新进入、退出、出售或更名必须滚动更新 residual report。

## 数据入口 / Data entry points

- 生成与复核清单：`scripts/expand-foreign-cn-companies.mjs`
- 组织记录：`data/expansion-cn-candidates.json`
- 所有制记录：`data/china-company-ownership.json`
- 发布资产：`public/organization-universe.json`


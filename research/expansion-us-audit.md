# 美国优先组织扩容审计

观察日期：2026-07-23  
候选数据：`data/expansion-us-candidates.json`  
新增标签：`data/expansion-us-category-labels.json`

## 结论

本轮形成 104 个可直接并入组织树的高质量候选节点，全部面向美国机会市场，其中 95 个组织总部位于美国，9 个是已经在美国设立招聘、研发、制造或客户工程入口的全球组织。候选集与 `data/companies.us.json` 在 `id`、规范名称及规范名称大小写归一化后均无冲突。

每个节点均包含：

- 双语组织简介 `descriptionZh` 与 `descriptionEn`
- 双语匹配说明 `relevanceZh` 与 `relevanceEn`
- 方向、岗位族、技能要求、差距、机会形态、难度、签证信号
- 至少一个官方招聘页、官方网站或官方研究中心页
- 证据观察日期 `2026-07-23`

这是一批“组织档案候选”，不是对所有组织都存在当前空缺的声明。只有证据类型为 `official-current-job` 的记录可以被界面表述为观察日存在具体职位；其他记录只证明组织、方向及申请入口存在。

## 覆盖构成

| 扩容方向                     | 新增节点 |
| ---------------------------- | -------: |
| DOE 缺失国家实验室           |        9 |
| FFRDC 与应用研究机构         |       17 |
| 航空航天、国防、商业航天     |       25 |
| 量子计算与量子使能硬件       |       14 |
| 机器人、物理 AI、自动驾驶    |       12 |
| 半导体长尾与特色器件         |       12 |
| 大学芯片、纳米制造、量子中心 |       15 |
| 合计                         |      104 |

组织类型分布：

| 类型             | 数量 |
| ---------------- | ---: |
| 私营公司         |   39 |
| 上市公司         |   17 |
| 大学研究机构     |   17 |
| 国家实验室       |    9 |
| FFRDC            |    8 |
| 非营利研究机构   |    6 |
| 私营公司子公司   |    4 |
| 上市公司业务单元 |    3 |
| 上市公司子公司   |    1 |

优先级分布为 P0 7 个、P1 36 个、P2 39 个、P3 22 个。难度分布为 A 65 个、B 13 个、S 26 个。签证信号分布为 friendly 15 个、mixed 21 个、restricted 37 个、unverified 31 个；该字段是申请规划信号，不是移民或录用承诺，最终必须逐岗位核验。

## DOE 17 家国家实验室闭环

[美国能源部官方目录](https://www.energy.gov/national-laboratories)确认 DOE 体系有 17 家国家实验室。

现有美国数据已经包含 8 家：

- Lawrence Berkeley National Laboratory
- Argonne National Laboratory
- Sandia National Laboratories
- Lawrence Livermore National Laboratory
- Los Alamos National Laboratory
- Oak Ridge National Laboratory
- Pacific Northwest National Laboratory
- National Renewable Energy Laboratory

本轮补齐其余 9 家：

- Ames National Laboratory
- Brookhaven National Laboratory
- Fermi National Accelerator Laboratory
- Idaho National Laboratory
- National Energy Technology Laboratory
- Princeton Plasma Physics Laboratory
- Savannah River National Laboratory
- SLAC National Accelerator Laboratory
- Thomas Jefferson National Accelerator Facility

因此，合并后实现 17 家实验室的语义覆盖。主数据整合阶段已将 `National Renewable Energy Laboratory` 更新为 2025-12-01 生效的规范名称 `National Laboratory of the Rockies`，并保留 NREL 与旧全称为历史别名。官方更名证据见 [DOE 公告](https://www.energy.gov/cmei/articles/energy-department-renames-nrel-national-lab-rockies)。

## FFRDC 审计

以 [NCSES FY 2026 FFRDC Master List](https://www.ncses.nsf.gov/resource/master-gov-lists-ffrdc) 为基准，本轮新增 8 个直接标为 FFRDC 的相关组织节点：

- The Aerospace Corporation
- MITRE
- Carnegie Mellon Software Engineering Institute
- Institute for Defense Analyses
- National Radio Astronomy Observatory
- NSF National Center for Atmospheric Research
- NSF NOIRLab
- National Solar Observatory

DOE 国家实验室多数也属于 FFRDC 生态，但为保持组织树语义清晰，仍使用 `national-laboratory` 类型。此次没有机械录入 FY 2026 清单里的每一个政策或社会科学 FFRDC，而是筛选与芯片、电子、嵌入式、计算、仪器、量子、航天或国家安全工程有明确岗位迁移关系的节点。

## 一手来源与发现路径

候选集内共有 152 条证据，全部来自组织自身、政府目录、大学研究中心或正式产业联盟；没有以聚合招聘站、博客名单或百科页面作为节点成立依据。主要横向目录包括：

- [DOE National Laboratories](https://www.energy.gov/national-laboratories)
- [NCSES FY 2026 FFRDC Master List](https://www.ncses.nsf.gov/resource/master-gov-lists-ffrdc)
- [NSF National Nanotechnology Coordinated Infrastructure](https://www.nsf.gov/eng/nnci)
- [Quantum Economic Development Consortium Member Directory](https://quantumconsortium.org/members/)
- [Chicago Quantum Exchange Partners](https://chicagoquantum.org/about/partners)
- [Global Semiconductor Alliance Member Directory](https://www.gsaglobal.org/membership/member-directory/)
- [Silicon Valley Robotics Ecosystem](https://www.svrobo.org/about/)

其中 85 条为官方招聘入口，15 条为官方研究中心页，26 条为政府目录，13 条为产业目录，其余是组织官网、当前职位、扩张公告、上市状态或并购状态的一手证据。

## 并购、上市与独立招聘身份

- `Quantum Circuits` 已被 D-Wave 收购，且其官网明确表述现已成为 D-Wave 的一部分，因此不再作为独立组织节点；名称被保留为 `D-Wave Quantum` 的别名。状态证据见 [Quantum Circuits 官方页面](https://quantumcircuits.com/join-our-team/)。
- `Capella Space` 已于 2025 年被 IonQ 收购，但在观察日仍保留独立、活跃的招聘页面，因此保留为 `public-company-subsidiary`，并增加 `IonQ Capella` 别名。并购证据见 [IonQ 官方公告](https://investors.ionq.com/news/news-details/2025/IonQ-Completes-Acquisition-of-Capella-Space-Advancing-Vision-for-Space-Based-Quantum-Communications/)。
- `Firefly Aerospace` 已于 2025-08-08 完成 IPO，本轮按上市公司处理。证据见 [Firefly Investor FAQ](https://investors.fireflyspace.com/events-resources/faqs)。
- `Infleqtion` 已于 2026-02-17 在 NYSE 上市，本轮按上市公司处理。证据见 [Infleqtion 官方公告](https://infleqtion.com/infleqtion-becomes-first-neutral-atom-quantum-company-to-go-public/)。
- `Atlantic Quantum` 在本次观察窗口内无法验证有效官方招聘入口，因此未纳入高置信候选；改纳入具有波士顿办公室、美国制造计划及有效招聘入口的 `Qblox`。美国制造证据见 [Qblox 官方公告](https://qblox.com/newsroom/qblox-introduces-first-made-in-america-quantum-control-systems)。

执行规则是：已被收购且不再具有独立招聘身份的品牌不建独立节点；仍保留独立招聘入口、团队及岗位体系的子公司可以保留，但必须明确父级状态。

## 中英双语与名称规则

- 104 个节点全部具有双语简介与双语匹配说明。
- 48 个节点具有经过复核且包含中文字符的 `nameZh`。
- 56 个仅有官方英文名或没有稳定公认中文名的节点不写 `nameZh`，界面只显示英文。
- `Everspin Technologies` 按 English-only 处理，没有伪造或重复英文 `nameZh`。
- `The Aerospace Corporation` 的泛化直译已删除，按 English-only 处理。
- `Efficient Power Conversion` 采用其官方中文站名称“宜普电源转换公司”。
- 所有 `nameEn` 均不含中文字符。
- 规范名称与现有美国节点没有冲突，候选集内部也没有重名。

## 分类标签审计

候选集使用 144 个唯一 category slug，其中 33 个已被现有标签目录覆盖，111 个是新增分类。`data/expansion-us-category-labels.json` 为全部 111 个新增 slug 提供：

```json
{
  "slug": {
    "zh": "中文原子标签",
    "en": "English Atomic Label"
  }
}
```

标签通过以下约束：

- 不使用 `A and B`
- 不使用 `A & B`
- 不使用斜杠拼接
- 不使用 `A 与 B`
- 不使用顿号拼接

方向、岗位族、要求、差距及机会形态数组同样通过组合词扫描，没有将两个独立概念硬塞入一个可筛选标签。

## 链接与结构质量

对 104 个 `careerUrl` 进行了自动请求检查：

- 75 个直接返回 HTTP 200
- 12 个返回正常重定向
- 13 个返回 403，均为已知官方站点的自动化访问保护，并非确认失效
- 4 个大学或研究机构站点在并发自动请求中超时；其官方页面及 2026 年内容均已通过独立页面访问或官方检索结果复核
- 0 个保留的 URL 被确认返回 404

结构检查结果：

- JSON 可解析
- 104 个 `id` 全部唯一
- 与现有 `companies.us.json` 无 ID 冲突
- 每条记录均有 `lastVerified: 2026-07-23`
- 每条证据均有 `observedAt: 2026-07-23`
- 93 个节点为 high confidence，11 个为 medium confidence，没有 low confidence
- 144 个分类均被现有目录或新增标签文件覆盖

## 使用边界

1. `difficulty` 是相对申请难度，不是录用概率。
2. `visaSignal` 必须在投递前按具体 JD、团队、所在地、出口管制与 CPT/OPT 状态复核。
3. 大学研究中心节点代表研究助理、课题组、共享设施、实验室雇佣或研究训练入口，不等同于独立法人公司。
4. FFRDC、国防承包商及部分量子、航天岗位可能要求美国公民身份、安全许可或 U.S. person 资格。
5. 组织官网存在不代表观察日一定有实习岗位；界面必须继续区分“组织档案”与“当前具体 JD”。
6. “全量”应被实现为可追溯、可持续更新的覆盖流程，而不是一次性宣称世界上不存在遗漏；建议后续按季度重新抓取官方目录、招聘入口、并购状态与公司类型。

## 合并建议

1. 将 `expansion-us-candidates.json` 作为独立候选批次导入，先做 schema 校验与全库去重。
2. 合并 `expansion-us-category-labels.json`，保证 111 个新 slug 在组织树、筛选器、详情页均显示中英双语原子标签。
3. NLR 更名已完成；后续只需监测旧 `nrel.gov` 深链是否仍有残留。
4. 详情页继续显示“组织档案，不是当前 JD”提示。
5. 对 `restricted` 与 `mixed` 节点在投递列表中强制展示资格复核提醒。

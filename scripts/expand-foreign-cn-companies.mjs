import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const observedAt = "2026-07-27";
const prefix = "cn-foreign-";

const groupProfiles = {
  eda: {
    categories: ["工业软件", "芯片设计", "集成电路"],
    roleFamilies: ["EDA研发", "CAD工程", "应用工程", "软件工程"],
    requirements: ["C++或Python工程能力", "数字设计流程基础", "按具体岗位核验中英文要求"],
    gaps: ["EDA算法与数据结构", "可复现工具链项目", "技术英文表达"],
    opportunityTypes: ["校园招聘", "实习", "社会招聘"],
  },
  chip: {
    categories: ["芯片", "芯片设计", "集成电路"],
    roleFamilies: ["数字IC设计", "设计验证", "芯片架构", "嵌入式软件", "应用工程"],
    requirements: ["计算机体系结构或数字设计基础", "SystemVerilog或C++", "按具体岗位核验专业与毕业时间"],
    gaps: ["UVM/SVA与覆盖率闭环", "架构或RTL项目证据", "英文技术面试"],
    opportunityTypes: ["校园招聘", "实习", "社会招聘"],
  },
  manufacturing: {
    categories: ["芯片", "集成电路", "半导体工程"],
    roleFamilies: ["工艺工程", "制造自动化", "设备工程", "测试工程", "数据分析"],
    requirements: ["半导体工艺或设备基础", "数据分析与自动化能力", "按厂区和岗位核验倒班要求"],
    gaps: ["制造数据与SPC", "设备接口与自动化", "工艺整合认知"],
    opportunityTypes: ["校园招聘", "实习", "社会招聘"],
  },
  equipment: {
    categories: ["半导体设备", "精密测量", "半导体工程"],
    roleFamilies: ["设备工程", "应用工程", "制造自动化", "软件工程", "数据分析"],
    requirements: ["机电、电子、物理或软件基础", "故障定位与客户沟通", "按具体岗位核验出差或驻厂要求"],
    gaps: ["设备日志诊断", "半导体工艺窗口", "现场应用工程表达"],
    opportunityTypes: ["校园招聘", "实习", "社会招聘"],
  },
  test: {
    categories: ["电子测量", "测试设备", "集成电路"],
    roleFamilies: ["测试工程", "应用工程", "嵌入式软件", "射频工程", "软件工程"],
    requirements: ["电子测量或自动测试基础", "Python/C++或仪器控制", "按具体岗位核验实验室经验"],
    gaps: ["ATE或仪器自动化", "信号完整性与射频基础", "可复现测试报告"],
    opportunityTypes: ["校园招聘", "实习", "社会招聘"],
  },
  materials: {
    categories: ["先进材料", "半导体工程", "精密测量"],
    roleFamilies: ["工艺工程", "材料工程", "应用工程", "制造自动化"],
    requirements: ["材料、化学、物理或工艺基础", "实验与统计分析能力", "按具体岗位核验现场安全要求"],
    gaps: ["半导体材料链认知", "DOE与统计工艺控制", "客户应用案例"],
    opportunityTypes: ["校园招聘", "实习", "社会招聘"],
  },
  automotive: {
    categories: ["汽车", "汽车电子", "嵌入式系统"],
    roleFamilies: ["嵌入式软件", "控制算法", "数字IC设计", "设计验证", "系统工程"],
    requirements: ["嵌入式C/C++或控制基础", "软硬件协同调试", "按岗位核验功能安全经验"],
    gaps: ["ISO 26262与功能安全", "实时系统调试", "系统级验证证据"],
    opportunityTypes: ["校园招聘", "实习", "社会招聘"],
  },
  systems: {
    categories: ["人工智能", "云计算", "电子系统"],
    roleFamilies: ["芯片架构", "软件工程", "嵌入式软件", "系统工程", "人工智能工程"],
    requirements: ["系统软件或硬件基础", "C++/Python工程能力", "按具体岗位核验团队职责"],
    gaps: ["硬件软件协同项目", "大规模系统性能分析", "英文项目深挖"],
    opportunityTypes: ["校园招聘", "实习", "社会招聘"],
  },
};

// id, English name, Chinese name, headquarters country, China locations,
// group, focus (zh), focus (en), official careers/presence URL.
const seeds = [
  ["intel", "Intel", "英特尔中国", "United States", ["北京", "上海", "深圳", "成都", "大连"], "chip", "CPU、数据中心、平台软件与芯片工程", "CPUs, data-center platforms, software, and silicon engineering", "https://jobs.intel.com/en/location/china-jobs/599/1814991/2"],
  ["amd", "AMD", "超威半导体中国", "United States", ["北京", "上海"], "chip", "CPU、GPU、FPGA与自适应计算", "CPUs, GPUs, FPGAs, and adaptive computing", "https://careers.amd.com/careers-home/"],
  ["nvidia", "NVIDIA", "英伟达中国", "United States", ["北京", "上海", "深圳", "广州"], "chip", "GPU、AI计算、系统软件与汽车平台", "GPUs, AI computing, systems software, and automotive platforms", "https://www.nvidia.com/en-gb/contact/?section=locations"],
  ["qualcomm", "Qualcomm", "高通中国", "United States", ["北京", "上海", "深圳"], "chip", "移动SoC、无线通信、汽车与边缘AI", "mobile SoCs, wireless, automotive, and edge AI", "https://www.qualcomm.com/company/careers"],
  ["synopsys", "Synopsys", "新思科技中国", "United States", ["北京", "上海", "深圳", "南京", "武汉", "西安", "厦门"], "eda", "EDA软件、半导体IP与芯片设计服务", "EDA software, semiconductor IP, and silicon design services", "https://careers.synopsys.com/china"],
  ["cadence", "Cadence", "楷登电子中国", "United States", ["北京", "上海", "深圳", "南京"], "eda", "EDA、计算软件、IP与系统分析", "EDA, computational software, IP, and system analysis", "https://www.cadence.com/zh_CN/home/company/careers.html"],
  ["siemens-eda", "Siemens EDA", "西门子EDA中国", "Germany", ["北京", "上海", "深圳", "南京"], "eda", "IC设计、验证、PCB与数字孪生软件", "IC design, verification, PCB, and digital-twin software", "https://jobs.siemens.com/careers"],
  ["ansys", "Ansys", "安世亚太中国", "United States", ["北京", "上海", "深圳", "成都"], "eda", "多物理场仿真、芯片封装与系统可靠性", "multiphysics simulation, chip-package analysis, and system reliability", "https://careers.ansys.com/"],
  ["mathworks", "MathWorks", "迈斯沃克中国", "United States", ["北京", "上海"], "eda", "MATLAB、Simulink、算法与硬件工作流", "MATLAB, Simulink, algorithms, and hardware workflows", "https://www.mathworks.com/company/jobs/opportunities/locations/china.html"],
  ["altair", "Altair", "澳汰尔工程软件中国", "United States", ["北京", "上海", "深圳"], "eda", "仿真、高性能计算、数据分析与电子系统设计", "simulation, HPC, data analytics, and electronic-system design", "https://altair.com/careers"],
  ["dassault-systemes", "Dassault Systèmes", "达索系统中国", "France", ["北京", "上海", "深圳"], "eda", "3DEXPERIENCE、仿真与制造数字化", "3DEXPERIENCE, simulation, and manufacturing digitalization", "https://careers.3ds.com/"],
  ["imagination", "Imagination Technologies", "Imagination中国", "United Kingdom", ["北京", "上海"], "chip", "GPU、AI加速与半导体IP", "GPU, AI acceleration, and semiconductor IP", "https://careers.imaginationtech.com/"],
  ["nxp", "NXP Semiconductors", "恩智浦半导体中国", "Netherlands", ["北京", "上海", "深圳", "苏州", "天津"], "chip", "汽车、工业、边缘处理与安全连接芯片", "automotive, industrial, edge-processing, and secure-connectivity chips", "https://www.nxp.com/company/about-nxp/careers:CAREERS"],
  ["stmicroelectronics", "STMicroelectronics", "意法半导体中国", "Switzerland", ["北京", "上海", "深圳"], "chip", "MCU、模拟、功率、MEMS与汽车半导体", "MCUs, analog, power, MEMS, and automotive semiconductors", "https://www.st.com/content/st_com/en/about/careers.html"],
  ["infineon", "Infineon Technologies", "英飞凌科技中国", "Germany", ["上海", "北京", "深圳", "无锡"], "chip", "功率、汽车、安全与物联网半导体", "power, automotive, security, and IoT semiconductors", "https://www.infineon.com/cms/en/careers/"],
  ["texas-instruments", "Texas Instruments", "德州仪器中国", "United States", ["上海", "北京", "深圳", "成都"], "chip", "模拟与嵌入式处理芯片", "analog and embedded-processing semiconductors", "https://careers.ti.com/"],
  ["analog-devices", "Analog Devices", "亚德诺半导体中国", "United States", ["北京", "上海", "深圳"], "chip", "模拟、混合信号、数据转换与电源管理", "analog, mixed-signal, data conversion, and power management", "https://www.analog.com/en/about-adi/careers.html"],
  ["microchip", "Microchip Technology", "微芯科技中国", "United States", ["上海", "北京", "深圳"], "chip", "MCU、FPGA、模拟与嵌入式控制", "MCUs, FPGAs, analog, and embedded control", "https://careers.microchip.com/"],
  ["onsemi", "onsemi", "安森美中国", "United States", ["上海", "深圳", "苏州"], "chip", "智能电源与感知半导体", "intelligent power and sensing semiconductors", "https://www.onsemi.com/company/careers"],
  ["renesas", "Renesas Electronics", "瑞萨电子中国", "Japan", ["北京", "上海", "深圳", "苏州"], "chip", "MCU、SoC、模拟与汽车半导体", "MCUs, SoCs, analog, and automotive semiconductors", "https://jobs.renesas.com/"],
  ["rohm", "ROHM Semiconductor", "罗姆半导体中国", "Japan", ["上海", "深圳", "大连", "天津"], "chip", "功率器件、模拟IC与电子元件", "power devices, analog ICs, and electronic components", "https://www.rohm.com/"],
  ["toshiba-electronic", "Toshiba Electronic Devices & Storage", "东芝电子元件及存储中国", "Japan", ["上海", "深圳", "大连"], "chip", "功率器件、MCU、存储与电子元件", "power devices, MCUs, storage, and electronic components", "https://toshiba.semicon-storage.com/ap-en/top.html"],
  ["samsung-semiconductor", "Samsung Semiconductor", "三星半导体中国", "South Korea", ["西安", "上海", "北京", "苏州"], "manufacturing", "存储芯片、晶圆制造、显示与系统半导体", "memory, wafer manufacturing, displays, and system semiconductors", "https://www.samsungcareers.com.cn/"],
  ["sk-hynix", "SK hynix", "SK海力士中国", "South Korea", ["无锡", "重庆", "大连", "上海"], "manufacturing", "DRAM、NAND、封装测试与晶圆制造", "DRAM, NAND, packaging, test, and wafer manufacturing", "https://www.skhynix.com/"],
  ["micron", "Micron Technology", "美光科技中国", "United States", ["西安", "上海", "深圳"], "manufacturing", "DRAM、NAND、封装测试与存储系统", "DRAM, NAND, packaging, test, and memory systems", "https://careers.micron.com/"],
  ["mediatek", "MediaTek", "联发科技中国", "Taiwan", ["上海", "北京", "深圳", "合肥", "武汉", "成都"], "chip", "移动SoC、连接、电视与边缘AI芯片", "mobile SoCs, connectivity, TV, and edge-AI chips", "https://www.mediatek.com/"],
  ["realtek", "Realtek Semiconductor", "瑞昱半导体中国", "Taiwan", ["苏州", "深圳"], "chip", "网络、音频、显示与连接芯片", "networking, audio, display, and connectivity chips", "https://www.realtek.com/Employment"],
  ["marvell", "Marvell Technology", "迈威尔科技中国", "United States", ["上海", "北京", "成都"], "chip", "数据基础设施、网络、存储与定制芯片", "data infrastructure, networking, storage, and custom silicon", "https://www.marvell.com/company/careers.html"],
  ["broadcom", "Broadcom", "博通中国", "United States", ["北京", "上海", "深圳"], "chip", "网络、连接、存储与基础设施软件", "networking, connectivity, storage, and infrastructure software", "https://www.broadcom.com/company/careers"],
  ["tsmc-nanjing", "TSMC Nanjing", "台积电南京", "Taiwan", ["南京", "上海"], "manufacturing", "晶圆制造、工艺整合与制造自动化", "wafer manufacturing, process integration, and factory automation", "https://careers.tsmc.com/"],
  ["he-jian", "HeJian Technology", "和舰芯片制造", "Taiwan", ["苏州"], "manufacturing", "晶圆代工、工艺与制造运营", "wafer foundry, process engineering, and manufacturing operations", "https://www.hjtc.com.cn/"],
  ["asml", "ASML", "阿斯麦中国", "Netherlands", ["北京", "上海", "深圳", "无锡", "武汉", "西安", "成都"], "equipment", "光刻、计算光刻、电子束量测与客户支持", "lithography, computational lithography, e-beam metrology, and customer support", "https://www.asml.com/en/careers/working-at-asml/china"],
  ["applied-materials", "Applied Materials", "应用材料中国", "United States", ["北京", "上海", "西安", "无锡"], "equipment", "沉积、刻蚀、材料工程与显示制造设备", "deposition, etch, materials engineering, and display-manufacturing equipment", "https://careers.appliedmaterials.com/"],
  ["lam-research", "Lam Research", "泛林集团中国", "United States", ["上海", "北京", "武汉", "西安"], "equipment", "刻蚀、沉积、清洗与晶圆设备服务", "etch, deposition, clean, and wafer-equipment services", "https://www.lamresearch.com/careers/"],
  ["kla", "KLA", "科磊中国", "United States", ["上海", "深圳", "北京", "武汉"], "equipment", "过程控制、缺陷检测、量测与良率分析", "process control, defect inspection, metrology, and yield analytics", "https://www.kla.com/careers"],
  ["tokyo-electron", "Tokyo Electron", "东京电子中国", "Japan", ["上海", "北京", "无锡", "武汉", "西安"], "equipment", "涂胶显影、刻蚀、沉积、清洗与测试设备", "coat/develop, etch, deposition, clean, and test equipment", "https://www.tel.com/careers/"],
  ["screen", "SCREEN Semiconductor Solutions", "斯库林半导体中国", "Japan", ["上海", "北京", "无锡", "武汉"], "equipment", "晶圆清洗、涂胶显影与量测设备", "wafer cleaning, coat/develop, and metrology equipment", "https://www.screen.co.jp/spe/en/"],
  ["asm-international", "ASM International", "ASM中国", "Netherlands", ["上海", "北京", "无锡"], "equipment", "原子层沉积、外延与晶圆处理设备", "atomic-layer deposition, epitaxy, and wafer-processing equipment", "https://www.asm.com/careers/"],
  ["advantest", "Advantest", "爱德万测试中国", "Japan", ["上海", "北京", "苏州"], "test", "半导体ATE、测试接口与数据分析", "semiconductor ATE, test interfaces, and data analytics", "https://www.advantest.com/careers/"],
  ["teradyne", "Teradyne", "泰瑞达中国", "United States", ["上海", "北京", "苏州"], "test", "半导体自动测试、系统测试与工业自动化", "semiconductor automated test, system test, and industrial automation", "https://www.teradyne.com/careers/"],
  ["cohu", "Cohu", "科休中国", "United States", ["上海", "苏州"], "test", "测试分选、接口、检测与设备软件", "test handling, interfaces, inspection, and equipment software", "https://www.cohu.com/company/careers/"],
  ["onto-innovation", "Onto Innovation", "昂图创新中国", "United States", ["上海", "深圳", "合肥"], "equipment", "光学量测、检测、封装与良率软件", "optical metrology, inspection, packaging, and yield software", "https://ontoinnovation.com/careers/"],
  ["axcelis", "Axcelis Technologies", "Axcelis中国", "United States", ["上海", "北京"], "equipment", "离子注入设备与工艺支持", "ion-implantation equipment and process support", "https://www.axcelis.com/careers/"],
  ["veeco", "Veeco", "维易科中国", "United States", ["上海", "北京"], "equipment", "薄膜、激光退火、离子束与化合物半导体设备", "thin film, laser anneal, ion beam, and compound-semiconductor equipment", "https://www.veeco.com/company/careers/"],
  ["mks", "MKS Instruments", "万机仪器中国", "United States", ["上海", "深圳", "苏州"], "equipment", "真空、光子学、过程控制与精密运动", "vacuum, photonics, process control, and precision motion", "https://www.mks.com/careers"],
  ["edwards", "Edwards Vacuum", "爱德华真空中国", "United Kingdom", ["上海", "北京", "青岛"], "equipment", "半导体真空系统、减排与现场服务", "semiconductor vacuum systems, abatement, and field service", "https://www.edwardsvacuum.com/"],
  ["pfeiffer-vacuum", "Pfeiffer Vacuum", "普发真空中国", "Germany", ["上海", "北京", "无锡"], "equipment", "真空泵、检漏、分析与系统工程", "vacuum pumps, leak detection, analysis, and systems engineering", "https://www.pfeiffer-vacuum.com/global/en/career/"],
  ["vat-group", "VAT Group", "VAT阀门中国", "Switzerland", ["上海", "无锡"], "equipment", "高真空阀门、控制与半导体设备部件", "high-vacuum valves, controls, and semiconductor-equipment components", "https://www.vatgroup.com/careers"],
  ["brooks-automation", "Brooks Automation", "布鲁克斯自动化中国", "United States", ["上海", "深圳"], "equipment", "晶圆自动化、真空机器人与样本管理", "wafer automation, vacuum robotics, and sample management", "https://www.brooks.com/careers/"],
  ["horiba", "HORIBA", "堀场中国", "Japan", ["上海", "北京", "广州"], "test", "过程分析、气体测量、材料表征与汽车测试", "process analysis, gas measurement, materials characterization, and automotive test", "https://www.horiba.com/"],
  ["hitachi-high-tech", "Hitachi High-Tech", "日立高新技术中国", "Japan", ["上海", "北京", "深圳"], "equipment", "电子显微、量测、检测与半导体制造系统", "electron microscopy, metrology, inspection, and semiconductor systems", "https://www.hitachi-hightech.com/global/en/"],
  ["jeol", "JEOL", "日本电子中国", "Japan", ["北京", "上海", "广州"], "equipment", "电子显微镜、分析仪器与纳米加工设备", "electron microscopes, analytical instruments, and nanofabrication tools", "https://www.jeol.com/"],
  ["nikon-precision", "Nikon Precision", "尼康精机中国", "Japan", ["上海", "北京"], "equipment", "半导体光刻、量测与精密光学", "semiconductor lithography, metrology, and precision optics", "https://www.nikon.com/"],
  ["canon", "Canon", "佳能中国", "Japan", ["北京", "上海", "苏州"], "equipment", "半导体光刻、显示制造、成像与精密设备", "semiconductor lithography, display manufacturing, imaging, and precision equipment", "https://global.canon/en/employ/"],
  ["keysight", "Keysight Technologies", "是德科技中国", "United States", ["北京", "上海", "深圳", "成都"], "test", "电子设计测试、射频、协议与半导体量测", "electronic design and test, RF, protocol, and semiconductor measurement", "https://jobs.keysight.com/"],
  ["rohde-schwarz", "Rohde & Schwarz", "罗德与施瓦茨中国", "Germany", ["北京", "上海", "深圳", "成都"], "test", "射频微波、无线通信、示波与系统测试", "RF/microwave, wireless communications, oscilloscopes, and system test", "https://www.rohde-schwarz.com/career/"],
  ["tektronix", "Tektronix", "泰克中国", "United States", ["北京", "上海", "深圳"], "test", "示波器、信号分析、半导体与电源测试", "oscilloscopes, signal analysis, semiconductor, and power test", "https://careers.fortive.com/tektronix"],
  ["national-instruments", "NI", "恩艾仪器中国", "United States", ["上海", "北京"], "test", "自动测试、LabVIEW、数据采集与硬件在环", "automated test, LabVIEW, data acquisition, and hardware-in-the-loop", "https://www.ni.com/en/about-ni/careers.html"],
  ["formfactor", "FormFactor", "FormFactor中国", "United States", ["上海", "苏州"], "test", "探针卡、晶圆测试与低温量测系统", "probe cards, wafer test, and cryogenic measurement systems", "https://www.formfactor.com/company/careers/"],
  ["chroma", "Chroma ATE", "致茂电子中国", "Taiwan", ["上海", "苏州", "深圳"], "test", "电源、半导体、光电与自动测试系统", "power, semiconductor, optoelectronic, and automated test systems", "https://www.chromaate.com/en/"],
  ["enabling-technologies", "Teradyne Robotics", "泰瑞达机器人中国", "United States", ["上海", "深圳"], "automotive", "协作机器人、移动机器人与工业自动化", "collaborative robots, mobile robots, and industrial automation", "https://www.teradyne.com/robotics/"],
  ["air-liquide", "Air Liquide", "液化空气中国", "France", ["上海", "北京", "无锡", "合肥"], "materials", "电子特气、先进材料与厂务气体系统", "electronic specialty gases, advanced materials, and fab gas systems", "https://www.airliquide.com/careers"],
  ["linde", "Linde", "林德中国", "United Kingdom", ["上海", "苏州", "厦门", "大连"], "materials", "电子气体、现场供气与工程系统", "electronic gases, onsite supply, and engineering systems", "https://www.linde.com/"],
  ["merck-electronics", "Merck Electronics", "默克电子科技中国", "Germany", ["上海", "苏州"], "materials", "半导体材料、显示材料与先进配方", "semiconductor materials, display materials, and advanced formulations", "https://www.merckgroup.com/en/careers.html"],
  ["dupont-electronics", "DuPont Electronics & Industrial", "杜邦电子与工业中国", "United States", ["上海", "深圳", "东莞"], "materials", "光刻、互连、封装与电子材料", "lithography, interconnect, packaging, and electronic materials", "https://careers.dupont.com/"],
  ["air-products", "Air Products", "空气产品公司中国", "United States", ["上海", "西安", "南京", "合肥"], "materials", "电子气体、现场制气与超高纯供应系统", "electronic gases, onsite generation, and ultra-high-purity supply systems", "https://www.airproducts.com/careers"],
  ["basf", "BASF", "巴斯夫中国", "Germany", ["上海", "南京", "湛江"], "materials", "电子化学品、功能材料与制造数字化", "electronic chemicals, functional materials, and manufacturing digitalization", "https://www.basf.com/global/en/careers"],
  ["fujifilm-electronic-materials", "FUJIFILM Electronic Materials", "富士胶片电子材料中国", "Japan", ["苏州", "上海"], "materials", "光刻胶、CMP、清洗与电子材料", "photoresists, CMP, cleans, and electronic materials", "https://careers.fujifilm.com/"],
  ["resonac", "Resonac", "力森诺科中国", "Japan", ["上海", "苏州", "东莞"], "materials", "封装、功率半导体与功能材料", "packaging, power-semiconductor, and functional materials", "https://www.resonac.com/"],
  ["shin-etsu", "Shin-Etsu Chemical", "信越化学中国", "Japan", ["上海", "苏州"], "materials", "硅片、光刻材料、封装与功能化学品", "silicon wafers, lithography materials, packaging, and functional chemicals", "https://www.shinetsu.co.jp/en/"],
  ["jsr", "JSR", "JSR中国", "Japan", ["上海", "无锡"], "materials", "光刻胶、CMP与先进半导体材料", "photoresists, CMP, and advanced semiconductor materials", "https://www.jsr.co.jp/jsr_e/"],
  ["tok", "Tokyo Ohka Kogyo", "东京应化中国", "Japan", ["上海", "常州"], "materials", "光刻胶、高纯化学品与微细加工材料", "photoresists, high-purity chemicals, and microfabrication materials", "https://www.tok.co.jp/eng/recruit/"],
  ["sumco", "SUMCO", "胜高中国", "Japan", ["上海"], "materials", "半导体硅片与晶体材料", "semiconductor silicon wafers and crystal materials", "https://www.sumcosi.com/english/"],
  ["siltronic", "Siltronic", "世创电子材料中国", "Germany", ["上海"], "materials", "超纯半导体硅片", "ultra-pure semiconductor silicon wafers", "https://www.siltronic.com/en/career.html"],
  ["globalwafers", "GlobalWafers", "环球晶圆中国", "Taiwan", ["上海", "昆山"], "materials", "半导体硅片与外延材料", "semiconductor wafers and epitaxial materials", "https://www.sas-globalwafers.com/en/careers/"],
  ["entegris", "Entegris", "英特格中国", "United States", ["上海", "北京", "厦门"], "materials", "污染控制、特种材料与流体管理", "contamination control, specialty materials, and fluid management", "https://www.entegris.com/en/home/about-us/careers.html"],
  ["bosch", "Bosch", "博世中国", "Germany", ["上海", "苏州", "无锡", "南京"], "automotive", "汽车电子、传感器、功率器件与工业软件", "automotive electronics, sensors, power devices, and industrial software", "https://www.bosch.com/careers/"],
  ["continental", "Continental", "大陆集团中国", "Germany", ["上海", "嘉定", "长春", "芜湖"], "automotive", "汽车计算、传感、制动与软件定义汽车", "vehicle computing, sensing, braking, and software-defined vehicles", "https://www.continental.com/en/career/"],
  ["aptiv", "Aptiv", "安波福中国", "Ireland", ["上海", "苏州", "武汉"], "automotive", "汽车电气架构、域控制器、连接与软件", "vehicle electrical architecture, domain controllers, connectivity, and software", "https://www.aptiv.com/careers"],
  ["zf", "ZF", "采埃孚中国", "Germany", ["上海", "杭州", "嘉兴"], "automotive", "电驱、底盘、控制器与自动驾驶系统", "electric drive, chassis, controllers, and automated-driving systems", "https://jobs.zf.com/"],
  ["tesla", "Tesla", "特斯拉中国", "United States", ["上海", "北京"], "automotive", "电动车、储能、制造自动化与嵌入式系统", "electric vehicles, energy storage, manufacturing automation, and embedded systems", "https://www.tesla.com/careers/search/?country=CN"],
  ["abb", "ABB", "ABB中国", "Switzerland", ["北京", "上海", "厦门", "深圳"], "automotive", "工业自动化、机器人、电气与运动控制", "industrial automation, robotics, electrification, and motion control", "https://careers.abb/global/en"],
  ["schneider-electric", "Schneider Electric", "施耐德电气中国", "France", ["北京", "上海", "深圳", "无锡"], "automotive", "能源管理、工业自动化与数字化平台", "energy management, industrial automation, and digital platforms", "https://www.se.com/ww/en/about-us/careers/"],
  ["honeywell", "Honeywell", "霍尼韦尔中国", "United States", ["上海", "北京", "西安", "苏州"], "automotive", "航空电子、工业控制、传感与自动化", "avionics, industrial controls, sensing, and automation", "https://careers.honeywell.com/"],
  ["apple", "Apple", "苹果中国", "United States", ["上海", "北京", "深圳", "苏州"], "systems", "硬件、芯片生态、制造设计与供应链工程", "hardware, silicon ecosystem, manufacturing design, and supply-chain engineering", "https://jobs.apple.com/en-us/search?location=china-CHNC"],
  ["microsoft-research-asia", "Microsoft Research Asia", "微软亚洲研究院", "United States", ["北京", "上海"], "systems", "人工智能、系统、计算机体系结构与跨学科研究", "AI, systems, computer architecture, and interdisciplinary research", "https://www.microsoft.com/en-us/research/lab/microsoft-research-asia/careers/"],
  ["ericsson", "Ericsson", "爱立信中国", "Sweden", ["北京", "上海", "南京", "广州"], "systems", "5G/6G、网络软件、基带与云原生系统", "5G/6G, network software, baseband, and cloud-native systems", "https://www.ericsson.com/en/careers"],
  ["nokia", "Nokia", "诺基亚中国", "Finland", ["北京", "上海", "杭州", "南京"], "systems", "通信网络、光网络、软件与贝尔实验室研究", "communications networks, optical networking, software, and Bell Labs research", "https://www.nokia.com/about-us/careers/"],
];

function companyFrom(seed) {
  const [id, nameEn, nameZh, country, locations, group, focusZh, focusEn, careerUrl] =
    seed;
  const profile = groupProfiles[group];
  const displayNameEn = /(China|Nanjing|Asia)$/i.test(nameEn)
    ? nameEn
    : `${nameEn} China`;
  return {
    id: `${prefix}${id}`,
    name: displayNameEn,
    nameEn: displayNameEn,
    nameZh,
    aliases: [nameZh, nameEn],
    country,
    region: locations[0],
    companyType: "company",
    categories: profile.categories,
    locations,
    focusAreas: focusZh.split("、"),
    roleFamilies: profile.roleFamilies,
    fitTier: ["eda", "chip", "equipment"].includes(group) ? "P1" : "P2",
    difficulty: "role-specific",
    visaSignal: "posting-specific",
    whyRelevant: `${displayNameEn}'s operations cover ${focusEn}, creating a direct capability intersection with the target role families listed in this record.`,
    requirements: profile.requirements,
    gaps: profile.gaps,
    opportunityTypes: profile.opportunityTypes,
    careerUrl,
    evidence: [
      {
        title: `${displayNameEn} — official China presence or careers`,
        url: careerUrl,
        type: "official-career-or-presence",
        observedAt,
      },
    ],
    lastVerified: observedAt,
    confidence: "medium",
    descriptionZh: `${nameZh}是${nameEn}在中国大陆的业务与人才节点，相关工作覆盖${focusZh}。名册确认的是组织及在华机会入口，不代表当前一定存在某个具体职位。`,
    descriptionEn: `${displayNameEn}'s mainland-China organization and talent footprint spans ${focusEn}. This record confirms the organization and its China opportunity channel; it does not claim that a specific opening is currently active.`,
    relevanceZh: `对你的芯片、EDA、验证、基础设施与自动化路线而言，${nameZh}可重点追踪${profile.roleFamilies.join("、")}岗位。申请前必须逐条核验城市、团队、毕业时间、实习身份与具体技术栈。`,
    relevanceEn: `For your chip, EDA, verification, infrastructure, and automation path, prioritize ${profile.roleFamilies.join(", ")} roles at ${displayNameEn}. Verify the city, team, graduation window, internship eligibility, and exact stack against each requisition.`,
  };
}

function ownershipRecord(company) {
  const evidence = company.evidence[0];
  return {
    organizationId: company.id,
    nameZh: company.nameZh,
    nameEn: company.nameEn,
    sourceFile: "data/expansion-cn-candidates.json",
    sourceCompanyType: "company",
    ownershipClass: "foreign-controlled",
    sourceOwnershipTag: "official-parent-domain-China-presence",
    summaryZh: `${company.nameZh}通过境外母公司官方域名中的在华机构、地点或招聘入口纳入本批次；本记录将其归入外资控制节点，并把具体法人层级留待岗位申请时按雇佣实体复核。`,
    summaryEn: `${company.nameEn} is included through an official parent-domain China presence, location, or careers channel. This audit classifies the node as foreign-controlled while leaving the exact employing legal entity for requisition-level verification.`,
    confidence: "medium",
    classificationBasis: "existing-explicit-ownership-category",
    reviewStatus: "provisionally-audited",
    evidence: [
      {
        titleZh: `${company.nameZh}官方在华机构或招聘入口`,
        titleEn: `${company.nameEn} — official China presence or careers`,
        url: evidence.url,
        sourceType: evidence.type,
        observedAt,
        evidenceScope: "direct-ownership-registry",
        noteZh: "该境外母公司官方域名确认在华组织、地点或招聘入口；具体雇佣法人仍须按职位公告复核。",
        noteEn: "The foreign parent's official domain confirms a China organization, location, or careers channel; verify the exact employing entity in the requisition.",
      },
    ],
  };
}

const generated = seeds.map(companyFrom);
const generatedIds = new Set(generated.map((company) => company.id));
if (generatedIds.size !== generated.length) {
  throw new Error("Foreign-company seed IDs must be unique");
}

const expansionPath = new URL("data/expansion-cn-candidates.json", root);
const expansion = JSON.parse(await readFile(expansionPath, "utf8"));
const nextExpansion = [
  ...expansion.filter((company) => !company.id.startsWith(prefix)),
  ...generated,
];
await writeFile(expansionPath, `${JSON.stringify(nextExpansion, null, 2)}\n`);

const ownershipPath = new URL("data/china-company-ownership.json", root);
const ownership = JSON.parse(await readFile(ownershipPath, "utf8"));
ownership.reviewedAt = observedAt;
ownership.records = [
  ...ownership.records.filter((record) => !record.organizationId.startsWith(prefix)),
  ...generated.map(ownershipRecord),
].sort((a, b) => a.organizationId.localeCompare(b.organizationId));
ownership.scope.expectedOrganizationCount = ownership.records.length;
const sourceCounts = {};
const ownershipClassCounts = Object.fromEntries(
  Object.keys(ownership.ownershipClasses).map((key) => [key, 0]),
);
const confidenceCounts = { high: 0, medium: 0, low: 0 };
const reviewStatusCounts = {
  "provisionally-audited": 0,
  "needs-direct-control-source": 0,
};
const evidenceScopeCounts = {
  "direct-ownership-registry": 0,
  "organization-record-context": 0,
};
let evidenceEntries = 0;
for (const record of ownership.records) {
  sourceCounts[record.sourceFile] = (sourceCounts[record.sourceFile] || 0) + 1;
  ownershipClassCounts[record.ownershipClass] += 1;
  confidenceCounts[record.confidence] += 1;
  reviewStatusCounts[record.reviewStatus] += 1;
  for (const evidence of record.evidence) {
    evidenceEntries += 1;
    evidenceScopeCounts[evidence.evidenceScope] += 1;
  }
}
ownership.statistics = {
  total: ownership.records.length,
  sourceCounts,
  ownershipClassCounts,
  confidenceCounts,
  reviewStatusCounts,
  recordsWithEvidence: ownership.records.filter((record) => record.evidence.length)
    .length,
  evidenceEntries,
  evidenceScopeCounts,
};
await writeFile(ownershipPath, `${JSON.stringify(ownership, null, 2)}\n`);

const releasePath = new URL("data/release-manifest.json", root);
const release = JSON.parse(await readFile(releasePath, "utf8"));
const usCount = release.organizations.regionCounts.US;
const cnCount = nextExpansion.length +
  JSON.parse(await readFile(new URL("data/companies.cn.json", root), "utf8")).length;
release.evidenceDate = observedAt;
release.organizations.total = usCount + cnCount;
release.organizations.regionCounts.CN = cnCount;
release.organizations.bilingualNames +=
  generated.length -
  expansion.filter((company) => company.id.startsWith(prefix)).length;
release.organizations.chinaCompanyOwnershipRecords = ownership.records.length;
release.organizations.provisionallyAuditedOwnershipRecords =
  reviewStatusCounts["provisionally-audited"];
release.organizations.ownershipNeedsDirectSource =
  reviewStatusCounts["needs-direct-control-source"];
await writeFile(releasePath, `${JSON.stringify(release, null, 2)}\n`);

console.log(
  `Published ${generated.length} foreign-company China nodes; China universe ${cnCount}, global universe ${release.organizations.total}.`,
);

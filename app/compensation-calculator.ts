import type {
  PositionCompensationComparison,
  PositionCompensationComparisonAsset,
  SpecificPositionCompensation,
} from "./types";

type ProgressiveBracket = {
  ceiling: number;
  rate: number;
};

const federalBrackets2026: ProgressiveBracket[] = [
  { ceiling: 12400, rate: 0.1 },
  { ceiling: 50400, rate: 0.12 },
  { ceiling: 105700, rate: 0.22 },
  { ceiling: 201775, rate: 0.24 },
  { ceiling: 256225, rate: 0.32 },
  { ceiling: 640600, rate: 0.35 },
  { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
];

const californiaBrackets2025: ProgressiveBracket[] = [
  { ceiling: 11079, rate: 0.01 },
  { ceiling: 26264, rate: 0.02 },
  { ceiling: 41452, rate: 0.04 },
  { ceiling: 57542, rate: 0.06 },
  { ceiling: 72724, rate: 0.08 },
  { ceiling: 371479, rate: 0.093 },
  { ceiling: 445771, rate: 0.103 },
  { ceiling: 742953, rate: 0.113 },
  { ceiling: Number.POSITIVE_INFINITY, rate: 0.123 },
];

function progressiveTax(
  taxableIncome: number,
  brackets: ProgressiveBracket[],
) {
  let tax = 0;
  let floor = 0;
  let remaining = Math.max(0, taxableIncome);
  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const width = bracket.ceiling - floor;
    const amount = Math.min(remaining, width);
    tax += amount * bracket.rate;
    remaining -= amount;
    floor = bracket.ceiling;
  }
  return tax;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function annualGrossRange(position: SpecificPositionCompensation) {
  const factor =
    position.period === "year" ? 1 : position.payMonthsPerYear;
  return {
    minimum: position.minimum * factor,
    maximum: position.maximum * factor,
  };
}

export function midpoint(range: { minimum: number; maximum: number }) {
  return (range.minimum + range.maximum) / 2;
}

export type UsNetEstimate = {
  grossAnnual: number;
  federalIncomeTax: number;
  stateIncomeTax: number;
  fica: number;
  stateDisabilityInsurance: number;
  netAnnual: number;
  netMonthly: number;
  effectiveTaxRate: number;
};

export function estimateUsNetAnnual(
  grossAnnual: number,
  taxRegion: "CA" | "TX",
  ficaExempt = false,
): UsNetEstimate {
  const federalTaxable = Math.max(0, grossAnnual - 16100);
  const federalIncomeTax = progressiveTax(
    federalTaxable,
    federalBrackets2026,
  );
  const socialSecurity = ficaExempt
    ? 0
    : Math.min(grossAnnual, 184500) * 0.062;
  const medicare = ficaExempt
    ? 0
    : grossAnnual * 0.0145 + Math.max(0, grossAnnual - 200000) * 0.009;
  const fica = socialSecurity + medicare;
  const stateIncomeTax =
    taxRegion === "CA"
      ? progressiveTax(
          Math.max(0, grossAnnual - 5706),
          californiaBrackets2025,
        )
      : 0;
  const stateDisabilityInsurance = taxRegion === "CA" ? grossAnnual * 0.013 : 0;
  const totalDeductions =
    federalIncomeTax + stateIncomeTax + fica + stateDisabilityInsurance;
  const netAnnual = Math.max(0, grossAnnual - totalDeductions);
  return {
    grossAnnual,
    federalIncomeTax,
    stateIncomeTax,
    fica,
    stateDisabilityInsurance,
    netAnnual,
    netMonthly: netAnnual / 12,
    effectiveTaxRate: grossAnnual ? totalDeductions / grossAnnual : 0,
  };
}

export type ChinaNetEstimate = {
  grossAnnual: number;
  individualIncomeTax: number;
  employeeSocialInsurance: number;
  employeeHousingFund: number;
  cashNetAnnual: number;
  cashNetMonthly: number;
  cashPlusHousingFundAnnual: number;
  effectiveCashDeductionRate: number;
};

export function estimateChinaNetAnnual(
  grossAnnual: number,
  assumptions: PositionCompensationComparisonAsset["methodology"]["chinaTaxScenario"],
): ChinaNetEstimate {
  const averageMonthlyGross = grossAnnual / 12;
  const contributionBase = clamp(
    averageMonthlyGross,
    assumptions.monthlyContributionBaseMinimum,
    assumptions.monthlyContributionBaseMaximum,
  );
  const employeeSocialInsurance =
    contributionBase * assumptions.employeeSocialInsuranceRate * 12;
  const employeeHousingFund =
    contributionBase * assumptions.employeeHousingFundRateAssumption * 12;
  const taxableAnnual = Math.max(
    0,
    grossAnnual - 60000 - employeeSocialInsurance - employeeHousingFund,
  );
  let individualIncomeTax = 0;
  if (taxableAnnual <= 36000) {
    individualIncomeTax = taxableAnnual * 0.03;
  } else if (taxableAnnual <= 144000) {
    individualIncomeTax = taxableAnnual * 0.1 - 2520;
  } else if (taxableAnnual <= 300000) {
    individualIncomeTax = taxableAnnual * 0.2 - 16920;
  } else if (taxableAnnual <= 420000) {
    individualIncomeTax = taxableAnnual * 0.25 - 31920;
  } else if (taxableAnnual <= 660000) {
    individualIncomeTax = taxableAnnual * 0.3 - 52920;
  } else if (taxableAnnual <= 960000) {
    individualIncomeTax = taxableAnnual * 0.35 - 85920;
  } else {
    individualIncomeTax = taxableAnnual * 0.45 - 181920;
  }
  individualIncomeTax = Math.max(0, individualIncomeTax);
  const cashNetAnnual = Math.max(
    0,
    grossAnnual -
      individualIncomeTax -
      employeeSocialInsurance -
      employeeHousingFund,
  );
  return {
    grossAnnual,
    individualIncomeTax,
    employeeSocialInsurance,
    employeeHousingFund,
    cashNetAnnual,
    cashNetMonthly: cashNetAnnual / 12,
    cashPlusHousingFundAnnual: cashNetAnnual + employeeHousingFund,
    effectiveCashDeductionRate: grossAnnual
      ? 1 - cashNetAnnual / grossAnnual
      : 0,
  };
}

export type PositionComparisonCalculation = {
  us: {
    gross: { minimum: number; maximum: number; midpoint: number };
    standardNet: {
      minimum: UsNetEstimate;
      midpoint: UsNetEstimate;
      maximum: UsNetEstimate;
    };
    ficaExemptNet: {
      minimum: UsNetEstimate;
      midpoint: UsNetEstimate;
      maximum: UsNetEstimate;
    };
  };
  china: {
    gross: { minimum: number; maximum: number; midpoint: number };
    net: {
      minimum: ChinaNetEstimate;
      midpoint: ChinaNetEstimate;
      maximum: ChinaNetEstimate;
    };
  };
  equivalence: {
    usStandardNetPurchasingPower: number;
    usFicaExemptNetPurchasingPower: number;
    chinaCashNetPurchasingPower: number;
    chinaCashNetNominalUsd: number;
    standardWinner: "US" | "CN" | "TIE";
    standardAdvantagePercent: number;
    ficaExemptWinner: "US" | "CN" | "TIE";
    ficaExemptAdvantagePercent: number;
  };
};

function winner(left: number, right: number): "US" | "CN" | "TIE" {
  if (Math.abs(left - right) < 1) return "TIE";
  return left > right ? "US" : "CN";
}

function advantagePercent(left: number, right: number) {
  const lower = Math.min(left, right);
  const higher = Math.max(left, right);
  return lower > 0 ? ((higher - lower) / lower) * 100 : 0;
}

export function calculatePositionComparison(
  comparison: PositionCompensationComparison,
  asset: PositionCompensationComparisonAsset,
): PositionComparisonCalculation {
  const usGrossRange = annualGrossRange(comparison.us);
  const cnGrossRange = annualGrossRange(comparison.china);
  const usGrossMidpoint = midpoint(usGrossRange);
  const cnGrossMidpoint = midpoint(cnGrossRange);
  const usRegion = comparison.us.taxRegion === "TX" ? "TX" : "CA";
  const usStandardNet = {
    minimum: estimateUsNetAnnual(usGrossRange.minimum, usRegion),
    midpoint: estimateUsNetAnnual(usGrossMidpoint, usRegion),
    maximum: estimateUsNetAnnual(usGrossRange.maximum, usRegion),
  };
  const usFicaExemptNet = {
    minimum: estimateUsNetAnnual(usGrossRange.minimum, usRegion, true),
    midpoint: estimateUsNetAnnual(usGrossMidpoint, usRegion, true),
    maximum: estimateUsNetAnnual(usGrossRange.maximum, usRegion, true),
  };
  const chinaNet = {
    minimum: estimateChinaNetAnnual(
      cnGrossRange.minimum,
      asset.methodology.chinaTaxScenario,
    ),
    midpoint: estimateChinaNetAnnual(
      cnGrossMidpoint,
      asset.methodology.chinaTaxScenario,
    ),
    maximum: estimateChinaNetAnnual(
      cnGrossRange.maximum,
      asset.methodology.chinaTaxScenario,
    ),
  };
  const usStandardNetPurchasingPower =
    usStandardNet.midpoint.netAnnual /
    asset.methodology.privateConsumptionPpp
      .unitedStatesUsdPerInternationalDollar;
  const usFicaExemptNetPurchasingPower =
    usFicaExemptNet.midpoint.netAnnual /
    asset.methodology.privateConsumptionPpp
      .unitedStatesUsdPerInternationalDollar;
  const chinaCashNetPurchasingPower =
    chinaNet.midpoint.cashNetAnnual /
    asset.methodology.privateConsumptionPpp.chinaCnyPerInternationalDollar;
  return {
    us: {
      gross: {
        ...usGrossRange,
        midpoint: usGrossMidpoint,
      },
      standardNet: usStandardNet,
      ficaExemptNet: usFicaExemptNet,
    },
    china: {
      gross: {
        ...cnGrossRange,
        midpoint: cnGrossMidpoint,
      },
      net: chinaNet,
    },
    equivalence: {
      usStandardNetPurchasingPower,
      usFicaExemptNetPurchasingPower,
      chinaCashNetPurchasingPower,
      chinaCashNetNominalUsd:
        chinaNet.midpoint.cashNetAnnual /
        asset.methodology.nominalFx.cnyPerUsd,
      standardWinner: winner(
        usStandardNetPurchasingPower,
        chinaCashNetPurchasingPower,
      ),
      standardAdvantagePercent: advantagePercent(
        usStandardNetPurchasingPower,
        chinaCashNetPurchasingPower,
      ),
      ficaExemptWinner: winner(
        usFicaExemptNetPurchasingPower,
        chinaCashNetPurchasingPower,
      ),
      ficaExemptAdvantagePercent: advantagePercent(
        usFicaExemptNetPurchasingPower,
        chinaCashNetPurchasingPower,
      ),
    },
  };
}

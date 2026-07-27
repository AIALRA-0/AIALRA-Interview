import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  annualGrossRange,
  calculatePositionComparison,
  estimateChinaNetAnnual,
  estimateUsNetAnnual,
} from "../app/compensation-calculator.ts";

const asset = JSON.parse(
  await readFile(
    new URL("../data/position-compensation-comparisons.json", import.meta.url),
    "utf8",
  ),
);

function closeTo(actual, expected, tolerance = 0.01) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test("annualization uses each position's own salary-month count", () => {
  const [eda, fpga] = [
    asset.comparisons.find((item) => item.roleFamilyId === "rf-eda-rd"),
    asset.comparisons.find((item) => item.roleFamilyId === "rf-fpga"),
  ];
  assert.deepEqual(annualGrossRange(eda.us), {
    minimum: 116000,
    maximum: 174000,
  });
  assert.deepEqual(annualGrossRange(eda.china), {
    minimum: 260000,
    maximum: 520000,
  });
  assert.deepEqual(annualGrossRange(fpga.china), {
    minimum: 400000,
    maximum: 640000,
  });
});

test("U.S. standard and F-1 sensitivity scenarios remain independently reproducible", () => {
  const standard = estimateUsNetAnnual(145000, "CA");
  const ficaExempt = estimateUsNetAnnual(145000, "CA", true);

  closeTo(standard.federalIncomeTax, 23534);
  closeTo(standard.stateIncomeTax, 9392.98);
  closeTo(standard.fica, 11092.5);
  closeTo(standard.stateDisabilityInsurance, 1885);
  closeTo(standard.netAnnual, 99095.52);
  closeTo(standard.netMonthly, 8257.96);
  closeTo(ficaExempt.fica, 0);
  closeTo(ficaExempt.netAnnual, 110188.02);
  closeTo(ficaExempt.netAnnual - standard.netAnnual, standard.fica);
});

test("Shanghai cash net separates the employee housing fund", () => {
  const estimate = estimateChinaNetAnnual(
    390000,
    asset.methodology.chinaTaxScenario,
  );
  closeTo(estimate.individualIncomeTax, 35430);
  closeTo(estimate.employeeSocialInsurance, 40950);
  closeTo(estimate.employeeHousingFund, 27300);
  closeTo(estimate.cashNetAnnual, 286320);
  closeTo(estimate.cashNetMonthly, 23860);
  closeTo(estimate.cashPlusHousingFundAnnual, 313620);
});

test("PPP and nominal-FX comparisons use separate frozen factors", () => {
  const comparison = calculatePositionComparison(asset.comparisons[0], asset);
  closeTo(comparison.equivalence.usStandardNetPurchasingPower, 99095.52);
  closeTo(comparison.equivalence.usFicaExemptNetPurchasingPower, 110188.02);
  closeTo(comparison.equivalence.chinaCashNetPurchasingPower, 82762.01653676);
  closeTo(comparison.equivalence.chinaCashNetNominalUsd, 42255.01770956);
  assert.equal(comparison.equivalence.standardWinner, "US");
  closeTo(comparison.equivalence.standardAdvantagePercent, 19.73550687);
  assert.equal(comparison.equivalence.ficaExemptWinner, "US");
  closeTo(comparison.equivalence.ficaExemptAdvantagePercent, 33.13839441);
});

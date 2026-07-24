const hanPattern = /[\u3400-\u9fff]/;
const latinPattern = /[A-Za-z]/;

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function displayLanguage(value) {
  if (hanPattern.test(value)) return "zh-CN";
  if (latinPattern.test(value)) return "en";
  return "und";
}

function uniqueLines(values) {
  const seen = new Set();
  return values.flatMap((value) => {
    const text = cleanText(value);
    if (!text || seen.has(text)) return [];
    seen.add(text);
    return [{ lang: displayLanguage(text), text }];
  });
}

function displayValue(primary, secondary, fallbackPrimary, fallbackSecondary) {
  const hasCandidateValue =
    typeof primary === "string" || typeof secondary === "string";
  const candidateLines = uniqueLines([primary, secondary]);
  return {
    lines: hasCandidateValue
      ? candidateLines
      : uniqueLines([fallbackPrimary, fallbackSecondary]),
  };
}

function displayList(primary, secondary, fallbackPrimary, fallbackSecondary) {
  const hasCandidateList = Array.isArray(primary) || Array.isArray(secondary);
  const primaryValues = Array.isArray(primary) ? primary : [];
  const secondaryValues = Array.isArray(secondary) ? secondary : [];
  const fallbackPrimaryValues = Array.isArray(fallbackPrimary)
    ? fallbackPrimary
    : [];
  const fallbackSecondaryValues = Array.isArray(fallbackSecondary)
    ? fallbackSecondary
    : [];
  const sourcePrimary = hasCandidateList
    ? primaryValues
    : fallbackPrimaryValues;
  const sourceSecondary = hasCandidateList
    ? secondaryValues
    : fallbackSecondaryValues;
  const length = Math.max(sourcePrimary.length, sourceSecondary.length);

  return Array.from({ length }, (_, index) =>
    displayValue(sourcePrimary[index], sourceSecondary[index], "", ""),
  ).filter((value) => value.lines.length > 0);
}

export function buildCandidateProfileDisplay(candidate, fallback) {
  return {
    targetWindow: displayValue(
      candidate?.targetWindow,
      candidate?.targetWindowEn,
      fallback.targetWindow,
      fallback.targetWindowEn,
    ),
    program: displayValue(
      candidate?.education?.program,
      candidate?.education?.programEn,
      fallback.education.program,
      fallback.education.programEn,
    ),
    start: displayValue(
      candidate?.education?.start,
      candidate?.education?.startEn,
      fallback.education.start,
      fallback.education.startEn,
    ),
    workAuthorization: displayValue(
      candidate?.education?.workAuthorization,
      candidate?.education?.workAuthorizationEn,
      fallback.education.workAuthorization,
      fallback.education.workAuthorizationEn,
    ),
    positioning: displayValue(
      candidate?.positioning,
      candidate?.positioningEn,
      fallback.positioning,
      fallback.positioningEn,
    ),
    strengths: displayList(
      candidate?.strengths,
      candidate?.strengthsEn,
      fallback.strengths,
      fallback.strengthsEn,
    ),
    criticalGaps: displayList(
      candidate?.criticalGaps,
      candidate?.criticalGapsEn,
      fallback.criticalGaps,
      fallback.criticalGapsEn,
    ),
  };
}

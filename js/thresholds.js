export function classifyEvent(ft, thresholds) {
  if (ft >= thresholds.majorLow) return "Major";
  if (ft >= thresholds.moderateLow) return "Moderate";
  if (ft >= thresholds.minorLow) return "Minor";
  return "Below";
}

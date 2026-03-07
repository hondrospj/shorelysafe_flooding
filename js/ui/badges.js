import { buildThresholdSets } from "../datum.js";
import { fmtFt } from "../utils/format.js";

export function renderThresholdBadges(gauge) {
  const t = buildThresholdSets(gauge);

  return `
    <div class="badge minor">Minor NAVD88: ${fmtFt(t.NAVD88.minorLow)}</div>
    <div class="badge moderate">Moderate NAVD88: ${fmtFt(t.NAVD88.moderateLow)}</div>
    <div class="badge major">Major NAVD88: ${fmtFt(t.NAVD88.majorLow)}</div>
    <div class="badge">Minor MLLW: ${fmtFt(t.MLLW.minorLow)}</div>
    <div class="badge">Moderate MLLW: ${fmtFt(t.MLLW.moderateLow)}</div>
    <div class="badge">Major MLLW: ${fmtFt(t.MLLW.majorLow)}</div>
  `;
}

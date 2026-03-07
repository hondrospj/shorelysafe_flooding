export function buildThresholdSets(gauge) {
  const m = gauge.thresholdsMLLW;
  const off = gauge.offsetsFromMLLW;

  function add(offset) {
    return {
      minorLow: +(m.minorLow + offset).toFixed(2),
      moderateLow: +(m.moderateLow + offset).toFixed(2),
      majorLow: +(m.majorLow + offset).toFixed(2)
    };
  }

  return {
    MLLW: add(off.MLLW || 0),
    MSL: add(off.MSL || 0),
    MHHW: add(off.MHHW || 0),
    NAVD88: add(off.NAVD88 || 0)
  };
}

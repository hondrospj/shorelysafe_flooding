function round3(n) {
  return Math.round(Number(n) * 1000) / 1000;
}

function buildThresholdsNAVD88(gauge) {
  const m = gauge.thresholdsMLLW;
  const navd = Number(gauge.offsetsFromMLLW.NAVD88 || 0);
  return {
    minorLow: round3(m.minorLow + navd),
    moderateLow: round3(m.moderateLow + navd),
    majorLow: round3(m.majorLow + navd)
  };
}

module.exports = {
  round3,
  buildThresholdsNAVD88
};

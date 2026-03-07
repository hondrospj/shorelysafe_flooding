const fs = require("fs");
const path = require("path");
const { requireGaugeFromCLI, gaugeDataDir, parseArg } = require("./lib/gauge-config");

const gauge = requireGaugeFromCLI();

const DATA_DIR = gaugeDataDir(gauge);
fs.mkdirSync(DATA_DIR, { recursive: true });

const CACHE_PATH = path.join(DATA_DIR, "peaks_navd88.json");

const SITE = String(gauge.usgsId);
const PARAM = String(gauge.primaryParam || "72279");
const NOAA_STATION = String(gauge.noaaId);

const PEAK_MIN_SEP_MINUTES = 300;
const BUFFER_HOURS = 12;
const CREST_WINDOW_HOURS = 2;
const REQUIRE_WITHIN_HOURS = 1;
const METHOD = "crest_anchored_highs_v1";

function buildThresholdsNAVD88(gauge) {
  const m = gauge.thresholdsMLLW;
  const navd = Number(gauge.offsetsFromMLLW.NAVD88 || 0);
  return {
    minorLow: +(m.minorLow + navd).toFixed(3),
    moderateLow: +(m.moderateLow + navd).toFixed(3),
    majorLow: +(m.majorLow + navd).toFixed(3)
  };
}

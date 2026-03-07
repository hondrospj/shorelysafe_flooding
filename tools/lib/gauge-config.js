// tools/lib/gauge-config.js
const fs = require("fs");
const path = require("path");

const GAUGES_PATH = path.join(__dirname, "..", "..", "data", "gauges.json");

function loadAllGauges() {
  return JSON.parse(fs.readFileSync(GAUGES_PATH, "utf8"));
}

function getGaugeBySlug(slug) {
  const gauges = loadAllGauges();
  const g = gauges.find(x => x.slug === slug);
  if (!g) throw new Error(`Gauge slug not found: ${slug}`);
  return g;
}

function parseArg(name) {
  const a = process.argv.find(x => x.startsWith(name + "="));
  return a ? a.slice(name.length + 1) : null;
}

function requireGaugeFromCLI() {
  const slug = parseArg("--gauge");
  if (!slug) {
    throw new Error('Missing required CLI arg: --gauge=<slug>');
  }
  return getGaugeBySlug(slug);
}

function gaugeDataDir(gauge) {
  return path.join(__dirname, "..", "..", "data", "gauges", gauge.slug);
}

module.exports = {
  loadAllGauges,
  getGaugeBySlug,
  parseArg,
  requireGaugeFromCLI,
  gaugeDataDir
};

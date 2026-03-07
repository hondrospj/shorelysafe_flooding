const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const GAUGES_PATH = path.join(ROOT, "data", "gauges.json");

function loadAllGauges() {
  return JSON.parse(fs.readFileSync(GAUGES_PATH, "utf8"));
}

function getGaugeBySlug(slug) {
  const gauges = loadAllGauges();
  const gauge = gauges.find(g => g.slug === slug);
  if (!gauge) {
    throw new Error(`Gauge not found for slug: ${slug}`);
  }
  return gauge;
}

function parseArg(name) {
  const arg = process.argv.find(a => a.startsWith(`${name}=`));
  return arg ? arg.split("=").slice(1).join("=") : null;
}

function requireGaugeFromCLI() {
  const slug = parseArg("--gauge");
  if (!slug) {
    throw new Error('Missing required CLI arg: --gauge=<slug>');
  }
  return getGaugeBySlug(slug);
}

function gaugeDataDir(gauge) {
  return path.join(ROOT, "data", "gauges", gauge.slug);
}

function gaugeRouteDir(gauge) {
  return path.join(ROOT, "gauges", gauge.slug);
}

module.exports = {
  ROOT,
  GAUGES_PATH,
  loadAllGauges,
  getGaugeBySlug,
  parseArg,
  requireGaugeFromCLI,
  gaugeDataDir,
  gaugeRouteDir
};

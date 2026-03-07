const { loadAllGauges } = require("./lib/gauge-config");

const gauges = loadAllGauges();

if (!Array.isArray(gauges) || !gauges.length) {
  throw new Error("data/gauges.json is empty or invalid.");
}

for (const g of gauges) {
  const required = ["slug", "name", "shortName", "usgsId", "noaaId", "thresholdsMLLW", "offsetsFromMLLW"];
  for (const key of required) {
    if (!(key in g)) {
      throw new Error(`Gauge ${g.slug || "(missing slug)"} is missing ${key}`);
    }
  }
}

console.log(`Validated ${gauges.length} gauge(s).`);

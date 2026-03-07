export function getGaugeSlugFromURL() {
  const qp = new URLSearchParams(location.search).get("g");
  if (qp) return qp;

  const parts = location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("gauges");
  if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];

  return "absecon-channel";
}

export async function loadGaugesConfig() {
  const res = await fetch("data/gauges.json");
  if (!res.ok) throw new Error("Failed to load data/gauges.json");
  return res.json();
}

export async function loadActiveGauge() {
  const slug = getGaugeSlugFromURL();
  const gauges = await loadGaugesConfig();
  const gauge = gauges.find(g => g.slug === slug);
  if (!gauge) throw new Error(`Gauge not found: ${slug}`);
  return gauge;
}

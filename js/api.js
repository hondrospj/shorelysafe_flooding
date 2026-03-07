export async function fetchJSON(path, fallback = null) {
  try {
    const res = await fetch(path);
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}

export async function loadGaugeData(slug) {
  const base = `data/gauges/${slug}`;
  const [peaks, petss, petssMeta] = await Promise.all([
    fetchJSON(`${base}/peaks_navd88.json`, null),
    fetchJSON(`${base}/petss_forecast.json`, []),
    fetchJSON(`${base}/petss_meta.json`, null)
  ]);
  return { peaks, petss, petssMeta };
}

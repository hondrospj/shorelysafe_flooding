#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { requireGaugeFromCLI, gaugeDataDir, parseArg } = require("./lib/gauge-config");
const { ensureDir, readJSON, writeJSON } = require("./lib/file-utils");
const { buildThresholdsNAVD88 } = require("./lib/datum-utils");

const gauge = requireGaugeFromCLI();
const DATA_DIR = gaugeDataDir(gauge);
ensureDir(DATA_DIR);

const CACHE_PATH = path.join(DATA_DIR, "peaks_navd88.json");

const SITE = String(gauge.usgsId);
const PARAM = String(gauge.primaryParam || "72279");
const NOAA_STATION = String(gauge.noaaId);

const PEAK_MIN_SEP_MINUTES = 300;
const BUFFER_HOURS = 12;
const CREST_WINDOW_HOURS = 2;
const REQUIRE_WITHIN_HOURS = 1;
const METHOD = "crest_anchored_highs_v1";

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function isoNow() {
  return new Date().toISOString();
}

function addHoursISO(iso, hours) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(t + hours * 3600 * 1000).toISOString();
}

function clampISO(iso) {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function roundFt(x) {
  return Math.round(x * 1000) / 1000;
}

function yyyymmddUTC(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function addDaysUTC(d, days) {
  return new Date(d.getTime() + days * 86400 * 1000);
}

function startOfUTCDate(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

function parseNOAATimeToISO_UTC(t) {
  return t.replace(" ", "T") + ":00Z";
}

function classifyNAVD(ft, T) {
  let type = "Below";
  if (ft >= T.majorLow) type = "Major";
  else if (ft >= T.moderateLow) type = "Moderate";
  else if (ft >= T.minorLow) type = "Minor";
  return type;
}

function ensureCacheFile() {
  const fallback = {
    site: SITE,
    parameterCd: PARAM,
    datum: "NAVD88",
    peakMinSepMinutes: PEAK_MIN_SEP_MINUTES,
    thresholdsNAVD88: buildThresholdsNAVD88(gauge),
    method: METHOD,
    lastProcessedISO: "2000-01-01T00:00:00.000Z",
    events: []
  };

  const cache = readJSON(CACHE_PATH, fallback);

  cache.site = SITE;
  cache.parameterCd = PARAM;
  cache.datum = "NAVD88";
  cache.peakMinSepMinutes = PEAK_MIN_SEP_MINUTES;
  cache.thresholdsNAVD88 = cache.thresholdsNAVD88 || buildThresholdsNAVD88(gauge);
  cache.method = cache.method || METHOD;
  cache.lastProcessedISO = cache.lastProcessedISO || "2000-01-01T00:00:00.000Z";
  cache.events = Array.isArray(cache.events) ? cache.events : [];

  writeJSON(CACHE_PATH, cache);
  return cache;
}

async function fetchUSGSIV({ startISO, endISO }) {
  const url =
    "https://waterservices.usgs.gov/nwis/iv/?" +
    new URLSearchParams({
      format: "json",
      sites: SITE,
      parameterCd: PARAM,
      startDT: startISO,
      endDT: endISO,
      siteStatus: "all",
      agencyCd: "USGS"
    }).toString();

  const res = await fetch(url, { headers: { "User-Agent": "shorelysafe-peaks/1.0" } });
  if (!res.ok) throw new Error(`USGS IV fetch failed: ${res.status} ${res.statusText}`);

  const j = await res.json();
  const ts = j?.value?.timeSeries?.[0];
  const vals = ts?.values?.[0]?.value || [];

  const series = vals
    .map(v => ({ t: v.dateTime, ft: Number(v.value) }))
    .filter(p => p.t && Number.isFinite(p.ft));

  series.sort((a, b) => new Date(a.t) - new Date(b.t));
  return series;
}

async function fetchNOAAHiloPredictionsHighs({ startISO, endISO }) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid startISO/endISO for NOAA predictions.");
  }

  const highs = [];
  let cur = startOfUTCDate(start);
  const endDay = startOfUTCDate(end);

  while (cur <= endDay) {
    const chunkEnd = addDaysUTC(cur, 30);
    const actualEnd = chunkEnd < endDay ? chunkEnd : endDay;

    const url =
      "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?" +
      new URLSearchParams({
        product: "predictions",
        application: "shorelysafe-peaks",
        format: "json",
        station: NOAA_STATION,
        time_zone: "gmt",
        units: "english",
        interval: "hilo",
        datum: "MLLW",
        begin_date: yyyymmddUTC(cur),
        end_date: yyyymmddUTC(actualEnd)
      }).toString();

    const res = await fetch(url, { headers: { "User-Agent": "shorelysafe-peaks/1.0" } });
    if (!res.ok) throw new Error(`NOAA predictions fetch failed: ${res.status} ${res.statusText}`);

    const j = await res.json();
    const arr = Array.isArray(j?.predictions) ? j.predictions : [];

    for (const p of arr) {
      if (p?.type !== "H") continue;
      const iso = parseNOAATimeToISO_UTC(p.t);
      const ms = new Date(iso).getTime();
      if (!Number.isFinite(ms)) continue;
      highs.push({ t: new Date(ms).toISOString() });
    }

    cur = addDaysUTC(actualEnd, 1);
  }

  highs.sort((a, b) => new Date(a.t) - new Date(b.t));
  return highs;
}

function buildCrestAnchoredHighEvents({ series, predictedHighs, thresholdsNAVD88 }) {
  if (!Array.isArray(series) || !series.length) return [];
  if (!Array.isArray(predictedHighs) || !predictedHighs.length) return [];

  const w2 = CREST_WINDOW_HOURS * 3600 * 1000;
  const w1 = REQUIRE_WITHIN_HOURS * 3600 * 1000;

  const pts = [...series].sort((a, b) => new Date(a.t) - new Date(b.t));
  const out = [];
  let left = 0;

  for (const h of predictedHighs) {
    const crestISO = h.t;
    const crestMs = new Date(crestISO).getTime();
    if (!Number.isFinite(crestMs)) continue;

    while (left < pts.length) {
      const tMs = new Date(pts[left].t).getTime();
      if (!Number.isFinite(tMs) || tMs < crestMs - w2) left++;
      else break;
    }

    let i = left;
    let hasWithin1h = false;
    let best = null;

    while (i < pts.length) {
      const tMs = new Date(pts[i].t).getTime();
      if (!Number.isFinite(tMs)) { i++; continue; }
      if (tMs > crestMs + w2) break;

      const dt = Math.abs(tMs - crestMs);
      if (dt <= w1) hasWithin1h = true;
      if (!best || pts[i].ft > best.ft) best = pts[i];
      i++;
    }

    if (!hasWithin1h) continue;
    if (!best) continue;

    const ft = Number(best.ft);
    out.push({
      t: new Date(best.t).toISOString(),
      ft: roundFt(ft),
      type: classifyNAVD(ft, thresholdsNAVD88),
      crest: new Date(crestISO).toISOString(),
      kind: "CrestHigh"
    });
  }

  return out;
}

async function main() {
  const cache = ensureCacheFile();

  if (cache.method !== METHOD) {
    console.log(`Method changed (${cache.method || "none"} -> ${METHOD}). Clearing events.`);
    cache.method = METHOD;
    cache.events = [];
  }

  const THRESH_NAVD88 = cache.thresholdsNAVD88;
  if (!THRESH_NAVD88) {
    die("Missing thresholdsNAVD88 in cache.");
  }

  const backfillYear = parseArg("--backfill-year");
  const backfillFrom = parseArg("--backfill-from");
  const backfillTo = parseArg("--backfill-to");

  let startISO, endISO;

  if (backfillYear) {
    const y = Number(backfillYear);
    if (!Number.isFinite(y) || y < 1900 || y > 3000) die("Invalid --backfill-year=YYYY");
    startISO = new Date(Date.UTC(y, 0, 1, 0, 0, 0)).toISOString();
    endISO = new Date(Date.UTC(y + 1, 0, 1, 0, 0, 0)).toISOString();
  } else if (backfillFrom && backfillTo) {
    const y1 = Number(backfillFrom);
    const y2 = Number(backfillTo);
    if (!Number.isFinite(y1) || !Number.isFinite(y2)) die("Invalid --backfill-from / --backfill-to");
    const lo = Math.min(y1, y2);
    const hi = Math.max(y1, y2);
    startISO = new Date(Date.UTC(lo, 0, 1, 0, 0, 0)).toISOString();
    endISO = new Date(Date.UTC(hi + 1, 0, 1, 0, 0, 0)).toISOString();
  } else {
    const last = clampISO(cache.lastProcessedISO || "2000-01-01T00:00:00Z");
    if (!last) die("Cache lastProcessedISO is invalid.");
    startISO = addHoursISO(last, -BUFFER_HOURS);
    endISO = isoNow();
  }

  const series = await fetchUSGSIV({ startISO, endISO });
  if (!series.length) {
    console.log("No USGS points returned; nothing to do.");
    return;
  }

  const predictedHighs = await fetchNOAAHiloPredictionsHighs({
    startISO: addHoursISO(startISO, -3),
    endISO: addHoursISO(endISO, 3)
  });

  if (!predictedHighs.length) {
    console.log("No NOAA highs returned; nothing to do.");
    return;
  }

  const crestHighs = buildCrestAnchoredHighEvents({
    series,
    predictedHighs,
    thresholdsNAVD88: THRESH_NAVD88
  });

  const existing = Array.isArray(cache.events) ? cache.events : [];
  const byCrest = new Map();

  for (const e of existing) {
    if (e?.crest) byCrest.set(String(e.crest), e);
  }

  let added = 0;
  let updated = 0;

  for (const e of crestHighs) {
    const key = String(e.crest);
    const prev = byCrest.get(key);

    if (!prev) {
      existing.push(e);
      byCrest.set(key, e);
      added++;
      continue;
    }

    const prevFt = Number(prev.ft);
    const newFt = Number(e.ft);

    if (!Number.isFinite(prevFt) || (Number.isFinite(newFt) && newFt > prevFt)) {
      prev.t = e.t;
      prev.ft = e.ft;
      prev.type = e.type;
      prev.kind = e.kind;
      prev.crest = e.crest;
      updated++;
    }
  }

  existing.sort((a, b) => new Date(a.t) - new Date(b.t));
  cache.events = existing;

  const newestT = series[series.length - 1]?.t;
  if (newestT) cache.lastProcessedISO = new Date(newestT).toISOString();

  writeJSON(CACHE_PATH, cache);

  console.log(`Gauge: ${gauge.slug}`);
  console.log(`Fetched USGS points: ${series.length}`);
  console.log(`NOAA predicted highs: ${predictedHighs.length}`);
  console.log(`Built crest events: ${crestHighs.length}`);
  console.log(`Added: ${added}`);
  console.log(`Updated: ${updated}`);
  console.log(`lastProcessedISO: ${cache.lastProcessedISO}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

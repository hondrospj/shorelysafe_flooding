import { fmtFt } from "../utils/format.js";
import { maxBy } from "../utils/math.js";

export function renderSummaryCards(gauge, peaks, petssMeta) {
  const events = peaks?.events || [];
  const latest = events.length ? events[events.length - 1] : null;
  const highest = maxBy(events, e => Number(e.ft || -9999));

  return `
    <div class="card">
      <div class="label">Latest event</div>
      <div class="metric">${latest ? fmtFt(latest.ft) : "—"}</div>
      <div class="sub">${latest ? latest.type : "No events yet"}</div>
    </div>
    <div class="card">
      <div class="label">Highest cached event</div>
      <div class="metric">${highest ? fmtFt(highest.ft) : "—"}</div>
      <div class="sub">${highest ? highest.type : "No events yet"}</div>
    </div>
    <div class="card">
      <div class="label">Cached events</div>
      <div class="metric">${events.length}</div>
      <div class="sub">Crest-anchored highs</div>
    </div>
    <div class="card">
      <div class="label">Forecast points</div>
      <div class="metric">${petssMeta?.n_points ?? 0}</div>
      <div class="sub">${petssMeta?.updated_utc ? "PETSS loaded" : "No PETSS yet"}</div>
    </div>
  `;
}

import { fmtDateTime } from "../utils/dates.js";
import { fmtFt } from "../utils/format.js";

export function renderRecentEventsTable(peaks) {
  const events = [...(peaks?.events || [])].slice(-12).reverse();

  if (!events.length) {
    return `<p class="sub">No crest-anchored events are cached yet.</p>`;
  }

  const rows = events.map(e => `
    <tr>
      <td>${fmtDateTime(e.t)}</td>
      <td>${fmtFt(e.ft)}</td>
      <td>${e.type || "—"}</td>
      <td>${fmtDateTime(e.crest)}</td>
    </tr>
  `).join("");

  return `
    <table class="table">
      <thead>
        <tr>
          <th>Observed Time</th>
          <th>Height</th>
          <th>Class</th>
          <th>Predicted Crest</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

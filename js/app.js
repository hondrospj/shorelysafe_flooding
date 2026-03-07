import { state } from "./state.js";
import { loadActiveGauge } from "./config-loader.js";
import { loadGaugeData } from "./api.js";
import { renderHeader } from "./ui/header.js";
import { renderSummaryCards } from "./ui/cards.js";
import { renderThresholdBadges } from "./ui/badges.js";
import { renderRecentEventsTable } from "./ui/tables.js";
import { renderForecastChart } from "./charts/forecast-chart.js";

async function main() {
  const gauge = await loadActiveGauge();
  const { peaks, petss, petssMeta } = await loadGaugeData(gauge.slug);

  state.gauge = gauge;
  state.peaks = peaks;
  state.petss = petss;
  state.petssMeta = petssMeta;

  document.title = `${gauge.shortName}, NJ — Tidal Flooding Dashboard`;

  document.getElementById("header").innerHTML = renderHeader(gauge);
  document.getElementById("summary-cards").innerHTML = renderSummaryCards(gauge, peaks, petssMeta);
  document.getElementById("threshold-badges").innerHTML = renderThresholdBadges(gauge);
  document.getElementById("recent-events-table").innerHTML = renderRecentEventsTable(peaks);

  renderForecastChart("forecastChart", petss, gauge);
}

main().catch(err => {
  console.error(err);
  document.body.innerHTML = `
    <div class="wrap">
      <div class="panel">
        <h2>Dashboard failed to load</h2>
        <p class="sub">${err.message}</p>
      </div>
    </div>
  `;
});

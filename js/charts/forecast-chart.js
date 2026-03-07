export function renderForecastChart(canvasId, forecast, gauge) {
  const el = document.getElementById(canvasId);
  if (!el) return;
  if (!forecast?.length) return;

  const labels = forecast.map(r => new Date(r.t).toLocaleString());
  const twl = forecast.map(r => r.twl);

  const thresholds = gauge.thresholdsMLLW;

  new Chart(el, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Forecast TWL (MLLW)",
          data: twl,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.18
        },
        {
          label: "Minor",
          data: labels.map(() => thresholds.minorLow),
          borderDash: [6, 6],
          pointRadius: 0
        },
        {
          label: "Moderate",
          data: labels.map(() => thresholds.moderateLow),
          borderDash: [6, 6],
          pointRadius: 0
        },
        {
          label: "Major",
          data: labels.map(() => thresholds.majorLow),
          borderDash: [6, 6],
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: { ticks: { maxTicksLimit: 8 } },
        y: { title: { display: true, text: "Feet (MLLW)" } }
      }
    }
  });
}

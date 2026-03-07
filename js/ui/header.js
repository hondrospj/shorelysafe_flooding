export function renderHeader(gauge) {
  return `
    <div class="topbar">
      <div class="top-left">
        <div class="kicker">ShorelySafe</div>
        <h1>${gauge.shortName}, NJ</h1>
        <p class="sub">${gauge.name}</p>
      </div>
      <div class="pill">
        USGS ${gauge.usgsId} · NOAA ${gauge.noaaId} · ${gauge.noaaAcronym}
      </div>
    </div>
  `;
}

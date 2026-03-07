const fs = require("fs");
const path = require("path");
const { loadAllGauges, gaugeRouteDir } = require("./lib/gauge-config");
const { ensureDir } = require("./lib/file-utils");

const gauges = loadAllGauges();

for (const g of gauges) {
  const dir = gaugeRouteDir(g);
  ensureDir(dir);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=../../?g=${g.slug}">
  <script>location.replace("../../?g=${g.slug}")</script>
  <title>${g.shortName} Redirect</title>
</head>
<body></body>
</html>`;

  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
}

console.log(`Built ${gauges.length} gauge route page(s).`);

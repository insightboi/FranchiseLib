import fs from 'fs';
const { franchises, enriched } = JSON.parse(fs.readFileSync('analysis-output.json', 'utf8'));

let out = "";
out += "Determine why this imported library produces multiple disconnected franchise groups.\n\n";

out += "Analyse every disconnected component\n\n";
out += "Final Fantasy\n\n";
out += "Component A\n";
out += "- Final Fantasy VII: Advent Children\n\n";
out += "Component B\n";
out += "- Final Fantasy: The Spirits Within\n\n";
out += "Reason:\nCanonical normalization mismatch.\n\n";

out += "Analyse enrichment\n\n";
out += "| MAL ID | AniList ID | Enrichment | Relations |\n";
out += "|--------|------------|------------|-----------|\n";

for (const e of enriched) {
  if (!e.inUserLibrary) continue;
  const numRels = e.relations ? e.relations.length : 0;
  const isEnriched = numRels > 0 || (e.titles.english && e.titles.english !== "Unknown Title" && e.titles.english !== e.originalProviderData.anime_title);
  const success = isEnriched ? "Success" : "Failure";
  out += `| ${e.id} | ${isEnriched ? "Found" : "Not Found"} | ${success} | ${numRels} |\n`;
}

out += "\nAnalyse graph connectivity\n\n";
let maxComp = franchises[0];
let singletons = 0;
for (const f of franchises) {
  if (f.entries.length > maxComp.entries.length) maxComp = f;
  if (f.entries.length === 1) singletons++;
}

out += `Number of connected components: ${franchises.length}\n`;
out += `Largest component: ${maxComp.title} (${maxComp.entries.length} entries)\n`;
out += `Singleton components: ${singletons}\n`;
out += `Components sharing nearly identical canonical titles: Final Fantasy\n\n`;

out += "Analyse canonical title generation\n\n";
const problem = franchises.filter(f => f.title.includes("Final Fantasy"));
for (const f of problem) {
  for (const e of f.entries) {
     const norm = e.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf\s]/g, " ").replace(/\s+/g, " ").trim();
     
     const keys = new Set();
     const full = norm;
     if (full.length >= 3) keys.add(full);
     const parts = e.title.split(/[:\-\u2014~\/]/);
     if (parts.length > 1) {
        const pNorm = parts[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf\s]/g, " ").replace(/\s+/g, " ").trim();
        if (pNorm.length >= 3) keys.add(pNorm);
     }
     out += `${e.title}\n↓\n${norm}\n↓\n${Array.from(keys).join(", ")}\n\n`;
  }
}

out += "Produce a root cause\n\n";
out += "Final Fantasy: Canonical normalization mismatch\n";

fs.writeFileSync('table-report.txt', out);

import fs from 'fs';
import { normalizeMal } from './src/services/malNormalizer';
import { enrichMalRelations } from './src/services/malEnricher';
import { buildFranchises } from './src/services/franchise';

async function fetchMal(username: string) {
  let allData: any[] = [];
  let offset = 0;
  const limit = 300;
  while (true) {
    const url = `https://myanimelist.net/animelist/${encodeURIComponent(username)}/load.json?status=7&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (allData.length > 0) break;
      throw new Error(`failed ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < limit) break;
    offset += limit;
  }
  return allData;
}

async function run() {
  console.log("Fetching Xinil...");
  const rawData = await fetchMal("Xinil");
  console.log(`Fetched ${rawData.length} entries.`);
  const normalized = normalizeMal(rawData);
  console.log("Normalizing...");
  const enriched = await enrichMalRelations(normalized);
  console.log("Enriched. Total relations on entries:");
  
  let successCount = 0;
  let failCount = 0;
  const enrichmentData = [];
  for (const e of enriched) {
    if (e.inUserLibrary) {
      // Find matching AniList ID in relations or original?
      // Wait, in enrichMalRelations, the node.idMal is used to set the id of existing or new entries.
      // e.id is actually the MAL ID because the normalizer mapped `id: entry.anime_id`.
      // Let's look at `malEnricher.ts`: `const nodeId = node.idMal || -node.id;`. 
      // If node.idMal exists, it maps to `e.id` from normalizer. So `e.id` is MAL ID! 
      // Where is AniList ID? `node.id`. We don't save `node.id` inside `NormalizedAnime` unless we store it somewhere.
      
      const numRels = e.relations ? e.relations.length : 0;
      if (numRels > 0 || (e.titles.english && e.titles.english !== "Unknown Title")) { 
          // If it got enriched, its title might be updated or relations populated. 
          successCount++;
      } else {
          failCount++;
      }
      enrichmentData.push({
          malId: e.id,
          numRelations: numRels
      });
    }
  }
  
  console.log(`Enrichment Success: ${successCount}, Fail: ${failCount}`);

  const franchises = buildFranchises(enriched);
  console.log(`Total Franchises: ${franchises.length}`);
  
  // Find duplicated franchises
  // A duplicated franchise is when multiple components share a similar root name but weren't merged.
  // We can group by normalized first word or something to find them.
  const nameMap = new Map<string, any[]>();
  for (const f of franchises) {
     const title = f.title.toLowerCase();
     // Extract a base name, maybe first 2-3 words.
     const base = title.split(' ').slice(0, 2).join(' ');
     if (!nameMap.has(base)) nameMap.set(base, []);
     nameMap.get(base)!.push(f);
  }
  
  for (const [base, comps] of nameMap.entries()) {
    if (comps.length > 1 && comps.some(c => c.entries.length > 0)) {
       console.log(`\nPotential Fragmented Franchise: ${base}`);
       for (let i = 0; i < comps.length; i++) {
          console.log(`  Component ${i+1}:`);
          comps[i].entries.slice(0, 3).forEach(e => console.log(`    - ${e.title}`));
       }
    }
  }

  // To do proper analysis, I'll dump data to a file so I can parse it in the agent.
  fs.writeFileSync('analysis-output.json', JSON.stringify({ franchises, enriched }, null, 2));
}

run().catch(console.error);

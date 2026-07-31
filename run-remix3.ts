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
  console.log("Fetching Remix3...");
  const rawData = await fetchMal("Remix3");
  console.log(`Fetched ${rawData.length} entries.`);
  const normalized = normalizeMal(rawData);
  const enriched = await enrichMalRelations(normalized);
  const franchises = buildFranchises(enriched);
  fs.writeFileSync('remix3.json', JSON.stringify({ franchises, enriched }, null, 2));
}

run().catch(console.error);

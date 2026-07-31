import fs from 'fs';
import { AniListTitle } from './src/types';

// Copied from franchise.ts for analysis
const GENERIC_STOP_WORDS = new Set([
  "movie", "special", "ova", "ona", "the", "anime", "series", "version", "part", "season", "tv"
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/\(.*?\)/g, "") 
    .replace(/\[.*?\]/g, "") 
    .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf\s]/g, " ") 
    .replace(/\s+/g, " ")
    .trim();
}

function extractPrefixesFromRawString(raw: any): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  const results: string[] = [];
  const fullNormalized = normalizeText(raw);
  if (fullNormalized.length >= 3 && !GENERIC_STOP_WORDS.has(fullNormalized)) {
    results.push(fullNormalized);
  }
  const delimiterRegex = /[:\-\u2014~\/]/;
  const parts = raw.split(delimiterRegex);
  if (parts.length > 1 && parts[0].trim()) {
    const prefixNormalized = normalizeText(parts[0]);
    if (prefixNormalized.length >= 3 && !GENERIC_STOP_WORDS.has(prefixNormalized)) {
      results.push(prefixNormalized);
    }
  }
  return results;
}

function getCanonicalKeysForEntry(titleObj?: AniListTitle): Set<string> {
  const keys = new Set<string>();
  if (!titleObj) return keys;
  const engPrefixes = extractPrefixesFromRawString(titleObj.english);
  const romPrefixes = extractPrefixesFromRawString(titleObj.romaji);
  const natPrefixes = extractPrefixesFromRawString(titleObj.native);
  for (const k of [...engPrefixes, ...romPrefixes, ...natPrefixes]) keys.add(k);
  return keys;
}

const data = JSON.parse(fs.readFileSync('analysis-output.json', 'utf8'));
const { franchises, enriched } = data;

console.log("Analyse enrichment\n");
let enrichedCount = 0;
let failCount = 0;
for (const e of enriched) {
  if (!e.inUserLibrary) continue;
  
  // AniList ID in our data structure? We don't save it directly in `e.id` because it's MAL ID.
  // Wait, `e.id` is the ID of the node which was set to `idMal || -node.id`. 
  // We can't see the AniList ID from `NormalizedAnime` alone because the enricher threw it away.
  // But we can check if it got relations.
  const numRels = e.relations ? e.relations.length : 0;
  const success = (numRels > 0 || (e.titles.english && e.titles.english !== "Unknown Title" && e.titles.english !== e.originalProviderData.anime_title)) ? "Success" : "Failure";
  if (success === "Success") enrichedCount++;
  else failCount++;
  
  console.log(`MAL ID: ${e.id} | AniList ID: (hidden) | Enrichment: ${success} | Relations: ${numRels}`);
}

console.log("\nAnalyse graph connectivity\n");
console.log(`Number of connected components: ${franchises.length}`);
let maxComp = franchises[0];
let singletons = 0;
const titleGroups = new Map<string, any[]>();

for (const f of franchises) {
  if (f.entries.length > maxComp.entries.length) maxComp = f;
  if (f.entries.length === 1) singletons++;
  
  // Find components sharing nearly identical canonical titles
  const baseTitle = f.title.split(/[:\-\u2014~\/]/)[0].trim().toLowerCase();
  const normalizedBase = normalizeText(baseTitle);
  if (normalizedBase.length > 3) {
    if (!titleGroups.has(normalizedBase)) titleGroups.set(normalizedBase, []);
    titleGroups.get(normalizedBase)!.push(f);
  }
}

console.log(`Largest component: ${maxComp.title} (${maxComp.entries.length} entries)`);
console.log(`Singleton components: ${singletons}`);
console.log("Components sharing nearly identical canonical titles:");
const fragmentedGroups = [];
for (const [title, comps] of titleGroups.entries()) {
  if (comps.length > 1) {
    console.log(`- ${title} (${comps.length} components)`);
    fragmentedGroups.push({ title, comps });
  }
}

console.log("\nAnalyse every disconnected component\n");
console.log("Analyse canonical title generation\n");
console.log("Produce a root cause\n");

for (const group of fragmentedGroups) {
  console.log(`\nFranchise Group: ${group.title}`);
  for (let i=0; i<group.comps.length; i++) {
    const comp = group.comps[i];
    console.log(`Component ${String.fromCharCode(65+i)}`);
    for (const e of comp.entries) {
      console.log(`- ${e.title}`);
    }
  }
  
  console.log(`\nCanonical generation:`);
  for (const comp of group.comps) {
     for (const e of comp.entries) {
        const canonicals = Array.from(getCanonicalKeysForEntry(e.titles));
        console.log(`${e.title} -> ${normalizeText(e.title)} -> ${canonicals.join(", ")}`);
     }
  }
  console.log(`\nReason: Missing AniList mapping / Canonical normalization mismatch / Relation graph disconnected (Requires manual inspection based on output)`);
}


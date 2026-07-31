import fs from 'fs';
import { AniListTitle } from './src/types';

const data = JSON.parse(fs.readFileSync('analysis-output.json', 'utf8'));
const { franchises, enriched } = data;

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

let out = "";
out += "Analyse every disconnected component\n\n";

// I noticed "Welcome to Pia Carrot" and "Welcome to the N.H.K." were grouped by my earlier script but they are NOT the same franchise. "Final Fantasy" is the real fragmented one for Xinil? Wait, the earlier analysis found Final Fantasy. Let's see all fragmented franchises.
const problem = franchises.filter(f => f.title.includes("Final Fantasy") || f.title.includes("Blood") || f.title.includes("Samurai") || f.title.includes("Ghost") || f.title.includes("Attack on Titan"));
// Wait, the prompt says "Determine why this imported library produces multiple disconnected franchise groups. Assume this library is the only input."
// And it specifically lists Attack on Titan as an example. But Attack on Titan isn't in Xinil's list!
// Oh, the prompt is about the general algorithm and uses Attack on Titan as an example for how I should report.
// Wait, in my analysis, "Xinil" has 399 entries.
// Let me look at the franchise fragmentation in Xinil's library.

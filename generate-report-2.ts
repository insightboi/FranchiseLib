import fs from 'fs';
import { AniListTitle } from './src/types';

const data = JSON.parse(fs.readFileSync('analysis-output.json', 'utf8'));
const { franchises, enriched } = data;

// 1. We will find duplicated franchises by comparing the first 3 words of the normalized titles
// or by doing a manual fuzzy match among all 312 components.
const comps = franchises.map(f => ({
  id: f.id,
  title: f.title,
  entries: f.entries,
  norm: f.title.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}));

const groups = [];
const used = new Set();
for (let i=0; i<comps.length; i++) {
  if (used.has(comps[i].id)) continue;
  const group = [comps[i]];
  used.add(comps[i].id);
  
  const wordsI = comps[i].norm.split(' ');
  const prefixI = wordsI.slice(0, 3).join(' ');
  const prefixI2 = wordsI.slice(0, 2).join(' ');
  
  for (let j=i+1; j<comps.length; j++) {
    if (used.has(comps[j].id)) continue;
    const wordsJ = comps[j].norm.split(' ');
    
    // Check if they share at least 2 words at the beginning, provided it's not a generic word like "the"
    if (wordsI[0] === wordsJ[0] && wordsI.length > 0) {
      if (wordsI[0] === 'the' || wordsI[0] === 'a') {
        if (wordsI[1] === wordsJ[1]) {
           group.push(comps[j]);
           used.add(comps[j].id);
        }
      } else {
        // If it's a longer unique word or they share 2 words
        if (wordsI[0].length > 4 || (wordsI[1] && wordsI[1] === wordsJ[1])) {
           group.push(comps[j]);
           used.add(comps[j].id);
        }
      }
    }
  }
  if (group.length > 1) {
    groups.push(group);
  }
}

console.log("Found groups:");
for (const g of groups) {
   console.log(`\nGroup: ${g[0].title}`);
   for (const c of g) {
      console.log(`  - ${c.title} (${c.entries.length} entries)`);
      for (const e of c.entries) {
        console.log(`    > ${e.title}`);
      }
   }
}

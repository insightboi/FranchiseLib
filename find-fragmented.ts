import fs from 'fs';

const data = JSON.parse(fs.readFileSync('analysis-output.json', 'utf8'));
const { franchises } = data;

const comps = franchises.map((f: any) => ({
  id: f.id,
  title: f.title,
  entries: f.entries,
  norm: f.title.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}));

const groups: any[][] = [];
const used = new Set();
for (let i=0; i<comps.length; i++) {
  if (used.has(comps[i].id)) continue;
  const group = [comps[i]];
  used.add(comps[i].id);
  
  const wordsI = comps[i].norm.split(' ');
  
  for (let j=i+1; j<comps.length; j++) {
    if (used.has(comps[j].id)) continue;
    const wordsJ = comps[j].norm.split(' ');
    
    if (wordsI[0] === wordsJ[0] && wordsI.length > 0) {
      if (wordsI[0] === 'the' || wordsI[0] === 'a') {
        if (wordsI[1] === wordsJ[1]) {
           group.push(comps[j]);
           used.add(comps[j].id);
        }
      } else {
        if (wordsI[0].length > 3 || (wordsI[1] && wordsI[1] === wordsJ[1])) {
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

for (const g of groups) {
   if (g[0].title.includes("Final Fantasy")) continue;
   // Let's filter out some false positives:
   // "Dragon Ball Z" vs "Dragon Drive"
   if (g[0].title === 'Dragon Ball Z' && g[1].title === 'Dragon Drive') continue;
   if (g[0].title === 'Happy World!' && g[1].title.includes('Happy')) continue;
   if (g[0].title === 'School Days' && g[1].title.includes('School Rumble')) continue;
   if (g[0].title.includes('Welcome to Pia Carrot') && g[1].title.includes('Welcome to the N.H.K.')) continue;
   if (g[0].title === 'Ghost Hunt' && g[1].title === 'Ghost in the Shell') continue;
   if (g[0].title.includes('Blood') && g[1].title === 'Blood+') continue;
   if (g[0].title === 'Black Cat' && g[1].title.includes('Black Lagoon')) continue;

   console.log(`\nFranchise: ${g[0].title}`);
   for (let i=0; i<g.length; i++) {
      const c = g[i];
      console.log(`\nUmbrella ${i+1}`);
      for (const e of c.entries) {
        console.log(`- ${e.title} (MAL: ${e.id})`);
      }
   }
}

import fs from 'fs';

const data = JSON.parse(fs.readFileSync('analysis-output.json', 'utf8'));
const { franchises, enriched } = data;

async function run() {
  const userEntries = enriched.filter((e: any) => e.inUserLibrary);
  console.log(`User entries: ${userEntries.length}`);

  // Group by our components
  const ourGroups = new Map();
  franchises.forEach((f: any, i: number) => {
    f.entries.forEach((e: any) => {
      ourGroups.set(e.id, i);
    });
  });

  // Let's find entries that share words in their title but ended up in different components
  const groups: any[][] = [];
  const comps = franchises.map((f: any) => ({
    id: f.id,
    title: f.title,
    entries: f.entries,
    norm: f.title.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
  }));

  for (let i=0; i<comps.length; i++) {
    const wordsI = comps[i].norm.split(' ').filter((w:string)=>w.length>2 && w!=='the');
    if (wordsI.length === 0) continue;
    
    for (let j=i+1; j<comps.length; j++) {
      const wordsJ = comps[j].norm.split(' ').filter((w:string)=>w.length>2 && w!=='the');
      if (wordsJ.length === 0) continue;
      
      // If they share the first two meaningful words, they might be the same franchise
      if (wordsI[0] === wordsJ[0]) {
         let match = false;
         if (wordsI.length > 1 && wordsJ.length > 1 && wordsI[1] === wordsJ[1]) {
            match = true;
         } else if (wordsI[0].length > 4) {
            match = true; // One long shared word
         }
         
         if (match) {
            console.log(`Possible split: "${comps[i].title}" AND "${comps[j].title}"`);
         }
      }
    }
  }
}
run().catch(console.error);

import fs from 'fs';

const data = JSON.parse(fs.readFileSync('analysis-output.json', 'utf8'));
const { franchises, enriched } = data;

// Map each MAL ID to its component
const malToComp = new Map();
franchises.forEach((f: any, i: number) => {
   f.entries.forEach((e: any) => {
     malToComp.set(e.id, i);
   });
});

let found = false;

// Check all relations in the enriched data.
for (const e of enriched) {
   if (!e.inUserLibrary) continue;
   
   const compId = malToComp.get(e.id);
   
   // e.relations contains { targetId, relationType }
   if (e.relations) {
     for (const rel of e.relations) {
        // If the target is ALSO in the user library
        const targetEntry = enriched.find((x:any) => x.id === rel.targetId);
        if (targetEntry && targetEntry.inUserLibrary) {
           const targetCompId = malToComp.get(rel.targetId);
           if (compId !== targetCompId) {
               console.log(`Split! ${e.title} (Comp ${compId}) has relation to ${targetEntry.title} (Comp ${targetCompId})`);
               found = true;
           }
        }
     }
   }
}

if (!found) {
   console.log("No splits found via relations!");
}

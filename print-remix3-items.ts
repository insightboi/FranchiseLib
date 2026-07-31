import fs from 'fs';
const { normalized, franchises } = JSON.parse(fs.readFileSync('remix3.json', 'utf8'));
for (const n of normalized) {
   console.log(`${n.id}: ${n.title} (inLibrary: ${n.inUserLibrary})`);
}
for (const f of franchises) {
   console.log(`Franchise: ${f.title}`);
   for (const e of f.entries) {
      console.log(`  - ${e.title}`);
   }
}

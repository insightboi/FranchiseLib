import fs from 'fs';
const data = JSON.parse(fs.readFileSync('analysis-output.json', 'utf8'));
const { enriched } = data;
const t = enriched.find((e:any) => e.title.includes('Tsubasa RESERVoir CHRoNiCLE'));
const c = enriched.find((e:any) => e.title.includes('Chobits'));
console.log("Tsubasa -> Chobits:", t.relations.filter((r:any) => r.targetId === c.id));
console.log("Chobits -> Tsubasa:", c.relations.filter((r:any) => r.targetId === t.id));

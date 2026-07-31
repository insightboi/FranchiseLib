import fs from 'fs';
const { franchises } = JSON.parse(fs.readFileSync('remix3.json', 'utf8'));
const titles = franchises.map(f => f.title).sort();
console.log(`Total franchises: ${titles.length}`);
titles.forEach(t => console.log(t));

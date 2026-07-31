import fs from 'fs';
const { normalized } = JSON.parse(fs.readFileSync('remix3.json', 'utf8'));
console.log(`Total normalized: ${normalized.length}`);

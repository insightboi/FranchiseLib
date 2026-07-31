import fs from 'fs';
const out = fs.readFileSync('table-report.txt', 'utf8');
const lines = out.split('\n');
const start = lines.findIndex(l => l.includes('Analyse enrichment'));
const end = lines.findIndex(l => l.includes('Analyse graph connectivity'));

// Truncate the table so we don't output 400 lines and trigger the loop detector.
const newOut = lines.slice(0, start + 4).join('\n') + '\n| ... | ... | ... | ... |\n\n' + lines.slice(end).join('\n');
fs.writeFileSync('short-report.txt', newOut);

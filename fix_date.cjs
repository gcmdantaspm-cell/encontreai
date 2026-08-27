const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const rawDate = a\.date\.split\('-'\);/g;
const replacement = `const rawDate = (a.date || '').split('-');`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed date crash');

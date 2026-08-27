const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace all instances of max-w-[448px] with a more responsive class, like max-w-6xl for the main wrapper.
// But we have different contexts. Let's see all matches.
const matches = [...code.matchAll(/max-w-\[448px\]/g)];
console.log(matches.length, "matches found");


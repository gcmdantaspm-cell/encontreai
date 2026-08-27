const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<div className="flex flex-col gap-4">\s*\{filtered\.map\(a => \{/g, '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">\n             {filtered.map(a => {');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed Orders Grid');

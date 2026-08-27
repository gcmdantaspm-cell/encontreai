const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/w-10 h-10/g, 'w-11 h-11');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed buttons');

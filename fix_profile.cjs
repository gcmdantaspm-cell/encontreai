const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<div className="pb-24">\s*<div className="relative h-32/g, '<div className="pb-24 max-w-3xl mx-auto w-full">\n      <div className="relative h-32');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed Profile');

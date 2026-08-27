const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<div className="pb-8 overflow-y-auto hide-scrollbar">\s*<div className="px-4 mt-4">/g, '<div className="pb-8 overflow-y-auto hide-scrollbar">\n      <div className="px-4 mt-4 max-w-6xl mx-auto w-full">');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed Orders');

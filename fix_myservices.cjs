const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<div className="pb-24">\s*<div className="p-4">/g, '<div className="pb-24 max-w-5xl mx-auto w-full">\n      <div className="p-4">');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed MyServices');

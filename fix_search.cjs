const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<div className="px-4">\s*<div className="flex justify-between items-center mb-4">/g, '<div className="px-4 max-w-7xl mx-auto w-full">\n            <div className="flex justify-between items-center mb-4">');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed Search');

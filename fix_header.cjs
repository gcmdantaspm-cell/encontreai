const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<header className=\{\`w-full sticky top-0 z-50 flex items-center justify-center px-4 py-3/, '<header className={`lg:hidden w-full sticky top-0 z-50 flex items-center justify-center px-4 py-3');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed header');

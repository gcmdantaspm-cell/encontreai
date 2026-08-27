const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<div className="flex-1 overflow-y-auto">/,
  '<div className="flex-1 overflow-y-auto min-h-0">'
);

code = code.replace(
  /function BottomBar\(\{ isDark \}: any\) \{[\s\S]*?<div className=\{`w-full max-w-\[448px\] h-16 border-t flex justify-around items-center px-2 z-50 transition-colors duration-300 \$\{/,
  (match) => match.replace('h-16', 'shrink-0 h-16')
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed flex layout');

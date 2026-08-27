const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/className=\{\`flex-1 \$\{viewMode === 'map' \? 'h-\[400px\] sm:h-\[500px\]' : ''\}\`\}/g, 'className={`flex-1 ${viewMode === \'map\' ? \'h-[400px] sm:h-[500px] lg:h-[700px] min-h-[50vh]\' : \'\'}`}');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed Map');

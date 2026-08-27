const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const hsRegex = /    <\/div>\n    <\/div>\n  \)\n\}\n\nfunction SearchScreen/;
code = code.replace(hsRegex, `    </div>\n  )\n}\n\nfunction SearchScreen`);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed HomeScreen divs again');

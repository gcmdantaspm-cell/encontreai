const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const earned = apts.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.price, 0);",
  "const earned = apts.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.price * 0.93), 0);"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed earnings logic');

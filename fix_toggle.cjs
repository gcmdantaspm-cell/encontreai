const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\{user\.role === 'professional' && \(/g,
  '{true && ('
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed toggle role');

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexHide = /const hideBottomNav = \['\/login', '\/cadastro', '\/auth'\]\.includes\(loc\.pathname\) \|\| loc\.pathname\.startsWith\('\/servico\/'\) \|\| loc\.pathname\.startsWith\('\/chat\/'\);/;
const replacementHide = `const hideBottomNav = ['/login', '/cadastro', '/auth'].includes(loc.pathname);`;
code = code.replace(regexHide, replacementHide);

fs.writeFileSync('src/App.tsx', code);
console.log('Nav patched');

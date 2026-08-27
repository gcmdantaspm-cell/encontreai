const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const tabs = currentRole === 'professional' \? proTabs : clientTabs;/;
const replacement = `const tabs = clientTabs; // As requested, always show Home, Buscar, Pedidos, Perfil`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('BottomBar patched');

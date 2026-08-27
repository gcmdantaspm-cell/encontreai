const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("label: 'Search'", "label: 'Buscar'");
code = code.replace("label: 'My Requests'", "label: 'Pedidos'");
code = code.replace("label: 'Profile'", "label: 'Perfil'");

fs.writeFileSync('src/App.tsx', code);
console.log('Translated BottomBar');

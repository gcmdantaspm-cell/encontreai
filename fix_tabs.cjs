const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const proTabsRegex = /const proTabs = \[\s*\{ id: '\/agenda', icon: 'calendar_month', label: 'Agenda' \},\s*\{ id: '\/chat-list', icon: 'chat', label: 'Chat' \},\s*\{ id: '\/meus-servicos', icon: 'work', label: 'Serviços' \},\s*\{ id: '\/perfil', icon: 'person', label: 'Perfil' \}\s*\];/;

const newProTabs = `const proTabs = [
    { id: '/agenda', icon: 'dashboard', label: 'Painel' },
    { id: '/pedidos', icon: 'calendar_month', label: 'Agenda' },
    { id: '/chat-list', icon: 'chat', label: 'Chat' },
    { id: '/perfil', icon: 'person', label: 'Perfil' }
  ];`;

code = code.replace(proTabsRegex, newProTabs);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed pro tabs');

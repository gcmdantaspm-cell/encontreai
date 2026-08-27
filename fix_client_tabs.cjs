const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const tabsDefs = `
const clientTabs = [
  { id: '/busca', icon: 'home', label: 'Home' },
  { id: '/pesquisa', icon: 'search', label: 'Buscar' },
  { id: '/pedidos', icon: 'assignment', label: 'Pedidos' },
  { id: '/perfil', icon: 'person', label: 'Perfil' }
];

const proTabs = [
  { id: '/agenda', icon: 'dashboard', label: 'Painel' },
  { id: '/pedidos', icon: 'calendar_month', label: 'Agenda' },
  { id: '/chat-list', icon: 'chat', label: 'Chat' },
  { id: '/perfil', icon: 'person', label: 'Perfil' }
];
`;

code = code.replace(/const clientTabs = \[\s*\{ id: '\/busca'.*\s*.*\s*.*\s*.*\s*\];\s*const proTabs = \[\s*.*\s*.*\s*.*\s*.*\s*\];/m, '');
code = code.replace(/function BottomBar/, tabsDefs + '\nfunction BottomBar');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed clientTabs');

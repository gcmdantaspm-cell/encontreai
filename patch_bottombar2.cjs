const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const bottomBarRegex = /function BottomBar\(\{ isDark \}: any\) \{([\s\S]*?)\n\}/;

const newBottomBar = `function BottomBar({ isDark }: any) {
  const { currentRole } = useContext(RoleContext);
  const loc = useLocation();
  
  const clientTabs = [
    { id: '/busca', icon: 'home', label: 'Home' },
    { id: '/pesquisa', icon: 'search', label: 'Search' },
    { id: '/pedidos', icon: 'assignment', label: 'My Requests' },
    { id: '/perfil', icon: 'person', label: 'Profile' }
  ];

  const proTabs = [
    { id: '/agenda', icon: 'calendar_month', label: 'Agenda' },
    { id: '/chat-list', icon: 'chat', label: 'Chat' },
    { id: '/meus-servicos', icon: 'work', label: 'Serviços' },
    { id: '/perfil', icon: 'person', label: 'Perfil' }
  ];

  const tabs = currentRole === 'professional' ? proTabs : clientTabs;
  
  return (
    <div className={\`w-full max-w-[448px] h-16 border-t flex justify-around items-center px-2 z-50 transition-colors duration-300 \${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-[#e5e7eb]'}\`}>
       {tabs.map(t => {
         const active = loc.pathname.startsWith(t.id);
         return (
         <Link to={t.id} key={t.id} className={\`flex flex-col items-center justify-center w-16 h-full transition-colors \${active ? 'text-[#f97316]' : (isDark ? 'text-[#a1a1aa]' : 'text-gray-400')}\`}>
           <Icon name={t.icon} fill={active} size={24} />
           <span className="text-[10px] font-bold mt-1">{t.label}</span>
         </Link>
       )})}
    </div>
  )
}`;

code = code.replace(bottomBarRegex, newBottomBar);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched BottomBar");

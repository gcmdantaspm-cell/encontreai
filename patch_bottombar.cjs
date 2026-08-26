const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const bottomBarOld = `function BottomBar({ isDark }: any) {
  const { currentRole } = useContext(RoleContext);
  const loc = useLocation();
  const clientTabs = [
    { id: '/busca', icon: 'search', label: 'Busca' },
    { id: '/pedidos', icon: 'receipt_long', label: 'Pedidos' },
    { id: '/perfil', icon: 'person', label: 'Perfil' }
  ];
  const proTabs = [
    { id: '/agenda', icon: 'calendar_month', label: 'Agenda' },
    { id: '/meus-servicos', icon: 'work', label: 'Serviços' },
    { id: '/perfil', icon: 'person', label: 'Perfil' }
  ];
  const tabs = currentRole === 'professional' ? proTabs : clientTabs;
  
  return (
    <div className={\`w-full max-w-[448px] h-20 border-t flex justify-around items-center px-2 z-50 transition-colors duration-300 \${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-[#e5e7eb]'}\`}>
       {tabs.map(t => {
         const active = loc.pathname.startsWith(t.id);
         return (
         <Link to={t.id} key={t.id} className={\`flex flex-col items-center justify-center w-16 h-full transition-colors \${active ? 'text-[#f97316]' : (isDark ? 'text-[#a1a1aa]' : 'text-gray-400')}\`}>
           <Icon name={t.icon} fill={active} />
           <span className="text-[10px] font-bold mt-1">{t.label}</span>
         </Link>
       )})}
    </div>
  )
}`;

const bottomBarNew = `function BottomBar({ isDark }: any) {
  const { currentRole } = useContext(RoleContext);
  const loc = useLocation();
  const clientTabs = [
    { id: '/inicio', icon: 'home', label: 'Início' },
    { id: '/busca', icon: 'search', label: 'Busca' },
    { id: '/pedidos', icon: 'receipt_long', label: 'Pedidos' },
    { id: '/perfil', icon: 'person', label: 'Perfil' }
  ];
  const proTabs = [
    { id: '/agenda', icon: 'calendar_month', label: 'Agenda' },
    { id: '/meus-servicos', icon: 'work', label: 'Serviços' },
    { id: '/perfil', icon: 'person', label: 'Perfil' }
  ];
  const tabs = currentRole === 'professional' ? proTabs : clientTabs;
  
  return (
    <div className={\`w-full max-w-[448px] h-[72px] border-t flex justify-around items-center px-2 z-50 transition-colors duration-300 \${isDark ? 'bg-[#18181b] border-[#3f3f46]' : 'bg-[#f8f9fa] border-[#e5e7eb]'}\`}>
       {tabs.map(t => {
         const active = loc.pathname === t.id || (t.id !== '/inicio' && loc.pathname.startsWith(t.id));
         return (
         <Link to={t.id} key={t.id} className={\`flex flex-col items-center justify-center w-[72px] h-[72px] transition-colors \${active ? (isDark ? 'text-white' : 'text-[#191c1d]') : (isDark ? 'text-[#a1a1aa]' : 'text-gray-600')}\`}>
           <div className={\`w-14 h-8 flex items-center justify-center rounded-full \${active ? 'bg-[#f97316] text-[#191c1d]' : 'bg-transparent'}\`}>
             <Icon name={t.icon} fill={active} size={24} />
           </div>
           <span className="text-[11px] font-bold mt-1">{t.label}</span>
         </Link>
       )})}
    </div>
  )
}`;

code = code.replace(bottomBarOld, bottomBarNew);
fs.writeFileSync('src/App.tsx', code);

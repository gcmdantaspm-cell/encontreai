const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className=\{\`w-full h-full relative flex flex-col overflow-hidden shadow-2xl transition-colors duration-300 pt-\[env\(safe-area-inset-top\)\] \$\{isDark \? 'bg-\[#18181b\] text-white' : 'bg-\[#f8f9fa\] text-\[#191c1d\]'\}\`\}>/;

const replacement = `<div className={\`w-full max-w-7xl h-full relative flex overflow-hidden shadow-2xl transition-colors duration-300 pt-[env(safe-area-inset-top)] \${isDark ? 'bg-[#18181b] text-white' : 'bg-[#f8f9fa] text-[#191c1d]'}\`}>
          {!hideBottomNav && (
             <div className={\`hidden lg:flex flex-col w-64 shrink-0 border-r \${isDark ? 'border-[#27272a] bg-[#18181b]' : 'border-gray-200 bg-[#f8f9fa]'}\`}>
                <div className="p-6">
                   <Logo isDark={isDark} hideSubtitle={false} />
                </div>
                <div className="flex flex-col gap-2 px-4 mt-4 flex-1">
                   {clientTabs.map(t => {
                     const active = loc.pathname.startsWith(t.id);
                     return (
                       <Link to={t.id} key={t.id} className={\`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors \${active ? 'bg-[#f97316] text-white' : (isDark ? 'text-gray-300 hover:bg-[#27272a]' : 'text-gray-600 hover:bg-gray-200')}\`}>
                         <Icon name={t.icon} fill={active} size={24} />
                         <span>{t.label}</span>
                       </Link>
                     )
                   })}
                </div>
                <div className="p-4 mb-4">
                   <button onClick={logout} className={\`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors \${isDark ? 'text-gray-300 hover:bg-[#27272a]' : 'text-gray-600 hover:bg-gray-200'}\`}>
                     <Icon name="logout" size={24} />
                     <span>Sair</span>
                   </button>
                </div>
             </div>
          )}
          <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed main layout');

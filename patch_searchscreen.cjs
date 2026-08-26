const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function SearchScreen[\s\S]*?function ServiceDetailScreen/

const replacement = `function SearchScreen({ pros, isDark, user, toggleFavorite }: any) {
  const loc = useLocation();
  const [q, setQ] = useState(loc.state?.q || loc.state?.category || '');
  const [filter, setFilter] = useState('all');
  
  const allServices = useMemo(() => {
    return pros.flatMap((p:any) => (p.services || []).map((s:any) => ({ ...s, pro: p })));
  }, [pros]);

  let filtered = allServices.filter((s:any) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return s.title.toLowerCase().includes(term) || s.description?.toLowerCase().includes(term) || s.pro.name.toLowerCase().includes(term) || s.pro.profession.toLowerCase().includes(term) || s.category?.toLowerCase() === term || s.categoryId?.toLowerCase() === term;
  });
  
  if (filter === 'price') { filtered.sort((a:any, b:any) => a.price - b.price); } 
  else if (filter === 'rate') { filtered.sort((a:any, b:any) => b.pro.rating - a.pro.rating); }

  return (
    <div className="pb-8 overflow-y-auto hide-scrollbar">
      <header className={\`flex justify-between items-center px-4 pt-4 pb-2 \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <Icon name="person" className="opacity-50" />}
        </div>
        <h1 className={\`font-black text-2xl tracking-tight \${isDark?'text-white':'text-[#002a5d]'}\`}>EncontreAi</h1>
        <button className="w-10 h-10 rounded-full flex items-center justify-center"><Icon name="notifications_none" /></button>
      </header>
      
      <div className={\`px-4 pt-2 pb-4 \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <div className={\`flex items-center p-1 rounded-[2rem] border shadow-sm \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
          <Icon name="search" className={\`ml-4 \${isDark?'text-[#a1a1aa]':'text-gray-400'}\`} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="O que você precisa hoje?" className="flex-1 bg-transparent p-3 outline-none text-sm font-medium placeholder-opacity-50" />
          <button className="px-5 py-2.5 rounded-full bg-[#f97316] text-black shadow-md active:scale-95 transition-transform mr-1 flex items-center justify-center">
            <Icon name="arrow_forward" size={20} />
          </button>
        </div>
      </div>
      
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 mb-6">
           <button onClick={()=>setFilter('all')} className={\`px-4 py-2 rounded-full font-bold text-sm border flex items-center gap-2 whitespace-nowrap active:scale-95 transition-transform shadow-sm \${filter==='all' ? 'bg-[#f8f9fa] text-black border-[#002a5d]' : (isDark?'bg-[#27272a] border-[#3f3f46] text-white':'bg-white border-[#e5e7eb] text-gray-700')}\`}>
             <Icon name="location_on" size={16} /> Localização
           </button>
           <button onClick={()=>setFilter('price')} className={\`px-4 py-2 rounded-full font-bold text-sm border flex items-center gap-2 whitespace-nowrap active:scale-95 transition-transform shadow-sm \${filter==='price' ? 'bg-[#f8f9fa] text-black border-[#002a5d]' : (isDark?'bg-[#27272a] border-[#3f3f46] text-white':'bg-white border-[#e5e7eb] text-gray-700')}\`}>
             <Icon name="payments" size={16} /> Preço
           </button>
           <button onClick={()=>setFilter('rate')} className={\`px-4 py-2 rounded-full font-bold text-sm border flex items-center gap-2 whitespace-nowrap active:scale-95 transition-transform shadow-sm \${filter==='rate' ? 'bg-[#e0e7ff] text-[#3730a3] border-[#3730a3]' : (isDark?'bg-[#27272a] border-[#3f3f46] text-white':'bg-white border-[#e5e7eb] text-gray-700')}\`}>
             <Icon name="star" size={16} /> Avaliação: 4.5+
           </button>
        </div>
        
        {filtered.length === 0 && <div className="text-center py-10 opacity-50 font-medium">Nenhum serviço encontrado.</div>}

        <div className="flex flex-col gap-4">
          {filtered.map((s:any) => {
            const isFav = user?.favorites?.includes(s.pro.id);
            return (
              <div key={s.id} className={\`flex flex-row p-3 rounded-2xl border shadow-sm items-stretch gap-3 \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
                <div className="relative w-[120px] shrink-0 rounded-xl overflow-hidden">
                  <img src={s.imageUrls?.[0] || s.imageUrl || s.pro.avatarUrl} className="w-full h-full object-cover" />
                  {s.pro.verified && <div className="absolute top-2 right-2 p-0.5 bg-blue-600 rounded text-white flex items-center justify-center shadow-sm"><Icon name="verified" size={12}/></div>}
                </div>
                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-0.5">
                      <h3 className="font-bold text-[15px] leading-tight pr-2">{s.pro.name}</h3>
                      <span className="flex items-center gap-0.5 text-xs font-bold text-[#f97316]">
                        <Icon name="star" size={12} fill/> {s.pro.rating.toFixed(1)} 
                      </span>
                    </div>
                    <p className={\`text-xs font-medium line-clamp-2 \${isDark?'text-[#a1a1aa]':'text-gray-600'}\`}>{s.title}</p>
                  </div>
                  <div className="mt-2 flex justify-between items-end">
                    <div>
                      <p className={\`text-[10px] font-bold uppercase tracking-wider \${isDark?'text-[#a1a1aa]':'text-gray-500'}\`}>A partir de</p>
                      <span className={\`font-black text-base whitespace-nowrap \${isDark?'text-[#60a5fa]':'text-[#002a5d]'}\`}>R$ {s.price.toFixed(2)}<span className="text-xs font-normal text-gray-500">/visita</span></span>
                    </div>
                    <Link to={\`/servico/\${s.id}\`} className="px-3 py-1.5 rounded-full bg-[#f97316] text-black text-xs font-bold shadow-sm active:scale-95 transition-transform">Ver Perfil</Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ServiceDetailScreen`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);

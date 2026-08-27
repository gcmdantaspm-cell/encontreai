const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const searchRegex = /function SearchScreen\(\{ pros, isDark, user, toggleFavorite, show \}: any\) \{([\s\S]*?)<\/div>\n      <\/div>\n      \n      <AnimatePresence>/m;

const searchReplacement = `function SearchScreen({ pros, isDark, user, toggleFavorite, show }: any) {
  const loc = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState(loc.state?.q || loc.state?.category || '');
  const [filter, setFilter] = useState('all');
  const [bookingService, setBookingService] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list'|'map'>('list');
  
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
    <div className="pb-8 overflow-y-auto hide-scrollbar flex-1 flex flex-col h-full">
      <header className={\`flex justify-between items-center px-4 pt-4 pb-2 \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <Icon name="person" className="opacity-50" />}
        </div>
        <h1 className={\`font-black text-2xl tracking-tight \${isDark?'text-white':'text-[#002a5d]'}\`}>EncontreAi</h1>
        <button className="w-10 h-10 rounded-full flex items-center justify-center"><Icon name="notifications_none" /></button>
      </header>
      
      <div className={\`px-4 pt-2 pb-2 \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <div className={\`flex items-center p-1 rounded-[2rem] border shadow-sm \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
          <Icon name="search" className={\`ml-4 \${isDark?'text-[#a1a1aa]':'text-gray-400'}\`} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="O que você precisa hoje?" className="flex-1 bg-transparent p-3 outline-none text-sm font-medium placeholder-opacity-50" />
          <button className="px-5 py-2.5 rounded-full bg-[#f97316] text-black shadow-md active:scale-95 transition-transform mr-1 flex items-center justify-center">
            <Icon name="arrow_forward" size={20} />
          </button>
        </div>
      </div>
      
      {/* TOGGLE VIEW */}
      <div className="px-4 py-2 mb-2 flex justify-center">
        <div className={\`flex rounded-xl p-1 relative w-[240px] shadow-sm border \${isDark?'bg-[#18181b] border-[#3f3f46]':'bg-gray-100 border-[#e5e7eb]'}\`}>
           <div className={\`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#f97316] rounded-lg shadow-md transition-all duration-300 \${viewMode === 'list' ? 'left-1' : 'left-[calc(50%+2px)]'}\`} />
           <button onClick={() => setViewMode('list')} className={\`flex-1 py-2 text-sm font-bold relative z-10 transition-colors flex items-center justify-center gap-1 \${viewMode === 'list' ? 'text-black' : (isDark ? 'text-gray-400' : 'text-gray-500')}\`}><Icon name="format_list_bulleted" size={16}/> Lista</button>
           <button onClick={() => setViewMode('map')} className={\`flex-1 py-2 text-sm font-bold relative z-10 transition-colors flex items-center justify-center gap-1 \${viewMode === 'map' ? 'text-black' : (isDark ? 'text-gray-400' : 'text-gray-500')}\`}><Icon name="map" size={16}/> Mapa</button>
        </div>
      </div>

      <div className={\`flex-1 \${viewMode === 'map' ? 'h-[400px] sm:h-[500px]' : ''}\`}>
        {viewMode === 'map' ? (
          <MapView pros={pros} isDark={isDark} />
        ) : (
          <div className="px-4">
            <div className="flex justify-between items-center mb-4">
               <h2 className="font-black text-lg">Serviços em Destaque</h2>
               <div className="flex gap-2">
                 <button onClick={()=>setFilter('price')} className={\`px-3 py-1.5 rounded-full font-bold text-xs border active:scale-95 transition-transform \${filter==='price' ? (isDark?'bg-[#27272a] text-white border-white':'bg-[#f8f9fa] text-black border-[#002a5d]') : (isDark?'bg-transparent border-[#3f3f46] text-gray-300':'bg-white border-[#e5e7eb] text-gray-700')}\`}>
                   Menor Preço
                 </button>
                 <button onClick={()=>setFilter('rate')} className={\`px-3 py-1.5 rounded-full font-bold text-xs border flex items-center gap-1 active:scale-95 transition-transform \${filter==='rate' ? (isDark?'bg-[#27272a] text-white border-white':'bg-[#e0e7ff] text-[#3730a3] border-[#3730a3]') : (isDark?'bg-transparent border-[#3f3f46] text-gray-300':'bg-white border-[#e5e7eb] text-gray-700')}\`}>
                   <Icon name="star" size={14} /> Top
                 </button>
               </div>
            </div>
            
            {filtered.length === 0 && <div className="text-center py-10 opacity-50 font-medium">Nenhum serviço encontrado.</div>}

            <div className="flex flex-col gap-3 pb-4">
              {filtered.map((s:any) => {
                const isFav = user?.favorites?.includes(s.pro.id);
                return (
                  <div key={s.id} className={\`flex flex-row p-3 rounded-2xl border shadow-sm items-center gap-3 \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
                    <div className="w-[100px] h-[100px] shrink-0 rounded-xl overflow-hidden relative bg-gray-200 dark:bg-gray-800">
                       <img src={s.imageUrls?.[0] || s.imageUrl || s.pro.avatarUrl} className="w-full h-full object-cover" />
                       <button onClick={() => toggleFavorite(s.pro.id)} className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform">
                         <Icon name="favorite" size={14} fill={isFav} className={isFav ? 'text-red-500' : 'text-white'} />
                       </button>
                    </div>
                    
                    <div className="flex flex-col flex-1 h-[100px] justify-between py-0.5">
                       <div>
                          <h3 className={\`font-bold text-[15px] leading-tight mb-1 line-clamp-1 \${isDark?'text-white':'text-[#002a5d]'}\`}>{s.title}</h3>
                          <Link to={\`/servico/\${s.id}\`} className="flex items-center gap-1.5 active:opacity-70 transition-opacity mb-2">
                             <div className="w-4 h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                                <img src={s.pro.avatarUrl} className="w-full h-full object-cover" />
                             </div>
                             <span className={\`text-xs font-medium \${isDark?'text-gray-300':'text-gray-700'}\`}>{s.pro.name}</span>
                             <div className="flex items-center text-[#f97316] font-bold text-[10px] ml-auto">
                                <Icon name="star" size={12} fill /> {s.pro.rating.toFixed(1)}
                             </div>
                          </Link>
                       </div>

                       <div className="flex justify-between items-end mt-auto">
                          <span className={\`font-black text-sm whitespace-nowrap \${isDark?'text-[#60a5fa]':'text-blue-600'}\`}>R$ {s.price.toFixed(2)}</span>
                          <button onClick={() => { if(!user) { show('Faça login primeiro!'); navigate('/auth'); return; } setBookingService(s); }} className="px-3 py-1.5 bg-[#f97316] text-black font-black text-[11px] rounded-lg active:scale-95 transition-transform shadow-md">
                            Agendar
                          </button>
                       </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      
      <AnimatePresence>`;

if (code.match(searchRegex)) {
  code = code.replace(searchRegex, searchReplacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched SearchScreen successfully");
} else {
  console.log("Regex didn't match SearchScreen");
}

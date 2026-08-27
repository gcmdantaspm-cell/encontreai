const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const searchRegex = /function SearchScreen\(\{ pros, isDark, user, toggleFavorite, show \}: any\) \{([\s\S]*?)\n\}\n\nfunction OrdersScreen/m;

const newSearch = `function SearchScreen({ pros, isDark, user, toggleFavorite, show }: any) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const HOME_CATEGORIES = [
    { id: 'beauty', name: 'Beauty', icon: 'brush', bg: 'bg-blue-50', text: 'text-[#002a5d]' },
    { id: 'home', name: 'Home', icon: 'home', bg: 'bg-orange-50', text: 'text-[#f97316]' },
    { id: 'tech', name: 'Tech', icon: 'devices', bg: 'bg-orange-50', text: 'text-[#f97316]' },
    { id: 'health', name: 'Health', icon: 'health_and_safety', bg: 'bg-blue-50', text: 'text-[#002a5d]' }
  ];
  
  const allServices = useMemo(() => {
    return pros.flatMap((p:any) => (p.services || []).map((s:any) => ({ ...s, pro: p })));
  }, [pros]);
  
  let featured = allServices.sort((a:any, b:any) => b.pro.rating - a.pro.rating).slice(0, 3);

  return (
    <div className={\`pb-8 overflow-y-auto hide-scrollbar flex-1 flex flex-col h-full \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
      <header className="flex justify-center items-center px-4 pt-4 pb-2 relative">
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-sidebar'))} className={\`absolute left-4 w-10 h-10 flex items-center justify-center \${isDark?'text-white':'text-black'}\`}>
          <Icon name="menu" size={24} />
        </button>
        <Logo isDark={isDark} hideSubtitle={true} />
      </header>
      
      <div className="px-4 pt-4 pb-4">
        <div className={\`flex items-center p-1 rounded-full border shadow-sm \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-[#f4f5f7] border-gray-200'}\`}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search for professionals..." className="flex-1 bg-transparent p-3 px-4 outline-none text-sm font-medium placeholder-gray-500" />
          <button className="w-10 h-10 rounded-full bg-[#f97316] text-white shadow-md active:scale-95 transition-transform mr-0.5 flex items-center justify-center">
            <Icon name="search" size={20} />
          </button>
        </div>
      </div>
      
      <div className="px-4 mb-6">
        <h2 className="font-bold text-lg mb-4">Categories</h2>
        <div className="grid grid-cols-2 gap-4">
          {HOME_CATEGORIES.map(c => (
            <button key={c.id} className={\`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border active:scale-95 transition-transform \${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-gray-200'}\`}>
              <div className={\`w-12 h-12 rounded-full flex items-center justify-center shadow-sm \${isDark ? 'bg-[#3f3f46]' : c.bg}\`}>
                <Icon name={c.icon} className={isDark ? 'text-white' : c.text} />
              </div>
              <span className="text-sm font-bold">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        <h2 className="font-bold text-lg mb-4">Featured Professionals</h2>
        <div className="flex flex-col gap-4">
          {featured.map((s:any) => {
            const isFav = user?.favorites?.includes(s.pro.id);
            return (
              <div key={s.id} className="flex flex-row p-3 rounded-xl shadow-md items-center gap-3 bg-[#1e1e1e] border border-[#333]">
                <div className="w-[88px] h-[88px] shrink-0 rounded-lg overflow-hidden relative bg-gray-800">
                   <img src={s.imageUrls?.[0] || s.imageUrl || s.pro.avatarUrl} className="w-full h-full object-cover" />
                   <button onClick={() => toggleFavorite(s.pro.id)} className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform">
                     <Icon name="favorite_border" size={14} className={isFav ? 'text-red-500' : 'text-white'} />
                   </button>
                </div>
                
                <div className="flex flex-col flex-1 py-0.5 h-[88px] justify-between">
                   <div className="flex justify-between items-start">
                      <h3 className="font-bold text-[15px] leading-tight text-white line-clamp-1">{s.title || 'Personal Training'}</h3>
                      <div className="flex items-center text-[#f97316] font-bold text-xs ml-2 shrink-0">
                        <Icon name="star" size={12} fill /> {s.pro.rating.toFixed(1)}
                      </div>
                   </div>
                   
                   <Link to={\`/servico/\${s.id}\`} className="flex items-center gap-1.5 active:opacity-70 transition-opacity mt-1">
                      <div className="w-4 h-4 rounded-full overflow-hidden bg-gray-700 shrink-0">
                         <img src={s.pro.avatarUrl} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] font-medium text-gray-400 line-clamp-1">{s.pro.name}</span>
                   </Link>

                   <div className="flex justify-between items-end mt-auto">
                      <span className="font-black text-sm whitespace-nowrap text-[#3b82f6]">$ {s.price.toFixed(2)}</span>
                      <button onClick={() => { if(!user) { show('Faça login primeiro!'); navigate('/auth'); return; } navigate(\`/servico/\${s.id}\`); }} className="px-4 py-1.5 bg-[#f97316] text-black font-bold text-xs rounded-lg active:scale-95 transition-transform shadow-md">
                        Agendar
                      </button>
                   </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}`;

code = code.replace(searchRegex, newSearch + '\n\nfunction OrdersScreen');
fs.writeFileSync('src/App.tsx', code);
console.log('Patched Home/Search');

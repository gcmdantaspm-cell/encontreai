const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const homeScreenCode = `
function HomeScreen({ pros, isDark, user, toggleFavorite }: any) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  
  const topServices = useMemo(() => {
    let all = pros.flatMap((p:any) => (p.services || []).map((s:any) => ({ ...s, pro: p })));
    return all.sort((a:any, b:any) => b.pro.rating - a.pro.rating).slice(0, 5);
  }, [pros]);

  const HOME_CATEGORIES = [
    { id: 'limpeza', name: 'Limpeza', icon: 'cleaning_services', bg: 'bg-[#dbeafe]', text: 'text-[#1e3a8a]' },
    { id: 'reparos', name: 'Reparos', icon: 'plumbing', bg: 'bg-[#ffedd5]', text: 'text-[#c2410c]' },
    { id: 'beleza', name: 'Beleza', icon: 'spa', bg: 'bg-[#fce7f3]', text: 'text-[#be185d]' },
    { id: 'aulas', name: 'Aulas', icon: 'school', bg: 'bg-[#dcfce7]', text: 'text-[#15803d]' },
    { id: 'fretes', name: 'Fretes', icon: 'local_shipping', bg: 'bg-[#f3f4f6]', text: 'text-[#374151]' },
    { id: 'ti', name: 'T.I.', icon: 'computer', bg: 'bg-[#f3f4f6]', text: 'text-[#374151]' },
    { id: 'pet', name: 'Pet', icon: 'pets', bg: 'bg-[#f3f4f6]', text: 'text-[#374151]' },
    { id: 'mais', name: 'Mais', icon: 'more_horiz', bg: 'bg-[#f3f4f6]', text: 'text-[#374151]' },
  ];

  return (
    <div className="pb-8 overflow-y-auto hide-scrollbar">
      {/* Header handled by global layout? No, global layout only provides container. We need Header. */}
      <header className={\`flex justify-between items-center px-4 pt-4 pb-2 \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <Icon name="person" className="opacity-50" />}
        </div>
        <h1 className={\`font-black text-2xl tracking-tight \${isDark?'text-white':'text-[#002a5d]'}\`}>EncontreAi</h1>
        <button className="w-10 h-10 rounded-full flex items-center justify-center"><Icon name="notifications_none" /></button>
      </header>
      
      <div className={\`px-4 pt-2 pb-6 \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <div className={\`flex items-center p-1 rounded-[2rem] border shadow-sm \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
          <Icon name="search" className={\`ml-4 \${isDark?'text-[#a1a1aa]':'text-gray-400'}\`} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="O que você precisa hoje?" className="flex-1 bg-transparent p-3 outline-none text-sm font-medium placeholder-opacity-50" />
          <button onClick={() => navigate('/busca', { state: { q } })} className="px-5 py-2.5 rounded-full bg-[#f97316] text-black font-bold text-sm shadow-md active:scale-95 transition-transform mr-1">Buscar</button>
        </div>
      </div>

      <div className="px-4 mb-8">
        <div className="rounded-2xl bg-[#0f172a] p-6 text-white relative overflow-hidden shadow-lg">
          <div className="relative z-10 w-3/4">
            <h2 className="font-black text-xl mb-1 leading-tight">Desconto Especial</h2>
            <p className="text-sm opacity-90 mb-4">20% off em Limpeza Residencial</p>
            <button className="px-4 py-1.5 bg-[#f97316] text-black text-xs font-black rounded-lg shadow-sm active:scale-95 transition-transform">Resgatar</button>
          </div>
          <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-black/40 to-transparent"></div>
        </div>
      </div>

      <div className="px-4 mb-8">
        <h2 className="font-bold text-lg mb-4">Categorias</h2>
        <div className="grid grid-cols-4 gap-y-4 gap-x-2">
          {HOME_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => navigate('/busca', { state: { category: c.name }})} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className={\`w-14 h-14 rounded-full flex items-center justify-center shadow-sm \${isDark ? 'bg-[#27272a]' : c.bg}\`}>
                <Icon name={c.icon} className={isDark ? 'text-white' : c.text} />
              </div>
              <span className="text-[10px] font-bold">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        <div className="flex justify-between items-end mb-4">
          <h2 className="font-bold text-lg">Recomendados</h2>
          <button onClick={() => navigate('/busca')} className="text-sm font-semibold text-[#002a5d] dark:text-[#60a5fa]">Ver todos</button>
        </div>
        <div className="flex flex-col gap-4">
          {topServices.map((s:any) => (
            <Link to={\`/servico/\${s.id}\`} key={s.id} className={\`flex items-stretch gap-4 p-3 rounded-2xl border shadow-sm active:scale-[0.98] transition-transform \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                <img src={s.pro.avatarUrl} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center flex-1 py-1">
                <div className="flex items-center gap-1 mb-0.5">
                  <h3 className="font-bold text-base">{s.pro.name}</h3>
                  {s.pro.verified && <Icon name="verified" size={14} className="text-[#2563eb]" fill />}
                </div>
                <p className={\`text-sm font-medium mb-1 \${isDark?'text-[#a1a1aa]':'text-gray-600'}\`}>{s.title}</p>
                <div className="flex items-center gap-1 text-xs font-bold text-[#f97316]">
                  <Icon name="star" size={14} fill/> {s.pro.rating.toFixed(1)} 
                  <span className={\`font-normal ml-1 \${isDark?'text-gray-400':'text-gray-500'}\`}>({s.pro.reviewsCount} avaliações)</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
`

code = code.replace(/function SearchScreen/, homeScreenCode + '\nfunction SearchScreen');
fs.writeFileSync('src/App.tsx', code);

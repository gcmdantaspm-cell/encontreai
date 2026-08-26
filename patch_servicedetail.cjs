const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetRegex = /function ServiceDetailScreen\(\{[\s\S]*?^function DashboardProScreen/m;

const replacement = `function ServiceDetailScreen({ pros, user, isDark, show, toggleFavorite }: any) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookingService, setBookingService] = useState<any>(null);
  
  const allServices = useMemo(() => pros.flatMap((p:any) => (p.services || []).map((s:any) => ({ ...s, pro: p }))), [pros]);
  const initialSvc = allServices.find((s:any) => s.id === id);
  const pro = initialSvc?.pro || pros.find((p:any) => p.id === id);
  
  const { reviews } = useReviews(pro?.id);
  
  if (!pro) return <div className="p-8 text-center font-bold">Profissional não encontrado.</div>;
  const isFav = user?.favorites?.includes(pro.id);

  return (
    <div className={\`min-h-screen pb-24 overflow-y-auto hide-scrollbar relative \${isDark?'bg-[#121212] text-white':'bg-[#f8f9fa] text-[#002a5d]'}\`}>
      <div className={\`relative h-[240px] w-full \${isDark?'bg-gray-800':'bg-gray-300'}\`}>
        <img src={pro.coverUrl || pro.avatarUrl} className="w-full h-full object-cover opacity-60" />
        <div className={\`absolute inset-0 bg-gradient-to-b \${isDark?'from-black/60 via-black/20 to-[#121212]':'from-black/50 via-black/10 to-[#f8f9fa]'}\`}></div>
        
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
          <Icon name="arrow_back" className="text-white" />
        </button>
        <button onClick={() => toggleFavorite(pro.id)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
          <Icon name="favorite" fill={isFav} className={isFav ? 'text-red-500' : 'text-white'} />
        </button>
        
        <div className="absolute -bottom-10 left-4 flex items-end gap-4">
          <div className={\`w-24 h-24 rounded-full border-4 overflow-hidden \${isDark?'border-[#121212] bg-gray-800':'border-[#f8f9fa] bg-gray-200'}\`}>
            <img src={pro.avatarUrl} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
      
      <div className="px-4 mt-12 mb-6">
        <div className="flex justify-between items-start mb-1">
          <h1 className="font-black text-2xl leading-tight flex items-center gap-2">
            {pro.name}
            {pro.verified && <Icon name="verified" size={18} className="text-[#60a5fa]" fill />}
          </h1>
        </div>
        <p className={\`font-medium text-sm mb-3 \${isDark?'text-gray-400':'text-gray-500'}\`}>{pro.profession}</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-[#f97316] font-bold text-sm">
            <Icon name="star" size={16} fill/> {pro.rating.toFixed(1)} <span className={\`font-normal ml-1 \${isDark?'text-gray-500':'text-gray-400'}\`}>({pro.reviewsCount} avaliações)</span>
          </div>
        </div>
      </div>
      
      <div className="px-4 mb-8">
        <h2 className="font-black text-lg mb-4">Serviços Oferecidos</h2>
        {(!pro.services || pro.services.length === 0) ? (
          <div className="text-center py-6 opacity-50">Nenhum serviço cadastrado.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {pro.services.map((s:any) => (
              <div key={s.id} className={\`p-3 rounded-2xl border flex items-center gap-3 shadow-sm \${isDark?'bg-[#1e1e1e] border-[#2a2a2a]':'bg-white border-[#e5e7eb]'}\`}>
                 <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 shrink-0">
                   <img src={s.imageUrls?.[0] || s.imageUrl || pro.avatarUrl} className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">
                   <h3 className="font-bold text-sm leading-tight mb-1">{s.title}</h3>
                   <span className={\`font-black text-sm \${isDark?'text-[#60a5fa]':'text-blue-600'}\`}>R$ {s.price.toFixed(2)}</span>
                 </div>
                 <button onClick={() => { if(!user) { show('Faça login primeiro!'); navigate('/auth'); return; } setBookingService({ ...s, pro }); }} className="w-10 h-10 rounded-full bg-[#f97316] text-black flex items-center justify-center shrink-0 active:scale-95 transition-transform shadow-md">
                   <Icon name="calendar_month" size={18} />
                 </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 mb-8">
        <h2 className="font-black text-lg mb-4">Avaliações</h2>
        {reviews.length === 0 ? <p className="opacity-50 text-sm">Ainda não há avaliações.</p> : (
          <div className="flex flex-col gap-4">
            {reviews.map((r:any) => (
              <div key={r.id} className={\`p-4 rounded-2xl border \${isDark?'bg-[#1e1e1e] border-[#2a2a2a]':'bg-white border-[#e5e7eb]'}\`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden text-xs flex items-center justify-center">
                     {r.clientAvatarUrl ? <img src={r.clientAvatarUrl} className="w-full h-full object-cover"/> : <Icon name="person" size={16} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-none">{r.clientName}</h4>
                    <div className="flex text-[#f97316] mt-0.5">
                      {[...Array(5)].map((_,i) => <Icon key={i} name="star" size={10} fill={i<r.rating} />)}
                    </div>
                  </div>
                </div>
                <p className={\`text-sm \${isDark?'text-gray-300':'text-gray-700'}\`}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {bookingService && 
          <BookingModal 
            proId={pro.id} 
            svc={bookingService} 
            onClose={()=>setBookingService(null)} 
            onBook={async(d:any,t:any)=>{
              await addDoc(collection(db, 'appointments'), { professionalId: pro.id, clientId: user.id, clientName: user.name, serviceId: bookingService.id, serviceTitle: bookingService.title, date: d, time: t, status: 'pending', price: bookingService.price, createdAt: new Date().toISOString() });
              setBookingService(null); show('Agendamento solicitado!'); navigate('/pedidos');
            }} 
            isDark={isDark} 
          />
        }
      </AnimatePresence>
    </div>
  )
}

function DashboardProScreen`;

if (code.match(targetRegex)) {
  code = code.replace(targetRegex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Replaced ServiceDetailScreen");
} else {
  console.log("Did not match regex ServiceDetailScreen");
}

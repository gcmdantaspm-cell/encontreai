const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function ServiceDetailScreen[\s\S]*?function ProfileScreen/

const replacement = `function ServiceDetailScreen({ pros, user, isDark, show, toggleFavorite }: any) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);
  
  const allServices = useMemo(() => pros.flatMap((p:any) => (p.services || []).map((s:any) => ({ ...s, pro: p }))), [pros]);
  const svc = allServices.find((s:any) => s.id === id);
  const { reviews } = useReviews(svc?.pro?.id);
  
  if (!svc) return <div className="p-8 text-center font-bold">Serviço não encontrado.</div>;
  const isFav = user?.favorites?.includes(svc.pro.id);

  return (
    <div className="bg-[#121212] min-h-screen text-white pb-24 overflow-y-auto hide-scrollbar relative">
      <div className="relative h-[340px] w-full">
        <img src={svc.imageUrls?.[0] || svc.imageUrl || svc.pro.avatarUrl} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#121212]"></div>
        
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md">
          <Icon name="arrow_back" className="text-white" />
        </button>
        <button className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md">
          <Icon name="notifications_none" className="text-white" />
        </button>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex justify-between items-end mb-1">
            <h1 className="font-black text-2xl leading-tight flex items-center gap-2">
              {svc.pro.name}
              {svc.pro.verified && <Icon name="verified" size={18} className="text-[#60a5fa]" fill />}
            </h1>
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full text-xs font-bold text-[#f97316]">
              <Icon name="star" size={14} fill/> {svc.pro.rating.toFixed(1)}
            </div>
          </div>
          <p className="text-[#60a5fa] font-semibold text-sm">{svc.title}</p>
          
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">A partir de</p>
            <span className="font-black text-[28px]">R$ {svc.price.toFixed(2)}<span className="text-sm font-normal text-gray-400">/visita</span></span>
          </div>
        </div>
      </div>
      
      <div className="px-4 mt-6">
        <h2 className="font-bold text-lg mb-2">Sobre o Serviço</h2>
        <p className="text-sm text-gray-300 leading-relaxed mb-6">
          {svc.description || 'Especialista em manutenção residencial, instalação de equipamentos e reparos em geral. Atendimento rápido e seguro.'}
        </p>
        
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a]">
            <Icon name="speed" size={18} className="text-[#60a5fa]" />
            <span className="text-sm font-medium">Rápido</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a]">
            <Icon name="security" size={18} className="text-[#60a5fa]" />
            <span className="text-sm font-medium">Seguro</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a]">
            <Icon name="lightbulb" size={18} className="text-[#60a5fa]" />
            <span className="text-sm font-medium">Luminárias</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a]">
            <Icon name="electrical_services" size={18} className="text-[#60a5fa]" />
            <span className="text-sm font-medium">Quadros</span>
          </div>
        </div>
        
        <div className="flex justify-between items-end mb-4">
          <h2 className="font-bold text-lg">Avaliações</h2>
          <button className="text-sm font-semibold text-[#60a5fa]">Ver todas</button>
        </div>
        
        <div className="flex flex-col gap-4">
          {reviews.length > 0 ? reviews.slice(0, 3).map((r:any) => (
             <div key={r.id} className="p-4 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
               <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                     <Icon name="person" size={16} className="opacity-50" />
                   </div>
                   <h3 className="font-bold text-sm">{r.clientName}</h3>
                 </div>
                 <div className="flex gap-0.5 text-[#f97316]">
                   {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={12} fill={i<=r.rating} className={i>r.rating?'text-gray-600':''} />)}
                 </div>
               </div>
               <p className="text-xs text-gray-300 leading-relaxed">{r.text}</p>
             </div>
          )) : (
             <div className="p-4 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a]">
               <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center"><Icon name="person" size={16} className="opacity-50" /></div>
                   <h3 className="font-bold text-sm">Carlos Silva</h3>
                 </div>
                 <div className="flex gap-0.5 text-[#f97316]">
                   {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={12} fill={true} />)}
                 </div>
               </div>
               <p className="text-xs text-gray-300 leading-relaxed">Serviço excelente! Mariana foi super pontual, resolveu o problema do quadro de luz rapidamente e foi muito atenciosa. Recomendo muito.</p>
             </div>
          )}
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 w-full max-w-[448px] p-4 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent z-50">
        <button onClick={() => { if(!user) { show('Faça login primeiro!'); return; } setBooking(true); }} className="w-full py-4 rounded-xl font-black text-lg text-black bg-[#f97316] shadow-[0_4px_14px_rgba(249,115,22,0.4)] active:scale-95 transition-transform flex items-center justify-center gap-2">
          Agendar Agora <Icon name="calendar_month" size={20} />
        </button>
      </div>
      
      <AnimatePresence>{booking && <BookingModal proId={svc.pro.id} svc={svc} onClose={()=>setBooking(false)} onBook={async(d:any,t:any)=>{
        await addDoc(collection(db, 'appointments'), { professionalId: svc.pro.id, clientId: user.id, clientName: user.name, serviceId: svc.id, serviceTitle: svc.title, date: d, time: t, status: 'pending', price: svc.price, createdAt: new Date().toISOString() });
        setBooking(false); show('Agendamento solicitado!'); navigate('/pedidos');
      }} isDark={true} />}</AnimatePresence>
    </div>
  )
}

function ProfileScreen`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);

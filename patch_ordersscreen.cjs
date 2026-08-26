const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function OrdersScreen[\s\S]*?function ProDetailScreen/

const replacement = `function OrdersScreen({ user, pros, go, isDark, show }: any) {
  const { apts, updateStatus } = useAppointments(user?.id, user?.role);
  const [filter, setFilter] = useState('all');
  const [reviewModal, setReviewModal] = useState<any>(null);

  const submitReview = async (rating: number, text: string) => {
    await addDoc(collection(db, 'reviews'), {
      professionalId: reviewModal.professionalId, clientId: user.id, clientName: user.name, rating, text, createdAt: new Date().toISOString()
    });
    await updateDoc(doc(db, 'appointments', reviewModal.id), { reviewed: true });
    
    const proRef = doc(db, 'users', reviewModal.professionalId);
    const proSnap = await getDoc(proRef);
    if(proSnap.exists()) {
      const data = proSnap.data();
      const currentRating = data.rating || 5; const count = data.reviewsCount || 0;
      const newCount = count + 1; const newRating = ((currentRating * count) + rating) / newCount;
      await updateDoc(proRef, { rating: newRating, reviewsCount: newCount });
    }
    
    updateStatus(reviewModal.id, 'completed');
    setReviewModal(null);
    show('Avaliação enviada!');
  };

  if (!user) return null;
  const filtered = apts.filter(a => filter === 'all' || (filter === 'active' && (a.status === 'approved' || a.status === 'pending')) || (filter === 'done' && a.status === 'completed') || (filter === 'cancelled' && a.status === 'cancelled'));
  
  return (
    <div className="pb-8 overflow-y-auto hide-scrollbar">
      <header className={\`flex justify-between items-center px-4 pt-4 pb-2 \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <Icon name="person" className="opacity-50" />}
        </div>
        <h1 className={\`font-black text-2xl tracking-tight \${isDark?'text-white':'text-[#002a5d]'}\`}>EncontreAi</h1>
        <button className="w-10 h-10 rounded-full flex items-center justify-center"><Icon name="notifications_none" /></button>
      </header>
      
      <div className="px-4 mt-4">
        <h1 className="font-black text-2xl mb-1">{user.role==='professional' ? 'Agenda Completa' : 'Meus Pedidos'}</h1>
        <p className={\`text-sm mb-4 \${isDark?'text-[#a1a1aa]':'text-gray-600'}\`}>Acompanhe o status dos seus serviços solicitados.</p>
        
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-2">
           <button onClick={()=>setFilter('all')} className={\`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap active:scale-95 transition-transform \${filter==='all' ? 'bg-[#002a5d] text-white' : (isDark?'bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46]':'bg-[#f3f4f6] text-gray-700 border border-gray-200')}\`}>Todos</button>
           <button onClick={()=>setFilter('active')} className={\`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap active:scale-95 transition-transform \${filter==='active' ? 'bg-[#002a5d] text-white' : (isDark?'bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46]':'bg-[#f3f4f6] text-gray-700 border border-gray-200')}\`}>Em Andamento</button>
           <button onClick={()=>setFilter('done')} className={\`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap active:scale-95 transition-transform \${filter==='done' ? 'bg-[#002a5d] text-white' : (isDark?'bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46]':'bg-[#f3f4f6] text-gray-700 border border-gray-200')}\`}>Concluídos</button>
        </div>

        {filtered.length === 0 ? <p className="opacity-50 text-center py-10 font-medium">Nenhum pedido encontrado.</p> : (
          <div className="flex flex-col gap-4">
             {filtered.map(a => {
               const stCfg: Record<string, {label:string, border:string, badgeBg:string, badgeText:string}> = {
                 pending: { label: 'Em Andamento', border: '#f97316', badgeBg: isDark ? '#ffedd5' : '#ffedd5', badgeText: '#9a3412' },
                 approved: { label: 'Em Andamento', border: '#f97316', badgeBg: isDark ? '#ffedd5' : '#ffedd5', badgeText: '#9a3412' },
                 completed: { label: 'Concluído', border: '#4ade80', badgeBg: isDark ? '#bbf7d0' : '#bbf7d0', badgeText: '#166534' },
                 cancelled: { label: 'Cancelado', border: '#fca5a5', badgeBg: isDark ? '#fee2e2' : '#fee2e2', badgeText: '#991b1b' }
               };
               const cfg = stCfg[a.status] || stCfg.pending;
               const pro = pros.find((p:any) => p.id === a.professionalId);
               
               const rawDate = a.date.split('-'); 
               const fmtDate = rawDate.length === 3 ? \`\${rawDate[2]} \${['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(rawDate[1])-1]}\` : a.date;
               
               return (
                 <div key={a.id} className={\`relative overflow-hidden rounded-2xl border shadow-sm p-4 flex flex-col gap-3 \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
                   <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{backgroundColor: cfg.border}} />
                   <div className="flex justify-between items-start pl-1">
                     <div className="flex gap-3">
                       {user.role === 'client' && pro?.avatarUrl ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"><img src={pro.avatarUrl} className="w-full h-full object-cover"/></div>
                       ) : <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0"><Icon name="person" className="opacity-50" /></div>}
                       <div>
                         <div className="flex items-center gap-1 mb-0.5">
                           <h3 className="font-bold text-[15px]">{user.role === 'client' ? pro?.name : a.clientName}</h3>
                           {user.role === 'client' && pro?.verified && <Icon name="verified" size={14} className="text-[#2563eb]" fill />}
                         </div>
                         <p className={\`text-xs font-medium \${isDark?'text-[#a1a1aa]':'text-gray-600'}\`}>{a.serviceTitle}</p>
                       </div>
                     </div>
                     <span className="px-2 py-1 rounded text-[10px] font-bold shrink-0" style={{backgroundColor: cfg.badgeBg, color: cfg.badgeText}}>{cfg.label}</span>
                   </div>
                   
                   <div className={\`mt-2 pt-3 border-t flex justify-between items-center pl-1 \${isDark?'border-[#3f3f46]':'border-[#e5e7eb]'}\`}>
                     <p className={\`text-xs font-medium \${isDark?'text-[#a1a1aa]':'text-gray-600'}\`}>
                       {a.status==='cancelled'?'Data original:':(a.status==='completed'?'Realizado:':'Agendado:')} {fmtDate}, {a.time}
                     </p>
                     <span className={\`font-black text-sm \${a.status==='cancelled'?'line-through opacity-50':(isDark?'text-[#60a5fa]':'text-[#002a5d]')}\`}>
                       R$ {a.price.toFixed(2)}
                     </span>
                   </div>

                   {/* Pro Controls */}
                   {user.role === 'professional' && a.status === 'approved' && (
                     <div className="flex gap-2 mt-2">
                       <button onClick={()=>updateStatus(a.id, 'completed')} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-bold active:scale-95">Marcar Concluído</button>
                     </div>
                   )}
                   {user.role === 'professional' && a.status === 'pending' && (
                     <div className="flex gap-2 mt-2">
                       <button onClick={()=>updateStatus(a.id, 'approved')} className="flex-1 py-2 bg-[#f97316] text-black rounded-lg text-xs font-bold active:scale-95">Aceitar</button>
                       <button onClick={()=>updateStatus(a.id, 'cancelled')} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold active:scale-95">Recusar</button>
                     </div>
                   )}
                   
                   {/* Client Controls */}
                   {user.role === 'client' && a.status === 'completed' && !a.reviewed && (
                     <button onClick={()=>setReviewModal(a)} className="w-full mt-2 py-2 bg-[#f97316] text-black rounded-lg text-xs font-bold active:scale-95">Avaliar Serviço</button>
                   )}
                 </div>
               )
             })}
          </div>
        )}
      </div>
      <AnimatePresence>{reviewModal && <ReviewModal a={reviewModal} onClose={()=>setReviewModal(null)} onSubmit={submitReview} isDark={isDark} />}</AnimatePresence>
    </div>
  )
}

function ProDetailScreen`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);

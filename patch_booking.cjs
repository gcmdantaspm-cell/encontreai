const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function BookingModal\(\{ proId, svc, onClose, onBook, isDark \}: any\) \{[\s\S]*?<\/>\n  \)\n\}/m;

const replacement = `function BookingModal({ proId, svc, onClose, onBook, isDark }: any) {
  const [d, setD] = useState(''); 
  const [t, setT] = useState('');
  
  // Phase 2: Add-ons & Recurrence
  const MOCK_ADDONS = [
    { id: 'a1', name: 'Atendimento Expresso', price: 20 },
    { id: 'a2', name: 'Garantia Estendida', price: 15 },
    { id: 'a3', name: 'Produto Ecológico', price: 10 }
  ];
  const addons = svc.addons || MOCK_ADDONS;
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  
  const [recurrence, setRecurrence] = useState<'once'|'weekly'|'biweekly'>('once');
  
  const occupiedTimes = useProviderSchedule(proId, d);
  
  const dayOfWeek = d ? new Date(d + 'T00:00:00').getDay() : -1;
  const isDayAvailable = svc.availableDays ? svc.availableDays.includes(dayOfWeek) : true;
  const availableHours = svc.availableHours?.length > 0 ? svc.availableHours : ['08:00','09:30','11:00','14:00','15:30','17:00'];

  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for(let i=0; i<14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const nextDays = getNextDays();
  
  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
  const addonTotal = addons.filter((a:any) => selectedAddons.includes(a.id)).reduce((acc:number, a:any) => acc + a.price, 0);
  const totalPrice = svc.price + addonTotal;

  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-[#f8f9fa] dark:bg-[#121212] z-[100] overflow-y-auto hide-scrollbar pb-36">
        
        <header className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1e1e1e] sticky top-0 z-10">
          <button onClick={onClose} className="p-2"><Icon name="arrow_back" className="text-[#002a5d] dark:text-white" /></button>
          <h1 className="font-black text-xl text-[#002a5d] dark:text-white tracking-tight">Confirmar Agendamento</h1>
        </header>
        
        <div className="p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-4 flex gap-4 mb-6 shadow-sm">
            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 relative">
               <img src={svc.pro.avatarUrl} className="w-full h-full object-cover" />
               {svc.pro.verified && <div className="absolute top-2 right-2 p-0.5 bg-white rounded-full flex items-center justify-center"><Icon name="verified" size={16} className="text-blue-600" fill/></div>}
            </div>
            <div className="flex flex-col justify-center">
               <h3 className="font-black text-lg text-gray-900 dark:text-white leading-tight mb-1">{svc.pro.name}</h3>
               <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{svc.title}</p>
               <div className="flex items-center gap-1 text-xs font-bold text-[#f97316]">
                  <Icon name="star" size={14} fill/> {svc.pro.rating.toFixed(1)} 
                  <span className="font-normal ml-1 text-gray-500">({svc.pro.reviewsCount || 0} avaliações)</span>
               </div>
            </div>
          </div>

          <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Escolha a Data</h2>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 mb-6">
            {nextDays.map(date => {
              const iso = date.toISOString().split('T')[0];
              const isSelected = d === iso;
              const weekDay = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][date.getDay()];
              const dayNum = date.getDate();
              return (
                <button 
                  key={iso} 
                  onClick={() => { setD(iso); setT(''); }}
                  className={\`w-[72px] shrink-0 aspect-[3/4] rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors \${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 dark:border-blue-400' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a]'}\`}
                >
                  <span className={\`text-xs font-bold \${isSelected ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}\`}>{weekDay}</span>
                  <span className={\`text-xl font-black \${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}\`}>{dayNum}</span>
                </button>
              )
            })}
          </div>

          <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Horários Disponíveis</h2>
          {!d ? (
            <p className="text-sm text-gray-500 font-medium mb-6">Selecione uma data para ver os horários.</p>
          ) : !isDayAvailable ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold text-center mb-6">
              O profissional não atende neste dia.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {availableHours.map((h: string) => {
                const isOccupied = occupiedTimes.includes(h);
                const isSelected = t === h;
                return (
                  <button 
                    key={h} 
                    disabled={isOccupied} 
                    onClick={()=>setT(h)} 
                    className={\`py-3 rounded-xl text-sm font-bold border transition-colors \${isOccupied ? 'opacity-30 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-[#2a2a2a] cursor-not-allowed text-gray-400' : isSelected ? 'bg-[#ffedd5] dark:bg-[#f97316] text-[#9a3412] dark:text-black border-[#f97316]' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a] text-gray-800 dark:text-gray-200'}\`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          )}
          
          <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Serviços Adicionais (Modulares)</h2>
          <div className="flex flex-col gap-3 mb-6">
            {addons.map((a:any) => {
              const isSelected = selectedAddons.includes(a.id);
              return (
                <label key={a.id} className={\`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors \${isSelected ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a]'}\`}>
                  <div className="flex items-center gap-3">
                    <div className={\`w-6 h-6 rounded border flex items-center justify-center \${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'}\`}>
                      {isSelected && <Icon name="check" size={16} />}
                    </div>
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{a.name}</span>
                  </div>
                  <span className="font-black text-sm text-[#002a5d] dark:text-[#60a5fa]">+ R$ {a.price.toFixed(2)}</span>
                  <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleAddon(a.id)} />
                </label>
              );
            })}
          </div>

          <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Tornar este agendamento recorrente?</h2>
          <div className="flex bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden mb-6">
            <button onClick={() => setRecurrence('once')} className={\`flex-1 py-3 text-xs font-bold transition-colors \${recurrence === 'once' ? 'bg-[#3730a3] text-white' : 'text-gray-500 dark:text-gray-400'}\`}>Única vez</button>
            <button onClick={() => setRecurrence('weekly')} className={\`flex-1 py-3 text-xs font-bold transition-colors border-x border-gray-200 dark:border-[#2a2a2a] \${recurrence === 'weekly' ? 'bg-[#3730a3] text-white' : 'text-gray-500 dark:text-gray-400'}\`}>Semanal</button>
            <button onClick={() => setRecurrence('biweekly')} className={\`flex-1 py-3 text-xs font-bold transition-colors \${recurrence === 'biweekly' ? 'bg-[#3730a3] text-white' : 'text-gray-500 dark:text-gray-400'}\`}>Quinzenal</button>
          </div>

        </div>
        
        <div className="fixed bottom-0 left-0 w-full max-w-[448px] bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-[#2a2a2a] p-4 z-[101]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total {recurrence !== 'once' && \`(por sessão)\`}</span>
            <span className="font-black text-xl text-[#002a5d] dark:text-[#60a5fa]">R$ {totalPrice.toFixed(2)}</span>
          </div>
          <button onClick={() => onBook(d,t, selectedAddons, recurrence)} disabled={!d||!t||!isDayAvailable} className="w-full py-4 rounded-xl font-black text-lg text-black disabled:opacity-50 bg-[#f97316] active:scale-95 transition-transform">Confirmar Agendamento</button>
        </div>
      </motion.div>
    </>
  )
}`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched BookingModal successfully");
} else {
  console.log("Regex didn't match BookingModal");
}

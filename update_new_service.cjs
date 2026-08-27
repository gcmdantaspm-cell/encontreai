const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const startStr = 'function ProNewServiceView({ user, isDark, show }: any) {';
const startIndex = code.indexOf(startStr);
if (startIndex === -1) {
    console.error("Not found");
    process.exit(1);
}

// Find where the next major component starts or end of the router block
const nextComponentStart = code.indexOf('\nfunction', startIndex + 50);

const codeToKeepBefore = code.substring(0, startIndex);
const codeToKeepAfter = nextComponentStart !== -1 ? code.substring(nextComponentStart) : '';

const newComponent = `function ProNewServiceView({ user, isDark, show }: any) {
  const { add } = useServices(user?.id);
  const navigate = useNavigate();

  const [t, setT] = useState('');
  const [p, setP] = useState('');
  const [cat, setCat] = useState('');
  const [desc, setDesc] = useState('');
  const [imgs, setImgs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFiles = async (e: any) => {
    if(!e.target.files?.length) return;
    const files = Array.from(e.target.files) as File[];
    if(imgs.length + files.length > 3) { show('Máximo de 3 fotos permitidas!'); return; }
    setUploading(true);
    const newB64s: string[] = [];
    for(const f of files) {
      if(f.size > 5*1024*1024) { show('Foto muito grande, max 5MB.'); continue; }
      try { const b64 = await compressImage(f); newB64s.push(b64); } catch(err) { console.error(err); }
    }
    setImgs([...imgs, ...newB64s].slice(0,3));
    setUploading(false);
  };

  const handleSave = async () => {
    const newErrs: any = {};
    if(!t.trim()) newErrs.t = 'Este campo é obrigatório.';
    if(!cat) newErrs.cat = 'Este campo é obrigatório.';
    if(!p || isNaN(Number(p))) newErrs.p = 'Este campo é obrigatório.';
    if(!desc.trim()) newErrs.desc = 'Este campo é obrigatório.';
    if(imgs.length === 0) newErrs.imgs = 'Adicione pelo menos uma foto de capa.';
    
    if(Object.keys(newErrs).length > 0) {
      setErrors(newErrs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    
    const defaultDays = [1,2,3,4,5];
    const defaultHours = ['09:00','10:00','14:00','15:00'];
    const defaultPay = ['Pix','Cartão de Crédito'];

    await add({
      title: t, price: Number(p), description: desc, categoryId: cat, 
      imageUrls: imgs, availableDays: defaultDays, availableHours: defaultHours, paymentMethods: defaultPay
    });
    
    setIsSubmitting(false);
    show('Serviço publicado com sucesso!');
    navigate('/painel-profissional/servicos');
  };

  return (
    <div className="pb-24 max-w-6xl mx-auto w-full">
      <div className="p-4 md:p-8">
        <h1 className="font-black text-2xl md:text-3xl mb-2">Publicar Novo Serviço</h1>
        <p className={\`text-sm mb-8 \${isDark?'text-[#a1a1aa]':'text-gray-600'}\`}>Preencha os dados abaixo para anunciar seu serviço na plataforma.</p>

        <div className={\`p-5 md:p-8 rounded-3xl border shadow-sm \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Esquerda: Upload de Imagem */}
            <div className="lg:col-span-5 flex flex-col">
              <label className="text-sm font-bold mb-3 block">Foto de Capa (Até 3) *</label>
              <div className={\`flex-1 min-h-[250px] w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center transition-colors shadow-sm \${isDark?'border-[#3f3f46] bg-[#18181b] hover:bg-[#27272a]':'border-[#d1d5db] bg-[#f8f9fa] hover:bg-gray-50'}\`}>
                 {imgs.length > 0 ? (
                    <div className="w-full h-full flex flex-col items-center">
                      <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 shadow-md">
                        <img src={imgs[0]} className="w-full h-full object-cover" />
                        <button onClick={()=>setImgs(imgs.filter((_,j)=>j!==0))} className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white rounded-full p-2 hover:bg-black/80 transition-colors"><Icon name="delete" size={16}/></button>
                      </div>
                      {imgs.length > 1 && (
                        <div className="flex gap-2 w-full overflow-x-auto hide-scrollbar">
                          {imgs.slice(1).map((src, i) => (
                            <div key={i+1} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden shadow-sm">
                              <img src={src} className="w-full h-full object-cover" />
                              <button onClick={()=>setImgs(imgs.filter((_,j)=>j!==i+1))} className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white rounded-full p-1"><Icon name="close" size={12}/></button>
                            </div>
                          ))}
                          {imgs.length < 3 && (
                            <label className="w-20 h-20 shrink-0 rounded-lg border-2 border-dashed border-gray-300 dark:border-[#3f3f46] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-[#27272a] transition-colors">
                              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} disabled={uploading}/>
                              <Icon name="add" size={24} className="opacity-50" />
                            </label>
                          )}
                        </div>
                      )}
                      {imgs.length === 1 && (
                        <label className="px-6 py-2 rounded-full border border-gray-300 dark:border-[#3f3f46] text-sm font-bold cursor-pointer hover:bg-gray-100 dark:hover:bg-[#27272a] transition-colors mt-auto">
                           <input type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} disabled={uploading}/>
                           Adicionar mais fotos
                        </label>
                      )}
                    </div>
                 ) : (
                   <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                     <input type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} disabled={uploading}/>
                     {uploading ? <div className="w-8 h-8 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"/> : (
                       <>
                         <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 text-[#f97316] flex items-center justify-center mb-4">
                            <Icon name="add_photo_alternate" size={32} />
                         </div>
                         <span className="font-bold text-base md:text-lg mb-1">Arraste ou clique aqui</span>
                         <span className="text-xs opacity-60">PNG, JPG até 5MB</span>
                       </>
                     )}
                   </label>
                 )}
              </div>
              {errors.imgs && <p className="text-sm text-red-500 mt-2 font-bold">{errors.imgs}</p>}
            </div>

            {/* Direita: Formulário */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div>
                <label className="text-sm font-bold mb-2 block">Nome do Serviço *</label>
                <input value={t} onChange={e=>{setT(e.target.value); setErrors({...errors, t: null});}} placeholder="Ex: Limpeza Pós-Obra, Corte Degradê" className={\`w-full p-4 rounded-xl border outline-none text-sm font-medium focus:ring-2 focus:ring-[#f97316]/50 focus:border-[#f97316] transition-all \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}\`} />
                {errors.t && <p className="text-sm text-red-500 mt-2 font-bold">{errors.t}</p>}
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1">
                  <label className="text-sm font-bold mb-2 block">Categoria *</label>
                  <div className="relative">
                    <select value={cat} onChange={e=>{setCat(e.target.value); setErrors({...errors, cat: null});}} className={\`w-full p-4 rounded-xl border outline-none text-sm font-medium appearance-none focus:ring-2 focus:ring-[#f97316]/50 focus:border-[#f97316] transition-all \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}\`}>
                      <option value="">Selecione...</option>
                      {CATEGORIES.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Icon name="expand_more" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                  </div>
                  {errors.cat && <p className="text-sm text-red-500 mt-2 font-bold">{errors.cat}</p>}
                </div>
                <div className="flex-1">
                  <label className="text-sm font-bold mb-2 block">Preço (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold opacity-50 text-sm">R$</span>
                    <input type="number" step="0.01" value={p} onChange={e=>{setP(e.target.value); setErrors({...errors, p: null});}} placeholder="0,00" className={\`w-full p-4 pl-12 rounded-xl border outline-none text-sm font-medium focus:ring-2 focus:ring-[#f97316]/50 focus:border-[#f97316] transition-all \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}\`} />
                  </div>
                  {errors.p && <p className="text-sm text-red-500 mt-2 font-bold">{errors.p}</p>}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <label className="text-sm font-bold mb-2 block">Descrição *</label>
                <textarea value={desc} onChange={e=>{setDesc(e.target.value); setErrors({...errors, desc: null});}} placeholder="Detalhe o que está incluso no seu serviço..." className={\`w-full flex-1 min-h-[120px] p-4 rounded-xl border outline-none text-sm font-medium focus:ring-2 focus:ring-[#f97316]/50 focus:border-[#f97316] transition-all resize-none \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}\`} />
                {errors.desc && <p className="text-sm text-red-500 mt-2 font-bold">{errors.desc}</p>}
              </div>

              <div className="flex gap-4 mt-2 pt-4 border-t dark:border-[#3f3f46]">
                <button onClick={() => navigate('/painel-profissional/servicos')} className={\`flex-1 py-4 font-bold rounded-xl border transition-colors \${isDark?'border-[#3f3f46] text-white hover:bg-[#3f3f46]':'border-gray-300 text-gray-700 hover:bg-gray-100'}\`}>Cancelar</button>
                <button onClick={handleSave} disabled={isSubmitting} className="flex-[2] py-4 font-black rounded-xl bg-[#f97316] text-black disabled:opacity-70 hover:bg-[#ea580c] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/> : 'Publicar Serviço'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}`;

fs.writeFileSync('src/App.tsx', codeToKeepBefore + newComponent + codeToKeepAfter);
console.log('Done!');

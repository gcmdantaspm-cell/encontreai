const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newChat = `function ChatDetailScreen({ user, isDark }: any) {
  const navigate = useNavigate();
  const { id: partnerId } = useParams();
  const { msgs, send, updateMessage } = useChat(user?.id);
  const [text, setText] = useState('');
  const [proposing, setProposing] = useState(false);
  const [proposalPrice, setProposalPrice] = useState('');
  const [checkoutProposal, setCheckoutProposal] = useState<any>(null);
  const { add } = useAppointments(user?.id, user?.role);
  
  const chatMsgs = msgs.filter((m:any) => (m.senderId===user?.id && m.receiverId===partnerId) || (m.senderId===partnerId && m.receiverId===user?.id));

  const handleSendProposal = (price: number) => {
    if(partnerId) {
      send(partnerId, \`Proposta de Serviço: R$ \${price.toFixed(2)}\`, 'proposal', { price, status: 'pending' });
    }
  };

  const handleCounter = (msg: any, newPrice: number) => {
    if(partnerId) {
      updateMessage(msg.id, { 'proposal.status': 'countered' });
      send(partnerId, \`Contraproposta: R$ \${newPrice.toFixed(2)}\`, 'proposal', { price: newPrice, status: 'pending' });
    }
  };

  const handleAccept = (msg: any) => {
    updateMessage(msg.id, { 'proposal.status': 'accepted' });
  };

  const handleReject = (msg: any) => {
    updateMessage(msg.id, { 'proposal.status': 'rejected' });
  };
  
  const handlePaymentComplete = async () => {
    if(checkoutProposal) {
      // Simulate booking & payment
      await add({ professionalId: checkoutProposal.senderId === user.id ? partnerId : checkoutProposal.senderId, clientId: user.id, clientName: user.name, serviceId: 'custom', serviceTitle: 'Serviço Personalizado', price: checkoutProposal.proposal.price, date: new Date().toISOString().split('T')[0], time: 'A Combinar', status: 'paid' });
      setCheckoutProposal(null);
    }
  };

  return (
    <div className={\`flex flex-col h-screen \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
      <header className={\`border-b p-4 flex items-center gap-3 \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white'}\`}>
        <button onClick={()=>navigate(-1)}><Icon name="arrow_back" /></button>
        <h2 className="font-bold">Conversa</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {chatMsgs.map((m:any) => {
          const isMine = m.senderId === user?.id;
          if (m.type === 'proposal' && m.proposal) {
             const p = m.proposal;
             return (
               <div key={m.id} className={\`w-full max-w-[280px] rounded-2xl p-4 shadow-sm border \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'} \${isMine ? 'self-end' : 'self-start'}\`}>
                 <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-sm">Proposta de Serviço</h3>
                   <Icon name="request_quote" className="text-[#f97316]" size={18} />
                 </div>
                 <p className={\`text-2xl font-black mb-3 \${isDark?'text-white':'text-black'}\`}>R$ {p.price.toFixed(2)}</p>
                 
                 {p.status === 'pending' && (
                   <div className="flex flex-col gap-2">
                     {!isMine ? (
                       <>
                         <button onClick={()=>handleAccept(m)} className="w-full py-2 bg-[#f97316] text-black font-bold rounded-lg text-sm active:scale-95 transition-transform">Aceitar Acordo</button>
                         <button onClick={()=>{
                           const cp = prompt('Digite o valor da contraproposta:');
                           if(cp && !isNaN(Number(cp))) handleCounter(m, Number(cp));
                         }} className={\`w-full py-2 border font-bold rounded-lg text-sm active:scale-95 transition-transform \${isDark?'border-[#3f3f46] text-white':'border-gray-300 text-black'}\`}>Fazer Contraproposta</button>
                         <button onClick={()=>handleReject(m)} className="w-full py-2 bg-red-50 text-red-500 dark:bg-red-500/10 font-bold rounded-lg text-sm active:scale-95 transition-transform">Recusar</button>
                       </>
                     ) : (
                       <p className="text-xs text-orange-500 font-bold">Aguardando resposta...</p>
                     )}
                   </div>
                 )}
                 {p.status === 'accepted' && (
                   <div className="flex flex-col gap-2">
                     <span className="text-xs font-bold text-green-500 flex items-center gap-1"><Icon name="check_circle" size={14}/> Acordo Fechado</span>
                     {(!isMine || user?.role === 'client') && (
                       <button onClick={()=>setCheckoutProposal(m)} className="w-full mt-2 py-2 bg-green-500 text-white font-black rounded-lg text-sm shadow-md active:scale-95 transition-transform">Pagar Agora</button>
                     )}
                   </div>
                 )}
                 {p.status === 'rejected' && <span className="text-xs font-bold text-red-500">Proposta Recusada</span>}
                 {p.status === 'countered' && <span className="text-xs font-bold text-gray-500">Contraproposta enviada</span>}
               </div>
             );
          }
          return (
            <div key={m.id} className={\`max-w-[80%] rounded-xl p-3 text-sm \${isMine ? 'bg-[#f97316] text-black self-end rounded-br-sm' : (isDark?'bg-[#3f3f46] text-white':'bg-[#e1e3e4] text-[#191c1d]') + ' self-start rounded-bl-sm'}\`}>{m.text}</div>
          );
        })}
      </div>
      
      {proposing && (
        <div className={\`p-3 border-t flex gap-2 items-center \${isDark?'bg-[#1e1e1e] border-[#3f3f46]':'bg-gray-50'}\`}>
           <Icon name="request_quote" className="text-gray-400" />
           <input type="number" value={proposalPrice} onChange={e=>setProposalPrice(e.target.value)} placeholder="Valor da proposta..." className={\`flex-1 rounded-lg px-3 py-2 outline-none text-sm border \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white'}\`} />
           <button onClick={()=>{if(proposalPrice) { handleSendProposal(Number(proposalPrice)); setProposing(false); setProposalPrice(''); }}} className="px-4 py-2 bg-[#f97316] text-black font-bold rounded-lg text-sm active:scale-95">Enviar</button>
           <button onClick={()=>setProposing(false)} className="px-3 py-2 text-gray-400 font-bold text-sm">X</button>
        </div>
      )}

      <div className={\`p-4 border-t flex gap-2 pb-8 items-center \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white'}\`}>
        <button onClick={() => setProposing(!proposing)} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-colors \${isDark?'bg-[#3f3f46] text-[#a1a1aa] hover:bg-[#52525b]':'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`} title="Fazer Proposta">
          <Icon name="request_quote" size={20} />
        </button>
        <button onClick={() => { if(partnerId) send(partnerId, '📷 [Anexo de Imagem da situação]', 'text'); }} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-colors \${isDark?'bg-[#3f3f46] text-[#a1a1aa] hover:bg-[#52525b]':'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`} title="Anexar Imagem">
          <Icon name="attach_file" size={20} />
        </button>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&text&&partnerId){send(partnerId,text,'text');setText('');}}} placeholder="Mensagem..." className={\`flex-1 border rounded-full px-4 py-3 outline-none text-sm \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white'}\`} />
        <button onClick={()=>{if(text&&partnerId){send(partnerId,text,'text');setText('');}}} className="w-10 h-10 rounded-full bg-[#f97316] flex items-center justify-center text-black shrink-0"><Icon name="send" size={20} /></button>
      </div>
      
      <AnimatePresence>
        {checkoutProposal && <CheckoutModal p={checkoutProposal} onClose={()=>setCheckoutProposal(null)} onPay={handlePaymentComplete} isDark={isDark} />}
      </AnimatePresence>
    </div>
  );
}
`;

const regex = /function ChatDetailScreen\(\{ user, isDark \}: any\) \{[\s\S]*?<\/>\n  \);\n\}|function ChatDetailScreen\(\{ user, isDark \}: any\) \{[\s\S]*?\n  \);\n\}/m;
if (code.match(regex)) {
  code = code.replace(regex, newChat);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched ChatDetailScreen successfully");
} else {
  console.log("Regex didn't match ChatDetailScreen");
}

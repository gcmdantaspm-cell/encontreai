const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update state to include date and time
code = code.replace(
  "const [proposalPrice, setProposalPrice] = useState('');",
  "const [proposalPrice, setProposalPrice] = useState('');\n  const [proposalDate, setProposalDate] = useState('');\n  const [proposalTime, setProposalTime] = useState('');"
);

// Update handleSendProposal to take date and time
code = code.replace(
  "const handleSendProposal = (price: number) => {",
  "const handleSendProposal = (price: number, date: string, time: string) => {"
);

code = code.replace(
  "send(partnerId, `Proposta de Serviço: R$ ${price.toFixed(2)}`, 'proposal', { price, status: 'pending' });",
  "send(partnerId, `Proposta de Serviço: R$ ${price.toFixed(2)} - ${date} às ${time}`, 'proposal', { price, date, time, status: 'pending' });"
);

// Update proposing UI
const proposingUIRegex = /\{proposing && \([\s\S]*?<div className=\{\`p-3 border-t flex gap-2 items-center \$\{isDark\?'bg-\[#1e1e1e\] border-\[#3f3f46\]':'bg-gray-50'\}\`\}>[\s\S]*?<Icon name="request_quote" className="text-gray-400" \/>[\s\S]*?<input type="number" value=\{proposalPrice\} onChange=\{e=>setProposalPrice\(e\.target\.value\)\} placeholder="Valor da proposta\.\.\." className=\{\`flex-1 rounded-lg px-3 py-2 outline-none text-sm border \$\{isDark\?'bg-\[#18181b\] border-\[#3f3f46\] text-white':'bg-white'\}\`\} \/>[\s\S]*?<button onClick=\{\(\)=>\{if\(proposalPrice\) \{ handleSendProposal\(Number\(proposalPrice\)\); setProposing\(false\); setProposalPrice\(''\); \}\}\} className="px-4 py-2 bg-\[#f97316\] text-black font-bold rounded-lg text-sm active:scale-95">Enviar<\/button>[\s\S]*?<button onClick=\{\(\)=>setProposing\(false\)\} className="px-3 py-2 text-gray-400 font-bold text-sm">X<\/button>[\s\S]*?<\/div>[\s\S]*?\)\}/;

const newProposingUI = `{proposing && (
        <div className={\`p-3 border-t flex flex-col gap-2 \${isDark?'bg-[#1e1e1e] border-[#3f3f46]':'bg-gray-50'}\`}>
           <div className="flex gap-2">
             <input type="date" value={proposalDate} onChange={e=>setProposalDate(e.target.value)} className={\`flex-1 rounded-lg px-3 py-2 outline-none text-sm border \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white'}\`} />
             <input type="time" value={proposalTime} onChange={e=>setProposalTime(e.target.value)} className={\`flex-1 rounded-lg px-3 py-2 outline-none text-sm border \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white'}\`} />
           </div>
           <div className="flex gap-2 items-center">
             <Icon name="request_quote" className="text-gray-400" />
             <input type="number" value={proposalPrice} onChange={e=>setProposalPrice(e.target.value)} placeholder="Valor (R$)" className={\`flex-1 rounded-lg px-3 py-2 outline-none text-sm border \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white'}\`} />
             <button onClick={()=>{if(proposalPrice && proposalDate && proposalTime) { handleSendProposal(Number(proposalPrice), proposalDate, proposalTime); setProposing(false); setProposalPrice(''); setProposalDate(''); setProposalTime(''); }}} className="px-4 py-2 bg-[#f97316] text-black font-bold rounded-lg text-sm active:scale-95">Enviar</button>
             <button onClick={()=>setProposing(false)} className="px-3 py-2 text-gray-400 font-bold text-sm">X</button>
           </div>
        </div>
      )}`;

code = code.replace(proposingUIRegex, newProposingUI);

fs.writeFileSync('src/App.tsx', code);
console.log('Updated proposal UI to include date and time');

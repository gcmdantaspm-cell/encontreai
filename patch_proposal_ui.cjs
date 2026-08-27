const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{p.status === 'accepted' && \([\s\S]*?<\/div>\n                 \)\}/m;

const replacement = `{p.status === 'accepted' && (
                   <div className="flex flex-col gap-2">
                     <span className="text-xs font-bold text-green-500 flex items-center gap-1"><Icon name="check_circle" size={14}/> Acordo Fechado</span>
                     {(!isMine || user?.role === 'client') && (
                       <button onClick={()=>setCheckoutProposal(m)} className="w-full mt-2 py-2 bg-green-500 text-white font-black rounded-lg text-sm shadow-md active:scale-95 transition-transform">Pagar Agora</button>
                     )}
                   </div>
                 )}
                 {p.status === 'paid' && (
                   <div className="flex flex-col gap-2 mt-2">
                     <span className="text-xs font-bold text-blue-500 flex items-center gap-1"><Icon name="verified_user" size={14}/> Pago (Valor Retido)</span>
                   </div>
                 )}`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched Proposal UI successfully");
} else {
  console.log("Regex didn't match Proposal UI");
}

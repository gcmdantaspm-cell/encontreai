const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexChat = /\{p\.status === 'accepted' && \(\s*<div className="flex flex-col gap-2">\s*<span className="text-xs font-bold text-green-500 flex items-center gap-1"><Icon name="check_circle" size=\{14\}\/> Acordo Fechado<\/span>\s*\{\(!isMine \|\| user\?\.role === 'client'\) && \(\s*<button onClick=\{\(\)=>setCheckoutProposal\(m\)\} className="w-full mt-2 py-2 bg-green-500 text-white font-black rounded-lg text-sm shadow-md active:scale-95 transition-transform">Pagar Agora<\/button>\s*\)\}\s*<\/div>\s*\)\}/;

const replacementChat = `{p.status === 'accepted' && (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-bold text-green-500 flex items-center gap-1"><Icon name="check_circle" size={14}/> Acordo Fechado</span>
    {user?.role === 'client' ? (
      <button onClick={()=>setCheckoutProposal(m)} className="w-full mt-2 py-2 bg-green-500 text-white font-black rounded-lg text-sm shadow-md active:scale-95 transition-transform">Pagar Agora</button>
    ) : (
      <span className="text-xs font-bold text-orange-500 flex items-center gap-1"><Icon name="hourglass_empty" size={14}/> Pagamento pendente</span>
    )}
  </div>
)}
`;

code = code.replace(regexChat, replacementChat);

const regexPaid = /\{p\.status === 'paid' && \(\s*<div className="flex flex-col gap-2 mt-2">\s*<span className="text-xs font-bold text-blue-500 flex items-center gap-1"><Icon name="verified_user" size=\{14\}\/> Pago \(Valor Retido\)<\/span>\s*<\/div>\s*\)\}/;

const replacementPaid = `{p.status === 'paid' && (
  <div className="flex flex-col gap-2 mt-2">
    <span className="text-xs font-bold text-blue-500 flex items-center gap-1"><Icon name="verified_user" size={14}/> Pagamento feito (Valor retido)</span>
  </div>
)}`;
code = code.replace(regexPaid, replacementPaid);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed chat details screen');

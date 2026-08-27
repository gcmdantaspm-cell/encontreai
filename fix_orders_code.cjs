const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\/\* Pro Controls \*\/\}\s*\{user\.role === 'professional' && a\.status === 'approved' && \(\s*<div className="flex gap-2 mt-2">\s*<button onClick=\{\(\)=>updateStatus\(a\.id, 'completed'\)\} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-bold active:scale-95">Marcar Concluído<\/button>\s*<\/div>\s*\)\}\s*\{user\.role === 'professional' && a\.status === 'pending' && \(/;

const newProCode = `{/* Pro Controls */}
                   {user.role === 'professional' && a.status === 'approved' && (
                     <div className="flex flex-col gap-2 mt-2 p-3 bg-gray-50 dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-[#3f3f46]">
                       <p className="text-xs text-center font-bold">Inserir Código do Cliente</p>
                       <div className="flex gap-2">
                         <input id={\`code-\${a.id}\`} placeholder="EX: A1B2" className={\`flex-1 px-3 py-2 border rounded-lg text-center font-bold uppercase \${isDark ? 'bg-[#18181b] border-[#3f3f46]' : 'bg-white'}\`} maxLength={4} />
                         <button onClick={() => {
                           const el = document.getElementById(\`code-\${a.id}\`) as HTMLInputElement;
                           const confirmCode = (a.id.length >= 4 ? a.id.slice(-4) : (a.id + '0000').slice(0,4)).toUpperCase();
                           if (el?.value.toUpperCase() === confirmCode) {
                              updateStatus(a.id, 'completed');
                              if(show) show('Código confirmado! 93% do valor foi creditado.');
                           } else {
                              if(show) show('Código inválido. Tente novamente.');
                           }
                         }} className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-bold active:scale-95">Validar</button>
                       </div>
                     </div>
                   )}
                   {user.role === 'professional' && a.status === 'pending' && (`;

code = code.replace(regex, newProCode);


const clientRegex = /\{\/\* Client Controls \*\/\}\s*\{user\.role === 'client' && a\.status === 'approved' && \(\s*<div className="flex gap-2 mt-2">\s*<button onClick=\{\(\)=>updateStatus\(a\.id, 'completed'\)\} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-bold active:scale-95">Concluir Atendimento<\/button>\s*<\/div>\s*\)\}/;

const newClientCode = `{/* Client Controls */}
                   {user.role === 'client' && a.status === 'approved' && (
                     <div className="flex flex-col gap-2 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                       <p className="text-xs text-center font-bold text-blue-600 dark:text-blue-400">Código de Liberação</p>
                       <p className="text-2xl text-center font-black tracking-widest text-[#002a5d] dark:text-white">{(a.id.length >= 4 ? a.id.slice(-4) : (a.id + '0000').slice(0,4)).toUpperCase()}</p>
                       <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">Forneça este código ao profissional apenas após a conclusão do serviço para liberar o pagamento.</p>
                     </div>
                   )}`;

code = code.replace(clientRegex, newClientCode);

fs.writeFileSync('src/App.tsx', code);
console.log('Orders codes modified');

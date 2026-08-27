const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\/\* Client Controls \*\/\}\s*\{user\.role === 'client' && a\.status === 'completed' && !a\.reviewed && \(/;

const newCode = `{/* Client Controls */}
                   {user.role === 'client' && a.status === 'approved' && (
                     <div className="flex gap-2 mt-2">
                       <button onClick={()=>updateStatus(a.id, 'completed')} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-bold active:scale-95">Concluir Atendimento</button>
                     </div>
                   )}
                   {user.role === 'client' && a.status === 'completed' && !a.reviewed && (`;

code = code.replace(regex, newCode);

fs.writeFileSync('src/App.tsx', code);
console.log('Added client complete button');

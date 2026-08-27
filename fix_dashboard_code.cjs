const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<button onClick=\{\(\)=>updateStatus\(a\.id, 'completed'\)\} className="flex-1 py-3 rounded-xl bg-\[#4ade80\] text-\[#14532d\] font-bold text-sm flex items-center justify-center gap-1"><Icon name="check_circle" size=\{16\}\/> Concluir<\/button>/g;

const newCode = `
                 <button onClick={() => {
                   const codeStr = prompt('Digite o código de 4 dígitos do cliente:');
                   if(!codeStr) return;
                   const confirmCode = (a.id.length >= 4 ? a.id.slice(-4) : (a.id + '0000').slice(0,4)).toUpperCase();
                   if (codeStr.toUpperCase() === confirmCode) {
                     updateStatus(a.id, 'completed');
                     alert('Código confirmado! O valor foi liberado e creditado na sua conta.');
                   } else {
                     alert('Código inválido. Tente novamente.');
                   }
                 }} className="flex-1 py-3 rounded-xl bg-[#4ade80] text-[#14532d] font-bold text-sm flex items-center justify-center gap-1"><Icon name="check_circle" size={16}/> Validar Código</button>
`;

code = code.replace(regex, newCode);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed dashboard pro screen code validation');

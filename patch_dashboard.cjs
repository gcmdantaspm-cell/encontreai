const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className=\{(.*?)\}>(\s*)<p className="text-sm font-medium mb-1 opacity-80">Ganhos Totais \(Concluídos\)<\/p>([\s\S]*?)<\/div><\/div>(\s*)<\/div>/m;

const replacement = `<div className={$1}>$2<p className="text-sm font-medium mb-1 opacity-80">Ganhos Totais (Concluídos)</p>$3</div></div>$4</div>
       
       <div className={\`p-5 rounded-3xl mb-8 border shadow-sm \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
         <div className="flex justify-between items-end mb-2">
           <h3 className="font-black text-lg">Perfil Campeão</h3>
           <span className="font-bold text-[#f97316]">70%</span>
         </div>
         <div className="w-full h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 mb-4">
           <div className="h-full bg-[#f97316] rounded-full" style={{width: '70%'}}></div>
         </div>
         <p className={\`text-xs mb-4 \${isDark?'text-[#a1a1aa]':'text-gray-500'}\`}>Complete seu perfil para atrair mais clientes e ganhar o selo de verificação.</p>
         
         <div className="flex flex-col gap-3">
           <button onClick={()=>go('my-services')} className={\`p-3 rounded-xl border flex items-center justify-between text-left active:scale-95 transition-transform \${isDark?'bg-[#18181b] border-[#3f3f46]':'bg-[#f8f9fa] border-[#e5e7eb]'}\`}>
             <div>
               <p className="font-bold text-sm mb-0.5">Adicionar mais fotos</p>
               <p className={\`text-[10px] \${isDark?'text-[#a1a1aa]':'text-gray-500'}\`}>Serviços com fotos vendem 3x mais.</p>
             </div>
             <Icon name="chevron_right" />
           </button>
           <button onClick={()=>go('profile')} className={\`p-3 rounded-xl border flex items-center justify-between text-left active:scale-95 transition-transform \${isDark?'bg-[#18181b] border-[#3f3f46]':'bg-[#f8f9fa] border-[#e5e7eb]'}\`}>
             <div>
               <p className="font-bold text-sm mb-0.5">Verificar Identidade</p>
               <p className={\`text-[10px] \${isDark?'text-[#a1a1aa]':'text-gray-500'}\`}>Ganhe um selo de segurança.</p>
             </div>
             <Icon name="chevron_right" />
           </button>
         </div>
       </div>`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched DashboardProScreen successfully");
} else {
  console.log("Regex didn't match DashboardProScreen");
}

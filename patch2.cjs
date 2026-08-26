const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const search = `        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 mb-6">
           {CATEGORIES.map((c:any) => (`;
const replace = `        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 mb-6">
           <button onClick={()=>setQ('')} className={\`px-4 py-2.5 rounded-full font-bold text-sm border flex items-center gap-2 whitespace-nowrap active:scale-95 transition-transform shadow-sm \${q==='' ? 'bg-[#f97316] text-black border-[#f97316]' : (isDark?'bg-[#27272a] border-[#3f3f46] text-white':'bg-white border-[#e5e7eb] text-gray-700')}\`}>
             <Icon name="apps" size={16} /> Todos
           </button>
           {CATEGORIES.map((c:any) => (`;
fs.writeFileSync('src/App.tsx', code.replace(search, replace));

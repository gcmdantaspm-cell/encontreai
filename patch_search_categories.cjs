const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const searchRegex = /\{\/\* TOGGLE VIEW \*\/\}/;

const categories = `
      <div className="px-4 mb-4 mt-2">
        <h2 className="font-bold text-lg mb-3">Categorias</h2>
        <div className="grid grid-cols-4 gap-y-4 gap-x-2">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => { setQ(c.name); window.scrollTo(0,0); }} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className={\`w-14 h-14 rounded-full flex items-center justify-center shadow-sm \${isDark ? 'bg-[#27272a]' : 'bg-[#e0f2fe] text-[#0ea5e9]'}\`}>
                <Icon name={c.icon} className={isDark ? 'text-white' : 'text-[#0ea5e9]'} />
              </div>
              <span className="text-[10px] font-bold">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* TOGGLE VIEW */}`;

code = code.replace(searchRegex, categories);
fs.writeFileSync('src/App.tsx', code);
console.log('Patched Categories in SearchScreen');

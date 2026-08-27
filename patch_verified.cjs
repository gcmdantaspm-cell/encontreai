const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<h2 className="font-black text-2xl leading-tight mb-1">{pro.name}</h2>',
  '<h2 className="font-black text-2xl leading-tight mb-1 flex items-center gap-2">{pro.name}{pro.verified && <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full"><Icon name="verified_user" size={14} fill/> Verificado</span>}</h2>'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched verified");

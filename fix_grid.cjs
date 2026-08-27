const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<div className="flex flex-col gap-3 pb-4">/, '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">');

// Add hover effect to the card
// <div key={s.id} className={`flex flex-row p-3 rounded-2xl border shadow-sm items-center gap-3 ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
code = code.replace(/<div key=\{s\.id\} className=\{\`flex flex-row p-3 rounded-2xl border shadow-sm items-center gap-3 \$\{isDark\?'bg-\[#27272a\] border-\[#3f3f46\]':'bg-white border-\[#e5e7eb\]'\}\`\}>/, '<div key={s.id} className={`flex flex-row p-3 rounded-2xl border shadow-sm hover:shadow-md transition-all items-center gap-3 ${isDark?\'bg-[#27272a] border-[#3f3f46]\':\'bg-white border-[#e5e7eb]\'}`}>');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed Search Grid');

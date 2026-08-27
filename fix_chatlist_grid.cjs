const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<div className="flex flex-col gap-2">\s*\{chatPartners\.map/g, '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">\n        {chatPartners.map');

code = code.replace(/className=\{\`p-4 rounded-xl border flex items-center gap-4 shadow-sm text-left \$\{isDark\?'bg-\[#27272a\] border-\[#3f3f46\]':'bg-white border-\[#e5e7eb\]'\}\`\}/g, 'className={`p-4 rounded-xl border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow text-left ${isDark?\'bg-[#27272a] border-[#3f3f46]\':\'bg-white border-[#e5e7eb]\'}`}');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed ChatList Grid');

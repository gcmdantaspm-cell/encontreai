const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className="flex gap-2 pointer-events-auto">/;
const replacement = `<div className="flex gap-2 pointer-events-auto">
          {user?.role === 'client' && (
             <button onClick={() => go('chat-detail', { id: pro.id })} className="w-14 h-14 bg-white dark:bg-[#27272a] rounded-2xl flex items-center justify-center shadow-lg border border-gray-200 dark:border-[#3f3f46] text-[#f97316]">
                <Icon name="chat" size={28} />
             </button>
          )}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed chat button in pro detail');

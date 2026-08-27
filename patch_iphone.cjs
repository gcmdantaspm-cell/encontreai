const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<div className=\{`w-full max-w-\[448px\] shrink-0 h-16 border-t flex justify-around items-center px-2 z-50 transition-colors duration-300 \$\{isDark \? 'bg-\[#18181b\] border-\[#27272a\]' : 'bg-white border-\[#e5e7eb\]'\}`\}>/,
  '<div className={`w-full max-w-[448px] shrink-0 border-t flex justify-around items-center px-2 z-50 transition-colors duration-300 pb-[env(safe-area-inset-bottom)] h-[calc(4rem+env(safe-area-inset-bottom))] ${isDark ? \'bg-[#18181b] border-[#27272a]\' : \'bg-white border-[#e5e7eb]\'}`}>'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed BottomBar safe area');

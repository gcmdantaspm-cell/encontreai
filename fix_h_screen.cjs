const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<div className=\{\`flex justify-center min-h-screen \$\{isDark \? 'bg-black' : 'bg-\[#e7e8e9\]'\}\`\}>/g,
  '<div className={`flex justify-center h-screen h-[100dvh] overflow-hidden ${isDark ? \'bg-black\' : \'bg-[#e7e8e9]\'}`}>'
);

code = code.replace(
  /<div className=\{\`w-full max-w-\[448px\] min-h-screen relative flex flex-col overflow-hidden shadow-2xl transition-colors duration-300/g,
  '<div className={`w-full max-w-[448px] h-full relative flex flex-col overflow-hidden shadow-2xl transition-colors duration-300'
);

// SearchScreen and OrdersScreen also have min-h-screen sometimes
// Let's check ProDetailScreen as well.
code = code.replace(
  /<div className=\{\`min-h-screen flex flex-col \$\{isDark \? 'bg-\[#18181b\] text-white' : 'bg-\[#f8f9fa\] text-\[#191c1d\]'\}\`\}>/g,
  '<div className={`h-full flex flex-col overflow-hidden ${isDark ? \'bg-[#18181b] text-white\' : \'bg-[#f8f9fa] text-[#191c1d]\'}`}>'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed h-screen');

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<div className=\{\`absolute bottom-0 w-full p-4 pt-8 z-40 bg-gradient-to-t \$\{isDark\?'from-\[#18181b\] via-\[#18181b\]':'from-\[#f8f9fa\]'\} to-transparent pointer-events-none\`\}>\s*<div className="flex gap-2 pointer-events-auto">/g, '<div className={`absolute bottom-0 left-0 w-full p-4 pt-8 z-40 bg-gradient-to-t ${isDark?\'from-[#18181b] via-[#18181b]\':\'from-[#f8f9fa]\'} to-transparent pointer-events-none flex justify-center`}>\n        <div className="flex gap-2 pointer-events-auto max-w-xl w-full">');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed ProDetail');

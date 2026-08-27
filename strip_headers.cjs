const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The exact regex for the injected header
const injectedHeaderRegex = /<header className=\{\`flex justify-center items-center px-4 pt-4 pb-2 relative \$\{isDark\?'bg-\[#18181b\]':'bg-\[#f8f9fa\]'\}\`\}>\s*<button onClick=\{\(\) => window\.dispatchEvent\(new CustomEvent\('open-sidebar'\)\)\} className=\{\`absolute left-4 w-10 h-10 flex items-center justify-center \$\{isDark\?'text-white':'text-black'\}\`\}>\s*<Icon name="menu" size=\{24\} \/>\s*<\/button>\s*<Logo isDark=\{isDark\} hideSubtitle=\{true\} \/>\s*<\/header>/g;

code = code.replace(injectedHeaderRegex, '');

fs.writeFileSync('src/App.tsx', code);
console.log('Stripped headers');

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
if (!code.includes('import { Logo }')) {
  code = code.replace(/import \{ GlobalNotifications \} from "\.\/components\/GlobalNotifications";/g, 'import { GlobalNotifications } from "./components/GlobalNotifications";\nimport { Logo } from "./components/Logo";');
}

// Replace headers
const header1 = /<h1 className=\{\`font-black text-2xl tracking-tight \$\{isDark\?'text-white':'text-\[#002a5d\]'\}\`\}>EncontreAi<\/h1>/g;
code = code.replace(header1, '<Logo isDark={isDark} />');

const header2 = /<h1 className=\{\`text-4xl font-black mb-8 tracking-tight \$\{isDark\?'text-\[#60a5fa\]':'text-\[#002a5d\]'\}\`\}>EncontreAi<\/h1>/g;
code = code.replace(header2, '<Logo isDark={isDark} className="scale-125 origin-left mb-8" />');

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx for Logo");

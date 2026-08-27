const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const ordersHeaderRegex = /<header className=\{\`flex justify-between items-center px-4 pt-4 pb-2 \$\{isDark\?'bg-\[#18181b\]':'bg-\[#f8f9fa\]'\}\`\}>([\s\S]*?)<\/header>/;
const newHeader = `<header className={\`flex justify-center items-center px-4 pt-4 pb-2 relative \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-sidebar'))} className={\`absolute left-4 w-10 h-10 flex items-center justify-center \${isDark?'text-white':'text-black'}\`}>
          <Icon name="menu" size={24} />
        </button>
        <Logo isDark={isDark} hideSubtitle={true} />
      </header>`;

code = code.replace(ordersHeaderRegex, newHeader);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched OrdersScreen header');

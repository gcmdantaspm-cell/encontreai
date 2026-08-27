const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Patch MyServicesScreen header
const mySvcRegex = /<header className=\{\`flex justify-between items-center px-4 pt-4 pb-2 \$\{isDark\?'bg-\[#18181b\]':'bg-\[#f8f9fa\]'\}\`\}>([\s\S]*?)<\/header>/;

// Wait, DashboardProScreen header also uses this. Let's do a global replace for all instances of the old header if they exist, or just target specifically.
// We can just find all matches of this generic header and replace it with the sidebar header.
let count = 0;
code = code.replace(/<header className=\{\`flex justify-between items-center px-4 pt-4 pb-2 \$\{isDark\?'bg-\[#18181b\]':'bg-\[#f8f9fa\]'\}\`\}>[\s\S]*?<\/header>/g, () => {
  count++;
  return `<header className={\`flex justify-center items-center px-4 pt-4 pb-2 relative \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-sidebar'))} className={\`absolute left-4 w-10 h-10 flex items-center justify-center \${isDark?'text-white':'text-black'}\`}>
          <Icon name="menu" size={24} />
        </button>
        <Logo isDark={isDark} hideSubtitle={true} />
      </header>`;
});

fs.writeFileSync('src/App.tsx', code);
console.log('Patched', count, 'headers');

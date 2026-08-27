const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('import { Sidebar }')) {
  code = code.replace('import { Logo } from "./components/Logo";', 'import { Logo } from "./components/Logo";\nimport { Sidebar } from "./components/Sidebar";');
}

if (!code.includes('const [isSidebarOpen, setIsSidebarOpen] = useState(false);')) {
  code = code.replace('const [currentRole, setCurrentRole] = useState(user?.currentMode || user?.role || \'client\');', 'const [currentRole, setCurrentRole] = useState(user?.currentMode || user?.role || \'client\');\n  const [isSidebarOpen, setIsSidebarOpen] = useState(false);');
}

if (!code.includes('<Sidebar isOpen={isSidebarOpen}')) {
  code = code.replace('<GlobalNotifications user={user} isDark={isDark} />', '<GlobalNotifications user={user} isDark={isDark} />\n      <Sidebar isOpen={isSidebarOpen} close={() => setIsSidebarOpen(false)} user={user} isDark={isDark} logout={logout} />');
}

// Modify AppContent Header
const headerSearchRegex = /<header className=\{\`w-full sticky top-0 z-50 border-b flex items-center justify-between px-4 py-3 \$\{isDark \? 'bg-\[#18181b\] border-\[#27272a\]' : 'bg-white border-\[#e5e7eb\]'\}\`\}>([\s\S]*?)<\/header>/;

const newHeader = `<header className={\`w-full sticky top-0 z-50 flex items-center justify-center px-4 py-3 \${isDark ? 'bg-[#18181b]' : 'bg-[#f8f9fa]'}\`}>
              <button onClick={() => setIsSidebarOpen(true)} className={\`absolute left-4 w-10 h-10 flex items-center justify-center \${isDark?'text-white':'text-black'}\`}>
                <Icon name="menu" size={24} />
              </button>
              <Logo isDark={isDark} hideSubtitle={true} />
            </header>`;

code = code.replace(headerSearchRegex, newHeader);

// SearchScreen Header: remove it as well, or modify it to match design.
// The SearchScreen has: 
// <header className={`flex justify-between items-center px-4 pt-4 pb-2 ${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}`}> ... </header>
const searchHeaderRegex = /<header className=\{\`flex justify-between items-center px-4 pt-4 pb-2 \$\{isDark\?'bg-\[#18181b\]':'bg-\[#f8f9fa\]'\}\`\}>([\s\S]*?)<\/header>/;

const newSearchHeader = `<header className={\`flex justify-center items-center px-4 pt-4 pb-2 relative \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-sidebar'))} className={\`absolute left-4 w-10 h-10 flex items-center justify-center \${isDark?'text-white':'text-black'}\`}>
          <Icon name="menu" size={24} />
        </button>
        <Logo isDark={isDark} hideSubtitle={true} />
      </header>`;

code = code.replace(searchHeaderRegex, newSearchHeader);

// In AppContent, we need to listen for the 'open-sidebar' event if we use that trick.
if (!code.includes('window.addEventListener(\'open-sidebar\'')) {
  code = code.replace('const [isSidebarOpen, setIsSidebarOpen] = useState(false);', `const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useEffect(() => {
    const handleOpen = () => setIsSidebarOpen(true);
    window.addEventListener('open-sidebar', handleOpen);
    return () => window.removeEventListener('open-sidebar', handleOpen);
  }, []);`);
}

fs.writeFileSync('src/App.tsx', code);
console.log('Patched Sidebar');

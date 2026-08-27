const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const regex = /<button onClick=\{\(\) => \{ navigate\('\/agenda'\); close\(\); \}\} className=\{`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-\[#27272a\]`\}>\s*<Icon name="sync_alt" \/> Modo Profissional\s*<\/button>/;

const replacement = `<button onClick={() => { navigate('/agenda'); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="dashboard" /> Painel do Profissional
              </button>
              <button onClick={() => { navigate('/chat-list'); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="chat" /> Minhas Mensagens
              </button>`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('Sidebar patched');

const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace("import { Link, useNavigate } from 'react-router-dom';", "import { Link, useNavigate, useLocation } from 'react-router-dom';");

// Insert useLocation hook
code = code.replace('  const navigate = useNavigate();', '  const navigate = useNavigate();\n  const location = useLocation();');

const oldMenuItems = `              <button onClick={() => { navigate('/busca'); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors \${location.pathname === '/busca' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}\`}>
                <Icon name="home" /> Home
              </button>
              <button onClick={() => { navigate('/perfil'); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors \${location.pathname === '/perfil' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}\`}>
                <Icon name="person" /> Profile
              </button>
              <button onClick={() => { navigate('/busca', { state: { view: 'map' }}); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="location_on" /> Professionals Near Me
              </button>
              <button onClick={() => { navigate('/busca'); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="category" /> Categories
              </button>
              <button onClick={() => { navigate('/busca', { state: { filter: 'favorites' }}); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="favorite_border" /> Favorites
              </button>
              <button onClick={() => { navigate('/pedidos'); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors \${location.pathname === '/pedidos' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}\`}>
                <Icon name="calendar_today" /> My Appointments
              </button>
              <hr className={\`my-2 \${isDark ? 'border-[#27272a]' : 'border-gray-200'}\`} />
              <button onClick={() => { navigate('/agenda'); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="sync_alt" /> Professional Mode
              </button>
              <button onClick={close} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="settings" /> Settings
              </button>
              <button onClick={close} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="help_outline" /> Help & Support
              </button>`;

const newMenuItems = `              <button onClick={() => { navigate('/busca'); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors \${location.pathname === '/busca' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}\`}>
                <Icon name="home" /> Início
              </button>
              <button onClick={() => { navigate('/perfil'); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors \${location.pathname === '/perfil' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}\`}>
                <Icon name="person" /> Perfil
              </button>
              <button onClick={() => { navigate('/busca', { state: { view: 'map' }}); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="location_on" /> Profissionais Perto de Mim
              </button>
              <button onClick={() => { navigate('/busca'); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="category" /> Categorias
              </button>
              <button onClick={() => { navigate('/busca', { state: { filter: 'favorites' }}); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="favorite_border" /> Favoritos
              </button>
              <button onClick={() => { navigate('/pedidos'); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors \${location.pathname === '/pedidos' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}\`}>
                <Icon name="calendar_today" /> Meus Pedidos
              </button>
              <hr className={\`my-2 \${isDark ? 'border-[#27272a]' : 'border-gray-200'}\`} />
              <button onClick={() => { navigate('/agenda'); close(); }} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="sync_alt" /> Modo Profissional
              </button>
              <button onClick={close} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="settings" /> Configurações
              </button>
              <button onClick={close} className={\`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]\`}>
                <Icon name="help_outline" /> Ajuda e Suporte
              </button>`;

code = code.replace(oldMenuItems, newMenuItems);
code = code.replace('<Icon name="logout" /> Logout', '<Icon name="logout" /> Sair');
code = code.replace("EncontreAi Member", "Membro EncontreAi");

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('Sidebar patched.');

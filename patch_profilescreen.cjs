const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function ProfileScreen[\s\S]*?function DashboardProScreen/

const replacement = `function ProfileScreen({ user, logout, loginWithGoogle, toggleDarkMode, updateProfile, show, isDark }: any) {
  const [editing, setEditing] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <Icon name="person" size={64} className="opacity-20 mb-4" />
        <h2 className="font-black text-2xl mb-2">Seu Perfil</h2>
        <p className="text-sm opacity-60 mb-8">Faça login para gerenciar sua conta, endereços e meios de pagamento.</p>
        <button onClick={loginWithGoogle} className="px-8 py-3 bg-[#f97316] text-black font-bold rounded-full shadow-lg active:scale-95 transition-transform">Entrar com Google</button>
      </div>
    );
  }

  return (
    <div className="pb-8 overflow-y-auto hide-scrollbar">
      <header className={\`flex justify-between items-center px-4 pt-4 pb-2 \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <Icon name="person" className="opacity-50" />}
        </div>
        <h1 className={\`font-black text-2xl tracking-tight \${isDark?'text-white':'text-[#002a5d]'}\`}>EncontreAi</h1>
        <button className="w-10 h-10 rounded-full flex items-center justify-center"><Icon name="notifications_none" /></button>
      </header>

      <div className="px-4 mt-6 flex flex-col items-center">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-gray-800 border-4 border-[#002a5d] dark:border-blue-500 overflow-hidden shadow-md">
            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <Icon name="person" size={48} className="opacity-50 m-auto h-full" />}
          </div>
          <button onClick={() => setEditing(true)} className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#002a5d] dark:bg-blue-600 text-white flex items-center justify-center border-2 border-white dark:border-[#18181b] shadow-sm">
            <Icon name="edit" size={16} />
          </button>
        </div>
        <h2 className="font-black text-2xl mt-4 mb-1">{user.name}</h2>
        <p className="text-sm opacity-80 flex items-center gap-1 mb-1"><Icon name="mail" size={14} /> {user.email}</p>
        <p className="text-sm opacity-80 flex items-center gap-1 mb-6"><Icon name="phone" size={14} /> {user.phone || '+55 11 98765-4321'}</p>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3 mb-4">
        <div className={\`p-4 rounded-2xl border shadow-sm flex flex-col gap-3 active:scale-95 transition-transform \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
          <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${isDark?'bg-[#3f3f46]':'bg-blue-100'}\`}>
            <Icon name="location_on" className={isDark?'text-white':'text-[#002a5d]'} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Endereços</h3>
            <p className="text-[10px] opacity-70">Gerenciar locais</p>
          </div>
        </div>
        <div className={\`p-4 rounded-2xl border shadow-sm flex flex-col gap-3 active:scale-95 transition-transform \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
          <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${isDark?'bg-[#3f3f46]':'bg-orange-100'}\`}>
            <Icon name="payment" className={isDark?'text-white':'text-orange-800'} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Pagamentos</h3>
            <p className="text-[10px] opacity-70">Cartões e contas</p>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className={\`p-4 rounded-2xl border shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-200 dark:bg-green-900 flex items-center justify-center">
              <Icon name="favorite" className="text-green-800 dark:text-green-300" />
            </div>
            <div>
              <h3 className="font-bold text-[15px]">Profissionais Favoritos</h3>
              <p className="text-[11px] opacity-70">Seus prestadores de serviço salvos</p>
            </div>
          </div>
          <Icon name="chevron_right" className="opacity-40" />
        </div>
      </div>

      <div className="px-4 flex flex-col gap-3">
        <div className={\`rounded-2xl border shadow-sm overflow-hidden \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
          <button className="w-full p-4 flex items-center gap-4 active:bg-black/5 dark:active:bg-white/5 border-b border-gray-100 dark:border-[#3f3f46]">
            <Icon name="help_outline" className="opacity-70" />
            <span className="flex-1 text-left font-bold text-sm">Central de Ajuda</span>
            <Icon name="chevron_right" className="opacity-40" />
          </button>
          <button className="w-full p-4 flex items-center gap-4 active:bg-black/5 dark:active:bg-white/5 border-b border-gray-100 dark:border-[#3f3f46]">
            <Icon name="settings" className="opacity-70" />
            <span className="flex-1 text-left font-bold text-sm">Configurações</span>
            <Icon name="chevron_right" className="opacity-40" />
          </button>
          <div className="w-full p-4 flex items-center gap-4">
            <Icon name="dark_mode" className="opacity-70" />
            <span className="flex-1 text-left font-bold text-sm">Modo Escuro</span>
            <button onClick={toggleDarkMode} className={\`w-10 h-6 rounded-full flex items-center p-1 transition-colors \${isDark ? 'bg-[#002a5d] justify-end' : 'bg-gray-300 justify-start'}\`}>
              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </button>
          </div>
        </div>
        
        <button onClick={logout} className={\`w-full p-4 rounded-2xl border shadow-sm flex items-center gap-4 active:scale-[0.98] transition-transform \${isDark?'bg-[#27272a] border-[#3f3f46] text-red-400':'bg-white border-[#e5e7eb] text-red-600'}\`}>
          <Icon name="logout" />
          <span className="flex-1 text-left font-bold text-sm">Sair</span>
        </button>
      </div>
      <AnimatePresence>{editing && <EditProfileModal user={user} onClose={()=>setEditing(false)} onSave={(d:any)=>{updateProfile(d); setEditing(false); show('Perfil atualizado!');}} isDark={isDark} show={show}/>}</AnimatePresence>
    </div>
  )
}

function DashboardProScreen`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);

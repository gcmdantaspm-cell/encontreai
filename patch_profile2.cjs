const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const profileRegex = /function ProfileScreen\(\{ user, isDark, logout, loginWithGoogle, toggleDarkMode, updateProfile, show \}: any\) \{([\s\S]*?)\n\}\n\nfunction EditProfileModal/m;

const newProfile = `function ProfileScreen({ user, isDark, logout, loginWithGoogle, toggleDarkMode, updateProfile, show }: any) {
  const { currentRole, setCurrentRole } = useContext(RoleContext);
  const [editModal, setEditModal] = useState(false);

  if (!user) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-6">
          <Icon name="person_off" size={48} className="opacity-50" />
        </div>
        <h2 className="font-black text-2xl mb-2">Acesse sua conta</h2>
        <p className={\`text-sm mb-8 \${isDark?'text-[#a1a1aa]':'text-gray-500'}\`}>Faça login para gerenciar seu perfil e pedidos.</p>
        <Link to="/auth" className="px-8 py-4 bg-[#f97316] text-black rounded-xl font-black shadow-lg active:scale-95 transition-transform">Fazer Login</Link>
      </div>
    );
  }

  return (
    <div className={\`pb-24 flex-1 overflow-y-auto hide-scrollbar \${isDark?'bg-[#18181b] text-white':'bg-[#f8f9fa] text-black'}\`}>
      <header className="flex justify-center items-center px-4 pt-4 pb-2 relative">
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-sidebar'))} className={\`absolute left-4 w-10 h-10 flex items-center justify-center \${isDark?'text-white':'text-black'}\`}>
          <Icon name="menu" size={24} />
        </button>
        <Logo isDark={isDark} hideSubtitle={true} />
      </header>
      
      <div className="px-6">
        <div className="flex flex-col items-center mt-6 mb-4">
          <div className="relative w-24 h-24 rounded-full mb-3">
            <img src={user.avatarUrl || 'https://via.placeholder.com/150'} className="w-full h-full rounded-full object-cover shadow-md bg-gray-200" />
            <button onClick={() => setEditModal(true)} className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#002a5d] dark:bg-[#60a5fa] flex items-center justify-center text-white border-2 border-white dark:border-[#18181b] shadow-sm active:scale-95">
              <Icon name="edit" size={16} />
            </button>
          </div>
          <h2 className="font-black text-2xl leading-tight">{user.name}</h2>
          <p className={\`text-sm mt-1 \${isDark?'text-gray-400':'text-gray-500'}\`}>Premium Member since 2022</p>
        </div>

        <button onClick={() => setEditModal(true)} className="w-full bg-[#f97316] text-black font-bold py-3.5 rounded-xl shadow-md mb-8 active:scale-95 transition-transform">
          Edit Profile
        </button>

        <div className={\`flex items-center justify-between p-5 rounded-2xl shadow-sm border mb-8 \${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-gray-200'}\`}>
          <div>
            <p className={\`text-xs font-bold mb-1 \${isDark?'text-gray-400':'text-gray-500'}\`}>Available Balance</p>
            <p className={\`font-black text-2xl \${isDark?'text-white':'text-[#002a5d]'}\`}>R$ 1.250,00</p>
          </div>
          <button className={\`w-12 h-12 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform \${isDark?'bg-[#60a5fa] text-white':'bg-[#002a5d] text-white'}\`}>
            <Icon name="add" />
          </button>
        </div>

        <div className="flex justify-between items-end mb-4">
          <h3 className="font-black text-lg">Active Requests</h3>
          <Link to="/pedidos" className="text-[#c2410c] dark:text-[#f97316] text-sm font-bold active:opacity-70">View All</Link>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <div className={\`p-4 rounded-xl border shadow-sm flex gap-4 \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-gray-200'}\`}>
            <div className={\`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 \${isDark?'bg-[#3f3f46] text-white':'bg-[#e2e8f0] text-[#002a5d]'}\`}>
              <Icon name="plumbing" size={28} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h4 className={\`font-bold text-base \${isDark?'text-white':'text-[#002a5d]'}\`}>Plumbing Fix</h4>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">In Progress</span>
              </div>
              <p className={\`text-xs mb-2 \${isDark?'text-gray-400':'text-gray-500'}\`}>Today, 14:00 • 2.5 km away</p>
              <p className={\`font-black text-sm \${isDark?'text-white':'text-[#002a5d]'}\`}>R$ 150,00</p>
            </div>
          </div>

          <div className={\`p-4 rounded-xl border shadow-sm flex gap-4 \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-gray-200'}\`}>
            <div className={\`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 \${isDark?'bg-[#3f3f46] text-white':'bg-[#e2e8f0] text-[#002a5d]'}\`}>
              <Icon name="cleaning_services" size={28} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h4 className={\`font-bold text-base \${isDark?'text-white':'text-[#002a5d]'}\`}>Deep Cleaning</h4>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">Scheduled</span>
              </div>
              <p className={\`text-xs mb-2 \${isDark?'text-gray-400':'text-gray-500'}\`}>Tomorrow, 09:00 • 5.0 km away</p>
              <p className={\`font-black text-sm \${isDark?'text-white':'text-[#002a5d]'}\`}>R$ 200,00</p>
            </div>
          </div>
        </div>

        <div className={\`rounded-2xl border shadow-sm flex flex-col mb-8 overflow-hidden \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-gray-200'}\`}>
          <button className={\`flex justify-between items-center p-4 border-b active:bg-gray-50 dark:active:bg-[#3f3f46] \${isDark?'border-[#3f3f46]':'border-gray-100'}\`}>
            <div className="flex items-center gap-4">
              <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${isDark?'bg-[#3f3f46] text-white':'bg-[#e2e8f0] text-[#002a5d]'}\`}>
                 <Icon name="person" />
              </div>
              <span className={\`font-bold \${isDark?'text-white':'text-[#002a5d]'}\`}>Personal Information</span>
            </div>
            <Icon name="chevron_right" className="text-gray-400" />
          </button>

          <button className={\`flex justify-between items-center p-4 border-b active:bg-gray-50 dark:active:bg-[#3f3f46] \${isDark?'border-[#3f3f46]':'border-gray-100'}\`}>
            <div className="flex items-center gap-4">
              <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${isDark?'bg-[#3f3f46] text-white':'bg-[#e2e8f0] text-[#002a5d]'}\`}>
                 <Icon name="payments" />
              </div>
              <span className={\`font-bold \${isDark?'text-white':'text-[#002a5d]'}\`}>Payment Methods</span>
            </div>
            <Icon name="chevron_right" className="text-gray-400" />
          </button>

          <button className="flex justify-between items-center p-4 active:bg-gray-50 dark:active:bg-[#3f3f46]">
            <div className="flex items-center gap-4">
              <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${isDark?'bg-[#3f3f46] text-white':'bg-[#e2e8f0] text-[#002a5d]'}\`}>
                 <Icon name="notifications" />
              </div>
              <span className={\`font-bold \${isDark?'text-white':'text-[#002a5d]'}\`}>Notifications</span>
            </div>
            <Icon name="chevron_right" className="text-gray-400" />
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {editModal && <EditProfileModal user={user} onClose={()=>setEditModal(false)} onSave={(data: any)=>{ updateProfile(data); setEditModal(false); if(show) show('Perfil atualizado com sucesso!'); }} isDark={isDark} show={show} />}
      </AnimatePresence>
    </div>
  );
}`;

code = code.replace(profileRegex, newProfile + '\n\nfunction EditProfileModal');

fs.writeFileSync('src/App.tsx', code);
console.log("Patched ProfileScreen");

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const additionalCode = `
function EditProfileModal({ user, onClose, onSave, isDark, show }: any) {
  const [av, setAv] = useState(user.avatarUrl || '');
  const [desc, setDesc] = useState(user.description || '');
  const [profession, setProfession] = useState(user.profession || '');
  const [region, setRegion] = useState(user.region || '');

  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" />
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className={\`fixed bottom-0 left-0 w-full rounded-t-3xl z-[101] p-6 shadow-2xl \${isDark ? 'bg-[#27272a] text-white' : 'bg-white text-gray-900'}\`}>
        <h2 className="font-bold text-2xl mb-4">Editar Perfil</h2>
        
        <div className="flex flex-col gap-4 mb-6">
          <input value={av} onChange={e=>setAv(e.target.value)} placeholder="URL da Foto de Perfil" className={\`w-full p-4 rounded-xl border outline-none text-sm \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}\`} />
          {user.role === 'professional' && (
            <>
              <input value={profession} onChange={e=>setProfession(e.target.value)} placeholder="Sua Profissão" className={\`w-full p-4 rounded-xl border outline-none text-sm \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}\`} />
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Sua Descrição" className={\`w-full p-4 rounded-xl border outline-none text-sm min-h-[100px] \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}\`} />
            </>
          )}
          <input value={region} onChange={e=>setRegion(e.target.value)} placeholder="Sua Região/Cidade" className={\`w-full p-4 rounded-xl border outline-none text-sm \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}\`} />
        </div>

        <button onClick={() => onSave({ avatarUrl: av, description: desc, profession, region })} className="w-full py-4 rounded-xl font-bold text-black bg-[#f97316] shadow-lg active:scale-95 transition-transform">Salvar Alterações</button>
      </motion.div>
    </>
  );
}

function ProfileScreen({ user, isDark, logout, loginWithGoogle, toggleDarkMode, updateProfile, show }: any) {
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
    <div className="pb-24">
      <div className="relative h-32 bg-gradient-to-r from-[#f97316] to-[#ea580c]">
        <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-full border-4 border-white dark:border-[#18181b] bg-gray-200 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
          {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="font-black text-3xl opacity-50">{user.avatarInitial}</span>}
        </div>
      </div>
      
      <div className="px-6 pt-12">
        <h1 className="font-black text-2xl mb-1 flex items-center gap-2">
          {user.name}
          {user.verified && <Icon name="verified_user" size={18} className="text-green-500" fill />}
        </h1>
        <p className={\`text-sm font-medium mb-6 \${isDark?'text-[#a1a1aa]':'text-gray-500'}\`}>{user.email}</p>

        {user.role === 'professional' && (
          <div className={\`p-5 rounded-3xl border mb-6 \${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}\`}>
            <h3 className="font-black text-lg mb-1">Alternar Modo</h3>
            <p className={\`text-xs mb-4 \${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}\`}>Alterne entre a visão de prestador e cliente.</p>
            <div className="flex bg-gray-100 dark:bg-[#18181b] rounded-xl p-1 relative">
               <div className={\`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#f97316] rounded-lg shadow-md transition-all duration-300 \${currentRole === 'client' ? 'left-1' : 'left-[calc(50%+2px)]'}\`} />
               <button onClick={() => { setCurrentRole('client'); updateProfile({ currentMode: 'client' }); }} className={\`flex-1 py-3 text-sm font-bold relative z-10 transition-colors \${currentRole === 'client' ? 'text-black' : (isDark ? 'text-gray-400' : 'text-gray-500')}\`}>Cliente</button>
               <button onClick={() => { setCurrentRole('professional'); updateProfile({ currentMode: 'professional' }); }} className={\`flex-1 py-3 text-sm font-bold relative z-10 transition-colors \${currentRole === 'professional' ? 'text-black' : (isDark ? 'text-gray-400' : 'text-gray-500')}\`}>Profissional</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button onClick={() => setEditModal(true)} className={\`p-4 rounded-xl border flex items-center justify-between text-left active:scale-95 transition-transform \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
            <div className="flex items-center gap-3">
              <Icon name="edit" className="text-[#f97316]" />
              <span className="font-bold">Editar Perfil</span>
            </div>
            <Icon name="chevron_right" />
          </button>
          
          <button onClick={toggleDarkMode} className={\`p-4 rounded-xl border flex items-center justify-between text-left active:scale-95 transition-transform \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
            <div className="flex items-center gap-3">
              <Icon name={isDark ? 'light_mode' : 'dark_mode'} className="text-[#f97316]" />
              <span className="font-bold">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </div>
          </button>

          <button onClick={logout} className={\`p-4 rounded-xl border flex items-center gap-3 text-left active:scale-95 transition-transform \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}\`}>
            <Icon name="logout" className="text-red-500" />
            <span className="font-bold text-red-500">Sair da Conta</span>
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {editModal && <EditProfileModal user={user} onClose={()=>setEditModal(false)} onSave={(data: any)=>{ updateProfile(data); setEditModal(false); if(show) show('Perfil atualizado com sucesso!'); }} isDark={isDark} show={show} />}
      </AnimatePresence>
    </div>
  );
}
`;

fs.writeFileSync('src/App.tsx', code + '\\n' + additionalCode);
console.log("Restored ProfileScreen");

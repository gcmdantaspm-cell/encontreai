const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function AuthScreen\(\{[\s\S]*?^function ChatListScreen/m;

const replacement = `function AuthScreen({ loginWithEmail, registerWithEmail, isDark, show }: any) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login'|'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('client');

  return (
    <div className={\`p-4 flex flex-col items-center justify-center min-h-screen relative \${isDark?'bg-[#18181b] text-white':'bg-[#f8f9fa] text-[#002a5d]'}\`}>
      <button onClick={() => navigate('/busca')} className="absolute top-6 left-4 p-2"><Icon name="arrow_back" /></button>
      <h1 className={\`text-4xl font-black mb-8 tracking-tight \${isDark?'text-[#60a5fa]':'text-[#002a5d]'}\`}>EncontreAi</h1>
      
      <div className={\`w-full max-w-sm rounded-3xl shadow-xl overflow-hidden \${isDark?'bg-[#27272a]':'bg-white'}\`}>
        <div className="flex">
          <button onClick={() => setTab('login')} className={\`flex-1 py-4 font-bold text-sm \${tab==='login' ? (isDark?'bg-[#3f3f46] text-white':'bg-gray-100 text-[#002a5d]') : (isDark?'text-gray-400':'text-gray-500')}\`}>Entrar</button>
          <button onClick={() => setTab('register')} className={\`flex-1 py-4 font-bold text-sm \${tab==='register' ? (isDark?'bg-[#3f3f46] text-white':'bg-gray-100 text-[#002a5d]') : (isDark?'text-gray-400':'text-gray-500')}\`}>Criar Conta</button>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          {tab === 'register' && (
            <>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome completo" className={\`w-full p-3 rounded-xl border outline-none \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-gray-50 border-gray-200 text-black'}\`} />
              <select value={role} onChange={e=>setRole(e.target.value)} className={\`w-full p-3 rounded-xl border outline-none \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-gray-50 border-gray-200 text-black'}\`}>
                 <option value="client">Sou Cliente</option>
                 <option value="professional">Sou Profissional</option>
              </select>
            </>
          )}
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="E-mail" className={\`w-full p-3 rounded-xl border outline-none \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-gray-50 border-gray-200 text-black'}\`} />
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Senha" className={\`w-full p-3 rounded-xl border outline-none \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-gray-50 border-gray-200 text-black'}\`} />
          
          <button onClick={async () => { 
             if(!email || !password) return show('Preencha os campos', 'error');
             show('Aguarde...', 'info'); 
             let res;
             if (tab === 'login') {
                res = await loginWithEmail(email, password);
             } else {
                if(!name) return show('Preencha o nome', 'error');
                res = await registerWithEmail(email, password, name, role);
             }
             if (res.ok) { show('Sucesso!'); navigate('/perfil'); } else show(res.error, 'error'); 
          }} className="w-full py-4 rounded-xl bg-[#f97316] text-black font-black mt-2 active:scale-95 transition-transform">
            {tab === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatListScreen`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Replaced AuthScreen");
} else {
  console.log("Did not match regex AuthScreen");
}

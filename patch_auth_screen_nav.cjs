const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function AuthScreen\(\{.*?\}\) \{[\s\S]*?\}\n\nfunction ChatListScreen/;

const replacement = `function AuthScreen({ loginWithGoogle, loginWithEmail, registerWithEmail, show, isDark }: any) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    show('Conectando...', 'info');
    let res;
    if(isLogin) {
      res = await loginWithEmail(email, password);
    } else {
      res = await registerWithEmail(email, password, name);
    }
    
    if(res.ok) {
      show('Sucesso!');
      navigate('/perfil');
    } else {
      show(res.error, 'error');
    }
  };

  return (
    <div className={\`p-4 flex flex-col items-center justify-center min-h-screen relative \${isDark ? 'bg-[#18181b] text-white' : 'bg-[#f8f9fa] text-[#002a5d]'}\`}>
      <button onClick={() => navigate('/perfil')} className="absolute top-6 left-4 p-2"><Icon name="arrow_back" /></button>
      <h1 className="text-4xl font-black mb-8 text-[#60a5fa] tracking-tight">EncontreAi</h1>
      
      <div className={\`w-full max-w-xs p-6 rounded-3xl border shadow-lg \${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}\`}>
        <div className="flex gap-4 mb-6">
          <button onClick={() => setIsLogin(true)} className={\`flex-1 pb-2 font-bold \${isLogin ? 'border-b-2 border-[#60a5fa] text-[#60a5fa]' : 'opacity-50 border-b-2 border-transparent'}\`}>Entrar</button>
          <button onClick={() => setIsLogin(false)} className={\`flex-1 pb-2 font-bold \${!isLogin ? 'border-b-2 border-[#60a5fa] text-[#60a5fa]' : 'opacity-50 border-b-2 border-transparent'}\`}>Criar Conta</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <input required type="text" placeholder="Nome Completo" value={name} onChange={e=>setName(e.target.value)} className={\`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#60a5fa] \${isDark ? 'bg-[#18181b] border-[#3f3f46] text-white' : 'bg-gray-50 border-[#d1d5db] text-black'}\`} />
          )}
          <input required type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className={\`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#60a5fa] \${isDark ? 'bg-[#18181b] border-[#3f3f46] text-white' : 'bg-gray-50 border-[#d1d5db] text-black'}\`} />
          <input required type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} className={\`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#60a5fa] \${isDark ? 'bg-[#18181b] border-[#3f3f46] text-white' : 'bg-gray-50 border-[#d1d5db] text-black'}\`} />
          
          <button type="submit" className="w-full bg-[#f97316] text-black font-black p-3 rounded-xl shadow-md active:scale-95 transition-transform mt-2">
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#3f3f46]">
          <button type="button" onClick={async () => { show('Conectando...', 'info'); const res = await loginWithGoogle(); if (res.ok) { show('Sucesso!'); navigate('/perfil'); } else show(res.error, 'error'); }} className={\`w-full font-bold px-4 py-3 rounded-xl shadow-sm flex items-center gap-3 active:scale-95 transition-transform justify-center border \${isDark ? 'bg-white text-black border-white' : 'bg-white text-black border-gray-200'}\`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
            Entrar com Google
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatListScreen`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);

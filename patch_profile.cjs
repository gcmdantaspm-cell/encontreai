const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function ProfileScreen\(\{ user, isDark, logout, toggleDarkMode, updateProfile, show \}: any\) \{([\s\S]*?)<div className="flex flex-col gap-3">/m;

const replacement = `function ProfileScreen({ user, isDark, logout, toggleDarkMode, updateProfile, show }: any) {
  const { currentRole, setCurrentRole } = useContext(RoleContext);$1
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
      
      <div className="flex flex-col gap-3">`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched ProfileScreen successfully");
} else {
  console.log("Regex didn't match ProfileScreen");
}

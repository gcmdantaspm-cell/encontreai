const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexProfile = /<p className=\{`text-sm font-medium mb-6 \$\{isDark\?'text-\[#a1a1aa\]':'text-gray-500'\}\`\}\>\{user\.email\}<\/p>/;

const replacementProfile = `<p className={\`text-sm font-medium mb-6 \${isDark?'text-[#a1a1aa]':'text-gray-500'}\`}>{user.email}</p>
        <div className={\`p-5 rounded-3xl border mb-6 flex justify-between items-center shadow-sm \${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}\`}>
          <div>
             <h3 className="font-black text-lg mb-1">Carteira Digital</h3>
             <p className={\`text-xs \${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}\`}>Saldo disponível</p>
          </div>
          <span className="font-black text-2xl text-[#f97316]">R$ {(user.walletBalance || 0).toFixed(2)}</span>
        </div>`;

code = code.replace(regexProfile, replacementProfile);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed wallet display in profile');

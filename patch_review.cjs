const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<p className=\{\`text-sm mb-6 \$\{isDark\?'text-\[#a1a1aa\]':'text-gray-500'\}\`\}>\{user\.role === 'professional' \? \`userRole === 'professional' \? \`Como foi o cliente \$\{a\.clientName\}\?\`\` : \`Como foi o serviço de \$\{a\.professionalName\}\?\`\}<\/p>/g;

code = code.replace(regex, "<p className={`text-sm mb-6 ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>{userRole === 'professional' ? `Como foi o cliente ${a.clientName}?` : `Como foi o serviço de ${a.professionalName}?`}</p>");

fs.writeFileSync('src/App.tsx', code);
console.log("Patched ReviewModal");

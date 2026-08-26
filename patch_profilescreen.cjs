const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<button onClick=\{loginWithGoogle\} className="px-8 py-3 bg-\[\#f97316\] text-black font-bold rounded-full shadow-lg active:scale-95 transition-transform">Entrar com Google<\/button>/;
const replacement = `
        <Link to="/auth" className="px-8 py-3 bg-[#f97316] text-black font-bold rounded-full shadow-lg active:scale-95 transition-transform inline-block">Entrar / Cadastrar</Link>
`;
code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);

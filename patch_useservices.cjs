const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const add = async (s: Omit<ProfService, 'id'>) => { await addDoc(collection(db, 'services'), s); load(); };`;
const repl = `  const add = async (s: Omit<ProfService, 'id' | 'professionalId'>) => { if(!pid) return; await addDoc(collection(db, 'services'), { ...s, professionalId: pid }); load(); };`;

code = code.replace(target, repl);
fs.writeFileSync('src/App.tsx', code);

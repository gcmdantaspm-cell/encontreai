const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const updateStatus = async \(id: string, st: string\) => \{\s*await updateDoc\(doc\(db, 'appointments', id\), \{ status: st \}\);\s*load\(\);\s*\};\s*return \{ apts, add, updateStatus \};/;

const replacement = `const updateStatus = async (id: string, st: string) => {
    await updateDoc(doc(db, 'appointments', id), { status: st });
    load();
  };
  const remove = async (id: string) => {
    await deleteDoc(doc(db, 'appointments', id));
    load();
  };
  return { apts, add, updateStatus, remove };`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);

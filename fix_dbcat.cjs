const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  "const dbCats = snap.docs.map(d => ({ id: d.id, ...d.data() }));",
  "const dbCats = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));"
);
fs.writeFileSync('src/App.tsx', code);

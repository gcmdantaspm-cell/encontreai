const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const searchStateRegex = /const \[q, setQ\] = useState\(loc\.state\?\.q \|\| loc\.state\?\.category \|\| ''\);\n  const \[filter, setFilter\] = useState\('all'\);/;
code = code.replace(searchStateRegex, `const [q, setQ] = useState(loc.state?.q || loc.state?.category || '');
  const [filter, setFilter] = useState(loc.state?.filter || 'all');`);

const filteredRegex = /let filtered = allServices\.filter\(\(s:any\) => \{\n    if \(!q\) return true;\n    const term = q\.toLowerCase\(\);\n    return s\.title\.toLowerCase\(\)\.includes\(term\) \|\| s\.description\?\.toLowerCase\(\)\.includes\(term\) \|\| s\.pro\.name\.toLowerCase\(\)\.includes\(term\) \|\| s\.pro\.profession\.toLowerCase\(\)\.includes\(term\) \|\| s\.category\?\.toLowerCase\(\) === term \|\| s\.categoryId\?\.toLowerCase\(\) === term;\n  \}\);/;

code = code.replace(filteredRegex, `let filtered = allServices.filter((s:any) => {
    if (filter === 'favorites') {
       if(!user?.favorites?.includes(s.pro.id)) return false;
    }
    if (!q) return true;
    const term = q.toLowerCase();
    return s.title.toLowerCase().includes(term) || s.description?.toLowerCase().includes(term) || s.pro.name.toLowerCase().includes(term) || s.pro.profession.toLowerCase().includes(term) || s.category?.toLowerCase() === term || s.categoryId?.toLowerCase() === term;
  });`);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched Search Screen Filter');

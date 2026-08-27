const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const useSearchRegex = /function useSearch\(\) \{\s*const \[pros, setPros\] = useState<Professional\[\]>\(\[\]\);\s*useEffect\(\(\) => \{\s*getDocs\(query\(collection\(db, 'users'\), where\('role', '==', 'professional'\)\)\)\.then\(snap => \{\s*const dbPros = snap\.docs\.map\(d => \{\s*const u = d\.data\(\);\s*return \{\s*id: d\.id, name: u\.name, profession: u\.profession \|\| 'Especialista',\s*avatarUrl: u\.avatarUrl \|\| \`https:\/\/ui-avatars\.com\/api\/\?name=\$\{u\.avatarInitial\}&background=random\`,\s*coverUrl: u\.coverUrl \|\| \`https:\/\/picsum\.photos\/seed\/\$\{d\.id\}\/600\/300\`,\s*rating: u\.rating \|\| 5\.0, verified: true, services: \[\], description: u\.description\s*\} as Professional;\s*\}\);\s*setPros\(\[\.\.\.PROFESSIONALS, \.\.\.dbPros\]\);\s*\}\);\s*\}, \[\]\);\s*return \{ pros \};\s*\}/;

const newUseSearch = `function useSearch() {
  const [pros, setPros] = useState<Professional[]>([]);
  useEffect(() => {
    const fetchPros = async () => {
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'professional')));
      const dbPros = await Promise.all(snap.docs.map(async (d) => {
        const u = d.data();
        const svcSnap = await getDocs(query(collection(db, 'services'), where('professionalId', '==', d.id)));
        const services = svcSnap.docs.map(sd => ({ ...sd.data(), id: sd.id } as ProfService));
        
        return {
          id: d.id, name: u.name, profession: u.profession || 'Especialista',
          avatarUrl: u.avatarUrl || \`https://ui-avatars.com/api/?name=\${u.avatarInitial}&background=random\`,
          coverUrl: u.coverUrl || \`https://picsum.photos/seed/\${d.id}/600/300\`,
          rating: u.rating || 5.0, verified: true, services, description: u.description
        } as Professional;
      }));
      setPros([...PROFESSIONALS, ...dbPros]);
    };
    fetchPros();
  }, []);
  return { pros };
}`;

code = code.replace(useSearchRegex, newUseSearch);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed useSearch');

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const useSearchRegex = /function useSearch\(\) \{([\s\S]*?)\n\}\n\nfunction useServices/;

const newUseSearch = `function useSearch() {
  const [pros, setPros] = useState<Professional[]>([]);
  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, 'users'), where('role', '==', 'professional'))),
      getDocs(collection(db, 'services'))
    ]).then(([usersSnap, servicesSnap]) => {
      const allDbServices = servicesSnap.docs.map(d => ({ ...d.data(), id: d.id }));
      
      const dbPros = usersSnap.docs.map(d => {
        const u = d.data();
        const proServices = allDbServices.filter((s:any) => s.professionalId === d.id);
        return {
          id: d.id, name: u.name, profession: u.profession || 'Professional',
          avatarUrl: u.avatarUrl || \`https://ui-avatars.com/api/?name=\${u.avatarInitial}&background=random\`,
          coverUrl: u.coverUrl || \`https://picsum.photos/seed/\${d.id}/600/300\`,
          rating: u.rating || 5.0, verified: true, services: proServices, description: u.description
        } as Professional;
      });
      setPros([...PROFESSIONALS, ...dbPros]);
    });
  }, []);
  return { pros };
}`;

code = code.replace(useSearchRegex, newUseSearch + '\n\nfunction useServices');

fs.writeFileSync('src/App.tsx', code);
console.log('Patched useSearch');

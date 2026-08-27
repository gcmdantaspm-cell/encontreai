const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function ChatListScreen\(\{ user, pros, isDark \}: any\) \{\s*const navigate = useNavigate\(\);\s*const \{ msgs \} = useChat\(user\?\.id\);\s*const chatPartners = Array\.from\(new Set\(msgs\.map\(\(m:any\) => m\.senderId === user\?\.id \? m\.receiverId : m\.senderId\)\)\);/;

const replacement = `function ChatListScreen({ user, pros, isDark }: any) {
  const navigate = useNavigate();
  const { msgs } = useChat(user?.id);
  const chatPartners = Array.from(new Set(msgs.map((m:any) => m.senderId === user?.id ? m.receiverId : m.senderId)));
  const [partnerNames, setPartnerNames] = useState<any>({});

  useEffect(() => {
    const fetchNames = async () => {
      const newNames = { ...partnerNames };
      for (const pid of chatPartners) {
        if (!newNames[pid as string]) {
          const pro = pros.find((p:any) => p.id === pid);
          if (pro) {
             newNames[pid as string] = pro.name;
          } else {
             try {
               const docSnap = await getDoc(doc(db, 'users', pid as string));
               if (docSnap.exists()) {
                 newNames[pid as string] = docSnap.data().name;
               } else {
                 newNames[pid as string] = 'Usuário';
               }
             } catch {
                 newNames[pid as string] = 'Usuário';
             }
          }
        }
      }
      setPartnerNames(newNames);
    };
    if (chatPartners.length > 0) fetchNames();
  }, [chatPartners.length, pros]);
`;

code = code.replace(regex, replacement);

const nameRegex = /const partnerName = pros\.find\(\(p:any\) => p\.id === pid\)\?\.name \|\| 'Cliente';/;
const nameReplacement = `const partnerName = partnerNames[pid as string] || 'Carregando...';`;

code = code.replace(nameRegex, nameReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed ChatListScreen names');

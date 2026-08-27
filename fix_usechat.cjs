const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function useChat\(uid\?: string\) \{\s*const \[msgs, setMsgs\] = useState<ChatMessage\[\]>\(\[\]\);\s*useEffect\(\(\) => \{\s*if\(!uid\) return;\s*const q = query\(collection\(db, 'messages'\), where\('participants', 'array-contains', uid\)\);\s*const unsub = onSnapshot\(q, snap => \{\s*let data = snap\.docs\.map\(d => \(\{ \.\.\.d\.data\(\), id: d\.id \} as ChatMessage\)\);\s*data\.sort\(\(a,b\) => new Date\(a\.createdAt\)\.getTime\(\) - new Date\(b\.createdAt\)\.getTime\(\)\);\s*setMsgs\(data\);\s*\}\);\s*return unsub;\s*\}, \[uid\]\);\s*const send = async \(to: string, text: string, type: 'text'\|'proposal' = 'text', proposal\?: any\) => \{\s*if\(!uid\) return;\s*await addDoc\(collection\(db, 'messages'\), \{\s*senderId: uid, receiverId: to, participants: \[uid, to\], text, type, proposal, createdAt: new Date\(\)\.toISOString\(\)\s*\}\);\s*\};\s*const updateMessage = async \(mid: string, updates: any\) => \{\s*await updateDoc\(doc\(db, 'messages', mid\), updates\);\s*\};\s*return \{ msgs, send, updateMessage \};\s*\}/;

const replacement = `function useChat(uid?: string) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  useEffect(() => {
    if(!uid) return;
    const q = query(collection(db, 'messages'), where('participants', 'array-contains', uid));
    const unsub = onSnapshot(q, snap => {
      let data = snap.docs.map(d => ({ ...d.data(), id: d.id } as ChatMessage));
      data.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMsgs(data);
    });
    return unsub;
  }, [uid]);
  const send = async (to: string, text: string, type: 'text'|'proposal' = 'text', proposal?: any) => {
    if(!uid) return;
    await addDoc(collection(db, 'messages'), {
      senderId: uid, receiverId: to, participants: [uid, to], text, type, proposal, createdAt: new Date().toISOString()
    });
  };
  const updateMessage = async (mid: string, updates: any) => {
    await updateDoc(doc(db, 'messages', mid), updates);
  };
  return { msgs, send, updateMessage };
}`;

if(code.match(regex)) {
   code = code.replace(regex, replacement);
   fs.writeFileSync('src/App.tsx', code);
   console.log('Fixed useChat');
} else {
   console.log('useChat already fixed or not found');
}

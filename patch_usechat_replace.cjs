const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const send = async (receiverId: string, text: string) => {
    if(!uid) return;
    await addDoc(collection(db, 'chats'), { senderId: uid, receiverId, text, participants: [uid, receiverId], createdAt: new Date().toISOString() });
  };
  return { msgs, send };`;

const replacement = `  const send = async (receiverId: string, text: string, type: 'text'|'proposal' = 'text', proposal?: any) => {
    if(!uid) return;
    await addDoc(collection(db, 'chats'), { senderId: uid, receiverId, text, participants: [uid, receiverId], createdAt: new Date().toISOString(), type, proposal });
  };
  const updateMessage = async (msgId: string, updates: any) => {
    await updateDoc(doc(db, 'chats', msgId), updates);
  };
  return { msgs, send, updateMessage };`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched useChat string replacement successfully");
} else {
  console.log("String didn't match useChat");
}

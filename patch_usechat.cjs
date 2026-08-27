const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const send = async (receiverId: string, text: string) => {\n    if(!uid) return;\n    await addDoc(collection(db, 'chats'), { senderId: uid, receiverId, text, participants: [uid, receiverId], createdAt: new Date().toISOString() });\n  };\n  return { msgs, send };",
  `const send = async (receiverId: string, text: string, type: 'text'|'proposal' = 'text', proposal?: any) => {
    if(!uid) return;
    await addDoc(collection(db, 'chats'), { senderId: uid, receiverId, text, participants: [uid, receiverId], createdAt: new Date().toISOString(), type, proposal });
  };
  const updateMessage = async (msgId: string, updates: any) => {
    await updateDoc(doc(db, 'chats', msgId), updates);
  };
  return { msgs, send, updateMessage };`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched useChat");

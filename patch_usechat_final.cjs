const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const send = async \(receiverId: string, text: string\) => \{\n    if\(\!uid\) return;\n    await addDoc\(collection\(db, 'chats'\), \{ senderId: uid, receiverId, text, participants: \[uid, receiverId\], createdAt: new Date\(\)\.toISOString\(\) \}\);\n  \};\n  return \{ msgs, send \};\n\}/m;

const replacement = `const send = async (receiverId: string, text: string, type: 'text'|'proposal' = 'text', proposal?: any) => {
    if(!uid) return;
    await addDoc(collection(db, 'chats'), { senderId: uid, receiverId, text, participants: [uid, receiverId], createdAt: new Date().toISOString(), type, proposal });
  };
  const updateMessage = async (msgId: string, updates: any) => {
    await updateDoc(doc(db, 'chats', msgId), updates);
  };
  return { msgs, send, updateMessage };
}`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched useChat FINAL successfully");
} else {
  console.log("Regex didn't match useChat FINAL");
}

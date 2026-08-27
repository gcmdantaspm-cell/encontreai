const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /function ChatListScreen\(\{ user, pros, isDark \}: any\) \{([\s\S]*?)<div className="p-4 pb-24">/;
code = code.replace(regex, `function ChatListScreen({ user, pros, isDark }: any) {
  const navigate = useNavigate();
  const { msgs } = useChat(user?.id);
  const chatPartners = Array.from(new Set(msgs.map((m:any) => m.senderId === user?.id ? m.receiverId : m.senderId)));

  return (
    <div className="pb-24">
      <header className={\`flex justify-center items-center px-4 pt-4 pb-2 relative \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-sidebar'))} className={\`absolute left-4 w-10 h-10 flex items-center justify-center \${isDark?'text-white':'text-black'}\`}>
          <Icon name="menu" size={24} />
        </button>
        <Logo isDark={isDark} hideSubtitle={true} />
      </header>
      <div className="p-4">`);
fs.writeFileSync('src/App.tsx', code);
console.log('Patched ChatListScreen');

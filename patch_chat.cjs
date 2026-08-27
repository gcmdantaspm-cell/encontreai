const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className=\{`p-4 border-t flex gap-2 pb-8 \$\{isDark\?'bg-\[#27272a\] border-\[#3f3f46\]':'bg-white'\}`\}>[\s\S]*?<\/div>/;

const replacement = `<div className={\`p-4 border-t flex gap-2 pb-8 items-center \${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white'}\`}>
        <button onClick={() => { if(partnerId) send(partnerId, '📷 [Anexo de Imagem da situação]'); }} className={\`w-10 h-10 rounded-full flex items-center justify-center transition-colors \${isDark?'bg-[#3f3f46] text-[#a1a1aa] hover:bg-[#52525b]':'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`} title="Anexar Imagem">
          <Icon name="attach_file" size={20} />
        </button>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&text&&partnerId){send(partnerId,text);setText('');}}} placeholder="Mensagem..." className={\`flex-1 border rounded-full px-4 py-3 outline-none text-sm \${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white'}\`} />
        <button onClick={()=>{if(text&&partnerId){send(partnerId,text);setText('');}}} className="w-10 h-10 rounded-full bg-[#f97316] flex items-center justify-center text-black shrink-0"><Icon name="send" size={20} /></button>
      </div>`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched ChatDetailScreen successfully");
} else {
  console.log("Regex didn't match ChatDetailScreen");
}

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const dashRegex = /<div className="p-4 pb-24">/;
code = code.replace(dashRegex, `<div className="pb-24">
      <header className={\`flex justify-center items-center px-4 pt-4 pb-2 relative \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-sidebar'))} className={\`absolute left-4 w-10 h-10 flex items-center justify-center \${isDark?'text-white':'text-black'}\`}>
          <Icon name="menu" size={24} />
        </button>
        <Logo isDark={isDark} hideSubtitle={true} />
      </header>
      <div className="p-4">`);

const chatRegex = /<div className="p-4 pb-24">/;
code = code.replace(chatRegex, `<div className="pb-24">
      <header className={\`flex justify-center items-center px-4 pt-4 pb-2 relative \${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}\`}>
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-sidebar'))} className={\`absolute left-4 w-10 h-10 flex items-center justify-center \${isDark?'text-white':'text-black'}\`}>
          <Icon name="menu" size={24} />
        </button>
        <Logo isDark={isDark} hideSubtitle={true} />
      </header>
      <div className="p-4">`);
      
// MyServicesScreen:
// It has `<div className="pb-24">` and already has `<header>` patched probably (or wait, I did it above). Let's check MyServicesScreen.

fs.writeFileSync('src/App.tsx', code);
console.log('Patched Dash and Chat headers');

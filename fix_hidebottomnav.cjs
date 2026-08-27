const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// const hideBottomNav = ['/login', '/cadastro'].includes(loc.pathname) || loc.pathname.startsWith('/servico/') || loc.pathname.startsWith('/chat');
code = code.replace(
  "const hideBottomNav = ['/login', '/cadastro'].includes(loc.pathname) || loc.pathname.startsWith('/servico/') || loc.pathname.startsWith('/chat');",
  "const hideBottomNav = ['/login', '/cadastro', '/auth'].includes(loc.pathname) || loc.pathname.startsWith('/servico/') || loc.pathname.startsWith('/chat/');"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed hideBottomNav');

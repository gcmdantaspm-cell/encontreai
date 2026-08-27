const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<button onClick={()=>navigate(-1)}><Icon name="arrow_back" /></button>',
  ''
);

fs.writeFileSync('src/App.tsx', code);
console.log('Removed back button from ChatListScreen');

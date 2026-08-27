const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /      <\/div>\n    <\/div>\n  \);\n\}\n\nfunction ChatDetailScreen/;
code = code.replace(regex, `      </div>\n    </div>\n    </div>\n  );\n}\n\nfunction ChatDetailScreen`);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed ChatListScreen divs');

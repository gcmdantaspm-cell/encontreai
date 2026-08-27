const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/      <\/div>\r?\n    <\/div>\r?\n  \)\r?\n\}\r?\n\r?\nfunction OrdersScreen/, `      </div>\n    </div>\n    </div>\n  )\n}\n\nfunction OrdersScreen`);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed MyServicesScreen');

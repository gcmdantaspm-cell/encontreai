const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// For DashboardProScreen
const dashEndRegex = /    <\/div>\n  \)\n\}\n\nfunction NewServiceScreen/;
code = code.replace(dashEndRegex, `    </div>\n    </div>\n  )\n}\n\nfunction NewServiceScreen`);

// For ChatListScreen
const chatEndRegex = /    <\/div>\n  \)\n\}\n\nfunction ChatDetailScreen/;
code = code.replace(chatEndRegex, `    </div>\n    </div>\n  )\n}\n\nfunction ChatDetailScreen`);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed divs');

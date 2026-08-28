const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Remove lg:hidden from the panel class again, just in case it's still there
code = code.replace(/lg:hidden/g, '');

fs.writeFileSync('src/components/Sidebar.tsx', code);

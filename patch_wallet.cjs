const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexDashboard = /const earned = apts\.filter\(a => a\.status === 'completed'\)\.reduce\(\(sum, a\) => sum \+ \(a\.price \* 0\.93\), 0\);/;

const replacementDashboard = `const earned = user.walletBalance || apts.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.price * 0.93), 0);`;

code = code.replace(regexDashboard, replacementDashboard);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed wallet display in dashboard');

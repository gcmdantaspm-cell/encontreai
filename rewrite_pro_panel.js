const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. We replace DashboardProScreen, NewServiceScreen, MyServicesScreen
const startIdx = code.indexOf('function DashboardProScreen');
const endIdx = code.indexOf('function SearchScreen', startIdx); // MyServicesScreen is before SearchScreen (Wait, let's check).
console.log('startIdx', startIdx);
console.log('endIdx', endIdx);

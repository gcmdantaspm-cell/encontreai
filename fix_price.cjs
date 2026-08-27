const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<CheckoutModal p=\{\{ proposal: \{ price: checkoutOrder\.price \} \}\}/g;
const replacement = `<CheckoutModal p={{ proposal: { price: Number(checkoutOrder.price) || 0 } }}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed CheckoutModal price cast');

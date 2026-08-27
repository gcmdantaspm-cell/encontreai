const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /add\(\{\s*professionalId: pro\.id,\s*clientId: user\.id,\s*serviceId: bookModal\.id,\s*serviceTitle: bookModal\.title,\s*price: totalPrice \|\| bookModal\.price,\s*date: d,\s*time: t,\s*status: 'approved',\s*clientName: user\.name,\s*professionalName: pro\.name,\s*paymentMethod\s*\}\);\s*setBookModal\(null\);/g;

const replacement = `await add({ professionalId: pro.id, clientId: user.id, serviceId: bookModal.id, serviceTitle: bookModal.title, price: totalPrice || bookModal.price, date: d, time: t, status: 'approved', clientName: user.name, professionalName: pro.name, paymentMethod }); setBookModal(null);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed await add in ProDetailScreen');

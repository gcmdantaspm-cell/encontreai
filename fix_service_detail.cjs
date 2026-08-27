const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /onBook=\{\(d:string, t:string\) => \{\s*add\(\{ professionalId: pro\.id, clientId: user\.id, serviceId: bookModal\.id, serviceTitle: bookModal\.title, price: bookModal\.price, date: d, time: t, status: 'approved', clientName: user\.name, professionalName: pro\.name \}\); setBookModal\(null\);\s*show\('Agendado com sucesso!'\); go\('orders'\); \}\}/;

code = code.replace(regex, `onBook={(d:any, t:any, addons:any, recurrence:any, totalPrice:any, paymentMethod:any) => { 
add({ professionalId: pro.id, clientId: user.id, serviceId: bookModal.id, serviceTitle: bookModal.title, price: totalPrice || bookModal.price, date: d, time: t, status: 'approved', clientName: user.name, professionalName: pro.name, paymentMethod }); setBookModal(null); 
show(\`Pagamento concluído via \${paymentMethod}! Reserva confirmada.\`); go('orders'); }}`);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed onBook with regex');

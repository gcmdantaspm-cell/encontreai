const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex1 = /onBook=\{async\(d:any, t:any, selectedAddons:any\[\], recurrence:string, totalPrice:number\)=>\{\s*await addDoc\(collection\(db, 'appointments'\), \{ professionalId: bookingService\.pro\.id, clientId: user\.id, clientName: user\.name, serviceId: bookingService\.id, serviceTitle: bookingService\.title, date: d, time: t, status: 'pending', price: totalPrice \|\| bookingService\.price, recurrence, addons: selectedAddons, createdAt: new Date\(\)\.toISOString\(\) \}\);\s*setBookingService\(null\); show\('Agendamento solicitado!'\); navigate\('\/pedidos'\);\s*\}\}/g;

const newOnBook1 = `onBook={async(d:any, t:any, selectedAddons:any[], recurrence:string, totalPrice:number, paymentMethod:string)=>{
                await addDoc(collection(db, 'appointments'), { professionalId: bookingService.pro.id, clientId: user.id, clientName: user.name, serviceId: bookingService.id, serviceTitle: bookingService.title, date: d, time: t, status: 'approved', price: totalPrice || bookingService.price, recurrence, addons: selectedAddons, paymentMethod, createdAt: new Date().toISOString() });
                setBookingService(null); show(\`Pagamento aprovado via \${paymentMethod}! Dinheiro retido e reserva confirmada.\`); navigate('/pedidos');
             }}`;

code = code.replace(regex1, newOnBook1);

const regex2 = /onBook=\{\(d:any, t:any, addons:any, recurrence:any, totalPrice:any, paymentMethod:any\) => \{\s*add\(\{ professionalId: pro\.id, clientId: user\.id, serviceId: bookModal\.id, serviceTitle: bookModal\.title, price: totalPrice \|\| bookModal\.price, date: d, time: t, status: 'approved', clientName: user\.name, professionalName: pro\.name, paymentMethod \}\); setBookModal\(null\);\s*show\(\`Pagamento concluído via \$\{paymentMethod\}! Reserva confirmada.\`\); go\('orders'\); \}\}/;

const newOnBook2 = `onBook={async (d:any, t:any, addons:any, recurrence:any, totalPrice:any, paymentMethod:any) => { 
                add({ professionalId: pro.id, clientId: user.id, serviceId: bookModal.id, serviceTitle: bookModal.title, price: totalPrice || bookModal.price, date: d, time: t, status: 'approved', clientName: user.name, professionalName: pro.name, paymentMethod }); setBookModal(null); 
                show(\`Pagamento aprovado via \${paymentMethod}! Dinheiro retido e reserva confirmada.\`); go('orders'); }}`;

code = code.replace(regex2, newOnBook2);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed onBook props');

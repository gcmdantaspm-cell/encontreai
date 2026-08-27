const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace all onBook callbacks to accept the new arguments.
code = code.replace(
  /onBook=\{async\(d:any,t:any\)=>\{[\s\S]*?price: bookingService\.price, createdAt: new Date\(\)\.toISOString\(\) \}\);/g,
  `onBook={async(d:any, t:any, selectedAddons:any[], recurrence:string, totalPrice:number)=>{
                await addDoc(collection(db, 'appointments'), { professionalId: bookingService.pro ? bookingService.pro.id : pro.id, clientId: user.id, clientName: user.name, serviceId: bookingService.id, serviceTitle: bookingService.title, date: d, time: t, status: 'pending', price: totalPrice || bookingService.price, recurrence, addons: selectedAddons, createdAt: new Date().toISOString() });`
);

code = code.replace(
  /onBook=\{\(d:string, t:string\) => \{ \nadd\(\{ professionalId: pro\.id, clientId: user\.id, serviceId: bookModal\.id, serviceTitle: bookModal\.title, price: bookModal\.price, date: d, time: t, status: 'approved', clientName: user\.name, professionalName: pro\.name \}\);/g,
  `onBook={(d:any, t:any, selectedAddons:any[], recurrence:string, totalPrice:number) => { 
add({ professionalId: pro.id, clientId: user.id, serviceId: bookModal.id, serviceTitle: bookModal.title, price: totalPrice || bookModal.price, recurrence, addons: selectedAddons, date: d, time: t, status: 'approved', clientName: user.name, professionalName: pro.name });`
);

// We must also pass the 5th argument in BookingModal
code = code.replace(
  "onBook(d,t, selectedAddons, recurrence)",
  "onBook(d,t, selectedAddons, recurrence, totalPrice)"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched booking calls");

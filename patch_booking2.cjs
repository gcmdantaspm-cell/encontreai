const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "onBook(d,t, selectedAddons, recurrence)",
  "onBook(d,t, selectedAddons, recurrence, totalPrice)"
);

code = code.replace(
  "onBook={(d:string, t:string, addons:any[], recurrence:string) => { \nadd({ professionalId: pro.id, clientId: user.id, serviceId: bookModal.id, serviceTitle: bookModal.title, price: bookModal.price + (addons && addons.length > 0 ? addons.length * 15 : 0), addons, recurrence, date: d, time: t, status: 'approved', clientName: user.name, professionalName: pro.name }); setBookModal(null); \nshow('Agendado com sucesso!'); go('orders'); }}",
  ""
); // wait, that regex is getting messy.


const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "onBook={(d:string, t:string) => { \nadd({ professionalId: pro.id, clientId: user.id, serviceId: bookModal.id, serviceTitle: bookModal.title, price: bookModal.price, date: d, time: t, status: 'approved', clientName: user.name, professionalName: pro.name }); setBookModal(null); \nshow('Agendado com sucesso!'); go('orders'); }}",
  "onBook={(d:any, t:any, selectedAddons:any[], recurrence:string, totalPrice:number) => { \nadd({ professionalId: pro.id, clientId: user.id, serviceId: bookModal.id, serviceTitle: bookModal.title, price: totalPrice || bookModal.price, recurrence, addons: selectedAddons, date: d, time: t, status: 'approved', clientName: user.name, professionalName: pro.name }); setBookModal(null); \nshow('Agendado com sucesso!'); go('orders'); }}"
);

fs.writeFileSync('src/App.tsx', code);

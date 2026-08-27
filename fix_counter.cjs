const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "send(partnerId, `Contraproposta: R$ ${newPrice.toFixed(2)}`, 'proposal', { price: newPrice, status: 'pending' });",
  "const d = msg.proposal.date || ''; const t = msg.proposal.time || ''; send(partnerId, `Contraproposta: R$ ${newPrice.toFixed(2)} - ${d} às ${t}`, 'proposal', { price: newPrice, date: d, time: t, status: 'pending' });"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed counter proposal');

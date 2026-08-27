const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const handlePaymentComplete = async \(\) => \{[\s\S]*?setCheckoutProposal\(null\);\n    \}\n  \};/m;

const replacement = `const handlePaymentComplete = async () => {
    if(checkoutProposal) {
      await add({ professionalId: checkoutProposal.senderId === user.id ? partnerId : checkoutProposal.senderId, clientId: user.id, clientName: user.name, serviceId: 'custom', serviceTitle: 'Serviço Personalizado', price: checkoutProposal.proposal.price, date: new Date().toISOString().split('T')[0], time: 'A Combinar', status: 'paid' });
      await updateMessage(checkoutProposal.id, { 'proposal.status': 'paid' });
      setCheckoutProposal(null);
      alert('Pagamento aprovado e valor retido com segurança!');
    }
  };`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched Payment Complete successfully");
} else {
  console.log("Regex didn't match Payment Complete");
}

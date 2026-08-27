const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const handlePaymentComplete = async \(\) => \{[\s\S]*?alert\('Pagamento aprovado e valor retido com segurança!'\);\n    \}\n  \};/m;

const replacement = `const handlePaymentComplete = async () => {
    if(checkoutProposal) {
      try {
        const price = checkoutProposal.proposal.price;
        const fee = price * 0.05;
        
        // Call our backend API to create a Stripe session
        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalId: checkoutProposal.id,
            serviceTitle: 'Serviço Personalizado',
            price,
            fee
          })
        });
        
        const data = await res.json();
        if(data.url) {
          // Update DB before redirecting (in a real app, use Webhooks)
          await add({ professionalId: checkoutProposal.senderId === user.id ? partnerId : checkoutProposal.senderId, clientId: user.id, clientName: user.name, serviceId: 'custom', serviceTitle: 'Serviço Personalizado', price: checkoutProposal.proposal.price, date: new Date().toISOString().split('T')[0], time: 'A Combinar', status: 'paid' });
          await updateMessage(checkoutProposal.id, { 'proposal.status': 'paid' });
          setCheckoutProposal(null);
          
          window.location.href = data.url; // Redirect to Stripe Checkout
        } else {
          alert('Erro ao criar sessão de pagamento: ' + (data.error || 'Desconhecido'));
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao conectar com o provedor de pagamentos.');
      }
    }
  };`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched Payment Complete successfully");
} else {
  console.log("Regex didn't match Payment Complete");
}

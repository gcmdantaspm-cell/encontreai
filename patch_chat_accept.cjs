const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexAccept = /const handleAccept = \(msg: any\) => \{\s*updateMessage\(msg\.id, \{ 'proposal\.status': 'accepted' \}\);\s*\};/;
const replacementAccept = `const handleAccept = async (msg: any) => {
    await updateMessage(msg.id, { 'proposal.status': 'accepted' });
    
    const proId = msg.senderId === user.id ? partnerId : msg.senderId;
    const clientId = user.role === 'client' ? user.id : partnerId;
    const clientName = user.role === 'client' ? user.name : 'Cliente';
    const price = msg.proposal.price;
    const date = msg.proposal.date || new Date().toISOString().split('T')[0];
    const time = msg.proposal.time || 'A Combinar';
    
    await add({ 
      professionalId: proId, 
      clientId: clientId, 
      clientName: clientName, 
      serviceId: 'custom', 
      serviceTitle: 'Serviço Personalizado', 
      price: price, 
      date: date, 
      time: time, 
      status: 'pending_payment', 
      paymentMethod: '',
      chatMsgId: msg.id
    });
    alert('Proposta aceita! O pedido foi gerado em Meus Pedidos para pagamento.');
  };`;

code = code.replace(regexAccept, replacementAccept);

const regexChatCheckout = /\{user\?\.role === 'client' \? \(\s*<button onClick=\{\(\)=>setCheckoutProposal\(m\)\} className="w-full mt-2 py-2 bg-green-500 text-white font-black rounded-lg text-sm shadow-md active:scale-95 transition-transform">Pagar Agora<\/button>\s*\) : \(/;
const replacementChatCheckout = `{user?.role === 'client' ? (
      <button onClick={() => navigate('/pedidos')} className="w-full mt-2 py-2 bg-green-500 text-white font-black rounded-lg text-sm shadow-md active:scale-95 transition-transform">Ir para Pedidos Pagar</button>
    ) : (`;
code = code.replace(regexChatCheckout, replacementChatCheckout);

fs.writeFileSync('src/App.tsx', code);
console.log('Chat accept patched');

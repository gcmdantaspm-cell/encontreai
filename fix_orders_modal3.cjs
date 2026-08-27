const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<AnimatePresence>\s*\{checkoutOrder && <CheckoutModal[\s\S]*?isDark=\{isDark\} \/>\}\s*<\/AnimatePresence>/;

const replacement = `<AnimatePresence>
        {checkoutOrder && <CheckoutModal p={{ proposal: { price: checkoutOrder.price } }} onClose={()=>setCheckoutOrder(null)} onPay={async (method)=>{
          try {
            await updateStatus(checkoutOrder.id, 'approved');
            // Update the chat message as well if it exists
            if (checkoutOrder.chatMsgId) {
              await updateDoc(doc(db, 'chats', checkoutOrder.chatMsgId), { 'proposal.status': 'paid' }).catch(e => console.error('Chat update failed', e));
            }
            setCheckoutOrder(null);
            if(show) show('Pagamento via ' + method + ' aprovado! Reserva confirmada e código gerado.');
          } catch(e) {
            console.error('Payment error', e);
            alert('Erro ao processar pagamento: ' + e.message);
          }
        }} isDark={isDark} />}
      </AnimatePresence>`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed onPay try-catch');

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const handlePaymentComplete = async \(\) => \{[\s\S]*?if\(checkoutProposal\) \{[\s\S]*?try \{[\s\S]*?const res = await fetch\('\/api\/create-checkout-session'[\s\S]*?const data = await res\.json\(\);[\s\S]*?if\(data\.url\) \{[\s\S]*?\}\s*\} catch \(err\) \{[\s\S]*?\}[\s\S]*?\}\s*\};/;

code = code.replace(regex, `const handlePaymentComplete = async (method: string) => {
    if(checkoutProposal) {
      try {
        const price = checkoutProposal.proposal.price;
        // Mock successful payment
        await add({ professionalId: checkoutProposal.senderId === user.id ? partnerId : checkoutProposal.senderId, clientId: user.id, clientName: user.name, serviceId: 'custom', serviceTitle: 'Serviço Personalizado', price: price, date: checkoutProposal.proposal.date || new Date().toISOString().split('T')[0], time: checkoutProposal.proposal.time || 'A Combinar', status: 'approved', paymentMethod: method });
        await updateMessage(checkoutProposal.id, { 'proposal.status': 'paid' });
        setCheckoutProposal(null);
        alert('Pagamento via ' + method + ' concluído com sucesso!');
      } catch (err) {
        console.error(err);
        alert('Erro ao concluir pagamento.');
      }
    }
  };`);

const checkoutModalRegex = /<button onClick=\{onPay\} className="w-full py-4 rounded-xl font-black text-lg text-black bg-\[#f97316\] active:scale-95 transition-transform">\s*Pagar R\$ \{total\.toFixed\(2\)\}\s*<\/button>/;

code = code.replace(checkoutModalRegex, `<button onClick={() => onPay(method)} className="w-full py-4 rounded-xl font-black text-lg text-black bg-[#f97316] active:scale-95 transition-transform">
            Pagar R$ {total.toFixed(2)}
          </button>`);

const methodDebitRegex = /<button onClick=\{\(\)=>setMethod\('credit'\)\} className=\{\`p-4 rounded-xl border flex items-center gap-3 transition-colors \$\{method === 'credit' \? 'border-\[#f97316\] bg-\[#fff7ed\] dark:bg-\[#f97316\]\/10' : \(isDark \? 'bg-\[#1e1e1e\] border-\[#2a2a2a\]' : 'bg-white border-gray-200'\)\}\`\}>[\s\S]*?<\/button>/;

const addDebitMethod = `<button onClick={()=>setMethod('credit')} className={\`p-4 rounded-xl border flex items-center gap-3 transition-colors \${method === 'credit' ? 'border-[#f97316] bg-[#fff7ed] dark:bg-[#f97316]/10' : (isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-gray-200')}\`}>
              <Icon name="credit_card" className={method==='credit'?'text-[#f97316]':''} />
              <span className="font-bold flex-1 text-left">Cartão de Crédito</span>
              {method === 'credit' && <Icon name="check_circle" className="text-[#f97316]" />}
            </button>
            <button onClick={()=>setMethod('debit')} className={\`p-4 rounded-xl border flex items-center gap-3 transition-colors \${method === 'debit' ? 'border-[#f97316] bg-[#fff7ed] dark:bg-[#f97316]/10' : (isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-gray-200')}\`}>
              <Icon name="credit_score" className={method==='debit'?'text-[#f97316]':''} />
              <span className="font-bold flex-1 text-left">Cartão de Débito</span>
              {method === 'debit' && <Icon name="check_circle" className="text-[#f97316]" />}
            </button>`;

code = code.replace(methodDebitRegex, addDebitMethod);

fs.writeFileSync('src/App.tsx', code);
console.log('Payment modal updated');

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add CheckoutOrder state
const regexState = /const \[reviewModal, setReviewModal\] = useState<any>\(null\);/;
const replacementState = `const [reviewModal, setReviewModal] = useState<any>(null);
  const [checkoutOrder, setCheckoutOrder] = useState<any>(null);`;
code = code.replace(regexState, replacementState);

// 2. Add pending_payment to filters
const regexFilter = /const filtered = apts\.filter\(a => filter === 'all' \|\| \(filter === 'active' && \(a\.status === 'approved' \|\| a\.status === 'pending'\)\) \|\| \(filter === 'done' && a\.status === 'completed'\) \|\| \(filter === 'cancelled' && a\.status === 'cancelled'\)\);/;
const replacementFilter = `const filtered = apts.filter(a => filter === 'all' || (filter === 'active' && (a.status === 'approved' || a.status === 'pending' || a.status === 'pending_payment')) || (filter === 'done' && a.status === 'completed') || (filter === 'cancelled' && a.status === 'cancelled'));`;
code = code.replace(regexFilter, replacementFilter);

// 3. Add pending_payment to stCfg
const regexStCfg = /pending: \{ label: 'Em Andamento', border: '#f97316', badgeBg: isDark \? '#ffedd5' : '#ffedd5', badgeText: '#9a3412' \},/;
const replacementStCfg = `pending: { label: 'Em Andamento', border: '#f97316', badgeBg: isDark ? '#ffedd5' : '#ffedd5', badgeText: '#9a3412' },
                 pending_payment: { label: 'Aguardando Pagamento', border: '#eab308', badgeBg: isDark ? '#fef08a' : '#fef08a', badgeText: '#854d0e' },`;
code = code.replace(regexStCfg, replacementStCfg);

// 4. Add Pagar Agora button
const regexClientControls = /\{user\.role === 'client' && a\.status === 'approved' && \(/;
const replacementClientControls = `{user.role === 'client' && a.status === 'pending_payment' && (
                     <button onClick={()=>setCheckoutOrder(a)} className="w-full mt-2 py-2 bg-green-500 text-white rounded-lg text-xs font-black active:scale-95 shadow-md flex items-center justify-center gap-2"><Icon name="payments" size={16} /> Pagar Agora</button>
                   )}
                   {user.role === 'client' && a.status === 'approved' && (`;
code = code.replace(regexClientControls, replacementClientControls);

// 5. Add CheckoutModal inside OrdersScreen
const regexBottomOrders = /<\/div>\s*\)\s*\}\s*function AuthScreen/;
const replacementBottomOrders = `
        <AnimatePresence>
          {checkoutOrder && <CheckoutModal p={{ proposal: { price: checkoutOrder.price } }} onClose={()=>setCheckoutOrder(null)} onPay={async (method)=>{
            updateStatus(checkoutOrder.id, 'approved');
            setCheckoutOrder(null);
            if(show) show('Pagamento via ' + method + ' aprovado! Reserva confirmada e código gerado.');
          }} isDark={isDark} />}
        </AnimatePresence>
      </div>
    </div>
  )
}

function AuthScreen`;
code = code.replace(regexBottomOrders, replacementBottomOrders);

fs.writeFileSync('src/App.tsx', code);
console.log('Orders patched');

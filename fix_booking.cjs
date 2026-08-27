const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// We will inject the state into BookingModal
const bookingModalRegex = /function BookingModal\(\{ proId, svc, onClose, onBook, isDark \}: any\) \{/;
code = code.replace(bookingModalRegex, `function BookingModal({ proId, svc, onClose, onBook, isDark }: any) {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');`);

// Update the bottom fixed bar in BookingModal
const bottomBarRegex = /<div className="fixed bottom-0 left-0 w-full max-w-\[448px\] bg-white dark:bg-\[#1e1e1e\] border-t border-gray-200 dark:border-\[#2a2a2a\] p-4 z-\[101\]">\s*<div className="flex justify-between items-center mb-3">\s*<span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total \{recurrence !== 'once' && \`\(por sessão\)\`\}<\/span>\s*<span className="font-black text-xl text-\[#002a5d\] dark:text-\[#60a5fa\]">R\$ \{totalPrice\.toFixed\(2\)\}<\/span>\s*<\/div>\s*<button onClick=\{\(\) => onBook\(d,t, selectedAddons, recurrence, totalPrice\)\} disabled=\{\!d\|\|\!t\|\|\!isDayAvailable\} className="w-full py-4 rounded-xl font-black text-lg text-black disabled:opacity-50 bg-\[#f97316\] active:scale-95 transition-transform">Confirmar Agendamento<\/button>\s*<\/div>/;

code = code.replace(bottomBarRegex, `<div className="fixed bottom-0 left-0 w-full max-w-[448px] bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-[#2a2a2a] p-4 z-[101]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total {recurrence !== 'once' && \`(por sessão)\`}</span>
            <span className="font-black text-xl text-[#002a5d] dark:text-[#60a5fa]">R$ {totalPrice.toFixed(2)}</span>
          </div>
          {step === 1 ? (
             <button onClick={() => setStep(2)} disabled={!d||!t||!isDayAvailable} className="w-full py-4 rounded-xl font-black text-lg text-black disabled:opacity-50 bg-[#f97316] active:scale-95 transition-transform">Avançar para Pagamento</button>
          ) : (
             <button onClick={() => onBook(d,t, selectedAddons, recurrence, totalPrice, paymentMethod)} disabled={!paymentMethod} className="w-full py-4 rounded-xl font-black text-lg text-black disabled:opacity-50 bg-[#f97316] active:scale-95 transition-transform">Confirmar e Pagar</button>
          )}
        </div>`);

// Replace the content to wrap step 1 and add step 2
const oldContentRegex = /<div className="flex-1 overflow-y-auto p-4 pb-32">([\s\S]*?)<\/div>\s*<div className="fixed bottom-0/;

const oldContentMatch = code.match(oldContentRegex);
if(oldContentMatch) {
   const newContent = `<div className="flex-1 overflow-y-auto p-4 pb-32">
          {step === 1 ? (
             <>
                ${oldContentMatch[1]}
             </>
          ) : (
             <>
                <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Forma de Pagamento</h2>
                <div className="flex flex-col gap-3">
                   {['Pix', 'Cartão de Crédito', 'Cartão de Débito'].map(pm => (
                      <label key={pm} className={\`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors \${paymentMethod === pm ? 'bg-orange-50 dark:bg-orange-900/10 border-[#f97316]' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a]'}\`}>
                         <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${paymentMethod === pm ? 'border-[#f97316]' : 'border-gray-300 dark:border-gray-600'}\`}>
                            {paymentMethod === pm && <div className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />}
                         </div>
                         <span className="font-bold text-gray-900 dark:text-gray-100">{pm}</span>
                      </label>
                   ))}
                </div>
                <div className="mt-8 p-4 bg-gray-50 dark:bg-[#27272a] rounded-xl border border-gray-200 dark:border-[#3f3f46]">
                   <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                     O valor será retido de forma segura e só será repassado ao profissional após a conclusão do serviço.
                   </p>
                </div>
             </>
          )}
        </div>
        <div className="fixed bottom-0`;
   code = code.replace(oldContentRegex, newContent);
}

fs.writeFileSync('src/App.tsx', code);
console.log('BookingModal updated with fake payment.');

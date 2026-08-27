const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Escolha a Data<\/h2>[\s\S]*?(?=<div className="fixed bottom-0 left-0 w-full max-w-\[448px\])/;

const newFormCode = `{step === 1 ? (
          <>
            <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Escolha a Data</h2>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 mb-6">
              {nextDays.map(date => {
                const iso = date.toISOString().split('T')[0];
                const isSelected = d === iso;
                const weekDay = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][date.getDay()];
                const dayNum = date.getDate();
                return (
                  <button 
                    key={iso} 
                    onClick={() => { setD(iso); setT(''); }}
                    className={\`w-[72px] shrink-0 aspect-[3/4] rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors \${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 dark:border-blue-400' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a]'}\`}
                  >
                    <span className={\`text-xs font-bold \${isSelected ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}\`}>{weekDay}</span>
                    <span className={\`text-xl font-black \${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}\`}>{dayNum}</span>
                  </button>
                )
              })}
            </div>

            <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Horários Disponíveis</h2>
            {!d ? (
              <p className="text-sm text-gray-500 font-medium mb-6">Selecione uma data para ver os horários.</p>
            ) : !isDayAvailable ? (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold text-center mb-6">
                O profissional não atende neste dia.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {availableHours.map((h: string) => {
                  const isOccupied = occupiedTimes.includes(h);
                  const isSelected = t === h;
                  return (
                    <button 
                      key={h} 
                      disabled={isOccupied} 
                      onClick={()=>setT(h)}
                      className={\`py-3 rounded-xl text-sm font-bold border transition-colors \${isOccupied ? 'opacity-30 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-[#2a2a2a] cursor-not-allowed text-gray-400' : isSelected ? 'bg-[#ffedd5] dark:bg-[#f97316] text-[#9a3412] dark:text-black border-[#f97316]' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a] text-gray-800 dark:text-gray-200'}\`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            )}
              
            <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Serviços Adicionais (Modulares)</h2>
            <div className="flex flex-col gap-3 mb-6">
              {addons.map((a:any) => {
                const isSelected = selectedAddons.includes(a.id);
                return (
                  <label key={a.id} className={\`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors \${isSelected ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a]'}\`}>
                    <div className="flex items-center gap-3">
                      <div className={\`w-6 h-6 rounded border flex items-center justify-center \${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'}\`}>
                        {isSelected && <Icon name="check" size={16} />}
                      </div>
                      <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{a.name}</span>
                    </div>
                    <span className="font-black text-sm text-[#002a5d] dark:text-[#60a5fa]">+ R$ {a.price.toFixed(2)}</span>
                    <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleAddon(a.id)} />
                  </label>
                );
              })}
            </div>

            <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Tornar este agendamento recorrente?</h2>
            <div className="flex bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden mb-6">
              <button onClick={() => setRecurrence('once')} className={\`flex-1 py-3 text-xs font-bold transition-colors \${recurrence === 'once' ? 'bg-[#3730a3] text-white' : 'text-gray-500 dark:text-gray-400'}\`}>Única vez</button>
              <button onClick={() => setRecurrence('weekly')} className={\`flex-1 py-3 text-xs font-bold transition-colors border-x border-gray-200 dark:border-[#2a2a2a] \${recurrence === 'weekly' ? 'bg-[#3730a3] text-white' : 'text-gray-500 dark:text-gray-400'}\`}>Semanal</button>
              <button onClick={() => setRecurrence('biweekly')} className={\`flex-1 py-3 text-xs font-bold transition-colors \${recurrence === 'biweekly' ? 'bg-[#3730a3] text-white' : 'text-gray-500 dark:text-gray-400'}\`}>Quinzenal</button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">Resumo do Pedido</h2>
              <div className="p-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-black/20 text-sm">
                <p><strong>Data:</strong> {d} às {t}</p>
                <p><strong>Recorrência:</strong> {recurrence === 'once' ? 'Única vez' : recurrence === 'weekly' ? 'Semanal' : 'Quinzenal'}</p>
                {selectedAddons.length > 0 && <p><strong>Adicionais:</strong> {addons.filter((a:any)=>selectedAddons.includes(a.id)).map((a:any)=>a.name).join(', ')}</p>}
                <p className="mt-2 font-bold text-[#f97316]">R$ {totalPrice.toFixed(2)} (Taxa de agendamento inclusa)</p>
              </div>
            </div>

            <div>
              <h2 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Forma de Pagamento</h2>
              <div className="flex flex-col gap-3">
                <label className={\`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors \${paymentMethod === 'PIX' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a]'}\`}>
                  <Icon name="pix" size={24} className="text-teal-500" />
                  <span className="font-bold flex-1 text-gray-800 dark:text-gray-200">PIX (Aprovação imediata)</span>
                  <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'PIX'} onChange={() => setPaymentMethod('PIX')} />
                </label>

                <label className={\`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors \${paymentMethod === 'CREDIT_CARD' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a]'}\`}>
                  <Icon name="credit_card" size={24} className="text-blue-500" />
                  <span className="font-bold flex-1 text-gray-800 dark:text-gray-200">Cartão de Crédito</span>
                  <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'CREDIT_CARD'} onChange={() => setPaymentMethod('CREDIT_CARD')} />
                </label>

                <label className={\`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors \${paymentMethod === 'DEBIT_CARD' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a]'}\`}>
                  <Icon name="account_balance_wallet" size={24} className="text-purple-500" />
                  <span className="font-bold flex-1 text-gray-800 dark:text-gray-200">Cartão de Débito</span>
                  <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'DEBIT_CARD'} onChange={() => setPaymentMethod('DEBIT_CARD')} />
                </label>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-orange-50 dark:bg-[#2a1708] border border-orange-200 dark:border-orange-900 text-xs text-orange-800 dark:text-orange-200">
              <p className="font-bold mb-1"><Icon name="lock" size={14} className="inline mr-1" />Pagamento Seguro (Sistema Anticálculo)</p>
              <p>O seu dinheiro fica retido com a plataforma e só é repassado ao profissional (93%) mediante o fornecimento do seu código secreto no ato do serviço.</p>
            </div>
          </div>
        )}

        </div>`;

code = code.replace(regex, newFormCode);

// Also need to add a back button functionality on step 2 header if possible, or just onClose is fine.
// Let's modify the header:
const headerRegex = /<button onClick=\{onClose\} className="p-2"><Icon name="arrow_back" className="text-\[#002a5d\] dark:text-white" \/><\/button>/;
const newHeader = `<button onClick={() => step === 2 ? setStep(1) : onClose()} className="p-2"><Icon name="arrow_back" className="text-[#002a5d] dark:text-white" /></button>`;
code = code.replace(headerRegex, newHeader);


fs.writeFileSync('src/App.tsx', code);
console.log('Fixed BookingModal rendering step 2');

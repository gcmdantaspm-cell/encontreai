import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

function Icon({ name, className, size = 24 }: { name: string; className?: string; size?: number }) {
  return <span className={`material-symbols-outlined ${className || ''}`} style={{ fontSize: size }}>{name}</span>;
}

const FAQS = [
  {
    question: 'Como funciona o EncontreAí?',
    answer: 'O EncontreAí conecta clientes a profissionais locais. Você pode buscar por serviços, conversar via chat, negociar propostas, pagar diretamente pelo app com segurança e avaliar os profissionais após a conclusão do serviço.'
  },
  {
    question: 'Como faço para pagar por um serviço?',
    answer: 'Após acertar os detalhes com o profissional no chat, ele enviará uma Proposta. Clique em "Pagar" na proposta para ser redirecionado ao checkout seguro (Cartão de Crédito, Pix, etc). O valor fica retido conosco até a conclusão do serviço.'
  },
  {
    question: 'Como libero o pagamento para o profissional?',
    answer: 'Quando o serviço for finalizado, o profissional informará no sistema e você receberá um código de confirmação. Entregue este código ao profissional para que ele receba o valor retido.'
  },
  {
    question: 'Posso cancelar um agendamento?',
    answer: 'Sim, você pode cancelar antes da execução. Se o profissional já estiver a caminho ou já tiver começado, taxas de cancelamento podem se aplicar dependendo do acordo.'
  },
  {
    question: 'Como faço para me tornar um profissional?',
    answer: 'Acesse o menu Configurações ou o seu Perfil e selecione a opção "Alternar para Modo Profissional". A partir daí, você poderá criar anúncios dos seus serviços e ser encontrado por clientes na sua região.'
  }
];

export function HelpScreen({ isDark }: { isDark: boolean }) {
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    if (openIdx === idx) setOpenIdx(null);
    else setOpenIdx(idx);
  };

  return (
    <div className={`flex-1 overflow-y-auto h-full flex flex-col ${isDark ? 'bg-[#18181b]' : 'bg-[#f8f9fa]'}`}>
      <header className={`p-4 flex items-center gap-3 border-b sticky top-0 z-10 ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
        <button onClick={() => navigate(-1)} className={`p-2 rounded-full active:scale-95 transition-transform ${isDark ? 'hover:bg-[#3f3f46]' : 'hover:bg-gray-100'}`}>
          <Icon name="arrow_back" className={isDark ? 'text-white' : 'text-gray-900'} />
        </button>
        <h1 className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Ajuda & Suporte</h1>
      </header>

      <div className="p-4 flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <div className={`mb-8 p-6 rounded-2xl flex flex-col items-center text-center ${isDark ? 'bg-[#27272a]' : 'bg-white shadow-sm border border-[#e5e7eb]'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-[#3f3f46] text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
            <Icon name="support_agent" size={36} />
          </div>
          <h2 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Precisa de ajuda?</h2>
          <p className={`text-sm mb-6 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>
            Nossa equipe de suporte está pronta para tirar suas dúvidas e resolver qualquer problema.
          </p>
          <a 
            href="mailto:suporte@encontreai.com"
            className="px-6 py-3 bg-[#f97316] text-white font-bold rounded-xl shadow-md active:scale-95 transition-transform w-full sm:w-auto"
          >
            Falar com Suporte
          </a>
        </div>

        <h3 className={`font-bold text-lg mb-4 px-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Perguntas Frequentes (FAQ)</h3>
        
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, idx) => (
            <div 
              key={idx} 
              className={`rounded-xl border overflow-hidden transition-colors ${isDark ? 'border-[#3f3f46] bg-[#27272a]' : 'border-[#e5e7eb] bg-white'}`}
            >
              <button 
                onClick={() => toggle(idx)}
                className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
              >
                <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{faq.question}</span>
                <Icon 
                  name="expand_more" 
                  className={`transition-transform duration-300 ${openIdx === idx ? 'rotate-180' : ''} ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`} 
                />
              </button>
              
              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={`p-4 pt-0 text-sm leading-relaxed ${isDark ? 'text-[#a1a1aa]' : 'text-gray-600'}`}>
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Icon({ name, className, size }: { name: string, className?: string, size?: number }) {
  return <span className={`material-symbols-outlined ${className || ''}`} style={{ fontSize: size }}>{name}</span>;
}

export function Sidebar({ isOpen, close, user, isDark, logout, categories }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCatOpen, setIsCatOpen] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/50 z-[100] sm:max-w-[448px] sm:mx-auto"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] z-[101] shadow-2xl flex flex-col ${isDark ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'} sm:left-[calc(50%-224px)]`}
          >
            {/* Header */}
            <div className={`p-6 border-b ${isDark ? 'border-[#27272a]' : 'border-gray-200'}`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Icon name="person" size={24} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-tight">{user?.name || 'Usuário'}</span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Membro EncontreAi</span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col px-4 gap-1">
              <button onClick={() => { navigate('/busca'); close(); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/busca' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`}>
                <Icon name="home" /> Início
              </button>
              <button onClick={() => { navigate('/perfil'); close(); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/perfil' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`}>
                <Icon name="person" /> Perfil
              </button>
              <button onClick={() => { navigate('/busca', { state: { view: 'map' }}); close(); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]`}>
                <Icon name="location_on" /> Profissionais Perto de Mim
              </button>
              
              <div className="flex flex-col">
                <button onClick={() => setIsCatOpen(!isCatOpen)} className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]`}>
                  <div className="flex items-center gap-4"><Icon name="category" /> Categorias</div>
                  <Icon name={isCatOpen ? 'expand_less' : 'expand_more'} size={20} />
                </button>
                <AnimatePresence>
                  {isCatOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden flex flex-col pl-12 pr-4 pt-1 gap-2">
                      <button onClick={() => { navigate('/busca'); close(); }} className={`text-left py-2 text-sm font-medium transition-colors ${isDark?'text-gray-400 hover:text-white':'text-gray-500 hover:text-black'}`}>Ver Todas</button>
                      {categories?.map((c: any) => (
                         <button key={c.id} onClick={() => { navigate('/busca', { state: { category: c.id }}); close(); setIsCatOpen(false); }} className={`text-left py-2 text-sm font-medium transition-colors flex items-center gap-2 ${isDark?'text-gray-400 hover:text-white':'text-gray-500 hover:text-black'}`}>
                           <Icon name={c.icon || 'category'} size={16} /> {c.name}
                         </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

                            <button onClick={() => { navigate('/favoritos'); close(); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/favoritos' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`}>
                <Icon name="favorite_border" /> Favoritos
              </button>
              <button onClick={() => { navigate('/pedidos'); close(); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/pedidos' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`}>
                <Icon name="calendar_today" /> Meus Pedidos
              </button>

              <hr className={`my-2 ${isDark ? 'border-[#27272a]' : 'border-gray-200'}`} />

              <button onClick={() => { navigate('/painel-profissional/dashboard'); close(); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]`}>
                <Icon name="dashboard" /> Painel do Profissional
              </button>
              <button onClick={() => { navigate('/chat-list'); close(); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]`}>
                <Icon name="chat" /> Minhas Mensagens
              </button>
              <button onClick={close} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]`}>
                <Icon name="settings" /> Configurações
              </button>
              <button onClick={close} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]`}>
                <Icon name="help_outline" /> Ajuda e Suporte
              </button>
            </div>

            {/* Logout */}
            <div className={`p-4 border-t ${isDark ? 'border-[#27272a]' : 'border-gray-200'}`}>
              <button onClick={() => { if(logout) logout(); close(); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full`}>
                <Icon name="logout" /> Sair
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Icon({ name, className }: { name: string, className?: string }) {
  return <span className={`material-symbols-outlined ${className || ''}`}>{name}</span>;
}

export function Sidebar({ isOpen, close, user, isDark, logout }: any) {
  const navigate = useNavigate();
  const location = useLocation();

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
              <button onClick={() => { navigate('/busca'); close(); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]`}>
                <Icon name="category" /> Categorias
              </button>
              <button onClick={() => { navigate('/busca', { state: { filter: 'favorites' }}); close(); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]`}>
                <Icon name="favorite_border" /> Favoritos
              </button>
              <button onClick={() => { navigate('/pedidos'); close(); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/pedidos' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`}>
                <Icon name="calendar_today" /> Meus Pedidos
              </button>

              <hr className={`my-2 ${isDark ? 'border-[#27272a]' : 'border-gray-200'}`} />

              <button onClick={() => { navigate('/agenda'); close(); }} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a]`}>
                <Icon name="sync_alt" /> Modo Profissional
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

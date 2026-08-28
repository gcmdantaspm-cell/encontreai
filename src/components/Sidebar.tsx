import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Icon({ name, className, size }: { name: string, className?: string, size?: number }) {
  return <span className={`material-symbols-outlined ${className || ''}`} style={{ fontSize: size }}>{name}</span>;
}

export function Sidebar({ isOpen, close, user, isDark, logout, categories, currentRole, setCurrentRole, updateProfile }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCatOpen, setIsCatOpen] = useState(false);

  // Close sidebar on location change for mobile
  useEffect(() => {
    close();
  }, [location.pathname, close]);

  const toggleRole = () => {
    if (setCurrentRole) {
      const newRole = currentRole === 'client' ? 'professional' : 'client';
      setCurrentRole(newRole);
      if (updateProfile) updateProfile({ currentMode: newRole });
      close();
      navigate(newRole === 'professional' ? '/painel-profissional/dashboard' : '/busca');
    }
  };

  const ClientMenu = () => (
    <>
      <button onClick={() => navigate('/busca')} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/busca' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`} aria-label="Home">
        <Icon name="home" /> Home
      </button>
      <button onClick={() => navigate('/pesquisa')} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/pesquisa' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`} aria-label="Buscar">
        <Icon name="search" /> Buscar
      </button>
      <button onClick={() => navigate('/pedidos')} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/pedidos' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`}>
        <Icon name="assignment" /> Meus Serviços
      </button>
      <button onClick={() => navigate('/perfil')} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/perfil' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`}>
        <Icon name="settings" /> Perfil
      </button>
    </>
  );

  const ProviderMenu = () => (
    <>
      <button onClick={() => navigate('/painel-profissional/dashboard')} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${location.pathname.startsWith('/painel-profissional/dashboard') ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`}>
        <Icon name="dashboard" /> Painel
      </button>
      <button onClick={() => navigate('/painel-profissional/servicos')} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${location.pathname.startsWith('/painel-profissional/servicos') ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`}>
        <Icon name="campaign" /> Meus Anúncios
      </button>
      <button onClick={() => navigate('/pedidos')} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/pedidos' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`}>
        <Icon name="assignment" /> Serviços a Realizar
      </button>
      <button onClick={() => navigate('/perfil')} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${location.pathname === '/perfil' ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`}>
        <Icon name="settings" /> Perfil
      </button>
    </>
  );

  const SidebarContent = () => (
    <div className="flex-1 overflow-y-auto py-4 flex flex-col px-4 gap-1 hide-scrollbar">
      {currentRole === 'client' ? <ClientMenu /> : <ProviderMenu />}
      
      <hr className={`my-2 ${isDark ? 'border-[#27272a]' : 'border-gray-200'}`} />
      
      <button onClick={toggleRole} className={`flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-colors bg-[#3730a3] text-white hover:opacity-90`}>
        <Icon name="swap_horiz" /> {currentRole === 'client' ? 'Alternar para Modo Profissional' : 'Voltar para Modo Cliente'}
      </button>
    </div>
  );

  return (
    <>
      

      {/* Mobile Sidebar: Overlay & Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] z-[101] shadow-2xl flex flex-col  ${isDark ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'}`}
              role="dialog"
              aria-modal="true"
              aria-label="Menu Principal"
            >
              <div className={`p-6 border-b ${isDark ? 'border-[#27272a]' : 'border-gray-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white shadow-md">
                    <Icon name="handshake" size={20} />
                  </div>
                  <span className="font-black text-xl tracking-tight">Encontre<span className="text-[#f97316]">Aí</span></span>
                </div>
                <button onClick={close} className="p-2 rounded-full bg-gray-100 dark:bg-[#27272a]" aria-label="Fechar Menu">
                  <Icon name="close" size={20} />
                </button>
              </div>

              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

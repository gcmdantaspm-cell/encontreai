import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Icon({ name, className, size }: { name: string, className?: string, size?: number }) {
  return <span className={`material-symbols-outlined ${className || ''}`} style={{ fontSize: size }}>{name}</span>;
}

export function Sidebar({ isOpen, close, user, isDark, logout, categories, currentRole, setCurrentRole, updateProfile }: any) {
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar on location change for mobile
  useEffect(() => {
    close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleRole = () => {
    if (setCurrentRole) {
      const newRole = currentRole === 'client' ? 'professional' : 'client';
      setCurrentRole(newRole);
      if (updateProfile) updateProfile({ currentMode: newRole });
      close();
      navigate(newRole === 'professional' ? '/painel-profissional/dashboard' : '/busca');
    }
  };

  const NavButton = ({ icon, label, path, onClick }: any) => {
    const active = location.pathname === path || (path !== '/busca' && path !== '/' && location.pathname.startsWith(path));
    return (
      <button 
        onClick={() => {
          if (onClick) onClick();
          else navigate(path);
        }} 
        className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-colors w-full text-left ${active ? 'bg-[#f97316] text-black' : 'hover:bg-gray-100 dark:hover:bg-[#27272a]'}`}
      >
        <Icon name={icon} /> {label}
      </button>
    );
  };

  return (
    <>
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
              className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] z-[101] shadow-2xl flex flex-col ${isDark ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'}`}
              role="dialog"
              aria-modal="true"
              aria-label="Menu Principal"
            >
              {/* Cabeçalho do Perfil */}
              <div className={`p-6 border-b ${isDark ? 'border-[#27272a]' : 'border-gray-200'} flex flex-col relative`}>
                <button onClick={close} className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-[#27272a]" aria-label="Fechar Menu">
                  <Icon name="close" size={20} />
                </button>
                
                {user ? (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                      <img src={user.avatarUrl || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop"} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-black text-lg truncate">{user.name}</h3>
                      <p className="text-sm opacity-70">EncontreAi Member</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white shadow-md">
                      <Icon name="handshake" size={24} />
                    </div>
                    <span className="font-black text-2xl tracking-tight">Encontre<span className="text-[#f97316]">Aí</span></span>
                  </div>
                )}
              </div>

              {/* Itens de Navegação Principal */}
              <div className="flex-1 overflow-y-auto py-4 flex flex-col px-4 gap-1 hide-scrollbar">
                <NavButton icon="home" label="Home" path="/busca" />
                <NavButton icon="person" label="Profile" path="/perfil" />
                <NavButton icon="location_on" label="Professionals Near Me" path="/pesquisa" />
                <NavButton icon="category" label="Categories" path="/categorias" />
                <NavButton icon="favorite" label="Favorites" path="/favoritos" />
                <NavButton icon="calendar_today" label="My Appointments" path="/pedidos" />
                
                <hr className={`my-4 ${isDark ? 'border-[#27272a]' : 'border-gray-200'}`} />
                
                {/* Seção Profissional */}
                <p className="px-4 text-xs font-bold uppercase tracking-wider opacity-50 mb-2">Modo</p>
                <button 
                  onClick={toggleRole} 
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-colors w-full text-left mb-4 ${currentRole === 'professional' ? 'bg-[#3730a3] text-white' : 'bg-gray-100 dark:bg-[#27272a]'}`}
                >
                  <Icon name="swap_horiz" /> {currentRole === 'client' ? 'Professional Mode' : 'Client Mode'}
                </button>
                
                <hr className={`my-2 ${isDark ? 'border-[#27272a]' : 'border-gray-200'}`} />

                {/* Opções de Conta */}
                <NavButton icon="settings" label="Settings" path="/configuracoes" />
                <NavButton icon="help" label="Help & Support" path="/ajuda" />
              </div>

              {/* Rodapé */}
              {user && (
                <div className={`p-4 border-t ${isDark ? 'border-[#27272a]' : 'border-gray-200'}`}>
                  <button onClick={() => { close(); logout(); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Icon name="logout" /> Logout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

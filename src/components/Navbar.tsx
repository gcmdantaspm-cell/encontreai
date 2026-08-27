import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Icon({ name, className, size }: { name: string, className?: string, size?: number }) {
  return <span className={`material-symbols-outlined ${className || ''}`} style={{ fontSize: size }}>{name}</span>;
}

export function Navbar({ isDark, toggleDarkMode, user, currentRole, updateRole, logout, toggleSidebar }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if(searchQuery.trim()) {
      navigate('/busca', { state: { q: searchQuery } });
    }
  };

  const handleToggleRole = () => {
    if(!user) return navigate('/auth');
    updateRole(currentRole === 'client' ? 'professional' : 'client');
    setShowProfileMenu(false);
  };

  return (
    <nav className={`w-full shrink-0 h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 border-b transition-colors shadow-sm ${isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      
      {/* Esquerda: Menu Sanduíche (Mobile) & Logo */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar} 
          aria-label="Abrir Menu"
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#27272a] transition-colors"
        >
          <Icon name="menu" size={24} />
        </button>
        <Link to="/busca" className="flex items-center gap-2" aria-label="Página Inicial">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white shadow-md">
            <Icon name="handshake" size={20} />
          </div>
          <span className="font-black text-xl tracking-tight hidden sm:block">Encontre<span className="text-[#f97316]">Aí</span></span>
        </Link>
      </div>

      {/* Centro: Barra de Pesquisa e Localização (Desktop) */}
      <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-8 gap-4">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-gray-100 border-gray-200'} shrink-0 cursor-pointer hover:border-[#f97316] transition-colors`}>
          <Icon name="location_on" size={18} className="text-[#f97316]" />
          <span className="text-sm font-bold truncate max-w-[120px]">São Paulo, SP</span>
          <Icon name="expand_more" size={18} className="opacity-50" />
        </div>
        
        <form onSubmit={handleSearch} className={`flex-1 flex items-center h-10 px-4 rounded-xl border focus-within:ring-2 focus-within:ring-[#f97316]/50 focus-within:border-[#f97316] transition-all ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-gray-100 border-gray-200'}`}>
          <Icon name="search" size={20} className="opacity-50 mr-2" />
          <input 
            type="text" 
            placeholder="O que você precisa hoje?"
            className="w-full bg-transparent outline-none text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Direita: Notificações, Tema, Modo e Avatar */}
      <div className="flex items-center gap-2 sm:gap-4 relative">
        <button onClick={toggleDarkMode} aria-label="Alternar Tema" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#27272a] transition-colors">
          <Icon name={isDark ? "light_mode" : "dark_mode"} size={22} />
        </button>
        
        {user && (
          <button onClick={() => navigate('/chat-list')} aria-label="Notificações" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#27272a] transition-colors relative">
            <Icon name="notifications" size={22} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#18181b]"></span>
          </button>
        )}

        {user ? (
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="Menu do Perfil"
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#27272a] transition-colors focus:ring-2 focus:ring-[#f97316]"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <img src={user.avatarUrl || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop"} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl border py-2 z-50 animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-[#27272a] border-[#3f3f46] text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                <div className="px-4 py-2 border-b dark:border-[#3f3f46] mb-2">
                  <p className="font-bold truncate">{user.name}</p>
                  <p className="text-xs opacity-70 truncate">{user.email}</p>
                </div>
                
                <button onClick={() => { navigate('/perfil'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-[#3f3f46] flex items-center gap-2">
                  <Icon name="person" size={18} /> Meu Perfil
                </button>
                <button onClick={handleToggleRole} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-[#3f3f46] flex items-center gap-2">
                  <Icon name="swap_horiz" size={18} /> 
                  Mudar para {currentRole === 'client' ? 'Prestador' : 'Cliente'}
                </button>
                <button onClick={() => { logout(); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 mt-2 border-t dark:border-[#3f3f46] pt-2">
                  <Icon name="logout" size={18} /> Sair
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => navigate('/auth')} className="px-4 py-2 bg-[#f97316] text-black font-bold text-sm rounded-lg hover:scale-105 transition-transform shadow-md">
            Entrar
          </button>
        )}
      </div>
    </nav>
  );
}

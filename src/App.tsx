import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Star, ArrowLeft, User, MapPin, Phone, Mail, Lock,
  Bell, SlidersHorizontal, CheckCircle2, Shield, TrendingUp,
  ChevronRight, ChevronDown, ChevronUp, X, Send, Clock,
  LogOut, FileText, Eye, EyeOff, Loader2, CheckCheck, Home, Briefcase, 
  Menu, ArrowRight, Crosshair, Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PROFESSIONALS } from './data';
import { Professional, UserRole, AppUser, OrcamentoRequest, AppNotification } from './types';
import * as Icons from 'lucide-react';

type Screen = 'home' | 'profile' | 'auth' | 'notifications' | 'my-profile';
type AuthMode = 'login' | 'register';

/* ══════════════════════════════════════════════
   DESIGN TOKENS (Baseado no novo layout)
══════════════════════════════════════════════ */
const C = {
  primary: '#003F87', // Azul escuro
  primary2: '#0056B3',
  primaryBg: '#D7E2FF',
  
  accent: '#FD8B00', // Laranja
  accentDk: '#904D00',
  accentBg: '#FFDCC3',
  
  bg: '#F8F9FA', // Cinza clarinho de fundo
  card: '#FFFFFF', // Branco puro
  border: '#E1E3E4',
  border2: '#C2C6D4',
  
  textPrimary: '#191C1D',
  textSecondary: '#424752',
  textTertiary: '#727784',
  
  success: '#006722',
  error: '#BA1A1A',
};

/* ══════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════ */

function useAuth() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try { const s = sessionStorage.getItem('encontreai_session'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });

  const getUsers = (): AppUser[] => {
    try { return JSON.parse(localStorage.getItem('encontreai_users') || '[]'); } catch { return []; }
  };

  const register = useCallback((data: {
    name: string; email: string; phone: string; password: string;
    role: UserRole; profession?: string; categoryId?: string; cpfCnpj?: string;
  }): { ok: boolean; error?: string } => {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase()))
      return { ok: false, error: 'Este e-mail já está cadastrado.' };
    const newUser: AppUser = {
      id: `u_${Date.now()}`, avatarInitial: data.name.trim().charAt(0).toUpperCase(),
      createdAt: new Date().toISOString(), ...data, email: data.email.toLowerCase(),
    };
    users.push(newUser);
    localStorage.setItem('encontreai_users', JSON.stringify(users));
    sessionStorage.setItem('encontreai_session', JSON.stringify(newUser));
    setCurrentUser(newUser);
    return { ok: true };
  }, []);

  const login = useCallback((email: string, password: string): { ok: boolean; error?: string } => {
    const user = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { ok: false, error: 'E-mail ou senha incorretos.' };
    sessionStorage.setItem('encontreai_session', JSON.stringify(user));
    setCurrentUser(user);
    return { ok: true };
  }, []);

  const logout = useCallback(() => { sessionStorage.removeItem('encontreai_session'); setCurrentUser(null); }, []);
  return { currentUser, register, login, logout };
}

function useLocationManager() {
  const [location, setLocation] = useState(() => sessionStorage.getItem('encontreai_location') || 'São Paulo, SP');
  const [cities, setCities] = useState<string[]>([]);
  
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios')
      .then(r => r.json())
      .then(data => {
        const list = data.map((c: any) => `${c.nome}, ${c.microrregiao.mesorregiao.UF.sigla}`);
        setCities(list);
      }).catch(() => {});
  }, []);

  const updateLocation = (loc: string) => {
    setLocation(loc);
    sessionStorage.setItem('encontreai_location', loc);
  };

  const autoDetect = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) { resolve(false); return; }
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=pt-BR`);
            const d = await res.json();
            const city = d.city || d.locality || 'São Paulo';
            const stateCode = (d.principalSubdivisionCode || 'BR-SP').split('-')[1] || 'SP';
            updateLocation(`${city}, ${stateCode}`);
            resolve(true);
          } catch { resolve(false); }
        },
        () => resolve(false),
        { timeout: 8000, maximumAge: 300000 }
      );
    });
  };

  return { location, updateLocation, autoDetect, cities };
}

function useNotifications(userId: string | undefined) {
  const key = userId ? `encontreai_notifs_${userId}` : null;
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (!key) return [];
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  });
  useEffect(() => {
    if (!key) { setNotifications([]); return; }
    try { setNotifications(JSON.parse(localStorage.getItem(key) || '[]')); } catch { setNotifications([]); }
  }, [key]);
  const save = useCallback((list: AppNotification[]) => {
    setNotifications(list); if (key) localStorage.setItem(key, JSON.stringify(list));
  }, [key]);
  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => save(notifications.map(n => ({ ...n, read: true })));
  const addWelcome = useCallback((user: AppUser) => {
    const notifs: AppNotification[] = [
      { id: `n_w_${Date.now()}`, title: `Bem-vindo, ${user.name.split(' ')[0]}! 🎉`, message: 'Sua conta foi criada com sucesso. Explore os melhores profissionais perto de você.', read: false, icon: 'CheckCircle2', createdAt: new Date().toISOString() },
    ];
    const k = `encontreai_notifs_${user.id}`;
    localStorage.setItem(k, JSON.stringify(notifs)); setNotifications(notifs);
  }, []);
  return { notifications, unreadCount, markAllRead, addWelcome };
}

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type });
    timerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, showToast };
}

/* ══════════════════════════════════════════════
   HELPER COMPONENTS
══════════════════════════════════════════════ */

function Toast({ toast }: { toast: { msg: string; type: 'success' | 'error' | 'info' } | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, y: 80, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 80, scale: 0.92 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-5 py-3.5 rounded-2xl shadow-xl max-w-[85%] text-sm font-semibold text-white flex items-center gap-2.5"
          style={{ background: toast.type === 'error' ? C.error : toast.type === 'info' ? C.primary : C.textPrimary }}>
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {toast.type === 'error' && <X className="w-4 h-4 shrink-0" />}
          {toast.type === 'info' && <Bell className="w-4 h-4 shrink-0" />}
          <span>{toast.msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavButton({ icon, label, active, onClick, badge }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: number;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center px-4 py-1.5 transition-colors group">
      <div className={`flex flex-col items-center justify-center rounded-full px-5 py-1 ${active ? 'text-white' : 'text-gray-500 hover:bg-gray-100'} transition-all`} 
           style={active ? { background: C.accent } : {}}>
        <div className="relative mb-0.5">
          {icon}
          {badge ? (
            <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] text-white text-[8px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white"
              style={{ background: C.error }}>{badge > 9 ? '9+' : badge}</span>
          ) : null}
        </div>
        <span className={`text-[10px] font-bold ${active ? 'text-white' : 'text-gray-500'}`}>{label}</span>
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════
   MODALS
══════════════════════════════════════════════ */

function LocationModal({ open, onClose, location, updateLocation, autoDetect, cities }: any) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = query.trim().length >= 2 
    ? cities.filter((c: string) => norm(c).includes(norm(query))).slice(0, 50)
    : [];

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-[100]" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 w-full h-[85vh] bg-white rounded-t-3xl z-[101] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-700" /></button>
              <h2 className="font-bold text-lg text-gray-900">Selecionar Localização</h2>
            </div>
            <div className="p-5 flex-1 overflow-hidden flex flex-col bg-gray-50">
              <button onClick={async () => {
                setLoading(true); const ok = await autoDetect(); setLoading(false);
                if (ok) onClose();
              }} className="w-full flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl font-bold mb-4 active:scale-[0.98] transition-all border border-blue-100">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
                {loading ? 'Detectando localização...' : 'Usar minha localização atual'}
              </button>
              
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input autoFocus placeholder="Digite o nome da cidade..." value={query} onChange={e => setQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-xl py-3.5 pl-12 pr-4 text-gray-900 font-medium focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-xl border border-gray-200">
                {query.length >= 2 ? (
                  filtered.length > 0 ? (
                    <div className="flex flex-col">
                      {filtered.map((city: string) => (
                        <button key={city} onClick={() => { updateLocation(city); onClose(); }} className="flex items-center gap-3 py-4 px-4 border-b border-gray-100 text-left active:bg-gray-50 last:border-0">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <span className="font-semibold text-gray-800">{city}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      <p className="font-medium">Nenhuma cidade encontrada.</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                    <Map className="w-10 h-10 mb-3 opacity-20" />
                    <p className="font-medium text-sm">Digite pelo menos 2 letras para buscar cidades</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════
   APP
══════════════════════════════════════════════ */

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [showOrcamento, setShowOrcamento] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [orcamentoProfId, setOrcamentoProfId] = useState<string | null>(null);
  const [pendingOrcamento, setPendingOrcamento] = useState<string | null>(null);

  const { currentUser, register, login, logout } = useAuth();
  const { location, updateLocation, autoDetect, cities } = useLocationManager();
  const { notifications, unreadCount, markAllRead, addWelcome } = useNotifications(currentUser?.id);
  const { toast, showToast } = useToast();

  const goTo = (s: Screen, profId?: string) => {
    if (profId) setSelectedProfId(profId);
    setScreen(s); window.scrollTo(0, 0);
  };

  const handleOrcamento = (profId: string) => {
    if (!currentUser) { setPendingOrcamento(profId); goTo('auth'); showToast('Faça login para solicitar um orçamento', 'info'); }
    else { setOrcamentoProfId(profId); setShowOrcamento(true); }
  };

  const handleLoginSuccess = () => {
    if (pendingOrcamento) { setOrcamentoProfId(pendingOrcamento); setPendingOrcamento(null); goTo('home'); setTimeout(() => setShowOrcamento(true), 300); }
    else goTo('home');
  };

  const handleRegisterSuccess = (user: AppUser) => {
    addWelcome(user);
    if (pendingOrcamento) { setOrcamentoProfId(pendingOrcamento); setPendingOrcamento(null); goTo('home'); setTimeout(() => setShowOrcamento(true), 300); }
    else goTo('home');
  };

  const selectedProf = PROFESSIONALS.find(p => p.id === selectedProfId);

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto min-h-screen relative flex flex-col bg-white shadow-2xl overflow-hidden">
        
        {/* Top Header Global (Hide on Auth) */}
        {screen !== 'auth' && (
          <header className="bg-white flex justify-between items-center px-4 h-16 sticky top-0 z-40 border-b border-gray-100">
            <button className="p-2 -ml-2 text-gray-500 active:scale-95 transition-transform"><Menu className="w-6 h-6" /></button>
            <div className="font-black text-xl tracking-tight cursor-pointer" style={{ color: C.primary }} onClick={() => goTo('home')}>encontreai</div>
            <button onClick={() => currentUser ? goTo('notifications') : goTo('auth')} className="p-2 -mr-2 text-gray-500 relative active:scale-95 transition-transform">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: C.error }} />}
            </button>
          </header>
        )}

        <div className="flex-1 pb-20">
          <AnimatePresence mode="wait">
            {screen === 'home' && (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <HomeScreen onNavigate={goTo} onOrcamento={handleOrcamento} location={location} onOpenLocation={() => setShowLocation(true)} />
              </motion.div>
            )}
            {screen === 'profile' && selectedProf && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.18 }}>
                <ProfileScreen professional={selectedProf} onBack={() => goTo('home')} onOrcamento={handleOrcamento} />
              </motion.div>
            )}
            {screen === 'auth' && (
              <motion.div key="auth" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.18 }}>
                <AuthScreen onLoginSuccess={handleLoginSuccess} onRegisterSuccess={handleRegisterSuccess} register={register} login={login} />
              </motion.div>
            )}
            {screen === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.18 }}>
                <NotificationsScreen notifications={notifications} onMarkAllRead={markAllRead} />
              </motion.div>
            )}
            {screen === 'my-profile' && currentUser && (
              <motion.div key="my-profile" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.18 }}>
                <MyProfileScreen user={currentUser} onLogout={() => { logout(); goTo('home'); }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Nav */}
        {screen !== 'auth' && (
          <div className="fixed bottom-0 w-full max-w-md mx-auto bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.05)] rounded-t-2xl z-50 flex justify-around items-center px-4 py-2 pb-safe border-t border-gray-100">
            <NavButton icon={<Home className="w-[22px] h-[22px]" />} label="Home" active={screen === 'home'} onClick={() => goTo('home')} />
            <NavButton icon={<Search className="w-[22px] h-[22px]" />} label="Busca" active={false} onClick={() => { goTo('home'); window.scrollTo(0,0); }} />
            <NavButton icon={<FileText className="w-[22px] h-[22px]" />} label="Pedidos" active={screen === 'my-profile'} onClick={() => currentUser ? goTo('my-profile') : goTo('auth')} />
            <NavButton icon={<User className="w-[22px] h-[22px]" />} label="Perfil" active={screen === 'auth'} onClick={() => currentUser ? goTo('my-profile') : goTo('auth')} />
          </div>
        )}

        <LocationModal open={showLocation} onClose={() => setShowLocation(false)} location={location} updateLocation={updateLocation} autoDetect={autoDetect} cities={cities} />
        <Toast toast={toast} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   HOME SCREEN
══════════════════════════════════════════════ */
function HomeScreen({ onNavigate, onOrcamento, location, onOpenLocation }: any) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = PROFESSIONALS.filter(p => {
    if (!p.activeSubscription) return false;
    if (activeCategory && p.categoryId !== activeCategory && p.profession !== activeCategory) return false;
    if (search) { const q = search.toLowerCase(); if (!p.name.toLowerCase().includes(q) && !p.profession.toLowerCase().includes(q)) return false; }
    return true;
  });

  const catColors = [
    { bg: C.primaryBg, text: C.primary },
    { bg: C.accentBg, text: C.accentDk },
    { bg: '#83FC8E', text: '#004C17' }, // green
    { bg: '#E1E3E4', text: '#191C1D' }, // gray
    { bg: '#FFDAD6', text: '#93000A' }, // red
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Location Bar */}
      <div className="px-4 py-3 bg-white flex items-center justify-between border-b border-gray-100 cursor-pointer active:bg-gray-50 transition-colors" onClick={onOpenLocation}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
            <MapPin className="w-4 h-4" style={{ color: C.primary }} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Localização atual</span>
            <span className="text-[13px] font-bold text-gray-900">{location}</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>

      {/* Search Bar */}
      <div className="px-4 mt-6">
        <div className="relative flex items-center h-12 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl border border-gray-200 overflow-hidden group focus-within:border-blue-400 transition-colors">
          <Search className="w-5 h-5 text-gray-400 ml-4 mr-2 shrink-0 group-focus-within:text-blue-500" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 h-full outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 bg-transparent" 
            placeholder="Buscar serviços..." 
          />
          <button className="h-full px-6 font-bold text-sm transition-transform active:scale-95" style={{ background: C.accent, color: '#fff' }}>
            Buscar
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="mt-8">
        <h2 className="px-4 text-lg font-bold text-gray-900 mb-4">Categorias</h2>
        <div className="flex overflow-x-auto gap-4 px-4 pb-2 hide-scrollbar">
          {CATEGORIES.map((cat, i) => {
            const Icon = (Icons as any)[cat.icon] || Icons.HelpCircle;
            const col = catColors[i % catColors.length];
            const isActive = activeCategory === cat.name;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(isActive ? null : cat.name)} className="flex flex-col items-center gap-2 min-w-[76px] group">
                <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-sm transition-transform group-active:scale-95 border-2" 
                     style={{ background: col.bg, color: col.text, borderColor: isActive ? col.text : 'transparent' }}>
                  <Icon className="w-7 h-7" style={{ fontVariationSettings: "'FILL' 1" }} />
                </div>
                <span className={`text-[11px] font-bold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Professionals List */}
      <div className="mt-8 mb-4">
        <div className="px-4 flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-gray-900">{activeCategory ? `Resultados para ${activeCategory}` : 'Profissionais em Destaque'}</h2>
          <button className="text-[13px] font-bold hover:underline" style={{ color: C.primary }}>Ver todos</button>
        </div>
        
        <div className="flex overflow-x-auto gap-4 px-4 pb-8 hide-scrollbar snap-x">
           {filtered.length > 0 ? filtered.map(pro => (
              <div key={pro.id} onClick={() => onNavigate('profile', pro.id)} className="min-w-[300px] md:min-w-[320px] bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col gap-4 relative snap-start cursor-pointer hover:border-gray-300 transition-colors">
                 {pro.verified && (
                   <div className="absolute top-4 right-4 text-white rounded-full p-1 z-10 shadow-sm" style={{ background: C.primary }}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                   </div>
                 )}
                 <div className="flex gap-4">
                    <img src={pro.avatarUrl} className="w-24 h-24 rounded-xl object-cover bg-gray-100 shadow-sm" alt={pro.name} />
                    <div className="flex flex-col justify-center min-w-0">
                       <h3 className="font-bold text-gray-900 line-clamp-1 text-[15px]">{pro.name}</h3>
                       <p className="text-[12px] text-gray-500 mb-1.5">{pro.profession}</p>
                       <div className="flex items-center gap-1.5 mb-2">
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                          <span className="text-[13px] font-bold text-gray-900">{pro.rating.toFixed(1)}</span>
                          <span className="text-[11px] text-gray-400 font-medium">({pro.reviewsCount} avaliações)</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">A partir de</span>
                    <span className="text-sm font-bold" style={{ color: C.primary }}>R$ {(pro.rating * 25).toFixed(0)} / serv.</span>
                 </div>
              </div>
           )) : (
             <div className="w-full text-center py-10 text-gray-500 bg-white rounded-2xl border border-gray-100 mx-4">
               <p className="font-medium">Nenhum profissional encontrado.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   AUTH SCREEN (Fiel ao print)
══════════════════════════════════════════════ */
function AuthInput({ label, type, value, onChange, placeholder, icon, error, hint }: any) {
  return (
    <div>
      <label className="block text-[13px] font-bold text-gray-900 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">
          {icon}
        </span>
        <input 
          type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full bg-white border rounded-lg py-3 pl-12 pr-4 text-gray-900 font-medium focus:outline-none focus:ring-1 transition-colors placeholder:text-gray-400"
          style={{ borderColor: error ? C.error : C.border2, outlineColor: error ? C.error : C.primary }}
        />
        {hint && <span className="absolute inset-y-0 right-0 flex items-center pr-4">{hint}</span>}
      </div>
      {error && <p className="text-[11px] font-bold mt-1 text-red-600">{error}</p>}
    </div>
  );
}

function AuthScreen({ onLoginSuccess, onRegisterSuccess, register, login }: any) {
  const [mode, setMode] = useState<AuthMode>('register');
  const [role, setRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [loginEmail, setLoginEmail] = useState(''); const [loginPwd, setLoginPwd] = useState('');
  const [regName, setRegName] = useState(''); const [regEmail, setRegEmail] = useState('');
  const [regPwd, setRegPwd] = useState(''); const [regPhone, setRegPhone] = useState('');

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true); await new Promise(r => setTimeout(r, 600));
    
    if (mode === 'login') {
      const res = login(loginEmail, loginPwd);
      if (res.ok) onLoginSuccess(); else setErrors({ loginPwd: res.error || 'Erro' });
    } else {
      if (!regName || !regEmail || !regPwd) { setErrors({ general: 'Preencha todos os campos' }); setLoading(false); return; }
      const res = register({ name: regName, email: regEmail, phone: regPhone, password: regPwd, role });
      if (res.ok) { const s = sessionStorage.getItem('encontreai_session'); if (s) onRegisterSuccess(JSON.parse(s)); }
      else setErrors({ email: res.error || 'Erro' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-6 border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2 tracking-tight" style={{ color: C.primary }}>encontreai</h1>
          <p className="text-[15px] font-medium text-gray-500">{mode === 'register' ? 'Crie sua conta' : 'Acesse sua conta'}</p>
        </div>

        {mode === 'register' && (
          <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
            <button type="button" onClick={() => setRole('client')} className={`flex-1 py-2 text-[13px] font-bold rounded-md transition-all ${role === 'client' ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`} style={role === 'client' ? { background: C.primary } : {}}>Quero Contratar</button>
            <button type="button" onClick={() => setRole('professional')} className={`flex-1 py-2 text-[13px] font-bold rounded-md transition-all ${role === 'professional' ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`} style={role === 'professional' ? { background: C.primary } : {}}>Sou Profissional</button>
          </div>
        )}

        <form onSubmit={handleAction} className="flex flex-col gap-4">
          {mode === 'register' && (
            <AuthInput label="Nome Completo" type="text" value={regName} onChange={setRegName} placeholder="Seu nome" icon={<User className="w-5 h-5"/>} />
          )}
          
          <AuthInput label="Email" type="email" value={mode === 'login' ? loginEmail : regEmail} onChange={mode === 'login' ? setLoginEmail : setRegEmail} placeholder="seu@email.com" icon={<Mail className="w-5 h-5"/>} error={errors.email} />
          
          <AuthInput label="Senha" type={showPwd ? 'text' : 'password'} value={mode === 'login' ? loginPwd : regPwd} onChange={mode === 'login' ? setLoginPwd : setRegPwd} placeholder="Mínimo 8 caracteres" icon={<Lock className="w-5 h-5"/>} error={errors.loginPwd} 
                     hint={<button type="button" onClick={() => setShowPwd(!showPwd)} className="text-gray-400">{showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>} />

          {errors.general && <p className="text-xs font-bold text-red-600 text-center">{errors.general}</p>}

          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full h-12 rounded-lg text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]" style={{ background: C.primary }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'register' ? 'Cadastrar' : 'Entrar')}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-gray-500">
            {mode === 'register' ? 'Já tem uma conta?' : 'Não tem uma conta?'} {' '}
            <button type="button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setErrors({}); }} className="font-bold hover:underline" style={{ color: C.primary }}>
              {mode === 'register' ? 'Faça login' : 'Criar agora'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PROFILE SCREEN
══════════════════════════════════════════════ */
function ProfileScreen({ professional, onBack, onOrcamento }: any) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="h-48 relative bg-gray-200">
        <img src={professional.coverUrl} className="w-full h-full object-cover" alt="Capa" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
        <button onClick={onBack} className="absolute top-6 left-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      <div className="max-w-md mx-4 -mt-12 relative bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex gap-4 items-end mb-4">
          <img src={professional.avatarUrl} className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-sm bg-gray-100" alt={professional.name} />
          <div className="pb-1 flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-1.5 line-clamp-1">
              {professional.name}
              {professional.verified && <CheckCircle2 className="w-5 h-5" style={{ color: C.primary }} />}
            </h1>
            <p className="text-sm font-medium text-gray-500">{professional.profession}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
            <div className="flex justify-center items-center gap-1"><Star className="w-4 h-4 fill-amber-500 text-amber-500" /><span className="font-bold text-gray-900">{professional.rating.toFixed(1)}</span></div>
            <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Avaliação</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
            <div className="font-bold text-gray-900 text-base">{professional.reviewsCount}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Avaliações</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
             <div className="font-bold text-gray-900 text-base">R$ {(professional.rating*25).toFixed(0)}</div>
             <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Estimativa</div>
          </div>
        </div>

        <button onClick={() => onOrcamento(professional.id)} className="w-full py-3.5 rounded-xl font-bold text-white text-[15px] shadow-sm active:scale-[0.98] transition-transform flex justify-center items-center gap-2" style={{ background: C.primary }}>
          Solicitar Orçamento <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mx-4 mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Sobre o profissional</h2>
        <p className="text-sm text-gray-600 leading-relaxed bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">{professional.description}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   NOTIFICATIONS & MY PROFILE (Simplified for brevity but matching style)
══════════════════════════════════════════════ */
function NotificationsScreen({ notifications }: any) {
  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-6">
      <h1 className="text-2xl font-black text-gray-900 mb-6" style={{ color: C.primary }}>Notificações</h1>
      {notifications.length === 0 ? <p className="text-gray-500 text-center py-10 font-medium">Nenhuma notificação</p> : 
        notifications.map((n:any) => (
          <div key={n.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 flex gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><Bell className="w-5 h-5 text-blue-600" /></div>
             <div>
               <p className="font-bold text-gray-900 text-sm">{n.title}</p>
               <p className="text-xs text-gray-600 mt-1">{n.message}</p>
             </div>
          </div>
        ))
      }
    </div>
  );
}

function MyProfileScreen({ user, onLogout }: any) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-8 border-b border-gray-100 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-sm" style={{ background: C.primary }}>{user.avatarInitial}</div>
        <div>
          <h1 className="text-xl font-black text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-500 font-medium">{user.email}</p>
        </div>
      </div>
      <div className="p-4 mt-4">
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-[15px] bg-white border border-red-200 text-red-600 shadow-sm active:scale-95 transition-transform">
          <LogOut className="w-5 h-5" /> Sair da Conta
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Star, ArrowLeft, User, MapPin, Phone, Mail, Lock,
  Bell, SlidersHorizontal, CheckCircle2, Zap, Shield, TrendingUp,
  ChevronRight, ChevronDown, ChevronUp, X, Send, Clock,
  LogOut, FileText, Eye, EyeOff, Loader2, CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PROFESSIONALS } from './data';
import { Professional, UserRole, AppUser, OrcamentoRequest, AppNotification } from './types';
import * as Icons from 'lucide-react';

type Screen = 'home' | 'profile' | 'auth' | 'notifications' | 'my-profile';
type AuthMode = 'login' | 'register';

/* ══════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════ */

function useAuth() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const s = sessionStorage.getItem('encontreai_session');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const getUsers = (): AppUser[] => {
    try { return JSON.parse(localStorage.getItem('encontreai_users') || '[]'); }
    catch { return []; }
  };

  const register = useCallback((data: {
    name: string; email: string; phone: string; password: string;
    role: UserRole; profession?: string; categoryId?: string; cpfCnpj?: string;
  }): { ok: boolean; error?: string } => {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { ok: false, error: 'Este e-mail já está cadastrado.' };
    }
    const newUser: AppUser = {
      id: `u_${Date.now()}`,
      avatarInitial: data.name.trim().charAt(0).toUpperCase(),
      createdAt: new Date().toISOString(),
      ...data,
      email: data.email.toLowerCase(),
    };
    users.push(newUser);
    localStorage.setItem('encontreai_users', JSON.stringify(users));
    sessionStorage.setItem('encontreai_session', JSON.stringify(newUser));
    setCurrentUser(newUser);
    return { ok: true };
  }, []);

  const login = useCallback((email: string, password: string): { ok: boolean; error?: string } => {
    const users = getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) return { ok: false, error: 'E-mail ou senha incorretos.' };
    sessionStorage.setItem('encontreai_session', JSON.stringify(user));
    setCurrentUser(user);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('encontreai_session');
    setCurrentUser(null);
  }, []);

  return { currentUser, register, login, logout };
}

function useGeolocation() {
  const [location, setLocation] = useState('Detectando...');

  useEffect(() => {
    const cached = sessionStorage.getItem('encontreai_location');
    if (cached) { setLocation(cached); return; }
    if (!('geolocation' in navigator)) { setLocation('São Paulo, SP'); return; }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          );
          const d = await res.json();
          const city = d.address?.city || d.address?.town || d.address?.municipality || 'São Paulo';
          const stateCode = (d.address?.['ISO3166-2-lvl4'] || 'BR-SP').split('-')[1] || 'SP';
          const loc = `${city}, ${stateCode}`;
          setLocation(loc);
          sessionStorage.setItem('encontreai_location', loc);
        } catch {
          setLocation('São Paulo, SP');
        }
      },
      () => setLocation('São Paulo, SP'),
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  return location;
}

function useNotifications(userId: string | undefined) {
  const key = userId ? `encontreai_notifs_${userId}` : null;

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (!key) return [];
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    if (!key) { setNotifications([]); return; }
    try { setNotifications(JSON.parse(localStorage.getItem(key) || '[]')); }
    catch { setNotifications([]); }
  }, [key]);

  const save = useCallback((list: AppNotification[]) => {
    setNotifications(list);
    if (key) localStorage.setItem(key, JSON.stringify(list));
  }, [key]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => save(notifications.map(n => ({ ...n, read: true })));

  const addWelcome = useCallback((user: AppUser) => {
    const notifs: AppNotification[] = [
      {
        id: `n_welcome_${Date.now()}`,
        title: `Bem-vindo, ${user.name.split(' ')[0]}! 🎉`,
        message: 'Sua conta foi criada com sucesso. Explore os melhores profissionais perto de você.',
        read: false,
        icon: 'CheckCircle2',
        createdAt: new Date().toISOString(),
      },
      {
        id: `n_promo_${Date.now() + 1}`,
        title: '🔥 Oferta exclusiva para você',
        message: 'Ganhe 20% de desconto na sua primeira contratação. Válido por 7 dias!',
        read: false,
        icon: 'Zap',
        createdAt: new Date().toISOString(),
      },
    ];
    const k = `encontreai_notifs_${user.id}`;
    localStorage.setItem(k, JSON.stringify(notifs));
    setNotifications(notifs);
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
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl shadow-xl max-w-xs w-[90%] text-sm font-semibold text-white flex items-center gap-2.5 ${
            toast.type === 'error' ? 'bg-red-600' :
            toast.type === 'info' ? 'bg-[#0052CC]' : 'bg-slate-800'
          }`}
        >
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
  icon: React.ReactNode; label: string; active: boolean;
  onClick: () => void; badge?: number;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 px-5 py-1 relative">
      <div className="relative">
        <span className={active ? 'text-[#0052CC]' : 'text-slate-400'}>{icon}</span>
        {badge ? (
          <span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] bg-[#FF8C00] text-white text-[0.52rem] font-black rounded-full flex items-center justify-center px-0.5">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </div>
      <span className={`text-[10px] font-semibold truncate max-w-[3.5rem] ${active ? 'text-[#0052CC]' : 'text-slate-400'}`}>{label}</span>
      {active && <motion.div layoutId="nav-pill" className="absolute -bottom-1 w-8 h-0.5 bg-[#0052CC] rounded-full" />}
    </button>
  );
}

/* ══════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════ */

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [showOrcamento, setShowOrcamento] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [orcamentoProfId, setOrcamentoProfId] = useState<string | null>(null);
  const [pendingOrcamento, setPendingOrcamento] = useState<string | null>(null);
  const [filter, setFilter] = useState({ minRating: 0, verifiedOnly: false });

  const { currentUser, register, login, logout } = useAuth();
  const location = useGeolocation();
  const { notifications, unreadCount, markAllRead, addWelcome } = useNotifications(currentUser?.id);
  const { toast, showToast } = useToast();

  const goTo = (s: Screen, profId?: string) => {
    if (profId) setSelectedProfId(profId);
    setScreen(s);
    window.scrollTo(0, 0);
  };

  const handleOrcamento = (profId: string) => {
    if (!currentUser) {
      setPendingOrcamento(profId);
      goTo('auth');
      showToast('Faça login para solicitar um orçamento', 'info');
    } else {
      setOrcamentoProfId(profId);
      setShowOrcamento(true);
    }
  };

  const handleLoginSuccess = () => {
    showToast('Login realizado com sucesso! 👋');
    if (pendingOrcamento) {
      setOrcamentoProfId(pendingOrcamento);
      setPendingOrcamento(null);
      goTo('home');
      setTimeout(() => setShowOrcamento(true), 300);
    } else {
      goTo('home');
    }
  };

  const handleRegisterSuccess = (user: AppUser) => {
    addWelcome(user);
    showToast(`Bem-vindo, ${user.name.split(' ')[0]}! Conta criada com sucesso. 🎉`);
    if (pendingOrcamento) {
      setOrcamentoProfId(pendingOrcamento);
      setPendingOrcamento(null);
      goTo('home');
      setTimeout(() => setShowOrcamento(true), 300);
    } else {
      goTo('home');
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Você saiu da sua conta.', 'info');
    goTo('home');
  };

  const selectedProf = PROFESSIONALS.find(p => p.id === selectedProfId);

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {screen === 'home' && (
              <motion.div key="home"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
                <HomeScreen
                  onNavigate={goTo}
                  onOrcamento={handleOrcamento}
                  onOpenFilter={() => setShowFilter(true)}
                  location={location}
                  filter={filter}
                />
              </motion.div>
            )}
            {screen === 'profile' && selectedProf && (
              <motion.div key="profile"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
                <ProfileScreen
                  professional={selectedProf}
                  onBack={() => goTo('home')}
                  onOrcamento={handleOrcamento}
                />
              </motion.div>
            )}
            {screen === 'auth' && (
              <motion.div key="auth"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
                <AuthScreen
                  onLoginSuccess={handleLoginSuccess}
                  onRegisterSuccess={handleRegisterSuccess}
                  onBack={() => goTo('home')}
                  register={register}
                  login={login}
                  showToast={showToast}
                />
              </motion.div>
            )}
            {screen === 'notifications' && (
              <motion.div key="notifications"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
                <NotificationsScreen
                  notifications={notifications}
                  onMarkAllRead={markAllRead}
                  onBack={() => goTo('home')}
                />
              </motion.div>
            )}
            {screen === 'my-profile' && currentUser && (
              <motion.div key="my-profile"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
                <MyProfileScreen
                  user={currentUser}
                  onLogout={handleLogout}
                  onBack={() => goTo('home')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Nav */}
        <div className="sticky bottom-0 w-full bg-white border-t border-slate-100 flex justify-around px-2 pt-2 pb-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <NavButton
            icon={<Search className="w-5 h-5" />} label="Buscar"
            active={screen === 'home'} onClick={() => goTo('home')}
          />
          <NavButton
            icon={<Bell className="w-5 h-5" />} label="Alertas"
            active={screen === 'notifications'} badge={unreadCount > 0 ? unreadCount : undefined}
            onClick={() => currentUser ? goTo('notifications') : (goTo('auth'), showToast('Faça login para ver alertas', 'info'))}
          />
          <NavButton
            icon={currentUser
              ? <div className="w-5 h-5 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-[9px] font-black">{currentUser.avatarInitial}</div>
              : <User className="w-5 h-5" />}
            label={currentUser ? currentUser.name.split(' ')[0] : 'Entrar'}
            active={screen === 'auth' || screen === 'my-profile'}
            onClick={() => currentUser ? goTo('my-profile') : goTo('auth')}
          />
        </div>

        {/* Modals */}
        <OrcamentoModal
          open={showOrcamento}
          professionalId={orcamentoProfId}
          currentUser={currentUser}
          onClose={() => setShowOrcamento(false)}
          onSuccess={() => { setShowOrcamento(false); showToast('Orçamento enviado com sucesso! ✅'); }}
        />
        <FilterModal
          open={showFilter}
          filter={filter}
          onApply={(f) => { setFilter(f); setShowFilter(false); showToast('Filtros aplicados'); }}
          onClose={() => setShowFilter(false)}
        />

        <Toast toast={toast} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   HOME SCREEN
══════════════════════════════════════════════ */

function HomeScreen({ onNavigate, onOrcamento, onOpenFilter, location, filter }: {
  onNavigate: (s: Screen, pId?: string) => void;
  onOrcamento: (id: string) => void;
  onOpenFilter: () => void;
  location: string;
  filter: { minRating: number; verifiedOnly: boolean };
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const hasFilter = filter.minRating > 0 || filter.verifiedOnly;

  const filtered = PROFESSIONALS.filter(p => {
    if (!p.activeSubscription) return false;
    if (filter.verifiedOnly && !p.verified) return false;
    if (filter.minRating > 0 && p.rating < filter.minRating) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.profession.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#003A9E] via-[#0052CC] to-[#0063F7] px-5 pt-12 pb-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[1.9rem] font-black tracking-tight leading-none">
              <span className="text-white">encontre</span>
              <span className="text-[#FF8C00]">aí</span>
            </div>
            <div className="text-white/55 text-[0.68rem] font-semibold flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {location === 'Detectando...'
                ? <span className="animate-pulse">{location}</span>
                : location}
            </div>
          </div>
          <button
            onClick={() => onNavigate('notifications')}
            className="relative w-9 h-9 bg-white/15 rounded-full flex items-center justify-center border border-white/20"
          >
            <Bell className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Busque eletricistas, pintores..."
              className="w-full bg-white rounded-2xl py-3 pl-10 pr-4 text-sm font-medium outline-none text-slate-800 placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <button
            onClick={onOpenFilter}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 active:scale-95 transition-transform ${hasFilter ? 'bg-white' : 'bg-[#FF8C00]'}`}
          >
            <SlidersHorizontal className={`w-4 h-4 ${hasFilter ? 'text-[#0052CC]' : 'text-white'}`} />
          </button>
        </div>
        {hasFilter && (
          <div className="mt-2 flex items-center gap-1.5 text-white/70 text-[0.65rem] font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            Filtros ativos: {[filter.minRating > 0 && `${filter.minRating}+ ★`, filter.verifiedOnly && 'Verificados'].filter(Boolean).join(', ')}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="px-5 pt-4 pb-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[0.72rem] font-extrabold text-slate-700 uppercase tracking-widest">Categorias</h2>
          {activeCategory && (
            <button onClick={() => setActiveCategory(null)} className="text-[0.68rem] text-[#0052CC] font-bold">
              Limpar filtro ×
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat, i) => {
            const Icon = (Icons as Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>>)[cat.icon] || Icons.HelpCircle;
            const bgColors = ['#E0F2FE', '#FFF7ED', '#F0FDF4', '#FAF5FF', '#FEFCE8', '#FEE2E2'];
            const textColors = ['#0369A1', '#C2410C', '#15803D', '#7E22CE', '#A16207', '#B91C1C'];
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? null : cat.name)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all flex-shrink-0 ${
                  isActive ? 'bg-[#0052CC] border-[#0052CC] shadow-md shadow-blue-200' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : bgColors[i % bgColors.length] }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: isActive ? 'white' : textColors[i % textColors.length] }} />
                </div>
                <span className={`text-[0.68rem] font-bold whitespace-nowrap ${isActive ? 'text-white' : 'text-slate-700'}`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Promo Banner */}
      <div className="mx-5 mt-3 mb-1">
        <div className="bg-gradient-to-r from-[#FF5500] to-[#FF8C00] rounded-2xl p-4 flex items-center justify-between overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -right-2 top-6 w-14 h-14 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <div className="text-[0.58rem] text-white/75 font-bold uppercase tracking-widest mb-0.5">Oferta limitada</div>
            <div className="text-white font-black text-[0.92rem] leading-tight">
              1ª contratação com<br /><span className="text-[1.1rem]">20% de desconto</span>
            </div>
          </div>
          <div className="relative z-10 w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Professionals */}
      <div className="px-5 mt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[0.72rem] font-extrabold text-slate-700 uppercase tracking-widest">
            {activeCategory ?? 'Em Destaque'}
          </h2>
          <span className="text-[0.62rem] text-slate-400 font-semibold">{filtered.length} profissionais</span>
        </div>

        <div className="flex flex-col gap-3">
          {filtered.length > 0 ? filtered.map((pro, i) => (
            <motion.button
              key={pro.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              onClick={() => onNavigate('profile', pro.id)}
              className="bg-white rounded-2xl p-3.5 border border-slate-100 text-left flex gap-3.5 items-center shadow-sm active:scale-[0.98] transition-transform"
            >
              <div className="relative shrink-0">
                <img src={pro.avatarUrl} alt={pro.name} className="w-[3.2rem] h-[3.2rem] rounded-xl object-cover bg-slate-200" />
                {pro.verified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0052CC] rounded-full flex items-center justify-center border-2 border-white">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <span className="text-[0.82rem] font-bold text-slate-800 truncate">{pro.name}</span>
                  <div className="flex items-center gap-0.5 ml-2 shrink-0">
                    <Star className="w-3 h-3 fill-[#FF8C00] text-[#FF8C00]" />
                    <span className="text-[0.7rem] font-bold text-[#FF8C00]">{pro.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="text-[0.68rem] text-slate-400 truncate mb-2">{pro.profession}</div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[0.52rem] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${pro.verified ? 'bg-[#EFF6FF] text-[#1E40AF]' : 'bg-slate-100 text-slate-500'}`}>
                    {pro.verified ? '✓ Verificado' : 'Assinante'}
                  </span>
                  <span className="text-[0.58rem] text-slate-400 font-medium">{pro.reviewsCount} avaliações</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </motion.button>
          )) : (
            <div className="text-center py-14 text-slate-400">
              <Icons.SearchX className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Nenhum profissional encontrado</p>
              <p className="text-xs mt-1">Tente remover filtros ou mudar a busca</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PROFILE SCREEN
══════════════════════════════════════════════ */

function ProfileScreen({ professional, onBack, onOrcamento }: {
  professional: Professional;
  onBack: () => void;
  onOrcamento: (id: string) => void;
}) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const visibleReviews = showAllReviews ? professional.reviews : professional.reviews.slice(0, 2);

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="relative h-[200px]">
        <img src={professional.coverUrl} alt="Capa" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <button onClick={onBack} className="absolute top-10 left-4 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-md border border-white/60 active:scale-95 transition-transform">
          <ArrowLeft className="w-4 h-4 text-slate-800" />
        </button>
      </div>

      <div className="px-5 -mt-14 relative">
        <div className="flex items-end gap-3 mb-4">
          <img src={professional.avatarUrl} alt={professional.name} className="w-[4.5rem] h-[4.5rem] rounded-2xl object-cover border-4 border-white shadow-xl bg-slate-200" />
          <div className="pb-1.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h1 className="text-[1.05rem] font-black text-slate-800">{professional.name}</h1>
              {professional.verified && <CheckCircle2 className="w-4 h-4 text-[#0052CC]" />}
            </div>
            <p className="text-[0.68rem] text-slate-500 flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3" />{professional.profession} · São Paulo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Avaliação', value: professional.rating.toFixed(1), star: true },
            { label: 'Avaliações', value: String(professional.reviewsCount) },
            { label: 'Contratos', value: String(Math.floor(professional.reviewsCount * 1.5)) },
          ].map((s, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
              <div className="flex items-center justify-center gap-1">
                {s.star && <Star className="w-3.5 h-3.5 fill-[#FF8C00] text-[#FF8C00]" />}
                <span className="text-[1rem] font-black text-slate-800">{s.value}</span>
              </div>
              <div className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onOrcamento(professional.id)}
          className="w-full bg-gradient-to-r from-[#FF5500] to-[#FF8C00] text-white font-bold py-3.5 rounded-2xl mb-4 text-[0.9rem] shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform"
        >
          Solicitar Orçamento Grátis
        </button>

        <div className="flex gap-2 mb-5 flex-wrap">
          {professional.verified && (
            <div className="flex items-center gap-1.5 bg-[#EFF6FF] px-3 py-2 rounded-xl border border-[#DBEAFE]">
              <Shield className="w-3.5 h-3.5 text-[#0052CC]" />
              <span className="text-[0.6rem] font-bold text-[#0052CC]">Perfil Verificado</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-[#F0FDF4] px-3 py-2 rounded-xl border border-[#BBF7D0]">
            <TrendingUp className="w-3.5 h-3.5 text-[#15803D]" />
            <span className="text-[0.6rem] font-bold text-[#15803D]">Top Profissional</span>
          </div>
        </div>

        <div className="h-px bg-slate-100 mb-5" />

        <div className="mb-5">
          <h2 className="text-[0.68rem] font-extrabold text-slate-500 mb-2.5 uppercase tracking-widest">Sobre</h2>
          <p className="text-[0.82rem] text-slate-600 leading-relaxed">{professional.description}</p>
        </div>

        {professional.portfolio.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[0.68rem] font-extrabold text-slate-500 mb-2.5 uppercase tracking-widest">Trabalhos Recentes</h2>
            <div className="grid grid-cols-3 gap-2">
              {professional.portfolio.map((img, i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-xl overflow-hidden">
                  <img src={img} alt="Portfólio" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-px bg-slate-100 mb-5" />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[0.68rem] font-extrabold text-slate-500 uppercase tracking-widest">
              Avaliações ({professional.reviews.length})
            </h2>
            {professional.reviews.length > 2 && (
              <button onClick={() => setShowAllReviews(!showAllReviews)} className="text-[0.65rem] font-bold text-[#0052CC] flex items-center gap-0.5">
                {showAllReviews ? 'Recolher' : 'Ver todas'}
                {showAllReviews ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {visibleReviews.map(review => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#0052CC] to-[#003A9E] rounded-full flex items-center justify-center">
                        <span className="text-white text-[0.65rem] font-black">{review.authorName[0]}</span>
                      </div>
                      <span className="font-bold text-[0.78rem] text-slate-800">{review.authorName}</span>
                    </div>
                    <span className="text-[0.62rem] text-slate-400 font-medium">{review.date}</span>
                  </div>
                  <div className="flex gap-0.5 mb-1.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-[#FF8C00] text-[#FF8C00]' : 'fill-slate-200 text-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-[0.76rem] text-slate-600 leading-relaxed">{review.comment}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   AUTH SCREEN
══════════════════════════════════════════════ */

interface InputFieldProps {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  icon: React.ReactNode; error?: string; hint?: React.ReactNode;
}

function InputField({ label, type, value, onChange, placeholder, icon, error, hint }: InputFieldProps) {
  return (
    <div>
      <div className={`bg-slate-50 border rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all ${
        error ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200 focus-within:border-[#0052CC] focus-within:ring-1 focus-within:ring-[#0052CC]/30'
      }`}>
        <span className="text-slate-400 shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <label className="text-[0.52rem] font-extrabold text-slate-400 uppercase tracking-widest">{label}</label>
          <input
            type={type} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full text-[0.82rem] outline-none text-slate-800 placeholder:text-slate-300 bg-transparent mt-0.5"
          />
        </div>
        {hint && <span className="shrink-0">{hint}</span>}
      </div>
      {error && <p className="text-[0.62rem] text-red-500 font-semibold mt-1 ml-2">{error}</p>}
    </div>
  );
}

function AuthScreen({ onLoginSuccess, onRegisterSuccess, onBack, register, login, showToast }: {
  onLoginSuccess: () => void;
  onRegisterSuccess: (user: AppUser) => void;
  onBack: () => void;
  register: (data: {
    name: string; email: string; phone: string; password: string;
    role: UserRole; profession?: string; categoryId?: string; cpfCnpj?: string;
  }) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPwd, setLoginPwd] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPwd, setRegPwd] = useState('');
  const [regCategory, setRegCategory] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regProfession, setRegProfession] = useState('');

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (mode === 'login') {
      if (!loginEmail) e.loginEmail = 'E-mail obrigatório';
      if (!loginPwd) e.loginPwd = 'Senha obrigatória';
    } else {
      if (!regName.trim() || regName.trim().length < 3) e.name = 'Nome deve ter ao menos 3 caracteres';
      if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) e.email = 'E-mail inválido';
      if (!regPhone || regPhone.replace(/\D/g, '').length < 10) e.phone = 'Telefone inválido';
      if (!regPwd || regPwd.length < 6) e.password = 'Senha deve ter ao menos 6 caracteres';
      if (role === 'professional') {
        if (!regProfession.trim()) e.profession = 'Informe sua profissão';
        if (!regCpf.trim()) e.cpf = 'CPF/CNPJ obrigatório';
        if (!regCategory) e.category = 'Selecione uma categoria';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const result = login(loginEmail, loginPwd);
    setLoading(false);
    if (result.ok) {
      onLoginSuccess();
    } else {
      setErrors({ loginEmail: result.error || 'Erro ao fazer login' });
    }
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const result = register({
      name: regName.trim(), email: regEmail.trim(), phone: regPhone,
      password: regPwd, role,
      ...(role === 'professional' ? { cpfCnpj: regCpf, categoryId: regCategory, profession: regProfession } : {}),
    });
    setLoading(false);
    if (result.ok) {
      try {
        const stored = sessionStorage.getItem('encontreai_session');
        if (stored) onRegisterSuccess(JSON.parse(stored));
      } catch { onRegisterSuccess({} as AppUser); }
    } else {
      setErrors({ email: result.error || 'Erro ao criar conta' });
    }
  };

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const pwdToggle = (
    <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-slate-400">
      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-[#003A9E] via-[#0052CC] to-[#0063F7] px-5 pt-12 pb-7">
        <button onClick={onBack} className="mb-4 flex items-center gap-1 text-white/70 text-[0.78rem] font-semibold">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="text-[1.9rem] font-black tracking-tight leading-none mb-1">
          <span className="text-white">encontre</span><span className="text-[#FF8C00]">aí</span>
        </div>
        <p className="text-white/60 text-[0.75rem] font-medium">
          {mode === 'login' ? 'Acesse sua conta e continue explorando.' : 'Crie sua conta e comece agora.'}
        </p>
      </div>

      <div className="px-5 py-6 pb-24">
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          {(['login', 'register'] as AuthMode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setErrors({}); }}
              className={`flex-1 py-2.5 text-[0.75rem] font-bold rounded-xl transition-all ${mode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
              {m === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          ))}
        </div>

        {mode === 'login' ? (
          <div className="flex flex-col gap-3.5">
            <InputField label="E-mail" type="email" value={loginEmail}
              onChange={setLoginEmail} placeholder="seu@email.com"
              icon={<Mail className="w-4 h-4" />} error={errors.loginEmail} />
            <InputField label="Senha" type={showPwd ? 'text' : 'password'}
              value={loginPwd} onChange={setLoginPwd} placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />} error={errors.loginPwd} hint={pwdToggle} />
            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-gradient-to-r from-[#003A9E] to-[#0063F7] text-white font-bold py-3.5 rounded-2xl text-[0.9rem] shadow-lg shadow-blue-200 mt-2 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Entrar na Conta
            </button>
            <button onClick={() => { setMode('register'); setErrors({}); }} className="text-center text-[0.72rem] text-slate-500 font-medium">
              Não tem conta? <span className="text-[#0052CC] font-bold">Criar agora</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-1">
              {(['client', 'professional'] as UserRole[]).map(r => (
                <button key={r} onClick={() => { setRole(r); setErrors({}); }}
                  className={`flex-1 py-2.5 text-[0.75rem] font-bold rounded-xl transition-all ${role === r ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                  {r === 'client' ? 'Sou Cliente' : 'Sou Profissional'}
                </button>
              ))}
            </div>

            <InputField label="Nome completo" type="text" value={regName} onChange={setRegName}
              placeholder="Seu nome completo" icon={<User className="w-4 h-4" />} error={errors.name} />
            <InputField label="E-mail" type="email" value={regEmail} onChange={setRegEmail}
              placeholder="seu@email.com" icon={<Mail className="w-4 h-4" />} error={errors.email} />
            <InputField label="Telefone" type="tel" value={regPhone}
              onChange={(v) => setRegPhone(formatPhone(v))}
              placeholder="(11) 99999-9999" icon={<Phone className="w-4 h-4" />} error={errors.phone} />
            <InputField label="Senha" type={showPwd ? 'text' : 'password'}
              value={regPwd} onChange={setRegPwd} placeholder="Mínimo 6 caracteres"
              icon={<Lock className="w-4 h-4" />} error={errors.password} hint={pwdToggle} />

            <AnimatePresence>
              {role === 'professional' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-3.5 overflow-hidden"
                >
                  <InputField label="Sua profissão" type="text" value={regProfession} onChange={setRegProfession}
                    placeholder="Ex: Eletricista, Pintor..." icon={<FileText className="w-4 h-4" />} error={errors.profession} />
                  <InputField label="CPF ou CNPJ" type="text" value={regCpf} onChange={setRegCpf}
                    placeholder="000.000.000-00" icon={<FileText className="w-4 h-4" />} error={errors.cpf} />
                  <div>
                    <div className={`bg-slate-50 border rounded-2xl px-4 py-3.5 transition-all ${errors.category ? 'border-red-400' : 'border-slate-200 focus-within:border-[#0052CC] focus-within:ring-1 focus-within:ring-[#0052CC]/30'}`}>
                      <label className="text-[0.52rem] font-extrabold text-slate-400 uppercase tracking-widest">Categoria de serviço</label>
                      <select value={regCategory} onChange={e => setRegCategory(e.target.value)}
                        className="w-full text-[0.82rem] outline-none text-slate-700 bg-transparent appearance-none mt-0.5">
                        <option value="">Selecione uma categoria...</option>
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    {errors.category && <p className="text-[0.62rem] text-red-500 font-semibold mt-1 ml-2">{errors.category}</p>}
                  </div>
                  <div className="p-4 bg-[#EFF6FF] rounded-2xl border border-[#DBEAFE] flex items-start gap-3">
                    <Shield className="w-4 h-4 text-[#0052CC] mt-0.5 shrink-0" />
                    <p className="text-[0.65rem] text-[#1E40AF] font-semibold leading-relaxed">
                      <strong>Para profissionais:</strong> Assine nosso plano para aparecer no topo das buscas e receber muito mais contratações.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={handleRegister} disabled={loading}
              className="w-full bg-gradient-to-r from-[#003A9E] to-[#0063F7] text-white font-bold py-3.5 rounded-2xl text-[0.9rem] shadow-lg shadow-blue-200 mt-2 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar Conta {role === 'professional' ? 'Premium' : 'Grátis'}
            </button>
            <p className="text-center text-[0.63rem] text-slate-400 font-medium leading-relaxed">
              Ao criar conta você aceita nossos{' '}
              <span className="text-[#0052CC] font-bold">Termos de Uso</span> e{' '}
              <span className="text-[#0052CC] font-bold">Política de Privacidade</span>
            </p>
            <button onClick={() => { setMode('login'); setErrors({}); }} className="text-center text-[0.72rem] text-slate-500 font-medium">
              Já tem conta? <span className="text-[#0052CC] font-bold">Entrar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   NOTIFICATIONS SCREEN
══════════════════════════════════════════════ */

function NotificationsScreen({ notifications, onMarkAllRead, onBack }: {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onBack: () => void;
}) {
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-[#003A9E] to-[#0063F7] px-5 pt-12 pb-6">
        <button onClick={onBack} className="mb-3 flex items-center gap-1 text-white/70 text-[0.78rem] font-semibold">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white">Notificações</h1>
          {unread > 0 && (
            <button onClick={onMarkAllRead} className="flex items-center gap-1 text-[0.68rem] text-white/70 font-bold">
              <CheckCheck className="w-3.5 h-3.5" /> Marcar lidas
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4 pb-24">
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">Nenhuma notificação ainda</p>
            <p className="text-xs mt-1">Você receberá alertas aqui</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map(notif => {
              const Icon = (Icons as Record<string, React.FC<{ className?: string }>>)[notif.icon] || Bell;
              return (
                <div key={notif.id} className={`flex gap-3.5 p-4 rounded-2xl border ${notif.read ? 'bg-white border-slate-100' : 'bg-[#EFF6FF] border-[#DBEAFE]'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${notif.read ? 'bg-slate-100' : 'bg-[#0052CC]'}`}>
                    <Icon className={`w-4 h-4 ${notif.read ? 'text-slate-400' : 'text-white'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[0.78rem] font-bold text-slate-800 leading-snug">{notif.title}</p>
                      {!notif.read && <span className="w-2 h-2 bg-[#0052CC] rounded-full mt-1.5 shrink-0" />}
                    </div>
                    <p className="text-[0.7rem] text-slate-500 leading-relaxed mt-0.5">{notif.message}</p>
                    <p className="text-[0.6rem] text-slate-400 font-medium mt-1.5">
                      {new Date(notif.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MY PROFILE SCREEN
══════════════════════════════════════════════ */

function MyProfileScreen({ user, onLogout, onBack }: {
  user: AppUser; onLogout: () => void; onBack: () => void;
}) {
  const requests: OrcamentoRequest[] = (() => {
    try { return JSON.parse(localStorage.getItem(`encontreai_requests_${user.id}`) || '[]'); }
    catch { return []; }
  })();
  const categoryName = CATEGORIES.find(c => c.id === user.categoryId)?.name;

  const infoItems = [
    { label: 'E-mail', value: user.email, icon: <Mail className="w-4 h-4 text-slate-400" /> },
    { label: 'Telefone', value: user.phone, icon: <Phone className="w-4 h-4 text-slate-400" /> },
    { label: 'Membro desde', value: new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), icon: <CheckCircle2 className="w-4 h-4 text-slate-400" /> },
    ...(user.role === 'professional' && categoryName ? [{ label: 'Categoria', value: categoryName, icon: <FileText className="w-4 h-4 text-slate-400" /> }] : []),
    ...(user.role === 'professional' && user.profession ? [{ label: 'Profissão declarada', value: user.profession, icon: <TrendingUp className="w-4 h-4 text-slate-400" /> }] : []),
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-[#003A9E] via-[#0052CC] to-[#0063F7] px-5 pt-12 pb-8">
        <button onClick={onBack} className="mb-4 flex items-center gap-1 text-white/70 text-[0.78rem] font-semibold">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
            <span className="text-white text-2xl font-black">{user.avatarInitial}</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-white leading-tight">{user.name}</h1>
            <p className="text-white/55 text-[0.7rem] font-medium">{user.email}</p>
            <span className={`inline-block mt-1 text-[0.55rem] px-2 py-0.5 rounded-full font-bold uppercase ${user.role === 'professional' ? 'bg-[#FF8C00] text-white' : 'bg-white/20 text-white'}`}>
              {user.role === 'professional' ? '⭐ Profissional' : '👤 Cliente'}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 pb-24">
        {/* Info */}
        <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden mb-4">
          {infoItems.map((item, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < infoItems.length - 1 ? 'border-b border-slate-100' : ''}`}>
              {item.icon}
              <div className="min-w-0">
                <div className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest">{item.label}</div>
                <div className="text-[0.8rem] font-semibold text-slate-700 truncate">{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Requests */}
        <h2 className="text-[0.72rem] font-extrabold text-slate-500 mb-3 uppercase tracking-widest">Meus Orçamentos</h2>
        {requests.length > 0 ? (
          <div className="flex flex-col gap-2 mb-4">
            {requests.map(req => (
              <div key={req.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[0.8rem] font-bold text-slate-800">{req.professionalName}</span>
                  <span className={`text-[0.55rem] px-2 py-0.5 rounded-full font-bold uppercase ml-2 shrink-0 ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {req.status === 'pending' ? 'Aguardando' : 'Respondido'}
                  </span>
                </div>
                <p className="text-[0.68rem] text-slate-400 mb-1">{req.profession}</p>
                <p className="text-[0.7rem] text-slate-600 leading-relaxed line-clamp-2">"{req.message}"</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[0.6rem] text-slate-400 font-medium">
                    {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-[0.6rem] text-slate-400 font-medium">
                    Contato: {req.contactTime}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 text-center mb-4">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-[0.78rem] font-semibold text-slate-500">Nenhum orçamento ainda</p>
            <p className="text-[0.68rem] text-slate-400 mt-0.5">Explore os profissionais e solicite seu primeiro orçamento!</p>
          </div>
        )}

        <button onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 font-bold py-3.5 rounded-2xl text-[0.88rem] active:scale-[0.98] transition-transform">
          <LogOut className="w-4 h-4" /> Sair da Conta
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ORÇAMENTO MODAL
══════════════════════════════════════════════ */

function OrcamentoModal({ open, professionalId, currentUser, onClose, onSuccess }: {
  open: boolean; professionalId: string | null;
  currentUser: AppUser | null; onClose: () => void; onSuccess: () => void;
}) {
  const [message, setMessage] = useState('');
  const [contactTime, setContactTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const professional = PROFESSIONALS.find(p => p.id === professionalId);

  useEffect(() => {
    if (!open) { setMessage(''); setContactTime(''); setErrors({}); }
  }, [open]);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!message.trim() || message.trim().length < 10) e.message = 'Descreva o serviço (mínimo 10 caracteres)';
    if (!contactTime) e.contactTime = 'Selecione um horário preferencial';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 700));

    if (currentUser && professional) {
      const request: OrcamentoRequest = {
        id: `req_${Date.now()}`,
        userId: currentUser.id,
        professionalId: professional.id,
        professionalName: professional.name,
        profession: professional.profession,
        message: message.trim(),
        contactTime,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      const key = `encontreai_requests_${currentUser.id}`;
      const existing: OrcamentoRequest[] = (() => {
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
      })();
      existing.unshift(request);
      localStorage.setItem(key, JSON.stringify(existing));
    }
    setLoading(false);
    onSuccess();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/50 z-[100]" />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-[101] px-5 pt-5 pb-10 shadow-2xl"
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-base font-black text-slate-800">Solicitar Orçamento</h2>
                {professional && <p className="text-[0.7rem] text-slate-500 font-medium mt-0.5">{professional.name} · {professional.profession}</p>}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[0.58rem] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">
                  Descreva o serviço que precisa *
                </label>
                <textarea
                  value={message} onChange={e => setMessage(e.target.value.slice(0, 300))}
                  placeholder="Ex: Preciso trocar o disjuntor do quadro elétrico e verificar algumas tomadas com problema..."
                  rows={4}
                  className={`w-full bg-slate-50 border rounded-2xl px-4 py-3 text-[0.82rem] text-slate-800 placeholder:text-slate-300 outline-none resize-none transition-all ${errors.message ? 'border-red-400' : 'border-slate-200 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]/30'}`}
                />
                <div className="flex justify-between mt-1">
                  {errors.message ? <p className="text-[0.62rem] text-red-500 font-semibold">{errors.message}</p> : <span />}
                  <span className="text-[0.6rem] text-slate-400 font-medium">{message.length}/300</span>
                </div>
              </div>

              <div>
                <label className="text-[0.58rem] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">
                  Melhor horário para contato *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Manhã (8h–12h)', 'Tarde (12h–18h)', 'Noite (18h–21h)', 'Qualquer horário'].map(t => (
                    <button key={t} onClick={() => setContactTime(t)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[0.7rem] font-semibold transition-all text-left ${contactTime === t ? 'bg-[#0052CC] border-[#0052CC] text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                      <Clock className={`w-3.5 h-3.5 shrink-0 ${contactTime === t ? 'text-white' : 'text-slate-400'}`} />
                      {t}
                    </button>
                  ))}
                </div>
                {errors.contactTime && <p className="text-[0.62rem] text-red-500 font-semibold mt-1">{errors.contactTime}</p>}
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full bg-gradient-to-r from-[#FF5500] to-[#FF8C00] text-white font-bold py-3.5 rounded-2xl text-[0.9rem] shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Enviando...' : 'Enviar Solicitação'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════
   FILTER MODAL
══════════════════════════════════════════════ */

function FilterModal({ open, filter, onApply, onClose }: {
  open: boolean;
  filter: { minRating: number; verifiedOnly: boolean };
  onApply: (f: { minRating: number; verifiedOnly: boolean }) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(filter);
  useEffect(() => { if (open) setLocal(filter); }, [open, filter]);

  const ratings = [
    { label: 'Qualquer avaliação', value: 0 },
    { label: '4.0+ estrelas', value: 4.0 },
    { label: '4.5+ estrelas', value: 4.5 },
    { label: '5.0 estrelas', value: 5.0 },
  ];

  const reset = () => { const z = { minRating: 0, verifiedOnly: false }; setLocal(z); onApply(z); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/50 z-[100]" />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl z-[101] px-5 pt-5 pb-10 shadow-2xl"
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-black text-slate-800">Filtrar Profissionais</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-[0.58rem] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5 block">Avaliação mínima</label>
                <div className="flex flex-col gap-2">
                  {ratings.map(opt => (
                    <button key={opt.value} onClick={() => setLocal(f => ({ ...f, minRating: opt.value }))}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[0.78rem] font-semibold transition-all ${local.minRating === opt.value ? 'bg-[#0052CC] border-[#0052CC] text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <span>{opt.label}</span>
                      {opt.value > 0 && (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: Math.floor(opt.value) }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${local.minRating === opt.value ? 'fill-white text-white' : 'fill-[#FF8C00] text-[#FF8C00]'}`} />
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[0.58rem] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5 block">Outros filtros</label>
                <button onClick={() => setLocal(f => ({ ...f, verifiedOnly: !f.verifiedOnly }))}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border text-[0.78rem] font-semibold transition-all ${local.verifiedOnly ? 'bg-[#0052CC] border-[#0052CC] text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <div className="flex items-center gap-2.5">
                    <Shield className={`w-4 h-4 ${local.verifiedOnly ? 'text-white' : 'text-slate-400'}`} />
                    <span>Apenas perfis verificados</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${local.verifiedOnly ? 'bg-white border-white' : 'border-slate-300'}`}>
                    {local.verifiedOnly && <CheckCircle2 className="w-3 h-3 text-[#0052CC]" />}
                  </div>
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={reset}
                  className="flex-1 border border-slate-200 text-slate-600 font-bold py-3 rounded-2xl text-[0.82rem] active:scale-[0.98] transition-transform">
                  Limpar
                </button>
                <button onClick={() => onApply(local)}
                  className="flex-1 bg-gradient-to-r from-[#003A9E] to-[#0063F7] text-white font-bold py-3 rounded-2xl text-[0.82rem] shadow-md active:scale-[0.98] transition-transform">
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

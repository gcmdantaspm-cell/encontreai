import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Star, ArrowLeft, User, MapPin, Phone, Mail, Lock,
  Bell, SlidersHorizontal, CheckCircle2, Zap, Shield, TrendingUp,
  ChevronRight, ChevronDown, ChevronUp, X, Send, Clock,
  LogOut, FileText, Eye, EyeOff, Loader2, CheckCheck, Home, Briefcase, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PROFESSIONALS } from './data';
import { Professional, UserRole, AppUser, OrcamentoRequest, AppNotification } from './types';
import * as Icons from 'lucide-react';

type Screen = 'home' | 'profile' | 'auth' | 'notifications' | 'my-profile';
type AuthMode = 'login' | 'register';

/* ══════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════ */
const C = {
  // Primary — Deep Teal
  primary:   '#0A7373',
  primary2:  '#0D8585',
  primary3:  '#0B6B6B',
  primaryBg: '#E6F4F4',
  primaryLight: '#B2DFDF',

  // Accent — Warm Amber
  accent:    '#F5A623',
  accentDk:  '#E09510',
  accentBg:  '#FEF5E7',

  // Neutral
  bg:        '#F5F7FA',
  card:      '#FFFFFF',
  border:    '#E8ECF0',
  border2:   '#D1D9E0',

  // Text
  textPrimary:   '#1A2332',
  textSecondary: '#546E7A',
  textTertiary:  '#8FA3B0',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error:   '#EF4444',
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

function useGeolocation() {
  const [location, setLocation] = useState('Detectando...');
  useEffect(() => {
    const cached = sessionStorage.getItem('encontreai_location');
    if (cached) { setLocation(cached); return; }
    if (!('geolocation' in navigator)) { setLocation('São Paulo, SP'); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=pt-BR`);
          const d = await res.json();
          const city = d.city || d.locality || 'São Paulo';
          const stateCode = (d.principalSubdivisionCode || 'BR-SP').split('-')[1] || 'SP';
          const loc = `${city}, ${stateCode}`;
          setLocation(loc); sessionStorage.setItem('encontreai_location', loc);
        } catch { setLocation('São Paulo, SP'); }
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
      { id: `n_p_${Date.now() + 1}`, title: '🔥 Oferta exclusiva', message: 'Ganhe 20% de desconto na sua primeira contratação. Válido por 7 dias!', read: false, icon: 'Zap', createdAt: new Date().toISOString() },
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
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-5 py-3.5 rounded-2xl shadow-2xl max-w-[85%] text-sm font-semibold text-white flex items-center gap-2.5"
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
    <button onClick={onClick} className="flex flex-col items-center gap-1 px-4 py-1 relative">
      <div className="relative">
        <span style={{ color: active ? C.primary : C.textTertiary }}>{icon}</span>
        {badge ? (
          <span className="absolute -top-1.5 -right-1.5 min-w-[1rem] h-4 text-white text-[0.5rem] font-black rounded-full flex items-center justify-center px-1"
            style={{ background: C.accent }}>{badge > 9 ? '9+' : badge}</span>
        ) : null}
      </div>
      <span className="text-[10px] font-bold truncate max-w-[3.5rem]" style={{ color: active ? C.primary : C.textTertiary }}>{label}</span>
      {active && <motion.div layoutId="nav-indicator" className="absolute -bottom-0.5 w-6 h-0.5 rounded-full" style={{ background: C.primary }} />}
    </button>
  );
}

/* ══════════════════════════════════════════════
   APP
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
    setScreen(s); window.scrollTo(0, 0);
  };

  const handleOrcamento = (profId: string) => {
    if (!currentUser) { setPendingOrcamento(profId); goTo('auth'); showToast('Faça login para solicitar um orçamento', 'info'); }
    else { setOrcamentoProfId(profId); setShowOrcamento(true); }
  };

  const handleLoginSuccess = () => {
    showToast('Login realizado com sucesso! 👋');
    if (pendingOrcamento) { setOrcamentoProfId(pendingOrcamento); setPendingOrcamento(null); goTo('home'); setTimeout(() => setShowOrcamento(true), 300); }
    else goTo('home');
  };

  const handleRegisterSuccess = (user: AppUser) => {
    addWelcome(user); showToast(`Bem-vindo, ${user.name.split(' ')[0]}! 🎉`);
    if (pendingOrcamento) { setOrcamentoProfId(pendingOrcamento); setPendingOrcamento(null); goTo('home'); setTimeout(() => setShowOrcamento(true), 300); }
    else goTo('home');
  };

  const selectedProf = PROFESSIONALS.find(p => p.id === selectedProfId);

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto min-h-screen shadow-2xl relative flex flex-col" style={{ background: C.card }}>
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {screen === 'home' && (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <HomeScreen onNavigate={goTo} onOrcamento={handleOrcamento} onOpenFilter={() => setShowFilter(true)} location={location} filter={filter} />
              </motion.div>
            )}
            {screen === 'profile' && selectedProf && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.18 }}>
                <ProfileScreen professional={selectedProf} onBack={() => goTo('home')} onOrcamento={handleOrcamento} />
              </motion.div>
            )}
            {screen === 'auth' && (
              <motion.div key="auth" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.18 }}>
                <AuthScreen onLoginSuccess={handleLoginSuccess} onRegisterSuccess={handleRegisterSuccess} onBack={() => goTo('home')} register={register} login={login} showToast={showToast} />
              </motion.div>
            )}
            {screen === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.18 }}>
                <NotificationsScreen notifications={notifications} onMarkAllRead={markAllRead} onBack={() => goTo('home')} />
              </motion.div>
            )}
            {screen === 'my-profile' && currentUser && (
              <motion.div key="my-profile" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.18 }}>
                <MyProfileScreen user={currentUser} onLogout={() => { logout(); showToast('Você saiu da conta.', 'info'); goTo('home'); }} onBack={() => goTo('home')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Nav */}
        <div className="sticky bottom-0 w-full flex justify-around items-center px-2 pt-3 pb-5 z-50"
          style={{ background: C.card, borderTop: `1px solid ${C.border}`, boxShadow: '0 -4px 24px rgba(0,0,0,0.06)' }}>
          <NavButton icon={<Home className="w-5 h-5" />} label="Início" active={screen === 'home'} onClick={() => goTo('home')} />
          <NavButton icon={<Bell className="w-5 h-5" />} label="Alertas" active={screen === 'notifications'} badge={unreadCount > 0 ? unreadCount : undefined}
            onClick={() => currentUser ? goTo('notifications') : (goTo('auth'), showToast('Faça login para ver alertas', 'info'))} />
          <NavButton
            icon={currentUser
              ? <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black" style={{ background: C.primary }}>{currentUser.avatarInitial}</div>
              : <User className="w-5 h-5" />}
            label={currentUser ? currentUser.name.split(' ')[0] : 'Entrar'}
            active={screen === 'auth' || screen === 'my-profile'}
            onClick={() => currentUser ? goTo('my-profile') : goTo('auth')}
          />
        </div>

        <OrcamentoModal open={showOrcamento} professionalId={orcamentoProfId} currentUser={currentUser} onClose={() => setShowOrcamento(false)} onSuccess={() => { setShowOrcamento(false); showToast('Orçamento enviado com sucesso! ✅'); }} />
        <FilterModal open={showFilter} filter={filter} onApply={(f) => { setFilter(f); setShowFilter(false); showToast('Filtros aplicados'); }} onClose={() => setShowFilter(false)} />
        <Toast toast={toast} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   HOME SCREEN
══════════════════════════════════════════════ */

function HomeScreen({ onNavigate, onOrcamento, onOpenFilter, location, filter }: {
  onNavigate: (s: Screen, pId?: string) => void; onOrcamento: (id: string) => void;
  onOpenFilter: () => void; location: string; filter: { minRating: number; verifiedOnly: boolean };
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const hasFilter = filter.minRating > 0 || filter.verifiedOnly;

  const filtered = PROFESSIONALS.filter(p => {
    if (!p.activeSubscription) return false;
    if (filter.verifiedOnly && !p.verified) return false;
    if (filter.minRating > 0 && p.rating < filter.minRating) return false;
    if (search) { const q = search.toLowerCase(); if (!p.name.toLowerCase().includes(q) && !p.profession.toLowerCase().includes(q)) return false; }
    return true;
  });

  const catColors = [
    { bg: '#E6F4F4', text: C.primary },
    { bg: '#FEF5E7', text: C.accentDk },
    { bg: '#EDF7ED', text: '#2E7D32' },
    { bg: '#F3EFF8', text: '#6A1B9A' },
    { bg: '#FFF8E1', text: '#F57F17' },
    { bg: '#FCE8E8', text: '#C62828' },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-5" style={{ background: `linear-gradient(145deg, ${C.primary3} 0%, ${C.primary} 50%, ${C.primary2} 100%)` }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white text-[1.6rem] font-black tracking-tight">
                encontre<span style={{ color: C.accent }}>aí</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60 text-[0.68rem] font-semibold">
              <MapPin className="w-3 h-3" />
              <span className={location === 'Detectando...' ? 'animate-pulse' : ''}>{location}</span>
            </div>
          </div>
          <button onClick={() => onNavigate('notifications')}
            className="w-10 h-10 rounded-2xl flex items-center justify-center border" style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' }}>
            <Bell className="w-4.5 h-4.5 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textTertiary }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Eletricistas, pintores, encanadores..."
              className="w-full rounded-2xl py-3.5 pl-10 pr-4 text-sm font-medium outline-none"
              style={{ background: C.card, color: C.textPrimary, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }} />
          </div>
          <button onClick={onOpenFilter}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: hasFilter ? C.card : C.accent, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
            <SlidersHorizontal className="w-4.5 h-4.5" style={{ color: hasFilter ? C.primary : 'white' }} />
          </button>
        </div>
        {hasFilter && (
          <div className="mt-2 flex items-center gap-1.5 text-white/70 text-[0.65rem] font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            Filtros: {[filter.minRating > 0 && `${filter.minRating}+ ★`, filter.verifiedOnly && 'Verificados'].filter(Boolean).join(', ')}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[0.65rem] font-extrabold uppercase tracking-widest" style={{ color: C.textTertiary }}>Categorias</span>
          {activeCategory && <button onClick={() => setActiveCategory(null)} className="text-[0.65rem] font-bold" style={{ color: C.primary }}>Limpar ×</button>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat, i) => {
            const Icon = (Icons as Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>>)[cat.icon] || Icons.HelpCircle;
            const isActive = activeCategory === cat.name;
            const col = catColors[i % catColors.length];
            return (
              <button key={cat.id} onClick={() => setActiveCategory(isActive ? null : cat.name)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border flex-shrink-0 transition-all active:scale-95"
                style={{
                  background: isActive ? C.primary : C.card,
                  borderColor: isActive ? C.primary : C.border,
                  boxShadow: isActive ? `0 4px 12px ${C.primary}30` : '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: isActive ? 'rgba(255,255,255,0.2)' : col.bg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: isActive ? 'white' : col.text }} />
                </div>
                <span className="text-[0.68rem] font-bold whitespace-nowrap" style={{ color: isActive ? 'white' : C.textPrimary }}>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Promo Banner */}
      <div className="mx-5 mt-3 mb-4">
        <div className="rounded-3xl p-4 flex items-center justify-between overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${C.accentDk} 0%, ${C.accent} 100%)` }}>
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="relative z-10">
            <div className="text-[0.55rem] text-white/70 font-bold uppercase tracking-widest mb-1">⚡ Oferta especial</div>
            <div className="text-white font-black text-base leading-tight">
              1ª contratação com<br /><span className="text-[1.15rem]">20% desconto</span>
            </div>
            <div className="mt-1.5 text-white/70 text-[0.6rem] font-semibold">Válido por tempo limitado</div>
          </div>
          <div className="relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center border border-white/30" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Zap className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Professionals */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[0.65rem] font-extrabold uppercase tracking-widest" style={{ color: C.textTertiary }}>
            {activeCategory ?? 'Em Destaque'}
          </span>
          <span className="text-[0.62rem] font-semibold" style={{ color: C.textTertiary }}>{filtered.length} profissionais</span>
        </div>

        <div className="flex flex-col gap-3">
          {filtered.length > 0 ? filtered.map((pro, i) => (
            <motion.button key={pro.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => onNavigate('profile', pro.id)}
              className="rounded-3xl p-4 text-left flex gap-4 items-center active:scale-[0.98] transition-transform"
              style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="relative shrink-0">
                <img src={pro.avatarUrl} alt={pro.name} className="w-14 h-14 rounded-2xl object-cover" style={{ background: C.bg }} />
                {pro.verified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white" style={{ background: C.primary }}>
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <span className="font-bold text-[0.85rem] truncate" style={{ color: C.textPrimary }}>{pro.name}</span>
                  <div className="flex items-center gap-0.5 ml-2 shrink-0 px-1.5 py-0.5 rounded-lg" style={{ background: C.accentBg }}>
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span className="text-[0.65rem] font-bold text-amber-600">{pro.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="text-[0.68rem] mb-2 truncate" style={{ color: C.textSecondary }}>{pro.profession}</div>
                <div className="flex items-center gap-2">
                  {pro.verified && (
                    <span className="text-[0.52rem] px-2 py-0.5 rounded-full font-bold uppercase" style={{ background: C.primaryBg, color: C.primary }}>
                      ✓ Verificado
                    </span>
                  )}
                  <span className="text-[0.58rem] font-medium" style={{ color: C.textTertiary }}>{pro.reviewsCount} avaliações</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: C.border2 }} />
            </motion.button>
          )) : (
            <div className="text-center py-14" style={{ color: C.textTertiary }}>
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
  professional: Professional; onBack: () => void; onOrcamento: (id: string) => void;
}) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const visibleReviews = showAllReviews ? professional.reviews : professional.reviews.slice(0, 2);

  return (
    <div className="min-h-screen pb-24" style={{ background: C.bg }}>
      {/* Cover */}
      <div className="relative h-52">
        <img src={professional.coverUrl} alt="Capa" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
        <button onClick={onBack} className="absolute top-10 left-4 p-2.5 rounded-full backdrop-blur-sm"
          style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <ArrowLeft className="w-4 h-4" style={{ color: C.textPrimary }} />
        </button>
      </div>

      {/* Card Principal */}
      <div className="mx-4 -mt-10 relative rounded-3xl overflow-hidden" style={{ background: C.card, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-end gap-3 mb-4">
            <img src={professional.avatarUrl} alt={professional.name} className="w-16 h-16 rounded-2xl object-cover border-4 border-white" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)', background: C.bg }} />
            <div className="pb-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h1 className="font-black text-[1.05rem]" style={{ color: C.textPrimary }}>{professional.name}</h1>
                {professional.verified && <CheckCircle2 className="w-4 h-4" style={{ color: C.primary }} />}
              </div>
              <div className="flex items-center gap-1 text-[0.68rem] font-medium" style={{ color: C.textSecondary }}>
                <MapPin className="w-3 h-3" /> {professional.profession} · São Paulo
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Avaliação', value: professional.rating.toFixed(1), accent: true },
              { label: 'Avaliações', value: String(professional.reviewsCount) },
              { label: 'Contratos', value: String(Math.floor(professional.reviewsCount * 1.5)) },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-3 text-center" style={{ background: i === 0 ? C.primaryBg : C.bg, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-center gap-1">
                  {s.accent && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                  <span className="text-base font-black" style={{ color: i === 0 ? C.primary : C.textPrimary }}>{s.value}</span>
                </div>
                <div className="text-[0.5rem] font-bold uppercase tracking-wide mt-0.5" style={{ color: C.textTertiary }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button onClick={() => onOrcamento(professional.id)}
            className="w-full py-4 rounded-2xl font-bold text-white text-[0.9rem] active:scale-[0.98] transition-transform"
            style={{ background: `linear-gradient(135deg, ${C.primary3}, ${C.primary2})`, boxShadow: `0 6px 20px ${C.primary}40` }}>
            Solicitar Orçamento Grátis
          </button>
        </div>

        {/* Badges */}
        <div className="flex gap-2 px-5 pb-5 flex-wrap">
          {professional.verified && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: C.primaryBg }}>
              <Shield className="w-3.5 h-3.5" style={{ color: C.primary }} />
              <span className="text-[0.6rem] font-bold" style={{ color: C.primary }}>Perfil Verificado</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#EDF7ED' }}>
            <TrendingUp className="w-3.5 h-3.5 text-green-700" />
            <span className="text-[0.6rem] font-bold text-green-700">Top Profissional</span>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="mx-4 mt-3 rounded-3xl px-5 py-4" style={{ background: C.card, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 className="text-[0.65rem] font-extrabold uppercase tracking-widest mb-2.5" style={{ color: C.textTertiary }}>Sobre</h2>
        <p className="text-[0.82rem] leading-relaxed" style={{ color: C.textSecondary }}>{professional.description}</p>
      </div>

      {/* Portfolio */}
      {professional.portfolio.length > 0 && (
        <div className="mx-4 mt-3 rounded-3xl px-5 py-4" style={{ background: C.card, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 className="text-[0.65rem] font-extrabold uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Portfólio</h2>
          <div className="grid grid-cols-3 gap-2">
            {professional.portfolio.map((img, i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden" style={{ background: C.bg }}>
                <img src={img} alt="Portfólio" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="mx-4 mt-3 rounded-3xl px-5 py-4" style={{ background: C.card, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[0.65rem] font-extrabold uppercase tracking-widest" style={{ color: C.textTertiary }}>
            Avaliações ({professional.reviews.length})
          </h2>
          {professional.reviews.length > 2 && (
            <button onClick={() => setShowAllReviews(!showAllReviews)} className="flex items-center gap-0.5 text-[0.65rem] font-bold" style={{ color: C.primary }}>
              {showAllReviews ? 'Recolher' : 'Ver todas'}
              {showAllReviews ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {visibleReviews.map(review => (
              <motion.div key={review.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-2xl" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[0.65rem] font-black"
                      style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primary2})` }}>
                      {review.authorName[0]}
                    </div>
                    <span className="font-bold text-[0.78rem]" style={{ color: C.textPrimary }}>{review.authorName}</span>
                  </div>
                  <span className="text-[0.6rem] font-medium" style={{ color: C.textTertiary }}>{review.date}</span>
                </div>
                <div className="flex gap-0.5 mb-1.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />)}
                </div>
                <p className="text-[0.76rem] leading-relaxed" style={{ color: C.textSecondary }}>{review.comment}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   INPUT FIELD
══════════════════════════════════════════════ */
interface IFProps { label: string; type: string; value: string; onChange: (v: string) => void; placeholder: string; icon: React.ReactNode; error?: string; hint?: React.ReactNode; }
function InputField({ label, type, value, onChange, placeholder, icon, error, hint }: IFProps) {
  return (
    <div>
      <div className={`rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all`}
        style={{ background: C.bg, border: `1.5px solid ${error ? C.error : C.border}`, outlineColor: error ? C.error : C.primary }}>
        <span style={{ color: C.textTertiary }} className="shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <label className="text-[0.5rem] font-extrabold uppercase tracking-widest" style={{ color: C.textTertiary }}>{label}</label>
          <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full text-[0.82rem] outline-none bg-transparent mt-0.5 placeholder:opacity-40"
            style={{ color: C.textPrimary }}
            onFocus={e => (e.currentTarget.parentElement!.parentElement as HTMLElement).style.borderColor = error ? C.error : C.primary}
            onBlur={e => (e.currentTarget.parentElement!.parentElement as HTMLElement).style.borderColor = error ? C.error : C.border}
          />
        </div>
        {hint && <span className="shrink-0">{hint}</span>}
      </div>
      {error && <p className="text-[0.62rem] font-semibold mt-1 ml-2" style={{ color: C.error }}>{error}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════
   AUTH SCREEN
══════════════════════════════════════════════ */
function AuthScreen({ onLoginSuccess, onRegisterSuccess, onBack, register, login, showToast }: {
  onLoginSuccess: () => void; onRegisterSuccess: (user: AppUser) => void; onBack: () => void;
  register: (d: { name: string; email: string; phone: string; password: string; role: UserRole; profession?: string; categoryId?: string; cpfCnpj?: string }) => { ok: boolean; error?: string };
  login: (e: string, p: string) => { ok: boolean; error?: string };
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void;
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === 'login') { if (!loginEmail) e.loginEmail = 'E-mail obrigatório'; if (!loginPwd) e.loginPwd = 'Senha obrigatória'; }
    else {
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
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return; setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const res = login(loginEmail, loginPwd); setLoading(false);
    if (res.ok) onLoginSuccess(); else setErrors({ loginEmail: res.error || 'Erro' });
  };

  const handleRegister = async () => {
    if (!validate()) return; setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const res = register({ name: regName.trim(), email: regEmail.trim(), phone: regPhone, password: regPwd, role, ...(role === 'professional' ? { cpfCnpj: regCpf, categoryId: regCategory, profession: regProfession } : {}) });
    setLoading(false);
    if (res.ok) { const s = sessionStorage.getItem('encontreai_session'); if (s) onRegisterSuccess(JSON.parse(s)); }
    else setErrors({ email: res.error || 'Erro' });
  };

  const fmtPhone = (v: string) => { const d = v.replace(/\D/g,'').slice(0,11); if (d.length<=2) return d; if (d.length<=7) return `(${d.slice(0,2)}) ${d.slice(2)}`; return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`; };
  const pwdHint = <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ color: C.textTertiary }}>{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>;

  const ToggleGroup = ({ value, options, onChange }: { value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) => (
    <div className="flex p-1 rounded-2xl gap-1" style={{ background: C.bg }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className="flex-1 py-2.5 text-[0.75rem] font-bold rounded-xl transition-all"
          style={{ background: value === o.value ? C.card : 'transparent', color: value === o.value ? C.textPrimary : C.textTertiary, boxShadow: value === o.value ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-8" style={{ background: `linear-gradient(145deg, ${C.primary3}, ${C.primary2})` }}>
        <button onClick={onBack} className="mb-5 flex items-center gap-1.5 text-white/60 text-[0.78rem] font-semibold">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="text-[1.6rem] font-black tracking-tight mb-1">
          <span className="text-white">encontre</span><span style={{ color: C.accent }}>aí</span>
        </div>
        <p className="text-white/60 text-[0.75rem] font-medium">
          {mode === 'login' ? 'Acesse sua conta e explore profissionais.' : 'Crie sua conta e comece agora.'}
        </p>
      </div>

      <div className="px-5 py-6 pb-24">
        <ToggleGroup value={mode} onChange={(v) => { setMode(v as AuthMode); setErrors({}); }}
          options={[{ label: 'Entrar', value: 'login' }, { label: 'Criar Conta', value: 'register' }]} />

        <div className="mt-5 flex flex-col gap-3.5">
          {mode === 'login' ? (<>
            <InputField label="E-mail" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="seu@email.com" icon={<Mail className="w-4 h-4" />} error={errors.loginEmail} />
            <InputField label="Senha" type={showPwd ? 'text' : 'password'} value={loginPwd} onChange={setLoginPwd} placeholder="••••••••" icon={<Lock className="w-4 h-4" />} error={errors.loginPwd} hint={pwdHint} />
            <button onClick={handleLogin} disabled={loading} className="w-full py-4 rounded-2xl font-bold text-white text-[0.9rem] flex items-center justify-center gap-2 mt-2 disabled:opacity-70 active:scale-[0.98] transition-transform"
              style={{ background: `linear-gradient(135deg, ${C.primary3}, ${C.primary2})`, boxShadow: `0 6px 20px ${C.primary}35` }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Entrar na Conta
            </button>
            <button onClick={() => { setMode('register'); setErrors({}); }} className="text-center text-[0.72rem] font-medium" style={{ color: C.textSecondary }}>
              Não tem conta? <span className="font-bold" style={{ color: C.primary }}>Criar agora</span>
            </button>
          </>) : (<>
            <ToggleGroup value={role} onChange={v => { setRole(v as UserRole); setErrors({}); }}
              options={[{ label: 'Sou Cliente', value: 'client' }, { label: 'Sou Profissional', value: 'professional' }]} />
            <InputField label="Nome completo" type="text" value={regName} onChange={setRegName} placeholder="Seu nome completo" icon={<User className="w-4 h-4" />} error={errors.name} />
            <InputField label="E-mail" type="email" value={regEmail} onChange={setRegEmail} placeholder="seu@email.com" icon={<Mail className="w-4 h-4" />} error={errors.email} />
            <InputField label="Telefone" type="tel" value={regPhone} onChange={v => setRegPhone(fmtPhone(v))} placeholder="(11) 99999-9999" icon={<Phone className="w-4 h-4" />} error={errors.phone} />
            <InputField label="Senha" type={showPwd ? 'text' : 'password'} value={regPwd} onChange={setRegPwd} placeholder="Mínimo 6 caracteres" icon={<Lock className="w-4 h-4" />} error={errors.password} hint={pwdHint} />
            <AnimatePresence>
              {role === 'professional' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-3.5 overflow-hidden">
                  <InputField label="Sua profissão" type="text" value={regProfession} onChange={setRegProfession} placeholder="Ex: Eletricista, Pintor..." icon={<Briefcase className="w-4 h-4" />} error={errors.profession} />
                  <InputField label="CPF ou CNPJ" type="text" value={regCpf} onChange={setRegCpf} placeholder="000.000.000-00" icon={<FileText className="w-4 h-4" />} error={errors.cpf} />
                  <div>
                    <div className="rounded-2xl px-4 py-3.5" style={{ background: C.bg, border: `1.5px solid ${errors.category ? C.error : C.border}` }}>
                      <label className="text-[0.5rem] font-extrabold uppercase tracking-widest" style={{ color: C.textTertiary }}>Categoria de serviço</label>
                      <select value={regCategory} onChange={e => setRegCategory(e.target.value)} className="w-full text-[0.82rem] outline-none bg-transparent appearance-none mt-0.5" style={{ color: C.textPrimary }}>
                        <option value="">Selecione uma categoria...</option>
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    {errors.category && <p className="text-[0.62rem] font-semibold mt-1 ml-2" style={{ color: C.error }}>{errors.category}</p>}
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: C.primaryBg }}>
                    <Shield className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.primary }} />
                    <p className="text-[0.65rem] font-semibold leading-relaxed" style={{ color: C.primary }}>
                      <strong>Para profissionais:</strong> Assine nosso plano para aparecer no topo e receber muito mais contratações.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={handleRegister} disabled={loading} className="w-full py-4 rounded-2xl font-bold text-white text-[0.9rem] flex items-center justify-center gap-2 mt-2 disabled:opacity-70 active:scale-[0.98] transition-transform"
              style={{ background: `linear-gradient(135deg, ${C.primary3}, ${C.primary2})`, boxShadow: `0 6px 20px ${C.primary}35` }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Criar Conta {role === 'professional' ? 'Premium' : 'Grátis'}
            </button>
            <p className="text-center text-[0.63rem] font-medium leading-relaxed" style={{ color: C.textTertiary }}>
              Ao criar conta você aceita nossos <span className="font-bold" style={{ color: C.primary }}>Termos de Uso</span> e <span className="font-bold" style={{ color: C.primary }}>Política de Privacidade</span>
            </p>
            <button onClick={() => { setMode('login'); setErrors({}); }} className="text-center text-[0.72rem] font-medium" style={{ color: C.textSecondary }}>
              Já tem conta? <span className="font-bold" style={{ color: C.primary }}>Entrar</span>
            </button>
          </>)}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   NOTIFICATIONS SCREEN
══════════════════════════════════════════════ */
function NotificationsScreen({ notifications, onMarkAllRead, onBack }: { notifications: AppNotification[]; onMarkAllRead: () => void; onBack: () => void }) {
  const unread = notifications.filter(n => !n.read).length;
  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="px-5 pt-12 pb-6" style={{ background: `linear-gradient(145deg, ${C.primary3}, ${C.primary2})` }}>
        <button onClick={onBack} className="mb-3 flex items-center gap-1 text-white/60 text-[0.78rem] font-semibold">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white">Notificações</h1>
          {unread > 0 && <button onClick={onMarkAllRead} className="flex items-center gap-1 text-[0.68rem] text-white/60 font-bold"><CheckCheck className="w-3.5 h-3.5" /> Marcar lidas</button>}
        </div>
      </div>
      <div className="px-4 py-4 pb-24">
        {notifications.length === 0 ? (
          <div className="text-center py-16" style={{ color: C.textTertiary }}>
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">Nenhuma notificação ainda</p>
            <p className="text-xs mt-1">Você receberá alertas aqui</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map(notif => {
              const Icon = (Icons as Record<string, React.FC<{ className?: string }>>)[notif.icon] || Bell;
              return (
                <div key={notif.id} className="flex gap-3.5 p-4 rounded-3xl" style={{ background: notif.read ? C.card : C.primaryBg, border: `1px solid ${notif.read ? C.border : C.primaryLight}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: notif.read ? C.bg : C.primary }}>
                    <Icon className="w-4 h-4" style={{ color: notif.read ? C.textTertiary : 'white' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[0.78rem] font-bold leading-snug" style={{ color: C.textPrimary }}>{notif.title}</p>
                      {!notif.read && <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: C.primary }} />}
                    </div>
                    <p className="text-[0.7rem] leading-relaxed mt-0.5" style={{ color: C.textSecondary }}>{notif.message}</p>
                    <p className="text-[0.6rem] font-medium mt-1.5" style={{ color: C.textTertiary }}>
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
function MyProfileScreen({ user, onLogout, onBack }: { user: AppUser; onLogout: () => void; onBack: () => void }) {
  const requests: OrcamentoRequest[] = (() => { try { return JSON.parse(localStorage.getItem(`encontreai_requests_${user.id}`) || '[]'); } catch { return []; } })();
  const categoryName = CATEGORIES.find(c => c.id === user.categoryId)?.name;
  const infoItems = [
    { label: 'E-mail', value: user.email, icon: <Mail className="w-4 h-4" style={{ color: C.textTertiary }} /> },
    { label: 'Telefone', value: user.phone, icon: <Phone className="w-4 h-4" style={{ color: C.textTertiary }} /> },
    { label: 'Membro desde', value: new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), icon: <CheckCircle2 className="w-4 h-4" style={{ color: C.textTertiary }} /> },
    ...(user.role === 'professional' && categoryName ? [{ label: 'Categoria', value: categoryName, icon: <FileText className="w-4 h-4" style={{ color: C.textTertiary }} /> }] : []),
    ...(user.role === 'professional' && user.profession ? [{ label: 'Profissão', value: user.profession, icon: <Briefcase className="w-4 h-4" style={{ color: C.textTertiary }} /> }] : []),
  ];
  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="px-5 pt-12 pb-8" style={{ background: `linear-gradient(145deg, ${C.primary3}, ${C.primary2})` }}>
        <button onClick={onBack} className="mb-4 flex items-center gap-1 text-white/60 text-[0.78rem] font-semibold"><ArrowLeft className="w-4 h-4" /> Voltar</button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white" style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)' }}>
            {user.avatarInitial}
          </div>
          <div>
            <h1 className="text-lg font-black text-white">{user.name}</h1>
            <p className="text-white/55 text-[0.7rem] font-medium">{user.email}</p>
            <span className="inline-block mt-1 text-[0.55rem] px-2 py-0.5 rounded-full font-bold uppercase" style={{ background: user.role === 'professional' ? C.accent : 'rgba(255,255,255,0.2)', color: 'white' }}>
              {user.role === 'professional' ? '⭐ Profissional' : '👤 Cliente'}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-24">
        <div className="rounded-3xl overflow-hidden mb-4" style={{ background: C.card, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {infoItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: i < infoItems.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              {item.icon}
              <div className="min-w-0">
                <div className="text-[0.52rem] font-bold uppercase tracking-widest" style={{ color: C.textTertiary }}>{item.label}</div>
                <div className="text-[0.8rem] font-semibold truncate" style={{ color: C.textPrimary }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        <span className="text-[0.65rem] font-extrabold uppercase tracking-widest mb-3 block" style={{ color: C.textTertiary }}>Meus Orçamentos</span>
        {requests.length > 0 ? (
          <div className="flex flex-col gap-2 mb-4">
            {requests.map(req => (
              <div key={req.id} className="rounded-3xl p-4" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="flex items-start justify-between mb-1">
                  <span className="font-bold text-[0.8rem]" style={{ color: C.textPrimary }}>{req.professionalName}</span>
                  <span className="text-[0.55rem] px-2 py-0.5 rounded-full font-bold uppercase ml-2 shrink-0"
                    style={{ background: req.status === 'pending' ? '#FEF3C7' : '#D1FAE5', color: req.status === 'pending' ? '#B45309' : '#065F46' }}>
                    {req.status === 'pending' ? 'Aguardando' : 'Respondido'}
                  </span>
                </div>
                <p className="text-[0.68rem] mb-1" style={{ color: C.textTertiary }}>{req.profession}</p>
                <p className="text-[0.7rem] leading-relaxed" style={{ color: C.textSecondary }}>"{req.message.slice(0, 80)}{req.message.length > 80 ? '...' : ''}"</p>
                <div className="flex justify-between mt-2">
                  <p className="text-[0.6rem] font-medium" style={{ color: C.textTertiary }}>{new Date(req.createdAt).toLocaleDateString('pt-BR')}</p>
                  <p className="text-[0.6rem] font-medium" style={{ color: C.textTertiary }}>{req.contactTime}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl p-6 text-center mb-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: C.border2 }} />
            <p className="text-[0.78rem] font-semibold" style={{ color: C.textSecondary }}>Nenhum orçamento ainda</p>
            <p className="text-[0.68rem] mt-0.5" style={{ color: C.textTertiary }}>Explore profissionais e solicite seu primeiro orçamento!</p>
          </div>
        )}

        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-[0.88rem] active:scale-[0.98] transition-transform"
          style={{ border: `1.5px solid #FECACA`, color: C.error }}>
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
  open: boolean; professionalId: string | null; currentUser: AppUser | null; onClose: () => void; onSuccess: () => void;
}) {
  const [message, setMessage] = useState('');
  const [contactTime, setContactTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const professional = PROFESSIONALS.find(p => p.id === professionalId);
  useEffect(() => { if (!open) { setMessage(''); setContactTime(''); setErrors({}); } }, [open]);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!message.trim() || message.trim().length < 10) e.message = 'Descreva o serviço (mínimo 10 caracteres)';
    if (!contactTime) e.contactTime = 'Selecione um horário preferencial';
    setErrors(e); if (Object.keys(e).length > 0) return;
    setLoading(true); await new Promise(r => setTimeout(r, 700));
    if (currentUser && professional) {
      const request: OrcamentoRequest = { id: `req_${Date.now()}`, userId: currentUser.id, professionalId: professional.id, professionalName: professional.name, profession: professional.profession, message: message.trim(), contactTime, status: 'pending', createdAt: new Date().toISOString() };
      const key = `encontreai_requests_${currentUser.id}`;
      const existing: OrcamentoRequest[] = (() => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } })();
      existing.unshift(request); localStorage.setItem(key, JSON.stringify(existing));
    }
    setLoading(false); onSuccess();
  };

  const timeOptions = ['Manhã (8h–12h)', 'Tarde (12h–18h)', 'Noite (18h–21h)', 'Qualquer horário'];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[100]" style={{ background: 'rgba(26,35,50,0.6)' }} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md rounded-t-3xl z-[101] px-5 pt-5 pb-10" style={{ background: C.card, boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: C.border2 }} />
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-black text-base" style={{ color: C.textPrimary }}>Solicitar Orçamento</h2>
                {professional && <p className="text-[0.7rem] font-medium mt-0.5" style={{ color: C.textSecondary }}>{professional.name} · {professional.profession}</p>}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.bg }}>
                <X className="w-4 h-4" style={{ color: C.textSecondary }} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[0.55rem] font-extrabold uppercase tracking-widest mb-1.5 block" style={{ color: C.textTertiary }}>Descreva o serviço que precisa *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 300))} placeholder="Ex: Preciso trocar o disjuntor do quadro elétrico..." rows={4}
                  className="w-full rounded-2xl px-4 py-3 text-[0.82rem] outline-none resize-none transition-all placeholder:opacity-40"
                  style={{ background: C.bg, border: `1.5px solid ${errors.message ? C.error : C.border}`, color: C.textPrimary }} />
                <div className="flex justify-between mt-1">
                  {errors.message ? <p className="text-[0.62rem] font-semibold" style={{ color: C.error }}>{errors.message}</p> : <span />}
                  <span className="text-[0.6rem] font-medium" style={{ color: C.textTertiary }}>{message.length}/300</span>
                </div>
              </div>
              <div>
                <label className="text-[0.55rem] font-extrabold uppercase tracking-widest mb-1.5 block" style={{ color: C.textTertiary }}>Melhor horário para contato *</label>
                <div className="grid grid-cols-2 gap-2">
                  {timeOptions.map(t => (
                    <button key={t} onClick={() => setContactTime(t)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[0.7rem] font-semibold text-left transition-all"
                      style={{ background: contactTime === t ? C.primary : C.bg, color: contactTime === t ? 'white' : C.textPrimary, border: `1.5px solid ${contactTime === t ? C.primary : C.border}` }}>
                      <Clock className={`w-3.5 h-3.5 shrink-0`} style={{ color: contactTime === t ? 'white' : C.textTertiary }} />{t}
                    </button>
                  ))}
                </div>
                {errors.contactTime && <p className="text-[0.62rem] font-semibold mt-1" style={{ color: C.error }}>{errors.contactTime}</p>}
              </div>
              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-white text-[0.9rem] flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] transition-transform"
                style={{ background: `linear-gradient(135deg, ${C.primary3}, ${C.primary2})`, boxShadow: `0 6px 20px ${C.primary}40` }}>
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
function FilterModal({ open, filter, onApply, onClose }: { open: boolean; filter: { minRating: number; verifiedOnly: boolean }; onApply: (f: { minRating: number; verifiedOnly: boolean }) => void; onClose: () => void }) {
  const [local, setLocal] = useState(filter);
  useEffect(() => { if (open) setLocal(filter); }, [open, filter]);
  const ratings = [{ label: 'Qualquer avaliação', value: 0 }, { label: '4.0+ estrelas', value: 4.0 }, { label: '4.5+ estrelas', value: 4.5 }, { label: '5.0 estrelas', value: 5.0 }];
  const reset = () => { const z = { minRating: 0, verifiedOnly: false }; setLocal(z); onApply(z); };
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[100]" style={{ background: 'rgba(26,35,50,0.6)' }} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md rounded-t-3xl z-[101] px-5 pt-5 pb-10" style={{ background: C.card, boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: C.border2 }} />
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-base" style={{ color: C.textPrimary }}>Filtrar Profissionais</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.bg }}><X className="w-4 h-4" style={{ color: C.textSecondary }} /></button>
            </div>
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-[0.55rem] font-extrabold uppercase tracking-widest mb-2.5 block" style={{ color: C.textTertiary }}>Avaliação mínima</label>
                <div className="flex flex-col gap-2">
                  {ratings.map(opt => (
                    <button key={opt.value} onClick={() => setLocal(f => ({ ...f, minRating: opt.value }))}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-[0.78rem] font-semibold transition-all"
                      style={{ background: local.minRating === opt.value ? C.primary : C.bg, color: local.minRating === opt.value ? 'white' : C.textPrimary, border: `1.5px solid ${local.minRating === opt.value ? C.primary : C.border}` }}>
                      <span>{opt.label}</span>
                      {opt.value > 0 && <div className="flex gap-0.5">{Array.from({ length: Math.floor(opt.value) }).map((_, i) => <Star key={i} className={`w-3 h-3 ${local.minRating === opt.value ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`} />)}</div>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[0.55rem] font-extrabold uppercase tracking-widest mb-2.5 block" style={{ color: C.textTertiary }}>Outros filtros</label>
                <button onClick={() => setLocal(f => ({ ...f, verifiedOnly: !f.verifiedOnly }))}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-[0.78rem] font-semibold transition-all"
                  style={{ background: local.verifiedOnly ? C.primary : C.bg, color: local.verifiedOnly ? 'white' : C.textPrimary, border: `1.5px solid ${local.verifiedOnly ? C.primary : C.border}` }}>
                  <div className="flex items-center gap-2.5"><Shield className={`w-4 h-4`} style={{ color: local.verifiedOnly ? 'white' : C.textTertiary }} /><span>Apenas perfis verificados</span></div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ background: local.verifiedOnly ? 'white' : 'transparent', borderColor: local.verifiedOnly ? 'white' : C.border2 }}>
                    {local.verifiedOnly && <CheckCircle2 className="w-3 h-3" style={{ color: C.primary }} />}
                  </div>
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={reset} className="flex-1 py-3 rounded-2xl font-bold text-[0.82rem]" style={{ border: `1.5px solid ${C.border2}`, color: C.textSecondary }}>Limpar</button>
                <button onClick={() => onApply(local)} className="flex-1 py-3 rounded-2xl font-bold text-[0.82rem] text-white" style={{ background: `linear-gradient(135deg, ${C.primary3}, ${C.primary2})`, boxShadow: `0 4px 16px ${C.primary}35` }}>Aplicar</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

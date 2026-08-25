import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Star, ArrowLeft, User, MapPin, Mail, Lock,
  Bell, CheckCircle2, ChevronDown, X,
  Clock, LogOut, FileText, Loader2, Home, Briefcase,
  Menu, ArrowRight, Crosshair, Map, Calendar, Plus, CalendarCheck2, Crown, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PROFESSIONALS } from './data';
import { Professional, UserRole, AppUser, ProfService, Appointment } from './types';
import * as Icons from 'lucide-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type Screen = 'home' | 'profile' | 'auth' | 'notifications' | 'my-profile' | 'dashboard';
type AuthMode = 'login' | 'register';

/* ══════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════ */
const C = {
  primary: '#003F87', primary2: '#0056B3', primaryBg: '#D7E2FF',
  accent: '#FD8B00', accentDk: '#904D00', accentBg: '#FFDCC3',
  bg: '#F8F9FA', card: '#FFFFFF', border: '#E1E3E4', border2: '#C2C6D4',
  textPrimary: '#191C1D', textSecondary: '#424752', textTertiary: '#727784',
  success: '#006722', error: '#BA1A1A',
};

/* ══════════════════════════════════════════════
   SUPABASE AUTH CLIENT
   A chave publishable permite autenticação real
   (email/senha e Google OAuth).
   Dados ficam em localStorage até as tabelas
   do banco serem criadas.
══════════════════════════════════════════════ */
const SUPABASE_URL = 'https://pmtnvpwhjrboozsqntnp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_n_EpHmoJW_4XXEnScNmu0Q_nAtYrpG3';

let supabase: SupabaseClient | null = null;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch {
  supabase = null;
}

/* ══════════════════════════════════════════════
   LOCAL STORAGE HELPERS
══════════════════════════════════════════════ */
const LS = {
  get: <T,>(key: string, fallback: T): T => {
    try { const v = localStorage.getItem(`encontreai_${key}`); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set: (key: string, val: any) => {
    try { localStorage.setItem(`encontreai_${key}`, JSON.stringify(val)); } catch {}
  },
};

/* ══════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════ */
function useAuth() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try { const s = sessionStorage.getItem('encontreai_session'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [authLoading, setAuthLoading] = useState(false);

  // Escuta mudanças de auth do Supabase (ex: retorno do Google OAuth)
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        const existingProfile = LS.get<AppUser[]>('users', []).find(u => u.email === session.user.email);
        if (existingProfile) {
          saveSession(existingProfile);
        } else {
          // Novo usuário via Google OAuth
          const newUser: AppUser = {
            id: session.user.id,
            name: meta?.full_name || meta?.name || 'Usuário Google',
            email: session.user.email || '',
            phone: '', role: 'client' as UserRole,
            avatarInitial: (meta?.full_name || meta?.name || 'G').charAt(0).toUpperCase(),
            createdAt: new Date().toISOString(),
          };
          const users = LS.get<AppUser[]>('users', []);
          users.push(newUser);
          LS.set('users', users);
          saveSession(newUser);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const saveSession = (user: AppUser) => {
    setCurrentUser(user);
    sessionStorage.setItem('encontreai_session', JSON.stringify(user));
  };

  const register = async (data: { name: string; email: string; password: string; phone: string; role: UserRole; profession?: string; categoryId?: string; cpfCnpj?: string }): Promise<{ ok: boolean; error?: string }> => {
    setAuthLoading(true);
    // Verificar email duplicado localmente
    const users = LS.get<AppUser[]>('users', []);
    if (users.find(u => u.email === data.email)) {
      setAuthLoading(false);
      return { ok: false, error: 'Este e-mail já está cadastrado.' };
    }

    let userId = `local_${Date.now()}`;

    // Tentar criar conta no Supabase Auth
    if (supabase) {
      try {
        const { data: authData, error } = await supabase.auth.signUp({ email: data.email, password: data.password });
        if (!error && authData?.user) {
          userId = authData.user.id;
        }
        // Se der erro no Supabase, continua com ID local (sem quebrar)
      } catch {}
    }

    const newUser: AppUser = {
      id: userId, name: data.name, email: data.email, phone: data.phone,
      role: data.role, avatarInitial: data.name.charAt(0).toUpperCase(),
      profession: data.profession, categoryId: data.categoryId,
      cpfCnpj: data.cpfCnpj, password: data.password,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    LS.set('users', users);
    saveSession(newUser);
    setAuthLoading(false);
    return { ok: true };
  };

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    setAuthLoading(true);

    // Tentar Supabase Auth primeiro
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
          // Login no Supabase OK. Busca perfil local
          const user = LS.get<AppUser[]>('users', []).find(u => u.email === email);
          if (user) { saveSession(user); setAuthLoading(false); return { ok: true }; }
        }
      } catch {}
    }

    // Fallback local
    const user = LS.get<AppUser[]>('users', []).find(u => u.email === email && u.password === password);
    if (!user) { setAuthLoading(false); return { ok: false, error: 'E-mail ou senha incorretos.' }; }
    saveSession(user);
    setAuthLoading(false);
    return { ok: true };
  };

  const loginWithGoogle = async () => {
    setAuthLoading(true);
    if (supabase) {
      try {
        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
        // O redirect acontece, então o onAuthStateChange cuida do resto
        return;
      } catch {}
    }
    // Fallback simulado
    const u: AppUser = { id: `g_${Date.now()}`, name: 'Usuário Google', email: 'google@user.com', phone: '', role: 'client', avatarInitial: 'G', createdAt: new Date().toISOString() };
    const users = LS.get<AppUser[]>('users', []); users.push(u); LS.set('users', users);
    saveSession(u);
    setAuthLoading(false);
  };

  const logout = async () => {
    if (supabase) { try { await supabase.auth.signOut(); } catch {} }
    sessionStorage.removeItem('encontreai_session');
    setCurrentUser(null);
  };

  return { currentUser, authLoading, register, login, logout, loginWithGoogle };
}

function useServices(professionalId: string | undefined) {
  const [services, setServices] = useState<ProfService[]>([]);
  useEffect(() => {
    if (!professionalId) return;
    const all = LS.get<ProfService[]>('services', []);
    setServices(all.filter(s => s.professionalId === professionalId));
  }, [professionalId]);

  const addService = (title: string, price: number) => {
    if (!professionalId) return;
    const newS: ProfService = { id: `s_${Date.now()}`, professionalId, title, price };
    const all = LS.get<ProfService[]>('services', []); all.push(newS);
    LS.set('services', all); setServices(prev => [...prev, newS]);
  };

  const removeService = (id: string) => {
    const all = LS.get<ProfService[]>('services', []).filter(s => s.id !== id);
    LS.set('services', all); setServices(prev => prev.filter(s => s.id !== id));
  };

  return { services, addService, removeService };
}

function useAppointments(userId: string | undefined, role: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const load = useCallback(() => {
    if (!userId || !role) return;
    const all = LS.get<Appointment[]>('appointments', []);
    setAppointments(all.filter(a => role === 'professional' ? a.professionalId === userId : a.clientId === userId).reverse());
  }, [userId, role]);

  useEffect(() => { load(); }, [load]);

  const addAppointment = (apt: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newApt: Appointment = { ...apt, id: `apt_${Date.now()}`, createdAt: new Date().toISOString() };
    const all = LS.get<Appointment[]>('appointments', []); all.push(newApt);
    LS.set('appointments', all); load();
  };

  const cancelAppointment = (id: string) => {
    const all = LS.get<Appointment[]>('appointments', []);
    const idx = all.findIndex(a => a.id === id);
    if (idx > -1) { all[idx].status = 'cancelled'; LS.set('appointments', all); load(); }
  };
  return { appointments, addAppointment, cancelAppointment };
}

function useLocationManager() {
  const [location, setLocation] = useState(() => sessionStorage.getItem('encontreai_location') || 'São Paulo, SP');
  const [cities, setCities] = useState<string[]>([]);
  useEffect(() => {
    const cached = sessionStorage.getItem('ibge_cities_v3');
    if (cached) { setCities(JSON.parse(cached)); return; }
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios')
      .then(r => r.json())
      .then(data => {
        const list = data.map((c: any) => {
          const uf = c?.microrregiao?.mesorregiao?.UF?.sigla;
          return uf ? `${c.nome}, ${uf}` : c.nome;
        });
        setCities(list); sessionStorage.setItem('ibge_cities_v3', JSON.stringify(list));
      }).catch(() => {});
  }, []);
  const updateLocation = (loc: string) => { setLocation(loc); sessionStorage.setItem('encontreai_location', loc); };
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
            updateLocation(`${city}, ${stateCode}`); resolve(true);
          } catch { resolve(false); }
        }, () => resolve(false), { timeout: 8000, maximumAge: 300000 }
      );
    });
  };
  return { location, updateLocation, autoDetect, cities };
}

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type }); timerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, showToast };
}

/* ══════════════════════════════════════════════
   UI COMPONENTS
══════════════════════════════════════════════ */
function Toast({ toast }: any) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, y: 80, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 80, scale: 0.92 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-5 py-3.5 rounded-2xl shadow-xl max-w-[85%] text-sm font-semibold text-white flex items-center gap-2.5"
          style={{ background: toast.type === 'error' ? C.error : toast.type === 'info' ? C.primary : '#1a1a1a' }}>
          <span>{toast.msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Sidebar({ open, onClose, user, onNavigate, onLogout }: any) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-[110]" />
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed top-0 left-0 w-72 h-full bg-white z-[120] shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #003F87 0%, #0056B3 100%)' }}>
               {user ? (
                 <>
                   <div className="w-14 h-14 rounded-full font-bold flex items-center justify-center text-xl mb-3 shadow-lg bg-white/20 text-white border-2 border-white/30">{user.avatarInitial}</div>
                   <h3 className="font-bold text-white text-lg line-clamp-1">{user.name}</h3>
                   <p className="text-[12px] text-blue-200 font-medium mt-1">{user.email}</p>
                   <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">{user.role === 'professional' ? '⭐ Profissional' : 'Cliente'}</span>
                 </>
               ) : (
                 <>
                   <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-3 border-2 border-white/30"><User className="text-white w-7 h-7" /></div>
                   <h3 className="font-bold text-white text-lg">Visitante</h3>
                   <p className="text-[12px] text-blue-200 font-medium mt-1">Faça login para continuar</p>
                 </>
               )}
            </div>
            <div className="flex-1 p-4 flex flex-col gap-1">
              <button onClick={() => { onNavigate('home'); onClose(); }} className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-gray-50 text-gray-700 font-semibold active:bg-gray-100 transition-colors"><Home className="w-5 h-5 text-gray-400"/> Início</button>
              <button onClick={() => { onNavigate(user ? 'my-profile' : 'auth'); onClose(); }} className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-gray-50 text-gray-700 font-semibold active:bg-gray-100 transition-colors"><FileText className="w-5 h-5 text-gray-400"/> {user ? 'Meus Pedidos' : 'Entrar / Criar Conta'}</button>
              {user?.role === 'professional' && (
                <button onClick={() => { onNavigate('dashboard'); onClose(); }} className="flex items-center gap-3 p-3.5 rounded-xl mt-3 font-semibold active:scale-[0.98] transition-all border-2" style={{ background: '#FFF7ED', borderColor: '#FD8B00', color: '#904D00' }}><Crown className="w-5 h-5 text-orange-500"/> Painel Premium</button>
              )}
            </div>
            {user && (
              <div className="p-4 border-t border-gray-100">
                <button onClick={() => { onLogout(); onClose(); }} className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-red-50 text-red-600 font-semibold w-full transition-colors active:bg-red-100"><LogOut className="w-5 h-5"/> Sair da Conta</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function LocationModal({ open, onClose, updateLocation, autoDetect, cities }: any) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = query.trim().length >= 2 ? cities.filter((c: string) => norm(c).includes(norm(query))).slice(0, 50) : [];
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
              <button onClick={async () => { setLoading(true); const ok = await autoDetect(); setLoading(false); if (ok) onClose(); }} className="w-full flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl font-bold mb-4 active:scale-[0.98] transition-all border border-blue-100">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
                {loading ? 'Detectando localização...' : 'Usar minha localização atual'}
              </button>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input autoFocus placeholder="Digite o nome da cidade..." value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-white border border-gray-200 shadow-sm rounded-xl py-3.5 pl-12 pr-4 text-gray-900 font-medium focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-xl border border-gray-200">
                {query.length >= 2 ? (
                  filtered.length > 0 ? (
                    <div className="flex flex-col">{filtered.map((city: string) => (
                      <button key={city} onClick={() => { updateLocation(city); onClose(); }} className="flex items-center gap-3 py-4 px-4 border-b border-gray-100 text-left active:bg-gray-50 last:border-0">
                        <MapPin className="w-5 h-5 text-gray-400 shrink-0" /><span className="font-semibold text-gray-800">{city}</span>
                      </button>
                    ))}</div>
                  ) : <div className="text-center py-10 text-gray-500 font-medium">Nenhuma cidade encontrada.</div>
                ) : (
                  <div className="text-center py-10 text-gray-400 flex flex-col items-center"><Map className="w-10 h-10 mb-3 opacity-20" /><p className="font-medium text-sm">Digite pelo menos 2 letras</p></div>
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
   MAIN APP
══════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [showLocation, setShowLocation] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { currentUser, authLoading, register, login, logout, loginWithGoogle } = useAuth();
  const { location, updateLocation, autoDetect, cities } = useLocationManager();
  const { toast, showToast } = useToast();

  const goTo = (s: Screen, profId?: string) => { if (profId) setSelectedProfId(profId); setScreen(s); window.scrollTo(0, 0); };
  const selectedProf = PROFESSIONALS.find(p => p.id === selectedProfId);

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto min-h-screen relative flex flex-col bg-white shadow-2xl overflow-hidden">

        {screen !== 'auth' && (
          <header className="bg-white flex justify-between items-center px-4 h-16 sticky top-0 z-40 border-b border-gray-100">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-500 active:scale-95 transition-transform"><Menu className="w-6 h-6" /></button>
            <div className="font-black text-xl tracking-tight cursor-pointer" style={{ color: C.primary }} onClick={() => goTo('home')}>encontreai</div>
            <button onClick={() => currentUser ? goTo('my-profile') : goTo('auth')} className="p-2 -mr-2 text-gray-500 relative active:scale-95 transition-transform"><Bell className="w-6 h-6" /></button>
          </header>
        )}

        <div className="flex-1 pb-20">
          <AnimatePresence mode="wait">
            {screen === 'home' && <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><HomeScreen onNavigate={goTo} location={location} onOpenLocation={() => setShowLocation(true)} /></motion.div>}
            {screen === 'profile' && selectedProf && <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.18 }}><ProfileScreen professional={selectedProf} onBack={() => goTo('home')} currentUser={currentUser} onLoginRequired={() => goTo('auth')} showToast={showToast} /></motion.div>}
            {screen === 'auth' && <motion.div key="auth" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.18 }}><AuthScreen onSuccess={() => goTo('home')} register={register} login={login} loginWithGoogle={loginWithGoogle} showToast={showToast} authLoading={authLoading} goTo={goTo} /></motion.div>}
            {screen === 'my-profile' && currentUser && <motion.div key="my-profile" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.18 }}><ClientOrdersScreen user={currentUser} showToast={showToast} /></motion.div>}
            {screen === 'dashboard' && currentUser?.role === 'professional' && <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.18 }}><DashboardScreen user={currentUser} showToast={showToast} /></motion.div>}
          </AnimatePresence>
        </div>

        {screen !== 'auth' && (
          <div className="fixed bottom-0 w-full max-w-md mx-auto bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.05)] rounded-t-2xl z-50 flex justify-around items-center px-4 py-2 pb-safe border-t border-gray-100">
            <button onClick={() => goTo('home')} className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-colors ${screen==='home'?'text-white':'text-gray-500'}`} style={screen==='home'?{background:C.accent}:{}}><Home className="w-[22px] h-[22px] mb-0.5" /><span className="text-[10px] font-bold">Home</span></button>
            <button onClick={() => currentUser ? goTo('my-profile') : goTo('auth')} className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-colors ${screen==='my-profile'?'text-white':'text-gray-500'}`} style={screen==='my-profile'?{background:C.accent}:{}}><CalendarCheck2 className="w-[22px] h-[22px] mb-0.5" /><span className="text-[10px] font-bold">Pedidos</span></button>
            <button onClick={() => currentUser?.role === 'professional' ? goTo('dashboard') : goTo('auth')} className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-colors ${screen==='dashboard'?'text-white':'text-gray-500'}`} style={screen==='dashboard'?{background:C.accent}:{}}><Briefcase className="w-[22px] h-[22px] mb-0.5" /><span className="text-[10px] font-bold">Painel</span></button>
          </div>
        )}

        <LocationModal open={showLocation} onClose={() => setShowLocation(false)} updateLocation={updateLocation} autoDetect={autoDetect} cities={cities} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={currentUser} onNavigate={goTo} onLogout={() => { logout(); goTo('home'); showToast('Desconectado com sucesso', 'info'); }} />
        <Toast toast={toast} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   HOME SCREEN
══════════════════════════════════════════════ */
function HomeScreen({ onNavigate, location, onOpenLocation }: any) {
  const [search, setSearch] = useState(''); const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const filtered = PROFESSIONALS.filter(p => {
    if (!p.activeSubscription) return false;
    if (activeCategory && p.categoryId !== activeCategory && p.profession !== activeCategory) return false;
    if (search) { const q = search.toLowerCase(); if (!p.name.toLowerCase().includes(q) && !p.profession.toLowerCase().includes(q)) return false; }
    return true;
  });
  const catColors = [{ bg: C.primaryBg, text: C.primary }, { bg: C.accentBg, text: C.accentDk }, { bg: '#D4EDDA', text: '#155724' }, { bg: '#E1E3E4', text: '#191C1D' }, { bg: '#FFDAD6', text: '#93000A' }];

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="px-4 py-3 bg-white flex items-center justify-between border-b border-gray-100 cursor-pointer active:bg-gray-50 transition-colors" onClick={onOpenLocation}>
        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50"><MapPin className="w-4 h-4" style={{ color: C.primary }} /></div><div className="flex flex-col"><span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Localização</span><span className="text-[13px] font-bold text-gray-900">{location}</span></div></div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
      <div className="px-4 mt-5">
        <div className="relative flex items-center h-12 bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden group focus-within:border-blue-400 transition-colors">
          <Search className="w-5 h-5 text-gray-400 ml-4 mr-2 shrink-0 group-focus-within:text-blue-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="flex-1 h-full outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 bg-transparent" placeholder="Buscar serviços ou profissionais..." />
          <button className="h-full px-5 font-bold text-sm transition-transform active:scale-95 text-white" style={{ background: C.accent }}>Buscar</button>
        </div>
      </div>
      <div className="mt-7">
        <h2 className="px-4 text-lg font-bold text-gray-900 mb-4">Categorias</h2>
        <div className="flex overflow-x-auto gap-4 px-4 pb-2 hide-scrollbar">
          {CATEGORIES.map((cat, i) => {
            const Icon = (Icons as any)[cat.icon] || Icons.HelpCircle;
            const col = catColors[i % catColors.length];
            const isActive = activeCategory === cat.name;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(isActive ? null : cat.name)} className="flex flex-col items-center gap-2 min-w-[76px] group">
                <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-sm transition-transform group-active:scale-95 border-2" style={{ background: col.bg, color: col.text, borderColor: isActive ? col.text : 'transparent' }}><Icon className="w-7 h-7" /></div>
                <span className={`text-[11px] font-bold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-7 mb-4">
        <div className="px-4 flex justify-between items-end mb-4"><h2 className="text-lg font-bold text-gray-900">{activeCategory || 'Destaques'}</h2></div>
        <div className="flex overflow-x-auto gap-4 px-4 pb-8 hide-scrollbar snap-x">
           {filtered.length > 0 ? filtered.map(pro => (
              <div key={pro.id} onClick={() => onNavigate('profile', pro.id)} className="min-w-[300px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4 relative snap-start cursor-pointer hover:shadow-md transition-shadow">
                 {pro.verified && <div className="absolute top-4 right-4 text-white rounded-full p-1 z-10 shadow-sm" style={{ background: C.primary }}><CheckCircle2 className="w-3.5 h-3.5" /></div>}
                 <div className="flex gap-4">
                    <img src={pro.avatarUrl} className="w-24 h-24 rounded-xl object-cover bg-gray-100 shadow-sm" alt={pro.name} />
                    <div className="flex flex-col justify-center min-w-0">
                       <h3 className="font-bold text-gray-900 line-clamp-1 text-[15px]">{pro.name}</h3>
                       <p className="text-[12px] text-gray-500 mb-1.5">{pro.profession}</p>
                       <div className="flex items-center gap-1.5 mb-2"><Star className="w-4 h-4 fill-amber-500 text-amber-500" /><span className="text-[13px] font-bold text-gray-900">{pro.rating.toFixed(1)}</span><span className="text-[11px] text-gray-400 font-medium">({pro.reviewsCount})</span></div>
                    </div>
                 </div>
              </div>
           )) : <div className="w-full text-center py-10 text-gray-500 bg-white rounded-2xl border border-gray-100 mx-4 font-medium">Nenhum profissional encontrado.</div>}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   AUTH SCREEN (REGISTRO E LOGIN COMPLETO)
══════════════════════════════════════════════ */
function AuthInput({ label, type, value, onChange, placeholder, icon, error, required }: any) {
  return (
    <div>
      <label className="block text-[13px] font-bold text-gray-900 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">{icon}</span>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-white border rounded-xl py-3.5 pl-12 pr-4 text-gray-900 font-medium focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400" style={{ borderColor: error ? C.error : C.border2, outlineColor: C.primary }} />
      </div>
      {error && <p className="text-[11px] font-bold mt-1.5 text-red-600">{error}</p>}
    </div>
  );
}

function AuthScreen({ onSuccess, register, login, loginWithGoogle, showToast, authLoading, goTo }: any) {
  const [mode, setMode] = useState<AuthMode>('register');
  const [role, setRole] = useState<UserRole>('client');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Campos do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pwd, setPwd] = useState('');
  const [profession, setProfession] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === 'register') {
      if (!name.trim()) e.name = 'Nome é obrigatório';
      if (!phone.trim()) e.phone = 'Telefone é obrigatório';
      if (role === 'professional' && !profession.trim()) e.profession = 'Informe sua profissão';
      if (role === 'professional' && !cpfCnpj.trim()) e.cpfCnpj = 'CPF/CNPJ é obrigatório';
    }
    if (!email.trim() || !email.includes('@')) e.email = 'E-mail inválido';
    if (!pwd || pwd.length < 6) e.pwd = 'Mínimo 6 caracteres';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (mode === 'login') {
      const res = await login(email, pwd);
      if (res.ok) { showToast('Login realizado!'); onSuccess(); } else setErrors({ pwd: res.error || 'Credenciais inválidas' });
    } else {
      const res = await register({ name, email, password: pwd, phone, role, profession: role === 'professional' ? profession : undefined, categoryId: selectedCategory || undefined, cpfCnpj: role === 'professional' ? cpfCnpj : undefined });
      if (res.ok) { showToast('Conta criada com sucesso! 🎉'); onSuccess(); } else setErrors({ email: res.error || 'Erro ao cadastrar' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-start px-4 py-6 pb-16 overflow-y-auto">
      <button onClick={() => goTo('home')} className="self-start mb-4 p-2 -ml-2 rounded-full hover:bg-gray-200 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="text-center mb-6"><h1 className="text-3xl font-black tracking-tight" style={{ color: C.primary }}>encontreai</h1><p className="text-sm font-medium text-gray-500 mt-1">{mode === 'register' ? 'Crie sua conta gratuita' : 'Acesse sua conta'}</p></div>

        {/* Google Auth */}
        <button type="button" onClick={loginWithGoogle} disabled={authLoading} className="w-full h-12 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold flex items-center justify-center gap-3 active:bg-gray-50 transition-colors mb-5 shadow-sm hover:shadow-md">
          <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuar com o Google
        </button>
        <div className="relative flex items-center py-1 mb-5"><div className="flex-grow border-t border-gray-200"></div><span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">ou</span><div className="flex-grow border-t border-gray-200"></div></div>

        {/* Tipo de conta (só no registro) */}
        {mode === 'register' && (
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
            <button type="button" onClick={() => setRole('client')} className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg transition-all ${role === 'client' ? 'text-white shadow-sm' : 'text-gray-500'}`} style={role === 'client' ? { background: C.primary } : {}}>👤 Quero Contratar</button>
            <button type="button" onClick={() => setRole('professional')} className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg transition-all ${role === 'professional' ? 'text-white shadow-sm' : 'text-gray-500'}`} style={role === 'professional' ? { background: C.accent } : {}}>⭐ Sou Profissional</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <>
              <AuthInput label="Nome Completo" type="text" value={name} onChange={setName} placeholder="Seu nome completo" icon={<User className="w-5 h-5"/>} error={errors.name} required />
              <AuthInput label="Telefone / WhatsApp" type="tel" value={phone} onChange={setPhone} placeholder="(11) 99999-9999" icon={<Phone className="w-5 h-5"/>} error={errors.phone} required />
            </>
          )}
          <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" icon={<Mail className="w-5 h-5"/>} error={errors.email} required />
          <AuthInput label="Senha" type="password" value={pwd} onChange={setPwd} placeholder="Mínimo 6 caracteres" icon={<Lock className="w-5 h-5"/>} error={errors.pwd} required />

          {/* Campos extras para Profissional */}
          {mode === 'register' && role === 'professional' && (
            <>
              <div className="border-t border-gray-100 pt-4 mt-1">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Crown className="w-4 h-4"/> Dados Profissionais</p>
              </div>
              <AuthInput label="Profissão" type="text" value={profession} onChange={setProfession} placeholder="Ex: Barbeiro, Eletricista..." icon={<Briefcase className="w-5 h-5"/>} error={errors.profession} required />
              <AuthInput label="CPF ou CNPJ" type="text" value={cpfCnpj} onChange={setCpfCnpj} placeholder="000.000.000-00" icon={<FileText className="w-5 h-5"/>} error={errors.cpfCnpj} required />
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-1.5">Categoria</label>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl py-3.5 px-4 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none">
                  <option value="">Selecione uma categoria</option>
                  {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </>
          )}

          <button type="submit" disabled={authLoading} className="w-full h-12 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98] mt-2 shadow-md" style={{ background: mode === 'register' && role === 'professional' ? C.accent : C.primary }}>
            {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'register' ? (role === 'professional' ? 'Criar Conta Profissional' : 'Criar Conta') : 'Entrar')} {!authLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-6 text-center"><p className="text-sm font-medium text-gray-500">{mode === 'register' ? 'Já tem uma conta?' : 'Não tem conta?'} <button type="button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setErrors({}); }} className="font-bold hover:underline" style={{ color: C.primary }}>{mode === 'register' ? 'Faça login' : 'Criar agora'}</button></p></div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PROFILE & BOOKING
══════════════════════════════════════════════ */
function ProfileScreen({ professional, onBack, currentUser, onLoginRequired, showToast }: any) {
  const { services } = useServices(professional.id);
  const { addAppointment } = useAppointments(currentUser?.id, currentUser?.role);
  const [bookingService, setBookingService] = useState<ProfService | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="h-48 relative bg-gray-200">
        <img src={professional.coverUrl} className="w-full h-full object-cover" alt="Capa" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
        <button onClick={onBack} className="absolute top-6 left-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-sm"><ArrowLeft className="w-5 h-5 text-gray-900" /></button>
      </div>
      <div className="mx-4 -mt-12 relative bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex gap-4 items-end mb-4">
          <img src={professional.avatarUrl} className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-sm bg-gray-100" alt={professional.name} />
          <div className="pb-1 flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-1.5 line-clamp-1">{professional.name}{professional.verified && <CheckCircle2 className="w-5 h-5" style={{ color: C.primary }} />}</h1>
            <p className="text-sm font-medium text-gray-500">{professional.profession}</p>
            <div className="flex items-center gap-1.5 mt-1"><Star className="w-4 h-4 fill-amber-500 text-amber-500" /><span className="text-sm font-bold">{professional.rating.toFixed(1)}</span><span className="text-xs text-gray-400">({professional.reviewsCount} avaliações)</span></div>
          </div>
        </div>
      </div>
      <div className="mx-4 mt-5">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Sobre</h2>
        <p className="text-sm text-gray-600 leading-relaxed bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">{professional.description}</p>
      </div>
      <div className="mx-4 mt-5 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Serviços e Preços</h2>
        <div className="flex flex-col gap-3">
          {services.map(s => (
            <div key={s.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
               <div><h4 className="font-bold text-gray-900 text-sm">{s.title}</h4><p className="font-black mt-1" style={{ color: C.primary }}>R$ {s.price.toFixed(2)}</p></div>
               <button onClick={() => { if (!currentUser) { showToast('Faça login para agendar', 'info'); onLoginRequired(); return; } setBookingService(s); }} className="px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-sm active:scale-95 transition-transform" style={{ background: C.accent }}>Agendar</button>
            </div>
          ))}
          {services.length === 0 && <p className="text-sm text-gray-500 p-4 text-center border border-gray-200 rounded-xl border-dashed">Nenhum serviço cadastrado ainda.</p>}
        </div>
      </div>

      <AnimatePresence>
        {bookingService && (
          <BookingModal service={bookingService} professional={professional} onClose={() => setBookingService(null)}
            onBook={async (date: string, time: string) => {
              addAppointment({ professionalId: professional.id, clientId: currentUser.id, serviceId: bookingService.id, serviceTitle: bookingService.title, price: bookingService.price, date, time, status: 'approved', clientName: currentUser.name, professionalName: professional.name });
              setBookingService(null); showToast('Agendamento confirmado! ✅');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BookingModal({ onClose, service, professional, onBook }: any) {
  const [date, setDate] = useState(''); const [time, setTime] = useState('');
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[100]" />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl z-[101] p-6 shadow-2xl">
        <h2 className="font-bold text-xl text-gray-900 mb-1">Agendar Serviço</h2>
        <p className="text-sm text-gray-500 mb-5">Confirmação imediata após o agendamento.</p>
        <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100 flex justify-between items-center">
          <div><p className="font-bold text-gray-900">{service.title}</p><p className="text-xs text-gray-500 mt-0.5">{professional.name}</p></div>
          <span className="font-black text-lg" style={{ color: C.primary }}>R$ {service.price.toFixed(2)}</span>
        </div>
        <div className="flex flex-col gap-4 mb-6">
          <div><label className="block text-[13px] font-bold text-gray-900 mb-1.5">Data</label><input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full border border-gray-300 rounded-xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-blue-600" /></div>
          <div><label className="block text-[13px] font-bold text-gray-900 mb-1.5">Horário</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full border border-gray-300 rounded-xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-blue-600" /></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">Cancelar</button>
          <button onClick={() => onBook(date, time)} disabled={!date || !time} className="flex-1 py-3.5 rounded-xl font-bold text-white disabled:opacity-50 active:scale-95 transition-all" style={{ background: C.primary }}>Confirmar</button>
        </div>
      </motion.div>
    </>
  );
}

/* ══════════════════════════════════════════════
   PEDIDOS DO CLIENTE
══════════════════════════════════════════════ */
function ClientOrdersScreen({ user, showToast }: any) {
  const { appointments, cancelAppointment } = useAppointments(user.id, user.role);
  const canCancel = (createdAt: string) => (Date.now() - new Date(createdAt).getTime()) < 48 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-6 pb-20">
      <h1 className="text-2xl font-black mb-6" style={{ color: C.primary }}>Meus Pedidos</h1>
      {appointments.length === 0 ? (
        <div className="text-center py-16">
          <CalendarCheck2 className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">Nenhum pedido ainda.</p>
          <p className="text-gray-400 text-sm mt-1">Explore profissionais e agende serviços!</p>
        </div>
      ) :
        appointments.map(a => (
          <div key={a.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
            <div className="flex justify-between items-start mb-3">
              <div><h3 className="font-bold text-gray-900">{a.serviceTitle}</h3><p className="text-xs text-gray-500 font-medium mt-0.5">{a.professionalName}</p></div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${a.status==='approved'?'bg-green-100 text-green-700':a.status==='cancelled'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{a.status === 'approved' ? 'Confirmado' : a.status === 'cancelled' ? 'Cancelado' : 'Pendente'}</span>
            </div>
            <div className="flex gap-4 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="flex items-center gap-1.5 font-medium"><Calendar className="w-4 h-4 text-gray-400"/> {new Date(a.date).toLocaleDateString('pt-BR')}</div>
              <div className="flex items-center gap-1.5 font-medium"><Clock className="w-4 h-4 text-gray-400"/> {a.time}</div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-black text-lg" style={{ color: C.primary }}>R$ {a.price.toFixed(2)}</span>
              {a.status === 'approved' && canCancel(a.createdAt) && <button onClick={() => { cancelAppointment(a.id); showToast('Cancelado com sucesso'); }} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">Cancelar</button>}
            </div>
          </div>
        ))
      }
    </div>
  );
}

/* ══════════════════════════════════════════════
   PAINEL PREMIUM (PROFISSIONAL)
══════════════════════════════════════════════ */
function DashboardScreen({ user, showToast }: any) {
  const [tab, setTab] = useState<'services'|'agenda'>('services');
  const { services, addService, removeService } = useServices(user.id);
  const { appointments } = useAppointments(user.id, user.role);
  const [newTitle, setNewTitle] = useState(''); const [newPrice, setNewPrice] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault(); if (!newTitle.trim() || !newPrice) { showToast('Preencha todos os campos', 'error'); return; }
    addService(newTitle.trim(), Number(newPrice));
    setNewTitle(''); setNewPrice(''); showToast('Serviço criado! 🎉');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4 pt-6">
      <div className="rounded-2xl p-5 mb-6 text-white shadow-lg relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FD8B00 0%, #E67700 100%)' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2"><Crown className="w-6 h-6 text-yellow-200" /><h2 className="font-black text-xl">Painel Premium</h2></div>
          <p className="text-sm text-orange-100 font-medium">Gerencie seus serviços e agenda virtual.</p>
        </div>
        <Crown className="absolute -bottom-4 -right-2 w-28 h-28 text-orange-400 opacity-20" />
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button onClick={() => setTab('services')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${tab==='services'?'bg-white text-gray-900 shadow-sm':'text-gray-500'}`}>Meus Serviços</button>
        <button onClick={() => setTab('agenda')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${tab==='agenda'?'bg-white text-gray-900 shadow-sm':'text-gray-500'}`}>Agenda Virtual</button>
      </div>

      {tab === 'services' && (
        <div>
          <form onSubmit={handleAdd} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
             <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Plus className="w-5 h-5" style={{ color: C.accent }}/> Criar Novo Serviço</h3>
             <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Nome do serviço (Ex: Corte de Cabelo)" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 mb-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
             <input type="number" step="0.01" min="0" value={newPrice} onChange={e=>setNewPrice(e.target.value)} placeholder="Valor em R$ (Ex: 30.00)" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 mb-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
             <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-white shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform" style={{ background: C.primary }}><Plus className="w-5 h-5"/> Adicionar Serviço</button>
          </form>
          {services.length > 0 && <h3 className="font-bold text-gray-900 mb-3">Serviços Cadastrados ({services.length})</h3>}
          <div className="flex flex-col gap-3">
            {services.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div><span className="font-bold text-gray-900 text-sm">{s.title}</span><p className="font-black text-sm mt-0.5" style={{ color: C.primary }}>R$ {s.price.toFixed(2)}</p></div>
                <button onClick={() => { removeService(s.id); showToast('Serviço removido'); }} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"><X className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'agenda' && (
        <div>
          {appointments.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <p className="text-gray-500 font-medium">Nenhum agendamento ainda.</p>
              <p className="text-gray-400 text-sm mt-1">Seus clientes aparecerão aqui.</p>
            </div>
          ) :
            appointments.map(a => (
              <div key={a.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4 border-l-4" style={{ borderLeftColor: a.status==='cancelled' ? C.error : C.accent }}>
                 <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-gray-900">{a.serviceTitle}</h3><span className="font-black text-sm" style={{ color: C.primary }}>R$ {a.price.toFixed(2)}</span></div>
                 <p className="text-xs text-gray-500 font-medium mb-3">Cliente: <span className="text-gray-900 font-bold">{a.clientName}</span></p>
                 <div className="flex gap-4 text-sm text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                   <div className="flex items-center gap-1.5 font-medium"><Calendar className="w-4 h-4 text-gray-400"/> {new Date(a.date).toLocaleDateString('pt-BR')}</div>
                   <div className="flex items-center gap-1.5 font-medium"><Clock className="w-4 h-4 text-gray-400"/> {a.time}</div>
                 </div>
                 {a.status === 'cancelled' && <div className="mt-3 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg text-center">Cancelado pelo cliente</div>}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

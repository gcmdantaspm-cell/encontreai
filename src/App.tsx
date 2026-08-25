import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Star, ArrowLeft, User, MapPin, Mail, Lock,
  Bell, CheckCircle2, ChevronDown, X,
  Clock, LogOut, FileText, Eye, EyeOff, Loader2, Home, Briefcase, 
  Menu, ArrowRight, Crosshair, Map, Calendar, Plus, CalendarCheck2, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PROFESSIONALS } from './data';
import { Professional, UserRole, AppUser, ProfService, Appointment } from './types';
import * as Icons from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

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
   SUPABASE SETUP
══════════════════════════════════════════════ */
const supabaseUrl = 'https://pmtnvpwhjrboozsqntnp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_n_EpHmoJW_4XXEnScNmu0Q_nAtYrpG3';
// Se a chave existir, ativa o Supabase de verdade. Se não, usa modo local pra não quebrar o app.
export const supabase = supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const mapDbToUser = (db: any): AppUser => ({
  id: db.id, name: db.name, email: db.email, phone: db.phone || '', role: db.role,
  avatarInitial: db.avatar_initial, profession: db.profession, categoryId: db.category_id,
  cpfCnpj: db.cpf_cnpj, createdAt: db.created_at
});
const mapDbToService = (db: any): ProfService => ({ id: db.id, professionalId: db.professional_id, title: db.title, price: db.price });
const mapDbToAppointment = (db: any): Appointment => ({
  id: db.id, professionalId: db.professional_id, clientId: db.client_id, serviceId: db.service_id,
  serviceTitle: db.service_title, price: db.price, date: db.date, time: db.time, status: db.status,
  clientName: db.client_name, professionalName: db.professional_name, createdAt: db.created_at
});

/* ══════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════ */
function useAuth() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try { const s = sessionStorage.getItem('encontreai_session'); return s ? JSON.parse(s) : null; } catch { return null; }
  });

  useEffect(() => {
    if (!supabase) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchUserProfile(session.user.id, session.user.user_metadata);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
         fetchUserProfile(session.user.id, session.user.user_metadata);
      } else {
        setCurrentUser(null);
        sessionStorage.removeItem('encontreai_session');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string, metadata: any) => {
    const { data } = await supabase!.from('users').select('*').eq('id', userId).single();
    if (data) {
      const u = mapDbToUser(data);
      setCurrentUser(u); sessionStorage.setItem('encontreai_session', JSON.stringify(u));
    } else if (metadata) { // Novo login via Google
       const newUser = {
         id: userId, name: metadata.full_name || 'Usuário Google', email: metadata.email,
         role: 'client', avatar_initial: (metadata.full_name || 'G').charAt(0).toUpperCase(),
       };
       await supabase!.from('users').insert([newUser]);
       const u = mapDbToUser(newUser);
       setCurrentUser(u); sessionStorage.setItem('encontreai_session', JSON.stringify(u));
    }
  };

  const register = async (data: any) => {
    if (supabase) {
      const { data: authData, error } = await supabase.auth.signUp({ email: data.email, password: data.password });
      if (error) return { ok: false, error: error.message };
      if (authData.user) {
         const dbUser = { id: authData.user.id, name: data.name, email: data.email, role: data.role, avatar_initial: data.name.charAt(0).toUpperCase() };
         await supabase.from('users').insert([dbUser]);
         return { ok: true, user: mapDbToUser(dbUser) };
      }
      return { ok: false, error: 'Erro ao cadastrar' };
    } else {
      // Local Mock Fallback
      const users = JSON.parse(localStorage.getItem('encontreai_users') || '[]');
      if (users.find((u:any) => u.email === data.email)) return { ok: false, error: 'E-mail já cadastrado.' };
      const newUser = { id: `u_${Date.now()}`, avatarInitial: data.name.charAt(0).toUpperCase(), createdAt: new Date().toISOString(), ...data };
      users.push(newUser); localStorage.setItem('encontreai_users', JSON.stringify(users));
      sessionStorage.setItem('encontreai_session', JSON.stringify(newUser)); setCurrentUser(newUser);
      return { ok: true, user: newUser };
    }
  };

  const login = async (email: string, password?: string) => {
    if (supabase && password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } else {
      // Local Mock Fallback
      const user = JSON.parse(localStorage.getItem('encontreai_users') || '[]').find((u:any) => u.email === email && u.password === password);
      if (!user) return { ok: false, error: 'Credenciais inválidas.' };
      sessionStorage.setItem('encontreai_session', JSON.stringify(user)); setCurrentUser(user);
      return { ok: true };
    }
  };

  const loginWithGoogle = async () => {
    if (supabase) {
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    } else {
      // Local Mock Fallback
      const u = { id: `u_g_${Date.now()}`, name: 'Usuário Google', email: 'usuario@gmail.com', phone:'', role: 'client', avatarInitial: 'G', createdAt: new Date().toISOString() };
      sessionStorage.setItem('encontreai_session', JSON.stringify(u)); setCurrentUser(u as any);
      return true;
    }
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    sessionStorage.removeItem('encontreai_session'); setCurrentUser(null);
  };
  return { currentUser, register, login, logout, loginWithGoogle };
}

function useServices(professionalId: string | undefined) {
  const [services, setServices] = useState<ProfService[]>([]);
  useEffect(() => {
    if (!professionalId) return;
    if (supabase) {
      supabase.from('services').select('*').eq('professional_id', professionalId)
        .then(({ data }) => setServices(data ? data.map(mapDbToService) : []));
    } else {
      const all = JSON.parse(localStorage.getItem('encontreai_services') || '[]');
      setServices(all.filter((s: any) => s.professionalId === professionalId));
    }
  }, [professionalId]);

  const addService = async (title: string, price: number) => {
    if (!professionalId) return;
    if (supabase) {
      const { data } = await supabase.from('services').insert([{ professional_id: professionalId, title, price }]).select().single();
      if (data) setServices([...services, mapDbToService(data)]);
    } else {
      const newS = { id: `s_${Date.now()}`, professionalId, title, price };
      const all = JSON.parse(localStorage.getItem('encontreai_services') || '[]'); all.push(newS);
      localStorage.setItem('encontreai_services', JSON.stringify(all)); setServices([...services, newS]);
    }
  };
  return { services, addService };
}

function useAppointments(userId: string | undefined, role: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  const load = useCallback(async () => {
    if (!userId || !role) return;
    if (supabase) {
      const col = role === 'professional' ? 'professional_id' : 'client_id';
      const { data } = await supabase.from('appointments').select('*').eq(col, userId).order('created_at', { ascending: false });
      if (data) setAppointments(data.map(mapDbToAppointment));
    } else {
      const all = JSON.parse(localStorage.getItem('encontreai_appointments') || '[]');
      setAppointments(all.filter((a: any) => role === 'professional' ? a.professionalId === userId : a.clientId === userId).reverse());
    }
  }, [userId, role]);

  useEffect(() => { load(); }, [load]);

  const addAppointment = async (apt: Omit<Appointment, 'id' | 'createdAt'>) => {
    if (supabase) {
      const dbApt = { professional_id: apt.professionalId, client_id: apt.clientId, service_id: apt.serviceId, service_title: apt.serviceTitle, price: apt.price, date: apt.date, time: apt.time, status: apt.status, client_name: apt.clientName, professional_name: apt.professionalName };
      await supabase.from('appointments').insert([dbApt]); load();
    } else {
      const newApt = { ...apt, id: `apt_${Date.now()}`, createdAt: new Date().toISOString() };
      const all = JSON.parse(localStorage.getItem('encontreai_appointments') || '[]'); all.push(newApt);
      localStorage.setItem('encontreai_appointments', JSON.stringify(all)); load();
    }
  };

  const cancelAppointment = async (id: string) => {
    if (supabase) {
      await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id); load();
    } else {
      const all = JSON.parse(localStorage.getItem('encontreai_appointments') || '[]');
      const idx = all.findIndex((a: any) => a.id === id);
      if (idx > -1) { all[idx].status = 'cancelled'; localStorage.setItem('encontreai_appointments', JSON.stringify(all)); load(); }
    }
  };
  return { appointments, addAppointment, cancelAppointment };
}

function useLocationManager() {
  const [location, setLocation] = useState(() => sessionStorage.getItem('encontreai_location') || 'São Paulo, SP');
  const [cities, setCities] = useState<string[]>([]);
  useEffect(() => {
    const cached = sessionStorage.getItem('ibge_cities_v2');
    if (cached) setCities(JSON.parse(cached));
    else fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios').then(r => r.json()).then(data => {
          const list = data.map((c: any) => c.microrregiao?.mesorregiao?.UF?.sigla ? `${c.nome}, ${c.microrregiao.mesorregiao.UF.sigla}` : c.nome);
          setCities(list); sessionStorage.setItem('ibge_cities_v2', JSON.stringify(list));
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
   COMPONENTS
══════════════════════════════════════════════ */
function Toast({ toast }: any) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, y: 80, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 80, scale: 0.92 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-5 py-3.5 rounded-2xl shadow-xl max-w-[85%] text-sm font-semibold text-white flex items-center gap-2.5"
          style={{ background: toast.type === 'error' ? C.error : toast.type === 'info' ? C.primary : C.textPrimary }}>
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
            className="fixed top-0 left-0 w-64 h-full bg-white z-[120] shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-blue-50">
               {user ? (
                 <>
                   <div className="w-12 h-12 rounded-full font-bold flex items-center justify-center text-xl mb-3 shadow-sm text-white" style={{ background: C.primary }}>{user.avatarInitial}</div>
                   <h3 className="font-bold text-gray-900 line-clamp-1">{user.name}</h3>
                   <p className="text-[11px] text-gray-500 font-medium mt-1">{user.email}</p>
                 </>
               ) : (
                 <>
                   <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-3"><User className="text-gray-500 w-6 h-6" /></div>
                   <h3 className="font-bold text-gray-900">Visitante</h3>
                   <p className="text-[11px] text-gray-500 font-medium mt-1">Faça login para continuar</p>
                 </>
               )}
            </div>
            <div className="flex-1 p-4 flex flex-col gap-2">
              <button onClick={() => { onNavigate('home'); onClose(); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold active:bg-gray-100 transition-colors"><Home className="w-5 h-5 text-gray-400"/> Início</button>
              <button onClick={() => { onNavigate(user ? 'my-profile' : 'auth'); onClose(); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold active:bg-gray-100 transition-colors"><FileText className="w-5 h-5 text-gray-400"/> {user ? 'Meus Pedidos' : 'Entrar / Criar Conta'}</button>
              {user?.role === 'professional' && (
                <button onClick={() => { onNavigate('dashboard'); onClose(); }} className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold mt-4 active:bg-orange-200 transition-colors border border-orange-200"><Crown className="w-5 h-5 text-orange-500"/> Painel Premium</button>
              )}
            </div>
            {user && (
              <div className="p-4 border-t border-gray-100">
                <button onClick={() => { onLogout(); onClose(); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 font-semibold w-full transition-colors active:bg-red-100"><LogOut className="w-5 h-5"/> Sair da Conta</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function LocationModal({ open, onClose, location, updateLocation, autoDetect, cities }: any) {
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
                    <div className="flex flex-col">
                      {filtered.map((city: string) => (
                        <button key={city} onClick={() => { updateLocation(city); onClose(); }} className="flex items-center gap-3 py-4 px-4 border-b border-gray-100 text-left active:bg-gray-50 last:border-0">
                          <MapPin className="w-5 h-5 text-gray-400" /><span className="font-semibold text-gray-800">{city}</span>
                        </button>
                      ))}
                    </div>
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
   SCREENS
══════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [showLocation, setShowLocation] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { currentUser, register, login, logout, loginWithGoogle } = useAuth();
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
            {screen === 'auth' && <motion.div key="auth" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.18 }}><AuthScreen onLoginSuccess={() => goTo('home')} onRegisterSuccess={() => goTo('home')} register={register} login={login} loginWithGoogle={loginWithGoogle} showToast={showToast} /></motion.div>}
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

        <LocationModal open={showLocation} onClose={() => setShowLocation(false)} location={location} updateLocation={updateLocation} autoDetect={autoDetect} cities={cities} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={currentUser} onNavigate={goTo} onLogout={() => { logout(); goTo('home'); showToast('Desconectado com sucesso', 'info'); }} />
        <Toast toast={toast} />
      </div>
    </div>
  );
}

function HomeScreen({ onNavigate, location, onOpenLocation }: any) {
  const [search, setSearch] = useState(''); const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const filtered = PROFESSIONALS.filter(p => {
    if (!p.activeSubscription) return false;
    if (activeCategory && p.categoryId !== activeCategory && p.profession !== activeCategory) return false;
    if (search) { const q = search.toLowerCase(); if (!p.name.toLowerCase().includes(q) && !p.profession.toLowerCase().includes(q)) return false; }
    return true;
  });
  const catColors = [{ bg: C.primaryBg, text: C.primary }, { bg: C.accentBg, text: C.accentDk }, { bg: '#83FC8E', text: '#004C17' }, { bg: '#E1E3E4', text: '#191C1D' }, { bg: '#FFDAD6', text: '#93000A' }];

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="px-4 py-3 bg-white flex items-center justify-between border-b border-gray-100 cursor-pointer active:bg-gray-50 transition-colors" onClick={onOpenLocation}>
        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100"><MapPin className="w-4 h-4" style={{ color: C.primary }} /></div><div className="flex flex-col"><span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Localização atual</span><span className="text-[13px] font-bold text-gray-900">{location}</span></div></div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
      <div className="px-4 mt-6">
        <div className="relative flex items-center h-12 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl border border-gray-200 overflow-hidden group focus-within:border-blue-400 transition-colors">
          <Search className="w-5 h-5 text-gray-400 ml-4 mr-2 shrink-0 group-focus-within:text-blue-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="flex-1 h-full outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 bg-transparent" placeholder="Buscar serviços..." />
          <button className="h-full px-6 font-bold text-sm transition-transform active:scale-95" style={{ background: C.accent, color: '#fff' }}>Buscar</button>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="px-4 text-lg font-bold text-gray-900 mb-4">Categorias</h2>
        <div className="flex overflow-x-auto gap-4 px-4 pb-2 hide-scrollbar">
          {CATEGORIES.map((cat, i) => {
            const Icon = (Icons as any)[cat.icon] || Icons.HelpCircle;
            const col = catColors[i % catColors.length];
            const isActive = activeCategory === cat.name;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(isActive ? null : cat.name)} className="flex flex-col items-center gap-2 min-w-[76px] group">
                <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-sm transition-transform group-active:scale-95 border-2" style={{ background: col.bg, color: col.text, borderColor: isActive ? col.text : 'transparent' }}><Icon className="w-7 h-7" style={{ fontVariationSettings: "'FILL' 1" }} /></div>
                <span className={`text-[11px] font-bold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-8 mb-4">
        <div className="px-4 flex justify-between items-end mb-4"><h2 className="text-lg font-bold text-gray-900">{activeCategory ? `Resultados para ${activeCategory}` : 'Profissionais em Destaque'}</h2><button className="text-[13px] font-bold hover:underline" style={{ color: C.primary }}>Ver todos</button></div>
        <div className="flex overflow-x-auto gap-4 px-4 pb-8 hide-scrollbar snap-x">
           {filtered.length > 0 ? filtered.map(pro => (
              <div key={pro.id} onClick={() => onNavigate('profile', pro.id)} className="min-w-[300px] md:min-w-[320px] bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col gap-4 relative snap-start cursor-pointer hover:border-gray-300 transition-colors">
                 {pro.verified && <div className="absolute top-4 right-4 text-white rounded-full p-1 z-10 shadow-sm" style={{ background: C.primary }}><CheckCircle2 className="w-3.5 h-3.5" /></div>}
                 <div className="flex gap-4">
                    <img src={pro.avatarUrl} className="w-24 h-24 rounded-xl object-cover bg-gray-100 shadow-sm" alt={pro.name} />
                    <div className="flex flex-col justify-center min-w-0">
                       <h3 className="font-bold text-gray-900 line-clamp-1 text-[15px]">{pro.name}</h3>
                       <p className="text-[12px] text-gray-500 mb-1.5">{pro.profession}</p>
                       <div className="flex items-center gap-1.5 mb-2"><Star className="w-4 h-4 fill-amber-500 text-amber-500" /><span className="text-[13px] font-bold text-gray-900">{pro.rating.toFixed(1)}</span><span className="text-[11px] text-gray-400 font-medium">({pro.reviewsCount} avaliações)</span></div>
                    </div>
                 </div>
              </div>
           )) : <div className="w-full text-center py-10 text-gray-500 bg-white rounded-2xl border border-gray-100 mx-4 font-medium">Nenhum profissional encontrado.</div>}
        </div>
      </div>
    </div>
  );
}

function AuthInput({ label, type, value, onChange, placeholder, icon, error, hint }: any) {
  return (
    <div>
      <label className="block text-[13px] font-bold text-gray-900 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">{icon}</span>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-white border rounded-lg py-3 pl-12 pr-4 text-gray-900 font-medium focus:outline-none focus:ring-1 transition-colors placeholder:text-gray-400" style={{ borderColor: error ? C.error : C.border2, outlineColor: error ? C.error : C.primary }} />
        {hint && <span className="absolute inset-y-0 right-0 flex items-center pr-4">{hint}</span>}
      </div>
      {error && <p className="text-[11px] font-bold mt-1 text-red-600">{error}</p>}
    </div>
  );
}

function AuthScreen({ onLoginSuccess, onRegisterSuccess, register, login, loginWithGoogle, showToast }: any) {
  const [mode, setMode] = useState<AuthMode>('register');
  const [role, setRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [email, setEmail] = useState(''); const [pwd, setPwd] = useState(''); const [name, setName] = useState('');

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault(); setErrors({}); setLoading(true);
    if (mode === 'login') {
      const res = await login(email, pwd);
      if (res.ok) onLoginSuccess(); else setErrors({ pwd: res.error || 'Erro' });
    } else {
      if (!name || !email || !pwd) { setErrors({ general: 'Preencha todos os campos' }); setLoading(false); return; }
      const res = await register({ name, email, password: pwd, role });
      if (res.ok) { showToast('Conta criada com sucesso!'); onRegisterSuccess(); } else setErrors({ email: res.error || 'Erro' });
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    await loginWithGoogle();
    setTimeout(() => { setLoading(false); onLoginSuccess(); }, 1500); // Para simulação local caso Supabase não esteja setado
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-8 pb-16">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-6 border border-gray-100">
        <div className="text-center mb-8"><h1 className="text-3xl font-black mb-2 tracking-tight" style={{ color: C.primary }}>encontreai</h1><p className="text-[15px] font-medium text-gray-500">{mode === 'register' ? 'Crie sua conta' : 'Acesse sua conta'}</p></div>
        {mode === 'register' && (
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button type="button" onClick={() => setRole('client')} className={`flex-1 py-2 text-[13px] font-bold rounded-md transition-all ${role === 'client' ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`} style={role === 'client' ? { background: C.primary } : {}}>Quero Contratar</button>
            <button type="button" onClick={() => setRole('professional')} className={`flex-1 py-2 text-[13px] font-bold rounded-md transition-all ${role === 'professional' ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`} style={role === 'professional' ? { background: C.primary } : {}}>Sou Profissional</button>
          </div>
        )}
        <button type="button" onClick={handleGoogle} disabled={loading} className="w-full h-12 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold flex items-center justify-center gap-3 active:bg-gray-50 transition-colors mb-6 shadow-sm">
          <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuar com o Google
        </button>
        <div className="relative flex items-center py-2 mb-6"><div className="flex-grow border-t border-gray-200"></div><span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">ou use seu email</span><div className="flex-grow border-t border-gray-200"></div></div>
        <form onSubmit={handleAction} className="flex flex-col gap-4">
          {mode === 'register' && <AuthInput label="Nome Completo" type="text" value={name} onChange={setName} placeholder="Seu nome" icon={<User className="w-5 h-5"/>} />}
          <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" icon={<Mail className="w-5 h-5"/>} error={errors.email} />
          <AuthInput label="Senha" type="password" value={pwd} onChange={setPwd} placeholder="Mínimo 8 caracteres" icon={<Lock className="w-5 h-5"/>} error={errors.pwd} />
          {errors.general && <p className="text-xs font-bold text-red-600 text-center">{errors.general}</p>}
          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full h-12 rounded-lg text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]" style={{ background: C.primary }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'register' ? 'Cadastrar' : 'Entrar')} {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </form>
        <div className="mt-8 text-center"><p className="text-sm font-medium text-gray-500">{mode === 'register' ? 'Já tem uma conta?' : 'Não tem uma conta?'} <button type="button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setErrors({}); }} className="font-bold hover:underline" style={{ color: C.primary }}>{mode === 'register' ? 'Faça login' : 'Criar agora'}</button></p></div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CLIENT PROFILE & BOOKING
══════════════════════════════════════════════ */
function ProfileScreen({ professional, onBack, currentUser, onLoginRequired, showToast }: any) {
  const { services } = useServices(professional.id);
  const { addAppointment } = useAppointments(currentUser?.id, currentUser?.role);
  const [bookingService, setBookingService] = useState<ProfService | null>(null);

  const handleBookClick = (s: ProfService) => {
    if (!currentUser) { showToast('Faça login para agendar', 'info'); onLoginRequired(); return; }
    setBookingService(s);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="h-48 relative bg-gray-200">
        <img src={professional.coverUrl} className="w-full h-full object-cover" alt="Capa" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
        <button onClick={onBack} className="absolute top-6 left-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-sm"><ArrowLeft className="w-5 h-5 text-gray-900" /></button>
      </div>
      <div className="max-w-md mx-4 -mt-12 relative bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex gap-4 items-end mb-4">
          <img src={professional.avatarUrl} className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-sm bg-gray-100" alt={professional.name} />
          <div className="pb-1 flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-1.5 line-clamp-1">{professional.name}{professional.verified && <CheckCircle2 className="w-5 h-5" style={{ color: C.primary }} />}</h1>
            <p className="text-sm font-medium text-gray-500">{professional.profession}</p>
          </div>
        </div>
      </div>
      <div className="mx-4 mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Sobre o profissional</h2>
        <p className="text-sm text-gray-600 leading-relaxed bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">{professional.description}</p>
      </div>
      <div className="mx-4 mt-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Serviços e Preços</h2>
        <div className="flex flex-col gap-3">
          {services.map(s => (
            <div key={s.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
               <div><h4 className="font-bold text-gray-900 text-sm">{s.title}</h4><p className="font-black mt-1" style={{ color: C.primary }}>R$ {s.price.toFixed(2)}</p></div>
               <button onClick={() => handleBookClick(s)} className="px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-sm active:scale-95 transition-transform" style={{ background: C.accent }}>Agendar</button>
            </div>
          ))}
          {services.length === 0 && <p className="text-sm text-gray-500 p-4 text-center border border-gray-200 rounded-xl border-dashed">Nenhum serviço cadastrado ainda.</p>}
        </div>
      </div>

      <AnimatePresence>
        {bookingService && (
          <BookingModal open={true} onClose={() => setBookingService(null)} service={bookingService} professional={professional} 
            onBook={async (date: string, time: string) => {
              await addAppointment({ professionalId: professional.id, clientId: currentUser.id, serviceId: bookingService.id, serviceTitle: bookingService.title, price: bookingService.price, date, time, status: 'approved', clientName: currentUser.name, professionalName: professional.name });
              setBookingService(null); showToast('Agendamento confirmado!');
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BookingModal({ open, onClose, service, professional, onBook }: any) {
  const [date, setDate] = useState(''); const [time, setTime] = useState(''); const [loading, setLoading] = useState(false);
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[100]" />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl z-[101] flex flex-col shadow-2xl p-6">
        <h2 className="font-bold text-xl text-gray-900 mb-1">Agendar Serviço</h2><p className="text-sm text-gray-500 mb-6 font-medium">Você pagará apenas após a conclusão.</p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 flex justify-between items-center">
          <div><p className="font-bold text-gray-900">{service.title}</p><p className="text-xs text-gray-500 mt-0.5">{professional.name}</p></div>
          <span className="font-black text-lg" style={{ color: C.primary }}>R$ {service.price.toFixed(2)}</span>
        </div>
        <div className="flex flex-col gap-4 mb-8">
          <div><label className="block text-[13px] font-bold text-gray-900 mb-1.5">Data do serviço</label><input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none focus:border-blue-600" /></div>
          <div><label className="block text-[13px] font-bold text-gray-900 mb-1.5">Horário</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none focus:border-blue-600" /></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
          <button onClick={async () => { setLoading(true); await onBook(date, time); setLoading(false); }} disabled={!date || !time || loading} className="flex-1 py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 active:scale-95 flex justify-center items-center gap-2" style={{ background: C.primary }}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar'}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function ClientOrdersScreen({ user, showToast }: any) {
  const { appointments, cancelAppointment } = useAppointments(user.id, user.role);
  const canCancel = (dateStr: string) => (Date.now() - new Date(dateStr).getTime()) < 48 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-6 pb-20">
      <h1 className="text-2xl font-black text-gray-900 mb-6" style={{ color: C.primary }}>Meus Pedidos</h1>
      {appointments.length === 0 ? <p className="text-gray-500 text-center py-10 font-medium">Nenhum pedido encontrado.</p> : 
        appointments.map(a => {
           const cancelable = a.status === 'approved' && canCancel(a.createdAt);
           return (
             <div key={a.id} className="bg-white p-5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-gray-100 mb-4">
               <div className="flex justify-between items-start mb-3">
                 <div><h3 className="font-bold text-gray-900">{a.serviceTitle}</h3><p className="text-xs text-gray-500 font-medium mt-0.5">Profissional: {a.professionalName}</p></div>
                 <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${a.status==='approved'?'bg-green-100 text-green-700':a.status==='cancelled'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{a.status === 'approved' ? 'Confirmado' : a.status === 'cancelled' ? 'Cancelado' : 'Pendente'}</span>
               </div>
               <div className="flex gap-4 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                 <div className="flex items-center gap-1.5 font-medium"><Calendar className="w-4 h-4 text-gray-400"/> {new Date(a.date).toLocaleDateString('pt-BR')}</div>
                 <div className="flex items-center gap-1.5 font-medium"><Clock className="w-4 h-4 text-gray-400"/> {a.time}</div>
               </div>
               <div className="flex justify-between items-center">
                 <span className="font-black text-lg" style={{ color: C.primary }}>R$ {a.price.toFixed(2)}</span>
                 {cancelable && <button onClick={() => { cancelAppointment(a.id); showToast('Cancelado com sucesso'); }} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Cancelar (Até 48h)</button>}
               </div>
             </div>
           );
        })
      }
    </div>
  );
}

/* ══════════════════════════════════════════════
   PROFESSIONAL DASHBOARD (Acesso Premium)
══════════════════════════════════════════════ */
function DashboardScreen({ user, showToast }: any) {
  const [tab, setTab] = useState<'services'|'agenda'>('services');
  const { services, addService } = useServices(user.id);
  const { appointments } = useAppointments(user.id, user.role);
  const [newTitle, setNewTitle] = useState(''); const [newPrice, setNewPrice] = useState('');

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newTitle || !newPrice) return;
    await addService(newTitle, Number(newPrice));
    setNewTitle(''); setNewPrice(''); showToast('Serviço adicionado!');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4 pt-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 mb-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2"><Crown className="w-5 h-5 text-yellow-200" /><h2 className="font-black text-lg">Acesso Premium Profissional</h2></div>
          <p className="text-sm text-orange-50 font-medium">Você tem acesso total para criar e gerenciar seus serviços.</p>
        </div>
        <Crown className="absolute -bottom-6 -right-4 w-32 h-32 text-orange-400 opacity-30" />
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button onClick={() => setTab('services')} className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-colors ${tab==='services'?'border-orange-500 text-orange-600':'border-transparent text-gray-500'}`}>Meus Serviços</button>
        <button onClick={() => setTab('agenda')} className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-colors ${tab==='agenda'?'border-orange-500 text-orange-600':'border-transparent text-gray-500'}`}>Agenda Virtual</button>
      </div>

      {tab === 'services' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <form onSubmit={handleAddService} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
             <h3 className="font-bold text-gray-900 mb-4">Criar Novo Serviço</h3>
             <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Ex: Corte de Cabelo" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-sm font-medium outline-none focus:border-blue-500" />
             <input type="number" value={newPrice} onChange={e=>setNewPrice(e.target.value)} placeholder="Valor (R$)" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm font-medium outline-none focus:border-blue-500" />
             <button type="submit" className="w-full py-3 rounded-xl font-bold text-white shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform" style={{ background: C.primary }}><Plus className="w-5 h-5"/> Adicionar</button>
          </form>
          <div className="flex flex-col gap-3">
            {services.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">{s.title}</span><span className="font-black text-blue-700">R$ {s.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {tab === 'agenda' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          {appointments.length === 0 ? <p className="text-center text-gray-500 py-10 font-medium">Nenhum agendamento ainda.</p> :
            appointments.map(a => (
              <div key={a.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4 border-l-4" style={{ borderLeftColor: a.status==='cancelled' ? C.error : C.accent }}>
                 <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-gray-900">{a.serviceTitle}</h3><span className="font-black text-sm" style={{ color: C.primary }}>R$ {a.price.toFixed(2)}</span></div>
                 <p className="text-xs text-gray-500 font-medium mb-3">Cliente: <span className="text-gray-900">{a.clientName}</span></p>
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


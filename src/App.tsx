import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PROFESSIONALS, MOCK_REVIEWS, MOCK_COUPONS } from './data';
import { Professional, UserRole, AppUser, ProfService, Appointment, Review, ChatMessage, Coupon } from './types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type Screen = 'home' | 'search' | 'orders' | 'profile' | 'pro-detail' | 'auth' | 'dashboard' | 'post-service' | 'favorites' | 'chat-list' | 'chat-detail';

function Icon({ name, fill, size, className }: { name: string; fill?: boolean; size?: number; className?: string }) {
  return <span className={`material-symbols-outlined ${className || ''}`} style={{ fontSize: size || 24, fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0" }}>{name}</span>;
}

const SUPABASE_URL = 'https://pmtnvpwhjrboozsqntnp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_n_EpHmoJW_4XXEnScNmu0Q_nAtYrpG3';
let supabase: SupabaseClient | null = null;
try { supabase = createClient(SUPABASE_URL, SUPABASE_KEY); } catch { supabase = null; }

const LS = {
  get: <T,>(k: string, f: T): T => { try { const v = localStorage.getItem(`ea_${k}`); return v ? JSON.parse(v) : f; } catch { return f; } },
  set: (k: string, v: any) => { try { localStorage.setItem(`ea_${k}`, JSON.stringify(v)); } catch {} },
};

/* ═══════════════════════════════════════
   HOOKS
═══════════════════════════════════════ */
function useAuth() {
  const [user, setUser] = useState<AppUser | null>(() => { try { const s = sessionStorage.getItem('ea_session'); return s ? JSON.parse(s) : null; } catch { return null; } });
  const save = (u: AppUser) => { setUser(u); sessionStorage.setItem('ea_session', JSON.stringify(u)); };
  const register = async (d: any) => {
    const users = LS.get<AppUser[]>('users', []);
    if (users.find(u => u.email === d.email)) return { ok: false, error: 'E-mail já cadastrado.' };
    const id = `l_${Date.now()}`;
    const nu: AppUser = { id, name: d.name, email: d.email, phone: d.phone, role: d.role, avatarInitial: d.name[0].toUpperCase(), profession: d.profession, categoryId: d.categoryId, cpfCnpj: d.cpfCnpj, password: d.password, favorites: [], createdAt: new Date().toISOString() };
    users.push(nu); LS.set('users', users); save(nu); return { ok: true };
  };
  const login = async (email: string, pwd: string) => {
    const u = LS.get<AppUser[]>('users', []).find(u => u.email === email && u.password === pwd);
    if (!u) return { ok: false, error: 'Credenciais inválidas.' }; save(u); return { ok: true };
  };
  const toggleFavorite = (proId: string) => {
    if (!user) return;
    const favs = user.favorites || [];
    const newFavs = favs.includes(proId) ? favs.filter(id => id !== proId) : [...favs, proId];
    const nu = { ...user, favorites: newFavs };
    const all = LS.get<AppUser[]>('users', []);
    const idx = all.findIndex(u => u.id === user.id);
    if (idx > -1) { all[idx] = nu; LS.set('users', all); }
    save(nu);
  };
  const logout = () => { sessionStorage.removeItem('ea_session'); setUser(null); };
  return { user, register, login, logout, toggleFavorite };
}

function useServices(pid?: string) {
  const [services, setServices] = useState<ProfService[]>([]);
  useEffect(() => {
    if (!pid) return;
    const pro = PROFESSIONALS.find(p => p.id === pid);
    const builtIn = pro?.services || [];
    const custom = LS.get<ProfService[]>('services', []).filter(s => s.professionalId === pid);
    setServices([...builtIn, ...custom]);
  }, [pid]);
  return { services };
}

function useAppointments(uid?: string, role?: string) {
  const [apts, setApts] = useState<Appointment[]>([]);
  const load = useCallback(() => {
    if (!uid || !role) return;
    const all = LS.get<Appointment[]>('appointments', []);
    setApts(all.filter(a => role === 'professional' ? a.professionalId === uid : a.clientId === uid).reverse());
  }, [uid, role]);
  useEffect(() => { load(); }, [load]);
  const add = (a: Omit<Appointment, 'id' | 'createdAt'>) => { const na = { ...a, id: `a_${Date.now()}`, createdAt: new Date().toISOString() }; const all = LS.get<Appointment[]>('appointments', []); all.push(na); LS.set('appointments', all); load(); };
  return { apts, add };
}

function useCoupons(pid?: string) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  useEffect(() => { if(pid) { const all = [...MOCK_COUPONS, ...LS.get<Coupon[]>('coupons', [])]; setCoupons(all.filter(c => c.professionalId === pid)); } }, [pid]);
  return { coupons };
}

function useToast() {
  const [t, setT] = useState<{ msg: string; type: string } | null>(null); const r = useRef<any>();
  const show = useCallback((msg: string, type = 'success') => { if (r.current) clearTimeout(r.current); setT({ msg, type }); r.current = setTimeout(() => setT(null), 3000); }, []);
  return { t, show };
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => LS.get('theme', 'dark') === 'dark'); // Default to dark for these tests
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    LS.set('theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  const toggle = () => setIsDark(!isDark);
  return { isDark, toggle };
}

/* ═══════════════════════════════════════
   MAIN APP
═══════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selProId, setSelProId] = useState<string | null>(null);
  const { user, login, logout, toggleFavorite } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { t, show } = useToast();

  const go = (s: Screen, data?: any) => { 
    if (s === 'pro-detail') setSelProId(data); 
    setScreen(s); window.scrollTo(0, 0); 
  };
  const selPro = PROFESSIONALS.find(p => p.id === selProId);
  
  // The bottom nav is visible on ALL main screens including pro-detail according to the new mockups!
  const hideBottomNav = ['auth', 'chat-detail', 'chat-list', 'dashboard'].includes(screen);
  const activeTab = screen === 'home' ? 0 : screen === 'search' ? 1 : screen === 'orders' ? 2 : (screen === 'profile' || screen === 'favorites') ? 3 : -1;

  // Exact dark mode colors from screenshot
  const bgMain = "bg-[#f8f9fa] dark:bg-[#18181b]"; // zinc-900
  const textMain = "text-[#191c1d] dark:text-white";
  const headerBg = "bg-white dark:bg-[#18181b]";
  const borderCol = "border-[#e5e7eb] dark:border-[#27272a]";

  return (
    <div className={`flex justify-center min-h-screen ${isDark ? 'bg-black' : 'bg-[#e7e8e9]'}`}>
      <div className={`w-full max-w-[448px] min-h-screen relative flex flex-col overflow-hidden shadow-2xl transition-colors duration-300 ${bgMain} ${textMain}`}>
        
        {/* TopAppBar */}
        {!['auth'].includes(screen) && screen !== 'pro-detail' && (
          <header className={`w-full sticky top-0 z-50 border-b flex items-center justify-between px-4 py-3 ${headerBg} ${borderCol}`}>
            <button onClick={() => user ? go('profile') : go('auth')} className="w-9 h-9 rounded-full border flex items-center justify-center bg-[#f1f3f5] dark:bg-[#27272a] dark:border-[#3f3f46] overflow-hidden">
              {user ? <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.avatarInitial}&background=random`} className="w-full h-full object-cover"/> : <Icon name="person" fill size={20} className="text-[#002a5d] dark:text-gray-300" />}
            </button>
            <h1 className="font-black text-[24px] tracking-[-0.03em] text-[#002a5d] dark:text-[#60a5fa]">EncontreAi</h1>
            <div className="flex gap-1">
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <Icon name="notifications" size={22} className={isDark ? 'text-white' : 'text-[#191c1d]'} />
              </button>
            </div>
          </header>
        )}

        <div className="flex-1" style={{ paddingBottom: hideBottomNav ? 0 : 80 }}>
          <AnimatePresence mode="wait">
            {screen === 'home' && <motion.div key="h" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><HomeScreen go={go} isDark={isDark} /></motion.div>}
            {screen === 'search' && <motion.div key="s" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><SearchScreen go={go} isDark={isDark} /></motion.div>}
            {screen === 'orders' && <motion.div key="o" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><OrdersScreen user={user} show={show} go={go} isDark={isDark} /></motion.div>}
            {screen === 'profile' && <motion.div key="p" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ProfileScreen user={user} go={go} logout={() => { logout(); go('home'); }} isDark={isDark} toggleDarkMode={toggleDarkMode} /></motion.div>}
            {screen === 'pro-detail' && selPro && <motion.div key="pd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ProDetailScreen pro={selPro} onBack={() => go('search')} user={user} go={go} show={show} isDark={isDark} /></motion.div>}
            {screen === 'auth' && <motion.div key="a" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}><AuthScreen onOk={() => go('home')} login={login} /></motion.div>}
          </AnimatePresence>
        </div>

        {/* BottomNavBar */}
        {!hideBottomNav && (
          <nav className={`fixed bottom-0 w-full max-w-[448px] z-50 rounded-t-2xl border-t flex justify-around items-center pt-2 pb-5 px-4 transition-colors ${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-[#e5e7eb]'}`}>
            {[{ icon: 'home', label: 'Início', s: 'home' as Screen }, { icon: 'search', label: 'Busca', s: 'search' as Screen }, { icon: 'receipt_long', label: 'Pedidos', s: 'orders' as Screen }, { icon: 'person', label: 'Perfil', s: 'profile' as Screen }].map((tab, i) => {
              const active = activeTab === i || (tab.s === 'search' && screen === 'pro-detail'); // Highlight search when in pro-detail
              return (
                <button key={i} onClick={() => { if ((tab.s === 'orders' || tab.s === 'profile') && !user) go('auth'); else go(tab.s); }}
                  className={`flex flex-col items-center justify-center p-2 px-6 transition-all rounded-full ${active ? (isDark ? 'bg-[#f97316]' : 'bg-[#fd8b00]') : 'bg-transparent'}`}>
                  <Icon name={tab.icon} fill={active} size={24} className={active ? (isDark ? 'text-black' : 'text-[#603100]') : (isDark ? 'text-[#a1a1aa]' : 'text-gray-600')} />
                  <span className={`text-[10px] font-bold mt-1 ${active ? (isDark ? 'text-black' : 'text-[#603100]') : (isDark ? 'text-[#a1a1aa]' : 'text-gray-600')}`}>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        )}

        <AnimatePresence>
          {t && <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} exit={{opacity:0,y:60}} className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl shadow-xl text-sm font-bold text-white max-w-[85%] ${t.type === 'error' ? 'bg-[#ba1a1a]' : 'bg-[#191c1d]'}`}>{t.msg}</motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HOME SCREEN 
═══════════════════════════════════════ */
function HomeScreen({ go, isDark }: any) {
  // Reusing same exact layout from before but just redirecting to Busca
  return <SearchScreen go={go} isDark={isDark} />;
}

/* ═══════════════════════════════════════
   SEARCH SCREEN (Pixel perfect matching Mockup 1)
═══════════════════════════════════════ */
function SearchScreen({ go, isDark }: any) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('loc');
  const filtered = PROFESSIONALS.filter(p => q ? (p.name.toLowerCase().includes(q.toLowerCase()) || p.profession.toLowerCase().includes(q.toLowerCase())) : true);
  
  return (
    <div className="pb-8">
      <div className={`px-4 pt-4 pb-3 sticky top-[57px] z-40 ${isDark ? 'bg-[#18181b]/95' : 'bg-[#f8f9fa]/95'} backdrop-blur-sm border-b ${isDark ? 'border-[#27272a]' : 'border-[#e5e7eb]'}`}>
        <div className="relative mb-4 flex items-center">
          <Icon name="search" size={22} className={`absolute left-4 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`} />
          <input value={q} onChange={e => setQ(e.target.value)} className={`w-full pl-12 pr-12 py-3.5 border rounded-full text-sm outline-none ${isDark ? 'bg-[#27272a] border-[#3f3f46] text-white' : 'bg-white border-[#e5e7eb] text-gray-900'}`} placeholder="O que você precisa hoje?" />
          <button className="absolute right-1 w-10 h-10 rounded-full bg-[#f97316] flex items-center justify-center text-black"><Icon name="arrow_forward" size={20}/></button>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {[{id:'loc', l:'Localização', i:'location_on'}, {id:'price', l:'Preço', i:'payments'}, {id:'rate', l:'Avaliação: 4.5+', i:'star'}].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1 transition-colors ${filter===f.id ? (isDark ? 'bg-[#3730a3] text-white border-[#3730a3]' : 'bg-[#f0f4ff] text-[#002a5d] border-[#002a5d]') : (isDark ? 'bg-transparent text-[#a1a1aa] border-[#3f3f46]' : 'bg-white text-gray-600 border-[#e5e7eb]')}`}>
              <Icon name={f.i} size={14} className={filter===f.id ? (isDark?'text-white':'text-[#002a5d]') : ''}/> {f.l}
            </button>
          ))}
        </div>
      </div>
      
      <div className="px-4 mt-4">
        <div className="flex flex-col gap-4">
          {filtered.map(p => (
            <button key={p.id} onClick={() => go('pro-detail', p.id)} className={`rounded-2xl shadow-sm border p-3 flex gap-3 items-start text-left ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
              <div className="relative">
                <img src={p.avatarUrl} className="w-24 h-28 rounded-xl object-cover" />
                {p.verified && <div className="absolute top-1 right-1 rounded-full p-0.5 bg-white"><Icon name="verified" fill size={18} className="text-[#3b82f6]" /></div>}
              </div>
              <div className="flex-1 py-1 flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className={`font-bold text-[15px] pr-2 leading-tight ${isDark?'text-white':'text-gray-900'}`}>{p.name}</h3>
                    <div className="flex items-center text-[#f97316] shrink-0"><Icon name="star" fill size={14} /><span className={`text-sm font-bold ml-1 ${isDark ? 'text-[#e4e4e7]' : 'text-gray-900'}`}>{p.rating.toFixed(1)}</span></div>
                  </div>
                  <p className={`text-xs mt-1 leading-snug ${isDark ? 'text-[#a1a1aa]' : 'text-gray-600'}`}>{p.profession}</p>
                </div>
                <div className="mt-3 flex items-end justify-between w-full">
                  <div>
                    <span className={`text-[9px] font-bold uppercase tracking-wide ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>A PARTIR DE</span>
                    <p className={`font-black text-lg ${isDark ? 'text-white' : 'text-[#002a5d]'}`}>R$ {Math.min(...(p.services?.map(s=>s.price)||[])).toFixed(0)}<span className={`text-[10px] font-normal ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>/visita</span></p>
                  </div>
                  <span className={`px-4 py-2 rounded-lg font-bold text-xs ${isDark ? 'text-black bg-[#f97316]' : 'text-[#603100] bg-[#fd8b00]'}`}>Ver Perfil</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   PROFILE SCREEN (Pixel perfect matching Mockup 2)
═══════════════════════════════════════ */
function ProfileScreen({ user, go, logout, isDark, toggleDarkMode }: any) {
  if (!user) return null;
  return (
    <div className="px-4 py-6 pb-8">
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop'} className={`w-24 h-24 rounded-full border-4 shadow-md object-cover ${isDark ? 'border-[#18181b]' : 'border-white'}`} />
          <button className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm ${isDark ? 'bg-[#60a5fa] text-[#18181b] border-[#18181b]' : 'bg-[#003f87] text-white border-white'}`}><Icon name="edit" size={16} /></button>
        </div>
        <h2 className="font-black text-2xl mb-1">{user.name}</h2>
        <p className={`text-sm flex items-center gap-1 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-600'}`}><Icon name="mail" size={16} /> {user.email}</p>
        {user.phone && <p className={`text-sm flex items-center gap-1 mt-1 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-600'}`}><Icon name="phone" size={16} /> {user.phone}</p>}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button className={`flex flex-col p-4 rounded-2xl border text-left h-[120px] justify-center shadow-sm ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
          <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isDark ? 'bg-[#dbeafe] text-[#2563eb]' : 'bg-[#d7e2ff] text-[#003f87]'}`}><Icon name="location_on" fill size={24} /></div>
          <span className="font-bold text-[15px]">Endereços</span><span className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Gerenciar locais</span>
        </button>
        <button className={`flex flex-col p-4 rounded-2xl border text-left h-[120px] justify-center shadow-sm ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
          <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isDark ? 'bg-[#ffedd5] text-[#ea580c]' : 'bg-[#ffedd5] text-[#c2410c]'}`}><Icon name="credit_card" fill size={24} /></div>
          <span className="font-bold text-[15px]">Pagamentos</span><span className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Cartões e contas</span>
        </button>
        <button className={`col-span-2 flex items-center justify-between p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-[#86efac] text-[#14532d]' : 'bg-[#86efac] text-[#14532d]'}`}><Icon name="favorite" fill size={24} /></div>
            <div><span className="font-bold text-base block">Profissionais Favoritos</span><span className={`text-sm ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Seus prestadores de serviço salvos</span></div>
          </div>
          <Icon name="chevron_right" className={isDark ? 'text-[#a1a1aa]' : 'text-gray-400'} />
        </button>
      </div>

      <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
        <button onClick={toggleDarkMode} className={`w-full flex items-center justify-between p-5 border-b transition-colors ${isDark ? 'border-[#3f3f46] hover:bg-[#3f3f46]' : 'border-[#e5e7eb] hover:bg-gray-50'}`}>
          <div className="flex items-center gap-4"><Icon name={isDark ? "light_mode" : "dark_mode"} className={isDark ? 'text-white' : 'text-gray-600'} /><span className="font-bold text-[15px]">Modo {isDark?'Claro':'Escuro'}</span></div>
          <div className={`w-10 h-6 rounded-full flex items-center px-1 ${isDark ? 'bg-[#60a5fa] justify-end' : 'bg-gray-300 justify-start'}`}><div className="w-4 h-4 bg-white rounded-full shadow-sm"/></div>
        </button>
        <button className={`w-full flex items-center justify-between p-5 border-b transition-colors ${isDark ? 'border-[#3f3f46] hover:bg-[#3f3f46]' : 'border-[#e5e7eb] hover:bg-gray-50'}`}>
          <div className="flex items-center gap-4"><Icon name="help_center" className={isDark ? 'text-white' : 'text-gray-600'} /><span className="font-bold text-[15px]">Central de Ajuda</span></div>
          <Icon name="chevron_right" className={isDark ? 'text-white' : 'text-gray-400'} />
        </button>
        <button className={`w-full flex items-center justify-between p-5 border-b transition-colors ${isDark ? 'border-[#3f3f46] hover:bg-[#3f3f46]' : 'border-[#e5e7eb] hover:bg-gray-50'}`}>
          <div className="flex items-center gap-4"><Icon name="settings" className={isDark ? 'text-white' : 'text-gray-600'} /><span className="font-bold text-[15px]">Configurações</span></div>
          <Icon name="chevron_right" className={isDark ? 'text-white' : 'text-gray-400'} />
        </button>
        <button onClick={logout} className={`w-full flex items-center gap-4 p-5 transition-colors ${isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
          <Icon name="logout" className={isDark ? 'text-[#fca5a5]' : 'text-[#ba1a1a]'} /><span className={`font-bold text-[15px] ${isDark ? 'text-[#fca5a5]' : 'text-[#ba1a1a]'}`}>Sair</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ORDERS SCREEN (Pixel perfect matching Mockup 3)
═══════════════════════════════════════ */
function OrdersScreen({ user, go, isDark }: any) {
  const { apts } = useAppointments(user?.id, user?.role);
  const [filter, setFilter] = useState('all');
  
  if (!user) return null;
  const filtered = apts.filter(a => filter === 'all' || (filter === 'active' && a.status === 'approved') || (filter === 'done' && a.status === 'completed') || (filter === 'cancelled' && a.status === 'cancelled'));
  
  // Dark mode specific colors for badges from image 3
  const stCfg: Record<string, {label:string, border:string, badgeBg:string, badgeText:string}> = {
    approved: { label: 'Em Andamento', border: '#f97316', badgeBg: isDark ? '#ffedd5' : '#ffedd5', badgeText: isDark ? '#9a3412' : '#9a3412' },
    completed: { label: 'Concluído', border: '#4ade80', badgeBg: isDark ? '#bbf7d0' : '#dcfce7', badgeText: isDark ? '#166534' : '#166534' },
    cancelled: { label: 'Cancelado', border: '#fca5a5', badgeBg: isDark ? '#7f1d1d' : '#fee2e2', badgeText: isDark ? '#fca5a5' : '#991b1b' },
    pending: { label: 'Pendente', border: '#d1d5db', badgeBg: isDark ? '#3f3f46' : '#f3f4f6', badgeText: isDark ? '#e4e4e7' : '#374151' }
  };

  return (
    <div className="px-4 py-6 pb-8">
      <h1 className="font-black text-3xl mb-1">Meus Pedidos</h1>
      <p className={`text-sm mb-5 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-600'}`}>Acompanhe o status dos seus serviços solicitados.</p>
      
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-4">
        {[['all','Todos'],['active','Em Andamento'],['done','Concluídos']].map(([k,l]) => {
          const active = filter === k;
          return (
            <button key={k} onClick={() => setFilter(k)} className={`shrink-0 px-4 py-2 rounded-full font-bold text-sm border transition-colors ${active ? (isDark ? 'bg-[#60a5fa] text-black border-[#60a5fa]' : 'bg-[#002a5d] text-white border-[#002a5d]') : (isDark ? 'bg-transparent text-white border-[#3f3f46]' : 'bg-[#f3f4f6] text-gray-700 border-[#e5e7eb]')}`}>{l}</button>
          )
        })}
      </div>
      
      <div className="flex flex-col gap-4">
        {filtered.map(a => {
          const cfg = stCfg[a.status];
          const pro = PROFESSIONALS.find(p=>p.id===a.professionalId);
          return (
            <div key={a.id} className={`rounded-2xl p-4 border-l-[4px] shadow-sm relative ${isDark ? 'bg-[#27272a] border-y-[#3f3f46] border-r-[#3f3f46]' : 'bg-white border-y-[#e5e7eb] border-r-[#e5e7eb]'}`} style={{ borderLeftColor: cfg.border }}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <img src={pro?.avatarUrl} className="w-14 h-14 rounded-lg object-cover" />
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-1">{a.professionalName} <Icon name="verified" fill size={16} className={isDark ? 'text-[#60a5fa]' : 'text-[#003f87]'}/></h3>
                    <p className={`text-sm ${isDark ? 'text-[#a1a1aa]' : 'text-gray-600'}`}>{a.serviceTitle}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded text-[10px] font-bold" style={{ background: cfg.badgeBg, color: cfg.badgeText }}>{cfg.label}</span>
              </div>
              
              <div className={`flex justify-between items-center pt-3 border-t ${isDark ? 'border-[#3f3f46]' : 'border-[#f3f4f6]'}`}>
                <p className={`text-sm ${isDark ? 'text-[#a1a1aa]' : 'text-gray-600'}`}>
                  {a.status === 'completed' ? 'Realizado: ' : a.status === 'cancelled' ? 'Data original: ' : 'Agendado: '}
                  {new Date(a.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'})}, {a.time}
                </p>
                <div className="flex items-center gap-3">
                  <span className={`font-black text-lg ${a.status==='cancelled'?'line-through opacity-50':''} ${isDark ? 'text-[#60a5fa]' : 'text-[#002a5d]'}`}>R$ {a.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   NEW PRO DETAIL (Pixel perfect matching Mockup 4)
═══════════════════════════════════════ */
function ProDetailScreen({ pro, onBack, user, go, show, isDark }: any) {
  const { services } = useServices(pro.id);
  const svc = services[0] || { price: 120, title: pro.profession };
  const [bookModal, setBookModal] = useState(false);
  const { coupons } = useCoupons(pro.id);
  const { add } = useAppointments(user?.id, user?.role);

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#18181b] text-white' : 'bg-[#f8f9fa] text-[#191c1d]'}`}>
      <header className="absolute top-0 w-full z-50 flex items-center justify-between px-4 py-3">
        <button onClick={onBack} className={`p-2 rounded-full active:scale-95 ${isDark ? 'text-white' : 'text-[#191c1d]'}`}><Icon name="arrow_back" /></button>
        <h1 className={`font-black text-xl tracking-[-0.03em] ${isDark ? 'text-[#e4e4e7]' : 'text-white'}`}>EncontreAi</h1>
        <button className={`p-2 rounded-full ${isDark ? 'text-white' : 'text-[#191c1d]'}`}><Icon name="notifications" /></button>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="relative w-full h-80">
          <img src={pro.coverUrl} className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#18181b] via-[#18181b]/40 to-transparent' : 'from-[#f8f9fa] via-transparent to-transparent'}`} />
        </div>

        <div className="px-4 -mt-10 relative z-10">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1"><h2 className="font-black text-2xl leading-tight">{pro.name}</h2>{pro.verified && <Icon name="verified" fill size={20} className={isDark?'text-[#60a5fa]':'text-[#002a5d]'} />}</div>
              <p className={`text-base font-semibold ${isDark?'text-[#60a5fa]':'text-[#002a5d]'}`}>{pro.profession}</p>
            </div>
            <div className={`flex items-center rounded-full px-3 py-1 ${isDark?'bg-[#27272a]':'bg-white shadow-sm'}`}><Icon name="star" fill size={14} className="mr-1 text-[#f97316]" /><span className="font-bold text-[15px]">{pro.rating.toFixed(1)}</span></div>
          </div>
          
          <div className="mt-5">
            <span className={`text-[10px] font-bold uppercase ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>A partir de</span>
            <p className="font-black text-3xl">R$ {svc.price.toFixed(0)}<span className={`text-sm font-normal ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>/visita</span></p>
          </div>
          
          <div className={`w-full h-[1px] my-5 ${isDark?'bg-[#27272a]':'bg-gray-200'}`} />

          <h3 className="font-bold text-lg mb-3">Sobre o Serviço</h3>
          <p className={`text-sm leading-relaxed mb-5 ${isDark?'text-[#e4e4e7]':'text-gray-700'}`}>
            Especialista em manutenção elétrica residencial, instalação de luminárias, tomadas, quadros de energia e reparos em geral. Atendimento rápido e seguro.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[{i:'speed',l:'Rápido'},{i:'shield',l:'Seguro'},{i:'lightbulb',l:'Luminárias'},{i:'electrical_services',l:'Quadros'}].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
                <Icon name={item.i} size={20} className={isDark?'text-[#60a5fa]':'text-[#002a5d]'} />
                <span className="text-sm font-semibold">{item.l}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-lg">Avaliações</h3>
            <span className={`text-sm ${isDark?'text-[#60a5fa]':'text-[#002a5d]'}`}>Ver todas</span>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {n:'Carlos Silva', r:5, t:'Serviço excelente! Resolveu o problema do quadro de luz rapidamente e foi muito atenciosa. Recomendo muito.'},
              {n:'Ana Paula', r:4, t:'Instalou os lustres novos na sala. Muito caprichosa com os detalhes e deixou tudo limpo. O preço é justo pelo profissionalismo.'}
            ].map((rev, i) => (
              <div key={i} className={`p-4 rounded-xl border ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark?'bg-[#3f3f46] text-[#a1a1aa]':'bg-gray-200'}`}><Icon name="person" size={16}/></div>
                    <span className="font-bold text-sm">{rev.n}</span>
                  </div>
                  <div className="flex text-[#f97316]">{[1,2,3,4,5].map(s=><Icon key={s} name="star" fill={s<=rev.r} size={14} className={s>rev.r? (isDark?'text-[#3f3f46]':'text-gray-300') : ''}/>)}</div>
                </div>
                <p className={`text-sm ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>{rev.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`fixed bottom-[72px] w-full max-w-[448px] px-4 pb-4 pt-8 z-40 bg-gradient-to-t ${isDark?'from-[#18181b] via-[#18181b]':'from-[#f8f9fa] via-[#f8f9fa]'} to-transparent pointer-events-none`}>
        <div className="flex pointer-events-auto">
          <button onClick={() => { if(!user) go('auth'); else setBookModal(true); }} className="flex-1 py-4 rounded-2xl font-black text-lg text-black bg-[#f97316] shadow-[0_8px_20px_rgba(249,115,22,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2">
            Agendar Agora <Icon name="calendar_month" size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {bookModal && <BookingModal svc={svc} coupons={coupons} onClose={() => setBookModal(false)} onBook={(date: string, time: string, finalPrice: number, discount: number) => {
          add({ professionalId: pro.id, clientId: user.id, serviceId: svc.id, serviceTitle: svc.title, price: finalPrice, originalPrice: svc.price, discount, date, time, status: 'approved', clientName: user.name, professionalName: pro.name });
          setBookModal(false); show('Agendamento confirmado! ✅'); go('orders');
        }} show={show} isDark={isDark} />}
      </AnimatePresence>
    </div>
  );
}

function BookingModal({ svc, coupons, onClose, onBook, show, isDark }: any) {
  const [date, setDate] = useState(''); const [time, setTime] = useState('');
  const [code, setCode] = useState(''); const [appliedCoupon, setAppliedCoupon] = useState<Coupon|null>(null);
  const applyCoupon = () => {
    const c = coupons.find((x:any) => x.code === code.toUpperCase() && x.active);
    if(c) { setAppliedCoupon(c); show('Cupom aplicado!'); } else { show('Cupom inválido','error'); setAppliedCoupon(null); }
  };
  const discount = appliedCoupon ? (svc.price * appliedCoupon.discountPercent / 100) : 0;
  const finalPrice = svc.price - discount;

  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" />
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className={`fixed bottom-0 left-0 w-full rounded-t-3xl z-[101] p-6 shadow-2xl ${isDark ? 'bg-[#27272a] text-white' : 'bg-white text-gray-900'}`}>
        <h2 className="font-bold text-xl mb-5">Agendar: {svc.title}</h2>
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex gap-3"><input type="date" value={date} onChange={e => setDate(e.target.value)} className={`flex-1 border rounded-xl py-3.5 px-4 outline-none ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}`} /><input type="time" value={time} onChange={e => setTime(e.target.value)} className={`flex-1 border rounded-xl py-3.5 px-4 outline-none ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}`} /></div>
        </div>
        <div className={`rounded-xl p-5 mb-6 border flex justify-between items-center ${isDark?'bg-[#18181b] border-[#3f3f46]':'bg-[#f8f9fa] border-[#e5e7eb]'}`}>
          <div><p className="font-bold text-sm">Total a pagar</p></div>
          <span className={`font-black text-2xl ${isDark?'text-[#60a5fa]':'text-[#002a5d]'}`}>R$ {finalPrice.toFixed(2)}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 py-4 rounded-xl font-bold ${isDark?'bg-[#3f3f46] text-white':'bg-[#f3f4f6] text-gray-700'}`}>Cancelar</button>
          <button onClick={() => onBook(date,time,finalPrice,discount)} disabled={!date||!time} className={`flex-1 py-4 rounded-xl font-bold text-black disabled:opacity-50 bg-[#f97316]`}>Confirmar</button>
        </div>
      </motion.div>
    </>
  );
}

function AuthScreen({ login, go, onOk }: any) { return <div className="p-4 flex items-center justify-center min-h-screen"><button onClick={()=>{login('',''); onOk();}} className="bg-[#f97316] text-black font-bold px-6 py-3 rounded-xl shadow-lg">Entrar no App (Dev)</button></div>; }

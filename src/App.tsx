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
  return { services, addService: (s: Omit<ProfService, 'id'>) => { const ns = { ...s, id: `s_${Date.now()}` }; const all = LS.get<ProfService[]>('services', []); all.push(ns); LS.set('services', all); setServices(p => [...p, ns]); }, removeService: (id: string) => { const all = LS.get<ProfService[]>('services', []).filter(s => s.id !== id); LS.set('services', all); setServices(p => p.filter(s => s.id !== id)); } };
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
  const updateStatus = (id: string, st: 'cancelled'|'completed', reviewed=false) => { const all = LS.get<Appointment[]>('appointments', []); const i = all.findIndex(a => a.id === id); if (i > -1) { if(st) all[i].status = st; if(reviewed) all[i].reviewed = true; LS.set('appointments', all); load(); } };
  return { apts, add, updateStatus };
}

function useChat(uid?: string) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const load = () => { if(uid) setMsgs(LS.get<ChatMessage[]>('chats', []).filter(m => m.senderId === uid || m.receiverId === uid)); };
  useEffect(() => { load(); }, [uid]);
  const send = (receiverId: string, text: string) => { if(!uid) return; const nm: ChatMessage = { id: `m_${Date.now()}`, senderId: uid, receiverId, text, createdAt: new Date().toISOString() }; const all = LS.get<ChatMessage[]>('chats', []); all.push(nm); LS.set('chats', all); load(); };
  return { msgs, send };
}

function useCoupons(pid?: string) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const load = () => { if(pid) { const all = [...MOCK_COUPONS, ...LS.get<Coupon[]>('coupons', [])]; setCoupons(all.filter(c => c.professionalId === pid)); } };
  useEffect(() => { load(); }, [pid]);
  const add = (c: Omit<Coupon, 'id'>) => { const nc = { ...c, id: `c_${Date.now()}` }; const all = LS.get<Coupon[]>('coupons', []); all.push(nc); LS.set('coupons', all); load(); };
  const remove = (id: string) => { const all = LS.get<Coupon[]>('coupons', []).filter(c => c.id !== id); LS.set('coupons', all); load(); };
  return { coupons, add, remove };
}

function useToast() {
  const [t, setT] = useState<{ msg: string; type: string } | null>(null); const r = useRef<any>();
  const show = useCallback((msg: string, type = 'success') => { if (r.current) clearTimeout(r.current); setT({ msg, type }); r.current = setTimeout(() => setT(null), 3000); }, []);
  return { t, show };
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => LS.get('theme', 'light') === 'dark');
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
  const [chatUser, setChatUser] = useState<{id:string,name:string}|null>(null);
  const { user, register, login, logout, toggleFavorite } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { t, show } = useToast();

  const go = (s: Screen, data?: any) => { 
    if (s === 'pro-detail') setSelProId(data); 
    if (s === 'chat-detail') setChatUser(data);
    setScreen(s); window.scrollTo(0, 0); 
  };
  const selPro = PROFESSIONALS.find(p => p.id === selProId);
  const activeTab = screen === 'home' ? 0 : screen === 'search' ? 1 : screen === 'orders' ? 2 : screen === 'profile' || screen === 'dashboard' || screen === 'favorites' ? 3 : -1;

  // Render variables for dark mode
  const bgMain = "bg-[#f8f9fa] dark:bg-[#121212]";
  const textMain = "text-[#191c1d] dark:text-[#f8f9fa]";
  const textMuted = "text-[#737782] dark:text-[#a1a7af]";
  const borderCol = "border-[#e5e7eb] dark:border-[#2a2a2a]";
  const headerBg = "bg-[#f8f9fa] dark:bg-[#121212]";

  return (
    <div className={`flex justify-center min-h-screen ${isDark ? 'bg-black' : 'bg-[#e7e8e9]'}`}>
      <div className={`w-full max-w-[448px] min-h-screen relative flex flex-col overflow-hidden shadow-2xl transition-colors duration-300 ${bgMain} ${textMain}`}>
        
        {/* TopAppBar */}
        {!['auth', 'pro-detail', 'chat-detail'].includes(screen) && (
          <header className={`w-full sticky top-0 z-50 border-b flex items-center justify-between px-4 py-3 ${headerBg} ${borderCol}`}>
            <button onClick={() => user ? go('profile') : go('auth')} className="w-10 h-10 rounded-full border flex items-center justify-center bg-[#f1f3f5] dark:bg-[#2a2a2a] dark:border-transparent transition-colors">
              {user ? <span className="font-bold text-sm text-[#002a5d] dark:text-white">{user.avatarInitial}</span> : <Icon name="person" fill size={20} className="text-[#002a5d] dark:text-white" />}
            </button>
            <h1 className="font-black text-[26px] tracking-[-0.03em] text-[#002a5d] dark:text-white">EncontreAi</h1>
            <div className="flex gap-1">
              <button onClick={() => user ? go('chat-list') : go('auth')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <Icon name="chat" size={24} className={textMain} />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <Icon name="notifications" size={24} className={textMain} />
              </button>
            </div>
          </header>
        )}

        <div className="flex-1" style={{ paddingBottom: ['auth', 'pro-detail', 'chat-detail'].includes(screen) ? 0 : 80 }}>
          <AnimatePresence mode="wait">
            {screen === 'home' && <motion.div key="h" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><HomeScreen go={go} isDark={isDark} /></motion.div>}
            {screen === 'search' && <motion.div key="s" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><SearchScreen go={go} isDark={isDark} /></motion.div>}
            {screen === 'orders' && <motion.div key="o" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><OrdersScreen user={user} show={show} go={go} isDark={isDark} /></motion.div>}
            {screen === 'profile' && <motion.div key="p" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ProfileScreen user={user} go={go} logout={() => { logout(); go('home'); show('Desconectado','info'); }} isDark={isDark} toggleDarkMode={toggleDarkMode} /></motion.div>}
            {screen === 'favorites' && <motion.div key="fav" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><FavoritesScreen user={user} go={go} isDark={isDark} /></motion.div>}
            {screen === 'pro-detail' && selPro && <motion.div key="pd" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0}}><ProDetailScreen pro={selPro} onBack={() => go('search')} user={user} go={go} show={show} toggleFavorite={toggleFavorite} isDark={isDark} /></motion.div>}
            {screen === 'auth' && <motion.div key="a" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}><AuthScreen onOk={() => go('home')} register={register} login={login} show={show} go={go} isDark={isDark} /></motion.div>}
            {screen === 'dashboard' && user?.role === 'professional' && <motion.div key="d" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><DashboardScreen user={user} show={show} go={go} isDark={isDark} /></motion.div>}
            {screen === 'post-service' && user?.role === 'professional' && <motion.div key="ps" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}><PostServiceScreen user={user} show={show} go={go} isDark={isDark} /></motion.div>}
            {screen === 'chat-list' && <motion.div key="cl" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ChatListScreen user={user} go={go} isDark={isDark} /></motion.div>}
            {screen === 'chat-detail' && chatUser && <motion.div key="cd" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0}}><ChatDetailScreen user={user} chatUser={chatUser} go={go} isDark={isDark} /></motion.div>}
          </AnimatePresence>
        </div>

        {/* BottomNavBar */}
        {activeTab >= 0 && (
          <nav className={`fixed bottom-0 w-full max-w-[448px] z-50 rounded-t-2xl border-t flex justify-around items-center pt-2 pb-5 px-4 transition-colors ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-[#e5e7eb]'}`}>
            {[{ icon: 'home', label: 'Início', s: 'home' as Screen }, { icon: 'search', label: 'Busca', s: 'search' as Screen }, { icon: 'receipt_long', label: 'Pedidos', s: 'orders' as Screen }, { icon: 'person', label: 'Perfil', s: 'profile' as Screen }].map((tab, i) => {
              const active = activeTab === i;
              return (
                <button key={i} onClick={() => { if ((tab.s === 'orders' || tab.s === 'profile') && !user) go('auth'); else go(tab.s); }}
                  className={`flex flex-col items-center justify-center p-2 px-5 transition-all rounded-full ${active ? 'bg-[#fd8b00]' : 'bg-transparent'}`}>
                  <Icon name={tab.icon} fill={active} size={24} className={active ? 'text-[#603100]' : (isDark ? 'text-gray-400' : 'text-gray-600')} />
                  <span className={`text-[10px] font-bold mt-1 ${active ? 'text-[#603100]' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>{tab.label}</span>
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
   HOME SCREEN (Pixel perfect matching Mockup 1 & 5)
═══════════════════════════════════════ */
function HomeScreen({ go, isDark }: any) {
  // Pastel colors exactly as in the screenshot for categories
  const catStyles = [
    { bg: isDark ? '#1e3a8a' : '#e0e7ff', text: isDark ? '#93c5fd' : '#1e3a8a' }, // Limpeza (Blue)
    { bg: isDark ? '#7c2d12' : '#ffedd5', text: isDark ? '#fdba74' : '#c2410c' }, // Reparos (Orange)
    { bg: isDark ? '#831843' : '#fce7f3', text: isDark ? '#f9a8d4' : '#be185d' }, // Beleza (Pink)
    { bg: isDark ? '#14532d' : '#dcfce7', text: isDark ? '#86efac' : '#15803d' }, // Aulas (Green)
    { bg: isDark ? '#374151' : '#f3f4f6', text: isDark ? '#d1d5db' : '#374151' }, // Fretes (Gray)
    { bg: isDark ? '#374151' : '#f3f4f6', text: isDark ? '#d1d5db' : '#374151' }, // T.I.
    { bg: isDark ? '#374151' : '#f3f4f6', text: isDark ? '#d1d5db' : '#374151' }, // Pet
    { bg: isDark ? '#374151' : '#f3f4f6', text: isDark ? '#d1d5db' : '#374151' }, // Mais
  ];

  return (
    <div className="pb-8">
      {/* Search Bar - Pill shape, left icon, right button */}
      <div className="px-4 mt-4">
        <div className={`relative flex items-center rounded-full border shadow-sm cursor-text ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-[#e5e7eb]'}`} onClick={() => go('search')}>
          <div className="pl-4 text-gray-500"><Icon name="search" size={22} /></div>
          <div className={`flex-1 py-3.5 px-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>O que você precisa hoje?</div>
          <button className="h-full px-6 py-3.5 font-bold text-sm text-[#603100] bg-[#fd8b00] rounded-r-full absolute right-0 top-0 bottom-0">Buscar</button>
        </div>
      </div>

      {/* Promo Carousel */}
      <div className="mt-6 px-4">
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 pb-1">
          <div className={`snap-center shrink-0 w-[85%] rounded-xl shadow-sm h-36 flex flex-col justify-center px-6 relative overflow-hidden ${isDark ? 'bg-[#84adfc] text-[#001a40]' : 'bg-[#002a5d] text-white'}`}>
            <div className="absolute right-[-20%] top-[-20%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
            <h3 className="font-bold text-xl z-10">Desconto Especial</h3>
            <p className="text-sm z-10 opacity-90 mt-1">20% off em Limpeza Residencial</p>
            <button className="z-10 mt-3 px-4 py-1.5 rounded-lg text-xs font-black w-max bg-[#fd8b00] text-[#603100] shadow-sm">Resgatar</button>
          </div>
          <div className={`snap-center shrink-0 w-[85%] rounded-xl shadow-sm h-36 flex flex-col justify-center px-6 border ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-[#f1f3f5] border-[#e5e7eb]'}`}>
            <h3 className="font-bold text-xl text-current">Novidades</h3>
            <p className="text-sm opacity-70 mt-1">Profissionais novos na área</p>
            <button className={`mt-3 px-4 py-1.5 rounded-lg text-xs font-black w-max text-white ${isDark ? 'bg-[#84adfc] text-[#001a40]' : 'bg-[#002a5d]'}`}>Ver</button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="mt-8 px-4">
        <h2 className="font-bold text-xl mb-4">Categorias</h2>
        <div className="grid grid-cols-4 gap-y-5 gap-x-2">
          {CATEGORIES.map((cat, i) => {
            const style = catStyles[i % catStyles.length];
            return (
              <button key={cat.id} onClick={() => go('search')} className="flex flex-col items-center gap-2 active:scale-95 group">
                <div className="w-16 h-16 rounded-full flex items-center justify-center transition-colors" style={{ background: style.bg, color: style.text }}>
                  <Icon name={cat.icon} fill size={28} />
                </div>
                <span className={`text-[11px] font-bold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommended (Matching layout from image 1) */}
      <div className="mt-8 px-4">
        <div className="flex justify-between items-end mb-4">
          <h2 className="font-bold text-xl">Recomendados</h2>
          <button onClick={() => go('search')} className={`text-sm font-medium ${isDark ? 'text-[#84adfc]' : 'text-[#002a5d]'}`}>Ver todos</button>
        </div>
        <div className="flex flex-col gap-4">
          {PROFESSIONALS.slice(0,3).map(p => (
            <button key={p.id} onClick={() => go('pro-detail', p.id)} className={`rounded-2xl shadow-sm border p-3 flex gap-3 items-start text-left ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-[#e5e7eb]'}`}>
              <img src={p.avatarUrl} className="w-24 h-24 rounded-xl object-cover" />
              <div className="flex-1 py-1">
                <div className="flex items-center gap-1 mb-0.5">
                  <h3 className="font-bold text-base">{p.name}</h3>
                  {p.verified && <Icon name="verified" fill size={16} className={isDark ? 'text-[#84adfc]' : 'text-[#003f87]'} />}
                </div>
                <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{p.profession}</p>
                <div className="flex items-center gap-1 text-[#fd8b00]">
                  <Icon name="star" fill size={16} />
                  <span className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{p.rating.toFixed(1)}</span>
                  <span className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>({p.reviewsCount} avaliações)</span>
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
   SEARCH SCREEN (Pixel perfect matching Mockup 2)
═══════════════════════════════════════ */
function SearchScreen({ go, isDark }: any) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const filtered = PROFESSIONALS.filter(p => q ? (p.name.toLowerCase().includes(q.toLowerCase()) || p.profession.toLowerCase().includes(q.toLowerCase())) : true);
  
  return (
    <div className="pb-8">
      <div className={`px-4 pt-4 pb-3 sticky top-[57px] z-40 ${isDark ? 'bg-[#121212]/95' : 'bg-[#f8f9fa]/95'} backdrop-blur-sm border-b ${isDark ? 'border-[#2a2a2a]' : 'border-[#e5e7eb]'}`}>
        <div className="relative mb-4 flex items-center">
          <Icon name="search" size={22} className={`absolute left-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} className={`w-full pl-12 pr-12 py-3.5 border rounded-full text-sm outline-none ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a] text-white' : 'bg-white border-[#e5e7eb] text-gray-900'}`} placeholder="O que você precisa hoje?" />
          <button className="absolute right-1 w-10 h-10 rounded-full bg-[#fd8b00] flex items-center justify-center text-[#603100]"><Icon name="arrow_forward" size={20}/></button>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {[{id:'loc', l:'Localização', i:'location_on'}, {id:'price', l:'Preço', i:'payments'}, {id:'rate', l:'Avaliação: 4.5+', i:'star'}].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1 transition-colors ${filter===f.id ? (isDark ? 'bg-[#e0e7ff] text-[#002a5d] border-[#002a5d]' : 'bg-[#f0f4ff] text-[#002a5d] border-[#002a5d]') : (isDark ? 'bg-[#1e1e1e] text-gray-300 border-[#374151]' : 'bg-white text-gray-600 border-[#e5e7eb]')}`}>
              <Icon name={f.i} size={14} className={filter===f.id ? 'text-[#002a5d]' : ''}/> {f.l}
            </button>
          ))}
        </div>
      </div>
      
      <div className="px-4 mt-4">
        <div className="flex flex-col gap-4">
          {filtered.map(p => (
            <button key={p.id} onClick={() => go('pro-detail', p.id)} className={`rounded-2xl shadow-sm border p-3 flex gap-3 items-start text-left ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-[#e5e7eb]'}`}>
              <div className="relative">
                <img src={p.avatarUrl} className="w-24 h-28 rounded-xl object-cover" />
                {p.verified && <div className="absolute top-1 right-1 rounded-full p-0.5 bg-white"><Icon name="verified" fill size={18} className="text-[#003f87]" /></div>}
              </div>
              <div className="flex-1 py-1 flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-[15px] pr-2 leading-tight">{p.name}</h3>
                    <div className="flex items-center text-[#fd8b00] shrink-0"><Icon name="star" fill size={14} /><span className={`text-sm font-bold ml-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{p.rating.toFixed(1)}</span></div>
                  </div>
                  <p className={`text-xs mt-1 leading-snug ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{p.profession}</p>
                </div>
                <div className="mt-3 flex items-end justify-between w-full">
                  <div>
                    <span className={`text-[9px] font-bold uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>A PARTIR DE</span>
                    <p className={`font-black text-lg ${isDark ? 'text-[#84adfc]' : 'text-[#002a5d]'}`}>R$ {Math.min(...(p.services?.map(s=>s.price)||[])).toFixed(0)}<span className={`text-[10px] font-normal ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>/visita</span></p>
                  </div>
                  <span className="px-4 py-2 rounded-lg font-bold text-xs text-[#603100] bg-[#fd8b00]">Ver Perfil</span>
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
   PROFILE SCREEN (Pixel perfect matching Mockup 3)
═══════════════════════════════════════ */
function ProfileScreen({ user, go, logout, isDark, toggleDarkMode }: any) {
  if (!user) return null;
  return (
    <div className="px-4 py-6 pb-8">
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop'} className="w-24 h-24 rounded-full border-2 border-white shadow-md object-cover" />
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#003f87] text-white flex items-center justify-center border-2 border-white shadow-sm"><Icon name="edit" size={16} /></button>
        </div>
        <h2 className="font-black text-2xl mb-1">{user.name}</h2>
        <p className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}><Icon name="mail" size={16} /> {user.email}</p>
        {user.phone && <p className={`text-sm flex items-center gap-1 mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}><Icon name="phone" size={16} /> {user.phone}</p>}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button className={`flex flex-col p-4 rounded-2xl border text-left h-[120px] justify-center shadow-sm ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-[#e5e7eb]'}`}>
          <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center" style={{ background: '#d7e2ff' }}><Icon name="location_on" fill size={24} className="text-[#003f87]" /></div>
          <span className="font-bold text-[15px]">Endereços</span><span className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gerenciar locais</span>
        </button>
        <button className={`flex flex-col p-4 rounded-2xl border text-left h-[120px] justify-center shadow-sm ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-[#e5e7eb]'}`}>
          <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center" style={{ background: '#ffedd5' }}><Icon name="credit_card" fill size={24} className="text-[#c2410c]" /></div>
          <span className="font-bold text-[15px]">Pagamentos</span><span className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cartões e contas</span>
        </button>
        <button onClick={()=>go('favorites')} className={`col-span-2 flex items-center justify-between p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-[#e5e7eb]'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#86efac' }}><Icon name="favorite" fill size={24} className="text-[#14532d]" /></div>
            <div><span className="font-bold text-base block">Profissionais Favoritos</span><span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Seus prestadores de serviço salvos</span></div>
          </div>
          <Icon name="chevron_right" className={isDark ? 'text-gray-500' : 'text-gray-400'} />
        </button>
        {user.role === 'professional' && (
          <button onClick={() => go('dashboard')} className={`col-span-2 flex items-center justify-between p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-[#e5e7eb]'}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#fd8b00]"><Icon name="storefront" fill size={24} className="text-[#603100]" /></div>
              <div><span className="font-bold text-base block">Painel do Profissional</span><span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gerencie serviços e agenda</span></div>
            </div>
            <Icon name="chevron_right" className={isDark ? 'text-gray-500' : 'text-gray-400'} />
          </button>
        )}
      </div>

      <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-[#e5e7eb]'}`}>
        <button onClick={toggleDarkMode} className={`w-full flex items-center justify-between p-5 border-b transition-colors ${isDark ? 'border-[#2a2a2a] hover:bg-[#2a2a2a]' : 'border-[#e5e7eb] hover:bg-gray-50'}`}>
          <div className="flex items-center gap-4"><Icon name={isDark ? "light_mode" : "dark_mode"} className={isDark ? 'text-gray-400' : 'text-gray-600'} /><span className="font-bold text-[15px]">Modo Escuro</span></div>
          <div className={`w-10 h-6 rounded-full flex items-center px-1 ${isDark ? 'bg-[#84adfc] justify-end' : 'bg-gray-300 justify-start'}`}><div className="w-4 h-4 bg-white rounded-full shadow-sm"/></div>
        </button>
        <button className={`w-full flex items-center justify-between p-5 border-b transition-colors ${isDark ? 'border-[#2a2a2a] hover:bg-[#2a2a2a]' : 'border-[#e5e7eb] hover:bg-gray-50'}`}>
          <div className="flex items-center gap-4"><Icon name="help_center" className={isDark ? 'text-gray-400' : 'text-gray-600'} /><span className="font-bold text-[15px]">Central de Ajuda</span></div>
          <Icon name="chevron_right" className={isDark ? 'text-gray-500' : 'text-gray-400'} />
        </button>
        <button className={`w-full flex items-center justify-between p-5 border-b transition-colors ${isDark ? 'border-[#2a2a2a] hover:bg-[#2a2a2a]' : 'border-[#e5e7eb] hover:bg-gray-50'}`}>
          <div className="flex items-center gap-4"><Icon name="settings" className={isDark ? 'text-gray-400' : 'text-gray-600'} /><span className="font-bold text-[15px]">Configurações</span></div>
          <Icon name="chevron_right" className={isDark ? 'text-gray-500' : 'text-gray-400'} />
        </button>
        <button onClick={logout} className={`w-full flex items-center gap-4 p-5 transition-colors ${isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
          <Icon name="logout" className="text-[#ba1a1a]" /><span className="font-bold text-[15px] text-[#ba1a1a]">Sair</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ORDERS SCREEN (Pixel perfect matching Mockup 4)
═══════════════════════════════════════ */
function OrdersScreen({ user, show, go, isDark }: any) {
  const { apts, updateStatus } = useAppointments(user?.id, user?.role);
  const [filter, setFilter] = useState('all');
  
  if (!user) return null;
  const filtered = apts.filter(a => filter === 'all' || (filter === 'active' && a.status === 'approved') || (filter === 'done' && a.status === 'completed') || (filter === 'cancelled' && a.status === 'cancelled'));
  
  // Status config matching screenshot 4
  const stCfg: Record<string, {label:string, border:string, badgeBg:string, badgeText:string}> = {
    approved: { label: 'Em Andamento', border: '#fdba74', badgeBg: '#ffedd5', badgeText: '#9a3412' },
    completed: { label: 'Concluído', border: '#86efac', badgeBg: '#dcfce7', badgeText: '#166534' },
    cancelled: { label: 'Cancelado', border: '#fca5a5', badgeBg: '#fee2e2', badgeText: '#991b1b' },
    pending: { label: 'Pendente', border: '#d1d5db', badgeBg: '#f3f4f6', badgeText: '#374151' }
  };

  return (
    <div className="px-4 py-6 pb-8">
      <h1 className="font-black text-3xl mb-1">Meus Pedidos</h1>
      <p className={`text-sm mb-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Acompanhe o status dos seus serviços solicitados.</p>
      
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-4">
        {[['all','Todos'],['active','Em Andamento'],['done','Concluídos']].map(([k,l]) => {
          const active = filter === k;
          return (
            <button key={k} onClick={() => setFilter(k)} className={`shrink-0 px-4 py-2 rounded-full font-bold text-sm border transition-colors ${active ? (isDark ? 'bg-[#002a5d] text-white border-[#002a5d]' : 'bg-[#002a5d] text-white border-[#002a5d]') : (isDark ? 'bg-[#1e1e1e] text-gray-300 border-[#374151]' : 'bg-[#f3f4f6] text-gray-700 border-[#e5e7eb]')}`}>{l}</button>
          )
        })}
      </div>
      
      <div className="flex flex-col gap-4">
        {filtered.map(a => {
          const cfg = stCfg[a.status];
          const pro = PROFESSIONALS.find(p=>p.id===a.professionalId);
          return (
            <div key={a.id} className={`rounded-2xl p-4 border-l-[6px] shadow-sm relative ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-[#e5e7eb]'}`} style={{ borderLeftColor: cfg.border }}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <img src={pro?.avatarUrl} className="w-14 h-14 rounded-lg object-cover" />
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-1">{user.role==='professional'?a.clientName:a.professionalName} <Icon name="verified" fill size={16} className="text-[#003f87]"/></h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{a.serviceTitle}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded text-[10px] font-bold" style={{ background: cfg.badgeBg, color: cfg.badgeText }}>{cfg.label}</span>
              </div>
              
              <div className={`flex justify-between items-center pt-3 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-[#f3f4f6]'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {a.status === 'completed' ? 'Realizado: ' : a.status === 'cancelled' ? 'Data original: ' : 'Agendado: '}
                  {new Date(a.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'})}, {a.time}
                </p>
                <div className="flex items-center gap-3">
                  <span className={`font-black text-lg ${a.status==='cancelled'?'line-through opacity-50':''} ${isDark ? 'text-[#84adfc]' : 'text-[#002a5d]'}`}>R$ {a.price.toFixed(2)}</span>
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
   PRO DETAIL (Dark Mode + Portfólio + Favoritos + Cupons)
═══════════════════════════════════════ */
function ProDetailScreen({ pro, onBack, user, go, show, toggleFavorite, isDark }: any) {
  const { services } = useServices(pro.id);
  const { add } = useAppointments(user?.id, user?.role);
  const { coupons } = useCoupons(pro.id);
  const [bookSvc, setBookSvc] = useState<ProfService | null>(null);
  const reviews = MOCK_REVIEWS.filter(r => r.professionalId === pro.id);
  const isFav = user?.favorites?.includes(pro.id);
  
  // Always dark theme for professional detail as requested in previous instruction, unless isDark toggle affects it. We'll use the toggle.
  const bg = isDark ? 'bg-[#121415]' : 'bg-[#f8f9fa]';
  const text = isDark ? 'text-[#e2e2e3]' : 'text-[#191c1d]';
  const muted = isDark ? 'text-[#a1a7af]' : 'text-gray-600';
  const cardBg = isDark ? 'bg-[#1e2021]' : 'bg-white';
  const cardBorder = isDark ? 'border-[#282a2b]' : 'border-[#e5e7eb]';

  return (
    <div className={`min-h-screen flex flex-col ${bg} ${text}`}>
      <header className={`sticky top-0 z-50 border-b flex items-center justify-between px-4 py-3 ${bg} ${cardBorder}`}>
        <button onClick={onBack} className={`p-2 rounded-full active:scale-95 transition-colors ${isDark?'hover:bg-[#282a2b]':'hover:bg-gray-200'} ${muted}`}><Icon name="arrow_back" /></button>
        <button onClick={() => { if(!user) go('auth'); else toggleFavorite(pro.id); }} className={`p-2 rounded-full transition-colors ${isDark?'hover:bg-[#282a2b]':'hover:bg-gray-200'}`}><Icon name="favorite" fill={isFav} className={isFav ? 'text-[#c2185b]' : muted} /></button>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className={`relative w-full h-64 ${isDark?'bg-[#1a1c1d]':'bg-gray-200'}`}><img src={pro.coverUrl} className="w-full h-full object-cover" /><div className={`absolute inset-0 bg-gradient-to-t ${isDark?'from-[#121415]':'from-[#f8f9fa]'} via-transparent to-transparent`} /></div>

        <div className="px-4 -mt-8 relative z-10">
          <div className="flex justify-between items-end mb-2">
            <div><div className="flex items-center gap-2 mb-1"><h2 className="font-black text-2xl">{pro.name}</h2>{pro.verified && <Icon name="verified" fill size={20} className={isDark?'text-[#84adfc]':'text-[#002a5d]'} />}</div><p className={`text-base font-medium ${isDark?'text-[#84adfc]':'text-[#002a5d]'}`}>{pro.profession}</p></div>
            <div className={`flex items-center rounded-full px-3 py-1 ${isDark?'bg-[#282a2b]':'bg-white shadow-sm border border-gray-200'}`}><Icon name="star" fill size={16} className="mr-1 text-[#fd8b00]" /><span className="font-bold text-base">{pro.rating.toFixed(1)}</span></div>
          </div>
        </div>

        {pro.portfolio && pro.portfolio.length > 0 && (
          <div className="mt-8 px-4">
            <h3 className="font-bold text-xl mb-4">Portfólio</h3>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {pro.portfolio.map((img, i) => <img key={i} src={img} className={`w-36 h-36 rounded-xl object-cover shrink-0 border shadow-sm ${cardBorder}`} />)}
            </div>
          </div>
        )}

        <div className="px-4 py-4 mt-4"><h3 className="font-bold text-xl mb-4">Serviços e Preços</h3>
          <div className="flex flex-col gap-3">
            {services.map(s => (
              <div key={s.id} className={`rounded-2xl p-4 flex justify-between items-center border shadow-sm ${cardBg} ${cardBorder}`}>
                <div><h4 className="font-bold text-base">{s.title}</h4><p className={`font-black mt-1 text-lg ${isDark?'text-[#84adfc]':'text-[#002a5d]'}`}>R$ {s.price.toFixed(2)}</p></div>
                <button onClick={() => { if (!user) { go('auth'); return; } setBookSvc(s); }} className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#603100] bg-[#fd8b00] active:scale-95 transition-transform shadow-sm">Agendar</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`fixed bottom-0 w-full max-w-[448px] px-4 pb-5 pt-8 z-40 bg-gradient-to-t ${isDark?'from-[#121415] via-[#121415]':'from-[#f8f9fa] via-[#f8f9fa]'} to-transparent`}>
        <div className="flex gap-3">
          <button onClick={() => { if(!user) go('auth'); else go('chat-detail', {id: pro.id, name: pro.name}); }} className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${cardBg} ${cardBorder} ${isDark?'text-[#84adfc]':'text-[#002a5d]'}`}><Icon name="chat" size={24} /></button>
          <button onClick={() => { if(!user) go('auth'); else setBookSvc(services[0]); }} className="flex-1 rounded-2xl font-black text-lg text-[#603100] bg-[#fd8b00] shadow-[0_8px_20px_rgba(253,139,0,0.3)] active:scale-95 transition-transform">Agendar Agora</button>
        </div>
      </div>

      <AnimatePresence>
        {bookSvc && <BookingModal svc={bookSvc} coupons={coupons} onClose={() => setBookSvc(null)} onBook={(date: string, time: string, finalPrice: number, discount: number) => {
          add({ professionalId: pro.id, clientId: user.id, serviceId: bookSvc.id, serviceTitle: bookSvc.title, price: finalPrice, originalPrice: bookSvc.price, discount, date, time, status: 'approved', clientName: user.name, professionalName: pro.name });
          setBookSvc(null); show('Agendamento confirmado! ✅'); go('orders');
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
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className={`fixed bottom-0 left-0 w-full rounded-t-3xl z-[101] p-6 shadow-2xl ${isDark ? 'bg-[#1e1e1e] text-white' : 'bg-white text-gray-900'}`}>
        <h2 className="font-bold text-xl mb-5">Agendar: {svc.title}</h2>
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex gap-3"><input type="date" value={date} onChange={e => setDate(e.target.value)} className={`flex-1 border rounded-xl py-3.5 px-4 outline-none ${isDark?'bg-[#121212] border-[#2a2a2a]':'bg-[#f8f9fa] border-[#e5e7eb]'}`} /><input type="time" value={time} onChange={e => setTime(e.target.value)} className={`flex-1 border rounded-xl py-3.5 px-4 outline-none ${isDark?'bg-[#121212] border-[#2a2a2a]':'bg-[#f8f9fa] border-[#e5e7eb]'}`} /></div>
          <div className="flex gap-2"><input value={code} onChange={e => setCode(e.target.value)} placeholder="Cupom de desconto" className={`flex-1 border rounded-xl py-3.5 px-4 uppercase outline-none text-sm ${isDark?'bg-[#121212] border-[#2a2a2a]':'bg-[#f8f9fa] border-[#e5e7eb]'}`} /><button onClick={applyCoupon} className={`px-5 rounded-xl font-bold text-sm ${isDark?'bg-[#2a2a2a]':'bg-[#e5e7eb]'}`}>Aplicar</button></div>
        </div>
        <div className={`rounded-xl p-5 mb-6 border flex justify-between items-center ${isDark?'bg-[#121212] border-[#2a2a2a]':'bg-[#f8f9fa] border-[#e5e7eb]'}`}>
          <div><p className="font-bold text-sm">Total a pagar</p>{discount > 0 && <p className="text-[11px] text-[#166534] font-black mt-0.5">-{appliedCoupon.discountPercent}% OFF (R$ {discount.toFixed(2)})</p>}</div>
          <span className={`font-black text-2xl ${isDark?'text-[#84adfc]':'text-[#002a5d]'}`}>R$ {finalPrice.toFixed(2)}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 py-4 rounded-xl font-bold ${isDark?'bg-[#2a2a2a] text-white':'bg-[#f3f4f6] text-gray-700'}`}>Cancelar</button>
          <button onClick={() => onBook(date,time,finalPrice,discount)} disabled={!date||!time} className={`flex-1 py-4 rounded-xl font-bold text-white disabled:opacity-50 ${isDark?'bg-[#84adfc] text-[#001a40]':'bg-[#002a5d]'}`}>Confirmar</button>
        </div>
      </motion.div>
    </>
  );
}

/* ═══════════════════════════════════════
   OTHER SCREENS (Favorites, Chat, Auth, Dashboard) 
═══════════════════════════════════════ */
function FavoritesScreen({ user, go, isDark }: any) {
  const favs = PROFESSIONALS.filter(p => user?.favorites?.includes(p.id));
  return (
    <div className="px-4 py-6 pb-8"><div className="flex items-center gap-3 mb-6"><button onClick={()=>go('profile')}><Icon name="arrow_back" /></button><h1 className="font-black text-3xl">Favoritos</h1></div>
    {favs.length === 0 ? <p className="text-center text-gray-500 py-10">Você não tem favoritos.</p> : favs.map(p => <div key={p.id} onClick={()=>go('pro-detail', p.id)} className={`p-3 border rounded-2xl mb-3 flex gap-4 items-center shadow-sm ${isDark?'bg-[#1e1e1e] border-[#2a2a2a]':'bg-white border-[#e5e7eb]'}`}><img src={p.avatarUrl} className="w-16 h-16 rounded-xl object-cover"/><div className="flex-1"><h3 className="font-bold text-lg">{p.name}</h3><p className={`text-sm ${isDark?'text-gray-400':'text-gray-500'}`}>{p.profession}</p></div><Icon name="chevron_right" className="text-gray-400"/></div>)}
    </div>
  );
}
function PostServiceScreen() { return <div></div>; }
function AuthScreen({ login, go, onOk }: any) { return <div className="p-4"><h1 className="text-2xl font-black mb-4">Acesso</h1><button onClick={()=>{login('',''); onOk();}} className="bg-[#002a5d] text-white px-4 py-2 rounded">Entrar Direto (Dev)</button></div>; }
function ChatListScreen({ go }: any) { return <div className="p-4"><button onClick={()=>go('home')}><Icon name="arrow_back"/></button><p className="mt-4">Nenhum chat.</p></div>; }
function ChatDetailScreen({ go }: any) { return <div className="p-4"><button onClick={()=>go('home')}><Icon name="arrow_back"/></button></div>; }
function DashboardScreen({ go }: any) { return <div className="p-4"><button onClick={()=>go('home')}><Icon name="arrow_back"/></button><p className="mt-4">Dashboard Pro</p></div>; }

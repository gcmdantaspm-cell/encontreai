import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PROFESSIONALS, MOCK_REVIEWS } from './data';
import { Professional, UserRole, AppUser, ProfService, Appointment, Review } from './types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type Screen = 'home' | 'search' | 'orders' | 'profile' | 'pro-detail' | 'auth' | 'dashboard' | 'post-service';
type AuthMode = 'login' | 'register';

/* ═══════════════════════════════════════
   MATERIAL ICON COMPONENT
═══════════════════════════════════════ */
function Icon({ name, fill, size, className }: { name: string; fill?: boolean; size?: number; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className || ''}`}
      style={{ fontSize: size || 24, fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0" }}>
      {name}
    </span>
  );
}

/* ═══════════════════════════════════════
   SUPABASE
═══════════════════════════════════════ */
const SUPABASE_URL = 'https://pmtnvpwhjrboozsqntnp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_n_EpHmoJW_4XXEnScNmu0Q_nAtYrpG3';
let supabase: SupabaseClient | null = null;
try { supabase = createClient(SUPABASE_URL, SUPABASE_KEY); } catch { supabase = null; }

/* ═══════════════════════════════════════
   LOCAL STORAGE HELPERS
═══════════════════════════════════════ */
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

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        const m = session.user.user_metadata;
        const existing = LS.get<AppUser[]>('users', []).find(u => u.email === session.user.email);
        if (existing) save(existing);
        else {
          const nu: AppUser = { id: session.user.id, name: m?.full_name || 'Usuário', email: session.user.email || '', phone: '', role: 'client', avatarInitial: (m?.full_name || 'U')[0].toUpperCase(), createdAt: new Date().toISOString() };
          const all = LS.get<AppUser[]>('users', []); all.push(nu); LS.set('users', all); save(nu);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const register = async (d: any) => {
    const users = LS.get<AppUser[]>('users', []);
    if (users.find(u => u.email === d.email)) return { ok: false, error: 'E-mail já cadastrado.' };
    let id = `l_${Date.now()}`;
    if (supabase) { try { const { data } = await supabase.auth.signUp({ email: d.email, password: d.password }); if (data?.user) id = data.user.id; } catch {} }
    const nu: AppUser = { id, name: d.name, email: d.email, phone: d.phone, role: d.role, avatarInitial: d.name[0].toUpperCase(), profession: d.profession, categoryId: d.categoryId, cpfCnpj: d.cpfCnpj, password: d.password, createdAt: new Date().toISOString() };
    users.push(nu); LS.set('users', users); save(nu); return { ok: true };
  };

  const login = async (email: string, pwd: string) => {
    if (supabase) { try { const { error } = await supabase.auth.signInWithPassword({ email, password: pwd }); if (!error) { const u = LS.get<AppUser[]>('users', []).find(u => u.email === email); if (u) { save(u); return { ok: true }; } } } catch {} }
    const u = LS.get<AppUser[]>('users', []).find(u => u.email === email && u.password === pwd);
    if (!u) return { ok: false, error: 'Credenciais inválidas.' }; save(u); return { ok: true };
  };

  const loginGoogle = async () => {
    if (supabase) { try { await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }); return; } catch {} }
    const u: AppUser = { id: `g_${Date.now()}`, name: 'Usuário Google', email: 'google@user.com', phone: '', role: 'client', avatarInitial: 'G', createdAt: new Date().toISOString() };
    const all = LS.get<AppUser[]>('users', []); all.push(u); LS.set('users', all); save(u);
  };

  const logout = async () => { if (supabase) { try { await supabase.auth.signOut(); } catch {} } sessionStorage.removeItem('ea_session'); setUser(null); };
  return { user, register, login, loginGoogle, logout };
}

function useServices(pid?: string) {
  const [services, setServices] = useState<ProfService[]>([]);
  useEffect(() => {
    if (!pid) return;
    // Merge: built-in services from PROFESSIONALS + user-created services
    const pro = PROFESSIONALS.find(p => p.id === pid);
    const builtIn = pro?.services || [];
    const custom = LS.get<ProfService[]>('services', []).filter(s => s.professionalId === pid);
    setServices([...builtIn, ...custom]);
  }, [pid]);

  const addService = (s: Omit<ProfService, 'id'>) => {
    const ns: ProfService = { ...s, id: `s_${Date.now()}` };
    const all = LS.get<ProfService[]>('services', []); all.push(ns); LS.set('services', all);
    setServices(prev => [...prev, ns]);
  };
  const removeService = (id: string) => {
    const all = LS.get<ProfService[]>('services', []).filter(s => s.id !== id); LS.set('services', all);
    setServices(prev => prev.filter(s => s.id !== id));
  };
  return { services, addService, removeService };
}

function useAppointments(uid?: string, role?: string) {
  const [apts, setApts] = useState<Appointment[]>([]);
  const load = useCallback(() => {
    if (!uid || !role) return;
    const all = LS.get<Appointment[]>('appointments', []);
    setApts(all.filter(a => role === 'professional' ? a.professionalId === uid : a.clientId === uid).reverse());
  }, [uid, role]);
  useEffect(() => { load(); }, [load]);

  const add = (a: Omit<Appointment, 'id' | 'createdAt'>) => {
    const na = { ...a, id: `a_${Date.now()}`, createdAt: new Date().toISOString() };
    const all = LS.get<Appointment[]>('appointments', []); all.push(na); LS.set('appointments', all); load();
  };
  const cancel = (id: string) => {
    const all = LS.get<Appointment[]>('appointments', []);
    const i = all.findIndex(a => a.id === id); if (i > -1) { all[i].status = 'cancelled'; LS.set('appointments', all); load(); }
  };
  const complete = (id: string) => {
    const all = LS.get<Appointment[]>('appointments', []);
    const i = all.findIndex(a => a.id === id); if (i > -1) { all[i].status = 'completed'; LS.set('appointments', all); load(); }
  };
  return { apts, add, cancel, complete };
}

function useLocation() {
  const [loc, setLoc] = useState(() => sessionStorage.getItem('ea_loc') || 'São Paulo, SP');
  const [cities, setCities] = useState<string[]>([]);
  useEffect(() => {
    const c = sessionStorage.getItem('ibge_v4'); if (c) { setCities(JSON.parse(c)); return; }
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios').then(r => r.json()).then(d => {
      const l = d.map((c: any) => { const uf = c?.microrregiao?.mesorregiao?.UF?.sigla; return uf ? `${c.nome}, ${uf}` : c.nome; });
      setCities(l); sessionStorage.setItem('ibge_v4', JSON.stringify(l));
    }).catch(() => {});
  }, []);
  const update = (l: string) => { setLoc(l); sessionStorage.setItem('ea_loc', l); };
  const detect = async (): Promise<boolean> => new Promise(res => {
    if (!('geolocation' in navigator)) { res(false); return; }
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try { const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=pt-BR`);
        const d = await r.json(); update(`${d.city || 'São Paulo'}, ${(d.principalSubdivisionCode || 'BR-SP').split('-')[1] || 'SP'}`); res(true);
      } catch { res(false); }
    }, () => res(false), { timeout: 8000 });
  });
  return { loc, update, detect, cities };
}

function useToast() {
  const [t, setT] = useState<{ msg: string; type: string } | null>(null);
  const r = useRef<ReturnType<typeof setTimeout>>();
  const show = useCallback((msg: string, type = 'success') => { if (r.current) clearTimeout(r.current); setT({ msg, type }); r.current = setTimeout(() => setT(null), 3000); }, []);
  return { t, show };
}

/* ═══════════════════════════════════════
   MAIN APP
═══════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selProId, setSelProId] = useState<string | null>(null);
  const [showLoc, setShowLoc] = useState(false);
  const { user, register, login, loginGoogle, logout } = useAuth();
  const locMgr = useLocation();
  const { t, show } = useToast();

  const go = (s: Screen, pid?: string) => { if (pid) setSelProId(pid); setScreen(s); window.scrollTo(0, 0); };
  const selPro = PROFESSIONALS.find(p => p.id === selProId);
  const activeTab = screen === 'home' ? 0 : screen === 'search' ? 1 : screen === 'orders' ? 2 : screen === 'profile' || screen === 'dashboard' ? 3 : -1;

  return (
    <div className="flex justify-center min-h-screen" style={{ background: '#e7e8e9' }}>
      <div className="w-full max-w-[448px] min-h-screen relative flex flex-col overflow-hidden shadow-2xl" style={{ background: '#f8f9fa' }}>
        {/* TopAppBar */}
        {screen !== 'auth' && screen !== 'pro-detail' && (
          <header className="w-full sticky top-0 z-50 border-b flex items-center justify-between px-4 py-2" style={{ background: '#f8f9fa', borderColor: '#c3c6d2' }}>
            <button onClick={() => user ? go('profile') : go('auth')} className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden" style={{ background: '#eceeef' }}>
              {user ? <span className="font-bold text-sm" style={{ color: '#002a5d' }}>{user.avatarInitial}</span> : <Icon name="person" fill size={20} className="text-[#002a5d]" />}
            </button>
            <h1 className="font-black text-[30px] leading-[36px] tracking-[-0.03em]" style={{ color: '#002a5d' }}>EncontreAi</h1>
            <button onClick={() => user ? go('orders') : go('auth')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#eceeef] transition-colors active:scale-95">
              <Icon name="notifications" className="text-[#434751]" />
            </button>
          </header>
        )}

        <div className="flex-1" style={{ paddingBottom: screen === 'auth' || screen === 'pro-detail' ? 0 : 80 }}>
          <AnimatePresence mode="wait">
            {screen === 'home' && <motion.div key="h" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><HomeScreen go={go} loc={locMgr.loc} onLoc={() => setShowLoc(true)} /></motion.div>}
            {screen === 'search' && <motion.div key="s" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><SearchScreen go={go} /></motion.div>}
            {screen === 'orders' && <motion.div key="o" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><OrdersScreen user={user} show={show} go={go} /></motion.div>}
            {screen === 'profile' && <motion.div key="p" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ProfileScreen user={user} go={go} logout={() => { logout(); go('home'); show('Desconectado','info'); }} /></motion.div>}
            {screen === 'pro-detail' && selPro && <motion.div key="pd" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0}}><ProDetailScreen pro={selPro} onBack={() => go('search')} user={user} go={go} show={show} /></motion.div>}
            {screen === 'auth' && <motion.div key="a" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}><AuthScreen onOk={() => go('home')} register={register} login={login} loginGoogle={loginGoogle} show={show} go={go} /></motion.div>}
            {screen === 'dashboard' && user?.role === 'professional' && <motion.div key="d" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><DashboardScreen user={user} show={show} go={go} /></motion.div>}
            {screen === 'post-service' && user?.role === 'professional' && <motion.div key="ps" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}><PostServiceScreen user={user} show={show} go={go} /></motion.div>}
          </AnimatePresence>
        </div>

        {/* BottomNavBar */}
        {activeTab >= 0 && (
          <nav className="fixed bottom-0 w-full max-w-[448px] z-50 rounded-t-[12px] border-t shadow-sm flex justify-around items-center pt-1 pb-4 px-4" style={{ background: '#f8f9fa', borderColor: '#c3c6d2' }}>
            {[{ icon: 'home', label: 'Início', s: 'home' as Screen }, { icon: 'search', label: 'Busca', s: 'search' as Screen }, { icon: 'receipt_long', label: 'Pedidos', s: 'orders' as Screen }, { icon: 'person', label: 'Perfil', s: 'profile' as Screen }].map((tab, i) => (
              <button key={i} onClick={() => { if (tab.s === 'orders' && !user) go('auth'); else if (tab.s === 'profile' && !user) go('auth'); else go(tab.s); }}
                className={`flex flex-col items-center justify-center py-1 px-4 rounded-full transition-all active:scale-95 ${activeTab === i ? 'text-[#603100]' : 'text-[#434751]'}`}
                style={activeTab === i ? { background: '#fd8b00' } : {}}>
                <Icon name={tab.icon} fill={activeTab === i} size={24} />
                <span className="text-[10px] font-bold mt-0.5" style={activeTab === i ? { color: '#603100' } : {}}>{tab.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Location Modal */}
        <LocationModal open={showLoc} onClose={() => setShowLoc(false)} mgr={locMgr} />

        {/* Toast */}
        <AnimatePresence>
          {t && <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} exit={{opacity:0,y:60}} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl shadow-xl text-sm font-bold text-white max-w-[85%]" style={{ background: t.type === 'error' ? '#ba1a1a' : '#191c1d' }}>{t.msg}</motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HOME SCREEN
═══════════════════════════════════════ */
function HomeScreen({ go, loc, onLoc }: any) {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const catColors = [['#d7e2ff','#003f87'],['#ffdcc3','#904d00'],['#fce4ec','#c2185b'],['#9df7a0','#004d17'],['#eceeef','#434751'],['#eceeef','#434751'],['#eceeef','#434751'],['#eceeef','#434751']];
  const filtered = PROFESSIONALS.filter(p => {
    if (!p.activeSubscription) return false;
    if (activeCat && p.categoryId !== activeCat) return false;
    if (search) { const q = search.toLowerCase(); return p.name.toLowerCase().includes(q) || p.profession.toLowerCase().includes(q); }
    return true;
  });

  return (
    <div className="pb-8">
      {/* Location */}
      <button onClick={onLoc} className="w-full flex items-center justify-between px-4 py-3 border-b active:bg-[#eceeef] transition-colors" style={{ borderColor: '#c3c6d2' }}>
        <div className="flex items-center gap-2"><Icon name="location_on" fill size={18} className="text-[#003f87]" /><div><p className="text-[9px] font-extrabold text-[#737782] uppercase tracking-wider">Localização</p><p className="text-[13px] font-bold text-[#191c1d]">{loc}</p></div></div>
        <Icon name="expand_more" size={20} className="text-[#737782]" />
      </button>

      {/* Search */}
      <div className="px-4 mt-4">
        <div className="relative flex items-center rounded-full border overflow-hidden shadow-sm" style={{ background: '#fff', borderColor: '#c3c6d2' }}>
          <div className="pl-4 text-[#737782]"><Icon name="search" size={22} /></div>
          <input value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-3 px-2 outline-none text-[#191c1d] placeholder-[#737782]" placeholder="O que você precisa hoje?" />
          <button className="h-full px-5 py-3 font-bold text-sm text-[#603100] active:scale-95" style={{ background: '#fd8b00' }}>Buscar</button>
        </div>
      </div>

      {/* Promo Carousel */}
      <div className="mt-5 px-4">
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-2">
          <div className="snap-center shrink-0 w-[85%] rounded-xl text-white overflow-hidden relative shadow-sm h-32 flex flex-col justify-center px-6" style={{ background: '#002a5d' }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)' }} />
            <h3 className="font-bold text-lg z-10">Desconto Especial</h3>
            <p className="text-xs z-10 opacity-90 mt-1">20% off em Limpeza Residencial</p>
            <button className="z-10 mt-2 px-3 py-1 rounded text-[9px] font-extrabold w-max active:scale-95" style={{ background: '#fd8b00', color: '#603100' }}>Resgatar</button>
          </div>
          <div className="snap-center shrink-0 w-[85%] rounded-xl overflow-hidden relative shadow-sm h-32 flex flex-col justify-center px-6 border" style={{ background: '#e1e3e4', borderColor: '#c3c6d2' }}>
            <h3 className="font-bold text-lg z-10 text-[#191c1d]">Novos Profissionais</h3>
            <p className="text-xs z-10 opacity-70 mt-1 text-[#434751]">Verificados na sua área</p>
            <button className="z-10 mt-2 px-3 py-1 rounded text-[9px] font-extrabold w-max text-white active:scale-95" style={{ background: '#002a5d' }}>Ver Perfil</button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="mt-6 px-4">
        <h2 className="font-bold text-lg text-[#191c1d] mb-3">Categorias</h2>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat, i) => {
            const [bg, fg] = catColors[i % catColors.length];
            const isA = activeCat === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveCat(isA ? null : cat.id)} className="flex flex-col items-center gap-1 active:scale-95 transition-transform group">
                <div className="w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors" style={{ background: bg, color: fg, borderColor: isA ? fg : 'transparent' }}>
                  <Icon name={cat.icon} fill size={24} />
                </div>
                <span className="text-[9px] font-extrabold text-[#434751] text-center">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommended */}
      <div className="mt-6 px-4">
        <div className="flex justify-between items-end mb-3"><h2 className="font-bold text-lg text-[#191c1d]">{activeCat ? CATEGORIES.find(c=>c.id===activeCat)?.name : 'Recomendados'}</h2><button onClick={() => go('search')} className="text-xs font-bold text-[#002a5d]">Ver todos</button></div>
        <div className="flex flex-col gap-3">
          {filtered.slice(0,4).map(p => (
            <button key={p.id} onClick={() => go('pro-detail', p.id)} className="rounded-xl shadow-sm border p-2 flex gap-2 items-start text-left active:scale-[0.98] transition-transform" style={{ background: '#fff', borderColor: '#c3c6d2' }}>
              <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-[#eceeef] relative">
                <img src={p.avatarUrl} className="w-full h-full object-cover" alt={p.name} />
                {p.verified && <div className="absolute top-1 right-1 rounded-full p-0.5 shadow-sm border border-white" style={{ background: '#003f87' }}><Icon name="verified" fill size={14} className="text-white" /></div>}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <h3 className="font-bold text-[15px] text-[#191c1d] truncate">{p.name}</h3>
                <p className="text-xs text-[#434751] mb-1">{p.profession}</p>
                <div className="flex items-center gap-1 text-[#fd8b00]"><Icon name="star" fill size={14} /><span className="text-xs font-bold text-[#191c1d]">{p.rating.toFixed(1)}</span><span className="text-[9px] text-[#737782]">({p.reviewsCount})</span></div>
                {p.services && p.services.length > 0 && (
                  <div className="mt-1.5"><span className="text-[9px] font-extrabold text-[#737782] uppercase tracking-wider">A partir de</span><p className="font-bold text-[15px] text-[#002a5d]">R$ {Math.min(...p.services.map(s=>s.price)).toFixed(0)}<span className="text-xs font-normal text-[#434751]">/visita</span></p></div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SEARCH SCREEN
═══════════════════════════════════════ */
function SearchScreen({ go }: any) {
  const [q, setQ] = useState(''); const [filter, setFilter] = useState('all');
  const filtered = PROFESSIONALS.filter(p => {
    if (!p.activeSubscription) return false;
    if (filter === '4.5+' && p.rating < 4.5) return false;
    if (q) { const s = q.toLowerCase(); return p.name.toLowerCase().includes(s) || p.profession.toLowerCase().includes(s); }
    return true;
  });

  return (
    <div className="pb-8">
      <div className="px-4 pt-4 pb-2 sticky top-[57px] z-40 backdrop-blur-sm shadow-sm" style={{ background: 'rgba(248,249,250,0.95)' }}>
        <div className="relative mb-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Icon name="search" size={22} className="text-[#737782]" /></div>
          <input value={q} onChange={e => setQ(e.target.value)} className="w-full pl-10 pr-12 py-3 border rounded-full text-sm bg-white outline-none focus:border-[#003f87] focus:ring-1 focus:ring-[#003f87] transition-all shadow-sm" placeholder="O que você precisa hoje?" style={{ borderColor: '#c3c6d2' }} />
          <div className="absolute inset-y-0 right-1 flex items-center"><button className="p-2 rounded-full active:scale-95 text-[#603100]" style={{ background: '#fd8b00' }}><Icon name="arrow_forward" size={20} /></button></div>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {[['all','Todos'],['4.5+','⭐ Avaliação 4.5+']].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors" style={filter===k?{background:'#d7e2ff',borderColor:'#003f87',color:'#001a40'}:{background:'#f8f9fa',borderColor:'#c3c6d2',color:'#434751'}}>{l}</button>
          ))}
        </div>
      </div>
      <div className="px-4 py-3">
        <h2 className="font-bold text-lg text-[#191c1d] mb-3">Resultados</h2>
        <div className="flex flex-col gap-3">
          {filtered.map(p => (
            <button key={p.id} onClick={() => go('pro-detail', p.id)} className="rounded-xl shadow-sm border p-2 flex gap-2 items-start text-left active:scale-[0.98] transition-transform" style={{ background: '#fff', borderColor: '#c3c6d2' }}>
              <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-[#eceeef]">
                <img src={p.avatarUrl} className="w-full h-full object-cover" alt={p.name} />
                {p.verified && <div className="absolute top-1 right-1 rounded-full p-0.5 shadow-sm border border-white" style={{ background: '#003f87' }}><Icon name="verified" fill size={14} className="text-white" /></div>}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <div className="flex justify-between items-start"><h3 className="font-bold text-[15px] text-[#191c1d] truncate pr-2">{p.name}</h3><div className="flex items-center gap-0.5 text-[#fd8b00]"><Icon name="star" fill size={14} /><span className="text-xs font-bold text-[#191c1d]">{p.rating.toFixed(1)}</span></div></div>
                <p className="text-xs text-[#434751] mt-0.5 truncate">{p.profession}</p>
                <div className="mt-2 flex items-end justify-between">
                  <div>{p.services && p.services.length > 0 && <><p className="text-[9px] font-extrabold text-[#737782] uppercase tracking-wider">A partir de</p><p className="font-bold text-[15px] text-[#002a5d]">R$ {Math.min(...p.services.map(s=>s.price)).toFixed(0)}<span className="text-xs font-normal text-[#434751]">/visita</span></p></>}</div>
                  <span className="px-3 py-1 rounded-lg font-bold text-xs text-[#603100]" style={{ background: '#fd8b00' }}>Ver Perfil</span>
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
   PROFESSIONAL DETAIL (DARK MODE)
═══════════════════════════════════════ */
function ProDetailScreen({ pro, onBack, user, go, show }: any) {
  const { services } = useServices(pro.id);
  const { add } = useAppointments(user?.id, user?.role);
  const [bookSvc, setBookSvc] = useState<ProfService | null>(null);
  const reviews = MOCK_REVIEWS.filter(r => r.professionalId === pro.id);
  const dk = { bg: '#121415', card: '#1e2021', cardH: '#282a2b', border: '#434751', text: '#e2e2e3', muted: '#a1a7af', primary: '#84adfc', accent: '#fd8b00' };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: dk.bg, color: dk.text }}>
      <header className="sticky top-0 z-50 border-b flex items-center justify-between px-4 py-2" style={{ background: dk.bg, borderColor: dk.border }}>
        <button onClick={onBack} className="p-2 rounded-full active:scale-95 hover:bg-[#282a2b]" style={{ color: dk.muted }}><Icon name="arrow_back" /></button>
        <h1 className="font-black text-[30px] tracking-[-0.03em]" style={{ color: dk.primary }}>EncontreAi</h1>
        <button className="p-2 rounded-full" style={{ color: dk.muted }}><Icon name="notifications" /></button>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="relative w-full h-64 bg-[#1a1c1d]"><img src={pro.coverUrl} className="w-full h-full object-cover" alt="" /><div className="absolute inset-0 bg-gradient-to-t from-[#121415] via-transparent to-transparent" /></div>

        <div className="px-4 -mt-8 relative z-10">
          <div className="flex justify-between items-end mb-2">
            <div><div className="flex items-center gap-2 mb-1"><h2 className="font-bold text-xl">{pro.name}</h2>{pro.verified && <Icon name="verified" fill size={18} className="drop-shadow-[0_0_8px_rgba(132,173,252,0.5)]" style={{ color: dk.primary }} />}</div><p className="text-sm" style={{ color: dk.primary }}>{pro.profession}</p></div>
            <div className="flex items-center rounded-full px-3 py-1" style={{ background: dk.cardH }}><Icon name="star" fill size={14} className="mr-1" style={{ color: dk.accent }} /><span className="font-bold text-[15px]">{pro.rating.toFixed(1)}</span></div>
          </div>
          {services.length > 0 && <div className="mt-4 mb-4"><span className="text-xs" style={{ color: dk.muted }}>A partir de</span><p className="font-black text-2xl mt-1">R$ {Math.min(...services.map(s=>s.price)).toFixed(0)}<span className="text-sm font-normal" style={{ color: dk.muted }}>/visita</span></p></div>}
        </div>

        <hr className="mx-4 my-2 opacity-30" style={{ borderColor: dk.border }} />

        <div className="px-4 py-2"><h3 className="font-bold text-lg mb-2">Sobre o Serviço</h3><p className="text-sm leading-relaxed" style={{ color: dk.muted }}>{pro.description}</p></div>

        {/* Services List */}
        <div className="px-4 py-2"><h3 className="font-bold text-lg mb-3">Serviços e Preços</h3>
          <div className="flex flex-col gap-2">
            {services.map(s => (
              <div key={s.id} className="rounded-lg p-3 flex justify-between items-center" style={{ background: dk.card }}>
                <div><h4 className="font-bold text-sm">{s.title}</h4>{s.description && <p className="text-xs mt-0.5" style={{ color: dk.muted }}>{s.description}</p>}<p className="font-black mt-1" style={{ color: dk.primary }}>R$ {s.price.toFixed(2)}</p></div>
                <button onClick={() => { if (!user) { show('Faça login para agendar','info'); go('auth'); return; } setBookSvc(s); }} className="px-4 py-2 rounded-lg font-bold text-xs active:scale-95 text-[#603100]" style={{ background: dk.accent }}>Agendar</button>
              </div>
            ))}
          </div>
        </div>

        <hr className="mx-4 my-4 opacity-30" style={{ borderColor: dk.border }} />

        {/* Reviews */}
        <div className="px-4">
          <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-lg">Avaliações</h3><button className="text-xs font-bold" style={{ color: dk.primary }}>Ver todas</button></div>
          {reviews.map(r => (
            <div key={r.id} className="rounded-xl p-4 mb-2" style={{ background: '#1D2021' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: dk.cardH }}><Icon name="person" size={16} className="text-[#a1a7af]" /></div><span className="font-bold text-[15px]">{r.clientName}</span></div>
                <div className="flex">{[...Array(5)].map((_,i) => <Icon key={i} name="star" fill size={14} style={{ color: i < r.rating ? dk.accent : dk.border }} />)}</div>
              </div>
              <p className="text-xs" style={{ color: dk.muted }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-0 w-full max-w-[448px] px-4 pb-4 z-40">
        <button onClick={() => { if (!user) { go('auth'); return; } if (services.length > 0) setBookSvc(services[0]); }}
          className="w-full py-3.5 rounded-xl font-bold text-lg shadow-[0_8px_16px_rgba(253,139,0,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[#603100]" style={{ background: dk.accent }}>
          Agendar Agora <Icon name="calendar_month" size={22} />
        </button>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookSvc && <BookingModal svc={bookSvc} pro={pro} onClose={() => setBookSvc(null)} onBook={(date: string, time: string) => {
          add({ professionalId: pro.id, clientId: user.id, serviceId: bookSvc.id, serviceTitle: bookSvc.title, price: bookSvc.price, date, time, status: 'approved', clientName: user.name, professionalName: pro.name });
          setBookSvc(null); show('Agendamento confirmado! ✅');
        }} />}
      </AnimatePresence>
    </div>
  );
}

function BookingModal({ svc, pro, onClose, onBook }: any) {
  const [date, setDate] = useState(''); const [time, setTime] = useState('');
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/60 z-[100]" />
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:25,stiffness:300}} className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl z-[101] p-6 shadow-2xl text-[#191c1d]">
        <h2 className="font-bold text-xl mb-1">Agendar Serviço</h2>
        <div className="rounded-xl p-4 mb-5 border flex justify-between items-center" style={{ background: '#f8f9fa', borderColor: '#c3c6d2' }}>
          <div><p className="font-bold">{svc.title}</p><p className="text-xs text-[#434751] mt-0.5">{pro.name}</p></div>
          <span className="font-black text-lg text-[#002a5d]">R$ {svc.price.toFixed(2)}</span>
        </div>
        <div className="flex flex-col gap-4 mb-6">
          <div><label className="block text-xs font-bold mb-1">Data</label><input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#003f87]" style={{ borderColor: '#c3c6d2' }} /></div>
          <div><label className="block text-xs font-bold mb-1">Horário</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#003f87]" style={{ borderColor: '#c3c6d2' }} /></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold bg-[#eceeef] text-[#434751]">Cancelar</button>
          <button onClick={() => onBook(date,time)} disabled={!date||!time} className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 active:scale-95" style={{ background: '#002a5d' }}>Confirmar</button>
        </div>
      </motion.div>
    </>
  );
}

/* ═══════════════════════════════════════
   ORDERS SCREEN
═══════════════════════════════════════ */
function OrdersScreen({ user, show, go }: any) {
  const { apts, cancel } = useAppointments(user?.id, user?.role);
  const [filter, setFilter] = useState('all');
  if (!user) { go('auth'); return null; }
  const filtered = apts.filter(a => filter === 'all' || (filter === 'active' && a.status === 'approved') || (filter === 'done' && a.status === 'completed') || (filter === 'cancelled' && a.status === 'cancelled'));
  const borderColors: Record<string,string> = { approved: '#fd8b00', completed: '#6ac170', cancelled: '#ba1a1a', pending: '#737782' };
  const statusLabels: Record<string,string> = { approved: 'Em Andamento', completed: 'Concluído', cancelled: 'Cancelado', pending: 'Pendente' };
  const statusBg: Record<string,string> = { approved: '#ffdcc3', completed: '#9df7a0', cancelled: '#ffdad6', pending: '#e1e3e4' };
  const statusFg: Record<string,string> = { approved: '#603100', completed: '#002106', cancelled: '#93000a', pending: '#434751' };

  return (
    <div className="px-4 py-6 pb-8">
      <h1 className="font-black text-2xl text-[#191c1d] mb-1">Meus Pedidos</h1>
      <p className="text-sm text-[#434751] mb-4">Acompanhe seus serviços solicitados.</p>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-2">
        {[['all','Todos'],['active','Em Andamento'],['done','Concluídos'],['cancelled','Cancelados']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)} className="shrink-0 px-4 py-2 rounded-full font-bold text-[15px] border transition-colors" style={filter===k?{background:'#003f87',color:'#fff',borderColor:'transparent'}:{background:'#eceeef',color:'#434751',borderColor:'#c3c6d2'}}>{l}</button>
        ))}
      </div>
      {filtered.length === 0 ? <div className="text-center py-16"><Icon name="receipt_long" size={48} className="text-[#c3c6d2] mx-auto mb-3" /><p className="text-[#737782] font-medium">Nenhum pedido encontrado.</p></div> :
        filtered.map(a => (
          <div key={a.id} className="rounded-xl p-4 border-l-4 border shadow-sm mb-3 active:scale-[0.98] transition-transform" style={{ background: '#fff', borderColor: '#c3c6d2', borderLeftColor: borderColors[a.status] }}>
            <div className="flex justify-between items-start mb-2">
              <div><h3 className="font-bold text-lg text-[#191c1d]">{a.serviceTitle}</h3><p className="text-xs text-[#434751]">{user.role === 'professional' ? `Cliente: ${a.clientName}` : a.professionalName}</p></div>
              <span className="px-2 py-1 rounded text-[9px] font-extrabold uppercase" style={{ background: statusBg[a.status], color: statusFg[a.status] }}>{statusLabels[a.status]}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: '#e1e3e4' }}>
              <p className="text-xs text-[#434751]">{new Date(a.date).toLocaleDateString('pt-BR')} • {a.time}</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[15px] text-[#003f87]">R$ {a.price.toFixed(2)}</span>
                {a.status === 'approved' && (Date.now() - new Date(a.createdAt).getTime()) < 48*3600000 && (
                  <button onClick={() => { cancel(a.id); show('Cancelado'); }} className="text-[9px] font-extrabold text-[#ba1a1a] px-2 py-1 rounded hover:bg-[#ffdad6]">CANCELAR</button>
                )}
              </div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

/* ═══════════════════════════════════════
   PROFILE SCREEN
═══════════════════════════════════════ */
function ProfileScreen({ user, go, logout }: any) {
  if (!user) { go('auth'); return null; }
  return (
    <div className="px-4 py-6 pb-8">
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-3"><div className="w-24 h-24 rounded-full border-2 flex items-center justify-center text-3xl font-black text-white" style={{ background: '#003f87', borderColor: '#84adfc' }}>{user.avatarInitial}</div></div>
        <h2 className="font-black text-2xl text-[#191c1d] mb-1">{user.name}</h2>
        <p className="text-sm text-[#434751] flex items-center gap-1"><Icon name="mail" size={16} /> {user.email}</p>
        {user.phone && <p className="text-sm text-[#434751] flex items-center gap-1 mt-1"><Icon name="phone" size={16} /> {user.phone}</p>}
        {user.role === 'professional' && <span className="mt-2 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-[#603100]" style={{ background: '#fd8b00' }}>⭐ Profissional</span>}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button className="flex flex-col p-4 rounded-xl border shadow-sm text-left min-h-[100px]" style={{ background: '#fff', borderColor: '#c3c6d2' }}>
          <div className="p-2 rounded-full mb-2" style={{ background: '#d7e2ff' }}><Icon name="location_on" fill size={22} className="text-[#003f87]" /></div>
          <span className="font-bold text-[15px] text-[#191c1d]">Endereços</span><span className="text-xs text-[#434751] mt-1">Gerenciar locais</span>
        </button>
        <button className="flex flex-col p-4 rounded-xl border shadow-sm text-left min-h-[100px]" style={{ background: '#fff', borderColor: '#c3c6d2' }}>
          <div className="p-2 rounded-full mb-2" style={{ background: '#ffdcc3' }}><Icon name="credit_card" fill size={22} className="text-[#904d00]" /></div>
          <span className="font-bold text-[15px] text-[#191c1d]">Pagamentos</span><span className="text-xs text-[#434751] mt-1">Cartões e contas</span>
        </button>
        {user.role === 'professional' && (
          <button onClick={() => go('dashboard')} className="col-span-2 flex items-center justify-between p-4 rounded-xl border shadow-sm" style={{ background: '#fff', borderColor: '#c3c6d2' }}>
            <div className="flex items-center gap-3"><div className="p-2 rounded-full" style={{ background: '#fd8b00' }}><Icon name="storefront" fill size={22} className="text-[#603100]" /></div><div><span className="font-bold text-[15px] text-[#191c1d] block">Painel do Profissional</span><span className="text-xs text-[#434751]">Gerencie serviços e agenda</span></div></div>
            <Icon name="chevron_right" className="text-[#434751]" />
          </button>
        )}
        <button className="col-span-2 flex items-center justify-between p-4 rounded-xl border shadow-sm" style={{ background: '#fff', borderColor: '#c3c6d2' }}>
          <div className="flex items-center gap-3"><div className="p-2 rounded-full" style={{ background: '#9df7a0' }}><Icon name="favorite" fill size={22} className="text-[#004d17]" /></div><div><span className="font-bold text-[15px] text-[#191c1d] block">Favoritos</span><span className="text-xs text-[#434751]">Profissionais salvos</span></div></div>
          <Icon name="chevron_right" className="text-[#434751]" />
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden shadow-sm" style={{ background: '#fff', borderColor: '#c3c6d2' }}>
        <button className="w-full flex items-center justify-between p-4 border-b hover:bg-[#eceeef] transition-colors" style={{ borderColor: '#c3c6d2' }}>
          <div className="flex items-center gap-3"><Icon name="help_center" className="text-[#434751]" /><span className="font-bold text-[15px] text-[#191c1d]">Central de Ajuda</span></div>
          <Icon name="chevron_right" className="text-[#434751]" />
        </button>
        <button className="w-full flex items-center justify-between p-4 border-b hover:bg-[#eceeef] transition-colors" style={{ borderColor: '#c3c6d2' }}>
          <div className="flex items-center gap-3"><Icon name="settings" className="text-[#434751]" /><span className="font-bold text-[15px] text-[#191c1d]">Configurações</span></div>
          <Icon name="chevron_right" className="text-[#434751]" />
        </button>
        <button onClick={logout} className="w-full flex items-center gap-3 p-4 hover:bg-[#ffdad6] transition-colors">
          <Icon name="logout" className="text-[#ba1a1a]" /><span className="font-bold text-[15px] text-[#ba1a1a]">Sair</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   AUTH SCREEN
═══════════════════════════════════════ */
function AuthScreen({ onOk, register, login, loginGoogle, show, go }: any) {
  const [mode, setMode] = useState<AuthMode>('register');
  const [role, setRole] = useState<UserRole>('client');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState('');
  const [pwd, setPwd] = useState(''); const [profession, setProfession] = useState(''); const [cpf, setCpf] = useState('');
  const [cat, setCat] = useState(''); const [errors, setErrors] = useState<Record<string,string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); const er: Record<string,string> = {};
    if (mode === 'register') { if (!name) er.name = 'Obrigatório'; if (!phone) er.phone = 'Obrigatório'; if (role === 'professional' && !profession) er.profession = 'Obrigatório'; }
    if (!email.includes('@')) er.email = 'E-mail inválido'; if (pwd.length < 6) er.pwd = 'Mínimo 6 caracteres';
    setErrors(er); if (Object.keys(er).length) return;
    if (mode === 'login') { const r = await login(email, pwd); if (r.ok) { show('Login realizado!'); onOk(); } else setErrors({ pwd: r.error || 'Erro' }); }
    else { const r = await register({ name, email, password: pwd, phone, role, profession: role==='professional'?profession:undefined, categoryId: cat||undefined, cpfCnpj: role==='professional'?cpf:undefined });
      if (r.ok) { show('Conta criada! 🎉'); onOk(); } else setErrors({ email: r.error || 'Erro' }); }
  };

  return (
    <div className="min-h-screen flex flex-col justify-start px-4 py-6 pb-16 overflow-y-auto" style={{ background: '#f8f9fa' }}>
      <button onClick={() => go('home')} className="self-start mb-4 p-2 -ml-2 rounded-full hover:bg-[#eceeef]"><Icon name="arrow_back" className="text-[#434751]" /></button>
      <div className="max-w-md w-full mx-auto rounded-xl shadow-lg p-6 border" style={{ background: '#fff', borderColor: '#c3c6d2' }}>
        <div className="text-center mb-5"><h1 className="font-black text-[30px] tracking-[-0.03em] text-[#002a5d]">EncontreAi</h1><p className="text-sm text-[#434751]">{mode==='register'?'Crie sua conta':'Acesse sua conta'}</p></div>

        <button onClick={loginGoogle} className="w-full h-12 rounded-xl bg-white border font-bold flex items-center justify-center gap-3 mb-4 shadow-sm active:bg-[#eceeef]" style={{ borderColor: '#c3c6d2' }}>
          <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuar com o Google
        </button>
        <div className="flex items-center py-1 mb-4"><div className="flex-grow border-t" style={{ borderColor: '#c3c6d2' }} /><span className="mx-3 text-[9px] font-extrabold text-[#737782] uppercase">ou</span><div className="flex-grow border-t" style={{ borderColor: '#c3c6d2' }} /></div>

        {mode === 'register' && (
          <div className="flex rounded-xl p-1 mb-4" style={{ background: '#eceeef' }}>
            <button type="button" onClick={() => setRole('client')} className="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all text-white" style={role==='client'?{background:'#002a5d'}:{color:'#434751',background:'transparent'}}>👤 Contratar</button>
            <button type="button" onClick={() => setRole('professional')} className="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all text-white" style={role==='professional'?{background:'#fd8b00',color:'#603100'}:{color:'#434751',background:'transparent'}}>⭐ Profissional</button>
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === 'register' && <><InputField label="Nome Completo" icon="person" value={name} onChange={setName} error={errors.name} /><InputField label="Telefone" icon="phone" type="tel" value={phone} onChange={setPhone} error={errors.phone} placeholder="(11) 99999-9999" /></>}
          <InputField label="Email" icon="mail" type="email" value={email} onChange={setEmail} error={errors.email} placeholder="seu@email.com" />
          <InputField label="Senha" icon="lock" type="password" value={pwd} onChange={setPwd} error={errors.pwd} placeholder="Mínimo 6 caracteres" />
          {mode === 'register' && role === 'professional' && <>
            <div className="border-t pt-3 mt-1" style={{ borderColor: '#c3c6d2' }}><p className="text-[9px] font-extrabold uppercase tracking-wider mb-2" style={{ color: '#fd8b00' }}>⭐ Dados Profissionais</p></div>
            <InputField label="Profissão" icon="work" value={profession} onChange={setProfession} error={errors.profession} placeholder="Ex: Barbeiro, Eletricista..." />
            <InputField label="CPF ou CNPJ" icon="badge" value={cpf} onChange={setCpf} placeholder="000.000.000-00" />
            <div><label className="block text-xs font-bold text-[#191c1d] mb-1">Categoria</label><select value={cat} onChange={e => setCat(e.target.value)} className="w-full border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-[#003f87]" style={{ borderColor: '#c3c6d2' }}><option value="">Selecione</option>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </>}
          <button type="submit" className="w-full h-12 rounded-xl text-white font-bold flex items-center justify-center gap-2 mt-2 active:scale-[0.98] shadow-md" style={{ background: mode==='register'&&role==='professional'?'#fd8b00':'#002a5d', color: mode==='register'&&role==='professional'?'#603100':'#fff' }}>
            {mode === 'register' ? 'Criar Conta' : 'Entrar'} <Icon name="arrow_forward" size={20} />
          </button>
        </form>
        <div className="mt-5 text-center"><p className="text-sm text-[#434751]">{mode==='register'?'Já tem conta?':'Não tem conta?'} <button onClick={() => { setMode(mode==='register'?'login':'register'); setErrors({}); }} className="font-bold text-[#002a5d]">{mode==='register'?'Faça login':'Criar agora'}</button></p></div>
      </div>
    </div>
  );
}

function InputField({ label, icon, type, value, onChange, error, placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#191c1d] mb-1">{label}</label>
      <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#737782]"><Icon name={icon} size={20} /></span>
        <input type={type||'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full border rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#003f87] transition-all placeholder-[#737782]" style={{ borderColor: error ? '#ba1a1a' : '#c3c6d2' }} />
      </div>
      {error && <p className="text-[11px] font-bold text-[#ba1a1a] mt-1">{error}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════
   PROFESSIONAL DASHBOARD (Marketplace)
═══════════════════════════════════════ */
function DashboardScreen({ user, show, go }: any) {
  const [tab, setTab] = useState<'services'|'agenda'>('services');
  const { services, removeService } = useServices(user.id);
  const { apts, complete } = useAppointments(user.id, 'professional');
  const [showManual, setShowManual] = useState(false);
  const { add } = useAppointments(user.id, 'professional');

  return (
    <div className="px-4 py-6 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="font-black text-2xl text-[#191c1d]">Painel</h1><p className="text-sm text-[#434751]">Gerencie seus serviços</p></div>
        <button onClick={() => go('profile')} className="p-2 rounded-full hover:bg-[#eceeef]"><Icon name="arrow_back" className="text-[#434751]" /></button>
      </div>

      <div className="flex rounded-xl p-1 mb-5" style={{ background: '#eceeef' }}>
        <button onClick={() => setTab('services')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${tab==='services'?'bg-white text-[#191c1d] shadow-sm':'text-[#434751]'}`}>Meus Serviços</button>
        <button onClick={() => setTab('agenda')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${tab==='agenda'?'bg-white text-[#191c1d] shadow-sm':'text-[#434751]'}`}>Agenda</button>
      </div>

      {tab === 'services' && (
        <div>
          <button onClick={() => go('post-service')} className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] mb-4 text-[#603100] shadow-sm" style={{ background: '#fd8b00' }}>
            <Icon name="add" size={22} /> Publicar Novo Serviço
          </button>
          {services.length > 0 && <h3 className="font-bold text-[#191c1d] mb-2">Serviços Publicados ({services.length})</h3>}
          {services.map(s => (
            <div key={s.id} className="rounded-xl p-4 border shadow-sm mb-2 flex justify-between items-center" style={{ background: '#fff', borderColor: '#c3c6d2' }}>
              <div><h4 className="font-bold text-sm text-[#191c1d]">{s.title}</h4>{s.description && <p className="text-xs text-[#434751] mt-0.5">{s.description}</p>}<p className="font-black text-[15px] mt-1 text-[#002a5d]">R$ {s.price.toFixed(2)}</p></div>
              <button onClick={() => { removeService(s.id); show('Removido'); }} className="p-2 rounded-lg hover:bg-[#ffdad6] text-[#ba1a1a]"><Icon name="delete" size={20} /></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'agenda' && (
        <div>
          <button onClick={() => setShowManual(true)} className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] mb-4 border text-[#002a5d]" style={{ borderColor: '#003f87', background: '#d7e2ff' }}>
            <Icon name="edit_calendar" size={20} /> Adicionar Manualmente
          </button>
          {apts.length === 0 ? <div className="text-center py-12"><Icon name="calendar_month" size={48} className="text-[#c3c6d2] mx-auto mb-3" /><p className="text-[#737782]">Nenhum agendamento.</p></div> :
            apts.map(a => (
              <div key={a.id} className="rounded-xl p-4 border-l-4 border shadow-sm mb-2" style={{ background: '#fff', borderColor: '#c3c6d2', borderLeftColor: a.status==='cancelled'?'#ba1a1a':a.status==='completed'?'#6ac170':'#fd8b00' }}>
                <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-[#191c1d]">{a.serviceTitle}</h3><span className="font-black text-sm text-[#002a5d]">R$ {a.price.toFixed(2)}</span></div>
                <p className="text-xs text-[#434751] mb-2">Cliente: <strong>{a.clientName}</strong></p>
                <div className="flex gap-3 text-xs text-[#434751]"><span className="flex items-center gap-1"><Icon name="calendar_today" size={14} /> {new Date(a.date).toLocaleDateString('pt-BR')}</span><span className="flex items-center gap-1"><Icon name="schedule" size={14} /> {a.time}</span></div>
                {a.status === 'approved' && <button onClick={() => { complete(a.id); show('Concluído! ✅'); }} className="mt-2 w-full py-2 rounded-lg text-xs font-bold text-white active:scale-95" style={{ background: '#004d17' }}>Marcar Concluído</button>}
              </div>
            ))
          }

          {/* Manual Add Modal */}
          <AnimatePresence>
            {showManual && (
              <>
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowManual(false)} className="fixed inset-0 bg-black/50 z-[100]" />
                <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl z-[101] p-6 shadow-2xl">
                  <ManualAddForm user={user} onAdd={(a: any) => { add(a); setShowManual(false); show('Adicionado!'); }} onClose={() => setShowManual(false)} />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function ManualAddForm({ user, onAdd, onClose }: any) {
  const [title, setTitle] = useState(''); const [client, setClient] = useState('');
  const [price, setPrice] = useState(''); const [date, setDate] = useState(''); const [time, setTime] = useState('');
  return (
    <div>
      <h2 className="font-bold text-xl text-[#191c1d] mb-4">Adicionar Agendamento</h2>
      <div className="flex flex-col gap-3 mb-4">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Serviço (Ex: Corte)" className="border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-[#003f87]" style={{ borderColor: '#c3c6d2' }} />
        <input value={client} onChange={e => setClient(e.target.value)} placeholder="Nome do cliente" className="border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-[#003f87]" style={{ borderColor: '#c3c6d2' }} />
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Valor (R$)" className="border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-[#003f87]" style={{ borderColor: '#c3c6d2' }} />
        <div className="flex gap-2"><input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1 border rounded-xl py-3 px-4 text-sm outline-none" style={{ borderColor: '#c3c6d2' }} /><input type="time" value={time} onChange={e => setTime(e.target.value)} className="flex-1 border rounded-xl py-3 px-4 text-sm outline-none" style={{ borderColor: '#c3c6d2' }} /></div>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold bg-[#eceeef] text-[#434751]">Cancelar</button>
        <button onClick={() => { if (!title || !client || !date || !time) return; onAdd({ professionalId: user.id, clientId: 'manual', serviceId: 'manual', serviceTitle: title, price: Number(price) || 0, date, time, status: 'approved', clientName: client, professionalName: user.name }); }} disabled={!title||!client||!date||!time} className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 active:scale-95" style={{ background: '#002a5d' }}>Adicionar</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   POST SERVICE (Marketplace Style)
═══════════════════════════════════════ */
function PostServiceScreen({ user, show, go }: any) {
  const { addService } = useServices(user.id);
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState('');
  const [price, setPrice] = useState(''); const [cat, setCat] = useState(''); const [duration, setDuration] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); if (!title || !price) { show('Preencha nome e preço', 'error'); return; }
    addService({ professionalId: user.id, title, description: desc, category: cat, price: Number(price), duration: Number(duration) || undefined });
    show('Serviço publicado! 🎉'); go('dashboard');
  };

  return (
    <div className="px-4 py-6 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => go('dashboard')} className="p-2 rounded-full hover:bg-[#eceeef]"><Icon name="arrow_back" className="text-[#434751]" /></button>
        <h1 className="font-black text-xl text-[#191c1d]">Publicar Serviço</h1>
      </div>
      <div className="rounded-xl p-5 border shadow-sm mb-4" style={{ background: '#fff', borderColor: '#c3c6d2' }}>
        <p className="text-xs text-[#434751] mb-4">Preencha os dados do serviço que você oferece. Semelhante a um anúncio em marketplace.</p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div><label className="block text-xs font-bold text-[#191c1d] mb-1">Nome do Serviço *</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Corte de Cabelo Masculino" className="w-full border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-[#003f87]" style={{ borderColor: '#c3c6d2' }} /></div>
          <div><label className="block text-xs font-bold text-[#191c1d] mb-1">Descrição</label><textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descreva seu serviço em detalhes..." rows={3} className="w-full border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-[#003f87] resize-none" style={{ borderColor: '#c3c6d2' }} /></div>
          <div><label className="block text-xs font-bold text-[#191c1d] mb-1">Categoria</label><select value={cat} onChange={e => setCat(e.target.value)} className="w-full border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-[#003f87]" style={{ borderColor: '#c3c6d2' }}><option value="">Selecione</option>{CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
          <div className="flex gap-3">
            <div className="flex-1"><label className="block text-xs font-bold text-[#191c1d] mb-1">Valor (R$) *</label><input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="30.00" className="w-full border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-[#003f87]" style={{ borderColor: '#c3c6d2' }} /></div>
            <div className="flex-1"><label className="block text-xs font-bold text-[#191c1d] mb-1">Duração (min)</label><input type="number" min="0" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" className="w-full border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-[#003f87]" style={{ borderColor: '#c3c6d2' }} /></div>
          </div>
          <button type="submit" className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] shadow-md text-[#603100] mt-2" style={{ background: '#fd8b00' }}>
            <Icon name="publish" size={20} /> Publicar Serviço
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   LOCATION MODAL
═══════════════════════════════════════ */
function LocationModal({ open, onClose, mgr }: any) {
  const [q, setQ] = useState(''); const [loading, setLoading] = useState(false);
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = q.length >= 2 ? mgr.cities.filter((c: string) => norm(c).includes(norm(q))).slice(0, 50) : [];
  useEffect(() => { if (!open) setQ(''); }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/50 z-[100]" />
          <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:25,stiffness:300}} className="fixed bottom-0 left-0 w-full h-[85vh] bg-white rounded-t-3xl z-[101] flex flex-col shadow-2xl">
            <div className="p-5 border-b flex items-center gap-3" style={{ borderColor: '#c3c6d2' }}>
              <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-[#eceeef]"><Icon name="arrow_back" className="text-[#434751]" /></button>
              <h2 className="font-bold text-lg text-[#191c1d]">Selecionar Localização</h2>
            </div>
            <div className="p-5 flex-1 overflow-hidden flex flex-col" style={{ background: '#f8f9fa' }}>
              <button onClick={async () => { setLoading(true); await mgr.detect(); setLoading(false); onClose(); }} className="w-full flex items-center gap-3 p-4 rounded-xl font-bold mb-4 active:scale-[0.98] border text-[#002a5d]" style={{ background: '#d7e2ff', borderColor: '#003f87' }}>
                <Icon name={loading ? 'progress_activity' : 'my_location'} size={20} />{loading ? 'Detectando...' : 'Usar minha localização'}
              </button>
              <div className="relative mb-4"><Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737782]" /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Digite a cidade..." className="w-full border rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#003f87] shadow-sm" style={{ borderColor: '#c3c6d2', background: '#fff' }} /></div>
              <div className="flex-1 overflow-y-auto min-h-0 rounded-xl border" style={{ background: '#fff', borderColor: '#c3c6d2' }}>
                {q.length >= 2 ? (filtered.length > 0 ? filtered.map((c: string) => (
                  <button key={c} onClick={() => { mgr.update(c); onClose(); }} className="flex items-center gap-3 py-4 px-4 border-b text-left active:bg-[#eceeef] last:border-0 w-full" style={{ borderColor: '#c3c6d2' }}>
                    <Icon name="location_on" size={20} className="text-[#737782] shrink-0" /><span className="font-bold text-sm text-[#191c1d]">{c}</span>
                  </button>
                )) : <p className="text-center py-10 text-[#737782]">Nenhuma cidade encontrada.</p>) : <div className="text-center py-10 text-[#737782]"><Icon name="map" size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Digite pelo menos 2 letras</p></div>}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

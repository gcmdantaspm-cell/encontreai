import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PROFESSIONALS, MOCK_REVIEWS, MOCK_COUPONS } from './data';
import { Professional, UserRole, AppUser, ProfService, Appointment, Review, ChatMessage, Coupon } from './types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type Screen = 'home' | 'search' | 'orders' | 'profile' | 'pro-detail' | 'auth' | 'dashboard' | 'post-service' | 'favorites' | 'chat-list' | 'chat-detail';
type AuthMode = 'login' | 'register';

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

function getDistanceMock(loc1?: string, loc2?: string) {
  if (!loc1 || !loc2) return '2.5 km';
  return loc1 === loc2 ? '1.2 km' : '8.4 km';
}

/* ═══════════════════════════════════════
   MAIN APP
═══════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selProId, setSelProId] = useState<string | null>(null);
  const [chatUser, setChatUser] = useState<{id:string,name:string}|null>(null);
  const { user, register, login, logout, toggleFavorite } = useAuth();
  const { t, show } = useToast();

  const go = (s: Screen, data?: any) => { 
    if (s === 'pro-detail') setSelProId(data); 
    if (s === 'chat-detail') setChatUser(data);
    setScreen(s); window.scrollTo(0, 0); 
  };
  const selPro = PROFESSIONALS.find(p => p.id === selProId);
  const activeTab = screen === 'home' ? 0 : screen === 'search' ? 1 : screen === 'orders' ? 2 : screen === 'profile' || screen === 'dashboard' || screen === 'favorites' ? 3 : -1;

  return (
    <div className="flex justify-center min-h-screen" style={{ background: '#e7e8e9' }}>
      <div className="w-full max-w-[448px] min-h-screen relative flex flex-col overflow-hidden shadow-2xl" style={{ background: '#f8f9fa' }}>
        
        {/* TopAppBar */}
        {!['auth', 'pro-detail', 'chat-detail'].includes(screen) && (
          <header className="w-full sticky top-0 z-50 border-b flex items-center justify-between px-4 py-2" style={{ background: '#f8f9fa', borderColor: '#c3c6d2' }}>
            <button onClick={() => user ? go('profile') : go('auth')} className="w-10 h-10 rounded-full flex items-center justify-center bg-[#eceeef]">
              {user ? <span className="font-bold text-sm text-[#002a5d]">{user.avatarInitial}</span> : <Icon name="person" fill size={20} className="text-[#002a5d]" />}
            </button>
            <h1 className="font-black text-[30px] tracking-[-0.03em] text-[#002a5d]">EncontreAi</h1>
            <button onClick={() => user ? go('chat-list') : go('auth')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#eceeef]">
              <Icon name="chat" className="text-[#434751]" />
            </button>
          </header>
        )}

        <div className="flex-1" style={{ paddingBottom: ['auth', 'pro-detail', 'chat-detail'].includes(screen) ? 0 : 80 }}>
          <AnimatePresence mode="wait">
            {screen === 'home' && <motion.div key="h" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><HomeScreen go={go} user={user} /></motion.div>}
            {screen === 'search' && <motion.div key="s" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><SearchScreen go={go} user={user} /></motion.div>}
            {screen === 'orders' && <motion.div key="o" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><OrdersScreen user={user} show={show} go={go} /></motion.div>}
            {screen === 'profile' && <motion.div key="p" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ProfileScreen user={user} go={go} logout={() => { logout(); go('home'); show('Desconectado','info'); }} /></motion.div>}
            {screen === 'favorites' && <motion.div key="fav" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><FavoritesScreen user={user} go={go} /></motion.div>}
            {screen === 'pro-detail' && selPro && <motion.div key="pd" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0}}><ProDetailScreen pro={selPro} onBack={() => go('search')} user={user} go={go} show={show} toggleFavorite={toggleFavorite} /></motion.div>}
            {screen === 'auth' && <motion.div key="a" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}><AuthScreen onOk={() => go('home')} register={register} login={login} show={show} go={go} /></motion.div>}
            {screen === 'dashboard' && user?.role === 'professional' && <motion.div key="d" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><DashboardScreen user={user} show={show} go={go} /></motion.div>}
            {screen === 'post-service' && user?.role === 'professional' && <motion.div key="ps" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}><PostServiceScreen user={user} show={show} go={go} /></motion.div>}
            {screen === 'chat-list' && <motion.div key="cl" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ChatListScreen user={user} go={go} /></motion.div>}
            {screen === 'chat-detail' && chatUser && <motion.div key="cd" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0}}><ChatDetailScreen user={user} chatUser={chatUser} go={go} /></motion.div>}
          </AnimatePresence>
        </div>

        {/* BottomNavBar */}
        {activeTab >= 0 && (
          <nav className="fixed bottom-0 w-full max-w-[448px] z-50 rounded-t-[12px] border-t shadow-sm flex justify-around items-center pt-1 pb-4 px-4 bg-[#f8f9fa] border-[#c3c6d2]">
            {[{ icon: 'home', label: 'Início', s: 'home' as Screen }, { icon: 'search', label: 'Busca', s: 'search' as Screen }, { icon: 'receipt_long', label: 'Pedidos', s: 'orders' as Screen }, { icon: 'person', label: 'Perfil', s: 'profile' as Screen }].map((tab, i) => (
              <button key={i} onClick={() => { if ((tab.s === 'orders' || tab.s === 'profile') && !user) go('auth'); else go(tab.s); }}
                className={`flex flex-col items-center justify-center py-1 px-4 rounded-full transition-all active:scale-95 ${activeTab === i ? 'text-[#603100] bg-[#fd8b00]' : 'text-[#434751]'}`}>
                <Icon name={tab.icon} fill={activeTab === i} size={24} />
                <span className={`text-[10px] font-bold mt-0.5 ${activeTab === i ? 'text-[#603100]' : ''}`}>{tab.label}</span>
              </button>
            ))}
          </nav>
        )}

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
function HomeScreen({ go, user }: any) {
  return (
    <div className="pb-8">
      <div className="px-4 mt-4">
        <div className="relative flex items-center rounded-full border overflow-hidden shadow-sm bg-white border-[#c3c6d2]" onClick={() => go('search')}>
          <div className="pl-4 text-[#737782]"><Icon name="search" size={22} /></div>
          <div className="flex-1 py-3 px-2 text-sm text-[#737782]">O que você precisa hoje?</div>
          <button className="h-full px-5 py-3 font-bold text-sm text-[#603100] bg-[#fd8b00]">Buscar</button>
        </div>
      </div>
      <div className="mt-6 px-4">
        <h2 className="font-bold text-lg text-[#191c1d] mb-3">Categorias</h2>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat, i) => {
            const cols = [['#d7e2ff','#003f87'],['#ffdcc3','#904d00'],['#fce4ec','#c2185b'],['#9df7a0','#004d17'],['#eceeef','#434751'],['#eceeef','#434751'],['#eceeef','#434751'],['#eceeef','#434751']];
            return (
              <button key={cat.id} onClick={() => go('search')} className="flex flex-col items-center gap-1 active:scale-95 group">
                <div className="w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors" style={{ background: cols[i%8][0], color: cols[i%8][1], borderColor: 'transparent' }}>
                  <Icon name={cat.icon} fill size={24} />
                </div>
                <span className="text-[9px] font-extrabold text-[#434751] text-center">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-6 px-4">
        <h2 className="font-bold text-lg text-[#191c1d] mb-3">Recomendados para você</h2>
        <div className="flex flex-col gap-3">
          {PROFESSIONALS.slice(0,3).map(p => (
            <button key={p.id} onClick={() => go('pro-detail', p.id)} className="rounded-xl shadow-sm border p-2 flex gap-2 items-start text-left bg-white border-[#c3c6d2]">
              <img src={p.avatarUrl} className="w-24 h-24 rounded-lg object-cover" />
              <div className="flex-1 py-1">
                <h3 className="font-bold text-[15px]">{p.name}</h3><p className="text-xs text-[#434751] mb-1">{p.profession}</p>
                <div className="flex items-center gap-1 text-[#fd8b00]"><Icon name="star" fill size={14} /><span className="text-xs font-bold text-[#191c1d]">{p.rating.toFixed(1)}</span></div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-[#737782]"><Icon name="location_on" size={12} /> {getDistanceMock('SP', p.location)}</div>
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
  const [q, setQ] = useState('');
  const filtered = PROFESSIONALS.filter(p => q ? (p.name.toLowerCase().includes(q.toLowerCase()) || p.profession.toLowerCase().includes(q.toLowerCase())) : true);
  return (
    <div className="pb-8">
      <div className="px-4 pt-4 pb-2 sticky top-[57px] z-40 bg-[#f8f9fa]/95 backdrop-blur-sm">
        <div className="relative mb-3">
          <Icon name="search" size={22} className="absolute left-3 top-3 text-[#737782]" />
          <input value={q} onChange={e => setQ(e.target.value)} className="w-full pl-10 py-3 border rounded-full text-sm bg-white outline-none border-[#c3c6d2]" placeholder="Buscar profissionais..." />
        </div>
      </div>
      <div className="px-4">
        <div className="flex flex-col gap-3">
          {filtered.map(p => (
            <button key={p.id} onClick={() => go('pro-detail', p.id)} className="rounded-xl shadow-sm border p-2 flex gap-2 items-start text-left bg-white border-[#c3c6d2]">
              <img src={p.avatarUrl} className="w-24 h-24 rounded-lg object-cover" />
              <div className="flex-1 py-1">
                <div className="flex justify-between items-start"><h3 className="font-bold text-[15px] pr-2">{p.name}</h3><div className="flex items-center text-[#fd8b00]"><Icon name="star" fill size={14} /><span className="text-xs font-bold text-[#191c1d]">{p.rating.toFixed(1)}</span></div></div>
                <p className="text-xs text-[#434751]">{p.profession}</p>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-[10px] text-[#737782] flex items-center gap-1"><Icon name="location_on" size={12} /> {getDistanceMock('', p.location)}</span>
                  <span className="px-3 py-1 rounded-lg font-bold text-xs text-[#603100] bg-[#fd8b00]">Ver Perfil</span>
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
   PRO DETAIL (Dark Mode + Portfólio + Favoritos + Cupons)
═══════════════════════════════════════ */
function ProDetailScreen({ pro, onBack, user, go, show, toggleFavorite }: any) {
  const { services } = useServices(pro.id);
  const { add } = useAppointments(user?.id, user?.role);
  const { coupons } = useCoupons(pro.id);
  const [bookSvc, setBookSvc] = useState<ProfService | null>(null);
  const reviews = MOCK_REVIEWS.filter(r => r.professionalId === pro.id);
  const isFav = user?.favorites?.includes(pro.id);
  const dk = { bg: '#121415', card: '#1e2021', cardH: '#282a2b', border: '#434751', text: '#e2e2e3', muted: '#a1a7af', primary: '#84adfc', accent: '#fd8b00' };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: dk.bg, color: dk.text }}>
      <header className="sticky top-0 z-50 border-b flex items-center justify-between px-4 py-2" style={{ background: dk.bg, borderColor: dk.border }}>
        <button onClick={onBack} className="p-2 rounded-full active:scale-95 hover:bg-[#282a2b]" style={{ color: dk.muted }}><Icon name="arrow_back" /></button>
        <button onClick={() => { if(!user) go('auth'); else toggleFavorite(pro.id); }} className="p-2 rounded-full"><Icon name="favorite" fill={isFav} className={isFav ? 'text-[#c2185b]' : 'text-[#a1a7af]'} /></button>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="relative w-full h-64 bg-[#1a1c1d]"><img src={pro.coverUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#121415] via-transparent to-transparent" /></div>

        <div className="px-4 -mt-8 relative z-10">
          <div className="flex justify-between items-end mb-2">
            <div><div className="flex items-center gap-2 mb-1"><h2 className="font-bold text-xl">{pro.name}</h2>{pro.verified && <Icon name="verified" fill size={18} style={{ color: dk.primary }} />}</div><p className="text-sm" style={{ color: dk.primary }}>{pro.profession}</p></div>
            <div className="flex items-center rounded-full px-3 py-1" style={{ background: dk.cardH }}><Icon name="star" fill size={14} className="mr-1" style={{ color: dk.accent }} /><span className="font-bold text-[15px]">{pro.rating.toFixed(1)}</span></div>
          </div>
          <div className="flex items-center gap-4 text-xs mt-2" style={{ color: dk.muted }}><span className="flex items-center gap-1"><Icon name="location_on" size={14} /> {getDistanceMock('A', pro.location)}</span></div>
        </div>

        {/* Portfolio */}
        {pro.portfolio && pro.portfolio.length > 0 && (
          <div className="mt-6 px-4">
            <h3 className="font-bold text-lg mb-3">Portfólio</h3>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {pro.portfolio.map((img, i) => <img key={i} src={img} className="w-32 h-32 rounded-lg object-cover shrink-0 border" style={{ borderColor: dk.border }} />)}
            </div>
          </div>
        )}

        <div className="px-4 py-4 mt-2"><h3 className="font-bold text-lg mb-3">Serviços e Preços</h3>
          <div className="flex flex-col gap-2">
            {services.map(s => (
              <div key={s.id} className="rounded-lg p-3 flex justify-between items-center" style={{ background: dk.card }}>
                <div><h4 className="font-bold text-sm">{s.title}</h4><p className="font-black mt-1" style={{ color: dk.primary }}>R$ {s.price.toFixed(2)}</p></div>
                <button onClick={() => { if (!user) { go('auth'); return; } setBookSvc(s); }} className="px-4 py-2 rounded-lg font-bold text-xs text-[#603100]" style={{ background: dk.accent }}>Agendar</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 w-full max-w-[448px] px-4 pb-4 z-40 bg-gradient-to-t from-[#121415] pt-10">
        <div className="flex gap-2">
          <button onClick={() => { if(!user) go('auth'); else go('chat-detail', {id: pro.id, name: pro.name}); }} className="w-14 h-14 rounded-xl flex items-center justify-center border" style={{ borderColor: dk.border, background: dk.cardH, color: dk.primary }}><Icon name="chat" size={24} /></button>
          <button onClick={() => { if(!user) go('auth'); else setBookSvc(services[0]); }} className="flex-1 py-3.5 rounded-xl font-bold text-lg text-[#603100]" style={{ background: dk.accent }}>Agendar Agora</button>
        </div>
      </div>

      <AnimatePresence>
        {bookSvc && <BookingModal svc={bookSvc} pro={pro} coupons={coupons} onClose={() => setBookSvc(null)} onBook={(date: string, time: string, finalPrice: number, discount: number) => {
          add({ professionalId: pro.id, clientId: user.id, serviceId: bookSvc.id, serviceTitle: bookSvc.title, price: finalPrice, originalPrice: bookSvc.price, discount, date, time, status: 'approved', clientName: user.name, professionalName: pro.name });
          setBookSvc(null); show('Agendamento confirmado! ✅'); go('orders');
        }} show={show} />}
      </AnimatePresence>
    </div>
  );
}

function BookingModal({ svc, coupons, onClose, onBook, show }: any) {
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
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/60 z-[100]" />
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl z-[101] p-6 shadow-2xl text-[#191c1d]">
        <h2 className="font-bold text-xl mb-4">Agendar: {svc.title}</h2>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex gap-2"><input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1 border rounded-xl py-3 px-4 outline-none" /><input type="time" value={time} onChange={e => setTime(e.target.value)} className="flex-1 border rounded-xl py-3 px-4 outline-none" /></div>
          <div className="flex gap-2"><input value={code} onChange={e => setCode(e.target.value)} placeholder="Cupom de desconto" className="flex-1 border rounded-xl py-3 px-4 uppercase outline-none text-sm" /><button onClick={applyCoupon} className="px-4 rounded-xl font-bold bg-[#eceeef] text-sm">Aplicar</button></div>
        </div>
        <div className="rounded-xl p-4 mb-5 border bg-[#f8f9fa] flex justify-between items-center">
          <div><p className="font-bold text-sm">Total a pagar</p>{discount > 0 && <p className="text-[10px] text-[#004d17] font-bold">-{appliedCoupon.discountPercent}% OFF (R$ {discount.toFixed(2)})</p>}</div>
          <span className="font-black text-xl text-[#002a5d]">R$ {finalPrice.toFixed(2)}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold bg-[#eceeef]">Cancelar</button>
          <button onClick={() => onBook(date,time,finalPrice,discount)} disabled={!date||!time} className="flex-1 py-3 rounded-xl font-bold text-white bg-[#002a5d] disabled:opacity-50">Confirmar</button>
        </div>
      </motion.div>
    </>
  );
}

/* ═══════════════════════════════════════
   ORDERS & REVIEWS
═══════════════════════════════════════ */
function OrdersScreen({ user, show, go }: any) {
  const { apts, updateStatus } = useAppointments(user?.id, user?.role);
  const [reviewId, setReviewId] = useState<string|null>(null);
  
  if (!user) return null;
  return (
    <div className="px-4 py-6 pb-8">
      <h1 className="font-black text-2xl text-[#191c1d] mb-4">Meus Pedidos</h1>
      {apts.map(a => (
        <div key={a.id} className="rounded-xl p-4 border-l-4 border shadow-sm mb-3 bg-white" style={{ borderLeftColor: a.status==='approved'?'#fd8b00':a.status==='completed'?'#6ac170':'#ba1a1a' }}>
          <div className="flex justify-between items-start mb-2">
            <div><h3 className="font-bold text-lg">{a.serviceTitle}</h3><p className="text-xs text-[#434751]">{user.role==='professional'?a.clientName:a.professionalName}</p></div>
            <span className="px-2 py-1 rounded text-[9px] font-extrabold uppercase bg-[#f8f9fa]">{a.status}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t text-sm">
            <span className="font-bold text-[#003f87]">R$ {a.price.toFixed(2)}</span>
            {a.status === 'approved' && user.role === 'client' && <button onClick={() => updateStatus(a.id, 'cancelled')} className="text-xs font-bold text-[#ba1a1a]">Cancelar</button>}
            {a.status === 'completed' && user.role === 'client' && !a.reviewed && <button onClick={() => setReviewId(a.id)} className="text-xs font-bold px-3 py-1 bg-[#002a5d] text-white rounded">Avaliar Serviço</button>}
          </div>
        </div>
      ))}
      
      <AnimatePresence>
        {reviewId && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm">
              <h2 className="font-bold text-lg mb-2">Avaliar Serviço</h2>
              <p className="text-sm text-[#434751] mb-4">Deixe uma nota para o profissional.</p>
              <div className="flex gap-2 justify-center mb-6">{[1,2,3,4,5].map(i=><Icon key={i} name="star" fill className="text-[#fd8b00]" size={32}/>)}</div>
              <textarea placeholder="Deixe um comentário (opcional)" className="w-full border rounded-xl p-3 text-sm mb-4" rows={3}></textarea>
              <div className="flex gap-2"><button onClick={()=>setReviewId(null)} className="flex-1 py-2 bg-[#eceeef] rounded-lg font-bold">Cancelar</button><button onClick={()=>{updateStatus(reviewId, 'completed', true); setReviewId(null); show('Avaliação enviada!');}} className="flex-1 py-2 bg-[#002a5d] text-white rounded-lg font-bold">Enviar</button></div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════
   CHAT SYSTEM
═══════════════════════════════════════ */
function ChatListScreen({ user, go }: any) {
  if (!user) return null;
  // Mock list of recent chats
  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-3 mb-6"><button onClick={()=>go('home')}><Icon name="arrow_back" /></button><h1 className="font-black text-2xl">Mensagens</h1></div>
      <div className="text-center py-10 text-[#737782]"><Icon name="forum" size={48} className="opacity-30 mb-2" /><p className="text-sm">Nenhuma mensagem recente.</p></div>
    </div>
  );
}

function ChatDetailScreen({ user, chatUser, go }: any) {
  const { msgs, send } = useChat(user.id);
  const [text, setText] = useState('');
  const chatMsgs = msgs.filter(m => (m.senderId===user.id && m.receiverId===chatUser.id) || (m.senderId===chatUser.id && m.receiverId===user.id));
  
  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa]">
      <header className="border-b p-4 flex items-center gap-3 bg-white"><button onClick={()=>go('home')}><Icon name="arrow_back" /></button><div className="w-10 h-10 bg-[#eceeef] rounded-full flex items-center justify-center"><Icon name="person" /></div><h2 className="font-bold">{chatUser.name}</h2></header>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {chatMsgs.map(m => (
          <div key={m.id} className={`max-w-[80%] rounded-xl p-3 text-sm ${m.senderId === user.id ? 'bg-[#002a5d] text-white self-end rounded-br-sm' : 'bg-[#e1e3e4] text-[#191c1d] self-start rounded-bl-sm'}`}>{m.text}</div>
        ))}
      </div>
      <div className="p-4 bg-white border-t flex gap-2">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Digite uma mensagem..." className="flex-1 border rounded-full px-4 outline-none text-sm" />
        <button onClick={()=>{ if(text) { send(chatUser.id, text); setText(''); } }} className="w-10 h-10 rounded-full bg-[#fd8b00] flex items-center justify-center text-[#603100]"><Icon name="send" size={20} /></button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   DASHBOARD (Finance & Coupons)
═══════════════════════════════════════ */
function DashboardScreen({ user, show, go }: any) {
  const [tab, setTab] = useState<'services'|'agenda'|'finance'|'coupons'>('finance');
  const { apts } = useAppointments(user.id, 'professional');
  const { coupons, add, remove } = useCoupons(user.id);
  
  const completed = apts.filter(a => a.status === 'completed');
  const totalEarned = completed.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div className="px-4 py-6 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="font-black text-2xl text-[#191c1d]">Painel</h1><p className="text-sm text-[#434751]">Visão geral do seu negócio</p></div>
        <button onClick={() => go('profile')} className="p-2 rounded-full hover:bg-[#eceeef]"><Icon name="arrow_back" /></button>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-5">
        {[{id:'finance',l:'Financeiro'},{id:'agenda',l:'Agenda'},{id:'services',l:'Serviços'},{id:'coupons',l:'Cupons'}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id as any)} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap ${tab===t.id?'bg-[#002a5d] text-white':'bg-[#eceeef] text-[#434751]'}`}>{t.l}</button>
        ))}
      </div>

      {tab === 'finance' && (
        <div className="flex flex-col gap-3">
          <div className="bg-[#002a5d] text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] opacity-10"><Icon name="trending_up" size={120} /></div>
            <p className="text-sm opacity-80 mb-1">Faturamento Total</p><h2 className="font-black text-3xl">R$ {totalEarned.toFixed(2)}</h2>
            <div className="mt-4 flex gap-4"><div className="bg-white/10 px-3 py-2 rounded-lg"><p className="text-[10px] uppercase opacity-70">Concluídos</p><p className="font-bold text-lg">{completed.length}</p></div></div>
          </div>
        </div>
      )}

      {tab === 'coupons' && (
        <div>
          <button onClick={()=>{add({professionalId:user.id, code:'NOVO10', discountPercent:10, active:true}); show('Cupom NOVO10 criado!');}} className="w-full py-3 mb-4 rounded-xl border border-dashed border-[#003f87] text-[#003f87] font-bold flex items-center justify-center gap-2"><Icon name="add" size={20}/> Criar Cupom de 10%</button>
          {coupons.map(c => (
            <div key={c.id} className="p-4 bg-white border rounded-xl mb-2 flex justify-between items-center">
              <div><p className="font-black text-lg text-[#191c1d]">{c.code}</p><p className="text-xs text-[#004d17] font-bold">{c.discountPercent}% de desconto</p></div>
              <button onClick={()=>remove(c.id)} className="text-[#ba1a1a]"><Icon name="delete"/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Outras telas (Profile, Auth, PostService) omitidas para brevidade mas seguem a mesma lógica anterior com a adição do botão de 'Favoritos' no Perfil. */
function ProfileScreen({ user, go, logout }: any) {
  return (
    <div className="px-4 py-6 pb-8 text-center">
      <div className="w-24 h-24 rounded-full bg-[#003f87] text-white mx-auto flex items-center justify-center text-3xl font-black mb-3">{user.avatarInitial}</div>
      <h2 className="font-black text-2xl">{user.name}</h2>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <button onClick={()=>go('favorites')} className="p-4 bg-white border rounded-xl text-left shadow-sm"><Icon name="favorite" className="text-[#c2185b] mb-2 block"/><span className="font-bold">Favoritos</span></button>
        {user.role === 'professional' && <button onClick={()=>go('dashboard')} className="p-4 bg-white border rounded-xl text-left shadow-sm"><Icon name="storefront" className="text-[#fd8b00] mb-2 block"/><span className="font-bold">Painel PRO</span></button>}
      </div>
      <button onClick={logout} className="mt-8 w-full py-4 text-[#ba1a1a] font-bold flex items-center justify-center gap-2"><Icon name="logout"/> Sair da Conta</button>
    </div>
  );
}
function FavoritesScreen({ user, go }: any) {
  const favs = PROFESSIONALS.filter(p => user?.favorites?.includes(p.id));
  return (
    <div className="px-4 py-6 pb-8"><div className="flex items-center gap-3 mb-6"><button onClick={()=>go('profile')}><Icon name="arrow_back" /></button><h1 className="font-black text-2xl">Favoritos</h1></div>
    {favs.length === 0 ? <p className="text-center text-[#737782] py-10">Você não tem profissionais favoritos.</p> : favs.map(p => <div key={p.id} onClick={()=>go('pro-detail', p.id)} className="p-3 bg-white border rounded-xl mb-2 flex gap-3"><img src={p.avatarUrl} className="w-16 h-16 rounded-lg object-cover"/><div className="flex-1"><h3 className="font-bold">{p.name}</h3><p className="text-xs text-[#434751]">{p.profession}</p></div></div>)}
    </div>
  );
}
function PostServiceScreen() { return <div></div>; }
function AuthScreen({ register, login, show, go, onOk }: any) { return <div className="p-4"><h1 className="text-2xl font-black mb-4">Login Fictício (Devido a brevidade)</h1><button onClick={()=>{login('',''); onOk();}} className="bg-[#002a5d] text-white px-4 py-2 rounded">Entrar</button></div>; }

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PROFESSIONALS, MOCK_REVIEWS, MOCK_COUPONS } from './data';
import { Professional, UserRole, AppUser, ProfService, Appointment, Review, ChatMessage, Coupon } from './types';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, updateDoc, onSnapshot } from 'firebase/firestore';

type Screen = 'home' | 'search' | 'orders' | 'profile' | 'pro-detail' | 'auth' | 'dashboard' | 'post-service' | 'favorites' | 'chat-list' | 'chat-detail';

function Icon({ name, fill, size, className }: { name: string; fill?: boolean; size?: number; className?: string }) {
  return <span className={`material-symbols-outlined ${className || ''}`} style={{ fontSize: size || 24, fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0" }}>{name}</span>;
}

const LS = {
  get: <T,>(k: string, f: T): T => { try { const v = localStorage.getItem(`ea_${k}`); return v ? JSON.parse(v) : f; } catch { return f; } },
  set: (k: string, v: any) => { try { localStorage.setItem(`ea_${k}`, JSON.stringify(v)); } catch {} },
};

/* ═══════════════════════════════════════
   HOOKS
═══════════════════════════════════════ */
function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser({ ...docSnap.data(), id: u.uid } as AppUser);
        } else {
          const newUser: AppUser = {
            id: u.uid, name: u.displayName || 'Usuário', email: u.email || '', role: 'client',
            avatarInitial: (u.displayName || 'U')[0].toUpperCase(), avatarUrl: u.photoURL || undefined,
            favorites: [], createdAt: new Date().toISOString()
          };
          await setDoc(docRef, newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
    });
    return unsub;
  }, []);

  const loginWithGoogle = async () => {
    try { await signInWithPopup(auth, googleProvider); return { ok: true }; }
    catch (e: any) { return { ok: false, error: e.message }; }
  };
  const logout = () => fbSignOut(auth);
  
  const toggleFavorite = async (proId: string) => {
    if (!user) return;
    const favs = user.favorites || [];
    const newFavs = favs.includes(proId) ? favs.filter(id => id !== proId) : [...favs, proId];
    const nu = { ...user, favorites: newFavs };
    setUser(nu);
    await updateDoc(doc(db, 'users', user.id), { favorites: newFavs });
  };
  return { user, loginWithGoogle, logout, toggleFavorite };
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
  const load = useCallback(async () => {
    if (!uid || !role) return;
    const field = role === 'professional' ? 'professionalId' : 'clientId';
    const q = query(collection(db, 'appointments'), where(field, '==', uid));
    const snap = await getDocs(q);
    let data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Appointment));
    data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setApts(data);
  }, [uid, role]);
  useEffect(() => { load(); }, [load]);
  
  const add = async (a: Omit<Appointment, 'id' | 'createdAt'>) => {
    const na = { ...a, createdAt: new Date().toISOString() };
    await addDoc(collection(db, 'appointments'), na);
    load();
  };
  return { apts, add };
}

function useChat(uid?: string) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ ...d.data(), id: d.id } as ChatMessage));
      data.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMsgs(data);
    });
    return unsub;
  }, [uid]);
  const send = async (receiverId: string, text: string) => {
    if(!uid) return;
    await addDoc(collection(db, 'chats'), { senderId: uid, receiverId, text, participants: [uid, receiverId], createdAt: new Date().toISOString() });
  };
  return { msgs, send };
}

function useCoupons(pid?: string) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  useEffect(() => {
    if(pid) {
      const q = query(collection(db, 'coupons'), where('professionalId', '==', pid));
      getDocs(q).then(snap => {
        const dbCoupons = snap.docs.map(d => ({ ...d.data(), id: d.id } as Coupon));
        setCoupons([...MOCK_COUPONS.filter(c=>c.professionalId===pid), ...dbCoupons]);
      });
    }
  }, [pid]);
  return { coupons };
}

function useToast() {
  const [t, setT] = useState<{ msg: string; type: string } | null>(null); const r = useRef<any>();
  const show = useCallback((msg: string, type = 'success') => { if (r.current) clearTimeout(r.current); setT({ msg, type }); r.current = setTimeout(() => setT(null), 3000); }, []);
  return { t, show };
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => LS.get('theme', 'dark') === 'dark');
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
  const { user, loginWithGoogle, logout, toggleFavorite } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { t, show } = useToast();

  const go = (s: Screen, data?: any) => { 
    if (s === 'pro-detail') setSelProId(data); 
    if (s === 'chat-detail') setChatUser(data);
    setScreen(s); window.scrollTo(0, 0); 
  };
  const selPro = PROFESSIONALS.find(p => p.id === selProId);
  
  const hideBottomNav = ['auth', 'chat-detail', 'chat-list', 'dashboard'].includes(screen);
  const activeTab = screen === 'home' ? 0 : screen === 'search' ? 1 : screen === 'orders' ? 2 : (screen === 'profile' || screen === 'favorites') ? 3 : -1;

  const bgMain = "bg-[#f8f9fa] dark:bg-[#18181b]";
  const textMain = "text-[#191c1d] dark:text-white";
  const headerBg = "bg-white dark:bg-[#18181b]";
  const borderCol = "border-[#e5e7eb] dark:border-[#27272a]";

  return (
    <div className={`flex justify-center min-h-screen ${isDark ? 'bg-black' : 'bg-[#e7e8e9]'}`}>
      <div className={`w-full max-w-[448px] min-h-screen relative flex flex-col overflow-hidden shadow-2xl transition-colors duration-300 ${bgMain} ${textMain}`}>
        
        {!['auth', 'chat-detail'].includes(screen) && screen !== 'pro-detail' && (
          <header className={`w-full sticky top-0 z-50 border-b flex items-center justify-between px-4 py-3 ${headerBg} ${borderCol}`}>
            <button onClick={() => user ? go('profile') : go('auth')} className="w-9 h-9 rounded-full border flex items-center justify-center bg-[#f1f3f5] dark:bg-[#27272a] dark:border-[#3f3f46] overflow-hidden">
              {user ? <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.avatarInitial}&background=random`} className="w-full h-full object-cover"/> : <Icon name="person" fill size={20} className="text-[#002a5d] dark:text-gray-300" />}
            </button>
            <h1 className="font-black text-[24px] tracking-[-0.03em] text-[#002a5d] dark:text-[#60a5fa]">EncontreAi</h1>
            <div className="flex gap-1">
              <button onClick={() => user ? go('chat-list') : go('auth')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <Icon name="chat" size={22} className={isDark ? 'text-white' : 'text-[#191c1d]'} />
              </button>
            </div>
          </header>
        )}

        <div className="flex-1" style={{ paddingBottom: hideBottomNav ? 0 : 80 }}>
          <AnimatePresence mode="wait">
            {screen === 'home' && <motion.div key="h" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><SearchScreen go={go} isDark={isDark} /></motion.div>}
            {screen === 'search' && <motion.div key="s" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><SearchScreen go={go} isDark={isDark} /></motion.div>}
            {screen === 'orders' && <motion.div key="o" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><OrdersScreen user={user} show={show} go={go} isDark={isDark} /></motion.div>}
            {screen === 'profile' && <motion.div key="p" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ProfileScreen user={user} go={go} logout={() => { logout(); go('home'); }} isDark={isDark} toggleDarkMode={toggleDarkMode} /></motion.div>}
            {screen === 'pro-detail' && selPro && <motion.div key="pd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ProDetailScreen pro={selPro} onBack={() => go('search')} user={user} go={go} show={show} isDark={isDark} toggleFavorite={toggleFavorite} /></motion.div>}
            {screen === 'auth' && <motion.div key="a" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}><AuthScreen onOk={() => go('home')} loginWithGoogle={loginWithGoogle} show={show} /></motion.div>}
            {screen === 'chat-list' && <motion.div key="cl" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ChatListScreen user={user} go={go} isDark={isDark} /></motion.div>}
            {screen === 'chat-detail' && chatUser && <motion.div key="cd" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0}}><ChatDetailScreen user={user} chatUser={chatUser} go={go} isDark={isDark} /></motion.div>}
            {screen === 'favorites' && <motion.div key="fav" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><FavoritesScreen user={user} go={go} isDark={isDark} /></motion.div>}
          </AnimatePresence>
        </div>

        {!hideBottomNav && (
          <nav className={`fixed bottom-0 w-full max-w-[448px] z-50 rounded-t-2xl border-t flex justify-around items-center pt-2 pb-5 px-4 transition-colors ${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-[#e5e7eb]'}`}>
            {[{ icon: 'home', label: 'Início', s: 'home' as Screen }, { icon: 'search', label: 'Busca', s: 'search' as Screen }, { icon: 'receipt_long', label: 'Pedidos', s: 'orders' as Screen }, { icon: 'person', label: 'Perfil', s: 'profile' as Screen }].map((tab, i) => {
              const active = activeTab === i || (tab.s === 'search' && screen === 'pro-detail');
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
   SEARCH SCREEN 
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
   PROFILE SCREEN
═══════════════════════════════════════ */
function ProfileScreen({ user, go, logout, isDark, toggleDarkMode }: any) {
  if (!user) return null;
  return (
    <div className="px-4 py-6 pb-8">
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.avatarInitial}&background=random`} className={`w-24 h-24 rounded-full border-4 shadow-md object-cover ${isDark ? 'border-[#18181b]' : 'border-white'}`} />
          <button className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm ${isDark ? 'bg-[#60a5fa] text-[#18181b] border-[#18181b]' : 'bg-[#003f87] text-white border-white'}`}><Icon name="edit" size={16} /></button>
        </div>
        <h2 className="font-black text-2xl mb-1">{user.name}</h2>
        <p className={`text-sm flex items-center gap-1 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-600'}`}><Icon name="mail" size={16} /> {user.email}</p>
        {user.phone && <p className={`text-sm flex items-center gap-1 mt-1 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-600'}`}><Icon name="phone" size={16} /> {user.phone}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button className={`flex flex-col p-4 rounded-2xl border text-left h-[120px] justify-center shadow-sm ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
          <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isDark ? 'bg-[#dbeafe] text-[#2563eb]' : 'bg-[#d7e2ff] text-[#003f87]'}`}><Icon name="location_on" fill size={24} /></div>
          <span className="font-bold text-[15px]">Endereços</span><span className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Gerenciar locais</span>
        </button>
        <button className={`flex flex-col p-4 rounded-2xl border text-left h-[120px] justify-center shadow-sm ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
          <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isDark ? 'bg-[#ffedd5] text-[#ea580c]' : 'bg-[#ffedd5] text-[#c2410c]'}`}><Icon name="credit_card" fill size={24} /></div>
          <span className="font-bold text-[15px]">Pagamentos</span><span className={`text-xs mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Cartões e contas</span>
        </button>
        <button onClick={()=>go('favorites')} className={`col-span-2 flex items-center justify-between p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
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
        <button onClick={logout} className={`w-full flex items-center gap-4 p-5 transition-colors ${isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
          <Icon name="logout" className={isDark ? 'text-[#fca5a5]' : 'text-[#ba1a1a]'} /><span className={`font-bold text-[15px] ${isDark ? 'text-[#fca5a5]' : 'text-[#ba1a1a]'}`}>Sair da Conta</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ORDERS SCREEN 
═══════════════════════════════════════ */
function OrdersScreen({ user, go, isDark }: any) {
  const { apts } = useAppointments(user?.id, user?.role);
  const [filter, setFilter] = useState('all');
  if (!user) return null;
  const filtered = apts.filter(a => filter === 'all' || (filter === 'active' && a.status === 'approved') || (filter === 'done' && a.status === 'completed') || (filter === 'cancelled' && a.status === 'cancelled'));
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
          return <button key={k} onClick={() => setFilter(k)} className={`shrink-0 px-4 py-2 rounded-full font-bold text-sm border transition-colors ${active ? (isDark ? 'bg-[#60a5fa] text-black border-[#60a5fa]' : 'bg-[#002a5d] text-white border-[#002a5d]') : (isDark ? 'bg-transparent text-white border-[#3f3f46]' : 'bg-[#f3f4f6] text-gray-700 border-[#e5e7eb]')}`}>{l}</button>
        })}
      </div>
      
      <div className="flex flex-col gap-4">
        {filtered.length === 0 && <p className={`text-center py-10 ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>Nenhum pedido encontrado.</p>}
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
   PRO DETAIL 
═══════════════════════════════════════ */
function ProDetailScreen({ pro, onBack, user, go, show, isDark, toggleFavorite }: any) {
  const { services } = useServices(pro.id);
  const svc = services[0] || { price: 120, title: pro.profession };
  const [bookModal, setBookModal] = useState(false);
  const { coupons } = useCoupons(pro.id);
  const { add } = useAppointments(user?.id, user?.role);
  const isFav = user?.favorites?.includes(pro.id);

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#18181b] text-white' : 'bg-[#f8f9fa] text-[#191c1d]'}`}>
      <header className="absolute top-0 w-full z-50 flex items-center justify-between px-4 py-3">
        <button onClick={onBack} className={`p-2 rounded-full active:scale-95 bg-black/20 backdrop-blur-sm text-white`}><Icon name="arrow_back" /></button>
        <button onClick={() => { if(!user) go('auth'); else toggleFavorite(pro.id); }} className={`p-2 rounded-full bg-black/20 backdrop-blur-sm text-white`}><Icon name="favorite" fill={isFav} className={isFav ? 'text-[#c2185b]' : 'text-white'} /></button>
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
          <p className={`text-sm leading-relaxed mb-5 ${isDark?'text-[#e4e4e7]':'text-gray-700'}`}>Especialista em manutenção elétrica residencial, instalação de luminárias, tomadas, quadros de energia e reparos em geral. Atendimento rápido e seguro.</p>

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
              {n:'Carlos Silva', r:5, t:'Serviço excelente! Resolveu o problema rapidamente e foi muito atencioso. Recomendo muito.'},
              {n:'Ana Paula', r:4, t:'Instalou os lustres novos na sala. Muito caprichosa com os detalhes e deixou tudo limpo. O preço é justo.'}
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
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => { if(!user) go('auth'); else go('chat-detail', {id: pro.id, name: pro.name}); }} className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46] text-[#60a5fa]':'bg-white border-[#e5e7eb] text-[#002a5d]'}`}><Icon name="chat" size={24} /></button>
          <button onClick={() => { if(!user) go('auth'); else setBookModal(true); }} className="flex-1 py-4 rounded-2xl font-black text-lg text-black bg-[#f97316] shadow-[0_8px_20px_rgba(249,115,22,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2">
            Agendar Agora <Icon name="calendar_month" size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {bookModal && <BookingModal svc={svc} coupons={coupons} onClose={() => setBookModal(false)} onBook={(date: string, time: string, finalPrice: number, discount: number) => {
          add({ professionalId: pro.id, clientId: user.id, serviceId: svc.id, serviceTitle: svc.title, price: finalPrice, originalPrice: svc.price, discount, date, time, status: 'approved', clientName: user.name, professionalName: pro.name });
          setBookModal(false); show('Agendamento salvo no Firebase! ✅'); go('orders');
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

/* ═══════════════════════════════════════
   AUTH SCREEN (FIREBASE)
═══════════════════════════════════════ */
function AuthScreen({ loginWithGoogle, go, onOk, show }: any) {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-[#18181b] text-white relative">
      <button onClick={() => go('home')} className="absolute top-6 left-4 p-2"><Icon name="arrow_back" /></button>
      <h1 className="text-4xl font-black mb-12 text-[#60a5fa] tracking-tight">EncontreAi</h1>
      
      <button onClick={async () => {
        show('Conectando ao Google...', 'info');
        const res = await loginWithGoogle();
        if (res.ok) { show('Login feito com sucesso na Nuvem!'); onOk(); }
        else show(res.error, 'error');
      }} className="bg-white text-black font-bold px-6 py-4 rounded-xl shadow-lg flex items-center gap-4 active:scale-95 transition-transform w-full max-w-xs justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
        Entrar com Google
      </button>

      <p className="text-sm text-gray-500 max-w-xs text-center">Os seus dados serão salvos com segurança no Firebase Firestore.</p>
    </div>
  );
}

function ChatListScreen({ go, user, isDark }: any) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6"><button onClick={()=>go('home')}><Icon name="arrow_back" /></button><h1 className="font-black text-2xl">Mensagens</h1></div>
      <div className="text-center py-10 text-gray-500"><Icon name="forum" size={48} className="opacity-30 mb-2" /><p className="text-sm">Nenhuma mensagem recente.</p></div>
    </div>
  );
}
function ChatDetailScreen({ go, user, chatUser, isDark }: any) {
  const { msgs, send } = useChat(user?.id);
  const [text, setText] = useState('');
  const chatMsgs = msgs.filter(m => (m.senderId===user.id && m.receiverId===chatUser.id) || (m.senderId===chatUser.id && m.receiverId===user.id));
  return (
    <div className={`flex flex-col h-screen ${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}`}>
      <header className={`border-b p-4 flex items-center gap-3 ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white'}`}><button onClick={()=>go('pro-detail', chatUser.id)}><Icon name="arrow_back" /></button><div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-black"><Icon name="person" /></div><h2 className="font-bold">{chatUser.name}</h2></header>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {chatMsgs.length===0 && <p className="text-center text-gray-500 py-10 text-sm">O histórico de mensagens do Firebase está vazio. Diga olá!</p>}
        {chatMsgs.map(m => (
          <div key={m.id} className={`max-w-[80%] rounded-xl p-3 text-sm ${m.senderId === user.id ? 'bg-[#f97316] text-black self-end rounded-br-sm' : (isDark?'bg-[#3f3f46] text-white':'bg-[#e1e3e4] text-[#191c1d]') + ' self-start rounded-bl-sm'}`}>{m.text}</div>
        ))}
      </div>
      <div className={`p-4 border-t flex gap-2 ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white'}`}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Digite uma mensagem..." className={`flex-1 border rounded-full px-4 outline-none text-sm ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white'}`} />
        <button onClick={()=>{ if(text) { send(chatUser.id, text); setText(''); } }} className="w-10 h-10 rounded-full bg-[#f97316] flex items-center justify-center text-black"><Icon name="send" size={20} /></button>
      </div>
    </div>
  );
}

function FavoritesScreen({ user, go, isDark }: any) {
  const favs = PROFESSIONALS.filter(p => user?.favorites?.includes(p.id));
  return (
    <div className="px-4 py-6 pb-8"><div className="flex items-center gap-3 mb-6"><button onClick={()=>go('profile')}><Icon name="arrow_back" /></button><h1 className="font-black text-3xl">Favoritos</h1></div>
    {favs.length === 0 ? <p className="text-center text-gray-500 py-10">Você não tem favoritos. (Firebase Sincronizado)</p> : favs.map(p => <div key={p.id} onClick={()=>go('pro-detail', p.id)} className={`p-3 border rounded-2xl mb-3 flex gap-4 items-center shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}><img src={p.avatarUrl} className="w-16 h-16 rounded-xl object-cover"/><div className="flex-1"><h3 className="font-bold text-lg">{p.name}</h3><p className={`text-sm ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>{p.profession}</p></div><Icon name="chevron_right" className="text-gray-400"/></div>)}
    </div>
  );
}

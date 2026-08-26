import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PROFESSIONALS, MOCK_REVIEWS, MOCK_COUPONS } from './data';
import { Professional, UserRole, AppUser, ProfService, Appointment, Review, ChatMessage, Coupon } from './types';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';

type Screen = 'home' | 'search' | 'orders' | 'profile' | 'pro-detail' | 'auth' | 'dashboard' | 'my-services' | 'favorites' | 'chat-list' | 'chat-detail';

function Icon({ name, fill, size, className }: { name: string; fill?: boolean; size?: number; className?: string }) {
  return <span className={`material-symbols-outlined ${className || ''}`} style={{ fontSize: size || 24, fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0" }}>{name}</span>;
}

const LS = {
  get: <T,>(k: string, f: T): T => { try { const v = localStorage.getItem(`ea_${k}`); return v ? JSON.parse(v) : f; } catch { return f; } },
  set: (k: string, v: any) => { try { localStorage.setItem(`ea_${k}`, JSON.stringify(v)); } catch {} },
};

/* ═══════════════════════════════════════
   HOOKS (FIREBASE)
═══════════════════════════════════════ */
function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUser({ ...docSnap.data(), id: u.uid } as AppUser);
          } else {
            const newUser: AppUser = {
              id: u.uid, name: u.displayName || 'Usuário', email: u.email || '', role: 'pending' as any,
              avatarInitial: (u.displayName || 'U')[0].toUpperCase(), avatarUrl: u.photoURL || undefined,
              favorites: [], createdAt: new Date().toISOString()
            };
            await setDoc(docRef, newUser);
            setUser(newUser);
          }
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.error("Firebase Error:", err);
        setAuthError(err.message);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const loginWithGoogle = async () => {
    try { await signInWithPopup(auth, googleProvider); return { ok: true }; }
    catch (e: any) { return { ok: false, error: e.message }; }
  };
  const logout = () => fbSignOut(auth);
  
  const updateRole = async (role: UserRole, extra?: any) => {
    if(!user) return;
    const updates = { role, ...extra, rating: 5.0, reviewsCount: 0 };
    await updateDoc(doc(db, 'users', user.id), updates);
    setUser({ ...user, ...updates });
  };

  const updateProfile = async (data: any) => {
    if(!user) return;
    await updateDoc(doc(db, 'users', user.id), data);
    setUser({ ...user, ...data });
  };

  const toggleFavorite = async (proId: string) => {
    if (!user) return;
    const favs = user.favorites || [];
    const newFavs = favs.includes(proId) ? favs.filter(id => id !== proId) : [...favs, proId];
    setUser({ ...user, favorites: newFavs });
    await updateDoc(doc(db, 'users', user.id), { favorites: newFavs });
  };
  return { user, loading, authError, loginWithGoogle, logout, updateRole, toggleFavorite, updateProfile };
}

function useSearch() {
  const [pros, setPros] = useState<Professional[]>([]);
  useEffect(() => {
    getDocs(query(collection(db, 'users'), where('role', '==', 'professional'))).then(snap => {
      const dbPros = snap.docs.map(d => {
        const u = d.data();
        return {
          id: d.id, name: u.name, profession: u.profession || 'Especialista',
          avatarUrl: u.avatarUrl || `https://ui-avatars.com/api/?name=${u.avatarInitial}&background=random`,
          coverUrl: u.coverUrl || `https://picsum.photos/seed/${d.id}/600/300`,
          rating: u.rating || 5.0, verified: true, services: [], description: u.description
        } as Professional;
      });
      setPros([...PROFESSIONALS, ...dbPros]);
    });
  }, []);
  return { pros };
}

function useServices(pid?: string) {
  const [services, setServices] = useState<ProfService[]>([]);
  const load = useCallback(async () => {
    if (!pid) return;
    const snap = await getDocs(query(collection(db, 'services'), where('professionalId', '==', pid)));
    const dbSvc = snap.docs.map(d => ({ ...d.data(), id: d.id } as ProfService));
    const mockSvc = PROFESSIONALS.find(p => p.id === pid)?.services || [];
    setServices([...mockSvc, ...dbSvc]);
  }, [pid]);
  useEffect(() => { load(); }, [load]);

  const add = async (s: Omit<ProfService, 'id'>) => { await addDoc(collection(db, 'services'), s); load(); };
  const remove = async (id: string) => { await deleteDoc(doc(db, 'services', id)); load(); };
  return { services, add, remove };
}

function useAppointments(uid?: string, role?: string) {
  const [apts, setApts] = useState<any[]>([]);
  const load = useCallback(async () => {
    if (!uid || !role || role === 'pending') return;
    const field = role === 'professional' ? 'professionalId' : 'clientId';
    const snap = await getDocs(query(collection(db, 'appointments'), where(field, '==', uid)));
    let data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setApts(data);
  }, [uid, role]);
  useEffect(() => { load(); }, [load]);
  
  const add = async (a: any) => {
    await addDoc(collection(db, 'appointments'), { ...a, createdAt: new Date().toISOString() });
    load();
  };
  const updateStatus = async (id: string, st: string) => {
    await updateDoc(doc(db, 'appointments', id), { status: st });
    load();
  };
  return { apts, add, updateStatus };
}

function useChat(uid?: string) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(query(collection(db, 'chats'), where('participants', 'array-contains', uid)), (snap) => {
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

function useReviews(pid?: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => {
    if(!pid) return;
    getDocs(query(collection(db, 'reviews'), where('professionalId', '==', pid))).then(snap => {
      let data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Review));
      data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews([...data, ...MOCK_REVIEWS]); 
    });
  }, [pid]);
  return { reviews };
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

function useToast() {
  const [t, setT] = useState<{ msg: string; type: string } | null>(null); const r = useRef<any>();
  const show = useCallback((msg: string, type = 'success') => { if (r.current) clearTimeout(r.current); setT({ msg, type }); r.current = setTimeout(() => setT(null), 3000); }, []);
  return { t, show };
}

/* ═══════════════════════════════════════
   MAIN APP
═══════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selProId, setSelProId] = useState<string | null>(null);
  const [chatUser, setChatUser] = useState<{id:string,name:string}|null>(null);
  
  const { user, loading, authError, loginWithGoogle, logout, updateRole, toggleFavorite, updateProfile } = useAuth();
  const { pros } = useSearch();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { t, show } = useToast();

  const go = (s: Screen, data?: any) => { 
    if (s === 'pro-detail') setSelProId(data); 
    if (s === 'chat-detail') setChatUser(data);
    setScreen(s); window.scrollTo(0, 0); 
  };

  useEffect(() => {
    if (user?.role === 'professional' && screen === 'home') setScreen('dashboard');
    if (user?.role === 'client' && screen === 'dashboard') setScreen('search');
  }, [user, screen]);

  if (loading) return <div className={`min-h-screen flex items-center justify-center font-bold ${isDark?'bg-[#18181b] text-white':'bg-[#f8f9fa] text-black'}`}>Carregando EncontreAi...</div>;
  if (authError) return <div className={`min-h-screen flex flex-col p-8 items-center justify-center text-center ${isDark?'bg-[#18181b] text-white':'bg-[#f8f9fa] text-black'}`}><Icon name="error" size={64} className="text-red-500 mb-4" /><p className="font-black text-2xl mb-2">Conexão Recusada</p><p className="text-sm font-medium text-red-500 mb-4">{authError}</p><p className="text-xs opacity-70">Verifique se o seu Banco de Dados Firestore está criado no painel do Firebase e se as Regras de Segurança permitem leitura e gravação.</p></div>;
  if (user?.role === 'pending') return <OnboardingScreen updateRole={updateRole} isDark={isDark} />;

  const selPro = pros.find(p => p.id === selProId);
  const hideBottomNav = ['auth', 'chat-detail', 'chat-list'].includes(screen);

  const clientTabs = [
    { icon: 'search', label: 'Busca', s: 'search' as Screen },
    { icon: 'receipt_long', label: 'Pedidos', s: 'orders' as Screen },
    { icon: 'person', label: 'Perfil', s: 'profile' as Screen }
  ];
  const proTabs = [
    { icon: 'dashboard', label: 'Painel', s: 'dashboard' as Screen },
    { icon: 'work', label: 'Serviços', s: 'my-services' as Screen },
    { icon: 'receipt_long', label: 'Agenda', s: 'orders' as Screen },
    { icon: 'person', label: 'Perfil', s: 'profile' as Screen }
  ];
  const tabs = user?.role === 'professional' ? proTabs : clientTabs;
  const activeTab = tabs.findIndex(t => t.s === screen || (t.s === 'search' && screen === 'pro-detail') || (t.s === 'profile' && screen === 'favorites'));

  return (
    <div className={`flex justify-center min-h-screen ${isDark ? 'bg-black' : 'bg-[#e7e8e9]'}`}>
      <div className={`w-full max-w-[448px] min-h-screen relative flex flex-col overflow-hidden shadow-2xl transition-colors duration-300 ${isDark ? 'bg-[#18181b] text-white' : 'bg-[#f8f9fa] text-[#191c1d]'}`}>
        
        {!hideBottomNav && screen !== 'pro-detail' && (
          <header className={`w-full sticky top-0 z-50 border-b flex items-center justify-between px-4 py-3 ${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-[#e5e7eb]'}`}>
            <button onClick={() => user ? go('profile') : go('auth')} className={`w-9 h-9 rounded-full border flex items-center justify-center overflow-hidden ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-[#f1f3f5]'}`}>
              {user ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <Icon name="person" fill size={20} className={isDark?'text-gray-300':'text-[#002a5d]'} />}
            </button>
            <h1 className="font-black text-[24px] tracking-[-0.03em] text-[#002a5d] dark:text-[#60a5fa]">EncontreAi</h1>
            <button onClick={() => user ? go('chat-list') : go('auth')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
              <Icon name="chat" size={22} className={isDark ? 'text-white' : 'text-[#191c1d]'} />
            </button>
          </header>
        )}

        <div className="flex-1" style={{ paddingBottom: hideBottomNav ? 0 : 80 }}>
          <AnimatePresence mode="wait">
            {(screen === 'home' || screen === 'search') && <motion.div key="s" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><SearchScreen pros={pros} go={go} isDark={isDark} /></motion.div>}
            {screen === 'dashboard' && <motion.div key="d" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><DashboardProScreen user={user} go={go} isDark={isDark} /></motion.div>}
            {screen === 'my-services' && <motion.div key="ms" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><MyServicesScreen user={user} show={show} isDark={isDark} /></motion.div>}
            {screen === 'orders' && <motion.div key="o" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><OrdersScreen user={user} pros={pros} go={go} isDark={isDark} show={show} /></motion.div>}
            {screen === 'profile' && <motion.div key="p" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ProfileScreen user={user} go={go} logout={() => { logout(); go('home'); }} isDark={isDark} toggleDarkMode={toggleDarkMode} updateProfile={updateProfile} show={show} /></motion.div>}
            {screen === 'pro-detail' && selPro && <motion.div key="pd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ProDetailScreen pro={selPro} onBack={() => go('search')} user={user} go={go} show={show} isDark={isDark} toggleFavorite={toggleFavorite} /></motion.div>}
            {screen === 'auth' && <motion.div key="a" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}><AuthScreen onOk={() => go('home')} loginWithGoogle={loginWithGoogle} show={show} /></motion.div>}
            {screen === 'chat-list' && <motion.div key="cl" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><ChatListScreen user={user} pros={pros} go={go} isDark={isDark} /></motion.div>}
            {screen === 'chat-detail' && chatUser && <motion.div key="cd" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0}}><ChatDetailScreen user={user} chatUser={chatUser} go={go} isDark={isDark} /></motion.div>}
            {screen === 'favorites' && <motion.div key="fav" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><FavoritesScreen user={user} pros={pros} go={go} isDark={isDark} /></motion.div>}
          </AnimatePresence>
        </div>

        {!hideBottomNav && (
          <nav className={`fixed bottom-0 w-full max-w-[448px] z-50 rounded-t-2xl border-t flex justify-around items-center pt-2 pb-5 px-2 transition-colors ${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-[#e5e7eb]'}`}>
            {tabs.map((tab, i) => {
              const active = activeTab === i;
              return (
                <button key={i} onClick={() => { if ((tab.s === 'orders' || tab.s === 'profile' || tab.s === 'my-services') && !user) go('auth'); else go(tab.s); }}
                  className={`flex flex-col items-center justify-center p-2 px-4 transition-all rounded-full ${active ? (isDark ? 'bg-[#f97316]' : 'bg-[#fd8b00]') : 'bg-transparent'}`}>
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
   ONBOARDING
═══════════════════════════════════════ */
function OnboardingScreen({ updateRole, isDark }: any) {
    const [step, setStep] = useState(1);
    const [prof, setProf] = useState('');
    const [cpf, setCpf] = useState('');
    const [phone, setPhone] = useState('');
    const [region, setRegion] = useState('');
    
    const handleCpf = (v: string) => {
      let r = v.replace(/\D/g,"");
      if(r.length>11) r=r.slice(0,11);
      r=r.replace(/(\d{3})(\d)/,"$1.$2");
      r=r.replace(/(\d{3})(\d)/,"$1.$2");
      r=r.replace(/(\d{3})(\d{1,2})$/,"$1-$2");
      setCpf(r);
    };
    
    const handlePhone = (v: string) => {
      let r = v.replace(/\D/g,"");
      if(r.length>11) r=r.slice(0,11);
      r=r.replace(/^(\d{2})(\d)/g,"($1) $2");
      r=r.replace(/(\d)(\d{4})$/,"$1-$2");
      setPhone(r);
    };
    
    if(step === 1) return (
      <div className={`p-6 flex flex-col items-center justify-center min-h-screen max-w-[448px] mx-auto ${isDark?'bg-[#18181b] text-white':'bg-[#f8f9fa] text-black'}`}>
         <Icon name="handshake" size={64} className={`mb-6 ${isDark?'text-[#60a5fa]':'text-[#002a5d]'}`} />
         <h1 className="text-3xl font-black mb-8 text-center leading-tight">Como você quer usar o EncontreAi?</h1>
         <button onClick={() => updateRole('client')} className="w-full bg-[#f97316] text-black font-black text-lg p-5 rounded-2xl mb-4 shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
           <Icon name="search" /> Quero CONTRATAR serviços
         </button>
         <button onClick={() => setStep(2)} className={`w-full font-bold text-lg p-5 rounded-2xl border active:scale-95 transition-transform flex items-center justify-center gap-3 ${isDark?'bg-[#27272a] border-[#3f3f46] text-white':'bg-white border-[#e5e7eb] text-[#002a5d]'}`}>
           <Icon name="work" /> Quero PRESTAR serviços
         </button>
      </div>
    );
  
    return (
      <div className={`p-6 flex flex-col min-h-screen pt-10 pb-20 max-w-[448px] mx-auto overflow-y-auto ${isDark?'bg-[#18181b] text-white':'bg-[#f8f9fa] text-black'}`}>
         <button onClick={()=>setStep(1)} className="mb-6 self-start"><Icon name="arrow_back" /></button>
         <h1 className="text-3xl font-black mb-2">Seu Perfil Profissional</h1>
         <p className={`mb-8 ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>Precisamos de alguns dados adicionais para validar o seu perfil e passar segurança aos clientes.</p>
         
         <label className="font-bold text-sm mb-2 block">Sua Profissão / Especialidade</label>
         <input value={prof} onChange={e=>setProf(e.target.value)} placeholder="Ex: Eletricista, Encanador..." className={`w-full p-4 rounded-xl mb-4 border outline-none font-medium ${isDark?'bg-[#27272a] border-[#3f3f46] text-white':'bg-white border-[#e5e7eb]'}`} />
         
         <label className="font-bold text-sm mb-2 block">CPF</label>
         <input value={cpf} onChange={e=>handleCpf(e.target.value)} placeholder="000.000.000-00" className={`w-full p-4 rounded-xl mb-4 border outline-none font-medium ${isDark?'bg-[#27272a] border-[#3f3f46] text-white':'bg-white border-[#e5e7eb]'}`} />
         
         <label className="font-bold text-sm mb-2 block">Telefone / WhatsApp</label>
         <input value={phone} onChange={e=>handlePhone(e.target.value)} placeholder="(00) 00000-0000" className={`w-full p-4 rounded-xl mb-4 border outline-none font-medium ${isDark?'bg-[#27272a] border-[#3f3f46] text-white':'bg-white border-[#e5e7eb]'}`} />
         
         <label className="font-bold text-sm mb-2 block">Região de Atendimento (Opcional)</label>
         <input value={region} onChange={e=>setRegion(e.target.value)} placeholder="Ex: Zona Sul, Centro..." className={`w-full p-4 rounded-xl mb-8 border outline-none font-medium ${isDark?'bg-[#27272a] border-[#3f3f46] text-white':'bg-white border-[#e5e7eb]'}`} />
         
         <button disabled={!prof || cpf.length < 14 || phone.length < 14} onClick={() => updateRole('professional', { profession: prof, cpfCnpj: cpf, phone, region })} className="w-full bg-[#f97316] text-black font-black text-lg p-5 rounded-2xl disabled:opacity-50 shadow-lg active:scale-95 transition-transform mt-auto mb-10">Concluir Cadastro</button>
      </div>
    )
  }

/* ═══════════════════════════════════════
   SCREENS
═══════════════════════════════════════ */
function SearchScreen({ pros, go, isDark }: any) {
  const [q, setQ] = useState(''); const [filter, setFilter] = useState('loc');
  let filtered = pros.filter((p:any) => {
    if (!q) return true;
    const term = q.toLowerCase();
    if (p.name.toLowerCase().includes(term) || p.profession.toLowerCase().includes(term)) return true;
    if (p.services && p.services.some((s:any) => s.title.toLowerCase().includes(term) || (s.description && s.description.toLowerCase().includes(term)))) return true;
    return false;
  });
  if (filter === 'price') { filtered.sort((a:any, b:any) => (a.services?.[0]?.price || 100) - (b.services?.[0]?.price || 100)); } 
  else if (filter === 'rate') { filtered = filtered.filter((p:any) => p.rating >= 4.5); filtered.sort((a:any, b:any) => b.rating - a.rating); }

  return (
    <div className="pb-8">
      <div className={`px-4 pt-4 pb-3 sticky top-[57px] z-40 ${isDark ? 'bg-[#18181b]/95' : 'bg-[#f8f9fa]/95'} backdrop-blur-sm border-b ${isDark ? 'border-[#27272a]' : 'border-[#e5e7eb]'}`}>
        <div className="relative mb-4 flex items-center">
          <Icon name="search" size={22} className={`absolute left-4 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`} />
          <input value={q} onChange={e => setQ(e.target.value)} className={`w-full pl-12 pr-12 py-3.5 border rounded-full text-sm outline-none ${isDark ? 'bg-[#27272a] border-[#3f3f46] text-white' : 'bg-white border-[#e5e7eb] text-gray-900'}`} placeholder="O que você precisa hoje?" />
          <button className="absolute right-1 w-10 h-10 rounded-full bg-[#f97316] flex items-center justify-center text-black"><Icon name="arrow_forward" size={20}/></button>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {[{id:'loc', l:'Localização', i:'location_on'}, {id:'price', l:'Menor Preço', i:'payments'}, {id:'rate', l:'Avaliação 4.5+', i:'star'}].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1 transition-colors ${filter===f.id ? (isDark ? 'bg-[#3730a3] text-white border-[#3730a3]' : 'bg-[#f0f4ff] text-[#002a5d] border-[#002a5d]') : (isDark ? 'bg-transparent text-[#a1a1aa] border-[#3f3f46]' : 'bg-white text-gray-600 border-[#e5e7eb]')}`}>
              <Icon name={f.i} size={14} className={filter===f.id ? (isDark?'text-white':'text-[#002a5d]') : ''}/> {f.l}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 mt-4 flex flex-col gap-4">
        {filtered.length === 0 && <div className="text-center py-10 text-gray-500"><Icon name="search_off" size={48} className="opacity-30 mb-2" /><p className="text-sm">Nenhum profissional encontrado.</p></div>}
        {filtered.map((p:any) => (
          <button key={p.id} onClick={() => go('pro-detail', p.id)} className={`rounded-2xl shadow-sm border p-3 flex gap-3 items-start text-left ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
            <div className="relative"><img src={p.avatarUrl} className="w-24 h-28 rounded-xl object-cover" />{p.verified && <div className="absolute top-1 right-1 rounded-full p-0.5 bg-white"><Icon name="verified" fill size={18} className="text-[#3b82f6]" /></div>}</div>
            <div className="flex-1 py-1 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start"><h3 className={`font-bold text-[15px] pr-2 leading-tight ${isDark?'text-white':'text-gray-900'}`}>{p.name}</h3><div className="flex items-center text-[#f97316] shrink-0"><Icon name="star" fill size={14} /><span className={`text-sm font-bold ml-1 ${isDark ? 'text-[#e4e4e7]' : 'text-gray-900'}`}>{p.rating.toFixed(1)}</span></div></div>
                <p className={`text-xs mt-1 leading-snug ${isDark ? 'text-[#a1a1aa]' : 'text-gray-600'}`}>{p.profession}</p>
              </div>
              <div className="mt-3 flex items-end justify-between w-full">
                <div><span className={`text-[9px] font-bold uppercase tracking-wide ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>A PARTIR DE</span><p className={`font-black text-lg ${isDark ? 'text-white' : 'text-[#002a5d]'}`}>R$ {(p.services?.[0]?.price || 100).toFixed(0)}<span className={`text-[10px] font-normal ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>/visita</span></p></div>
                <span className={`px-4 py-2 rounded-lg font-bold text-xs ${isDark ? 'text-black bg-[#f97316]' : 'text-[#603100] bg-[#fd8b00]'}`}>Ver Perfil</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen({ user, go, logout, isDark, toggleDarkMode, updateProfile, show }: any) {
  const [editModal, setEditModal] = useState(false);
  if (!user) return null;
  return (
    <div className="px-4 py-6 pb-8">
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.avatarInitial}&background=random`} className={`w-24 h-24 rounded-full border-4 shadow-md object-cover ${isDark ? 'border-[#18181b]' : 'border-white'}`} />
          <button onClick={()=>setEditModal(true)} className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm ${isDark ? 'bg-[#60a5fa] text-[#18181b] border-[#18181b]' : 'bg-[#003f87] text-white border-white'}`}><Icon name="edit" size={16} /></button>
        </div>
        <h2 className="font-black text-2xl mb-1">{user.name} <span className="text-sm font-normal text-gray-500">({user.role === 'professional' ? 'Profissional' : 'Cliente'})</span></h2>
        <p className={`text-sm flex items-center gap-1 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-600'}`}><Icon name="mail" size={16} /> {user.email}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button className={`flex flex-col p-4 rounded-2xl border text-left h-[120px] justify-center shadow-sm ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}><div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isDark ? 'bg-[#dbeafe] text-[#2563eb]' : 'bg-[#d7e2ff] text-[#003f87]'}`}><Icon name="location_on" fill size={24} /></div><span className="font-bold text-[15px]">Endereços</span></button>
        <button className={`flex flex-col p-4 rounded-2xl border text-left h-[120px] justify-center shadow-sm ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}><div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isDark ? 'bg-[#ffedd5] text-[#ea580c]' : 'bg-[#ffedd5] text-[#c2410c]'}`}><Icon name="credit_card" fill size={24} /></div><span className="font-bold text-[15px]">Pagamentos</span></button>
        {user.role === 'client' && (
          <button onClick={()=>go('favorites')} className={`col-span-2 flex items-center justify-between p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-[#86efac] text-[#14532d]' : 'bg-[#86efac] text-[#14532d]'}`}><Icon name="favorite" fill size={24} /></div><div><span className="font-bold text-base block">Favoritos</span><span className={`text-sm ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Prestadores salvos</span></div></div><Icon name="chevron_right" className={isDark ? 'text-[#a1a1aa]' : 'text-gray-400'} /></button>
        )}
      </div>
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
        <button onClick={toggleDarkMode} className={`w-full flex items-center justify-between p-5 border-b transition-colors ${isDark ? 'border-[#3f3f46] hover:bg-[#3f3f46]' : 'border-[#e5e7eb] hover:bg-gray-50'}`}><div className="flex items-center gap-4"><Icon name={isDark ? "light_mode" : "dark_mode"} className={isDark ? 'text-white' : 'text-gray-600'} /><span className="font-bold text-[15px]">Modo {isDark?'Claro':'Escuro'}</span></div><div className={`w-10 h-6 rounded-full flex items-center px-1 ${isDark ? 'bg-[#60a5fa] justify-end' : 'bg-gray-300 justify-start'}`}><div className="w-4 h-4 bg-white rounded-full shadow-sm"/></div></button>
        <button onClick={logout} className={`w-full flex items-center gap-4 p-5 transition-colors ${isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}><Icon name="logout" className={isDark ? 'text-[#fca5a5]' : 'text-[#ba1a1a]'} /><span className={`font-bold text-[15px] ${isDark ? 'text-[#fca5a5]' : 'text-[#ba1a1a]'}`}>Sair da Conta</span></button>
      </div>
      <AnimatePresence>{editModal && <EditProfileModal user={user} show={show} onClose={()=>setEditModal(false)} onSave={(d:any)=>{updateProfile(d); setEditModal(false); show('Perfil atualizado!');}} isDark={isDark} />}</AnimatePresence>
    </div>
  );
}

    </>
  );
}

function DashboardProScreen({ user, isDark, go }: any) {
  const { apts, updateStatus } = useAppointments(user?.id, user?.role);
  const pending = apts.filter(a => a.status === 'approved');
  const earned = apts.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.price, 0);

  return (
    <div className="p-4 pb-24">
       <h1 className="font-black text-2xl mb-2">Olá, {user.name.split(' ')[0]} 👋</h1>
       <p className={`text-sm mb-6 ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>Acompanhe seus ganhos e agenda do dia.</p>
       <div className={`p-6 rounded-3xl mb-8 shadow-md border flex flex-col justify-center items-center text-center ${isDark?'bg-gradient-to-br from-[#27272a] to-[#18181b] border-[#3f3f46]':'bg-gradient-to-br from-[#002a5d] to-[#001a40] border-[#002a5d] text-white'}`}>
         <p className="text-sm font-medium mb-1 opacity-80">Ganhos Totais (Concluídos)</p>
         <h2 className={`font-black text-4xl mb-4 ${isDark?'text-[#f97316]':'text-[#f97316]'}`}>R$ {earned.toFixed(2)}</h2>
         <div className="w-full h-[1px] bg-white/10 mb-4" />
         <div className="flex justify-between w-full px-4"><div><p className="text-xs opacity-70">Pendentes</p><p className="font-bold text-lg">{pending.length}</p></div><div><p className="text-xs opacity-70">Concluídos</p><p className="font-bold text-lg">{apts.filter(a=>a.status==='completed').length}</p></div></div>
       </div>
       <h3 className="font-black text-lg mb-4 flex items-center gap-2"><Icon name="calendar_today" size={20}/> Agenda Pendente</h3>
       <div className="flex flex-col gap-4">
         {pending.length === 0 && <p className={`text-center py-6 text-sm ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>Nenhum serviço agendado no momento.</p>}
         {pending.map(a => (
           <div key={a.id} className={`p-5 rounded-2xl border shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
             <div className="flex justify-between items-start mb-3"><div><p className="font-bold text-lg">{a.clientName}</p><p className={`text-sm ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>{a.serviceTitle}</p></div><span className="font-black text-[#f97316]">R$ {a.price.toFixed(2)}</span></div>
             <p className={`text-sm font-medium flex items-center gap-1 mb-4 ${isDark?'text-[#e4e4e7]':'text-gray-700'}`}><Icon name="schedule" size={16}/> {a.date} às {a.time}</p>
             <div className="flex gap-2">
               <button onClick={()=>go('chat-detail', {id: a.clientId, name: a.clientName})} className={`flex-1 py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-1 ${isDark?'border-[#3f3f46]':'border-[#e5e7eb]'}`}><Icon name="chat" size={16}/> Chat</button>
               <button onClick={()=>updateStatus(a.id, 'completed')} className="flex-1 py-3 rounded-xl bg-[#4ade80] text-[#14532d] font-bold text-sm flex items-center justify-center gap-1"><Icon name="check_circle" size={16}/> Concluir</button>
             </div>
           </div>
         ))}
       </div>
    </div>
  )
}

function MyServicesScreen({ user, isDark, show }: any) {
  const { services, add, remove } = useServices(user?.id);
  const [adding, setAdding] = useState(false);
  
  const [t, setT] = useState(''); 
  const [p, setP] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('');
  const [dur, setDur] = useState('');
  const [img, setImg] = useState('');
  
  const resetForm = () => { setT(''); setP(''); setDesc(''); setCat(''); setDur(''); setImg(''); };

  const handleSave = () => {
    if(t && p && cat) { 
      add({
        title: t, 
        price: Number(p), 
        description: desc,
        categoryId: cat,
        duration: dur,
        imageUrl: img
      }); 
      resetForm();
      setAdding(false); 
      show('Serviço adicionado!'); 
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-black text-2xl">Meus Serviços</h1>
        <button onClick={()=>{setAdding(!adding); resetForm();}} className="w-10 h-10 rounded-full bg-[#f97316] text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"><Icon name={adding?"close":"add"} /></button>
      </div>
      <AnimatePresence>
        {adding && (
          <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="overflow-hidden mb-6">
            <div className={p-5 rounded-3xl border shadow-sm }>
              <h3 className="font-black text-lg mb-4">Adicionar Novo Serviço</h3>
              
              <label className="text-xs font-bold mb-1 block opacity-70">Título do Serviço *</label>
              <input value={t} onChange={e=>setT(e.target.value)} placeholder="Ex: Manutenção de Ar Condicionado" className={w-full p-3.5 rounded-xl mb-4 border outline-none text-sm font-medium } />
              
              <label className="text-xs font-bold mb-1 block opacity-70">Categoria *</label>
              <select value={cat} onChange={e=>setCat(e.target.value)} className={w-full p-3.5 rounded-xl mb-4 border outline-none text-sm font-medium appearance-none }>
                <option value="">Selecione uma categoria...</option>
                {CATEGORIES.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <label className="text-xs font-bold mb-1 block opacity-70">Preço (R$) *</label>
              <input type="number" value={p} onChange={e=>setP(e.target.value)} placeholder="Ex: 150" className={w-full p-3.5 rounded-xl mb-4 border outline-none text-sm font-medium } />
              
              <label className="text-xs font-bold mb-1 block opacity-70">Duração Estimada (Opcional)</label>
              <input value={dur} onChange={e=>setDur(e.target.value)} placeholder="Ex: 2 horas, 1 dia..." className={w-full p-3.5 rounded-xl mb-4 border outline-none text-sm font-medium } />

              <label className="text-xs font-bold mb-1 block opacity-70">Link da Foto (Opcional)</label>
              <input value={img} onChange={e=>setImg(e.target.value)} placeholder="https://..." className={w-full p-3.5 rounded-xl mb-4 border outline-none text-sm font-medium } />

              <label className="text-xs font-bold mb-1 block opacity-70">Descrição Detalhada (Opcional)</label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Descreva o que está incluso no serviço..." rows={3} className={w-full p-3.5 rounded-xl mb-6 border outline-none text-sm font-medium } />
              
              <button disabled={!t || !p || !cat} onClick={handleSave} className="w-full py-4 rounded-2xl font-black bg-[#f97316] text-black disabled:opacity-50 active:scale-95 transition-transform">Salvar Serviço</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex flex-col gap-4">
        {services.length === 0 && !adding && (
           <div className={	ext-center py-10 px-6 rounded-3xl border-2 border-dashed }>
             <Icon name="post_add" size={48} className="mx-auto mb-3 opacity-30" />
             <p className={	ext-sm font-medium }>Você ainda não tem serviços cadastrados. <br/>Clique no '+' para criar o seu primeiro anúncio.</p>
           </div>
        )}
        {services.map((s:any) => {
          const catObj = CATEGORIES.find((c:any) => c.id === s.categoryId);
          return (
            <div key={s.id} className={p-5 rounded-3xl border flex flex-col gap-3 shadow-sm }>
              {s.imageUrl && <img src={s.imageUrl} className="w-full h-32 object-cover rounded-xl mb-2" />}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {catObj && <span className={	ext-[10px] font-bold px-2.5 py-1 rounded-md uppercase }>{catObj.name}</span>}
                    {s.duration && <span className={	ext-[10px] font-bold flex items-center gap-1 }><Icon name="schedule" size={12}/> {s.duration}</span>}
                  </div>
                  <p className="font-bold text-lg leading-tight mb-1">{s.title}</p>
                  <p className={	ext-xl font-black }>R$ {s.price.toFixed(2)}</p>
                </div>
                <button onClick={()=>remove(s.id)} className="p-2.5 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-full active:scale-95 transition-transform"><Icon name="delete" size={20} /></button>
              </div>
              {s.description && <p className={	ext-sm mt-1 line-clamp-3 leading-relaxed }>{s.description}</p>}
            </div>
          );
        })}
      </div>
    </div>
  )
}

function OrdersScreen({ user, pros, go, isDark, show }: any) {
  const { apts, updateStatus } = useAppointments(user?.id, user?.role);
  const [filter, setFilter] = useState('all');
  const [reviewModal, setReviewModal] = useState<any>(null);

  const submitReview = async (rating: number, text: string) => {
    await addDoc(collection(db, 'reviews'), {
      professionalId: reviewModal.professionalId, clientId: user.id, clientName: user.name, rating, text, createdAt: new Date().toISOString()
    });
    await updateDoc(doc(db, 'appointments', reviewModal.id), { reviewed: true });
    
    const proRef = doc(db, 'users', reviewModal.professionalId);
    const proSnap = await getDoc(proRef);
    if(proSnap.exists()) {
      const data = proSnap.data();
      const currentRating = data.rating || 5; const count = data.reviewsCount || 0;
      const newCount = count + 1; const newRating = ((currentRating * count) + rating) / newCount;
      await updateDoc(proRef, { rating: newRating, reviewsCount: newCount });
    }
    
    updateStatus(reviewModal.id, 'completed');
    setReviewModal(null);
    show('Avaliação enviada!');
  };

  if (!user) return null;
  const filtered = apts.filter(a => filter === 'all' || (filter === 'active' && a.status === 'approved') || (filter === 'done' && a.status === 'completed') || (filter === 'cancelled' && a.status === 'cancelled'));
  const stCfg: Record<string, {label:string, border:string, badgeBg:string, badgeText:string}> = {
    approved: { label: 'Em Andamento', border: '#f97316', badgeBg: isDark ? '#ffedd5' : '#ffedd5', badgeText: isDark ? '#9a3412' : '#9a3412' },
    completed: { label: 'Concluído', border: '#4ade80', badgeBg: isDark ? '#bbf7d0' : '#dcfce7', badgeText: isDark ? '#166534' : '#166534' },
    cancelled: { label: 'Cancelado', border: '#fca5a5', badgeBg: isDark ? '#7f1d1d' : '#fee2e2', badgeText: isDark ? '#fca5a5' : '#991b1b' }
  };
  return (
    <div className="px-4 py-6 pb-8">
      <h1 className="font-black text-3xl mb-1">{user.role==='professional' ? 'Agenda Completa' : 'Meus Pedidos'}</h1>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-4 mt-5">
        {[['all','Todos'],['active','Em Andamento'],['done','Concluídos']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`shrink-0 px-4 py-2 rounded-full font-bold text-sm border transition-colors ${filter === k ? (isDark ? 'bg-[#60a5fa] text-black border-[#60a5fa]' : 'bg-[#002a5d] text-white border-[#002a5d]') : (isDark ? 'bg-transparent text-white border-[#3f3f46]' : 'bg-[#f3f4f6] text-gray-700 border-[#e5e7eb]')}`}>{l}</button>
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {filtered.map(a => {
          const cfg = stCfg[a.status] || stCfg.approved;
          const pro = pros.find((p:any)=>p.id===a.professionalId);
          return (
            <div key={a.id} className={`rounded-2xl p-4 border-l-[4px] shadow-sm relative ${isDark ? 'bg-[#27272a] border-y-[#3f3f46] border-r-[#3f3f46]' : 'bg-white border-y-[#e5e7eb] border-r-[#e5e7eb]'}`} style={{ borderLeftColor: cfg.border }}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  {user.role === 'client' && <img src={pro?.avatarUrl || `https://ui-avatars.com/api/?name=${a.professionalName}&background=random`} className="w-14 h-14 rounded-lg object-cover" />}
                  <div>
                    <h3 className="font-bold text-lg">{user.role==='professional' ? a.clientName : a.professionalName}</h3>
                    <p className={`text-sm ${isDark ? 'text-[#a1a1aa]' : 'text-gray-600'}`}>{a.serviceTitle}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded text-[10px] font-bold" style={{ background: cfg.badgeBg, color: cfg.badgeText }}>{cfg.label}</span>
              </div>
              <div className={`flex justify-between items-center pt-3 border-t ${isDark ? 'border-[#3f3f46]' : 'border-[#f3f4f6]'}`}>
                <p className={`text-sm ${isDark ? 'text-[#a1a1aa]' : 'text-gray-600'}`}>{a.date}, {a.time}</p>
                <span className={`font-black text-lg ${isDark ? 'text-[#60a5fa]' : 'text-[#002a5d]'}`}>R$ {a.price.toFixed(2)}</span>
              </div>
              {a.status === 'approved' && (
                <div className="flex gap-2 mt-3">
                  {user.role === 'client' && <button onClick={()=>updateStatus(a.id, 'cancelled')} className={`flex-1 py-2 rounded-lg font-bold text-sm border ${isDark?'border-[#3f3f46] text-[#fca5a5]':'border-gray-200 text-red-600'}`}>Cancelar</button>}
                  {user.role === 'professional' && <button onClick={()=>updateStatus(a.id, 'completed')} className="flex-1 py-2 rounded-lg bg-[#4ade80] text-[#14532d] font-bold text-sm">Concluir</button>}
                </div>
              )}
              {a.status === 'completed' && user.role === 'client' && !a.reviewed && (
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>setReviewModal(a)} className={`flex-1 py-2 rounded-lg font-bold text-sm border flex items-center justify-center gap-2 ${isDark?'border-[#3f3f46] text-[#f97316]':'border-[#f97316] text-[#c2410c]'}`}><Icon name="star" size={18}/> Avaliar Profissional</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <AnimatePresence>{reviewModal && <ReviewModal a={reviewModal} onClose={()=>setReviewModal(null)} onSubmit={submitReview} isDark={isDark} />}</AnimatePresence>
    </div>
  );
}

function ProDetailScreen({ pro, onBack, user, go, show, isDark, toggleFavorite }: any) {
  const { services } = useServices(pro.id);
  const { reviews } = useReviews(pro.id);
  const [bookModal, setBookModal] = useState<any>(null); // holds the selected service object
  const { add } = useAppointments(user?.id, user?.role);
  const isFav = user?.favorites?.includes(pro.id);

  return (
    <div className={min-h-screen flex flex-col }>
      <header className="absolute top-0 w-full z-50 flex items-center justify-between px-4 py-3">
        <button onClick={onBack} className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white"><Icon name="arrow_back" /></button>
        <button onClick={() => { if(!user) go('auth'); else toggleFavorite(pro.id); }} className="p-2 rounded-full bg-black/20 backdrop-blur-sm"><Icon name="favorite" fill={isFav} className={isFav ? 'text-[#c2185b]' : 'text-white'} /></button>
      </header>
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="relative w-full h-80"><img src={pro.coverUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=300&fit=crop'} className="w-full h-full object-cover" /><div className={bsolute inset-0 bg-gradient-to-t } /></div>
        <div className="px-4 -mt-10 relative z-10">
          <h2 className="font-black text-2xl leading-tight mb-1">{pro.name}</h2>
          <p className={	ext-base font-semibold }>{pro.profession}</p>
          
          <div className="flex items-center gap-4 mt-3 mb-6">
            <span className="flex items-center gap-1 font-bold"><Icon name="star" size={18} className="text-[#f97316]" fill/> {pro.rating.toFixed(1)} <span className="opacity-50 font-normal">({pro.reviewsCount})</span></span>
            {pro.region && <span className="flex items-center gap-1 text-sm opacity-70"><Icon name="location_on" size={16}/> {pro.region}</span>}
          </div>
          
          {pro.description && (
            <div className={p-5 rounded-3xl mb-8 border shadow-sm }>
              <h3 className="font-black text-lg mb-2">Sobre o Profissional</h3>
              <p className={	ext-sm leading-relaxed }>{pro.description}</p>
            </div>
          )}
          
          <h3 className="font-black text-xl mb-4">Serviços Disponíveis</h3>
          <div className="flex flex-col gap-4 mb-8">
            {services.length === 0 ? (
              <p className={	ext-sm py-4 }>Nenhum serviço cadastrado.</p>
            ) : (
              services.map((s:any) => (
                <div key={s.id} className={p-4 rounded-3xl border flex flex-col shadow-sm }>
                  {s.imageUrl && <img src={s.imageUrl} className="w-full h-32 object-cover rounded-xl mb-3" />}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-lg leading-tight mb-1">{s.title}</p>
                      {s.duration && <span className={	ext-[11px] font-bold flex items-center gap-1 mb-2 }><Icon name="schedule" size={12}/> {s.duration}</span>}
                      <p className={	ext-lg font-black }>R$ {s.price.toFixed(2)}</p>
                    </div>
                    <button onClick={() => { if(!user) go('auth'); else setBookModal(s); }} className="px-4 py-2 rounded-xl font-bold text-sm bg-[#f97316] text-black active:scale-95 transition-transform shrink-0">Agendar</button>
                  </div>
                  {s.description && <p className={	ext-sm mt-3 leading-relaxed }>{s.description}</p>}
                </div>
              ))
            )}
          </div>
          
          <h3 className="font-black text-xl mb-4 flex items-center gap-2"><Icon name="star" fill className="text-[#f97316]"/> Avaliações</h3>
          {reviews.length === 0 ? <p className={	ext-sm py-4 }>Ainda não há avaliações.</p> : reviews.map((r:any) => (
             <div key={r.id} className={p-4 rounded-xl border mb-3 shadow-sm }>
               <div className="flex items-center gap-1 mb-2 text-[#f97316]"><Icon name="star" fill size={16}/> <span className={ont-bold text-sm }>{r.rating.toFixed(1)}</span></div>
               <p className={	ext-sm }>{r.text || 'Sem comentário.'}</p>
               <p className={	ext-xs mt-3 font-bold }>{r.clientName}</p>
             </div>
          ))}
        </div>
      </div>
      <div className={ixed bottom-0 w-full max-w-[448px] p-4 pt-8 z-40 bg-gradient-to-t  to-transparent pointer-events-none}>
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => { if(!user) go('auth'); else go('chat-detail', {id: pro.id, name: pro.name}); }} className={w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm }><Icon name="chat" size={24} /></button>
          <button onClick={() => { if(!user) go('auth'); else if (services.length > 0) setBookModal(services[0]); }} className="flex-1 rounded-2xl font-black text-lg text-black bg-[#f97316] active:scale-95 transition-transform">Agendar Principal</button>
        </div>
      </div>
      <AnimatePresence>
        {bookModal && <BookingModal svc={bookModal} onClose={()=>setBookModal(null)} onBook={(d:string, t:string) => { 
add({ professionalId: pro.id, clientId: user.id, serviceId: bookModal.id, serviceTitle: bookModal.title, price: bookModal.price, date: d, time: t, status: 'approved', clientName: user.name, professionalName: pro.name }); setBookModal(null); 
show('Agendado com sucesso!'); go('orders'); }} isDark={isDark} />}
      </AnimatePresence>
    </div>
  );
}

function BookingModal({ svc, onClose, onBook, isDark }: any) {
  const [d, setD] = useState(''); const [t, setT] = useState('');
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" />
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className={`fixed bottom-0 left-0 w-full rounded-t-3xl z-[101] p-6 shadow-2xl ${isDark ? 'bg-[#27272a] text-white' : 'bg-white text-gray-900'}`}>
        <h2 className="font-bold text-xl mb-5">Agendar: {svc.title}</h2>
        <div className="flex gap-3 mb-6"><input type="date" value={d} onChange={e=>setD(e.target.value)} className={`flex-1 border rounded-xl py-3.5 px-4 outline-none ${isDark?'bg-[#18181b] border-[#3f3f46]':'bg-[#f8f9fa] border-[#e5e7eb]'}`} /><input type="time" value={t} onChange={e=>setT(e.target.value)} className={`flex-1 border rounded-xl py-3.5 px-4 outline-none ${isDark?'bg-[#18181b] border-[#3f3f46]':'bg-[#f8f9fa] border-[#e5e7eb]'}`} /></div>
        <button onClick={() => onBook(d,t)} disabled={!d||!t} className="w-full py-4 rounded-xl font-bold text-black disabled:opacity-50 bg-[#f97316]">Confirmar por R$ {svc.price}</button>
      </motion.div>
    </>
  );
}

function ReviewModal({ a, onClose, onSubmit, isDark }: any) {
  const [r, setR] = useState(5); const [t, setT] = useState('');
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" />
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className={`fixed bottom-0 left-0 w-full rounded-t-3xl z-[101] p-6 shadow-2xl ${isDark ? 'bg-[#27272a] text-white' : 'bg-white text-gray-900'}`}>
        <h2 className="font-bold text-2xl mb-1">Avaliar Serviço</h2>
        <p className={`text-sm mb-6 ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>Como foi o serviço de {a.professionalName}?</p>
        <div className="flex justify-center gap-3 mb-8">
          {[1,2,3,4,5].map(i => <button key={i} onClick={()=>setR(i)} className="active:scale-90 transition-transform"><Icon name="star" fill={i<=r} size={48} className={i<=r ? 'text-[#f97316]' : (isDark?'text-[#3f3f46]':'text-gray-300')} /></button>)}
        </div>
        <textarea value={t} onChange={e=>setT(e.target.value)} placeholder="Deixe um comentário (opcional)" className={`w-full p-4 rounded-xl mb-6 border outline-none text-sm min-h-[100px] ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}`} />
        <button onClick={()=>onSubmit(r,t)} className="w-full py-4 rounded-xl font-bold text-black bg-[#f97316] shadow-lg active:scale-95 transition-transform">Enviar Avaliação</button>
      </motion.div>
    </>
  );
}

function AuthScreen({ loginWithGoogle, go, onOk, show }: any) {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-[#18181b] text-white relative">
      <button onClick={() => go('home')} className="absolute top-6 left-4 p-2"><Icon name="arrow_back" /></button>
      <h1 className="text-4xl font-black mb-12 text-[#60a5fa] tracking-tight">EncontreAi</h1>
      <button onClick={async () => { show('Conectando...', 'info'); const res = await loginWithGoogle(); if (res.ok) { show('Sucesso!'); onOk(); } else show(res.error, 'error'); }} className="bg-white text-black font-bold px-6 py-4 rounded-xl shadow-lg flex items-center gap-4 active:scale-95 transition-transform w-full max-w-xs justify-center mb-6"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>Entrar com Google</button>
    </div>
  );
}

function ChatListScreen({ user, pros, go, isDark }: any) {
  const { msgs } = useChat(user?.id);
  const chatPartners = Array.from(new Set(msgs.map(m => m.senderId === user?.id ? m.receiverId : m.senderId)));

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-6"><button onClick={()=>go('home')}><Icon name="arrow_back" /></button><h1 className="font-black text-2xl">Mensagens</h1></div>
      {chatPartners.length === 0 && <div className="text-center py-10 text-gray-500"><Icon name="forum" size={48} className="opacity-30 mb-2" /><p className="text-sm">Nenhuma mensagem recente.</p></div>}
      <div className="flex flex-col gap-2">
        {chatPartners.map(pid => {
          const lastMsg = msgs.filter(m => m.participants.includes(pid)).pop();
          const partnerName = pros.find((p:any) => p.id === pid)?.name || 'Cliente';
          return (
            <button key={pid} onClick={()=>go('chat-detail', {id: pid, name: partnerName})} className={`p-4 rounded-xl border flex items-center gap-4 shadow-sm text-left ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-black shrink-0"><Icon name="person" /></div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-lg">{partnerName}</h3>
                <p className={`text-sm truncate ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>{lastMsg?.text}</p>
              </div>
              <Icon name="chevron_right" className={isDark?'text-[#a1a1aa]':'text-gray-400'} />
            </button>
          )
        })}
      </div>
    </div>
  );
}

function ChatDetailScreen({ go, user, chatUser, isDark }: any) {
  const { msgs, send } = useChat(user?.id); const [text, setText] = useState('');
  const chatMsgs = msgs.filter(m => (m.senderId===user.id && m.receiverId===chatUser.id) || (m.senderId===chatUser.id && m.receiverId===user.id));
  return (
    <div className={`flex flex-col h-screen ${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}`}>
      <header className={`border-b p-4 flex items-center gap-3 ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white'}`}><button onClick={()=>go('chat-list')}><Icon name="arrow_back" /></button><h2 className="font-bold">{chatUser.name}</h2></header>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {chatMsgs.map(m => ( <div key={m.id} className={`max-w-[80%] rounded-xl p-3 text-sm ${m.senderId === user.id ? 'bg-[#f97316] text-black self-end rounded-br-sm' : (isDark?'bg-[#3f3f46] text-white':'bg-[#e1e3e4] text-[#191c1d]') + ' self-start rounded-bl-sm'}`}>{m.text}</div> ))}
      </div>
      <div className={`p-4 border-t flex gap-2 ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white'}`}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Mensagem..." className={`flex-1 border rounded-full px-4 outline-none text-sm ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white'}`} /><button onClick={()=>{ if(text) { send(chatUser.id, text); setText(''); } }} className="w-10 h-10 rounded-full bg-[#f97316] flex items-center justify-center text-black"><Icon name="send" size={20} /></button></div>
    </div>
  );
}

function FavoritesScreen({ user, pros, go, isDark }: any) {
  const favs = pros.filter((p:any) => user?.favorites?.includes(p.id));
  return (
    <div className="px-4 py-6 pb-8"><div className="flex items-center gap-3 mb-6"><button onClick={()=>go('profile')}><Icon name="arrow_back" /></button><h1 className="font-black text-3xl">Favoritos</h1></div>
    {favs.length === 0 ? <p className="text-center text-gray-500 py-10">Você não tem favoritos.</p> : favs.map((p:any) => <div key={p.id} onClick={()=>go('pro-detail', p.id)} className={`p-3 border rounded-2xl mb-3 flex gap-4 items-center shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}><img src={p.avatarUrl} className="w-16 h-16 rounded-xl object-cover"/><div className="flex-1"><h3 className="font-bold text-lg">{p.name}</h3><p className={`text-sm ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>{p.profession}</p></div><Icon name="chevron_right" className="text-gray-400"/></div>)}
    </div>
  );
}
function EditProfileModal({ user, onClose, onSave, isDark, show }: any) {
  const [av, setAv] = useState(user.avatarUrl || '');
  const [cv, setCv] = useState(user.coverUrl || '');
  const [desc, setDesc] = useState(user.description || '');
  const [aiGenerating, setAiGenerating] = useState(false);
  
  const generateAIAvatar = () => {
    if(!av) {
      if(show) show('Por favor, cole um link de foto normal para a IA usar de base!');
      return;
    }
    setAiGenerating(true);
    
    setTimeout(() => {
      setAv('https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop');
      if(show) show('✨ IA: Foto Profissional Gerada com Sucesso!');
      setAiGenerating(false);
    }, 4000);
  };

  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" />
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className={ixed bottom-0 left-0 w-full rounded-t-3xl z-[101] p-6 shadow-2xl max-h-[85vh] overflow-y-auto }>
        <div className="flex justify-between items-center mb-8"><h2 className="font-black text-2xl">Editar Perfil</h2><button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 rounded-full"><Icon name="close"/></button></div>
        
        <div className="mb-6">
          <label className="font-bold text-sm mb-2 block">Link da Foto de Perfil</label>
          <div className="flex gap-2">
            <input value={av} onChange={e=>setAv(e.target.value)} placeholder="https://..." className={lex-1 p-4 rounded-xl border outline-none text-sm font-medium } />
            <button disabled={aiGenerating} onClick={generateAIAvatar} className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center min-w-[56px]">
              {aiGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Icon name="auto_awesome" />}
            </button>
          </div>
          {aiGenerating && <p className="text-xs font-bold text-indigo-500 mt-2 animate-pulse flex items-center gap-1"><Icon name="memory" size={14} /> Processando rosto com Inteligência Artificial...</p>}
          {!aiGenerating && <p className="text-xs opacity-60 mt-2">Cole o link da sua foto normal e clique na estrela mágica para transformar em foto de estúdio.</p>}
        </div>

        {user.role === 'professional' && (
          <>
            <label className="font-bold text-sm mb-2 block">Link da Foto de Capa (Opcional)</label>
            <input value={cv} onChange={e=>setCv(e.target.value)} placeholder="https://..." className={w-full p-4 rounded-xl mb-6 border outline-none text-sm font-medium } />
            <label className="font-bold text-sm mb-2 block">Sobre o seu trabalho (Bio)</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Conte para os clientes a sua experiência e diferenciais..." className={w-full p-4 rounded-xl mb-6 border outline-none text-sm font-medium min-h-[120px] } />
          </>
        )}
        <button disabled={aiGenerating} onClick={()=>onSave({ avatarUrl: av, coverUrl: cv, description: desc })} className="w-full py-4 rounded-xl font-black text-black bg-[#f97316] shadow-lg active:scale-95 transition-transform mt-2 disabled:opacity-50">Salvar Alterações</button>
      </motion.div>
    </>
  );
}




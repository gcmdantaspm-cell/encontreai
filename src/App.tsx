import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
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

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = (event.target?.result as string);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; const MAX_HEIGHT = 800;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // approx 100-200kb
      };
      img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
  });
}

function useProviderSchedule(proId: string, date: string) {
  const [occupiedTimes, setOccupiedTimes] = useState<string[]>([]);
  useEffect(() => {
    if(!proId || !date) return;
    const load = async () => {
      const q = query(collection(db, 'appointments'), where('professionalId', '==', proId), where('date', '==', date), where('status', 'in', ['pending', 'approved']));
      const snap = await getDocs(q);
      setOccupiedTimes(snap.docs.map(d => d.data().time));
    };
    load();
  }, [proId, date]);
  return occupiedTimes;
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
export const RoleContext = createContext<any>(null);

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

function ProtectedRoute({ allowedRole, children }: any) {
  const { currentRole } = useContext(RoleContext);
  if (currentRole !== allowedRole && currentRole) {
    return <Navigate to={currentRole === 'client' ? '/busca' : '/agenda'} />;
  }
  return children;
}

function BottomBar({ isDark }: any) {
  const { currentRole } = useContext(RoleContext);
  const loc = useLocation();
  const clientTabs = [
    { id: '/busca', icon: 'search', label: 'Busca' },
    { id: '/pedidos', icon: 'receipt_long', label: 'Pedidos' },
    { id: '/perfil', icon: 'person', label: 'Perfil' }
  ];
  const proTabs = [
    { id: '/agenda', icon: 'calendar_month', label: 'Agenda' },
    { id: '/meus-servicos', icon: 'work', label: 'Serviços' },
    { id: '/perfil', icon: 'person', label: 'Perfil' }
  ];
  const tabs = currentRole === 'professional' ? proTabs : clientTabs;
  
  return (
    <div className={`w-full max-w-[448px] h-20 border-t flex justify-around items-center px-2 z-50 transition-colors duration-300 ${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-[#e5e7eb]'}`}>
       {tabs.map(t => {
         const active = loc.pathname.startsWith(t.id);
         return (
         <Link to={t.id} key={t.id} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${active ? 'text-[#f97316]' : (isDark ? 'text-[#a1a1aa]' : 'text-gray-400')}`}>
           <Icon name={t.icon} fill={active} />
           <span className="text-[10px] font-bold mt-1">{t.label}</span>
         </Link>
       )})}
    </div>
  )
}

function AppContent() {
  const { user, loading, authError, loginWithGoogle, logout, updateRole, toggleFavorite, updateProfile } = useAuth();
  const { pros } = useSearch();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { t, show } = useToast();
  
  const [currentRole, setCurrentRole] = useState(user?.role || 'client');
  useEffect(() => { if (user?.role) setCurrentRole(user.role); }, [user]);
  
  const navigate = useNavigate();
  const loc = useLocation();

  // Legacy fallback for components that still expect `go` (we'll update most, but just in case)
  const go = (s: string, data?: any) => { 
     const routeMap:any = { 'home':'/busca', 'search':'/busca', 'orders':'/pedidos', 'profile':'/perfil', 'dashboard':'/agenda', 'my-services':'/meus-servicos', 'chat-list':'/chat-list' };
     if (s === 'pro-detail') navigate(`/servico/${data}`);
     else if (s === 'chat-detail') navigate(`/chat/${data.id}`);
     else navigate(routeMap[s] || `/${s}`);
  };
  
  if (loading) return <div className={`min-h-screen flex items-center justify-center font-bold ${isDark?'bg-[#18181b] text-white':'bg-[#f8f9fa] text-black'}`}>Carregando EncontreAi...</div>;
  if (authError) return <div className={`min-h-screen flex items-center justify-center font-bold text-red-500 bg-[#18181b]`}>{authError}</div>;
  if (user?.role === 'pending') return <OnboardingScreen updateRole={updateRole} isDark={isDark} />;
  
  const hideBottomNav = ['/login', '/cadastro'].includes(loc.pathname) || loc.pathname.startsWith('/servico/') || loc.pathname.startsWith('/chat');
  
  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole }}>
      <div className={`flex justify-center min-h-screen ${isDark ? 'bg-black' : 'bg-[#e7e8e9]'}`}>
        <div className={`w-full max-w-[448px] min-h-screen relative flex flex-col overflow-hidden shadow-2xl transition-colors duration-300 ${isDark ? 'bg-[#18181b] text-white' : 'bg-[#f8f9fa] text-[#191c1d]'}`}>
          
          {!hideBottomNav && !loc.pathname.startsWith('/servico/') && (
            <header className={`w-full sticky top-0 z-50 border-b flex items-center justify-between px-4 py-3 ${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-[#e5e7eb]'}`}>
              <button onClick={() => !user ? loginWithGoogle() : null} className={`w-9 h-9 rounded-full border flex items-center justify-center overflow-hidden ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-[#f1f3f5]'}`}>
                {user ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <Icon name="person" fill size={20} className={isDark?'text-gray-300':'text-[#002a5d]'} />}
              </button>
              <div className="flex gap-2">
                {user && <Link to="/chat-list" className={`w-9 h-9 rounded-full border flex items-center justify-center active:scale-95 transition-transform ${isDark?'bg-[#27272a] border-[#3f3f46] text-[#a1a1aa]':'bg-white border-[#e5e7eb] text-gray-500'}`}><Icon name="chat" size={20} /></Link>}
                {user && currentRole === 'client' && <button className={`w-9 h-9 rounded-full border flex items-center justify-center active:scale-95 transition-transform ${isDark?'bg-[#27272a] border-[#3f3f46] text-[#a1a1aa]':'bg-white border-[#e5e7eb] text-gray-500'}`}><Icon name="favorite" size={20} /></button>}
                <button onClick={toggleDarkMode} className={`w-9 h-9 rounded-full border flex items-center justify-center active:scale-95 transition-transform ${isDark?'bg-[#27272a] border-[#3f3f46] text-amber-400':'bg-white border-[#e5e7eb] text-gray-500'}`}><Icon name={isDark?'light_mode':'dark_mode'} size={20} /></button>
              </div>
            </header>
          )}

          <div className="flex-1 overflow-y-auto">
            <Routes>
               <Route path="/" element={<Navigate to="/busca" />} />
               <Route path="/busca" element={<SearchScreen pros={pros} isDark={isDark} user={user} show={show} toggleFavorite={toggleFavorite} />} />
               <Route path="/pedidos" element={<OrdersScreen user={user} pros={pros} go={go} isDark={isDark} show={show} />} />
               <Route path="/perfil" element={<ProfileScreen user={user} isDark={isDark} logout={logout} loginWithGoogle={loginWithGoogle} toggleDarkMode={toggleDarkMode} updateProfile={updateProfile} show={show} />} />
               
               <Route path="/servico/:id" element={<ServiceDetailScreen pros={pros} user={user} isDark={isDark} show={show} toggleFavorite={toggleFavorite} />} />
               
               <Route path="/agenda" element={<ProtectedRoute allowedRole="professional"><DashboardProScreen user={user} isDark={isDark} go={go} /></ProtectedRoute>} />
               <Route path="/meus-servicos" element={<ProtectedRoute allowedRole="professional"><MyServicesScreen user={user} isDark={isDark} show={show} /></ProtectedRoute>} />
               <Route path="/novo-servico" element={<ProtectedRoute allowedRole="professional"><NewServiceScreen user={user} isDark={isDark} show={show} /></ProtectedRoute>} />
               
               <Route path="/chat-list" element={<ChatListScreen user={user} pros={pros} go={go} isDark={isDark} />} />
               <Route path="/chat/:id" element={<ChatDetailScreen user={user} go={go} isDark={isDark} />} />
            </Routes>
          </div>
          
          {!hideBottomNav && <BottomBar isDark={isDark} />}
          
        </div>
      </div>
      {t?.msg && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full font-bold shadow-xl z-[999]">{t.msg}</div>}
    </RoleContext.Provider>
  )
}

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
function SearchScreen({ pros, isDark, user, toggleFavorite }: any) {
  const [q, setQ] = useState(''); const [filter, setFilter] = useState('all');
  
  const allServices = useMemo(() => {
    return pros.flatMap((p:any) => (p.services || []).map((s:any) => ({ ...s, pro: p })));
  }, [pros]);

  let filtered = allServices.filter((s:any) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return s.title.toLowerCase().includes(term) || s.description?.toLowerCase().includes(term) || s.pro.name.toLowerCase().includes(term) || s.pro.profession.toLowerCase().includes(term);
  });
  
  if (filter === 'price') { filtered.sort((a:any, b:any) => a.price - b.price); } 
  else if (filter === 'rate') { filtered.sort((a:any, b:any) => b.pro.rating - a.pro.rating); }

  return (
    <div className="pb-8">
      <div className={`px-4 pt-6 pb-4 rounded-b-[2.5rem] shadow-sm relative z-10 ${isDark?'bg-[#27272a]':'bg-white'}`}>
        <p className="font-medium opacity-60 text-sm mb-1">Busque por serviços</p>
        <h1 className="font-black text-2xl mb-4">O que você precisa?</h1>
        <div className={`flex items-center p-1 rounded-2xl border shadow-sm ${isDark?'bg-[#18181b] border-[#3f3f46]':'bg-[#f8f9fa] border-[#e5e7eb]'}`}>
          <Icon name="search" className={`ml-3 ${isDark?'text-[#a1a1aa]':'text-gray-400'}`} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ex: Manutenção, Limpeza..." className="flex-1 bg-transparent p-3 outline-none text-sm font-bold placeholder-opacity-50" />
          {q && <button onClick={()=>setQ('')} className="mr-3 opacity-50"><Icon name="close" /></button>}
        </div>
      </div>
      
      <div className="px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 mb-6">
           {CATEGORIES.map((c:any) => (
              <button key={c.id} onClick={()=>setQ(c.name)} className={`px-4 py-2.5 rounded-full font-bold text-sm border flex items-center gap-2 whitespace-nowrap active:scale-95 transition-transform shadow-sm ${q===c.name ? 'bg-[#f97316] text-black border-[#f97316]' : (isDark?'bg-[#27272a] border-[#3f3f46] text-white':'bg-white border-[#e5e7eb] text-gray-700')}`}>
                <Icon name={c.icon} size={16} /> {c.name}
              </button>
           ))}
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-black text-lg">Serviços em Destaque</h2>
          <div className="flex gap-2">
             <button onClick={()=>setFilter(filter==='price'?'all':'price')} className={`px-3 py-1 text-xs font-bold rounded-full border ${filter==='price'?'bg-[#002a5d] text-white border-[#002a5d]':(isDark?'border-[#3f3f46]':'border-gray-200')}`}>Menor Preço</button>
             <button onClick={()=>setFilter(filter==='rate'?'all':'rate')} className={`px-3 py-1 text-xs font-bold rounded-full border ${filter==='rate'?'bg-[#f97316] text-black border-[#f97316]':(isDark?'border-[#3f3f46]':'border-gray-200')}`}><Icon name="star" size={12}/> Top</button>
          </div>
        </div>

        {filtered.length === 0 && <div className="text-center py-10 opacity-50 font-medium">Nenhum serviço encontrado.</div>}

        <div className="flex flex-col gap-5">
          {filtered.map((s:any) => {
            const isFav = user?.favorites?.includes(s.pro.id);
            return (
              <Link to={`/servico/${s.id}`} key={s.id} className={`block rounded-3xl border shadow-sm overflow-hidden active:scale-[0.98] transition-transform ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
                <div className="relative h-48 w-full">
                  {s.imageUrls?.length > 0 ? (
                    <div className="flex w-full h-full overflow-x-auto snap-x hide-scrollbar">
                      {s.imageUrls.map((img:string, i:number) => <img key={i} src={img} className="w-full h-full object-cover shrink-0 snap-center" />)}
                    </div>
                  ) : <img src={s.imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=300&fit=crop'} className="w-full h-full object-cover" />}
                  <button onClick={(e)=>{e.preventDefault(); if(user) toggleFavorite(s.pro.id);}} className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-md rounded-full text-white z-10"><Icon name="favorite" fill={isFav} className={isFav ? 'text-[#c2185b]' : 'text-white'}/></button>
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-wider">{s.category}</div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg leading-tight flex-1 pr-2">{s.title}</h3>
                    <span className={`font-black text-lg ${isDark?'text-[#60a5fa]':'text-[#002a5d]'}`}>R$ {s.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={s.pro.avatarUrl} className="w-6 h-6 rounded-full object-cover border" />
                    <span className={`text-sm font-semibold truncate ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>{s.pro.name}</span>
                    <div className="flex-1"></div>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#f97316]"><Icon name="star" size={14} fill/> {s.pro.rating.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  );
}

function ServiceDetailScreen({ pros, user, isDark, show, toggleFavorite }: any) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookModal, setBookModal] = useState(false);
  const { add } = useAppointments(user?.id, user?.role);
  
  let svc: any = null;
  let pro: any = null;
  for(const p of pros) {
    const found = (p.services||[]).find((s:any) => s.id === id);
    if(found) { svc = found; pro = p; break; }
  }
  
  const isFav = user?.favorites?.includes(pro?.id);
  const { reviews } = useReviews(pro?.id);
  if(!svc) return <div className="p-8 text-center mt-20">Serviço não encontrado!</div>;

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#18181b] text-white' : 'bg-[#f8f9fa] text-[#191c1d]'}`}>
      <header className="absolute top-0 w-full z-50 flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white"><Icon name="arrow_back" /></button>
        <button onClick={() => { if(!user) navigate('/perfil'); else toggleFavorite(pro.id); }} className="p-2 rounded-full bg-black/40 backdrop-blur-sm"><Icon name="favorite" fill={isFav} className={isFav ? 'text-[#c2185b]' : 'text-white'} /></button>
      </header>
      
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="relative w-full h-80 flex overflow-x-auto snap-x hide-scrollbar">
          {svc.imageUrls?.length > 0 ? svc.imageUrls.map((img:string, i:number) => <img key={i} src={img} className="w-full h-full shrink-0 snap-center object-cover" />) : <img src={svc.imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=300&fit=crop'} className="w-full h-full shrink-0 snap-center object-cover" />}
        </div>
        
        <div className="px-5 -mt-8 relative z-10">
          <div className={`p-6 rounded-3xl shadow-lg mb-6 ${isDark?'bg-[#27272a] border border-[#3f3f46]':'bg-white'}`}>
             <h2 className="font-black text-2xl leading-tight mb-2">{svc.title}</h2>
             <p className={`text-2xl font-black mb-4 ${isDark?'text-[#60a5fa]':'text-[#002a5d]'}`}>R$ {svc.price.toFixed(2)}</p>
             {svc.duration && <span className={`text-xs font-bold flex items-center gap-1 mb-4 ${isDark?'text-[#a1a1aa]':'text-gray-400'}`}><Icon name="schedule" size={14}/> Duração estimada: {svc.duration}</span>}
             {svc.paymentMethods?.length > 0 && (
               <div className="mb-4">
                 <p className="text-xs font-bold mb-2 opacity-60">Aceita:</p>
                 <div className="flex flex-wrap gap-2">
                   {svc.paymentMethods.map((pm:string)=><span key={pm} className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${isDark?'border-[#3f3f46] text-[#a1a1aa]':'border-gray-200 text-gray-500'}`}>{pm}</span>)}
                 </div>
               </div>
             )}
             {svc.description && (
               <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#3f3f46]">
                 <p className="text-xs font-bold mb-2 opacity-60">Descrição do Serviço:</p>
                 <p className={`text-sm leading-relaxed ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>{svc.description}</p>
               </div>
             )}
          </div>
          
          <Link to={`/chat-list`} onClick={(e)=>{ if(!user){ e.preventDefault(); navigate('/perfil'); } }} className={`p-4 rounded-3xl mb-6 border flex items-center gap-4 shadow-sm active:scale-95 transition-transform ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
             <img src={pro.avatarUrl} className="w-14 h-14 rounded-full object-cover" />
             <div className="flex-1">
               <p className="font-bold text-lg">{pro.name}</p>
               <p className={`text-sm ${isDark?'text-[#60a5fa]':'text-[#002a5d]'}`}>{pro.profession}</p>
             </div>
             <Icon name="chat" className="text-[#f97316]" />
          </Link>
          
          <h3 className="font-black text-xl mb-4 flex items-center gap-2"><Icon name="star" fill className="text-[#f97316]"/> Avaliações do Profissional</h3>
          {reviews.length === 0 ? <p className={`text-sm py-4 ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>Ainda não há avaliações.</p> : reviews.map((r:any) => (
             <div key={r.id} className={`p-4 rounded-xl border mb-3 shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
               <div className="flex items-center gap-1 mb-2 text-[#f97316]"><Icon name="star" fill size={16}/> <span className={`font-bold text-sm ${isDark?'text-white':'text-black'}`}>{r.rating.toFixed(1)}</span></div>
               <p className={`text-sm ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>{r.text || 'Sem comentário.'}</p>
               <p className={`text-xs mt-3 font-bold ${isDark?'text-gray-500':'text-gray-400'}`}>{r.clientName}</p>
             </div>
          ))}
        </div>
      </div>

      <div className={`fixed bottom-0 left-0 w-full p-4 pt-8 z-40 bg-gradient-to-t ${isDark?'from-[#18181b] via-[#18181b]':'from-[#f8f9fa]'} to-transparent pointer-events-none`}>
        <div className="flex justify-center">
          <button onClick={() => { if(!user) navigate('/perfil'); else setBookModal(true); }} className="w-full max-w-[448px] py-4 rounded-2xl font-black text-lg text-black bg-[#f97316] active:scale-95 transition-transform pointer-events-auto shadow-2xl">Agendar Horário</button>
        </div>
      </div>
      
      <AnimatePresence>
        {bookModal && <BookingModal proId={pro.id} svc={svc} onClose={()=>setBookModal(false)} onBook={(d:string, t:string) => { 
           add({ professionalId: pro.id, clientId: user.id, serviceId: svc.id, serviceTitle: svc.title, price: svc.price, date: d, time: t, status: 'approved', clientName: user.name, professionalName: pro.name }); 
           setBookModal(false); show('Agendado com sucesso!'); navigate('/pedidos'); 
        }} isDark={isDark} />}
      </AnimatePresence>
    </div>
  );
}

function ProfileScreen({ user, logout, loginWithGoogle, toggleDarkMode, updateProfile, show, isDark }: any) {
  const [editModal, setEditModal] = useState(false);
  const { currentRole, setCurrentRole } = useContext(RoleContext);
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <Icon name="account_circle" size={80} className="text-gray-300 mb-4" />
        <h2 className="font-black text-2xl mb-2">Seu Perfil</h2>
        <p className="text-sm text-gray-500 mb-8">Faça login para gerenciar sua conta e pedidos.</p>
        <button onClick={loginWithGoogle} className="w-full py-4 rounded-full font-black text-white bg-[#002a5d] active:scale-95 transition-transform flex items-center justify-center gap-2"><Icon name="login" /> Entrar com Google</button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-8">
      <h1 className="font-black text-2xl mb-6">Perfil</h1>
      <div className={`p-5 rounded-3xl border mb-6 flex items-center gap-4 shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
        <img src={user.avatarUrl} className="w-16 h-16 rounded-full object-cover border-2 border-[#f97316] p-0.5" />
        <div className="flex-1">
          <h2 className="font-bold text-xl leading-tight">{user.name}</h2>
          <p className={`text-sm ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>{user.email}</p>
        </div>
        <button onClick={()=>setEditModal(true)} className={`w-10 h-10 rounded-full flex items-center justify-center border active:scale-95 transition-transform ${isDark?'bg-[#3f3f46] border-[#3f3f46]':'bg-gray-100 border-gray-200'}`}><Icon name="edit" size={20}/></button>
      </div>
      
      <div className="flex flex-col gap-3 mb-6">
        <button onClick={()=>setCurrentRole(currentRole === 'client' ? 'professional' : 'client')} className={`p-4 rounded-2xl flex items-center gap-4 font-bold active:scale-95 transition-transform ${isDark?'bg-[#27272a] text-white border border-[#3f3f46]':'bg-[#f97316] text-black'} shadow-sm`}>
          <Icon name="swap_horiz" /> Mudar para modo {currentRole === 'client' ? 'Prestador' : 'Cliente'}
        </button>
        <button onClick={logout} className={`p-4 rounded-2xl flex items-center gap-4 font-bold border shadow-sm text-left text-red-500 ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}><Icon name="logout" /> Sair da Conta</button>
      </div>
      
      <AnimatePresence>
        {editModal && <EditProfileModal user={user} onClose={()=>setEditModal(false)} onSave={(data:any)=>{ updateProfile(data); setEditModal(false); show('Perfil atualizado com sucesso!'); }} isDark={isDark} show={show} />}
      </AnimatePresence>
    </div>
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
  const [imgs, setImgs] = useState<string[]>([]);
  const [pay, setPay] = useState<string[]>([]);
  const [days, setDays] = useState<number[]>([]);
  const [hours, setHours] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const PAY_OPTIONS = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'];
  const DAY_OPTIONS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const HOUR_OPTIONS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
  
  const resetForm = () => { setT(''); setP(''); setDesc(''); setCat(''); setDur(''); setImgs([]); setPay([]); setDays([]); setHours([]); };

  const handleFiles = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if(imgs.length + files.length > 3) { show('Máximo de 3 fotos permitidas!'); return; }
    setUploading(true);
    const newB64s: string[] = [];
    for(const f of files) {
      if(f.size > 5*1024*1024) { show('Foto muito grande, max 5MB.'); continue; }
      try { const b64 = await compressImage(f); newB64s.push(b64); } catch(err) { console.error(err); }
    }
    setImgs([...imgs, ...newB64s].slice(0,3));
    setUploading(false);
  };

  const handleSave = () => {
    if(t && p && cat && days.length > 0 && hours.length > 0) { 
      add({
        title: t, price: Number(p), description: desc, categoryId: cat, duration: dur,
        imageUrls: imgs, paymentMethods: pay, availableDays: days, availableHours: hours
      }); 
      resetForm(); setAdding(false); show('Serviço adicionado!'); 
    } else {
      show('Preencha os campos obrigatórios (incluindo Dias e Horários)!');
    }
  };

  const toggleArr = (arr: any[], setArr: any, val: any) => setArr(arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val].sort((a,b)=>a>b?1:-1));

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-black text-2xl">Meus Serviços</h1>
        <button onClick={()=>{setAdding(!adding); resetForm();}} className="w-10 h-10 rounded-full bg-[#f97316] text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"><Icon name={adding?"close":"add"} /></button>
      </div>
      <AnimatePresence>
        {adding && (
          <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="overflow-hidden mb-6">
            <div className={`p-5 rounded-3xl border shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
              <h3 className="font-black text-lg mb-4">Adicionar Novo Serviço</h3>
              
              <label className="text-xs font-bold mb-1 block opacity-70">Fotos do Serviço (Até 3)</label>
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {imgs.map((src, i) => (
                  <div key={i} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border">
                    <img src={src} className="w-full h-full object-cover" />
                    <button onClick={()=>setImgs(imgs.filter((_,j)=>j!==i))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"><Icon name="close" size={14}/></button>
                  </div>
                ))}
                {imgs.length < 3 && (
                  <label className={`shrink-0 w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer ${isDark?'border-[#3f3f46] bg-[#18181b]':'border-[#d1d5db] bg-[#f8f9fa]'}`}>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} disabled={uploading}/>
                    {uploading ? <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin"/> : <Icon name="add_photo_alternate" className="opacity-50" />}
                  </label>
                )}
              </div>

              <label className="text-xs font-bold mb-1 block opacity-70">Título do Serviço *</label>
              <input value={t} onChange={e=>setT(e.target.value)} placeholder="Ex: Manutenção de Ar Condicionado" className={`w-full p-3.5 rounded-xl mb-4 border outline-none text-sm font-medium ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}`} />
              
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-xs font-bold mb-1 block opacity-70">Categoria *</label>
                  <select value={cat} onChange={e=>setCat(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none text-sm font-medium appearance-none ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}`}>
                    <option value="">Selecione...</option>
                    {CATEGORIES.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold mb-1 block opacity-70">Preço (R$) *</label>
                  <input type="number" value={p} onChange={e=>setP(e.target.value)} placeholder="150" className={`w-full p-3.5 rounded-xl border outline-none text-sm font-medium ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}`} />
                </div>
              </div>
              
              <label className="text-xs font-bold mb-1 block opacity-70">Duração Estimada (Opcional)</label>
              <input value={dur} onChange={e=>setDur(e.target.value)} placeholder="Ex: 2 horas, 1 dia..." className={`w-full p-3.5 rounded-xl mb-4 border outline-none text-sm font-medium ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}`} />

              <label className="text-xs font-bold mb-1 block opacity-70">Formas de Pagamento</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {PAY_OPTIONS.map(po => (
                  <button key={po} onClick={()=>toggleArr(pay, setPay, po)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${pay.includes(po) ? (isDark?'bg-[#f97316] text-black border-[#f97316]':'bg-[#f97316] text-white border-[#f97316]') : (isDark?'bg-[#18181b] border-[#3f3f46] text-[#a1a1aa]':'bg-[#f8f9fa] border-[#e5e7eb] text-gray-500')}`}>{po}</button>
                ))}
              </div>

              <div className={`p-4 rounded-xl border mb-4 ${isDark?'bg-[#18181b] border-[#3f3f46]':'bg-[#f8f9fa] border-[#e5e7eb]'}`}>
                <label className="text-xs font-bold mb-2 block opacity-70 flex items-center gap-1"><Icon name="event_available" size={14}/> Disponibilidade *</label>
                <p className="text-[10px] mb-2 opacity-60">Dias de trabalho:</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {DAY_OPTIONS.map((d,i) => (
                    <button key={d} onClick={()=>toggleArr(days, setDays, i)} className={`w-9 h-9 rounded-full text-xs font-bold border transition-colors ${days.includes(i) ? 'bg-[#3730a3] text-white border-[#3730a3]' : (isDark?'border-[#3f3f46] text-[#a1a1aa]':'border-[#d1d5db] text-gray-500')}`}>{d}</button>
                  ))}
                </div>
                <p className="text-[10px] mb-2 opacity-60">Horários de atendimento:</p>
                <div className="flex flex-wrap gap-1.5">
                  {HOUR_OPTIONS.map(h => (
                    <button key={h} onClick={()=>toggleArr(hours, setHours, h)} className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${hours.includes(h) ? 'bg-[#3730a3] text-white border-[#3730a3]' : (isDark?'border-[#3f3f46] text-[#a1a1aa]':'border-[#d1d5db] text-gray-500')}`}>{h}</button>
                  ))}
                </div>
              </div>

              <label className="text-xs font-bold mb-1 block opacity-70">Descrição Detalhada (Opcional)</label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Descreva o que está incluso no serviço..." rows={3} className={`w-full p-3.5 rounded-xl mb-6 border outline-none text-sm font-medium ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}`} />
              
              <button disabled={!t || !p || !cat} onClick={handleSave} className="w-full py-4 rounded-2xl font-black bg-[#f97316] text-black disabled:opacity-50 active:scale-95 transition-transform">Salvar Serviço</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex flex-col gap-4">
        {services.length === 0 && !adding && (
           <div className={`text-center py-10 px-6 rounded-3xl border-2 border-dashed ${isDark?'border-[#3f3f46]':'border-[#d1d5db]'}`}>
             <Icon name="post_add" size={48} className="mx-auto mb-3 opacity-30" />
             <p className={`text-sm font-medium ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>Você ainda não tem serviços cadastrados. <br/>Clique no '+' para criar o seu primeiro anúncio.</p>
           </div>
        )}
        {services.map((s:any) => {
          const catObj = CATEGORIES.find((c:any) => c.id === s.categoryId);
          return (
            <div key={s.id} className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
              {s.imageUrls?.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x mb-2">
                  {s.imageUrls.map((img:string, i:number) => <img key={i} src={img} className="w-full h-40 shrink-0 snap-center object-cover rounded-xl" />)}
                </div>
              ) : (s.imageUrl && <img src={s.imageUrl} className="w-full h-40 object-cover rounded-xl mb-2" />)}
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {catObj && <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase ${isDark?'bg-[#3f3f46] text-[#a1a1aa]':'bg-gray-100 text-gray-500'}`}>{catObj.name}</span>}
                    {s.duration && <span className={`text-[10px] font-bold flex items-center gap-1 ${isDark?'text-[#a1a1aa]':'text-gray-400'}`}><Icon name="schedule" size={12}/> {s.duration}</span>}
                  </div>
                  <p className="font-bold text-lg leading-tight mb-1">{s.title}</p>
                  <p className={`text-xl font-black ${isDark?'text-[#60a5fa]':'text-[#002a5d]'}`}>R$ {s.price.toFixed(2)}</p>
                </div>
                <button onClick={()=>remove(s.id)} className="p-2.5 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-full active:scale-95 transition-transform"><Icon name="delete" size={20} /></button>
              </div>
              {s.paymentMethods?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.paymentMethods.map((pm:string)=><span key={pm} className={`text-[9px] font-bold px-2 py-0.5 rounded border ${isDark?'border-[#3f3f46] text-[#a1a1aa]':'border-gray-200 text-gray-500'}`}>{pm}</span>)}
                </div>
              )}
              {s.description && <p className={`text-sm mt-1 line-clamp-3 leading-relaxed ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>{s.description}</p>}
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
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#18181b] text-white' : 'bg-[#f8f9fa] text-[#191c1d]'}`}>
      <header className="absolute top-0 w-full z-50 flex items-center justify-between px-4 py-3">
        <button onClick={onBack} className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white"><Icon name="arrow_back" /></button>
        <button onClick={() => { if(!user) go('auth'); else toggleFavorite(pro.id); }} className="p-2 rounded-full bg-black/20 backdrop-blur-sm"><Icon name="favorite" fill={isFav} className={isFav ? 'text-[#c2185b]' : 'text-white'} /></button>
      </header>
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="relative w-full h-80"><img src={pro.coverUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=300&fit=crop'} className="w-full h-full object-cover" /><div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#18181b] to-transparent' : 'from-[#f8f9fa] to-transparent'}`} /></div>
        <div className="px-4 -mt-10 relative z-10">
          <h2 className="font-black text-2xl leading-tight mb-1">{pro.name}</h2>
          <p className={`text-base font-semibold ${isDark?'text-[#60a5fa]':'text-[#002a5d]'}`}>{pro.profession}</p>
          
          <div className="flex items-center gap-4 mt-3 mb-6">
            <span className="flex items-center gap-1 font-bold"><Icon name="star" size={18} className="text-[#f97316]" fill/> {pro.rating.toFixed(1)} <span className="opacity-50 font-normal">({pro.reviewsCount})</span></span>
            {pro.region && <span className="flex items-center gap-1 text-sm opacity-70"><Icon name="location_on" size={16}/> {pro.region}</span>}
          </div>
          
          {pro.description && (
            <div className={`p-5 rounded-3xl mb-8 border shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
              <h3 className="font-black text-lg mb-2">Sobre o Profissional</h3>
              <p className={`text-sm leading-relaxed ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>{pro.description}</p>
            </div>
          )}
          
          <h3 className="font-black text-xl mb-4">Serviços Disponíveis</h3>
          <div className="flex flex-col gap-4 mb-8">
            {services.length === 0 ? (
              <p className={`text-sm py-4 ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>Nenhum serviço cadastrado.</p>
            ) : (
              services.map((s:any) => (
                <div key={s.id} className={`p-4 rounded-3xl border flex flex-col shadow-sm overflow-hidden ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
                  {s.imageUrls?.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x mb-3 -mx-4 px-4">
                      {s.imageUrls.map((img:string, i:number) => <img key={i} src={img} className="w-[85%] h-40 shrink-0 snap-center object-cover rounded-xl" />)}
                    </div>
                  ) : (s.imageUrl && <img src={s.imageUrl} className="w-full h-40 object-cover rounded-xl mb-3" />)}
                  
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-lg leading-tight mb-1">{s.title}</p>
                      {s.duration && <span className={`text-[11px] font-bold flex items-center gap-1 mb-2 ${isDark?'text-[#a1a1aa]':'text-gray-400'}`}><Icon name="schedule" size={12}/> {s.duration}</span>}
                      <p className={`text-lg font-black ${isDark?'text-[#60a5fa]':'text-[#002a5d]'}`}>R$ {s.price.toFixed(2)}</p>
                    </div>
                    <button onClick={() => { if(!user) go('auth'); else setBookModal(s); }} className="px-4 py-2 rounded-xl font-bold text-sm bg-[#f97316] text-black active:scale-95 transition-transform shrink-0">Agendar</button>
                  </div>
                  {s.paymentMethods?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {s.paymentMethods.map((pm:string)=><span key={pm} className={`text-[9px] font-bold flex items-center gap-1 px-2 py-1 rounded border ${isDark?'border-[#3f3f46] text-[#a1a1aa]':'border-gray-200 text-gray-500'}`}><Icon name="payments" size={10}/> {pm}</span>)}
                    </div>
                  )}
                  {s.description && <p className={`text-sm mt-3 leading-relaxed ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>{s.description}</p>}
                </div>
              ))
            )}
          </div>
          
          <h3 className="font-black text-xl mb-4 flex items-center gap-2"><Icon name="star" fill className="text-[#f97316]"/> Avaliações</h3>
          {reviews.length === 0 ? <p className={`text-sm py-4 ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>Ainda não há avaliações.</p> : reviews.map((r:any) => (
             <div key={r.id} className={`p-4 rounded-xl border mb-3 shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
               <div className="flex items-center gap-1 mb-2 text-[#f97316]"><Icon name="star" fill size={16}/> <span className={`font-bold text-sm ${isDark?'text-white':'text-black'}`}>{r.rating.toFixed(1)}</span></div>
               <p className={`text-sm ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>{r.text || 'Sem comentário.'}</p>
               <p className={`text-xs mt-3 font-bold ${isDark?'text-gray-500':'text-gray-400'}`}>{r.clientName}</p>
             </div>
          ))}
        </div>
      </div>
      <div className={`fixed bottom-0 w-full max-w-[448px] p-4 pt-8 z-40 bg-gradient-to-t ${isDark?'from-[#18181b] via-[#18181b]':'from-[#f8f9fa]'} to-transparent pointer-events-none`}>
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => { if(!user) go('auth'); else go('chat-detail', {id: pro.id, name: pro.name}); }} className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46] text-[#60a5fa]':'bg-white border-[#e5e7eb] text-[#002a5d]'}`}><Icon name="chat" size={24} /></button>
          <button onClick={() => { if(!user) go('auth'); else if (services.length > 0) setBookModal(services[0]); }} className="flex-1 rounded-2xl font-black text-lg text-black bg-[#f97316] active:scale-95 transition-transform">Agendar Principal</button>
        </div>
      </div>
      <AnimatePresence>
        {bookModal && <BookingModal proId={pro.id} svc={bookModal} onClose={()=>setBookModal(null)} onBook={(d:string, t:string) => { 
add({ professionalId: pro.id, clientId: user.id, serviceId: bookModal.id, serviceTitle: bookModal.title, price: bookModal.price, date: d, time: t, status: 'approved', clientName: user.name, professionalName: pro.name }); setBookModal(null); 
show('Agendado com sucesso!'); go('orders'); }} isDark={isDark} />}
      </AnimatePresence>
    </div>
  );
}

function BookingModal({ proId, svc, onClose, onBook, isDark }: any) {
  const [d, setD] = useState(''); 
  const [t, setT] = useState('');
  
  const occupiedTimes = useProviderSchedule(proId, d);
  
  const dayOfWeek = d ? new Date(d + 'T00:00:00').getDay() : -1;
  const isDayAvailable = svc.availableDays ? svc.availableDays.includes(dayOfWeek) : true;
  const availableHours = svc.availableHours?.length > 0 ? svc.availableHours : ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];

  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" />
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className={`fixed bottom-0 left-0 w-full rounded-t-3xl z-[101] p-6 shadow-2xl ${isDark ? 'bg-[#27272a] text-white' : 'bg-white text-gray-900'}`}>
        <h2 className="font-black text-2xl mb-1">Agendar</h2>
        <p className={`text-sm mb-6 ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>{svc.title} - R$ {svc.price.toFixed(2)}</p>
        
        <label className="text-xs font-bold mb-2 block opacity-70">Escolha a Data</label>
        <input type="date" value={d} onChange={e=>{setD(e.target.value); setT('');}} min={new Date().toISOString().split('T')[0]} className={`w-full border rounded-xl py-4 px-4 mb-4 outline-none font-medium ${isDark?'bg-[#18181b] border-[#3f3f46]':'bg-[#f8f9fa] border-[#e5e7eb]'}`} />
        
        {d && !isDayAvailable && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold mb-6 text-center">
            O profissional não atende neste dia da semana.
          </div>
        )}

        {d && isDayAvailable && (
          <>
            <label className="text-xs font-bold mb-2 block opacity-70">Escolha o Horário</label>
            <div className="flex flex-wrap gap-2 mb-6 max-h-[160px] overflow-y-auto hide-scrollbar">
              {availableHours.map((h: string) => {
                const isOccupied = occupiedTimes.includes(h);
                const isSelected = t === h;
                return (
                  <button 
                    key={h} 
                    disabled={isOccupied} 
                    onClick={()=>setT(h)} 
                    className={`px-4 py-2.5 rounded-lg text-sm font-bold border transition-colors ${isOccupied ? 'opacity-30 bg-gray-200 dark:bg-gray-800 border-transparent cursor-not-allowed' : isSelected ? 'bg-[#f97316] text-black border-[#f97316]' : (isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white border-[#e5e7eb] text-gray-800')}`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <button onClick={() => onBook(d,t)} disabled={!d||!t||!isDayAvailable} className="w-full py-4 rounded-2xl font-black text-lg text-black disabled:opacity-50 bg-[#f97316] active:scale-95 transition-transform">Confirmar Agendamento</button>
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

function ChatListScreen({ user, pros, isDark }: any) {
  const navigate = useNavigate();
  const { msgs } = useChat(user?.id);
  const chatPartners = Array.from(new Set(msgs.map((m:any) => m.senderId === user?.id ? m.receiverId : m.senderId)));

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={()=>navigate(-1)}><Icon name="arrow_back" /></button>
        <h1 className="font-black text-2xl">Mensagens</h1>
      </div>
      {chatPartners.length === 0 && <div className="text-center py-10 text-gray-500"><Icon name="forum" size={48} className="opacity-30 mb-2" /><p className="text-sm">Nenhuma mensagem recente.</p></div>}
      <div className="flex flex-col gap-2">
        {chatPartners.map((pid:any) => {
          const lastMsg = msgs.filter((m:any) => m.participants.includes(pid)).pop();
          const partnerName = pros.find((p:any) => p.id === pid)?.name || 'Cliente';
          return (
            <button key={pid} onClick={()=>navigate(`/chat/${pid}`)} className={`p-4 rounded-xl border flex items-center gap-4 shadow-sm text-left ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-black shrink-0"><Icon name="person" /></div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-lg">{partnerName}</h3>
                <p className={`text-sm truncate ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>{(lastMsg as any)?.text}</p>
              </div>
              <Icon name="chevron_right" className={isDark?'text-[#a1a1aa]':'text-gray-400'} />
            </button>
          )
        })}
      </div>
    </div>
  );
}

function ChatDetailScreen({ user, isDark }: any) {
  const navigate = useNavigate();
  const { id: partnerId } = useParams();
  const { msgs, send } = useChat(user?.id);
  const [text, setText] = useState('');
  const chatMsgs = msgs.filter((m:any) => (m.senderId===user?.id && m.receiverId===partnerId) || (m.senderId===partnerId && m.receiverId===user?.id));

  return (
    <div className={`flex flex-col h-screen ${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}`}>
      <header className={`border-b p-4 flex items-center gap-3 ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white'}`}>
        <button onClick={()=>navigate(-1)}><Icon name="arrow_back" /></button>
        <h2 className="font-bold">Conversa</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {chatMsgs.map((m:any) => (
          <div key={m.id} className={`max-w-[80%] rounded-xl p-3 text-sm ${m.senderId === user?.id ? 'bg-[#f97316] text-black self-end rounded-br-sm' : (isDark?'bg-[#3f3f46] text-white':'bg-[#e1e3e4] text-[#191c1d]') + ' self-start rounded-bl-sm'}`}>{m.text}</div>
        ))}
      </div>
      <div className={`p-4 border-t flex gap-2 pb-8 ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white'}`}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&text&&partnerId){send(partnerId,text);setText('');}}} placeholder="Mensagem..." className={`flex-1 border rounded-full px-4 py-3 outline-none text-sm ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white'}`} />
        <button onClick={()=>{if(text&&partnerId){send(partnerId,text);setText('');}}} className="w-10 h-10 rounded-full bg-[#f97316] flex items-center justify-center text-black"><Icon name="send" size={20} /></button>
      </div>
    </div>
  );
}

function EditProfileModal({ user, onClose, onSave, isDark, show }: any) {
  const [av, setAv] = useState(user.avatarUrl || '');
  const [cv, setCv] = useState(user.coverUrl || '');
  const [desc, setDesc] = useState(user.description || '');
  const [aiGenerating, setAiGenerating] = useState(false);
  
  const generateAIAvatar = () => {
    if(!av) { if(show) show('Por favor, cole um link de foto normal!'); return; }
    setAiGenerating(true);
    setTimeout(() => {
      setAv('https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop');
      if(show) show('✨ IA: Foto Profissional Gerada!');
      setAiGenerating(false);
    }, 4000);
  };

  const inputCls = `w-full p-4 rounded-xl border outline-none text-sm font-medium ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white border-[#e5e7eb]'}`;

  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" />
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className={`fixed bottom-0 left-0 w-full rounded-t-3xl z-[101] p-6 shadow-2xl max-h-[85vh] overflow-y-auto ${isDark?'bg-[#27272a] text-white':'bg-white text-[#191c1d]'}`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-black text-2xl">Editar Perfil</h2>
          <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 rounded-full"><Icon name="close"/></button>
        </div>
        
        <div className="mb-6">
          <label className="font-bold text-sm mb-2 block">Link da Foto de Perfil</label>
          <div className="flex gap-2">
            <input value={av} onChange={e=>setAv(e.target.value)} placeholder="https://..." className={`flex-1 p-4 rounded-xl border outline-none text-sm font-medium ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white border-[#e5e7eb]'}`} />
            <button disabled={aiGenerating} onClick={generateAIAvatar} className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center min-w-[56px]">
              {aiGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Icon name="auto_awesome" />}
            </button>
          </div>
          {aiGenerating && <p className="text-xs font-bold text-indigo-500 mt-2 animate-pulse flex items-center gap-1"><Icon name="memory" size={14} /> Processando com Inteligência Artificial...</p>}
          {!aiGenerating && <p className="text-xs opacity-60 mt-2">Cole o link da sua foto e clique na estrela mágica para transformar em foto de estúdio.</p>}
        </div>

        {user.role === 'professional' && (
          <>
            <label className="font-bold text-sm mb-2 block">Link da Foto de Capa (Opcional)</label>
            <input value={cv} onChange={e=>setCv(e.target.value)} placeholder="https://..." className={`${inputCls} mb-6`} />
            <label className="font-bold text-sm mb-2 block">Sobre o seu trabalho (Bio)</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Conte para os clientes a sua experiência e diferenciais..." className={`${inputCls} mb-6 min-h-[120px]`} />
          </>
        )}
        <button disabled={aiGenerating} onClick={()=>onSave({ avatarUrl: av, coverUrl: cv, description: desc })} className="w-full py-4 rounded-xl font-black text-black bg-[#f97316] shadow-lg active:scale-95 transition-transform mt-2 disabled:opacity-50">Salvar Alterações</button>
      </motion.div>
    </>
  );
}














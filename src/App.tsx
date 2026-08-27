import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PROFESSIONALS, MOCK_REVIEWS, MOCK_COUPONS } from './data';
import { Professional, UserRole, AppUser, ProfService, Appointment, Review, ChatMessage, Coupon } from './types';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { GlobalNotifications } from "./components/GlobalNotifications";
import { Logo } from "./components/Logo";
import { Sidebar } from "./components/Sidebar";
import { MapView } from "./components/MapView";
type Screen = 'home' | 'search' | 'orders' | 'profile' | 'pro-detail' | 'auth' | 'dashboard' | 'my-services' | 'favorites' | 'chat-list' | 'chat-detail';

function Icon({ name, fill, size, className, ...rest }: { name: string; fill?: boolean; size?: number; className?: string; [x: string]: any }) {
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
  const loginWithEmail = async (email: string, pass: string) => {
    try { await signInWithEmailAndPassword(auth, email, pass); return { ok: true }; }
    catch (e: any) { return { ok: false, error: e.message }; }
  };
  const registerWithEmail = async (email: string, pass: string, name: string, role: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser: AppUser = {
        id: cred.user.uid, name, email, role: role as UserRole,
        avatarInitial: name[0].toUpperCase(), favorites: [], createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', cred.user.uid), newUser);
      setUser(newUser);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
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
  return { user, loading, authError, loginWithGoogle, loginWithEmail, registerWithEmail, logout, updateRole, toggleFavorite, updateProfile };
}

function useSearch() {
  const [pros, setPros] = useState<Professional[]>([]);
  useEffect(() => {
    const fetchPros = async () => {
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'professional')));
      const dbPros = await Promise.all(snap.docs.map(async (d) => {
        const u = d.data();
        const svcSnap = await getDocs(query(collection(db, 'services'), where('professionalId', '==', d.id)));
        const services = svcSnap.docs.map(sd => ({ ...sd.data(), id: sd.id } as ProfService));
        
        return {
          id: d.id, name: u.name, profession: u.profession || 'Especialista',
          avatarUrl: u.avatarUrl || `https://ui-avatars.com/api/?name=${u.avatarInitial}&background=random`,
          coverUrl: u.coverUrl || `https://picsum.photos/seed/${d.id}/600/300`,
          rating: u.rating || 5.0, verified: true, services, description: u.description
        } as Professional;
      }));
      setPros([...PROFESSIONALS, ...dbPros]);
    };
    fetchPros();
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

  const add = async (s: Omit<ProfService, 'id' | 'professionalId'>) => { if(!pid) return; await addDoc(collection(db, 'services'), { ...s, professionalId: pid }); load(); };
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
    data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
  const remove = async (id: string) => {
    await deleteDoc(doc(db, 'appointments', id));
    load();
  };
  return { apts, add, updateStatus, remove };
}

function useChat(uid?: string) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(query(collection(db, 'chats'), where('participants', 'array-contains', uid)), (snap) => {
      let data = snap.docs.map(d => ({ ...d.data(), id: d.id } as ChatMessage));
      data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMsgs(data);
    });
    return unsub;
  }, [uid]);
  const send = async (receiverId: string, text: string, type: 'text'|'proposal' = 'text', proposal?: any) => {
    if(!uid) return;
    await addDoc(collection(db, 'chats'), { senderId: uid, receiverId, text, participants: [uid, receiverId], createdAt: new Date().toISOString(), type, proposal });
  };
  const updateMessage = async (msgId: string, updates: any) => { await updateDoc(doc(db, 'chats', msgId), updates); }; return { msgs, send, updateMessage };
}

function useReviews(pid?: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => {
    if(!pid) return;
    getDocs(query(collection(db, 'reviews'), where('professionalId', '==', pid))).then(snap => {
      let data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Review));
      data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    { id: '/busca', icon: 'home', label: 'Home' },
    { id: '/pesquisa', icon: 'search', label: 'Buscar' },
    { id: '/pedidos', icon: 'assignment', label: 'Pedidos' },
    { id: '/perfil', icon: 'person', label: 'Perfil' }
  ];

  const proTabs = [
    { id: '/agenda', icon: 'dashboard', label: 'Painel' },
    { id: '/pedidos', icon: 'calendar_month', label: 'Agenda' },
    { id: '/chat-list', icon: 'chat', label: 'Chat' },
    { id: '/perfil', icon: 'person', label: 'Perfil' }
  ];

  const tabs = currentRole === 'professional' ? proTabs : clientTabs;
  
  return (
    <div className={`w-full max-w-[448px] shrink-0 border-t flex justify-around items-center px-2 z-50 transition-colors duration-300 mb-[calc(-1*env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] h-[calc(4rem+env(safe-area-inset-bottom))] ${isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-[#e5e7eb]'}`}>
       {tabs.map(t => {
         const active = loc.pathname.startsWith(t.id);
         return (
         <Link to={t.id} key={t.id} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${active ? 'text-[#f97316]' : (isDark ? 'text-[#a1a1aa]' : 'text-gray-400')}`}>
           <Icon name={t.icon} fill={active} size={24} />
           <span className="text-[10px] font-bold mt-1">{t.label}</span>
         </Link>
       )})}
    </div>
  )
}

function AppContent() {
  const { user, loading, authError, loginWithGoogle, loginWithEmail, registerWithEmail, logout, updateRole, toggleFavorite, updateProfile } = useAuth();
  const { pros } = useSearch();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { t, show } = useToast();
  
  const [currentRole, setCurrentRole] = useState(user?.currentMode || user?.role || 'client');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useEffect(() => {
    const handleOpen = () => setIsSidebarOpen(true);
    window.addEventListener('open-sidebar', handleOpen);
    return () => window.removeEventListener('open-sidebar', handleOpen);
  }, []);
  useEffect(() => { if (user) setCurrentRole(user.currentMode || user.role); }, [user?.currentMode, user?.role]);
  
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
  
  const hideBottomNav = ['/login', '/cadastro', '/auth'].includes(loc.pathname) || loc.pathname.startsWith('/servico/') || loc.pathname.startsWith('/chat/');
  
  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole }}>
      <GlobalNotifications user={user} isDark={isDark} />
      <Sidebar isOpen={isSidebarOpen} close={() => setIsSidebarOpen(false)} user={user} isDark={isDark} logout={logout} />
      <div className={`flex justify-center h-screen h-[100dvh] overflow-hidden ${isDark ? 'bg-black' : 'bg-[#e7e8e9]'}`}>
        <div className={`w-full max-w-[448px] h-full relative flex flex-col overflow-hidden shadow-2xl transition-colors duration-300 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${isDark ? 'bg-[#18181b] text-white' : 'bg-[#f8f9fa] text-[#191c1d]'}`}>
          
          {!hideBottomNav && !loc.pathname.startsWith('/servico/') && (
            <header className={`w-full sticky top-0 z-50 flex items-center justify-center px-4 py-3 ${isDark ? 'bg-[#18181b]' : 'bg-[#f8f9fa]'}`}>
              <button onClick={() => setIsSidebarOpen(true)} className={`absolute left-4 w-10 h-10 flex items-center justify-center ${isDark?'text-white':'text-black'}`}>
                <Icon name="menu" size={24} />
              </button>
              <Logo isDark={isDark} hideSubtitle={true} />
            </header>
          )}

          <div className="flex-1 overflow-y-auto min-h-0">
            <Routes>
               <Route path="/" element={<Navigate to="/busca" />} />
               <Route path="/busca" element={<SearchScreen pros={pros} isDark={isDark} user={user} show={show} toggleFavorite={toggleFavorite} />} />
               <Route path="/pedidos" element={<OrdersScreen user={user} pros={pros} go={go} isDark={isDark} show={show} />} />
               
               <Route path="/perfil" element={<ProfileScreen user={user} isDark={isDark} logout={logout} loginWithGoogle={loginWithGoogle} toggleDarkMode={toggleDarkMode} updateProfile={updateProfile} show={show} />} />
               <Route path="/auth" element={<AuthScreen loginWithGoogle={loginWithGoogle} loginWithEmail={loginWithEmail} registerWithEmail={registerWithEmail} isDark={isDark} show={show} />} />

               
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

function HomeScreen({ pros, isDark, user, toggleFavorite }: any) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  
  const topServices = useMemo(() => {
    let all = pros.flatMap((p:any) => (p.services || []).map((s:any) => ({ ...s, pro: p })));
    return all.sort((a:any, b:any) => b.pro.rating - a.pro.rating).slice(0, 5);
  }, [pros]);

  const HOME_CATEGORIES = [
    { id: 'limpeza', name: 'Limpeza', icon: 'cleaning_services', bg: 'bg-[#dbeafe]', text: 'text-[#1e3a8a]' },
    { id: 'reparos', name: 'Reparos', icon: 'plumbing', bg: 'bg-[#ffedd5]', text: 'text-[#c2410c]' },
    { id: 'beleza', name: 'Beleza', icon: 'spa', bg: 'bg-[#fce7f3]', text: 'text-[#be185d]' },
    { id: 'aulas', name: 'Aulas', icon: 'school', bg: 'bg-[#dcfce7]', text: 'text-[#15803d]' },
    { id: 'fretes', name: 'Fretes', icon: 'local_shipping', bg: 'bg-[#f3f4f6]', text: 'text-[#374151]' },
    { id: 'ti', name: 'T.I.', icon: 'computer', bg: 'bg-[#f3f4f6]', text: 'text-[#374151]' },
    { id: 'pet', name: 'Pet', icon: 'pets', bg: 'bg-[#f3f4f6]', text: 'text-[#374151]' },
    { id: 'mais', name: 'Mais', icon: 'more_horiz', bg: 'bg-[#f3f4f6]', text: 'text-[#374151]' },
  ];

  return (
    <div className="pb-8 overflow-y-auto hide-scrollbar">
      {/* Header handled by global layout? No, global layout only provides container. We need Header. */}
      
      
      <div className={`px-4 pt-2 pb-6 ${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}`}>
        <div className={`flex items-center p-1 rounded-[2rem] border shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
          <Icon name="search" className={`ml-4 ${isDark?'text-[#a1a1aa]':'text-gray-400'}`} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="O que você precisa hoje?" className="flex-1 bg-transparent p-3 outline-none text-sm font-medium placeholder-opacity-50" />
          <button onClick={() => navigate('/busca', { state: { q } })} className="px-5 py-2.5 rounded-full bg-[#f97316] text-black font-bold text-sm shadow-md active:scale-95 transition-transform mr-1">Buscar</button>
        </div>
      </div>

      <div className="px-4 mb-8">
        <div className="rounded-2xl bg-[#0f172a] p-6 text-white relative overflow-hidden shadow-lg">
          <div className="relative z-10 w-3/4">
            <h2 className="font-black text-xl mb-1 leading-tight">Desconto Especial</h2>
            <p className="text-sm opacity-90 mb-4">20% off em Limpeza Residencial</p>
            <button className="px-4 py-1.5 bg-[#f97316] text-black text-xs font-black rounded-lg shadow-sm active:scale-95 transition-transform">Resgatar</button>
          </div>
          <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-black/40 to-transparent"></div>
        </div>
      </div>

      <div className="px-4 mb-8">
        <h2 className="font-bold text-lg mb-4">Categorias</h2>
        <div className="grid grid-cols-4 gap-y-4 gap-x-2">
          {HOME_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => navigate('/busca', { state: { category: c.name }})} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${isDark ? 'bg-[#27272a]' : c.bg}`}>
                <Icon name={c.icon} className={isDark ? 'text-white' : c.text} />
              </div>
              <span className="text-[10px] font-bold">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        <div className="flex justify-between items-end mb-4">
          <h2 className="font-bold text-lg">Recomendados</h2>
          <button onClick={() => navigate('/busca')} className="text-sm font-semibold text-[#002a5d] dark:text-[#60a5fa]">Ver todos</button>
        </div>
        <div className="flex flex-col gap-4">
          {topServices.map((s:any) => (
            <Link to={`/servico/${s.id}`} key={s.id} className={`flex items-stretch gap-4 p-3 rounded-2xl border shadow-sm active:scale-[0.98] transition-transform ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                <img src={s.pro?.avatarUrl || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop"} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center flex-1 py-1">
                <div className="flex items-center gap-1 mb-0.5">
                  <h3 className="font-bold text-base">{s.pro.name}</h3>
                  {s.pro.verified && <Icon name="verified" size={14} className="text-[#2563eb]" fill />}
                </div>
                <p className={`text-sm font-medium mb-1 ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>{s.title}</p>
                <div className="flex items-center gap-1 text-xs font-bold text-[#f97316]">
                  <Icon name="star" size={14} fill/> {s.pro.rating.toFixed(1)} 
                  <span className={`font-normal ml-1 ${isDark?'text-gray-400':'text-gray-500'}`}>({s.pro.reviewsCount} avaliações)</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function SearchScreen({ pros, isDark, user, toggleFavorite, show }: any) {
  const loc = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState(loc.state?.q || loc.state?.category || '');
  const [filter, setFilter] = useState(loc.state?.filter || 'all');
  const [bookingService, setBookingService] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list'|'map'>(loc.state?.view || 'list');
  useEffect(() => {
    if(loc.state?.view) setViewMode(loc.state.view);
    if(loc.state?.filter) setFilter(loc.state.filter);
    if(loc.state?.q !== undefined || loc.state?.category) setQ(loc.state.q || loc.state.category || '');
  }, [loc.state]);
  
  const allServices = useMemo(() => {
    return pros.flatMap((p:any) => (p.services || []).map((s:any) => ({ ...s, pro: p })));
  }, [pros]);

  let filtered = allServices.filter((s:any) => {
    if (filter === 'favorites') {
       if(!user?.favorites?.includes(s.pro.id)) return false;
    }
    if (!q) return true;
    const term = q.toLowerCase();
    return s.title.toLowerCase().includes(term) || s.description?.toLowerCase().includes(term) || s.pro.name.toLowerCase().includes(term) || s.pro.profession.toLowerCase().includes(term) || s.category?.toLowerCase() === term || s.categoryId?.toLowerCase() === term;
  });
  
  if (filter === 'price') { filtered.sort((a:any, b:any) => a.price - b.price); } 
  else if (filter === 'rate') { filtered.sort((a:any, b:any) => b.pro.rating - a.pro.rating); }

  return (
    <div className="pb-8 overflow-y-auto hide-scrollbar flex-1 flex flex-col h-full">
      
      
      <div className={`px-4 pt-2 pb-2 ${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}`}>
        <div className={`flex items-center p-1 rounded-[2rem] border shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
          <Icon name="search" className={`ml-4 ${isDark?'text-[#a1a1aa]':'text-gray-400'}`} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="O que você precisa hoje?" className="flex-1 bg-transparent p-3 outline-none text-sm font-medium placeholder-opacity-50" />
          <button className="px-5 py-2.5 rounded-full bg-[#f97316] text-black shadow-md active:scale-95 transition-transform mr-1 flex items-center justify-center">
            <Icon name="arrow_forward" size={20} />
          </button>
        </div>
      </div>
      
      
      <div className="px-4 mb-4 mt-2">
        <h2 className="font-bold text-lg mb-3">Categorias</h2>
        <div className="grid grid-cols-4 gap-y-4 gap-x-2">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => { setQ(c.name); window.scrollTo(0,0); }} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${isDark ? 'bg-[#27272a]' : 'bg-[#e0f2fe] text-[#0ea5e9]'}`}>
                <Icon name={c.icon} className={isDark ? 'text-white' : 'text-[#0ea5e9]'} />
              </div>
              <span className="text-[10px] font-bold">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* TOGGLE VIEW */}
      <div className="px-4 py-2 mb-2 flex justify-center">
        <div className={`flex rounded-xl p-1 relative w-[240px] shadow-sm border ${isDark?'bg-[#18181b] border-[#3f3f46]':'bg-gray-100 border-[#e5e7eb]'}`}>
           <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#f97316] rounded-lg shadow-md transition-all duration-300 ${viewMode === 'list' ? 'left-1' : 'left-[calc(50%+2px)]'}`} />
           <button onClick={() => setViewMode('list')} className={`flex-1 py-2 text-sm font-bold relative z-10 transition-colors flex items-center justify-center gap-1 ${viewMode === 'list' ? 'text-black' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}><Icon name="format_list_bulleted" size={16}/> Lista</button>
           <button onClick={() => setViewMode('map')} className={`flex-1 py-2 text-sm font-bold relative z-10 transition-colors flex items-center justify-center gap-1 ${viewMode === 'map' ? 'text-black' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}><Icon name="map" size={16}/> Mapa</button>
        </div>
      </div>

      <div className={`flex-1 ${viewMode === 'map' ? 'h-[400px] sm:h-[500px]' : ''}`}>
        {viewMode === 'map' ? (
          <MapView pros={pros} isDark={isDark} />
        ) : (
          <div className="px-4">
            <div className="flex justify-between items-center mb-4">
               <h2 className="font-black text-lg">Serviços em Destaque</h2>
               <div className="flex gap-2">
                 <button onClick={()=>setFilter('price')} className={`px-3 py-1.5 rounded-full font-bold text-xs border active:scale-95 transition-transform ${filter==='price' ? (isDark?'bg-[#27272a] text-white border-white':'bg-[#f8f9fa] text-black border-[#002a5d]') : (isDark?'bg-transparent border-[#3f3f46] text-gray-300':'bg-white border-[#e5e7eb] text-gray-700')}`}>
                   Menor Preço
                 </button>
                 <button onClick={()=>setFilter('rate')} className={`px-3 py-1.5 rounded-full font-bold text-xs border flex items-center gap-1 active:scale-95 transition-transform ${filter==='rate' ? (isDark?'bg-[#27272a] text-white border-white':'bg-[#e0e7ff] text-[#3730a3] border-[#3730a3]') : (isDark?'bg-transparent border-[#3f3f46] text-gray-300':'bg-white border-[#e5e7eb] text-gray-700')}`}>
                   <Icon name="star" size={14} /> Top
                 </button>
               </div>
            </div>
            
            {filtered.length === 0 && <div className="text-center py-10 opacity-50 font-medium">Nenhum serviço encontrado.</div>}

            <div className="flex flex-col gap-3 pb-4">
              {filtered.map((s:any) => {
                const isFav = user?.favorites?.includes(s.pro.id);
                return (
                  <div key={s.id} className={`flex flex-row p-3 rounded-2xl border shadow-sm items-center gap-3 ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
                    <div className="w-[100px] h-[100px] shrink-0 rounded-xl overflow-hidden relative bg-gray-200 dark:bg-gray-800">
                       <img src={s.imageUrls?.[0] || s.imageUrl || s.pro?.avatarUrl || "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop"} className="w-full h-full object-cover" />
                       <button onClick={() => toggleFavorite(s.pro.id)} className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform">
                         <Icon name="favorite" size={14} fill={isFav} className={isFav ? 'text-red-500' : 'text-white'} />
                       </button>
                    </div>
                    
                    <div className="flex flex-col flex-1 h-[100px] justify-between py-0.5">
                       <div>
                          <h3 className={`font-bold text-[15px] leading-tight mb-1 line-clamp-1 ${isDark?'text-white':'text-[#002a5d]'}`}>{s.title}</h3>
                          <Link to={`/servico/${s.id}`} className="flex items-center gap-1.5 active:opacity-70 transition-opacity mb-2">
                             <div className="w-4 h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                                <img src={s.pro?.avatarUrl || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop"} className="w-full h-full object-cover" />
                             </div>
                             <span className={`text-xs font-medium ${isDark?'text-gray-300':'text-gray-700'}`}>{s.pro.name}</span>
                             <div className="flex items-center text-[#f97316] font-bold text-[10px] ml-auto">
                                <Icon name="star" size={12} fill /> {s.pro.rating.toFixed(1)}
                             </div>
                          </Link>
                       </div>

                       <div className="flex justify-between items-end mt-auto">
                          <span className={`font-black text-sm whitespace-nowrap ${isDark?'text-[#60a5fa]':'text-blue-600'}`}>R$ {s.price.toFixed(2)}</span>
                          <button onClick={() => { if(!user) { show('Faça login primeiro!'); navigate('/auth'); return; } setBookingService(s); }} className="px-3 py-1.5 bg-[#f97316] text-black font-black text-[11px] rounded-lg active:scale-95 transition-transform shadow-md">
                            Agendar
                          </button>
                       </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {bookingService && 
          <BookingModal 
             proId={bookingService.pro.id} 
             svc={bookingService} 
             onClose={()=>setBookingService(null)} 
             onBook={async(d:any, t:any, selectedAddons:any[], recurrence:string, totalPrice:number, paymentMethod:string)=>{
                await addDoc(collection(db, 'appointments'), { professionalId: bookingService.pro.id, clientId: user.id, clientName: user.name, serviceId: bookingService.id, serviceTitle: bookingService.title, date: d, time: t, status: 'approved', price: totalPrice || bookingService.price, recurrence, addons: selectedAddons, paymentMethod, createdAt: new Date().toISOString() });
                setBookingService(null); show(`Pagamento aprovado via ${paymentMethod}! Dinheiro retido e reserva confirmada.`); navigate('/pedidos');
             }} 
             isDark={isDark} 
          />}
      </AnimatePresence>
    </div>
  )
}

function ServiceDetailScreen({ pros, user, isDark, show, toggleFavorite }: any) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookingService, setBookingService] = useState<any>(null);
  
  const allServices = useMemo(() => pros.flatMap((p:any) => (p.services || []).map((s:any) => ({ ...s, pro: p }))), [pros]);
  const initialSvc = allServices.find((s:any) => s.id === id);
  const pro = initialSvc?.pro || pros.find((p:any) => p.id === id);
  
  const { reviews } = useReviews(pro?.id);
  
  if (!pro) return <div className="p-8 text-center font-bold">Profissional não encontrado.</div>;
  const isFav = user?.favorites?.includes(pro.id);

  return (
    <div className={`min-h-screen pb-24 overflow-y-auto hide-scrollbar relative ${isDark?'bg-[#121212] text-white':'bg-[#f8f9fa] text-[#002a5d]'}`}>
      <div className={`relative h-[240px] w-full ${isDark?'bg-gray-800':'bg-gray-300'}`}>
        <img src={pro.coverUrl || pro.avatarUrl} className="w-full h-full object-cover opacity-60" />
        <div className={`absolute inset-0 bg-gradient-to-b ${isDark?'from-black/60 via-black/20 to-[#121212]':'from-black/50 via-black/10 to-[#f8f9fa]'}`}></div>
        
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
          <Icon name="arrow_back" className="text-white" />
        </button>
        <button onClick={() => toggleFavorite(pro.id)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
          <Icon name="favorite" fill={isFav} className={isFav ? 'text-red-500' : 'text-white'} />
        </button>
        
        <div className="absolute -bottom-10 left-4 flex items-end gap-4">
          <div className={`w-24 h-24 rounded-full border-4 overflow-hidden ${isDark?'border-[#121212] bg-gray-800':'border-[#f8f9fa] bg-gray-200'}`}>
            <img src={pro.avatarUrl || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop"} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
      
      <div className="px-4 mt-12 mb-6">
        <div className="flex justify-between items-start mb-1">
          <h1 className="font-black text-2xl leading-tight flex items-center gap-2">
            {pro.name}
            {pro.verified && <Icon name="verified" size={18} className="text-[#60a5fa]" fill />}
          </h1>
        </div>
        <p className={`font-medium text-sm mb-3 ${isDark?'text-gray-400':'text-gray-500'}`}>{pro.profession}</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-[#f97316] font-bold text-sm">
            <Icon name="star" size={16} fill/> {pro.rating.toFixed(1)} <span className={`font-normal ml-1 ${isDark?'text-gray-500':'text-gray-400'}`}>({pro.reviewsCount} avaliações)</span>
          </div>
        </div>
      </div>
      
      <div className="px-4 mb-8">
        <h2 className="font-black text-lg mb-4">Serviços Oferecidos</h2>
        {(!pro.services || pro.services.length === 0) ? (
          <div className="text-center py-6 opacity-50">Nenhum serviço cadastrado.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {pro.services.map((s:any) => (
              <div key={s.id} className={`p-3 rounded-2xl border flex items-center gap-3 shadow-sm ${isDark?'bg-[#1e1e1e] border-[#2a2a2a]':'bg-white border-[#e5e7eb]'}`}>
                 <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 shrink-0">
                   <img src={s.imageUrls?.[0] || s.imageUrl || pro.avatarUrl || "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop"} className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">
                   <h3 className="font-bold text-sm leading-tight mb-1">{s.title}</h3>
                   <span className={`font-black text-sm ${isDark?'text-[#60a5fa]':'text-blue-600'}`}>R$ {s.price.toFixed(2)}</span>
                 </div>
                 <div className="flex gap-2 shrink-0">
                   <button onClick={() => { if(!user) { show('Faça login primeiro!'); navigate('/auth'); return; } setBookingService({ ...s, pro }); }} className="w-10 h-10 rounded-full bg-[#f97316] text-black flex items-center justify-center active:scale-95 transition-transform shadow-md">
                     <Icon name="calendar_month" size={18} />
                   </button>
                   <button onClick={() => { if(!user) { show('Faça login primeiro!'); navigate('/auth'); return; } navigate(`/chat/${pro.id}`); }} className={`w-10 h-10 rounded-full border flex items-center justify-center active:scale-95 transition-transform ${isDark ? 'border-[#3f3f46] text-white' : 'border-gray-300 text-black'}`}>
                     <Icon name="chat" size={18} />
                   </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 mb-8">
        <h2 className="font-black text-lg mb-4">Avaliações</h2>
        {reviews.length === 0 ? <p className="opacity-50 text-sm">Ainda não há avaliações.</p> : (
          <div className="flex flex-col gap-4">
            {reviews.map((r:any) => (
              <div key={r.id} className={`p-4 rounded-2xl border ${isDark?'bg-[#1e1e1e] border-[#2a2a2a]':'bg-white border-[#e5e7eb]'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden text-xs flex items-center justify-center">
                     {r.clientAvatarUrl ? <img src={r.clientAvatarUrl} className="w-full h-full object-cover"/> : <Icon name="person" size={16} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-none">{r.clientName}</h4>
                    <div className="flex text-[#f97316] mt-0.5">
                      {[...Array(5)].map((_,i) => <Icon key={i} name="star" size={10} fill={i<r.rating} />)}
                    </div>
                  </div>
                </div>
                <p className={`text-sm ${isDark?'text-gray-300':'text-gray-700'}`}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {bookingService && 
          <BookingModal 
            proId={pro.id} 
            svc={bookingService} 
            onClose={()=>setBookingService(null)} 
            onBook={async(d:any, t:any, selectedAddons:any[], recurrence:string, totalPrice:number, paymentMethod:string)=>{
                await addDoc(collection(db, 'appointments'), { professionalId: bookingService.pro.id, clientId: user.id, clientName: user.name, serviceId: bookingService.id, serviceTitle: bookingService.title, date: d, time: t, status: 'approved', price: totalPrice || bookingService.price, recurrence, addons: selectedAddons, paymentMethod, createdAt: new Date().toISOString() });
                setBookingService(null); show(`Pagamento aprovado via ${paymentMethod}! Dinheiro retido e reserva confirmada.`); navigate('/pedidos');
             }} 
            isDark={isDark} 
          />
        }
      </AnimatePresence>
    </div>
  )
}

function DashboardProScreen({ user, isDark, go }: any) {
  const { apts, updateStatus } = useAppointments(user?.id, user?.role);
  const pending = apts.filter(a => a.status === 'approved');
  const earned = user.walletBalance || apts.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.price * 0.93), 0);

  return (
    <div className="pb-24">
      
      <div className="p-4">
       <h1 className="font-black text-2xl mb-2">Olá, {user.name.split(' ')[0]} 👋</h1>
       <p className={`text-sm mb-6 ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>Acompanhe seus ganhos e agenda do dia.</p>
       <div className={`p-6 rounded-3xl mb-8 shadow-md border flex flex-col justify-center items-center text-center ${isDark?'bg-gradient-to-br from-[#27272a] to-[#18181b] border-[#3f3f46]':'bg-gradient-to-br from-[#002a5d] to-[#001a40] border-[#002a5d] text-white'}`}>
         <p className="text-sm font-medium mb-1 opacity-80">Ganhos Totais (Concluídos)</p>
         <h2 className={`font-black text-4xl mb-4 ${isDark?'text-[#f97316]':'text-[#f97316]'}`}>R$ {earned.toFixed(2)}</h2>
         <div className="w-full h-[1px] bg-white/10 mb-4" />
         <div className="flex justify-between w-full px-4"><div><p className="text-xs opacity-70">Pendentes</p><p className="font-bold text-lg">{pending.length}</p></div><div><p className="text-xs opacity-70">Concluídos</p><p className="font-bold text-lg">{apts.filter(a=>a.status==='completed').length}</p></div></div>
       </div>
       
       <div className={`p-5 rounded-3xl mb-8 border shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
         <div className="flex justify-between items-end mb-2">
           <h3 className="font-black text-lg">Perfil Campeão</h3>
           <span className="font-bold text-[#f97316]">70%</span>
         </div>
         <div className="w-full h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 mb-4">
           <div className="h-full bg-[#f97316] rounded-full" style={{width: '70%'}}></div>
         </div>
         <p className={`text-xs mb-4 ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>Complete seu perfil para atrair mais clientes e ganhar o selo de verificação.</p>
         
         <div className="flex flex-col gap-3">
           <button onClick={()=>go('my-services')} className={`p-3 rounded-xl border flex items-center justify-between text-left active:scale-95 transition-transform ${isDark?'bg-[#18181b] border-[#3f3f46]':'bg-[#f8f9fa] border-[#e5e7eb]'}`}>
             <div>
               <p className="font-bold text-sm mb-0.5">Adicionar mais fotos</p>
               <p className={`text-[10px] ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>Serviços com fotos vendem 3x mais.</p>
             </div>
             <Icon name="chevron_right" />
           </button>
           <button onClick={()=>go('profile')} className={`p-3 rounded-xl border flex items-center justify-between text-left active:scale-95 transition-transform ${isDark?'bg-[#18181b] border-[#3f3f46]':'bg-[#f8f9fa] border-[#e5e7eb]'}`}>
             <div>
               <p className="font-bold text-sm mb-0.5">Verificar Identidade</p>
               <p className={`text-[10px] ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>Ganhe um selo de segurança.</p>
             </div>
             <Icon name="chevron_right" />
           </button>
         </div>
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
               
                 <button onClick={() => {
                   const codeStr = prompt('Digite o código de 4 dígitos do cliente:');
                   if(!codeStr) return;
                   const confirmCode = (a.id.length >= 4 ? a.id.slice(-4) : (a.id + '0000').slice(0,4)).toUpperCase();
                   if (codeStr.toUpperCase() === confirmCode) {
   updateStatus(a.id, 'completed');
   
   // Credit the professional's wallet (93% of the value)
   const proRef = doc(db, 'users', user.id);
   getDoc(proRef).then(snap => {
     if(snap.exists()) {
        const data = snap.data();
        const currentBalance = data.walletBalance || 0;
        const newBalance = currentBalance + (a.price * 0.93);
        updateDoc(proRef, { walletBalance: newBalance });
     }
   });

   alert('Código confirmado! O status foi alterado para Pagamento recebido e o valor foi para sua carteira digital.');
} else {
                     alert('Código inválido. Tente novamente.');
                   }
                 }} className="flex-1 py-3 rounded-xl bg-[#4ade80] text-[#14532d] font-bold text-sm flex items-center justify-center gap-1"><Icon name="check_circle" size={16}/> Validar Código</button>

             </div>
           </div>
         ))}
       </div>
    </div>
    </div>
  )
}

function NewServiceScreen({ user, isDark, show }: any) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/meus-servicos');
  }, [navigate]);
  return null;
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
    <div className="pb-24">
      
      <div className="p-4">
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
    </div>
  )
}

function OrdersScreen({ user, pros, go, isDark, show }: any) {
  const { apts, updateStatus, remove } = useAppointments(user?.id, user?.role);
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if(params.get('payment') === 'success') {
       if(show) show('Pagamento confirmado com sucesso! Dinheiro retido.');
       // Clean up URL
       window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [show]);
  const [reviewModal, setReviewModal] = useState<any>(null);

  const submitReview = async (rating: number, text: string) => {
    if (user.role === 'professional') {
      await addDoc(collection(db, 'reviews'), {
        professionalId: user.id, clientId: reviewModal.clientId, professionalName: user.name, rating, text, createdAt: new Date().toISOString(), type: 'pro_to_client'
      });
      await updateDoc(doc(db, 'appointments', reviewModal.id), { proReviewed: true });
      const clientRef = doc(db, 'users', reviewModal.clientId);
      const clientSnap = await getDoc(clientRef);
      if(clientSnap.exists()) {
        const data = clientSnap.data();
        const currentRating = data.rating || 5; const count = data.reviewsCount || 0;
        const newCount = count + 1; const newRating = ((currentRating * count) + rating) / newCount;
        await updateDoc(clientRef, { rating: newRating, reviewsCount: newCount });
      }
      setReviewModal(null);
      show('Avaliação enviada ao cliente!');
      return;
    }
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
  const filtered = apts.filter(a => filter === 'all' || (filter === 'active' && (a.status === 'approved' || a.status === 'pending')) || (filter === 'done' && a.status === 'completed') || (filter === 'cancelled' && a.status === 'cancelled'));
  
  return (
    <div className="pb-8 overflow-y-auto hide-scrollbar">
      
      
      <div className="px-4 mt-4">
        <h1 className="font-black text-2xl mb-1">{user.role==='professional' ? 'Agenda Completa' : 'Meus Pedidos'}</h1>
        <p className={`text-sm mb-4 ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>Acompanhe o status dos seus serviços solicitados.</p>
        
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-2">
           <button onClick={()=>setFilter('all')} className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap active:scale-95 transition-transform ${filter==='all' ? 'bg-[#002a5d] text-white' : (isDark?'bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46]':'bg-[#f3f4f6] text-gray-700 border border-gray-200')}`}>Todos</button>
           <button onClick={()=>setFilter('active')} className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap active:scale-95 transition-transform ${filter==='active' ? 'bg-[#002a5d] text-white' : (isDark?'bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46]':'bg-[#f3f4f6] text-gray-700 border border-gray-200')}`}>Em Andamento</button>
           <button onClick={()=>setFilter('done')} className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap active:scale-95 transition-transform ${filter==='done' ? 'bg-[#002a5d] text-white' : (isDark?'bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46]':'bg-[#f3f4f6] text-gray-700 border border-gray-200')}`}>Concluídos</button>
        </div>

        {filtered.length === 0 ? <p className="opacity-50 text-center py-10 font-medium">Nenhum pedido encontrado.</p> : (
          <div className="flex flex-col gap-4">
             {filtered.map(a => {
               const stCfg: Record<string, {label:string, border:string, badgeBg:string, badgeText:string}> = {
                 pending: { label: 'Em Andamento', border: '#f97316', badgeBg: isDark ? '#ffedd5' : '#ffedd5', badgeText: '#9a3412' },
                 approved: { label: 'Em Andamento', border: '#f97316', badgeBg: isDark ? '#ffedd5' : '#ffedd5', badgeText: '#9a3412' },
                 completed: { label: user.role === 'professional' ? 'Pagamento recebido' : 'Concluído', border: '#4ade80', badgeBg: isDark ? '#bbf7d0' : '#bbf7d0', badgeText: '#166534' },
                 cancelled: { label: 'Cancelado', border: '#fca5a5', badgeBg: isDark ? '#fee2e2' : '#fee2e2', badgeText: '#991b1b' }
               };
               const cfg = stCfg[a.status] || stCfg.pending;
               const pro = pros.find((p:any) => p.id === a.professionalId);
               
               const rawDate = a.date.split('-'); 
               const fmtDate = rawDate.length === 3 ? `${rawDate[2]} ${['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(rawDate[1])-1]}` : a.date;
               
               return (
                 <div key={a.id} className={`relative overflow-hidden rounded-2xl border shadow-sm p-4 flex flex-col gap-3 ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
                   <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{backgroundColor: cfg.border}} />
                   <div className="flex justify-between items-start pl-1">
                     <div className="flex gap-3">
                       {user.role === 'client' && pro?.avatarUrl ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"><img src={pro?.avatarUrl || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop"} className="w-full h-full object-cover"/></div>
                       ) : <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0"><Icon name="person" className="opacity-50" /></div>}
                       <div>
                         <div className="flex items-center gap-1 mb-0.5">
                           <h3 className="font-bold text-[15px]">{user.role === 'client' ? pro?.name : a.clientName}</h3>
                           {user.role === 'client' && pro?.verified && <Icon name="verified" size={14} className="text-[#2563eb]" fill />}
                         </div>
                         <p className={`text-xs font-medium ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>{a.serviceTitle}</p>
                       </div>
                     </div>
                     <span className="px-2 py-1 rounded text-[10px] font-bold shrink-0" style={{backgroundColor: cfg.badgeBg, color: cfg.badgeText}}>{cfg.label}</span>
                   </div>
                   
                   <div className={`mt-2 pt-3 border-t flex justify-between items-center pl-1 ${isDark?'border-[#3f3f46]':'border-[#e5e7eb]'}`}>
                     <p className={`text-xs font-medium ${isDark?'text-[#a1a1aa]':'text-gray-600'}`}>
                       {a.status==='cancelled'?'Data original:':(a.status==='completed'?'Realizado:':'Agendado:')} {fmtDate}, {a.time}
                     </p>
                     <span className={`font-black text-sm ${a.status==='cancelled'?'line-through opacity-50':(isDark?'text-[#60a5fa]':'text-[#002a5d]')}`}>
                       R$ {a.price.toFixed(2)}
                     </span>
                   </div>

                   {/* Pro Controls */}
                   {user.role === 'professional' && a.status === 'approved' && (
                     <div className="flex flex-col gap-2 mt-2 p-3 bg-gray-50 dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-[#3f3f46]">
                       <p className="text-xs text-center font-bold">Inserir Código do Cliente</p>
                       <div className="flex gap-2">
                         <input id={`code-${a.id}`} placeholder="EX: A1B2" className={`flex-1 px-3 py-2 border rounded-lg text-center font-bold uppercase ${isDark ? 'bg-[#18181b] border-[#3f3f46]' : 'bg-white'}`} maxLength={4} />
                         <button onClick={() => {
                           const el = document.getElementById(`code-${a.id}`) as HTMLInputElement;
                           const confirmCode = (a.id.length >= 4 ? a.id.slice(-4) : (a.id + '0000').slice(0,4)).toUpperCase();
                           if (el?.value.toUpperCase() === confirmCode) {
   updateStatus(a.id, 'completed');
   
   // Credit the professional's wallet (93% of the value)
   const proRef = doc(db, 'users', user.id);
   getDoc(proRef).then(snap => {
     if(snap.exists()) {
        const data = snap.data();
        const currentBalance = data.walletBalance || 0;
        const newBalance = currentBalance + (a.price * 0.93);
        updateDoc(proRef, { walletBalance: newBalance });
     }
   });

   if(show) show('Código confirmado! O status foi alterado para Pagamento recebido e o valor foi para sua carteira.');
} else {
                              if(show) show('Código inválido. Tente novamente.');
                           }
                         }} className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-bold active:scale-95">Validar</button>
                       </div>
                     </div>
                   )}
                   {user.role === 'professional' && a.status === 'pending' && (
                     <div className="flex gap-2 mt-2">
                       <button onClick={()=>updateStatus(a.id, 'approved')} className="flex-1 py-2 bg-[#f97316] text-black rounded-lg text-xs font-bold active:scale-95">Aceitar</button>
                       <button onClick={()=>updateStatus(a.id, 'cancelled')} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold active:scale-95">Recusar</button>
                     </div>
                   )}
                   
                   {user.role === 'professional' && a.status === 'completed' && !a.proReviewed && (
                     <button onClick={()=>setReviewModal(a)} className="w-full mt-2 py-2 bg-[#f97316] text-black rounded-lg text-xs font-bold active:scale-95">Avaliar Cliente</button>
                   )}
                   {/* Client Controls */}
                   {user.role === 'client' && a.status === 'approved' && (
                     <div className="flex flex-col gap-2 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                       <p className="text-xs text-center font-bold text-blue-600 dark:text-blue-400">Código de Liberação</p>
                       <p className="text-2xl text-center font-black tracking-widest text-[#002a5d] dark:text-white">{(a.id.length >= 4 ? a.id.slice(-4) : (a.id + '0000').slice(0,4)).toUpperCase()}</p>
                       <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">Forneça este código ao profissional apenas após a conclusão do serviço para liberar o pagamento.</p>
                     </div>
                   )}
                   {user.role === 'client' && a.status === 'completed' && !a.reviewed && (
                     <button onClick={()=>setReviewModal(a)} className="w-full mt-2 py-2 bg-[#f97316] text-black rounded-lg text-xs font-bold active:scale-95">{user.role === 'professional' ? 'Avaliar Cliente' : 'Avaliar Serviço'}</button>
                   )}
                   <button onClick={() => { if(window.confirm('Deseja excluir este pedido?')) remove(a.id); }} className="w-full mt-2 py-2 border border-red-500 text-red-500 rounded-lg text-xs font-bold active:scale-95 flex items-center justify-center gap-2"><Icon name="delete" size={16} /> Excluir Pedido</button>
                 </div>
               )
             })}
          </div>
        )}
      </div>
      <AnimatePresence>{reviewModal && <ReviewModal a={reviewModal} onClose={()=>setReviewModal(null)} onSubmit={submitReview} isDark={isDark} userRole={user.role} />}</AnimatePresence>
    </div>
  )
}

function ProDetailScreen({ pro, onBack, user, go, show, isDark, toggleFavorite }: any) {
  const { services } = useServices(pro.id);
  const { reviews } = useReviews(pro.id);
  const [bookModal, setBookModal] = useState<any>(null); // holds the selected service object
  const { add } = useAppointments(user?.id, user?.role);
  const isFav = user?.favorites?.includes(pro.id);

  return (
    <div className={`h-full flex flex-col overflow-hidden ${isDark ? 'bg-[#18181b] text-white' : 'bg-[#f8f9fa] text-[#191c1d]'}`}>
      <header className="absolute top-0 w-full z-50 flex items-center justify-between px-4 py-3">
        <button onClick={onBack} className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white"><Icon name="arrow_back" /></button>
        <button onClick={() => { if(!user) go('auth'); else toggleFavorite(pro.id); }} className="p-2 rounded-full bg-black/20 backdrop-blur-sm"><Icon name="favorite" fill={isFav} className={isFav ? 'text-[#c2185b]' : 'text-white'} /></button>
      </header>
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="relative w-full h-80"><img src={pro.coverUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=300&fit=crop'} className="w-full h-full object-cover" /><div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#18181b] to-transparent' : 'from-[#f8f9fa] to-transparent'}`} /></div>
        <div className="px-4 -mt-10 relative z-10">
          <h2 className="font-black text-2xl leading-tight mb-1 flex items-center gap-2">{pro.name}{pro.verified && <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full"><Icon name="verified_user" size={14} fill/> Verificado</span>}</h2>
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
          {user?.role === 'client' && (
             <button onClick={() => go('chat-detail', { id: pro.id })} className="w-14 h-14 bg-white dark:bg-[#27272a] rounded-2xl flex items-center justify-center shadow-lg border border-gray-200 dark:border-[#3f3f46] text-[#f97316]">
                <Icon name="chat" size={28} />
             </button>
          )}
          <button onClick={() => { if(!user) go('auth'); else go('chat-detail', {id: pro.id, name: pro.name}); }} className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${isDark?'bg-[#27272a] border-[#3f3f46] text-[#60a5fa]':'bg-white border-[#e5e7eb] text-[#002a5d]'}`}><Icon name="chat" size={24} /></button>
          <button onClick={() => { if(!user) go('auth'); else if (services.length > 0) setBookModal(services[0]); }} className="flex-1 rounded-2xl font-black text-lg text-black bg-[#f97316] active:scale-95 transition-transform">Agendar Principal</button>
        </div>
      </div>
      <AnimatePresence>
        {bookModal && <BookingModal proId={pro.id} svc={bookModal} onClose={()=>setBookModal(null)} onBook={async (d:any, t:any, addons:any, recurrence:any, totalPrice:any, paymentMethod:any) => { 
                add({ professionalId: pro.id, clientId: user.id, serviceId: bookModal.id, serviceTitle: bookModal.title, price: totalPrice || bookModal.price, date: d, time: t, status: 'approved', clientName: user.name, professionalName: pro.name, paymentMethod }); setBookModal(null); 
                show(`Pagamento aprovado via ${paymentMethod}! Dinheiro retido e reserva confirmada.`); go('orders'); }} isDark={isDark} />}
      </AnimatePresence>
    </div>
  );
}

function BookingModal({ proId, svc, onClose, onBook, isDark }: any) {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [d, setD] = useState(''); 
  const [t, setT] = useState('');
  
  // Phase 2: Add-ons & Recurrence
  const MOCK_ADDONS = [
    { id: 'a1', name: 'Atendimento Expresso', price: 20 },
    { id: 'a2', name: 'Garantia Estendida', price: 15 },
    { id: 'a3', name: 'Produto Ecológico', price: 10 }
  ];
  const addons = svc.addons || MOCK_ADDONS;
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  
  const [recurrence, setRecurrence] = useState<'once'|'weekly'|'biweekly'>('once');
  
  const occupiedTimes = useProviderSchedule(proId, d);
  
  const dayOfWeek = d ? new Date(d + 'T00:00:00').getDay() : -1;
  const isDayAvailable = svc.availableDays ? svc.availableDays.includes(dayOfWeek) : true;
  const availableHours = svc.availableHours?.length > 0 ? svc.availableHours : ['08:00','09:30','11:00','14:00','15:30','17:00'];

  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for(let i=0; i<14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const nextDays = getNextDays();
  
  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
  const addonTotal = addons.filter((a:any) => selectedAddons.includes(a.id)).reduce((acc:number, a:any) => acc + a.price, 0);
  const totalPrice = svc.price + addonTotal;

  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-[#f8f9fa] dark:bg-[#121212] z-[100] overflow-y-auto hide-scrollbar pb-36">
        
        <header className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1e1e1e] sticky top-0 z-10">
          <button onClick={() => step === 2 ? setStep(1) : onClose()} className="p-2"><Icon name="arrow_back" className="text-[#002a5d] dark:text-white" /></button>
          <h1 className="font-black text-xl text-[#002a5d] dark:text-white tracking-tight">Confirmar Agendamento</h1>
        </header>
        
        <div className="p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-4 flex gap-4 mb-6 shadow-sm">
            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 relative">
               <img src={svc?.pro?.avatarUrl || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop"} className="w-full h-full object-cover" />
               {svc.pro.verified && <div className="absolute top-2 right-2 p-0.5 bg-white rounded-full flex items-center justify-center"><Icon name="verified" size={16} className="text-blue-600" fill/></div>}
            </div>
            <div className="flex flex-col justify-center">
               <h3 className="font-black text-lg text-gray-900 dark:text-white leading-tight mb-1">{svc.pro.name}</h3>
               <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{svc.title}</p>
               <div className="flex items-center gap-1 text-xs font-bold text-[#f97316]">
                  <Icon name="star" size={14} fill/> {svc.pro.rating.toFixed(1)} 
                  <span className="font-normal ml-1 text-gray-500">({svc.pro.reviewsCount || 0} avaliações)</span>
               </div>
            </div>
          </div>

          {step === 1 ? (
          <>
            <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Escolha a Data</h2>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 mb-6">
              {nextDays.map(date => {
                const iso = date.toISOString().split('T')[0];
                const isSelected = d === iso;
                const weekDay = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][date.getDay()];
                const dayNum = date.getDate();
                return (
                  <button 
                    key={iso} 
                    onClick={() => { setD(iso); setT(''); }}
                    className={`w-[72px] shrink-0 aspect-[3/4] rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 dark:border-blue-400' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a]'}`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>{weekDay}</span>
                    <span className={`text-xl font-black ${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>{dayNum}</span>
                  </button>
                )
              })}
            </div>

            <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Horários Disponíveis</h2>
            {!d ? (
              <p className="text-sm text-gray-500 font-medium mb-6">Selecione uma data para ver os horários.</p>
            ) : !isDayAvailable ? (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold text-center mb-6">
                O profissional não atende neste dia.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {availableHours.map((h: string) => {
                  const isOccupied = occupiedTimes.includes(h);
                  const isSelected = t === h;
                  return (
                    <button 
                      key={h} 
                      disabled={isOccupied} 
                      onClick={()=>setT(h)}
                      className={`py-3 rounded-xl text-sm font-bold border transition-colors ${isOccupied ? 'opacity-30 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-[#2a2a2a] cursor-not-allowed text-gray-400' : isSelected ? 'bg-[#ffedd5] dark:bg-[#f97316] text-[#9a3412] dark:text-black border-[#f97316]' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a] text-gray-800 dark:text-gray-200'}`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            )}
              
            <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Serviços Adicionais (Modulares)</h2>
            <div className="flex flex-col gap-3 mb-6">
              {addons.map((a:any) => {
                const isSelected = selectedAddons.includes(a.id);
                return (
                  <label key={a.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a]'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                        {isSelected && <Icon name="check" size={16} />}
                      </div>
                      <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{a.name}</span>
                    </div>
                    <span className="font-black text-sm text-[#002a5d] dark:text-[#60a5fa]">+ R$ {a.price.toFixed(2)}</span>
                    <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleAddon(a.id)} />
                  </label>
                );
              })}
            </div>

            <h2 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Tornar este agendamento recorrente?</h2>
            <div className="flex bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden mb-6">
              <button onClick={() => setRecurrence('once')} className={`flex-1 py-3 text-xs font-bold transition-colors ${recurrence === 'once' ? 'bg-[#3730a3] text-white' : 'text-gray-500 dark:text-gray-400'}`}>Única vez</button>
              <button onClick={() => setRecurrence('weekly')} className={`flex-1 py-3 text-xs font-bold transition-colors border-x border-gray-200 dark:border-[#2a2a2a] ${recurrence === 'weekly' ? 'bg-[#3730a3] text-white' : 'text-gray-500 dark:text-gray-400'}`}>Semanal</button>
              <button onClick={() => setRecurrence('biweekly')} className={`flex-1 py-3 text-xs font-bold transition-colors ${recurrence === 'biweekly' ? 'bg-[#3730a3] text-white' : 'text-gray-500 dark:text-gray-400'}`}>Quinzenal</button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">Resumo do Pedido</h2>
              <div className="p-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-black/20 text-sm">
                <p><strong>Data:</strong> {d} às {t}</p>
                <p><strong>Recorrência:</strong> {recurrence === 'once' ? 'Única vez' : recurrence === 'weekly' ? 'Semanal' : 'Quinzenal'}</p>
                {selectedAddons.length > 0 && <p><strong>Adicionais:</strong> {addons.filter((a:any)=>selectedAddons.includes(a.id)).map((a:any)=>a.name).join(', ')}</p>}
                <p className="mt-2 font-bold text-[#f97316]">R$ {totalPrice.toFixed(2)} (Taxa de agendamento inclusa)</p>
              </div>
            </div>

            <div>
              <h2 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Forma de Pagamento</h2>
              <div className="flex flex-col gap-3">
                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'PIX' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a]'}`}>
                  <Icon name="pix" size={24} className="text-teal-500" />
                  <span className="font-bold flex-1 text-gray-800 dark:text-gray-200">PIX (Aprovação imediata)</span>
                  <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'PIX'} onChange={() => setPaymentMethod('PIX')} />
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'CREDIT_CARD' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a]'}`}>
                  <Icon name="credit_card" size={24} className="text-blue-500" />
                  <span className="font-bold flex-1 text-gray-800 dark:text-gray-200">Cartão de Crédito</span>
                  <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'CREDIT_CARD'} onChange={() => setPaymentMethod('CREDIT_CARD')} />
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'DEBIT_CARD' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#2a2a2a]'}`}>
                  <Icon name="account_balance_wallet" size={24} className="text-purple-500" />
                  <span className="font-bold flex-1 text-gray-800 dark:text-gray-200">Cartão de Débito</span>
                  <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'DEBIT_CARD'} onChange={() => setPaymentMethod('DEBIT_CARD')} />
                </label>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-orange-50 dark:bg-[#2a1708] border border-orange-200 dark:border-orange-900 text-xs text-orange-800 dark:text-orange-200">
              <p className="font-bold mb-1"><Icon name="lock" size={14} className="inline mr-1" />Pagamento Seguro (Sistema Anticálculo)</p>
              <p>O seu dinheiro fica retido com a plataforma e só é repassado ao profissional (93%) mediante o fornecimento do seu código secreto no ato do serviço.</p>
            </div>
          </div>
        )}

        </div><div className="fixed bottom-0 left-0 w-full max-w-[448px] bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-[#2a2a2a] p-4 z-[101]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total {recurrence !== 'once' && `(por sessão)`}</span>
            <span className="font-black text-xl text-[#002a5d] dark:text-[#60a5fa]">R$ {totalPrice.toFixed(2)}</span>
          </div>
          {step === 1 ? (
             <button onClick={() => setStep(2)} disabled={!d||!t||!isDayAvailable} className="w-full py-4 rounded-xl font-black text-lg text-black disabled:opacity-50 bg-[#f97316] active:scale-95 transition-transform">Avançar para Pagamento</button>
          ) : (
             <button onClick={() => onBook(d,t, selectedAddons, recurrence, totalPrice, paymentMethod)} disabled={!paymentMethod} className="w-full py-4 rounded-xl font-black text-lg text-black disabled:opacity-50 bg-[#f97316] active:scale-95 transition-transform">Confirmar e Pagar</button>
          )}
        </div>
      </motion.div>
    </>
  )
}

function ReviewModal({ a, onClose, onSubmit, isDark, userRole }: any) {
  const [r, setR] = useState(5); const [t, setT] = useState('');
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" />
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className={`fixed bottom-0 left-0 w-full rounded-t-3xl z-[101] p-6 shadow-2xl ${isDark ? 'bg-[#27272a] text-white' : 'bg-white text-gray-900'}`}>
        <h2 className="font-bold text-2xl mb-1">Avaliar Serviço</h2>
        <p className={`text-sm mb-6 ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>{userRole === 'professional' ? `Como foi o cliente ${a.clientName}?` : `Como foi o serviço de ${a.professionalName}?`}</p>
        <div className="flex justify-center gap-3 mb-8">
          {[1,2,3,4,5].map(i => <button key={i} onClick={()=>setR(i)} className="active:scale-90 transition-transform"><Icon name="star" fill={i<=r} size={48} className={i<=r ? 'text-[#f97316]' : (isDark?'text-[#3f3f46]':'text-gray-300')} /></button>)}
        </div>
        <textarea value={t} onChange={e=>setT(e.target.value)} placeholder="Deixe um comentário (opcional)" className={`w-full p-4 rounded-xl mb-6 border outline-none text-sm min-h-[100px] ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}`} />
        <button onClick={()=>onSubmit(r,t)} className="w-full py-4 rounded-xl font-bold text-black bg-[#f97316] shadow-lg active:scale-95 transition-transform">Enviar Avaliação</button>
      </motion.div>
    </>
  );
}

function AuthScreen({ loginWithEmail, registerWithEmail, isDark, show }: any) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login'|'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('client');

  return (
    <div className={`p-4 flex flex-col items-center justify-center min-h-screen relative ${isDark?'bg-[#18181b] text-white':'bg-[#f8f9fa] text-[#002a5d]'}`}>
      <button onClick={() => navigate('/busca')} className="absolute top-6 left-4 p-2"><Icon name="arrow_back" /></button>
      <Logo isDark={isDark} className="scale-125 origin-left mb-8" />
      
      <div className={`w-full max-w-sm rounded-3xl shadow-xl overflow-hidden ${isDark?'bg-[#27272a]':'bg-white'}`}>
        <div className="flex">
          <button onClick={() => setTab('login')} className={`flex-1 py-4 font-bold text-sm ${tab==='login' ? (isDark?'bg-[#3f3f46] text-white':'bg-gray-100 text-[#002a5d]') : (isDark?'text-gray-400':'text-gray-500')}`}>Entrar</button>
          <button onClick={() => setTab('register')} className={`flex-1 py-4 font-bold text-sm ${tab==='register' ? (isDark?'bg-[#3f3f46] text-white':'bg-gray-100 text-[#002a5d]') : (isDark?'text-gray-400':'text-gray-500')}`}>Criar Conta</button>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          {tab === 'register' && (
            <>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome completo" className={`w-full p-3 rounded-xl border outline-none ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-gray-50 border-gray-200 text-black'}`} />
              <select value={role} onChange={e=>setRole(e.target.value)} className={`w-full p-3 rounded-xl border outline-none ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-gray-50 border-gray-200 text-black'}`}>
                 <option value="client">Sou Cliente</option>
                 <option value="professional">Sou Profissional</option>
              </select>
            </>
          )}
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="E-mail" className={`w-full p-3 rounded-xl border outline-none ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-gray-50 border-gray-200 text-black'}`} />
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Senha" className={`w-full p-3 rounded-xl border outline-none ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-gray-50 border-gray-200 text-black'}`} />
          
          <button onClick={async () => { 
             if(!email || !password) return show('Preencha os campos', 'error');
             show('Aguarde...', 'info'); 
             let res;
             if (tab === 'login') {
                res = await loginWithEmail(email, password);
             } else {
                if(!name) return show('Preencha o nome', 'error');
                res = await registerWithEmail(email, password, name, role);
             }
             if (res.ok) { show('Sucesso!'); navigate('/perfil'); } else show(res.error, 'error'); 
          }} className="w-full py-4 rounded-xl bg-[#f97316] text-black font-black mt-2 active:scale-95 transition-transform">
            {tab === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatListScreen({ user, pros, isDark }: any) {
  const navigate = useNavigate();
  const { msgs } = useChat(user?.id);
  const chatPartners = Array.from(new Set(msgs.map((m:any) => m.senderId === user?.id ? m.receiverId : m.senderId)));
  const [partnerNames, setPartnerNames] = useState<any>({});

  useEffect(() => {
    const fetchNames = async () => {
      const newNames = { ...partnerNames };
      for (const pid of chatPartners) {
        if (!newNames[pid as string]) {
          const pro = pros.find((p:any) => p.id === pid);
          if (pro) {
             newNames[pid as string] = pro.name;
          } else {
             try {
               const docSnap = await getDoc(doc(db, 'users', pid as string));
               if (docSnap.exists()) {
                 newNames[pid as string] = docSnap.data().name;
               } else {
                 newNames[pid as string] = 'Usuário';
               }
             } catch {
                 newNames[pid as string] = 'Usuário';
             }
          }
        }
      }
      setPartnerNames(newNames);
    };
    if (chatPartners.length > 0) fetchNames();
  }, [chatPartners.length, pros]);


  return (
    <div className="pb-24">
      
      <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        
        <h1 className="font-black text-2xl">Mensagens</h1>
      </div>
      {chatPartners.length === 0 && <div className="text-center py-10 text-gray-500"><Icon name="forum" size={48} className="opacity-30 mb-2" /><p className="text-sm">Nenhuma mensagem recente.</p></div>}
      <div className="flex flex-col gap-2">
        {chatPartners.map((pid:any) => {
          const lastMsg = msgs.filter((m:any) => m.participants.includes(pid)).pop();
          const partnerName = partnerNames[pid as string] || 'Carregando...';
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
    </div>
  );
}

function ChatDetailScreen({ user, isDark }: any) {
  const navigate = useNavigate();
  const { id: partnerId } = useParams();
  const { msgs, send, updateMessage } = useChat(user?.id);
  const [text, setText] = useState('');
  const [proposing, setProposing] = useState(false);
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalDate, setProposalDate] = useState('');
  const [proposalTime, setProposalTime] = useState('');
  const [checkoutProposal, setCheckoutProposal] = useState<any>(null);
  const { add } = useAppointments(user?.id, user?.role);
  
  const chatMsgs = msgs.filter((m:any) => (m.senderId===user?.id && m.receiverId===partnerId) || (m.senderId===partnerId && m.receiverId===user?.id));

  const handleSendProposal = (price: number, date: string, time: string) => {
    if(partnerId) {
      send(partnerId, `Proposta de Serviço: R$ ${price.toFixed(2)} - ${date} às ${time}`, 'proposal', { price, date, time, status: 'pending' });
    }
  };

  const handleCounter = (msg: any, newPrice: number) => {
    if(partnerId) {
      updateMessage(msg.id, { 'proposal.status': 'countered' });
      const d = msg.proposal.date || ''; const t = msg.proposal.time || ''; send(partnerId, `Contraproposta: R$ ${newPrice.toFixed(2)} - ${d} às ${t}`, 'proposal', { price: newPrice, date: d, time: t, status: 'pending' });
    }
  };

  const handleAccept = (msg: any) => {
    updateMessage(msg.id, { 'proposal.status': 'accepted' });
  };

  const handleReject = (msg: any) => {
    updateMessage(msg.id, { 'proposal.status': 'rejected' });
  };
  
  const handlePaymentComplete = async (method: string) => {
    if(checkoutProposal) {
      try {
        const price = checkoutProposal.proposal.price;
        // Mock successful payment
        await add({ professionalId: checkoutProposal.senderId === user.id ? partnerId : checkoutProposal.senderId, clientId: user.id, clientName: user.name, serviceId: 'custom', serviceTitle: 'Serviço Personalizado', price: price, date: checkoutProposal.proposal.date || new Date().toISOString().split('T')[0], time: checkoutProposal.proposal.time || 'A Combinar', status: 'approved', paymentMethod: method });
        await updateMessage(checkoutProposal.id, { 'proposal.status': 'paid' });
        setCheckoutProposal(null);
        alert('Pagamento via ' + method + ' concluído com sucesso!');
      } catch (err) {
        console.error(err);
        alert('Erro ao concluir pagamento.');
      }
    }
  };

  return (
    <div className={`flex flex-col h-screen ${isDark?'bg-[#18181b]':'bg-[#f8f9fa]'}`}>
      <header className={`border-b p-4 flex items-center gap-3 ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white'}`}>
        <button onClick={()=>navigate(-1)}><Icon name="arrow_back" /></button>
        <h2 className="font-bold">Conversa</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {chatMsgs.map((m:any) => {
          const isMine = m.senderId === user?.id;
          if (m.type === 'proposal' && m.proposal) {
             const p = m.proposal;
             return (
               <div key={m.id} className={`w-full max-w-[280px] rounded-2xl p-4 shadow-sm border ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'} ${isMine ? 'self-end' : 'self-start'}`}>
                 <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-sm">Proposta de Serviço</h3>
                   <Icon name="request_quote" className="text-[#f97316]" size={18} />
                 </div>
                 <p className={`text-2xl font-black mb-3 ${isDark?'text-white':'text-black'}`}>R$ {p.price.toFixed(2)}</p>
                 
                 {p.status === 'pending' && (
                   <div className="flex flex-col gap-2">
                     {!isMine ? (
                       <>
                         <button onClick={()=>handleAccept(m)} className="w-full py-2 bg-[#f97316] text-black font-bold rounded-lg text-sm active:scale-95 transition-transform">Aceitar Acordo</button>
                         <button onClick={()=>{
                           const cp = prompt('Digite o valor da contraproposta:');
                           if(cp && !isNaN(Number(cp))) handleCounter(m, Number(cp));
                         }} className={`w-full py-2 border font-bold rounded-lg text-sm active:scale-95 transition-transform ${isDark?'border-[#3f3f46] text-white':'border-gray-300 text-black'}`}>Fazer Contraproposta</button>
                         <button onClick={()=>handleReject(m)} className="w-full py-2 bg-red-50 text-red-500 dark:bg-red-500/10 font-bold rounded-lg text-sm active:scale-95 transition-transform">Recusar</button>
                       </>
                     ) : (
                       <p className="text-xs text-orange-500 font-bold">Aguardando resposta...</p>
                     )}
                   </div>
                 )}
                 {p.status === 'accepted' && (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-bold text-green-500 flex items-center gap-1"><Icon name="check_circle" size={14}/> Acordo Fechado</span>
    {user?.role === 'client' ? (
      <button onClick={()=>setCheckoutProposal(m)} className="w-full mt-2 py-2 bg-green-500 text-white font-black rounded-lg text-sm shadow-md active:scale-95 transition-transform">Pagar Agora</button>
    ) : (
      <span className="text-xs font-bold text-orange-500 flex items-center gap-1"><Icon name="hourglass_empty" size={14}/> Pagamento pendente</span>
    )}
  </div>
)}

                 {p.status === 'paid' && (
  <div className="flex flex-col gap-2 mt-2">
    <span className="text-xs font-bold text-blue-500 flex items-center gap-1"><Icon name="verified_user" size={14}/> Pagamento feito (Valor retido)</span>
  </div>
)}
                 {p.status === 'rejected' && <span className="text-xs font-bold text-red-500">Proposta Recusada</span>}
                 {p.status === 'countered' && <span className="text-xs font-bold text-gray-500">Contraproposta enviada</span>}
               </div>
             );
          }
          return (
            <div key={m.id} className={`max-w-[80%] rounded-xl p-3 text-sm ${isMine ? 'bg-[#f97316] text-black self-end rounded-br-sm' : (isDark?'bg-[#3f3f46] text-white':'bg-[#e1e3e4] text-[#191c1d]') + ' self-start rounded-bl-sm'}`}>{m.text}</div>
          );
        })}
      </div>
      
      {proposing && (
        <div className={`p-3 border-t flex flex-col gap-2 ${isDark?'bg-[#1e1e1e] border-[#3f3f46]':'bg-gray-50'}`}>
           <div className="flex gap-2">
             <input type="date" value={proposalDate} onChange={e=>setProposalDate(e.target.value)} className={`flex-1 rounded-lg px-3 py-2 outline-none text-sm border ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white'}`} />
             <input type="time" value={proposalTime} onChange={e=>setProposalTime(e.target.value)} className={`flex-1 rounded-lg px-3 py-2 outline-none text-sm border ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white'}`} />
           </div>
           <div className="flex gap-2 items-center">
             <Icon name="request_quote" className="text-gray-400" />
             <input type="number" value={proposalPrice} onChange={e=>setProposalPrice(e.target.value)} placeholder="Valor (R$)" className={`flex-1 rounded-lg px-3 py-2 outline-none text-sm border ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white'}`} />
             <button onClick={()=>{if(proposalPrice && proposalDate && proposalTime) { handleSendProposal(Number(proposalPrice), proposalDate, proposalTime); setProposing(false); setProposalPrice(''); setProposalDate(''); setProposalTime(''); }}} className="px-4 py-2 bg-[#f97316] text-black font-bold rounded-lg text-sm active:scale-95">Enviar</button>
             <button onClick={()=>setProposing(false)} className="px-3 py-2 text-gray-400 font-bold text-sm">X</button>
           </div>
        </div>
      )}

      <div className={`p-4 border-t flex gap-2 pb-8 items-center ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white'}`}>
        <button onClick={() => setProposing(!proposing)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark?'bg-[#3f3f46] text-[#a1a1aa] hover:bg-[#52525b]':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} title="Fazer Proposta">
          <Icon name="request_quote" size={20} />
        </button>
        <button onClick={() => { if(partnerId) send(partnerId, '📷 [Anexo de Imagem da situação]', 'text'); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark?'bg-[#3f3f46] text-[#a1a1aa] hover:bg-[#52525b]':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} title="Anexar Imagem">
          <Icon name="attach_file" size={20} />
        </button>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&text&&partnerId){send(partnerId,text,'text');setText('');}}} placeholder="Mensagem..." className={`flex-1 border rounded-full px-4 py-3 outline-none text-sm ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-white'}`} />
        <button onClick={()=>{if(text&&partnerId){send(partnerId,text,'text');setText('');}}} className="w-10 h-10 rounded-full bg-[#f97316] flex items-center justify-center text-black shrink-0"><Icon name="send" size={20} /></button>
      </div>
      
      <AnimatePresence>
        {checkoutProposal && <CheckoutModal p={checkoutProposal} onClose={()=>setCheckoutProposal(null)} onPay={handlePaymentComplete} isDark={isDark} />}
      </AnimatePresence>
    </div>
  );
}


function CheckoutModal({ p, onClose, onPay, isDark }: any) {
  const [method, setMethod] = useState<'pix'|'credit'>('pix');
  const servicePrice = p.proposal.price;
  const fee = servicePrice * 0.05;
  const total = servicePrice + fee;

  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-[#f8f9fa] dark:bg-[#121212] z-[100] overflow-y-auto hide-scrollbar pb-36">
        <header className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1e1e1e] sticky top-0 z-10">
          <button onClick={onClose} className="p-2"><Icon name="arrow_back" className="text-[#002a5d] dark:text-white" /></button>
          <h1 className="font-black text-xl text-[#002a5d] dark:text-white tracking-tight">Checkout de Serviço</h1>
        </header>

        <div className="p-4">
          <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Resumo da Compra</h2>
          <div className={`p-4 rounded-2xl mb-6 shadow-sm border ${isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-3">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Valor do Serviço</span>
              <span className="font-bold">R$ {servicePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Taxa de Segurança (5%) <Icon name="info" size={14}/></span>
              <span className="font-bold text-orange-500">+ R$ {fee.toFixed(2)}</span>
            </div>
            <div className="w-full h-[1px] bg-gray-200 dark:bg-[#3f3f46] mb-4" />
            <div className="flex justify-between items-center">
              <span className="font-black text-lg">Total</span>
              <span className="font-black text-xl text-[#002a5d] dark:text-[#60a5fa]">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Forma de Pagamento</h2>
          <div className="flex flex-col gap-3 mb-8">
            <button onClick={()=>setMethod('pix')} className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${method === 'pix' ? 'border-[#f97316] bg-[#fff7ed] dark:bg-[#f97316]/10' : (isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-gray-200')}`}>
              <Icon name="pix" className={method==='pix'?'text-[#f97316]':''} />
              <span className="font-bold flex-1 text-left">Pix</span>
              {method === 'pix' && <Icon name="check_circle" className="text-[#f97316]" />}
            </button>
            <button onClick={()=>setMethod('credit')} className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${method === 'credit' ? 'border-[#f97316] bg-[#fff7ed] dark:bg-[#f97316]/10' : (isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-gray-200')}`}>
              <Icon name="credit_card" className={method==='credit'?'text-[#f97316]':''} />
              <span className="font-bold flex-1 text-left">Cartão de Crédito</span>
              {method === 'credit' && <Icon name="check_circle" className="text-[#f97316]" />}
            </button>
            <button onClick={()=>setMethod('debit')} className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${method === 'debit' ? 'border-[#f97316] bg-[#fff7ed] dark:bg-[#f97316]/10' : (isDark ? 'bg-[#1e1e1e] border-[#2a2a2a]' : 'bg-white border-gray-200')}`}>
              <Icon name="credit_score" className={method==='debit'?'text-[#f97316]':''} />
              <span className="font-bold flex-1 text-left">Cartão de Débito</span>
              {method === 'debit' && <Icon name="check_circle" className="text-[#f97316]" />}
            </button>
          </div>
          
          <div className={`p-4 rounded-xl flex gap-3 ${isDark ? 'bg-[#27272a] text-[#a1a1aa]' : 'bg-gray-100 text-gray-600'}`}>
            <Icon name="shield" className="text-green-500 shrink-0" />
            <p className="text-xs">Seu dinheiro fica retido de forma segura até a conclusão do serviço (Take Rate).</p>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full max-w-[448px] bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-[#2a2a2a] p-4 z-[101]">
          <button onClick={() => onPay(method)} className="w-full py-4 rounded-xl font-black text-lg text-black bg-[#f97316] active:scale-95 transition-transform">
            Pagar R$ {total.toFixed(2)}
          </button>
        </div>
      </motion.div>
    </>
  );
}


function EditProfileModal({ user, onClose, onSave, isDark, show }: any) {
  const [av, setAv] = useState(user.avatarUrl || '');
  const [desc, setDesc] = useState(user.description || '');
  const [profession, setProfession] = useState(user.profession || '');
  const [region, setRegion] = useState(user.region || '');

  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" />
      <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className={`fixed bottom-0 left-0 w-full rounded-t-3xl z-[101] p-6 shadow-2xl ${isDark ? 'bg-[#27272a] text-white' : 'bg-white text-gray-900'}`}>
        <h2 className="font-bold text-2xl mb-4">Editar Perfil</h2>
        
        <div className="flex flex-col gap-4 mb-6">
          <input value={av} onChange={e=>setAv(e.target.value)} placeholder="URL da Foto de Perfil" className={`w-full p-4 rounded-xl border outline-none text-sm ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}`} />
          {true && (
            <>
              <input value={profession} onChange={e=>setProfession(e.target.value)} placeholder="Sua Profissão" className={`w-full p-4 rounded-xl border outline-none text-sm ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}`} />
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Sua Descrição" className={`w-full p-4 rounded-xl border outline-none text-sm min-h-[100px] ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}`} />
            </>
          )}
          <input value={region} onChange={e=>setRegion(e.target.value)} placeholder="Sua Região/Cidade" className={`w-full p-4 rounded-xl border outline-none text-sm ${isDark?'bg-[#18181b] border-[#3f3f46] text-white':'bg-[#f8f9fa] border-[#e5e7eb]'}`} />
        </div>

        <button onClick={() => onSave({ avatarUrl: av, description: desc, profession, region })} className="w-full py-4 rounded-xl font-bold text-black bg-[#f97316] shadow-lg active:scale-95 transition-transform">Salvar Alterações</button>
      </motion.div>
    </>
  );
}

function ProfileScreen({ user, isDark, logout, loginWithGoogle, toggleDarkMode, updateProfile, show }: any) {
  const { currentRole, setCurrentRole } = useContext(RoleContext);
  const [editModal, setEditModal] = useState(false);

  if (!user) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-6">
          <Icon name="person_off" size={48} className="opacity-50" />
        </div>
        <h2 className="font-black text-2xl mb-2">Acesse sua conta</h2>
        <p className={`text-sm mb-8 ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>Faça login para gerenciar seu perfil e pedidos.</p>
        <Link to="/auth" className="px-8 py-4 bg-[#f97316] text-black rounded-xl font-black shadow-lg active:scale-95 transition-transform">Fazer Login</Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="relative h-32 bg-gradient-to-r from-[#f97316] to-[#ea580c]">
        <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-full border-4 border-white dark:border-[#18181b] bg-gray-200 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
          {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="font-black text-3xl opacity-50">{user.avatarInitial}</span>}
        </div>
      </div>
      
      <div className="px-6 pt-12">
        <h1 className="font-black text-2xl mb-1 flex items-center gap-2">
          {user.name}
          {user.verified && <Icon name="verified_user" size={18} className="text-green-500" fill />}
        </h1>
        <p className={`text-sm font-medium mb-6 ${isDark?'text-[#a1a1aa]':'text-gray-500'}`}>{user.email}</p>
        <div className={`p-5 rounded-3xl border mb-6 flex justify-between items-center shadow-sm ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
          <div>
             <h3 className="font-black text-lg mb-1">Carteira Digital</h3>
             <p className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Saldo disponível</p>
          </div>
          <span className="font-black text-2xl text-[#f97316]">R$ {(user.walletBalance || 0).toFixed(2)}</span>
        </div>

        {true && (
          <div className={`p-5 rounded-3xl border mb-6 ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
            <h3 className="font-black text-lg mb-1">Alternar Modo</h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Alterne entre a visão de prestador e cliente.</p>
            <div className="flex bg-gray-100 dark:bg-[#18181b] rounded-xl p-1 relative">
               <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#f97316] rounded-lg shadow-md transition-all duration-300 ${currentRole === 'client' ? 'left-1' : 'left-[calc(50%+2px)]'}`} />
               <button onClick={() => { setCurrentRole('client'); updateProfile({ currentMode: 'client' }); }} className={`flex-1 py-3 text-sm font-bold relative z-10 transition-colors ${currentRole === 'client' ? 'text-black' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>Cliente</button>
               <button onClick={() => { setCurrentRole('professional'); updateProfile({ currentMode: 'professional' }); }} className={`flex-1 py-3 text-sm font-bold relative z-10 transition-colors ${currentRole === 'professional' ? 'text-black' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>Profissional</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button onClick={() => setEditModal(true)} className={`p-4 rounded-xl border flex items-center justify-between text-left active:scale-95 transition-transform ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
            <div className="flex items-center gap-3">
              <Icon name="edit" className="text-[#f97316]" />
              <span className="font-bold">Editar Perfil</span>
            </div>
            <Icon name="chevron_right" />
          </button>
          
          <button onClick={toggleDarkMode} className={`p-4 rounded-xl border flex items-center justify-between text-left active:scale-95 transition-transform ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
            <div className="flex items-center gap-3">
              <Icon name={isDark ? 'light_mode' : 'dark_mode'} className="text-[#f97316]" />
              <span className="font-bold">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </div>
          </button>

          <button onClick={logout} className={`p-4 rounded-xl border flex items-center gap-3 text-left active:scale-95 transition-transform ${isDark?'bg-[#27272a] border-[#3f3f46]':'bg-white border-[#e5e7eb]'}`}>
            <Icon name="logout" className="text-red-500" />
            <span className="font-bold text-red-500">Sair da Conta</span>
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {editModal && <EditProfileModal user={user} onClose={()=>setEditModal(false)} onSave={(data: any)=>{ updateProfile(data); setEditModal(false); if(show) show('Perfil atualizado com sucesso!'); }} isDark={isDark} show={show} />}
      </AnimatePresence>
    </div>
  );
}

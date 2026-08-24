import React, { useState } from 'react';
import {
  Search, Star, ArrowLeft, User, MapPin,
  Phone, Mail, Lock, ChevronRight, Bell,
  SlidersHorizontal, CheckCircle2, Zap, Shield, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PROFESSIONALS } from './data';
import { Professional, UserRole } from './types';
import * as Icons from 'lucide-react';

type Screen = 'home' | 'profile' | 'register';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

  const navigateTo = (screen: Screen, professionalId?: string) => {
    if (professionalId) setSelectedProfessionalId(professionalId);
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const selectedProfessional = PROFESSIONALS.find(p => p.id === selectedProfessionalId);

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col">
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentScreen === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <HomeScreen onNavigate={navigateTo} />
              </motion.div>
            )}
            {currentScreen === 'profile' && selectedProfessional && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <ProfileScreen professional={selectedProfessional} onBack={() => navigateTo('home')} />
              </motion.div>
            )}
            {currentScreen === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <RegisterScreen onBack={() => navigateTo('home')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Nav */}
        <div className="sticky bottom-0 w-full bg-white border-t border-slate-100 flex justify-around px-2 pt-2 pb-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <NavButton
            icon={<Search className="w-5 h-5" />}
            label="Buscar"
            active={currentScreen === 'home'}
            onClick={() => navigateTo('home')}
          />
          <NavButton
            icon={<Bell className="w-5 h-5" />}
            label="Novidades"
            active={false}
            onClick={() => {}}
          />
          <NavButton
            icon={<User className="w-5 h-5" />}
            label="Perfil"
            active={currentScreen === 'register'}
            onClick={() => navigateTo('register')}
          />
        </div>
      </div>
    </div>
  );
}

function NavButton({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-6 py-1 relative"
    >
      <span className={active ? 'text-[#0052CC]' : 'text-slate-400'}>{icon}</span>
      <span className={`text-[10px] font-semibold ${active ? 'text-[#0052CC]' : 'text-slate-400'}`}>{label}</span>
      {active && (
        <motion.div
          layoutId="nav-pill"
          className="absolute -bottom-1 w-8 h-0.5 bg-[#0052CC] rounded-full"
        />
      )}
    </button>
  );
}

/* ─────────────── HOME SCREEN ─────────────── */
function HomeScreen({ onNavigate }: { onNavigate: (s: Screen, pId?: string) => void }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = PROFESSIONALS.filter(p => {
    const byCategory = activeCategory
      ? p.profession.toLowerCase().includes(activeCategory.toLowerCase()) ||
        CATEGORIES.find(c => c.name === activeCategory)?.id != null
      : true;
    const bySearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.profession.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return p.activeSubscription && bySearch;
  });

  const displayPros = activeCategory
    ? PROFESSIONALS.filter(p => p.activeSubscription)
    : filtered;

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Header gradient */}
      <div className="bg-gradient-to-br from-[#003A9E] via-[#0052CC] to-[#0063F7] px-5 pt-12 pb-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[1.9rem] font-black tracking-tight leading-none">
              <span className="text-white">encontre</span>
              <span className="text-[#FF8C00]">aí</span>
            </div>
            <div className="text-white/55 text-[0.68rem] font-semibold flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              São Paulo, SP
            </div>
          </div>
          <button className="relative w-9 h-9 bg-white/15 rounded-full flex items-center justify-center border border-white/20">
            <Bell className="w-4 h-4 text-white" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#FF8C00] rounded-full border border-[#0052CC]" />
          </button>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Busque eletricistas, pintores..."
              className="w-full bg-white rounded-2xl py-3 pl-10 pr-4 text-sm font-medium outline-none text-slate-800 placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <button className="w-12 h-12 bg-[#FF8C00] rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 active:scale-95 transition-transform">
            <SlidersHorizontal className="w-4.5 h-4.5 text-white" />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 pt-4 pb-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[0.72rem] font-extrabold text-slate-700 uppercase tracking-widest">Categorias</h2>
          <span className="text-[0.68rem] text-[#0052CC] font-bold">Ver todas</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat, index) => {
            const Icon = (Icons as Record<string, React.FC<{ className?: string }>>)[cat.icon] || Icons.HelpCircle;
            const bgColors = ['#E0F2FE', '#FFF7ED', '#F0FDF4', '#FAF5FF', '#FEFCE8', '#FEE2E2'];
            const textColors = ['#0369A1', '#C2410C', '#15803D', '#7E22CE', '#A16207', '#B91C1C'];
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? null : cat.name)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-[#0052CC] border-[#0052CC] shadow-md shadow-blue-200'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : bgColors[index % bgColors.length] }}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: isActive ? 'white' : textColors[index % textColors.length] } as React.CSSProperties}
                  />
                </div>
                <span className={`text-[0.68rem] font-bold whitespace-nowrap ${isActive ? 'text-white' : 'text-slate-700'}`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Promo Banner */}
      <div className="mx-5 mt-3 mb-1">
        <div className="bg-gradient-to-r from-[#FF5500] to-[#FF8C00] rounded-2xl p-4 flex items-center justify-between overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -right-2 top-6 w-14 h-14 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <div className="text-[0.58rem] text-white/75 font-bold uppercase tracking-widest mb-0.5">Oferta limitada</div>
            <div className="text-white font-black text-[0.92rem] leading-tight">
              1ª contratação com<br />
              <span className="text-[1.1rem]">20% de desconto</span>
            </div>
          </div>
          <div className="relative z-10 w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Professionals list */}
      <div className="px-5 mt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[0.72rem] font-extrabold text-slate-700 uppercase tracking-widest">
            {activeCategory ?? 'Em Destaque'}
          </h2>
          <span className="text-[0.62rem] text-slate-400 font-semibold">{displayPros.length} profissionais</span>
        </div>

        <div className="flex flex-col gap-3">
          {displayPros.map((pro, i) => (
            <motion.button
              key={pro.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              onClick={() => onNavigate('profile', pro.id)}
              className="bg-white rounded-2xl p-3.5 border border-slate-100 text-left flex gap-3.5 items-center shadow-sm active:scale-[0.98] transition-transform"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <img src={pro.avatarUrl} alt={pro.name} className="w-[3.2rem] h-[3.2rem] rounded-xl object-cover bg-slate-200" />
                {pro.verified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0052CC] rounded-full flex items-center justify-center border-2 border-white">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <span className="text-[0.82rem] font-bold text-slate-800 truncate leading-snug">{pro.name}</span>
                  <div className="flex items-center gap-0.5 ml-2 shrink-0">
                    <Star className="w-3 h-3 fill-[#FF8C00] text-[#FF8C00]" />
                    <span className="text-[0.7rem] font-bold text-[#FF8C00]">{pro.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="text-[0.68rem] text-slate-400 truncate mb-2">{pro.profession}</div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[0.52rem] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                    pro.verified
                      ? 'bg-[#EFF6FF] text-[#1E40AF]'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {pro.verified ? '✓ Verificado' : 'Assinante'}
                  </span>
                  <span className="text-[0.58rem] text-slate-400 font-medium">{pro.reviewsCount} avaliações</span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── PROFILE SCREEN ─────────────── */
function ProfileScreen({ professional, onBack }: { professional: Professional; onBack: () => void }) {
  return (
    <div className="min-h-screen overflow-y-auto bg-white pb-24">
      {/* Cover image */}
      <div className="relative h-[200px]">
        <img
          src={professional.coverUrl}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-10 left-4 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-md border border-white/60 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 text-slate-800" />
        </button>
      </div>

      {/* Profile header */}
      <div className="px-5 -mt-14 relative">
        <div className="flex items-end gap-3 mb-4">
          <img
            src={professional.avatarUrl}
            alt={professional.name}
            className="w-[4.5rem] h-[4.5rem] rounded-2xl object-cover border-4 border-white shadow-xl bg-slate-200"
          />
          <div className="pb-1.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h1 className="text-[1.05rem] font-black text-slate-800">{professional.name}</h1>
              {professional.verified && (
                <CheckCircle2 className="w-4 h-4 text-[#0052CC]" />
              )}
            </div>
            <p className="text-[0.68rem] text-slate-500 flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3" />
              {professional.profession} · São Paulo
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Avaliação', value: professional.rating.toFixed(1), color: '#FF8C00', star: true },
            { label: 'Avaliações', value: String(professional.reviewsCount), color: '#0052CC', star: false },
            { label: 'Contratos', value: String(Math.floor(professional.reviewsCount * 1.5)), color: '#15803D', star: false },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                {stat.star && <Star className="w-3.5 h-3.5 fill-[#FF8C00] text-[#FF8C00]" />}
                <span className="text-[1rem] font-black" style={{ color: stat.color }}>{stat.value}</span>
              </div>
              <div className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button className="w-full bg-gradient-to-r from-[#FF5500] to-[#FF8C00] text-white font-bold py-3.5 rounded-2xl mb-4 text-[0.9rem] shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform">
          Solicitar Orçamento Grátis
        </button>

        {/* Trust badges */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {professional.verified && (
            <div className="flex items-center gap-1.5 bg-[#EFF6FF] px-3 py-2 rounded-xl border border-[#DBEAFE]">
              <Shield className="w-3.5 h-3.5 text-[#0052CC]" />
              <span className="text-[0.6rem] font-bold text-[#0052CC]">Perfil Verificado</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-[#F0FDF4] px-3 py-2 rounded-xl border border-[#BBF7D0]">
            <TrendingUp className="w-3.5 h-3.5 text-[#15803D]" />
            <span className="text-[0.6rem] font-bold text-[#15803D]">Top Profissional</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 mb-5" />

        {/* About */}
        <div className="mb-5">
          <h2 className="text-[0.68rem] font-extrabold text-slate-500 mb-2.5 uppercase tracking-widest">Sobre</h2>
          <p className="text-[0.82rem] text-slate-600 leading-relaxed">{professional.description}</p>
        </div>

        {/* Portfolio */}
        {professional.portfolio.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[0.68rem] font-extrabold text-slate-500 mb-2.5 uppercase tracking-widest">Trabalhos Recentes</h2>
            <div className="grid grid-cols-3 gap-2">
              {professional.portfolio.map((img, i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-xl overflow-hidden">
                  <img src={img} alt="Portfólio" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-slate-100 mb-5" />

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[0.68rem] font-extrabold text-slate-500 uppercase tracking-widest">Avaliações</h2>
            <span className="text-[0.65rem] font-bold text-[#0052CC]">Ver todas</span>
          </div>
          <div className="flex flex-col gap-3">
            {professional.reviews.map(review => (
              <div key={review.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#0052CC] to-[#003A9E] rounded-full flex items-center justify-center">
                      <span className="text-white text-[0.65rem] font-black">{review.authorName[0]}</span>
                    </div>
                    <span className="font-bold text-[0.78rem] text-slate-800">{review.authorName}</span>
                  </div>
                  <span className="text-[0.62rem] text-slate-400 font-medium">{review.date}</span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${star <= review.rating ? 'fill-[#FF8C00] text-[#FF8C00]' : 'fill-slate-200 text-slate-200'}`}
                    />
                  ))}
                </div>
                <p className="text-[0.76rem] text-slate-600 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── REGISTER SCREEN ─────────────── */
function RegisterScreen({ onBack }: { onBack: () => void }) {
  const [role, setRole] = useState<UserRole>('client');

  const fields = [
    { label: 'Nome completo', type: 'text', placeholder: 'Seu nome', icon: <User className="w-4 h-4 text-slate-400" /> },
    { label: 'E-mail', type: 'email', placeholder: 'seu@email.com', icon: <Mail className="w-4 h-4 text-slate-400" /> },
    { label: 'Telefone', type: 'tel', placeholder: '(11) 99999-9999', icon: <Phone className="w-4 h-4 text-slate-400" /> },
    { label: 'Senha', type: 'password', placeholder: '••••••••', icon: <Lock className="w-4 h-4 text-slate-400" /> },
  ];

  return (
    <div className="min-h-screen overflow-y-auto bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#003A9E] via-[#0052CC] to-[#0063F7] px-6 pt-14 pb-8">
        <h1 className="text-[1.55rem] font-black text-white leading-[1.15] mb-2 whitespace-pre-line">
          {role === 'client'
            ? 'Encontre os melhores\nprofissionais.'
            : 'Seja um profissional\ndestacado.'}
        </h1>
        <p className="text-white/60 text-[0.75rem] font-medium">
          {role === 'client'
            ? 'Contrate serviços com segurança e qualidade garantida.'
            : 'Alcance mais clientes e aumente sua renda mensal.'}
        </p>
      </div>

      <div className="px-5 py-6 pb-24">
        {/* Role toggle */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          {(['client', 'professional'] as UserRole[]).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2.5 text-[0.75rem] font-bold rounded-xl transition-all ${
                role === r ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              {r === 'client' ? 'Sou Cliente' : 'Sou Profissional'}
            </button>
          ))}
        </div>

        <form className="flex flex-col gap-3.5" onSubmit={e => e.preventDefault()}>
          {fields.map(field => (
            <div
              key={field.label}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 focus-within:border-[#0052CC] focus-within:ring-1 focus-within:ring-[#0052CC]/30 transition-all"
            >
              {field.icon}
              <div className="flex-1">
                <label className="text-[0.52rem] font-extrabold text-slate-400 uppercase tracking-widest">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  className="w-full text-[0.82rem] outline-none text-slate-800 placeholder:text-slate-300 bg-transparent mt-0.5"
                />
              </div>
            </div>
          ))}

          <AnimatePresence>
            {role === 'professional' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-3.5 overflow-hidden"
              >
                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-[#0052CC] focus-within:ring-1 focus-within:ring-[#0052CC]/30 transition-all">
                  <label className="text-[0.52rem] font-extrabold text-slate-400 uppercase tracking-widest">CPF ou CNPJ</label>
                  <input type="text" placeholder="000.000.000-00" className="w-full text-[0.82rem] outline-none text-slate-800 placeholder:text-slate-300 bg-transparent mt-0.5" />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-[#0052CC] focus-within:ring-1 focus-within:ring-[#0052CC]/30 transition-all">
                  <label className="text-[0.52rem] font-extrabold text-slate-400 uppercase tracking-widest">Categoria de serviço</label>
                  <select className="w-full text-[0.82rem] outline-none text-slate-700 bg-transparent appearance-none mt-0.5">
                    <option value="">Selecione uma categoria...</option>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="p-4 bg-[#EFF6FF] rounded-2xl border border-[#DBEAFE] flex items-start gap-3">
                  <Shield className="w-4 h-4 text-[#0052CC] mt-0.5 shrink-0" />
                  <p className="text-[0.65rem] text-[#1E40AF] font-semibold leading-relaxed">
                    <strong>Para profissionais:</strong> Assine nosso plano recorrente para aparecer no topo das buscas e receber muito mais contratações.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button className="w-full bg-gradient-to-r from-[#003A9E] to-[#0063F7] text-white font-bold py-3.5 rounded-2xl text-[0.9rem] shadow-lg shadow-blue-200 mt-2 active:scale-[0.98] transition-transform">
            Criar Conta {role === 'professional' ? 'Premium' : 'Grátis'}
          </button>

          <p className="text-center text-[0.63rem] text-slate-400 font-medium leading-relaxed">
            Ao criar conta você aceita nossos{' '}
            <span className="text-[#0052CC] font-bold">Termos de Uso</span> e{' '}
            <span className="text-[#0052CC] font-bold">Política de Privacidade</span>
          </p>
        </form>
      </div>
    </div>
  );
}

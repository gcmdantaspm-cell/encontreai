import React, { useState } from 'react';
import { 
  Search, Star, BadgeCheck, 
  ArrowLeft, User, Mail, Lock, Phone, 
  FileText, Briefcase, ChevronRight, 
  MapPin, CheckCircle2
} from 'lucide-react';
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
    <div className="min-h-screen bg-[#F1F5F9] font-sans text-slate-800 pb-20 md:pb-0">
      {/* Mobile-first constraints via max-w */}
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative overflow-hidden">
        {currentScreen === 'home' && <HomeScreen onNavigate={navigateTo} />}
        {currentScreen === 'profile' && selectedProfessional && (
          <ProfileScreen professional={selectedProfessional} onBack={() => navigateTo('home')} />
        )}
        {currentScreen === 'register' && <RegisterScreen onBack={() => navigateTo('home')} />}
        
        {/* Simple Bottom Nav for prototype */}
        <div className="absolute bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 pb-safe z-50">
          <button 
            onClick={() => navigateTo('home')} 
            className={`flex flex-col items-center ${currentScreen === 'home' ? 'text-[#0052CC]' : 'text-slate-400'}`}
          >
            <Search className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Buscar</span>
          </button>
          <button 
            onClick={() => navigateTo('register')} 
            className={`flex flex-col items-center ${currentScreen === 'register' ? 'text-[#0052CC]' : 'text-slate-400'}`}
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ onNavigate }: { onNavigate: (s: Screen, pId?: string) => void }) {
  return (
    <div className="h-full flex flex-col pb-16">
      {/* Header */}
      <div className="bg-white p-6 pt-12 pb-4">
        <div className="text-2xl font-black tracking-tight mb-6">
          <span className="text-[#0052CC]">encontre</span>
          <span className="text-[#FF8C00]">ai</span>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Busque eletricistas, pintores..." 
            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-all text-slate-800 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Categories Carousel */}
      <div className="mt-2 px-6">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x justify-between">
          {CATEGORIES.map((cat, index) => {
            const Icon = (Icons as any)[cat.icon] || Icons.HelpCircle;
            const bgColors = ['bg-[#E0F2FE]', 'bg-[#FFF7ED]', 'bg-[#F0FDF4]', 'bg-[#FAF5FF]', 'bg-[#FEFCE8]', 'bg-[#FEE2E2]'];
            const textColors = ['text-[#0369A1]', 'text-[#C2410C]', 'text-[#15803D]', 'text-[#7E22CE]', 'text-[#A16207]', 'text-[#B91C1C]'];
            return (
              <div key={cat.id} className="flex flex-col items-center gap-2 snap-start">
                <div className={`w-[3.2rem] h-[3.2rem] rounded-full ${bgColors[index % bgColors.length]} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${textColors[index % textColors.length]}`} />
                </div>
                <span className="text-[0.65rem] font-bold text-slate-800 uppercase tracking-tight text-center">{cat.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Professionals */}
      <div className="mt-4 bg-[#F8FAFC] pt-5 pb-6 flex-1 min-h-screen">
        <h2 className="text-[0.8rem] font-extrabold text-slate-800 mx-6 mb-3">Profissionais em Destaque</h2>
        <div className="flex flex-col gap-3">
          {PROFESSIONALS.filter(p => p.activeSubscription).map(pro => (
            <button 
              key={pro.id} 
              onClick={() => onNavigate('profile', pro.id)}
              className="bg-white rounded-2xl p-3 mx-4 flex gap-3 border border-slate-200 text-left items-center transition-transform active:scale-[0.98]"
            >
              <div className="relative shrink-0">
                <img src={pro.avatarUrl} alt={pro.name} className="w-12 h-12 rounded-xl object-cover bg-slate-200" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-[0.75rem] font-bold text-slate-800 truncate">{pro.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="w-3 h-3 fill-[#FF8C00] text-[#FF8C00]" />
                    <span className="text-[0.65rem] font-bold text-[#FF8C00]">{pro.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="text-[0.65rem] text-slate-500 truncate">{pro.profession}</div>
                <div className="mt-1.5 flex gap-1">
                  <span className="text-[0.55rem] bg-[#DBEAFE] text-[#1E40AF] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {pro.verified ? 'VERIFICADO' : 'ASSINANTE'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ professional, onBack }: { professional: Professional, onBack: () => void }) {
  return (
    <div className="h-full overflow-y-auto pb-8 bg-white relative">
      {/* Back Button (Floating) */}
      <button 
        onClick={onBack}
        className="absolute top-8 left-4 z-10 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm text-slate-800 border border-slate-200"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Cover Gradient */}
      <div className="h-[120px] w-full bg-gradient-to-r from-[#0052CC] to-[#00BFFF]" />

      {/* Profile Header */}
      <div className="px-4 relative -mt-10">
        <img 
          src={professional.avatarUrl} 
          alt={professional.name} 
          className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] bg-slate-200"
        />
        
        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            <h1 className="text-[1.1rem] font-black text-slate-800">{professional.name}</h1>
            {professional.verified && (
              <div className="w-3.5 h-3.5 bg-[#0052CC] text-white rounded-full flex items-center justify-center">
                <span className="text-[9px]">✓</span>
              </div>
            )}
          </div>
          <div className="text-[0.75rem] text-slate-500 mb-4 flex items-center gap-1">
            {professional.profession} • São Paulo
          </div>
          
          <div className="flex gap-2 mb-6">
            <div className="flex-1 bg-[#F8FAFC] p-2 rounded-xl text-center">
              <div className="text-[0.55rem] font-extrabold text-slate-500 uppercase">AVALIAÇÕES</div>
              <div className="text-[0.9rem] font-extrabold text-slate-800">{professional.reviewsCount}</div>
            </div>
            <div className="flex-1 bg-[#F8FAFC] p-2 rounded-xl text-center">
              <div className="text-[0.55rem] font-extrabold text-slate-500 uppercase">CONTRATOS</div>
              <div className="text-[0.9rem] font-extrabold text-slate-800">{Math.floor(professional.reviewsCount * 1.5)}</div>
            </div>
          </div>
          
          <button className="w-full bg-[#FF8C00] text-white font-bold py-3 rounded-xl mb-6 text-[0.9rem]">
            Solicitar Orçamento
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 mb-6">
        <h2 className="text-[0.7rem] font-extrabold text-slate-800 mb-2 uppercase tracking-wide">SOBRE</h2>
        <p className="text-[0.8rem] text-slate-600 leading-relaxed">
          {professional.description}
        </p>
      </div>

      {/* Portfolio */}
      <div className="px-4 mb-6">
        <h2 className="text-[0.7rem] font-extrabold text-slate-800 mb-2 uppercase tracking-wide">TRABALHOS RECENTES</h2>
        <div className="grid grid-cols-3 gap-2">
          {professional.portfolio.map((img, i) => (
            <div key={i} className="aspect-square bg-[#F1F5F9] rounded-lg overflow-hidden">
              <img src={img} alt="Portfolio" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="px-4 pb-20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[0.7rem] font-extrabold text-slate-800 uppercase tracking-wide">AVALIAÇÕES</h2>
          <span className="text-[0.65rem] font-bold text-[#0052CC]">Ver todas</span>
        </div>
        <div className="flex flex-col gap-3">
          {professional.reviews.map(review => (
            <div key={review.id} className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[0.75rem] text-slate-800">{review.authorName}</span>
                <span className="text-[0.65rem] text-slate-500 font-medium">{review.date}</span>
              </div>
              <div className="flex gap-0.5 mb-2">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-[#FF8C00] text-[#FF8C00]' : 'fill-slate-200 text-slate-200'}`} />
                ))}
              </div>
              <p className="text-[0.75rem] text-slate-600 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegisterScreen({ onBack }: { onBack: () => void }) {
  const [role, setRole] = useState<UserRole>('client');

  return (
    <div className="h-full overflow-y-auto pb-24 bg-white px-6">
      {/* Header text */}
      <div className="pt-16 pb-6">
        <h1 className="text-2xl font-black text-slate-800 leading-[1.1] mb-2">
          Encontre os melhores<br/>ou seja um deles.
        </h1>
        <p className="text-[0.8rem] text-slate-500">
          A plataforma completa para contratar serviços domésticos.
        </p>
      </div>

      {/* Toggle Role */}
      <div className="flex bg-[#F1F5F9] p-1 rounded-xl mb-6">
        <button 
          onClick={() => setRole('client')}
          className={`flex-1 py-2 text-[0.75rem] font-bold rounded-lg transition-all ${
            role === 'client' ? 'bg-white text-slate-800 shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-slate-500'
          }`}
        >
          Sou Cliente
        </button>
        <button 
          onClick={() => setRole('professional')}
          className={`flex-1 py-2 text-[0.75rem] font-bold rounded-lg transition-all ${
            role === 'professional' ? 'bg-white text-slate-800 shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-slate-500'
          }`}
        >
          Sou Profissional
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={e => e.preventDefault()}>
        <div className="flex flex-col border-b border-slate-200 py-2">
          <label className="text-[0.6rem] font-extrabold text-slate-500 uppercase">Nome</label>
          <input type="text" placeholder="Seu nome completo" className="w-full text-[0.8rem] py-1 outline-none text-slate-800 placeholder:text-slate-300 bg-transparent" />
        </div>
        
        <div className="flex flex-col border-b border-slate-200 py-2">
          <label className="text-[0.6rem] font-extrabold text-slate-500 uppercase">E-mail</label>
          <input type="email" placeholder="seu@email.com" className="w-full text-[0.8rem] py-1 outline-none text-slate-800 placeholder:text-slate-300 bg-transparent" />
        </div>

        <div className="flex flex-col border-b border-slate-200 py-2">
          <label className="text-[0.6rem] font-extrabold text-slate-500 uppercase">Telefone</label>
          <input type="tel" placeholder="(11) 99999-9999" className="w-full text-[0.8rem] py-1 outline-none text-slate-800 placeholder:text-slate-300 bg-transparent" />
        </div>

        <div className="flex flex-col border-b border-slate-200 py-2">
          <label className="text-[0.6rem] font-extrabold text-slate-500 uppercase">Senha</label>
          <input type="password" placeholder="••••••••" className="w-full text-[0.8rem] py-1 outline-none text-slate-800 placeholder:text-slate-300 bg-transparent" />
        </div>

        {role === 'professional' && (
          <>
            <div className="flex flex-col border-b border-slate-200 py-2">
              <label className="text-[0.6rem] font-extrabold text-slate-500 uppercase">CPF ou CNPJ</label>
              <input type="text" placeholder="000.000.000-00" className="w-full text-[0.8rem] py-1 outline-none text-slate-800 placeholder:text-slate-300 bg-transparent" />
            </div>

            <div className="flex flex-col border-b border-slate-200 py-2">
              <label className="text-[0.6rem] font-extrabold text-slate-500 uppercase">Categoria</label>
              <select className="w-full text-[0.8rem] py-1 outline-none text-slate-800 bg-transparent appearance-none">
                <option value="">Selecione...</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="mt-2 p-4 bg-[#EFF6FF] rounded-xl">
              <p className="text-[0.65rem] text-[#1E40AF] font-semibold leading-relaxed">
                <b>Para profissionais:</b> Assine nosso plano recorrente para aparecer no topo das buscas dos clientes.
              </p>
            </div>
          </>
        )}

        <div className="mt-6 mb-4">
          <button className="w-full bg-[#0052CC] text-white font-bold py-3 rounded-xl text-[0.9rem] shadow-sm">
            Criar Conta {role === 'professional' ? 'Premium' : 'Grátis'}
          </button>
        </div>
      </form>
    </div>
  );
}


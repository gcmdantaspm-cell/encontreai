import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../data';
import { motion } from 'motion/react';

function Icon({ name, className, size = 24 }: { name: string; className?: string; size?: number }) {
  return <span className={`material-symbols-outlined ${className || ''}`} style={{ fontSize: size }}>{name}</span>;
}

export function CategoriesScreen({ isDark }: { isDark: boolean }) {
  const navigate = useNavigate();

  return (
    <div className={`flex-1 overflow-y-auto h-full flex flex-col ${isDark ? 'bg-[#18181b]' : 'bg-[#f8f9fa]'}`}>
      <header className={`p-4 flex items-center gap-3 border-b sticky top-0 z-10 ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
        <button onClick={() => navigate(-1)} className={`p-2 rounded-full active:scale-95 transition-transform ${isDark ? 'hover:bg-[#3f3f46]' : 'hover:bg-gray-100'}`}>
          <Icon name="arrow_back" className={isDark ? 'text-white' : 'text-gray-900'} />
        </button>
        <h1 className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Categorias</h1>
      </header>

      <div className="p-4">
        <p className={`mb-6 text-sm ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>
          Encontre os melhores profissionais filtrando por área de atuação.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={cat.id}
              onClick={() => navigate('/busca', { state: { category: cat.id } })}
              className={`cursor-pointer rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 border ${isDark ? 'bg-[#27272a] border-[#3f3f46] hover:border-[#f97316]' : 'bg-white border-[#e5e7eb] hover:border-[#f97316]'}`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-[#3f3f46] text-[#f97316]' : 'bg-orange-100 text-[#f97316]'}`}>
                <Icon name={cat.icon} size={32} />
              </div>
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{cat.name}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

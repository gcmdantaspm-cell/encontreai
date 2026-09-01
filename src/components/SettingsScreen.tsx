import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebaseService';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

function Icon({ name, className, size = 24 }: { name: string; className?: string; size?: number }) {
  return <span className={`material-symbols-outlined ${className || ''}`} style={{ fontSize: size }}>{name}</span>;
}

export function SettingsScreen({ user, isDark, toggleDarkMode, show, logout }: any) {
  const navigate = useNavigate();
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    try {
      // Assuming re-authentication is not required for this demo, 
      // otherwise this might fail if the login is too old.
      await deleteDoc(doc(db, 'users', user.id));
      await deleteUser(auth.currentUser);
      logout();
      show('Sua conta foi excluída com sucesso.');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        show('Para excluir sua conta, você precisa sair e fazer login novamente por segurança.');
      } else {
        show('Erro ao excluir conta. Contate o suporte.');
      }
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className={`flex-1 overflow-y-auto h-full flex flex-col relative ${isDark ? 'bg-[#18181b]' : 'bg-[#f8f9fa]'}`}>
      <header className={`p-4 flex items-center gap-3 border-b sticky top-0 z-10 ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
        <button onClick={() => navigate(-1)} className={`p-2 rounded-full active:scale-95 transition-transform ${isDark ? 'hover:bg-[#3f3f46]' : 'hover:bg-gray-100'}`}>
          <Icon name="arrow_back" className={isDark ? 'text-white' : 'text-gray-900'} />
        </button>
        <h1 className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Configurações</h1>
      </header>

      <div className="p-4 flex-1 flex flex-col max-w-2xl mx-auto w-full gap-6">
        
        {/* Conta */}
        <section>
          <h2 className={`font-bold text-sm uppercase tracking-wider mb-3 px-2 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Sua Conta</h2>
          <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
            <button 
              onClick={() => navigate('/perfil')}
              className={`w-full p-4 flex items-center justify-between active:bg-gray-50 dark:active:bg-[#3f3f46] transition-colors border-b ${isDark ? 'border-[#3f3f46]' : 'border-gray-100'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#3f3f46]' : 'bg-gray-100'}`}>
                  <Icon name="person" className={isDark ? 'text-white' : 'text-gray-700'} />
                </div>
                <div className="text-left">
                  <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Editar Perfil</p>
                  <p className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Altere seus dados pessoais e profissionais</p>
                </div>
              </div>
              <Icon name="chevron_right" className={isDark ? 'text-[#a1a1aa]' : 'text-gray-400'} />
            </button>

            {/* Senha - Mock */}
            <button 
              onClick={() => show('Um email para redefinição de senha seria enviado.')}
              className={`w-full p-4 flex items-center justify-between active:bg-gray-50 dark:active:bg-[#3f3f46] transition-colors`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#3f3f46]' : 'bg-gray-100'}`}>
                  <Icon name="lock" className={isDark ? 'text-white' : 'text-gray-700'} />
                </div>
                <div className="text-left">
                  <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Alterar Senha</p>
                  <p className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Envie um link de recuperação</p>
                </div>
              </div>
              <Icon name="chevron_right" className={isDark ? 'text-[#a1a1aa]' : 'text-gray-400'} />
            </button>
          </div>
        </section>

        {/* Preferências */}
        <section>
          <h2 className={`font-bold text-sm uppercase tracking-wider mb-3 px-2 ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Preferências</h2>
          <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-[#e5e7eb]'}`}>
            
            <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-[#3f3f46]' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#3f3f46]' : 'bg-gray-100'}`}>
                  <Icon name="dark_mode" className={isDark ? 'text-white' : 'text-gray-700'} />
                </div>
                <div className="text-left">
                  <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Modo Escuro</p>
                  <p className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Ajuste a aparência do app</p>
                </div>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full relative transition-colors ${isDark ? 'bg-[#f97316]' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-[#3f3f46]' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#3f3f46]' : 'bg-gray-100'}`}>
                  <Icon name="notifications" className={isDark ? 'text-white' : 'text-gray-700'} />
                </div>
                <div className="text-left">
                  <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Notificações Push</p>
                  <p className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Avisos no celular</p>
                </div>
              </div>
              <button 
                onClick={() => setNotifPush(!notifPush)}
                className={`w-12 h-6 rounded-full relative transition-colors ${notifPush ? 'bg-[#f97316]' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notifPush ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className={`p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#3f3f46]' : 'bg-gray-100'}`}>
                  <Icon name="mail" className={isDark ? 'text-white' : 'text-gray-700'} />
                </div>
                <div className="text-left">
                  <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Notificações por Email</p>
                  <p className={`text-xs ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>Receber promoções e resumos</p>
                </div>
              </div>
              <button 
                onClick={() => setNotifEmail(!notifEmail)}
                className={`w-12 h-6 rounded-full relative transition-colors ${notifEmail ? 'bg-[#f97316]' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notifEmail ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

          </div>
        </section>

        {/* Danger Zone */}
        <section className="mt-4">
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className={`w-full p-4 flex items-center justify-between rounded-2xl border active:scale-95 transition-all ${isDark ? 'bg-red-900/20 border-red-900/50 hover:bg-red-900/40' : 'bg-red-50 border-red-100 hover:bg-red-100'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-red-900/50' : 'bg-red-200'}`}>
                <Icon name="delete_forever" className="text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <p className={`font-bold text-sm text-red-600 dark:text-red-400`}>Excluir Conta</p>
                <p className={`text-xs text-red-500 dark:text-red-500/80`}>Essa ação é irreversível</p>
              </div>
            </div>
          </button>
        </section>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-3xl p-6 z-[101] shadow-2xl ${isDark ? 'bg-[#27272a]' : 'bg-white'}`}>
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Icon name="warning" className="text-red-600 dark:text-red-400" size={32} />
            </div>
            <h3 className={`font-black text-xl text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tem certeza?</h3>
            <p className={`text-sm text-center mb-6 leading-relaxed ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>
              Todos os seus dados, mensagens, e histórico de serviços serão apagados permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteAccount}
                className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-transform"
              >
                Sim, Excluir Minha Conta
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className={`w-full py-3.5 font-bold rounded-xl active:scale-95 transition-transform ${isDark ? 'bg-[#3f3f46] text-white' : 'bg-gray-100 text-gray-900'}`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

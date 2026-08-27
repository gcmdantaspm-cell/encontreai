import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

function Icon({ name, className }: { name: string, className?: string }) {
  return <span className={`material-symbols-outlined ${className || ''}`}>{name}</span>;
}

export function GlobalNotifications({ user, isDark }: { user: any, isDark: boolean }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const initialLoadRef = useRef(true);

  // Clear a notification after 5 seconds
  const addNotification = (notif: any) => {
    const id = Date.now().toString() + Math.random().toString();
    const newNotif = { ...notif, id };
    setNotifications(prev => [...prev, newNotif]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  useEffect(() => {
    if (!user?.id) return;

    // Listen to Appointments
    const qApts = query(
      collection(db, 'appointments'),
      where(user.role === 'client' ? 'clientId' : 'professionalId', '==', user.id)
    );

    let isInitialAptLoad = true;
    const unsubApts = onSnapshot(qApts, (snap) => {
      if (isInitialAptLoad) {
        isInitialAptLoad = false;
        return;
      }
      snap.docChanges().forEach(change => {
        if (change.type === 'modified') {
          const data = change.doc.data();
          // Avoid notifying if the user is already on the orders screen
          if (!location.pathname.includes('/pedidos')) {
             if (user.role === 'client' && data.status === 'approved') {
               addNotification({
                 title: 'Agendamento Confirmado!',
                 message: `${data.professionalName} aceitou seu serviço.`,
                 icon: 'check_circle',
                 onClick: () => navigate('/pedidos')
               });
             } else if (user.role === 'client' && data.status === 'completed') {
               addNotification({
                 title: 'Serviço Concluído',
                 message: `Deixe uma avaliação para ${data.professionalName}.`,
                 icon: 'star',
                 onClick: () => navigate('/pedidos')
               });
             } else if (user.role === 'professional' && data.status === 'paid') {
               addNotification({
                 title: 'Novo Pagamento!',
                 message: `O cliente pagou R$ ${data.price.toFixed(2)}. Valor retido seguro.`,
                 icon: 'payments',
                 onClick: () => navigate('/pedidos')
               });
             }
          }
        } else if (change.type === 'added' && user.role === 'professional') {
          if (!location.pathname.includes('/pedidos')) {
             const data = change.doc.data();
             addNotification({
               title: 'Novo Pedido!',
               message: `${data.clientName} agendou um serviço.`,
               icon: 'calendar_month',
               onClick: () => navigate('/agenda') // professional dashboard
             });
          }
        }
      });
    });

    // Listen to Chats
    const qChats = query(
      collection(db, 'chats'),
      where('receiverId', '==', user.id)
    );
    
    let isInitialChatLoad = true;
    const unsubChats = onSnapshot(qChats, (snap) => {
      if (isInitialChatLoad) {
        isInitialChatLoad = false;
        return;
      }
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Check if user is currently in that specific chat
          const isCurrentChat = location.pathname.includes(`/chat/${data.senderId}`);
          if (!isCurrentChat) {
            addNotification({
              title: 'Nova Mensagem',
              message: data.type === 'proposal' ? 'Você recebeu uma nova proposta.' : (data.text.length > 30 ? data.text.substring(0, 30) + '...' : data.text),
              icon: 'chat',
              onClick: () => navigate(`/chat/${data.senderId}`)
            });
          }
        } else if (change.type === 'modified') {
          const data = change.doc.data();
          const isCurrentChat = location.pathname.includes(`/chat/${data.senderId}`);
          if (!isCurrentChat && data.type === 'proposal' && data.proposal) {
            if (data.proposal.status === 'accepted') {
              addNotification({
                title: 'Proposta Aceita',
                message: 'Um acordo foi fechado no chat!',
                icon: 'handshake',
                onClick: () => navigate(`/chat/${data.senderId}`)
              });
            } else if (data.proposal.status === 'paid') {
              addNotification({
                title: 'Proposta Paga!',
                message: 'O valor da proposta foi retido e garantido.',
                icon: 'verified_user',
                onClick: () => navigate(`/chat/${data.senderId}`)
              });
            }
          }
        }
      });
    });

    return () => {
      unsubApts();
      unsubChats();
    };
  }, [user?.id, user?.role, location.pathname, navigate]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            onClick={() => { n.onClick(); setNotifications(prev => prev.filter(x => x.id !== n.id)); }}
            className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 pointer-events-auto cursor-pointer active:scale-95 transition-transform ${isDark ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-gray-200'}`}
          >
            <div className="w-10 h-10 rounded-full bg-[#f97316] flex items-center justify-center text-white shrink-0">
              <Icon name={n.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{n.title}</h4>
              <p className={`text-xs truncate ${isDark ? 'text-[#a1a1aa]' : 'text-gray-500'}`}>{n.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

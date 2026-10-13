import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'atualizacao' | 'inclusao' | 'correcao';
  timestamp: number;
  read: boolean;
  readAt?: number;
}

const STORAGE_KEY = 'portal_mece_notifications_v1';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Notification[] = JSON.parse(saved);
        const now = Date.now();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        // Filter out read notifications older than 3 days
        return parsed.filter(n => {
          if (n.read && n.readAt && now - n.readAt > threeDaysMs) {
            return false;
          }
          return true;
        });
      }
    } catch (e) {
      console.error("Error loading notifications", e);
    }

    // Default initial notifications if none exist
    return [
      {
        id: 'notif-1',
        title: 'Inclusão: Santos',
        message: 'História e imagem de Nossa Senhora Aparecida incluídas.',
        type: 'inclusao',
        timestamp: Date.now() - 3600000 * 2,
        read: false
      },
      {
        id: 'notif-2',
        title: 'Correção: Erro de escrita',
        message: 'Corrigido erro de esgotamento de recursos no Firestore.',
        type: 'correcao',
        timestamp: Date.now() - 3600000 * 5,
        read: false
      },
      {
        id: 'notif-3',
        title: 'Atualização: Vagas',
        message: 'Otimização dos contadores de vagas por paróquia.',
        type: 'atualizacao',
        timestamp: Date.now() - 3600000 * 24,
        read: false
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error("Error saving notifications", e);
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggle = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && unreadCount > 0) {
      // Mark all as read and record readAt timestamp
      const now = Date.now();
      setNotifications(prev =>
        prev.map(n => (n.read ? n : { ...n, read: true, readAt: now }))
      );
    }
  };

  const getTypeBadge = (type: Notification['type']) => {
    switch (type) {
      case 'inclusao':
        return <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full">Inclusão</span>;
      case 'correcao':
        return <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 rounded-full">Correção</span>;
      case 'atualizacao':
      default:
        return <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 rounded-full">Atualização</span>;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all shadow-xs flex items-center justify-center cursor-pointer"
        title="Notificações e Atualizações"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Atualizações e Avisos
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhuma notificação no momento.
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      {notif.title}
                    </span>
                    {getTypeBadge(notif.type)}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">
                    {new Date(notif.timestamp).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-slate-50/50 border-t border-slate-100 text-center text-[10px] text-slate-400">
            Mensagens lidas são apagadas automaticamente após 3 dias.
          </div>
        </div>
      )}
    </div>
  );
};
